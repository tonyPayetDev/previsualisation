/* ===========================
   GEP Santé Réunion - Scripts
   =========================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ==============================
     Navigation: scroll & mobile
     ============================== */
  const header = document.querySelector('.header');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenuMobile = document.querySelector('.nav-menu-mobile');
  const navLinks = document.querySelectorAll('.nav-link');

  // Header scroll effect
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    updateActiveLink();
    handleScrollTop();
  };

  // Mobile menu toggle
  if (navToggle && navMenuMobile) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenuMobile.classList.toggle('open');
      document.body.style.overflow = navMenuMobile.classList.contains('open') ? 'hidden' : '';
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.nav-menu-mobile .nav-link, .nav-menu-mobile .nav-cta').forEach(link => {
    link.addEventListener('click', () => {
      navToggle?.classList.remove('active');
      navMenuMobile?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Active link based on scroll position
  const updateActiveLink = () => {
    const sections = document.querySelectorAll('section[id]');
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  };

  /* ==============================
     Scroll to top button
     ============================== */
  const scrollTopBtn = document.querySelector('.scroll-top');

  const handleScrollTop = () => {
    if (!scrollTopBtn) return;
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  };

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ==============================
     Intersection Observer - Animations
     ============================== */
  const fadeElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');

  if (fadeElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Stagger delay based on data-delay attribute
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, parseInt(delay));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );

    fadeElements.forEach(el => observer.observe(el));
  }

  /* ==============================
     Counter animation
     ============================== */
  const counters = document.querySelectorAll('[data-count]');

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const update = () => {
      current += step;
      if (current < target) {
        el.textContent = Math.floor(current) + suffix;
        requestAnimationFrame(update);
      } else {
        el.textContent = target + suffix;
      }
    };

    requestAnimationFrame(update);
  };

  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(counter => counterObserver.observe(counter));
  }

  /* ==============================
     Smooth scroll for anchor links
     ============================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 80;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ==============================
     Lazy loading images (fallback)
     ============================== */
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
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  /* ==============================
     Prestation card hover effect
     ============================== */
  document.querySelectorAll('.prestation-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    });
  });

  /* ==============================
     Init
     ============================== */
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // initial call
});
