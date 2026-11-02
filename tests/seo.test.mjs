// Guards the things Google Search Console reports on: structured data, canonicals,
// sitemap, robots, social meta. Run with `npm test`.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES, SITE, DATETIME_RE } from "../scripts/seo-pages.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(resolve(ROOT, file), "utf8");

const HTML_PAGES = PAGES.filter((page) => page.file.endsWith(".html"));

function head(html) {
  return html.match(/<head>([\s\S]*?)<\/head>/)[1];
}

function meta(html, selector) {
  const re = new RegExp(`<meta ${selector}[^>]*content="([^"]*)"`);
  return html.match(re)?.[1];
}

function link(html, rel) {
  return html.match(new RegExp(`<link rel="${rel}" href="([^"]*)"`))?.[1];
}

function jsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1, "exactly one JSON-LD block per page");
  return JSON.parse(blocks[0][1]);
}

function* walk(node, path = "$") {
  if (Array.isArray(node)) {
    for (const [i, child] of node.entries()) yield* walk(child, `${path}[${i}]`);
  } else if (node && typeof node === "object") {
    yield [path, node];
    for (const [key, value] of Object.entries(node)) yield* walk(value, `${path}.${key}`);
  }
}

for (const page of HTML_PAGES) {
  const html = read(page.file);
  const h = head(html);
  const url = `${SITE}${page.path}`;

  test(`${page.file}: head basics`, () => {
    assert.match(html, /<html[^>]*lang="en"/);
    assert.ok(h.match(/<title>([^<]+)<\/title>/)?.[1].length > 10, "title present");
    const description = meta(h, 'name="description"');
    assert.ok(description && description.length >= 50 && description.length <= 160, `description 50-160 chars (${description?.length})`);
    assert.equal(link(h, "canonical"), url, "canonical matches sitemap URL");
    assert.equal(meta(h, 'property="og:url"'), url, "og:url matches canonical");
    assert.doesNotMatch(meta(h, 'name="robots"') ?? "", /noindex/, "indexable");
    assert.ok(meta(h, 'property="og:image"')?.startsWith("https://"), "absolute og:image");
    assert.ok(meta(h, 'property="og:image:width"'), "og:image:width");
    assert.ok(meta(h, 'property="og:image:height"'), "og:image:height");
    assert.ok(meta(h, 'property="og:locale"'), "og:locale");
    assert.equal(meta(h, 'name="twitter:card"'), "summary_large_image");
  });

  test(`${page.file}: structured data`, () => {
    const data = jsonLd(h);
    assert.equal(data["@context"], "https://schema.org");
    const graph = data["@graph"];
    assert.ok(Array.isArray(graph) && graph.length > 0);

    const pageNode = graph[0];
    assert.ok(["ProfilePage", "CollectionPage", "Article"].includes(pageNode["@type"]), `page node first (${pageNode["@type"]})`);
    assert.equal(pageNode.url, url, "page node url matches canonical");

    // Google wants full ISO 8601 date-times with timezone, not bare dates.
    for (const [path, node] of walk(graph)) {
      for (const key of ["dateModified", "dateCreated", "datePublished"]) {
        if (key in node) assert.match(node[key], DATETIME_RE, `${path}.${key} = ${node[key]}`);
      }
    }
    assert.ok(pageNode.dateModified, "dateModified present on page node");

    // Every bare { "@id": … } reference must resolve to a node declared on the same page.
    const declared = new Set();
    for (const [, node] of walk(graph)) {
      if (node["@id"] && Object.keys(node).length > 1) declared.add(node["@id"]);
    }
    for (const [, node] of walk(graph)) {
      for (const value of Object.values(node)) {
        if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 1 && value["@id"]) {
          assert.ok(declared.has(value["@id"]), `dangling @id reference ${value["@id"]} in ${page.file}`);
        }
      }
    }

    // One identity for the author across the whole site.
    const person = graph.find((node) => node["@type"] === "Person");
    assert.equal(person?.["@id"], `${SITE}/#rafael-polutta`);
    assert.equal(person?.jobTitle, "Product Designer");

    const breadcrumb = graph.find((node) => node["@type"] === "BreadcrumbList");
    if (page.path !== "/") {
      assert.ok(breadcrumb, "non-home pages carry a BreadcrumbList");
      const last = breadcrumb.itemListElement.at(-1);
      assert.equal(last.item, url, "last breadcrumb is the page itself");
      assert.equal(breadcrumb.itemListElement[0].item, `${SITE}/`);
    }
  });
}

test("titles and descriptions are unique across pages", () => {
  const titles = HTML_PAGES.map((page) => head(read(page.file)).match(/<title>([^<]+)<\/title>/)[1]);
  const descriptions = HTML_PAGES.map((page) => meta(head(read(page.file)), 'name="description"'));
  assert.equal(new Set(titles).size, titles.length, `duplicate titles: ${titles}`);
  assert.equal(new Set(descriptions).size, descriptions.length, "duplicate descriptions");
});

test("sitemap.xml lists exactly the public pages with valid lastmod", () => {
  const xml = read("sitemap.xml");
  const entries = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)].map((m) => ({ loc: m[1], lastmod: m[2] }));
  assert.deepEqual(entries.map((e) => e.loc), PAGES.map((page) => `${SITE}${page.path}`));
  for (const entry of entries) assert.match(entry.lastmod, DATETIME_RE, `${entry.loc} lastmod`);
  for (const page of PAGES) assert.ok(existsSync(resolve(ROOT, page.file)), `${page.file} exists`);
  assert.doesNotMatch(xml, /<changefreq>|<priority>/, "no changefreq/priority (Google ignores them)");
});

test("robots.txt points at the sitemap and keeps /yellow/ out", () => {
  const robots = read("robots.txt");
  assert.match(robots, /^Sitemap: https:\/\/hejrafa\.com\/sitemap\.xml$/m);
  assert.match(robots, /^Disallow: \/yellow\/$/m);
});

test("private and error pages are noindex", () => {
  for (const file of ["404.html", "yellow/index.html", "yellow/rewind/index.html"]) {
    assert.match(meta(head(read(file)), 'name="robots"') ?? "", /noindex/, `${file} noindex`);
  }
});
