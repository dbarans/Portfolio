// Game of Life page: the panel's cell field takes a different preset for each section being
// read and eases between them; the section nav follows the reader. Canvas redraws are
// scheduled through one rAF and only happen while something is changing and the field is
// actually on screen (below 900px the panel is a banner that scrolls away).
(function () {
  // --- Code highlighting: optional. highlight.js loads async from a CDN, so it may arrive
  // before this script, after it, or never; the code stays readable as plain text.
  function highlight() {
    const hljs = window.hljs;
    if (!hljs) return;
    document.querySelectorAll('.gp pre code').forEach((el) => {
      if (el.dataset.highlighted) return;
      try { hljs.highlightElement(el); } catch (e) { /* keep the plain block */ }
    });
  }
  if (window.hljs) highlight();
  else {
    const tag = document.querySelector('script[data-hljs]');
    if (tag) tag.addEventListener('load', highlight);
  }

  const sections = Array.from(document.querySelectorAll('.gp-sec[data-preset]'));
  const links = Array.from(document.querySelectorAll('.gp-nav a'));
  const field = setUpField();

  // --- Section tracking: the section crossing the upper third of the viewport is the one
  // being read. Works without the canvas (e.g. if cellfield.js failed to load).
  function setActive(sec) {
    const href = '#' + sec.id;
    links.forEach((a) => {
      const on = a.getAttribute('href') === href;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (field) field.goTo(sec.dataset.preset);
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target);
        });
      },
      { rootMargin: '-30% 0px -65% 0px' }
    );
    sections.forEach((s) => io.observe(s));
  }
  if (sections[0]) setActive(sections[0]);

  // --- The cell field
  function setUpField() {
    const Field = window.CellField;
    const canvas = document.querySelector('.gp-field');
    const ctx = Field && canvas ? canvas.getContext('2d') : null;
    if (!ctx) return null;

    // Brighter than the home page: here the field is the panel's picture, not a backdrop.
    const PAL = ['#1a1a18', '#34342f', '#77766e', '#f2f1ed'];
    const EASE_MS = 700;
    const motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    let reduceMotion = !!(motion && motion.matches);
    let from = Field.PRESETS[sections[0] ? sections[0].dataset.preset : 'grid'] || Field.PRESETS.grid;
    let to = from;
    let current = from;
    let startedAt = 0;
    let w = 0, h = 0, dpr = 1;
    let queued = false;
    let onScreen = true;

    // Returns true when the backing store changed (which also clears it).
    function size() {
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = canvas.clientWidth, nh = canvas.clientHeight;
      if (nw === w && nh === h && nextDpr === dpr) return false;
      w = nw; h = nh; dpr = nextDpr;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      return true;
    }

    function render(now) {
      let u = 1;
      if (from !== to && !reduceMotion) {
        u = Math.min(1, (now - startedAt) / EASE_MS);
        u = u * u * (3 - 2 * u);
      }
      current = Field.mix(from, to, u);
      if (u >= 1) from = to;
      if (!w || !h) return u;

      const drift = reduceMotion ? 0 : -window.scrollY * 0.22;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#070708';
      ctx.fillRect(0, 0, w, h);
      Field.draw(ctx, current, w, h, 1.2, drift * 0.5, 991, 1, PAL); // far, dim
      Field.draw(ctx, current, w, h, 0.72, drift, 7, 0, PAL); // near, smaller and denser
      if (current.band > 0.01) {
        ctx.globalAlpha = current.band * 0.6;
        ctx.fillStyle = '#e8452b';
        ctx.fillRect(0, Math.round((window.scrollY * 0.35) % h), w, 2);
        ctx.globalAlpha = 1;
      }
      return u;
    }

    function frame(now) {
      queued = false;
      if (!onScreen) return; // picked up again when the field scrolls back into view
      if (render(now) < 1) request();
    }

    function request() {
      if (queued || !onScreen) return;
      queued = true;
      window.requestAnimationFrame(frame);
    }

    function goTo(name) {
      const next = Field.PRESETS[name];
      if (!next || next === to) return;
      from = current;
      to = next;
      startedAt = performance.now();
      request();
    }

    // Resizing clears the canvas, so repaint in the same frame rather than flash empty.
    function onResize() {
      if (size() && onScreen) render(performance.now());
      request();
    }

    size();
    request();

    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(canvas);
    window.addEventListener('resize', onResize); // also catches devicePixelRatio changes
    window.addEventListener('scroll', () => { if (!reduceMotion) request(); }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        if (onScreen) request();
      }).observe(canvas);
    }

    if (motion) {
      const onMotion = () => { reduceMotion = motion.matches; request(); };
      if (motion.addEventListener) motion.addEventListener('change', onMotion);
      else if (motion.addListener) motion.addListener(onMotion);
    }

    return { goTo: goTo };
  }
})();
