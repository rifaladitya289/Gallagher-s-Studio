document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("reveal-ready");

  const revealTargets = document.querySelectorAll("main section, .project-card, .principle-card, .service-card, .stx-screen-card");
  revealTargets.forEach((element) => element.classList.add("reveal-on-scroll"));

  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((element) => observer.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

  // Provide a keyboard-first skip link on every page.
  const mainContent = document.querySelector("main");
  if (mainContent) {
    if (!mainContent.id) mainContent.id = "main-content";
    mainContent.tabIndex = -1;
    const skipLink = document.createElement("a");
    skipLink.className = "skip-link";
    skipLink.href = "#" + mainContent.id;
    skipLink.textContent = "Skip to content";
    document.body.prepend(skipLink);
  }

  // Decode images asynchronously and defer off-screen media.
  document.querySelectorAll("img").forEach((image) => {
    if (!image.hasAttribute("decoding")) image.setAttribute("decoding", "async");
    if (!image.closest(".hero") && !image.hasAttribute("loading")) image.setAttribute("loading", "lazy");
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#primary-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
      nav.classList.toggle("is-open", !isOpen);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
        nav.classList.remove("is-open");
      });
    });
  }

  // Accessible project category filters (the list can grow as projects are added).
  const filterButtons = document.querySelectorAll("[data-filter]");
  const projectCards = document.querySelectorAll(".filterable-project");
  const filterStatus = document.querySelector("#filter-status");
  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        let visible = 0;
        filterButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        projectCards.forEach((card) => {
          const show = filter === "all" || card.dataset.category === filter;
          card.hidden = !show;
          if (show) visible += 1;
        });
        if (filterStatus) filterStatus.textContent = `Showing ${visible} project${visible === 1 ? "" : "s"}`;
      });
    });
  }

  // Prepare an inquiry in the visitor's own email app; no form data is stored.
  const inquiryForm = document.querySelector("#inquiry-form");
  if (inquiryForm) {
    inquiryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!inquiryForm.reportValidity()) return;
      const data = new FormData(inquiryForm);
      const recipient = inquiryForm.dataset.recipient;
      const subject = encodeURIComponent(`Project inquiry — Gallagher's Studio / ${data.get("project")}`);
      const body = encodeURIComponent(
        `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nService: ${data.get("project")}\n\nProject details:\n${data.get("message")}`
      );
      const status = document.querySelector("#form-status");
      if (status) status.textContent = "Opening your email app with the inquiry prepared…";
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    });
  }


  // Close the mobile menu with Escape or an outside tap.
  if (toggle && nav) {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
        toggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (nav.classList.contains("is-open") && !nav.contains(event.target) && !toggle.contains(event.target)) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
      }
    });
  }

  // Global interaction layer: scroll progress, audio feedback, cursor glow and back-to-top.
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = "<span></span>";
  document.body.appendChild(progress);
  const progressBar = progress.querySelector("span");

  const topButton = document.createElement("button");
  topButton.className = "back-to-top";
  topButton.type = "button";
  topButton.setAttribute("aria-label", "Back to top");
  topButton.textContent = "↑";
  document.body.appendChild(topButton);

  const cursorGlow = document.createElement("div");
  cursorGlow.className = "cursor-glow";
  cursorGlow.setAttribute("aria-hidden", "true");
  document.body.appendChild(cursorGlow);

  topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  let scrollTicking = false;
  const updateScrollUI = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.width = (ratio * 100) + "%";
    document.querySelector(".site-header")?.classList.toggle("is-scrolled", window.scrollY > 24);
    topButton.classList.toggle("is-visible", window.scrollY > 500);
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollUI();

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".primary-nav a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const targetPath = href.split("#")[0] || "index.html";
    if (targetPath === currentPath && !href.startsWith("mailto:")) link.setAttribute("aria-current", "page");
  });

  if (window.matchMedia("(pointer:fine) and (min-width:1000px)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("has-cursor-glow");
    window.addEventListener("pointermove", (event) => {
      cursorGlow.style.left = event.clientX + "px";
      cursorGlow.style.top = event.clientY + "px";
    }, { passive: true });
    document.querySelectorAll(".project-card,.service-card,.principle-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--pointer-x", ((event.clientX - rect.left) / rect.width * 100) + "%");
        card.style.setProperty("--pointer-y", ((event.clientY - rect.top) / rect.height * 100) + "%");
      });
    });
  }

  document.querySelectorAll(".button-link,.nav-cta,.round-link,.project-arrow").forEach((button) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const dx = (event.clientX - rect.left - rect.width / 2) * .08;
      const dy = (event.clientY - rect.top - rect.height / 2) * .08;
      button.style.transform = "translate(" + dx + "px," + dy + "px)";
    });
    button.addEventListener("pointerleave", () => { button.style.transform = ""; });
  });

  document.querySelectorAll(".hero h1").forEach((heading) => {
    heading.querySelectorAll("br").forEach((lineBreak) => {
      // Keep the authored line breaks; the entrance animation is applied to the full heading.
      lineBreak.setAttribute("aria-hidden", "true");
    });
  });


  // Highlight the navigation item for the section currently in view.
  const sectionLinks = Array.from(document.querySelectorAll('.primary-nav a[href*="#"]'));
  const sectionTargets = sectionLinks.map((link) => {
    const href = link.getAttribute("href") || "";
    const hashIndex = href.indexOf("#");
    if (hashIndex < 0) return null;
    const targetPath = href.slice(0, hashIndex);
    const current = window.location.pathname.split("/").pop() || "index.html";
    const samePage = !targetPath || targetPath === current || (targetPath === "index.html" && current === "");
    const target = samePage ? document.getElementById(href.slice(hashIndex + 1)) : null;
    return target ? { link, target } : null;
  }).filter(Boolean);
  if ("IntersectionObserver" in window && sectionTargets.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionTargets.forEach(({ link, target }) => {
          const active = target === entry.target;
          link.classList.toggle("is-section-active", active);
          if (active) link.setAttribute("aria-current", "location");
          else if (link.getAttribute("aria-current") === "location") link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-28% 0px -58% 0px", threshold: 0 });
    sectionTargets.forEach(({ target }) => sectionObserver.observe(target));
  }

});