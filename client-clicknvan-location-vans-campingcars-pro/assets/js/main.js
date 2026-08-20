/* ========================================
   CLICKnVAN.com — JavaScript principal
   ======================================== */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------
     HEADER — scroll & sticky
  ---------------------------------------- */
  const header   = document.querySelector('.header');
  const scrollTop = document.querySelector('.back-to-top');

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 60);
    if (scrollTop) scrollTop.classList.toggle('visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once

  /* ----------------------------------------
     MOBILE MENU
  ---------------------------------------- */
  const hamburger    = document.querySelector('.hamburger');
  const mobileMenu   = document.querySelector('.mobile-menu');
  const mobileClose  = document.querySelector('.menu-close');
  const overlay      = document.querySelector('.mobile-overlay');

  const openMenu  = () => {
    hamburger?.classList.add('active');
    mobileMenu?.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  const closeMenu = () => {
    hamburger?.classList.remove('active');
    mobileMenu?.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  };

  hamburger?.addEventListener('click', () =>
    mobileMenu?.classList.contains('open') ? closeMenu() : openMenu()
  );
  mobileClose?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* ----------------------------------------
     SMOOTH ANCHOR SCROLL
  ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - 80,
          behavior: 'smooth',
        });
      }
    });
  });

  /* ----------------------------------------
     BACK TO TOP
  ---------------------------------------- */
  scrollTop?.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );

  /* ----------------------------------------
     FAQ ACCORDION
  ---------------------------------------- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('active');
      document.querySelectorAll('.faq-item.active').forEach(i => i.classList.remove('active'));
      if (!isOpen) item.classList.add('active');
    });
  });

  /* ----------------------------------------
     SEARCH FORM — dates auto
  ---------------------------------------- */
  const fmt        = d => d.toISOString().split('T')[0];
  const today      = new Date();
  const tomorrow   = new Date(); tomorrow.setDate(today.getDate() + 1);
  const inputStart = document.getElementById('date-depart');
  const inputEnd   = document.getElementById('date-retour');

  if (inputStart) { inputStart.min = fmt(today); inputStart.value = fmt(today); }
  if (inputEnd)   { inputEnd.min   = fmt(tomorrow); inputEnd.value = fmt(tomorrow); }

  inputStart?.addEventListener('change', () => {
    if (!inputEnd) return;
    const dep  = new Date(inputStart.value);
    const next = new Date(dep); next.setDate(dep.getDate() + 1);
    inputEnd.min = fmt(next);
    if (inputEnd.value && new Date(inputEnd.value) <= dep) inputEnd.value = fmt(next);
  });

  /* Search submit feedback */
  const searchForm = document.querySelector('.search-form');
  const searchBtn  = document.querySelector('.search-submit');
  searchForm?.addEventListener('submit', e => {
    e.preventDefault();
    const dest = document.getElementById('destination')?.value?.trim();
    if (!dest) { document.getElementById('destination')?.focus(); return; }
    if (!searchBtn) return;
    const orig = searchBtn.textContent;
    searchBtn.textContent = 'Recherche en cours…';
    searchBtn.disabled = true;
    setTimeout(() => { searchBtn.textContent = orig; searchBtn.disabled = false; }, 2200);
  });

  /* ----------------------------------------
     VEHICLE FAVOURITES
  ---------------------------------------- */
  document.querySelectorAll('.vehicle-fav').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const liked = btn.dataset.liked === 'true';
      btn.dataset.liked = String(!liked);
      btn.textContent   = liked ? '🤍' : '❤️';
    });
  });

  /* ----------------------------------------
     CAROUSEL — scroll left / right
  ---------------------------------------- */
  const carousel = document.querySelector('.carousel');
  document.querySelector('.carousel-prev')?.addEventListener('click', () => {
    carousel?.scrollBy({ left: -320, behavior: 'smooth' });
  });
  document.querySelector('.carousel-next')?.addEventListener('click', () => {
    carousel?.scrollBy({ left: 320, behavior: 'smooth' });
  });

  /* ----------------------------------------
     REVEAL ON SCROLL (IntersectionObserver)
  ---------------------------------------- */
  const revealObserver = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ----------------------------------------
     ANIMATED COUNTERS
  ---------------------------------------- */
  const animateCounter = el => {
    const target   = +el.dataset.target || 0;
    const suffix   = el.dataset.suffix  || '';
    const duration = 1800;
    const step     = Math.ceil(duration / 60);
    let current    = 0;

    const timer = setInterval(() => {
      current += Math.ceil(target / (duration / step));
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current.toLocaleString('fr-FR') + suffix;
    }, step);
  };

  const counterObserver = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    }),
    { threshold: 0.5 }
  );
  document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));

  /* ----------------------------------------
     COOKIE BANNER
  ---------------------------------------- */
  const banner   = document.querySelector('.cookie-banner');
  const btnOk    = document.querySelector('.cookie-accept');
  const btnNo    = document.querySelector('.cookie-decline');

  if (banner) {
    if (localStorage.getItem('cvn_cookie')) {
      banner.remove();
    } else {
      setTimeout(() => banner.classList.remove('hidden'), 1800);
    }
  }

  const hideBanner = choice => {
    localStorage.setItem('cvn_cookie', choice);
    banner?.classList.add('hidden');
    setTimeout(() => banner?.remove(), 500);
  };

  btnOk?.addEventListener('click', () => hideBanner('accepted'));
  btnNo?.addEventListener('click', () => hideBanner('declined'));

  /* ----------------------------------------
     YEAR AUTO-UPDATE
  ---------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
