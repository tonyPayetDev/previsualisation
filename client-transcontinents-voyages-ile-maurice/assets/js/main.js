/* ═══════════════════════════════════════════════════════════════════════
   Transcontinents Voyages — comportements
   GSAP est vendorisé en local (assets/js/gsap.min.js) : le CDN est bloqué.
   Tout ce qui bouge s'arrête si le visiteur a demandé un mouvement réduit.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var sobre = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Révélations au scroll ────────────────────────────────────────────
     On ne pose `.js` (qui masque les blocs `.monte`) QUE si l'observateur
     existe vraiment. Sans JS ou sans IntersectionObserver, rien n'est
     masqué : impossible qu'un bloc reste invisible à vie.

     PIÈGE ÉVITÉ : masquer avec clip-path annule aussi l'aire d'intersection
     du bloc — l'observateur ne se déclencherait jamais et le bloc ne
     reviendrait plus. On masque donc en opacity/translate uniquement.

     Et par sécurité, un filet : au bout de 4 s tout ce qui n'a pas été vu
     est révélé de force, quoi qu'il arrive. */
  var blocs = [].slice.call(document.querySelectorAll('.monte'));

  function toutMontrer() {
    blocs.forEach(function (b) { b.classList.add('vu'); });
  }

  if (blocs.length && 'IntersectionObserver' in window && !sobre) {
    document.documentElement.classList.add('js');

    var vus = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('vu');
          vus.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    blocs.forEach(function (b) { vus.observe(b); });

    /* Filet de sécurité : rien ne doit pouvoir rester caché. */
    window.setTimeout(toutMontrer, 4000);
  } else {
    toutMontrer();
  }

  /* ── En-tête et bouton « haut de page » ───────────────────────────────── */
  var entete = document.getElementById('entete');
  var haut = document.querySelector('.haut');

  function auScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (entete) entete.classList.toggle('pose', y > 60);
    if (haut) haut.classList.toggle('visible', y > 600);
  }
  window.addEventListener('scroll', auScroll, { passive: true });
  auScroll();

  /* ── Menu mobile ──────────────────────────────────────────────────────── */
  var burger = document.querySelector('.burger');
  if (burger && entete) {
    burger.addEventListener('click', function () {
      var ouvert = entete.classList.toggle('ouvert');
      burger.setAttribute('aria-expanded', String(ouvert));
      burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    document.querySelectorAll('.menu-mobile a').forEach(function (a) {
      a.addEventListener('click', function () {
        entete.classList.remove('ouvert');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Ouvrir le menu');
      });
    });
  }

  /* ── Chiffres du premier écran ────────────────────────────────────────── */
  var chiffres = document.querySelector('.chiffres');
  if (chiffres && 'IntersectionObserver' in window) {
    var compteur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        compteur.unobserve(e.target);
        e.target.querySelectorAll('[data-cible]').forEach(function (el) {
          var fin = parseInt(el.dataset.cible, 10);
          var suf = el.dataset.suffixe || '';
          /* Une année ne se compte pas : 1959 est une date, pas un score. */
          if (el.dataset.brut || sobre || isNaN(fin)) { el.textContent = fin + suf; return; }
          var t0 = null, duree = 1400;
          requestAnimationFrame(function boucle(t) {
            if (t0 === null) t0 = t;
            var p = Math.min((t - t0) / duree, 1);
            el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))) + suf;
            if (p < 1) requestAnimationFrame(boucle);
          });
        });
      });
    }, { threshold: 0.4 });
    compteur.observe(chiffres);
  }

  /* ── MODULE DE RECHERCHE ───────────────────────────────────────────────
     Il ne cherche rien. Il n'y a pas de moteur de réservation derrière, donc
     il n'affiche AUCUN résultat et AUCUN tarif : il met en forme la demande
     du visiteur, l'affiche dans la section contact, et prépare l'email.
     Les données saisies ne sont jamais jetées. */
  var envie = 'Séjour sur mesure';
  var onglets = [].slice.call(document.querySelectorAll('.onglet'));
  onglets.forEach(function (b) {
    b.addEventListener('click', function () {
      onglets.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      envie = b.dataset.envie || envie;
    });
  });

  var module = document.getElementById('module-demande');
  if (module) {
    module.addEventListener('submit', function (e) {
      e.preventDefault();

      var region = document.getElementById('ch-destination').value;
      var periode = document.getElementById('ch-periode').value;
      var voyageurs = document.getElementById('ch-voyageurs').value;

      var mois = 'période à définir';
      if (periode) {
        var p = periode.split('-');
        var noms = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                    'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        var i = parseInt(p[1], 10) - 1;
        if (noms[i]) mois = noms[i] + ' ' + p[0];
      }

      var phrase = envie + ' · ' + region + ' · ' + mois + ' · ' + voyageurs + '.';

      var recap = document.getElementById('recap');
      var texte = document.getElementById('recap-texte');
      if (recap && texte) {
        texte.textContent = phrase;
        recap.hidden = false;
      }

      /* L'email est pré-rempli : le visiteur n'a plus qu'à l'envoyer. */
      var lien = document.getElementById('lien-mail');
      var corps = 'Bonjour,\n\nJe souhaite préparer un voyage à l’île Maurice.\n\n' +
                  '• Type de séjour : ' + envie + '\n' +
                  '• Région : ' + region + '\n' +
                  '• Période : ' + mois + '\n' +
                  '• Voyageurs : ' + voyageurs + '\n\n' +
                  'Merci de me recontacter.\n';
      var url = 'mailto:contact@transcontinents.com' +
                '?subject=' + encodeURIComponent('Demande de voyage — île Maurice') +
                '&body=' + encodeURIComponent(corps);
      if (lien) {
        lien.setAttribute('href', url);
        lien.textContent = 'Envoyer ma demande';
      }

      var cible = document.getElementById('contact');
      if (cible) {
        cible.scrollIntoView({ behavior: sobre ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  /* ── DIAPORAMA ─────────────────────────────────────────────────────────
     Défilement automatique, mais il s'arrête dès qu'on survole, qu'on tabule
     dedans, ou que l'onglet passe en arrière-plan — et il ne démarre pas du
     tout en mouvement réduit. */
  var diapo = document.querySelector('[data-diaporama]');
  if (diapo) {
    var vues = [].slice.call(diapo.querySelectorAll('.vue'));
    var pastilles = [].slice.call(diapo.querySelectorAll('.pastilles button'));
    var index = 0, minuteur = null, arrete = sobre;

    function montrer(n) {
      index = (n + vues.length) % vues.length;
      vues.forEach(function (v, i) { v.classList.toggle('on', i === index); });
      pastilles.forEach(function (p, i) { p.setAttribute('aria-selected', String(i === index)); });
    }

    function relancer() {
      window.clearInterval(minuteur);
      if (arrete) return;
      minuteur = window.setInterval(function () { montrer(index + 1); }, 5200);
    }

    pastilles.forEach(function (p, i) {
      p.addEventListener('click', function () { montrer(i); relancer(); });
    });
    diapo.querySelectorAll('.fleches button').forEach(function (b) {
      b.addEventListener('click', function () {
        montrer(index + parseInt(b.dataset.pas, 10));
        relancer();
      });
    });

    diapo.addEventListener('mouseenter', function () { window.clearInterval(minuteur); });
    diapo.addEventListener('mouseleave', relancer);
    diapo.addEventListener('focusin', function () { window.clearInterval(minuteur); });
    diapo.addEventListener('focusout', relancer);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) window.clearInterval(minuteur); else relancer();
    });

    relancer();
  }

  /* ── LA ROSE DES VENTS ─────────────────────────────────────────────────
     Les deux anneaux tournent en CSS. Au survol on ne touche JAMAIS à leur
     vitesse : changer la durée d'une animation CSS en cours la fait sauter
     d'un quart de tour. On module la luminosité par variable, et l'anneau
     s'incline légèrement vers le pointeur — la rotation continue sans à-coup. */
  var rose = document.getElementById('rose');
  var survol = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  if (rose && survol && !sobre && window.gsap) {
    var lum = function (v) { gsap.to(rose, { '--lum': v, duration: .35, ease: 'power2.out' }); };
    rose.addEventListener('mouseenter', function () { lum(1.35); });
    rose.addEventListener('mouseleave', function () { lum(1); });

    var vx = gsap.quickTo(rose, '--vx', { duration: .55, ease: 'power3.out' });
    var vy = gsap.quickTo(rose, '--vy', { duration: .55, ease: 'power3.out' });
    rose.addEventListener('mousemove', function (e) {
      var r = rose.getBoundingClientRect();
      vx(((e.clientX - r.left) / r.width - .5) * 14);
      vy(((e.clientY - r.top) / r.height - .5) * 14);
    });
    rose.addEventListener('mouseleave', function () { vx(0); vy(0); });
  }

  /* ── LE MINI AVION ─────────────────────────────────────────────────────
     Il traverse le cadre UNE SEULE FOIS, au premier passage devant la
     section. Pas de boucle : au bout de dix secondes une boucle devient un
     tic. En mouvement réduit il ne vole pas du tout (il est aussi masqué
     en CSS, ceci est la seconde barrière). */
  var avion = document.getElementById('avion');
  var trainee = document.getElementById('trainee');
  var scene = document.getElementById('envie');

  if (avion && scene && !sobre && window.gsap && 'IntersectionObserver' in window) {
    var vole = false;

    var guetteur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting || vole) return;
        vole = true;
        guetteur.disconnect();

        gsap.set(avion, { xPercent: 0, x: '-14vw', y: 0, rotation: 2, opacity: 0 });
        gsap.set(trainee, { x: '-14vw', width: 170, opacity: 0 });

        var vol = gsap.timeline({
          delay: .5,
          onComplete: function () {
            /* Une fois passé, il quitte la page pour de bon. */
            avion.style.display = 'none';
            if (trainee) trainee.style.display = 'none';
          }
        });

        vol.to([avion, trainee], { opacity: 1, duration: .7, ease: 'power1.out' }, 0)
           .to([avion, trainee], { x: '116vw', duration: 8.2, ease: 'none' }, 0)
           /* Une légère montée puis redescente : sans cette courbe l'appareil
              glisse comme un curseur, pas comme un avion. */
           .to(avion, { y: -26, duration: 4.1, ease: 'sine.inOut' }, 0)
           .to(avion, { y: 0, duration: 4.1, ease: 'sine.inOut' }, 4.1)
           .to([avion, trainee], { opacity: 0, duration: 1.2, ease: 'power1.in' }, 7.0);
      });
    }, { threshold: 0.25 });

    guetteur.observe(scene);
  }

})();
