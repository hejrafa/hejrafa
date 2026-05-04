const publicRoutes = [
  { href: "/", title: "home" },
  { href: "/curiosities/", title: "curiosities" },
  { href: "/inventory/", title: "inventory" },
  { href: "/about/", title: "about" },
  { href: "/cv/", title: "cv" }
];

const hiddenRoutes = ["/expenses/", "/debt/", "/health/"];
const route = normalizePath(window.location.pathname);
const app = document.querySelector("#app");
const pages = {
  "/": homePage,
  "/curiosities/": curiositiesPage,
  "/inventory/": inventoryPage,
  "/about/": aboutPage,
  "/cv/": cvPage,
  "/expenses/": expensesPage,
  "/debt/": debtPage,
  "/health/": healthPage
};

render(pages[route] ? pages[route]() : notFoundPage());

function normalizePath(path) {
  if (!path || path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

function render(page) {
  document.title = page.title === "hejrafa" ? "hejrafa" : `${page.title} | hejrafa`;
  document.body.dataset.route = hiddenRoutes.includes(route) ? "hidden" : route.replaceAll("/", "") || "home";
  app.innerHTML = `
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="site-header">
      <a class="brand" href="/" aria-label="hejrafa home">hejrafa</a>
      <nav aria-label="main navigation">${publicRoutes.map(navLink).join("")}</nav>
    </header>
    <main id="content">${page.html}</main>
    <footer class="site-footer">
      <section>
        <p class="label">publisher</p>
        <p>rafael polutta</p>
      </section>
      <section>
        <p class="label">legal notice</p>
        <p>responsible for content<br>rafael polutta<br>singapurstr. 4<br>20457 hamburg</p>
      </section>
      <section>
        <p class="label">contact</p>
        <p><a href="mailto:contact@hejrafa.com">contact@hejrafa.com</a></p>
      </section>
    </footer>
  `;
}

function navLink(item) {
  const active = normalizePath(item.href) === route ? " aria-current=\"page\"" : "";
  return `<a href="${item.href}"${active}>${item.title}</a>`;
}

function homePage() {
  const shelves = [
    ["/about/", "about", "capturing what I can't see", "An essay about aphantasia, memory, documenting life, and why making things keeps me moving."],
    ["/curiosities/", "curiosities", "things that shape my taste", "Podcasts, people, designers, videos, questions, and rabbit holes worth keeping close."],
    ["/inventory/", "inventory", "objects that earn their place", "The tools, devices, notebooks, clothes, and small things I actually use."],
    ["/cv/", "cv", "the professional receipt", "Product design, systems, brand, mobility, SaaS, freelance work, and a few acclaims."]
  ];

  return {
    title: "hejrafa",
    html: `
      <section class="home-intro">
        <div class="intro-copy">
          <p class="label">personal index</p>
          <h1>I'm Rafa, a designer in Hamburg.</h1>
          <p class="lede">I design interfaces, build systems, collect useful objects, document things because memory is strange, and keep this site as a small personal archive.</p>
        </div>
        <aside class="intro-card">
          <p><strong>currently</strong> UI design lead at Phrase</p>
          <p><strong>usually</strong> making, watching, reading, refining</p>
          <p><strong>trying</strong> to tell stories that inspire</p>
        </aside>
      </section>
      <section class="shelf">
        <header>
          <p class="label">shelves</p>
          <h2>Start anywhere.</h2>
        </header>
        <div class="shelf-grid">${shelves.map(shelfCard).join("")}</div>
      </section>
      <section class="note-strip">
        <p>This site is intentionally not only a portfolio. It is a cabinet for work, taste, objects, memories, notes, and the odd private page I may or may not show you.</p>
      </section>
    `
  };
}

function curiositiesPage() {
  const blocks = [
    ["podcasts", ["What Now? by Trevor Noah", "Conan O'Brien Needs a Friend", "This American Life by Ira Glass", "Let's Make Mistakes by Mike Monteiro and Jessie Char", "Radiolab", "Hasan Minhaj Doesn't Know", "Love Factually"]],
    ["youtube", ["Peter McKinnon", "Marques Brownlee", "Andreas Hem", "Life of Riza", "Makari Espe", "Colt Kirwan", "James Hoffmann", "Simone Giertz", "Cleo Abram", "Van Neistat", "Gawx Art", "Moto Feelz", "Niklas Christl", "Casey Neistat", "Scott Yu-Jan"]],
    ["internet people", ["Josh Lujan aka Xaryu", "Kristina Rybalchenko aka kriss_drummer", "Jason Smith aka Pikabooirl", "Annie Fuchsia", "Caroline Forer aka Naguura", "Sweet Anita", "Elliott Venczel aka Venruki", "junicats", "Farbenfuchs"]],
    ["designers & makers", ["Tobias van Schneider", "Marcel Wichmann", "Frank Chimero", "Sebastiaan de With", "Christian Selig", "Paul Stamatiou", "Kristina Bonitz", "Oliur Rahman", "Vijay Verma", "Carl Barenbrug", "Austin Kleon", "Mike Monteiro"]],
    ["people", ["Hayao Miyazaki", "Steve Jobs", "Jony Ive", "Emma Watson", "Arnold Schwarzenegger", "Shi Heng Yi", "Trevor Noah", "Jim Carrey", "Barack Obama", "Dieter Rams", "Tina Fey", "Massimo Vignelli", "Katie Dill", "Taylor Tomlinson", "Yohji Yamamoto", "Conan O'Brien", "Hideo Kojima", "Greta Gerwig", "David Fincher", "Hiro Murai", "Donald Glover", "Phoebe Waller-Bridge"]]
  ];

  return {
    title: "curiosities",
    html: `
      ${pageHeader("curiosities", "Taste is an archive of attention.", "A shelf for inspirations, recurring inputs, people I return to, and things that quietly shape how I look at work and life.")}
      <section class="stacked-list">${blocks.map(listBlock).join("")}</section>
    `
  };
}

function inventoryPage() {
  const groups = [
    ["writing", [["notebook", "field notes", "14,90 EUR"], ["pen", "mark one", "108,95 EUR"], ["journal", "leuchtturm", "22,50 EUR"], ["notes", "yellow legal pad", "2,90 EUR"]]],
    ["devices", [["phone", "iphone 13 mini", "289,00 EUR"], ["workstation", "mac mini", "699,00 EUR"], ["tablet", "ipad mini", "599,00 EUR"], ["music", "ipod classic", "priceless"]]],
    ["wear", [["bag", "everyday sling", "169,99 EUR"], ["shoes", "low top canvas", "169,00 EUR"], ["pants", "baggy trouser", "80,00 EUR"], ["shirt", "oversized crew neck", "19,90 EUR"], ["shirt", "standing collar", "49,90 EUR"], ["bracelet", "matte onyx", "32,00 EUR"]]],
    ["other", [["wallpaper", "retro vhs pack", "free"], ["book", "any", "priceless"]]]
  ];

  return {
    title: "inventory",
    html: `
      ${pageHeader("inventory", "Things that earn their place.", "The quintessence of the tools I use every day. Each one stays because it just works.")}
      <section class="inventory-groups">${groups.map(inventoryGroup).join("")}</section>
    `
  };
}

function aboutPage() {
  return {
    title: "about",
    html: `
      <article class="essay">
        <header class="essay-hero">
          <div>
            <p class="label">about / memory / making</p>
            <h1>Capturing what I can't see</h1>
            <p class="lede">My name is Rafael Polutta, and my goal is to tell stories that inspire. This is why.</p>
          </div>
          <img src="/assets/images/notes.jpg" alt="Rafa going through his notes">
        </header>
        ${para("I never thought much about it, but living with no mental images (aphantasia) makes the past feel unimportant. I don't dwell on what was. Details fade quickly, and all that's left are broad strokes: growing up in a small village, helping my parents renovate the house, school days, bike rides through the forest. Moving to the city, studying art direction and design simply because I was always in front of a computer. Mesmerised by moving graphics in video games and the internet.")}
        ${para("Learning the rules in order to break them. Finding a calling in user experiences and interfaces - without realising it, telling stories through buttons and typefaces.")}
        ${para("Those broad strokes shaped my eye for detail and taste. I consume media and can only recall the big picture. I love rewatching movies and shows, seeing the story unfold again almost as if for the first time. This makes the present so important to me. The only way to relive a past moment visually is through photography and video.")}
        <figure><img src="/assets/images/switzerland.jpg" alt="Rafa somewhere in Switzerland"><figcaption>(me somewhere in Switzerland)</figcaption></figure>
        ${para("It wasn't because of that, but somehow I began documenting certain aspects of my life - trying to make them cinematic. This became my only way to look back. The older I get, the more important it becomes to have these memories in physical form. I enjoy picking up a vinyl, knowing a friend gifted it to me because she thought I'd like it. Holding it reminds me of her. Even writing my to-dos in a physical notebook and crossing them off just feels real.")}
        ${para("I'm working on finding balance in every aspect of life - enjoying the moment now, while being able to look back at a life well lived. The act of creating is what drives me. I don't idle well. Having nothing to do might sound wonderful, but without a project I grow restless.")}
        <blockquote>Everything around you that you call life was made up by people who were no smarter than you.<cite>Steve Jobs</cite></blockquote>
        <figure class="portrait"><img src="/assets/images/portrait.jpg" alt="Rafa posing"><figcaption>(me totally not posing)</figcaption></figure>
        ${para("I always want to be learning and improving myself: travel, read, play, write, watch, ask, be curious, and share my perspective. And above all, tell stories that inspire.")}
        <section class="beliefs">
          <h2>Things I believe</h2>
          <ol>${["touch grass.", "move your body first thing in the morning.", "do one thing at a time.", "let cleaning and cooking become meditation.", "read something every day.", "don't ever put your happiness in someone else's hands.", "your normal day is someone's dream - be thankful.", "treat everyone with respect.", "time you enjoy wasting isn't wasted.", "just go for it.", "be private. vibe alone. grow in silence.", "every second counts."].map((item) => `<li>${item}</li>`).join("")}</ol>
        </section>
      </article>
    `
  };
}

function cvPage() {
  const jobs = [
    ["2020 - now", "UI design lead at Phrase", "When I joined, design wasn't even on the radar. Hired the team, created the design system, and shaped the visual identity of both the product and the brand. Recognized as a leader in the Forrester Wave for Translation Management Systems."],
    ["2019 - 2020", "senior product designer at Share Now", "car2go and DriveNow - Daimler's and BMW's respective car-sharing bets - merged into one company and one product. I navigated that chaos: redesigned the apps under the new unified brand."],
    ["2016 - 2019", "product designer at car2go", "Main designer on the app that Time Magazine named App of the Year in 2017. I'll let that one speak for itself."],
    ["2015 - 2016", "intern product designer at mytaxi", "Got my hands dirty early. Design concepts I worked on found their way into the core of the company's mobility platform."],
    ["2012 - now", "freelance designer", "Ten years of client work running in parallel with everything above. Fintech, hospitality, SaaS, e-commerce - if it needed a UI or a brand, I've probably done a version of it."]
  ];

  return {
    title: "cv",
    html: `
      <section class="cv-layout">
        <aside>
          <img src="/assets/images/portrait.jpg" alt="Rafael Polutta">
          <h1>Rafael Polutta</h1>
          <p>UI design lead at Phrase</p>
          <a href="mailto:contact@hejrafa.com">contact@hejrafa.com</a>
        </aside>
        <div class="cv-main">
          <section>
            <p class="label">about</p>
            ${para("I have aphantasia. I cannot visualize anything in my mind's eye. For a designer, that sounds like a handicap. But since I never knew there was another way, I learned to approach problems differently than most. No preconceived image to anchor to. No default aesthetic to fall back on. Just first principles, every time. It became my superpower.")}
          </section>
          <section>
            <p class="label">work experience</p>
            ${jobs.map(timelineItem).join("")}
          </section>
          <section class="small-grid">
            <p class="label">acclaims</p>
            ${smallItem("2025", "Leader in The Forrester Wave", "Phrase")}
            ${smallItem("2019", "Car Sharing and UX", "Share Now")}
            ${smallItem("2017", "Time App of the Year", "car2go")}
          </section>
          <section>
            <p class="label">education / skills</p>
            ${para("Bachelor's in communications design & art direction with distinction. UI/UX, design systems, brand identity, Figma, video, product photography, websites, addons, MVPs, podcasting, and AI as a tool - not a crutch.")}
          </section>
        </div>
      </section>
    `
  };
}

function expensesPage() {
  return hiddenLog("monthly expenses", "To me, being rich just means having more than I need. Not stressing about money is freedom.", [
    ["household", "rent, groceries, electricity, internet, bunq, mobile provider, yearly expenses"],
    ["insurance", "private healthcare"],
    ["debt", "swk, ing"],
    ["savings", "rainy day, vacation, etf"],
    ["leisure", "guilt free spending, eating out, urban sport, youtube premium, apple music, icloud"]
  ]);
}

function debtPage() {
  return hiddenLog("debt", "This isn't just a balance - it's a countdown. Every euro gone is one step closer to breathing easy.", [
    ["swk", "3,29%"],
    ["ing", "5,73%"],
    ["schufa", "credit score / acceptable / 96,13%"]
  ]);
}

function healthPage() {
  return hiddenLog("biomarker (07.01.25)", "A body log for noticing patterns without turning the body into a product.", [
    ["basics", "chronological age 35, pace of aging 0.7, weight 66 kg, body fat 6.2%, body water 45.6 l, skeletal muscle mass 35.3 kg"],
    ["complete blood count", "hemoglobin 14.5, hematocrit 45.2, rbc 4.69, wbc 4.0, plt 236"],
    ["metabolic panel", "creatinine 2.30 over, urea 6.4, gpt 28, got 27, bilirubin 1.25 over"],
    ["lipid panel", "ldl 140 over, hdl 41 over, triglycerides 91.2"],
    ["iron & energy", "ferritin 28.0 under, serum iron < 1.0 mg/l, vitamin d 58, vitamin b12 834"]
  ]);
}

function notFoundPage() {
  return {
    title: "not found",
    html: `${pageHeader("404", "This shelf is empty.", "Either the page moved, or it has not been made yet.")}`
  };
}

function pageHeader(kicker, title, text) {
  return `
    <header class="page-header">
      <p class="label">${kicker}</p>
      <h1>${title}</h1>
      <p class="lede">${text}</p>
    </header>
  `;
}

function shelfCard([href, label, title, text]) {
  return `<a class="shelf-card" href="${href}"><span>${label}</span><strong>${title}</strong><p>${text}</p></a>`;
}

function listBlock([title, items]) {
  return `<article class="list-block"><h2>${title}</h2><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></article>`;
}

function inventoryGroup([title, items]) {
  return `<article class="inventory-group"><h2>${title}</h2><div>${items.map(([type, name, price]) => `<section><span>${type}</span><strong>${name}</strong><small>${price}</small></section>`).join("")}</div></article>`;
}

function para(text) {
  return `<p class="prose">${text}</p>`;
}

function timelineItem([year, title, text]) {
  return `<article class="timeline"><time>${year}</time><div><h2>${title}</h2><p>${text}</p></div></article>`;
}

function smallItem(year, title, text) {
  return `<article><time>${year}</time><strong>${title}</strong><span>${text}</span></article>`;
}

function hiddenLog(title, intro, rows) {
  return {
    title,
    html: `
      <section class="hidden-page">
        <p class="label">unlisted / direct url only</p>
        <h1>${title}</h1>
        <p class="lede">${intro}</p>
        <div class="log-grid">${rows.map(([label, text]) => `<article><h2>${label}</h2><p>${text}</p></article>`).join("")}</div>
      </section>
    `
  };
}
