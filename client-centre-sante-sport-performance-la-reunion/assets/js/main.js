/* ===================================================
   CENTRE SANTÉ SPORT & PERFORMANCE LA RÉUNION
   main.js — v1.0
   =================================================== */

'use strict';

/* ---------- STICKY HEADER ---------- */
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();

/* ---------- MOBILE MENU ---------- */
(function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    // Animate hamburger bars
    const bars = toggle.querySelectorAll('span');
    if (isOpen) {
      bars[0].style.transform = 'translateY(7px) rotate(45deg)';
      bars[1].style.opacity = '0';
      bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      bars[0].style.transform = '';
      bars[1].style.opacity = '';
      bars[2].style.transform = '';
    }
  });

  // Close menu when a link is clicked
  menu.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', false);
      const bars = toggle.querySelectorAll('span');
      bars[0].style.transform = '';
      bars[1].style.opacity = '';
      bars[2].style.transform = '';
    });
  });

  // Close menu on click outside
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', false);
    }
  });
})();

/* ---------- SMOOTH SCROLL ---------- */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ---------- ACTIVE NAV LINK ON SCROLL ---------- */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach(sec => observer.observe(sec));
})();

/* ---------- SCROLL REVEAL ---------- */
(function initScrollReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(item => observer.observe(item));
})();

/* ---------- CONTACT FORM ---------- */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Validation helpers
  const validators = {
    name: (val) => val.trim().length >= 2,
    phone: (val) => /^[\d\s\.\+\-\(\)]{8,}$/.test(val.trim()),
    email: (val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    service: (val) => val !== '',
    message: () => true
  };

  const getErrorMessage = (field) => {
    const messages = {
      name: 'Veuillez entrer votre nom complet (min. 2 caractères).',
      phone: 'Veuillez entrer un numéro de téléphone valide.',
      email: 'Veuillez entrer une adresse email valide.',
      service: 'Veuillez sélectionner un service.',
    };
    return messages[field] || 'Champ invalide.';
  };

  const validateField = (input) => {
    const name = input.name;
    const valid = validators[name] ? validators[name](input.value) : true;
    input.classList.toggle('is-valid', valid && input.value !== '');
    input.classList.toggle('is-invalid', !valid);

    // Show/hide error message
    let errorEl = input.nextElementSibling;
    if (!errorEl || !errorEl.classList.contains('form-error')) {
      errorEl = document.createElement('span');
      errorEl.className = 'form-error';
      input.insertAdjacentElement('afterend', errorEl);
    }
    errorEl.textContent = valid ? '' : getErrorMessage(name);
    return valid;
  };

  // Live validation on blur
  form.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('blur', () => {
      if (input.required || input.value.trim() !== '') {
        validateField(input);
      }
    });
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) {
        validateField(input);
      }
    });
  });

  // Submit handler
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    let isValid = true;
    form.querySelectorAll('.form-input[required]').forEach(input => {
      if (!validateField(input)) isValid = false;
    });
    // Also validate optional email if not empty
    const emailInput = form.querySelector('#email');
    if (emailInput && emailInput.value.trim() !== '') {
      if (!validateField(emailInput)) isValid = false;
    }

    if (!isValid) return;

    // Show loading state
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      Envoi en cours...
    `;

    // Simulate form submission (replace with actual endpoint)
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      // Show success message
      showFormSuccess();
    }, 1500);
  });

  function showFormSuccess() {
    const formWrap = form.parentElement;

    const successEl = document.createElement('div');
    successEl.className = 'form-success show';
    successEl.innerHTML = `
      <div class="form-success__icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h3 class="form-success__title">Demande envoyée !</h3>
      <p class="form-success__text">Merci pour votre message. Notre équipe vous contactera sous 24h pour confirmer votre rendez-vous.</p>
      <p style="margin-top:16px;font-size:0.875rem;color:#4b5563;">Ou appelez-nous directement au <a href="tel:0262781487" style="font-weight:600;color:#000;">02.62.78.14.87</a></p>
    `;

    form.style.opacity = '0';
    form.style.transform = 'translateY(10px)';
    form.style.transition = '0.3s ease';

    setTimeout(() => {
      form.style.display = 'none';
      formWrap.appendChild(successEl);
    }, 300);
  }
})();

/* ---------- COUNTER ANIMATION ---------- */
(function initCounters() {
  const counters = document.querySelectorAll('.stats-band__number, .hero__stat-number');
  if (!counters.length) return;

  const parseNum = (str) => {
    const match = str.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const formatNum = (original, current) => {
    if (original.includes('m²')) return Math.round(current) + 'm²';
    if (original.includes('+')) return '+' + Math.round(current);
    return String(Math.round(current));
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const original = el.textContent.trim();
      const target = parseNum(original);
      if (target === 0) return;

      let start = null;
      const duration = 1500;

      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = formatNum(original, eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = original;
      };

      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();

/* ---------- CSS SPIN KEYFRAME (for loader) ---------- */
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
`;
document.head.appendChild(spinStyle);

/* ---------- SCROLL REVEAL: ADD ATTRIBUTES ---------- */
(function addRevealAttributes() {
  const toReveal = [
    { selector: '.service-card', delay: true },
    { selector: '.team-card', delay: true },
    { selector: '.why-item', delay: true },
    { selector: '.cabinet__feature', delay: true },
    { selector: '.section__header', delay: false },
    { selector: '.contact__item', delay: true },
  ];

  toReveal.forEach(({ selector, delay }) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.setAttribute('data-reveal', '');
      if (delay && i > 0) {
        el.setAttribute('data-reveal-delay', String(Math.min(i, 4)));
      }
    });
  });
})();
