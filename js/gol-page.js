// Game of Life page: the panel's cell field takes a different preset for each section being
// read and eases between them; the section nav follows the reader. Canvas redraws are
// scheduled through one rAF and only happen while something is changing.
(function () {
  const Field = window.CellField;
  const canvas = document.querySelector('.gp-field');
  const sections = Array.from(document.querySelectorAll('.gp-sec[data-preset]'));
  const links = Array.from(document.querySelectorAll('.gp-nav a'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.hljs) {
    document.querySelectorAll('.gp pre code').forEach((el) => window.hljs.highlightElement(el));
  }

  if (!canvas || !Field) return;
  const ctx = canvas.getContext('2d');

  // Brighter than the home page: here the field is the panel's picture, not a backdrop.
  const PAL = ['#1a1a18', '#34342f', '#77766e', '#f2f1ed'];
  const EASE_MS = 700;

  let from = Field.PRESETS[sections[0] ? sections[0].dataset.preset : 'grid'];
  let to = from;
  let startedAt = 0;
  let current = from;
  let w = 0, h = 0, dpr = 1;
  let queued = false;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function frame(now) {
    queued = false;
    let u = 1;
    if (from !== to && !reduceMotion) {
      u = Math.min(1, (now - startedAt) / EASE_MS);
      u = u * u * (3 - 2 * u);
    }
    current = Field.mix(from, to, u);
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

    if (u < 1) request();
    else from = to;
  }

  function request() {
    if (queued) return;
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

  // The section crossing the upper third of the viewport is the one being read.
  function setActive(sec) {
    const id = sec.id;
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    goTo(sec.dataset.preset);
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

  size();
  if (sections[0]) setActive(sections[0]);
  request();
  window.addEventListener('resize', () => { size(); request(); });
  if (!reduceMotion) window.addEventListener('scroll', request, { passive: true });
})();
