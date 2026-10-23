/**
 * SunLight FM - Scripts principaux
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Header scroll ──────────────────────────────
  const header = document.getElementById('header');
  const scrollTopBtn = document.getElementById('scroll-top');
  const playerBar = document.getElementById('player-bar');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    if (y > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    if (y > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Mobile menu ────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const navClose = document.getElementById('nav-close');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    if (navClose) {
      navClose.addEventListener('click', () => {
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    }

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Radio Player ───────────────────────────────
  const STREAM_URL = 'https://radio.sunlightfm.fr/stream'; // Live stream URL
  let audio = null;
  let isPlaying = false;

  function togglePlay() {
    if (!audio) {
      audio = new Audio(STREAM_URL);
      audio.onerror = () => {
        showToast('Flux en cours de chargement, réessayez dans un instant.', 'warning');
        isPlaying = false;
        updatePlayButtons();
      };
    }

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      playerBar.classList.remove('visible');
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isPlaying = true;
          playerBar.classList.add('visible');
          updatePlayButtons();
        }).catch(() => {
          showToast('Impossible de démarrer le flux. Vérifiez votre connexion.', 'error');
        });
      }
    }
    updatePlayButtons();
  }

  function updatePlayButtons() {
    const playIcon = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    const pauseIcon = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    document.querySelectorAll('.play-btn, .player-bar-play').forEach(btn => {
      btn.innerHTML = isPlaying ? pauseIcon : playIcon;
    });

    // Update wave animation
    document.querySelectorAll('.wave-bar').forEach(bar => {
      bar.style.animationPlayState = isPlaying ? 'running' : 'paused';
    });
  }

  // Main play button (hero widget)
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', togglePlay);
  });

  // Player bar play button
  const playerBarPlay = document.querySelector('.player-bar-play');
  if (playerBarPlay) {
    playerBarPlay.addEventListener('click', togglePlay);
  }

  // Player bar close
  const playerBarClose = document.querySelector('.player-bar-close');
  if (playerBarClose) {
    playerBarClose.addEventListener('click', () => {
      if (audio && isPlaying) {
        audio.pause();
        isPlaying = false;
        updatePlayButtons();
      }
      playerBar.classList.remove('visible');
    });
  }

  // Listen CTA buttons
  document.querySelectorAll('[data-action="play"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      togglePlay();
      // Scroll to hero
      document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ── Intersection Observer (fade-up) ────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // ── Lazy loading images ─────────────────────────
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imgObserver.unobserve(img);
        }
      });
    });
    lazyImages.forEach(img => imgObserver.observe(img));
  }

  // ── Toast notifications ──────────────────────────
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 24px;
      background: ${type === 'error' ? '#ff4444' : type === 'warning' ? '#f7bc1b' : '#41CE22'};
      color: ${type === 'warning' ? '#000' : '#fff'};
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s ease;
      max-width: 320px;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });
    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ── Smooth scroll for anchor links ─────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const y = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  // ── Active nav highlight ─────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navItems.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));

  // Add active style to nav
  const style = document.createElement('style');
  style.textContent = '.nav-links a.active { color: var(--primary) !important; }';
  document.head.appendChild(style);

  // ── Counter animation ──────────────────────────
  function animateCounter(el, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        el.textContent = target + (el.dataset.suffix || '');
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(start) + (el.dataset.suffix || '');
      }
    }, 16);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, parseInt(el.dataset.target), 1500);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

  // Initialize wave bars as paused
  updatePlayButtons();
});
