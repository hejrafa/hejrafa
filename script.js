const heroLine = document.querySelector("#hero-line");
const timezoneLabel = document.querySelector("[data-timezone-label]");
const start = document.querySelector(".start");
const cardField = document.querySelector(".card-field");
const dock = document.querySelector(".dock");
const dockItems = document.querySelectorAll("[data-nav-link]");
const viewPanels = document.querySelectorAll("[data-page]");
const stackCards = document.querySelectorAll(".card-field [data-card]");
const draggableCards = document.querySelectorAll("[data-draggable-card]");
const projectCards = document.querySelectorAll(".project-card");
const aboutStickerLinks = document.querySelectorAll(".about-sticker");
const viewTransitionDuration = 460;
let scrollBounceFrame = null;
let scrollBounce = 0;
let touchStartY = null;

const heroLines = [
  ["Touch", "grass"],
  ["Move", "first thing"],
  ["One thing", "at a time"],
  ["Cooking can be", "meditation"],
  ["Read", "every day"],
  ["Hold your own", "happiness"],
  ["Be", "thankful"],
  ["Respect", "everyone"],
  ["Wasted time", "can count"],
  ["Just go", "for it"],
  ["Grow", "in silence"],
  ["Every second", "counts"],
];
const legacyViewAliases = new Map([["work", "projects"]]);
const validViews = new Set(["home", "projects", "about"]);
const routePaths = new Map([
  ["/", "home"],
  ["/index.html", "home"],
  ["/projects", "projects"],
  ["/projects/index.html", "projects"],
  ["/about", "about"],
  ["/about/index.html", "about"],
]);
const routeMeta = new Map([
  ["home", {
    title: "Rafael Polutta - Product Designer in Hamburg | hejrafa",
    metaTitle: "Rafael Polutta - Product Designer in Hamburg",
    description: "Portfolio of Rafael Polutta, a Hamburg-based product designer with 11 years of experience designing useful, mindful products, design systems, and mobile apps.",
    socialDescription: "Product designer with 11 years of experience across design systems, mobile apps, useful products, and mindful side projects.",
    canonical: "https://hejrafa.com/",
  }],
  ["projects", {
    title: "Projects - Rafael Polutta | Product Designer",
    metaTitle: "Projects - Rafael Polutta",
    description: "Selected product design, design system, mobility, side project, video, and podcast work by Rafael Polutta.",
    socialDescription: "Selected product design, design system, mobility, side project, video, and podcast work by Rafael Polutta.",
    canonical: "https://hejrafa.com/projects/",
  }],
  ["about", {
    title: "About Rafael Polutta | Product Designer in Hamburg",
    metaTitle: "About Rafael Polutta",
    description: "About Rafael Polutta, a Hamburg-based product designer focused on clear, useful, ethical, and human digital products.",
    socialDescription: "About Rafael Polutta, a Hamburg-based product designer focused on clear, useful, ethical, and human digital products.",
    canonical: "https://hejrafa.com/about/",
  }],
]);

function setRandomHeroLine() {
  const [firstLine, secondLine] = heroLines[Math.floor(Math.random() * heroLines.length)];
  heroLine.replaceChildren(
    Object.assign(document.createElement("span"), { textContent: firstLine }),
    Object.assign(document.createElement("span"), { textContent: secondLine }),
  );
}

function setTimezoneLabel() {
  if (!timezoneLabel) {
    return;
  }

  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offset) / 60));
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
  timezoneLabel.textContent = `GMT ${sign}${hours}:${minutes}`;
}

function normalizePathname(pathname) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function getPathForView(view) {
  if (view === "home") {
    return "/";
  }

  return `/${view}/`;
}

function getRoutedViewFromUrl(url) {
  const hashView = url.hash.replace("#", "");
  const hashAlias = legacyViewAliases.get(hashView) ?? hashView;

  if (validViews.has(hashAlias)) {
    return hashAlias;
  }

  return routePaths.get(normalizePathname(url.pathname)) ?? null;
}

