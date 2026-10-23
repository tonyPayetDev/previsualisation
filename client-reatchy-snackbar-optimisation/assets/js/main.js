/**
 * R'eat'Chy Snack Bar - Main JavaScript
 * Navbar scroll, mobile menu, scroll animations, back-to-top
 */

(function () {
  'use strict';

  // ============================================================
  // Navbar: scroll effect & active link
  // ============================================================
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function updateNavbar() {
    const scrolled = window.scrollY > 40;
    navbar.classList.toggle('scrolled', scrolled);
  }

  function updateActiveLink() {
    const scrollPos = window.scrollY + 120;
    let currentId = '';

    sections.forEach(section => {
      if (section.offsetTop <= scrollPos) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === '#' + currentId);
    });
  }

  // ============================================================
  // Mobile menu toggle
  // ============================================================
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  function closeMobileMenu() {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', function () {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu when a nav link is clicked
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (navMenu.classList.contains('open') &&
        !navbar.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // ============================================================
  // Back to Top button
  // ============================================================
  const backToTop = document.getElementById('backToTop');

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function updateBackToTop() {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }

  // ============================================================
  // Scroll event handler (throttled)
  // ============================================================
  let ticking = false;

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateNavbar();
        updateActiveLink();
        updateBackToTop();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial call
  updateNavbar();
  updateActiveLink();
  updateBackToTop();

  // ============================================================
  // Intersection Observer: reveal animations
  // ============================================================
  const revealElements = document.querySelectorAll(
    '.menu-card, .delivery-feature, .info-card, .value-item, .stat-card, .app-features li'
  );

  // Add reveal class and staggered delays
  revealElements.forEach((el, index) => {
    el.classList.add('reveal');
    const delay = (index % 5);
    if (delay > 0) el.classList.add('reveal-delay-' + delay);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach(el => observer.observe(el));

    // Also observe section headers
    document.querySelectorAll('.section-header, .app-content, .delivery-content, .about-content, .restaurant-info').forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  } else {
    // Fallback: show all immediately
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // ============================================================
  // Smooth scroll for anchor links
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height')) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  });

  // ============================================================
  // Hero image: handle load error
  // ============================================================
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    heroBg.addEventListener('error', function () {
      this.style.display = 'none';
      const hero = document.querySelector('.hero');
      if (hero) {
        hero.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #333 100%)';
      }
    });
  }

  // ============================================================
  // Phone images: handle load errors gracefully
  // ============================================================
  document.querySelectorAll('.phone-mockup img').forEach(img => {
    img.addEventListener('error', function () {
      const mockup = this.closest('.phone-mockup');
      if (mockup) {
        mockup.style.background = '#1a1a1a';
        this.style.display = 'none';
        // Add placeholder
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.2);font-size:0.8rem;text-align:center;padding:1rem;';
        placeholder.textContent = "Application R'eat'Chy";
        mockup.appendChild(placeholder);
      }
    });
  });

})();
