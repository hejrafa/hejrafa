const body = document.body;
const dock = document.querySelector(".yellow-dock");
const dockItems = document.querySelectorAll("[data-yellow-nav]");
const panels = document.querySelectorAll("[data-yellow-page]");
const passwordInput = document.querySelector("[data-yellow-password]");
const gateForm = document.querySelector("[data-yellow-gate]");
const viewTransitionDuration = 460;
const validViews = new Set(["health", "finance", "finance-yearly", "finance-debt"]);
const unlockStorageKey = "hejrafa-yellow-unlocked";

function getViewFromLocation() {
  const hashView = window.location.hash.replace("#", "");
  return validViews.has(hashView) ? hashView : "health";
}

function updateRoute(view) {
  const url = new URL(window.location.href);
  url.hash = view;

  if (url.href !== window.location.href) {
    window.history.pushState({ view }, "", url);
  }
}

function getActivePanel() {
  return document.querySelector(".yellow-panel.is-active");
}

function setActiveView(view, { animate = true, updateUrl = false } = {}) {
  const nextView = validViews.has(view) ? view : "health";
  const dockView = nextView.startsWith("finance") ? "finance" : nextView;
  const previousPanel = getActivePanel();
  const shouldAnimateLeaving = animate && previousPanel && previousPanel.dataset.yellowPage !== nextView;

  if (updateUrl) {
    updateRoute(nextView);
  }

  body.dataset.view = nextView;
  dock.dataset.selected = dockView;
  window.scrollTo({ top: 0, behavior: "instant" });

  dockItems.forEach((item) => {
    const isSelected = item.dataset.yellowNav === dockView;
    item.classList.toggle("is-selected", isSelected);

    if (isSelected) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  panels.forEach((panel) => {
    const isSelected = panel.dataset.yellowPage === nextView;
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

function isUnlocked() {
  try {
    return sessionStorage.getItem(unlockStorageKey) === "true";
  } catch {
    return false;
  }
}

function rememberUnlock() {
  try {
    sessionStorage.setItem(unlockStorageKey, "true");
  } catch {
    // If storage is blocked, the page still unlocks for this load.
  }
}

function unlockYellow() {
  rememberUnlock();
  body.classList.remove("is-locked");
  body.classList.add("is-unlocked");

  if (passwordInput) {
    passwordInput.value = "";
    passwordInput.blur();
  }

  setActiveView(getViewFromLocation(), { animate: true });
}

function rejectPassword() {
  if (!gateForm || !passwordInput) {
    return;
  }

  gateForm.classList.remove("is-wrong");
  void gateForm.offsetWidth;
  gateForm.classList.add("is-wrong");
  passwordInput.value = "";
  passwordInput.focus();
}

function checkPassword() {
  const entered = passwordInput?.value.trim().toLowerCase();

  if (entered === "black") {
    unlockYellow();
    return true;
  }

  return false;
}

function setupGate() {
  if (isUnlocked()) {
    unlockYellow();
    return;
  }

  setActiveView("health", { animate: false });

  requestAnimationFrame(() => {
    passwordInput?.focus();
  });

  passwordInput?.addEventListener("input", () => {
    checkPassword();
  });

  gateForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!checkPassword()) {
      rejectPassword();
    }
  });
}

function setupNavigation() {
  dockItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (body.classList.contains("is-locked")) {
        return;
      }

      setActiveView(item.dataset.yellowNav, { updateUrl: true });
    });
  });

  window.addEventListener("hashchange", () => {
    if (body.classList.contains("is-locked")) {
      setActiveView("health", { animate: false });
      return;
    }

    setActiveView(getViewFromLocation());
  });
}

function parseFinanceAmount(text) {
  if (!text.includes("€")) {
    return null;
  }

  const match = text.replace(/\s/g, "").match(/-?\d[\d.]*,\d{2}€/);

  if (!match) {
    return null;
  }

  const value = Number(match[0].replace("€", "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

function formatFinanceAmount(cents) {
  const sign = cents < 0 ? "-" : "";
  const absoluteCents = Math.abs(cents);
  const euros = Math.floor(absoluteCents / 100).toLocaleString("de-DE");
  const remainder = String(absoluteCents % 100).padStart(2, "0");

  return `${sign}${euros},${remainder}€`;
}

function updateFinanceTotal(total, cents) {
  const amount = total.querySelector("strong");
  const formatted = formatFinanceAmount(cents);

  if (amount && amount.textContent.trim() !== formatted) {
    amount.textContent = formatted;
  }
}

function updateFinanceFlowTotals(flow) {
  let groupCents = 0;
  let pageTotalCents = 0;
  let latestTotalCents = 0;

  flow.querySelectorAll(":scope > .finance-row").forEach((row) => {
    const entryAmount = row.querySelector(".finance-entry .finance-entry-amount");
    const total = row.querySelector(".finance-total");

    if (entryAmount) {
      const cents = parseFinanceAmount(entryAmount.textContent);

      if (cents !== null) {
        groupCents += cents;
      }

      return;
    }

    if (!total) {
      return;
    }

    const label = total.querySelector(".finance-total-label")?.textContent.trim().toLowerCase() || "";
    let cents = groupCents;

    if (label === "total") {
      cents = pageTotalCents + groupCents;
      pageTotalCents = cents;
      latestTotalCents = cents;
      groupCents = 0;
    } else if (label.startsWith("divided by")) {
      cents = Math.round((latestTotalCents || pageTotalCents) / 12);
    } else {
      pageTotalCents += groupCents;
      latestTotalCents = pageTotalCents;
      groupCents = 0;
    }

    updateFinanceTotal(total, cents);
  });
}

function setupFinanceTotals() {
  const flows = [...document.querySelectorAll(".finance-flow")];

  function updateTotals() {
    flows.forEach(updateFinanceFlowTotals);
  }

  updateTotals();

  const observer = new MutationObserver(updateTotals);
  flows.forEach((flow) => observer.observe(flow, {
    childList: true,
    characterData: true,
    subtree: true,
  }));
}

setupNavigation();
setupFinanceTotals();
setupGate();
