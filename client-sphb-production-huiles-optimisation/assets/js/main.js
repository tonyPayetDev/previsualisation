/**
 * SPHB - Scripts principaux
 * Société de Production des Huiles de Bourbon
 */

'use strict';

/* =============================================
   PRÉFÉRENCE DE MOUVEMENT
   Une seule source de vérité, consultée par tout le fichier.
   ============================================= */
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => motionQuery.matches;
const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

/* =============================================
   HEADER AU SCROLL
   ============================================= */
const header = document.querySelector('.site-header');

if (header) {
  const handleHeaderScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();
}

/* =============================================
   NAVIGATION MOBILE
   ============================================= */
const hamburger = document.querySelector('.hamburger');
const mainNav = document.querySelector('.main-nav');

if (hamburger && mainNav) {
  const setNav = (open) => {
    hamburger.classList.toggle('active', open);
    mainNav.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };

  hamburger.addEventListener('click', () => {
    setNav(!hamburger.classList.contains('active'));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNav(false));
  });

  document.addEventListener('click', (e) => {
    if (header && !header.contains(e.target)) setNav(false);
  });

  // Échap ferme le menu et rend le focus au bouton
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.classList.contains('active')) {
      setNav(false);
      hamburger.focus();
    }
  });
}

/* =============================================
   RETOUR EN HAUT
   ============================================= */
const scrollTopBtn = document.querySelector('.scroll-top');

if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  });
}

/* =============================================
   APPARITIONS AU SCROLL
   Neutralisées si l'utilisateur demande moins de mouvement.
   ============================================= */
const fadeElements = document.querySelectorAll('.fade-in');

if (fadeElements.length) {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    fadeElements.forEach((el) => el.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    fadeElements.forEach((el) => observer.observe(el));
  }
}

/* =============================================
   FORMULAIRE DE CONTACT
   Aucun serveur n'est branché sur ce site : le formulaire compose
   un message pour infos@sphb.re dans la messagerie du visiteur.
   Il n'annonce donc jamais un envoi qui n'a pas eu lieu.
   ============================================= */
const contactForm = document.getElementById('contact-form');

if (contactForm) {
  const statusEl = document.getElementById('form-status');
  const DESTINATAIRE = 'infos@sphb.re';

  const rules = {
    prenom:    (v) => (v.trim().length >= 2 ? '' : 'Indiquez votre prénom (2 caractères minimum).'),
    nom:       (v) => (v.trim().length >= 2 ? '' : 'Indiquez votre nom (2 caractères minimum).'),
    email:     (v) => (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) ? '' : 'Indiquez une adresse email valide, par exemple nom@exemple.re.'),
    telephone: (v) => (v.trim() === '' || /^[+0-9\s().-]{6,}$/.test(v.trim()) ? '' : 'Ce numéro de téléphone semble incomplet.'),
    sujet:     (v) => (v ? '' : 'Choisissez un sujet dans la liste.'),
    message:   (v) => (v.trim().length >= 10 ? '' : 'Détaillez votre demande en quelques mots (10 caractères minimum).')
  };

  const showError = (field, msg) => {
    const errEl = document.getElementById('err-' + field.id);
    if (msg) {
      field.setAttribute('aria-invalid', 'true');
      if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
    } else {
      field.removeAttribute('aria-invalid');
      if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
    }
  };

  const validateField = (field) => {
    const rule = rules[field.id];
    if (!rule) return true;
    const msg = rule(field.value);
    showError(field, msg);
    return msg === '';
  };

  Object.keys(rules).forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
    field.addEventListener('change', () => {
      if (field.tagName === 'SELECT') validateField(field);
    });
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let firstInvalid = null;
    Object.keys(rules).forEach((id) => {
      const field = document.getElementById(id);
      if (field && !validateField(field) && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      if (statusEl) {
        statusEl.textContent = 'Le formulaire comporte des champs à corriger.';
        statusEl.classList.add('error');
      }
      firstInvalid.focus();
      return;
    }

    const val = (id) => (document.getElementById(id) || {}).value || '';
    const sujet = val('sujet');
    const corps = [
      'Prénom : ' + val('prenom'),
      'Nom : ' + val('nom'),
      'Email : ' + val('email'),
      'Téléphone : ' + (val('telephone').trim() || 'non renseigné'),
      'Sujet : ' + sujet,
      '',
      val('message')
    ].join('\n');

    const href = 'mailto:' + DESTINATAIRE +
      '?subject=' + encodeURIComponent('[Site SPHB] ' + sujet) +
      '&body=' + encodeURIComponent(corps);

    if (statusEl) {
      statusEl.classList.remove('error');
      statusEl.textContent = 'Votre messagerie s’ouvre avec le message pré-rempli. Si rien ne se passe, écrivez directement à ' + DESTINATAIRE + '.';
    }

    window.location.href = href;
  });
}

/* =============================================
   ANCRES INTERNES
   ============================================= */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    const offsetTop = target.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: offsetTop, behavior: scrollBehavior() });

    // Le focus suit le scroll, sinon la navigation au clavier reste en haut de page
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
});

/* =============================================
   COMPTEURS
   ============================================= */
function animateCounter(el, target, duration = 1800) {
  const suffix = el.dataset.suffix || '';
  const isFloat = String(target).includes('.');
  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target + suffix;
  }

  requestAnimationFrame(update);
}

const statNumbers = document.querySelectorAll('.stat-number[data-count]');

if (statNumbers.length) {
  const settle = (el) => {
    el.textContent = el.dataset.count + (el.dataset.suffix || '');
  };

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    statNumbers.forEach(settle);
  } else {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        animateCounter(el, parseFloat(el.dataset.count));
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });

    statNumbers.forEach((el) => counterObserver.observe(el));
  }
}
