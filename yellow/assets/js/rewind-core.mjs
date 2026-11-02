/** @typedef {{frontWidth:number, frontHeight:number, spineWidth:number, backWidth:number, bleed:number, safeArea:number, ticketWidth:number, ticketHeight:number}} TemplateMeasurements */
/** @typedef {{url:string, thumbnailUrl:string, language:string, aspectRatio:number|null}} ArtworkOption */
/** @typedef {{tmdbId:number, title:string, originalTitle:string, year:string, director:string, screenplay:string, genres:string, runtime:number|null, synopsis:string, posterUrl:string, backdropUrl:string, backBackdropUrl:string, logoUrl:string, accentColor:string, accentInk:string, backAccentColor:string, backAccentInk:string, studios:{name:string,logoUrl:string}[], artwork:{posters:ArtworkOption[],backdrops:ArtworkOption[],logos:ArtworkOption[]}}} MovieData */
/** @typedef {{dateWatched:string, location:string, watchedWith:string, rating:number|null, reaction:string, rewatch:boolean}} ViewingData */

export const COLLECTION_VERSION = 1;

export const DEFAULT_TEMPLATE = Object.freeze({
  frontWidth: 65,
  frontHeight: 101.5,
  spineWidth: 12,
  backWidth: 27,
  bleed: 3,
  safeArea: 4,
  ticketWidth: 92,
  ticketHeight: 54,
});

export function calculateJCard(measurements = DEFAULT_TEMPLATE) {
  const value = validateTemplate(measurements);
  return {
    trimWidth: value.backWidth + value.spineWidth + value.frontWidth,
    trimHeight: value.frontHeight,
    sheetWidth: value.backWidth + value.spineWidth + value.frontWidth + value.bleed * 2,
    sheetHeight: value.frontHeight + value.bleed * 2,
    safeWidth: value.frontWidth - value.safeArea * 2,
    safeHeight: value.frontHeight - value.safeArea * 2,
  };
}

export function calculateTicketCapacity(measurements = DEFAULT_TEMPLATE, page = { width: 210, height: 297 }, gap = 5, margin = 10) {
  const value = validateTemplate(measurements);
  const itemWidth = value.ticketWidth;
  const itemHeight = value.ticketHeight;
  const columns = Math.max(1, Math.floor((page.width - margin * 2 + gap) / (itemWidth + gap)));
  const rows = Math.max(1, Math.floor((page.height - margin * 2 + gap) / (itemHeight + gap)));
  return { columns, rows, total: columns * rows };
}

