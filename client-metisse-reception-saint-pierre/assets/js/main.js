/* ========================================================
   Métisse Réception — Scripts principaux
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* Le visiteur qui a demande moins de mouvement en obtient moins :
     pas de defilement anime, pas d'entrees au scroll, pas de defilement
     automatique du carrousel. */
  const moinsDeMouvement =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const glisse = moinsDeMouvement ? 'auto' : 'smooth';

  /* === Header scroll effect === */
  const header = document.querySelector('.site-header');
  const backTop = document.querySelector('.back-top');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    backTop.classList.toggle('visible', y > 400);

    /* Active nav link */
    document.querySelectorAll('section[id]').forEach(section => {
      const top = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      const links = document.querySelectorAll(`.nav a[href="#${section.id}"]`);
      links.forEach(l => l.classList.toggle('active', y >= top && y < bottom));
    });
  }, { passive: true });

  /* === Back to top === */
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: glisse }));

  /* === Burger menu === */
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');

  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobileNav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  /* Close mobile menu on link click */
  mobileNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* === Smooth scroll for anchor links === */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 76;
      window.scrollTo({ top: target.offsetTop - offset, behavior: glisse });
    });
  });

  /* === Carousel témoignages === */
  const track = document.querySelector('.carousel-track');
  const cards = document.querySelectorAll('.temoignage-card');
  const dots = document.querySelectorAll('.dot');
  const btnPrev = document.querySelector('.carousel-btn.prev');
  const btnNext = document.querySelector('.carousel-btn.next');

  if (track && cards.length) {
    let current = 0;
    let visibleCount = getVisibleCount();
    let maxIndex = Math.max(0, cards.length - visibleCount);
    let autoplay;

    function getVisibleCount() {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }

    function goTo(idx) {
      current = Math.max(0, Math.min(idx, maxIndex));
      const cardWidth = cards[0].offsetWidth + 28;
      track.style.transform = `translateX(-${current * cardWidth}px)`;
      dots.forEach((d, i) => {
        const actif = i === current;
        d.classList.toggle('active', actif);
        d.setAttribute('aria-current', actif ? 'true' : 'false');
      });
    }

    function startAutoplay() {
      if (moinsDeMouvement || maxIndex === 0) return;
      clearInterval(autoplay);
      autoplay = setInterval(() => {
        goTo(current >= maxIndex ? 0 : current + 1);
      }, 5000);
    }

    function stopAutoplay() { clearInterval(autoplay); }

    function resetAutoplay() { startAutoplay(); }

    /* Un carrousel qui defile pendant qu'on lit un temoignage est une
       panne d'attention : il s'arrete des qu'on s'y interesse. */
    const zone = document.querySelector('.section-temoignages');
    zone?.addEventListener('mouseenter', stopAutoplay);
    zone?.addEventListener('mouseleave', startAutoplay);
    zone?.addEventListener('focusin', stopAutoplay);
    zone?.addEventListener('focusout', startAutoplay);
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stopAutoplay() : startAutoplay();
    });

    btnPrev?.addEventListener('click', () => { goTo(current - 1); resetAutoplay(); });
    btnNext?.addEventListener('click', () => { goTo(current + 1); resetAutoplay(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); resetAutoplay(); }));

    /* Touch swipe */
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { goTo(diff > 0 ? current + 1 : current - 1); resetAutoplay(); }
    }, { passive: true });

    window.addEventListener('resize', () => {
      visibleCount = getVisibleCount();
      maxIndex = Math.max(0, cards.length - visibleCount);
      goTo(Math.min(current, maxIndex));
    });

    goTo(0);
    startAutoplay();
  }

  /* === Galerie lightbox === */
  const lightbox = document.querySelector('.lightbox');
  const lbImg = lightbox?.querySelector('img');
  const lbClose = lightbox?.querySelector('.lightbox-close');
  const lbPrev = lightbox?.querySelector('.lightbox-prev');
  const lbNext = lightbox?.querySelector('.lightbox-next');
  const galerieItems = document.querySelectorAll('.galerie-item');

  if (lightbox && galerieItems.length) {
    let lbIndex = 0;
    const images = [...galerieItems].map(el => el.querySelector('img'));

    let declencheur = null;

    function openLightbox(idx) {
      lbIndex = idx;
      lbImg.src = images[idx].src;
      lbImg.alt = images[idx].alt;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      lbClose?.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      declencheur?.focus();
      declencheur = null;
    }

    /* Le focus reste enferme dans la visionneuse tant qu'elle est ouverte. */
    lightbox.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const cibles = [lbClose, lbPrev, lbNext].filter(Boolean);
      if (!cibles.length) return;
      const premier = cibles[0], dernier = cibles[cibles.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault(); dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault(); premier.focus();
      }
    });

    galerieItems.forEach((item, i) => {
      item.addEventListener('click', () => { declencheur = item; openLightbox(i); });
    });

    lbClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    lbPrev?.addEventListener('click', () => openLightbox((lbIndex - 1 + images.length) % images.length));
    lbNext?.addEventListener('click', () => openLightbox((lbIndex + 1) % images.length));

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox((lbIndex - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') openLightbox((lbIndex + 1) % images.length);
    });
  }

  /* === Formulaire de contact === */
  const form = document.querySelector('#contact-form');
  const formSuccess = document.querySelector('.form-success');

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const libelle = btn.innerHTML;
    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;
    btn.dataset.libelle = libelle;

    setTimeout(() => {
      form.style.display = 'none';
      if (formSuccess) formSuccess.style.display = 'block';
    }, 1200);
  });

  /* === Intersection Observer — animations au scroll === */
  const animEls = document.querySelectorAll(
    /* Les cartes de temoignages sont recadrees par la piste du carrousel :
       observees une a une, celles hors cadre ne devenaient jamais visibles
       et le carrousel defilait vers des cartes vides. On anime le bloc. */
    '.prestation-card, .carousel-wrapper, .feature-item, .contact-item, .galerie-item'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

  if (!moinsDeMouvement) {
    animEls.forEach((el, i) => {
      el.classList.add('apparait');
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      const retard = Math.min(i, 5) * 0.06;
      el.style.transition =
        `opacity .7s cubic-bezier(.22,.61,.36,1) ${retard}s, ` +
        `transform .7s cubic-bezier(.22,.61,.36,1) ${retard}s`;
      observer.observe(el);
    });
  }

  document.head.insertAdjacentHTML('beforeend', `<style>
    .apparait.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  </style>`);

  /* === Lazy loading natif (fallback IE) === */
  if ('loading' in HTMLImageElement.prototype === false) {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = img.dataset.src || img.src;
            observer.disconnect();
          }
        });
      });
      observer.observe(img);
    });
  }

});
