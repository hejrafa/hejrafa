const heroLine = document.querySelector("#hero-line");
const start = document.querySelector(".start");
const cardField = document.querySelector(".card-field");
const dock = document.querySelector(".dock");
const dockItems = document.querySelectorAll("[data-nav-link]");
const viewPanels = document.querySelectorAll("[data-page]");
const stackCards = document.querySelectorAll(".card-field [data-card]");
const draggableCards = document.querySelectorAll("[data-draggable-card]");
const projectCards = document.querySelectorAll(".project-card");
let scrollBounceFrame = null;
let scrollBounce = 0;
let touchStartY = null;

const heroLines = [
  "Still collecting the good bits",
  "Make yourself nosy",
  "A small public shelf",
  "Things worth keeping nearby",
  "Not everything needs a menu",
  "Welcome to the soft launch",
  "Half portfolio, half pocket",
  "A homepage with loose pockets",
  "Carefully kept, casually placed",
  "A few doors, no hallway",
  "Useful things first",
  "Everything here is a handle",
];
const validViews = new Set(["home", "work", "about"]);

function setRandomHeroLine() {
  heroLine.textContent = heroLines[Math.floor(Math.random() * heroLines.length)];
}

function getViewFromLocation() {
  const hashView = window.location.hash.replace("#", "");

  return validViews.has(hashView) ? hashView : "home";
}

function updateRoute(view) {
  const url = new URL(window.location.href);
  url.hash = view === "home" ? "home" : view;

  if (url.href !== window.location.href) {
    window.history.pushState({ view }, "", url);
  }
}

function setActiveView(view, { updateUrl = false } = {}) {
  const nextView = validViews.has(view) ? view : "home";

  if (updateUrl) {
    updateRoute(nextView);
  }

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
    panel.classList.toggle("is-active", isSelected);
    panel.setAttribute("aria-hidden", String(!isSelected));
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
    setActiveView(item.dataset.navLink, { updateUrl: true });
  });
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
  card.addEventListener("click", (event) => {
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

    card.classList.remove("is-dragging");
    handle.classList.remove("is-dragging");
    animateRelease(drag.velocityX, drag.velocityY);
    drag = null;
  }

  handle.addEventListener("pointerup", stopDrag);
  handle.addEventListener("pointercancel", stopDrag);
  handle.addEventListener("click", (event) => {
    if (didDrag) {
      event.preventDefault();
    }
  });
});

projectCards.forEach((card) => {
  card.setAttribute("role", "button");
  card.setAttribute("aria-pressed", "false");

  function eventStartedOnLink(event) {
    const path = event.composedPath?.() || [];

    return path.some((target) => target instanceof HTMLAnchorElement)
      || event.target.closest?.("a");
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
setActiveView(getViewFromLocation());
setRandomHeroLine();