function getViewFromUrl(url) {
  return getRoutedViewFromUrl(url) ?? "home";
}

function replaceRoute(view) {
  const url = new URL(window.location.href);
  url.pathname = getPathForView(view);
  url.hash = "";
  url.search = "";

  window.history.replaceState({ view }, "", url);
}

function getViewFromLocation() {
  const url = new URL(window.location.href);
  const view = getViewFromUrl(url);
  const hashView = url.hash.replace("#", "");
  const hashAlias = legacyViewAliases.get(hashView) ?? hashView;
  const normalizedPath = normalizePathname(url.pathname);

  if ((validViews.has(hashAlias) && hashView) || routePaths.get(normalizedPath) !== view) {
    replaceRoute(view);
  }

  return view;
}

function updateRoute(view) {
  const url = new URL(window.location.href);
  url.pathname = getPathForView(view);
  url.hash = "";
  url.search = "";

  if (url.href !== window.location.href) {
    window.history.pushState({ view }, "", url);
  }
}

function updateMetaContent(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.setAttribute("content", value);
  }
}

function setRouteMetadata(view) {
  const meta = routeMeta.get(view) ?? routeMeta.get("home");
  const canonical = document.querySelector('link[rel="canonical"]');

  document.title = meta.title;

  if (canonical) {
    canonical.href = meta.canonical;
  }

  updateMetaContent('meta[name="description"]', meta.description);
  updateMetaContent('meta[property="og:title"]', meta.metaTitle);
  updateMetaContent('meta[property="og:description"]', meta.socialDescription);
  updateMetaContent('meta[property="og:url"]', meta.canonical);
  updateMetaContent('meta[name="twitter:title"]', meta.metaTitle);
  updateMetaContent('meta[name="twitter:description"]', meta.socialDescription);
}

function setActiveView(view, { animate = true, updateUrl = false } = {}) {
  const normalizedView = legacyViewAliases.get(view) ?? view;
  const nextView = validViews.has(normalizedView) ? normalizedView : "home";
  const previousPanel = getActivePanel();
  const shouldAnimateLeaving = animate && previousPanel && previousPanel.dataset.page !== nextView;

  if (updateUrl) {
    updateRoute(nextView);
  }

  setRouteMetadata(nextView);
  setScrollBounce(0);
  start.dataset.view = nextView;
  dock.dataset.selected = nextView;
  start.scrollTo({ top: 0, behavior: "instant" });

  dockItems.forEach((item) => {
    const isSelected = item.dataset.navLink === nextView;
    item.classList.toggle("is-selected", isSelected);

    if (isSelected) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  viewPanels.forEach((panel) => {
    const isSelected = panel.dataset.page === nextView;
    const isLeaving = shouldAnimateLeaving && panel === previousPanel;

    if (panel.leaveTimer) {
      clearTimeout(panel.leaveTimer);
      panel.leaveTimer = null;
    }

    panel.classList.toggle("is-leaving", isLeaving);
    panel.classList.toggle("is-active", isSelected);
    panel.setAttribute("aria-hidden", String(!isSelected));

    if (isLeaving) {
      panel.leaveTimer = setTimeout(() => {
        panel.classList.remove("is-leaving");
        panel.leaveTimer = null;
      }, viewTransitionDuration);
    }
  });
}

function getActivePanel() {
  return document.querySelector(".view-panel.is-active");
}

function setScrollBounce(value) {
  scrollBounce = value;
  const activePanel = getActivePanel();

  if (activePanel) {
    activePanel.style.setProperty("--scroll-bounce", `${value}px`);
  }
}

function releaseScrollBounce() {
  if (scrollBounceFrame) {
    cancelAnimationFrame(scrollBounceFrame);
  }

  const startBounce = scrollBounce;
  const duration = 340;
  const startedAt = performance.now();

  function settle(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const decay = Math.pow(1 - progress, 3);
    const wobble = Math.sin(progress * Math.PI * 2.6) * (1 - progress) * 2.2;

    setScrollBounce(startBounce * decay + wobble * Math.sign(startBounce));

    if (progress < 1) {
      scrollBounceFrame = requestAnimationFrame(settle);
    } else {
      scrollBounceFrame = null;
      setScrollBounce(0);
    }
  }

  scrollBounceFrame = requestAnimationFrame(settle);
}

function nudgeScrollBounce(delta) {
  const activePanel = getActivePanel();

  if (!activePanel || !activePanel.matches(".work-page, .about-page")) {
    return;
  }

  const maxScroll = start.scrollHeight - start.clientHeight;
  const atTop = start.scrollTop <= 0 && delta < 0;
  const atBottom = start.scrollTop >= maxScroll - 1 && delta > 0;

  if (!atTop && !atBottom) {
    return;
  }

  if (scrollBounceFrame) {
    cancelAnimationFrame(scrollBounceFrame);
    scrollBounceFrame = null;
  }

  const direction = atTop ? 1 : -1;
  const strength = Math.min(24, Math.abs(delta) * 0.14);
  setScrollBounce(direction * Math.min(28, Math.abs(scrollBounce) * 0.42 + strength));
  releaseScrollBounce();
}

dockItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveView(item.dataset.navLink, { updateUrl: true });
  });
});

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const link = event.target.closest("a[href]");

  if (!link || link.target || link.hasAttribute("download")) {
    return;
  }

  const url = new URL(link.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return;
  }

  const view = getRoutedViewFromUrl(url);

  if (!view) {
    return;
  }

  event.preventDefault();
  setActiveView(view, { updateUrl: true });
});

