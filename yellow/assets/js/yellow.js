const body = document.body;
const dock = document.querySelector(".yellow-dock");
const dockItems = document.querySelectorAll("[data-yellow-nav]");
let panels = document.querySelectorAll("[data-yellow-page]");
const passwordInput = document.querySelector("[data-yellow-password]");
const gateForm = document.querySelector("[data-yellow-gate]");
const viewTransitionDuration = 460;
const validViews = new Set(["health", "finance", "finance-yearly", "finance-debt", "letter", "rewind"]);
const routePaths = new Map([
  ["/yellow", "health"],
  ["/yellow/index.html", "health"],
  ["/yellow/health", "health"],
  ["/yellow/health/index.html", "health"],
  ["/yellow/finance", "finance"],
  ["/yellow/finance/index.html", "finance"],
  ["/yellow/finance-yearly", "finance-yearly"],
  ["/yellow/finance-yearly/index.html", "finance-yearly"],
  ["/yellow/finance-debt", "finance-debt"],
  ["/yellow/finance-debt/index.html", "finance-debt"],
  ["/yellow/letter", "letter"],
  ["/yellow/letter/index.html", "letter"],
  ["/yellow/rewind", "rewind"],
  ["/yellow/rewind/index.html", "rewind"],
]);
const payloadUrl = "/yellow/assets/data/yellow.enc";
const payloadFormat = "hejrafa-yellow/1";
const unlockKeyStorageKey = "hejrafa-yellow-key-v1";
const legacyUnlockStorageKey = "hejrafa-yellow-unlocked";
const healthStorageKey = "hejrafa-yellow-health-v1";
const healthModeStorageKey = "hejrafa-yellow-health-mode-v1";
const healthTitleStorageKey = "hejrafa-yellow-health-title-v1";
const letterStorageKey = "hejrafa-yellow-letter-v2";
const html2PdfUrl = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
let html2PdfLoader = null;
const validHealthModes = new Set(["track", "cook", "train"]);
// Health, food, and letter content ships encrypted in yellow.enc and is assigned here
// after a successful unlock (see applyPrivateData). Nothing private lives in this file.
let healthTitleOptions = [];
let letterDrafts = [];
let healthProfileFields = [];
let healthProfileSexOptions = [];
let healthProfileActivityOptions = [];
let healthProfileGoalFields = [];
let healthXaryuReference = {};
let healthMeasurementCheckpoints = [];
let healthMeasurementMetrics = [];
let healthPhotoAngles = [];
let healthWarmupItems = [];
let healthWorkoutDays = [];
let healthWeeks = [];
let healthMealLabels = [];
let healthRecipes = {};
let healthFoodPlans = [];
let healthFoodPrepWindows = [];
let foodShoppingGroupOrder = [];
let foodUnitLabels = {};
let foodReadableItemNames = {};
let foodBatchPrepRecipeIds = new Set();
let healthSnackOptions = [];
let defaultHealthSnackId = "";
let validHealthSnackIds = new Set();
let foodPrepAheadCarbItems = new Set();
let foodPrepProteinNotes = [];
let privateContentMounted = false;
let envelopePromise = null;

function applyPrivateData(data) {
  const list = (key) => (Array.isArray(data[key]) ? data[key] : []);
  const record = (key) => (data[key] && typeof data[key] === "object" ? data[key] : {});

  healthTitleOptions = list("healthTitleOptions");
  letterDrafts = list("letterDrafts");
  healthProfileFields = list("healthProfileFields");
  healthProfileSexOptions = list("healthProfileSexOptions");
  healthProfileActivityOptions = list("healthProfileActivityOptions");
  healthProfileGoalFields = list("healthProfileGoalFields");
  healthXaryuReference = record("healthXaryuReference");
  healthMeasurementCheckpoints = list("healthMeasurementCheckpoints");
  healthMeasurementMetrics = list("healthMeasurementMetrics");
  healthPhotoAngles = list("healthPhotoAngles");
  healthWarmupItems = list("healthWarmupItems");
  healthWorkoutDays = list("healthWorkoutDays");
  healthWeeks = list("healthWeeks");
  healthMealLabels = list("healthMealLabels");
  healthRecipes = record("healthRecipes");
  healthFoodPlans = list("healthFoodPlans");
  healthFoodPrepWindows = list("healthFoodPrepWindows");
  foodShoppingGroupOrder = list("foodShoppingGroupOrder");
  foodUnitLabels = record("foodUnitLabels");
  foodReadableItemNames = record("foodReadableItemNames");
  foodBatchPrepRecipeIds = new Set(list("foodBatchPrepRecipeIds"));
  healthSnackOptions = list("healthSnackOptions");
  defaultHealthSnackId = typeof data.defaultHealthSnackId === "string" ? data.defaultHealthSnackId : healthSnackOptions[0] ?? "";
  validHealthSnackIds = new Set(healthSnackOptions);
  foodPrepAheadCarbItems = new Set(list("foodPrepAheadCarbItems"));
  foodPrepProteinNotes = list("foodPrepProteinNotes");
}

