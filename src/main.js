const publicRoutes = [
  ["/curiosities/", "curiosities"],
  ["/inventory/", "inventory"],
  ["/about/", "about"],
  ["/cv/", "cv"]
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
  document.body.dataset.hidden = hiddenRoutes.includes(route) ? "true" : "false";
  app.innerHTML = `
    <header>
      <a href="/" class="wordmark">hejrafa</a>
      <nav>${publicRoutes.map(([href, label]) => `<a href="${href}"${href === route ? " aria-current=\"page\"" : ""}>${label}</a>`).join("")}</nav>
    </header>
    <main>${page.html}</main>
  `;
}

function homePage() {
  return {
    title: "hejrafa",
    html: `
      <section class="home">
        <h1>rafael polutta</h1>
        <p>designer. maker. hamburg.</p>
        <nav class="home-links">
          ${publicRoutes.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
        </nav>
        <a class="mail" href="mailto:contact@hejrafa.com">contact@hejrafa.com</a>
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
    html: `<article class="page"><h1>curiosities</h1>${blocks.map(listBlock).join("")}</article>`
  };
}

function inventoryPage() {
  const items = [
    ["notebook", "field notes", "14,90 EUR"], ["pen", "mark one", "108,95 EUR"], ["journal", "leuchtturm", "22,50 EUR"], ["notes", "yellow legal pad", "2,90 EUR"],
    ["wallpaper", "retro vhs pack", "free"], ["phone", "iphone 13 mini", "289,00 EUR"], ["workstation", "mac mini", "699,00 EUR"], ["tablet", "ipad mini", "599,00 EUR"],
    ["music", "ipod classic", "priceless"], ["bag", "everyday sling", "169,99 EUR"], ["shoes", "low top canvas", "169,00 EUR"], ["pants", "baggy trouser", "80,00 EUR"],
    ["shirt", "oversized crew neck", "19,90 EUR"], ["shirt", "standing collar", "49,90 EUR"], ["bracelet", "matte onyx", "32,00 EUR"], ["book", "any", "priceless"]
  ];
  return {
    title: "inventory",
    html: `<article class="page"><h1>inventory</h1><table><tbody>${items.map(([type, name, price]) => `<tr><td>${type}</td><td>${name}</td><td>${price}</td></tr>`).join("")}</tbody></table></article>`
  };
}

function aboutPage() {
  return {
    title: "about",
    html: `
      <article class="page text">
        <h1>capturing what I can't see</h1>
        <p>my name is rafael polutta, and my goal is to tell stories that inspire. this is why.</p>
        <p>I never thought much about it, but living with no mental images (aphantasia) makes the past feel unimportant. I don't dwell on what was. details fade quickly, and all that's left are broad strokes: growing up in a small village, helping my parents renovate the house, school days, bike rides through the forest. moving to the city, studying art direction and design simply because I was always in front of a computer. mesmerised by moving graphics in video games and the internet.</p>
        <p>learning the rules in order to break them. finding a calling in user experiences and interfaces - without realising it, telling stories through buttons and typefaces.</p>
        <img src="/assets/images/switzerland.jpg" alt="Rafa somewhere in Switzerland">
        <p>the act of creating is what drives me. I don't idle well. having nothing to do might sound wonderful, but without a project I grow restless.</p>
        <blockquote>everything around you that you call life was made up by people who were no smarter than you.</blockquote>
        <img src="/assets/images/portrait.jpg" alt="Rafa posing">
        <h2>things I believe</h2>
        <ol>${["touch grass.", "move your body first thing in the morning.", "do one thing at a time.", "let cleaning and cooking become meditation.", "read something every day.", "don't ever put your happiness in someone else's hands.", "your normal day is someone's dream - be thankful.", "treat everyone with respect.", "time you enjoy wasting isn't wasted.", "just go for it.", "be private. vibe alone. grow in silence.", "every second counts."].map((item) => `<li>${item}</li>`).join("")}</ol>
      </article>
    `
  };
}

function cvPage() {
  const jobs = [
    ["2020 - now", "UI design lead at Phrase", "hired the team, created the design system, and shaped the visual identity of both the product and the brand."],
    ["2019 - 2020", "senior product designer at Share Now", "redesigned the apps under the new unified brand after car2go and DriveNow merged."],
    ["2016 - 2019", "product designer at car2go", "main designer on the app that Time Magazine named App of the Year in 2017."],
    ["2015 - 2016", "intern product designer at mytaxi", "early product design work for the mobility platform."],
    ["2012 - now", "freelance designer", "fintech, hospitality, SaaS, e-commerce, UI, brand, websites, photography, video."]
  ];
  return {
    title: "cv",
    html: `<article class="page text"><h1>cv</h1><p>rafael polutta. UI design lead at Phrase.</p>${jobs.map(([date, role, text]) => `<section><h2>${role}</h2><time>${date}</time><p>${text}</p></section>`).join("")}</article>`
  };
}

function expensesPage() {
  return hiddenLog("monthly expenses", [
    ["household", "rent, groceries, electricity, internet, bunq, mobile provider, yearly expenses"],
    ["insurance", "private healthcare"],
    ["debt", "swk, ing"],
    ["savings", "rainy day, vacation, etf"],
    ["leisure", "guilt free spending, eating out, urban sport, youtube premium, apple music, icloud"]
  ]);
}

function debtPage() {
  return hiddenLog("debt", [["swk", "3,29%"], ["ing", "5,73%"], ["schufa", "credit score / acceptable / 96,13%"]]);
}

function healthPage() {
  return hiddenLog("biomarker", [
    ["basics", "chronological age 35, pace of aging 0.7, weight 66 kg, body fat 6.2%"],
    ["blood", "hemoglobin 14.5, hematocrit 45.2, rbc 4.69, wbc 4.0, plt 236"],
    ["metabolic", "creatinine 2.30 over, urea 6.4, gpt 28, got 27, bilirubin 1.25 over"],
    ["lipids", "ldl 140 over, hdl 41 over, triglycerides 91.2"],
    ["iron & energy", "ferritin 28.0 under, vitamin d 58, vitamin b12 834"]
  ]);
}

function notFoundPage() {
  return { title: "not found", html: `<article class="page"><h1>404</h1><p>nothing here.</p></article>` };
}

function listBlock([title, items]) {
  return `<section><h2>${title}</h2><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></section>`;
}

function hiddenLog(title, rows) {
  return {
    title,
    html: `<article class="page"><h1>${title}</h1><table><tbody>${rows.map(([label, text]) => `<tr><td>${label}</td><td>${text}</td></tr>`).join("")}</tbody></table></article>`
  };
}
