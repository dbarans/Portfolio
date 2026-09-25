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

  // --- Media slots are placeholders today, but once a real <video autoplay> lands inside a
  // .cs-media-frame, prefers-reduced-motion must stop it from playing (an animated WebP/GIF
  // can't be paused this way — see the HTML comment by each slot). No-op until then.
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