export function suggestNextCatalogue(records, prefix = "RF") {
  const safePrefix = String(prefix || "RF").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "RF";
  const matcher = new RegExp(`^${escapeRegExp(safePrefix)}-(\\d+)$`, "i");
  const highest = Array.isArray(records)
    ? records.reduce((max, record) => {
        const match = String(record?.catalogueNumber || "").trim().match(matcher);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0)
    : 0;

  return `${safePrefix}-${String(highest + 1).padStart(3, "0")}`;
}

export function validateTemplate(input) {
  const source = assertObject(input, "Template measurements");
  const keys = Object.keys(DEFAULT_TEMPLATE);
  const result = {};

  keys.forEach((key) => {
    const number = Number(source[key]);
    const maximum = key === "safeArea" || key === "bleed" ? 30 : 300;

    if (!Number.isFinite(number) || number < 0 || number > maximum || (number === 0 && key !== "bleed" && key !== "safeArea")) {
      throw new Error(`Invalid ${key} measurement.`);
    }

    result[key] = number;
  });

  if (result.safeArea * 2 >= Math.min(result.frontWidth, result.frontHeight, result.ticketWidth, result.ticketHeight)) {
    throw new Error("Safe area is too large for this template.");
  }

  return result;
}

export function validateRecord(input) {
  const record = assertObject(input, "Collection record");
  const movie = assertObject(record.movie, "Movie data");
  const viewing = assertObject(record.viewing, "Viewing data");
  const poster = assertObject(record.poster || {}, "Poster controls");
  const rating = viewing.rating === "" || viewing.rating == null ? null : Number(viewing.rating);

  if (!Number.isInteger(Number(movie.tmdbId)) || Number(movie.tmdbId) < 1) {
    throw new Error("A record has an invalid TMDB movie ID.");
  }

  if (!cleanString(movie.title, 220)) {
    throw new Error("A record is missing its movie title.");
  }

  if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 5 || Math.round(rating * 2) !== rating * 2)) {
    throw new Error("Ratings must be in half-star steps from 0 to 5.");
  }

  const catalogueNumber = cleanString(record.catalogueNumber, 40);

  if (!catalogueNumber) {
    throw new Error("A record is missing its catalogue number.");
  }

  return {
    id: cleanString(record.id, 80) || makeRecordId(),
    updatedAt: cleanString(record.updatedAt, 40) || new Date().toISOString(),
    movie: {
      tmdbId: Number(movie.tmdbId),
      title: cleanString(movie.title, 220),
      originalTitle: cleanString(movie.originalTitle, 220),
      year: cleanString(movie.year, 8),
      director: cleanString(movie.director, 220),
      screenplay: cleanString(movie.screenplay, 300),
      genres: cleanString(movie.genres, 220),
      runtime: movie.runtime == null || movie.runtime === "" ? null : clampNumber(movie.runtime, 0, 1000),
      synopsis: cleanString(movie.synopsis, 3000),
      posterUrl: cleanUrl(movie.posterUrl),
      backdropUrl: cleanUrl(movie.backdropUrl),
      backBackdropUrl: cleanUrl(movie.backBackdropUrl) || cleanUrl(movie.backdropUrl),
      logoUrl: cleanUrl(movie.logoUrl),
      accentColor: cleanColor(movie.accentColor, "#d94a42"),
      accentInk: cleanColor(movie.accentInk, "#171411"),
      backAccentColor: cleanColor(movie.backAccentColor, cleanColor(movie.accentColor, "#d94a42")),
      backAccentInk: cleanColor(movie.backAccentInk, cleanColor(movie.accentInk, "#171411")),
      studios: cleanStudios(movie.studios),
      artwork: {
        posters: cleanArtwork(movie.artwork?.posters),
        backdrops: cleanArtwork(movie.artwork?.backdrops),
        logos: cleanArtwork(movie.artwork?.logos),
      },
    },
    catalogueNumber,
    contentRating: cleanString(record.contentRating, 30),
    playbackUrl: cleanUrl(record.playbackUrl, true),
    poster: {
      zoom: clampNumber(poster.zoom ?? 1, 1, 2.5),
      x: clampNumber(poster.x ?? 50, 0, 100),
      y: clampNumber(poster.y ?? 50, 0, 100),
      backZoom: clampNumber(poster.backZoom ?? 1, 1, 2.5),
      backX: clampNumber(poster.backX ?? 50, 0, 100),
      backY: clampNumber(poster.backY ?? 50, 0, 100),
      logoScale: clampNumber(poster.logoScale ?? 1, 0.4, 1.8),
      logoX: clampNumber(poster.logoX ?? 50, 0, 100),
      logoY: clampNumber(poster.logoY ?? 80, 0, 100),
    },
    viewing: {
      dateWatched: cleanString(viewing.dateWatched, 20),
      location: cleanString(viewing.location, 160),
      watchedWith: cleanString(viewing.watchedWith, 160),
      rating,
      reaction: cleanString(viewing.reaction, 300),
      rewatch: Boolean(viewing.rewatch),
    },
    template: validateTemplate(record.template || DEFAULT_TEMPLATE),
  };
}

export function validateCollectionImport(input) {
  const payload = Array.isArray(input) ? { version: COLLECTION_VERSION, records: input } : assertObject(input, "Collection backup");

  if (Number(payload.version) !== COLLECTION_VERSION || !Array.isArray(payload.records)) {
    throw new Error("This is not a supported Rewind collection backup.");
  }

  if (payload.records.length > 2000) {
    throw new Error("The backup contains too many records.");
  }

  return {
    version: COLLECTION_VERSION,
    exportedAt: cleanString(payload.exportedAt, 40) || new Date().toISOString(),
    records: payload.records.map(validateRecord),
  };
}

export function createCollectionExport(records) {
  return validateCollectionImport({
    version: COLLECTION_VERSION,
    exportedAt: new Date().toISOString(),
    records,
  });
}

export function makeRecordId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `rewind-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value;
}

function cleanString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanUrl(value, allowCustomScheme = false) {
  const candidate = cleanString(value, 2048);

  if (!candidate) {
    return "";
  }

  try {
    const parsed = new URL(candidate);
    const allowed = ["http:", "https:"];

    const blockedCustomSchemes = new Set(["blob:", "data:", "file:", "javascript:"]);
    const isAllowedCustomScheme = allowCustomScheme && !blockedCustomSchemes.has(parsed.protocol) && /^[a-z][a-z0-9+.-]*:$/.test(parsed.protocol);
    return allowed.includes(parsed.protocol) || isAllowedCustomScheme ? candidate : "";
  } catch {
    return "";
  }
}

function cleanStudios(value) {
  return (Array.isArray(value) ? value : [])
    .slice(0, 8)
    .map((studio) => ({
      name: cleanString(studio?.name, 180),
      logoUrl: cleanUrl(studio?.logoUrl),
    }))
    .filter((studio) => studio.name || studio.logoUrl);
}

function cleanArtwork(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 30).flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const url = cleanUrl(item.url);
    const thumbnailUrl = cleanUrl(item.thumbnailUrl);

    if (!url || !thumbnailUrl) {
      return [];
    }

    const aspectRatio = item.aspectRatio == null ? null : Number(item.aspectRatio);
    return [{
      url,
      thumbnailUrl,
      language: cleanString(item.language, 12),
      aspectRatio: Number.isFinite(aspectRatio) ? aspectRatio : null,
    }];
  });
}

function cleanColor(value, fallback) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
