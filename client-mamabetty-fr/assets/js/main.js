/**
 * Mama Betty - Restaurant Steakhouse Laxou
 * Main JavaScript – Interactions & Animations
 */

(function () {
  'use strict';

  /* ============================================================
     UTILITY HELPERS
  ============================================================ */
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  /* ============================================================
     NAVBAR – Scroll behavior
  ============================================================ */
  const navbar = $('#navbar');

  function handleNavbarScroll() {
    if (!navbar) return;
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll(); // Run on load

  /* ============================================================
     ACTIVE NAV LINK – Highlight current section
  ============================================================ */
  const navLinks = $$('.nav-link');
  const sections = $$('section[id]');

  function updateActiveLink() {
    const scrollY = window.scrollY + 100;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  /* ============================================================
     MOBILE MENU
  ============================================================ */
  const menuToggle = $('#menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const mobileNavLinks = $$('.mobile-nav-link');

  function openMenu() {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.add('open');
    menuToggle.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });
  }

  // Close on mobile link click
  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (mobileMenu && menuToggle) {
      if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        closeMenu();
      }
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ============================================================
     SMOOTH SCROLL for anchor links
  ============================================================ */
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = $(href);
      if (!target) return;

      e.preventDefault();

      const navHeight = navbar ? navbar.offsetHeight : 80;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ============================================================
     SCROLL REVEAL – Intersection Observer
  ============================================================ */
  const revealElements = $$('.reveal-element');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target); // Only animate once
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  /* ============================================================
     BACK TO TOP BUTTON
  ============================================================ */
  const backToTop = $('#back-to-top');

  if (backToTop) {
    window.addEventListener(
      'scroll',
      () => {
        if (window.scrollY > 400) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      },
      { passive: true }
    );

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     LAZY IMAGE LOADING – Fade in on load
  ============================================================ */
  const lazyImages = $$('img[loading="lazy"]');

  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.addEventListener('load', () => img.classList.add('loaded'));
            if (img.complete) img.classList.add('loaded');
            imgObserver.unobserve(img);
          }
        });
      },
      { threshold: 0.01 }
    );

    lazyImages.forEach((img) => imgObserver.observe(img));
  } else {
    // Fallback: show all images
    lazyImages.forEach((img) => img.classList.add('loaded'));
  }

  // Also handle eager-loaded images
  $$('img[loading="eager"]').forEach((img) => {
    if (img.complete) {
      img.style.opacity = '1';
    } else {
      img.addEventListener('load', () => { img.style.opacity = '1'; });
    }
  });

  /* ============================================================
     RESERVATION FORM – Client-side validation & submission
  ============================================================ */
  const form = $('#reservation-form');
  const formSuccess = $('#form-success');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Basic validation
      const fields = $$('[required]', form);
      let valid = true;

      fields.forEach((field) => {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#ef4444';
          valid = false;
        }
      });

      // Email validation
      const emailField = $('#email');
      if (emailField && emailField.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value.trim())) {
          emailField.style.borderColor = '#ef4444';
          valid = false;
        }
      }

      if (!valid) {
        // Shake effect on invalid
        form.style.animation = 'shake 0.4s ease';
        setTimeout(() => { form.style.animation = ''; }, 400);
        return;
      }

      // Simulate form submission (replace with actual endpoint)
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
      }

      setTimeout(() => {
        form.style.display = 'none';
        if (formSuccess) {
          formSuccess.classList.remove('hidden');
          formSuccess.style.display = 'block';
        }
      }, 1200);
    });

    // Reset validation highlight on input
    $$('input, select, textarea', form).forEach((field) => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      });
    });
  }

  /* ============================================================
     COUNTER ANIMATION – Hero Stats
  ============================================================ */
  function animateCounter(el, target, suffix = '') {
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      if (typeof target === 'number') {
        el.textContent = Math.round(eased * target) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // Stats counter on hero
  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const statEls = $$('.hero-stat-number', entry.target);
          statEls.forEach((el) => {
            const val = parseInt(el.dataset.value);
            if (!isNaN(val)) animateCounter(el, val);
          });
          heroObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  const heroSection = $('#accueil');
  if (heroSection) heroObserver.observe(heroSection);

  /* ============================================================
     KEYBOARD ACCESSIBILITY – Trap focus in mobile menu
  ============================================================ */
  document.addEventListener('keydown', (e) => {
    if (!mobileMenu || !mobileMenu.classList.contains('open')) return;

    if (e.key === 'Tab') {
      const focusable = $$('a, button', mobileMenu).filter(
        (el) => !el.disabled && el.tabIndex !== -1
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ============================================================
     CSS SHAKE ANIMATION (inline)
  ============================================================ */
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-8px); }
      40%       { transform: translateX(8px); }
      60%       { transform: translateX(-5px); }
      80%       { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(shakeStyle);

  /* ============================================================
     PRELOAD HERO IMAGE
  ============================================================ */
  const heroImg = $('section#accueil img');
  if (heroImg && heroImg.complete) {
    heroImg.style.opacity = '1';
  }

  /* ============================================================
     INIT
  ============================================================ */
  console.log('%cMama Betty 🔥 Restaurant Steakhouse Laxou', 'color:#f6d29f;font-size:14px;font-weight:bold;');

})();
