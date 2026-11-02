// Single source of truth for the public, indexable URLs of hejrafa.com.
// Used by scripts/seo-dates.mjs (sitemap + dateModified) and tests/seo.test.mjs.

export const SITE = "https://hejrafa.com";

/** Site go-live, used as ProfilePage dateCreated. */
export const SITE_CREATED = "2026-05-04T10:10:54+02:00";

export const PAGES = [
  { file: "index.html", path: "/" },
  { file: "projects/index.html", path: "/projects/" },
  { file: "projects/share-now/index.html", path: "/projects/share-now/" },
  { file: "projects/syntax/index.html", path: "/projects/syntax/" },
  { file: "about/index.html", path: "/about/" },
  { file: "assets/files/rafael-polutta-cv.pdf", path: "/assets/files/rafael-polutta-cv.pdf" },
];

/** ISO 8601 date-time with a numeric timezone offset, e.g. 2026-11-02T09:13:00+01:00 */
export const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
