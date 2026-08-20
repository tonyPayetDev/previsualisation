/* Le BàO — motion design (GSAP)
   Inspiration : hero cinématique + scroll reveals + hover magnétiques (motionsites.ai) */

document.documentElement.classList.add("js");

(function () {
  var hasGsap = typeof window.gsap !== "undefined";
  if (hasGsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------------------------------------------------------------------
     Header : shrink + backdrop on scroll
     --------------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------------
     Mobile nav toggle
     --------------------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      mobileNav.classList.toggle("is-open");
      toggle.classList.toggle("is-active");
      document.body.style.overflow = mobileNav.classList.contains("is-open") ? "hidden" : "";
    });
    mobileNav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------------------------------------------------------------------
     Hero — word-by-word title reveal + parallax background
     --------------------------------------------------------------------- */
  function splitWords(el) {
    var text = el.textContent.trim();
    el.innerHTML = "";
    text.split(" ").forEach(function (word, i, arr) {
      var wrap = document.createElement("span");
      wrap.className = "word";
      var inner = document.createElement("span");
      inner.textContent = word + (i < arr.length - 1 ? " " : "");
      if (el.dataset.accentWord && word.replace(/[.,]/g, "") === el.dataset.accentWord) {
        inner.classList.add("accent");
      }
      wrap.appendChild(inner);
      el.appendChild(wrap);
    });
    return el.querySelectorAll(".word span");
  }

  var heroTitle = document.querySelector("[data-hero-title]");
  if (heroTitle) {
    var spans = splitWords(heroTitle);
    if (hasGsap) {
      gsap.set(spans, { yPercent: 120 });
      gsap.timeline({ delay: 0.3 })
        .to(".hero-tag", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
        .to(spans, { yPercent: 0, duration: 1, stagger: 0.06, ease: "power4.out" }, "-=0.2")
        .to(".hero-sub", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.5")
        .to(".hero-actions", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.5")
        .to(".hero-stats", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.5");
    } else {
      spans.forEach(function (s) { s.style.transform = "none"; });
    }
  }

  if (hasGsap) {
    gsap.set([".hero-tag", ".hero-sub", ".hero-actions", ".hero-stats"], { opacity: 0, y: 24 });

    /* Hero parallax background */
    gsap.to(".hero", {
      backgroundPosition: "50% 30%",
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    /* ---------------------------------------------------------------------
       Scroll reveals for sections
       --------------------------------------------------------------------- */
    document.querySelectorAll(".reveal-init").forEach(function (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        }
      );
    });

    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var items = group.children;
      gsap.fromTo(
        items,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 85%" },
        }
      );
    });

    /* Counter animation for hero stats */
    document.querySelectorAll("[data-counter]").forEach(function (el) {
      var target = parseFloat(el.dataset.counter);
      var obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: function () {
          el.textContent = (target % 1 === 0 ? Math.floor(obj.val) : obj.val.toFixed(1)) + (el.dataset.suffix || "");
        },
      });
    });
  } else {
    document.querySelectorAll(".reveal-init").forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
  }

  /* ---------------------------------------------------------------------
     Magnetic CTA buttons (desktop only)
     --------------------------------------------------------------------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".cta").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        if (hasGsap) {
          gsap.to(btn, { x: x * 0.25, y: y * 0.35, duration: 0.4, ease: "power2.out" });
        }
      });
      btn.addEventListener("mouseleave", function () {
        if (hasGsap) gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      });
    });
  }
})();
