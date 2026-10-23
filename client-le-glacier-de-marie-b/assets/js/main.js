/* ===================================
   Le Glacier de Marie B - JS
   =================================== */

(function () {
  'use strict';

  // Navbar scroll behavior
  const navbar = document.querySelector('.navbar');
  function onScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Back to top visibility
    const btn = document.querySelector('.back-to-top');
    if (btn) {
      btn.classList.toggle('visible', window.scrollY > 400);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile burger menu
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.navbar-menu');
  const overlay = document.getElementById('menu-overlay');

  function closeMenu() {
    burger.classList.remove('active');
    menu.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      const isOpen = menu.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        burger.classList.add('active');
        menu.classList.add('open');
        if (overlay) overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
      }
    });

    if (overlay) overlay.addEventListener('click', closeMenu);

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = navbar ? navbar.offsetHeight + 16 : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Back to top button
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Intersection Observer for fade-up animations
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

  // Lazy loading images fallback (browsers without native support)
  if (!('loading' in HTMLImageElement.prototype)) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imgObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
  }

  // Image gallery lightbox (simple)
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (galleryItems.length) {
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lb-img');
    const lbClose = document.getElementById('lb-close');
    const lbPrev = document.getElementById('lb-prev');
    const lbNext = document.getElementById('lb-next');
    let currentIndex = 0;
    const images = [];

    galleryItems.forEach((item, idx) => {
      const img = item.querySelector('img');
      if (img) images.push(img.src);

      item.addEventListener('click', () => {
        currentIndex = idx;
        showLightbox(currentIndex);
      });
    });

    function showLightbox(idx) {
      if (!lightbox || !lbImg) return;
      lbImg.src = images[idx];
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    function hideLightbox() {
      if (!lightbox) return;
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    }

    if (lbClose) lbClose.addEventListener('click', hideLightbox);
    if (lightbox) lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) hideLightbox();
    });

    if (lbPrev) {
      lbPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showLightbox(currentIndex);
      });
    }

    if (lbNext) {
      lbNext.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        showLightbox(currentIndex);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!lightbox || lightbox.style.display !== 'flex') return;
      if (e.key === 'Escape') hideLightbox();
      if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showLightbox(currentIndex);
      }
      if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % images.length;
        showLightbox(currentIndex);
      }
    });
  }

  // Map redirect
  const mapFrame = document.querySelector('.map-frame');
  if (mapFrame) {
    mapFrame.addEventListener('click', () => {
      window.open('https://maps.google.com/?q=13+Rue+de+la+Poste+97434+Saint-Gilles-les-Bains', '_blank', 'noopener');
    });
  }

  // Contact link handlers
  document.querySelectorAll('[data-tel]').forEach(el => {
    el.addEventListener('click', () => { window.location.href = 'tel:' + el.dataset.tel; });
  });

})();
