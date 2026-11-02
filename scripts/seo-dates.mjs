#!/usr/bin/env node
// Keeps the "last modified" signals Google reads in sync with git:
//   - <lastmod> for every URL in sitemap.xml
//   - "dateModified" on the page node (ProfilePage / CollectionPage / Article) of each page's JSON-LD
//
// A file with uncommitted changes gets "now"; a clean file gets its last commit date.
// Run it right before committing:  npm run seo:dates
//
// Google requires ISO 8601 date-times WITH a timezone offset for ProfilePage.dateModified
// (a bare "2026-08-31" shows up in Search Console as "Invalid datetime value").

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES, SITE, DATETIME_RE } from "./seo-pages.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function localIso(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

function lastModified(file) {
  const dirty = git("status", "--porcelain", "--", file) !== "";
  if (dirty) return localIso();
  const committed = git("log", "-1", "--format=%aI", "--", file);
  return committed || localIso();
}

const stamps = new Map(PAGES.map((page) => [page.file, lastModified(page.file)]));

for (const stamp of stamps.values()) {
  if (!DATETIME_RE.test(stamp)) throw new Error(`Unexpected date format: ${stamp}`);
}

// 1. sitemap.xml
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  PAGES.map(
    (page) =>
      `  <url>\n    <loc>${SITE}${page.path}</loc>\n    <lastmod>${stamps.get(page.file)}</lastmod>\n  </url>\n`
  ).join("") +
  `</urlset>\n`;
writeFileSync(resolve(ROOT, "sitemap.xml"), sitemap);
console.log("sitemap.xml  rewritten");

// 2. dateModified on each HTML page's own node (first node in the @graph).
for (const page of PAGES) {
  if (!page.file.endsWith(".html")) continue;
  const path = resolve(ROOT, page.file);
  const html = readFileSync(path, "utf8");
  const stamp = stamps.get(page.file);
  let replaced = false;
  const next = html.replace(/"dateModified": "[^"]*"/, () => {
    replaced = true;
    return `"dateModified": "${stamp}"`;
  });
  if (!replaced) throw new Error(`${page.file}: no "dateModified" found in JSON-LD`);
  if (next !== html) writeFileSync(path, next);
  console.log(`${page.file.padEnd(32)} dateModified = ${stamp}`);
}
