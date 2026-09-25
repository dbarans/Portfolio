// Grave pages: the hub's dark hall and three live canvas sketches (vision cone, seeded dungeon,
// A* chase) shown until game footage is added. Each sketch is a toy-scale version of the idea
// behind the real system, not code from the game. Light is drawn per cell in three steps with
// hard shadows, so nothing here needs gradients or blur.
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = window.matchMedia('(hover: hover)');
  const DEG = Math.PI / 180;
  const SQRT2 = Math.SQRT2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isPl = () => document.documentElement.lang === 'pl';

  const BG = '#0b0c0e';
  const AMBER = '#ffb85c';

  // Light levels 0 (dark) .. 3 (next to the light), per kind of cell.
  const SIGHT = {
    floor: ['#0f1012', '#2a2b30', '#3b3d43', '#50535a'],
    floorAlt: ['#101113', '#2d2e33', '#3f4147', '#54575e'],
    wall: ['#17181b', '#55585f', '#6d7078', '#8b8e96'],
  };
  const TORCH = {
    floor: ['#0f1012', '#382f24', '#4f412f', '#6a563c'],
    floorAlt: ['#101113', '#3b3226', '#534432', '#6e5a3f'],
    wall: ['#17181b', '#5e4f3c', '#7a674e', '#9a8264'],
  };
  const HALL = {
    floor: ['#0d0e10', '#161513', '#1e1b17', '#27221b'],
    floorAlt: ['#0e0f11', '#181714', '#201d18', '#29241d'],
    wall: ['#15161a', '#2a2622', '#37312a', '#463d33'],
    slab: ['#101114', '#151412', '#1b1915', '#221f19'],
  };

  const L = {
    en: {
      rays: (b, r) => `rays: ${b} + ${r} at shadow edges`,
      look: 'looking · 100°, range 15',
      torch: 'torch · 130°, range 20',
      aim: 'aiming · pistol 25°',
      seed: (s) => `seed “${s}”`,
      same: 'same seed → identical layout',
      stages: ['placing rooms', 'graph: MST + loops', 'carving', 'room roles'],
      visited: (n) => `visited cells: ${n} · budget 4,000`,
      rejected: 'target unreachable → rejected in O(1) · retry in 0.75 s',
      refresh: 'barrels destroyed → grid area refreshed',
      caught: 'caught',
    },
    pl: {
      rays: (b, r) => `promienie: ${b} + ${r} przy krawędziach cieni`,
      look: 'rozglądanie · 100°, zasięg 15',
      torch: 'pochodnia · 130°, zasięg 20',
      aim: 'celowanie · pistolet 25°',
      seed: (s) => `ziarno „${s}”`,
      same: 'to samo ziarno → identyczny loch',
      stages: ['rozmieszczanie pokoi', 'graf: MST + pętle', 'wycinanie', 'role pokoi'],
      visited: (n) => `odwiedzone komórki: ${n} · budżet 4 000`,
      rejected: 'cel nieosiągalny → odrzucony w O(1) · ponowienie za 0,75 s',
      refresh: 'beczki zniszczone → odświeżony fragment siatki',
      caught: 'złapany',
    },
  };
  const t = () => (isPl() ? L.pl : L.en);

  // ---------- Deterministic random: xorshift128 seeded with FNV-1a, as in the game ----------
  function fnv1a(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h = Math.imul(h ^ (c & 0xff), 16777619) >>> 0;
      h = Math.imul(h ^ (c >>> 8), 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function Rng(seed) {
    this.seed = seed;
    const h = fnv1a(seed);
    this.x = h || 0x9e3779b9;
    this.y = (this.x ^ 0x85ebca6b) >>> 0;
    this.z = (this.x ^ 0xc2b2ae35) >>> 0;
    this.w = (this.x ^ 0x27d4eb2f) >>> 0;
    for (let i = 0; i < 8; i++) this.next();
  }
  Rng.prototype.next = function () {
    const s = (this.x ^ (this.x << 11)) >>> 0;
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    this.w = (this.w ^ (this.w >>> 19) ^ s ^ (s >>> 8)) >>> 0;
    return this.w;
  };
  Rng.prototype.float = function () { return (this.next() >>> 8) / 16777216; };
  Rng.prototype.range = function (a, b) { return b <= a ? a : a + Math.floor(this.float() * (b - a)); };
  // A separate stream per stage, so one stage drawing more numbers can't shift the others.
  Rng.prototype.derive = function (salt) { return new Rng(this.seed + '::' + salt); };

  // Position-stable per-cell hash for tile variants.
  function cellHash(x, y) {
    let h = Math.imul(2166136261 ^ x, 16777619) >>> 0;
    h = Math.imul(h ^ y, 16777619) >>> 0;
    h ^= h >>> 15;
    h = Math.imul(h, 0x2545f491) >>> 0;
    return (h ^ (h >>> 13)) >>> 0;
  }

  // ---------- Dungeon: rooms, MST + loops, corridors, roles, interiors ----------
  function placeRooms(cols, rows, o, rng) {
    const rooms = [];
    for (let tries = 0; tries < o.rooms * 40 && rooms.length < o.rooms; tries++) {
      const w = rng.range(o.minW, o.maxW + 1);
      const h = rng.range(o.minH, o.maxH + 1);
      if (cols - w - 1 <= 1 || rows - h - 1 <= 1) continue;
      const x = rng.range(1, cols - w - 1);
      const y = rng.range(1, rows - h - 1);
      // Rejection sampling with a margin of solid rock, which keeps corridors readable.
      const m = o.margin;
      let free = true;
      for (const r of rooms) {
        if (x - m < r.x + r.w && x + w + m > r.x && y - m < r.y + r.h && y + h + m > r.y) { free = false; break; }
      }
      if (free) rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    return rooms;
  }

  function connectRooms(rooms, loopCount) {
    const edges = [];
    for (let a = 0; a < rooms.length; a++) {
      for (let b = a + 1; b < rooms.length; b++) {
        edges.push({ a, b, d: Math.abs(rooms[a].cx - rooms[b].cx) + Math.abs(rooms[a].cy - rooms[b].cy) });
      }
    }
    // Ties broken by room index, so the order never depends on the sort implementation.
    edges.sort((p, q) => p.d - q.d || p.a - q.a || p.b - q.b);
    const parent = rooms.map((_, i) => i);
    const find = (i) => {
      while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
      return i;
    };
    const mst = [];
    const rejected = [];
    for (const e of edges) {
      const ra = find(e.a), rb = find(e.b);
      if (ra !== rb) { parent[ra] = rb; mst.push(e); } else rejected.push(e);
    }
    // Loops from the shortest rejected edges: a chase can go round instead of dead-ending.
    const loops = rejected.slice(0, loopCount);
    return { mst, loops, all: mst.concat(loops) };
  }

  function lPath(x0, y0, x1, y1, horizontalFirst) {
    const cells = [];
    let x = x0, y = y0;
    const stepX = () => { while (x !== x1) { x += Math.sign(x1 - x); cells.push(x, y); } };
    const stepY = () => { while (y !== y1) { y += Math.sign(y1 - y); cells.push(x, y); } };
    if (horizontalFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
    return cells;
  }

  function bfsDepth(adj, from) {
    const depth = adj.map(() => -1);
    const queue = [from];
    depth[from] = 0;
    for (let q = 0; q < queue.length; q++) {
      for (const n of adj[queue[q]]) {
        if (depth[n] < 0) { depth[n] = depth[queue[q]] + 1; queue.push(n); }
      }
    }
    return depth;
  }

  function assignRoles(rooms, edges, cols, rows, hubAt) {
    const adj = rooms.map(() => []);
    edges.forEach((e) => { adj[e.a].push(e.b); adj[e.b].push(e.a); });
    const hx = hubAt[0] * cols, hy = hubAt[1] * rows;
    const d2 = (r) => (r.cx - hx) * (r.cx - hx) + (r.cy - hy) * (r.cy - hy);
    let hub = 0;
    rooms.forEach((r, i) => { if (d2(r) < d2(rooms[hub])) hub = i; });
    const fromHub = bfsDepth(adj, hub);
    let exit = hub;
    fromHub.forEach((d, i) => { if (d > fromHub[exit]) exit = i; });
    const fromExit = bfsDepth(adj, exit);
    let key = -1, keyScore = -1;
    rooms.forEach((_, i) => {
      if (i === hub || i === exit) return;
      const score = Math.min(fromHub[i], fromExit[i]);
      if (score > keyScore) { keyScore = score; key = i; }
    });
    const roles = rooms.map(() => null);
    roles[hub] = 'hub';
    roles[exit] = 'exit';
    if (key >= 0) roles[key] = 'key';
    let treasures = 0;
    rooms.forEach((_, i) => {
      if (!roles[i] && adj[i].length === 1 && treasures < 2) { roles[i] = 'treasure'; treasures++; }
    });
    return roles;
  }

  function generateDungeon(seed, cols, rows, opt) {
    const o = Object.assign({ minW: 5, maxW: 11, minH: 4, maxH: 8, rooms: 14, margin: 2, loops: 2, hubAt: [0.5, 0.5] }, opt);
    const root = new Rng(seed);
    let best = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      // Generate and check: a failed attempt retries on its own stream.
      const d = buildDungeon(cols, rows, o, attempt ? root.derive('attempt-' + attempt) : root);
      d.seed = seed;
      if (d.ok) return d;
      if (!best || d.rooms.length > best.rooms.length) best = d;
    }
    return best; // the best attempt instead of an error
  }

  function buildDungeon(cols, rows, o, rng) {
    const rooms = placeRooms(cols, rows, o, rng.derive('rooms'));
    const links = connectRooms(rooms, o.loops);
    const solid = new Uint8Array(cols * rows).fill(1);
    const carve = (x, y) => {
      if (x > 0 && y > 0 && x < cols - 1 && y < rows - 1) solid[y * cols + x] = 0;
    };
    rooms.forEach((r) => {
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y);
    });
    const cr = rng.derive('corridors');
    const path = [];
    links.all.forEach((e) => {
      const a = rooms[e.a], b = rooms[e.b];
      const cells = lPath(a.cx, a.cy, b.cx, b.cy, cr.float() < 0.5);
      for (let i = 0; i < cells.length; i += 2) { carve(cells[i], cells[i + 1]); path.push(cells[i], cells[i + 1]); }
    });
    const roles = rooms.length ? assignRoles(rooms, links.all, cols, rows, o.hubAt) : [];

    // Interiors: pillars on a spaced lattice, each with a free ring, so a room never splits.
    // The hub stays empty and legible.
    const ir = rng.derive('interiors');
    const pillars = [];
    rooms.forEach((r, i) => {
      if (roles[i] === 'hub' || r.w < 7 || r.h < 6) return;
      for (let py = r.y + 2; py < r.y + r.h - 2; py += 3) {
        for (let px = r.x + 2; px < r.x + r.w - 2; px += 3) {
          if (ir.float() < 0.45) { solid[py * cols + px] = 1; pillars.push(px, py); }
        }
      }
    });

    const walls = [];
    let floorCount = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (!solid[i]) { floorCount++; continue; }
        let edge = false;
        for (let dy = -1; dy <= 1 && !edge; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !solid[ny * cols + nx]) { edge = true; break; }
          }
        }
        if (edge) walls.push(x, y);
      }
    }

    let ok = rooms.length >= 5;
    if (ok) {
      const hub = rooms[roles.indexOf('hub')];
      const seen = new Uint8Array(cols * rows);
      const queue = [hub.cy * cols + hub.cx];
      seen[queue[0]] = 1;
      for (let q = 0; q < queue.length; q++) {
        const c = queue[q], x = c % cols, y = (c / cols) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const n = (y + dy) * cols + x + dx;
          if (!solid[n] && !seen[n]) { seen[n] = 1; queue.push(n); }
        });
      }
      ok = queue.length === floorCount;
    }
    return { cols, rows, solid, rooms, mst: links.mst, loops: links.loops, path, roles, pillars, walls, ok };
  }

  // ---------- Visibility: a fan of grid raycasts ----------
  function castRay(solid, cols, rows, ox, oy, dx, dy, max) {
    let cx = Math.floor(ox), cy = Math.floor(oy);
    const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
    const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tdy = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    let tx = dx !== 0 ? (dx > 0 ? cx + 1 - ox : ox - cx) * tdx : Infinity;
    let ty = dy !== 0 ? (dy > 0 ? cy + 1 - oy : oy - cy) * tdy : Infinity;
    let dist = 0;
    while (dist < max) {
      if (tx < ty) { dist = tx; tx += tdx; cx += sx; } else { dist = ty; ty += tdy; cy += sy; }
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows || solid[cy * cols + cx]) return Math.min(dist, max);
    }
    return max;
  }

  // Dense rays inside the cone (1 per degree), sparse and short ones around the player (0.25 per
  // degree), and 4 bisection steps wherever neighbouring cone rays disagree — a shadow edge.
  function visibility(grid, ox, oy, aim, fovDeg, range, near) {
    const { solid, cols, rows } = grid;
    const cast = (a, max) => castRay(solid, cols, rows, ox, oy, Math.cos(a), Math.sin(a), max);
    const half = (fovDeg * DEG) / 2;
    const pts = [];
    let base = 0, refined = 0;
    const inCone = Math.max(2, Math.round(fovDeg));
    let prev = null;
    for (let i = 0; i <= inCone; i++) {
      const a = aim - half + (2 * half * i) / inCone;
      const d = cast(a, range);
      base++;
      if (prev && Math.abs(d - prev.d) > 0.75) {
        let lo = prev, hi = { a, d };
        for (let k = 0; k < 4; k++) {
          const ma = (lo.a + hi.a) / 2;
          const md = cast(ma, range);
          refined++;
          if (Math.abs(md - lo.d) < Math.abs(md - hi.d)) lo = { a: ma, d: md }; else hi = { a: ma, d: md };
        }
        pts.push(lo, hi);
      }
      pts.push({ a, d });
      prev = { a, d };
    }
    const outside = Math.max(4, Math.round((360 - fovDeg) * 0.25));
    for (let i = 1; i < outside; i++) {
      const a = aim + half + ((2 * Math.PI - 2 * half) * i) / outside;
      pts.push({ a, d: cast(a, near) });
      base++;
    }
    return { pts, base, refined };
  }

  function polygonPath(g, vis, ox, oy, s, offX, offY) {
    g.beginPath();
    vis.pts.forEach((p, i) => {
      const x = offX + (ox + Math.cos(p.a) * p.d) * s;
      const y = offY + (oy + Math.sin(p.a) * p.d) * s;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    });
    g.closePath();
  }

  // A disc made of whole cells: one rectangle per row, so light falls off in cell steps.
  function steppedDisc(g, ox, oy, r, s, offX, offY, rows) {
    g.beginPath();
    const y0 = Math.max(0, Math.floor(oy - r)), y1 = Math.min(rows - 1, Math.ceil(oy + r));
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - oy;
      if (Math.abs(dy) > r) continue;
      const hw = Math.sqrt(r * r - dy * dy);
      const xa = Math.ceil(ox - hw - 0.5), xb = Math.floor(ox + hw - 0.5);
      if (xb >= xa) g.rect(offX + xa * s, offY + y * s, (xb - xa + 1) * s, s);
    }
  }

  // ---------- A*: 8 directions, no corner cutting, version stamps, regions, node budget ----------
  function Pathfinder(grid) {
    const n = grid.cols * grid.rows;
    this.grid = grid;
    this.stamp = new Uint32Array(n);
    this.closed = new Uint32Array(n);
    this.g = new Float32Array(n);
    this.parent = new Int32Array(n);
    this.region = new Int32Array(n);
    this.heapF = [];
    this.heapI = [];
    this.searchId = 0;
    this.explored = 0;
    this.refreshRegions();
  }

  // 4-directional flood fill, matching the no-corner-cutting rule: two areas touching only
  // at a corner are not connected.
  Pathfinder.prototype.refreshRegions = function () {
    const { cols, rows, solid } = this.grid;
    const region = this.region;
    region.fill(-1);
    let id = 0;
    const queue = new Int32Array(cols * rows);
    for (let start = 0; start < cols * rows; start++) {
      if (solid[start] || region[start] >= 0) continue;
      let head = 0, tail = 0;
      queue[tail++] = start;
      region[start] = id;
      while (head < tail) {
        const c = queue[head++], x = c % cols, y = (c / cols) | 0;
        if (x > 0 && !solid[c - 1] && region[c - 1] < 0) { region[c - 1] = id; queue[tail++] = c - 1; }
        if (x < cols - 1 && !solid[c + 1] && region[c + 1] < 0) { region[c + 1] = id; queue[tail++] = c + 1; }
        if (y > 0 && !solid[c - cols] && region[c - cols] < 0) { region[c - cols] = id; queue[tail++] = c - cols; }
        if (y < rows - 1 && !solid[c + cols] && region[c + cols] < 0) { region[c + cols] = id; queue[tail++] = c + cols; }
      }
      id++;
    }
  };

  Pathfinder.prototype.push = function (f, i) {
    const F = this.heapF, I = this.heapI;
    let k = F.length;
    F.push(f); I.push(i);
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (F[p] <= f) break;
      F[k] = F[p]; I[k] = I[p]; k = p;
    }
    F[k] = f; I[k] = i;
  };

  Pathfinder.prototype.pop = function () {
    const F = this.heapF, I = this.heapI;
    const top = I[0];
    const lf = F.pop(), li = I.pop();
    const n = F.length;
    if (n) {
      let k = 0;
      for (;;) {
        let c = 2 * k + 1;
        if (c >= n) break;
        if (c + 1 < n && F[c + 1] < F[c]) c++;
        if (F[c] >= lf) break;
        F[k] = F[c]; I[k] = I[c]; k = c;
      }
      F[k] = lf; I[k] = li;
    }
    return top;
  };

  // Returns { path: [cell, ...] } or { rejected: true } when the regions differ.
  Pathfinder.prototype.find = function (start, target, budget) {
    const { cols, solid } = this.grid;
    this.explored = 0;
    if (solid[start] || solid[target]) return { rejected: true };
    if (this.region[start] !== this.region[target]) return { rejected: true };
    const id = ++this.searchId;
    const { stamp, closed, g, parent } = this;
    const tx = target % cols, ty = (target / cols) | 0;
    const h = (x, y) => {
      const dx = Math.abs(x - tx), dy = Math.abs(y - ty);
      return (dx + dy + (SQRT2 - 2) * Math.min(dx, dy)) * 1.001; // octile, tie-broken
    };
    this.heapF.length = 0;
    this.heapI.length = 0;
    stamp[start] = id; g[start] = 0; parent[start] = -1;
    let best = start, bestH = h(start % cols, (start / cols) | 0);
    this.push(bestH, start);
    let found = false;
    while (this.heapI.length) {
      const cur = this.pop();
      if (closed[cur] === id) continue; // stale duplicate (lazy deletion)
      closed[cur] = id;
      if (cur === target) { found = true; break; }
      if (++this.explored >= budget) break;
      const x = cur % cols, y = (cur / cols) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= this.grid.rows) continue;
          const next = ny * cols + nx;
          if (solid[next]) continue;
          const diagonal = dx && dy;
          if (diagonal && (solid[y * cols + nx] || solid[ny * cols + x])) continue;
          if (stamp[next] === id && closed[next] === id) continue;
          const tg = g[cur] + (diagonal ? SQRT2 : 1);
          if (stamp[next] === id && tg >= g[next]) continue;
          stamp[next] = id; g[next] = tg; parent[next] = cur;
          const hh = h(nx, ny);
          if (hh < bestH) { bestH = hh; best = next; }
          this.push(tg + hh, next);
        }
      }
    }
    // Out of budget: the route to whatever came closest, so the agent keeps moving.
    let end = found ? target : best;
    const path = [];
    while (end >= 0) { path.push(end); end = parent[end]; }
    path.reverse();
    return { path, found };
  };

  // ---------- Drawing helpers ----------
  function fitGrid(w, h, cols, rows) {
    const s = Math.min(w / cols, h / rows);
    return { s, ox: (w - cols * s) / 2, oy: (h - rows * s) / 2, w, h };
  }

  function drawSkull(g, x, y, r, level) {
    const bone = ['#3a3833', '#8d887c', '#b9b3a4', '#e2dccd'][level];
    g.fillStyle = bone;
    g.beginPath();
    g.arc(x, y - r * 0.12, r * 0.78, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x - r * 0.42, y + r * 0.35, r * 0.84, r * 0.5);
    g.fillStyle = '#0b0c0e';
    g.fillRect(x - r * 0.45, y - r * 0.3, r * 0.32, r * 0.34);
    g.fillRect(x + r * 0.13, y - r * 0.3, r * 0.32, r * 0.34);
    g.fillRect(x - r * 0.08, y + r * 0.45, r * 0.16, r * 0.3);
  }

  // Static cells drawn once per light level, one pixel per cell; frames only scale them up.
  function levelLayers(solid, cols, rows, pal) {
    return [0, 1, 2, 3].map((level) => {
      const c = document.createElement('canvas');
      c.width = cols;
      c.height = rows;
      const lg = c.getContext('2d');
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const set = solid[y * cols + x] ? pal.wall : (cellHash(x, y) & 1 ? pal.floorAlt : pal.floor);
          lg.fillStyle = set[level];
          lg.fillRect(x, y, 1, 1);
        }
      }
      return c;
    });
  }

  // The cone's light: level 1 over the whole visible area, then stepped discs for 2 and 3.
  // Leaves the visibility clip in place, so the caller can draw what only the light reveals
  // and then restores it.
  function drawLight(g, layers, vis, ox, oy, range, s, offX, offY, rows, extra) {
    const blit = (level) => {
      g.drawImage(layers[level], offX, offY, layers[level].width * s, layers[level].height * s);
      if (extra) extra(level);
    };
    g.imageSmoothingEnabled = false;
    blit(0);
    g.save();
    polygonPath(g, vis, ox, oy, s, offX, offY);
    g.clip();
    [1, 2, 3].forEach((level) => {
      g.save();
      steppedDisc(g, ox, oy, (range * (4 - level)) / 3, s, offX, offY, rows);
      g.clip();
      blit(level);
      g.restore();
    });
  }

  function setHud(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }

  // ---------- Sketch: vision cone ----------
  function fovSketch(canvas, hud, pointerHost) {
    const cols = 40, rows = 24;
    const solid = new Uint8Array(cols * rows);
    const put = (x, y) => { solid[y * cols + x] = 1; };
    for (let x = 0; x < cols; x++) { put(x, 0); put(x, rows - 1); }
    for (let y = 0; y < rows; y++) { put(0, y); put(cols - 1, y); }
    [[8, 4], [18, 5], [30, 4], [8, 17], [19, 16], [30, 17], [25, 9]].forEach(([x, y]) => {
      put(x, y); put(x + 1, y); put(x, y + 1); put(x + 1, y + 1);
    });
    for (let y = 1; y < 6; y++) put(13, y);
    const grid = { solid, cols, rows };
    const layers = { look: levelLayers(solid, cols, rows, SIGHT), torch: levelLayers(solid, cols, rows, TORCH) };
    const enemy = { x: 23.2, y: 6.2 };
    const g = canvas.getContext('2d');
    let pointer = null;

    if (pointerHost && canHover.matches) {
      pointerHost.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      });
      pointerHost.addEventListener('pointerleave', () => { pointer = null; });
    }

    return function draw(time, W, H) {
      const f = fitGrid(W, H, cols, rows);
      const cycle = time % 15;
      const phase = cycle < 6 ? 'look' : cycle < 11 ? 'torch' : 'aim';
      const px = 6.5 + ((Math.sin(time * 0.35) + 1) / 2) * 22, py = 11.5;
      let aim;
      const toEnemy = Math.atan2(enemy.y - py, enemy.x - px);
      if (pointer) aim = Math.atan2((pointer.y - f.oy) / f.s - py, (pointer.x - f.ox) / f.s - px);
      else if (phase === 'aim') aim = toEnemy + Math.sin(time * 0.9) * 0.12;
      else aim = toEnemy + Math.sin(time * 0.55) * 1.05;
      const fov = phase === 'torch' ? 130 : phase === 'aim' ? 25 : 100;
      const range = phase === 'torch' ? 20 : 15;
      const vis = visibility(grid, px, py, aim, fov, range, 1.6);

      g.fillStyle = BG;
      g.fillRect(0, 0, W, H);
      drawLight(g, phase === 'torch' ? layers.torch : layers.look, vis, px, py, range, f.s, f.ox, f.oy, rows);
      // The enemy is drawn only through the visibility mask: outside it, it simply isn't seen.
      const de = Math.hypot(enemy.x - px, enemy.y - py);
      drawSkull(g, f.ox + enemy.x * f.s, f.oy + enemy.y * f.s, f.s * 0.95, de < range / 3 ? 3 : de < (2 * range) / 3 ? 2 : 1);
      g.restore();

      if (hud) {
        g.strokeStyle = 'rgba(255,184,92,0.07)';
        g.lineWidth = 1;
        g.beginPath();
        vis.pts.forEach((p) => {
          g.moveTo(f.ox + px * f.s, f.oy + py * f.s);
          g.lineTo(f.ox + (px + Math.cos(p.a) * p.d) * f.s, f.oy + (py + Math.sin(p.a) * p.d) * f.s);
        });
        g.stroke();
      }

      const ps = f.s * 0.9;
      g.fillStyle = phase === 'torch' ? AMBER : '#d8d6cf';
      g.fillRect(f.ox + px * f.s - ps / 2, f.oy + py * f.s - ps / 2, ps, ps);

      if (hud) setHud(hud, t()[phase] + ' · ' + t().rays(vis.base, vis.refined));
    };
  }

  // ---------- Sketch: seeded dungeon ----------
  const ROLE = { hub: '#5b8fd6', treasure: '#c262b4', exit: '#58b56f', key: AMBER };
  const SEEDS = ['grave', 'crypt-42', 'grave', 'ossuary-7', 'crypt-42'];
  const STAGE_T = [1.2, 1.0, 1.2, 2.3];

  function dungeonSketch(canvas, hud) {
    const g = canvas.getContext('2d');
    const cache = new Map();
    let cacheKey = '';
    let lastFrame = '';

    function get(seed, cols, rows) {
      const key = cols + 'x' + rows;
      if (key !== cacheKey) { cache.clear(); cacheKey = key; }
      if (!cache.has(seed)) {
        const d = generateDungeon(seed, cols, rows, { rooms: Math.round((cols * rows) / 150) });
        // Walls and pillars of the finished layout, one pixel per cell.
        d.wallLayer = document.createElement('canvas');
        d.wallLayer.width = cols;
        d.wallLayer.height = rows;
        const wg = d.wallLayer.getContext('2d');
        wg.fillStyle = '#44464d';
        for (let i = 0; i < d.walls.length; i += 2) wg.fillRect(d.walls[i], d.walls[i + 1], 1, 1);
        wg.fillStyle = '#5d6067';
        for (let i = 0; i < d.pillars.length; i += 2) wg.fillRect(d.pillars[i], d.pillars[i + 1], 1, 1);
        cache.set(seed, d);
      }
      return cache.get(seed);
    }

    return function draw(time, W, H, still, dt, force) {
      const cols = 64, rows = Math.max(30, Math.round((64 * H) / W));
      const total = STAGE_T.reduce((a, b) => a + b, 0);
      const k = still ? 0 : Math.floor(time / total) % SEEDS.length;
      let local = still ? total - 0.01 : time % total;
      let stage = 0;
      while (stage < 3 && local >= STAGE_T[stage]) { local -= STAGE_T[stage]; stage++; }
      const u = clamp(local / STAGE_T[stage], 0, 1);
      const seed = SEEDS[k];
      const d = get(seed, cols, rows);
      const f = fitGrid(W, H, cols, rows);
      const s = f.s, X = (x) => f.ox + x * s, Y = (y) => f.oy + y * s;
      const edges = d.mst.concat(d.loops);
      const cells = d.path.length / 2;
      const shownRooms = stage === 0 ? Math.ceil(u * d.rooms.length) : d.rooms.length;
      const shownEdges = stage === 1 ? Math.ceil(u * edges.length) : edges.length;
      const shownCells = stage === 2 ? Math.floor(u * cells) : cells;
      // Fades move in eighths, so most frames are identical and can be skipped.
      const fade = stage === 2 ? Math.round((1 - u) * 8) / 8 : 1;
      const reveal = Math.round(clamp(u * 3, 0, 1) * 8) / 8;
      const frame = [W, H, k, stage, shownRooms, shownEdges, shownCells, fade, stage === 3 ? reveal : 0, isPl()].join('|');
      if (frame === lastFrame && !force) return;
      lastFrame = frame;

      g.fillStyle = BG;
      g.fillRect(0, 0, W, H);

      if (stage >= 2) {
        g.fillStyle = '#26272c';
        d.rooms.forEach((r) => g.fillRect(X(r.x), Y(r.y), r.w * s, r.h * s));
        for (let i = 0; i < shownCells; i++) g.fillRect(X(d.path[2 * i]), Y(d.path[2 * i + 1]), Math.ceil(s), Math.ceil(s));
      }
      if (stage === 3) {
        g.imageSmoothingEnabled = false;
        g.drawImage(d.wallLayer, f.ox, f.oy, cols * s, rows * s);
        d.rooms.forEach((r, i) => {
          const role = d.roles[i];
          if (!role) return;
          g.globalAlpha = 0.22 * reveal;
          g.fillStyle = ROLE[role];
          g.fillRect(X(r.x), Y(r.y), r.w * s, r.h * s);
          g.globalAlpha = reveal;
          g.strokeStyle = ROLE[role];
          g.lineWidth = Math.max(1, s * 0.25);
          g.strokeRect(X(r.x) + 0.5, Y(r.y) + 0.5, r.w * s - 1, r.h * s - 1);
          g.fillRect(X(r.cx) - s * 0.2, Y(r.cy) - s * 0.2, s * 1.4, s * 1.4);
          g.globalAlpha = 1;
        });
      }
      if (stage <= 2) {
        g.strokeStyle = stage === 2 ? '#3a3c42' : '#8e8c86';
        g.lineWidth = 1;
        for (let i = 0; i < shownRooms; i++) {
          const r = d.rooms[i];
          g.strokeRect(X(r.x) + 0.5, Y(r.y) + 0.5, r.w * s - 1, r.h * s - 1);
        }
      }
      if (stage === 1 || stage === 2) {
        g.globalAlpha = fade;
        for (let i = 0; i < shownEdges; i++) {
          const e = edges[i], a = d.rooms[e.a], b = d.rooms[e.b];
          const loop = i >= d.mst.length;
          g.strokeStyle = loop ? AMBER : '#b5b3ac';
          g.lineWidth = loop ? 1.5 : 1;
          g.setLineDash(loop ? [4, 4] : []);
          g.beginPath();
          g.moveTo(X(a.cx + 0.5), Y(a.cy + 0.5));
          g.lineTo(X(b.cx + 0.5), Y(b.cy + 0.5));
          g.stroke();
        }
        g.setLineDash([]);
        g.globalAlpha = 1;
      }

      if (hud) {
        const repeat = SEEDS.indexOf(seed) < k;
        setHud(hud, t().seed(seed) + ' · ' + (repeat && stage === 3 ? t().same : t().stages[stage]));
      }
    };
  }

  // ---------- Sketch: A* chase ----------
  function astarSketch(canvas, hud) {
    const cols = 36, rows = 22;
    const solid = new Uint8Array(cols * rows);
    const put = (x, y, v) => { solid[y * cols + x] = v === undefined ? 1 : v; };
    for (let x = 0; x < cols; x++) { put(x, 0); put(x, rows - 1); }
    for (let y = 0; y < rows; y++) { put(0, y); put(cols - 1, y); }
    for (let y = 9; y <= 12; y++) for (let x = 15; x <= 19; x++) put(x, y);
    [[4, 4], [4, 15], [21, 2], [11, 17], [30, 14]].forEach(([x, y]) => {
      put(x, y); put(x + 1, y); put(x, y + 1); put(x + 1, y + 1);
    });
    for (let y = 1; y < rows - 1; y++) put(27, y);
    const barrels = [[27, 10], [27, 11]];
    // Walls and floor never change (barrels are drawn on top), so they are drawn once.
    const base = document.createElement('canvas');
    base.width = cols;
    base.height = rows;
    const bg = base.getContext('2d');
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const barrel = barrels.some(([bx, by]) => bx === x && by === y);
        bg.fillStyle = solid[y * cols + x] && !barrel ? '#44464d' : (x + y) & 1 ? '#15161a' : '#17181c';
        bg.fillRect(x, y, 1, 1);
      }
    }
    const grid = { solid, cols, rows };
    const pf = new Pathfinder(grid);
    const g = canvas.getContext('2d');

    let st;
    function reset() {
      barrels.forEach(([x, y]) => put(x, y, 1));
      pf.refreshRegions();
      st = { clock: 0, ex: 31.5, ey: 4.5, path: [], nextPlan: 0, rejected: false, broken: false, event: '', eventUntil: 0, visited: 0, caughtAt: -1 };
    }
    reset();

    function step(dt, time) {
      st.clock += dt;
      const a = time * 0.62;
      const px = 17.5 + Math.cos(a) * 8.2, py = 11 + Math.sin(a) * 6.6;
      if (!st.broken && st.clock > 4) {
        // A destroyed barrel: re-sample just those cells and recompute the regions.
        barrels.forEach(([x, y]) => put(x, y, 0));
        pf.refreshRegions();
        st.broken = true;
        st.event = 'refresh';
        st.eventUntil = st.clock + 1.8;
        st.nextPlan = st.clock;
      }
      if (st.caughtAt < 0 && st.clock >= st.nextPlan) {
        const start = Math.floor(st.ey) * cols + Math.floor(st.ex);
        const target = Math.floor(py) * cols + Math.floor(px);
        const res = pf.find(start, target, 4000);
        if (res.rejected) {
          st.path = [];
          st.rejected = true;
          st.visited = 0;
          st.nextPlan = st.clock + 0.75; // longer cooldown after a failure
        } else {
          st.path = res.path;
          st.rejected = false;
          st.visited = pf.explored;
          st.nextPlan = st.clock + 0.25;
        }
      }
      if (st.caughtAt < 0 && st.path.length > 1) {
        const next = st.path[1];
        const tx = (next % cols) + 0.5, ty = ((next / cols) | 0) + 0.5;
        const dx = tx - st.ex, dy = ty - st.ey, len = Math.hypot(dx, dy);
        const move = 4.6 * dt;
        if (len <= move) { st.ex = tx; st.ey = ty; st.path.shift(); } else { st.ex += (dx / len) * move; st.ey += (dy / len) * move; }
      }
      if (st.caughtAt < 0 && Math.hypot(px - st.ex, py - st.ey) < 0.9) st.caughtAt = st.clock;
      if (st.caughtAt >= 0 && st.clock - st.caughtAt > 1.2) reset();
      if (st.clock > 22) reset();
      return { px, py };
    }

    return function draw(time, W, H, still, dt) {
      let pos;
      if (still) {
        reset();
        const steps = Math.round(time * 60);
        for (let k = 1; k <= steps; k++) pos = step(1 / 60, k / 60);
      } else {
        pos = step(dt, time);
      }
      const { px, py } = pos;
      const f = fitGrid(W, H, cols, rows);
      const s = f.s, X = (x) => f.ox + x * s, Y = (y) => f.oy + y * s;
      g.fillStyle = BG;
      g.fillRect(0, 0, W, H);
      g.imageSmoothingEnabled = false;
      g.drawImage(base, f.ox, f.oy, cols * s, rows * s);
      if (!st.rejected && st.visited) {
        const id = pf.searchId;
        g.fillStyle = '#25272e';
        for (let i = 0; i < cols * rows; i++) {
          if (pf.closed[i] === id && !solid[i]) g.fillRect(X(i % cols), Y((i / cols) | 0), Math.ceil(s), Math.ceil(s));
        }
      }
      barrels.forEach(([x, y]) => {
        if (st.broken) return;
        g.fillStyle = '#8a5f33';
        g.fillRect(X(x) + s * 0.12, Y(y) + s * 0.12, s * 0.76, s * 0.76);
        g.fillStyle = '#44464d';
        g.fillRect(X(x) + s * 0.12, Y(y) + s * 0.44, s * 0.76, s * 0.12);
      });

      if (st.path.length > 1) {
        g.strokeStyle = AMBER;
        g.lineWidth = Math.max(1.5, s * 0.16);
        g.beginPath();
        g.moveTo(X(st.ex), Y(st.ey));
        for (let i = 1; i < st.path.length; i++) g.lineTo(X((st.path[i] % cols) + 0.5), Y(((st.path[i] / cols) | 0) + 0.5));
        g.stroke();
      }
      drawSkull(g, X(st.ex), Y(st.ey), s * 0.85, 3);
      const ps = s * 0.85;
      g.fillStyle = st.caughtAt >= 0 ? AMBER : '#d8d6cf';
      g.fillRect(X(px) - ps / 2, Y(py) - ps / 2, ps, ps);

      if (hud) {
        let text;
        if (st.caughtAt >= 0) text = t().caught;
        else if (st.clock < st.eventUntil && st.event === 'refresh') text = t().refresh;
        else if (st.rejected) text = t().rejected;
        else text = t().visited(st.visited);
        setHud(hud, text);
      }
    };
  }

  // ---------- Media frames: footage when it exists, a sketch until then ----------
  const sketches = [];
  // The one frame each sketch shows with reduced motion: the torch with the monster on the
  // edge of its light, and the A* chase under way after the barrels break.
  const STILL_T = { fov: 8.5, dungeon: 0, astar: 6 };
  // Slow sketches read fine at low frame rates; the small hub cards need even fewer.
  const FRAME_MS = { page: 1000 / 24, card: 1000 / 15 };

  // Footage takes over the frame once it has loaded; it inherits the sketch's accessible name
  // and only plays while on screen.
  function attachFootage(sk, src) {
    const isGif = /\.gif$/i.test(src);
    const el = document.createElement(isGif ? 'img' : 'video');
    const label = () => sk.canvas.getAttribute('aria-label') || '';
    if (isGif) {
      el.alt = label();
    } else {
      el.muted = true;
      el.loop = true;
      el.playsInline = true;
      el.autoplay = !reduceMotion.matches;
      el.preload = reduceMotion.matches ? 'auto' : 'metadata';
      el.setAttribute('muted', '');
      el.setAttribute('aria-label', label());
      sk.video = el;
    }
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'lang-toggle') {
        setTimeout(() => el.setAttribute(isGif ? 'alt' : 'aria-label', label()), 0);
      }
    });
    el.addEventListener(isGif ? 'load' : 'loadeddata', () => {
      sk.fig.classList.add('has-video');
      sk.off = true;
    }, { once: true });
    el.src = src;
    sk.fig.insertBefore(el, sk.fig.firstChild);
  }

  function initSketches() {
    document.querySelectorAll('.gr-media[data-sketch]').forEach((fig) => {
      const canvas = fig.querySelector('canvas');
      if (!canvas) return;
      const hud = fig.querySelector('.gr-hud');
      const kind = fig.getAttribute('data-sketch');
      let draw;
      if (kind === 'fov') draw = fovSketch(canvas, hud, fig.closest('.gr-card') || fig);
      else if (kind === 'dungeon') draw = dungeonSketch(canvas, hud);
      else if (kind === 'astar') draw = astarSketch(canvas, hud);
      if (!draw) return;
      const every = fig.closest('.gr-card') ? FRAME_MS.card : FRAME_MS.page;
      const sk = { fig, canvas, draw, kind, every, last: 0, time: 0, visible: false, off: false, video: null, w: 0, h: 0, dpr: 1 };
      sketches.push(sk);
      const src = fig.getAttribute('data-video');
      if (src) attachFootage(sk, src);
    });
    if (!sketches.length) return;

    const size = (sk) => {
      sk.dpr = Math.min(window.devicePixelRatio || 1, 2);
      sk.w = sk.canvas.clientWidth;
      sk.h = sk.canvas.clientHeight;
      sk.canvas.width = Math.round(sk.w * sk.dpr);
      sk.canvas.height = Math.round(sk.h * sk.dpr);
    };
    const paint = (sk, still, dt, force) => {
      if (sk.off || !sk.w || !sk.h) return;
      const g = sk.canvas.getContext('2d');
      g.setTransform(sk.dpr, 0, 0, sk.dpr, 0, 0);
      sk.draw(still ? STILL_T[sk.kind] : sk.time, sk.w, sk.h, still, dt || 0, force);
    };
    const paintStill = () => sketches.forEach((sk) => { size(sk); paint(sk, true, 0, true); });

    // On a phone the hub stacks its cards, so only the one nearest the middle of the screen
    // moves; the others keep their last frame.
    const running = () => {
      const live = sketches.filter((sk) => sk.visible && !sk.off);
      if (live.length < 2 || window.innerWidth >= 960) return live;
      const mid = window.innerHeight / 2;
      const dist = (sk) => { const r = sk.canvas.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - mid); };
      return [live.reduce((a, b) => (dist(b) < dist(a) ? b : a))];
    };

    let raf = 0;
    const loop = (now) => {
      raf = 0;
      const live = running();
      if (!live.length || document.hidden) { sketches.forEach((sk) => { sk.last = 0; }); return; }
      raf = requestAnimationFrame(loop);
      live.forEach((sk) => {
        if (sk.last && now - sk.last < sk.every - 1) return;
        const dt = sk.last ? Math.min((now - sk.last) / 1000, 0.1) : 0;
        sk.last = now;
        sk.time += dt;
        paint(sk, false, dt);
      });
    };
    const kick = () => {
      if (reduceMotion.matches) { paintStill(); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onScreen = (sk, yes) => {
      sk.visible = yes;
      if (sk.video) {
        if (yes && !reduceMotion.matches) sk.video.play().catch(() => {});
        else sk.video.pause();
      }
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const sk = sketches.find((k) => k.fig === e.target);
          if (sk) onScreen(sk, e.isIntersecting);
        });
        kick();
      });
      sketches.forEach((sk) => io.observe(sk.fig));
    } else {
      sketches.forEach((sk) => onScreen(sk, true));
    }

    sketches.forEach(size);
    // Resizing clears a canvas, so repaint the current frame instead of waiting for the loop.
    window.addEventListener('resize', () => {
      sketches.forEach((sk) => { size(sk); paint(sk, reduceMotion.matches, 0, true); });
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', kick);
    // Still frames need repainting when the language (and so the HUD text) changes.
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'lang-toggle' && reduceMotion.matches) setTimeout(paintStill, 0);
    });
    kick();
  }

  // ---------- Hub: the dark hall ----------
  function initHall() {
    const room = document.querySelector('.gr-room');
    if (!room) return;
    const canvas = room.querySelector('.gr-room-field');
    const g = canvas.getContext('2d');
    const CELL = 20;
    let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, grid = null, layers = [], slabs = [];
    let ox = 0, oy = 0, range = 30, aim = 2.2, pointer = null, queued = false;

    function rectIn(el, base) {
      const r = el.getBoundingClientRect();
      return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    }

    function build() {
      const base = room.getBoundingClientRect();
      W = room.clientWidth;
      H = room.clientHeight;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      cols = Math.ceil(W / CELL);
      rows = Math.ceil(H / CELL);
      slabs = Array.from(room.querySelectorAll('.gr-card')).map((c) => rectIn(c, base));
      const avoid = slabs.concat(
        Array.from(room.querySelectorAll('.gr-title, .gr-kicker, .gr-pitch, .gr-hero-row, .gr-team, .gr-systems-head')).map((el) => rectIn(el, base))
      );

      ox = cols - 3.5;
      oy = Math.min(5.5, rows / 3);
      let far = 0;
      slabs.forEach((r) => {
        [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].forEach(([x, y]) => {
          far = Math.max(far, Math.hypot(x / CELL - ox, y / CELL - oy));
        });
      });
      range = Math.max(24, far + 2);

      // Pillars and short walls on a jittered lattice, kept off the text and the slabs.
      const solid = new Uint8Array(cols * rows);
      const rng = new Rng('grave::hall');
      const blocked = (x, y) => {
        if (Math.hypot(x + 0.5 - ox, y + 0.5 - oy) < 4) return true;
        const px = x * CELL, py = y * CELL;
        return avoid.some((r) => px + CELL > r.x - CELL && px < r.x + r.w + CELL && py + CELL > r.y - CELL && py < r.y + r.h + CELL);
      };
      for (let gy = 1; gy < rows - 1; gy += 6) {
        for (let gx = 1; gx < cols - 1; gx += 7) {
          if (rng.float() < 0.3) continue;
          const x = gx + rng.range(0, 4), y = gy + rng.range(0, 3);
          const r = rng.float();
          const cells = r < 0.18 ? [[0, 0], [1, 0], [2, 0], [3, 0]] : r < 0.3 ? [[0, 0], [0, 1], [0, 2]] : r < 0.6 ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
          if (cells.some(([dx, dy]) => x + dx >= cols || y + dy >= rows || blocked(x + dx, y + dy))) continue;
          cells.forEach(([dx, dy]) => { solid[(y + dy) * cols + x + dx] = 1; });
        }
      }
      grid = { solid, cols, rows };

      layers = levelLayers(solid, cols, rows, HALL);
      if (!pointer && slabs[0]) aim = Math.atan2((slabs[0].y + slabs[0].h / 2) / CELL - oy, (slabs[0].x + slabs[0].w / 2) / CELL - ox);
      room.classList.add('is-live');
      draw();
    }

    function draw() {
      queued = false;
      if (!grid) return;
      if (pointer) {
        const base = room.getBoundingClientRect();
        aim = Math.atan2((pointer.y - base.top) / CELL - oy, (pointer.x - base.left) / CELL - ox);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const vis = visibility(grid, ox, oy, aim, 100, range, 2.5);
      drawLight(g, layers, vis, ox, oy, range, CELL, 0, 0, rows, (level) => {
        g.fillStyle = HALL.slab[level];
        slabs.forEach((r) => g.fillRect(r.x, r.y, r.w, r.h));
      });
      g.restore();
      g.fillStyle = AMBER;
      g.fillRect((ox - 0.45) * CELL, (oy - 0.45) * CELL, CELL * 0.9, CELL * 0.9);
      g.fillStyle = BG;
      g.fillRect((ox - 0.15) * CELL, (oy - 0.15) * CELL, CELL * 0.3, CELL * 0.3);
    }

    const request = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(draw);
    };

    if (canHover.matches) {
      window.addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY }; request(); }, { passive: true });
      window.addEventListener('scroll', () => { if (pointer) request(); }, { passive: true });
    }

    let timer = 0;
    const rebuild = () => { clearTimeout(timer); timer = setTimeout(build, 120); };
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(room);
    else window.addEventListener('resize', rebuild);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
    build();
  }

  if (window.hljs) document.querySelectorAll('.page-grave pre code').forEach((el) => window.hljs.highlightElement(el));
  initHall();
  initSketches();
})();
