/* =========================================
   PICARD MOULIN - LA POSSESSION
   Script principal
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ------ SLIDER HERO ------ */
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dot');
  let current = 0;
  let autoSlide;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function startAuto() {
    autoSlide = setInterval(() => goTo(current + 1), 5000);
  }

  function resetAuto() {
    clearInterval(autoSlide);
    startAuto();
  }

  document.querySelector('.slider-btn.prev')?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  document.querySelector('.slider-btn.next')?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); resetAuto(); }));

  if (slides.length > 1) startAuto();

  /* ------ NAV MOBILE ------ */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  toggle?.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.querySelectorAll('span')[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
    toggle.querySelectorAll('span')[1].style.opacity = isOpen ? '0' : '1';
    toggle.querySelectorAll('span')[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
  });

  // Fermer le menu mobile en cliquant sur un lien
  navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
  }));

  /* ------ NAVBAR SCROLL ------ */
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ------ BACK TO TOP ------ */
  const backTop = document.querySelector('.back-top');
  window.addEventListener('scroll', () => {
    backTop?.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ------ LAZY LOADING IMAGES ------ */
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
    }, { rootMargin: '100px' });

    document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
  } else {
    // Fallback pour navigateurs anciens
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
  }

  /* ------ FORMULAIRE ITINÉRAIRE ------ */
  const form = document.querySelector('#form-itineraire');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="text"]');
    const method = form.querySelector('input[name="method"]:checked')?.value || 'email';
    const val = input?.value.trim();

    if (!val) {
      input?.focus();
      return;
    }

    if (method === 'email') {
      showToast('📧 Plan d\'accès envoyé par email !');
    } else {
      showToast('📱 Plan d\'accès envoyé par SMS !');
    }

    form.reset();
  });

  /* ------ TOAST NOTIFICATION ------ */
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3800);
  }

  /* ------ RECHERCHE MAGASIN ------ */
  const searchForm = document.querySelector('#form-search');
  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchForm.querySelector('input')?.value.trim();
    if (q) {
      window.open(`https://magasins.picard.fr/?query=${encodeURIComponent(q)}`, '_blank', 'noopener');
    }
  });

  /* ------ ANIMATION D'APPARITION AU SCROLL ------ */
  if ('IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));
  } else {
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
  }

  /* ------ HIGHLIGHT JOUR ACTUEL ------ */
  const today = new Date().getDay(); // 0=dim, 1=lun, ...6=sam
  const rows = document.querySelectorAll('.horaires-row[data-day]');
  rows.forEach(row => {
    if (parseInt(row.dataset.day) === today) {
      row.classList.add('today');
      const label = row.querySelector('.day-label');
      if (label) {
        const tag = document.createElement('span');
        tag.className = 'today-tag';
        tag.textContent = 'Aujourd\'hui';
        label.appendChild(tag);
      }
    }
  });

});
