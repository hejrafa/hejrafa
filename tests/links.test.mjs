// Every site-local path referenced from HTML, CSS, or JS must point at a real file.
// Catches broken images, scripts, and stylesheets after moves or renames.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".git", ".claude", "scripts", "tests"]);
const SCAN = new Set([".html", ".css", ".js", ".mjs"]);

function* sourceFiles(dir = ROOT) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* sourceFiles(full);
    else if (SCAN.has(extname(name))) yield full;
  }
}

// Absolute site paths inside quotes or url(): "/assets/x.png", '/yellow/a.js', url(/favicon.svg)
const REF = /(?:["'(])(\/[A-Za-z0-9_\-./]+?)(?=[?#"')\s])/g;

function resolves(path) {
  const file = join(ROOT, path);
  if (!existsSync(file)) return false;
  if (statSync(file).isDirectory()) return existsSync(join(file, "index.html"));
  return true;
}

test("all local asset and page references resolve to files", () => {
  const broken = [];
  let checked = 0;
  for (const file of sourceFiles()) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(REF)) {
      const path = match[1];
      // Only check things that look like files or directory routes, not SPA routes like "/projects".
      if (!extname(path) && !path.endsWith("/")) continue;
      checked += 1;
      if (!resolves(path)) broken.push(`${file.slice(ROOT.length + 1)} -> ${path}`);
    }
  }
  assert.ok(checked > 100, `expected to check many references, got ${checked}`);
  assert.deepEqual(broken, [], `broken references:\n  ${broken.join("\n  ")}`);
});

test("no stray files at the site root", () => {
  const allowed = new Set([
    ".env", ".env.example", ".gitignore", "404.html", "CNAME", "README.md", "favicon.ico", "favicon.svg",
    "index.html", "llms.txt", "package.json", "package-lock.json", "robots.txt", "sitemap.xml",
  ]);
  const stray = readdirSync(ROOT).filter((name) => name !== ".DS_Store" && !statSync(join(ROOT, name)).isDirectory() && !allowed.has(name));
  assert.deepEqual(stray, [], `unexpected root files: ${stray}`);
});
