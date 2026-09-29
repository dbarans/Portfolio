// Grave: every system plays its recorded chapter of the game (images/grave/footage/, drawn by
// js/frame-stream.js) in a game view pinned beside its text. The scroll position picks the
// frame: scrolling down plays it forward, scrolling up plays it back. The write-up scrolls by
// over the chapter's opening frame; then each step of the chapter plays over its own step in
// the text, which is as tall as its share of the frames (css/case-study.css), so the pace
// stays even and the step being read is the one on screen.
(function () {
  var roots = Array.prototype.slice.call(document.querySelectorAll('.cs-scrolly[data-footage]'));
  // FrameStream is a class declaration, so a global binding but not a property of window.
  if (!roots.length || typeof FrameStream === 'undefined' || !window.Promise) return;

  var BASE = 'images/grave/footage/';
  var stacked = window.matchMedia('(max-width: 959px)');

  // The view pins right under the sticky top bar, whose height depends on the wrap; on a
  // phone the steps' text pins right under the view.
  var header = document.querySelector('.cs-top');
  var firstMedia = roots[0].querySelector('.cs-scrolly-media');
  function setStickyTop() {
    var h = header ? header.getBoundingClientRect().height : 0;
    var style = document.documentElement.style;
    style.setProperty('--cs-sticky-top', Math.round(h) + 'px');
    style.setProperty('--cs-view-bottom', Math.round(h + firstMedia.offsetHeight) + 'px');
  }
  setStickyTop();

  // A chapter's index (its frames, patches, phases and camera track) is a small script that
  // sets window.STREAMS[name]; it is asked for once, however many times it is opened.
  var streams = {};
  function loadStream(name) {
    if (!streams[name]) {
      streams[name] = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = BASE + 'stream-' + name + '.js';
        script.onload = function () { resolve(window.STREAMS[name]); };
        script.onerror = function () {
          delete streams[name];
          script.remove();
          reject(new Error('Footage index missing: ' + name));
        };
        document.head.appendChild(script);
      });
    }
    return streams[name];
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function Footage(root) {
    this.root = root;
    this.name = root.getAttribute('data-footage');
    this.camera = JSON.parse(root.getAttribute('data-camera') || '{}');
    this.media = root.querySelector('.cs-scrolly-media');
    this.canvas = root.querySelector('canvas');
    this.steps = Array.prototype.slice.call(root.querySelectorAll('.cs-step'));
    this.count = root.querySelector('.cs-scrolly-count');
    this.bar = root.querySelector('.cs-scrolly-bar i');
    this.loadBar = root.querySelector('.cs-scrolly-load i');
    this.player = null;
    this.ready = false;
    this.active = null;
    this.session = 0; // bumped on every open and close, so a late load can tell it is stale
  }

  // Loads the chapter and starts drawing once its first quarter can be drawn; the rest loads
  // while the reader scrolls, and the loading bar shows only if they get ahead of it.
  Footage.prototype.open = function () {
    if (this.player || this.opening) return;
    var self = this;
    var session = ++this.session;
    this.opening = true;
    loadStream(this.name).then(function (stream) {
      if (session !== self.session) return;
      var player = new FrameStream(self.canvas, stream, BASE + stream.chapter + '/', self.camera);
      self.player = player;
      self.frames = stream.frames.length;

      // Each step runs from the first frame of its phases to the frame before the next step's.
      var firsts = [];
      self.steps.forEach(function (step, i) {
        var names = step.getAttribute('data-phases').split(' ');
        var own = stream.phases.filter(function (p) { return names.indexOf(p.name) >= 0; });
        firsts.push(own.length ? Math.min.apply(null, own.map(function (p) { return p.first - 1; }))
                               : (i ? firsts[i - 1] : 0));
      });
      self.ranges = firsts.map(function (first, i) {
        return [first, i + 1 < firsts.length ? Math.max(first, firsts[i + 1] - 1) : self.frames - 1];
      });

      var startAt = Math.ceil(self.frames / 4);
      return player.load(function (loaded, playable) {
        if (session !== self.session) return;
        self.loadBar.style.width = (100 * playable / self.frames) + '%';
        if (!self.ready && playable >= startAt) {
          self.ready = true;
          self.root.classList.add('is-ready');
          setStickyTop(); // the top bar may have rewrapped once the web fonts came in
        }
        self.render();
      });
    }).then(function () {
      if (session === self.session) self.opening = false;
    }, function () {
      // No footage (offline, a missing file): the poster and the steps still tell it.
      if (session === self.session) self.close();
    });
  };

  // Lets go of a chapter far from the reader, so the decoded frames of all four never have
  // to be held at once; coming back reloads it from the browser's cache.
  Footage.prototype.close = function () {
    this.session++;
    this.opening = false;
    this.player = null;
    this.ready = false;
    this.active = null;
    this.root.classList.remove('is-ready', 'is-waiting', 'is-playing');
    this.steps.forEach(function (step) { step.classList.remove('is-active'); });
  };

  // The reading line: mid-screen beside the view; on a phone, a little way into the text
  // showing under the pinned view.
  Footage.prototype.readingLine = function () {
    if (!stacked.matches) return window.innerHeight * 0.5;
    var bottom = this.media.getBoundingClientRect().bottom;
    return bottom + (window.innerHeight - bottom) * 0.3;
  };

  Footage.prototype.render = function () {
    if (!this.ready) return;
    var line = this.readingLine();
    var active = -1;
    var through = 0;
    for (var i = 0; i < this.steps.length; i++) {
      var rect = this.steps[i].getBoundingClientRect();
      if (rect.top > line) break;
      active = i;
      through = Math.min(1, (line - rect.top) / rect.height);
    }

    var frame = 0;
    if (active >= 0) {
      var range = this.ranges[active];
      frame = Math.round(range[0] + through * (range[1] - range[0]));
    }
    // Scrolled past what has loaded: the last frame in, and the loading bar, until the rest comes.
    var shown = Math.min(frame, this.player.playable - 1);
    this.player.show(shown);
    this.root.classList.toggle('is-waiting', frame > shown);
    this.root.classList.toggle('is-playing', active >= 0);
    this.bar.style.width = (100 * frame / (this.frames - 1)) + '%';

    if (active !== this.active) {
      this.active = active;
      this.steps.forEach(function (step, i) { step.classList.toggle('is-active', i === active); });
      this.count.textContent = pad(Math.max(active, 0) + 1) + ' / ' + pad(this.steps.length);
    }
  };

  var footage = roots.map(function (root) { return new Footage(root); });

  function renderAll() {
    footage.forEach(function (f) { f.render(); });
  }

  if ('IntersectionObserver' in window) {
    // Opened a screen before it comes into view, closed once three screens away.
    var near = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) footage[roots.indexOf(e.target)].open(); });
    }, { rootMargin: '100% 0px' });
    var far = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (!e.isIntersecting) footage[roots.indexOf(e.target)].close(); });
    }, { rootMargin: '300% 0px' });
    roots.forEach(function (root) { near.observe(root); far.observe(root); });
  } else {
    footage.forEach(function (f) { f.open(); });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; renderAll(); });
  }, { passive: true });
  window.addEventListener('resize', function () { setStickyTop(); renderAll(); });
})();
