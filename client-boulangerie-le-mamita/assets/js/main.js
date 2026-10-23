/* ========================================
   Boulangerie Pâtisserie Le Mamita
   Script principal
   ======================================== */

(function () {
  'use strict';

  /* -- Navbar: effet scroll -- */
  const navbar = document.querySelector('.navbar');
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* -- Menu mobile -- */
  const hamburger = document.querySelector('.navbar-hamburger');
  const navMenu = document.querySelector('.navbar-nav');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* -- Hero: zoom-out au chargement -- */
  const hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener('load', () => {
      hero.classList.add('loaded');
    });
  }

  /* -- Reveal au scroll (Intersection Observer) -- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* -- Lazy loading images (natif + polyfill) -- */
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  } else {
    const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
      const imgObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imgObserver.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });
      lazyImgs.forEach(img => imgObserver.observe(img));
    }
  }

  /* -- Smooth scroll pour liens ancres -- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 74;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* -- Lightbox galerie simple -- */
  const galleryItems = document.querySelectorAll('.galerie-item');
  let lightbox = null;

  function createLightbox() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = `
      <div class="lb-backdrop"></div>
      <div class="lb-content">
        <button class="lb-close" aria-label="Fermer">&times;</button>
        <img class="lb-img" src="" alt="">
        <p class="lb-caption"></p>
      </div>
    `;
    const style = document.createElement('style');
    style.textContent = `
      #lightbox {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
      }
      #lightbox.active { opacity: 1; pointer-events: all; }
      .lb-backdrop {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.88);
        cursor: pointer;
      }
      .lb-content {
        position: relative; z-index: 1;
        max-width: 90vw; max-height: 90vh;
        display: flex; flex-direction: column; align-items: center;
        gap: 1rem;
      }
      .lb-img {
        max-width: 90vw; max-height: 80vh;
        object-fit: contain;
        box-shadow: 0 8px 60px rgba(0,0,0,0.5);
      }
      .lb-caption {
        color: rgba(255,255,255,0.75);
        font-size: 0.9rem;
        letter-spacing: 0.05em;
        font-family: Georgia, serif;
        font-style: italic;
      }
      .lb-close {
        position: absolute; top: -2.5rem; right: -0.5rem;
        background: none; border: none;
        color: rgba(255,255,255,0.7); font-size: 2.2rem;
        cursor: pointer; line-height: 1;
        transition: color 0.2s;
      }
      .lb-close:hover { color: white; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(lb);

    lb.querySelector('.lb-backdrop').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
    return lb;
  }

  function openLightbox(img, caption) {
    if (!lightbox) lightbox = createLightbox();
    lightbox.querySelector('.lb-img').src = img.src || img.querySelector('img')?.src || '';
    lightbox.querySelector('.lb-img').alt = img.alt || '';
    lightbox.querySelector('.lb-caption').textContent = caption || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('h3')?.textContent || '';
      if (img) openLightbox(img, caption);
    });
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });

  /* -- Compteur animé "30 ans" -- */
  function animateCounter(el, target, duration) {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = start;
      if (start >= target) clearInterval(timer);
    }, 16);
  }

  const yearsEl = document.querySelector('.years');
  if (yearsEl && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateCounter(yearsEl, 30, 1200);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(yearsEl);
  }

})();
