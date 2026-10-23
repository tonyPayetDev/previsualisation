/* ============================================================
   Le Bonbon de Pain — Script principal
   ============================================================ */

(function () {
  'use strict';

  /* ── Header scroll ─────────────────────────────────────────── */
  const header = document.getElementById('header');
  const backTop = document.getElementById('back-top');

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 60);
    backTop.classList.toggle('visible', y > 400);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Back to top ────────────────────────────────────────────── */
  if (backTop) {
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Mobile menu ────────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    mobileClose.addEventListener('click', closeMobileMenu);

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Scroll animations (IntersectionObserver) ─────────────── */
  const aosEls = document.querySelectorAll('[data-aos]');

  if (aosEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('aos-animate');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    aosEls.forEach(el => observer.observe(el));
  }

  /* ── Cookie banner ──────────────────────────────────────────── */
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieAccept = document.getElementById('cookie-accept');

  if (cookieBanner && !localStorage.getItem('cookies-accepted')) {
    setTimeout(() => cookieBanner.classList.add('show'), 1500);
  }

  if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
      localStorage.setItem('cookies-accepted', '1');
      cookieBanner.classList.remove('show');
    });
  }

  /* ── Smooth active nav link ─────────────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  function setActiveLink() {
    const scrollY = window.scrollY + 120;
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
        navLinks.forEach(a => {
          a.classList.remove('active');
          if (a.getAttribute('href') === '#' + sec.id) a.classList.add('active');
        });
      }
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });

  /* ── Lazy images fallback ───────────────────────────────────── */
  if ('loading' in HTMLImageElement.prototype) {
    // native lazy loading supported, nothing to do
  } else {
    const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const img = e.target;
          img.src = img.dataset.src || img.src;
          imgObserver.unobserve(img);
        }
      });
    });
    lazyImgs.forEach(img => imgObserver.observe(img));
  }

  /* ── Stagger cards animation ────────────────────────────────── */
  document.querySelectorAll('.products-grid, .formats-grid, .social-grid').forEach(grid => {
    const cards = grid.querySelectorAll(':scope > *');
    const gridObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          cards.forEach((card, i) => {
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, i * 120);
          });
          gridObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity .5s ease, transform .5s ease';
    });

    gridObserver.observe(grid);
  });

})();
