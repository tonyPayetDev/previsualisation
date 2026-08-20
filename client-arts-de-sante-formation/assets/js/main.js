/* ============================================
   Arts de Santé - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Sticky Header ----
  const header = document.querySelector('.header');
  const handleScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
    backToTop.classList.toggle('visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  // ---- Mobile Menu ----
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuClose = document.querySelector('.mobile-menu-close');

  const openMenu = () => {
    mobileMenu.classList.add('open');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  };

  hamburger?.addEventListener('click', openMenu);
  mobileMenuClose?.addEventListener('click', closeMenu);
  mobileMenu?.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  // Close on nav link click
  document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // ---- Back to Top ----
  const backToTop = document.querySelector('.back-to-top');
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---- Intersection Observer for Fade-in Animations ----
  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ---- Lazy Loading Images ----
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported – already handled by HTML loading="lazy"
  } else {
    // Fallback for older browsers
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          obs.unobserve(img);
        }
      });
    });
    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // ---- Form Submission (Module Offert) ----
  const moduleForm = document.getElementById('moduleForm');
  moduleForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = moduleForm.querySelector('.form-submit');
    const originalText = btn.textContent;

    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = '✓ Module envoyé !';
      btn.style.background = '#2ecc71';
      moduleForm.reset();

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3500);
    }, 1500);
  });

  // ---- Newsletter Bar Form ----
  const newsletterForm = document.getElementById('newsletterForm');
  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = newsletterForm.querySelector('button');
    btn.textContent = '✓ Inscrit !';
    btn.style.background = '#2ecc71';
    btn.style.borderColor = '#2ecc71';
    newsletterForm.querySelector('input').value = '';
    setTimeout(() => {
      btn.textContent = "S'inscrire";
      btn.style.background = '';
      btn.style.borderColor = '';
    }, 3000);
  });

  // ---- Active Nav on Scroll ----
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(section => sectionObserver.observe(section));

  // ---- Smooth anchor scroll with offset ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = header.offsetHeight + 16;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ---- Counter Animation (stats) ----
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const duration = 1600;
        const start = performance.now();

        const animate = (time) => {
          const elapsed = time - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          const current = Math.round(ease * target);
          el.textContent = current.toLocaleString('fr-FR') + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  // ---- Testimonial Carousel (mobile) ----
  let currentSlide = 0;
  const testimonialsGrid = document.querySelector('.testimonials-grid');
  const slides = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.carousel-dot');

  if (window.innerWidth <= 768 && slides.length > 0) {
    // Simple touch/swipe detection
    let touchStartX = 0;

    testimonialsGrid?.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    testimonialsGrid?.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        // Not needed in grid layout but kept for future carousel
      }
    }, { passive: true });
  }

});
