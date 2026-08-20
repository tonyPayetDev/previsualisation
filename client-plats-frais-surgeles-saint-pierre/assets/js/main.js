(function () {
  "use strict";

  var root = document.documentElement;
  var STORAGE_THEME = "sst-theme";
  var STORAGE_CONTRAST = "sst-contrast";

  /* ---------- Theme (dark mode) ---------- */
  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }

  function applyContrast(contrast) {
    if (contrast === "high") {
      root.setAttribute("data-contrast", "high");
    } else {
      root.removeAttribute("data-contrast");
    }
    var btn = document.getElementById("contrast-toggle");
    if (btn) btn.setAttribute("aria-pressed", contrast === "high" ? "true" : "false");
  }

  var savedTheme = localStorage.getItem(STORAGE_THEME);
  if (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    savedTheme = "dark";
  }
  applyTheme(savedTheme);
  applyContrast(localStorage.getItem(STORAGE_CONTRAST));

  document.addEventListener("DOMContentLoaded", function () {
    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        var isDark = root.getAttribute("data-theme") === "dark";
        var next = isDark ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem(STORAGE_THEME, next);
      });
    }

    var contrastBtn = document.getElementById("contrast-toggle");
    if (contrastBtn) {
      contrastBtn.addEventListener("click", function () {
        var isHigh = root.getAttribute("data-contrast") === "high";
        var next = isHigh ? "normal" : "high";
        applyContrast(next);
        localStorage.setItem(STORAGE_CONTRAST, next);
      });
    }

    /* ---------- Mobile nav ---------- */
    var navToggle = document.getElementById("nav-toggle");
    var mainNav = document.getElementById("main-nav");
    if (navToggle && mainNav) {
      navToggle.addEventListener("click", function () {
        var expanded = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", String(!expanded));
        mainNav.classList.toggle("is-open", !expanded);
        document.body.style.overflow = !expanded ? "hidden" : "";
      });
      mainNav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          navToggle.setAttribute("aria-expanded", "false");
          mainNav.classList.remove("is-open");
          document.body.style.overflow = "";
        });
      });
    }

    /* ---------- Sticky header shrink ---------- */
    var header = document.getElementById("site-header");
    function onScrollHeader() {
      if (!header) return;
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });

    /* ---------- Back to top ---------- */
    var backToTop = document.getElementById("back-to-top");
    function onScrollTop() {
      if (!backToTop) return;
      backToTop.classList.toggle("is-visible", window.scrollY > 600);
    }
    onScrollTop();
    window.addEventListener("scroll", onScrollTop, { passive: true });
    if (backToTop) {
      backToTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    /* ---------- Scroll reveal ---------- */
    var revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && revealEls.length) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
      );
      revealEls.forEach(function (el, i) {
        el.style.setProperty("--i", i % 8);
        observer.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }

    /* ---------- Animated counters ---------- */
    var counters = document.querySelectorAll("[data-counter]");
    if ("IntersectionObserver" in window && counters.length) {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (el) {
        counterObserver.observe(el);
      });
    }

    function animateCounter(el) {
      var target = parseInt(el.getAttribute("data-counter"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1400;
      var start = null;

      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = target + suffix;
        }
      }
      window.requestAnimationFrame(step);
    }

    /* ---------- Article read-more toggle ---------- */
    document.querySelectorAll(".card-article__more").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var full = btn.parentElement.querySelector(".card-article__full");
        if (!full) return;
        var isOpen = full.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(isOpen));
        btn.querySelector(".label").textContent = isOpen ? "Réduire" : "Lire l'article";
      });
    });

    /* ---------- Contact form (client-side confirmation, no backend) ---------- */
    var form = document.getElementById("contact-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = document.getElementById("form-note");
        if (note) {
          note.textContent = "Merci ! Votre message a bien été enregistré, notre équipe vous recontacte rapidement.";
          note.classList.add("is-success");
        }
        form.reset();
      });
    }

    /* ---------- Current year ---------- */
    var yearEl = document.getElementById("current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
