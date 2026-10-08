/* =========================================================
ARNOB CHAKRABORTY — PORTFOLIO
Main Script
========================================================= */

(() => {
  "use strict";

  const CONTACT_EMAIL = "arnobchakraborty111@gmail.com";

  document.documentElement.classList.remove("no-js");

  /* ---------- Preloader (with safety fallback) ---------- */
  const preloader = document.querySelector(".preloader");
  const hidePreloader = () => preloader && preloader.classList.add("hidden");

  window.addEventListener("load", () => setTimeout(hidePreloader, 300));
  setTimeout(hidePreloader, 3000);

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector(".header");
  const onScroll = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".nav-menu");

  const setMenu = (open) => {
    if (!toggle || !menu) return;
    toggle.classList.toggle("active", open);
    menu.classList.toggle("active", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  if (toggle && menu) {
    toggle.addEventListener("click", () => setMenu(!menu.classList.contains("active")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) setMenu(false);
    });
  }

  /* ---------- Scroll reveal ---------- */
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Page router (hash based: #/about, #/projects ...) ---------- */
  const pageEls = Array.from(document.querySelectorAll(".page"));
  const pageMap = new Map(pageEls.map((p) => [p.dataset.page, p]));
  const innerKeys = pageEls.map((p) => p.dataset.page).filter((k) => k !== "home");
  const navLinks = document.querySelectorAll(".nav-link");
  const mainEl = document.getElementById("main");
  const overlay = document.querySelector(".page-transition");
  const overlayLabel = document.querySelector(".page-transition-label");
  const homeTitle = document.title;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hrefFor = (key) => (key === "home" ? "#/" : "#/" + key);

  let current = null;
  let busy = false;
  let queued = false;

  // "Previous / Next" navigation at the bottom of every inner page
  innerKeys.forEach((key, i) => {
    const prev = i === 0 ? "home" : innerKeys[i - 1];
    const isLast = i === innerKeys.length - 1;
    const next = isLast ? "home" : innerKeys[i + 1];

    const nav = document.createElement("nav");
    nav.className = "pager";
    nav.setAttribute("aria-label", "Page navigation");
    nav.innerHTML =
      `<a class="pager-prev" href="${hrefFor(prev)}"><span>← Previous</span><strong>${pageMap.get(prev).dataset.label}</strong></a>` +
      `<a class="pager-next" href="${hrefFor(next)}"><span>${isLast ? "Back to" : "Next"} →</span><strong>${pageMap.get(next).dataset.label}</strong></a>`;

    const wrap = document.createElement("div");
    wrap.className = "container";
    wrap.appendChild(nav);
    pageMap.get(key).appendChild(wrap);
  });

  const routeFrom = (hash) => {
    let raw = "";
    try {
      raw = decodeURIComponent(String(hash || "").replace(/^#\/?/, ""));
    } catch (err) {}
    const key = raw.split(/[?/]/)[0];
    return pageMap.has(key) ? key : "home";
  };
  const getRoute = () => routeFrom(location.hash);

  // Route requested by a click (works even where the URL hash is blocked, e.g. some online editors)
  let wanted = null;

  const showPage = (route, moveFocus) => {
    pageEls.forEach((p) => p.classList.toggle("active", p.dataset.page === route));
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === hrefFor(route));
    });

    const page = pageMap.get(route);
    document.title = route === "home" ? homeTitle : page.dataset.title + " — Arnob Chakraborty";
    current = route;

    if (moveFocus) {
      const heading = page.querySelector("h1, h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    }
  };

  const onRoute = () => {
    const route = wanted !== null ? wanted : getRoute();

    if (current === null) {
      wanted = null;
      showPage(route, false); // first load: no animation
      return;
    }
    if (route === current) {
      wanted = null;
      return;
    }

    if (busy) {
      queued = true;
      return;
    }

    wanted = null;
    setMenu(false);

    if (reduceMotion || !overlay) {
      showPage(route, true);
      return;
    }

    busy = true;
    overlayLabel.textContent = pageMap.get(route).dataset.label;
    overlay.classList.remove("exit");
    overlay.classList.add("cover");

    // 1) overlay covers the screen  2) swap page  3) overlay slides away
    setTimeout(() => {
      showPage(route, true);
      overlay.classList.remove("cover");
      overlay.classList.add("exit");

      setTimeout(() => {
        overlay.classList.remove("exit");
        busy = false;
        if (queued) {
          queued = false;
          onRoute();
        }
      }, 550);
    }, 550);
  };

  window.addEventListener("hashchange", () => onRoute());
  onRoute();

  // Handle clicks on page links directly (does not depend on hashchange firing)
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest ? e.target.closest('a[href^="#/"]') : null;
    if (!link) return;

    e.preventDefault();
    const href = link.getAttribute("href");
    wanted = routeFrom(href);

    try {
      if (location.hash !== href) history.pushState(null, "", href);
    } catch (err) {
      // URL can't be updated in this environment; the page still switches
    }
    onRoute();
  });

  // Skip link (the hash is used for routing, so handle it with JS)
  const skip = document.querySelector(".skip-link");
  if (skip && mainEl) {
    skip.addEventListener("click", (e) => {
      e.preventDefault();
      mainEl.focus();
    });
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Contact form ---------- */
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("formStatus");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const rules = {
    name: (v) => (v.length < 2 ? "Please enter your name." : ""),
    email: (v) => (!emailPattern.test(v) ? "Please enter a valid email address." : ""),
    subject: (v) => (v.length < 3 ? "Please enter a subject." : ""),
    message: (v) => (v.length < 10 ? "Message should be at least 10 characters." : ""),
  };

  const setError = (field, message) => {
    const group = field.closest(".form-group");
    const error = document.getElementById(field.id + "-error");
    if (group) group.classList.toggle("invalid", Boolean(message));
    if (error) error.textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const validateField = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const message = rule(field.value.trim());
    setError(field, message);
    return !message;
  };

  Object.keys(rules).forEach((key) => {
    const field = form.elements[key];
    if (!field) return;
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.closest(".form-group").classList.contains("invalid")) validateField(field);
    });
  });

  const showStatus = (message, type) => {
    status.textContent = message;
    status.className = "form-status " + (type || "");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot: silently stop bots
    if (form.elements.company && form.elements.company.value) return;

    const valid = Object.keys(rules)
      .map((key) => validateField(form.elements[key]))
      .every(Boolean);

    if (!valid) {
      showStatus("Please fix the highlighted fields.", "error");
      const firstInvalid = form.querySelector(".invalid input, .invalid textarea");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      subject: form.elements.subject.value.trim(),
      message: form.elements.message.value.trim(),
    };

    const endpoint = form.dataset.endpoint;

    // Option A: a form service (Formspree, Web3Forms, etc.) is configured
    if (endpoint) {
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      showStatus("Sending...", "");
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Request failed");
        form.reset();
        showStatus("Thanks! Your message has been sent.", "success");
      } catch (err) {
        showStatus("Something went wrong. Please email me directly at " + CONTACT_EMAIL + ".", "error");
      } finally {
        button.disabled = false;
      }
      return;
    }

    // Option B (default): open the visitor's email app with the message prefilled
    const body = `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;
    window.location.href =
      "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent(data.subject) +
      "&body=" + encodeURIComponent(body);
    showStatus("Opening your email app to send the message...", "success");
  });
})();
