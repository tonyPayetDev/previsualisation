/* ===== NAVIGATION SCROLL ===== */
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
  document.getElementById('back-to-top').classList.toggle('visible', window.scrollY > 400);
});

/* ===== HAMBURGER ===== */
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

/* ===== HERO SLIDER ===== */
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
let current = 0;
let autoplay;

function goTo(idx) {
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = (idx + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].classList.add('active');
}

function startAutoplay() {
  autoplay = setInterval(() => goTo(current + 1), 5000);
}
function resetAutoplay() {
  clearInterval(autoplay);
  startAutoplay();
}

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => { goTo(i); resetAutoplay(); });
});
document.querySelector('.arrow-prev').addEventListener('click', () => { goTo(current - 1); resetAutoplay(); });
document.querySelector('.arrow-next').addEventListener('click', () => { goTo(current + 1); resetAutoplay(); });
startAutoplay();

/* ===== PRODUITS SLIDER ===== */
const track = document.querySelector('.produits-track');
const prodCards = document.querySelectorAll('.produit-card');
let prodIdx = 0;
const visibleProd = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;

function updateProdSlider() {
  const cardW = track.parentElement.offsetWidth / visibleProd();
  const gap = 24;
  const slideW = cardW + gap;
  prodCards.forEach(c => { c.style.minWidth = `${cardW}px`; });
  const maxIdx = prodCards.length - visibleProd();
  prodIdx = Math.min(prodIdx, maxIdx);
  track.style.transform = `translateX(-${prodIdx * slideW}px)`;
}

document.querySelector('.prod-prev').addEventListener('click', () => {
  prodIdx = Math.max(0, prodIdx - 1);
  updateProdSlider();
});
document.querySelector('.prod-next').addEventListener('click', () => {
  prodIdx = Math.min(prodCards.length - visibleProd(), prodIdx + 1);
  updateProdSlider();
});
window.addEventListener('resize', updateProdSlider);
updateProdSlider();

/* ===== CONTACT FORM ===== */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';
    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.textContent = 'Envoyer le message';
      document.querySelector('.form-success').style.display = 'block';
      setTimeout(() => { document.querySelector('.form-success').style.display = 'none'; }, 4000);
    }, 1200);
  });
}

/* ===== BACK TO TOP ===== */
document.getElementById('back-to-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== LAZY IMAGES ===== */
const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const img = e.target;
        if (img.dataset.src) { img.src = img.dataset.src; }
        io.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  lazyImgs.forEach(img => io.observe(img));
}

/* ===== ANIMATIONS ON SCROLL ===== */
const animEls = document.querySelectorAll('.service-card, .produit-card, .offre-card, .magasin-card, .horaire-card, .social-card');
if ('IntersectionObserver' in window) {
  const anim = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('anim-in'), i * 80);
        anim.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  animEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    anim.observe(el);
  });
}
document.head.insertAdjacentHTML('beforeend', `
<style>
.anim-in { animation: fadeUp 0.5s ease forwards; }
@keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
</style>`);
