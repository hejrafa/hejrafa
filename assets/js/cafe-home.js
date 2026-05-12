const cafeObjects = document.querySelectorAll("[data-cafe-object]");
const inspection = document.querySelector(".inspection");
const inspectionTitle = document.querySelector("#inspection-title");
const inspectionCopy = document.querySelector("#inspection-copy");
const inspectionLink = document.querySelector("#inspection-link");

function setInspection(target) {
  cafeObjects.forEach((object) => object.classList.remove("is-active"));
  target.classList.add("is-active");
  inspection.classList.remove("is-idle");

  inspectionTitle.textContent = target.dataset.title;
  inspectionCopy.textContent = target.dataset.copy;
  inspectionLink.textContent = target.dataset.cta;
  inspectionLink.href = target.href;
}

cafeObjects.forEach((object) => {
  object.addEventListener("mouseenter", () => setInspection(object));
  object.addEventListener("focus", () => setInspection(object));
  object.addEventListener("touchstart", () => setInspection(object), { passive: true });
});
