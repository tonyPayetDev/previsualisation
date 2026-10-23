/* ===================================================
   PIZZA CLUB SAINT-PIERRE — Main JavaScript
   =================================================== */

(function () {
  'use strict';

  // ─── Header Scroll ────────────────────────────────
  const header = document.querySelector('.header');
  const scrollHandler = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', scrollHandler, { passive: true });

  // ─── Mobile Menu ──────────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ─── Active Nav Link ─────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav a, .mobile-menu a');

  const updateActiveLink = () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  };

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // ─── Smooth Scroll ──────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = header ? header.offsetHeight + 8 : 80;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
  });

  // ─── Fade-in on Scroll ──────────────────────────
  const fadeElements = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  fadeElements.forEach(el => observer.observe(el));

  // ─── Lazy Loading Images ────────────────────────
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) img.src = img.dataset.src;
          imgObserver.unobserve(img);
        }
      });
    });
    lazyImages.forEach(img => imgObserver.observe(img));
  }

  // ─── Promo Popup ────────────────────────────────
  const popup = document.querySelector('.promo-popup');
  const popupClose = document.querySelector('.promo-popup-close');

  const showPopup = () => {
    if (!popup) return;
    const seen = sessionStorage.getItem('promo_seen');
    if (!seen) {
      setTimeout(() => {
        popup.classList.add('show');
        sessionStorage.setItem('promo_seen', '1');
      }, 3500);
    }
  };

  const closePopup = () => popup?.classList.remove('show');

  popupClose?.addEventListener('click', closePopup);
  popup?.addEventListener('click', e => { if (e.target === popup) closePopup(); });

  showPopup();

  // ─── Category Cards Interaction ────────────────
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const section = document.querySelector('#carte');
      if (section) {
        const offset = header ? header.offsetHeight + 8 : 80;
        window.scrollTo({ top: section.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });

  // ─── Stagger children animation ─────────────────
  document.querySelectorAll('.categories-grid, .formules-grid, .actualites-grid').forEach(grid => {
    grid.querySelectorAll(':scope > *').forEach((child, i) => {
      child.classList.add('fade-in');
      child.style.transitionDelay = `${i * 0.1}s`;
      observer.observe(child);
    });
  });

  // ─── Current Year ───────────────────────────────
  const yearEl = document.querySelector('.current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─── Hours indicator ────────────────────────────
  const isOpen = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon, ...6=Sat
    const h = now.getHours();
    const m = now.getMinutes();
    const time = h * 60 + m;

    const lunch = time >= 11 * 60 && time < 14 * 60;
    const dinner = time >= 18 * 60 && time < 21 * 60;
    const dinnerFriSat = time >= 18 * 60 && time < 22 * 60;

    if (day === 1) return false; // Monday: closed
    if (day === 0) return dinner; // Sunday: dinner only
    if (day >= 5) return lunch || dinnerFriSat; // Fri-Sat
    return lunch || dinner; // Tue-Thu
  };

  const badge = document.querySelector('.open-badge');
  if (badge) {
    if (isOpen()) {
      badge.textContent = '● Ouvert maintenant';
      badge.style.color = '#4caf50';
    } else {
      badge.textContent = '● Fermé actuellement';
      badge.style.color = '#f44336';
    }
  }
})();
