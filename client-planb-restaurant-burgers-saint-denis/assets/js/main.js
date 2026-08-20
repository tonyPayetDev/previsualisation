/* ============================================
   PLAN B - JavaScript Principal
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     Navigation - Scroll Effect
     ============================================ */
  const navbar = document.querySelector('.navbar');
  const floatingCta = document.querySelector('.floating-cta');
  const scrollTop = document.querySelector('.scroll-top');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Navbar scroll effect
    if (scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Floating CTA visibility
    if (scrollY > 400) {
      floatingCta?.classList.add('visible');
      scrollTop?.classList.add('visible');
    } else {
      floatingCta?.classList.remove('visible');
      scrollTop?.classList.remove('visible');
    }
  });

  /* ============================================
     Mobile Navigation Toggle
     ============================================ */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
    document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
  });

  // Close nav on link click
  navMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle?.classList.remove('open');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close nav on outside click
  document.addEventListener('click', (e) => {
    if (navMenu?.classList.contains('open') && !navMenu.contains(e.target) && !navToggle?.contains(e.target)) {
      navToggle?.classList.remove('open');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  /* ============================================
     Scroll to Top
     ============================================ */
  scrollTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ============================================
     Intersection Observer - Animations
     ============================================ */
  const animatedElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  animatedElements.forEach((el, index) => {
    el.style.transitionDelay = `${(index % 4) * 0.1}s`;
    observer.observe(el);
  });

  /* ============================================
     Lazy Loading Images
     ============================================ */
  const lazyImages = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '200px'
  });

  lazyImages.forEach(img => imageObserver.observe(img));

  /* ============================================
     Smooth Active Nav Link
     ============================================ */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '-80px 0px 0px 0px'
  });

  sections.forEach(section => sectionObserver.observe(section));

  /* ============================================
     Counter Animation
     ============================================ */
  function animateCounter(el, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        start = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(start);
    }, 16);
  }

  const counters = document.querySelectorAll('[data-counter]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.counter);
        animateCounter(entry.target, target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  /* ============================================
     Burger Cards - Click to reveal info
     ============================================ */
  const burgerCards = document.querySelectorAll('.burger-card');
  burgerCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.querySelector('.burger-card-img img')?.classList.add('zoomed');
    });
    card.addEventListener('mouseleave', () => {
      card.querySelector('.burger-card-img img')?.classList.remove('zoomed');
    });
  });

  /* ============================================
     Reviews - Auto scroll on mobile
     ============================================ */
  // Simple touch/swipe detection for reviews grid
  let startX;
  const reviewsGrid = document.querySelector('.reviews-grid');

  if (reviewsGrid && window.innerWidth <= 768) {
    reviewsGrid.style.overflowX = 'auto';
    reviewsGrid.style.display = 'flex';
    reviewsGrid.style.scrollSnapType = 'x mandatory';
    reviewsGrid.querySelectorAll('.review-card').forEach(card => {
      card.style.minWidth = '280px';
      card.style.scrollSnapAlign = 'start';
    });
  }

  /* ============================================
     Phone number click tracking (for analytics)
     ============================================ */
  document.querySelectorAll('a[href^="tel:"]').forEach(tel => {
    tel.addEventListener('click', () => {
      console.log('Phone CTA clicked');
    });
  });

});

/* ============================================
   Utility: Debounce
   ============================================ */
function debounce(fn, delay = 100) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
