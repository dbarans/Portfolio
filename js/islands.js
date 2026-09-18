// Project "islands": cards float up over a two-layer parallax cell field while the page
// scrolls through a sticky stage. The field is one generator (cell size, spacing, density,
// light cone, scan bands) and its parameters blend from one project's preset to the next.
// Motion is transform / opacity only; the scroll handler just schedules one rAF.
(function () {
  const root = document.querySelector('.islands');
  if (!root) return;

  const stage = root.querySelector('.islands-stage');
  const canvas = root.querySelector('.islands-bg');
  const ctx = canvas.getContext('2d');
  const islands = Array.from(root.querySelectorAll('.island'));
  const railNum = root.querySelector('[data-rail-num]');
  const railFill = root.querySelector('.islands-rail-fill');
  const hint = root.querySelector('.islands-hint');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const inv = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (u) => u * u * (3 - 2 * u);

  // Timeline, in the design's units: island i is centred on t = i * STEP.
  const STEP = 130;
  const T_MIN = -40;
  const T_MAX = 380;
  const REVEAL = [12, 26, 42, 62]; // data-step 2..5
  const DESIGN_W = 1280;
  const DESIGN_H = 820;

  const SKIN = [
    { left: 350, restY: 84 },
    { left: 250, restY: 96 },
    { left: 410, restY: 70 },
  ];

  const Field = window.CellField;
  // One preset per project: cell grid, cone in the dark, x-ray bands.
  const BG = [Field.PRESETS.grid, Field.PRESETS.cone, Field.PRESETS.bands];

  const HINTS = {
    en: ['Scroll down', 'Keep scrolling', 'Next: more projects'],
    pl: ['Przewiń w dół', 'Przewiń dalej', 'Dalej: pozostałe projekty'],
  };

  let live = false;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let pxPerT = 10;
  let sectionTop = 0;
  let cardH = [];
  let lastT = null;
  let queued = false;

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
    canvas.width = Math.round(fw * dpr);
    canvas.height = Math.round(fh * dpr);
  }

  function measure() {
    W = stage.clientWidth;
    H = window.innerHeight;
    pxPerT = Math.max(7, H * 0.011);
    if (live) {
      root.style.height = Math.round(H + (T_MAX - 0) * pxPerT) + 'px';
      sizeCanvas(W, H);
    } else {
      root.style.height = '';
      sizeCanvas(stage.clientWidth, stage.clientHeight);
    }
    const rect = root.getBoundingClientRect();
    sectionTop = rect.top + window.scrollY;
    cardH = islands.map((el) => el.offsetHeight);
    lastT = null;
  }

  function islandLeft(i, w) {
    if (W < 860) return Math.round((W - w) / 2);
    const scaled = SKIN[i].left * (W / DESIGN_W);
    return Math.round(clamp(scaled, 210, W - w - 40));
  }

  function renderLive() {
    queued = false;
    const scrollPx = window.scrollY - sectionTop;
    const t = clamp(scrollPx / pxPerT, T_MIN, T_MAX);
    if (lastT !== null && Math.abs(t - lastT) < 0.01) return;
    lastT = t;

    drawBackground(t, Math.max(scrollPx, T_MIN * pxPerT), W, H);

    const k = H / DESIGN_H;
    islands.forEach((el, i) => {
      const local = t - i * STEP;
      let op;
      if (local < -40) op = 0;
      else if (local < -6) op = inv(local, -40, -6);
      else if (local < 92) op = 1;
      else op = 1 - inv(local, 92, 120);

      if (op <= 0.02) {
        el.classList.remove('is-shown');
        el.style.opacity = '0';
        return;
      }

      const ch = cardH[i];
      const padTop = W < 860 ? 44 : 24; // room for the big project number
      const padBottom = W < 860 ? 52 : 24; // on phones the rail sits at the bottom
      let restStart, restEnd;
      if (ch > H - padTop - padBottom) {
        // Taller than the screen: travel through the card while it rests.
        restStart = padTop;
        restEnd = H - ch - padBottom;
      } else {
        restEnd = clamp((H - ch) / 2 + (SKIN[i].restY - 84) * k, padTop, H - ch - padBottom);
        restStart = restEnd + 34 * k;
      }

      let y;
      if (local < 6) y = lerp(H * 0.8, restStart, inv(local, -40, 6));
      else if (local < 84) y = lerp(restStart, restEnd, inv(local, 6, 84));
      else y = lerp(restEnd, -ch - 80, inv(local, 84, 120));

      const x = islandLeft(i, el.offsetWidth);
      el.classList.add('is-shown');
      el.style.opacity = op.toFixed(3);
      el.style.transform = 'translate3d(' + x + 'px,' + Math.round(y) + 'px,0)';
      el.style.zIndex = local >= 84 ? '1' : '2';

      el.querySelectorAll('[data-step]').forEach((node) => {
        const step = Number(node.getAttribute('data-step'));
        node.classList.toggle('is-in', local >= REVEAL[step - 2]);
      });
    });

    const idx = clamp(Math.floor((t + 20) / STEP) + 1, 1, islands.length);
    if (railNum) railNum.textContent = '0' + idx;
    if (railFill) {
      const u = inv(t, 0, 350);
      railFill.style.transform = W < 860 ? 'scaleX(' + u + ')' : 'scaleY(' + u + ')';
    }
    if (hint) {
      const lang = document.documentElement.lang === 'pl' ? 'pl' : 'en';
      hint.textContent = HINTS[lang][t < 12 ? 0 : (t > 360 ? 2 : 1)];
    }
  }

  function renderStatic() {
    const fw = stage.clientWidth;
    const fh = stage.clientHeight;
    drawBackground(0, 0, fw, fh);
  }

  function schedule() {
    if (!live || queued) return;
    queued = true;
    window.requestAnimationFrame(renderLive);
  }

  function setMode() {
    live = !reduceMotion.matches;
    root.classList.toggle('is-live', live);
    if (!live) {
      islands.forEach((el) => {
        el.style.transform = '';
        el.style.opacity = '';
        el.style.zIndex = '';
      });
    }
    measure();
    if (live) renderLive();
    else renderStatic();
  }

  // The hero sits on the same field (first preset, dimmed so the headline stays readable),
  // so the page reads as one board the islands later float over.
  const heroCanvas = document.querySelector('.hero-field');
  function drawHero() {
    if (!heroCanvas) return;
    const g = heroCanvas.getContext('2d');
    const fw = heroCanvas.clientWidth;
    const fh = heroCanvas.clientHeight;
    const r = Math.min(window.devicePixelRatio || 1, 2);
    heroCanvas.width = Math.round(fw * r);
    heroCanvas.height = Math.round(fh * r);
    g.setTransform(r, 0, 0, r, 0, 0);
    g.fillStyle = '#070708';
    g.fillRect(0, 0, fw, fh);
    drawField(BG[0], fw, fh, 1.7, 0, 991, 1, g);
    drawField(BG[0], fw, fh, 1.0, 0, 7, 1, g);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', drawHero);
  window.addEventListener('resize', () => {
    measure();
    if (live) renderLive();
    else renderStatic();
  });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', setMode);

  // Card heights change with the language toggle and when fonts finish loading.
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      measure();
      if (live) renderLive();
      else renderStatic();
    });
    islands.forEach((el) => ro.observe(el));
  }
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'lang-toggle') {
      lastT = null;
      window.requestAnimationFrame(() => (live ? renderLive() : renderStatic()));
    }
  });

  setMode();
  drawHero();
})();
