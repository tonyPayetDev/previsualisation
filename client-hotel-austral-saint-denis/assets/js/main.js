/* =============================================
   Hôtel Austral - Saint-Denis, La Réunion
   JavaScript Principal
   ============================================= */

'use strict';

(function () {

  /* --- Header scroll effect --- */
  const header = document.getElementById('header');
  let lastScroll = 0;

  function onScroll() {
    const currentScroll = window.scrollY;

    if (currentScroll > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Back to top
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      if (currentScroll > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }

    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* --- Mobile navigation --- */
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* --- Hero animation on load --- */
  const hero = document.getElementById('hero');
  if (hero) {
    setTimeout(function () {
      hero.classList.add('loaded');
    }, 100);
  }

  /* --- Active nav link on scroll --- */
  const sections = document.querySelectorAll('section[id]');
  const navLinkItems = document.querySelectorAll('.nav-links a[href^="#"]');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    sections.forEach(function (section) {
      if (
        scrollPos >= section.offsetTop &&
        scrollPos < section.offsetTop + section.offsetHeight
      ) {
        navLinkItems.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + section.id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* --- Intersection Observer for fade-up animations --- */
  const fadeElements = document.querySelectorAll('.fade-up');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    fadeElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback for older browsers
    fadeElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* --- Back to top button --- */
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 70;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* --- Cookie banner --- */
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieAccept = document.getElementById('cookie-accept');
  const cookieRefuse = document.getElementById('cookie-refuse');

  if (cookieBanner) {
    // Show after 1.5s if not already accepted
    if (!localStorage.getItem('cookies-accepted')) {
      setTimeout(function () {
        cookieBanner.classList.add('visible');
      }, 1500);
    }

    if (cookieAccept) {
      cookieAccept.addEventListener('click', function () {
        localStorage.setItem('cookies-accepted', 'true');
        cookieBanner.classList.remove('visible');
      });
    }

    if (cookieRefuse) {
      cookieRefuse.addEventListener('click', function () {
        localStorage.setItem('cookies-accepted', 'refused');
        cookieBanner.classList.remove('visible');
      });
    }
  }

  /* --- Reservation form --- */
  const reservationForm = document.getElementById('form-reservation');

  if (reservationForm) {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const checkIn = document.getElementById('checkin');
    const checkOut = document.getElementById('checkout');

    if (checkIn) {
      checkIn.setAttribute('min', today);
      checkIn.value = today;

      checkIn.addEventListener('change', function () {
        const nextDay = new Date(this.value);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        if (checkOut) {
          checkOut.setAttribute('min', nextDayStr);
          if (!checkOut.value || checkOut.value <= this.value) {
            checkOut.value = nextDayStr;
          }
        }
      });

      // Set default checkout to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (checkOut) {
        checkOut.setAttribute('min', tomorrow.toISOString().split('T')[0]);
        checkOut.value = tomorrow.toISOString().split('T')[0];
      }
    }

    reservationForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const btn = this.querySelector('[type="submit"]');
      const originalText = btn.textContent;

      btn.textContent = 'Recherche en cours...';
      btn.disabled = true;

      // Simulate API call
      setTimeout(function () {
        btn.textContent = 'Disponibilités trouvées !';
        btn.style.background = '#2d7a4f';

        setTimeout(function () {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.style.background = '';
        }, 2500);
      }, 1500);
    });
  }

  /* --- Counter animation for stats --- */
  function animateCounter(el, target, duration) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(function () {
      start += step;
      if (start >= target) {
        el.textContent = target + (el.dataset.suffix || '');
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(start) + (el.dataset.suffix || '');
      }
    }, 16);
  }

  const statNumbers = document.querySelectorAll('.stat-item .num, .stat-number');
  if (statNumbers.length && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.count || el.textContent, 10);
            if (!isNaN(target)) {
              animateCounter(el, target, 1200);
            }
            statsObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    statNumbers.forEach(function (el) {
      statsObserver.observe(el);
    });
  }

  /* --- Lazy loading images fallback --- */
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
      lazyImages.forEach(function (img) { imgObserver.observe(img); });
    }
  }

  /* --- Room card hover effect --- */
  document.querySelectorAll('.room-card').forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      this.style.zIndex = '2';
    });
    card.addEventListener('mouseleave', function () {
      this.style.zIndex = '';
    });
  });

  /* --- Initialize on DOM ready --- */
  onScroll();
  updateActiveNav();

})();
