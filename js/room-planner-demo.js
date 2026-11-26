// Interactive Room Planner demo (room-planner.html). The logic is not re-implemented here: the
// app's own :domain module, compiled from Kotlin to JavaScript (tools/room-planner-web), decides
// where a dragged piece snaps, which angles a turn locks to and what each placement rule reports.
// This file only draws the state it gets back and turns pointer and key input into calls.
(function () {
  'use strict';

  const root = document.getElementById('rp-demo');
  if (!root) return;

  const canvas = root.querySelector('.rp-canvas');
  const ctx = canvas.getContext('2d');
  const els = {
    status: root.querySelector('.rp-status'),
    pieces: root.querySelector('.rp-pieces'),
    name: root.querySelector('.rp-sel-name'),
    meta: root.querySelector('.rp-sel-meta'),
    issues: root.querySelector('.rp-sel-issues'),
    rotate: root.querySelector('[data-rp="rotate"]'),
    align: root.querySelector('[data-rp="align"]'),
    reset: root.querySelector('[data-rp="reset"]'),
    snap: root.querySelector('[data-rp="snap"]'),
    live: root.querySelector('.rp-live'),
  };

  const TEXT = {
    en: {
      kinds: {
        BED: 'Bed', WARDROBE: 'Wardrobe', SOFA: 'Sofa', ARMCHAIR: 'Armchair', DESK: 'Desk',
        TABLE: 'Table', DRESSER: 'Dresser', SIDEBOARD: 'Sideboard', OTHER: 'Furniture',
      },
      issue: {
        overlaps: (i, n) => 'Overlaps ' + i.others.map(n).join(', '),
        outside: (i) => 'Sticks out ' + Math.round(i.depth) + ' cm through a wall',
        stove: (i) => 'Too close to the stove: ' + Math.round(i.distance) + ' cm (min. ' + Math.round(i.required) + ' cm)',
        blocksRadiator: () => 'Stands on a radiator',
        radiatorGap: () => 'Blocks the space in front of a radiator',
        overhangsRadiator: () => 'Top above a radiator (fine for a desk)',
        doorSwing: () => 'In the swing of a door',
      },
      fine: 'No problems: the rules find nothing wrong here.',
      none: 'Pick a piece: tap it on the plan or choose it from the list.',
      loading: 'Loading the app’s code…',
      failed: 'The demo could not load. The rest of the page works without it.',
      ready: 'Running the app’s own domain code, compiled from Kotlin to JavaScript.',
      sel: 'selected',
      problem: 'problem',
      warning: 'warning',
      noWall: 'No wall has room for this piece without a collision.',
    },
    pl: {
      kinds: {
        BED: 'Łóżko', WARDROBE: 'Szafa', SOFA: 'Kanapa', ARMCHAIR: 'Fotel', DESK: 'Biurko',
        TABLE: 'Stół', DRESSER: 'Komoda', SIDEBOARD: 'Kredens', OTHER: 'Mebel',
      },
      issue: {
        overlaps: (i, n) => 'Nachodzi na: ' + i.others.map(n).join(', '),
        outside: (i) => 'Wystaje ' + Math.round(i.depth) + ' cm przez ścianę',
        stove: (i) => 'Za blisko pieca: ' + Math.round(i.distance) + ' cm (min. ' + Math.round(i.required) + ' cm)',
        blocksRadiator: () => 'Stoi na grzejniku',
        radiatorGap: () => 'Zasłania miejsce przed grzejnikiem',
        overhangsRadiator: () => 'Blat nad grzejnikiem (dla biurka w porządku)',
        doorSwing: () => 'W zasięgu otwierania drzwi',
      },
      fine: 'Bez problemów: reguły nie widzą tu nic złego.',
      none: 'Wybierz mebel: dotknij go na planie albo wybierz z listy.',
      loading: 'Ładuję kod aplikacji…',
      failed: 'Nie udało się wczytać dema. Reszta strony działa bez niego.',
      ready: 'Działa tu kod domeny aplikacji, skompilowany z Kotlina do JavaScriptu.',
      sel: 'wybrany',
      problem: 'problem',
      warning: 'uwaga',
      noWall: 'Przy żadnej ścianie nie ma miejsca na ten mebel bez kolizji.',
    },
  };
  const t = () => TEXT[document.documentElement.lang === 'pl' ? 'pl' : 'en'];

  let demo = null;
  let state = null;
  let selected = 'table';
  let drag = null; // { mode: 'move' | 'rotate', id, dx, dy, pointerId }
  let view = { scale: 1, ox: 0, oy: 0 };
  let lastAnnounced = '';

  const PAD_CM = 34;
  const HANDLE_GAP_CM = 26;
  const HANDLE_R_PX = 9;

  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  // ---------- geometry helpers (drawing only) ----------
  const toPx = (p) => [view.ox + p[0] * view.scale, view.oy + p[1] * view.scale];
  const toCm = (x, y) => [(x - view.ox) / view.scale, (y - view.oy) / view.scale];
  const piece = (id) => (state ? state.furniture.find((f) => f.id === id) : null);
  const nameOf = (id) => {
    const f = piece(id);
    return f ? t().kinds[f.kind] || f.kind : id;
  };
  const handleOf = (f) => {
    // The handle sits in front of the piece: at 0° the back faces the top of the plan.
    const a = ((f.rot + 90) * Math.PI) / 180;
    const r = f.d / 2 + HANDLE_GAP_CM;
    return [f.x + Math.cos(a) * r, f.y + Math.sin(a) * r];
  };

  // ---------- layout ----------
  function fit() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!state) return;
    const xs = state.room.map((p) => p[0]);
    const ys = state.room.map((p) => p[1]);
    const minX = Math.min(...xs) - PAD_CM;
    const minY = Math.min(...ys) - PAD_CM;
    const w = Math.max(...xs) - Math.min(...xs) + PAD_CM * 2;
    const h = Math.max(...ys) - Math.min(...ys) + PAD_CM * 2;
    const scale = Math.min(rect.width / w, rect.height / h);
    view = {
      scale,
      ox: (rect.width - w * scale) / 2 - minX * scale,
      oy: (rect.height - h * scale) / 2 - minY * scale,
    };
  }

  // ---------- drawing ----------
  function path(points) {
    ctx.beginPath();
    points.forEach((p, i) => {
      const [x, y] = toPx(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }

  function hatch(points, color) {
    ctx.save();
    path(points);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const xs = points.map((p) => toPx(p)[0]);
    const ys = points.map((p) => toPx(p)[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    ctx.beginPath();
    for (let k = x0 - (y1 - y0); k < x1; k += 6) {
      ctx.moveTo(k, y1);
      ctx.lineTo(k + (y1 - y0), y0);
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!state) return;
    const c = {
      bg: css('--rp-bg'), floor: css('--rp-floor'), wall: css('--rp-wall'), line: css('--rp-line'),
      text: css('--rp-text'), muted: css('--rp-muted'), accent: css('--rp-accent'),
      error: css('--rp-error'), warning: css('--rp-warning'), window: css('--rp-window'),
    };

    // Floor and walls
    path(state.room);
    ctx.fillStyle = c.floor;
    ctx.fill();

    // Zones that must stay free sit on the floor, under the furniture
    for (const f of state.features) {
      if (f.type === 'stove') hatch(f.zone, c.error + '66');
      if (f.type === 'radiator') hatch(f.zone, c.warning + '55');
      if (f.type === 'door') {
        for (const s of f.swing) {
          path(s);
          ctx.fillStyle = c.line + '55';
          ctx.fill();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = c.muted;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    path(state.room);
    ctx.strokeStyle = c.wall;
    ctx.lineWidth = Math.max(4, 8 * view.scale);
    ctx.lineJoin = 'miter';
    ctx.stroke();

    for (const f of state.features) {
      const [a, b] = f.span || [];
      if (f.type === 'window' || f.type === 'door') {
        ctx.beginPath();
        ctx.moveTo(...toPx(a));
        ctx.lineTo(...toPx(b));
        ctx.strokeStyle = c.bg;
        ctx.lineWidth = Math.max(5, 9 * view.scale);
        ctx.stroke();
        if (f.type === 'window') {
          ctx.strokeStyle = c.window;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      if (f.type === 'radiator') {
        path(f.body);
        ctx.fillStyle = c.warning;
        ctx.fill();
      }
      if (f.type === 'stove') {
        ctx.beginPath();
        ctx.moveTo(...toPx(a));
        ctx.lineTo(...toPx(b));
        ctx.strokeStyle = c.error;
        ctx.lineWidth = Math.max(5, 9 * view.scale);
        ctx.stroke();
      }
    }

    // Furniture, the selected piece on top
    const order = state.furniture.slice().sort((p, q) => (p.id === selected) - (q.id === selected));
    for (const f of order) {
      const isSel = f.id === selected;
      const tone = f.status === 'ERROR' ? c.error : f.status === 'WARNING' ? c.warning : null;
      path(f.footprint);
      ctx.fillStyle = tone ? tone + '33' : c.bg + 'cc';
      ctx.fill();
      ctx.strokeStyle = isSel ? c.accent : tone || c.text;
      ctx.lineWidth = isSel ? 2.5 : 1.5;
      ctx.stroke();
      // The back edge, so the piece's facing reads on the plan
      ctx.beginPath();
      ctx.moveTo(...toPx(f.footprint[0]));
      ctx.lineTo(...toPx(f.footprint[1]));
      ctx.lineWidth = isSel ? 4 : 3;
      ctx.stroke();

      const label = t().kinds[f.kind] || f.kind;
      const [cx, cy] = toPx([f.x, f.y]);
      ctx.font = '500 11px "DM Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const room = Math.min(f.w, f.d) * view.scale;
      if (ctx.measureText(label).width < Math.max(f.w, f.d) * view.scale - 6 && room > 14) {
        ctx.fillStyle = tone || c.text;
        ctx.fillText(label, cx, cy);
      }

      if (isSel) {
        const h = handleOf(f);
        const [hx, hy] = toPx(h);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(hx, hy);
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(hx, hy, HANDLE_R_PX, 0, Math.PI * 2);
        ctx.fillStyle = c.accent;
        ctx.fill();
        ctx.fillStyle = c.bg;
        ctx.font = '700 12px "DM Mono", ui-monospace, monospace';
        ctx.fillText('↻', hx, hy + 1);
      }
    }
  }

  // ---------- side panel ----------
  function issueText(i) {
    const fmt = t().issue[i.type];
    return fmt ? fmt(i, nameOf) : i.type;
  }

  function renderPanel() {
    const f = piece(selected);
    const tx = t();
    els.pieces.querySelectorAll('button').forEach((b) => {
      const p = piece(b.dataset.id);
      b.setAttribute('aria-pressed', String(b.dataset.id === selected));
      b.dataset.status = (p && p.status) || '';
      b.querySelector('.rp-piece-name').textContent = p ? tx.kinds[p.kind] || p.kind : b.dataset.id;
      const st = p && p.status === 'ERROR' ? tx.problem : p && p.status === 'WARNING' ? tx.warning : '';
      b.querySelector('.rp-piece-state').textContent = st;
    });
    els.rotate.disabled = !f;
    els.align.disabled = !f;
    if (!f) {
      els.name.textContent = '';
      els.meta.textContent = '';
      els.issues.innerHTML = '<li class="rp-ok">' + tx.none + '</li>';
      return;
    }
    els.name.textContent = tx.kinds[f.kind] || f.kind;
    els.meta.textContent = Math.round(f.w) + ' × ' + Math.round(f.d) + ' cm · ' + Math.round(f.rot) + '°';
    els.issues.innerHTML = '';
    if (!f.issues.length) {
      const li = document.createElement('li');
      li.className = 'rp-ok';
      li.textContent = tx.fine;
      els.issues.appendChild(li);
    } else {
      for (const i of f.issues) {
        const li = document.createElement('li');
        li.dataset.severity = i.severity;
        li.textContent = issueText(i);
        els.issues.appendChild(li);
      }
    }
  }

  function announce() {
    const f = piece(selected);
    if (!f) return;
    const msg = (t().kinds[f.kind] || f.kind) + ': ' +
      (f.issues.length ? f.issues.map(issueText).join('; ') : t().fine);
    if (msg !== lastAnnounced) {
      lastAnnounced = msg;
      els.live.textContent = msg;
    }
  }

  function refresh(opts) {
    state = JSON.parse(demo.stateJson());
    draw();
    renderPanel();
    if (!opts || !opts.quiet) announce();
  }

  function buildPieceList() {
    els.pieces.innerHTML = '';
    for (const f of state.furniture) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = f.id;
      b.innerHTML = '<span class="rp-piece-dot" aria-hidden="true"></span><span class="rp-piece-name"></span><span class="rp-piece-state"></span>';
      b.addEventListener('click', () => {
        selected = f.id;
        refresh();
      });
      li.appendChild(b);
      els.pieces.appendChild(li);
    }
  }

  // ---------- input ----------
  const snapOn = () => els.snap.checked;

  function pointerCm(e) {
    const r = canvas.getBoundingClientRect();
    return toCm(e.clientX - r.left, e.clientY - r.top);
  }

  // Keeps the drag going when the pointer leaves the canvas; harmless to skip if the browser refuses.
  const capture = (e) => {
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) { /* no active pointer, e.g. a synthetic event */ }
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (!demo) return;
    const [x, y] = pointerCm(e);
    const f = piece(selected);
    if (f) {
      const [hx, hy] = handleOf(f);
      if (Math.hypot(hx - x, hy - y) * view.scale <= HANDLE_R_PX + 8) {
        drag = { mode: 'rotate', id: f.id, pointerId: e.pointerId };
        capture(e);
        e.preventDefault();
        return;
      }
    }
    const hit = demo.pieceAt(x, y);
    if (hit) {
      selected = hit;
      const p = piece(hit);
      drag = { mode: 'move', id: hit, dx: p.x - x, dy: p.y - y, pointerId: e.pointerId };
      capture(e);
      e.preventDefault();
      refresh({ quiet: true });
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) {
      if (demo && state && e.pointerType === 'mouse') {
        const [x, y] = pointerCm(e);
        const f = piece(selected);
        const onHandle = f && Math.hypot(handleOf(f)[0] - x, handleOf(f)[1] - y) * view.scale <= HANDLE_R_PX + 8;
        canvas.style.cursor = onHandle ? 'grab' : demo.pieceAt(x, y) ? 'move' : 'default';
      }
      return;
    }
    const [x, y] = pointerCm(e);
    if (drag.mode === 'move') demo.moveTo(drag.id, x + drag.dx, y + drag.dy, snapOn(), 1 / view.scale);
    else demo.rotateTowards(drag.id, x, y, snapOn());
    refresh({ quiet: true });
  });

  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag = null;
    announce();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // The planner's precise controls: 5 cm steps and 15° turns, no gestures needed.
  canvas.addEventListener('keydown', (e) => {
    const f = piece(selected);
    if (!f) return;
    const step = 5;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      demo.moveTo(f.id, f.x + moves[e.key][0], f.y + moves[e.key][1], false, 1 / view.scale);
    } else if (e.key === '[' || e.key === ']') {
      demo.rotateBy(f.id, e.key === '[' ? -15 : 15);
    } else {
      return;
    }
    e.preventDefault();
    refresh();
  });

  els.rotate.addEventListener('click', () => {
    demo.rotateBy(selected, 90);
    refresh();
  });
  els.align.addEventListener('click', () => {
    if (!demo.alignToWall(selected)) {
      els.live.textContent = t().noWall;
      return;
    }
    refresh();
  });
  els.reset.addEventListener('click', () => {
    demo.reset();
    selected = 'table';
    refresh();
  });

  new ResizeObserver(() => {
    fit();
    draw();
  }).observe(canvas);

  // Language switches re-render the dynamic text (kind names, issue messages).
  new MutationObserver(() => {
    if (demo) {
      renderPanel();
      draw();
      els.status.textContent = t().ready;
    } else {
      els.status.textContent = t().loading;
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // ---------- load the compiled domain ----------
  els.status.textContent = t().loading;
  import('./room-planner/room-planner-domain.js')
    .then((mod) => {
      demo = new mod.PlannerDemo();
      state = JSON.parse(demo.stateJson());
      buildPieceList();
      fit();
      root.classList.add('is-ready');
      els.status.textContent = t().ready;
      refresh({ quiet: true });
    })
    .catch((err) => {
      root.classList.add('is-failed');
      els.status.textContent = t().failed;
      console.error(err);
    });
})();
