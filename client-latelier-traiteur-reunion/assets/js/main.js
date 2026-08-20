/* =============================================
   L'Atelier Traiteur - JavaScript principal
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Navigation scrollée --- */
  const header = document.querySelector('.header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --- Menu burger --- */
  const burger = document.querySelector('.nav-burger');
  const navMenu = document.querySelector('.nav-menu');
  const navOverlay = document.createElement('div');
  navOverlay.className = 'nav-overlay';
  navOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:998;display:none;';
  document.body.appendChild(navOverlay);

  const toggleMenu = (open) => {
    burger.classList.toggle('active', open);
    navMenu.classList.toggle('open', open);
    navOverlay.style.display = open ? 'block' : 'none';
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger?.addEventListener('click', () => toggleMenu(!navMenu.classList.contains('open')));
  navOverlay.addEventListener('click', () => toggleMenu(false));

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  /* --- Animations au scroll (IntersectionObserver) --- */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(el => observer.observe(el));
  }

  /* --- Formulaire de contact --- */
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    const original = btn.innerHTML;
    btn.innerHTML = 'Envoi en cours…';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      contactForm.reset();
      showToast('Votre message a bien été envoyé. Nous vous répondrons rapidement.');
    }, 1200);
  });

  /* --- Formulaire newsletter --- */
  const newsletterForm = document.getElementById('newsletterForm');
  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    if (!emailInput.value) return;
    const btn = newsletterForm.querySelector('button');
    const original = btn.innerHTML;
    btn.innerHTML = '✓ Inscrit !';
    btn.disabled = true;
    emailInput.disabled = true;

    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      emailInput.disabled = false;
      emailInput.value = '';
      showToast('Inscription réussie ! Bienvenue dans notre newsletter.');
    }, 1000);
  });

  /* --- Toast notification --- */
  function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.innerHTML = `<div class="toast-icon">✓</div><span class="toast-message"></span>`;
      document.body.appendChild(toast);
    }
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  /* --- Lazy loading images (natif + fallback) --- */
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.src = img.dataset.src || img.src;
    });
  } else {
    const lazyImgs = document.querySelectorAll('img[data-src]');
    const lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          lazyObserver.unobserve(img);
        }
      });
    });
    lazyImgs.forEach(img => lazyObserver.observe(img));
  }

  /* --- Smooth anchor scroll --- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = header ? header.offsetHeight + 16 : 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

});
