/* ==========================================================================
   Café Coton — Chemises Homme
   Scroll motion, filters, FAQ, newsletter.
   Motion is progressive enhancement: <html> only keeps `js-motion`
   (which hides revealed elements) once GSAP is confirmed available.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  window.__motionBooted = true; // tells the inline head guard the script arrived

  /* ------------------------------------------------------------------
     Header: sticky state + scroll progress + active section
     ------------------------------------------------------------------ */
  var header = document.querySelector(".header");
  var progress = document.querySelector(".progress");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link[data-section]"));

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-stuck", y > 8);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(y / max, 1) : 0;
    progress.style.transform = "scaleX(" + ratio + ")";
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  onScroll();

  if ("IntersectionObserver" in window && navLinks.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.setAttribute("aria-current", String(link.dataset.section === entry.target.id));
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("section[id]").forEach(function (section) {
      spy.observe(section);
    });
  }

  /* ------------------------------------------------------------------
     Mobile drawer
     ------------------------------------------------------------------ */
  var drawer = document.querySelector(".drawer");
  var burger = document.querySelector(".header__burger");
  var drawerClose = document.querySelector(".drawer__close");
  var scrim = document.querySelector(".drawer__scrim");
  var lastFocused = null;

  function setDrawer(open) {
    drawer.dataset.open = String(open);
    drawer.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);

    if (open) {
      lastFocused = document.activeElement;
      drawerClose.focus();
    } else if (lastFocused) {
      lastFocused.focus();
    }
  }

  burger.addEventListener("click", function () {
    setDrawer(drawer.dataset.open !== "true");
  });
  drawerClose.addEventListener("click", function () {
    setDrawer(false);
  });
  scrim.addEventListener("click", function () {
    setDrawer(false);
  });
  drawer.querySelectorAll(".drawer__list a").forEach(function (link) {
    link.addEventListener("click", function () {
      setDrawer(false);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.dataset.open === "true") setDrawer(false);
  });

  /* ------------------------------------------------------------------
     Marquee — continuous loop, direction and speed react to scroll
     ------------------------------------------------------------------ */
  var track = document.querySelector(".marquee__track");
  if (track && !reduced) {
    var half = 0;
    var offset = 0;
    var base = 0.35; // px per frame
    var boost = 0;
    var lastY = window.scrollY;

    var measure = function () {
      half = track.scrollWidth / 2;
    };
    measure();
    window.addEventListener("resize", measure);

    window.addEventListener(
      "scroll",
      function () {
        var y = window.scrollY;
        boost = Math.max(-6, Math.min(6, (y - lastY) * 0.35));
        lastY = y;
      },
      { passive: true }
    );

    (function loop() {
      boost *= 0.92;
      offset -= base + boost;
      if (half > 0) {
        if (offset <= -half) offset += half;
        if (offset > 0) offset -= half;
      }
      track.style.transform = "translate3d(" + offset + "px,0,0)";
      requestAnimationFrame(loop);
    })();
  }

  /* ------------------------------------------------------------------
     Filters — real, multi-criteria, accessible
     ------------------------------------------------------------------ */
  var products = Array.prototype.slice.call(document.querySelectorAll(".product"));
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  var countEl = document.querySelector("[data-count]");
  var emptyState = document.querySelector(".empty-state");
  var resetBtns = Array.prototype.slice.call(document.querySelectorAll(".filters__reset"));
  var filtersPanel = document.querySelector(".filters__panel");
  var filtersToggle = document.querySelector(".filters__toggle");
  var filtersJump = document.querySelector(".filters__jump");
  var active = {};
  var booted = false; // on first pass the cards are still owned by the scroll reveal

  function applyFilters() {
    var shown = 0;

    products.forEach(function (product) {
      var match = Object.keys(active).every(function (key) {
        var values = active[key];
        if (!values.length) return true;
        return values.indexOf(product.dataset[key]) !== -1;
      });

      product.hidden = !match;
      if (match) {
        shown++;
        if (booted && hasGsap && !reduced) {
          window.gsap.fromTo(
            product,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", overwrite: true }
          );
        }
      }
    });

    countEl.textContent = String(shown);
    emptyState.dataset.visible = String(shown === 0);
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var key = chip.dataset.filter;
      var value = chip.dataset.value;
      var pressed = chip.getAttribute("aria-pressed") === "true";

      chip.setAttribute("aria-pressed", String(!pressed));
      active[key] = active[key] || [];

      if (pressed) {
        active[key] = active[key].filter(function (v) {
          return v !== value;
        });
      } else {
        active[key].push(value);
      }

      applyFilters();
    });
  });

  resetBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      active = {};
      chips.forEach(function (chip) {
        chip.setAttribute("aria-pressed", "false");
      });
      applyFilters();
    });
  });

  function openPanel(open) {
    filtersPanel.dataset.collapsed = String(!open);
    filtersToggle.setAttribute("aria-expanded", String(open));
    filtersToggle.querySelector(".btn__label").textContent = open ? "Masquer les filtres" : "Filtrer les chemises";
  }

  if (filtersToggle) {
    filtersToggle.addEventListener("click", function () {
      openPanel(filtersPanel.dataset.collapsed === "true");
    });
  }

  if (filtersJump) {
    filtersJump.addEventListener("click", function () {
      openPanel(true); // no-op visually on desktop, where the panel is always shown
      filtersPanel.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      var firstChip = filtersPanel.querySelector(".chip");
      if (firstChip) firstChip.focus({ preventScroll: true });
    });
  }

  applyFilters();
  booted = true;

  /* ------------------------------------------------------------------
     FAQ accordion — height animated, one panel at a time
     ------------------------------------------------------------------ */
  document.querySelectorAll(".faq__q").forEach(function (question) {
    question.addEventListener("click", function () {
      var panel = document.getElementById(question.getAttribute("aria-controls"));
      var open = question.getAttribute("aria-expanded") === "true";

      document.querySelectorAll('.faq__q[aria-expanded="true"]').forEach(function (other) {
        if (other === question) return;
        other.setAttribute("aria-expanded", "false");
        var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
        otherPanel.style.height = "0px";
      });

      question.setAttribute("aria-expanded", String(!open));
      panel.style.height = open ? "0px" : panel.scrollHeight + "px";
    });
  });

  /* ------------------------------------------------------------------
     Newsletter — inline validation on submit, success feedback
     ------------------------------------------------------------------ */
  var form = document.querySelector(".club__form");
  if (form) {
    var emailField = form.querySelector(".field");
    var email = form.querySelector("#club-email");
    var status = form.querySelector(".form-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = email.checkValidity() && email.value.indexOf("@") > 0;

      emailField.dataset.invalid = String(!valid);
      if (!valid) {
        email.focus();
        return;
      }

      status.dataset.visible = "true";
      status.querySelector(".form-status__text").textContent =
        "Merci ! Votre inscription au Club Privilège est confirmée pour " + email.value + ".";
      form.reset();
    });

    email.addEventListener("blur", function () {
      if (email.value) emailField.dataset.invalid = String(!email.checkValidity());
    });
  }

  /* ------------------------------------------------------------------
     Back to top
     ------------------------------------------------------------------ */
  var toTop = document.querySelector(".to-top");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ------------------------------------------------------------------
     Scroll motion (GSAP + ScrollTrigger)
     ------------------------------------------------------------------ */
  if (!hasGsap || reduced) {
    root.classList.remove("js-motion");
    return;
  }

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  // Split the headline into masked words so it rises word by word.
  // Walks child nodes so inline markup (the highlighted "-50%") survives intact.
  function wrapWord(child) {
    var mask = document.createElement("span");
    var inner = document.createElement("span");
    mask.className = "word-wrap";
    inner.className = "word";
    inner.appendChild(child);
    mask.appendChild(inner);
    return mask;
  }

  document.querySelectorAll("[data-split]").forEach(function (node) {
    var frag = document.createDocumentFragment();

    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        child.textContent.split(/\s+/).forEach(function (word) {
          if (!word) return;
          frag.appendChild(wrapWord(document.createTextNode(word)));
          frag.appendChild(document.createTextNode(" "));
        });
      } else if (child.nodeType === 1) {
        frag.appendChild(wrapWord(child));
        frag.appendChild(document.createTextNode(" "));
      }
    });

    node.innerHTML = "";
    node.appendChild(frag);
  });

  var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
  heroTl
    .to(".hero__figure", { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power4.inOut" }, 0)
    .from(".hero__figure img", { scale: 1.25, duration: 1.4 }, 0)
    .to(".hero .word", { y: "0%", duration: 0.9, stagger: 0.045 }, 0.25)
    .from(".hero__lead", { y: 24, opacity: 0, duration: 0.7 }, 0.75)
    .from(".hero__cta > *", { y: 24, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.85)
    .from(".hero__stats .stat", { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, 1)
    .from(".hero__badge", { scale: 0.4, opacity: 0, duration: 0.7, ease: "back.out(1.8)" }, 1.05)
    // The rule sweeps under "-50%" once the words have landed — it points at the offer.
    .call(function () {
      var hl = document.querySelector(".hero__title .highlight");
      if (hl) hl.style.setProperty("--hl", "1");
    }, null, 0.9);

  // Generic reveals
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: parseFloat(el.dataset.reveal) || 0,
      scrollTrigger: { trigger: el, start: "top 88%" }
    });
  });

  // Masked line reveals (section titles)
  gsap.utils.toArray("[data-reveal-mask]").forEach(function (el) {
    gsap.to(el.children, {
      y: "0%",
      duration: 0.9,
      ease: "power4.out",
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 90%" }
    });
  });

  // Clip reveals (cards, media)
  gsap.utils.toArray("[data-reveal-clip]").forEach(function (el, i) {
    gsap.to(el, {
      clipPath: "inset(0 0 0% 0)",
      duration: 1.1,
      ease: "power4.inOut",
      delay: (i % 3) * 0.1,
      scrollTrigger: { trigger: el, start: "top 85%" }
    });
  });

  // Parallax layers — subtle, transform-only
  gsap.utils.toArray("[data-parallax]").forEach(function (el) {
    var amount = parseFloat(el.dataset.parallax) || 12;
    gsap.fromTo(
      el,
      { yPercent: -amount / 2 },
      {
        yPercent: amount / 2,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      }
    );
  });

  // Hero image drifts as the section leaves — keeps spatial continuity
  gsap.to(".hero__figure img", {
    yPercent: 8,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  // Counters
  gsap.utils.toArray("[data-counter]").forEach(function (el) {
    var target = parseFloat(el.dataset.counter);
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var obj = { value: 0 };

    gsap.to(obj, {
      value: target,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
      onUpdate: function () {
        el.textContent = prefix + Math.round(obj.value) + suffix;
      }
    });
  });

  // Product cards stagger in row by row
  window.ScrollTrigger.batch(".product", {
    start: "top 92%",
    onEnter: function (batch) {
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06 });
    }
  });
})();
