// Project "islands": cards float up over a two-layer parallax cell field while the page
// scrolls through a sticky stage. The field is one generator (cell size, spacing, density,
// light cone, scan bands) and its parameters blend from one project's preset to the next.
// Motion is transform / opacity only; the scroll handler just schedules one rAF, and nothing
// is redrawn while the stage is off screen.
(function () {
  const root = document.querySelector('.islands');
  if (!root) return;

  const stage = root.querySelector('.islands-stage');
  const canvas = root.querySelector('.islands-bg');
  const ctx = canvas.getContext('2d');
  const islands = Array.from(root.querySelectorAll('.island'));
  const steps = islands.map((el) => Array.from(el.querySelectorAll('[data-step]')));
  const railNum = root.querySelector('[data-rail-num]');
  const railFill = root.querySelector('.islands-rail-fill');
  const hint = root.querySelector('.islands-hint');
  const LAST = islands.length - 1;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const inv = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (u) => u * u * (3 - 2 * u);

  // Timeline, in the design's units: island i rests around t = i * STEP.
  const STEP = 130;
  const T_MIN = -40;
  const T_MAX = LAST * STEP + 90; // the last island is still resting when the stage unsticks
  const REST_A = 6; // local t where an island reaches its resting place…
  const REST_B = 84; // …and where it starts to leave
  const REVEAL_AT = -30; // an entering island reveals its content while it rises
  const DESIGN_W = 1280;
  const DESIGN_H = 820;
  const NARROW = 960; // below this there is no room for the side rail next to a card

  const SKIN = [
    { left: 350, restY: 84 },
    { left: 250, restY: 96 },
    { left: 410, restY: 70 },
  ];
  const skin = (i) => SKIN[i] || SKIN[0];

  const Field = window.CellField;
  // One preset per project: cell grid, cone in the dark, x-ray bands.
  const BG = [Field.PRESETS.grid, Field.PRESETS.cone, Field.PRESETS.bands];

  const HINTS = {
    en: { start: 'Scroll down', next: 'Next: ' },
    pl: { start: 'Przewiń w dół', next: 'Dalej: ' },
  };

  let live = false;
  let narrow = false;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let pxPerT = 10;
  let sectionTop = 0;
  let cardH = [];
  let cardW = [];
  let lastT = null;
  let queued = false;
  // Last values written to the DOM, so a frame only touches what changed
  let shownState = [];
  let revealState = [];

  function blend(t) {
    let ia = 0, ib = 0, u = 0;
    if (t > 84 && t < 136) { ia = 0; ib = 1; u = smooth(inv(t, 84, 136)); }
    else if (t >= 136 && t <= 214) { ia = 1; ib = 1; }
    else if (t > 214 && t < 266) { ia = 1; ib = 2; u = smooth(inv(t, 214, 266)); }
    else if (t >= 266) { ia = 2; ib = 2; }
    return Field.mix(BG[ia], BG[ib], u);
  }

  function drawField(p, fw, fh, scale, off, seed, dim, g) {
    Field.draw(g || ctx, p, fw, fh, scale, off, seed, dim);
  }

  function drawBackground(t, scrollPx, fw, fh) {
    const p = blend(t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#070708';
    ctx.fillRect(0, 0, fw, fh);
    drawField(p, fw, fh, 1.7, -scrollPx * 0.22, 991, 1); // far layer, 0.22x
    drawField(p, fw, fh, 1.0, -scrollPx * 0.62, 7, 0); // near layer, 0.62x
    if (p.band > 0.01) {
      ctx.globalAlpha = p.band * 0.5;
      ctx.fillStyle = '#7E7E74';
      ctx.fillRect(0, Math.round((t * 3.2 * (fh / DESIGN_H)) % fh), fw, 3);
      ctx.globalAlpha = 1;
    }
  }

  function sizeCanvas(fw, fh) {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(fw * dpr);
    const ch = Math.round(fh * dpr);
    if (canvas.width !== cw) canvas.width = cw; // assigning clears and reallocates, so only on change
    if (canvas.height !== ch) canvas.height = ch;
  }

  // Full-bleed sections use 100vw, which includes a classic (non-overlay) scrollbar.
  function setScrollbarVar() {
    const sbw = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--sbw', sbw + 'px');
  }

  function measure() {
    setScrollbarVar();
    W = stage.clientWidth;
    narrow = W < NARROW;
    root.classList.toggle('is-narrow', narrow);
    if (live) {
      // The stage is 100svh tall, so this stays put while mobile toolbars slide in and out
      // (window.innerHeight would change and make the islands jump mid-scroll).
      H = stage.clientHeight || window.innerHeight;
      pxPerT = Math.max(7, H * 0.011);
      root.style.height = Math.round(H + T_MAX * pxPerT) + 'px';
      sizeCanvas(W, H);
    } else {
      H = window.innerHeight;
      root.style.height = '';
      sizeCanvas(W, stage.clientHeight);
    }
    sectionTop = root.getBoundingClientRect().top + window.scrollY;
    cardH = islands.map((el) => el.offsetHeight);
    cardW = islands.map((el) => el.offsetWidth);
    lastT = null;
  }

  function islandLeft(i) {
    const w = cardW[i];
    if (narrow) return Math.round((W - w) / 2);
    const scaled = skin(i).left * (W / DESIGN_W);
    return Math.round(clamp(scaled, 210, W - w - 40));
  }

  // Where island i sits while resting: [top at REST_A, top at REST_B] in stage pixels.
  function restRange(i) {
    const k = H / DESIGN_H;
    const ch = cardH[i];
    const padTop = narrow ? 44 : 24; // room for the big project number
    const padBottom = narrow ? 52 : 24; // on narrow stages the rail sits at the bottom
    const lowest = H - ch - padBottom;
    // Taller than the screen: travel through the card while it rests.
    if (ch > H - padTop - padBottom) return [padTop, lowest];
    const end = clamp((H - ch) / 2 + (skin(i).restY - 84) * k, padTop, lowest);
    return [Math.min(end + 34 * k, lowest), end];
  }

  function place(i, t) {
    const local = t - i * STEP;
    const [rs, re] = restRange(i);
    // The first island is already in place when the stage scrolls into view, so the fold
    // shows a project rather than an empty field.
    if (i === 0 && local < REST_A) return { op: 1, y: rs };
    if (local < -40) return { op: 0, y: H };
    if (local < REST_A) return { op: inv(local, -40, -6), y: lerp(H * 0.8, rs, inv(local, -40, REST_A)) };
    // The last island stays until the stage unsticks and scrolls away with the page.
    if (local < REST_B || i === LAST) return { op: 1, y: lerp(rs, re, inv(local, REST_A, REST_B)) };
    return {
      op: 1 - inv(local, 92, 120),
      y: lerp(re, -cardH[i] - 80, inv(local, REST_B, 120)),
    };
  }

  function nextName(i) {
    if (i < LAST) {
      const title = islands[i + 1].querySelector('.island-title');
      return title ? title.textContent.trim() : '';
    }
    return Array.from(document.querySelectorAll('.section-projects--more .project-title'))
      .map((n) => n.textContent.trim())
      .join(', ');
  }

  function updateHint(t) {
    if (!hint) return;
    const h = HINTS[document.documentElement.lang === 'pl' ? 'pl' : 'en'];
    let text = h.start;
    if (t >= 12) {
      const name = nextName(clamp(Math.floor((t + 20) / STEP), 0, LAST));
      if (name) text = h.next + name + ' ↓';
    }
    if (hint.textContent !== text) hint.textContent = text;
  }

  function renderLive() {
    queued = false;
    const scrollPx = window.scrollY - sectionTop;
    const t = clamp(scrollPx / pxPerT, T_MIN, T_MAX);
    if (lastT !== null && Math.abs(t - lastT) < 0.01) return;
    lastT = t;

    drawBackground(t, Math.max(scrollPx, T_MIN * pxPerT), W, H);

    islands.forEach((el, i) => {
      const local = t - i * STEP;
      const p = place(i, t);
      const shown = p.op > 0.02;
      if (shownState[i] !== shown) {
        el.classList.toggle('is-shown', shown);
        shownState[i] = shown;
      }
      if (!shown) {
        el.style.opacity = '0';
      } else {
        el.style.opacity = p.op.toFixed(3);
        el.style.transform = 'translate3d(' + islandLeft(i) + 'px,' + Math.round(p.y) + 'px,0)';
        el.style.zIndex = local >= REST_B && i !== LAST ? '1' : '2';
      }
      const reveal = i === 0 || local >= REVEAL_AT;
      if (revealState[i] !== reveal) {
        steps[i].forEach((node) => node.classList.toggle('is-in', reveal));
        revealState[i] = reveal;
      }
    });

    const idx = clamp(Math.floor((t + 20) / STEP) + 1, 1, islands.length);
    const num = (idx < 10 ? '0' : '') + idx;
    if (railNum && railNum.textContent !== num) railNum.textContent = num;
    if (railFill) {
      const u = inv(t, 0, T_MAX);
      railFill.style.transform = narrow ? 'scaleX(' + u + ')' : 'scaleY(' + u + ')';
    }
    updateHint(t);
  }

  function renderStatic() {
    drawBackground(0, 0, stage.clientWidth, stage.clientHeight);
  }

  function render() {
    if (live) {
      lastT = null;
      renderLive();
    } else {
      renderStatic();
    }
  }

  function schedule() {
    if (!live || queued) return;
    queued = true;
    window.requestAnimationFrame(renderLive);
  }

  function setMode() {
    live = !reduceMotion.matches;
    root.classList.toggle('is-live', live);
    shownState = [];
    revealState = [];
    if (!live) {
      islands.forEach((el) => {
        el.style.transform = '';
        el.style.opacity = '';
        el.style.zIndex = '';
        el.classList.remove('is-shown');
      });
    }
    measure();
    render();
  }

  // Keyboard: Tab can reach a link in an island that is currently transparent. Scroll the page
  // to the point of the timeline where that island rests with the link on screen.
  function onFocusIn(e) {
    if (!live) return;
    const i = islands.findIndex((el) => el.contains(e.target));
    if (i < 0) return;
    const el = islands[i];
    const tr = e.target.getBoundingClientRect();
    if (Number(el.style.opacity) > 0.98 && tr.top >= 0 && tr.bottom <= window.innerHeight) return;
    const rel = tr.top - el.getBoundingClientRect().top;
    const [rs, re] = restRange(i);
    const y = clamp(H / 2 - rel - tr.height / 2, Math.min(rs, re), Math.max(rs, re));
    const u = rs === re ? 0.5 : (rs - y) / (rs - re);
    const local = lerp(REST_A + 2, REST_B - 2, clamp(u, 0, 1));
    window.scrollTo(0, Math.round(sectionTop + (i * STEP + local) * pxPerT));
    render();
  }

  // The hero sits on the same field (first preset, dimmed so the headline stays readable),
  // so the page reads as one board the islands later float over.
  const heroCanvas = document.querySelector('.hero-field');
  let heroSize = '';
  function drawHero() {
    if (!heroCanvas) return;
    const fw = heroCanvas.clientWidth;
    const fh = heroCanvas.clientHeight;
    const r = Math.min(window.devicePixelRatio || 1, 2);
    const size = fw + 'x' + fh + '@' + r;
    if (size === heroSize) return;
    heroSize = size;
    const g = heroCanvas.getContext('2d');
    heroCanvas.width = Math.round(fw * r);
    heroCanvas.height = Math.round(fh * r);
    g.setTransform(r, 0, 0, r, 0, 0);
    g.fillStyle = '#070708';
    g.fillRect(0, 0, fw, fh);
    drawField(BG[0], fw, fh, 1.7, 0, 991, 1, g);
    drawField(BG[0], fw, fh, 1.0, 0, 7, 1, g);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    render();
    drawHero();
  });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', setMode);
  root.addEventListener('focusin', onFocusIn);

  // Card heights change with the language toggle and when fonts finish loading; the hero's
  // height moves the section's top.
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      measure();
      render();
      drawHero();
    });
    islands.forEach((el) => ro.observe(el));
    const hero = document.querySelector('.hero');
    if (hero) ro.observe(hero);
  }
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'lang-toggle') {
      window.requestAnimationFrame(render); // the hint text follows the language
    }
  });

  setMode();
  drawHero();
})();

