/* =========================================
   Le Comptoir Saint Michel - Nancy
   JavaScript principal
   ========================================= */

(function () {
  'use strict';

  // ─── NAVBAR SCROLL ───────────────────────────────
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  // ─── MOBILE MENU ─────────────────────────────────
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  function closeMenu() {
    navToggle.classList.remove('active');
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
      document.documentElement.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && navMenu.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // ─── ACTIVE NAV LINK (scroll spy) ────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

  function updateActiveLink() {
    const scrollY = window.scrollY + 150;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // ─── HERO SLIDER ─────────────────────────────────
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  let currentSlide = 0;
  let sliderInterval;

  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function startSlider() {
    sliderInterval = setInterval(nextSlide, 5500);
  }

  function stopSlider() {
    clearInterval(sliderInterval);
  }

  if (slides.length > 0) {
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        stopSlider();
        goToSlide(index);
        startSlider();
      });
    });
    startSlider();
  }

  // ─── SCROLL ANIMATIONS ───────────────────────────
  const animatedEls = document.querySelectorAll('.fade-up, .fade-in');

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

  animatedEls.forEach(el => observer.observe(el));

  // ─── LAZY LOADING (fallback for older browsers) ──
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // ─── SMOOTH SCROLL ───────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = navbar ? navbar.offsetHeight : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ─── RESERVATION FAB VISIBILITY ──────────────────
  const fab = document.querySelector('.reservation-fab');
  if (fab) {
    function toggleFab() {
      fab.style.opacity = window.scrollY > 400 ? '1' : '0';
      fab.style.pointerEvents = window.scrollY > 400 ? 'auto' : 'none';
    }
    fab.style.transition = 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.4s ease';
    fab.style.opacity = '0';
    fab.style.pointerEvents = 'none';
    window.addEventListener('scroll', toggleFab, { passive: true });
  }

  // ─── GALERIE STRIP PARALLAX (subtle) ─────────────
  const galerieItems = document.querySelectorAll('.galerie-strip-item img');
  if (galerieItems.length) {
    window.addEventListener('scroll', () => {
      const strip = document.querySelector('.galerie-strip');
      if (!strip) return;
      const rect = strip.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const ratio = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      galerieItems.forEach(img => {
        img.style.transform = `scale(1.08) translateY(${(ratio - 0.5) * -20}px)`;
      });
    }, { passive: true });
  }

  // ─── YEAR IN FOOTER ───────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
