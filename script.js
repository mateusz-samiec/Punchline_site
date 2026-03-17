// Lightweight interactions for GitHub Pages landing page.
// 1) Scroll reveal animations
// 2) Screenshot carousels with device tabs
// 3) Footer year

(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  const panels = Array.from(document.querySelectorAll('[data-carousel-panel]'));
  const tabs = Array.from(document.querySelectorAll('[data-tab-target]'));
  if (!panels.length || !tabs.length) {
    return;
  }

  const carousels = panels.map((panel) => {
    const track = panel.querySelector('[data-carousel-track]');
    const prevBtn = panel.querySelector('.carousel-btn.prev');
    const nextBtn = panel.querySelector('.carousel-btn.next');
    const cards = Array.from(track.querySelectorAll('.device-frame'));

    return {
      panel,
      track,
      prevBtn,
      nextBtn,
      cards,
      index: 0,
    };
  });

  let activePanelId = 'panel-iphone';
  let autoplay;

  function getCarousel(panelId) {
    return carousels.find((carousel) => carousel.panel.id === panelId);
  }

  function scrollToIndex(carousel, nextIndex) {
    if (!carousel || !carousel.cards.length) {
      return;
    }

    const safeIndex = ((nextIndex % carousel.cards.length) + carousel.cards.length) % carousel.cards.length;
    carousel.index = safeIndex;
    const card = carousel.cards[safeIndex];
    carousel.track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
  }

  function stopAutoplay() {
    clearInterval(autoplay);
  }

  function startAutoplay() {
    stopAutoplay();
    const carousel = getCarousel(activePanelId);
    if (!carousel || carousel.cards.length < 2) {
      return;
    }

    autoplay = setInterval(() => scrollToIndex(carousel, carousel.index + 1), 3500);
  }

  function setActivePanel(panelId) {
    activePanelId = panelId;

    tabs.forEach((tab) => {
      const isActive = tab.dataset.tabTarget === panelId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.id === panelId;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });

    startAutoplay();
  }

  carousels.forEach((carousel) => {
    if (carousel.prevBtn) {
      carousel.prevBtn.addEventListener('click', () => scrollToIndex(carousel, carousel.index - 1));
    }

    if (carousel.nextBtn) {
      carousel.nextBtn.addEventListener('click', () => scrollToIndex(carousel, carousel.index + 1));
    }

    carousel.track.addEventListener('mouseenter', stopAutoplay);
    carousel.track.addEventListener('mouseleave', startAutoplay);
    carousel.track.addEventListener('touchstart', stopAutoplay, { passive: true });
    carousel.track.addEventListener('touchend', startAutoplay, { passive: true });
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActivePanel(tab.dataset.tabTarget));
  });

  setActivePanel(activePanelId);
})();
