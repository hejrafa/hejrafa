const objects = document.querySelectorAll("[data-object]");
const drawerTitle = document.querySelector("#drawer-title");
const drawerCopy = document.querySelector("#drawer-copy");

const copy = {
  "Selected Work": "A project card that lifts like something you pulled from a stack, with enough preview to invite a click.",
  "Visual Archive": "The back polaroid slips out on hover, giving the interaction a little private-discovery feeling.",
  "Open Notes": "A note peeks open instead of acting like a normal button. This could become writing, process, or a tiny drawer.",
  "Inventory": "A receipt can turn practical pages into something tactile: tools, subscriptions, costs, and objects.",
  "About Rafa": "A personal card can be direct without feeling like a corporate bio block.",
  "Contact": "The envelope is obvious, but still gets to have a little charm.",
};

function activate(object) {
  objects.forEach((item) => item.classList.remove("is-active"));
  object.classList.add("is-active");
  drawerTitle.textContent = object.dataset.title;
  drawerCopy.textContent = copy[object.dataset.title];
}

objects.forEach((object) => {
  object.addEventListener("mouseenter", () => activate(object));
  object.addEventListener("focus", () => activate(object));

  if (object.classList.contains("note-folder")) {
    object.addEventListener("click", () => {
      const isOpen = object.classList.toggle("is-open");
      object.setAttribute("aria-expanded", String(isOpen));
      activate(object);
    });
  }
});
