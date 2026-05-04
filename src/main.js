const publicRoutes = [
  { href: "/", title: "home", label: "index" },
  { href: "/about/", title: "about", label: "me" },
  { href: "/cv/", title: "cv", label: "work" },
  { href: "/curiosities/", title: "curiosities", label: "inspirations" },
  { href: "/inventory/", title: "inventory", label: "goods" }
];

const hiddenRoutes = [
  { href: "/expenses/", title: "expenses", label: "money map" },
  { href: "/debt/", title: "debt", label: "countdown" },
  { href: "/health/", title: "health", label: "body log" }
];

const route = normalizePath(window.location.pathname);
const app = document.querySelector("#app");
const pages = {
  "/": homePage,
  "/about/": aboutPage,
  "/cv/": cvPage,
  "/curiosities/": curiositiesPage,
  "/inventory/": inventoryPage,
  "/expenses/": expensesPage,
  "/debt/": debtPage,
  "/health/": healthPage
};

renderShell(pages[route] ? pages[route]() : notFoundPage());

function normalizePath(path) {
  if (!path || path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

function renderShell(page) {
  document.title = page.title === "hejrafa" ? "hejrafa" : `${page.title} | hejrafa`;
  app.innerHTML = `
    <a class="skip-link" href="#content">skip to content</a>
    <header class="site-header">
      <a class="brand" href="/" aria-label="hejrafa home">
        <span class="brand-mark">h</span>
        <span>
          <strong>hejrafa</strong>
          <small>rafael polutta</small>
        </span>
      </a>
      <nav class="top-nav" aria-label="Primary navigation">
        ${publicRoutes.map(navLink).join("")}
      </nav>
    </header>
    <main id="content">${page.html}</main>
    <footer class="site-footer">
      <div>
        <p class="eyebrow">legal notice</p>
        <p>responsible for content<br><strong>rafael polutta</strong><br>singapurstr. 4<br>20457 hamburg</p>
      </div>
      <div>
        <p class="eyebrow">let's talk</p>
        <p>want to work together or grab a coffee?<br><a href="mailto:contact@hejrafa.com">contact@hejrafa.com</a></p>
      </div>
      <div>
        <p class="eyebrow">quiet doors</p>
        <div class="footer-links">${hiddenRoutes.map(navLink).join("")}</div>
      </div>
    </footer>
  `;

  requestAnimationFrame(() => document.body.classList.add("is-ready"));
}

function navLink(item) {
  const active = normalizePath(item.href) === route ? " aria-current=\"page\"" : "";
  return `<a href="${item.href}"${active}><span>${item.title}</span><small>${item.label}</small></a>`;
}

function homePage() {
  return {
    title: "hejrafa",
    html: `
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">publisher / designer / curious person</p>
          <h1>rafael polutta</h1>
          <p class="lede">for anyone who misses the time when websites were weird, honest, and built just for the joy of it.</p>
        </div>
        <figure class="hero-image">
          <img src="/assets/images/switzerland.jpg" alt="Rafa standing in Switzerland" />
          <figcaption>somewhere in switzerland</figcaption>
        </figure>
      </section>
      <section class="section contrast">
        <div class="section-heading">
          <p class="eyebrow">contents</p>
          <h2>the visible rooms</h2>
        </div>
        <div class="room-grid">
          ${card("/about/", "about", "capturing what I can't see", "a personal essay about aphantasia, memory, creating, and why the present matters.")}
          ${card("/cv/", "cv", "product design, systems, brand", "work experience, acclaims, education, and the practical shape of my design range.")}
          ${card("/curiosities/", "curiosities", "inputs, inspirations, questions", "a more honest place for links, rabbit holes, taste, and things worth saving.")}
          ${card("/inventory/", "inventory", "objects that earn their place", "tools, clothes, notes, devices, and physical things that quietly work.")}
        </div>
      </section>
      <section class="section split">
        <div>
          <p class="eyebrow">why this exists</p>
          <h2>a website can be a home, not a funnel.</h2>
        </div>
        <p>This version keeps the handmade feeling of the old Figma site, but gives it sturdier bones: readable pages, cleaner routes, smaller assets, and enough mystery for the unlinked logs to stay yours.</p>
      </section>
    `
  };
}

function aboutPage() {
  return {
    title: "about",
    html: `
      <article class="story">
        <header class="article-hero">
          <img src="/assets/images/notes.jpg" alt="Rafa going through his notes" />
          <div>
            <p class="eyebrow">about</p>
            <h1>capturing what I can't see</h1>
            <p class="lede">my name is rafael polutta, and my goal is to tell stories that inspire. this is why.</p>
          </div>
        </header>
        ${para("I never thought much about it, but living with no mental images makes the past feel unimportant. I don't dwell on what was. details fade quickly, and all that's left are broad strokes: growing up in a small village, helping my parents renovate the house, school days, bike rides through the forest. moving to the city, studying art direction and design simply because I was always in front of a computer.")}
        ${para("those broad strokes shaped my eye for detail and taste. I consume media and can only recall the big picture. I love rewatching movies and shows, seeing the story unfold again almost as if for the first time. this makes the present so important to me. the only way to relive a past moment visually is through photography and video.")}
        <figure class="wide-photo">
          <img src="/assets/images/switzerland.jpg" alt="Rafa somewhere in Switzerland" />
          <figcaption>(me somewhere in switzerland)</figcaption>
        </figure>
        ${para("the act of creating is what drives me. I don't idle well. having nothing to do might sound wonderful, but without a project I grow restless. I guess it works both ways: calming a restless mind, or focusing an empty one, by giving it something to work on.")}
        <blockquote>everything around you that you call life was made up by people who were no smarter than you.<cite>steve jobs</cite></blockquote>
        <figure class="portrait-row">
          <img src="/assets/images/portrait.jpg" alt="Rafa posing in a jacket" />
          <figcaption>(me totally not posing)</figcaption>
        </figure>
        ${para("I always want to be learning and improving myself: travel, read, play, write, watch, ask, be curious, and share my perspective. and above all, tell stories that inspire.")}
        <section class="beliefs">
          <h2>things I believe</h2>
          <ol>
            <li>touch grass.</li>
            <li>move your body first thing in the morning.</li>
            <li>do one thing at a time.</li>
            <li>let cleaning and cooking become meditation.</li>
            <li>read something every day.</li>
            <li>don't ever put your happiness in someone else's hands.</li>
            <li>your normal day is someone's dream. be thankful.</li>
            <li>treat everyone with respect.</li>
            <li>time you enjoy wasting isn't wasted.</li>
            <li>just go for it.</li>
            <li>be private. vibe alone. grow in silence.</li>
            <li>every second counts.</li>
          </ol>
        </section>
      </article>
    `
  };
}

function cvPage() {
  const jobs = [
    ["2020 - now", "UI design lead at Phrase", "joined when design was barely on the radar; hired the team, created the design system, and shaped the visual identity of product and brand."],
    ["2019 - 2020", "senior product designer at Share Now", "navigated the car2go and DriveNow merger and redesigned the apps under one unified brand."],
    ["2016 - 2019", "product designer at car2go", "main designer on the app that Time Magazine named App of the Year in 2017."],
    ["2015 - 2016", "intern product designer at mytaxi", "early hands-on product work that found its way into the company's mobility platform."],
    ["2012 - now", "freelance designer", "fintech, hospitality, SaaS, e-commerce, brand, websites, product photography, video, and small launched things."]
  ];
  return {
    title: "cv",
    html: `
      <section class="resume">
        <aside>
          <img src="/assets/images/portrait.jpg" alt="Rafael Polutta" />
          <h1>rafael polutta</h1>
          <p>UI design lead at Phrase</p>
          <a class="button-link" href="mailto:contact@hejrafa.com">contact</a>
        </aside>
        <div class="resume-body">
          <section>
            <p class="eyebrow">about</p>
            ${para("i have aphantasia. i cannot visualize anything in my mind's eye. for a designer, that sounds like a handicap. but since i never knew there was another way, i learned to approach problems differently: no preconceived image to anchor to, no default aesthetic to fall back on, just first principles every time.")}
          </section>
          <section>
            <p class="eyebrow">work experience</p>
            ${jobs.map(([year, title, body]) => timelineItem(year, title, body)).join("")}
          </section>
          <section class="acclaim-grid">
            <p class="eyebrow">acclaims</p>
            ${mini("2025", "Leader in the Forrester Wave", "Phrase")}
            ${mini("2019", "Car Sharing and UX", "Share Now")}
            ${mini("2017", "Time App of the Year", "car2go")}
          </section>
          <section>
            <p class="eyebrow">education</p>
            ${timelineItem("2012 - 2015", "bachelor's in communications design & art direction with distinction", "analog typography, illustration, photography, video, web, app, briefs, re-briefs, and a printed thesis that still sits on my shelf.")}
          </section>
        </div>
      </section>
    `
  };
}

function curiositiesPage() {
  const groups = [
    ["watching", "small documentaries, design breakdowns, old interfaces, game menus, repair videos, people explaining their craft."],
    ["reading", "media theory, personal finance, product writing, weird blogs, field notes, and anything that makes the ordinary feel strange again."],
    ["collecting", "quotes, screenshots, desktop wallpapers, VHS textures, packaging, tiny systems, objects with honest affordances."],
    ["asking", "what is the smallest useful version? what would this feel like as an object? what is everyone pretending not to notice?"]
  ];
  return {
    title: "curiosities",
    html: `
      <section class="page-intro orange">
        <p class="eyebrow">curiosities</p>
        <h1>inputs before outputs.</h1>
        <p class="lede">a place for inspirations, questions, references, and loose ends. less portfolio, more desk drawer.</p>
      </section>
      <section class="list-grid">
        ${groups.map(([title, body]) => `<article><h2>${title}</h2><p>${body}</p></article>`).join("")}
      </section>
      <section class="quote-band">
        <p>curiosity is not a mood. it is a maintenance practice.</p>
      </section>
    `
  };
}

function inventoryPage() {
  const items = [
    ["notebook", "field notes", "14,90 EUR"],
    ["pen", "mark one", "108,95 EUR"],
    ["journal", "leuchtturm", "22,50 EUR"],
    ["notes", "yellow legal pad", "2,90 EUR"],
    ["wallpaper", "retro vhs pack", "free"],
    ["phone", "iphone 13 mini", "289,00 EUR"],
    ["workstation", "mac mini", "699,00 EUR"],
    ["tablet", "ipad mini", "599,00 EUR"],
    ["music", "ipod classic", "priceless"],
    ["bag", "everyday sling", "169,99 EUR"],
    ["shoes", "low top canvas", "169,00 EUR"],
    ["book", "any", "priceless"]
  ];
  return {
    title: "inventory",
    html: `
      <section class="page-intro">
        <p class="eyebrow">inventory</p>
        <h1>things that earn their place.</h1>
        <p class="lede">the quintessence of tools I use every day. each one stays because it just works.</p>
      </section>
      <section class="inventory-grid">
        ${items.map(([type, name, price]) => `<article><span>${type}</span><strong>${name}</strong><small>${price}</small></article>`).join("")}
      </section>
    `
  };
}

function expensesPage() {
  const groups = [
    ["household", ["rent", "groceries", "electricity", "internet", "bunq", "mobile provider", "yearly expenses"]],
    ["insurance", ["private healthcare"]],
    ["debt", ["swk", "ing"]],
    ["savings", ["rainy day", "vacation", "etf"]],
    ["leisure", ["guilt free spending", "eating out", "urban sport", "youtube premium", "apple music", "icloud"]]
  ];
  return logPage("monthly expenses", "to me, being rich just means having more than I need. not stressing about money is the point.", groups);
}

function debtPage() {
  return {
    title: "debt",
    html: `
      <section class="page-intro red">
        <p class="eyebrow">debt</p>
        <h1>a countdown, not a balance.</h1>
        <p class="lede">every euro gone is one step closer to breathing easy.</p>
      </section>
      <section class="metric-grid">
        ${metric("swk", "3,29%", "debt")}
        ${metric("ing", "5,73%", "debt")}
        ${metric("credit score", "96,13%", "schufa / acceptable")}
      </section>
      <blockquote>if you want to pay your debt off, you have to take responsibility.<cite>ramit sethi</cite></blockquote>
    `
  };
}

function healthPage() {
  const rows = [
    ["chronological age", "35", "basics"],
    ["pace of aging", "0.7", "basics"],
    ["weight", "66 kg", "basics"],
    ["body fat", "6.2%", "basics"],
    ["hemoglobin", "14.5", "optimal"],
    ["creatinine", "2.30", "over"],
    ["bilirubin", "1.25", "over"],
    ["ldl", "140", "over"],
    ["ferritin", "28.0", "under"],
    ["vitamin d", "58", "optimal"],
    ["vitamin b12", "834", "optimal"]
  ];
  return {
    title: "health",
    html: `
      <section class="page-intro green">
        <p class="eyebrow">biomarker (07.01.25)</p>
        <h1>body log.</h1>
        <p class="lede">a small dashboard for noticing patterns without turning the body into a product.</p>
      </section>
      <section class="data-table" aria-label="Health biomarkers">
        <div class="table-row table-head"><span>marker</span><span>result</span><span>status</span></div>
        ${rows.map(([marker, result, status]) => `<div class="table-row"><span>${marker}</span><strong>${result}</strong><em>${status}</em></div>`).join("")}
      </section>
    `
  };
}

function notFoundPage() {
  return {
    title: "not found",
    html: `
      <section class="page-intro">
        <p class="eyebrow">404</p>
        <h1>this room is not here yet.</h1>
        <p class="lede"><a href="/">go back to the index</a></p>
      </section>
    `
  };
}

function logPage(title, intro, groups) {
  return {
    title,
    html: `
      <section class="page-intro blue">
        <p class="eyebrow">private log</p>
        <h1>${title}</h1>
        <p class="lede">${intro}</p>
      </section>
      <section class="ledger">
        ${groups.map(([group, items]) => `<article><h2>${group}</h2>${items.map((item) => `<p>${item}</p>`).join("")}</article>`).join("")}
      </section>
    `
  };
}

function card(href, title, kicker, body) {
  return `<a class="room-card" href="${href}"><span>${title}</span><h3>${kicker}</h3><p>${body}</p></a>`;
}

function para(text) {
  return `<p class="prose">${text}</p>`;
}

function timelineItem(year, title, body) {
  return `<article class="timeline-item"><time>${year}</time><div><h2>${title}</h2><p>${body}</p></div></article>`;
}

function mini(year, title, body) {
  return `<article class="mini"><time>${year}</time><strong>${title}</strong><span>${body}</span></article>`;
}

function metric(title, value, label) {
  return `<article><span>${label}</span><strong>${value}</strong><p>${title}</p></article>`;
}
