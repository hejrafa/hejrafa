import {
  COLLECTION_VERSION,
  DEFAULT_TEMPLATE,
  calculateJCard,
  createCollectionExport,
  makeRecordId,
  suggestNextCatalogue,
  validateCollectionImport,
  validateRecord,
  validateTemplate,
} from "/yellow/assets/js/rewind-core.mjs";

const collectionStorageKey = "hejrafa-yellow-rewind-collection-v1";
const roots = document.querySelectorAll("[data-rewind-root]");

roots.forEach(setupRewind);

function setupRewind(root) {
  let collection = loadCollection();
  let state = blankState(collection);
  let searchController = null;

  root.innerHTML = getAppMarkup();

  const createView = root.querySelector('[data-rewind-view="create"]');
  const collectionView = root.querySelector('[data-rewind-view="collection"]');
  const searchForm = root.querySelector("[data-rewind-search-form]");
  const searchInput = root.querySelector("[data-rewind-search]");
  const searchButton = root.querySelector("[data-rewind-search-submit]");
  const searchResults = root.querySelector("[data-rewind-results]");
  const searchStatus = root.querySelector("[data-rewind-search-status]");
  const searchCard = root.querySelector("[data-rewind-search-card]");
  const preview = root.querySelector("[data-rewind-preview]");
  const appStatus = root.querySelector("[data-rewind-status]");
  const fileInput = root.querySelector("[data-rewind-import]");
  const artworkPicker = root.querySelector("[data-rewind-artwork]");

  hydrateControls();
  renderPreview();
  renderCollection();
  checkTmdbStatus();

  searchForm.addEventListener("submit", searchMovies);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleChange);
  root.addEventListener("click", handleClick);
  fileInput.addEventListener("change", importCollection);

  window.addEventListener("beforeprint", markPrinting);
  window.addEventListener("afterprint", stopPrinting);

  async function checkTmdbStatus() {
    try {
      const response = await fetch("/api/tmdb/status", { headers: { accept: "application/json" } });
      const payload = await response.json();

      if (!payload.configured) {
        setSearchStatus("Add TMDB_ACCESS_TOKEN to .env, then restart the local server.", "warning");
      }
    } catch {
      setSearchStatus("Run the site with npm run dev to enable private TMDB search.", "warning");
    }
  }

  async function searchMovies(event) {
    event.preventDefault();
    const query = searchInput.value.trim();

    if (query.length < 2) {
      setSearchStatus("Enter at least two characters.", "warning");
      return;
    }

    searchController?.abort();
    searchController = new AbortController();
    searchButton.disabled = true;
    searchButton.textContent = "Searching…";
    setSearchStatus(`Searching TMDB for “${query}”…`);
    searchResults.innerHTML = "";

    try {
      const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`, {
        headers: { accept: "application/json" },
        signal: searchController.signal,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "TMDB search failed.");
      }

      if (!payload.results?.length) {
        setSearchStatus("No movies found. Try the original title or a different spelling.", "warning");
        return;
      }

      setSearchStatus(`${payload.results.length} match${payload.results.length === 1 ? "" : "es"} found.`);
      searchResults.innerHTML = payload.results.map(renderSearchResult).join("");
    } catch (error) {
      if (error.name !== "AbortError") {
        setSearchStatus(error.message || "TMDB search failed.", "error");
      }
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = "Search";
    }
  }

  async function selectMovie(movieId, trigger) {
    trigger.disabled = true;
    trigger.setAttribute("aria-busy", "true");
    setSearchStatus("Loading movie details and director credits…");

    try {
      const response = await fetch(`/api/tmdb/movie/${encodeURIComponent(movieId)}`, { headers: { accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Movie details could not be loaded.");
      }

      state.movie = payload.movie;
      const backdropChoices = Array.isArray(state.movie.artwork?.backdrops) ? state.movie.artwork.backdrops : [];
      state.movie.backBackdropUrl ||= backdropChoices.find((artwork) => artwork.url !== state.movie.backdropUrl)?.url || state.movie.backdropUrl;
      state.movie.backAccentColor ||= state.movie.accentColor || "#d94a42";
      state.movie.backAccentInk ||= state.movie.accentInk || "#171411";
      state.recordId = null;
      state.catalogueNumber = suggestNextCatalogue(collection);
      state.poster = defaultCoverComposition();
      hydrateControls();
      renderPreview();
      setSearchStatus(`${payload.movie.title} is ready to edit.`);
      searchCard.open = false;
      updateArtworkAccents();
      root.querySelector("[data-rewind-editor-heading]")?.focus({ preventScroll: true });
    } catch (error) {
      setSearchStatus(error.message || "Movie details could not be loaded.", "error");
    } finally {
      trigger.disabled = false;
      trigger.removeAttribute("aria-busy");
    }
  }

  function handleInput(event) {
    const field = event.target.closest("[data-rewind-field]");

    if (!field) {
      return;
    }

    setNestedValue(state, field.dataset.rewindField, getControlValue(field));
    renderPreview();
    updateArtifactSummary();
  }

  function handleChange(event) {
    const field = event.target.closest("[data-rewind-field]");

    if (field?.dataset.rewindField === "previewMode") {
      setPreviewMode(field.value);
    }
  }

  function handleClick(event) {
    const artworkButton = event.target.closest("[data-rewind-artwork-url]");

    if (artworkButton && state.movie) {
      const fieldByKind = { "front-backdrop": "backdropUrl", "back-backdrop": "backBackdropUrl", logo: "logoUrl", poster: "posterUrl" };
      const field = fieldByKind[artworkButton.dataset.rewindArtworkKind] || "posterUrl";
      state.movie[field] = artworkButton.dataset.rewindArtworkUrl;
      renderArtworkPicker();
      renderPreview();

      if (["backdropUrl", "backBackdropUrl", "posterUrl"].includes(field)) {
        updateArtworkAccents();
      }

      return;
    }

    const clearArtwork = event.target.closest("[data-rewind-clear-artwork]");

    if (clearArtwork && state.movie) {
      const field = clearArtwork.dataset.rewindClearArtwork;
      state.movie[field] = "";
      renderArtworkPicker();
      renderPreview();

      if (["backdropUrl", "backBackdropUrl", "posterUrl"].includes(field)) {
        updateArtworkAccents();
      }

      return;
    }

    const searchResult = event.target.closest("[data-rewind-movie-id]");

    if (searchResult) {
      selectMovie(searchResult.dataset.rewindMovieId, searchResult);
      return;
    }

    const button = event.target.closest("[data-rewind-action]");

    if (!button) {
      return;
    }

    const { rewindAction: action, rewindId: id, rewindMode: mode } = button.dataset;

    if (action === "show-create") {
      showAppView("create");
    } else if (action === "show-collection") {
      showAppView("collection");
    } else if (action === "new") {
      state = blankState(collection);
      hydrateControls();
      renderPreview();
      showAppView("create");
      searchCard.open = true;
      searchInput.focus();
    } else if (action === "preview") {
      setPreviewMode(mode);
    } else if (action === "save") {
      saveRecord();
    } else if (action === "print") {
      setPreviewMode("sheet");
      document.body.classList.add("rewind-printing");
      window.setTimeout(() => window.print(), 80);
    } else if (action === "calibrate") {
      setPreviewMode("calibration");
    } else if (action === "edit") {
      openRecord(id);
    } else if (action === "duplicate") {
      duplicateRecord(id);
    } else if (action === "delete") {
      deleteRecord(id);
    } else if (action === "export") {
      exportCollection();
    } else if (action === "import") {
      fileInput.click();
    }
  }

  function saveRecord() {
    try {
      if (!state.movie) {
        throw new Error("Search for and select a movie before saving.");
      }

      const record = validateRecord({
        id: state.recordId || makeRecordId(),
        updatedAt: new Date().toISOString(),
        movie: state.movie,
        catalogueNumber: state.catalogueNumber,
        contentRating: state.contentRating,
        playbackUrl: state.playbackUrl,
        poster: state.poster,
        viewing: state.viewing,
        template: state.template,
      });
      const existingIndex = collection.findIndex((entry) => entry.id === record.id);

      if (existingIndex >= 0) {
        collection.splice(existingIndex, 1, record);
      } else {
        collection.push(record);
      }

      state.recordId = record.id;
      persistCollection(collection);
      renderCollection();
      setAppStatus(`${record.movie.title} saved.`, "success");
    } catch (error) {
      setAppStatus(error.message, "error");
    }
  }

  function openRecord(id) {
    const record = collection.find((entry) => entry.id === id);

    if (!record) {
      return;
    }

    state = stateFromRecord(record);
    hydrateControls();
    renderPreview();
    showAppView("create");
    searchCard.open = false;
    setAppStatus(`Editing ${record.movie.title}.`);
  }

  function duplicateRecord(id) {
    const record = collection.find((entry) => entry.id === id);

    if (!record) {
      return;
    }

    state = stateFromRecord({
      ...record,
      id: null,
      catalogueNumber: suggestNextCatalogue(collection),
      viewing: { ...record.viewing },
    });
    state.recordId = null;
    hydrateControls();
    renderPreview();
    showAppView("create");
    searchCard.open = false;
    setAppStatus(`Duplicated ${record.movie.title}; save when the new artifact is ready.`);
  }

  function deleteRecord(id) {
    const record = collection.find((entry) => entry.id === id);

    if (!record || !window.confirm(`Delete ${record.movie.title} from Rewind?`)) {
      return;
    }

    collection = collection.filter((entry) => entry.id !== id);
    persistCollection(collection);
    renderCollection();
    setAppStatus(`${record.movie.title} was deleted.`);
  }

  function exportCollection() {
    const backup = createCollectionExport(collection);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    downloadBlob(blob, `rewind-collection-${new Date().toISOString().slice(0, 10)}.json`);
    setAppStatus(`Exported ${collection.length} record${collection.length === 1 ? "" : "s"}.`, "success");
  }

  async function importCollection(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      if (file.size > 5_000_000) {
        throw new Error("That backup is larger than the 5 MB import limit.");
      }

      const incoming = validateCollectionImport(JSON.parse(await file.text()));
      const merged = new Map(collection.map((record) => [record.id, record]));
      incoming.records.forEach((record) => merged.set(record.id, record));
      collection = [...merged.values()];
      persistCollection(collection);
      renderCollection();
      showAppView("collection");
      setAppStatus(`Imported ${incoming.records.length} record${incoming.records.length === 1 ? "" : "s"}.`, "success");
    } catch (error) {
      setAppStatus(error instanceof SyntaxError ? "That file is not valid JSON." : error.message, "error");
    } finally {
      event.target.value = "";
    }
  }

  function renderCollection() {
    const grid = root.querySelector("[data-rewind-collection-grid]");
    const count = root.querySelector("[data-rewind-collection-count]");
    count.textContent = `${collection.length} artifact${collection.length === 1 ? "" : "s"}`;

    if (!collection.length) {
      grid.innerHTML = `
        <div class="rewind-empty-collection">
          <span aria-hidden="true">↺</span>
          <h3>Your shelves are quiet.</h3>
          <p>Select a movie, make its cassette artifact, then save it here.</p>
          <button class="rewind-button rewind-button--ink" type="button" data-rewind-action="show-create">Create the first one</button>
        </div>`;
      return;
    }

    grid.innerHTML = collection
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(renderCollectionCard)
      .join("");
  }

  function renderArtworkPicker() {
    if (!state.movie) {
      artworkPicker.innerHTML = '<p class="rewind-artwork-empty">Select a movie to see its available artwork.</p>';
      return;
    }

    const posters = Array.isArray(state.movie.artwork?.posters) ? state.movie.artwork.posters : [];
    const backdrops = Array.isArray(state.movie.artwork?.backdrops) ? state.movie.artwork.backdrops : [];
    const logos = Array.isArray(state.movie.artwork?.logos) ? state.movie.artwork.logos : [];
    artworkPicker.innerHTML = `
      ${renderArtworkRow("Front face backdrop", "front-backdrop", backdrops, state.movie.backdropUrl)}
      ${renderArtworkRow("Back face backdrop", "back-backdrop", backdrops, state.movie.backBackdropUrl)}
      ${renderArtworkRow("Collection poster", "poster", posters, state.movie.posterUrl)}
      ${renderArtworkRow("Title design", "logo", logos, state.movie.logoUrl, true)}
    `;
  }

  async function updateArtworkAccents() {
    if (!state.movie) {
      return;
    }

    const frontSource = state.movie.backdropUrl || state.movie.posterUrl;
    const backSource = state.movie.backBackdropUrl || state.movie.backdropUrl || state.movie.posterUrl;
    const [frontAccent, backAccent] = await Promise.all([
      extractDominantColor(frontSource),
      extractDominantColor(backSource),
    ]);

    if (!state.movie || frontSource !== (state.movie.backdropUrl || state.movie.posterUrl) || backSource !== (state.movie.backBackdropUrl || state.movie.backdropUrl || state.movie.posterUrl)) {
      return;
    }

    state.movie.accentColor = frontAccent || "#d94a42";
    state.movie.accentInk = getContrastColor(state.movie.accentColor);
    state.movie.backAccentColor = backAccent || state.movie.accentColor;
    state.movie.backAccentInk = getContrastColor(state.movie.backAccentColor);
    renderPreview();
  }

  function renderPreview() {
    const controls = safeTemplate(state.template);

    if (state.previewMode === "jcard") {
      preview.innerHTML = `<div class="rewind-artifact-stage rewind-artifact-stage--jcard">${renderJCardPair(state, controls)}</div>`;
    } else if (state.previewMode === "ticket") {
      preview.innerHTML = `<div class="rewind-ticket-stage">${renderTicket(state, controls, "front")}${renderTicket(state, controls, "back")}</div>`;
    } else if (state.previewMode === "calibration") {
      preview.innerHTML = renderCalibrationSheet();
    } else {
      preview.innerHTML = renderPrintSheets(state, controls);
    }

    root.querySelectorAll("[data-rewind-action='preview']").forEach((button) => {
      const selected = button.dataset.rewindMode === state.previewMode;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    updateArtifactSummary();
  }

  function hydrateControls() {
    root.querySelectorAll("[data-rewind-field]").forEach((field) => {
      const value = getNestedValue(state, field.dataset.rewindField);

      if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else if (value == null) {
        field.value = "";
      } else {
        field.value = value;
      }
    });

    renderArtworkPicker();
    updateArtifactSummary();
  }

  function updateArtifactSummary() {
    const title = root.querySelector("[data-rewind-current-title]");
    const saveButton = root.querySelector('[data-rewind-action="save"]');
    const printButton = root.querySelector('[data-rewind-action="print"]');
    const hasMovie = Number.isInteger(Number(state.movie?.tmdbId));
    title.textContent = state.movie?.title || "No movie selected";
    saveButton.disabled = !hasMovie;
    printButton.disabled = !hasMovie;
  }

  function setPreviewMode(mode) {
    if (!["jcard", "ticket", "sheet", "calibration"].includes(mode)) {
      return;
    }

    state.previewMode = mode;
    renderPreview();
  }

  function showAppView(view) {
    const showingCollection = view === "collection";
    createView.hidden = showingCollection;
    collectionView.hidden = !showingCollection;
    root.querySelectorAll("[data-rewind-action^='show-']").forEach((button) => {
      const selected = button.dataset.rewindAction === `show-${view}`;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function setSearchStatus(message, tone = "neutral") {
    searchStatus.textContent = message;
    searchStatus.dataset.tone = tone;
  }

  function setAppStatus(message, tone = "neutral") {
    appStatus.textContent = message;
    appStatus.dataset.tone = tone;
  }

  function markPrinting() {
    if (document.body.dataset.view === "rewind") {
      if (!["sheet", "calibration"].includes(state.previewMode)) {
        state.previewMode = "sheet";
        renderPreview();
      }

      document.body.classList.add("rewind-printing");
    }
  }

  function stopPrinting() {
    document.body.classList.remove("rewind-printing");
  }
}

function getAppMarkup() {
  return `
    <header class="rewind-hero">
      <h1>Rewind</h1>
      <div class="rewind-view-switch" aria-label="Rewind views">
        <button class="is-selected" type="button" data-rewind-action="show-create" aria-pressed="true">Create</button>
        <button type="button" data-rewind-action="show-collection" aria-pressed="false">Collection</button>
      </div>
    </header>

    <p class="rewind-app-status" data-rewind-status aria-live="polite"></p>

    <section data-rewind-view="create" aria-label="Create a Rewind artifact">
      <details class="rewind-search-card" data-rewind-search-card open>
        <summary>Find a movie</summary>
        <div class="rewind-search-body">
          <form class="rewind-search-form" data-rewind-search-form role="search">
            <label class="visually-hidden" for="rewind-movie-search">Find a movie</label>
            <div>
              <input id="rewind-movie-search" type="search" autocomplete="off" placeholder="Perfect Days" data-rewind-search>
              <button type="submit" data-rewind-search-submit>Search</button>
            </div>
          </form>
          <p class="rewind-search-status" data-rewind-search-status aria-live="polite">Search by title to begin.</p>
          <div class="rewind-search-results" data-rewind-results></div>
        </div>
      </details>

      <div class="rewind-workspace">
        <div class="rewind-editor-bar">
          <div class="visually-hidden">
            <strong data-rewind-current-title>No movie selected</strong>
          </div>
          <div class="rewind-side-actions">
            <button class="rewind-button rewind-button--ink" type="button" data-rewind-action="new">New</button>
            <button class="rewind-button rewind-button--ink" type="button" data-rewind-action="save" disabled>Save</button>
            <button class="rewind-button rewind-button--ink" type="button" data-rewind-action="print">Print</button>
          </div>
        </div>

        <div class="rewind-editor">
        <aside class="rewind-controls" aria-label="Artifact editor controls">
          <h2 id="rewind-editor-heading" data-rewind-editor-heading tabindex="-1">Artifact details</h2>
          <details open>
            <summary>Movie</summary>
            <div class="rewind-field-grid">
              ${textField("Title", "movie.title")}
              ${textField("Original title", "movie.originalTitle")}
              ${textField("Year", "movie.year", "text", "1999")}
              ${textField("Director", "movie.director")}
              ${textField("Runtime (minutes)", "movie.runtime", "number", "120", 'min="0" max="1000"')}
              ${textAreaField("Synopsis", "movie.synopsis")}
            </div>
          </details>

          <details open>
            <summary>Archive</summary>
            ${textField("Content rating", "contentRating", "text", "12")}
            ${textField("Playback deep link or URL", "playbackUrl", "url", "shortcuts://…")}
          </details>

          <details open>
            <summary>Artwork</summary>
            <div class="rewind-artwork-picker" data-rewind-artwork></div>
          </details>

          <details open>
            <summary>Face composition</summary>
            <div class="rewind-range-grid">
              ${rangeField("Front zoom", "poster.zoom", 1, 2.5, 0.05)}
              ${rangeField("Front horizontal", "poster.x", 0, 100, 1)}
              ${rangeField("Front vertical", "poster.y", 0, 100, 1)}
              ${rangeField("Back zoom", "poster.backZoom", 1, 2.5, 0.05)}
              ${rangeField("Back horizontal", "poster.backX", 0, 100, 1)}
              ${rangeField("Back vertical", "poster.backY", 0, 100, 1)}
              ${rangeField("Title size", "poster.logoScale", 0.4, 1.8, 0.05)}
              ${rangeField("Title horizontal", "poster.logoX", 0, 100, 1)}
              ${rangeField("Title vertical", "poster.logoY", 0, 100, 1)}
            </div>
          </details>

          <details>
            <summary>Viewing history</summary>
            <div class="rewind-field-grid rewind-field-grid--two">
              ${textField("Date watched", "viewing.dateWatched", "date")}
              ${textField("Location", "viewing.location")}
              ${textField("Watched with", "viewing.watchedWith")}
              <label class="rewind-field"><span>Rating</span><select data-rewind-field="viewing.rating"><option value="">Blank</option>${ratingOptions()}</select></label>
            </div>
            ${textField("One-line reaction", "viewing.reaction")}
            <label class="rewind-check"><input type="checkbox" data-rewind-field="viewing.rewatch"><span>Rewatch</span></label>
          </details>

          <details>
            <summary>Physical template</summary>
            <p class="rewind-details-note">All measurements are in millimetres.</p>
            <div class="rewind-field-grid rewind-field-grid--two">
              ${numberField("Front width", "template.frontWidth")}
              ${numberField("Front height", "template.frontHeight")}
              ${numberField("Spine width", "template.spineWidth")}
              ${numberField("Back / flap width", "template.backWidth")}
              ${numberField("Bleed", "template.bleed", 0)}
              ${numberField("Safe area", "template.safeArea", 0)}
              ${numberField("Ticket width", "template.ticketWidth")}
              ${numberField("Ticket height", "template.ticketHeight")}
            </div>
            <button class="rewind-text-button" type="button" data-rewind-action="calibrate">Open calibration print</button>
          </details>

          <details>
            <summary>Print options</summary>
            <div class="rewind-field-grid rewind-field-grid--two">
              ${numberField("Ticket copies", "print.copies", 1, 12, 1)}
              <label class="rewind-field"><span>Library card print</span><select data-rewind-field="print.side"><option value="both">Duplex: front + back</option><option value="front">Front only</option><option value="back">Back only</option></select></label>
            </div>
            <label class="rewind-check"><input type="checkbox" data-rewind-field="print.cropMarks"><span>Crop marks</span></label>
            <label class="rewind-check"><input type="checkbox" data-rewind-field="print.foldMarks"><span>Fold marks</span></label>
            <label class="rewind-check"><input type="checkbox" data-rewind-field="print.bleed"><span>Show bleed</span></label>
            <p class="rewind-print-warning">Pages are duplex pairs: each back page is positioned directly behind the page before it. Print at 100% / Actual size, flip on the long edge, and enable background graphics. “Fit to page” changes every physical measurement.</p>
          </details>
        </aside>

        <section class="rewind-preview-column" aria-label="Live artifact preview">
          <div class="rewind-preview-switch" aria-label="Preview type">
            <button class="is-selected" type="button" data-rewind-action="preview" data-rewind-mode="jcard" aria-pressed="true">J-card</button>
            <button type="button" data-rewind-action="preview" data-rewind-mode="ticket" aria-pressed="false">Ticket</button>
            <button type="button" data-rewind-action="preview" data-rewind-mode="sheet" aria-pressed="false">A4 sheet</button>
          </div>
          <div class="rewind-preview" data-rewind-preview></div>
        </section>
        </div>
      </div>
    </section>

    <section data-rewind-view="collection" aria-label="Rewind collection" hidden>
      <div class="rewind-collection-head">
        <div><h2>Your collection</h2><p data-rewind-collection-count>0 artifacts</p></div>
        <div>
          <button class="rewind-button" type="button" data-rewind-action="import">Import JSON</button>
          <button class="rewind-button rewind-button--ink" type="button" data-rewind-action="export">Export JSON</button>
          <input class="visually-hidden" type="file" accept="application/json,.json" data-rewind-import>
        </div>
      </div>
      <div class="rewind-collection-grid" data-rewind-collection-grid></div>
    </section>

    <footer class="rewind-tmdb-credit" aria-label="Credits">
      <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" aria-label="The Movie Database">
        <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg" alt="TMDB">
      </a>
      <p>Movie metadata and artwork from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </footer>`;
}

function renderSearchResult(movie) {
  return `
    <button class="rewind-search-result" type="button" data-rewind-movie-id="${Number(movie.id)}">
      <span class="rewind-result-poster">${movie.posterUrl ? `<img src="${escapeAttribute(movie.posterUrl)}" alt="">` : "<span>No poster</span>"}</span>
      <span><strong>${escapeHtml(movie.title)}</strong><small>${escapeHtml(movie.year || "Year unknown")}${movie.originalTitle && movie.originalTitle !== movie.title ? ` · ${escapeHtml(movie.originalTitle)}` : ""}</small></span>
      <span aria-hidden="true">→</span>
    </button>`;
}

function renderCollectionCard(record) {
  const rating = record.viewing.rating == null ? "Unrated" : `${record.viewing.rating} / 5`;
  const accent = /^#[0-9a-f]{6}$/i.test(record.movie.accentColor || "") ? record.movie.accentColor : "#c85d68";
  const accentInk = /^#[0-9a-f]{6}$/i.test(record.movie.accentInk || "") ? record.movie.accentInk : "#171411";
  const poster = record.movie.posterUrl;
  const backdrop = record.movie.backdropUrl || poster;
  return `
    <article class="rewind-collection-card" style="--collection-accent:${escapeAttribute(accent)};--collection-ink:${escapeAttribute(accentInk)}">
      <div class="rewind-collection-stack" aria-hidden="true">
        <span class="rewind-collection-stack-card rewind-collection-stack-card--left">${backdrop ? `<img src="${escapeAttribute(backdrop)}" alt="">` : ""}</span>
        <span class="rewind-collection-stack-card rewind-collection-stack-card--right">${poster ? `<img src="${escapeAttribute(poster)}" alt="">` : ""}</span>
      </div>
      <div class="rewind-collection-ticket">
        <div class="rewind-collection-poster">${poster ? `<img src="${escapeAttribute(poster)}" alt="Poster for ${escapeAttribute(record.movie.title)}">` : "<span>No poster</span>"}</div>
        <div class="rewind-collection-copy">
          <h3>${escapeHtml(record.movie.title)}</h3>
          <div class="rewind-collection-meta"><span>${escapeHtml(record.movie.year)}</span><span>${escapeHtml(rating)}</span></div>
          <span class="rewind-collection-barcode" aria-hidden="true"></span>
          <div class="rewind-collection-actions">
            <button type="button" data-rewind-action="edit" data-rewind-id="${escapeAttribute(record.id)}">Edit</button>
            <button type="button" data-rewind-action="duplicate" data-rewind-id="${escapeAttribute(record.id)}">Duplicate</button>
            <button type="button" data-rewind-action="delete" data-rewind-id="${escapeAttribute(record.id)}">Delete</button>
          </div>
        </div>
      </div>
    </article>`;
}

function renderArtworkRow(label, kind, options, selectedUrl, allowNone = false) {
  const choices = options.length
    ? options.map((option, index) => {
        const selected = option.url === selectedUrl;
        return `
          <button class="rewind-artwork-option${selected ? " is-selected" : ""}" type="button" data-rewind-artwork-url="${escapeAttribute(option.url)}" data-rewind-artwork-kind="${kind}" aria-pressed="${selected}" aria-label="Use ${label.toLowerCase()} option ${index + 1}">
            <img src="${escapeAttribute(option.thumbnailUrl)}" alt="">
            <span>${selected ? "Selected" : String(index + 1).padStart(2, "0")}</span>
          </button>`;
      }).join("")
    : '<p class="rewind-artwork-empty">No options available.</p>';
  const clearFieldByKind = { logo: "logoUrl", "front-backdrop": "backdropUrl", "back-backdrop": "backBackdropUrl" };
  const clearField = clearFieldByKind[kind] || "posterUrl";
  const clearLabel = kind === "logo" ? "Use title text" : "No backdrop";
  const noneButton = allowNone
    ? `<button class="rewind-artwork-option rewind-artwork-option--none${selectedUrl ? "" : " is-selected"}" type="button" data-rewind-clear-artwork="${clearField}" aria-pressed="${!selectedUrl}"><span>${clearLabel}</span></button>`
    : "";

  return `
    <section class="rewind-artwork-group">
      <h3>${label}</h3>
      <div class="rewind-artwork-strip">${noneButton}${choices}</div>
    </section>`;
}

function renderJCardPair(state, template) {
  return `
    <div class="rewind-jcard-pair">
      <div class="rewind-jcard-face-preview">
        <span>Front face · small side / spine / cover</span>
        ${renderJCard(state, template, "outside")}
      </div>
      <div class="rewind-jcard-face-preview">
        <span>Back face · inside cover / spine / NFC</span>
        ${renderJCard(state, template, "inside")}
      </div>
    </div>`;
}

function renderJCard(state, template, face = "outside") {
  const dimensions = calculateJCard(template);
  const showGuides = state.previewMode === "sheet";
  const classes = [
    "rewind-jcard",
    `rewind-jcard--${face}`,
    showGuides && state.print.cropMarks ? "has-crop-marks" : "",
    showGuides && state.print.foldMarks ? "has-fold-marks" : "",
    showGuides && state.print.bleed ? "has-bleed" : "",
  ].filter(Boolean).join(" ");
  const movie = state.movie;
  const title = movie?.title || "Search for a movie";
  const runtime = formatRuntime(movie?.runtime);
  const original = movie?.originalTitle && movie.originalTitle !== movie.title ? movie.originalTitle : "ORIGINAL TITLE";
  const synopsis = movie?.synopsis || "Select a TMDB result to place real movie metadata and artwork on this J-card.";
  const selectedLogo = movie?.artwork?.logos?.find((artwork) => artwork.url === movie.logoUrl);
  const logoClass = Number(selectedLogo?.aspectRatio) > 0 && Number(selectedLogo.aspectRatio) < 1.15 ? " is-portrait" : "";
  const frontBackdrop = movie?.backdropUrl || movie?.posterUrl;
  const backBackdrop = movie?.backBackdropUrl || frontBackdrop;
  const faceBackdrop = face === "inside" ? backBackdrop : frontBackdrop;
  const faceBackdropStyle = face === "inside"
    ? `object-position:${state.poster.backX}% ${state.poster.backY}%;transform:scale(${state.poster.backZoom})`
    : `object-position:${state.poster.x}% ${state.poster.y}%;transform:scale(${state.poster.zoom})`;
  const coverLogoStyle = `--rw-cover-logo-x:${state.poster.logoX}%;--rw-cover-logo-y:${state.poster.logoY}%;--rw-cover-logo-scale:${state.poster.logoScale}`;
  const visibleBleed = showGuides && state.print.bleed ? template.bleed : 0;
  const style = [
    `--rw-back:${template.backWidth}mm`,
    `--rw-spine:${template.spineWidth}mm`,
    `--rw-front:${template.frontWidth}mm`,
    `--rw-height:${template.frontHeight}mm`,
    `--rw-bleed:${visibleBleed}mm`,
    `--rw-safe:${template.safeArea}mm`,
    `--rw-accent:${movie?.accentColor || "#d94a42"}`,
    `--rw-accent-ink:${movie?.accentInk || "#171411"}`,
    `--rw-back-accent:${movie?.backAccentColor || movie?.accentColor || "#d94a42"}`,
    `--rw-back-accent-ink:${movie?.backAccentInk || movie?.accentInk || "#171411"}`,
    `width:${showGuides && state.print.bleed ? dimensions.sheetWidth : dimensions.trimWidth}mm`,
    `height:${showGuides && state.print.bleed ? dimensions.sheetHeight : dimensions.trimHeight}mm`,
  ].join(";");

  const outside = `
    <section class="rewind-jcard-back-panel">
      <div class="rewind-jcard-back-facts">
        <strong>${escapeHtml(movie?.year || "YEAR")}</strong>
        <strong>${escapeHtml(runtime)}</strong>
        <strong>${escapeHtml(movie?.genres || "GENRE")}</strong>
      </div>
      <dl class="rewind-jcard-back-credits">
        <div><dd>${escapeHtml(movie?.director || "—")}</dd><dt>Director</dt></div>
        <div><dd>${escapeHtml(movie?.screenplay || "—")}</dd><dt>Screenplay</dt></div>
        ${movie?.originalTitle && movie.originalTitle !== movie.title ? `<div><dd>${escapeHtml(original)}</dd><dt>Original title</dt></div>` : ""}
      </dl>
    </section>
    <section class="rewind-jcard-spine">
      <div class="rewind-spine-title">${movie?.logoUrl ? `<img class="${logoClass.trim()}" src="${escapeAttribute(movie.logoUrl)}" alt="">` : `<strong>${escapeHtml(title)}</strong>`}</div>
    </section>
    <section class="rewind-jcard-front">
      ${faceBackdrop ? "" : "<div class=\"rewind-poster-empty\">Backdrop artwork appears here</div>"}
      <div class="rewind-cover-title" style="${coverLogoStyle}">${movie?.logoUrl ? `<img class="${logoClass.trim()}" src="${escapeAttribute(movie.logoUrl)}" alt="">` : `<strong>${escapeHtml(title)}</strong>`}</div>
    </section>`;

  const inside = `
    <section class="rewind-jcard-inside-main">
      <p class="rewind-jcard-inside-copy">${escapeHtml(synopsis)}</p>
      ${renderStudioLogos(movie?.studios)}
    </section>
    <section class="rewind-jcard-inside-spine" aria-label="Blank inside spine"></section>
    <section class="rewind-jcard-inside-flap">
      <span class="rewind-nfc-placement" aria-label="NFC sticker position">NFC</span>
    </section>`;

  return `
    <article class="${classes}" style="${style}" aria-label="Cassette J-card ${face} preview">
      <div class="rewind-jcard-trim">
        ${faceBackdrop ? `<img class="rewind-jcard-face-backdrop" src="${escapeAttribute(faceBackdrop)}" alt="" style="${faceBackdropStyle}">` : ""}
        ${face === "inside" ? inside : outside}
      </div>
      <span class="rewind-fold-guide rewind-fold-guide--one" aria-hidden="true"></span>
      <span class="rewind-fold-guide rewind-fold-guide--two" aria-hidden="true"></span>
    </article>`;
}

function renderTicket(state, template, side) {
  const movie = state.movie;
  const title = movie?.title || "Search for a movie";
  const style = `--rw-ticket-w:${template.ticketWidth}mm;--rw-ticket-h:${template.ticketHeight}mm;width:${template.ticketWidth}mm;height:${template.ticketHeight}mm`;

  if (side === "back") {
    return `
      <article class="rewind-ticket rewind-ticket--back rewind-library-card" style="${style}" aria-label="Library card back">
        <div class="rewind-library-heading rewind-library-heading--single"><strong>WATCH LOYALTY CARD</strong></div>
        <div class="rewind-loyalty-intro">
          <h3>${escapeHtml(title)}</h3>
          <p>ONE STAMP FOR EVERY WATCH</p>
        </div>
        <div class="rewind-loyalty-grid">${renderLoyaltySlots(state.viewing.dateWatched)}</div>
      </article>`;
  }

  return `
    <article class="rewind-ticket rewind-ticket--front rewind-library-card" style="${style}" aria-label="Library card front">
      <div class="rewind-library-heading rewind-library-heading--single"><strong>CATALOGUE CARD</strong></div>
      <div class="rewind-library-title">
        <span>TITLE</span>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <div class="rewind-library-meta">
        <div><span>DIRECTOR</span><strong>${escapeHtml(movie?.director || "")}</strong></div>
        <div><span>YEAR</span><strong>${escapeHtml(movie?.year || "")}</strong></div>
        <div><span>RUN TIME</span><strong>${movie?.runtime ? `${movie.runtime} MIN` : ""}</strong></div>
        <div><span>CONTENT RATING</span><strong>${escapeHtml(state.contentRating || "")}</strong></div>
      </div>
      <span class="rewind-library-stamp rewind-library-stamp--front">ARCHIVE</span>
    </article>`;
}

function renderPrintSheets(state, template) {
  const copies = Math.min(12, Math.max(1, Number(state.print.copies) || 1));
  const ticketFronts = state.print.side === "back" ? [] : Array.from({ length: copies }, () => "front");
  const ticketBacks = state.print.side === "front" ? [] : Array.from({ length: copies }, () => "back");
  const firstFronts = ticketFronts.slice(0, 4);
  const firstBacks = ticketBacks.slice(0, 4);
  const pages = [
    `<section class="rewind-print-sheet rewind-print-sheet--duplex-front" data-rewind-duplex-pair="1" data-rewind-duplex-side="front">
      <p class="rewind-print-note">FRONT FACE + CARD FRONTS · ACTUAL SIZE · DUPLEX LONG EDGE</p>
      ${renderJCard(state, template, "outside")}
      <div class="rewind-print-ticket-grid">${firstFronts.map((side) => renderTicket(state, template, side)).join("")}</div>
    </section>`,
    `<section class="rewind-print-sheet rewind-print-sheet--jcard-inside rewind-print-sheet--duplex-back" data-rewind-duplex-pair="1" data-rewind-duplex-side="back">
      <p class="rewind-print-note">BACK FACE + CARD BACKS · PRINT ON REVERSE · FLIP ON LONG EDGE</p>
      ${renderJCard(state, template, "inside")}
      <div class="rewind-print-ticket-grid">${firstBacks.map((side) => renderTicket(state, template, side)).join("")}</div>
    </section>`,
  ];
  let remainingFronts = ticketFronts.slice(4);
  let remainingBacks = ticketBacks.slice(4);
  let pair = 2;

  while (remainingFronts.length || remainingBacks.length) {
    const pageFronts = remainingFronts.slice(0, 8);
    const pageBacks = remainingBacks.slice(0, 8);
    remainingFronts = remainingFronts.slice(8);
    remainingBacks = remainingBacks.slice(8);

    if (pageFronts.length) {
      pages.push(`<section class="rewind-print-sheet rewind-print-sheet--tickets rewind-print-sheet--duplex-front" data-rewind-duplex-pair="${pair}" data-rewind-duplex-side="front"><p class="rewind-print-note">CARD FRONTS · ACTUAL SIZE · DUPLEX LONG EDGE</p><div class="rewind-print-ticket-grid">${pageFronts.map((side) => renderTicket(state, template, side)).join("")}</div></section>`);
    }

    if (pageBacks.length) {
      pages.push(`<section class="rewind-print-sheet rewind-print-sheet--tickets rewind-print-sheet--duplex-back" data-rewind-duplex-pair="${pair}" data-rewind-duplex-side="back"><p class="rewind-print-note">CARD BACKS · PRINT ON REVERSE · FLIP ON LONG EDGE</p><div class="rewind-print-ticket-grid">${pageBacks.map((side) => renderTicket(state, template, side)).join("")}</div></section>`);
    }

    pair += 1;
  }

  return `<div class="rewind-print-pages">${pages.join("")}</div>`;
}

function renderCalibrationSheet() {
  const ticks = Array.from({ length: 101 }, (_, index) => `<i class="${index % 10 === 0 ? "is-major" : index % 5 === 0 ? "is-mid" : ""}" style="left:${index}mm"><span>${index % 10 === 0 ? index : ""}</span></i>`).join("");
  return `
    <div class="rewind-print-pages">
      <section class="rewind-print-sheet rewind-calibration">
        <p class="rewind-print-note">CALIBRATION · PRINT AT 100% / ACTUAL SIZE</p>
        <h2>Before the first movie.</h2>
        <p>Print this page with scaling disabled. Measure both references with a physical ruler.</p>
        <div class="rewind-ruler" aria-label="100 millimetre ruler">${ticks}</div>
        <div class="rewind-calibration-square"><span>50 × 50 mm</span></div>
        <p class="rewind-calibration-check">If either measurement is wrong, turn off “Fit to page” and print again at 100%.</p>
      </section>
    </div>`;
}

function textField(label, path, type = "text", placeholder = "", extra = "") {
  return `<label class="rewind-field"><span>${label}</span><input type="${type}" placeholder="${placeholder}" data-rewind-field="${path}" ${extra}></label>`;
}

function textAreaField(label, path) {
  return `<label class="rewind-field rewind-field--wide"><span>${label}</span><textarea rows="5" data-rewind-field="${path}"></textarea></label>`;
}

function numberField(label, path, min = 0.1, max = 300, step = 0.5) {
  return `<label class="rewind-field"><span>${label}</span><input type="number" min="${min}" max="${max}" step="${step}" inputmode="decimal" data-rewind-field="${path}"></label>`;
}

function rangeField(label, path, min, max, step) {
  return `<label class="rewind-range"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" data-rewind-field="${path}"></label>`;
}

function ratingOptions() {
  return Array.from({ length: 11 }, (_, index) => {
    const rating = index / 2;
    return `<option value="${rating}">${rating.toFixed(1)} / 5</option>`;
  }).join("");
}

function renderLoyaltySlots(dateWatched) {
  const date = String(dateWatched || "").trim();
  const printedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split("-").reverse().join(".") : date;

  return Array.from({ length: 8 }, (_, index) => {
    const isFilled = index === 0 && printedDate;
    const classes = `rewind-loyalty-slot${isFilled ? " is-filled" : ""}`;
    const time = isFilled
      ? `<time datetime="${escapeAttribute(date)}">${escapeHtml(printedDate)}</time>`
      : "<time>DATE</time>";

    return `<div class="${classes}"><span class="rewind-loyalty-circle" aria-hidden="true">${isFilled ? "★" : ""}</span>${time}</div>`;
  }).join("");
}

function formatRuntime(minutes) {
  const value = Number(minutes);

  if (!Number.isFinite(value) || value <= 0) {
    return "RUNTIME";
  }

  const hours = Math.floor(value / 60);
  const remainder = Math.round(value % 60);
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function renderStudioLogos(studios) {
  const available = (Array.isArray(studios) ? studios : []).filter((studio) => studio?.logoUrl).slice(0, 4);

  if (!available.length) {
    return "";
  }

  return `<div class="rewind-jcard-studio-logos" aria-label="Production studios">${available.map((studio) => `<img src="${escapeAttribute(studio.logoUrl)}" alt="${escapeAttribute(studio.name || "Studio")}">`).join("")}</div>`;
}

function blankState(collection) {
  return {
    recordId: null,
    movie: null,
    catalogueNumber: suggestNextCatalogue(collection),
    contentRating: "",
    playbackUrl: "",
    poster: defaultCoverComposition(),
    viewing: { dateWatched: "", location: "", watchedWith: "", rating: null, reaction: "", rewatch: false },
    template: { ...DEFAULT_TEMPLATE },
    print: { copies: 1, side: "both", cropMarks: true, foldMarks: true, bleed: true },
    previewMode: "jcard",
  };
}

function stateFromRecord(record) {
  return {
    recordId: record.id,
    movie: { ...record.movie },
    catalogueNumber: record.catalogueNumber,
    contentRating: record.contentRating,
    playbackUrl: record.playbackUrl,
    poster: { ...defaultCoverComposition(), ...record.poster },
    viewing: { ...record.viewing },
    template: migrateLegacyTemplate(record.template),
    print: { copies: 1, side: "both", cropMarks: true, foldMarks: true, bleed: true },
    previewMode: "jcard",
  };
}

function defaultCoverComposition() {
  return { zoom: 1, x: 50, y: 50, backZoom: 1, backX: 50, backY: 50, logoScale: 1, logoX: 50, logoY: 80 };
}

function loadCollection() {
  try {
    const raw = localStorage.getItem(collectionStorageKey);
    return raw ? validateCollectionImport(JSON.parse(raw)).records : [];
  } catch {
    return [];
  }
}

function persistCollection(records) {
  localStorage.setItem(collectionStorageKey, JSON.stringify({ version: COLLECTION_VERSION, records }));
}

function safeTemplate(template) {
  try {
    return validateTemplate(template);
  } catch {
    const fallback = { ...DEFAULT_TEMPLATE };
    Object.keys(fallback).forEach((key) => {
      const value = Number(template[key]);
      if (Number.isFinite(value) && value >= 0) {
        fallback[key] = value || fallback[key];
      }
    });
    return fallback;
  }
}

function migrateLegacyTemplate(template) {
  const value = { ...DEFAULT_TEMPLATE, ...template };
  const legacyDefaults = Number(value.frontWidth) === 101.5
    && Number(value.frontHeight) === 101.5
    && Number(value.spineWidth) === 12.5
    && Number(value.backWidth) === 63.5;
  const previousDefaults = Number(value.frontWidth) === 65
    && Number(value.frontHeight) === 102
    && Number(value.spineWidth) === 12
    && Number(value.backWidth) === 26;

  return legacyDefaults || previousDefaults
    ? { ...value, frontWidth: 65, frontHeight: 101.5, spineWidth: 12, backWidth: 27 }
    : value;
}

function getControlValue(field) {
  if (field.type === "checkbox") {
    return field.checked;
  }

  if (field.type === "number" || field.type === "range") {
    return field.value === "" ? "" : Number(field.value);
  }

  if (field.dataset.rewindField === "viewing.rating") {
    return field.value === "" ? null : Number(field.value);
  }

  return field.value;
}

function getNestedValue(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function setNestedValue(object, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    return current[key];
  }, object);
  target[last] = value;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function extractDominantColor(url, { requireColor = false } = {}) {
  if (!url) {
    return requireColor ? null : "#d94a42";
  }

  try {
    const image = await new Promise((resolve, reject) => {
      const candidate = new Image();
      candidate.onload = () => resolve(candidate);
      candidate.onerror = reject;
      candidate.src = `/api/tmdb/image?url=${encodeURIComponent(url)}`;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const allBins = new Map();
    const colorBins = new Map();
    let opaquePixels = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 120) {
        continue;
      }

      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const maximum = Math.max(red, green, blue);
      const minimum = Math.min(red, green, blue);
      const chroma = maximum - minimum;
      const lightness = (maximum + minimum) / 510;
      opaquePixels += 1;
      addColorBin(allBins, red, green, blue);

      if (chroma >= 38 && maximum >= 64 && lightness >= 0.16 && lightness <= 0.88) {
        addColorBin(colorBins, red, green, blue);
      }
    }

    if (requireColor && !colorBins.size) {
      return null;
    }

    const strongSupport = Math.max(4, Math.round(opaquePixels * 0.0015));
    const lightSupport = Math.max(2, Math.round(opaquePixels * 0.00045));
    const vividStrongBins = [...colorBins.values()].filter((bin) => bin.count >= strongSupport);
    const vividLightBins = [...colorBins.values()].filter((bin) => bin.count >= lightSupport);
    const fallbackBins = [...allBins.values()].filter((bin) => bin.count >= lightSupport);
    const bins = vividStrongBins.length ? vividStrongBins : vividLightBins.length ? vividLightBins : fallbackBins;
    const winner = bins.sort((a, b) => dominantColorScore(b) - dominantColorScore(a))[0];

    if (!winner) {
      return requireColor ? null : "#d94a42";
    }

    return rgbToHex(Math.round(winner.red / winner.count), Math.round(winner.green / winner.count), Math.round(winner.blue / winner.count));
  } catch {
    return requireColor ? null : "#d94a42";
  }
}

function addColorBin(bins, red, green, blue) {
  const key = `${Math.round(red / 24)}-${Math.round(green / 24)}-${Math.round(blue / 24)}`;
  const bin = bins.get(key) || { red: 0, green: 0, blue: 0, count: 0 };
  bin.red += red;
  bin.green += green;
  bin.blue += blue;
  bin.count += 1;
  bins.set(key, bin);
}

function dominantColorScore(bin) {
  const red = bin.red / bin.count;
  const green = bin.green / bin.count;
  const blue = bin.blue / bin.count;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const saturation = maximum ? (maximum - minimum) / maximum : 0;
  const lightness = (maximum + minimum) / 510;
  const balancedLightness = 1 - Math.min(1, Math.abs(lightness - 0.55) / 0.55);

  return bin.count
    * (0.72 + saturation * 0.28)
    * (0.68 + balancedLightness * 0.32);
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue].map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
}

function getContrastColor(hex) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 255000;
  return luminance > 0.58 ? "#171411" : "#fff5dc";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
