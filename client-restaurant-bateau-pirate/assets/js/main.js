/* ==========================================================================
   Restaurant Bateau Pirate — comportements
   Dependances : gsap.min.js + ScrollTrigger.min.js (vendorises, aucun CDN)
   Regle : la page doit rester entierement lisible et utilisable
           sans JavaScript, sans GSAP, et en mouvement reduit.
   ========================================================================== */
(function () {
  'use strict';

  var racine   = document.documentElement;
  var reduit   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var aGsap    = typeof window.gsap !== 'undefined';
  var aScroll  = aGsap && typeof window.ScrollTrigger !== 'undefined';

  /* --------------------------------------------------------------------
     1. Annee du copyright
     -------------------------------------------------------------------- */
  var anneeEl = document.getElementById('year');
  if (anneeEl) anneeEl.textContent = new Date().getFullYear();

  /* --------------------------------------------------------------------
     2. Ouvert / ferme, a l'heure de La Reunion
     Les creneaux ci-dessous sont EXACTEMENT ceux affiches dans la carte
     "Horaires d'ouverture". Si les horaires changent, les changer aux
     deux endroits.
     -------------------------------------------------------------------- */
  var CRENEAUX = {
    1: [[660, 870], [1080, 1320]],   // lundi    11h00-14h30 / 18h00-22h00
    2: [[660, 870], [1080, 1320]],
    3: [[660, 870], [1080, 1320]],
    4: [[660, 870], [1080, 1320]],
    5: [[660, 870], [1080, 1320]],
    6: [[660, 1350]],                // samedi   11h00-22h30
    0: [[660, 1350]]                 // dimanche 11h00-22h30
  };
  var NOMS_JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function heureReunion() {
    try {
      var f = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Indian/Reunion',
        weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      var m = {};
      f.forEach(function (p) { m[p.type] = p.value; });
      var jours = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var jour = jours[m.weekday];
      if (jour === undefined) return null;
      return { jour: jour, minutes: parseInt(m.hour, 10) * 60 + parseInt(m.minute, 10) };
    } catch (e) { return null; }
  }

  function fmt(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return m === 0 ? h + 'h' : h + 'h' + (m < 10 ? '0' + m : m);
  }

  function etatOuverture() {
    var t = heureReunion();
    if (!t) return null;
    var creneaux = CRENEAUX[t.jour] || [];
    for (var i = 0; i < creneaux.length; i++) {
      if (t.minutes >= creneaux[i][0] && t.minutes < creneaux[i][1]) {
        return { ouvert: true, court: 'Ouvert', detail: 'service jusqu’à ' + fmt(creneaux[i][1]) };
      }
    }
    // prochaine ouverture aujourd'hui
    for (var j = 0; j < creneaux.length; j++) {
      if (t.minutes < creneaux[j][0]) {
        return { ouvert: false, court: 'Fermé', detail: 'ouvre à ' + fmt(creneaux[j][0]) };
      }
    }
    // sinon, le prochain jour ouvre
    for (var d = 1; d <= 7; d++) {
      var jj = (t.jour + d) % 7;
      var cc = CRENEAUX[jj];
      if (cc && cc.length) {
        var quand = d === 1 ? 'demain' : NOMS_JOURS[jj];
        return { ouvert: false, court: 'Fermé', detail: 'ouvre ' + quand + ' à ' + fmt(cc[0][0]) };
      }
    }
    return null;
  }

  function poserEtat() {
    var e = etatOuverture();
    if (!e) return;

    var pastille = document.getElementById('pastille-etat');
    var libelle  = document.getElementById('pastille-libelle');
    if (pastille && libelle) {
      pastille.hidden = false;
      pastille.setAttribute('data-etat', e.ouvert ? 'ouvert' : 'ferme');
      libelle.textContent = e.court;
      pastille.setAttribute('title', e.court + ' · ' + e.detail);
    }

    var hero = document.getElementById('hero-etat');
    if (hero) {
      hero.innerHTML = '';
      var p = document.createElement('span');
      p.className = 'pastille';
      p.setAttribute('data-etat', e.ouvert ? 'ouvert' : 'ferme');
      var pt = document.createElement('span');
      pt.className = 'point'; pt.setAttribute('aria-hidden', 'true');
      var lb = document.createElement('span');
      lb.textContent = e.ouvert ? 'Ouvert maintenant' : 'Fermé pour le moment';
      p.appendChild(pt); p.appendChild(lb);
      var d = document.createElement('span');
      d.className = 'detail';
      d.textContent = e.detail + ' · heure de La Réunion';
      hero.appendChild(p); hero.appendChild(d);
    }

    // souligner la ligne d'horaires du jour
    var t = heureReunion();
    if (t) {
      document.querySelectorAll('.horaires li[data-jours]').forEach(function (li) {
        var jours = li.getAttribute('data-jours').split(',');
        if (jours.indexOf(String(t.jour)) !== -1) li.classList.add('aujourdhui');
      });
    }
  }
  poserEtat();
  setInterval(poserEtat, 60000);

  /* --------------------------------------------------------------------
     3. Navigation : fond au defilement, menu mobile, lien actif
     -------------------------------------------------------------------- */
  var navbar = document.querySelector('.navbar');
  var barreMobile = document.getElementById('barre-mobile');

  function auDefilement() {
    var y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 40);
    if (barreMobile) barreMobile.classList.toggle('visible', y > window.innerHeight * 0.55);
  }
  window.addEventListener('scroll', auDefilement, { passive: true });
  auDefilement();

  var burger = document.querySelector('.hamburger');
  var liens  = document.querySelector('.nav-links');
  if (burger && liens) {
    var basculer = function (ouvrir) {
      burger.classList.toggle('open', ouvrir);
      liens.classList.toggle('open', ouvrir);
      burger.setAttribute('aria-expanded', String(ouvrir));
      burger.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
      document.body.style.overflow = ouvrir ? 'hidden' : '';
    };
    burger.addEventListener('click', function () {
      basculer(!liens.classList.contains('open'));
    });
    liens.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { basculer(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && liens.classList.contains('open')) { basculer(false); burger.focus(); }
    });
  }

  // Defilement doux avec compensation de la barre fixe
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var cible = document.querySelector(id);
      if (!cible) return;
      e.preventDefault();
      var haut = cible.getBoundingClientRect().top + window.scrollY - 78;
      window.scrollTo({ top: haut, behavior: reduit ? 'auto' : 'smooth' });
      if (typeof cible.focus === 'function') {
        cible.setAttribute('tabindex', '-1');
        cible.focus({ preventScroll: true });
      }
    });
  });

  // Lien de nav actif
  var navItems = document.querySelectorAll('.nav-links a[href^="#"]');
  var sections = document.querySelectorAll('section[id]');
  if (sections.length && 'IntersectionObserver' in window) {
    var obsActif = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = '#' + en.target.id;
        navItems.forEach(function (a) {
          a.classList.toggle('actif', a.getAttribute('href') === id);
        });
      });
    }, { threshold: 0.35 });
    sections.forEach(function (s) { obsActif.observe(s); });
  }

  /* --------------------------------------------------------------------
     4. Le hublot : rotation lente des vues du restaurant
     -------------------------------------------------------------------- */
  var hublot = document.getElementById('hublot-hero');
  if (hublot && !reduit) {
    var vues = hublot.querySelectorAll('.hublot-verre img');
    var legende = document.getElementById('hublot-legende');
    if (vues.length > 1) {
      var idx = 0;
      var tournerHublot = function () {
        vues[idx].classList.remove('visible');
        idx = (idx + 1) % vues.length;
        vues[idx].classList.add('visible');
        if (legende) {
          legende.style.opacity = '0';
          setTimeout(function () {
            legende.textContent = vues[idx].getAttribute('data-legende') || '';
            legende.style.opacity = '';
          }, 380);
        }
      };
      var minuterie = setInterval(tournerHublot, 4200);
      // on economise la batterie quand l'onglet est en arriere-plan
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { clearInterval(minuterie); }
        else { clearInterval(minuterie); minuterie = setInterval(tournerHublot, 4200); }
      });
    }
  }

  /* --------------------------------------------------------------------
     5. Message d'information sur les boutons de demonstration
     -------------------------------------------------------------------- */
  function message(texte) {
    var vieux = document.querySelector('.toast');
    if (vieux) vieux.remove();
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = texte;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add('show');
      setTimeout(function () {
        t.classList.remove('show');
        setTimeout(function () { t.remove(); }, 500);
      }, 3200);
    });
  }
  document.querySelectorAll('.btn[data-action]').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = {
        menu: 'Le menu en ligne arrive — en attendant, appelez-nous, on vous dit tout.',
        reservation: 'Réservation par téléphone au +262 262 12 52 73'
      }[b.dataset.action];
      // le lien tel: reste actif : on informe sans bloquer l'appel
      if (m) message(m);
    });
  });

  /* --------------------------------------------------------------------
     6. Motion design (GSAP + ScrollTrigger)
     -------------------------------------------------------------------- */
  if (!aGsap || reduit) {
    racine.classList.remove('anim-ready');
    return;
  }

  racine.classList.add('anim-lancee');
  var gsap = window.gsap;
  if (aScroll) gsap.registerPlugin(window.ScrollTrigger);

  var fx = gsap.utils.toArray('.fx');
  gsap.set(fx, { opacity: 0, y: 26 });
  racine.classList.remove('anim-ready');   // c'est GSAP qui pilote desormais

  // -- Entree du hero : une seule montee, dans l'ordre de lecture
  var heroFx = gsap.utils.toArray('.hero .fx').sort(function (a, b) {
    return (+a.dataset.fx || 99) - (+b.dataset.fx || 99);
  });
  gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
    .to(heroFx, { opacity: 1, y: 0, duration: 0.9, stagger: 0.085 })
    .from('.hero-hublot .rivet', { scale: 0, duration: 0.5, stagger: 0.035, ease: 'back.out(2.4)' }, '-=0.55')
    .from('.hero-bg', { scale: 1.14, duration: 2.6, ease: 'power2.out' }, 0);

  if (!aScroll) {
    // Sans ScrollTrigger : on revele simplement a l'apparition
    var obsFx = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (!en.isIntersecting) return;
        gsap.to(en.target, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
        obsFx.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    fx.forEach(function (el) { if (!el.closest('.hero')) obsFx.observe(el); });
    return;
  }

  var ST = window.ScrollTrigger;

  // -- Parallaxe de la photo du hero
  gsap.to('.hero-bg', {
    yPercent: 16, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // -- Chapitres : le texte monte en cascade, la photo se devoile
  gsap.utils.toArray('.chapitre, .section-commande, .section-infos').forEach(function (bloc) {
    var elements = gsap.utils.toArray('.fx', bloc);
    if (!elements.length) return;

    gsap.to(elements, {
      opacity: 1, y: 0,
      duration: 0.85, ease: 'power3.out', stagger: 0.075,
      scrollTrigger: { trigger: bloc, start: 'top 78%', once: true }
    });

    // volet qui s'ouvre sur la photo
    var media = bloc.querySelector('[data-media]');
    if (media) {
      gsap.fromTo(media,
        { clipPath: 'inset(0% 0% 100% 0% round 18px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 18px)',
          duration: 1.15, ease: 'power4.out',
          scrollTrigger: { trigger: media, start: 'top 82%', once: true }
        });
    }

    // la photo respire dans son cadre pendant le defilement
    var photo = bloc.querySelector('.cadre-photo img');
    if (photo) {
      gsap.fromTo(photo, { yPercent: -5, scale: 1.1 }, {
        yPercent: 5, scale: 1.0, ease: 'none',
        scrollTrigger: { trigger: bloc, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    }

    // le grand chiffre derive a contre-sens
    var chiffre = bloc.querySelector('.chiffre-fantome');
    if (chiffre) {
      gsap.fromTo(chiffre, { yPercent: 26 }, {
        yPercent: -26, ease: 'none',
        scrollTrigger: { trigger: bloc, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
      });
    }
  });

  // -- Les affiches se posent au mur
  var mur = document.querySelector('.mur-affiches');
  if (mur) {
    gsap.from(mur.querySelectorAll('.affiche'), {
      y: -40, opacity: 0, rotation: 0,
      duration: 0.9, ease: 'back.out(1.5)', stagger: 0.14,
      scrollTrigger: { trigger: mur, start: 'top 80%', once: true }
    });
  }

  // -- Le medaillon final se visse en place
  var med = document.querySelector('.commande-hublot');
  if (med) {
    gsap.from(med, {
      scale: 0.72, rotation: -18,
      duration: 1.1, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: med, start: 'top 85%', once: true }
    });
  }

  // Les images arrivent en differe : on recalcule les reperes
  window.addEventListener('load', function () { ST.refresh(); });
})();