window.addEventListener("popstate", () => {
  setActiveView(getViewFromLocation());
});

window.addEventListener("hashchange", () => {
  setActiveView(getViewFromLocation());
});

start.addEventListener("wheel", (event) => {
  nudgeScrollBounce(event.deltaY);
}, { passive: true });

start.addEventListener("touchstart", (event) => {
  touchStartY = event.touches[0]?.clientY ?? null;
}, { passive: true });

start.addEventListener("touchmove", (event) => {
  if (touchStartY === null) {
    return;
  }

  const currentY = event.touches[0]?.clientY ?? touchStartY;
  nudgeScrollBounce(touchStartY - currentY);
  touchStartY = currentY;
}, { passive: true });

start.addEventListener("touchend", () => {
  touchStartY = null;
});

start.addEventListener("touchcancel", () => {
  touchStartY = null;
});

stackCards.forEach((card) => {
  function toggleStackCard(event) {
    if (card.dataset.card === "photo") {
      return;
    }

    if (card.dataset.card === cardField.dataset.activeCard) {
      event.preventDefault();
      cardField.dataset.activeCard = card.dataset.card === "work" ? "notes" : "work";
      return;
    }

    event.preventDefault();
    cardField.dataset.activeCard = card.dataset.card;
  }

  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      return;
    }

    toggleStackCard(event);
  });

  card.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key) || event.target.closest("a")) {
      return;
    }

    toggleStackCard(event);
  });
});

