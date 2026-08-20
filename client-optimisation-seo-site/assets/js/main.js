/**
 * SEO Pro - Main JavaScript
 * Production-ready, modular, accessible
 */

'use strict';

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

/**
 * Debounce function for performance-sensitive events
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function for scroll events
 */
function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Easing function for smooth animations
 */
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

/* ============================================
   1. STICKY HEADER
   ============================================ */

function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const scrollThreshold = 80;

  function updateHeader() {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  // Initial check
  updateHeader();

  window.addEventListener('scroll', throttle(updateHeader, 16), { passive: true });
}

/* ============================================
   2. SMOOTH SCROLL
   ============================================ */

function initSmoothScroll() {
  const headerHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '72'
  );

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });

      // Close mobile menu if open
      closeMobileMenu();

      // Update focus for accessibility
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}

/* ============================================
   3. MOBILE MENU
   ============================================ */

let mobileMenuOpen = false;

function initMobileMenu() {
  const hamburger = document.querySelector('.header__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const body = document.body;

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    mobileMenuOpen ? closeMobileMenu() : openMobileMenu();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (
      mobileMenuOpen &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeMobileMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenuOpen) {
      closeMobileMenu();
      hamburger.focus();
    }
  });

  // Trap focus within menu when open
  mobileMenu.addEventListener('keydown', trapFocus);
}

function openMobileMenu() {
  const hamburger = document.querySelector('.header__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  mobileMenuOpen = true;
  hamburger.classList.add('is-active');
  mobileMenu.classList.add('is-open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  const hamburger = document.querySelector('.header__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (!hamburger || !mobileMenu) return;

  mobileMenuOpen = false;
  hamburger.classList.remove('is-active');
  mobileMenu.classList.remove('is-open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function trapFocus(e) {
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;

  const focusableElements = mobileMenu.querySelectorAll(
    'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }
}

/* ============================================
   4. INTERSECTION OBSERVER - SCROLL ANIMATIONS
   ============================================ */

function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ============================================
   5. STATS COUNTER ANIMATION
   ============================================ */

function initStatsCounter() {
  const statNumbers = document.querySelectorAll('[data-count]');
  if (!statNumbers.length) return;

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    statNumbers.forEach((el) => {
      el.textContent = el.getAttribute('data-target') || el.textContent;
    });
    return;
  }

  const animateCounter = (el) => {
    const target = el.getAttribute('data-target');
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ''));
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = Math.round(numericTarget * easedProgress);

      el.textContent = prefix + current.toLocaleString('fr-FR') + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = prefix + numericTarget.toLocaleString('fr-FR') + suffix;
      }
    }

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((el) => observer.observe(el));
}

/* ============================================
   6. LAZY LOADING IMAGES
   ============================================ */

function initLazyLoading() {
  // Modern browsers support loading="lazy" natively.
  // This adds a fallback for older browsers using IntersectionObserver.
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading is supported
    return;
  }

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if (!lazyImages.length) return;

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          img.removeAttribute('loading');
          imageObserver.unobserve(img);
        }
      });
    },
    { rootMargin: '200px 0px' }
  );

  lazyImages.forEach((img) => imageObserver.observe(img));
}

/* ============================================
   7. BACK TO TOP BUTTON
   ============================================ */

