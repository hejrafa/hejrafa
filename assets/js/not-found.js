// The 404 page as a playground, after joinakari.com's. The good bits from the home page's curiosity wall
// rain down and pile up behind the words; the mouse bounces them around, a click or tap kicks the ones
// nearby, and the thought bubble (the zero) thinks of a few more. This file only moves things: the page
// reads and works without it.
(() => {
  const stage = document.querySelector(".not-found");
  const bubble = document.querySelector(".not-found-bubble");
  if (!stage || !bubble) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const goodBits = [
    "perfect-days.jpg", "la-la-land.jpg", "once-upon-a-time-in-hollywood.jpg", "blade-runner-2049.jpg",
    "breaking-bad.jpg", "the-bear.jpg", "schitts-creek.jpg", "scrubs.jpg",
    "the-alchemist.png", "zen-motorcycle-maintenance.png", "i-who-have-never-known-men.png", "ready-player-one.png",
    "wasting-light.png", "because-the-internet.png", "the-incredible-true-story.jpg", "hamilton.png",
    "what-now.png", "conan-obrien-needs-a-friend.jpg", "this-american-life.png", "lets-make-mistakes.png",
    "peter-mckinnon.png", "marques-brownlee.png", "andreas-hem.png", "life-of-riza.png",
    "hayao-miyazaki.jpg", "steve-jobs.jpg", "jony-ive.png", "emma-watson.png",
  ].map((name) => `/assets/images/curiosities/${name}`);

  const GRAVITY = 2600; // px/s²
  const BOUNCE = 0.32;
  const STEP = 1 / 120;
  const POINTER_RADIUS = 34;
  const KICK_RADIUS = 190;
  const MAX_SPIN = 300; // degrees a second
  const SPIN_DAMPING = 0.03; // what's left of a spin after a second
  const ROLL = 0.15; // how much of a true roll a tile sliding on the floor makes
  const KNOCK = 220; // px/s: tiles meeting faster than this bounce and turn; slower, they just touch
  const REST_WINDOW = 0.4; // s
  const REST_DISTANCE = 2.5; // px a tile may jiggle within a window and still be at rest
  const MAX_BODIES = 140;

  const layer = document.createElement("div");
  layer.className = "fall";
  layer.setAttribute("aria-hidden", "true");
  stage.append(layer);

  const bodies = [];
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, time: 0, inside: false };
  let width = 0;
  let floor = 0;
  let frame = 0;
  let last = 0;
  let calm = 0; // windows in a row in which nothing went anywhere
  let restClock = 0; // seconds into the current window
  let visible = true;
  let deck = [];

  function measure() {
    width = stage.clientWidth;
    floor = stage.clientHeight - 18; // a little above the bottom, so the shadows fit
  }

  // Each good bit once before any repeats.
  function nextGoodBit() {
    if (!deck.length) deck = [...goodBits].sort(() => Math.random() - 0.5);
    return deck.pop();
  }

  function addItem(size, x, y) {
    const item = document.createElement("span");
    item.className = "fall-item";
    item.style.width = `${size}px`;
    item.style.height = `${size}px`;
    const image = document.createElement("img");
    image.src = nextGoodBit();
    image.alt = "";
    image.decoding = "async";
    item.append(image);
    layer.append(item);
    bodies.push({
      item, size, r: size * 0.5, x, y, lastX: x, lastY: y,
      vx: -60 + Math.random() * 120, vy: 0,
      angle: -30 + Math.random() * 60, spin: -40 + Math.random() * 80,
    });
    while (bodies.length > MAX_BODIES) bodies.shift().item.remove();
  }

  function tileSize() {
    return Math.min(78, Math.max(46, width * 0.045 + 28));
  }

  // A good heap: rows from side to side, two to three deep. Smaller and fewer on a phone.
  function fill() {
    measure();
    const words = stage.querySelector(".not-found-words").getBoundingClientRect();
    const room = Math.max(60, floor - (words.bottom - stage.getBoundingClientRect().top));
    const size = tileSize();
    const row = width / (size * 0.9);
    const rows = Math.min(2.4, Math.max(1.6, room / (size * 0.95)));
    const count = Math.round(Math.min(70, row * rows));
    for (let index = 0; index < count; index++) {
      const itemSize = Math.round(size * (0.85 + Math.random() * 0.3));
      addItem(itemSize, itemSize / 2 + Math.random() * (width - itemSize), -itemSize - Math.random() * stage.clientHeight * 1.1);
    }
  }

  function collide(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const reach = a.r + b.r;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= reach * reach || distanceSquared === 0) return;
    const distance = Math.sqrt(distanceSquared);
    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = (reach - distance) / 2;
    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;
    const along = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (along >= 0) return;
    // In a heap, gravity presses them together every step: those meet without a bounce.
    const knock = along < -KNOCK;
    const impulse = (-(1 + (knock ? BOUNCE : 0)) * along) / 2;
    a.vx -= impulse * nx;
    a.vy -= impulse * ny;
    b.vx += impulse * nx;
    b.vy += impulse * ny;
    if (!knock) return;
    const across = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
    a.spin -= across * 0.08;
    b.spin += across * 0.08;
  }

  function step(dt) {
    const drag = Math.pow(0.6, dt);
    for (const body of bodies) {
      body.vy += GRAVITY * dt;
      body.vx *= drag;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.spin = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, body.spin)) * Math.pow(SPIN_DAMPING, dt);
      body.angle += body.spin * dt;
    }

    // The moving mouse shoves whatever it touches, harder the faster it goes; at rest it lets the heap settle.
    const still = Math.pow(1e-8, dt);
    pointer.vx *= still;
    pointer.vy *= still;
    if (pointer.inside && Math.hypot(pointer.vx, pointer.vy) > 60) {
      for (const body of bodies) {
        const dx = body.x - pointer.x;
        const dy = body.y - pointer.y;
        const reach = body.r + POINTER_RADIUS;
        const distance = Math.hypot(dx, dy);
        if (distance >= reach || distance === 0) continue;
        const nx = dx / distance;
        const ny = dy / distance;
        body.x = pointer.x + nx * reach;
        body.y = pointer.y + ny * reach;
        const into = body.vx * nx + body.vy * ny;
        if (into < 0) {
          body.vx -= into * nx;
          body.vy -= into * ny;
        }
        const push = Math.max(0, pointer.vx * nx + pointer.vy * ny) * 1.2;
        body.vx += nx * push;
        body.vy += ny * push;
        body.spin += (pointer.vx * -ny + pointer.vy * nx) * 0.05;
      }
    }

    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) collide(bodies[i], bodies[j]);
      }
    }

    for (const body of bodies) {
      if (body.y + body.r > floor) {
        body.y = floor - body.r;
        body.vy = body.vy > 120 ? -body.vy * BOUNCE : 0;
        body.vx *= Math.pow(0.05, dt);
        body.spin = ((body.vx / body.r) * 180 * ROLL) / Math.PI;
      }
      if (body.x - body.r < 0) {
        body.x = body.r;
        body.vx = Math.abs(body.vx) * BOUNCE;
      } else if (body.x + body.r > width) {
        body.x = width - body.r;
        body.vx = -Math.abs(body.vx) * BOUNCE;
      }
      body.vy = Math.max(body.vy, -2400);
    }
  }

  function render() {
    for (const body of bodies) {
      body.item.style.transform = `translate(${body.x - body.size / 2}px, ${body.y - body.size / 2}px) rotate(${body.angle}deg)`;
    }
  }

  function tick(now) {
    frame = 0;
    const elapsed = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (let remaining = elapsed; remaining > 1e-6; remaining -= STEP) step(Math.min(STEP, remaining));
    render();
    // At rest means having gone nowhere over a little while; once everything is, the page stops animating.
    restClock += elapsed;
    if (restClock >= REST_WINDOW) {
      let moving = false;
      for (const body of bodies) {
        const moved = Math.abs(body.x - body.lastX) + Math.abs(body.y - body.lastY);
        if (moved > REST_DISTANCE || body.y < 0) moving = true;
        else body.spin *= 0.2;
        body.lastX = body.x;
        body.lastY = body.y;
      }
      calm = moving ? 0 : calm + 1;
      restClock = 0;
    }
    if (calm < 2 && visible) frame = requestAnimationFrame(tick);
  }

  function wake() {
    calm = 0;
    restClock = 0;
    if (frame || !visible || reducedMotion) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function stagePoint(event) {
    const box = stage.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  stage.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || reducedMotion) return;
    const point = stagePoint(event);
    const elapsed = Math.max(0.008, (event.timeStamp - pointer.time) / 1000);
    if (pointer.inside) {
      pointer.vx = Math.max(-3000, Math.min(3000, (point.x - pointer.x) / elapsed));
      pointer.vy = Math.max(-3000, Math.min(3000, (point.y - pointer.y) / elapsed));
    }
    Object.assign(pointer, point, { time: event.timeStamp, inside: true });
    wake();
  });

  stage.addEventListener("pointerleave", () => {
    pointer.inside = false;
    pointer.vx = 0;
    pointer.vy = 0;
  });

  // A click or tap kicks what's near it up and away. On a phone, where nothing hovers, this is the game.
  stage.addEventListener("pointerdown", (event) => {
    if (reducedMotion || event.button > 0 || event.target.closest("a, button")) return;
    const point = stagePoint(event);
    for (const body of bodies) {
      const dx = body.x - point.x;
      const dy = body.y - point.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance > KICK_RADIUS) continue;
      const strength = 1 - distance / KICK_RADIUS;
      body.vx += (dx / distance) * 900 * strength;
      body.vy += (dy / distance) * 700 * strength - 1100 * strength;
      body.spin += (-240 + Math.random() * 480) * strength;
    }
    wake();
  });

  // The thought bubble thinks of a few more good bits, which drop in from above.
  bubble.addEventListener("click", () => {
    bubble.classList.remove("is-puffing");
    void bubble.offsetWidth;
    bubble.classList.add("is-puffing");
    navigator.vibrate?.(10);
    measure();
    const size = tileSize();
    const box = bubble.getBoundingClientRect();
    const stageBox = stage.getBoundingClientRect();
    const fromX = box.left + box.width / 2 - stageBox.left;
    for (let index = 0; index < 4; index++) {
      const itemSize = Math.round(size * (0.85 + Math.random() * 0.3));
      const x = Math.max(itemSize / 2, Math.min(width - itemSize / 2, fromX - 120 + Math.random() * 240));
      addItem(itemSize, x, -itemSize - index * itemSize * 0.8);
    }
    if (reducedMotion) {
      settle();
      return;
    }
    render();
    wake();
  });

  // With reduced motion nothing falls: the good bits simply lie where they would have landed.
  function settle() {
    for (let index = 0; index < 900; index++) step(STEP);
    render();
  }

  // A new size moves the floor and walls: the tiles fall or are pushed to where they now are.
  new ResizeObserver(() => {
    measure();
    for (const body of bodies) {
      body.x = Math.max(body.r, Math.min(width - body.r, body.x));
      body.y = Math.min(floor - body.r, body.y);
    }
    if (reducedMotion && bodies.length) {
      settle();
      return;
    }
    render();
    wake();
  }).observe(stage);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  }).observe(stage);

  function start() {
    fill();
    if (reducedMotion) {
      settle();
      return;
    }
    render();
    wake();
  }

  // The words rise first; then the good bits come down.
  document.fonts.ready.then(() => window.setTimeout(start, reducedMotion ? 0 : 450));
})();
