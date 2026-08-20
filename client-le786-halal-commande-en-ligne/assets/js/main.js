/* ===================================
   LE786 - JavaScript principal
   =================================== */

(function () {
  'use strict';

  /* ----------------------------------------
     HEADER SCROLL
  ---------------------------------------- */
  const header = document.getElementById('header');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    toggleBackToTop();
  }, { passive: true });

  /* ----------------------------------------
     MOBILE MENU
  ---------------------------------------- */
  const hamburger = document.querySelector('.hamburger');
  const navMobile = document.querySelector('.nav-mobile');
  const navMobileOverlay = document.querySelector('.nav-mobile-overlay');
  const navMobileClose = document.querySelector('.nav-mobile-close');

  function openMenu() {
    navMobile.classList.add('open');
    navMobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navMobile.classList.remove('open');
    navMobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openMenu);
  if (navMobileClose) navMobileClose.addEventListener('click', closeMenu);
  if (navMobileOverlay) navMobileOverlay.addEventListener('click', closeMenu);

  // Close menu on nav link click
  document.querySelectorAll('.nav-mobile-links a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  /* ----------------------------------------
     BACK TO TOP
  ---------------------------------------- */
  const backToTop = document.getElementById('back-to-top');

  function toggleBackToTop() {
    if (!backToTop) return;
    if (window.scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ----------------------------------------
     ACTIVE NAV LINK ON SCROLL
  ---------------------------------------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  function updateActiveNavLink() {
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      if (
        section.offsetTop <= scrollPos &&
        section.offsetTop + section.offsetHeight > scrollPos
      ) {
        navLinks.forEach(link => link.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${section.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  /* ----------------------------------------
     ANIMATE ON SCROLL (Intersection Observer)
  ---------------------------------------- */
  const animateElements = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    animateElements.forEach(el => observer.observe(el));
  } else {
    // Fallback for old browsers
    animateElements.forEach(el => el.classList.add('visible'));
  }

  /* ----------------------------------------
     COUNTDOWN TIMER
  ---------------------------------------- */
  function getEndOfDay() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  let countdownEnd = getEndOfDay();

  function updateCountdown() {
    const now = new Date();
    let diff = countdownEnd - now;

    if (diff <= 0) {
      countdownEnd = getEndOfDay();
      diff = countdownEnd - new Date();
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const h = document.getElementById('countdown-h');
    const m = document.getElementById('countdown-m');
    const s = document.getElementById('countdown-s');

    if (h) h.textContent = String(hours).padStart(2, '0');
    if (m) m.textContent = String(minutes).padStart(2, '0');
    if (s) s.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ----------------------------------------
     ADD TO CART
  ---------------------------------------- */
  let cartCount = 0;
  const cartCountEl = document.querySelector('.cart-count');

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `
        <div class="toast-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="toast-msg"></span>
      `;
      document.body.appendChild(toast);
    }

    toast.querySelector('.toast-msg').textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  document.querySelectorAll('.product-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      cartCount++;
      if (cartCountEl) cartCountEl.textContent = cartCount;

      // Button animation
      btn.style.transform = 'scale(1.3)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 200);

      const productCard = btn.closest('.product-card, .offer-card');
      const productName = productCard
        ? productCard.querySelector('h3')?.textContent
        : 'Produit';

      showToast(`"${productName}" ajouté au panier`);
    });
  });

  // Wishlist
  document.querySelectorAll('.product-wishlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.style.color = btn.style.color === 'rgb(229, 62, 62)' ? '' : 'rgb(229, 62, 62)';
      showToast('Produit ajouté à vos favoris');
    });
  });

  /* ----------------------------------------
     CONTACT FORM
  ---------------------------------------- */
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector('[type="submit"]');
      const originalText = btn.textContent;

      btn.textContent = 'Envoi en cours...';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = '✓ Message envoyé !';
        btn.style.background = '#2d7a2d';
        showToast('Votre message a bien été envoyé !');

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.disabled = false;
          contactForm.reset();
        }, 3000);
      }, 1500);
    });
  }

  /* ----------------------------------------
     NEWSLETTER FORM
  ---------------------------------------- */
  const newsletterForm = document.getElementById('newsletter-form');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"]');
      if (email && email.value) {
        showToast('Merci ! Vous êtes inscrit(e) à notre newsletter');
        email.value = '';
      }
    });
  }

  /* ----------------------------------------
     SMOOTH SCROLL FOR ANCHOR LINKS
  ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ----------------------------------------
     LAZY LOADING IMAGES (native + fallback)
  ---------------------------------------- */
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      // Browser handles it natively
    });
  } else {
    // Fallback with Intersection Observer
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
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
  }

  /* ----------------------------------------
     HERO STATS COUNTER ANIMATION
  ---------------------------------------- */
  function animateCounter(el, target, duration = 1500) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString('fr-FR') + (el.dataset.suffix || '');

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll('[data-count]');
        counters.forEach(counter => {
          animateCounter(counter, parseInt(counter.dataset.count));
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) statsObserver.observe(heroStats);

})();
