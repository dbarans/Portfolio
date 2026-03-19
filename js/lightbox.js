(function () {
  const lightbox = document.getElementById('img-lightbox');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const closeBtn = lightbox.querySelector('.close-lightbox');
  let lastFocusedEl = null;

  const openLightbox = (src) => {
    if (!lightboxImg) return;

    lastFocusedEl = document.activeElement;
    lightboxImg.src = src;
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus();
  };

  const closeLightbox = () => {
    if (!lightboxImg) return;

    lightboxImg.src = '';
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  };

  document.querySelectorAll('.zoom-img').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const src = el.getAttribute('data-img') || el.getAttribute('href');
      if (src) openLightbox(src);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeLightbox());
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  lightbox.setAttribute('aria-hidden', lightbox.hidden ? 'true' : 'false');
})();

