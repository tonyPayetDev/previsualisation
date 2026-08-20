/* ===== PIZZA MENU DATA ===== */
const pizzas = [
  // Nouveautés
  { id: 1, cat: 'nouveautes', name: 'Sarcives', desc: 'Sauce tomate, crème fraîche, oignons, ananas, gros piments, sarcives poulet, pomme de terre rissolées, fromage, olives', prices: [12, 15, 14, 17] },
  { id: 2, cat: 'nouveautes', name: 'Auvergnate', desc: 'Sauce tomate, jambon de poulet, bleu d\'auvergne, fromage, olives', prices: [11, 15, 14, 17] },
  { id: 3, cat: 'nouveautes', name: 'Tartiflette', desc: 'Crème fraîche, jambon de poulet, oignons, reblochon, pomme de terre rissolées, fromage, olives, persil', prices: [12, 15, 14, 17] },
  { id: 4, cat: 'nouveautes', name: 'La Royale Revisitée', desc: 'Sauce tomate, jambon de poulet, viande hachée de bœuf, champignons, crème fraîche, œuf, fromage, olives', prices: [12, 15, 14, 17] },
  { id: 5, cat: 'nouveautes', name: 'Tuerie', desc: 'Crème fraîche, fromage, saucisse fumée, merguez poulet, jambon poulet, oignons, pomme de terre persillées, tomates cerises, olives', prices: [13, 15, 14, 17] },
  { id: 6, cat: 'nouveautes', name: 'Kebab', desc: 'Crème kebab, oignons, pomme de terre, fromage, tomates fraîches, ciboulette, olives', prices: [13, 15, 14, 17] },
  { id: 7, cat: 'nouveautes', name: 'Burger', desc: 'Sauce tomate, sauce burger, bœuf haché, oignons, cheddar, cornichons, tomate cerise, mozarella, olives', prices: [13, 15, 14, 17] },
  // Viandes
  { id: 8, cat: 'viandes', name: 'Milanaise', desc: 'Sauce tomate, fromage, poulet, crème fraîche, tomates fraîches, olives', prices: [10, 12, 11, 16] },
  { id: 9, cat: 'viandes', name: 'Boisée', desc: 'Crème fraîche, fromage, poulet, poivrons, olives', prices: [10, 12, 11, 16] },
  { id: 10, cat: 'viandes', name: 'Orientale', desc: 'Sauce tomate, fromage, merguez, oignons, poivrons, olives', prices: [11, 13, 13, 16] },
  { id: 11, cat: 'viandes', name: 'Romaine', desc: 'Sauce tomate, fromage, jambon, poivrons, crème fraîche, olives', prices: [11, 13, 12, 16] },
  { id: 12, cat: 'viandes', name: 'Hawaïenne', desc: 'Sauce tomate, fromage, poulet, ananas, crème fraîche, olives', prices: [11, 13, 12, 16] },
  { id: 13, cat: 'viandes', name: 'Forestière', desc: 'Crème fraîche, fromage, poulet, champignons, pomme de terre, olives', prices: [11, 14, 13, 16] },
  { id: 14, cat: 'viandes', name: 'Fermière', desc: 'Crème fraîche, fromage, poulet, oignons, persillade, olives', prices: [11, 13, 12, 14] },
  { id: 15, cat: 'viandes', name: 'Reine', desc: 'Sauce tomate, fromage, jambon de poulet, champignons, olives', prices: [11, 13, 12, 16] },
  { id: 16, cat: 'viandes', name: 'Casablanca', desc: 'Sauce tomate, fromage, merguez, oignons, poivrons, œuf, olives', prices: [11, 13, 12, 16] },
  { id: 17, cat: 'viandes', name: 'Planète', desc: 'Sauce tomate, fromage, poulet, oignons, poivrons, crème fraîche, olives', prices: [12, 13, 12, 16] },
  { id: 18, cat: 'viandes', name: 'Texane', desc: 'Sauce barbecue, fromage, bœuf haché, cornichons, oignons, crème fraîche, olives', prices: [12, 14, 13, 16] },
  { id: 19, cat: 'viandes', name: 'Tex-Mex', desc: 'Sauce tomate, fromage, poulet, merguez, oignons, gros piments, olives', prices: [12, 14, 13, 16] },
  { id: 20, cat: 'viandes', name: 'Créole', desc: 'Sauce tomate, fromage, saucisse poulet fumée, oignons, gros piments, pomme de terre, olives', prices: [12, 14, 13, 16] },
  { id: 21, cat: 'viandes', name: 'Légendaire', desc: 'Crème fraîche, fromage, poulet, merguez, oignons, poivrons, olives', prices: [12, 14, 13, 17] },
  { id: 22, cat: 'viandes', name: 'Campagnarde', desc: 'Sauce tomate, fromage, poulet, jambon, pomme de terre, poivrons, olives', prices: [12, 14, 13, 17] },
  { id: 23, cat: 'viandes', name: 'Royale', desc: 'Sauce tomate, fromage, jambon de poulet, champignons, œuf, olives', prices: [12, 14, 13, 16] },
  { id: 24, cat: 'viandes', name: 'Mexicaine', desc: 'Sauce tomate, fromage, bœuf haché, œuf, poivrons, tomates fraîches, olives', prices: [12, 14, 13, 17] },
  { id: 25, cat: 'viandes', name: 'Volcano', desc: 'Sauce tomate, fromage, poulet, ananas, gros piments, crème fraîche, olives', prices: [12, 14, 13, 16] },
  { id: 26, cat: 'viandes', name: 'Bollywood', desc: 'Sauce tomate, fromage, poulet tandoori, oignons, poivrons, crème fraîche, olives', prices: [12, 14, 14, 16] },
  // Poissons
  { id: 27, cat: 'poissons', name: 'Catalane', desc: 'Crème fraîche, fromage, thon, poivrons, olives', prices: [10, 12, 13, 16] },
  { id: 28, cat: 'poissons', name: 'Napolitaine', desc: 'Sauce tomate, fromage, anchois, citrons, olives', prices: [10, 12, 11, 16] },
  { id: 29, cat: 'poissons', name: 'Norvégienne', desc: 'Sauce tomate, fromage, saumon, crème fraîche, olives', prices: [10, 12, 11, 16] },
  { id: 30, cat: 'poissons', name: 'Océane', desc: 'Sauce tomate, fromage, thon, citrons, œuf, crème fraîche, olives', prices: [11, 13, 12, 16] },
  { id: 31, cat: 'poissons', name: 'Russe', desc: 'Crème fraîche, fromage, saumon, citrons, olives', prices: [11, 13, 12, 16] },
  { id: 32, cat: 'poissons', name: 'Vénusienne', desc: 'Sauce tomate, fromage, camarons tandoori, citrons, poivrons, crème fraîche, olives', prices: [12, 14, 13, 17] },
  // Végétarienne
  { id: 33, cat: 'vege', name: 'Margarita', desc: 'Sauce tomate, fromage, olives', prices: [9, 11, 10, 12] },
  { id: 34, cat: 'vege', name: 'Végétarienne', desc: 'Sauce tomate, fromage, champignons, tomates fraîches, oignons, aubergines, olives', prices: [10, 14, 13, 16] },
  { id: 35, cat: 'vege', name: 'Montagnarde', desc: 'Sauce tomate, fromage, champignons, oignons, poivrons, crème fraîche, olives', prices: [10, 14, 13, 16] },
  { id: 36, cat: 'vege', name: '4 Fromages', desc: 'Sauce tomate, emmental, mozzarella, bleu, chèvre, olives', prices: [10, 13, 13, 16] },
  { id: 37, cat: 'vege', name: 'Mielleuse', desc: 'Sauce tomate, fromage, chèvre, miel, poivrons, olives', prices: [11, 14, 13, 16] },
  { id: 38, cat: 'vege', name: 'Reblochon', desc: 'Crème fraîche, fromage, reblochon, pomme de terre, poivrons, olives', prices: [11, 14, 13, 16] },
  // Sucrée
  { id: 39, cat: 'sucree', name: 'Reine des Bois', desc: 'Crème pâtissière à la vanille de Madagascar, fruits rouges des bois, coulis de fruits rouges, nappage Nutella, sucre glace, pâte italienne', prices: [10, 13, null, 16] },
  { id: 40, cat: 'sucree', name: 'Gourmande', desc: 'Crème pâtissière vanillée, banane', prices: [8, 11, null, 15] },
];

