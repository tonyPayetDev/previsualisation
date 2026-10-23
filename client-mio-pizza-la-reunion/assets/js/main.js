/* ============================================
   MIO Pizza - La Réunion | main.js
   ============================================ */

'use strict';

// -------- Header scroll shadow --------
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.style.boxShadow = window.scrollY > 20
    ? '0 4px 20px rgba(0,0,0,.18)'
    : '0 2px 12px rgba(0,0,0,.1)';
}, { passive: true });

// -------- Mobile menu toggle --------
const hamburger   = document.querySelector('.hamburger');
const mobileMenu  = document.querySelector('.mobile-menu');

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

// Close mobile menu on link click
mobileMenu?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// Close on outside click
document.addEventListener('click', e => {
  if (mobileMenu?.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)) {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  }
});

// -------- Back to top --------
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  backToTop?.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// -------- Active nav highlight --------
const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
const sections = [];
navLinks.forEach(a => {
  const target = document.querySelector(a.getAttribute('href'));
  if (target) sections.push({ link: a, el: target });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const match = sections.find(s => s.el === entry.target);
    if (match) match.link.classList.toggle('active', entry.isIntersecting);
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s.el));

// -------- Leaflet Map --------
function initMap() {
  if (typeof L === 'undefined') return;

  const pizzerias = [
    { name: 'MIO Pizza Saint-Gilles',       lat: -21.0547, lng: 55.2292, address: '8 Rue de la Plage, 97434 Saint-Gilles-les-Bains', phone: '0262 24 00 11', type: 'pizzeria' },
    { name: 'MIO Pizza Le Port',            lat: -20.9358, lng: 55.2912, address: '12 Rue du Commerce, 97420 Le Port',                 phone: '0262 43 22 33', type: 'pizzeria' },
    { name: 'MIO Pizza La Possession',      lat: -20.9322, lng: 55.3352, address: 'Centre-Ville, 97419 La Possession',                phone: '0262 22 11 44', type: 'pizzeria' },
    { name: 'MIO Pizza Saint-Pierre',       lat: -21.3388, lng: 55.4781, address: '5 Rue Victor Hugo, 97410 Saint-Pierre',            phone: '0262 25 77 88', type: 'pizzeria' },
    { name: 'MIO Pizza Saint-Denis',        lat: -20.8789, lng: 55.4481, address: '3 Rue Maréchal Leclerc, 97400 Saint-Denis',        phone: '0262 41 55 22', type: 'pizzeria' },
    { name: 'MIO Pizza Saint-Paul',         lat: -21.0041, lng: 55.2713, address: '24 Avenue Général De Gaulle, 97460 Saint-Paul',    phone: '0262 45 12 78', type: 'pizzeria' },
    { name: 'MIO Pizza Saint-Louis',        lat: -21.2691, lng: 55.4191, address: '15 Rue Bourbon, 97450 Saint-Louis',               phone: '0262 26 44 99', type: 'pizzeria' },
    { name: 'MIO Pizza Saint-Leu',          lat: -21.1594, lng: 55.2838, address: '7 Rue du Général Lambert, 97436 Saint-Leu',       phone: '0262 34 77 55', type: 'pizzeria' },
    { name: 'MIO Pizza Le Tampon',          lat: -21.2768, lng: 55.5200, address: 'Route Hubert Delisle, 97430 Le Tampon',           phone: '0262 57 88 11', type: 'pizzeria' },
    // Distributeurs Pizzadéor
    { name: 'Pizzadéor Saint-Gilles',       lat: -21.0512, lng: 55.2268, address: 'Saint-Gilles-les-Bains', phone: '24h/24',          type: 'distributeur' },
    { name: 'Pizzadéor Le Port',            lat: -20.9380, lng: 55.2960, address: 'Le Port',                phone: '24h/24',          type: 'distributeur' },
    { name: 'Pizzadéor Saint-Joseph',       lat: -21.3819, lng: 55.6166, address: 'Saint-Joseph',           phone: '24h/24',          type: 'distributeur' },
  ];

  const map = L.map('map', { scrollWheelZoom: false }).setView([-21.1151, 55.3800], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  const iconPizzeria = L.divIcon({
    className: '',
    html: `<div style="background:#bb0c0c;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(0,0,0,.3);border:2px solid #fff;">🍕</div>`,
    iconSize: [32,32], iconAnchor: [16,16], popupAnchor: [0,-18]
  });
  const iconDistrib = L.divIcon({
    className: '',
    html: `<div style="background:#008000;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(0,0,0,.3);border:2px solid #fff;">🏧</div>`,
    iconSize: [32,32], iconAnchor: [16,16], popupAnchor: [0,-18]
  });

  pizzerias.forEach(p => {
    const icon   = p.type === 'pizzeria' ? iconPizzeria : iconDistrib;
    const badge  = p.type === 'pizzeria'
      ? `<span style="background:#bb0c0c;color:#fff;padding:2px 8px;border-radius:20px;font-size:11px;">Pizzeria</span>`
      : `<span style="background:#008000;color:#fff;padding:2px 8px;border-radius:20px;font-size:11px;">Distributeur 24h/24</span>`;

    const popup = `
      <div style="font-family:Montserrat,sans-serif;min-width:200px;">
        <p style="font-weight:800;margin-bottom:6px;font-size:14px;">${p.name}</p>
        ${badge}
        <p style="font-size:12px;color:#555;margin-top:8px;">📍 ${p.address}</p>
        <p style="font-size:12px;color:#008000;font-weight:700;">📞 ${p.phone}</p>
      </div>`;
    L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(popup);
  });
}

// -------- Modals --------
document.querySelectorAll('[data-modal]').forEach(trigger => {
  trigger.addEventListener('click', e => {
    e.preventDefault();
    const id = trigger.getAttribute('data-modal');
    const modal = document.getElementById(id);
    modal?.classList.add('open');
  });
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.remove('open'));
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

// -------- Cookie banner --------
const cookieBanner = document.getElementById('cookie-banner');
if (cookieBanner && !localStorage.getItem('cookies_accepted')) {
  cookieBanner.style.display = 'flex';
}
document.getElementById('cookie-accept')?.addEventListener('click', () => {
  localStorage.setItem('cookies_accepted', '1');
  cookieBanner.style.display = 'none';
});
document.getElementById('cookie-refuse')?.addEventListener('click', () => {
  localStorage.setItem('cookies_accepted', '0');
  cookieBanner.style.display = 'none';
});

// -------- Lazy load images --------
if ('IntersectionObserver' in window) {
  const lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          lazyObserver.unobserve(img);
        }
      }
    });
  }, { rootMargin: '200px' });
  document.querySelectorAll('img[data-src]').forEach(img => lazyObserver.observe(img));
}

// -------- Init on DOM ready --------
document.addEventListener('DOMContentLoaded', () => {
  initMap();

  // Animate sections on scroll
  const animObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        animObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -80px 0px' });
  document.querySelectorAll('.pizzeria-card, .equipe-card, .timeline-item, .pizzadeor-feature').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    animObserver.observe(el);
  });
  // Add .animated CSS
  const style = document.createElement('style');
  style.textContent = '.animated { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);
});
