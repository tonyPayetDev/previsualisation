/* =====================================================
   Le Relais des Cimes - Main JS
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------
     Navbar scroll behavior
  ----------------------------------------------- */
  const navbar = document.getElementById('navbar');
  const scrollThreshold = 80;

  const handleScroll = () => {
    if (window.scrollY > scrollThreshold) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* -----------------------------------------------
     Mobile nav toggle
  ----------------------------------------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* -----------------------------------------------
     Hero Slider
  ----------------------------------------------- */
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dot');
  let currentSlide = 0;
  let sliderInterval;

  const goToSlide = (index) => {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide]?.classList.add('active');
  };

  const startSlider = () => {
    sliderInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
  };

  const resetSlider = () => {
    clearInterval(sliderInterval);
    startSlider();
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goToSlide(i);
      resetSlider();
    });
  });

  if (slides.length > 0) startSlider();

  /* -----------------------------------------------
     Scroll reveal animation
  ----------------------------------------------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* -----------------------------------------------
     Galerie lightbox
  ----------------------------------------------- */
  const modal = document.getElementById('galModal');
  const modalImg = document.getElementById('galModalImg');
  const galItems = Array.from(document.querySelectorAll('.galerie-item'));
  let currentGalIndex = 0;

  const openModal = (index) => {
    currentGalIndex = index;
    const src = galItems[index].querySelector('img').src;
    modalImg.src = src;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  const navModal = (dir) => {
    currentGalIndex = (currentGalIndex + dir + galItems.length) % galItems.length;
    const src = galItems[currentGalIndex].querySelector('img').src;
    modalImg.style.opacity = 0;
    setTimeout(() => {
      modalImg.src = src;
      modalImg.style.opacity = 1;
    }, 200);
  };

  galItems.forEach((item, i) => {
    item.addEventListener('click', () => openModal(i));
  });

  document.getElementById('galModalClose')?.addEventListener('click', closeModal);
  document.getElementById('galModalPrev')?.addEventListener('click', () => navModal(-1));
  document.getElementById('galModalNext')?.addEventListener('click', () => navModal(1));

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (!modal?.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navModal(-1);
    if (e.key === 'ArrowRight') navModal(1);
  });

  /* -----------------------------------------------
     Contact form
  ----------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  const toast = document.getElementById('toast');

  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  };

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    setTimeout(() => {
      showToast('✓ Message envoyé ! Nous vous répondrons dans les 24h.');
      contactForm.reset();
      btn.disabled = false;
      btn.textContent = 'Envoyer ma demande';
    }, 1200);
  });

  /* -----------------------------------------------
     Smooth scroll for anchor links
  ----------------------------------------------- */
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

  /* -----------------------------------------------
     Lazy loading images (fallback for older browsers)
  ----------------------------------------------- */
  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imgObserver.unobserve(img);
          }
        }
      });
    }, { rootMargin: '200px' });

    document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
  }

});
