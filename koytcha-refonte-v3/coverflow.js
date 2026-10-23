// Carrousel coverflow — portage du composant React fourni, en JS simple.
//
// Pourquoi un portage plutôt que le composant tel quel : cette page est du
// HTML statique servi par nginx. Il n'y a ni React, ni Tailwind, ni build.
// Monter une chaîne Next/shadcn pour un seul carrousel coûterait plus cher
// que le carrousel. La logique, elle, n'a rien de React : des références,
// une boucle d'animation et des événements de pointeur.
//
// Les trois idées du composant d'origine sont conservées telles quelles,
// parce que ce sont elles qui font la qualité de l'effet :
//
//   1. On peint DIRECTEMENT dans le DOM, pas via l'état. Soixante mises à
//      jour d'état par seconde redessineraient toutes les cartes pour des
//      nombres que personne n'a besoin de voir.
//   2. La boucle se fait en repliant la distance du côté le plus court de
//      l'anneau. C'est tout le mécanisme : aucun nœud cloné, aucun
//      remaniement du DOM.
//   3. L'inclinaison et l'éloignement s'atténuent avec la distance
//      (exposant < 1). Une rampe linéaire referme la deuxième carte ; là,
//      elle reste lisible.

(function () {
  function creer(hote, options) {
    var o = Object.assign({
      rotate: 44,        // degrés d'inclinaison de la première voisine
      depth: 0.6,        // éloignement, en fraction de la largeur de carte
      perspective: 3,    // distance de l'œil, en multiples de la largeur
      falloff: 0.56,     // exposant sur la distance
      fade: 0.1,         // opacité perdue par cran
      gap: 0.05,         // espace entre cartes, en fraction de la largeur
      loop: true,
      auto: 0,           // ms entre deux avances automatiques ; 0 = jamais
    }, options || {});

    var cadre = hote.querySelector('[data-cf-cadre]');
    var piste = hote.querySelector('[data-cf-piste]');
    var cartes = [].slice.call(piste.querySelectorAll('[data-cf-carte]'));
    var points = [].slice.call(hote.querySelectorAll('[data-cf-point]'));
    var titre = hote.querySelector('[data-cf-titre]');
    var soustitre = hote.querySelector('[data-cf-soustitre]');
    var lien = hote.querySelector('[data-cf-lien]');
    var n = cartes.length;
    if (!n) return;

    var pos = 0;        // index fractionnaire au centre — la seule vérité
    var cible = 0;      // où va l'amortissement en cours
    var largeur = 0;
    var raf = null;
    var glisse = null;
    var choisi = 0;
    var minuteur = null;

    var indexA = function (p) { return ((Math.round(p) % n) + n) % n; };

    function peindre() {
      if (!largeur) return;
      var pas = largeur * (1 + o.gap);
      for (var i = 0; i < n; i++) {
        var c = cartes[i];
        var ecart = i - pos;
        if (o.loop) {
          ecart = ((ecart % n) + n) % n;
          if (ecart > n / 2) ecart -= n;
        }
        var d = Math.abs(ecart);
        var rampe = Math.pow(d, o.falloff);
        // Plafonné avant l'angle droit : une carte lointaine ne doit jamais
        // tourner complètement le dos.
        var angle = Math.min(o.rotate * rampe, 82) * (ecart < 0 ? -1 : ecart > 0 ? 1 : 0);
        c.style.transform =
          'translateX(calc(-50% + ' + (ecart * pas).toFixed(2) + 'px)) ' +
          'translateZ(' + (-o.depth * largeur * rampe).toFixed(2) + 'px) ' +
          'rotateY(' + (-angle).toFixed(2) + 'deg)';
        // Une carte est téléportée de l'autre côté de l'anneau exactement à
        // mi-tour : elle doit avoir disparu avant, sinon le saut se voit.
        var bord = o.loop ? Math.min(1, Math.max(0, n / 2 - d)) : 1;
        c.style.opacity = String(Math.max(0, 1 - o.fade * d) * bord);
        c.style.zIndex = String(100 - Math.round(d));
        c.setAttribute('aria-hidden', d > 0.5 ? 'true' : 'false');
      }
    }

    function legende() {
      var c = cartes[choisi];
      if (titre) titre.textContent = c.getAttribute('data-titre') || '';
      if (soustitre) soustitre.textContent = c.getAttribute('data-soustitre') || '';
      if (lien) lien.setAttribute('href', c.getAttribute('data-lien') || '#');
      points.forEach(function (p, i) { p.setAttribute('aria-current', String(i === choisi)); });
    }

    function amortir(c) {
      if (raf !== null) cancelAnimationFrame(raf);
      cible = c;
      var neuf = indexA(c);
      if (neuf !== choisi) { choisi = neuf; legende(); }
      var pas = function () {
        var reste = cible - pos;
        if (Math.abs(reste) < 0.0004) { pos = cible; peindre(); raf = null; return; }
        // Sortie exponentielle, pas un ressort. Un ressort ne servirait qu'à
        // obtenir un dépassement, dont ce carrousel n'a pas besoin.
        pos += reste * 0.16;
        peindre();
        raf = requestAnimationFrame(pas);
      };
      raf = requestAnimationFrame(pas);
    }

    var borner = function (p) { return o.loop ? p : Math.max(0, Math.min(n - 1, p)); };
    function allerA(i) {
      // On prend le chemin le plus court plutôt que de dérouler tout l'anneau.
      var c = o.loop ? i + Math.round((cible - i) / n) * n : i;
      amortir(borner(c));
    }
    function pousser(par) { amortir(borner(Math.round(cible) + par)); }

    cadre.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('a')) return;
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      cadre.setPointerCapture(e.pointerId);
      cible = pos;
      glisse = { id: e.pointerId, x: e.clientX, pos: pos, v: 0, t: performance.now() };
      arreterAuto();
    });
    cadre.addEventListener('pointermove', function (e) {
      if (!glisse || glisse.id !== e.pointerId) return;
      var pas = largeur * (1 + o.gap);
      if (!pas) return;
      var maintenant = performance.now();
      var avant = pos;
      pos = borner(glisse.pos - (e.clientX - glisse.x) / pas);
      // Cartes par seconde, pour le lancer.
      glisse.v = ((pos - avant) / Math.max(maintenant - glisse.t, 1)) * 1000;
      glisse.t = maintenant;
      var i = indexA(pos);
      if (i !== choisi) { choisi = i; legende(); }
      peindre();
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      cadre.addEventListener(t, function (e) {
        if (!glisse || glisse.id !== e.pointerId) return;
        // La vélocité se lit AVANT de vider `glisse` : l'inverse fait perdre
        // le lancer, et le carrousel s'arrête pile là où le doigt s'est levé
        // au lieu de continuer sur sa lancée.
        var v = glisse.v;
        glisse = null;
        // Un lancer porte, mais jamais au-delà de deux cartes.
        var porte = Math.max(-2, Math.min(2, v * 0.18));
        amortir(borner(Math.round(pos + porte)));
      });
    });

    cadre.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); pousser(-1); arreterAuto(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); pousser(1); arreterAuto(); }
    });
    hote.querySelectorAll('[data-cf-prec]').forEach(function (b) {
      b.addEventListener('click', function () { pousser(-1); arreterAuto(); });
    });
    hote.querySelectorAll('[data-cf-suiv]').forEach(function (b) {
      b.addEventListener('click', function () { pousser(1); arreterAuto(); });
    });
    points.forEach(function (p, i) {
      p.addEventListener('click', function () { allerA(i); arreterAuto(); });
    });

    function arreterAuto() { if (minuteur) { clearInterval(minuteur); minuteur = null; } }
    function lancerAuto() {
      if (!o.auto || minuteur) return;
      minuteur = setInterval(function () { pousser(1); }, o.auto);
    }

    // La largeur de carte pilote le pas, l'éloignement et la perspective :
    // c'est la seule chose qui mérite d'être mesurée, et seulement quand la
    // boîte change réellement.
    function mesurer() {
      largeur = cartes[0].offsetWidth;
      cadre.style.perspective = (largeur * o.perspective).toFixed(0) + 'px';
      peindre();
    }
    mesurer();
    if (window.ResizeObserver) new ResizeObserver(mesurer).observe(cadre);
    else window.addEventListener('resize', mesurer);
    legende();

    // L'automatique ne démarre que si le carrousel est visible : le faire
    // tourner dans une section qu'on ne regarde pas consomme du calcul et
    // désynchronise la légende de ce que voit le visiteur.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? lancerAuto() : arreterAuto(); });
      }, { threshold: 0.35 }).observe(hote);
    } else lancerAuto();
  }

  window.Coverflow = { creer: creer };
})();
