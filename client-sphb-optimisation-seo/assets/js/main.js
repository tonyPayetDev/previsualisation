/* =============================================
   SPHB - Main JavaScript
   ============================================= */

'use strict';

/* ---------- Header scroll effect ---------- */
const header = document.querySelector('.site-header');
if (header) {
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Mobile menu ---------- */
const menuToggle = document.querySelector('.menu-toggle');
const headerNav = document.querySelector('.header-nav');

if (menuToggle && headerNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = headerNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
    // Animate hamburger to X
    const spans = menuToggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  // Close menu on nav link click
  headerNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      headerNav.classList.remove('open');
      const spans = menuToggle.querySelectorAll('span');
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) {
      headerNav.classList.remove('open');
      const spans = menuToggle.querySelectorAll('span');
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

/* ---------- Hero Carousel ---------- */
class Carousel {
  constructor(el) {
    this.el = el;
    this.slidesWrapper = el.querySelector('.carousel-slides');
    this.slides = el.querySelectorAll('.carousel-slide');
    this.dots = el.querySelectorAll('.carousel-dot');
    this.prevBtn = el.querySelector('.carousel-prev');
    this.nextBtn = el.querySelector('.carousel-next');
    this.current = 0;
    this.count = this.slides.length;
    this.autoplayInterval = null;
    this.init();
  }

  init() {
    this.goTo(0);
    this.startAutoplay();

    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());

    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.goTo(i);
        this.restartAutoplay();
      });
    });

    // Pause on hover
    this.el.addEventListener('mouseenter', () => this.stopAutoplay());
    this.el.addEventListener('mouseleave', () => this.startAutoplay());

    // Touch/swipe support
    let startX = 0;
    this.el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    this.el.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
        this.restartAutoplay();
      }
    }, { passive: true });
  }

  goTo(index) {
    this.slides[this.current].classList.remove('active');
    if (this.dots[this.current]) this.dots[this.current].classList.remove('active');

    this.current = (index + this.count) % this.count;
    this.slidesWrapper.style.transform = `translateX(-${this.current * 100}%)`;

    this.slides[this.current].classList.add('active');
    if (this.dots[this.current]) this.dots[this.current].classList.add('active');
  }

  next() { this.goTo(this.current + 1); }
  prev() { this.goTo(this.current - 1); }

  startAutoplay() {
    this.autoplayInterval = setInterval(() => this.next(), 5500);
  }

  stopAutoplay() {
    clearInterval(this.autoplayInterval);
  }

  restartAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }
}

const carouselEl = document.querySelector('.hero-carousel');
if (carouselEl) new Carousel(carouselEl);

/* ---------- Scroll Animations (AOS-like) ---------- */
const animateOnScroll = () => {
  const elements = document.querySelectorAll('[data-aos]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = entry.target.getAttribute('data-aos-delay') || 0;
        setTimeout(() => {
          entry.target.classList.add('aos-visible');
        }, Number(delay));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
};

if ('IntersectionObserver' in window) {
  document.addEventListener('DOMContentLoaded', animateOnScroll);
} else {
  // Fallback: show all
  document.querySelectorAll('[data-aos]').forEach(el => el.classList.add('aos-visible'));
}

/* ---------- Lazy loading fallback ---------- */
if ('loading' in HTMLImageElement.prototype === false) {
  const images = document.querySelectorAll('img[loading="lazy"]');
  const imgObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        imgObserver.unobserve(img);
      }
    });
  });
  images.forEach(img => imgObserver.observe(img));
}

/* ---------- Active nav highlight ---------- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.header-nav a[href^="#"]');

if (sections.length && navLinks.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const active = document.querySelector(`.header-nav a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));
}

/* ---------- Smooth scroll for anchor links ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80; // header height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
