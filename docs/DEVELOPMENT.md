# Developer notes for hejrafa.com

This file holds the technical notes for the site. The repo README is the GitHub profile page and stays about the person, not the code.

## Folder structure

```
/                  public root: index.html, 404.html, robots.txt, sitemap.xml, llms.txt, favicons, CNAME
/about/            about page (same shell as the home page, different active panel)
/projects/         projects page plus one folder per case study (share-now/, syntax/)
/assets/css/       site stylesheets (style.css, case-study.css)
/assets/js/        site script
/assets/images/    one folder per subject: about/, curiosities/, hejhub/, akari/, car2go/, ...
                   share-now/ and syntax/ hold both the card images and the case-study images
/assets/files/     the CV (public URL, do not move)
/yellow/           private dashboard (noindex, robots-blocked) with its own assets/ folder
/yellow/private/   plaintext Yellow content, ignored by git (see "Yellow" below)
/yellow/assets/data/yellow.enc   the encrypted Yellow content, the only form that is committed
/scripts/          tooling: dev-server.mjs (TMDB proxy), seo-dates.mjs, seo-pages.mjs, yellow-encrypt.mjs, yellow-sync.mjs
/tests/            node:test suites, run with `npm test`
/docs/             this file; the README is the GitHub profile page and stays non-technical
```

Public URLs (pages, the CV, og:images) stay where they are. Everything else can move as long as `npm test` passes: it checks every local reference resolves.

## Yellow

`/yellow/` is a private dashboard behind a password. The host is static and the repo is public, so the private content (the health, finance, and letter panels plus the health and letter data) is not in the pages at all: it ships as ciphertext in `yellow/assets/data/yellow.enc`, and the browser decrypts it after the password is typed.

- **How it is locked.** `npm run yellow:encrypt` derives a 256-bit key from the password with PBKDF2-SHA256 (600,000 iterations, random 16-byte salt), gzips the content, and encrypts it with AES-GCM (random 12-byte IV). The pages keep only the shell, the password form, and Rewind. On unlock the browser derives the same key with WebCrypto, decrypts, injects the panels, and starts the panel scripts. A wrong password just fails to decrypt and shakes the form; there is no password anywhere in the code.
- **Remembered unlock.** Only the derived AES key is kept, in `sessionStorage`, so a reload in the same tab stays unlocked. It cannot reveal the password and it is gone when the tab closes. Nothing goes to `localStorage`.
- **Where the plaintext lives.** `yellow/private/panels.html` (the five `<section data-yellow-page>` panels, in order) and `yellow/private/data.mjs` (the health programme, recipes, food plans, and letter drafts as JSON-serialisable exports). The folder is in `.gitignore`; never commit it.
- **Editing.** Change the files in `yellow/private/`, run `npm run yellow:encrypt`, commit the new `yellow.enc`. The password comes from `YELLOW_PASSWORD` in `.env` (ignored by git) or an interactive prompt. Passwords are normalised (Unicode NFKC, trimmed, lower-cased) before use, on both sides.
- **Fresh checkout.** The plaintext is not in git. Run `npm run yellow:decrypt` with the password to rebuild `yellow/private/` from `yellow.enc` (formatting and comments in `data.mjs` are not preserved).
- **Entry points.** Yellow routes on real paths, so `yellow/{health,finance,finance-yearly,finance-debt,letter}/index.html` must be byte-identical copies of `yellow/index.html`. `npm run yellow:encrypt` refreshes them; after editing the shell alone, run `npm run yellow:sync`.
- **Changing the password.** Set the new one and run `npm run yellow:encrypt`; the old ciphertext is simply replaced. Note that git history before November 2026 still holds the old plaintext pages.

`npm test` fails if any committed Yellow file contains a euro amount, health or letter copy, or a panel, if the entry points drift from the shell, or if `yellow/private/` is ever tracked.

## Rewind

Rewind lives inside the password-protected Yellow section as its fourth navigation item. It searches TMDB, builds editable cassette J-cards and cinema tickets, previews exact millimetre layouts, prints A4 sheets, and stores a local movie collection with JSON backup and restore.

### Local setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. In your [TMDB account API settings](https://www.themoviedb.org/settings/api), copy the **API Read Access Token** into `TMDB_ACCESS_TOKEN` in `.env`.
4. Run `npm run dev`.
5. Open `http://127.0.0.1:4173/yellow/rewind/`, unlock Yellow, and choose **Rewind**.

### Before publishing

A pre-commit hook (installed by `npm install` via the `prepare` script, or manually with `git config core.hooksPath .githooks`) stamps `sitemap.xml` and each staged page's `dateModified` with full ISO 8601 date-times, then runs `npm test`. A failing test blocks the commit. To stamp by hand, run `npm run seo:dates`.

The local server proxies browser requests to the official TMDB v3 movie search, movie details, and movie credits endpoints. The access token stays on the server and is never written into client code or localStorage.

### Printing

Open **A4 sheet**, then choose **Print A4**. In the browser print dialog:

- use A4 paper;
- choose **100%** or **Actual size**;
- disable **Fit to page**;
- enable background graphics;
- remove browser headers and footers.

The standard three-panel J-card defaults to a 65 × 101.5 mm portrait cover, 12 mm spine, and 27 mm small side, matching the supplied 104 × 101.5 mm trim. Choose one TMDB backdrop for the complete front face and another for the complete back face; each image has its own zoom and position controls. The title logo can be positioned separately on the cover, while each backdrop supplies the color used by its readable overlays. The two faces are separate A4 pages; print those first two pages duplex using **Flip on long edge**. Use **Open calibration print** first and verify the 100 mm ruler and 50 × 50 mm square with a physical ruler. The cassette and ticket defaults can be changed in the editor; all dimensions are millimetres.

### Collection and tests

The MVP saves records only in this browser's localStorage. Use **Export JSON** regularly and **Import JSON** to restore or merge a backup. There are no accounts, database, or cloud sync.

Run `npm test` to verify measurement calculations, catalogue-number generation, and collection import/export validation.

For a hosted deployment, route `/api/tmdb/*` to an equivalent server-side function and set `TMDB_ACCESS_TOKEN` in that host's environment. A purely static host cannot keep a TMDB token private.
