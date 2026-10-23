/* ============================================================
   Dan CaKe - Script principal
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ---- Header scroll effect ---- */
  const header = document.querySelector('.header');
  function onScroll() {
    if (window.scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Float CTA
    const floatCta = document.querySelector('.float-cta');
    if (floatCta) {
      if (window.scrollY > 400) {
        floatCta.classList.add('visible');
      } else {
        floatCta.classList.remove('visible');
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu ----
     Refait le 01/09. L'ancienne version injectait un « × » en <span> qui
     restait visible sur ordinateur, ne mettait jamais aria-expanded à jour,
     ne se fermait pas à la touche Échap et ne gérait pas le clavier. */
  const mobileToggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');

  if (mobileToggle && nav) {
    let scrollYAvant = 0;

    function ouvrirMenu() {
      scrollYAvant = window.scrollY;
      nav.classList.add('open');
      document.body.classList.add('nav-ouvert');
      // On verrouille le défilement sans faire sauter la page en haut.
      document.body.style.position = 'fixed';
      document.body.style.top = -scrollYAvant + 'px';
      document.body.style.width = '100%';
      mobileToggle.setAttribute('aria-expanded', 'true');
      mobileToggle.setAttribute('aria-label', 'Fermer le menu');
      const premier = nav.querySelector('.nav-link');
      if (premier) premier.focus({ preventScroll: true });
    }

    function fermerMenu(rendreLeFocus) {
      if (!nav.classList.contains('open')) return;
      nav.classList.remove('open');
      document.body.classList.remove('nav-ouvert');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollYAvant);
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.setAttribute('aria-label', 'Ouvrir le menu');
      if (rendreLeFocus) mobileToggle.focus({ preventScroll: true });
    }

    mobileToggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) fermerMenu(true); else ouvrirMenu();
    });

    // Échap ferme, et la tabulation reste enfermée dans le panneau ouvert.
    document.addEventListener('keydown', function (e) {
      if (!nav.classList.contains('open')) return;
      if (e.key === 'Escape') { fermerMenu(true); return; }
      if (e.key !== 'Tab') return;
      const cibles = [mobileToggle].concat(
        Array.prototype.slice.call(nav.querySelectorAll('a[href], button'))
      );
      const premier = cibles[0];
      const dernier = cibles[cibles.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault(); dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault(); premier.focus();
      }
    });

    // Tout lien du panneau referme le menu avant de naviguer.
    nav.querySelectorAll('a[href]').forEach(link => {
      link.addEventListener('click', function () { fermerMenu(false); });
    });

    // Repasser en navigation large pendant que le menu est ouvert ne doit pas
    // laisser le corps de page verrouillé.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) fermerMenu(false);
    });
  }

  /* ---- Smooth scroll for anchor links ----
     L'écart était figé à 80 px alors que la hauteur de l'en-tête change
     entre ordinateur et mobile, et entre l'état haut de page et l'état
     défilé : les titres passaient sous la barre. On mesure. */
  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = (header ? header.offsetHeight : 80) + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: mouvementReduit.matches ? 'auto' : 'smooth' });
    });
  });

  /* ---- Intersection Observer for fade-up animations ---- */
  const fadeEls = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach(el => observer.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ---- Lazy loading images (fallback for older browsers) ---- */
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported, nothing to do
  } else {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imgObserver.unobserve(img);
        }
      });
    });
    lazyImages.forEach(img => imgObserver.observe(img));
  }

  /* ---- Scroll to top button ---- */
  const scrollTopBtn = document.querySelector('.float-btn-top');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: mouvementReduit.matches ? 'auto' : 'smooth' });
    });
  }

  /* ---- Active nav link on scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ---- Counter animation ---- */
  function animateCounter(el, target, duration) {
    if (mouvementReduit.matches) {
      el.textContent = target + (el.dataset.suffix || '');
      return;
    }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        el.textContent = target + (el.dataset.suffix || '');
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(start) + (el.dataset.suffix || '');
      }
    }, 16);
  }

  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          animateCounter(el, parseInt(el.dataset.counter), 1500);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  /* ---- Image hover enhancement ---- */
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('mouseenter', function () {
      this.style.zIndex = '2';
    });
    item.addEventListener('mouseleave', function () {
      this.style.zIndex = '';
    });
  });

});
