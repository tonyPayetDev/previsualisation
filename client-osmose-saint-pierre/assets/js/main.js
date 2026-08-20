// ============================================
// OSMOSE Bistro - Saint-Pierre — Motion & interactions
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ========================================
  // NAVBAR: shrink + solid bg on scroll
  // ========================================
  const navbar = document.querySelector('.navbar');
  const onScrollNav = () => {
    if (window.scrollY > 60) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  // ========================================
  // MOBILE NAV DRAWER
  // ========================================
  const toggle = document.querySelector('.navbar-toggle');
  const drawer = document.querySelector('.navbar-drawer');
  toggle?.addEventListener('click', () => {
    drawer.classList.toggle('open');
    toggle.classList.toggle('active');
  });
  drawer?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => drawer.classList.remove('open'));
  });

  // ========================================
  // FLOATING RESERVE CTA
  // ========================================
  const floatCta = document.querySelector('.float-cta');
  const hero = document.querySelector('.hero');
  if (floatCta && hero) {
    const io = new IntersectionObserver(([entry]) => {
      floatCta.classList.toggle('visible', !entry.isIntersecting);
    }, { threshold: 0.05 });
    io.observe(hero);
  }

  // ========================================
  // LIGHTBOX (menus + galerie)
  // ========================================
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox?.querySelector('img');
  document.querySelectorAll('[data-lightbox]').forEach(el => {
    el.addEventListener('click', () => {
      const src = el.dataset.lightbox;
      lightboxImg.src = src;
      lightbox.classList.add('active');
    });
  });
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.closest('.lightbox-close')) {
      lightbox.classList.remove('active');
      lightboxImg.src = '';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      lightbox?.classList.remove('active');
    }
  });

  // ========================================
  // RESERVATION FORM
  // ========================================
  const resaForm = document.getElementById('resaForm');
  resaForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = resaForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check"></i> Demande envoyée !';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        resaForm.reset();
      }, 3000);
    }, 1200);
  });

  // ========================================
  // CURRENT YEAR
  // ========================================
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ========================================
  // GSAP MOTION DESIGN
  // ========================================
  if (!window.gsap) return;

  gsap.matchMedia().add(
    { reduceMotion: '(prefers-reduced-motion: reduce)' },
    (context) => {
      const { reduceMotion } = context.conditions;
      const dur = (v) => (reduceMotion ? 0 : v);

      // --- Hero entrance ---
      const heroTl = gsap.timeline({ delay: 0.2 });
      heroTl
        .from('.hero .eyebrow', { autoAlpha: 0, y: 20, duration: dur(0.7), ease: 'power2.out' })
        .from('.hero h1 .word', {
          yPercent: 120,
          autoAlpha: 0,
          duration: dur(0.9),
          stagger: 0.03,
          ease: 'power3.out'
        }, '-=0.4')
        .from('.hero-sub', { autoAlpha: 0, y: 20, duration: dur(0.7), ease: 'power2.out' }, '-=0.5')
        .from('.hero-cta', { autoAlpha: 0, y: 20, duration: dur(0.7), ease: 'power2.out' }, '-=0.5')
        .from('.hero-scroll', { autoAlpha: 0, duration: dur(0.6) }, '-=0.3');

      // --- Hero parallax on scroll ---
      gsap.to('.hero-bg', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // --- Section headers reveal ---
      gsap.utils.toArray('.section-head').forEach((el) => {
        gsap.from(el.children, {
          y: 34,
          autoAlpha: 0,
          duration: dur(0.8),
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
      });

      // --- Split sections (image + text) ---
      gsap.utils.toArray('.split').forEach((el) => {
        const media = el.querySelector('.split-media');
        const text = el.querySelector('.split-text > *');
        gsap.from(el.querySelectorAll('.split-media img, .split-media-tag'), {
          y: 50,
          autoAlpha: 0,
          duration: dur(0.9),
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 78%' }
        });
        gsap.from(el.querySelectorAll('.split-text > *'), {
          y: 26,
          autoAlpha: 0,
          duration: dur(0.7),
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 78%' }
        });
      });

      // --- Card / grid batch reveals ---
      ScrollTrigger.batch('.reveal-batch', {
        start: 'top 88%',
        onEnter: (els) => gsap.to(els, {
          y: 0, autoAlpha: 1, duration: dur(0.7), stagger: 0.1, ease: 'power2.out', overwrite: true
        }),
        onEnterBack: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: dur(0.5), overwrite: true })
      });
      gsap.set('.reveal-batch', { y: 30, autoAlpha: 0 });

      // --- Map / contact info ---
      gsap.utils.toArray('.map-info, .hours-badge, .contact-cards').forEach((el) => {
        gsap.from(el, {
          x: -30, autoAlpha: 0, duration: dur(0.8), ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
      });

      // --- Marquee subtle scale-in ---
      gsap.from('.marquee-strip', {
        scaleY: 0.4, autoAlpha: 0, duration: dur(0.6), ease: 'power2.out', transformOrigin: 'center',
        scrollTrigger: { trigger: '.marquee-strip', start: 'top 95%' }
      });

      return () => heroTl.kill();
    }
  );
});
