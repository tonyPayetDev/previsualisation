/* Club Café — main.js */

document.addEventListener('DOMContentLoaded', () => {

  /* ===================== NAVBAR ===================== */
  const navbar = document.getElementById('navbar');
  const navToggle = document.querySelector('.nav-toggle');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    document.getElementById('back-top').classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-mobile-open');
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      document.body.classList.remove('nav-mobile-open');
    });
  });

  /* ═══════════════ HÉROS ═══════════════
     Le fond et la phrase avancent ensemble, sur le même index. Un seul
     minuteur pour les deux : deux minuteurs séparés dérivent, et au bout de
     quelques tours la phrase ne parle plus de la photo affichée. */
  (function () {
    const fonds = [...document.querySelectorAll('.hero-fond')];
    const phrases = [...document.querySelectorAll('.hero-promesse span')];
    const onglets = [...document.querySelectorAll('.hero-onglet')];
    if (!fonds.length) return;
    const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = 0, minuteur = null;

    function aller(n) {
      i = (n + fonds.length) % fonds.length;
      fonds.forEach((el, k) => el.classList.toggle('actif', k === i));
      phrases.forEach((el, k) => el.classList.toggle('actif', k === i));
      onglets.forEach((el, k) => {
        el.classList.remove('actif');
        el.setAttribute('aria-selected', String(k === i));
      });
      /* On force le redémarrage de l'animation de la barre : sans ce reflow,
         le navigateur réutilise l'animation en cours et la barre ne repart
         pas de zéro. */
      if (onglets[i]) { void onglets[i].offsetWidth; onglets[i].classList.add('actif'); }
    }

    function relancer() {
      clearInterval(minuteur);
      if (!reduit) minuteur = setInterval(() => aller(i + 1), 6000);
    }

    onglets.forEach((b, k) => b.addEventListener('click', () => { aller(k); relancer(); }));

    /* Au clavier : flèches gauche/droite quand le héros a le focus. */
    document.getElementById('hero')?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { aller(i + 1); relancer(); }
      if (e.key === 'ArrowLeft')  { aller(i - 1); relancer(); }
    });

    /* Glissement du doigt. */
    let x = null;
    const hero = document.getElementById('hero');
    hero?.addEventListener('touchstart', (e) => { x = e.touches[0].clientX; }, { passive: true });
    hero?.addEventListener('touchend', (e) => {
      if (x === null) return;
      const d = x - e.changedTouches[0].clientX;
      if (Math.abs(d) > 50) { aller(i + (d > 0 ? 1 : -1)); relancer(); }
      x = null;
    });

    /* Onglet en arrière-plan : on arrête. Rien ne sert de faire tourner des
       photos que personne ne regarde, et ça vide la batterie d'un téléphone. */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearInterval(minuteur); else relancer();
    });

    aller(0);
    relancer();
  })();

  /* ===================== SCROLL REVEAL ===================== */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        /* stagger siblings */
        const parent = entry.target.parentElement;
        const siblings = [...parent.querySelectorAll('.reveal, .reveal-left, .reveal-right')];
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${idx * 0.08}s`;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));

  /* ===================== BACK TO TOP ===================== */
  document.getElementById('back-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ===================== CONTACT FORM ===================== */
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    /* Simulate send (no backend) */
    setTimeout(() => {
      form.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
    }, 1200);
  });

  /* ===================== SMOOTH ANCHOR SCROLL ===================== */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = navbar.offsetHeight + 20;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
  });

  /* ===================== LAZY IMAGES ===================== */
  if ('loading' in HTMLImageElement.prototype) return; /* native lazy */
  const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
  const imgObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        imgObserver.unobserve(img);
      }
    });
  });
  lazyImgs.forEach(img => imgObserver.observe(img));

});
