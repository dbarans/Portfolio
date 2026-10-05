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
    document.querySelectorAll('.cs-media-frame video').forEach(function (v) {
      v.removeAttribute('autoplay');
      v.pause();
      // A data-still picked for reduced motion replaces the poster; reloading brings the poster
      // back even if playback had already started.
      var still = v.getAttribute('data-still');
      if (still) {
        v.poster = still;
        v.load();
        return;
      }
      try { v.currentTime = 0; } catch (e) {}
    });
  }
  respectReducedMotion();

  // --- Looping videos play only while on screen (a threshold of a quarter of the frame), and
  // every one has a pause/play button (hidden by CSS under reduced motion, where nothing plays).
  // A video the reader paused stays paused until they press play. The hero video starts on its
  // own autoplay; the others have no autoplay and are started here.
  (function loopingVideos() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    var videos = Array.prototype.slice.call(document.querySelectorAll('.cs-media-frame video'));
    if (!videos.length) return;
    var userPaused = new WeakMap();
    function play(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    videos.forEach(function (v) {
      var frame = v.closest('.cs-media-frame');
      var btn = frame && frame.querySelector('.cs-media-pause');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var pause = !userPaused.get(v);
        userPaused.set(v, pause);
        btn.classList.toggle('is-paused', pause);
        if (pause) v.pause(); else play(v);
      });
    });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (!e.isIntersecting) v.pause();
        else if (!userPaused.get(v)) play(v);
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { io.observe(v); });
  })();

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
      frame.focus();
    });
  });
  // --- Folded panels (the Game of Life rules): a toggle in the hero opens a full-width panel
  // below it. The panel is only hidden here, so without JS it simply stays open.
  document.querySelectorAll('[aria-controls].cs-primer-toggle').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    panel.hidden = true;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
      // On a phone the panel opens below the hero footage, out of sight: bring it up.
      if (open && panel.getBoundingClientRect().top > window.innerHeight * 0.75) panel.scrollIntoView({ block: 'start' });
    });
  });

  // --- Section rail (.cs-rail): lights the part of the page on screen, the one whose top has
  // passed a line a third of the way down the window; the parts above it read as passed.
  var railLinks = Array.prototype.slice.call(document.querySelectorAll('.cs-rail a'));
  var railParts = railLinks.map(function (a) {
    return document.getElementById((a.getAttribute('href') || '').slice(1));
  });
  if (railLinks.length && railParts.every(Boolean)) {
    var railActive = -1;
    var railQueued = false;
    var syncRail = function () {
      railQueued = false;
      var line = window.innerHeight / 3;
      var at = 0;
      railParts.forEach(function (el, i) { if (el.getBoundingClientRect().top <= line) at = i; });
      // At the very bottom the last part may never reach the line: it is still the one on screen.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) at = railParts.length - 1;
      if (at === railActive) return;
      railActive = at;
      railLinks.forEach(function (a, i) {
        a.classList.toggle('is-active', i === at);
        a.classList.toggle('is-past', i < at);
        if (i === at) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    var queueRail = function () {
      if (railQueued) return;
      railQueued = true;
      requestAnimationFrame(syncRail);
    };
    window.addEventListener('scroll', queueRail, { passive: true });
    window.addEventListener('resize', queueRail);
    syncRail();
  }
})();