draggableCards.forEach((card) => {
  const handle = card.matches(".polaroid-card")
    ? document.querySelector("[data-polaroid-handle]")
    : card;
  let drag = null;
  let didDrag = false;
  let releaseFrame = null;

  if (!handle) {
    return;
  }

  function setDragPosition(x, y) {
    card.dataset.x = String(x);
    card.dataset.y = String(y);
    card.style.setProperty("--drag-x", `${x}px`);
    card.style.setProperty("--drag-y", `${y}px`);

    if (handle !== card) {
      handle.style.setProperty("--drag-x", `${x}px`);
      handle.style.setProperty("--drag-y", `${y}px`);
    }
  }

  function animateRelease(velocityX, velocityY) {
    const startX = Number(card.dataset.x || 0);
    const startY = Number(card.dataset.y || 0);
    const distanceX = Math.max(-95, Math.min(95, velocityX * 150));
    const distanceY = Math.max(-95, Math.min(95, velocityY * 150));
    const duration = 520;
    const startedAt = performance.now();

    function settle(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 + 2.2 * Math.pow(progress - 1, 3) + 1.2 * Math.pow(progress - 1, 2);
      const wobble = Math.sin(progress * Math.PI * 2.4) * (1 - progress) * 10;

      setDragPosition(
        startX + distanceX * eased + wobble * Math.sign(distanceX || velocityX),
        startY + distanceY * eased + wobble * Math.sign(distanceY || velocityY),
      );

      if (progress < 1) {
        releaseFrame = requestAnimationFrame(settle);
      } else {
        releaseFrame = null;
      }
    }

    releaseFrame = requestAnimationFrame(settle);
  }

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (releaseFrame) {
      cancelAnimationFrame(releaseFrame);
      releaseFrame = null;
    }

    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: Number(card.dataset.x || 0),
      y: Number(card.dataset.y || 0),
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocityX: 0,
      velocityY: 0,
    };
    didDrag = false;

    card.classList.add("is-dragging");
    handle.classList.add("is-dragging");
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointerenter", () => {
    handle.classList.add("is-hovered");
  });

  handle.addEventListener("pointerleave", () => {
    handle.classList.remove("is-hovered");
  });

  handle.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    event.stopPropagation();

    const x = drag.x + event.clientX - drag.startX;
    const y = drag.y + event.clientY - drag.startY;
    const now = performance.now();
    const elapsed = Math.max(now - drag.lastTime, 16);

    drag.velocityX = (event.clientX - drag.lastX) / elapsed;
    drag.velocityY = (event.clientY - drag.lastY) / elapsed;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
    didDrag = Math.abs(x - drag.x) > 3 || Math.abs(y - drag.y) > 3;

    if (Math.abs(x) > 8 || Math.abs(y) > 8) {
      card.classList.add("is-pulled");
      handle.classList.add("is-pulled");
    }

    setDragPosition(x, y);
  });

  function stopDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    event.stopPropagation();

    card.classList.remove("is-dragging");
    handle.classList.remove("is-dragging");
    animateRelease(drag.velocityX, drag.velocityY);
    drag = null;
  }

  handle.addEventListener("pointerup", stopDrag);
  handle.addEventListener("pointercancel", stopDrag);
  handle.addEventListener("click", (event) => {
    event.stopPropagation();

    if (didDrag) {
      event.preventDefault();
    }
  });
});

aboutStickerLinks.forEach((link) => {
  ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend", "click"].forEach((eventName) => {
    link.addEventListener(eventName, (event) => {
      event.stopPropagation();
    }, { capture: true });
  });
});

projectCards.forEach((card) => {
  if (card.classList.contains("project-card--empty")) {
    return;
  }

  card.setAttribute("role", "button");
  card.setAttribute("aria-pressed", "false");

  function eventStartedOnLink(event) {
    const path = event.composedPath?.() || [];

    return path.some((target) => target instanceof HTMLAnchorElement)
      || path.some((target) => target instanceof Element && target.matches("[data-draggable-card]"))
      || event.target.closest?.("a, [data-draggable-card]");
  }

  card.querySelectorAll("a").forEach((link) => {
    ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend", "click"].forEach((eventName) => {
      link.addEventListener(eventName, (event) => {
        event.stopPropagation();
      }, { capture: true });
    });
  });

  function toggleCard() {
    const isFlipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(isFlipped));
  }

  card.addEventListener("click", (event) => {
    if (eventStartedOnLink(event)) {
      event.stopPropagation();
      return;
    }

    toggleCard();
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    toggleCard();
  });
});

cardField.dataset.activeCard = "work";
setTimezoneLabel();
setActiveView(getViewFromLocation(), { animate: false });
setRandomHeroLine();
