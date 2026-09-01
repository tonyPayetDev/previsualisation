// Navbar scroll behavior
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile menu
function setMenu(open) {
  hamburger.classList.toggle('open', open);
  navLinks.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
}

hamburger.addEventListener('click', () => {
  setMenu(!navLinks.classList.contains('open'));
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => setMenu(false));
});

// Échap ferme le panneau : sans ça, au clavier, on y reste enfermé.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) setMenu(false);
});

// Hero loaded animation
window.addEventListener('load', () => {
  document.querySelector('.hero')?.classList.add('loaded');
});

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Smooth counter animation
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1500;
  const start = performance.now();

  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target) + (el.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// Form submission
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const original = btn.innerHTML;
    btn.innerHTML = 'Message envoyé';
    btn.style.background = '#7a6f4a';
    btn.style.borderColor = '#7a6f4a';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.innerHTML = original;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      form.reset();
    }, 3000);
  });
}

// Gallery lightbox
(function() {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="Fermer">&times;</button>
    <button class="lightbox-nav lightbox-prev" aria-label="Précédent">&#8249;</button>
    <!-- Ni src="" ni src absent : le premier fait recharger la page courante en
         tâche de fond, le second laisse une image sans source que tout contrôle
         automatique compte comme cassée. Un pixel transparent en data: ne
         déclenche aucune requête et rend l'emplacement valide tant que la
         visionneuse n'a pas été ouverte. La vraie source est posée au clic. -->
    <img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
    <button class="lightbox-nav lightbox-next" aria-label="Suivant">&#8250;</button>
  `;
  document.body.appendChild(lightbox);

  const items = Array.from(document.querySelectorAll('.galerie-item img'));
  let current = 0;

  function open(index) {
    current = index;
    lightbox.querySelector('img').src = items[current].src;
    lightbox.querySelector('img').alt = items[current].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  items.forEach((img, i) => {
    img.parentElement.addEventListener('click', () => open(i));
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', close);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => open((current - 1 + items.length) % items.length));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => open((current + 1) % items.length));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') open((current - 1 + items.length) % items.length);
    if (e.key === 'ArrowRight') open((current + 1) % items.length);
  });
})();

// Lazy images fallback
document.querySelectorAll('img[loading="lazy"]').forEach(img => {
  if (!img.complete) {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s';
    img.addEventListener('load', () => { img.style.opacity = '1'; });
  }
});

/* ── 01/09 · le sous-menu déroulant a été retiré ──────────────────────────
   Les pizzerias ne sont plus cachées derrière un survol : elles occupent un
   rail permanent dans l'en-tête (.navbar-lieux), visible sur mobile comme
   sur desktop. Le JS qui ouvrait le sous-menu au tap n'a plus d'objet. */
