/* ============================================================
   Le Saint-Pierre — Comportements et motion
   Un seul geste appuyé (le hero), le reste soutient sans se répéter.
   ============================================================ */

'use strict';

(function () {

  var racine = document.documentElement;
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Si GSAP n'a pas répondu, on retire la classe `js` : les états de
     départ (opacity 0, clip-path) disparaissent et la page reste lisible.
     Une animation qui échoue ne doit jamais effacer le contenu. */
  var gsap = window.gsap;
  if (!gsap || reduit) {
    racine.classList.remove('js');
  }

  /* ---------- NAVIGATION : fond au défilement ---------- */
  var nav = document.getElementById('nav');
  var auDefilement = function () {
    nav.classList.toggle('est-pose', window.scrollY > 60);
  };
  window.addEventListener('scroll', auDefilement, { passive: true });
  auDefilement();

  /* ---------- MENU MOBILE ---------- */
  var bascule = document.getElementById('navBascule');
  var liens = document.getElementById('navLiens');

  var fermerMenu = function () {
    liens.classList.remove('ouvert');
    bascule.setAttribute('aria-expanded', 'false');
    bascule.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
  };

  bascule.addEventListener('click', function (e) {
    e.stopPropagation();
    var ouvert = liens.classList.toggle('ouvert');
    bascule.setAttribute('aria-expanded', String(ouvert));
    bascule.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = ouvert ? 'hidden' : '';
  });

  liens.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', fermerMenu);
  });

  document.addEventListener('click', function (e) {
    if (liens.classList.contains('ouvert') &&
        !liens.contains(e.target) && !bascule.contains(e.target)) {
      fermerMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && liens.classList.contains('ouvert')) {
      fermerMenu();
      bascule.focus();
    }
  });

  /* ---------- LIEN ACTIF ---------- */
  var sections = document.querySelectorAll('section[id]');
  var ancres = document.querySelectorAll('.nav__liens a[href^="#"]');

  if ('IntersectionObserver' in window) {
    var veilleSection = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        ancres.forEach(function (a) {
          a.classList.toggle('actif', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { threshold: 0.35 });
    sections.forEach(function (s) { veilleSection.observe(s); });
  }

  /* ============================================================
     MOTION
     ============================================================ */
  if (!gsap || reduit) return;

  gsap.defaults({ ease: 'expo.out' });

  /* ---------- LE GESTE : ouverture du hero ----------
     La photo se pose (1.14 → 1), le titre monte derrière son masque,
     le filet se tire, puis le reste suit. Une seule fois, au chargement. */
  var heroImg = document.getElementById('heroImg');

  var ouverture = gsap.timeline({ delay: 0.15 });

  if (heroImg) {
    ouverture.fromTo(heroImg,
      { scale: 1.14, opacity: 0 },
      { scale: 1, opacity: 1, duration: 2.6, ease: 'expo.out' }, 0);
  }

  ouverture
    /* `opacity: 1` au départ du tween : le CSS garde le titre transparent
       jusqu'ici pour éviter qu'il clignote avant que GSAP le descende.
       Sans cette reprise, il resterait invisible pour toujours — c'est le
       nom du restaurant, il n'a pas le droit de manquer. */
    .fromTo('.hero__masque > *',
      { yPercent: 108, opacity: 1 },
      { yPercent: 0, duration: 1.6, ease: 'expo.out' }, 0.25)
    .fromTo('.hero__filet',
      { scaleX: 0, opacity: 1 },
      { scaleX: 1, duration: 1.2, ease: 'expo.out' }, 0.85)
    .fromTo('.hero__sous, .hero__lieu, .hero__actions',
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, stagger: 0.11 }, 0.95)
    .fromTo('.hero__cue',
      { opacity: 0 },
      { opacity: 1, duration: 0.9 }, 1.7);

  /* ---------- REVEALS AU DÉFILEMENT ----------
     Volontairement différents du hero : les photos se dévoilent par un
     masque qui descend, les textes montent de très peu. Pas la même
     entrée répétée sur chaque section. */
  var jouer = function (el) {
    var type = el.dataset.anim;

    if (type === 'voile') {
      var tl = gsap.timeline();
      /* `opacity: 1` dans l'état de départ : le CSS laisse l'élément
         transparent mais NON rogné, sinon son aire d'intersection tombe
         à zéro et l'observateur ne le voit jamais entrer dans l'écran. */
      tl.fromTo(el,
        { clipPath: 'inset(0 0 100% 0)', opacity: 1 },
        { clipPath: 'inset(0 0 0% 0)', duration: 1.25, ease: 'expo.out' });
      var img = el.querySelector('img');
      if (img) {
        tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
      }
      return;
    }

    if (type === 'filet') {
      gsap.fromTo(el, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 1, ease: 'expo.out' });
      return;
    }

    if (type === 'masque') {
      gsap.fromTo(el.children, { yPercent: 108, opacity: 1 }, { yPercent: 0, duration: 1.4 });
      return;
    }

    /* `monte` — le défaut. Amplitude faible : le texte se pose, il ne
       saute pas. Les listes décalent leurs enfants. */
    var enfants = el.matches('.atouts__liste, .coches') ? el.children : null;
    if (enfants) {
      gsap.set(el, { opacity: 1 });
      gsap.fromTo(enfants, { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.09 });
    } else {
      gsap.fromTo(el, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });
    }
  };

  var aAnimer = document.querySelectorAll('[data-anim]');
  var horsHero = [];
  aAnimer.forEach(function (el) {
    if (!el.closest('.hero')) horsHero.push(el);
  });

  if ('IntersectionObserver' in window) {
    var veille = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        veille.unobserve(e.target);
        jouer(e.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -60px 0px' });

    /* Léger décalage entre voisins d'un même bloc : le groupe respire
       au lieu d'apparaître d'un bloc. */
    horsHero.forEach(function (el, i) {
      setTimeout(function () { veille.observe(el); }, i % 4 * 40);
    });
  } else {
    racine.classList.remove('js');
  }

  /* ---------- PARALLAXE DE LA TERRASSE ----------
     La bande est plus haute que son cadre : on la fait dériver au
     défilement. rAF + listener passif, pas de plugin de scroll. */
  var terrasseImg = document.getElementById('terrasseImg');
  var bande = document.querySelector('.terrasse');

  if (terrasseImg && bande) {
    var enAttente = false;

    var deriver = function () {
      var r = bande.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { enAttente = false; return; }
      /* -1 quand la bande entre par le bas, +1 quand elle sort par le haut */
      var avancee = (r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight / 2 + r.height / 2);
      gsap.set(terrasseImg, { yPercent: avancee * 8 });
      enAttente = false;
    };

    window.addEventListener('scroll', function () {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(deriver);
    }, { passive: true });

    deriver();
  }

})();