function escapeHtml(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  };

  return String(value ?? "").replace(/[&<>"']/g, (character) => replacements[character]);
}

function applyRandomHealthTitle() {
  const title = document.querySelector("[data-health-title]");

  if (!title) {
    return;
  }

  let titleIndex = Math.floor(Math.random() * healthTitleOptions.length);

  try {
    const savedTitleIndex = localStorage.getItem(healthTitleStorageKey);
    const lastTitleIndex = savedTitleIndex === null ? -1 : Number(savedTitleIndex);

    if (Number.isInteger(lastTitleIndex) && healthTitleOptions.length > 1 && titleIndex === lastTitleIndex) {
      titleIndex = (titleIndex + 1 + Math.floor(Math.random() * (healthTitleOptions.length - 1))) % healthTitleOptions.length;
    }

    localStorage.setItem(healthTitleStorageKey, String(titleIndex));
  } catch {
    // Cosmetic only; the page still works if title memory is unavailable.
  }

  const lines = healthTitleOptions[titleIndex];
  title.innerHTML = lines.map((line) => `<span>${escapeHtml(line)}</span>`).join(" ");
}

function getDefaultHealthProfile() {
  return {
    height: "",
    age: "",
    sex: "male",
    activity: "moderate",
    goalWeight: "",
    goalBodyFat: "",
  };
}

function getDefaultHealthState() {
  const state = {
    activeWorkoutWeek: healthWeeks[0].id,
    activeFoodWeek: healthWeeks[0].id,
    profile: getDefaultHealthProfile(),
    measurements: {},
    photos: {},
    shopping: {},
    snacks: {},
    workouts: {},
  };

  healthMeasurementMetrics.forEach((metric) => {
    state.measurements[metric.id] = {};

    healthMeasurementCheckpoints.forEach((checkpoint) => {
      state.measurements[metric.id][checkpoint.id] = "";
    });
  });

  healthMeasurementCheckpoints.forEach((checkpoint) => {
    state.photos[checkpoint.id] = {};

    healthPhotoAngles.forEach((angle) => {
      state.photos[checkpoint.id][angle.id] = "";
    });
  });

  healthFoodPlans.forEach((week) => {
    state.shopping[week.id] = {};
  });

  healthWeeks.forEach((week) => {
    state.workouts[week.id] = {
      target: "",
      review: "",
      days: {},
    };

    healthWorkoutDays.forEach((day) => {
      state.workouts[week.id].days[day.id] = {
        done: false,
        log: "",
        result: "",
        notes: "",
        sets: createDefaultDaySets(day),
      };
    });
  });

  return state;
}

const workoutSetCount = 3;

function createDefaultDaySets(day) {
  const sets = {};
  day.items.forEach((_, exerciseIndex) => {
    sets[exerciseIndex] = Array.from({ length: workoutSetCount }, () => ({ reps: "", weight: "" }));
  });
  return sets;
}

function normalizeDaySets(day, savedSets) {
  const sets = createDefaultDaySets(day);

  if (!savedSets || typeof savedSets !== "object") {
    return sets;
  }

  day.items.forEach((_, exerciseIndex) => {
    const saved = savedSets[exerciseIndex];

    if (!Array.isArray(saved)) {
      return;
    }

    for (let setIndex = 0; setIndex < workoutSetCount; setIndex += 1) {
      const entry = saved[setIndex];

      if (entry && typeof entry === "object") {
        if (typeof entry.reps === "string") {
          sets[exerciseIndex][setIndex].reps = entry.reps;
        }
        if (typeof entry.weight === "string") {
          sets[exerciseIndex][setIndex].weight = entry.weight;
        }
      }
    }
  });

  return sets;
}

function mergeHealthState(savedState) {
  const state = getDefaultHealthState();

  if (!savedState || typeof savedState !== "object") {
    return state;
  }

  if (healthWeeks.some((week) => week.id === savedState.activeWorkoutWeek)) {
    state.activeWorkoutWeek = savedState.activeWorkoutWeek;
  }

  if (healthWeeks.some((week) => week.id === savedState.activeFoodWeek)) {
    state.activeFoodWeek = savedState.activeFoodWeek;
  }

  if (savedState.profile && typeof savedState.profile === "object") {
    ["height", "age", "goalWeight", "goalBodyFat"].forEach((key) => {
      if (typeof savedState.profile[key] === "string") {
        state.profile[key] = savedState.profile[key];
      }
    });

    if (healthProfileSexOptions.some((option) => option.id === savedState.profile.sex)) {
      state.profile.sex = savedState.profile.sex;
    }

    if (healthProfileActivityOptions.some((option) => option.id === savedState.profile.activity)) {
      state.profile.activity = savedState.profile.activity;
    }
  }

  healthMeasurementMetrics.forEach((metric) => {
    const savedMetric = savedState.measurements?.[metric.id];

    if (!savedMetric || typeof savedMetric !== "object") {
      return;
    }

    healthMeasurementCheckpoints.forEach((checkpoint) => {
      const value = savedMetric[checkpoint.id];

      if (typeof value === "string") {
        state.measurements[metric.id][checkpoint.id] = value;
      }
    });
  });

  healthMeasurementCheckpoints.forEach((checkpoint) => {
    const savedCheckpoint = savedState.photos?.[checkpoint.id];

    if (!savedCheckpoint || typeof savedCheckpoint !== "object") {
      return;
    }

    healthPhotoAngles.forEach((angle) => {
      const value = savedCheckpoint[angle.id];

      if (typeof value === "string") {
        state.photos[checkpoint.id][angle.id] = value;
      }
    });
  });

  healthFoodPlans.forEach((week) => {
    const savedWeek = savedState.shopping?.[week.id];

    if (!savedWeek || typeof savedWeek !== "object") {
      return;
    }

    Object.entries(savedWeek).forEach(([key, value]) => {
      if (typeof key === "string" && value === true) {
        state.shopping[week.id][key] = true;
      }
    });
  });

  healthFoodPlans.forEach((week) => {
    const savedWeek = savedState.snacks?.[week.id];

    if (!savedWeek || typeof savedWeek !== "object") {
      return;
    }

    state.snacks[week.id] = state.snacks[week.id] || {};

    week.days.forEach((day) => {
      const value = savedWeek[day.id];

      if (value === null || value === "none") {
        state.snacks[week.id][day.id] = null;
      } else if (typeof value === "string" && validHealthSnackIds.has(value)) {
        state.snacks[week.id][day.id] = value;
      }
    });
  });

  healthWeeks.forEach((week) => {
    const savedWeek = savedState.workouts?.[week.id];

    if (!savedWeek || typeof savedWeek !== "object") {
      return;
    }

    if (typeof savedWeek.target === "string") {
      state.workouts[week.id].target = savedWeek.target;
    }

    if (typeof savedWeek.review === "string") {
      state.workouts[week.id].review = savedWeek.review;
    }

    healthWorkoutDays.forEach((day) => {
      const savedDay = savedWeek.days?.[day.id];

      if (!savedDay || typeof savedDay !== "object") {
        return;
      }

      state.workouts[week.id].days[day.id] = {
        done: savedDay.done === true,
        log: typeof savedDay.log === "string" ? savedDay.log : [savedDay.result, savedDay.notes].filter((value) => typeof value === "string" && value.trim()).join(" | "),
        result: typeof savedDay.result === "string" ? savedDay.result : "",
        notes: typeof savedDay.notes === "string" ? savedDay.notes : "",
        sets: normalizeDaySets(day, savedDay.sets),
      };
    });
  });

  return state;
}

function readHealthState() {
  try {
    const value = localStorage.getItem(healthStorageKey);
    return mergeHealthState(value ? JSON.parse(value) : null);
  } catch {
    return getDefaultHealthState();
  }
}

function saveHealthState(state) {
  try {
    localStorage.setItem(healthStorageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function readHealthMode() {
  try {
    const mode = localStorage.getItem(healthModeStorageKey);
    return validHealthModes.has(mode) ? mode : "track";
  } catch {
    return "track";
  }
}

function saveHealthMode(mode) {
  try {
    localStorage.setItem(healthModeStorageKey, mode);
  } catch {
    // Best effort only; the page still works without saved tab state.
  }
}

function setHealthMode(mode) {
  if (!validHealthModes.has(mode)) {
    return;
  }

  const healthPanel = document.querySelector("[data-yellow-page=\"health\"]");
  const healthModeNav = document.querySelector("[data-health-mode-selected]");
  const buttons = document.querySelectorAll("[data-health-mode-button]");
  const panels = document.querySelectorAll("[data-health-mode-panel]");

  if (healthPanel) {
    healthPanel.dataset.healthMode = mode;
  }

  if (healthModeNav) {
    healthModeNav.dataset.healthModeSelected = mode;
  }

  buttons.forEach((button) => {
    const isSelected = button.dataset.healthModeButton === mode;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  panels.forEach((panel) => {
    panel.hidden = panel.dataset.healthModePanel !== mode;
  });
}

function setupHealthModeNavigation() {
  const buttons = document.querySelectorAll("[data-health-mode-button]");

  if (!buttons.length) {
    return;
  }

  setHealthMode(readHealthMode());

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.healthModeButton;

      if (!validHealthModes.has(mode)) {
        return;
      }

      setHealthMode(mode);
      saveHealthMode(mode);
    });
  });
}

function getActiveWorkoutWeekIndex(state) {
  const index = healthWeeks.findIndex((week) => week.id === state.activeWorkoutWeek);
  return index >= 0 ? index : 0;
}

function getActiveFoodWeekIndex(state) {
  const index = healthFoodPlans.findIndex((week) => week.id === state.activeFoodWeek);
  return index >= 0 ? index : 0;
}

function setActiveWorkoutWeek(root, state, nextIndex) {
  const clampedIndex = Math.max(0, Math.min(healthWeeks.length - 1, nextIndex));
  state.activeWorkoutWeek = healthWeeks[clampedIndex].id;
  saveHealthState(state);
  renderHealthProgram(root, state);
}

function setActiveFoodWeek(root, state, nextIndex) {
  const clampedIndex = Math.max(0, Math.min(healthFoodPlans.length - 1, nextIndex));
  state.activeFoodWeek = healthFoodPlans[clampedIndex].id;
  saveHealthState(state);
  renderHealthFood(root, state);
}

function getDaySnackId(state, weekId, dayId) {
  const stored = state.snacks?.[weekId]?.[dayId];

  if (stored === null) {
    return null;
  }

  if (typeof stored === "string" && validHealthSnackIds.has(stored)) {
    return stored;
  }

  return defaultHealthSnackId;
}

function augmentDayWithSnack(day, state, weekId) {
  const snackId = getDaySnackId(state, weekId, day.id);

  if (!snackId) {
    return day;
  }

  return { ...day, meals: [...day.meals, snackId] };
}

function getAugmentedFoodDays(foodWeek, state) {
  return foodWeek.days.map((day) => augmentDayWithSnack(day, state, foodWeek.id));
}

function getFoodPlanProtein(day) {
  return day.meals.reduce((total, recipeId) => total + (healthRecipes[recipeId]?.protein || 0), 0);
}

function getFoodPlanCalories(day) {
  return day.meals.reduce((total, recipeId) => total + (healthRecipes[recipeId]?.calories || 0), 0);
}

function getHealthDailyTargets(state) {
  const profile = state.profile || getDefaultHealthProfile();
  const height = parseHealthNumber(profile.height);
  const age = parseHealthNumber(profile.age);
  const goalWeight = parseHealthNumber(profile.goalWeight);
  const latestWeight = getLatestMeasurement(state, "weight");
  const activity = healthProfileActivityOptions.find((option) => option.id === profile.activity) || healthProfileActivityOptions[2];

  if (!latestWeight) {
    return { hasProfile: false };
  }

  const proteinTarget = Math.round(latestWeight.value * 2);

  if (!height || !age) {
    return {
      hasProfile: true,
      proteinTarget,
      hasCalorieTarget: false,
    };
  }

  const sexOffset = profile.sex === "female" ? -161 : 5;
  const bmr = 10 * latestWeight.value + 6.25 * height - 5 * age + sexOffset;
  const maintenance = bmr * activity.factor;

  let direction = "maintain";
  let calorieTarget = Math.round(maintenance);

  if (goalWeight !== null) {
    const delta = latestWeight.value - goalWeight;
    if (delta > 0.5) {
      direction = "cut";
      calorieTarget = Math.round(maintenance - 400);
    } else if (delta < -0.5) {
      direction = "bulk";
      calorieTarget = Math.round(maintenance + 250);
    }
  }

  return {
    hasProfile: true,
    hasCalorieTarget: true,
    proteinTarget,
    calorieTarget,
    direction,
    maintenance: Math.round(maintenance),
  };
}

function formatDelta(value, unit) {
  if (value === 0) return `±0 ${unit}`;
  const sign = value > 0 ? "+" : "−";
  return `${sign}${Math.abs(value)} ${unit}`;
}

function getFoodTargetBand(planned, target, tolerance) {
  const delta = planned - target;
  if (delta >= 0 && delta <= tolerance * 2) return "on";
  if (delta > tolerance * 2) return "over";
  if (delta >= -tolerance) return "near";
  return "under";
}

function getFoodRecipeCounts(foodWeek) {
  return getFoodRecipeCountsForDays(foodWeek.days);
}

function getFoodRecipeCountsForDays(days) {
  const counts = new Map();

  days.forEach((day) => {
    day.meals.forEach((recipeId) => {
      counts.set(recipeId, (counts.get(recipeId) || 0) + 1);
    });
  });

  return counts;
}

function getFoodShoppingGroupsForDays(days) {
  const groups = new Map();

  getFoodRecipeCountsForDays(days).forEach((count, recipeId) => {
    const recipe = healthRecipes[recipeId];

    recipe?.shopping?.forEach((entry) => {
      const group = groups.get(entry.group) || new Map();
      const key = `${entry.item}|${entry.unit}`;
      const existing = group.get(key) || {
        amount: 0,
        item: entry.item,
        pantry: false,
        unit: entry.unit,
      };
      const amount = entry.pantry ? entry.amount : entry.amount * count;

      existing.amount = entry.pantry ? Math.max(existing.amount, amount) : existing.amount + amount;
      existing.pantry = existing.pantry || Boolean(entry.pantry);
      group.set(key, existing);
      groups.set(entry.group, group);
    });
  });

  return foodShoppingGroupOrder
    .map((label) => ({ label, items: Array.from(groups.get(label)?.values() || []) }))
    .filter((group) => group.items.length);
}

function getFoodShoppingGroups(foodWeek) {
  return getFoodShoppingGroupsForDays(foodWeek.days);
}

function formatFoodShoppingAmount(amount, unit) {
  if (unit === "g") {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)} kg`;
    }

    return `${Math.round(amount)} g`;
  }

  const rounded = Math.max(1, Math.ceil(amount - 0.001));
  const labels = foodUnitLabels[unit];

  if (!labels) {
    return `${rounded} ${unit}`;
  }

  return `${rounded} ${rounded === 1 ? labels[0] : labels[1]}`;
}

function formatFoodShoppingLine(item) {
  const readableNames = foodReadableItemNames[item.item];

  if (readableNames && ["pcs", "servings", "slices", "sticks"].includes(item.unit)) {
    const rounded = Math.max(1, Math.ceil(item.amount - 0.001));
    return `${rounded} ${rounded === 1 ? readableNames[0] : readableNames[1]}`;
  }

  return `${formatFoodShoppingAmount(item.amount, item.unit)} ${item.item}`;
}

function getFoodShoppingItemKey(groupLabel, item) {
  return `${groupLabel}|${item.item}|${item.unit}`;
}

function getFoodShoppingTotalsForCounts(counts, shouldInclude) {
  const totals = new Map();

  counts.forEach((count, recipeId) => {
    const recipe = healthRecipes[recipeId];

    recipe?.shopping?.forEach((entry) => {
      if (entry.pantry || !shouldInclude(entry)) {
        return;
      }

      const key = `${entry.item}|${entry.unit}`;
      const existing = totals.get(key) || { amount: 0, item: entry.item, unit: entry.unit };
      existing.amount += entry.amount * count;
      totals.set(key, existing);
    });
  });

  return Array.from(totals.values());
}

function formatFoodPrepItemList(items) {
  return items.length
    ? items.map((item) => formatFoodShoppingLine(item)).join(", ")
    : "";
}

function formatFoodRecipeCountList(counts, allowedIds) {
  const items = Array.from(counts.entries())
    .filter(([recipeId]) => allowedIds.has(recipeId))
    .map(([recipeId, count]) => {
      const recipeName = healthRecipes[recipeId]?.name || recipeId;
      return count > 1 ? `${recipeName} x${count}` : recipeName;
    });

  return items.join(", ");
}

function getFilteredFoodRecipeCounts(counts, allowedIds) {
  return new Map(Array.from(counts.entries()).filter(([recipeId]) => allowedIds.has(recipeId)));
}

function getFoodPrepCarbMealCount(counts) {
  return Array.from(counts.entries()).reduce((total, [recipeId, count]) => {
    const recipe = healthRecipes[recipeId];
    const hasPrepCarb = recipe?.shopping?.some((entry) => foodPrepAheadCarbItems.has(entry.item));

    return hasPrepCarb ? total + count : total;
  }, 0);
}

function getFoodPrepDayRange(days) {
  if (!days.length) {
    return "";
  }

  return `${days[0].day}-${days[days.length - 1].day}`;
}

function getFoodBatchPrepSummary(days) {
  const counts = getFoodRecipeCountsForDays(days);
  const batchCounts = getFilteredFoodRecipeCounts(counts, foodBatchPrepRecipeIds);
  const batchRecipeNames = formatFoodRecipeCountList(batchCounts, foodBatchPrepRecipeIds);
  const batchProteins = getFoodShoppingTotalsForCounts(batchCounts, (entry) => entry.group === "Proteins");
  const prepCarbs = getFoodShoppingTotalsForCounts(counts, (entry) => entry.group === "Carbs" && foodPrepAheadCarbItems.has(entry.item));
  const batchServings = Array.from(counts.entries()).reduce((total, [recipeId, count]) => foodBatchPrepRecipeIds.has(recipeId) ? total + count : total, 0);

  return {
    carbs: formatFoodPrepItemList(prepCarbs),
    carbMeals: getFoodPrepCarbMealCount(counts),
    dayRange: getFoodPrepDayRange(days),
    proteinItems: batchProteins,
    proteins: formatFoodPrepItemList(batchProteins),
    recipes: batchRecipeNames,
    servings: batchServings,
  };
}

function getFoodPrepProteinSentences(batch) {
  const items = batch.proteinItems || [];
  const sentences = foodPrepProteinNotes
    .filter((note) => items.some((item) => item.item === note.item))
    .map((note) => note.note);

  if (!sentences.length && batch.proteins) {
    sentences.push(`Protein: cook ${batch.proteins}.`);
  }

  return sentences;
}

function renderFoodBatchPrepDetail(batch) {
  const cookSentences = getFoodPrepProteinSentences(batch);
  const carbSentence = batch.carbs ? `Also cook ${batch.carbs}.` : "";
  const packSentence = batch.servings
    ? `Make ${batch.servings} boxes for ${batch.dayRange}; add the fresh bits when you eat.`
    : `Prep only what helps ${batch.dayRange}; cook the rest fresh.`;

  return `
                        <p>${escapeHtml([...cookSentences, carbSentence, packSentence].filter(Boolean).join(" "))}</p>`;
}

function getFoodPrepJourneys(foodWeek, activeIndex, state) {
  const window = healthFoodPrepWindows[activeIndex] || healthFoodPrepWindows[0];
  const augmentedDays = state ? getAugmentedFoodDays(foodWeek, state) : foodWeek.days;
  const mondayDays = augmentedDays.slice(0, 3);
  const thursdayDays = augmentedDays.slice(3);

  return [
    {
      id: "shop",
      shopDate: window.shop,
      days: mondayDays,
      batch: getFoodBatchPrepSummary(mondayDays),
      groups: getFoodShoppingGroupsForDays(mondayDays),
    },
    {
      id: "topUp",
      shopDate: window.topUp,
      days: thursdayDays,
      batch: getFoodBatchPrepSummary(thursdayDays),
      groups: getFoodShoppingGroupsForDays(thursdayDays),
    },
  ].filter((journey) => journey.days.length && (journey.groups.length || journey.batch.servings));
}

function renderFoodJourneyShopping(journey, foodWeek, state) {
  return journey.groups.map((group) => `
                          <div>
                            <strong>${escapeHtml(group.label)}</strong>
                            <ul>${group.items.map((item) => {
                              const itemKey = `${journey.id}|${getFoodShoppingItemKey(group.label, item)}`;
                              const isChecked = state.shopping?.[foodWeek.id]?.[itemKey] === true;

                              return `
                              <li>
                                <label class="food-shopping-check">
                                  <input type="checkbox" data-health-shopping-week="${escapeHtml(foodWeek.id)}" data-health-shopping-item="${escapeHtml(itemKey)}"${isChecked ? " checked" : ""}>
                                  <span>${escapeHtml(formatFoodShoppingLine(item))}</span>
                                </label>
                              </li>`;
                            }).join("")}
                            </ul>
                          </div>`).join("");
}

function buildFoodJourneyCopyText(journey) {
  return journey.groups
    .flatMap((group) => group.items.map((item) => formatFoodShoppingLine(item)))
    .join("\n");
}

function copyShoppingTextToClipboard(text, button) {
  const flashFeedback = (label) => {
    if (!button) {
      return;
    }

    const previousLabel = button.dataset.previousLabel || button.textContent;
    button.dataset.previousLabel = previousLabel;
    button.textContent = label;
    button.classList.add("is-feedback");

    window.setTimeout(() => {
      button.textContent = previousLabel;
      button.classList.remove("is-feedback");
      delete button.dataset.previousLabel;
    }, 1400);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => flashFeedback("Copied"))
      .catch(() => flashFeedback("Copy failed"));
    return;
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    flashFeedback("Copied");
  } catch {
    flashFeedback("Copy failed");
  }
}

function renderFoodPrep(foodWeek, activeIndex, state) {
  const journeys = getFoodPrepJourneys(foodWeek, activeIndex, state);

  const journeyHtml = journeys.map((journey, index) => {
    const detail = journey.batch.servings || journey.batch.carbs ? renderFoodBatchPrepDetail(journey.batch) : "";
    const dayRange = journey.batch.dayRange || (journey.days.length ? `${journey.days[0].day}-${journey.days[journey.days.length - 1].day}` : "");
    const shopping = renderFoodJourneyShopping(journey, foodWeek, state);
    const copyKey = `${foodWeek.id}|${journey.id}`;

    return `
                      <article class="food-prep-journey" data-food-journey-index="${index}">
                        <header class="food-prep-journey-header">
                          <span class="food-prep-kicker">Journey ${index + 1} · Shop ${escapeHtml(journey.shopDate)}</span>
                          <h3>For ${escapeHtml(dayRange)}</h3>
                        </header>
                        ${detail ? `<div class="food-prep-journey-cook"><h4>Cook</h4>${detail}</div>` : ""}
                        <div class="food-prep-journey-shop">
                          <header class="food-prep-journey-shop-header">
                            <h4>Shop</h4>
                            <button class="food-prep-copy" type="button" data-health-shopping-copy="${escapeHtml(copyKey)}" aria-label="Copy this shopping list to clipboard">Copy list</button>
                          </header>
                          <div class="food-shopping-list">${shopping}
                          </div>
                        </div>
                      </article>`;
  }).join("");

  return `
                <section class="food-prep" aria-label="Food prep and shopping list">${journeyHtml}
                </section>`;
}

function renderFoodSnackCard(weekId, day, snackId) {
  const recipe = snackId ? healthRecipes[snackId] : null;
  const options = healthSnackOptions.map((id) => {
    const optionRecipe = healthRecipes[id];
    if (!optionRecipe) return "";
    const isSelected = id === snackId;
    return `<option value="${escapeHtml(id)}"${isSelected ? " selected" : ""}>${escapeHtml(optionRecipe.name)} · ${optionRecipe.calories} cal · ${optionRecipe.protein} g</option>`;
  }).join("");
  const noneSelected = snackId === null ? " selected" : "";
  const cookSteps = recipe
    ? (Array.isArray(recipe.cook) ? recipe.cook : [recipe.cook]).filter(Boolean).map((step) => `<li>${escapeHtml(step)}</li>`).join("")
    : "";

  const mediaHtml = recipe && recipe.image
    ? `<figure class="food-snack-media"><img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.name)}" loading="lazy"></figure>`
    : "";

  return `
                    <section class="food-snack${recipe ? "" : " food-snack--empty"}" aria-label="${escapeHtml(day.day)} snack">
                      ${mediaHtml}
                      <div class="food-snack-main">
                        <span class="section-label">Snack</span>
                        <h5>${escapeHtml(recipe ? recipe.name : "No snack")}</h5>
                        ${recipe ? `<p>${escapeHtml(recipe.detail)}</p>` : `<p>Pick a snack to bump cal &amp; protein.</p>`}
                        ${recipe && cookSteps ? `<ol class="food-snack-cook">${cookSteps}</ol>` : ""}
                        <small>${recipe ? `${recipe.protein}g protein · ${recipe.calories} cal · ${escapeHtml(recipe.source || "")}` : "0g protein · 0 cal"}</small>
                      </div>
                      <label class="food-snack-picker">
                        <span class="section-label">Swap</span>
                        <select class="health-text-input" data-health-snack-week="${escapeHtml(weekId)}" data-health-snack-day="${escapeHtml(day.id)}" aria-label="${escapeHtml(day.day)} snack picker">
                          <option value="none"${noneSelected}>No snack</option>
                          ${options}
                        </select>
                      </label>
                    </section>`;
}

