// Project focus: ?focus=unity or ?focus=mobile in the link narrows the home page to those
// projects and swaps the hero to match (no parameter shows everything). The filter buttons change
// it too and keep the address in step, so Back works and a copied link opens the same view.
// The choice is remembered for this tab, so "← All projects" on a case study returns to it.
(function () {
  'use strict';

  const FOCUSES = ['all', 'unity', 'mobile'];
  const KEY = 'focus';

  const fromUrl = () => {
    const value = new URLSearchParams(location.search).get('focus');
    return FOCUSES.includes(value) ? value : 'all';
  };
  const remember = (focus) => {
    try {
      if (focus === 'all') sessionStorage.removeItem(KEY);
      else sessionStorage.setItem(KEY, focus);
    } catch (e) { /* storage blocked: links just lose the focus */ }
  };
  const remembered = () => {
    try {
      const value = sessionStorage.getItem(KEY);
      return FOCUSES.includes(value) ? value : 'all';
    } catch (e) {
      return 'all';
    }
  };

  const grid = document.querySelector('.pgrid');

  // ---------- case studies: send the back links to the view the reader came from ----------
  if (!grid) {
    const focus = remembered();
    if (focus === 'all') return;
    document.querySelectorAll('a[href^="index.html"]').forEach((a) => {
      const url = new URL(a.getAttribute('href'), location.href);
      url.searchParams.set('focus', focus);
      a.setAttribute('href', 'index.html' + url.search + url.hash);
    });
    return;
  }

  // ---------- home page ----------
  const buttons = Array.from(document.querySelectorAll('.pfilter-btn'));
  const cards = Array.from(grid.querySelectorAll('.pcard[data-tags]'));
  const variants = Array.from(document.querySelectorAll('[data-focus]'));
  const status = document.querySelector('.pfilter-status');
  let first = true;

  const matches = (card, focus) => focus === 'all' || card.dataset.tags.split(' ').includes(focus);

  function apply(focus) {
    variants.forEach((el) => {
      el.hidden = !el.dataset.focus.split(' ').includes(focus);
    });
    let n = 0;
    cards.forEach((card) => {
      const show = matches(card, focus);
      card.hidden = !show;
      if (show) n += 1;
    });
    grid.dataset.count = String(n);
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === focus)));
    remember(focus);
    // Announce only changes the reader made, not the view the page opened with.
    if (status && !first) {
      const pl = document.documentElement.lang === 'pl';
      status.textContent = pl ? 'Widoczne projekty: ' + n : n + (n === 1 ? ' project shown' : ' projects shown');
    }
    first = false;
  }

  buttons.forEach((b) => {
    const focus = b.dataset.filter;
    const count = cards.filter((c) => matches(c, focus)).length;
    const badge = b.querySelector('.pfilter-count');
    if (badge) badge.textContent = String(count);
    b.addEventListener('click', () => {
      if (b.getAttribute('aria-pressed') === 'true') return;
      const url = new URL(location.href);
      if (focus === 'all') url.searchParams.delete('focus');
      else url.searchParams.set('focus', focus);
      history.pushState({ focus }, '', url);
      apply(focus);
    });
  });

  window.addEventListener('popstate', () => apply(fromUrl()));
  apply(fromUrl());
})();
