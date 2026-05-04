const publicRoutes = [
  { href: "/", title: "home", tag: "index" },
  { href: "/curiosities/", title: "curiosities", tag: "inputs" },
  { href: "/inventory/", title: "inventory", tag: "goods" },
  { href: "/about/", title: "about", tag: "me" },
  { href: "/cv/", title: "cv", tag: "work" }
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
    <a class="skip-link" href="#content">skip</a>
    <header class="site-header">
      <a class="brand" href="/" aria-label="hejrafa home"><span>hej</span><strong>rafa</strong></a>
      <nav aria-label="main">${publicRoutes.map(navLink).join("")}</nav>
    </header>
    <main id="content">${page.html}</main>
    <footer class="site-footer">
      <div>
        <p class="kicker">publisher</p>
        <p>rafael polutta</p>
      </div>
      <div>
        <p class="kicker">typeface</p>
        <p>loud sans + soft serif</p>
      </div>
      <div>
        <p class="kicker">legal notice</p>
        <p>responsible for content<br>rafael polutta<br>singapurstr. 4<br>20457 hamburg</p>
      </div>
      <div>
        <p class="kicker">let's talk</p>
        <p><a href="mailto:contact@hejrafa.com">contact@hejrafa.com</a></p>
      </div>
    </footer>
  `;
}

function navLink(item) {
  const active = normalizePath(item.href) === route ? " aria-current=\"page\"" : "";
  return `<a href="${item.href}"${active}><span>${item.title}</span><small>${item.tag}</small></a>`;
}

function homePage() {
  return {
    title: "hejrafa",
    html: `
      <section class="poster-hero">
        <div class="poster-meta">
          <span>rafael polutta</span>
          <span>hamburg</span>
          <span>2026</span>
        </div>
        <h1><span>a personal</span><span>digital</span><span>playground</span></h1>
        <p class="scribble">websites should feel a little bit alive.</p>
        <div class="poster-grid">
          ${posterCard("/curiosities/", "01.", "curiosities", "inspirations, podcasts, youtube, people, rabbit holes.")}
          ${posterCard("/inventory/", "02.", "inventory", "tools that earn their place because they just work.")}
          ${posterCard("/about/", "03.", "about", "aphantasia, memory, making, documenting, taste.")}
          ${posterCard("/cv/", "04.", "cv", "work, systems, brand, product design, receipts.")}
        </div>
      </section>
      <section class="manifesto">
        <h2>not a portfolio. not a funnel. not a beige little professional rectangle.</h2>
        <p>this is a place to keep taste, work, notes, objects, contradictions, and whatever else refuses to fit cleanly into a linkedin-shaped box.</p>
      </section>
    `
  };
}

function curiositiesPage() {
  const blocks = [
    ["podcasts", ["What Now? by Trevor Noah", "Conan O'Brien Needs a Friend", "This American Life by Ira Glass", "Let's Make Mistakes by Mike Monteiro and Jessie Char", "Radiolab", "Hasan Minhaj Doesn't Know", "Love Factually"]],
    ["youtube", ["Peter McKinnon", "Marques Brownlee", "Andreas Hem", "Life of Riza", "Makari Espe", "Colt Kirwan", "James Hoffmann", "Simone Giertz", "Cleo Abram", "Van Neistat", "Gawx Art", "Moto Feelz", "Niklas Christl", "Casey Neistat", "Scott Yu-Jan"]],
    ["twitch / internet people", ["Josh Lujan aka Xaryu", "Kristina Rybalchenko aka kriss_drummer", "Jason Smith aka Pikabooirl", "Annie Fuchsia", "Caroline Forer aka Naguura", "Sweet Anita", "Elliott Venczel aka Venruki", "junicats", "Farbenfuchs"]],
    ["designers / makers", ["Tobias van Schneider", "Marcel Wichmann", "Frank Chimero", "Sebastiaan de With", "Christian Selig", "Paul Stamatiou", "Kristina Bonitz", "Oliur Rahman", "Vijay Verma", "Carl Barenbrug", "Austin Kleon", "Mike Monteiro"]],
    ["people", ["Hayao Miyazaki", "Steve Jobs", "Jony Ive", "Emma Watson", "Arnold Schwarzenegger", "Shi Heng Yi", "Trevor Noah", "Jim Carrey", "Barack Obama", "Dieter Rams", "Tina Fey", "Massimo Vignelli", "Katie Dill", "Taylor Tomlinson", "Yohji Yamamoto", "Conan O'Brien", "Hideo Kojima", "Greta Gerwig", "David Fincher", "Hiro Murai", "Donald Glover", "Phoebe Waller-Bridge"]]
  ];
  return {
    title: "curiosities",
    html: `
      <section class="loud-page">
        <div class="loud-title">
          <p class="kicker">curiosities / inspirations / saved tabs</p>
          <h1>why choose this?</h1>
          <p class="scribble">because taste is an archive of attention.</p>
        </div>
        <div class="curio-stack">${blocks.map(listBlock).join("")}</div>
      </section>
    `
  };
}

function inventoryPage() {
  const items = [
    ["notebook", "field notes", "14,90 EUR"], ["pen", "mark one", "108,95 EUR"], ["journal", "leuchtturm", "22,50 EUR"],
    ["notes", "yellow legal pad", "2,90 EUR"], ["wallpaper", "retro vhs pack", "free"], ["phone", "iphone 13 mini", "289,00 EUR"],
    ["workstation", "mac mini", "699,00 EUR"], ["tablet", "ipad mini", "599,00 EUR"], ["music", "ipod classic", "priceless"],
    ["bag", "everyday sling", "169,99 EUR"], ["shoes", "low top canvas", "169,00 EUR"], ["pants", "baggy trouser", "80,00 EUR"],
    ["shirt", "oversized crew neck", "19,90 EUR"], ["shirt", "standing collar", "49,90 EUR"], ["bracelet", "matte onyx", "32,00 EUR"], ["book", "any", "priceless"]
  ];
  return {
    title: "inventory",
    html: `
      <section class="loud-page cream">
        <div class="loud-title">
          <p class="kicker">inventory / goods / tools</p>
          <h1>this earns its place.</h1>
          <p class="lede">the quintessence of the tools I use every day. each one stays because it just works.</p>
        </div>
        <div class="inventory-board">${items.map(([type, name, price], i) => `<article><time>${String(i + 1).padStart(2, "0")}.</time><span>${type}</span><strong>${name}</strong><small>${price}</small></article>`).join("")}</div>
      </section>
    `
  };
}

function aboutPage() {
  return {
    title: "about",
    html: `
      <article class="essay">
        <header>
          <img src="/assets/images/notes.jpg" alt="Rafa going through his notes">
          <div>
            <p class="kicker">about / memory / making</p>
            <h1>capturing what I can't see</h1>
            <p class="lede">my name is rafael polutta, and my goal is to tell stories that inspire. this is why.</p>
          </div>
        </header>
        ${para("I never thought much about it, but living with no mental images (aphantasia) makes the past feel unimportant. I don't dwell on what was. details fade quickly, and all that's left are broad strokes: growing up in a small village, helping my parents renovate the house, school days, bike rides through the forest. moving to the city, studying art direction and design simply because I was always in front of a computer. mesmerised by moving graphics in video games and the internet.")}
        ${para("learning the rules in order to break them. finding a calling in user experiences and interfaces - without realising it, telling stories through buttons and typefaces.")}
        ${para("those broad strokes shaped my eye for detail and taste. I consume media and can only recall the big picture. I love rewatching movies and shows, seeing the story unfold again almost as if for the first time. this makes the present so important to me. the only way to relive a past moment visually is through photography and video.")}
        <figure><img src="/assets/images/switzerland.jpg" alt="Rafa somewhere in Switzerland"><figcaption>(me somewhere in switzerland)</figcaption></figure>
        ${para("it wasn't because of that, but somehow i began documenting certain aspects of my life - trying to make them cinematic. this became my only way to look back. the older I get, the more important it becomes to have these memories in physical form. I enjoy picking up a vinyl, knowing a friend gifted it to me because she thought i'd like it. holding it reminds me of her. even writing my to-dos in a physical notebook and crossing them off just feels real.")}
        ${para("I'm working on finding balance in every aspect of life - enjoying the moment now, while being able to look back at a life well lived. the act of creating is what drives me. I don't idle well. having nothing to do might sound wonderful, but without a project I grow restless.")}
        <blockquote>everything around you that you call life was made up by people who were no smarter than you.<cite>steve jobs</cite></blockquote>
        <figure class="portrait"><img src="/assets/images/portrait.jpg" alt="Rafa posing"><figcaption>(me totally not posing)</figcaption></figure>
        ${para("I always want to be learning and improving myself: travel, read, play, write, watch, ask, be curious, and share my perspective. and above all, tell stories that inspire.")}
        <section class="beliefs">
          <h2>things I believe</h2>
          <ol>${["touch grass.", "move your body first thing in the morning.", "do one thing at a time.", "let cleaning and cooking become meditation.", "read something every day.", "don't ever put your happiness in someone else's hands.", "your normal day is someone's dream - be thankful.", "treat everyone with respect.", "time you enjoy wasting isn't wasted.", "just go for it.", "be private. vibe alone. grow in silence.", "every second counts."].map((item) => `<li>${item}</li>`).join("")}</ol>
        </section>
      </article>
    `
  };
}

function cvPage() {
  const jobs = [
    ["2020 - now", "UI design lead at Phrase", "when i joined, design wasn't even on the radar. hired the team, created the design system, and shaped the visual identity of both the product and the brand. recognized as a leader in the Forrester Wave for Translation Management Systems."],
    ["2019 - 2020", "senior product designer at Share Now", "car2go and DriveNow - Daimler's and BMW's respective car-sharing bets - merged into one company and one product. i navigated that chaos: redesigned the apps under the new unified brand."],
    ["2016 - 2019", "product designer at car2go", "main designer on the app that Time Magazine named App of the Year in 2017. i'll let that one speak for itself."],
    ["2015 - 2016", "intern product designer at mytaxi", "got my hands dirty early. design concepts i worked on found their way into the core of the company's mobility platform."],
    ["2012 - now", "freelance designer", "ten years of client work running in parallel with everything above. fintech, hospitality, SaaS, e-commerce - if it needed a UI or a brand, i've probably done a version of it."]
  ];
  return {
    title: "cv",
    html: `
      <section class="cv-poster">
        <aside>
          <img src="/assets/images/portrait.jpg" alt="Rafael Polutta">
          <h1>rafael polutta</h1>
          <p>UI design lead at Phrase</p>
        </aside>
        <div>
          <p class="kicker">about</p>
          ${para("i have aphantasia. i cannot visualize anything in my mind's eye. for a designer, that sounds like a handicap. but since i never knew there was another way, i learned to approach problems differently than most. no preconceived image to anchor to. no default aesthetic to fall back on. just first principles, every time. it became my superpower.")}
          <p class="kicker">work experience</p>
          ${jobs.map(timelineItem).join("")}
          <div class="acclaims">
            ${mini("2025", "Leader in The Forrester Wave", "Phrase")}
            ${mini("2019", "Car Sharing and UX", "Share Now")}
            ${mini("2017", "Time App of the Year", "car2go")}
          </div>
          <p class="kicker">education / skills</p>
          ${para("bachelor's in communications design & art direction with distinction. UI/UX, design systems, brand identity, Figma, video, product photography, websites, addons, MVPs, podcasting, and AI as a tool - not a crutch.")}
        </div>
      </section>
    `
  };
}

function expensesPage() {
  return hiddenLog("monthly expenses", "to me, being rich just means having more than I need. not stressing about money is freedom.", [
    ["household", "rent, groceries, electricity, internet, bunq, mobile provider, yearly expenses"],
    ["insurance", "private healthcare"],
    ["debt", "swk, ing"],
    ["savings", "rainy day, vacation, etf"],
    ["leisure", "guilt free spending, eating out, urban sport, youtube premium, apple music, icloud"]
  ]);
}

function debtPage() {
  return hiddenLog("debt", "this isn't just a balance - it's a countdown. every euro gone is one step closer to breathing easy.", [
    ["swk", "3,29%"],
    ["ing", "5,73%"],
    ["schufa", "credit score / acceptable / 96,13%"]
  ]);
}

function healthPage() {
  return hiddenLog("biomarker (07.01.25)", "a body log for noticing patterns without turning the body into a product.", [
    ["basics", "chronological age 35, pace of aging 0.7, weight 66 kg, body fat 6.2%, body water 45.6 l, skeletal muscle mass 35.3 kg"],
    ["complete blood count", "hemoglobin 14.5, hematocrit 45.2, rbc 4.69, wbc 4.0, plt 236"],
    ["metabolic panel", "creatinine 2.30 over, urea 6.4, gpt 28, got 27, bilirubin 1.25 over"],
    ["lipid panel", "ldl 140 over, hdl 41 over, triglycerides 91.2"],
    ["iron & energy", "ferritin 28.0 under, serum iron < 1.0 mg/l, vitamin d 58, vitamin b12 834"]
  ]);
}

function notFoundPage() {
  return { title: "not found", html: `<section class="loud-page"><div class="loud-title"><p class="kicker">404</p><h1>wrong door.</h1><p class="lede"><a href="/">back to the index</a></p></div></section>` };
}

function posterCard(href, n, title, text) {
  return `<a class="poster-card" href="${href}"><time>${n}</time><strong>${title}</strong><span>${text}</span></a>`;
}

function listBlock([title, items]) {
  return `<section class="curio-block"><h2>${title}</h2><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></section>`;
}

function para(text) {
  return `<p class="prose">${text}</p>`;
}

function timelineItem([year, title, text]) {
  return `<article class="timeline"><time>${year}</time><div><h2>${title}</h2><p>${text}</p></div></article>`;
}

function mini(year, title, text) {
  return `<article><time>${year}</time><strong>${title}</strong><span>${text}</span></article>`;
}

function hiddenLog(title, intro, rows) {
  return {
    title,
    html: `
      <section class="hidden-page">
        <p class="kicker">unlisted / direct url only</p>
        <h1>${title}</h1>
        <p class="lede">${intro}</p>
        <div class="log-grid">${rows.map(([label, text]) => `<article><h2>${label}</h2><p>${text}</p></article>`).join("")}</div>
      </section>
    `
  };
}
