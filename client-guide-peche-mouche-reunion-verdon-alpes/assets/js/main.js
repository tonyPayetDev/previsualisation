/**
 * Les Sens de la Rivière - Main JavaScript
 * Guide de Pêche à la Mouche
 */

'use strict';

// ============================================
// Header Scroll Behavior
// ============================================
(function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  let lastScroll = 0;
  let ticking = false;

  function updateHeader() {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  // Initial check
  updateHeader();
})();


// ============================================
// Mobile Navigation Toggle
// ============================================
(function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (!hamburger || !mobileNav) return;

  function openMenu() {
    hamburger.classList.add('active');
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('active');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    const isOpen = mobileNav.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close on link click
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();


// ============================================
// Smooth Scroll for Anchor Links
// ============================================
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const headerHeight = document.getElementById('site-header')?.offsetHeight || 80;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    });
  });
})();


// ============================================
// Scroll Animation (Intersection Observer)
// ============================================
(function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');

  if (!elements.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(function (el) {
    observer.observe(el);
  });
})();


// ============================================
// Hero Image Load Animation
// ============================================
(function initHero() {
  const hero = document.querySelector('.hero');
  const heroImg = document.querySelector('.hero-bg img');

  if (!hero || !heroImg) return;

  if (heroImg.complete) {
    hero.classList.add('loaded');
  } else {
    heroImg.addEventListener('load', function () {
      hero.classList.add('loaded');
    });
  }
})();


// ============================================
// Contact Form Handler
// ============================================
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  function showMessage(type, text) {
    // Remove existing message
    const existing = form.querySelector('.form-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = 'form-message';
    msg.setAttribute('role', 'alert');
    msg.style.cssText = [
      'padding: 14px 18px',
      'border-radius: 8px',
      'margin-top: 16px',
      'font-size: 0.95rem',
      'font-weight: 600',
      'text-align: center',
      type === 'success'
        ? 'background: rgba(87, 187, 191, 0.18); color: #57BBBF; border: 1px solid rgba(87, 187, 191, 0.4);'
        : 'background: rgba(220, 80, 80, 0.15); color: #e05555; border: 1px solid rgba(220, 80, 80, 0.3);'
    ].join(';');
    msg.textContent = text;
    form.appendChild(msg);

    if (type === 'success') {
      setTimeout(function () {
        msg.style.transition = 'opacity 0.5s ease';
        msg.style.opacity = '0';
        setTimeout(function () { msg.remove(); }, 500);
      }, 5000);
    }
  }

  function validateForm(data) {
    const errors = [];
    if (!data.prenom.trim()) errors.push('Le prénom est requis.');
    if (!data.nom.trim()) errors.push('Le nom est requis.');
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Une adresse email valide est requise.');
    }
    if (!data.message.trim()) errors.push('Le message est requis.');
    return errors;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;

    const data = {
      prenom: form.prenom.value,
      nom: form.nom.value,
      email: form.email.value,
      telephone: form.telephone.value,
      prestation: form.prestation.value,
      destination: form.destination.value,
      message: form.message.value
    };

    const errors = validateForm(data);
    if (errors.length > 0) {
      showMessage('error', errors[0]);
      return;
    }

    // Simulate form submission (replace with real API call)
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Envoi en cours...';

    // Add spinner animation
    if (!document.getElementById('spin-style')) {
      const style = document.createElement('style');
      style.id = 'spin-style';
      style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    setTimeout(function () {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      form.reset();
      showMessage('success', 'Merci ! Votre message a bien été envoyé. Kévin vous répondra dans les plus brefs délais.');
    }, 1800);
  });
})();


// ============================================
// Lazy Loading Polyfill (for older browsers)
// ============================================
(function initLazyLoad() {
  if ('loading' in HTMLImageElement.prototype) return;

  // Fallback for browsers without native lazy loading
  const images = document.querySelectorAll('img[loading="lazy"]');
  if (!images.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(function (img) { observer.observe(img); });
})();


// ============================================
// Counter Animation for Stats
// ============================================
(function initCounters() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  function animateCounter(el) {
    const text = el.textContent;
    const suffix = text.replace(/[0-9]/g, '');
    const target = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (isNaN(target)) return;

    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(function (el) { observer.observe(el); });
})();


// ============================================
// Active Navigation Highlight on Scroll
// ============================================
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id], div[id="accueil"]');
  const navLinks = document.querySelectorAll('.main-nav a');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(function (link) {
          const href = link.getAttribute('href');
          if (href === '#' + id) {
            link.style.fontWeight = '700';
          } else {
            link.style.fontWeight = '';
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(function (section) { observer.observe(section); });
})();


// ============================================
// Instagram Grid Hover (touch support)
// ============================================
(function initInstaTouch() {
  const instaItems = document.querySelectorAll('.insta-item');
  instaItems.forEach(function (item) {
    item.addEventListener('touchstart', function () {
      this.classList.toggle('touch-hover');
    }, { passive: true });
  });
})();
