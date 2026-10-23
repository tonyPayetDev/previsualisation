/* ===========================
   Free Dom - La Réunion
   Main JavaScript
   =========================== */

(function () {
  'use strict';

  // --- Mobile Menu ---
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      // Animate hamburger to X
      const spans = menuToggle.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  // --- Radio Player ---
  const playBtn = document.getElementById('radioPlayBtn');
  const radioIcon = document.getElementById('radioIcon');
  let isPlaying = false;

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        radioIcon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>`;
        playBtn.setAttribute('aria-label', 'Pause la radio');
        showToast('🎵 Free Dom FM en direct');
      } else {
        radioIcon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>`;
        playBtn.setAttribute('aria-label', 'Écouter Free Dom FM');
      }
    });
  }

  // --- Newsletter Form ---
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"]').value;
      if (email) {
        const btn = newsletterForm.querySelector('.form-submit');
        btn.textContent = 'Inscription confirmée !';
        btn.style.background = '#2ecc71';
        btn.disabled = true;
        showToast('Merci ! Vous êtes abonné à la newsletter Free Dom.');
        setTimeout(() => {
          btn.textContent = "S'abonner à la newsletter";
          btn.style.background = '';
          btn.disabled = false;
          newsletterForm.reset();
        }, 4000);
      }
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (nav && nav.classList.contains('open')) {
          nav.classList.remove('open');
        }
      }
    });
  });

  // --- Lazy loading images (polyfill for older browsers) ---
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported — nothing to do
  } else {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      });
    });
    lazyImages.forEach((img) => imageObserver.observe(img));
  }

  // --- Sticky header shadow ---
  const header = document.querySelector('.header');
  if (header) {
    const scrollThreshold = 80;
    window.addEventListener('scroll', () => {
      if (window.scrollY > scrollThreshold) {
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 102, 0.15)';
      } else {
        header.style.boxShadow = '';
      }
    }, { passive: true });
  }

  // --- Toast Notification ---
  function showToast(message) {
    const existing = document.querySelector('.fd-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'fd-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #000066;
      color: white;
      padding: 0.85rem 1.75rem;
      border-radius: 50px;
      font-family: 'Libre Franklin', sans-serif;
      font-size: 0.9rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      z-index: 9999;
      opacity: 0;
      transition: all 0.3s ease;
      white-space: nowrap;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Article cards click handlers ---
  document.querySelectorAll('.article-card, .podcast-card, .sport-card, .list-article, .musique-item, .musique-featured').forEach((card) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      showToast('Redirection vers l\'article en cours...');
    });
  });

  // --- CTA buttons feedback ---
  document.querySelectorAll('.btn').forEach((btn) => {
    if (!btn.closest('form')) {
      btn.addEventListener('click', (e) => {
        // Visual ripple effect
        const ripple = document.createElement('span');
        ripple.style.cssText = `
          position: absolute;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
          width: 100px;
          height: 100px;
          left: ${e.offsetX - 50}px;
          top: ${e.offsetY - 50}px;
        `;
        const style = document.createElement('style');
        style.textContent = `@keyframes ripple { to { transform: scale(4); opacity: 0; } }`;
        document.head.appendChild(style);
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      });
    }
  });

  // --- Date dynamique dans la topbar ---
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('fr-FR', options);
    // Capitalize first letter
    dateEl.textContent = dateEl.textContent.charAt(0).toUpperCase() + dateEl.textContent.slice(1);
  }

  // --- Ticker duplication for seamless loop ---
  const tickerContent = document.querySelector('.ticker-content');
  if (tickerContent) {
    tickerContent.innerHTML += tickerContent.innerHTML;
  }

  console.log('Free Dom - JavaScript initialisé ✓');
})();