function renderFoodMealCards(recipeIds) {
  return recipeIds.map((recipeId, index) => {
    const recipe = healthRecipes[recipeId];

    if (!recipe) {
      return "";
    }

    const cookSteps = (Array.isArray(recipe.cook) ? recipe.cook : [recipe.cook])
      .filter(Boolean)
      .map((step) => `<li>${escapeHtml(step)}</li>`)
      .join("");

    return `
                        <article class="food-meal-card">
                          <img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.name)}" loading="lazy">
                          <div>
                            <span>${escapeHtml(healthMealLabels[index] || "Meal")}</span>
                            <h5>${escapeHtml(recipe.name)}</h5>
                            <p>${escapeHtml(recipe.detail)}</p>
                            <div class="food-cook">
                              <span class="food-cook-label">Cook steps</span>
                              <ol>${cookSteps}</ol>
                            </div>
                            <small>${escapeHtml(recipe.protein)}g protein - ${escapeHtml(recipe.calories)} cal - ${escapeHtml(recipe.source)}</small>
                          </div>
                        </article>`;
  }).filter(Boolean).join("");
}

function parseHealthNumber(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getLatestMeasurement(state, metricId) {
  const values = state.measurements?.[metricId] || {};

  for (let index = healthMeasurementCheckpoints.length - 1; index >= 0; index -= 1) {
    const checkpoint = healthMeasurementCheckpoints[index];
    const parsed = parseHealthNumber(values[checkpoint.id]);

    if (parsed !== null) {
      return { value: parsed, checkpointId: checkpoint.id, checkpointLabel: checkpoint.label };
    }
  }

  return null;
}

function formatHealthNumber(value, fractionDigits) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function renderHealthProfile(root, state) {
  const profile = state.profile || getDefaultHealthProfile();
  const baseFields = healthProfileFields.map((field) => `
                <label class="profile-field">
                  <span>${escapeHtml(field.label)}</span>
                  <input class="health-text-input" type="${escapeHtml(field.type)}" inputmode="${escapeHtml(field.inputmode)}" autocomplete="off" placeholder="${escapeHtml(field.placeholder)}" value="${escapeHtml(profile[field.id])}" data-health-profile-field="${escapeHtml(field.id)}">
                </label>`).join("");

  const sexOptions = healthProfileSexOptions.map((option) => `
                  <label class="profile-segment-option${option.id === profile.sex ? " is-selected" : ""}">
                    <input type="radio" name="profile-sex" value="${escapeHtml(option.id)}" data-health-profile-field="sex"${option.id === profile.sex ? " checked" : ""}>
                    <span>${escapeHtml(option.label)}</span>
                  </label>`).join("");

  const activityOptions = healthProfileActivityOptions.map((option) => `<option value="${escapeHtml(option.id)}"${option.id === profile.activity ? " selected" : ""}>${escapeHtml(option.label)} · ${escapeHtml(option.hint)}</option>`).join("");

  const goalFields = healthProfileGoalFields.map((field) => `
                <label class="profile-field">
                  <span>${escapeHtml(field.label)}</span>
                  <input class="health-text-input" type="text" inputmode="decimal" autocomplete="off" placeholder="${escapeHtml(field.placeholder)}" value="${escapeHtml(profile[field.id])}" data-health-profile-field="${escapeHtml(field.id)}">
                </label>`).join("");

  root.innerHTML = `
              ${baseFields}
                <label class="profile-field profile-field--segmented">
                  <span>Sex</span>
                  <div class="profile-segment">${sexOptions}
                  </div>
                </label>
                <label class="profile-field">
                  <span>Activity</span>
                  <select class="health-text-input profile-select" data-health-profile-field="activity">${activityOptions}</select>
                </label>
              ${goalFields}`;
}

function buildHealthInsights(state) {
  const profile = state.profile || getDefaultHealthProfile();
  const height = parseHealthNumber(profile.height);
  const age = parseHealthNumber(profile.age);
  const goalWeight = parseHealthNumber(profile.goalWeight);
  const goalBodyFat = parseHealthNumber(profile.goalBodyFat);
  const latestWeight = getLatestMeasurement(state, "weight");
  const latestBodyFat = getLatestMeasurement(state, "bodyFat");
  const latestWaist = getLatestMeasurement(state, "waist");
  const latestShoulders = getLatestMeasurement(state, "shoulders");
  const activity = healthProfileActivityOptions.find((option) => option.id === profile.activity) || healthProfileActivityOptions[2];

  const stats = [];
  const coachNotes = [];

  if (latestWeight) {
    stats.push({ label: "Current weight", value: `${formatHealthNumber(latestWeight.value, 1)} kg`, hint: latestWeight.checkpointLabel });
  }

  if (latestBodyFat) {
    stats.push({ label: "Body fat", value: `${formatHealthNumber(latestBodyFat.value, 1)}%`, hint: latestBodyFat.checkpointLabel });
  }

  if (height && latestWeight) {
    const meters = height / 100;
    const bmi = latestWeight.value / (meters * meters);
    let band = "—";
    if (bmi < 18.5) band = "Underweight";
    else if (bmi < 25) band = "Healthy range";
    else if (bmi < 30) band = "Above range";
    else band = "High";

    stats.push({ label: "BMI", value: formatHealthNumber(bmi, 1), hint: band });
  }

  if (latestWeight && latestBodyFat) {
    const leanMass = latestWeight.value * (1 - latestBodyFat.value / 100);
    stats.push({ label: "Lean mass", value: `${formatHealthNumber(leanMass, 1)} kg`, hint: "estimate" });
  }

  if (height && age && latestWeight) {
    const sexOffset = profile.sex === "female" ? -161 : 5;
    const bmr = 10 * latestWeight.value + 6.25 * height - 5 * age + sexOffset;
    const tdee = bmr * activity.factor;
    const proteinTarget = Math.round(latestWeight.value * 2);
    const cutCalories = Math.round(tdee - 400);
    const bulkCalories = Math.round(tdee + 250);

    stats.push({ label: "Maintenance cal", value: `${formatHealthNumber(Math.round(tdee), 0)} kcal`, hint: activity.label.toLowerCase() });
    stats.push({ label: "Protein target", value: `${proteinTarget} g`, hint: "2 g per kg" });
    stats.push({ label: "Cut · Bulk", value: `${formatHealthNumber(cutCalories, 0)} · ${formatHealthNumber(bulkCalories, 0)}`, hint: "kcal/day" });
  }

  if (latestShoulders && latestWaist && latestShoulders.value && latestWaist.value) {
    const ratio = latestShoulders.value / latestWaist.value;
    let band = "Building";
    if (ratio >= 1.618) band = "Greek god";
    else if (ratio >= 1.5) band = "Aesthetic";
    else if (ratio >= 1.4) band = "Strong base";

    stats.push({ label: "Shoulder · waist", value: formatHealthNumber(ratio, 2), hint: band });
  }

  if (latestWeight && goalWeight) {
    const delta = latestWeight.value - goalWeight;
    const absDelta = Math.abs(delta);

    if (absDelta < 0.4) {
      coachNotes.push("You're sitting on your goal weight. Hold here and let composition catch up.");
    } else if (delta > 0) {
      coachNotes.push(`${formatHealthNumber(absDelta, 1)} kg above goal. Stay in a small deficit (~400 kcal) and keep protein high.`);
    } else {
      coachNotes.push(`${formatHealthNumber(absDelta, 1)} kg under goal. Eat above maintenance, prioritize hard sets.`);
    }
  }

  if (latestBodyFat && goalBodyFat) {
    const deltaBf = latestBodyFat.value - goalBodyFat;

    if (deltaBf > 1) {
      coachNotes.push(`Body fat ${formatHealthNumber(deltaBf, 1)}% above goal. Cut leads the lift right now.`);
    } else if (deltaBf < -1) {
      coachNotes.push("Body fat below goal — you have room to add lean mass.");
    } else {
      coachNotes.push("Body fat is on target. Focus on quality of lifts, not the scale.");
    }
  }

  if (latestWeight) {
    const deltaXaryu = latestWeight.value - healthXaryuReference.weight;
    if (Math.abs(deltaXaryu) > 0.4) {
      const direction = deltaXaryu > 0 ? "above" : "below";
      coachNotes.push(`${formatHealthNumber(Math.abs(deltaXaryu), 1)} kg ${direction} Xaryu reference (${healthXaryuReference.weight} kg).`);
    }
  }

  if (!stats.length) {
    coachNotes.push("Fill in your height, age, and one measurement to see calories, protein, and progress.");
  }

  return { stats, coachNotes };
}

function buildProgressChart(state) {
  const profile = state.profile || getDefaultHealthProfile();
  const goalWeight = parseHealthNumber(profile.goalWeight);
  const points = healthMeasurementCheckpoints.map((checkpoint) => {
    const value = parseHealthNumber(state.measurements?.weight?.[checkpoint.id]);
    return value === null ? null : { checkpoint, value };
  });
  const realPoints = points.filter(Boolean);
  const allValues = realPoints.map((point) => point.value);

  if (goalWeight !== null) {
    allValues.push(goalWeight);
  }

  allValues.push(healthXaryuReference.weight);

  if (realPoints.length < 1) {
    return `
                <div class="progress-chart progress-chart--empty">
                  <p>Log a Start weight in the measurements card to see your line.</p>
                </div>`;
  }

  const minValue = Math.min(...allValues) - 1;
  const maxValue = Math.max(...allValues) + 1;
  const range = maxValue - minValue || 1;
  const width = 640;
  const height = 220;
  const paddingX = 48;
  const paddingY = 28;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const xFor = (index) => paddingX + (innerWidth * index) / (healthMeasurementCheckpoints.length - 1);
  const yFor = (value) => paddingY + innerHeight - ((value - minValue) / range) * innerHeight;

  const linePoints = points.map((point, index) => point ? `${xFor(index)},${yFor(point.value)}` : null).filter(Boolean).join(" ");
  const dots = points.map((point, index) => point ? `<circle cx="${xFor(index)}" cy="${yFor(point.value)}" r="6" class="progress-chart-dot"/>
                      <text x="${xFor(index)}" y="${yFor(point.value) - 12}" class="progress-chart-value" text-anchor="middle">${formatHealthNumber(point.value, 1)}</text>` : "").join("");

  const xLabels = healthMeasurementCheckpoints.map((checkpoint, index) => `<text x="${xFor(index)}" y="${height - 6}" class="progress-chart-label" text-anchor="middle">${escapeHtml(checkpoint.label)}</text>`).join("");

  const goalLine = goalWeight !== null ? `
                  <line x1="${paddingX}" x2="${width - paddingX}" y1="${yFor(goalWeight)}" y2="${yFor(goalWeight)}" class="progress-chart-goal"/>
                  <text x="${width - paddingX}" y="${yFor(goalWeight) - 6}" class="progress-chart-goal-label" text-anchor="end">Goal ${formatHealthNumber(goalWeight, 1)} kg</text>` : "";

  const xaryuLine = `
                  <line x1="${paddingX}" x2="${width - paddingX}" y1="${yFor(healthXaryuReference.weight)}" y2="${yFor(healthXaryuReference.weight)}" class="progress-chart-xaryu"/>
                  <text x="${paddingX}" y="${yFor(healthXaryuReference.weight) - 6}" class="progress-chart-xaryu-label" text-anchor="start">Xaryu ${healthXaryuReference.weight} kg</text>`;

  return `
                <div class="progress-chart" aria-label="Weight progress chart">
                  <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Weight progress over checkpoints">
                    ${xaryuLine}
                    ${goalLine}
                    ${realPoints.length > 1 ? `<polyline points="${linePoints}" class="progress-chart-line"/>` : ""}
                    ${dots}
                    ${xLabels}
                  </svg>
                </div>`;
}

function renderHealthInsights(root, state) {
  const { stats, coachNotes } = buildHealthInsights(state);
  const statHtml = stats.map((stat) => `
                  <div class="insight-stat">
                    <span>${escapeHtml(stat.label)}</span>
                    <strong>${escapeHtml(stat.value)}</strong>
                    <small>${escapeHtml(stat.hint)}</small>
                  </div>`).join("");

  const notesHtml = coachNotes.length ? `
                <ul class="insight-notes">${coachNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
                </ul>` : "";

  root.innerHTML = `
              <div class="insight-stats">${statHtml}
              </div>
              ${notesHtml}
              ${buildProgressChart(state)}`;
}

function renderHealthMeasurements(root, state) {
  const headerCells = healthMeasurementCheckpoints.map((checkpoint) => `
                  <span><strong>${escapeHtml(checkpoint.label)}</strong><small>${escapeHtml(checkpoint.date)}</small></span>`).join("");
  const rows = healthMeasurementMetrics.map((metric) => {
    const inputs = healthMeasurementCheckpoints.map((checkpoint) => {
      const value = state.measurements[metric.id]?.[checkpoint.id] ?? "";

      return `
                  <input class="measurement-input" type="text" inputmode="decimal" autocomplete="off" aria-label="${escapeHtml(metric.label)} ${escapeHtml(checkpoint.label)}" data-health-measurement="${escapeHtml(metric.id)}" data-health-checkpoint="${escapeHtml(checkpoint.id)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(metric.placeholder)}">`;
    }).join("");

    return `
                <div class="measurement-row" role="row">
                  <span><strong>${escapeHtml(metric.label)}</strong><small>${escapeHtml(metric.hint)}</small></span>${inputs}
                </div>`;
  }).join("");

  root.innerHTML = `
                <div class="measurement-row measurement-row--head" role="row">
                  <span>Metric</span>${headerCells}
                </div>${rows}`;
}

function renderHealthPhotos(root, state) {
  const slots = healthMeasurementCheckpoints.flatMap((checkpoint) => healthPhotoAngles.map((angle) => {
    const image = state.photos[checkpoint.id]?.[angle.id] ?? "";
    const label = `${checkpoint.label} ${angle.label}`;

    return `
                  <div class="photo-upload-card${image ? " has-photo" : ""}">
                    <label class="photo-upload-label">
                      <span>${escapeHtml(label)}</span>
                      <span class="photo-frame">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(label)} progress photo">` : "<span>Upload</span>"}</span>
                      <input class="photo-file-input" type="file" accept="image/*" data-health-photo-checkpoint="${escapeHtml(checkpoint.id)}" data-health-photo-angle="${escapeHtml(angle.id)}">
                    </label>
                    <button class="photo-remove" type="button" data-health-photo-checkpoint="${escapeHtml(checkpoint.id)}" data-health-photo-remove="${escapeHtml(angle.id)}">Remove</button>
                  </div>`;
  })).join("");

  root.innerHTML = `${slots}
                <p class="photo-error" data-health-photo-error hidden></p>`;
}

function renderWorkoutItems(items) {
  return items.map((item) => `<span class="program-exercise" tabindex="0" data-tooltip="${escapeHtml(item.tooltip)}">${escapeHtml(item.label)}</span>`).join("<span>, </span>");
}

function renderWarmup() {
  const items = healthWarmupItems.map((item) => `
                  <figure class="warmup-card">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy">
                    <figcaption><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></figcaption>
                  </figure>`).join("");

  return `
                <section class="workout-warmup" aria-label="Warm-up">
                  <header class="workout-warmup-header">
                    <div>
                      <span>Warm-up</span>
                      <h3>Before every session</h3>
                    </div>
                    <p>3 rounds, then one easy first set.</p>
                  </header>
                  <div class="warmup-grid">${items}
                  </div>
                </section>`;
}

function renderHealthFood(root, state) {
  const activeIndex = getActiveFoodWeekIndex(state);
  const foodWeek = healthFoodPlans[activeIndex];
  const weekMeta = healthWeeks.find((week) => week.id === foodWeek.id) || healthWeeks[activeIndex];
  const weekButtons = healthFoodPlans.map((navWeek, index) => `
                    <button class="workout-week-pill${index === activeIndex ? " is-selected" : ""}" type="button" data-health-food-week-select="${escapeHtml(navWeek.id)}" aria-label="${escapeHtml(healthWeeks[index].label)} ${escapeHtml(healthWeeks[index].dates)}" aria-current="${index === activeIndex ? "true" : "false"}">W${index + 1}</button>`).join("");
  const targets = getHealthDailyTargets(state);
  const days = foodWeek.days.map((day) => {
    const augmentedDay = augmentDayWithSnack(day, state, foodWeek.id);
    const plannedProtein = getFoodPlanProtein(augmentedDay);
    const plannedCalories = getFoodPlanCalories(augmentedDay);
    const snackId = getDaySnackId(state, foodWeek.id, day.id);
    const snackHtml = renderFoodSnackCard(foodWeek.id, day, snackId);

    let proteinHtml;
    let calorieHtml;

    if (targets.hasProfile) {
      const proteinDelta = plannedProtein - targets.proteinTarget;
      const proteinBand = getFoodTargetBand(plannedProtein, targets.proteinTarget, 15);
      proteinHtml = `
                        <div class="food-day-stat food-day-stat--${escapeHtml(proteinBand)}">
                          <strong>${plannedProtein} g</strong>
                          <span>target ${targets.proteinTarget} g · ${escapeHtml(formatDelta(proteinDelta, "g"))}</span>
                        </div>`;
    } else {
      proteinHtml = `
                        <div class="food-day-stat">
                          <strong>${plannedProtein} g protein</strong>
                          <span>fill profile for target</span>
                        </div>`;
    }

    if (targets.hasCalorieTarget) {
      const calorieDelta = plannedCalories - targets.calorieTarget;
      const calorieBand = getFoodTargetBand(plannedCalories, targets.calorieTarget, 150);
      const directionLabel = targets.direction === "maintain" ? "maintenance" : targets.direction;
      calorieHtml = `
                        <div class="food-day-stat food-day-stat--${escapeHtml(calorieBand)}">
                          <strong>${plannedCalories} kcal</strong>
                          <span>${escapeHtml(directionLabel)} ${targets.calorieTarget} · ${escapeHtml(formatDelta(calorieDelta, "kcal"))}</span>
                        </div>`;
    } else {
      calorieHtml = `
                        <div class="food-day-stat">
                          <strong>${plannedCalories} kcal</strong>
                        </div>`;
    }

    return `
                  <section class="food-day">
                    <header class="food-day-header">
                      <div class="food-day-info">
                        <span class="food-day-kicker">${escapeHtml(day.day)}</span>
                        <h4>${escapeHtml(day.title)}</h4>
                      </div>
                      <div class="food-day-stats">
                        ${proteinHtml}
                        ${calorieHtml}
                      </div>
                    </header>
                    <div class="food-meal-grid">${renderFoodMealCards(day.meals)}
                    </div>
                    ${snackHtml}
                  </section>`;
  }).join("");

  state.activeFoodWeek = foodWeek.id;
  root.innerHTML = `
${renderFoodPrep(foodWeek, activeIndex, state)}
                <div class="food-carousel">
                  <nav class="workout-carousel-nav" aria-label="Food week navigation">
                    <button class="workout-week-arrow" type="button" data-health-food-week-nav="prev" aria-label="Previous food week"${activeIndex === 0 ? " disabled" : ""}>&lt;</button>
                    <div class="workout-week-pills">${weekButtons}
                    </div>
                    <button class="workout-week-arrow" type="button" data-health-food-week-nav="next" aria-label="Next food week"${activeIndex === healthFoodPlans.length - 1 ? " disabled" : ""}>&gt;</button>
                  </nav>
                  <article class="food-week">
                    <header class="food-week-header">
                      <span class="food-week-kicker">${escapeHtml(weekMeta.label)} - ${escapeHtml(weekMeta.dates)}</span>
                      <h3>${escapeHtml(foodWeek.focus)}</h3>
                    </header>
                    <div class="food-day-list">${days}
                    </div>
                  </article>
                </div>`;
}

function renderWorkoutSetGrid(week, day, dayState) {
  const sets = dayState.sets || {};
  const headerCells = Array.from({ length: workoutSetCount }, (_, index) => `
                      <div class="workout-set-head-cell">
                        <span class="workout-set-head">Set ${index + 1}</span>
                        <div class="workout-set-head-sub">
                          <span>reps</span>
                          <span>kg</span>
                        </div>
                      </div>`).join("");

  const rows = day.items.map((item, exerciseIndex) => {
    const exerciseSets = sets[exerciseIndex] || [];
    const setCells = Array.from({ length: workoutSetCount }, (_, setIndex) => {
      const entry = exerciseSets[setIndex] || { reps: "", weight: "" };
      return `
                        <div class="workout-set-cell">
                          <input class="workout-set-input" type="text" inputmode="decimal" autocomplete="off" placeholder="reps" aria-label="${escapeHtml(week.label)} ${escapeHtml(day.title)} ${escapeHtml(item.label)} set ${setIndex + 1} reps" value="${escapeHtml(entry.reps)}" data-health-set-week="${escapeHtml(week.id)}" data-health-set-day="${escapeHtml(day.id)}" data-health-set-exercise="${exerciseIndex}" data-health-set-index="${setIndex}" data-health-set-field="reps">
                          <input class="workout-set-input" type="text" inputmode="decimal" autocomplete="off" placeholder="kg" aria-label="${escapeHtml(week.label)} ${escapeHtml(day.title)} ${escapeHtml(item.label)} set ${setIndex + 1} weight" value="${escapeHtml(entry.weight)}" data-health-set-week="${escapeHtml(week.id)}" data-health-set-day="${escapeHtml(day.id)}" data-health-set-exercise="${exerciseIndex}" data-health-set-index="${setIndex}" data-health-set-field="weight">
                        </div>`;
    }).join("");

    return `
                    <div class="workout-set-row" role="row">
                      <span class="workout-set-label">${escapeHtml(item.label)}</span>
                      ${setCells}
                    </div>`;
  }).join("");

  return `
                  <div class="workout-set-grid" role="table" aria-label="${escapeHtml(week.label)} ${escapeHtml(day.title)} sets">
                    <div class="workout-set-row workout-set-row--head" role="row">
                      <span class="workout-set-label-head">Exercise</span>
                      ${headerCells}
                    </div>
                    ${rows}
                  </div>`;
}

function renderHealthProgram(root, state) {
  const activeIndex = getActiveWorkoutWeekIndex(state);
  const week = healthWeeks[activeIndex];
  const weekState = state.workouts[week.id];
  const weekButtons = healthWeeks.map((navWeek, index) => `
                    <button class="workout-week-pill${index === activeIndex ? " is-selected" : ""}" type="button" data-health-week-select="${escapeHtml(navWeek.id)}" aria-label="${escapeHtml(navWeek.label)} ${escapeHtml(navWeek.dates)}" aria-current="${index === activeIndex ? "true" : "false"}">W${index + 1}</button>`).join("");
  const days = healthWorkoutDays.map((day) => {
    const dayState = weekState.days[day.id];
    const image = day.image ? `
                      <figure class="workout-day-media">
                        <img src="${escapeHtml(day.image)}" alt="${escapeHtml(day.imageAlt)}" loading="lazy">
                      </figure>` : "";

    return `
                  <section class="workout-day${day.image ? " has-media" : ""}">
                    <div class="workout-day-main">
${image}
                      <div class="workout-day-info">
                        <span class="workout-day-kicker">${escapeHtml(day.day)}</span>
                        <h4>${escapeHtml(day.title)}</h4>
                      </div>
                    </div>
                    <div class="workout-day-fields">
                      ${renderWorkoutSetGrid(week, day, dayState)}
                    </div>
                  </section>`;
  }).join("");

  state.activeWorkoutWeek = week.id;
  root.innerHTML = `
${renderWarmup()}
                <div class="workout-carousel">
                  <nav class="workout-carousel-nav" aria-label="Workout week navigation">
                    <button class="workout-week-arrow" type="button" data-health-week-nav="prev" aria-label="Previous week"${activeIndex === 0 ? " disabled" : ""}>&lt;</button>
                    <div class="workout-week-pills">${weekButtons}
                    </div>
                    <button class="workout-week-arrow" type="button" data-health-week-nav="next" aria-label="Next week"${activeIndex === healthWeeks.length - 1 ? " disabled" : ""}>&gt;</button>
                  </nav>
                <article class="workout-week">
                  <header class="workout-week-header">
                    <div>
                      <span class="workout-week-kicker">${escapeHtml(week.label)} · ${escapeHtml(week.dates)}</span>
                      <h3><span class="workout-week-focus">${escapeHtml(week.focus)}</span></h3>
                    </div>
                  </header>
                  <div class="workout-day-list">${days}
                  </div>
                </article>
                </div>`;
}

function setHealthPhotoError(root, message) {
  const error = root.querySelector("[data-health-photo-error]");

  if (!error) {
    return;
  }

  error.textContent = message;
  error.hidden = !message;
}

function resizeHealthPhoto(file) {
  const maxSize = 1100;
  const quality = 0.74;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("Could not load that image."));
      image.onload = () => {
        const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
        const scale = largestSide > maxSize ? maxSize / largestSide : 1;
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not prepare that image."));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

function setupHealthTracker() {
  const profileRoot = document.querySelector("[data-health-profile]");
  const insightsRoot = document.querySelector("[data-health-insights]");
  const measurementRoot = document.querySelector("[data-health-measurements]");
  const photoRoot = document.querySelector("[data-health-photos]");
  const foodRoot = document.querySelector("[data-health-food]");
  const programRoot = document.querySelector("[data-health-program]");
  const modeButtons = document.querySelectorAll("[data-health-mode-button]");

  if (!profileRoot && !insightsRoot && !measurementRoot && !photoRoot && !foodRoot && !programRoot && !modeButtons.length) {
    return;
  }

  setupHealthModeNavigation();

  if (!profileRoot && !insightsRoot && !measurementRoot && !photoRoot && !foodRoot && !programRoot) {
    return;
  }

  const state = readHealthState();

  const refreshInsights = () => {
    if (insightsRoot) {
      renderHealthInsights(insightsRoot, state);
    }
    if (foodRoot) {
      renderHealthFood(foodRoot, state);
    }
  };

  if (profileRoot) {
    renderHealthProfile(profileRoot, state);

    const handleProfileChange = (event) => {
      const field = event.target;

      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) {
        return;
      }

      const key = field.dataset.healthProfileField;

      if (!key) {
        return;
      }

      if (key === "sex") {
        if (field instanceof HTMLInputElement && field.checked) {
          state.profile.sex = field.value;
          renderHealthProfile(profileRoot, state);
          saveHealthState(state);
          refreshInsights();
        }
        return;
      }

      if (key === "activity") {
        state.profile.activity = field.value;
        saveHealthState(state);
        refreshInsights();
        return;
      }

      state.profile[key] = field.value;
      saveHealthState(state);
      refreshInsights();
    };

    profileRoot.addEventListener("input", handleProfileChange);
    profileRoot.addEventListener("change", handleProfileChange);
  }

  if (measurementRoot) {
    renderHealthMeasurements(measurementRoot, state);

    measurementRoot.addEventListener("input", (event) => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement) || !input.dataset.healthMeasurement || !input.dataset.healthCheckpoint) {
        return;
      }

      state.measurements[input.dataset.healthMeasurement][input.dataset.healthCheckpoint] = input.value;
      saveHealthState(state);
      refreshInsights();
    });
  }

  if (insightsRoot) {
    refreshInsights();
  }

  if (photoRoot) {
    renderHealthPhotos(photoRoot, state);

    photoRoot.addEventListener("change", async (event) => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement) || !input.dataset.healthPhotoCheckpoint || !input.dataset.healthPhotoAngle) {
        return;
      }

      const file = input.files?.[0];

      if (!file) {
        return;
      }

      setHealthPhotoError(photoRoot, "");

      try {
        const checkpoint = input.dataset.healthPhotoCheckpoint;
        const angle = input.dataset.healthPhotoAngle;
        const previousValue = state.photos[checkpoint][angle];
        state.photos[checkpoint][angle] = await resizeHealthPhoto(file);

        if (!saveHealthState(state)) {
          state.photos[checkpoint][angle] = previousValue;
          setHealthPhotoError(photoRoot, "That photo is too large to save here.");
          return;
        }

        renderHealthPhotos(photoRoot, state);
      } catch (error) {
        setHealthPhotoError(photoRoot, error.message || "That photo could not be saved.");
      } finally {
        input.value = "";
      }
    });

    photoRoot.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const button = event.target.closest("[data-health-photo-remove]");

      if (!button) {
        return;
      }

      const checkpoint = button.dataset.healthPhotoCheckpoint;
      const angle = button.dataset.healthPhotoRemove;

      state.photos[checkpoint][angle] = "";
      saveHealthState(state);
      renderHealthPhotos(photoRoot, state);
    });
  }

  if (foodRoot) {
    renderHealthFood(foodRoot, state);

    foodRoot.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const copyButton = event.target.closest("[data-health-shopping-copy]");

      if (copyButton instanceof HTMLButtonElement) {
        const [weekId, journeyId] = (copyButton.dataset.healthShoppingCopy || "").split("|");
        const activeIndex = healthFoodPlans.findIndex((week) => week.id === weekId);
        const foodWeek = healthFoodPlans[activeIndex];

        if (foodWeek) {
          const journey = getFoodPrepJourneys(foodWeek, activeIndex, state).find((entry) => entry.id === journeyId);

          if (journey) {
            const text = buildFoodJourneyCopyText(journey);
            copyShoppingTextToClipboard(text, copyButton);
          }
        }

        return;
      }

      const navButton = event.target.closest("[data-health-food-week-nav]");
      const weekButton = event.target.closest("[data-health-food-week-select]");

      if (navButton instanceof HTMLButtonElement && !navButton.disabled) {
        const currentIndex = getActiveFoodWeekIndex(state);
        const direction = navButton.dataset.healthFoodWeekNav === "next" ? 1 : -1;
        setActiveFoodWeek(foodRoot, state, currentIndex + direction);
        return;
      }

      if (weekButton instanceof HTMLButtonElement) {
        const selectedIndex = healthFoodPlans.findIndex((week) => week.id === weekButton.dataset.healthFoodWeekSelect);

        if (selectedIndex >= 0) {
          setActiveFoodWeek(foodRoot, state, selectedIndex);
        }
      }
    });

    foodRoot.addEventListener("change", (event) => {
      const target = event.target;

      if (target instanceof HTMLSelectElement && target.dataset.healthSnackWeek && target.dataset.healthSnackDay) {
        const weekId = target.dataset.healthSnackWeek;
        const dayId = target.dataset.healthSnackDay;
        state.snacks[weekId] = state.snacks[weekId] || {};

        if (target.value === "none") {
          state.snacks[weekId][dayId] = null;
        } else if (validHealthSnackIds.has(target.value)) {
          state.snacks[weekId][dayId] = target.value;
        }

        saveHealthState(state);
        renderHealthFood(foodRoot, state);
        return;
      }

      if (!(target instanceof HTMLInputElement) || !target.dataset.healthShoppingWeek || !target.dataset.healthShoppingItem) {
        return;
      }

      const weekId = target.dataset.healthShoppingWeek;
      const itemKey = target.dataset.healthShoppingItem;

      state.shopping[weekId] = state.shopping[weekId] || {};

      if (target.checked) {
        state.shopping[weekId][itemKey] = true;
      } else {
        delete state.shopping[weekId][itemKey];
      }

      saveHealthState(state);
    });

  }

  if (programRoot) {
    renderHealthProgram(programRoot, state);

    programRoot.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const navButton = event.target.closest("[data-health-week-nav]");
      const weekButton = event.target.closest("[data-health-week-select]");

      if (navButton instanceof HTMLButtonElement && !navButton.disabled) {
        const currentIndex = getActiveWorkoutWeekIndex(state);
        const direction = navButton.dataset.healthWeekNav === "next" ? 1 : -1;
        setActiveWorkoutWeek(programRoot, state, currentIndex + direction);
        return;
      }

      if (weekButton instanceof HTMLButtonElement) {
        const selectedIndex = healthWeeks.findIndex((week) => week.id === weekButton.dataset.healthWeekSelect);

        if (selectedIndex >= 0) {
          setActiveWorkoutWeek(programRoot, state, selectedIndex);
        }
      }
    });

    programRoot.addEventListener("input", (event) => {
      const field = event.target;

      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
        return;
      }

      if (field.dataset.healthSetWeek && field.dataset.healthSetDay && field.dataset.healthSetField) {
        const weekId = field.dataset.healthSetWeek;
        const dayId = field.dataset.healthSetDay;
        const exerciseIndex = Number(field.dataset.healthSetExercise);
        const setIndex = Number(field.dataset.healthSetIndex);
        const fieldName = field.dataset.healthSetField;

        if (!Number.isInteger(exerciseIndex) || !Number.isInteger(setIndex) || !["reps", "weight"].includes(fieldName)) {
          return;
        }

        const dayState = state.workouts[weekId]?.days[dayId];

        if (!dayState) {
          return;
        }

        dayState.sets = dayState.sets || {};
        dayState.sets[exerciseIndex] = dayState.sets[exerciseIndex] || Array.from({ length: workoutSetCount }, () => ({ reps: "", weight: "" }));
        dayState.sets[exerciseIndex][setIndex] = dayState.sets[exerciseIndex][setIndex] || { reps: "", weight: "" };
        dayState.sets[exerciseIndex][setIndex][fieldName] = field.value;
        saveHealthState(state);
        return;
      }

      if (field.dataset.healthWeekTarget) {
        state.workouts[field.dataset.healthWeekTarget].target = field.value;
      } else if (field.dataset.healthWeekReview) {
        state.workouts[field.dataset.healthWeekReview].review = field.value;
      } else if (field.dataset.healthDayLog && field.dataset.healthWeek) {
        const dayState = state.workouts[field.dataset.healthWeek].days[field.dataset.healthDayLog];
        dayState.log = field.value;
        dayState.result = field.value;
        dayState.notes = "";
      } else if (field.dataset.healthDayResult && field.dataset.healthWeek) {
        state.workouts[field.dataset.healthWeek].days[field.dataset.healthDayResult].result = field.value;
      } else if (field.dataset.healthDayNotes && field.dataset.healthWeek) {
        state.workouts[field.dataset.healthWeek].days[field.dataset.healthDayNotes].notes = field.value;
      } else {
        return;
      }

      saveHealthState(state);
    });

  }
}

function normalizePathname(pathname) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function getPathForView(view) {
  if (view === "health") {
    return "/yellow/health/";
  }

  return `/yellow/${view}/`;
}

function getRoutedViewFromUrl(url) {
  const hashView = url.hash.replace("#", "");

  if (validViews.has(hashView)) {
    return hashView;
  }

  return routePaths.get(normalizePathname(url.pathname)) ?? null;
}

function getViewFromUrl(url) {
  return getRoutedViewFromUrl(url) ?? "health";
}

function replaceRoute(view) {
  const url = new URL(window.location.href);
  url.pathname = getPathForView(view);
  url.hash = "";
  url.search = "";

  window.history.replaceState({ view }, "", url);
}

function getViewFromLocation() {
  const url = new URL(window.location.href);
  const view = getViewFromUrl(url);
  const hashView = url.hash.replace("#", "");
  const normalizedPath = normalizePathname(url.pathname);

  if ((validViews.has(hashView) && hashView) || routePaths.get(normalizedPath) !== view) {
    replaceRoute(view);
  }

  return view;
}

function updateRoute(view) {
  const url = new URL(window.location.href);
  url.pathname = getPathForView(view);
  url.hash = "";
  url.search = "";

  if (url.href !== window.location.href) {
    window.history.pushState({ view }, "", url);
  }
}

function getActivePanel() {
  return document.querySelector(".yellow-panel.is-active");
}

function setActiveView(view, { animate = true, updateUrl = false } = {}) {
  const nextView = validViews.has(view) ? view : "health";
  const dockView = nextView.startsWith("finance") ? "finance" : nextView;
  const previousPanel = getActivePanel();
  const shouldAnimateLeaving = animate && previousPanel && previousPanel.dataset.yellowPage !== nextView;

  if (updateUrl) {
    updateRoute(nextView);
  }

  body.dataset.view = nextView;
  dock.dataset.selected = dockView;
  window.scrollTo({ top: 0, behavior: "instant" });

  dockItems.forEach((item) => {
    const isSelected = item.dataset.yellowNav === dockView;
    item.classList.toggle("is-selected", isSelected);

    if (isSelected) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  panels.forEach((panel) => {
    const isSelected = panel.dataset.yellowPage === nextView;
    const isLeaving = shouldAnimateLeaving && panel === previousPanel;

    if (panel.leaveTimer) {
      clearTimeout(panel.leaveTimer);
      panel.leaveTimer = null;
    }

    panel.classList.toggle("is-leaving", isLeaving);
    panel.classList.toggle("is-active", isSelected);
    panel.setAttribute("aria-hidden", String(!isSelected));

    if (isLeaving) {
      panel.leaveTimer = setTimeout(() => {
        panel.classList.remove("is-leaving");
        panel.leaveTimer = null;
      }, viewTransitionDuration);
    }
  });
}

function normalizePassword(value) {
  return String(value ?? "").normalize("NFKC").trim().toLowerCase();
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";

  new Uint8Array(bytes).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function getEnvelope() {
  if (!envelopePromise) {
    envelopePromise = fetch(payloadUrl, { cache: "no-cache", headers: { accept: "application/json" } })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`The Yellow payload could not be loaded (${response.status}).`);
        }

        return response.json();
      })
      .then((envelope) => {
        if (envelope?.format !== payloadFormat) {
          throw new Error("The Yellow payload has an unknown format.");
        }

        return envelope;
      })
      .catch((error) => {
        envelopePromise = null;
        throw error;
      });
  }

  return envelopePromise;
}

async function deriveUnlockKey(password, envelope) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(normalizePassword(password)), "PBKDF2", false, ["deriveKey"]);

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: envelope.kdf.hash, salt: base64ToBytes(envelope.kdf.salt), iterations: envelope.kdf.iterations },
    material,
    { name: "AES-GCM", length: envelope.cipher.length },
    true,
    ["decrypt"],
  );
}

async function decryptEnvelope(envelope, key) {
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(envelope.cipher.iv) }, key, base64ToBytes(envelope.ciphertext));
  let bytes = plaintext;

  if (envelope.compression === "gzip") {
    bytes = await new Response(new Blob([plaintext]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
  }

  return JSON.parse(new TextDecoder().decode(bytes));
}

function mountPrivateContent(payload) {
  if (privateContentMounted) {
    return;
  }

  const stage = document.querySelector("[data-yellow-stage]");

  if (!stage || typeof payload?.panels !== "string") {
    throw new Error("The Yellow payload is incomplete.");
  }

  applyPrivateData(payload.data && typeof payload.data === "object" ? payload.data : {});
  stage.insertAdjacentHTML("afterbegin", payload.panels);
  panels = document.querySelectorAll("[data-yellow-page]");
  privateContentMounted = true;

  setupFinanceTotals();
  applyRandomHealthTitle();
  setupHealthTracker();
  setupLetterEditor();
}

function readStoredUnlockKey() {
  try {
    sessionStorage.removeItem(legacyUnlockStorageKey);
    const stored = sessionStorage.getItem(unlockKeyStorageKey);
    return stored ? base64ToBytes(stored) : null;
  } catch {
    return null;
  }
}

async function rememberUnlock(key) {
  // Only the derived AES key is kept, in sessionStorage, so a reload in this tab stays
  // unlocked. It cannot reveal the password, and it is gone when the tab closes.
  try {
    sessionStorage.setItem(unlockKeyStorageKey, bytesToBase64(await crypto.subtle.exportKey("raw", key)));
  } catch {
    // If storage is blocked, the page still unlocks for this load.
  }
}

function forgetUnlock() {
  try {
    sessionStorage.removeItem(unlockKeyStorageKey);
  } catch {
    // Nothing to clear.
  }
}

function unlockYellow() {
  body.classList.remove("is-locked");
  body.classList.add("is-unlocked");

  if (passwordInput) {
    passwordInput.value = "";
    passwordInput.blur();
  }

  setActiveView(getViewFromLocation(), { animate: true });
}

function rejectPassword() {
  if (!gateForm || !passwordInput) {
    return;
  }

  gateForm.classList.remove("is-wrong");
  void gateForm.offsetWidth;
  gateForm.classList.add("is-wrong");
  passwordInput.value = "";
  passwordInput.focus();
}

async function unlockWithPassword(password) {
  const envelope = await getEnvelope();
  const key = await deriveUnlockKey(password, envelope);
  const payload = await decryptEnvelope(envelope, key);

  mountPrivateContent(payload);
  await rememberUnlock(key);
  unlockYellow();
}

async function restoreUnlock() {
  const storedKey = readStoredUnlockKey();

  if (!storedKey) {
    return false;
  }

  try {
    const envelope = await getEnvelope();
    const key = await crypto.subtle.importKey("raw", storedKey, "AES-GCM", false, ["decrypt"]);
    const payload = await decryptEnvelope(envelope, key);

    mountPrivateContent(payload);
    unlockYellow();
    return true;
  } catch {
    forgetUnlock();
    return false;
  }
}

function setupGate() {
  let checking = false;

  setActiveView("health", { animate: false });

  gateForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (checking || !passwordInput) {
      return;
    }

    const password = passwordInput.value;

    if (!normalizePassword(password)) {
      rejectPassword();
      return;
    }

    checking = true;
    gateForm.classList.add("is-checking");
    passwordInput.readOnly = true;

    try {
      await unlockWithPassword(password);
    } catch (error) {
      console.warn("Yellow stayed locked:", error?.message || error?.name || error);
      rejectPassword();
    } finally {
      checking = false;
      gateForm.classList.remove("is-checking");
      passwordInput.readOnly = false;
    }
  });

  restoreUnlock().then((restored) => {
    if (!restored) {
      requestAnimationFrame(() => {
        passwordInput?.focus();
      });
    }
  });
}

function setupNavigation() {
  dockItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (body.classList.contains("is-locked")) {
        return;
      }

      setActiveView(item.dataset.yellowNav, { updateUrl: true });
    });
  });

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest("a[href]");

    if (!link || link.target || link.hasAttribute("download")) {
      return;
    }

    const url = new URL(link.href, window.location.href);

    if (url.origin !== window.location.origin) {
      return;
    }

    const view = getRoutedViewFromUrl(url);

    if (!view || body.classList.contains("is-locked")) {
      return;
    }

    event.preventDefault();
    setActiveView(view, { updateUrl: true });
  });

  window.addEventListener("popstate", () => {
    if (body.classList.contains("is-locked")) {
      setActiveView("health", { animate: false });
      return;
    }

    setActiveView(getViewFromLocation());
  });

  window.addEventListener("hashchange", () => {
    if (body.classList.contains("is-locked")) {
      setActiveView("health", { animate: false });
      return;
    }

    setActiveView(getViewFromLocation());
  });
}

function parseFinanceAmount(text) {
  if (typeof text !== "string") {
    return null;
  }

  const cleaned = text.replace(/[\s€]/g, "");

  if (!cleaned) {
    return null;
  }

  let normalized;

  if (cleaned.includes(",")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if ((cleaned.match(/\./g) || []).length === 1 && /\.\d{1,2}$/.test(cleaned)) {
    normalized = cleaned;
  } else {
    normalized = cleaned.replace(/\./g, "");
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

function formatFinanceAmount(cents) {
  const sign = cents < 0 ? "-" : "";
  const absoluteCents = Math.abs(cents);
  const euros = Math.floor(absoluteCents / 100).toLocaleString("de-DE");
  const remainder = String(absoluteCents % 100).padStart(2, "0");

  return `${sign}${euros},${remainder}€`;
}

function updateFinanceTotal(total, cents) {
  const amount = total.querySelector("strong");
  const formatted = formatFinanceAmount(cents);

  if (amount && amount.textContent.trim() !== formatted) {
    amount.textContent = formatted;
  }
}

function updateFinanceFlowTotals(flow) {
  let groupCents = 0;
  let pageTotalCents = 0;
  let latestTotalCents = 0;

  flow.querySelectorAll(":scope > .finance-row").forEach((row) => {
    const entryAmount = row.querySelector(".finance-entry .finance-entry-amount");
    const total = row.querySelector(".finance-total");

    if (entryAmount) {
      const cents = parseFinanceAmount(entryAmount.textContent);

      if (cents !== null) {
        groupCents += cents;
      }

      return;
    }

    if (!total) {
      return;
    }

    const label = total.querySelector(".finance-total-label")?.textContent.trim().toLowerCase() || "";
    let cents = groupCents;

    if (label === "total") {
      cents = pageTotalCents + groupCents;
      pageTotalCents = cents;
      latestTotalCents = cents;
      groupCents = 0;
    } else if (label.startsWith("divided by")) {
      cents = Math.round((latestTotalCents || pageTotalCents) / 12);
    } else {
      pageTotalCents += groupCents;
      latestTotalCents = pageTotalCents;
      groupCents = 0;
    }

    updateFinanceTotal(total, cents);
  });
}

function setupFinanceTotals() {
  const flows = [...document.querySelectorAll(".finance-flow")];

  function updateTotals() {
    flows.forEach(updateFinanceFlowTotals);
  }

  updateTotals();

  const observer = new MutationObserver(updateTotals);
  flows.forEach((flow) => observer.observe(flow, {
    childList: true,
    characterData: true,
    subtree: true,
  }));

  flows.forEach((flow) => {
    flow.querySelectorAll(".finance-entry-amount").forEach((el) => {
      if (parseFinanceAmount(el.textContent) === null) {
        return;
      }

      el.setAttribute("contenteditable", "plaintext-only");
      el.setAttribute("inputmode", "decimal");
      el.setAttribute("spellcheck", "false");
      el.setAttribute("autocorrect", "off");
      el.setAttribute("autocapitalize", "off");

      el.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          el.blur();
        }
      });

      el.addEventListener("blur", () => {
        const cents = parseFinanceAmount(el.textContent);
        if (cents === null) {
          return;
        }

        const formatted = formatFinanceAmount(cents);
        if (el.textContent !== formatted) {
          el.textContent = formatted;
        }
      });
    });
  });
}

function getLetterFields() {
  return [...document.querySelectorAll("[data-letter-field]")];
}

function isCollapsibleLetterField(field) {
  return field.matches(".letter-body p[data-letter-field]");
}

function updateLetterFieldState(field) {
  field.classList.toggle("is-empty", isCollapsibleLetterField(field) && field.textContent.trim() === "");
}

function applyRandomLetterDraft() {
  const draft = letterDrafts[Math.floor(Math.random() * letterDrafts.length)];

  getLetterFields().forEach((field) => {
    const key = field.dataset.letterField;

    if (typeof draft[key] === "string") {
      field.textContent = draft[key];
    }

    updateLetterFieldState(field);
  });
}

function readLetterState() {
  try {
    const value = localStorage.getItem(letterStorageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveLetterState() {
  const fields = getLetterFields();

  if (!fields.length) {
    return;
  }

  const state = fields.reduce((nextState, field) => {
    updateLetterFieldState(field);
    nextState[field.dataset.letterField] = field.textContent;
    return nextState;
  }, {});

  try {
    localStorage.setItem(letterStorageKey, JSON.stringify(state));
  } catch {
    // Editing still works if storage is unavailable.
  }
}

function restoreLetterState() {
  const state = readLetterState();

  if (!state) {
    return;
  }

  getLetterFields().forEach((field) => {
    const savedValue = state[field.dataset.letterField];

    if (typeof savedValue === "string") {
      field.textContent = savedValue;
    }

    updateLetterFieldState(field);
  });
}

function getCleanLetterClone() {
  const sheet = document.querySelector("[data-letter-sheet]");

  if (!sheet) {
    return null;
  }

  const clone = sheet.cloneNode(true);
  clone.removeAttribute("data-letter-sheet");
  clone.querySelectorAll("[contenteditable], [spellcheck], [data-letter-field]").forEach((field) => {
    field.removeAttribute("contenteditable");
    field.removeAttribute("spellcheck");
    field.removeAttribute("data-letter-field");
    field.removeAttribute("aria-label");
  });

  return clone;
}

function getVisibleStyles() {
  return [...document.styleSheets].map((sheet) => {
    try {
      return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
    } catch {
      return "";
    }
  }).join("\n");
}

function downloadBlob(contents, filename, type) {
  const blob = new Blob([contents], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(link.href);
  }, 1000);
}

function getLetterDocumentHtml(clone) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rafael Polutta Letter</title>
  <style>
${getVisibleStyles()}
@page {
  size: A4;
  margin: 0;
}
html,
body {
  width: 210mm;
  height: 295.5mm;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #fff;
}
.letter-sheet {
  width: 210mm;
  height: 295.5mm;
  min-height: 0;
  margin: 0;
  padding: 29% 9.4% 8%;
  box-sizing: border-box;
  break-after: avoid;
  page-break-after: avoid;
  box-shadow: none;
}
.letter-field,
.letter-field:hover,
.letter-field:focus {
  background: transparent;
  box-shadow: none;
}
  </style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`;
}

function downloadLetterHtml() {
  const clone = getCleanLetterClone();

  if (!clone) {
    return;
  }

  downloadBlob(getLetterDocumentHtml(clone), "rafael-polutta-letter.html", "text/html;charset=utf-8");
}

function loadHtml2Pdf() {
  if (window.html2pdf) {
    return Promise.resolve(window.html2pdf);
  }

  if (html2PdfLoader) {
    return html2PdfLoader;
  }

  html2PdfLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = html2PdfUrl;
    script.async = true;
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => reject(new Error("Unable to load PDF exporter."));
    document.head.append(script);
  });

  return html2PdfLoader;
}

async function downloadLetterPdf(button) {
  const clone = getCleanLetterClone();

  if (!clone) {
    return;
  }

  const previousLabel = button?.textContent;
  const exportRoot = document.createElement("div");
  exportRoot.className = "letter-export-root";
  exportRoot.append(clone);

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Saving";
  }

  document.body.append(exportRoot);

  try {
    await document.fonts?.ready;
    const html2pdf = await loadHtml2Pdf();
    await html2pdf().set({
      filename: "rafael-polutta-letter.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        format: "a4",
        orientation: "portrait",
        unit: "mm",
      },
      margin: 0,
    }).from(clone).save();
  } catch (error) {
    console.warn(error);
    downloadLetterHtml();
  } finally {
    exportRoot.remove();

    if (button) {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  }
}

