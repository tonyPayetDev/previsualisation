/* ============================================================
   LE CARITOLOGUE - JavaScript principal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Hero animation on load ──────────────────────────────────
  setTimeout(() => {
    document.querySelector('.hero')?.classList.add('loaded');
  }, 100);

  // ── Header scroll effect ────────────────────────────────────
  const header = document.querySelector('.header');
  const backToTop = document.querySelector('.back-to-top');

  const onScroll = () => {
    const scrollY = window.scrollY;
    header?.classList.toggle('scrolled', scrollY > 50);
    backToTop?.classList.toggle('visible', scrollY > 400);
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Back to top ─────────────────────────────────────────────
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Hero scroll indicator ───────────────────────────────────
  document.querySelector('.hero-scroll')?.addEventListener('click', () => {
    document.querySelector('#section-caris')?.scrollIntoView({ behavior: 'smooth' });
  });

  // ── Mobile navigation ───────────────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navOverlay = document.createElement('div');
  navOverlay.className = 'nav-overlay';
  navOverlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    z-index: 998; display: none; backdrop-filter: blur(2px);
  `;
  document.body.appendChild(navOverlay);

  const closeNav = () => {
    hamburger?.classList.remove('open');
    navLinks?.classList.remove('open');
    navOverlay.style.display = 'none';
    document.body.style.overflow = '';
  };

  hamburger?.addEventListener('click', () => {
    const isOpen = navLinks?.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    navOverlay.style.display = isOpen ? 'block' : 'none';
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navOverlay.addEventListener('click', closeNav);

  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // ── Intersection Observer: fade-in animations ───────────────
  const animatedEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  animatedEls.forEach(el => observer.observe(el));

  // ── Lightbox galerie ────────────────────────────────────────
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox?.querySelector('img');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  const lightboxPrev = lightbox?.querySelector('.lightbox-prev');
  const lightboxNext = lightbox?.querySelector('.lightbox-next');
  const galleryItems = document.querySelectorAll('.gallery-item');
  let currentIndex = 0;

  const openLightbox = (index) => {
    currentIndex = index;
    const src = galleryItems[currentIndex]?.querySelector('img')?.src;
    if (lightboxImg && src) {
      lightboxImg.src = src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeLightbox = () => {
    lightbox?.classList.remove('active');
    document.body.style.overflow = '';
  };

  const showPrev = () => {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    if (lightboxImg) lightboxImg.src = galleryItems[currentIndex]?.querySelector('img')?.src;
  };

  const showNext = () => {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    if (lightboxImg) lightboxImg.src = galleryItems[currentIndex]?.querySelector('img')?.src;
  };

  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', showPrev);
  lightboxNext?.addEventListener('click', showNext);

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

  // Touch swipe for lightbox
  let touchStartX = 0;
  lightbox?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lightbox?.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? showNext() : showPrev();
  });

  // ── Smooth scroll for anchor links ─────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ── Lazy loading with IntersectionObserver ──────────────────
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported — nothing extra needed
  } else {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }
          imgObserver.unobserve(img);
        }
      });
    });
    lazyImages.forEach(img => imgObserver.observe(img));
  }

  // ── Active nav link on scroll ───────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  const activateNavLink = () => {
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
        navAnchors.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${section.id}"]`);
        active?.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', activateNavLink, { passive: true });

});
