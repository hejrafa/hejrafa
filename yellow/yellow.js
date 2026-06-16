const body = document.body;
const dock = document.querySelector(".yellow-dock");
const dockItems = document.querySelectorAll("[data-yellow-nav]");
const panels = document.querySelectorAll("[data-yellow-page]");
const passwordInput = document.querySelector("[data-yellow-password]");
const gateForm = document.querySelector("[data-yellow-gate]");
const viewTransitionDuration = 460;
const validViews = new Set(["health", "finance", "finance-yearly", "finance-debt", "letter"]);
const routePaths = new Map([
  ["/yellow", "health"],
  ["/yellow/index.html", "health"],
  ["/yellow/health", "health"],
  ["/yellow/health/index.html", "health"],
  ["/yellow/finance", "finance"],
  ["/yellow/finance/index.html", "finance"],
  ["/yellow/finance-yearly", "finance-yearly"],
  ["/yellow/finance-yearly/index.html", "finance-yearly"],
  ["/yellow/finance-debt", "finance-debt"],
  ["/yellow/finance-debt/index.html", "finance-debt"],
  ["/yellow/letter", "letter"],
  ["/yellow/letter/index.html", "letter"],
]);
const unlockStorageKey = "hejrafa-yellow-unlocked";
const letterStorageKey = "hejrafa-yellow-letter-v2";
const html2PdfUrl = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
let html2PdfLoader = null;
const letterDrafts = [
  {
    greeting: "Dear future favorite person,",
    "paragraph-1": "I hope this letter finds you well, hydrated, and only mildly surrounded by tabs you swear you still need. I am writing to share a thought, make a request, or simply put something important on a page before my brain turns it into seventeen separate notes.",
    "paragraph-2": "The short version is this: there is an idea here, and it deserves a little room to breathe. The slightly longer version has nuance, context, and at least one sentence that makes me sound more organized than I felt while writing it.",
    "paragraph-3": "I care about clarity, good timing, and the rare miracle of everyone knowing what happens next. If this page can help move things from vague cloud shape to actual next step, then frankly, it has already earned its keep.",
    portfolio: "Optional useful detail goes here: a link, a date, a number, or the tiny but crucial thing nobody should miss.",
    salary: "Another note can live here, provided it behaves itself and does not become a spreadsheet in disguise.",
    closing: "Thank you for reading. I am looking forward to the next step, ideally one involving fewer open loops and maybe a decent coffee.",
    signoff: "Warmly",
  },
  {
    greeting: "Hello from the page with margins,",
    "paragraph-1": "This is a small note with decent posture and no ambition to become a slide deck. I wanted to put the important bit somewhere quiet, where it can sit still long enough for both of us to look at it.",
    "paragraph-2": "The point is simple: something deserves attention, a decision, or at least a friendly nudge out of the swamp of later. I have tried to keep it concise, which is brave considering my natural habitat is the thoughtful tangent.",
    "paragraph-3": "If this lands well, wonderful. If it needs a tweak, also wonderful. Progress is often just a fancy word for moving the furniture until nobody walks into it anymore.",
    portfolio: "Useful detail: add a date, link, number, address, or tiny clue that makes the whole thing easier to act on.",
    salary: "Optional note: this line is available for context, constraints, or one suspiciously practical sentence.",
    closing: "Thanks for reading this without making it a meeting first. That already feels like civilization.",
    signoff: "Best",
  },
  {
    greeting: "Dear person with excellent timing,",
    "paragraph-1": "I am writing because some thoughts are better behaved on paper. Left unattended, this one would probably start rearranging my brain furniture at 11:47 p.m., and nobody needs that.",
    "paragraph-2": "Here is the shape of it: there is a thing worth doing, saying, changing, asking, or finally admitting is not going to magically organize itself. I am in favor of giving it a real next step.",
    "paragraph-3": "I like when things are clear, useful, and just dramatic enough to stay interesting. This letter is attempting all three while wearing sensible shoes.",
    portfolio: "Small but important detail: place the practical bit here before it escapes.",
    salary: "Second optional detail: add whatever makes this easier to understand, approve, schedule, or remember.",
    closing: "Thank you for giving this a proper read. I appreciate attention in a world determined to turn everything into a notification.",
    signoff: "Cheers",
  },
  {
    greeting: "Hi there,",
    "paragraph-1": "Consider this a neatly dressed carrier pigeon, except without the pigeon and with better typography. I am sending it because the message deserves more ceremony than a chat bubble, but less ceremony than a committee.",
    "paragraph-2": "What matters is fairly straightforward: there is a direction, a question, or a little decision waiting to become real. I have put it here so it can stop floating around like a browser tab with emotional leverage.",
    "paragraph-3": "If the next move is obvious, fantastic. If it is not, we can make it obvious with a little patience, a little taste, and maybe one brutally honest sentence.",
    portfolio: "Relevant detail: add the link, deadline, amount, name, or tiny logistical gem here.",
    salary: "Optional context: this space exists for the thing that would otherwise be remembered five minutes too late.",
    closing: "Thanks for reading. May the next step be clear and the calendar invite mercifully short.",
    signoff: "Kindly",
  },
  {
    greeting: "Dear sensible human,",
    "paragraph-1": "I am putting this in letter form because it makes the idea look like it pays rent. There is something pleasantly official about a white page, even when the message is mostly: let us make this easier.",
    "paragraph-2": "The practical version is this: we have enough information to move, or enough uncertainty to ask a better question. Either way, the next step does not need to be heroic. It just needs to exist.",
    "paragraph-3": "I am a big believer in clear edges, useful defaults, and removing the little frictions that make everyone silently tired. This letter is, hopefully, one small act in that direction.",
    portfolio: "Helpful detail: this is where the specific thing goes, ideally before anyone has to hunt for it.",
    salary: "Optional note: constraints, preferences, and tiny caveats may live here peacefully.",
    closing: "Thank you for reading and for not turning this into a twelve-tab investigation unless absolutely necessary.",
    signoff: "All the best",
  },
  {
    greeting: "Dear keeper of the time circuits,",
    "paragraph-1": "I am writing from a very specific point in the timeline: after the idea became obvious, but before anyone accidentally made it complicated. The dashboard is blinking, the coffee is questionable, and the next step is asking for a little courage.",
    "paragraph-2": "We may not need roads, but we do need a destination. Ideally one with fewer paradoxes, a working plan, and no dramatic sprint toward a clock tower unless absolutely necessary.",
    "paragraph-3": "So here is the pitch: let us set the coordinates, hit the right speed, and give this thing enough energy to become real. If a little lightning shows up, great. If not, we can probably use a calendar invite.",
    portfolio: "Timeline detail: add the date, link, number, or tiny piece of future-saving information here.",
    salary: "Optional note: constraints, caveats, and suspiciously important side quests may live here.",
    closing: "Thanks for reading. May the next version of this moment be the one where everything clicks.",
    signoff: "See you in the future",
  },
];

