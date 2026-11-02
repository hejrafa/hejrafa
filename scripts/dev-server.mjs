import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const workspaceRoot = resolve(process.cwd());
loadEnvironment(join(workspaceRoot, ".env"));

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const tmdbBaseUrl = "https://api.themoviedb.org/3";
const imageBaseUrl = "https://image.tmdb.org/t/p";

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".mp4", "video/mp4"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

    if (url.pathname.startsWith("/api/tmdb/")) {
      await handleTmdbRequest(url, response);
      return;
    }

    serveStatic(url.pathname, response);
  } catch (error) {
    const isTmdbError = Number.isInteger(error?.status);
    sendJson(response, isTmdbError ? 502 : 500, {
      error: isTmdbError ? `TMDB could not complete the request: ${error.message}` : "The local server could not complete that request.",
    });
    console.error(error);
  }
});

server.listen(port, host, () => {
  console.log(`hejrafa is running at http://${host}:${port}`);
  console.log(process.env.TMDB_ACCESS_TOKEN ? "TMDB proxy is ready." : "TMDB_ACCESS_TOKEN is missing; copy .env.example to .env.");
});

async function handleTmdbRequest(url, response) {
  const token = process.env.TMDB_ACCESS_TOKEN?.trim();

  if (url.pathname === "/api/tmdb/status") {
    sendJson(response, 200, { configured: Boolean(token) });
    return;
  }

  if (url.pathname === "/api/tmdb/image") {
    await proxyTmdbImage(url, response);
    return;
  }

  if (!token) {
    sendJson(response, 503, { error: "TMDB is not configured. Add TMDB_ACCESS_TOKEN to .env and restart the server." });
    return;
  }

  if (url.pathname === "/api/tmdb/search") {
    const query = (url.searchParams.get("query") || "").trim().slice(0, 180);

    if (query.length < 2) {
      sendJson(response, 400, { error: "Enter at least two characters to search." });
      return;
    }

    const data = await tmdbFetch("/search/movie", token, {
      query,
      include_adult: "false",
      language: "en-US",
      page: "1",
    });

    sendJson(response, 200, {
      results: (data.results || []).slice(0, 12).map((movie) => ({
        id: movie.id,
        title: movie.title || movie.original_title || "Untitled",
        originalTitle: movie.original_title || "",
        year: movie.release_date ? movie.release_date.slice(0, 4) : "",
        overview: movie.overview || "",
        posterUrl: movie.poster_path ? `${imageBaseUrl}/w342${movie.poster_path}` : "",
      })),
    });
    return;
  }

  const match = url.pathname.match(/^\/api\/tmdb\/movie\/(\d+)$/);

  if (match) {
    const movieId = Number(match[1]);

    if (!Number.isSafeInteger(movieId) || movieId < 1) {
      sendJson(response, 400, { error: "Invalid movie ID." });
      return;
    }

    const [movie, credits, images] = await Promise.all([
      tmdbFetch(`/movie/${movieId}`, token, { language: "en-US" }),
      tmdbFetch(`/movie/${movieId}/credits`, token, { language: "en-US" }),
      tmdbFetch(`/movie/${movieId}/images`, token, { include_image_language: "en,null" }),
    ]);
    const directors = (credits.crew || []).filter((credit) => credit.job === "Director").map((credit) => credit.name);
    const screenplay = [...new Set((credits.crew || [])
      .filter((credit) => ["Screenplay", "Writer", "Adaptation"].includes(credit.job))
      .map((credit) => credit.name)
      .filter(Boolean))];
    const posters = normalizeArtwork(images.posters, "poster");
    const backdrops = normalizeArtwork(images.backdrops, "backdrop");
    const logos = normalizeArtwork(images.logos, "logo");
    const defaultPosterUrl = movie.poster_path ? `${imageBaseUrl}/original${movie.poster_path}` : "";
    const defaultLogoUrl = logos.find((artwork) => Number(artwork.aspectRatio) >= 1.35)?.url || logos[0]?.url || "";

    sendJson(response, 200, {
      movie: {
        tmdbId: movie.id,
        title: movie.title || movie.original_title || "Untitled",
        originalTitle: movie.original_title || "",
        year: movie.release_date ? movie.release_date.slice(0, 4) : "",
        director: directors.join(", "),
        screenplay: screenplay.join(", "),
        genres: (movie.genres || []).map((genre) => genre.name).filter(Boolean).slice(0, 3).join(" / "),
        runtime: Number.isFinite(movie.runtime) ? movie.runtime : null,
        synopsis: movie.overview || "",
        posterUrl: defaultPosterUrl,
        backdropUrl: backdrops[0]?.url || "",
        backBackdropUrl: backdrops[1]?.url || backdrops[0]?.url || "",
        logoUrl: defaultLogoUrl,
        accentColor: "#d94a42",
        accentInk: "#171411",
        backAccentColor: "#d94a42",
        backAccentInk: "#171411",
        studios: (movie.production_companies || [])
          .filter((company) => company.logo_path)
          .slice(0, 5)
          .map((company) => ({
            name: company.name || "Studio",
            logoUrl: `${imageBaseUrl}/original${company.logo_path}`,
          })),
        artwork: {
          posters: ensureDefaultArtwork(posters, movie.poster_path, "poster"),
          backdrops,
          logos,
        },
      },
    });
    return;
  }

  sendJson(response, 404, { error: "Unknown TMDB proxy route." });
}

