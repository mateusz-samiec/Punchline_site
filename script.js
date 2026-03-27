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
  const previewVideos = Array.from(document.querySelectorAll('[data-autoplay-once]'));
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

  if (previewVideos.length) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const video = entry.target;
          const playAttempt = video.play();

          if (playAttempt && typeof playAttempt.catch === 'function') {
            playAttempt.catch(() => {});
          }

          videoObserver.unobserve(video);
        });
      },
      { threshold: 0.35 }
    );

    previewVideos.forEach((video) => videoObserver.observe(video));
  }

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
      gesture: null,
      wheelLock: false,
    };
  });

  let activePanelId = 'panel-iphone';

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

  function queueWheelNavigation(carousel, deltaX) {
    if (carousel.wheelLock) {
      return;
    }

    const direction = deltaX > 0 ? 1 : -1;
    carousel.wheelLock = true;
    scrollToIndex(carousel, carousel.index + direction);

    window.setTimeout(() => {
      carousel.wheelLock = false;
    }, 140);
  }

  function getTouchCenter(touches) {
    if (touches.length < 2) {
      return null;
    }

    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
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
  }

  carousels.forEach((carousel) => {
    if (carousel.prevBtn) {
      carousel.prevBtn.addEventListener('click', () => scrollToIndex(carousel, carousel.index - 1));
    }

    if (carousel.nextBtn) {
      carousel.nextBtn.addEventListener('click', () => scrollToIndex(carousel, carousel.index + 1));
    }

    carousel.track.addEventListener(
      'touchstart',
      (event) => {
        if (event.touches.length !== 2) {
          carousel.gesture = null;
          return;
        }

        const center = getTouchCenter(event.touches);
        if (!center) {
          carousel.gesture = null;
          return;
        }

        carousel.gesture = {
          startX: center.x,
          startY: center.y,
          lastX: center.x,
          lastY: center.y,
        };
      },
      { passive: true }
    );

    carousel.track.addEventListener(
      'touchmove',
      (event) => {
        if (!carousel.gesture || event.touches.length !== 2) {
          return;
        }

        const center = getTouchCenter(event.touches);
        if (!center) {
          return;
        }

        carousel.gesture.lastX = center.x;
        carousel.gesture.lastY = center.y;
      },
      { passive: true }
    );

    carousel.track.addEventListener(
      'touchend',
      () => {
        if (!carousel.gesture) {
          return;
        }

        const deltaX = carousel.gesture.lastX - carousel.gesture.startX;
        const deltaY = carousel.gesture.lastY - carousel.gesture.startY;
        const passedThreshold = Math.abs(deltaX) > 48;
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

        if (passedThreshold && isHorizontal) {
          scrollToIndex(carousel, carousel.index + (deltaX < 0 ? 1 : -1));
        }

        carousel.gesture = null;
      },
      { passive: true }
    );

    carousel.track.addEventListener(
      'touchcancel',
      () => {
        carousel.gesture = null;
      },
      { passive: true }
    );

    carousel.track.addEventListener(
      'wheel',
      (event) => {
        const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
        if (!isHorizontal) {
          return;
        }

        if (Math.abs(event.deltaX) < 6) {
          return;
        }

        queueWheelNavigation(carousel, event.deltaX);
        event.preventDefault();
      },
      { passive: false }
    );
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActivePanel(tab.dataset.tabTarget));
  });

  setActivePanel(activePanelId);
})();
