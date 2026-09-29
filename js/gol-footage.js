// Game of Life: overlays over the recorded chapters (js/footage.js plays them). The recorder
// wrote the engine's own numbers for every frame into each chapter's manifest.json; a counter
// in the corner of the view reads them. The kernel chapter also draws, under the row it
// traces, that row's bits as the engine combined them (kernel.json, which the recorder
// checked against the engine's own result).
(function () {
  var roots = Array.prototype.slice.call(document.querySelectorAll('.cs-scrolly[data-footage]'));
  if (!roots.length || !window.fetch || !window.Promise) return;

  var COLORS = { accent: '#ffd940', died: '#de544a', live: '#f2f2f4', dead: '#2a2a31', dim: '#8d8d97' };

  // Nouns counted by the counter: [one, many] in English, [one, few, many] in Polish.
  var TEXT = {
    en: {
      gen: 'gen.', paused: 'paused', words: '198 words instead of 576', row: 'row',
      cells: ['live cell', 'live cells'], occupied: ['occupied chunk', 'occupied chunks'],
      generations: ['generation', 'generations'],
      recomputed: 'recomputed', changed: 'changed', born: 'born', died: 'died', gps: 'gen/s',
      buffer: 'in the buffer', copied: 'chunks copied per frame',
      title: function (row, a, b) { return 'Chunk row r = ' + row + ', columns ' + a + '–' + b; },
      labels: ['r + 1', 'r', 'r − 1', 'sum', '= 2', '= 3', 'next'],
      ops: ['Row r and its neighbour rows r − 1 and r + 1, 66 bits each',
            'AddBits 1 of 3: the three cells of row r − 1, for all 64 columns at once',
            'AddBits 2 of 3: the three cells of row r + 1',
            'AddBits 3 of 3: the cells left and right in row r',
            'The rules as two masks: exactly 2 neighbours, exactly 3',
            'Next: 3 neighbours, or 2 and alive; matches the engine’s row']
    },
    pl: {
      gen: 'gen.', paused: 'pauza', words: '198 słów zamiast 576', row: 'wiersz',
      cells: ['żywa komórka', 'żywe komórki', 'żywych komórek'],
      occupied: ['zajęty chunk', 'zajęte chunki', 'zajętych chunków'],
      generations: ['generacja', 'generacje', 'generacji'],
      recomputed: 'przeliczane', changed: 'zmienione', born: 'narodziny', died: 'śmierci', gps: 'gen./s',
      buffer: 'w buforze', copied: 'kopiowane chunki na klatkę',
      title: function (row, a, b) { return 'Wiersz chunka r = ' + row + ', kolumny ' + a + '–' + b; },
      labels: ['r + 1', 'r', 'r − 1', 'suma', '= 2', '= 3', 'wynik'],
      ops: ['Wiersz r i sąsiednie wiersze r − 1 i r + 1, po 66 bitów',
            'AddBits 1 z 3: trzy komórki wiersza r − 1, dla 64 kolumn naraz',
            'AddBits 2 z 3: trzy komórki wiersza r + 1',
            'AddBits 3 z 3: komórki z lewej i prawej w wierszu r',
            'Reguły jako dwie maski: dokładnie 2 sąsiadów, dokładnie 3',
            'Wynik: 3 sąsiadów albo 2 i żywa; zgodny z wierszem silnika']
    }
  };

  function lang() { return document.documentElement.lang === 'pl' ? 'pl' : 'en'; }
  function t() { return TEXT[lang()]; }
  function num(n) { return Math.round(n).toLocaleString(lang() === 'pl' ? 'pl-PL' : 'en-GB'); }

  // "143 occupied chunks", with the noun in the form the number takes.
  function counted(n, forms) {
    n = Math.round(n);
    var form = forms[forms.length - 1];
    if (n === 1) form = forms[0];
    else if (forms.length === 3 && n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) form = forms[1];
    return num(n) + ' ' + form;
  }

  // --- Reading the manifest ---------------------------------------------------------------

  // A per-frame value, or undefined for a frame the manifest has none for. The published
  // chapters are one layer each (publish_footage.py trims a chapter's hand-over away).
  function value(manifest, key, frame) {
    var data = manifest.perFrame.f;
    if (!data || !data[key]) return undefined;
    var i = frame - data.first;
    return i >= 0 && i < data.count ? data[key][i] : undefined;
  }

  function phaseAt(manifest, frame) {
    for (var i = 0; i < manifest.phases.length; i++) {
      var p = manifest.phases[i];
      if (frame >= p.first && frame <= p.last) return p;
    }
    return manifest.phases[manifest.phases.length - 1];
  }

  // --- The counter ------------------------------------------------------------------------

  var HUD = {
    '01-active-chunks': function (m, frame, phase) {
      var s = t();
      var gen = s.gen + ' ' + value(m, 'generation', frame);
      var occupied = counted(value(m, 'occupiedChunks', frame), s.occupied);
      if (phase === 'active')
        return gen + ' · ' + occupied + ' · ' + s.recomputed + ': ' + num(value(m, 'recomputedChunks', frame)) +
               ' · ' + s.changed + ': ' + num(value(m, 'changedChunks', frame));
      if (phase === 'occupied') return gen + ' · ' + occupied;
      return gen + ' · ' + counted(value(m, 'population', frame), s.cells);
    },

    '02-kernel': function (m, frame, phase) {
      var s = t();
      var gen = s.gen + ' ' + value(m, 'generation', frame) + ' · ' + s.paused;
      if (phase === 'gather' && frame >= m.gather.gatherRevealFrames.haloOutline) return gen + ' · ' + s.words;
      if (phase === 'sweep') return gen + ' · ' + s.row + ' ' + value(m, 'sweptRows', frame) + ' / 64';
      if (phase === 'result' || phase === 'apply')
        return gen + ' · ' + s.born + ': ' + value(m, 'bornSoFar', frame) + ' · ' + s.died + ': ' + value(m, 'diedSoFar', frame);
      return gen;
    },

    '03-connector': function (m, frame, phase) {
      var s = t();
      // Before the two paths are shown: how much of the machine changes.
      if (phase === 'all-busy' || phase === 'diagram-out')
        return s.gen + ' ' + value(m, 'generation', frame) + ' · ' + counted(value(m, 'occupiedChunks', frame), s.occupied) +
               ' · ' + s.changed + ': ' + num(value(m, 'changedChunks', frame));
      var rate = num(value(m, 'generationsPerSecond', frame)) + ' ' + s.gps;
      if (value(m, 'path', frame) === 'buffered')
        return rate + ' · ' + s.buffer + ': ' + counted(value(m, 'waitingInBuffer', frame), s.generations);
      // A frame with no generation of its own copies nothing: show the last frame that did.
      for (var f = frame; f >= 1; f--) {
        var chunks = value(m, 'chunksPublishedThisFrame', f);
        if (chunks) return rate + ' · ' + s.copied + ': ' + num(chunks) + ' (' + num(value(m, 'bytesPublishedThisFrame', f) / 1024) + ' KB)';
      }
      return rate;
    }
  };

  // --- The kernel's row, bit by bit --------------------------------------------------------

  // A [word0, word1] pair as the 66 columns of a halo row (word0's top bit is column 0, one to
  // the left of the chunk; word1's top two bits are columns 64 and 65).
  function bits(pair) {
    var out = [];
    for (var w = 0; w < 2; w++) {
      var hex = pair[w];
      for (var c = 0; c < (w ? 2 : 64); c++) {
        var nibble = parseInt(hex.charAt(c >> 2), 16);
        out.push((nibble >> (3 - (c & 3))) & 1);
      }
    }
    return out;
  }

  // The neighbour counts after one of Compute's AddBits steps: planes [b0, b1, b2] of word0,
  // then of word1.
  function counts(planes) {
    var b = [0, 1, 2].map(function (i) { return bits([planes[i], planes[3 + i]]); });
    return b[0].map(function (_, c) { return b[0][c] + 2 * b[1][c] + 4 * b[2][c]; });
  }

  function KernelPanel(root, frameEl, kernel, manifest) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'gol-bits';
    this.canvas.setAttribute('aria-hidden', 'true');
    frameEl.appendChild(this.canvas);
    this.phase = manifest.phases.filter(function (p) { return p.name === 'one-row'; })[0];

    var r = kernel.rows[kernel.tracedRow];
    this.row = kernel.tracedRow;
    this.rows = [bits(r.next), bits(r.current), bits(r.previous)]; // top to bottom on screen
    this.sums = [counts(r.afterPrevious), counts(r.afterNext), counts(r.afterCurrent)];
    this.eq2 = bits(r.equals2);
    this.eq3 = bits(r.equals3);
    this.next = bits(r.nextGeneration);

    // The sixteen columns with the most live cells in them, before and after (halo columns
    // 1..64 are the chunk's 0..63).
    var self = this, live = [];
    for (var c = 0; c <= 65; c++) live.push(this.rows[0][c] + this.rows[1][c] + this.rows[2][c] + this.next[c]);
    this.from = 1;
    for (var from = 1, best = -1; from <= 64 - 15; from++) {
      var n = 0;
      for (c = from; c < from + 16; c++) n += live[c];
      if (n > best) { best = n; this.from = from; }
    }
    this.shown = -1;
    window.addEventListener('resize', function () { self.shown = -1; self.draw(self.frame || 0); });
  }

  // Frames into the phase at which each part comes in: the rows, the three sums, the masks, the result.
  KernelPanel.STAGES = [0, 10, 20, 30, 40, 50];

  KernelPanel.prototype.draw = function (frame) {
    this.frame = frame;
    var p = this.phase;
    var into = frame - p.first;
    var on = into >= 0 && frame <= p.last;
    this.canvas.style.opacity = on ? Math.min(1, (into + 1) / 6) : 0;
    if (!on) { this.shown = -1; return; }
    var stage = 0;
    for (var i = 0; i < KernelPanel.STAGES.length; i++) if (into >= KernelPanel.STAGES[i]) stage = i;
    var key = stage + lang();
    if (key === this.shown) return;
    this.shown = key;
    this.paint(stage);
  };

  KernelPanel.prototype.paint = function (stage) {
    var canvas = this.canvas;
    var ratio = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var s = t();
    var pad = Math.max(6, w * 0.02);
    var font = Math.max(9, Math.min(13, w / 48));
    ctx.textBaseline = 'middle';
    ctx.font = '500 ' + font + 'px "DM Mono", monospace';

    // Title and the operation of this stage, each shrunk to the panel's width if need be.
    function line(text, color, y) {
      var size = font;
      ctx.font = '500 ' + size + 'px "DM Mono", monospace';
      while (ctx.measureText(text).width > w - 2 * pad && size > 6.5) {
        size -= 0.5;
        ctx.font = '500 ' + size + 'px "DM Mono", monospace';
      }
      ctx.fillStyle = color;
      ctx.fillText(text, pad, y);
      ctx.font = '500 ' + font + 'px "DM Mono", monospace';
    }
    line(s.title(this.row, this.from - 1, this.from + 14), COLORS.live, pad + font * 0.6);
    line(s.ops[stage], COLORS.accent, pad + font * 1.9);

    var top = pad + font * 3;
    var labelW = Math.max(font * 4.2, w * 0.13);
    var cols = 16;
    var cell = Math.min((w - labelW - 2 * pad) / cols, (h - top - pad) / 7);
    var left = labelW + pad;
    var gap = Math.max(1, cell * 0.12);

    function label(i, text, lit) {
      ctx.fillStyle = lit ? COLORS.accent : COLORS.dim;
      ctx.fillText(text, pad, top + (i + 0.5) * cell);
    }
    function square(i, c, fill, stroke) {
      var x = left + c * cell + gap, y = top + i * cell + gap, size = cell - 2 * gap;
      if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, size, size); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1); }
    }

    // The source row each AddBits adds, tinted while it is added (r − 1, r + 1, then r's sides).
    // Rows count upward, so r + 1 is drawn on top, as it is on the board.
    var adding = stage >= 1 && stage <= 3 ? [2, 0, 1][stage - 1] : -1;
    for (var r = 0; r < 3; r++) {
      label(r, s.labels[r], r === adding);
      if (r === adding) { ctx.fillStyle = 'rgba(255, 217, 64, 0.14)'; ctx.fillRect(left, top + r * cell, cols * cell, cell); }
      for (var c = 0; c < cols; c++) square(r, c, this.rows[r][this.from + c] ? COLORS.live : null, COLORS.dead);
    }

    if (stage >= 1) {
      var sum = this.sums[Math.min(stage, 3) - 1];
      label(3, s.labels[3], stage <= 3);
      ctx.textAlign = 'center';
      for (c = 0; c < cols; c++) {
        var n = sum[this.from + c];
        ctx.fillStyle = n === 3 ? COLORS.accent : n === 2 ? COLORS.live : COLORS.dim;
        ctx.fillText(n ? String(n) : '·', left + (c + 0.5) * cell, top + 3.5 * cell);
      }
      ctx.textAlign = 'left';
    }
    if (stage >= 4) {
      label(4, s.labels[4], stage === 4);
      label(5, s.labels[5], stage === 4);
      for (c = 0; c < cols; c++) {
        square(4, c, this.eq2[this.from + c] ? COLORS.live : null, COLORS.dead);
        square(5, c, this.eq3[this.from + c] ? COLORS.accent : null, COLORS.dead);
      }
    }
    if (stage >= 5) {
      label(6, s.labels[6], true);
      for (c = 0; c < cols; c++) {
        var was = this.rows[1][this.from + c], now = this.next[this.from + c];
        square(6, c, now ? (was ? COLORS.live : COLORS.accent) : null, was && !now ? COLORS.died : COLORS.dead);
        if (was && !now) square(6, c, 'rgba(222, 84, 74, 0.45)', null);
      }
    }
  };

  // --- Wiring ------------------------------------------------------------------------------

  roots.forEach(function (root) {
    var name = root.getAttribute('data-footage');
    var format = HUD[name];
    if (!format) return;
    var folder = root.getAttribute('data-footage-base') + name + '/';
    var frameEl = root.querySelector('.cs-media-frame');
    var hud = document.createElement('p');
    hud.className = 'gol-hud';
    hud.setAttribute('aria-hidden', 'true');
    frameEl.appendChild(hud);

    var data = null, loading = null, panel = null, last = 0;
    function load() {
      if (!loading) {
        var get = function (file) { return fetch(folder + file).then(function (r) { return r.json(); }); };
        loading = get('manifest.json').then(function (manifest) {
          if (!manifest.kernelData) return { manifest: manifest };
          return get(manifest.kernelData).then(function (kernel) { return { manifest: manifest, kernel: kernel }; });
        }).then(function (d) {
          data = d;
          if (d.kernel) panel = new KernelPanel(root, frameEl, d.kernel, d.manifest);
          show(last);
        }, function () { loading = null; });
      }
    }
    function show(frame) {
      last = frame;
      if (!data) { load(); return; }
      var n = Math.min(frame + 1, data.manifest.frames);
      hud.textContent = format(data.manifest, n, phaseAt(data.manifest, n).name);
      hud.classList.add('is-on');
      if (panel) panel.draw(n);
    }
    root.addEventListener('footage:frame', function (e) { show(e.detail.frame); });
    root.addEventListener('footage:close', function () {
      hud.classList.remove('is-on');
      if (panel) panel.draw(-1);
    });
    new MutationObserver(function () { if (data) { if (panel) panel.shown = -1; show(last); } })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  });
})();
