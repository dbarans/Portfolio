// Cinematic-scroll home page (design-lab draft): small, independent behaviours.
// Plain vanilla JS, no dependencies. Everything here is progressive enhancement —
// without JS the poster images and static layout already show all content.
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Header: transparent over the hero, solid once the page has scrolled a bit,
  // so nav text stays readable over whatever footage is behind it either way
  // (the gradient handles the transparent state).
  var header = document.getElementById('cin-header');
  function syncHeader() {
    if (!header) return;
    if ((window.scrollY || document.documentElement.scrollTop) > 40) {
      header.classList.add('is-solid');
    } else {
      header.classList.remove('is-solid');
    }
  }

  // --- Chapters 01 (Game of Life) and 03 (Luggage Please): a subtle scroll-driven
  // scale, peaking while the chapter is centred in the viewport. Skipped entirely
  // under prefers-reduced-motion, per the hard rule — the image then just sits at
  // its default, unscaled size (--focus defaults to 0 in the CSS).
  var scaleEls = reduceMotion ? [] : Array.prototype.slice.call(document.querySelectorAll('.cin-scale'));

  function updateScale() {
    var vh = window.innerHeight;
    var center = vh / 2;
    scaleEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var elCenter = rect.top + rect.height / 2;
      var maxDist = center + rect.height / 2;
      var dist = Math.abs(center - elCenter);
      var focus = maxDist > 0 ? Math.max(0, 1 - dist / maxDist) : 0;
      el.style.setProperty('--focus', focus.toFixed(3));
    });
  }

  // --- Chapter 02 (Grave): the scroll position through the extra-tall wrapper
  // (.cin-pinwrap) picks which of the 112 real gameplay frames is drawn into the
  // canvas, exactly like the scrub on grave.html's own case-study page. Frames
  // load lazily and coarse-to-fine once the chapter is nearly in view.
  document.querySelectorAll('.cin-pinwrap[data-scrub-src]').forEach(function (root) {
    var src = root.getAttribute('data-scrub-src');
    var count = parseInt(root.getAttribute('data-scrub-count'), 10);
    var pin = root.querySelector('.cin-pin');
    var canvas = root.querySelector('.cin-scrub-canvas');
    if (!count || !pin || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var frames = new Array(count);
    var drawn = null;
    var started = false;

    function frameUrl(i) { return src + String(i + 1).padStart(3, '0') + '.webp'; }

    function progress() {
      var r = root.getBoundingClientRect();
      var range = r.height - pin.offsetHeight;
      if (range <= 0) return 0;
      return Math.min(1, Math.max(0, -r.top / range));
    }

    function nearest(i) {
      for (var d = 0; d < count; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    }

    // Crop-to-cover: draw the 800x600 frame into the canvas's own pixel size
    // (kept in sync with its on-screen box) so it fills the viewport like the
    // key art / logo layers, instead of stretching or letterboxing.
    function drawCover(img) {
      var cw = canvas.width, ch = canvas.height;
      var iw = img.naturalWidth || 800, ih = img.naturalHeight || 600;
      var scale = Math.max(cw / iw, ch / ih);
      var dw = iw * scale, dh = ih * scale;
      var dx = (cw - dw) / 2, dy = (ch - dh) * 0.35; // matches object-position: center 35%
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function render() {
      var img = nearest(Math.round(progress() * (count - 1)));
      if (!img || img === drawn) return;
      drawCover(img);
      drawn = img;
      root.classList.add('is-ready');
    }

    function resizeCanvas() {
      var box = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(box.width * dpr));
      canvas.height = Math.max(1, Math.round(box.height * dpr));
      drawn = null;
      render();
    }

    function load() {
      if (started) return;
      started = true;
      var queued = {};
      [16, 4, 1].forEach(function (step) {
        for (var i = 0; i < count; i += step) {
          if (queued[i]) continue;
          queued[i] = true;
          (function (i) {
            var img = new Image();
            img.decoding = 'async';
            img.onload = function () { frames[i] = img; render(); };
            img.src = frameUrl(i);
          })(i);
        }
      });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        if (entries.some(function (e) { return e.isIntersecting; })) { load(); obs.disconnect(); }
      }, { rootMargin: '150% 0px' }).observe(root);
    } else {
      load();
    }

    resizeCanvas();
    window.addEventListener('resize', function () {
      resizeCanvas();
    });

    // Exposed so the shared scroll loop below can re-render this scrubber too.
    root.__cinRender = render;
  });

  var scrubRoots = Array.prototype.slice.call(document.querySelectorAll('.cin-pinwrap[data-scrub-src]'));

  // --- One shared, rAF-throttled scroll loop for both behaviours above. The
  // scrub is left running even under prefers-reduced-motion: it only ever
  // moves in direct response to the visitor's own scroll (never on its own),
  // so it's kept as the more useful, still fully user-driven alternative to a
  // frozen poster frame; the scale/parallax effect, which plays out on its
  // own as the page scrolls, is the part switched off instead.
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      if (scaleEls.length) updateScale();
      scrubRoots.forEach(function (r) { if (r.__cinRender) r.__cinRender(); });
      syncHeader();
      ticking = false;
    });
  }

  syncHeader();
  if (scaleEls.length) updateScale();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();
