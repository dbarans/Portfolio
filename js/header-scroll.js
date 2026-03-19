(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastY = window.scrollY || document.documentElement.scrollTop;
  const TOP_ZONE = 56;
  const DELTA_MIN = 4;

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const delta = y - lastY;

    if (y <= TOP_ZONE) {
      header.classList.remove('site-header--hidden');
    } else if (delta > DELTA_MIN) {
      header.classList.add('site-header--hidden');
    } else if (delta < -DELTA_MIN) {
      header.classList.remove('site-header--hidden');
    }

    lastY = y;
  }

  let ticking = false;
  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
})();
