// Home page: warms the browser cache with the case studies' footage, so a visitor who opens one
// finds its first chapter already downloaded and it plays without waiting for frames.
//
// What a card names (data-prefetch-base, data-prefetch-chapters, optionally data-prefetch-extra:
// small per-chapter files such as Game of Life's manifest.json) is fetched at low priority, two
// files at a time, once the page has loaded and the browser is idle, and only while the tab is
// visible. The URLs are exactly the ones js/footage.js and js/frame-stream.js ask for later
// (the chapter index script, then its images with ?v=<version>), so they come from the cache.
//
// How much: on a desktop the whole first chapter of each case study, and on hovering or focusing
// a card the start of its second chapter too. On a phone only the opening of each first chapter,
// since the data is the visitor's. Nothing at all under data saver or on a 2G connection (the same
// rule as js/footage.js, which then doesn't play the footage either).
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-prefetch-chapters]'));
  if (!cards.length || !window.fetch || !window.Promise) return;

  var conn = navigator.connection;
  if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return;

  var roomy = window.matchMedia && window.matchMedia('(min-width: 960px) and (pointer: fine)').matches;
  var FIRST_BUDGET = roomy ? Infinity : 1.5e6; // bytes of each first chapter
  var INTENT_BUDGET = 8e6;                     // bytes of a second chapter, on hover or focus (desktop)
  var PARALLEL = 2;

  // The chapter index sets window.STREAMS[name], as on the case-study pages.
  var streams = {};
  function loadStream(base, name) {
    if (!streams[name]) {
      streams[name] = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = base + 'stream-' + name + '.js';
        script.async = true;
        script.onload = function () { resolve(window.STREAMS && window.STREAMS[name]); };
        script.onerror = function () { script.remove(); reject(new Error('no footage index: ' + name)); };
        document.head.appendChild(script);
      });
    }
    return streams[name];
  }

  var queue = [];
  var queued = {};
  var running = 0;
  function enqueue(url, first) {
    if (queued[url]) return;
    queued[url] = true;
    if (first) queue.unshift(url); else queue.push(url);
    pump();
  }
  function pump() {
    while (running < PARALLEL && queue.length && !document.hidden) {
      var url = queue.shift();
      running++;
      // The body has to be read for the response to finish landing in the cache.
      fetch(url, { priority: 'low' })
        .then(function (r) { return r.ok ? r.blob() : null; })
        .catch(function () { /* a miss only means the page loads it itself later */ })
        .then(function () { running--; pump(); });
    }
  }
  document.addEventListener('visibilitychange', pump);

  function warm(card, index, budget, first) {
    var base = card.getAttribute('data-prefetch-base');
    var name = card.getAttribute('data-prefetch-chapters').split(/\s+/)[index];
    if (!base || !name) return;
    loadStream(base, name).then(function (stream) {
      if (!stream || !stream.images) return;
      var folder = base + name + '/';
      (card.getAttribute('data-prefetch-extra') || '').split(/\s+/).forEach(function (file) {
        if (file) enqueue(folder + file, first);
      });
      var version = stream.version ? '?v=' + stream.version : '';
      var sizes = stream.sizes || [];
      var bytes = 0;
      // The images are numbered in the order the frames first need them: the opening comes first.
      var urls = [];
      for (var i = 0; i < stream.images.length && bytes < budget; i++) {
        urls.push(folder + stream.images[i] + version);
        bytes += sizes[i] || 0;
      }
      if (first) urls.reverse(); // unshifted one by one, so they end up in order at the front
      urls.forEach(function (url) { enqueue(url, first); });
    }).catch(function () {});
  }

  function start() {
    cards.forEach(function (card) { warm(card, 0, FIRST_BUDGET, false); });
    if (!roomy) return;
    // A visitor heading for a case study: its second chapter next, ahead of the rest of the queue.
    cards.forEach(function (card) {
      var once = function () {
        card.removeEventListener('pointerenter', once);
        card.removeEventListener('focusin', once);
        warm(card, 1, INTENT_BUDGET, true);
      };
      card.addEventListener('pointerenter', once);
      card.addEventListener('focusin', once);
    });
  }

  function whenIdle() {
    if (window.requestIdleCallback) window.requestIdleCallback(start, { timeout: 3000 });
    else setTimeout(start, 1500);
  }
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle);
})();
