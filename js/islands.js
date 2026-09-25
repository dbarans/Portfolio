// Project "islands": three project cards rise, rest and leave one after another while the page
// scrolls through a sticky stage. The page around them stays neutral; each card carries a hint of
// its own project's world — a texture drawn once with js/cellfield.js in that project's palette.
// Motion is transform / opacity only; the scroll handler just schedules one rAF, and nothing is
// written to the DOM while the stage is off screen.
(function () {
  const root = document.querySelector('.islands');
  if (!root) return;

  const stage = root.querySelector('.islands-stage');
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
  const easeOut = (u) => 1 - (1 - u) * (1 - u);
  const easeIn = (u) => u * u;

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

  // Each card's world, drawn behind its content: one cellfield preset in the project's own palette
  // (darkest → brightest). 01 its cells, 02 a lit cone in the dark, 03 x-ray scan bands.
  const Field = window.CellField;
  const WORLDS = Field ? [
    { p: Field.PRESETS.grid, pal: ['#141413', '#1d1d1b', '#2b2b27', '#44443c'], seed: 7, dim: 1 },
    { p: Field.PRESETS.cone, pal: ['#14120e', '#1d1912', '#2c2417', '#3d301c'], seed: 991, dim: 0 },
    { p: Field.PRESETS.bands, pal: ['#0a1416', '#0d1e20', '#12292b', '#1a4341'], seed: 31, dim: 0, scan: '#3dd6cb' },
  ] : [];

  const HINTS = {
    en: { start: 'Scroll down', next: 'Next: ' },
    pl: { start: 'Przewiń w dół', next: 'Dalej: ' },
  };

  let live = false;
  let narrow = false;
  let W = 0;
  let H = 0;
  let pxPerT = 10;
  let sectionTop = 0;
  let cardH = [];
  let cardW = [];
  let lastT = null;
  let queued = false;
  // Last values written to the DOM, so a frame only touches what changed
  let shownState = [];
  let revealState = [];
  const texSize = [];

  // Full-bleed sections use 100vw, which includes a classic (non-overlay) scrollbar.
  function setScrollbarVar() {
    const sbw = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--sbw', sbw + 'px');
  }

  function paintTextures() {
    islands.forEach((el, i) => {
      const world = WORLDS[i];
      const card = el.querySelector('.island-card');
      if (!world || !card) return;
      let cv = card.querySelector('.island-tex');
      if (!cv) {
        cv = document.createElement('canvas');
        cv.className = 'island-tex';
        cv.setAttribute('aria-hidden', 'true');
        card.insertBefore(cv, card.firstChild);
      }
      const fw = card.clientWidth;
      const fh = card.clientHeight;
      const r = Math.min(window.devicePixelRatio || 1, 2);
      const size = fw + 'x' + fh + '@' + r;
      if (!fw || !fh || texSize[i] === size) return;
      texSize[i] = size;
      cv.width = Math.round(fw * r);
      cv.height = Math.round(fh * r);
      const g = cv.getContext('2d');
      g.setTransform(r, 0, 0, r, 0, 0);
      g.clearRect(0, 0, fw, fh);
      Field.draw(g, world.p, fw, fh, fw < 480 ? 0.75 : 1, 0, world.seed, world.dim, world.pal);
      if (world.scan) {
        // one scanner line across the "monitor"
        g.globalAlpha = 0.16;
        g.fillStyle = world.scan;
        g.fillRect(0, Math.round(fh * 0.36), fw, 2);
        g.globalAlpha = 1;
      }
    });
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
    } else {
      H = window.innerHeight;
      root.style.height = '';
    }
    sectionTop = root.getBoundingClientRect().top + window.scrollY;
    cardH = islands.map((el) => el.offsetHeight);
    cardW = islands.map((el) => el.offsetWidth);
    paintTextures();
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

  // Cards stay fully opaque (a dark card fading over the light page turns into a grey slab):
  // they slide in from below the stage and out above it, the next one passing over the last.
  function place(i, t) {
    const local = t - i * STEP;
    const [rs, re] = restRange(i);
    // The first island is already in place when the stage scrolls into view, so the fold
    // shows a project rather than an empty stage.
    if (i === 0 && local < REST_A) return rs;
    if (local < -40) return null;
    if (local < REST_A) return lerp(H + 24, rs, easeOut(inv(local, -40, REST_A)));
    // The last island stays until the stage unsticks and scrolls away with the page.
    if (local < REST_B || i === LAST) return lerp(rs, re, inv(local, REST_A, REST_B));
    if (local < 120) return lerp(re, -cardH[i] - 80, easeIn(inv(local, REST_B, 120)));
    return null;
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
    const t = clamp((window.scrollY - sectionTop) / pxPerT, T_MIN, T_MAX);
    if (lastT !== null && Math.abs(t - lastT) < 0.01) return;
    lastT = t;

    islands.forEach((el, i) => {
      const local = t - i * STEP;
      const y = place(i, t);
      const shown = y !== null && y < H && y + cardH[i] > -60;
      if (shownState[i] !== shown) {
        el.classList.toggle('is-shown', shown);
        el.style.opacity = shown ? '1' : '0';
        shownState[i] = shown;
      }
      if (shown) {
        el.style.transform = 'translate3d(' + islandLeft(i) + 'px,' + Math.round(y) + 'px,0)';
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

  function render() {
    if (!live) return;
    lastT = null;
    renderLive();
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

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    render();
  });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', setMode);
  root.addEventListener('focusin', onFocusIn);

  // Card heights change with the language toggle and when fonts finish loading; the hero's
  // height moves the section's top.
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      measure();
      render();
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
})();
