/* =========================================================
   Centre Hospitalier Ouest Réunion — Scripts principaux
   ========================================================= */

'use strict';

/* =========================================================
   CAROUSEL HERO
   ========================================================= */
(function initCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(next, 5500);
  }

  // Dots
  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); startTimer(); }));

  // Arrows
  document.querySelector('.hero-arrow--next')?.addEventListener('click', () => { next(); startTimer(); });
  document.querySelector('.hero-arrow--prev')?.addEventListener('click', () => { prev(); startTimer(); });

  // Touch / swipe
  let touchStartX = 0;
  const heroEl = document.querySelector('.hero');
  heroEl?.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  heroEl?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); startTimer(); }
  }, { passive: true });

  startTimer();
})();

/* =========================================================
   MOBILE MENU
   ========================================================= */
(function initMobileMenu() {
  const hamburger  = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeBtn   = document.querySelector('.mobile-menu-close');
  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.add('open');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  mobileMenu.querySelectorAll('.mobile-nav-link').forEach(a => a.addEventListener('click', closeMenu));
})();

/* =========================================================
   SCROLL ANIMATIONS
   ========================================================= */
(function initScrollFade() {
  const items = document.querySelectorAll('.fade-in');
  if (!items.length || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => observer.observe(el));
})();

/* =========================================================
   COUNTER ANIMATION (chiffres clés)
   ========================================================= */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.count);
    const suffix   = el.dataset.suffix || '';
    const prefix   = el.dataset.prefix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    const duration = 1800;
    const start    = performance.now();

    function update(now) {
      const elapsed = Math.min(now - start, duration);
      const progress = elapsed / duration;
      const ease = 1 - Math.pow(1 - progress, 3);
      const value = target * ease;
      el.textContent = prefix + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter); return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(el => observer.observe(el));
})();

/* =========================================================
   ACCESSIBILITÉ : taille du texte
   ========================================================= */
(function initAccessibility() {
  const root = document.documentElement;
  let size = parseInt(localStorage.getItem('font-size') || '16');

  function applySize(s) {
    root.style.fontSize = s + 'px';
    localStorage.setItem('font-size', s);
  }

  document.querySelector('.acc-btn--plus')?.addEventListener('click', () => {
    if (size < 22) { size += 2; applySize(size); }
  });
  document.querySelector('.acc-btn--minus')?.addEventListener('click', () => {
    if (size > 12) { size -= 2; applySize(size); }
  });
  document.querySelector('.acc-btn--reset')?.addEventListener('click', () => {
    size = 16; applySize(size);
  });
  document.querySelector('.acc-btn--contrast')?.addEventListener('click', () => {
    document.body.classList.toggle('high-contrast');
  });

  applySize(size);
})();

/* =========================================================
   HEADER SCROLL SHADOW
   ========================================================= */
(function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 30
      ? '0 4px 24px rgba(0,0,0,.18)'
      : '0 2px 12px rgba(0,0,0,.10)';
  }, { passive: true });
})();

/* =========================================================
   LAZY LOADING POLYFILL (older browsers)
   ========================================================= */
(function lazyLoadImages() {
  if ('loading' in HTMLImageElement.prototype) return;
  const images = document.querySelectorAll('img[loading="lazy"]');
  if (!('IntersectionObserver' in window)) {
    images.forEach(img => { img.src = img.dataset.src || img.src; });
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const img = e.target;
        if (img.dataset.src) img.src = img.dataset.src;
        obs.unobserve(img);
      }
    });
  });
  images.forEach(img => obs.observe(img));
})();

/* =========================================================
   SMOOTH SCROLL pour ancres internes
   ========================================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
