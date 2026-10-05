// Case-study footage: a system with a recorded chapter of its game plays it (from the folder
// in data-footage-base, drawn by js/frame-stream.js) in a game view pinned beside its text. The write-up scrolls by over the
// chapter's opening frame; then the steps take one screen each, and one scroll moves exactly
// one step (scroll snapping, on only while the steps are being read). The step reached plays
// its stage of the footage at the game's own pace; scrolling back rewinds it.
(function () {
  var roots = Array.prototype.slice.call(document.querySelectorAll('.cs-scrolly[data-footage]'));
  // FrameStream is a class declaration, so a global binding but not a property of window.
  if (!roots.length || typeof FrameStream === 'undefined' || !window.Promise) return;

  var CATCH_UP = 4; // speed through what is left of a stage the reader scrolled on from
  var REWIND = 3;   // speed back through a stage when scrolling up
  var MAX_BOOST = 4; // a scroll on while a step still plays doubles its speed, up to this
  var stacked = window.matchMedia('(max-width: 959px)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The view pins right under the sticky top bar, whose height depends on the wrap; on a
  // phone the steps start right under the view.
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
  // sets window.STREAMS[name]; it is asked for once, however many times it is opened. It
  // carries this script's ?v= so a cached index never meets re-encoded images of the same name
  // (bump that version whenever the footage is re-encoded).
  var streams = {};
  var version = /[?&]v=([^&]+)/.exec(document.currentScript ? document.currentScript.src : '');
  function loadStream(base, name) {
    if (!streams[name]) {
      streams[name] = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = base + 'stream-' + name + '.js' + (version ? '?v=' + version[1] : '');
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

  function edge(kind) {
    var el = document.createElement('div');
    el.className = 'cs-steps-edge cs-steps-edge--' + kind;
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  function Footage(root) {
    this.root = root;
    this.name = root.getAttribute('data-footage');
    this.base = root.getAttribute('data-footage-base');
    this.camera = JSON.parse(root.getAttribute('data-camera') || '{}');
    this.media = root.querySelector('.cs-scrolly-media');
    this.canvas = root.querySelector('canvas');
    this.steps = Array.prototype.slice.call(root.querySelectorAll('.cs-step'));
    this.count = root.querySelector('.cs-scrolly-count');
    this.bar = root.querySelector('.cs-scrolly-bar i');
    this.loadBar = root.querySelector('.cs-scrolly-load i');

    // Snap stops just before and after the steps: scrolling past either end leaves them.
    var list = root.querySelector('.cs-steps');
    var label = root.querySelector('.cs-steps-label');
    (label || list).parentNode.insertBefore(edge('start'), label || list);
    this.end = edge('end');
    list.parentNode.insertBefore(this.end, list.nextSibling);

    this.player = null;
    this.ready = false;
    this.stage = -1;   // the step being read: -1 before the first
    this.current = 0;  // frame on the canvas
    this.target = 0;   // frame the step being read ends on
    this.running = false;
    this.boost = 1;    // the step's speed, doubled by each scroll on while it still plays
    this.session = 0;  // bumped on every open and close, so a late load can tell it is stale
    this.tick = this.tick.bind(this);
  }

  // Loads the chapter and starts playing once its first quarter (and at least its first
  // stage) can be drawn; the rest loads while it plays, and the loading bar shows only if
  // the reader gets ahead of it.
  Footage.prototype.open = function () {
    if (this.player || this.opening) return;
    var self = this;
    var session = ++this.session;
    this.opening = true;
    loadStream(this.base, this.name).then(function (stream) {
      if (session !== self.session) return;
      var player = new FrameStream(self.canvas, stream, self.base + stream.chapter + '/', self.camera);
      self.player = player;
      self.frames = stream.frames.length;
      self.fps = stream.fps || 30;

      // Each step plays from the first frame of its phases to the frame before the next
      // step's; one that ends in a fade to the next (data-rest frames) stops before it.
      var firsts = [];
      self.steps.forEach(function (step, i) {
        var names = step.getAttribute('data-phases').split(' ');
        var own = stream.phases.filter(function (p) { return names.indexOf(p.name) >= 0; });
        firsts.push(own.length ? Math.min.apply(null, own.map(function (p) { return p.first - 1; }))
                               : (i ? firsts[i - 1] : 0));
      });
      self.ranges = firsts.map(function (first, i) {
        var last = i + 1 < firsts.length ? Math.max(first, firsts[i + 1] - 1) : self.frames - 1;
        var rest = parseInt(self.steps[i].getAttribute('data-rest'), 10) || 0;
        return { first: first, hold: Math.max(first, last - rest) };
      });
      // The stage of every frame, for telling which stage the canvas is in.
      self.stageOf = new Int16Array(self.frames);
      self.ranges.forEach(function (r, i) {
        var begin = i > 0 ? Math.min(r.first, self.ranges[i - 1].hold + 1) : r.first;
        for (var f = begin; f < self.frames; f++) self.stageOf[f] = i;
      });

      // A frame left waiting for its images to decode is drawn once they are in.
      player.onImage = function () { if (self.ready && self.player === player) self.draw(); };

      var startAt = Math.min(self.frames, Math.max(self.ranges[0].hold + 1, Math.ceil(self.frames / 4)));
      return player.load(function (loaded, playable) {
        if (session !== self.session) return;
        self.loadBar.style.width = (100 * playable / self.frames) + '%';
        if (!self.ready && playable >= startAt) {
          self.ready = true;
          self.root.classList.add('is-ready');
          setStickyTop(); // the top bar may have rewrapped once the web fonts came in
          self.current = 0;
          self.stage = -2; // force the step to be read again
          self.update();
          self.draw();
        }
        if (self.ready) self.start();
      });
    }).then(function () {
      if (session === self.session) self.opening = false;
    }, function () {
      // No footage (offline, a missing file): the poster and the steps still tell it.
      if (session === self.session) {
        self.close();
        self.root.classList.add('is-static'); // it will not play: the steps stop being a screen each
      }
    });
  };

  // Lets go of a chapter far from the reader, so the decoded frames of all four never have
  // to be held at once; coming back reloads it from the browser's cache.
  Footage.prototype.close = function () {
    this.session++;
    this.opening = false;
    if (this.player && this.player.dispose) this.player.dispose();
    this.player = null;
    this.ready = false;
    this.running = false;
    this.stage = -1;
    this.current = 0;
    this.root.classList.remove('is-ready', 'is-waiting', 'is-playing');
    this.steps.forEach(function (step) { step.classList.remove('is-active'); });
    this.root.dispatchEvent(new CustomEvent('footage:close'));
  };

  // The reading line: a step is being read once its top has come up to it.
  Footage.prototype.readingLine = function () {
    if (!stacked.matches) return window.innerHeight * 0.5;
    var bottom = this.media.getBoundingClientRect().bottom;
    return bottom + (window.innerHeight - bottom) * 0.3;
  };

  // Where the reader is: before the steps, in one of them, or past them. Snapping is on only
  // between the first step and the edge after the last.
  Footage.prototype.inSteps = function () {
    if (!this.ready) return false; // no footage playing (not loaded, data saver, an error): no snapping
    var line = this.readingLine();
    return this.steps[0].getBoundingClientRect().top <= line + 1 &&
           this.end.getBoundingClientRect().top > line;
  };

  // Where a step comes to rest: its snap margin below the top of the screen.
  Footage.prototype.restTop = function () {
    return parseFloat(getComputedStyle(this.steps[0]).scrollMarginTop) || 0;
  };

  // From the first step reaching the reading line to the rest just past the last step: the
  // stretch over which a wheel gesture or a key moves one step.
  Footage.prototype.inZone = function () {
    if (!this.ready) return false; // the wheel and keys are the page's own until the footage is ready
    return this.steps[0].getBoundingClientRect().top <= this.readingLine() + 1 &&
           this.end.getBoundingClientRect().top >= this.restTop() - 2;
  };

  Footage.prototype.update = function () {
    var line = this.readingLine();
    var stage = -1;
    for (var i = 0; i < this.steps.length; i++) {
      if (this.steps[i].getBoundingClientRect().top > line + 1) break;
      stage = i;
    }
    if (stage === this.stage) return;
    this.stage = stage;
    this.boost = 1;
    this.steps.forEach(function (step, i) { step.classList.toggle('is-active', i === stage); });
    this.showCount();
    this.root.classList.toggle('is-playing', stage >= 0);
    if (!this.ready) return;
    this.target = stage < 0 ? 0 : this.ranges[stage].hold;
    if (reducedMotion.matches) this.current = this.target;
    this.start();
  };

  Footage.prototype.showCount = function () {
    this.count.textContent = pad(Math.max(this.stage, 0) + 1) + ' / ' + pad(this.steps.length) +
                             (this.boost > 1 ? ' · ×' + this.boost : '');
  };

  // A scroll on while the step being read is still playing: it plays faster (2x, then 4x)
  // rather than giving way to the next step. False once it has played out (or is at the
  // fastest), when the scroll moves on as usual.
  Footage.prototype.speedUp = function () {
    if (!this.ready || this.stage < 0 || this.boost >= MAX_BOOST || reducedMotion.matches) return false;
    var end = Math.min(this.target, this.player.playable - 1);
    if (this.target <= this.current || end - this.current < this.fps / 3) return false;
    this.boost *= 2;
    this.showCount();
    this.start();
    return true;
  };

  Footage.prototype.start = function () {
    if (this.running || !this.ready) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  };

  Footage.prototype.tick = function (now) {
    if (!this.ready) { this.running = false; return; }
    var stage = this.stage;
    // A jump of more than one step (the scrollbar, a link) skips to the step it lands on
    // rather than replaying everything in between.
    var at = this.stageOf[this.current];
    if (stage >= 0 && this.target > this.current && at < stage - 1)
      this.current = Math.min(this.ranges[stage].first, this.player.playable - 1);
    if (this.target < this.current && at > stage + 1) this.current = this.target;

    // Playing stops at the last frame loaded and goes on when more come in (see open).
    var remaining = Math.min(this.target, this.player.playable - 1) - this.current;
    if (remaining === 0) {
      this.running = false;
      if (this.boost > 1 && this.current >= this.target) {
        this.boost = 1;
        this.showCount();
      }
      this.draw();
      return;
    }
    // Forward, the step reached plays at the game's pace, after a quick run through what is
    // left of the one before it; back, it rewinds faster.
    var speed = remaining < 0 ? REWIND : at < stage ? Math.max(CATCH_UP, this.boost) : this.boost;
    var frames = Math.floor((now - this.last) / 1000 * this.fps * speed);
    if (frames > 0) {
      this.last += frames / (this.fps * speed) * 1000;
      this.current += (remaining > 0 ? 1 : -1) * Math.min(Math.abs(remaining), frames);
      this.draw();
    }
    requestAnimationFrame(this.tick);
  };

  // Every frame drawn is announced on the chapter's root ("footage:frame", detail.frame counted
  // from 0), for a page that draws its own overlays over the footage.
  Footage.prototype.draw = function () {
    this.player.show(this.current);
    this.root.dispatchEvent(new CustomEvent('footage:frame', { detail: { frame: this.current } }));
    this.root.classList.toggle('is-waiting', this.target > this.player.playable - 1 &&
                                             this.current >= this.player.playable - 1);
    this.bar.style.width = (100 * this.current / (this.frames - 1)) + '%';
  };

  var footage = roots.map(function (root) { return new Footage(root); });
  var lockedUntil = 0; // while a move to a step is under way; a gesture meanwhile waits for it

  // Snapping on the whole page only while some chapter's steps are being read, so the rest
  // of the page scrolls freely.
  var html = document.documentElement;
  var lastY = window.scrollY;
  function onScroll() {
    var snapping = null;
    footage.forEach(function (f) {
      f.update();
      if (!snapping && f.inSteps()) snapping = f;
    });
    var up = window.scrollY < lastY;
    lastY = window.scrollY;
    if (html.classList.contains('cs-snap') === !!snapping) return;
    html.classList.toggle('cs-snap', !!snapping);
    // Coming back up into the steps, the nearest snap stop would be the one just past them,
    // which would push the reader back out: go to the last step instead.
    if (snapping && up) {
      var last = snapping.steps[snapping.steps.length - 1];
      window.scrollTo({ top: window.scrollY + last.getBoundingClientRect().top - snapping.restTop(),
                        behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      lockedUntil = performance.now() + 650;
    }
  }

  // Data saver or a 2G connection: the footage is not started (the poster and the steps tell it,
  // as when the network fails). The skip link and the rest of the page work as before.
  var conn = navigator.connection;
  var lean = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));

  if (lean) {
    // nothing to load; the steps read as plain text
    roots.forEach(function (root) { root.classList.add('is-static'); });
  } else if ('IntersectionObserver' in window) {
    // Opened a screen before it comes into view (a third of one on a phone, to spare its data),
    // closed once three screens away.
    var near = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) footage[roots.indexOf(e.target)].open(); });
    }, { rootMargin: stacked.matches ? '30% 0px' : '100% 0px' });
    var far = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (!e.isIntersecting) footage[roots.indexOf(e.target)].close(); });
    }, { rootMargin: '300% 0px' });
    roots.forEach(function (root) { near.observe(root); far.observe(root); });
  } else {
    footage.forEach(function (f) { f.open(); });
  }

  // One wheel gesture or key press, one step. CSS snapping alone lets a wheel notch fall back
  // to the step it left, so while the steps are read the page takes the wheel and the keys and
  // scrolls to the next or previous step itself. Touch keeps the browser's own snapping. While
  // the step reached is still playing, scrolling on speeds it up first (speedUp). A gesture
  // made while a move is under way is not lost: it follows once the move is over.
  //
  // A gesture is a run of wheel events: a trackpad's swipe with its inertia, or a mouse whose
  // driver smooths every notch into a run of shrinking events lasting a second or more. A new
  // gesture starts after a pause in the events, when they turn round, or when they jump well
  // above the last few after dying down (the next notch turned, or a new swipe, while the last
  // one's run is still trailing off). A trackpad's inertia is uneven (20, 36, 17, 25, ...), so
  // only a clear jump counts, and a stray tiny event the other way does not.
  //
  // Such runs often come uncancelable: the browser scrolls by them whatever the page does. So
  // the page cannot take the gesture; it puts up a wall instead, a place the gesture's scroll
  // is held at however hard the swipe (the page stops scrolling until the gesture is over, see
  // html.cs-hold; scrolling it back each time would make it shake): the next step (one gesture, one step, and a gesture that
  // stops short of it is carried on to it), or, coming down the page, the next place to stop
  // and read: the top of a part of the page (a system, the takeaway: the section rail's stops),
  // the start of a chapter, where its view pins beside the write-up, or its first step. So a
  // hard swipe does not fly past a heading, the start of the footage or into its steps. A place
  // less than a seventh of a screen away does not count: stopping there would feel stuck.
  function stepFrom(f, dir) {
    var offset = f.restTop();
    var targets = f.steps.concat([f.end]);
    var i, top;
    if (dir > 0) {
      for (i = 0; i < targets.length; i++) {
        top = targets[i].getBoundingClientRect().top;
        if (top > offset + 2) return window.scrollY + top - offset;
      }
      return null;
    }
    for (i = f.steps.length - 1; i >= 0; i--) {
      top = f.steps[i].getBoundingClientRect().top;
      if (top < offset - 2) return window.scrollY + top - offset;
    }
    // Before the first step: back to where the steps start to come into view.
    var start = f.root.querySelector('.cs-steps-edge--start').getBoundingClientRect();
    return window.scrollY + start.bottom - window.innerHeight;
  }
  var queued = null;
  function reading() {
    var found = null;
    footage.forEach(function (f) { if (!found && f.inZone()) found = f; });
    return found;
  }
  function move(dir) {
    var f = reading();
    if (!f) return false;
    var now = performance.now();
    if (now < lockedUntil) {
      if (!queued) queued = setTimeout(function () { queued = null; move(dir); }, lockedUntil - now + 30);
      return true;
    }
    if (dir > 0 && f.speedUp()) {
      lockedUntil = now + 650;
      return true;
    }
    var y = stepFrom(f, dir);
    if (y === null) return false;
    lockedUntil = now + 650;
    window.scrollTo({ top: y, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    return true;
  }

  // Walls for an uncancelable gesture (see above).
  function stepWall(dir) {
    var f = reading();
    if (!f) return null;
    if (dir > 0 && f.speedUp()) return window.scrollY; // it plays faster and stays put
    return stepFrom(f, dir);
  }
  var parts = Array.prototype.map.call(document.querySelectorAll('.cs-rail a'), function (link) {
    return document.getElementById((link.getAttribute('href') || '').slice(1));
  }).filter(Boolean);
  function readingWall(dir) {
    if (dir < 0) return null;
    var now = window.scrollY, next = null;
    var sticky = parseFloat(html.style.getPropertyValue('--cs-sticky-top')) || 0;
    var stops = parts.map(function (el) {
      return el.getBoundingClientRect().top - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
    });
    // A chapter stops where its view is pinned in the middle of the screen, not at its heading
    // just above (within a screen of it), where the view still sits low.
    var starts = footage.map(function (f) { return f.root.getBoundingClientRect().top - sticky; });
    stops = stops.filter(function (top) {
      return !starts.some(function (start) { return top < start && top > start - window.innerHeight; });
    }).concat(starts);
    footage.forEach(function (f) {
      if (f.ready) stops.push(f.steps[0].getBoundingClientRect().top - f.restTop());
    });
    stops.forEach(function (top) {
      var y = Math.round(now + top);
      if (y > now + window.innerHeight / 7 && (next === null || y < next)) next = y;
    });
    return next;
  }
  // The wheel gesture under way: whether the page took it, and the wall its scroll stops at.
  var run = { at: 0, recent: [], peak: 0, dir: 0, taken: false, wall: null, step: false, timer: 0 };
  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || !e.deltaY) return;
    var now = performance.now();
    var size = Math.abs(e.deltaY);
    var dir = e.deltaY > 0 ? 1 : -1;
    var pause = now - run.at > 200;
    var recent = run.recent.length ? run.recent.reduce(function (a, b) { return a + b; }) / run.recent.length : 0;
    var again = !pause && (dir !== run.dir ? size > 3
                                           : size > recent * 2.5 + 2 && recent < run.peak * 0.4);
    if (!pause && !again && dir !== run.dir) return; // a stray tiny event the other way
    run.at = now;
    if (pause || again) run.recent = [];
    run.recent.push(size);
    if (run.recent.length > 3) run.recent.shift();
    run.peak = pause || again ? size : Math.max(run.peak, size);
    if (pause || again) {
      html.classList.remove('cs-hold');
      run.dir = dir;
      run.taken = e.cancelable && move(dir);
      run.wall = run.taken || !e.cancelable ? null : readingWall(dir);
      run.step = false;
      if (!e.cancelable) {
        run.wall = stepWall(dir);
        run.step = run.wall !== null;
        if (!run.step) run.wall = readingWall(dir);
      }
    }
    // The rest of a gesture the page took is the page's too.
    if (run.taken) e.preventDefault();
    clearTimeout(run.timer);
    run.timer = setTimeout(endRun, 220);
  }, { passive: false });
  // The gesture is over. One in the steps that stopped short of the next step is carried on to it.
  function endRun() {
    html.classList.remove('cs-hold');
    // A swipe that died just short of a reading stop finishes the last few pixels too.
    var short = run.wall === null ? 0 : run.wall - window.scrollY;
    if (run.step ? Math.abs(short) > 2 : short > 2 && short < window.innerHeight / 12)
      window.scrollTo({ top: run.wall, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    run.wall = null;
    run.step = false;
  }
  window.addEventListener('scroll', function () {
    if (run.wall === null) return;
    if (run.dir > 0 ? window.scrollY >= run.wall - 1 : window.scrollY <= run.wall + 1) {
      html.classList.add('cs-hold');
      if (Math.abs(window.scrollY - run.wall) > 1) window.scrollTo({ top: run.wall, behavior: 'instant' });
    }
  }, { passive: true });
  var KEYS = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };
  window.addEventListener('keydown', function (e) {
    var dir = KEYS[e.key];
    if (!dir || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|PRE)$/.test(t.tagName))) return;
    if (e.key === ' ' && e.shiftKey) dir = -1;
    if (move(dir)) e.preventDefault();
  });

  // "Skip footage" (a link past the whole chapter) and the section rail's stops. The page snaps to
  // the steps while they are read and scrolls smoothly otherwise, either of which would drag the
  // jump through (or back into) the steps, so the jump is instant with snapping released; the next
  // scroll event puts snapping back only if the landing place is inside some chapter's steps (a
  // system's heading, the top of the page or the takeaway never are).
  Array.prototype.forEach.call(document.querySelectorAll('.cs-scrolly-skip, .cs-rail a'), function (link) {
    link.addEventListener('click', function (e) {
      var id = (link.getAttribute('href') || '').slice(1);
      var target = id && document.getElementById(id);
      if (!target) return; // no target: leave the plain link alone
      e.preventDefault();
      html.classList.remove('cs-snap');
      lockedUntil = performance.now() + 100;
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      target.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      lastY = window.scrollY;
    });
  });

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; onScroll(); });
  }, { passive: true });
  window.addEventListener('resize', function () { setStickyTop(); onScroll(); });
  onScroll();
})();