function printLetter() {
  const clone = getCleanLetterClone();

  if (!clone) {
    return;
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const frame = document.createElement("iframe");
  frame.setAttribute("title", "Printable letter");
  frame.style.position = "fixed";
  frame.style.left = "-120vw";
  frame.style.top = "0";
  frame.style.width = "210mm";
  frame.style.height = "297mm";
  frame.style.border = "0";
  frame.style.opacity = "0";

  document.body.append(frame);

  const frameDocument = frame.contentDocument;

  if (!frameDocument) {
    frame.remove();
    window.print();
    return;
  }

  frameDocument.open();
  frameDocument.write(getLetterDocumentHtml(clone));
  frameDocument.close();

  window.setTimeout(async () => {
    try {
      await frame.contentDocument?.fonts?.ready;
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      window.setTimeout(() => {
        frame.remove();
      }, 1000);
    }
  }, 120);
}

function setupLetterEditor() {
  const fields = getLetterFields();

  if (!fields.length) {
    return;
  }

  applyRandomLetterDraft();

  fields.forEach((field) => {
    updateLetterFieldState(field);

    field.addEventListener("input", () => {
      updateLetterFieldState(field);
      saveLetterState();
    });

    field.addEventListener("blur", () => {
      updateLetterFieldState(field);
      saveLetterState();
    });
  });

  document.querySelectorAll("[data-letter-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.letterAction;

      if (action === "print") {
        printLetter();
        return;
      }

      if (action === "download") {
        downloadLetterPdf(button);
      }
    });
  });
}

setupNavigation();
setupGate();
