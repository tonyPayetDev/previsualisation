/* La Fabrique - JavaScript principal */

(function () {
  'use strict';

  // === Navbar scroll behavior ===
  const navbar = document.querySelector('.navbar');
  const heroSection = document.querySelector('.hero');

  function updateNavbar() {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  // === Hero parallax + loaded class ===
  const heroBg = document.querySelector('.hero-bg');
  const hero = document.querySelector('.hero');

  if (hero) {
    setTimeout(() => hero.classList.add('loaded'), 100);
  }

  if (heroBg) {
    window.addEventListener('scroll', function () {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `scale(1) translateY(${scrolled * 0.25}px)`;
      }
    }, { passive: true });
  }

  // === Mobile menu ===
  const menuToggle = document.querySelector('.navbar-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuClose = document.querySelector('.mobile-menu-close');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    if (menuClose) {
      menuClose.addEventListener('click', closeMobileMenu);
    }

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  // === Intersection Observer - Fade in animations ===
  const fadeElements = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
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

    fadeElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback sans IntersectionObserver
    fadeElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // === Smooth scroll pour les ancres ===
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    });
  });

  // === Newsletter form ===
  const newsletterForm = document.querySelector('.newsletter-form');
  const newsletterSuccess = document.querySelector('.newsletter-success');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      const email = emailInput.value.trim();

      if (!email || !isValidEmail(email)) {
        emailInput.style.borderColor = '#e74c3c';
        emailInput.focus();
        return;
      }

      // Simuler l'envoi
      const submitBtn = this.querySelector('button');
      submitBtn.textContent = 'Envoi...';
      submitBtn.disabled = true;

      setTimeout(function () {
        newsletterForm.style.display = 'none';
        if (newsletterSuccess) {
          newsletterSuccess.style.display = 'block';
        }
      }, 800);
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // === Lazy loading images (fallback pour navigateurs sans support natif) ===
  if (!('loading' in HTMLImageElement.prototype)) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
      const imgObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            imgObserver.unobserve(img);
          }
        });
      });
      lazyImages.forEach(function (img) {
        imgObserver.observe(img);
      });
    }
  }

  // === Scroll indicator hero ===
  const heroScroll = document.querySelector('.hero-scroll');
  if (heroScroll) {
    heroScroll.addEventListener('click', function () {
      const nextSection = document.querySelector('#presentation');
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    heroScroll.style.cursor = 'pointer';
  }

})();
