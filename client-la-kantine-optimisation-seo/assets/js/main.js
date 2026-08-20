/* LA KANTINE - Main JS */
'use strict';

/* ---- Sticky header ---- */
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 50);
  document.querySelector('.scroll-top').classList.toggle('visible', window.scrollY > 400);
});

/* ---- Mobile menu ---- */
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileClose = document.querySelector('.mobile-menu-close');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});
mobileClose?.addEventListener('click', () => {
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
});
mobileMenu?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ---- Scroll to top ---- */
document.querySelector('.scroll-top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---- Intersection Observer (fade-up) ---- */
const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.1 });
fadeEls.forEach(el => observer.observe(el));

/* ---- Category tabs ---- */
const catTabs = document.querySelectorAll('.cat-tab');
const productCards = document.querySelectorAll('.product-card');
catTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    catTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const cat = tab.dataset.cat;
    productCards.forEach(card => {
      if (cat === 'all' || card.dataset.cat === cat) {
        card.style.display = '';
        card.style.animation = 'fadeIn 0.4s ease';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

/* ---- Filter tags (order section) ---- */
document.querySelectorAll('.filter-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    const searchInput = document.querySelector('.search-bar-big input');
    if (searchInput) {
      searchInput.value = tag.textContent.trim();
      searchInput.focus();
    }
  });
});

/* ---- Add to cart ---- */
let cartCount = 0;
const cartBadge = document.querySelector('.cart-count');
document.querySelectorAll('.add-cart-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    cartCount++;
    cartBadge.textContent = cartCount;
    const card = btn.closest('.product-card');
    const name = card?.querySelector('.product-name')?.textContent || 'Produit';
    showToast(`🛒 ${name} ajouté au panier !`);
  });
});

/* ---- Wishlist toggle ---- */
document.querySelectorAll('.product-wishlist').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    btn.textContent = btn.classList.contains('active') ? '❤️' : '🤍';
    showToast(btn.classList.contains('active') ? '❤️ Ajouté à vos favoris' : '🤍 Retiré des favoris');
  });
});

/* ---- Search functionality ---- */
const navSearchInput = document.querySelector('.nav-search input');
navSearchInput?.addEventListener('input', debounce(handleSearch, 300));

const heroSearchInput = document.querySelector('.search-bar-big input');
heroSearchInput?.addEventListener('input', debounce(handleSearch, 300));
document.querySelector('.search-submit')?.addEventListener('click', () => {
  const val = heroSearchInput?.value.trim();
  if (val) showToast(`🔍 Recherche : "${val}"`);
});

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    productCards.forEach(c => c.style.display = '');
    return;
  }
  productCards.forEach(card => {
    const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
    const cat = card.querySelector('.product-category')?.textContent.toLowerCase() || '';
    const desc = card.querySelector('.product-desc')?.textContent.toLowerCase() || '';
    card.style.display = (name.includes(query) || cat.includes(query) || desc.includes(query)) ? '' : 'none';
  });
}

/* ---- Hero carousel (simple fade) ---- */
const heroDots = document.querySelectorAll('.hero-dots .dot');
const heroSlides = document.querySelectorAll('.hero-slide');
let currentSlide = 0;
let heroInterval;
function goToSlide(idx) {
  heroSlides.forEach((s, i) => { s.style.opacity = i === idx ? '1' : '0'; s.style.zIndex = i === idx ? '1' : '0'; });
  heroDots.forEach((d, i) => d.classList.toggle('active', i === idx));
  currentSlide = idx;
}
heroDots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); resetInterval(); }));
function resetInterval() { clearInterval(heroInterval); heroInterval = setInterval(() => goToSlide((currentSlide + 1) % heroSlides.length), 5000); }
if (heroSlides.length > 1) resetInterval();

/* ---- Toast ---- */
const toastContainer = document.querySelector('.toast-container');
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

/* ---- Newsletter ---- */
document.querySelector('.newsletter-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const inp = e.target.querySelector('input');
  if (inp?.value) {
    showToast('✅ Inscription réussie ! Merci.');
    inp.value = '';
  }
});

/* ---- Smooth anchor links ---- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---- Lazy load (fallback) ---- */
if ('loading' in HTMLImageElement.prototype) {
  document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.src = img.dataset.src || img.src; });
} else {
  const lazyObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.src = e.target.dataset.src || e.target.src; lazyObs.unobserve(e.target); } });
  });
  document.querySelectorAll('img[loading="lazy"]').forEach(img => lazyObs.observe(img));
}

/* ---- Utils ---- */
function debounce(fn, delay) {
  let timer;
  return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); };
}