// A small live Game of Life board in the hero card: B3/S23 on a wrapping grid, reseeded when it
// settles. It runs only while visible on screen; with reduced motion it is a still frame.
(function () {
  const cv = document.querySelector('.hero-life');
  if (!cv || !cv.getContext) return;
  const g = cv.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const CELL = 12; // pitch in CSS px
  const SIZE = 10; // drawn square
  const TICK = 200; // ms per generation
  const INK = '#0a0a0a';
  const LIVE = '#98988e';
  const BORN = '#f4f3ef';
  const TRAIL = ['#30302B', '#1E1E1C', '#121211'];

  let cols = 0, rows = 0, ox = 0, oy = 0, fw = 0, fh = 0;
  let cur, nxt, since;
  let gen = 0, quiet = 0, timer = 0, onScreen = true;

  function seed() {
    const n = cols * rows;
    cur = new Uint8Array(n);
    nxt = new Uint8Array(n);
    since = new Uint8Array(n).fill(255);
    for (let i = 0; i < n; i++) cur[i] = Math.random() < 0.32 ? 1 : 0;
    gen = 0;
    quiet = 0;
  }

  function step() {
    let changes = 0, pop = 0;
    for (let y = 0; y < rows; y++) {
      const up = ((y + rows - 1) % rows) * cols;
      const mid = y * cols;
      const dn = ((y + 1) % rows) * cols;
      for (let x = 0; x < cols; x++) {
        const l = (x + cols - 1) % cols;
        const r = (x + 1) % cols;
        const n = cur[up + l] + cur[up + x] + cur[up + r] + cur[mid + l] + cur[mid + r] +
          cur[dn + l] + cur[dn + x] + cur[dn + r];
        const i = mid + x;
        const v = n === 3 || (n === 2 && cur[i]) ? 1 : 0;
        nxt[i] = v;
        if (v !== cur[i]) { since[i] = 0; changes++; } else if (since[i] < 255) since[i]++;
        pop += v;
      }
    }
    const tmp = cur; cur = nxt; nxt = tmp;
    gen++;
    // Still lifes and lone blinkers read as a dead tile: start over.
    quiet = changes < Math.max(6, cols * rows * 0.012) ? quiet + 1 : 0;
    if (pop < cols * rows * 0.03 || quiet > 20 || gen > 600) seed();
  }

  function draw() {
    g.fillStyle = INK;
    g.fillRect(0, 0, fw, fh);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        let c = null;
        if (cur[i]) c = since[i] === 0 && gen > 0 ? BORN : LIVE;
        else if (since[i] < TRAIL.length) c = TRAIL[since[i]];
        if (!c) continue;
        g.fillStyle = c;
        g.fillRect(ox + x * CELL, oy + y * CELL, SIZE, SIZE);
      }
    }
  }

  function resize() {
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (!w || !h) return false;
    if (w === fw && h === fh && cur) return true;
    const r = Math.min(window.devicePixelRatio || 1, 2);
    fw = w;
    fh = h;
    cv.width = Math.round(w * r);
    cv.height = Math.round(h * r);
    g.setTransform(r, 0, 0, r, 0, 0);
    cols = Math.max(4, Math.floor((w - 8 + (CELL - SIZE)) / CELL));
    rows = Math.max(4, Math.floor((h - 8 + (CELL - SIZE)) / CELL));
    ox = Math.round((w - (cols * CELL - (CELL - SIZE))) / 2);
    oy = Math.round((h - (rows * CELL - (CELL - SIZE))) / 2);
    seed();
    return true;
  }

  function tick() {
    step();
    draw();
  }

  function update() {
    const run = !reduceMotion.matches && onScreen && !document.hidden;
    if (run && !timer) timer = window.setInterval(tick, TICK);
    if (!run && timer) {
      window.clearInterval(timer);
      timer = 0;
    }
  }

  function start() {
    if (!resize()) return;
    if (reduceMotion.matches) {
      for (let k = 0; k < 40; k++) step(); // a settled-looking still instead of noise
      since.fill(255);
    }
    draw();
    update();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      update();
    }).observe(cv);
  }
  document.addEventListener('visibilitychange', update);
  window.addEventListener('resize', () => {
    const w = fw, h = fh;
    if (resize() && (w !== fw || h !== fh)) draw();
  });
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', () => {
      fw = 0; // force a fresh board in the new mode
      start();
    });
  }
  start();
})();
