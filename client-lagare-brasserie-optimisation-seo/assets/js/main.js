document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.querySelector('.navbar');
  var hamburger = document.querySelector('.hamburger');
  var navLinks = document.querySelector('.nav-links');

  /* --- Navbar scrolled state --- */
  function handleNavbarScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  /* --- Mobile menu --- */
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      var isOpen = navbar.classList.toggle('menu-open');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navbar.classList.remove('menu-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* --- Hero slider --- */
  var slides = document.querySelectorAll('.hero-slide');
  var dots = document.querySelectorAll('.hero-dot');
  var current = 0;
  var sliderInterval;

  function goToSlide(index) {
    slides[current].classList.remove('is-active');
    dots[current] && dots[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current] && dots[current].classList.add('is-active');
    var img = slides[current].querySelector('img');
    if (img) {
      img.style.animation = 'none';
      void img.offsetWidth;
      img.style.animation = '';
    }
  }

  function startSlider() {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (slides.length < 2 || reduceMotion) return;
    sliderInterval = setInterval(function () {
      goToSlide(current + 1);
    }, 5500);
  }

  if (slides.length) {
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        clearInterval(sliderInterval);
        goToSlide(i);
        startSlider();
      });
    });
    startSlider();
  }

  /* --- Scroll motion design (GSAP) --- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.reveal').forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: (i % 3) * 0.08,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });
    });

    var mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', function () {
      gsap.to('.concept-media img', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: '.concept',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6
        }
      });

      gsap.from('.hero-content > *', {
        y: 24,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.2
      });
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }
});
