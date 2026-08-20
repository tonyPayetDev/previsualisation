/**
 * SunLight FM - Main JavaScript
 */

(function () {
  'use strict';

  // =========================================
  // Header scroll behavior
  // =========================================
  const header = document.getElementById('header');
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    if (scrollY > 400) {
      backToTop?.classList.add('visible');
    } else {
      backToTop?.classList.remove('visible');
    }
  });

  // =========================================
  // Mobile navigation
  // =========================================
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu?.classList.toggle('open');
  });

  // Close nav on link click
  navMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      navMenu?.classList.remove('open');
    });
  });

  // =========================================
  // Radio Player
  // =========================================
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const soundBars = document.getElementById('soundBars');
  const volumeSlider = document.getElementById('volumeSlider');

  let audio = null;
  let isPlaying = false;
  const STREAM_URL = 'https://streaming.radioking.io/sunlight-fm';

  function initAudio() {
    if (!audio) {
      audio = new Audio(STREAM_URL);
      audio.preload = 'none';

      audio.addEventListener('playing', () => {
        isPlaying = true;
        updatePlayUI(true);
      });

      audio.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayUI(false);
      });

      audio.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayUI(false);
      });

      audio.addEventListener('error', () => {
        console.warn('Stream error – retrying with fallback');
        isPlaying = false;
        updatePlayUI(false);
      });
    }
  }

  function updatePlayUI(playing) {
    if (playing) {
      playIcon?.classList.add('hidden');
      pauseIcon?.classList.remove('hidden');
      soundBars?.classList.remove('paused');
    } else {
      playIcon?.classList.remove('hidden');
      pauseIcon?.classList.add('hidden');
      soundBars?.classList.add('paused');
    }
  }

  playBtn?.addEventListener('click', () => {
    initAudio();

    if (isPlaying) {
      audio.pause();
    } else {
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked — user still needs to interact
          updatePlayUI(false);
        });
      }
    }
  });

  // Volume control
  volumeSlider?.addEventListener('input', (e) => {
    if (audio) {
      audio.volume = e.target.value / 100;
    }
  });

  // =========================================
  // Scroll Reveal
  // =========================================
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(el => revealObserver.observe(el));

  // =========================================
  // Gallery Lightbox
  // =========================================
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img && lightbox && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeLightbox() {
    lightbox?.classList.remove('active');
    document.body.style.overflow = '';
  }

  lightboxClose?.addEventListener('click', closeLightbox);

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // =========================================
  // Smooth Scroll
  // =========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();