const categories = [
  { id: 'toutes', label: 'Toutes', img: 'assets/images/toutes.png' },
  { id: 'nouveautes', label: 'Nouveautés', img: 'assets/images/nouveau.png' },
  { id: 'viandes', label: 'Viandes', img: 'assets/images/viande.png' },
  { id: 'poissons', label: 'Poissons', img: 'assets/images/poisson.png' },
  { id: 'vege', label: 'Végétarien', img: 'assets/images/vege.png' },
  { id: 'sucree', label: 'Sucrée', img: 'assets/images/sucre.png' },
];

const sizes = ['S', 'M', 'L', 'XL'];

/* ===== RENDER MENU ===== */
function renderMenu(filterCat = 'toutes') {
  const grid = document.getElementById('pizza-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = filterCat === 'toutes' ? pizzas : pizzas.filter(p => p.cat === filterCat);

  filtered.forEach(p => {
    const card = document.createElement('article');
    card.className = 'pizza-card fade-in';
    const catLabel = categories.find(c => c.id === p.cat)?.label || '';

    const priceHtml = p.prices.map((price, i) =>
      price ? `<div class="pizza-price-item"><small>${sizes[i]}</small> <span>${price}€</span></div>` : ''
    ).join('');

    card.innerHTML = `
      <div class="pizza-info">
        <div class="pizza-badge">${catLabel}</div>
        <h3 class="pizza-name">${p.name}</h3>
        <p class="pizza-desc">${p.desc}</p>
      </div>
      <div class="pizza-prices">${priceHtml}</div>
    `;
    grid.appendChild(card);
  });

  setTimeout(() => {
    grid.querySelectorAll('.pizza-card').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 30);
    });
  }, 10);
}

/* ===== INIT TABS ===== */
function initTabs() {
  const tabsContainer = document.getElementById('menu-tabs');
  if (!tabsContainer) return;

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (cat.id === 'toutes' ? ' active' : '');
    btn.dataset.cat = cat.id;
    btn.innerHTML = `<img src="${cat.img}" alt="${cat.label}" loading="lazy"><span>${cat.label}</span>`;
    btn.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenu(cat.id);
    });
    tabsContainer.appendChild(btn);
  });

  renderMenu('toutes');
}

/* ===== HEADER SCROLL ===== */
function initHeader() {
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ===== MOBILE NAV ===== */
function initMobileNav() {
  const btn = document.getElementById('burger-btn');
  const nav = document.getElementById('mobile-nav');
  const links = nav ? nav.querySelectorAll('a') : [];

  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* ===== BACK TO TOP ===== */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ===== INTERSECTION OBSERVER ===== */
function initFadeIn() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initTabs();
  initBackToTop();
  initFadeIn();
});