async function proxyTmdbImage(requestUrl, response) {
  let target;

  try {
    target = new URL(requestUrl.searchParams.get("url") || "");
  } catch {
    sendJson(response, 400, { error: "Invalid TMDB image URL." });
    return;
  }

  if (target.protocol !== "https:" || target.hostname !== "image.tmdb.org" || !target.pathname.startsWith("/t/p/")) {
    sendJson(response, 400, { error: "Only TMDB artwork can be proxied." });
    return;
  }

  const upstream = await fetch(target, { headers: { accept: "image/*" } });

  if (!upstream.ok) {
    sendJson(response, 502, { error: "TMDB artwork could not be loaded." });
    return;
  }

  response.writeHead(200, {
    "cache-control": "public, max-age=86400",
    "content-type": upstream.headers.get("content-type") || "application/octet-stream",
  });
  response.end(Buffer.from(await upstream.arrayBuffer()));
}

function normalizeArtwork(items, kind) {
  const thumbnailSize = kind === "poster" ? "w185" : kind === "backdrop" ? "w300" : "original";
  return (Array.isArray(items) ? items : [])
    .filter((item) => typeof item.file_path === "string" && item.file_path.startsWith("/"))
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0) || (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, 24)
    .map((item) => ({
      url: `${imageBaseUrl}/original${item.file_path}`,
      thumbnailUrl: `${imageBaseUrl}/${thumbnailSize}${item.file_path}`,
      language: item.iso_639_1 || "",
      aspectRatio: Number(item.aspect_ratio) || null,
    }));
}

function ensureDefaultArtwork(items, filePath, kind) {
  if (!filePath) {
    return items;
  }

  const url = `${imageBaseUrl}/original${filePath}`;

  if (items.some((item) => item.url === url)) {
    return items;
  }

  return [{
    url,
    thumbnailUrl: `${imageBaseUrl}/${kind === "poster" ? "w185" : "w300"}${filePath}`,
    language: "",
    aspectRatio: null,
  }, ...items].slice(0, 24);
}

async function tmdbFetch(pathname, token, params) {
  const url = new URL(`${tmdbBaseUrl}${pathname}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.status_message || `TMDB returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function serveStatic(pathname, response) {
  const decodedPath = decodeURIComponent(pathname);
  const requestedPath = decodedPath.endsWith("/") ? `${decodedPath}index.html` : decodedPath;
  const safePath = normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = resolve(workspaceRoot, `.${safePath}`);

  if (!filePath.startsWith(workspaceRoot) || filePath.includes(`${join(workspaceRoot, ".git")}`) || /\/(?:\.env|scripts\/dev-server\.mjs|package(?:-lock)?\.json)$/.test(filePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  if (!existsSync(filePath) && !extname(filePath)) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  const extension = extname(filePath).toLowerCase();
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": mimeTypes.get(extension) || "application/octet-stream",
  });
  response.end(readFileSync(filePath));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, text) {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  response.end(text);
}

function loadEnvironment(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  readFileSync(filePath, "utf8").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separator = trimmed.indexOf("=");

    if (separator < 1) {
      return;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}
