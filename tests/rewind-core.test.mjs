import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TEMPLATE,
  calculateJCard,
  calculateTicketCapacity,
  createCollectionExport,
  suggestNextCatalogue,
  validateCollectionImport,
} from "../yellow/assets/js/rewind-core.mjs";

const validRecord = {
  id: "record-1",
  updatedAt: "2026-08-22T10:00:00.000Z",
  movie: {
    tmdbId: 603,
    title: "A Movie",
    originalTitle: "A Movie",
    year: "1999",
    director: "A Director",
    screenplay: "A Writer",
    genres: "Drama / Thriller",
    runtime: 120,
    synopsis: "A real TMDB synopsis.",
    posterUrl: "https://image.tmdb.org/t/p/original/poster.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/backdrop.jpg",
    backBackdropUrl: "https://image.tmdb.org/t/p/original/backdrop-back.jpg",
    logoUrl: "https://image.tmdb.org/t/p/original/logo.svg",
    accentColor: "#c2282d",
    accentInk: "#fff5dc",
    backAccentColor: "#456f82",
    backAccentInk: "#fffdf6",
    studios: [{ name: "A Studio", logoUrl: "https://image.tmdb.org/t/p/original/studio.png" }],
    artwork: {
      posters: [{
        url: "https://image.tmdb.org/t/p/original/poster.jpg",
        thumbnailUrl: "https://image.tmdb.org/t/p/w185/poster.jpg",
        language: "en",
        aspectRatio: 0.667,
      }],
      backdrops: [{
        url: "https://image.tmdb.org/t/p/original/backdrop.jpg",
        thumbnailUrl: "https://image.tmdb.org/t/p/w300/backdrop.jpg",
        language: "",
        aspectRatio: 1.778,
      }],
      logos: [{
        url: "https://image.tmdb.org/t/p/original/logo.svg",
        thumbnailUrl: "https://image.tmdb.org/t/p/original/logo.svg",
        language: "en",
        aspectRatio: 2.4,
      }],
    },
  },
  catalogueNumber: "RF-007",
  contentRating: "12",
  playbackUrl: "shortcuts://run-shortcut?name=Movie",
  poster: { zoom: 1.2, x: 52, y: 46, backZoom: 1.35, backX: 44, backY: 55, logoScale: 0.9, logoX: 48, logoY: 78 },
  viewing: {
    dateWatched: "",
    location: "",
    watchedWith: "",
    rating: 4.5,
    reaction: "",
    rewatch: false,
  },
  template: DEFAULT_TEMPLATE,
};

test("calculates the cassette J-card in millimetres", () => {
  assert.deepEqual(calculateJCard(DEFAULT_TEMPLATE), {
    trimWidth: 104,
    trimHeight: 101.5,
    sheetWidth: 110,
    sheetHeight: 107.5,
    safeWidth: 57,
    safeHeight: 93.5,
  });
});

test("calculates efficient A4 ticket capacity", () => {
  assert.deepEqual(calculateTicketCapacity(DEFAULT_TEMPLATE), { columns: 2, rows: 4, total: 8 });
});

test("suggests the next catalogue number for a prefix", () => {
  const records = [{ catalogueNumber: "RF-002" }, { catalogueNumber: "XX-900" }, { catalogueNumber: "RF-011" }];
  assert.equal(suggestNextCatalogue(records), "RF-012");
  assert.equal(suggestNextCatalogue([], "MV"), "MV-001");
});

test("round-trips a valid collection backup", () => {
  const backup = createCollectionExport([validRecord]);
  const imported = validateCollectionImport(JSON.parse(JSON.stringify(backup)));
  assert.equal(imported.version, 1);
  assert.equal(imported.records[0].movie.title, "A Movie");
  assert.equal(imported.records[0].viewing.rating, 4.5);
  assert.equal(imported.records[0].movie.artwork.posters.length, 1);
  assert.equal(imported.records[0].movie.artwork.logos.length, 1);
  assert.equal(imported.records[0].movie.accentColor, "#c2282d");
  assert.equal(imported.records[0].movie.backdropUrl, "https://image.tmdb.org/t/p/original/backdrop.jpg");
  assert.equal(imported.records[0].movie.backBackdropUrl, "https://image.tmdb.org/t/p/original/backdrop-back.jpg");
  assert.equal(imported.records[0].movie.backAccentColor, "#456f82");
  assert.equal(imported.records[0].movie.screenplay, "A Writer");
  assert.equal(imported.records[0].movie.studios[0].name, "A Studio");
  assert.deepEqual(imported.records[0].poster, { zoom: 1.2, x: 52, y: 46, backZoom: 1.35, backX: 44, backY: 55, logoScale: 0.9, logoX: 48, logoY: 78 });

  const legacy = validateCollectionImport({ version: 1, records: [{ ...validRecord, poster: { zoom: 1.1, x: 40, y: 60 } }] });
  assert.deepEqual(legacy.records[0].poster, { zoom: 1.1, x: 40, y: 60, backZoom: 1, backX: 50, backY: 50, logoScale: 1, logoX: 50, logoY: 80 });
});

test("rejects invalid imports and ratings", () => {
  assert.throws(() => validateCollectionImport({ version: 99, records: [] }), /supported/);
  assert.throws(
    () => validateCollectionImport({ version: 1, records: [{ ...validRecord, viewing: { ...validRecord.viewing, rating: 4.3 } }] }),
    /half-star/,
  );
});
