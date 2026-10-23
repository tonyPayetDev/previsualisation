/* ========================================
   BY GLAD CAFÉ — Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Hero Slider ---- */
  const slides = document.querySelectorAll('.hero__slide');
  const dots = document.querySelectorAll('.hero__dot');
  let current = 0;
  let timer;

  const goTo = (index) => {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  };

  const next = () => goTo(current + 1);

  const startTimer = () => {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); startTimer(); });
  });

  if (slides.length > 1) startTimer();

  /* ---- Sticky Header ---- */
  const header = document.querySelector('.header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 80);
    backTop.classList.toggle('visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile Nav ---- */
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  const overlay = document.querySelector('.nav-overlay');

  const closeNav = () => {
    hamburger.classList.remove('active');
    nav.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
  };

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    nav.classList.toggle('open');
    if (overlay) overlay.style.display = nav.classList.contains('open') ? 'block' : 'none';
  });

  overlay?.addEventListener('click', closeNav);

  document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  /* ---- Smooth Scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = header.offsetHeight + 16;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---- Back to top ---- */
  const backTop = document.querySelector('.back-to-top');
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---- Scroll reveal (IntersectionObserver) ---- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---- Cookie Banner ---- */
  const cookieBanner = document.querySelector('.cookie-banner');
  const cookieAccept = document.querySelector('.cookie-accept');
  const cookieDecline = document.querySelector('.cookie-decline');

  if (cookieBanner && !localStorage.getItem('bygladcafe_cookie')) {
    setTimeout(() => cookieBanner.classList.add('visible'), 1500);
  }
  cookieAccept?.addEventListener('click', () => {
    localStorage.setItem('bygladcafe_cookie', 'accepted');
    cookieBanner.classList.remove('visible');
  });
  cookieDecline?.addEventListener('click', () => {
    localStorage.setItem('bygladcafe_cookie', 'declined');
    cookieBanner.classList.remove('visible');
  });

  /* ---- Active nav link on scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.style.color = '');
        const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
        if (active) active.style.color = 'var(--primary-light)';
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => activeObserver.observe(s));
});
