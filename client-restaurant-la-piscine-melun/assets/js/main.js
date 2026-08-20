/* =====================================================
   Restaurant La Piscine - JavaScript principal
   ===================================================== */

(function () {
  'use strict';

  /* === NAVIGATION STICKY === */
  const header = document.getElementById('header');

  function handleScroll() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    handleScrollTopBtn();
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  /* === BURGER MENU === */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('nav');
  const navLinks = document.querySelectorAll('nav ul li a');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Fermer le menu en cliquant en dehors
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !burger.contains(e.target)) {
        burger.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* === HERO BG ANIMATION === */
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    setTimeout(function () {
      heroBg.classList.add('loaded');
    }, 100);
  }

  /* === SCROLL ANIMATIONS (Intersection Observer) === */
  const animatedElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');

  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(function (el) {
    observer.observe(el);
  });

  /* === SCROLL TO TOP === */
  const scrollTopBtn = document.getElementById('scrollTop');

  function handleScrollTopBtn() {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* === LAZY LOADING IMAGES === */
  const lazyImages = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    lazyImages.forEach(function (img) {
      imageObserver.observe(img);
    });
  } else {
    // Fallback pour les navigateurs sans IntersectionObserver
    lazyImages.forEach(function (img) {
      img.src = img.dataset.src;
    });
  }

  /* === SMOOTH SCROLL POUR LES ANCRES === */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    });
  });

  /* === COMPTEUR ANIMÉ (stats) === */
  const statNumbers = document.querySelectorAll('.stat-number[data-count]');

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const step = 16;
    const increment = target / (duration / step);
    let current = 0;

    const timer = setInterval(function () {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current) + suffix;
    }, step);
  }

  const statsObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(function (el) {
    statsObserver.observe(el);
  });

  /* === FORMULAIRE PROMO (newsletter) === */
  const promoForm = document.querySelector('.promo-form');
  if (promoForm) {
    promoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = promoForm.querySelector('input[type="email"]');
      const btn = promoForm.querySelector('button');
      const email = input.value.trim();

      if (!email || !isValidEmail(email)) {
        input.style.borderColor = '#e74c3c';
        setTimeout(function () { input.style.borderColor = ''; }, 2000);
        return;
      }

      btn.textContent = 'Merci !';
      btn.style.background = '#2ecc71';
      btn.style.color = '#fff';
      input.value = '';
      input.disabled = true;
      btn.disabled = true;

      setTimeout(function () {
        btn.textContent = 'S\'inscrire';
        btn.style.background = '';
        btn.style.color = '';
        input.disabled = false;
        btn.disabled = false;
      }, 4000);
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* === PARALLAX LÉGER SUR LE HERO === */
  const heroContent = document.querySelector('.hero-content');

  if (heroContent && window.innerWidth > 768) {
    window.addEventListener('scroll', function () {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroContent.style.transform = 'translateY(' + (scrolled * 0.15) + 'px)';
        heroContent.style.opacity = 1 - scrolled / 700;
      }
    }, { passive: true });
  }

  /* === LIGHTBOX GALERIE SIMPLE === */
  const galerieItems = document.querySelectorAll('.galerie-item');

  if (galerieItems.length > 0) {
    // Créer la lightbox
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.92)',
      'z-index:9999',
      'align-items:center',
      'justify-content:center',
      'cursor:zoom-out'
    ].join(';');

    const lbImg = document.createElement('img');
    lbImg.style.cssText = 'max-width:92vw;max-height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 80px rgba(0,0,0,0.8)';

    const lbClose = document.createElement('button');
    lbClose.textContent = '✕';
    lbClose.style.cssText = [
      'position:absolute',
      'top:1.5rem',
      'right:1.5rem',
      'background:rgba(131,87,43,0.8)',
      'color:#fff',
      'border:none',
      'width:40px',
      'height:40px',
      'border-radius:50%',
      'font-size:1.1rem',
      'cursor:pointer',
      'display:flex',
      'align-items:center',
      'justify-content:center'
    ].join(';');

    lightbox.appendChild(lbImg);
    lightbox.appendChild(lbClose);
    document.body.appendChild(lightbox);

    galerieItems.forEach(function (item) {
      item.addEventListener('click', function () {
        const img = item.querySelector('img');
        if (img) {
          lbImg.src = img.src || img.dataset.src;
          lightbox.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      });
    });

    function closeLightbox() {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    }

    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* === ACTIVE NAV LINK AU SCROLL === */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('nav ul li a');

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navItems.forEach(function (link) {
          link.classList.remove('active-link');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active-link');
          }
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' });

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  // Ajouter le style pour active-link
  const style = document.createElement('style');
  style.textContent = '.active-link { color: var(--accent) !important; background: rgba(131,87,43,0.12) !important; }';
  document.head.appendChild(style);

  // Init au chargement
  handleScroll();

})();
