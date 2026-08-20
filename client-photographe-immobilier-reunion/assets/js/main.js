/* ========================================
   NAVIGATION
======================================== */
const navbar = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-toggle');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  document.body.classList.toggle('nav-open');
});

document.querySelectorAll('.nav-link, .nav-cta .btn').forEach(el => {
  el.addEventListener('click', () => {
    navToggle.classList.remove('active');
    document.body.classList.remove('nav-open');
  });
});

/* ========================================
   GALLERY FILTER
======================================== */
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    galleryItems.forEach((item, i) => {
      if (filter === 'all' || item.dataset.category === filter) {
        item.classList.remove('hidden');
        item.style.animationDelay = `${(i % 6) * 60}ms`;
      } else {
        item.classList.add('hidden');
      }
    });
  });
});

/* ========================================
   LIGHTBOX
======================================== */
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbTitle = document.getElementById('lb-title');
const lbCat = document.getElementById('lb-cat');

let currentIdx = 0;

function getVisible() {
  return [...document.querySelectorAll('.gallery-item:not(.hidden)')];
}

function openLightbox(idx) {
  const items = getVisible();
  currentIdx = idx;
  const item = items[currentIdx];
  if (!item) return;
  lbImg.src = item.querySelector('img').src;
  lbImg.alt = item.querySelector('img').alt;
  lbTitle.textContent = item.querySelector('.gallery-info h4').textContent;
  lbCat.textContent = item.querySelector('.gallery-info span').textContent;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function shiftLightbox(dir) {
  const items = getVisible();
  currentIdx = (currentIdx + dir + items.length) % items.length;
  openLightbox(currentIdx);
}

galleryItems.forEach(item => {
  item.addEventListener('click', () => {
    const visible = getVisible();
    openLightbox(visible.indexOf(item));
  });
});

document.querySelector('.lb-close').addEventListener('click', closeLightbox);
document.querySelector('.lb-prev').addEventListener('click', () => shiftLightbox(-1));
document.querySelector('.lb-next').addEventListener('click', () => shiftLightbox(1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') shiftLightbox(-1);
  if (e.key === 'ArrowRight') shiftLightbox(1);
});

/* ========================================
   SCROLL REVEAL
======================================== */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ========================================
   COUNTER ANIMATION
======================================== */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const dur = 1800;
  const step = target / (dur / 16);
  let current = 0;
  const t = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current) + suffix;
    if (current >= target) clearInterval(t);
  }, 16);
}

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));

/* ========================================
   CONTACT FORM
======================================== */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const success = document.getElementById('form-success');
    success.style.display = 'block';
    form.reset();
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { success.style.display = 'none'; }, 6000);
  });
}

/* ========================================
   HERO PARALLAX (light)
======================================== */
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
    }
  }, { passive: true });
}
