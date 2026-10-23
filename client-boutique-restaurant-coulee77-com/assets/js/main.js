/* =====================================================
   Restaurant Coulée 77 - Main JavaScript
   ===================================================== */

(function () {
  'use strict';

  /* ===== Sticky Navbar ===== */
  const navbar = document.getElementById('navbar');
  function handleNavbarScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  /* ===== Mobile Menu Toggle ===== */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIconOpen = document.getElementById('menu-icon-open');
  const menuIconClose = document.getElementById('menu-icon-close');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      const isOpen = !mobileMenu.classList.contains('hidden');
      if (isOpen) {
        mobileMenu.classList.add('hidden');
        menuIconOpen.classList.remove('hidden');
        menuIconClose.classList.add('hidden');
        menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        mobileMenu.classList.remove('hidden');
        menuIconOpen.classList.add('hidden');
        menuIconClose.classList.remove('hidden');
        menuToggle.setAttribute('aria-expanded', 'true');
      }
    });
  }

  window.closeMobileMenu = function () {
    if (mobileMenu) {
      mobileMenu.classList.add('hidden');
      menuIconOpen && menuIconOpen.classList.remove('hidden');
      menuIconClose && menuIconClose.classList.add('hidden');
      menuToggle && menuToggle.setAttribute('aria-expanded', 'false');
    }
  };

  /* ===== Smooth Scroll for Anchor Links ===== */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ===== Scroll Reveal ===== */
  var revealObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
    : null;

  document.querySelectorAll('.reveal').forEach(function (el) {
    if (revealObserver) {
      revealObserver.observe(el);
    } else {
      el.classList.add('revealed'); // fallback: tout visible d'un coup
    }
  });

  /* ===== Back to Top Button ===== */
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });
  }

  window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ===== Set Min Date for Reservation Form ===== */
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    dateInput.setAttribute('min', yyyy + '-' + mm + '-' + dd);
  }

  /* ===== Reservation Form ===== */
  const reservationForm = document.getElementById('reservation-form');
  const formSuccess = document.getElementById('form-success');
  if (reservationForm && formSuccess) {
    reservationForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!reservationForm.checkValidity()) {
        reservationForm.reportValidity();
        return;
      }
      const btn = reservationForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
      btn.classList.add('opacity-75');
      setTimeout(function () {
        reservationForm.style.display = 'none';
        formSuccess.classList.remove('hidden');
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 900);
    });
  }

  /* ===== Contact Form ===== */
  const contactForm = document.getElementById('contact-form');
  const contactSuccess = document.getElementById('contact-success');
  if (contactForm && contactSuccess) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
      btn.classList.add('opacity-75');
      setTimeout(function () {
        contactSuccess.classList.remove('hidden');
        contactForm.reset();
        btn.disabled = false;
        btn.textContent = 'Nous contacter';
        btn.classList.remove('opacity-75');
        contactSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 900);
    });
  }

  /* ===== Lightbox ===== */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  window.openGallery = function (imgEl) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = imgEl.src;
    lightboxImg.alt = imgEl.alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function () {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.closeLightbox();
      window.closeMobileMenu();
    }
  });

  /* ===== Disable Thursday/Friday in date picker ===== */
  if (dateInput) {
    dateInput.addEventListener('input', function () {
      const selected = new Date(this.value + 'T12:00:00');
      const day = selected.getDay(); // 0=Sun, 1=Mon, 4=Thu, 5=Fri
      if (day === 4 || day === 5) {
        this.setCustomValidity('Le restaurant est fermé le jeudi et le vendredi. Veuillez choisir un autre jour.');
        this.reportValidity();
      } else {
        this.setCustomValidity('');
      }
    });
  }

  /* ===== Active nav link highlight on scroll ===== */
  const sections = document.querySelectorAll('section[id], div[id="accueil"]');
  const navLinks = document.querySelectorAll('.nav-link');
  function updateActiveNav() {
    let current = '';
    sections.forEach(function (section) {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(function (link) {
      link.style.color = '';
      const href = link.getAttribute('href');
      if (href === '#' + current) {
        link.style.color = '#7EBEC5';
      }
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });

})();
