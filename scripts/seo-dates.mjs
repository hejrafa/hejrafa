#!/usr/bin/env node
// Keeps the "last modified" signals Google reads in sync with the work:
//   - <lastmod> for every URL in sitemap.xml
//   - "dateModified" on the page node (ProfilePage / CollectionPage / Article) of each page's JSON-LD
//
// A changed page gets "now"; an unchanged page keeps the stamp it already has.
// "Changed" means uncommitted by default, or staged with --staged (used by the pre-commit hook).
//
// Google requires ISO 8601 date-times WITH a timezone offset for ProfilePage.dateModified
// (a bare "2026-08-31" shows up in Search Console as "Invalid datetime value").

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES, SITE, DATETIME_RE } from "./seo-pages.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STAGED_ONLY = process.argv.includes("--staged");

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

const changed = new Set(
  (STAGED_ONLY ? git("diff", "--cached", "--name-only") : git("status", "--porcelain").replace(/^.{3}/gm, ""))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
);

const now = localIso();

function currentStamp(page) {
  if (page.file.endsWith(".html")) {
    const match = readFileSync(resolve(ROOT, page.file), "utf8").match(/"dateModified": "([^"]*)"/);
    if (match && DATETIME_RE.test(match[1])) return match[1];
  }
  return git("log", "-1", "--format=%aI", "--", page.file) || now;
}

const stamps = new Map(PAGES.map((page) => [page.file, changed.has(page.file) ? now : currentStamp(page)]));

// 1. sitemap.xml
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  PAGES.map(
    (page) =>
      `  <url>\n    <loc>${SITE}${page.path}</loc>\n    <lastmod>${stamps.get(page.file)}</lastmod>\n  </url>\n`
  ).join("") +
  `</urlset>\n`;
const sitemapPath = resolve(ROOT, "sitemap.xml");
if (readFileSync(sitemapPath, "utf8") !== sitemap) {
  writeFileSync(sitemapPath, sitemap);
  console.log("sitemap.xml  updated");
}

// 2. dateModified on each HTML page's own node (first node in the @graph).
for (const page of PAGES) {
  if (!page.file.endsWith(".html")) continue;
  const path = resolve(ROOT, page.file);
  const html = readFileSync(path, "utf8");
  const stamp = stamps.get(page.file);
  let found = false;
  const next = html.replace(/"dateModified": "[^"]*"/, () => {
    found = true;
    return `"dateModified": "${stamp}"`;
  });
  if (!found) throw new Error(`${page.file}: no "dateModified" found in JSON-LD`);
  if (next !== html) {
    writeFileSync(path, next);
    console.log(`${page.file.padEnd(32)} dateModified = ${stamp}`);
  }
}
