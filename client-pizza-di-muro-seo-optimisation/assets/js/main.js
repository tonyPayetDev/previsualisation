/* Pizza Di Muro - main.js */
(function () {
  'use strict';

  // ---- Sticky header shrink ----
  const header = document.querySelector('.site-header');
  function onScroll() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    toggleScrollTop();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Burger menu ----
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.main-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- Scroll-to-top button ----
  const scrollBtn = document.querySelector('.scroll-top');
  function toggleScrollTop() {
    if (!scrollBtn) return;
    if (window.scrollY > 400) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  }
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Lazy-load images ----
  if ('IntersectionObserver' in window) {
    const lazyImgs = document.querySelectorAll('img[data-src]');
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          img.removeAttribute('data-src');
          imgObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });
    lazyImgs.forEach((img) => imgObserver.observe(img));
  } else {
    // Fallback for older browsers
    document.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
    });
  }

  // ---- Recettes tabs ----
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ---- Newsletter form ----
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      const email = input ? input.value.trim() : '';
      if (!email || !email.includes('@')) {
        showNotif('Veuillez saisir une adresse email valide.', 'error');
        return;
      }
      showNotif('Merci ! Vous êtes bien inscrit(e) à notre newsletter.', 'success');
      if (input) input.value = '';
    });
  }

  function showNotif(msg, type) {
    const existing = document.querySelector('.notif-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'notif-toast notif-' + type;
    el.textContent = msg;
    el.style.cssText = `
      position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
      background: ${type === 'success' ? '#00a86b' : '#e12c2c'};
      color: #fff; padding: 12px 24px; border-radius: 28px;
      font-size: 0.875rem; font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      z-index: 9999; animation: fadeInUp 0.3s ease;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ---- Cookie banner ----
  const cookieBanner = document.querySelector('.cookie-banner');
  if (cookieBanner) {
    if (!localStorage.getItem('pdm_cookies')) {
      setTimeout(() => cookieBanner.classList.add('visible'), 1200);
    }
    const acceptBtn = cookieBanner.querySelector('.btn-accept');
    const declineBtn = cookieBanner.querySelector('.btn-decline');
    if (acceptBtn) acceptBtn.addEventListener('click', () => {
      localStorage.setItem('pdm_cookies', 'accepted');
      cookieBanner.classList.remove('visible');
    });
    if (declineBtn) declineBtn.addEventListener('click', () => {
      localStorage.setItem('pdm_cookies', 'declined');
      cookieBanner.classList.remove('visible');
    });
  }

  // ---- Smooth reveal on scroll ----
  if ('IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  // ---- Animated counters (stats) ----
  function animateCounter(el, target, duration) {
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString('fr-FR') + (el.dataset.suffix || '');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const statNums = document.querySelectorAll('.stat-item__num[data-count]');
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          animateCounter(el, parseInt(el.dataset.count, 10), 1600);
          statsObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statNums.forEach((el) => statsObserver.observe(el));
  }

  // ---- Ticker duplicate for seamless loop ----
  const tickerTrack = document.querySelector('.ticker-track');
  if (tickerTrack) {
    tickerTrack.innerHTML += tickerTrack.innerHTML;
  }

})();
