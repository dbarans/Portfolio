// Case-study pages (Game of Life, Grave, Luggage Please): small, independent behaviours.
(function () {
  // --- Optional syntax highlighting for the code excerpts. highlight.js loads async from a
  // CDN, so it may arrive before or after this script, or never — the code stays readable as
  // plain text either way.
  function highlight() {
    var hljs = window.hljs;
    if (!hljs) return;
    document.querySelectorAll('.page-case pre code').forEach(function (el) {
      if (el.dataset.highlighted) return;
      try { hljs.highlightElement(el); } catch (e) { /* keep the plain block */ }
    });
  }
  if (window.hljs) {
    highlight();
  } else {
    var tag = document.querySelector('script[data-hljs]');
    if (tag) tag.addEventListener('load', highlight);
  }

  // --- Diagrams scroll sideways only on screens too narrow for their fixed SVG width; only
  // then are they a keyboard stop (their focus ring comes from the page-wide rule).
  var scrollers = Array.prototype.slice.call(document.querySelectorAll('.cs-diagram-scroll'));
  function syncScrollers() {
    scrollers.forEach(function (el) {
      if (el.scrollWidth > el.clientWidth + 1) el.setAttribute('tabindex', '0');
      else el.removeAttribute('tabindex');
    });
  }
  if (scrollers.length) {
    syncScrollers();
    window.addEventListener('resize', syncScrollers);
  }

  // --- A looping <video autoplay> inside a .cs-media-frame must not play under
  // prefers-reduced-motion (an animated WebP/GIF can't be paused this way, hence video).
  function respectReducedMotion() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) return;
    document.querySelectorAll('.cs-media-frame video[autoplay]').forEach(function (v) {
      v.removeAttribute('autoplay');
      v.pause();
      try { v.currentTime = 0; } catch (e) {}
    });
  }
  respectReducedMotion();

  // --- Scroll-scrubbed footage (.cs-scrolly): the scroll position through the section picks
  // which frame of the clip is drawn, so scrolling down plays it forward and scrolling up
  // plays it back. Frames load coarse-to-fine only when the section gets close.
  var header = document.querySelector('.cs-top');
  function setStickyTop() {
    var h = header ? header.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--cs-sticky-top', Math.round(h) + 'px');
  }
  document.querySelectorAll('.cs-scrolly[data-scrub-src]').forEach(function (root) {
    var src = root.getAttribute('data-scrub-src');
    var count = parseInt(root.getAttribute('data-scrub-count'), 10);
    var media = root.querySelector('.cs-scrolly-media');
    var canvas = media && media.querySelector('canvas');
    if (!count || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var frames = new Array(count);
    var drawn = null;
    var started = false;

    function frameUrl(i) { return src + String(i + 1).padStart(3, '0') + '.webp'; }

    function progress() {
      var r = root.getBoundingClientRect();
      var top = parseFloat(getComputedStyle(media).top) || 0;
      var range = r.height - media.offsetHeight;
      if (range <= 0) return 0;
      return Math.min(1, Math.max(0, (top - r.top) / range));
    }

    function nearest(i) {
      for (var d = 0; d < count; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    }

    function render() {
      var img = nearest(Math.round(progress() * (count - 1)));
      if (!img || img === drawn) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawn = img;
      media.classList.add('is-ready');
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

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { render(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', function () { setStickyTop(); drawn = null; render(); });
  });
  setStickyTop();

  // --- YouTube click-to-load facades (Luggage Please): no request to YouTube, and no
  // tracking cookie, until the visitor actually presses play. Each facade is a real <button>
  // with the video's title as its accessible name; on click it's replaced with an iframe
  // pointed at youtube-nocookie.com with autoplay on (a direct, deliberate user action, so
  // autoplaying *with sound* here is fine — unlike the muted background loops elsewhere).
  document.querySelectorAll('.cs-video-btn[data-yt-id]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-yt-id');
      var title = btn.getAttribute('data-yt-title') || 'YouTube video';
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1';
      frame.title = title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      frame.loading = 'lazy';
      var host = btn.parentElement;
      host.innerHTML = '';
      host.appendChild(frame);
    });
  });
})();
