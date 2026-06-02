# hejrafa

Personal website and portfolio for Rafael Polutta.

The public homepage is a static single-page experience with three hash-routed sections:

- `/#home`
- `/#projects`
- `/#about`

The old `/#work` hash is kept as a compatibility alias and redirects to `/#projects`.

## Pages

The main experience lives in the root files:

- `index.html`
- `style.css`
- `script.js`

Standalone pages still available:

- `/curiosities/`
- `/cv/`
- `/inventory/`

Hidden / personal pages:

- `/health/`
- `/expenses/`
- `/expenses-yearly/`
- `/debt/`

System:

- `/404.html`

## Run Locally

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/
```

## Deployment

The site is plain static HTML/CSS/JS and deploys through GitHub Pages from `main` at the repository root.

Custom domain:

```text
hejrafa.com
```
