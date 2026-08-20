/**
 * SISTBI - Santé, Prévention et Formation en Océan Indien
 * Script principal
 */

(function () {
  'use strict';

  // ============================================================
  // NAVIGATION - Sticky header + burger menu
  // ============================================================
  const header = document.querySelector('.header');
  const burger = document.querySelector('.nav__burger');
  const navMenu = document.querySelector('.nav__menu');

  // Sticky header on scroll
  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Burger menu toggle
  if (burger && navMenu) {
    burger.addEventListener('click', function () {
      const isOpen = navMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
      burger.querySelectorAll('span').forEach((span, i) => {
        if (isOpen) {
          if (i === 0) span.style.transform = 'rotate(45deg) translate(5px, 5px)';
          if (i === 1) span.style.opacity = '0';
          if (i === 2) span.style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
          span.style.transform = '';
          span.style.opacity = '';
        }
      });
    });

    // Close menu on link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        burger.querySelectorAll('span').forEach(span => {
          span.style.transform = '';
          span.style.opacity = '';
        });
      });
    });

    // Close menu on outside click
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) {
        navMenu.classList.remove('open');
      }
    });
  }

  // ============================================================
  // SCROLL TO TOP
  // ============================================================
  const scrollTopBtn = document.querySelector('.scroll-top');

  if (scrollTopBtn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================================
  // INTERSECTION OBSERVER - Fade-in animations
  // ============================================================
  const fadeEls = document.querySelectorAll('.fade-in');

  if (fadeEls.length) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    fadeEls.forEach(el => observer.observe(el));
  }

  // ============================================================
  // SMOOTH SCROLLING - Anchor links
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = header ? header.offsetHeight + 16 : 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ============================================================
  // ACTIVE NAV LINK - Highlight current section
  // ============================================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

  if (sections.length && navLinks.length) {
    const sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(section => sectionObserver.observe(section));
  }

  // ============================================================
  // CONTACT FORM - Validation & UX
  // ============================================================
  const contactForm = document.querySelector('#contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = contactForm.querySelector('[type="submit"]');
      const originalText = btn.innerHTML;

      // Basic validation
      const fields = contactForm.querySelectorAll('[required]');
      let isValid = true;

      fields.forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#ef4444';
          isValid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (!isValid) return;

      // Simulate sending
      btn.innerHTML = '<span>Envoi en cours...</span>';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = '<span>✓ Message envoyé !</span>';
        btn.style.background = '#16a34a';
        contactForm.reset();

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }, 1500);
    });

    // Real-time validation
    contactForm.querySelectorAll('[required]').forEach(field => {
      field.addEventListener('input', function () {
        if (this.value.trim()) {
          this.style.borderColor = '';
        }
      });
    });
  }

  // ============================================================
  // MEMBER LOGIN FORM - UX
  // ============================================================
  const loginForm = document.querySelector('#login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = loginForm.querySelector('[type="submit"]');
      btn.innerHTML = 'Connexion en cours...';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = 'Se connecter';
        btn.disabled = false;
        alert('Espace adhérent : veuillez contacter SISTBI pour accéder à votre compte.');
      }, 1000);
    });
  }

  // ============================================================
  // COUNTERS - Animated stats in hero
  // ============================================================
  function animateCounter(el, target, duration) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.round(current) + (el.dataset.suffix || '');
    }, 16);
  }

  const counters = document.querySelectorAll('[data-counter]');

  if (counters.length) {
    const counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.counter);
          animateCounter(el, target, 1500);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }

  // ============================================================
  // INIT
  // ============================================================
  document.addEventListener('DOMContentLoaded', function () {
    // Trigger scroll to set initial header state
    window.dispatchEvent(new Event('scroll'));
  });

})();
