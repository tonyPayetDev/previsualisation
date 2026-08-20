/* ===================================
   LA CASA BLANCA - Main JS
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHeroSlider();
  initMobileMenu();
  initAOS();
  initNewsletter();
});

/* ===================================
   Navbar scroll behavior
   =================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ===================================
   Hero Slider
   =================================== */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.indicator');
  const prevBtn = document.querySelector('.hero-arrow--prev');
  const nextBtn = document.querySelector('.hero-arrow--next');
  if (!slides.length) return;

  let current = 0;
  let timer;

  const goTo = (index) => {
    slides[current].classList.remove('active');
    indicators[current]?.classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    indicators[current]?.classList.add('active');
  };

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  const startTimer = () => {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  };

  indicators.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); startTimer(); });
  });

  prevBtn?.addEventListener('click', () => { prev(); startTimer(); });
  nextBtn?.addEventListener('click', () => { next(); startTimer(); });

  // Touch/swipe
  let touchStartX = 0;
  const hero = document.querySelector('.hero');
  hero?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  hero?.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
      startTimer();
    }
  }, { passive: true });

  startTimer();
}

/* ===================================
   Mobile Menu
   =================================== */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeBtn = document.querySelector('.mobile-close');
  const links = document.querySelectorAll('.mobile-menu a');
  if (!hamburger || !mobileMenu) return;

  const open = () => {
    hamburger.classList.add('active');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  links.forEach((l) => l.addEventListener('click', close));
}

/* ===================================
   Scroll Animation (custom AOS)
   =================================== */
function initAOS() {
  const elements = document.querySelectorAll('[data-aos]');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ===================================
   Newsletter Form
   =================================== */
function initNewsletter() {
  const form = document.querySelector('.newsletter-form');
  const success = document.querySelector('.newsletter-success');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('.newsletter-input').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.querySelector('.newsletter-input').style.borderColor = '#ef4444';
      setTimeout(() => {
        form.querySelector('.newsletter-input').style.borderColor = '';
      }, 2000);
      return;
    }

    form.style.display = 'none';
    if (success) {
      success.style.display = 'flex';
    }
  });
}
