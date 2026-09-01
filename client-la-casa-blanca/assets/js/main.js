/* ==========================================================================
   LA CASA BLANCA — motion & behaviour
   GSAP 3.14.2 + ScrollTrigger 3.14.2, both served locally (no CDN).
   Every animated element has a visible resting state; prefers-reduced-motion
   short-circuits the whole timeline layer.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* If the motion layer is unavailable, drop the pre-animation states so the
     page is fully legible instead of half hidden. */
  if (!hasGsap || reduced) root.classList.remove('js-on');

  document.addEventListener('DOMContentLoaded', function () {
    behaviour();
    if (hasGsap && !reduced) motion();
  });

  /* ------------------------------------------------------------------
     Behaviour — works with or without GSAP
     ------------------------------------------------------------------ */
  function behaviour() {
    drawer();
    newsletter();
    if (!hasGsap || reduced) mastheadFallback();
  }

  function drawer() {
    var burger = document.getElementById('burger');
    var panel = document.getElementById('drawer');
    if (!burger || !panel) return;

    var links = panel.querySelectorAll('a');
    var open = false;

    function set(state) {
      open = state;
      burger.classList.toggle('is-open', state);
      burger.setAttribute('aria-expanded', String(state));
      burger.setAttribute('aria-label', state ? 'Fermer le menu' : 'Ouvrir le menu');
      panel.classList.toggle('is-open', state);
      panel.setAttribute('aria-hidden', String(!state));
      document.body.style.overflow = state ? 'hidden' : '';
      if (state) links[0] && links[0].focus();
    }

    burger.addEventListener('click', function () { set(!open); });
    links.forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { set(false); burger.focus(); }
    });
  }

  function newsletter() {
    var form = document.getElementById('nl-form');
    var error = document.getElementById('nl-error');
    var ok = document.getElementById('nl-ok');
    if (!form) return;
    var input = document.getElementById('nl-email');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = input.value.trim();

      if (!value) {
        fail('Indiquez votre adresse email pour recevoir nos actualités.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        fail('Cette adresse est incomplète. Vérifiez le format : nom@domaine.re');
        return;
      }

      error.classList.remove('is-visible');
      form.classList.remove('is-invalid');
      form.style.display = 'none';
      ok.classList.add('is-visible');
    });

    input.addEventListener('input', function () {
      error.classList.remove('is-visible');
      form.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    });

    function fail(message) {
      error.textContent = message;
      error.classList.add('is-visible');
      form.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    }
  }

  function mastheadFallback() {
    var head = document.getElementById('masthead');
    var ink = document.querySelector('.hero-ink');
    if (!head || !ink) return;
    function check() {
      head.classList.toggle('is-solid', window.scrollY > ink.offsetHeight - 84);
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* ------------------------------------------------------------------
     Motion
     ------------------------------------------------------------------ */
  function motion() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'expo.out', duration: 1 });

    curtain();
    heroIn();
    mastheadState();
    reveals();
    floors();
    counters();
    strip();

    ScrollTrigger.refresh();
  }

  /* The authored moment: the courtyard damier clearing off the page. */
  function curtain() {
    var cols = window.innerWidth < 720 ? 5 : 8;
    var cell = Math.ceil(window.innerWidth / cols);
    var rows = Math.ceil(window.innerHeight / cell);

    var layer = document.createElement('div');
    layer.className = 'curtain';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    layer.style.gridTemplateRows = 'repeat(' + rows + ', 1fr)';

    var even = [];
    var odd = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var i = document.createElement('i');
        layer.appendChild(i);
        ((r + c) % 2 === 0 ? even : odd).push(i);
      }
    }
    document.body.appendChild(layer);

    var tl = gsap.timeline({
      onComplete: function () { layer.remove(); }
    });

    tl.to(even, {
      scaleY: 0,
      transformOrigin: 'top center',
      duration: 0.72,
      ease: 'power3.inOut',
      stagger: { each: 0.018, from: 'start' }
    })
    .to(odd, {
      scaleY: 0,
      transformOrigin: 'bottom center',
      duration: 0.72,
      ease: 'power3.inOut',
      stagger: { each: 0.018, from: 'end' }
    }, 0.26);

    return tl;
  }

  function heroIn() {
    var lines = gsap.utils.toArray('.hero-title .line > span');
    var photo = document.getElementById('hero-photo');

    var tl = gsap.timeline({ delay: 0.62 });

    /* y is pinned to 0 in both states: GSAP reads the CSS translateY(102%)
       back as a PIXEL offset, which would otherwise survive the yPercent tween
       and leave the heading parked below its mask. */
    tl.fromTo(lines,
      { yPercent: 102, y: 0 },
      { yPercent: 0, y: 0, duration: 1.25, stagger: 0.085 }
    )
    /* the rule under "pluriel" draws itself */
    .fromTo('.hero-title em .ul',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.95, ease: 'expo.out' },
      '-=0.55')
    .to(
      '.hero-sub, .hero-actions, .hero-meta',
      { opacity: 1, y: 0, duration: 1.05, stagger: 0.075, clearProps: 'transform' },
      '-=0.95'
    );

    if (photo) {
      tl.fromTo(photo,
        { scale: 1.16, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.6, ease: 'expo.out' },
        0.25
      );

      gsap.to(photo, {
        yPercent: -5,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-plate',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6
        }
      });
    }
  }

  function mastheadState() {
    var head = document.getElementById('masthead');
    var ink = document.querySelector('.hero-ink');
    if (!head || !ink) return;

    ScrollTrigger.create({
      trigger: ink,
      start: 'bottom 84px',
      onEnter: function () { head.classList.add('is-solid'); },
      onLeaveBack: function () { head.classList.remove('is-solid'); }
    });
  }

  function reveals() {
    var rise = gsap.utils.toArray('[data-rise]').filter(function (el) {
      return !el.closest('.hero-ink');
    });

    ScrollTrigger.batch(rise, {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 1.1,
          stagger: 0.09,
          clearProps: 'transform'
        });
      }
    });

    gsap.utils.toArray('[data-wipe]').forEach(function (el) {
      gsap.to(el, {
        clipPath: 'inset(0 0 0% 0)',
        duration: 1.25,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true }
      });
    });
  }

  function floors() {
    gsap.utils.toArray('.floor').forEach(function (row) {
      var tick = row.querySelector('.tick');
      var copy = row.querySelectorAll('.floor-level .mark, .floor-copy h3, .floor-copy p');

      gsap.timeline({
        scrollTrigger: { trigger: row, start: 'top 84%', once: true }
      })
      .fromTo(copy, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, stagger: 0.06, clearProps: 'transform' })
      .to(tick, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0.1);
    });
  }

  function counters() {
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var prefix = el.getAttribute('data-prefix') || '';
      var state = { v: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: function () {
          gsap.to(state, {
            v: target,
            duration: 1.6,
            ease: 'expo.out',
            onUpdate: function () { el.textContent = prefix + Math.round(state.v); },
            onComplete: function () { el.textContent = prefix + target; }
          });
        }
      });
    });
  }

  function strip() {
    var frame = document.getElementById('strip');
    var track = document.getElementById('strip-track');
    if (!frame || !track) return;

    function distance() {
      return Math.max(0, track.scrollWidth - frame.clientWidth);
    }
    if (distance() === 0) return;

    gsap.fromTo(track,
      { x: 0 },
      {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: frame,
          start: 'top 92%',
          end: 'bottom top',
          scrub: 0.8,
          invalidateOnRefresh: true
        }
      }
    );
  }
})();