function initBackToTop() {
  const backToTopBtn = document.querySelector('.back-to-top');
  if (!backToTopBtn) return;

  const showThreshold = 400;

  function updateVisibility() {
    if (window.scrollY > showThreshold) {
      backToTopBtn.classList.add('is-visible');
    } else {
      backToTopBtn.classList.remove('is-visible');
    }
  }

  updateVisibility();

  window.addEventListener('scroll', throttle(updateVisibility, 100), { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================
   8. FORM VALIDATION
   ============================================ */

function initFormValidation() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const fields = {
    name: {
      element: form.querySelector('#field-name'),
      errorEl: form.querySelector('#error-name'),
      validate: (val) => {
        if (!val.trim()) return 'Veuillez entrer votre nom complet.';
        if (val.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères.';
        return null;
      },
    },
    email: {
      element: form.querySelector('#field-email'),
      errorEl: form.querySelector('#error-email'),
      validate: (val) => {
        if (!val.trim()) return 'Veuillez entrer votre adresse email.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val.trim())) return 'Veuillez entrer une adresse email valide.';
        return null;
      },
    },
    website: {
      element: form.querySelector('#field-website'),
      errorEl: form.querySelector('#error-website'),
      validate: (val) => {
        if (!val.trim()) return 'Veuillez entrer l\'URL de votre site web.';
        // Allow URLs with or without protocol
        const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w]{2,}(\/.*)?$/i;
        if (!urlRegex.test(val.trim())) return 'Veuillez entrer une URL valide (ex: www.monsite.fr).';
        return null;
      },
    },
    message: {
      element: form.querySelector('#field-message'),
      errorEl: form.querySelector('#error-message'),
      validate: (val) => {
        if (!val.trim()) return 'Veuillez entrer votre message.';
        if (val.trim().length < 10) return 'Le message doit contenir au moins 10 caractères.';
        return null;
      },
    },
  };

  function showError(field, message) {
    if (!field.element || !field.errorEl) return;
    field.element.classList.add('is-error');
    field.element.setAttribute('aria-invalid', 'true');
    field.errorEl.textContent = message;
    field.errorEl.classList.add('is-visible');
  }

  function clearError(field) {
    if (!field.element || !field.errorEl) return;
    field.element.classList.remove('is-error');
    field.element.setAttribute('aria-invalid', 'false');
    field.errorEl.classList.remove('is-visible');
    field.errorEl.textContent = '';
  }

  function validateField(fieldKey) {
    const field = fields[fieldKey];
    if (!field || !field.element) return true;

    const value = field.element.value;
    const error = field.validate(value);

    if (error) {
      showError(field, error);
      return false;
    } else {
      clearError(field);
      return true;
    }
  }

  // Live validation on blur
  Object.keys(fields).forEach((key) => {
    const field = fields[key];
    if (!field.element) return;

    field.element.addEventListener('blur', () => validateField(key));
    field.element.addEventListener('input', () => {
      if (field.element.classList.contains('is-error')) {
        validateField(key);
      }
    });
  });

  // Submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    Object.keys(fields).forEach((key) => {
      if (!validateField(key)) isValid = false;
    });

    if (!isValid) {
      // Focus first invalid field
      const firstError = form.querySelector('.is-error');
      if (firstError) firstError.focus();
      return;
    }

    // Simulate form submission
    const submitBtn = form.querySelector('.form__submit');
    const successMsg = form.querySelector('.form__success');

    if (submitBtn) {
      submitBtn.textContent = 'Envoi en cours...';
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
    }

    // Simulate API call
    setTimeout(() => {
      form.querySelector('.form__fields').style.display = 'none';
      if (successMsg) {
        successMsg.classList.add('is-visible');
        successMsg.setAttribute('aria-live', 'polite');
        successMsg.setAttribute('role', 'status');
      }
    }, 1500);
  });
}

/* ============================================
   9. ACTIVE NAV LINK ON SCROLL
   ============================================ */

function initActiveNavOnScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header__nav-link, .mobile-menu__link');

  if (!sections.length || !navLinks.length) return;

  const headerHeight = 80;

  function updateActiveLink() {
    let currentSection = '';

    sections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const sectionHeight = section.offsetHeight;

      if (window.scrollY >= sectionTop - headerHeight - 20) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('is-active');
      const href = link.getAttribute('href');
      if (href === `#${currentSection}`) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  window.addEventListener('scroll', throttle(updateActiveLink, 100), { passive: true });
  updateActiveLink();
}

/* ============================================
   10. SERVICE CARD TILT EFFECT (Desktop only)
   ============================================ */

function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 1024) return;

  const cards = document.querySelectorAll('.service-card, .why-us__card, .testimonial-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -3;
      const rotateY = ((x - centerX) / centerX) * 3;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ============================================
   11. HEADER LOGO INVERT ON SCROLL
   ============================================ */

function initLogoEffect() {
  // Logo visibility handled via CSS .is-scrolled class
  // This can be extended if needed
}

/* ============================================
   INITIALIZATION
   ============================================ */

function init() {
  initStickyHeader();
  initSmoothScroll();
  initMobileMenu();
  initScrollAnimations();
  initStatsCounter();
  initLazyLoading();
  initBackToTop();
  initFormValidation();
  initActiveNavOnScroll();
  initCardTilt();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle dynamic content / window resize
window.addEventListener(
  'resize',
  debounce(() => {
    // Re-init card tilt on resize if needed
  }, 300)
);
