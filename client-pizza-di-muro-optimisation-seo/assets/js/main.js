/* Pizza Di Muro - main.js */

(function () {
  'use strict';

  // ===== HAMBURGER MENU =====
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ===== BACK TO TOP =====
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== STICKY HEADER SHADOW =====
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10
        ? '0 2px 20px rgba(0,0,0,0.14)'
        : '0 2px 12px rgba(0,0,0,0.08)';
    }, { passive: true });
  }

  // ===== ACTIVE NAV LINK =====
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === '#' + entry.target.id
            );
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(sec => observer.observe(sec));
  }

  // ===== NEWSLETTER FORMS =====
  document.querySelectorAll('.newsletter-form, .footer-newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button');
      if (!input || !input.value.trim()) return;

      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Inscrit !';
      btn.style.background = '#16a34a';
      btn.disabled = true;
      input.value = '';

      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.disabled = false;
      }, 3500);
    });
  });

  // ===== BREAKING TICKER — duplicate for seamless loop =====
  const ticker = document.querySelector('.breaking-ticker-inner');
  if (ticker) {
    ticker.innerHTML += ticker.innerHTML;
  }

  // ===== COOKIE BANNER =====
  const cookieBanner = document.querySelector('.cookie-banner');
  const cookieAccept = document.querySelector('.cookie-accept');
  const cookieRefuse = document.querySelector('.cookie-refuse');

  if (cookieBanner) {
    if (!localStorage.getItem('pdm_cookie_consent')) {
      setTimeout(() => cookieBanner.classList.add('show'), 1200);
    }
    const hideBanner = () => {
      cookieBanner.classList.remove('show');
      localStorage.setItem('pdm_cookie_consent', 'true');
    };
    if (cookieAccept) cookieAccept.addEventListener('click', hideBanner);
    if (cookieRefuse) cookieRefuse.addEventListener('click', hideBanner);
  }

  // ===== DATE DYNAMIQUE =====
  const dateEl = document.querySelector('.date-text');
  if (dateEl) {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('fr-FR', opts);
  }

  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const headerH = header ? header.offsetHeight : 70;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - headerH - 12,
          behavior: 'smooth'
        });
      }
    });
  });

  // ===== LAZY IMAGE FALLBACK =====
  if (!('loading' in HTMLImageElement.prototype)) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) img.src = img.dataset.src;
          imgObserver.unobserve(img);
        }
      });
    });
    document.querySelectorAll('img[loading="lazy"]').forEach(img => imgObserver.observe(img));
  }

})();
