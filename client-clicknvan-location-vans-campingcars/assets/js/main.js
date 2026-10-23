/* ============================================================
   CLICKnVAN - Scripts principaux
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Header scroll effect ---------- */
  const header = document.getElementById('header');
  function handleScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ---------- Mobile menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  /* ---------- FAQ Accordion ---------- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isActive = item.classList.contains('active');
      // Close all
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      // Open clicked if was closed
      if (!isActive) item.classList.add('active');
    });
  });

  /* ---------- Scroll to top ---------- */
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, { passive: true });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Smooth scroll for anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---------- Search form ---------- */
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const location = searchForm.querySelector('#searchLocation').value;
      const depart = searchForm.querySelector('#searchDepart').value;
      const retour = searchForm.querySelector('#searchRetour').value;
      if (!location || !depart || !retour) {
        showNotif('Veuillez remplir tous les champs de recherche.', 'warning');
        return;
      }
      showNotif('Recherche en cours... Disponibilités à venir !', 'success');
    });
  }

  /* ---------- CTA Buttons ---------- */
  document.querySelectorAll('[data-cta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.cta;
      if (type === 'vehicles') {
        const section = document.getElementById('vehicles');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (type === 'search') {
        const hero = document.getElementById('hero');
        if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (type === 'pro') {
        const pro = document.getElementById('pro');
        if (pro) pro.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (type === 'faq') {
        const faq = document.getElementById('faq');
        if (faq) faq.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- Lazy loading images ---------- */
  if ('IntersectionObserver' in window) {
    const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });
    lazyImgs.forEach(img => observer.observe(img));
  }

  /* ---------- Vehicle cards animation ---------- */
  if ('IntersectionObserver' in window) {
    const cards = document.querySelectorAll('.vehicle-card, .step-card, .feature-item, .testimonial-card');
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(24px)';
      card.style.transition = `opacity .5s ease ${i * 0.08}s, transform .5s ease ${i * 0.08}s`;
      cardObserver.observe(card);
    });
  }

  /* ---------- Simple notification system ---------- */
  function showNotif(msg, type = 'success') {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(10px);
      background: ${type === 'success' ? '#16A34A' : '#F59E0B'};
      color: white; padding: 14px 24px; border-radius: 12px;
      font-family: var(--font, sans-serif); font-size: .9rem; font-weight: 600;
      box-shadow: 0 8px 32px rgba(0,0,0,.2); z-index: 9999;
      opacity: 0; transition: all .3s ease;
    `;
    notif.textContent = msg;
    document.body.appendChild(notif);
    requestAnimationFrame(() => {
      notif.style.opacity = '1';
      notif.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      notif.style.opacity = '0';
      notif.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => notif.remove(), 300);
    }, 3500);
  }

  /* ---------- Counter animation ---------- */
  function animateCounter(el, target, duration = 1500) {
    const start = 0;
    const step = target / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.round(current).toLocaleString('fr-FR') + (el.dataset.suffix || '');
    }, 16);
  }

  if ('IntersectionObserver' in window) {
    const statEls = document.querySelectorAll('[data-count]');
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          animateCounter(el, parseInt(el.dataset.count));
          counterObs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statEls.forEach(el => counterObs.observe(el));
  }

  /* ---------- Date field min value ---------- */
  const today = new Date().toISOString().split('T')[0];
  const departInput = document.getElementById('searchDepart');
  const retourInput = document.getElementById('searchRetour');
  if (departInput) {
    departInput.min = today;
    departInput.addEventListener('change', () => {
      if (retourInput) retourInput.min = departInput.value;
    });
  }
  if (retourInput) retourInput.min = today;

})();
