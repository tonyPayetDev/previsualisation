/* =============================================
   Sud Hôtel Reunion - Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* -------- Header scroll effect -------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* -------- Mobile nav toggle -------- */
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('open');
  });
  navMenu?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('open');
    });
  });

  /* -------- Hero Slider -------- */
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.dot');
  let current = 0;
  let timer;

  const goTo = (n) => {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  };

  const startAuto = () => { timer = setInterval(() => goTo(current + 1), 5000); };
  const resetAuto = () => { clearInterval(timer); startAuto(); };

  document.querySelector('.slider-arrow.prev')?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  document.querySelector('.slider-arrow.next')?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); resetAuto(); }));

  if (slides.length) startAuto();

  /* -------- Scroll-to-top -------- */
  const scrollTopBtn = document.querySelector('.scroll-top');
  scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* -------- Fade-in on scroll (IntersectionObserver) -------- */
  const fadeEls = document.querySelectorAll('.fade-in');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  fadeEls.forEach(el => io.observe(el));

  /* -------- Gallery Lightbox -------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.querySelector('img')?.src;
      if (src) {
        lightboxImg.src = src;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

  document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* -------- Language switcher -------- */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  /* -------- Booking form - date defaults -------- */
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const fmt = d => d.toISOString().split('T')[0];
  const checkin = document.getElementById('checkin');
  const checkout = document.getElementById('checkout');
  if (checkin) { checkin.min = fmt(today); checkin.value = fmt(today); }
  if (checkout) { checkout.min = fmt(tomorrow); checkout.value = fmt(tomorrow); }
  if (checkin && checkout) {
    checkin.addEventListener('change', () => {
      const minOut = new Date(checkin.value);
      minOut.setDate(minOut.getDate() + 1);
      checkout.min = fmt(minOut);
      if (checkout.value <= checkin.value) checkout.value = fmt(minOut);
    });
  }

  /* -------- Contact form submit -------- */
  const contactForm = document.getElementById('contact-form');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Message sent!';
    btn.disabled = true;
    btn.style.background = '#28a745';
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
      btn.style.background = '';
      contactForm.reset();
    }, 3000);
  });

  /* -------- Book form submit -------- */
  const bookForm = document.getElementById('book-form');
  bookForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = bookForm.querySelector('[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Request sent! We\'ll contact you shortly.';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
    }, 4000);
  });

  /* -------- Smooth anchor scroll -------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 70;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });

});