function normalizePathname(pathname) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function getPathForView(view) {
  if (view === "health") {
    return "/yellow/health/";
  }

  return `/yellow/${view}/`;
}

function getRoutedViewFromUrl(url) {
  const hashView = url.hash.replace("#", "");

  if (validViews.has(hashView)) {
    return hashView;
  }

  return routePaths.get(normalizePathname(url.pathname)) ?? null;
}

function getViewFromUrl(url) {
  return getRoutedViewFromUrl(url) ?? "health";
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
  const normalizedPath = normalizePathname(url.pathname);

  if ((validViews.has(hashView) && hashView) || routePaths.get(normalizedPath) !== view) {
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

    if (!view || body.classList.contains("is-locked")) {
      return;
    }

    event.preventDefault();
    setActiveView(view, { updateUrl: true });
  });

  window.addEventListener("popstate", () => {
    if (body.classList.contains("is-locked")) {
      setActiveView("health", { animate: false });
      return;
    }

    setActiveView(getViewFromLocation());
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

function getLetterFields() {
  return [...document.querySelectorAll("[data-letter-field]")];
}

function isCollapsibleLetterField(field) {
  return field.matches(".letter-body p[data-letter-field]");
}

function updateLetterFieldState(field) {
  field.classList.toggle("is-empty", isCollapsibleLetterField(field) && field.textContent.trim() === "");
}

function applyRandomLetterDraft() {
  const draft = letterDrafts[Math.floor(Math.random() * letterDrafts.length)];

  getLetterFields().forEach((field) => {
    const key = field.dataset.letterField;

    if (typeof draft[key] === "string") {
      field.textContent = draft[key];
    }

    updateLetterFieldState(field);
  });
}

function readLetterState() {
  try {
    const value = localStorage.getItem(letterStorageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveLetterState() {
  const fields = getLetterFields();

  if (!fields.length) {
    return;
  }

  const state = fields.reduce((nextState, field) => {
    updateLetterFieldState(field);
    nextState[field.dataset.letterField] = field.textContent;
    return nextState;
  }, {});

  try {
    localStorage.setItem(letterStorageKey, JSON.stringify(state));
  } catch {
    // Editing still works if storage is unavailable.
  }
}

function restoreLetterState() {
  const state = readLetterState();

  if (!state) {
    return;
  }

  getLetterFields().forEach((field) => {
    const savedValue = state[field.dataset.letterField];

    if (typeof savedValue === "string") {
      field.textContent = savedValue;
    }

    updateLetterFieldState(field);
  });
}

function getCleanLetterClone() {
  const sheet = document.querySelector("[data-letter-sheet]");

  if (!sheet) {
    return null;
  }

  const clone = sheet.cloneNode(true);
  clone.removeAttribute("data-letter-sheet");
  clone.querySelectorAll("[contenteditable], [spellcheck], [data-letter-field]").forEach((field) => {
    field.removeAttribute("contenteditable");
    field.removeAttribute("spellcheck");
    field.removeAttribute("data-letter-field");
    field.removeAttribute("aria-label");
  });

  return clone;
}

function getVisibleStyles() {
  return [...document.styleSheets].map((sheet) => {
    try {
      return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
    } catch {
      return "";
    }
  }).join("\n");
}

function downloadBlob(contents, filename, type) {
  const blob = new Blob([contents], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(link.href);
  }, 1000);
}

function getLetterDocumentHtml(clone) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rafael Polutta Letter</title>
  <style>
${getVisibleStyles()}
@page {
  size: A4;
  margin: 0;
}
html,
body {
  width: 210mm;
  height: 295.5mm;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #fff;
}
.letter-sheet {
  width: 210mm;
  height: 295.5mm;
  min-height: 0;
  margin: 0;
  padding: 29% 9.4% 8%;
  box-sizing: border-box;
  break-after: avoid;
  page-break-after: avoid;
  box-shadow: none;
}
.letter-field,
.letter-field:hover,
.letter-field:focus {
  background: transparent;
  box-shadow: none;
}
  </style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`;
}

function downloadLetterHtml() {
  const clone = getCleanLetterClone();

  if (!clone) {
    return;
  }

  downloadBlob(getLetterDocumentHtml(clone), "rafael-polutta-letter.html", "text/html;charset=utf-8");
}

function loadHtml2Pdf() {
  if (window.html2pdf) {
    return Promise.resolve(window.html2pdf);
  }

  if (html2PdfLoader) {
    return html2PdfLoader;
  }

  html2PdfLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = html2PdfUrl;
    script.async = true;
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => reject(new Error("Unable to load PDF exporter."));
    document.head.append(script);
  });

  return html2PdfLoader;
}

async function downloadLetterPdf(button) {
  const clone = getCleanLetterClone();

  if (!clone) {
    return;
  }

  const previousLabel = button?.textContent;
  const exportRoot = document.createElement("div");
  exportRoot.className = "letter-export-root";
  exportRoot.append(clone);

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Saving";
  }

  document.body.append(exportRoot);

  try {
    await document.fonts?.ready;
    const html2pdf = await loadHtml2Pdf();
    await html2pdf().set({
      filename: "rafael-polutta-letter.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        format: "a4",
        orientation: "portrait",
        unit: "mm",
      },
      margin: 0,
    }).from(clone).save();
  } catch (error) {
    console.warn(error);
    downloadLetterHtml();
  } finally {
    exportRoot.remove();

    if (button) {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  }
}

function printLetter() {
  const clone = getCleanLetterClone();

  if (!clone) {
    return;
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const frame = document.createElement("iframe");
  frame.setAttribute("title", "Printable letter");
  frame.style.position = "fixed";
  frame.style.left = "-120vw";
  frame.style.top = "0";
  frame.style.width = "210mm";
  frame.style.height = "297mm";
  frame.style.border = "0";
  frame.style.opacity = "0";

  document.body.append(frame);

  const frameDocument = frame.contentDocument;

  if (!frameDocument) {
    frame.remove();
    window.print();
    return;
  }

  frameDocument.open();
  frameDocument.write(getLetterDocumentHtml(clone));
  frameDocument.close();

  window.setTimeout(async () => {
    try {
      await frame.contentDocument?.fonts?.ready;
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      window.setTimeout(() => {
        frame.remove();
      }, 1000);
    }
  }, 120);
}

function setupLetterEditor() {
  const fields = getLetterFields();

  if (!fields.length) {
    return;
  }

  applyRandomLetterDraft();

  fields.forEach((field) => {
    updateLetterFieldState(field);

    field.addEventListener("input", () => {
      updateLetterFieldState(field);
      saveLetterState();
    });

    field.addEventListener("blur", () => {
      updateLetterFieldState(field);
      saveLetterState();
    });
  });

  document.querySelectorAll("[data-letter-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.letterAction;

      if (action === "print") {
        printLetter();
        return;
      }

      if (action === "download") {
        downloadLetterPdf(button);
      }
    });
  });
}

setupNavigation();
setupFinanceTotals();
setupLetterEditor();
setupGate();
