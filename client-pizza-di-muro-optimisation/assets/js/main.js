/* Pizza Di Muro – main.js */
(function () {
  'use strict';

  /* ---- Mobile nav ---- */
  const hamburger = document.querySelector('.hamburger');
  const mainNav   = document.querySelector('.main-nav');
  if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mainNav.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mainNav.contains(e.target)) {
        hamburger.classList.remove('active');
        mainNav.classList.remove('open');
      }
    });
  }

  /* ---- Hero ken-burns on load ---- */
  const hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener('load', () => hero.classList.add('loaded'));
  }

  /* ---- Back-to-top ---- */
  const btt = document.querySelector('.back-to-top');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---- Scroll fade-in (IntersectionObserver) ---- */
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    fadeEls.forEach((el) => obs.observe(el));
  }

  /* ---- Sticky header shadow ---- */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10
        ? '0 4px 20px rgba(0,0,0,.12)'
        : '0 2px 8px rgba(0,0,0,.08)';
    }, { passive: true });
  }

  /* ---- Duplicate ticker for seamless loop ---- */
  const track = document.querySelector('.ticker-track');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

  /* ---- Cookie banner ---- */
  const banner  = document.querySelector('.cookie-banner');
  const accept  = document.querySelector('.btn-cookie-accept');
  const decline = document.querySelector('.btn-cookie-decline');
  if (banner) {
    if (!localStorage.getItem('pdm_cookie')) {
      setTimeout(() => banner.classList.add('show'), 1200);
    }
    const hide = () => {
      banner.classList.remove('show');
      localStorage.setItem('pdm_cookie', '1');
    };
    if (accept)  accept.addEventListener('click', hide);
    if (decline) decline.addEventListener('click', hide);
  }

  /* ---- Newsletter form feedback ---- */
  const form = document.querySelector('.newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('.form-submit');
      btn.textContent = 'Inscription confirmée !';
      btn.style.background = '#16a34a';
      btn.disabled = true;
      form.querySelectorAll('input').forEach((i) => (i.disabled = true));
    });
  }

  /* ---- Lazy load polyfill for browsers without native support ---- */
  if ('loading' in HTMLImageElement.prototype === false) {
    const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
    const imgObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imgObs.unobserve(img);
        }
      });
    });
    lazyImgs.forEach((img) => imgObs.observe(img));
  }

})();
