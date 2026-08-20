/* ============================================================
   LE CLOS DE LA RIVIÈRE — main.js
   Fonctionnalités : Header scroll, menu burger, lazy loading,
   animations scroll, newsletter, back-to-top
============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     Header — scroll state + burger menu
  ────────────────────────────────────────────────────────── */
  const header = document.getElementById('header');
  const burgerBtn = document.getElementById('burger-btn');
  const mainNav = document.getElementById('main-nav');

  function updateHeaderState() {
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  // Throttle scroll events
  let scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        updateHeaderState();
        handleBackToTop();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  updateHeaderState(); // état initial

  // Burger menu
  if (burgerBtn && mainNav) {
    burgerBtn.addEventListener('click', function () {
      const isOpen = mainNav.classList.toggle('open');
      burgerBtn.classList.toggle('active', isOpen);
      burgerBtn.setAttribute('aria-expanded', isOpen.toString());
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Fermer le menu en cliquant sur un lien nav
    mainNav.querySelectorAll('.header__nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
        burgerBtn.classList.remove('active');
        burgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Fermer le menu avec Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('open')) {
        mainNav.classList.remove('open');
        burgerBtn.classList.remove('active');
        burgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        burgerBtn.focus();
      }
    });

    // Fermer le menu en cliquant en dehors
    document.addEventListener('click', function (e) {
      if (mainNav.classList.contains('open') &&
          !mainNav.contains(e.target) &&
          !burgerBtn.contains(e.target)) {
        mainNav.classList.remove('open');
        burgerBtn.classList.remove('active');
        burgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     Navigation active link on scroll
  ────────────────────────────────────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header__nav-link[href^="#"]');

  function updateActiveNavLink() {
    if (!sections.length || !navLinks.length) return;
    let currentSection = '';
    sections.forEach(function (section) {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        currentSection = '#' + section.id;
      }
    });

    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === currentSection);
    });
  }

  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  /* ──────────────────────────────────────────────────────────
     Smooth Scroll pour les ancres
  ────────────────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 80;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });

  /* ──────────────────────────────────────────────────────────
     Lazy Loading images (Intersection Observer polyfill-safe)
  ────────────────────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px 0px'
    });

    lazyImages.forEach(function (img) {
      imageObserver.observe(img);
    });
  }

  /* ──────────────────────────────────────────────────────────
     Animation au scroll (Intersection Observer)
  ────────────────────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const animElements = document.querySelectorAll('.animate-in');

    const animObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    animElements.forEach(function (el) {
      animObserver.observe(el);
    });

    // Ajouter les classes d'animation dynamiquement aux éléments clés
    function addAnimations() {
      const selectors = [
        '.offer-card',
        '.suite-card',
        '.place-card',
        '.review-card',
        '.instagram__item',
        '.section-header',
        '.feature',
        '.residence__content > *',
        '.offers__content > *'
      ];

      selectors.forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (el, i) {
          el.classList.add('animate-in');
          if (i === 1) el.classList.add('animate-in--delay-1');
          if (i === 2) el.classList.add('animate-in--delay-2');
          if (i === 3) el.classList.add('animate-in--delay-3');
          if (i >= 4) el.classList.add('animate-in--delay-4');
          animObserver.observe(el);
        });
      });
    }

    addAnimations();
  }

  /* ──────────────────────────────────────────────────────────
     Back to Top button
  ────────────────────────────────────────────────────────── */
  const backToTopBtn = document.getElementById('back-to-top');

  function handleBackToTop() {
    if (!backToTopBtn) return;
    if (window.scrollY > 400) {
      backToTopBtn.removeAttribute('hidden');
    } else {
      backToTopBtn.setAttribute('hidden', '');
    }
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ──────────────────────────────────────────────────────────
     Newsletter form
  ────────────────────────────────────────────────────────── */
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterSuccess = document.getElementById('newsletter-success');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = document.getElementById('newsletter-email');
      const email = emailInput ? emailInput.value.trim() : '';

      // Validation simple
      if (!email || !isValidEmail(email)) {
        if (emailInput) {
          emailInput.style.borderColor = 'rgba(255, 100, 100, 0.7)';
          emailInput.focus();
          setTimeout(function () {
            if (emailInput) emailInput.style.borderColor = '';
          }, 3000);
        }
        return;
      }

      // Simuler l'envoi (à remplacer par une vraie intégration)
      const submitBtn = newsletterForm.querySelector('.newsletter__submit');
      if (submitBtn) {
        submitBtn.textContent = 'Inscription...';
        submitBtn.disabled = true;
      }

      setTimeout(function () {
        if (newsletterSuccess) {
          newsletterSuccess.removeAttribute('hidden');
        }
        newsletterForm.reset();
        if (submitBtn) {
          submitBtn.textContent = 'S\'inscrire';
          submitBtn.disabled = false;
        }
      }, 1000);
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ──────────────────────────────────────────────────────────
     Video hero fallback
  ────────────────────────────────────────────────────────── */
  const heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    heroVideo.addEventListener('error', function () {
      // Si la vidéo ne charge pas, afficher l'image de fond
      const heroMedia = document.querySelector('.hero__media');
      if (heroMedia) {
        heroMedia.style.backgroundImage = 'url(assets/images/hero-residence.jpg)';
        heroMedia.style.backgroundSize = 'cover';
        heroMedia.style.backgroundPosition = 'center';
      }
      heroVideo.style.display = 'none';
    });

    // Réduire la lecture sur appareils avec préférence de réduction de mouvement
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroVideo.pause();
      heroVideo.removeAttribute('autoplay');
    }
  }

  /* ──────────────────────────────────────────────────────────
     Carousel / Slider pour les suites sur mobile
  ────────────────────────────────────────────────────────── */
  function initSuitesCarousel() {
    const suitesGrid = document.querySelector('.suites__grid');
    if (!suitesGrid || window.innerWidth > 768) return;

    let startX = 0;
    let isDragging = false;
    let currentIndex = 0;
    const cards = suitesGrid.querySelectorAll('.suite-card');

    if (cards.length <= 1) return;

    suitesGrid.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    suitesGrid.addEventListener('touchend', function (e) {
      if (!isDragging) return;
      isDragging = false;
      const deltaX = e.changedTouches[0].clientX - startX;
      if (Math.abs(deltaX) > 50) {
        if (deltaX < 0 && currentIndex < cards.length - 1) {
          currentIndex++;
        } else if (deltaX > 0 && currentIndex > 0) {
          currentIndex--;
        }
      }
    });
  }

  initSuitesCarousel();

  /* ──────────────────────────────────────────────────────────
     Performance: Preload hero image si pas de vidéo
  ────────────────────────────────────────────────────────── */
  if (!heroVideo || heroVideo.networkState === 3) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = 'assets/images/hero-residence.jpg';
    document.head.appendChild(preload);
  }

  /* ──────────────────────────────────────────────────────────
     Keyboard Navigation Enhancement
  ────────────────────────────────────────────────────────── */
  document.querySelectorAll('.suite-card, .place-card').forEach(function (card) {
    card.setAttribute('tabindex', '0');
    card.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        const link = card.querySelector('a');
        if (link) link.click();
      }
    });
  });

})();
