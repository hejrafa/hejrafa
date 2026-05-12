const cutouts = document.querySelectorAll(".cutout");
const stage = document.querySelector(".photo-stage");
const note = document.querySelector(".hover-note");
const title = document.querySelector("#hover-title");
const copy = document.querySelector("#hover-copy");

const hitAreas = [
  {
    selector: ".cutout-imac",
    key: "imac",
    points: [[7.6, 34.9], [29.8, 34.9], [35.3, 42.2], [34.1, 52.1], [22.6, 52.1], [19.1, 60.2], [9.5, 57.3]],
  },
  {
    selector: ".cutout-photo",
    key: "photo",
    points: [[31.9, 3.5], [70.9, 3.5], [70.7, 39.7], [32.7, 39.7]],
  },
].map((area) => ({
  ...area,
  element: document.querySelector(area.selector),
}));

function isInsidePolygon(point, polygon) {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [currentX, currentY] = polygon[index];
    const [previousX, previousY] = polygon[previous];
    const intersects = currentY > point.y !== previousY > point.y
      && point.x < ((previousX - currentX) * (point.y - currentY)) / (previousY - currentY) + currentX;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function showNote(target) {
  cutouts.forEach((cutout) => cutout.classList.remove("is-active"));
  target.classList.add("is-active");
  stage.dataset.active = target.classList.contains("cutout-imac") ? "imac" : "photo";
  stage.style.cursor = "pointer";
  note.classList.remove("is-idle");
  title.textContent = target.dataset.title;
  copy.textContent = target.dataset.copy;
}

function clearActive() {
  cutouts.forEach((cutout) => cutout.classList.remove("is-active"));
  delete stage.dataset.active;
  stage.style.cursor = "default";
}

function getActiveArea(event) {
  const bounds = stage.getBoundingClientRect();
  const point = {
    x: ((event.clientX - bounds.left) / bounds.width) * 100,
    y: ((event.clientY - bounds.top) / bounds.height) * 100,
  };

  return hitAreas.find((area) => isInsidePolygon(point, area.points));
}

stage.addEventListener("mousemove", (event) => {
  const area = getActiveArea(event);

  if (area) {
    showNote(area.element);
    return;
  }

  clearActive();
});

stage.addEventListener("click", (event) => {
  const area = getActiveArea(event);

  if (area) {
    window.location.href = area.element.href;
  }
});

stage.addEventListener("mouseleave", clearActive);

cutouts.forEach((cutout) => {
  cutout.addEventListener("mouseenter", () => showNote(cutout));
  cutout.addEventListener("focus", () => showNote(cutout));
  cutout.addEventListener("touchstart", () => showNote(cutout), { passive: true });
});
