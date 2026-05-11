const heroLine = document.querySelector("#hero-line");
const promptLine = document.querySelector("#prompt-line");
const cardField = document.querySelector(".card-field");
const dock = document.querySelector(".dock");
const dockItems = document.querySelectorAll("[data-nav-link]");
const stackCards = document.querySelectorAll(".card-field [data-card]");
const draggableCard = document.querySelector("[data-draggable-card]");
const draggableHandle = document.querySelector("[data-polaroid-handle]");

const heroLines = [
  ["still collecting the good bits", "open a card or pull the photo."],
  ["make yourself nosy", "click around a little."],
  ["a small public shelf", "start with work, notes, or about."],
  ["things worth keeping nearby", "pick a card to begin."],
  ["not everything needs a menu", "use the stack or the dock."],
  ["welcome to the soft launch", "start wherever you like."],
  ["half portfolio, half pocket", "open the stack."],
  ["a homepage with loose pockets", "click the top card."],
  ["carefully kept, casually placed", "choose a way in."],
  ["a few doors, no hallway", "use the small index below."],
  ["useful things first", "work, notes, about."],
  ["everything here is a handle", "hover, pull, click."],
];

function setRandomHeroLine() {
  const [line, prompt] = heroLines[Math.floor(Math.random() * heroLines.length)];
  heroLine.textContent = line;
  promptLine.textContent = prompt;
}

dockItems.forEach((item) => {
  item.addEventListener("click", () => {
    dock.dataset.selected = item.dataset.navLink;
  });
});

stackCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    if (card.dataset.card === "photo") {
      return;
    }

    if (card.dataset.card === cardField.dataset.activeCard) {
      event.preventDefault();
      cardField.dataset.activeCard = card.dataset.card === "work" ? "notes" : "work";
      return;
    }

    event.preventDefault();
    cardField.dataset.activeCard = card.dataset.card;
  });
});

let drag = null;
let didDrag = false;

draggableHandle.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  drag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: Number(draggableCard.dataset.x || 0),
    y: Number(draggableCard.dataset.y || 0),
  };
  didDrag = false;

  draggableCard.classList.add("is-dragging");
  draggableHandle.classList.add("is-dragging");
  draggableHandle.setPointerCapture(event.pointerId);
});

draggableHandle.addEventListener("pointerenter", () => {
  draggableHandle.classList.add("is-hovered");
});

draggableHandle.addEventListener("pointerleave", () => {
  draggableHandle.classList.remove("is-hovered");
});

document.addEventListener("pointermove", (event) => {
  const bounds = draggableHandle.getBoundingClientRect();
  const isOverHandle = event.clientX >= bounds.left
    && event.clientX <= bounds.right
    && event.clientY >= bounds.top
    && event.clientY <= bounds.bottom;

  draggableHandle.classList.toggle("is-hovered", isOverHandle);
});

draggableHandle.addEventListener("pointermove", (event) => {
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  const x = drag.x + event.clientX - drag.startX;
  const y = drag.y + event.clientY - drag.startY;
  didDrag = Math.abs(x - drag.x) > 3 || Math.abs(y - drag.y) > 3;

  if (Math.abs(x) > 8 || Math.abs(y) > 8) {
    draggableCard.classList.add("is-pulled");
    draggableHandle.classList.add("is-pulled");
  }

  draggableCard.dataset.x = String(x);
  draggableCard.dataset.y = String(y);
  draggableCard.style.translate = `${x}px ${y}px`;
  draggableHandle.style.translate = `${x}px ${y}px`;
});

function stopDrag(event) {
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  draggableCard.classList.remove("is-dragging");
  draggableHandle.classList.remove("is-dragging");
  drag = null;
}

draggableHandle.addEventListener("pointerup", stopDrag);
draggableHandle.addEventListener("pointercancel", stopDrag);
draggableHandle.addEventListener("click", (event) => {
  if (didDrag) {
    event.preventDefault();
  }
});

cardField.dataset.activeCard = "work";
dock.dataset.selected = "home";
setRandomHeroLine();
