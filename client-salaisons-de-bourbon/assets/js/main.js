/* =====================================================
   Salaisons de Bourbon - JavaScript
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Header scroll shadow ──────────────────────────
  const header = document.querySelector('.header');
  const scrollTop = document.querySelector('.scroll-top');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 20);
    scrollTop?.classList.toggle('visible', y > 400);
  }, { passive: true });

  scrollTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Mobile nav toggle ─────────────────────────────
  const toggle = document.querySelector('.nav__toggle');
  const navLinks = document.querySelector('.nav__links');

  toggle?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
    const isOpen = navLinks?.classList.contains('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.querySelectorAll('span').forEach((span, i) => {
      if (isOpen) {
        if (i === 0) span.style.transform = 'translateY(7px) rotate(45deg)';
        if (i === 1) span.style.opacity = '0';
        if (i === 2) span.style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        span.style.transform = '';
        span.style.opacity = '';
      }
    });
  });

  // Close nav on link click
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle?.querySelectorAll('span').forEach(span => {
        span.style.transform = '';
        span.style.opacity = '';
      });
    });
  });

  // ── Scroll-triggered fade-in ──────────────────────
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

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ── Lazy loading images (native + fallback) ───────
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if ('loading' in HTMLImageElement.prototype === false) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imgObserver.unobserve(img);
        }
      });
    });
    lazyImages.forEach(img => imgObserver.observe(img));
  }

  // ── Active nav link on scroll ─────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav__links a[href^="#"]');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navAnchors.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px' }
  );

  sections.forEach(s => sectionObserver.observe(s));

  // ── Produits slider (nav buttons + autoplay + drag) ─
  document.querySelectorAll('.produits__slider').forEach(slider => {
    const track = slider.querySelector('.produits__track');
    const prevBtn = slider.querySelector('.produits__slider-btn--prev');
    const nextBtn = slider.querySelector('.produits__slider-btn--next');
    if (!track) return;

    const scrollByCard = (direction) => {
      const card = track.querySelector('.produit-card');
      const step = card ? card.getBoundingClientRect().width + 24 : 240;
      track.scrollBy({ left: step * direction, behavior: 'smooth' });
    };

    prevBtn?.addEventListener('click', () => scrollByCard(-1));
    nextBtn?.addEventListener('click', () => scrollByCard(1));

    // Autoplay
    let autoplayTimer = null;
    const startAutoplay = () => {
      if (reduceMotion || autoplayTimer) return;
      autoplayTimer = setInterval(() => {
        const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        if (atEnd) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollByCard(1);
        }
      }, 3200);
    };
    const stopAutoplay = () => {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    };
    startAutoplay();
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
    slider.addEventListener('touchstart', stopAutoplay, { passive: true });

    // Drag to scroll (desktop mouse)
    let isDown = false, startX = 0, startScroll = 0;
    track.addEventListener('pointerdown', (e) => {
      isDown = true;
      stopAutoplay();
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.style.cursor = 'grabbing';
    });
    window.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    });
    window.addEventListener('pointerup', () => {
      if (!isDown) return;
      isDown = false;
      track.style.cursor = '';
      startAutoplay();
    });
  });

  // ── Animated counters (hero stats) ────────────────
  const statEls = document.querySelectorAll('.hero__stat-value');
  const animateCount = (el) => {
    const raw = el.textContent.trim();
    const match = raw.match(/(\d+)/);
    if (!match) return;
    const target = parseInt(match[1], 10);
    const suffix = raw.replace(match[1], '');
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (statEls.length) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statEls.forEach(el => statObserver.observe(el));
  }

  // ── Hero parallax (cursor + scroll depth) ─────────
  if (!reduceMotion) {
    const hero = document.querySelector('.hero');
    const heroImg = document.querySelector('.hero__img-wrap');
    const decoThym = document.querySelector('.hero__deco--thym');
    const decoAil = document.querySelector('.hero__deco--ail');

    if (hero) {
      hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;

        if (heroImg) {
          heroImg.style.transform = `translate3d(${px * -14}px, ${py * -14}px, 0)`;
        }
        if (decoThym) {
          decoThym.style.transform = `rotate(15deg) translate3d(${px * 20}px, ${py * 20}px, 0)`;
        }
        if (decoAil) {
          decoAil.style.transform = `translate3d(${px * -16}px, ${py * -16}px, 0)`;
        }
      });

      hero.addEventListener('pointerleave', () => {
        if (heroImg) heroImg.style.transform = '';
        if (decoThym) decoThym.style.transform = 'rotate(15deg)';
        if (decoAil) decoAil.style.transform = '';
      });
    }

    // Scroll-depth parallax on hero background pattern
    const bgPattern = document.querySelector('.hero__bg-pattern');
    window.addEventListener('scroll', () => {
      if (bgPattern && window.scrollY < window.innerHeight) {
        bgPattern.style.transform = `translate3d(0, ${window.scrollY * 0.25}px, 0)`;
      }
    }, { passive: true });
  }

  // ── Cursor-follow tilt on cards ───────────────────
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.marque-card, .produit-card').forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${py * -6}deg) rotateY(${px * 8}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ── Cursor spotlight glow (hero) ──────────────────
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const hero = document.querySelector('.hero');
    if (hero) {
      const spotlight = document.createElement('div');
      spotlight.className = 'hero__spotlight';
      hero.appendChild(spotlight);
      hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        spotlight.style.left = `${e.clientX - rect.left}px`;
        spotlight.style.top = `${e.clientY - rect.top}px`;
        spotlight.style.opacity = '1';
      });
      hero.addEventListener('pointerleave', () => {
        spotlight.style.opacity = '0';
      });
    }
  }

});
