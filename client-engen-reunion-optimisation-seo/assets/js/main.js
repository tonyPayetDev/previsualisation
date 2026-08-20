/* ===========================
   ENGEN RÉUNION - JAVASCRIPT PRINCIPAL
   =========================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ------ NAVIGATION MOBILE ------ */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.main-nav');
  const navClose = document.querySelector('.nav-close');

  if (burger && nav) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
  }
  if (navClose) {
    navClose.addEventListener('click', () => {
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
  // Close nav on link click
  document.querySelectorAll('.main-nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ------ HERO SLIDER ------ */
  const sliderTrack = document.querySelector('.slider-track');
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.querySelector('.slider-prev');
  const nextBtn = document.querySelector('.slider-next');
  let current = 0;
  let autoplay;

  const goTo = (index) => {
    if (!sliderTrack || slides.length === 0) return;
    current = (index + slides.length) % slides.length;
    sliderTrack.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  };

  const startAutoplay = () => {
    autoplay = setInterval(() => goTo(current + 1), 5500);
  };
  const resetAutoplay = () => {
    clearInterval(autoplay);
    startAutoplay();
  };

  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetAutoplay(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); resetAutoplay(); }));

  // Touch/swipe
  if (sliderTrack) {
    let touchStartX = 0;
    sliderTrack.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    sliderTrack.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { goTo(diff > 0 ? current + 1 : current - 1); resetAutoplay(); }
    }, { passive: true });
  }

  if (slides.length > 0) startAutoplay();

  /* ------ SCROLL REVEAL ------ */
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    revealObserver.observe(el);
  });

  /* ------ BACK TO TOP ------ */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------ COOKIE BANNER ------ */
  const cookieBanner = document.querySelector('.cookie-banner');
  if (cookieBanner && !localStorage.getItem('engen_cookies')) {
    setTimeout(() => cookieBanner.classList.add('show'), 1200);
    document.querySelector('.cookie-accept')?.addEventListener('click', () => {
      localStorage.setItem('engen_cookies', 'accepted');
      cookieBanner.classList.remove('show');
    });
    document.querySelector('.cookie-decline')?.addEventListener('click', () => {
      localStorage.setItem('engen_cookies', 'declined');
      cookieBanner.classList.remove('show');
    });
  }

  /* ------ CONTACT FORM ------ */
  const form = document.querySelector('.contact-form form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Message envoyé ! Notre équipe vous contactera sous 24h.');
      form.reset();
    });
  }

  /* ------ TOAST NOTIFICATION ------ */
  function showToast(message) {
    const toast = document.querySelector('.toast');
    if (!toast) return;
    toast.querySelector('.toast-msg').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  }

  /* ------ SMOOTH SCROLL ------ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerH = document.querySelector('.site-header')?.offsetHeight || 70;
        window.scrollTo({ top: target.offsetTop - headerH, behavior: 'smooth' });
      }
    });
  });

  /* ------ ACTIVE NAV ON SCROLL ------ */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
  window.addEventListener('scroll', () => {
    let scrollY = window.scrollY;
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < bottom) {
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector(`.main-nav a[href="#${id}"]`)?.classList.add('active');
      }
    });
  }, { passive: true });

  /* ------ COUNTER ANIMATION ------ */
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        let current = 0;
        const step = target / 50;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current) + suffix;
          if (current >= target) clearInterval(timer);
        }, 30);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));

});
