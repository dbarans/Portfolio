(function () {
  'use strict';

  // Everything in this file only ENHANCES a page that already works without
  // it: every window starts open/stacked in the HTML, close/minimize/drag
  // are bonus behaviour. If this script fails to run, nothing breaks.

  var root = document.documentElement;
  root.classList.add('js-on');

  var desktopMode = function () {
    return window.matchMedia('(min-width: 880px)').matches;
  };
  var reducedMotion = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  var windows = Array.prototype.slice.call(document.querySelectorAll('.win'));
  var zCounter = 10;

  windows.forEach(function (win) {
    win.tabIndex = -1; // programmatic focus target only, never a tab stop
  });

  // The About window is the one that's "open" by default in the OS
  // metaphor, so it also starts as the visually active one once JS is
  // tracking active/inactive title bars.
  var aboutWin = document.getElementById('win-about');
  if (aboutWin) aboutWin.classList.add('is-active');

  function bringToFront(win) {
    zCounter += 1;
    win.style.zIndex = String(zCounter);
    windows.forEach(function (w) { w.classList.toggle('is-active', w === win); });
  }

  function isClosed(win) { return win.classList.contains('is-closed'); }
  function isMinimized(win) { return win.classList.contains('is-minimized'); }

  function syncTaskButton(id) {
    var win = document.getElementById(id);
    var btn = document.querySelector('.task-btn[data-task="' + id + '"]');
    if (!win || !btn) return;
    var closed = isClosed(win);
    var minimized = isMinimized(win);
    btn.setAttribute('aria-pressed', String(!closed && !minimized));
    if (closed) {
      btn.setAttribute('data-closed', 'true');
    } else {
      btn.removeAttribute('data-closed');
    }
  }

  function openWindow(id, opts) {
    var win = document.getElementById(id);
    if (!win) return;
    win.classList.remove('is-closed', 'is-minimized');
    bringToFront(win);
    syncTaskButton(id);
    if (!opts || opts.scroll !== false) {
      win.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    if (!opts || opts.focus !== false) {
      // Give the browser a tick to finish the scroll before moving focus.
      window.setTimeout(function () { win.focus(); }, 0);
    }
  }

  function closeWindow(id) {
    var win = document.getElementById(id);
    if (!win) return;
    win.classList.remove('is-minimized');
    win.classList.add('is-closed');
    syncTaskButton(id);
  }

  function toggleMinimize(id) {
    var win = document.getElementById(id);
    if (!win) return;
    if (isClosed(win)) { openWindow(id); return; }
    win.classList.toggle('is-minimized');
    syncTaskButton(id);
  }

  function toggleMaximize(win) {
    win.classList.toggle('is-maximized');
  }

  // ---------- Title-bar control buttons (minimize / maximize / close) ----------
  // Hidden from the a11y tree and out of tab order in the HTML; only wired
  // up and exposed once we know JS actually runs.
  Array.prototype.slice.call(document.querySelectorAll('.win-btn[data-action]')).forEach(function (btn) {
    btn.removeAttribute('aria-hidden');
    btn.removeAttribute('tabindex');
    btn.addEventListener('click', function () {
      var action = btn.getAttribute('data-action');
      var targetId = btn.getAttribute('data-target');
      var win = document.getElementById(targetId);
      if (!win) return;
      if (action === 'close') closeWindow(targetId);
      else if (action === 'minimize') toggleMinimize(targetId);
      else if (action === 'maximize') toggleMaximize(win);
    });
  });

  // ---------- Bring a window to front when clicked anywhere in it ----------
  windows.forEach(function (win) {
    win.addEventListener('pointerdown', function () { bringToFront(win); });
  });

  // ---------- Desktop icons / hero CTA / Start button: open + jump ----------
  Array.prototype.slice.call(document.querySelectorAll('[data-open]')).forEach(function (link) {
    link.addEventListener('click', function (evt) {
      var id = link.getAttribute('data-open');
      if (!document.getElementById(id)) return;
      evt.preventDefault();
      openWindow(id);
    });
  });

  // ---------- Taskbar task buttons: restore, or minimize the active one ----------
  Array.prototype.slice.call(document.querySelectorAll('.task-btn')).forEach(function (btn) {
    var id = btn.getAttribute('data-task');
    syncTaskButton(id);
    btn.addEventListener('click', function (evt) {
      var win = document.getElementById(id);
      if (!win) return;
      evt.preventDefault();
      if (isClosed(win) || isMinimized(win)) {
        openWindow(id);
      } else if (win.classList.contains('is-active')) {
        toggleMinimize(id);
      } else {
        bringToFront(win);
        win.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  // ---------- Dragging (desktop widths only, cosmetic transform) ----------
  var drag = null;

  function onPointerMove(evt) {
    if (!drag) return;
    var dx = evt.clientX - drag.startX;
    var dy = evt.clientY - drag.startY;
    drag.win.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  }

  function onPointerUp() {
    if (!drag) return;
    drag.win.classList.remove('is-dragging');
    drag = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  Array.prototype.slice.call(document.querySelectorAll('.win-titlebar')).forEach(function (bar) {
    bar.addEventListener('pointerdown', function (evt) {
      if (!desktopMode()) return; // phones: no dragging, per the brief
      if (evt.target.closest('.win-btn')) return; // don't drag when hitting a control
      var win = bar.closest('.win');
      if (!win) return;
      drag = { win: win, startX: evt.clientX, startY: evt.clientY };
      win.classList.add('is-dragging');
      bringToFront(win);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    });
  });

  // ---------- Taskbar clock (decorative) ----------
  var clockEl = document.getElementById('clock');
  if (clockEl) {
    var updateClock = function () {
      var now = new Date();
      var hh = String(now.getHours()).padStart(2, '0');
      var mm = String(now.getMinutes()).padStart(2, '0');
      clockEl.textContent = hh + ':' + mm;
    };
    updateClock();
    window.setInterval(updateClock, 15000);
  }
})();
