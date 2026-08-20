/* =============================================
   L'Andalouse - Saint Joseph - Scripts
   ============================================= */

// ---- Navbar scroll effect ----
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
});

// ---- Hamburger menu ----
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.querySelectorAll('span').forEach((s, i) => {
    s.style.transform = navLinks.classList.contains('open')
      ? (i === 0 ? 'rotate(45deg) translate(5px, 5px)' : i === 2 ? 'rotate(-45deg) translate(5px, -5px)' : 'opacity:0')
      : '';
    if (i === 1) s.style.opacity = navLinks.classList.contains('open') ? '0' : '1';
  });
});

// Close menu on nav link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ---- Lightbox ----
const lightbox = document.querySelector('.lightbox');
const lightboxImg = lightbox.querySelector('img');
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
let currentIndex = 0;

const imageSrcs = galleryItems.map(item => item.querySelector('img').src);

function openLightbox(index) {
  currentIndex = index;
  lightboxImg.src = imageSrcs[currentIndex];
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function showNext() {
  currentIndex = (currentIndex + 1) % imageSrcs.length;
  lightboxImg.src = imageSrcs[currentIndex];
}

function showPrev() {
  currentIndex = (currentIndex - 1 + imageSrcs.length) % imageSrcs.length;
  lightboxImg.src = imageSrcs[currentIndex];
}

galleryItems.forEach((item, i) => {
  item.addEventListener('click', () => openLightbox(i));
});

lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
lightbox.querySelector('.lightbox-next').addEventListener('click', showNext);
lightbox.querySelector('.lightbox-prev').addEventListener('click', showPrev);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
});

// ---- Scroll to top ----
const scrollTopBtn = document.querySelector('.scroll-top');
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---- Highlight today in horaires ----
const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const today = days[new Date().getDay()];
document.querySelectorAll('.horaire-row').forEach(row => {
  const jour = row.querySelector('.jour').textContent.toLowerCase().trim();
  if (jour.includes(today)) {
    row.classList.add('today');
  }
});

// ---- Animate score bars on scroll ----
const scoreFills = document.querySelectorAll('.score-fill');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target;
      const target = fill.dataset.width;
      fill.style.width = target;
      observer.unobserve(fill);
    }
  });
}, { threshold: 0.3 });

scoreFills.forEach(fill => {
  fill.style.width = '0';
  observer.observe(fill);
});

// ---- Smooth reveal on scroll ----
const revealElements = document.querySelectorAll('.avis-card, .restaurant-card, .gallery-item, .feature-item');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});
