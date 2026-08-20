/**
 * Qualitropic - Site Web Principal
 * Pôle de compétitivité en bioéconomie tropicale
 */

(function () {
  'use strict';

  // ============================================================
  // Navbar: scroll effect + hamburger toggle
  // ============================================================
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');

  function handleScroll() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Back to top visibility
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('open');
      document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu on nav link click
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function () {
        if (navMenu.classList.contains('open')) {
          hamburger.classList.remove('active');
          navMenu.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    });
  }

  // ============================================================
  // Smooth scroll for anchor links
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });

        // Close mobile menu if open
        if (hamburger && navMenu && navMenu.classList.contains('open')) {
          hamburger.classList.remove('active');
          navMenu.classList.remove('open');
          document.body.style.overflow = '';
        }
      }
    });
  });

  // ============================================================
  // Back to top button
  // ============================================================
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================================
  // Intersection Observer – fade-in animations
  // ============================================================
  const fadeEls = document.querySelectorAll('.fade-in');

  if (fadeEls.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    fadeEls.forEach(el => observer.observe(el));
  }

  // ============================================================
  // Cookie Banner
  // ============================================================
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAccept = document.getElementById('cookieAccept');
  const cookieDecline = document.getElementById('cookieDecline');
  const COOKIE_KEY = 'qualitropic_cookie_consent';

  function initCookieBanner() {
    if (!cookieBanner) return;
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      setTimeout(() => cookieBanner.classList.add('show'), 1200);
    }
  }

  if (cookieAccept) {
    cookieAccept.addEventListener('click', function () {
      localStorage.setItem(COOKIE_KEY, 'accepted');
      cookieBanner.classList.remove('show');
    });
  }

  if (cookieDecline) {
    cookieDecline.addEventListener('click', function () {
      localStorage.setItem(COOKIE_KEY, 'declined');
      cookieBanner.classList.remove('show');
    });
  }

  initCookieBanner();

  // ============================================================
  // Newsletter form
  // ============================================================
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';

      if (!email || !isValidEmail(email)) {
        showFormMessage(newsletterForm, 'Veuillez saisir une adresse email valide.', 'error');
        return;
      }

      // Simulate submission
      const btn = this.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Inscription...';
      }

      setTimeout(() => {
        showFormMessage(
          newsletterForm,
          'Merci ! Votre inscription à la newsletter a bien été enregistrée.',
          'success'
        );
        if (emailInput) emailInput.value = '';
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'S\'inscrire';
        }
      }, 1200);
    });
  }

  // ============================================================
  // Contact form
  // ============================================================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const requiredFields = this.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = 'var(--secondary)';
          isValid = false;
        }
      });

      const emailField = this.querySelector('input[type="email"]');
      if (emailField && emailField.value && !isValidEmail(emailField.value)) {
        emailField.style.borderColor = 'var(--secondary)';
        isValid = false;
      }

      if (!isValid) {
        showFormMessage(contactForm, 'Veuillez remplir tous les champs obligatoires.', 'error');
        return;
      }

      const btn = this.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Envoi en cours...';
      }

      setTimeout(() => {
        showFormMessage(
          contactForm,
          'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.',
          'success'
        );
        contactForm.reset();
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = btn.dataset.originalText || 'Envoyer le message';
        }
      }, 1500);
    });
  }

  // ============================================================
  // Helpers
  // ============================================================
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFormMessage(form, message, type) {
    let msgEl = form.querySelector('.form-message');
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.className = 'form-message';
      form.appendChild(msgEl);
    }

    const colors = {
      success: { bg: 'rgba(20,80,90,0.08)', border: 'var(--primary)', text: 'var(--primary)' },
      error: { bg: 'rgba(230,65,40,0.08)', border: 'var(--secondary)', text: 'var(--secondary)' }
    };

    const c = colors[type] || colors.success;
    msgEl.style.cssText = `
      background: ${c.bg};
      border: 1.5px solid ${c.border};
      color: ${c.text};
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 0.88rem;
      margin-top: 12px;
      line-height: 1.5;
    `;
    msgEl.textContent = message;

    if (type === 'success') {
      setTimeout(() => {
        if (msgEl && msgEl.parentNode) msgEl.remove();
      }, 6000);
    }
  }

  // ============================================================
  // Animated counter for hero stats
  // ============================================================
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), target);
      el.textContent = current.toLocaleString('fr-FR') + suffix;
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
  }

  const counterEls = document.querySelectorAll('[data-counter]');
  if (counterEls.length > 0) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.dataset.counted) {
            entry.target.dataset.counted = '1';
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counterEls.forEach(el => counterObserver.observe(el));
  }

  // ============================================================
  // Highlight active nav section on scroll
  // ============================================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  function updateActiveNav() {
    const scrollPos = window.scrollY + (header ? header.offsetHeight + 40 : 120);
    let active = null;

    sections.forEach(sec => {
      if (sec.offsetTop <= scrollPos) {
        active = sec.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + active);
    });
  }

  if (sections.length > 0 && navLinks.length > 0) {
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }

})();
