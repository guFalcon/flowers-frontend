import { playArea } from "./layout.js";
import { state } from "./state.js";

export function updateFill(flowerEl) {
  const fillEl = flowerEl.querySelector(".fill");
  const fillValue = parseFloat(flowerEl.dataset.fill);
  fillEl.style.transform = `scale(${fillValue})`;
}

// Everything the drawn element depends on; the play-area size is included because the pixel
// layout is derived from it, so the next level-update after a resize redraws the flowers
function flowerSignature(data) {
  return JSON.stringify([
    data.x, data.y, data.size, data.petals, data.color, data.petalColors, data.stampColor,
    playArea.clientWidth, playArea.clientHeight
  ]);
}

// ====== Flower creation ======
export function createFlower(data) {
  const root = document.createElement("div");
  root.className = "flower";
  root.dataset.fill = data.fill;
  root.dataset.rate = data.rate;
  root.dataset.signature = flowerSignature(data);
  if (data.id) root.dataset.id = data.id;

  const areaW = playArea.clientWidth;
  const areaH = playArea.clientHeight;
  const px = data.x * areaW;
  const py = data.y * areaH;
  const size = data.size * areaH;

  root.style.width = size + "px";
  root.style.height = size + "px";
  root.style.left = px - size / 2 + "px";
  root.style.top = py - size / 2 + "px";

  // Petals
  for (let i = 0; i < data.petals; i++) {
    const petal = document.createElement("div");
    petal.className = "petal";
    petal.style.width = size * 0.6 + "px";
    petal.style.height = size * 0.6 + "px";
    petal.style.background = (Array.isArray(data.petalColors) && data.petalColors[i]) 
      ? data.petalColors[i] 
      : data.color;
    petal.style.top = size * 0.2 + "px";
    petal.style.left = size * 0.2 + "px";
    petal.style.transform = `rotate(${i * (360 / data.petals)}deg) translate(0, -${size * 0.3}px)`;
    root.appendChild(petal);
  }

  // Center + fill
  const centerSize = size * 0.35;
  const fillSize = centerSize * 1.1;

  const fillEl = document.createElement("div");
  fillEl.className = "fill";
  fillEl.style.width = fillSize + "px";
  fillEl.style.height = fillSize + "px";
  fillEl.style.top = (size - fillSize) / 2 + "px";
  fillEl.style.left = (size - fillSize) / 2 + "px";
  root.appendChild(fillEl);

  const centerEl = document.createElement("div");
  centerEl.className = "center";
  centerEl.style.width = centerSize + "px";
  centerEl.style.height = centerSize + "px";
  centerEl.style.top = (size - centerSize) / 2 + "px";
  centerEl.style.left = (size - centerSize) / 2 + "px";
  if (data.stampColor) centerEl.style.background = data.stampColor;
  root.appendChild(centerEl);

  updateFill(root);
  return root;
}

// Applies the level's flowers to the ones on screen by id: unchanged flowers keep their element and
// only take over fill and rate, changed ones are redrawn, new ones added, missing ones removed
export function buildLevel() {
  if (!state.levelData || !Array.isArray(state.levelData.flowers)) return;
  const existing = new Map();
  playArea.querySelectorAll(".flower").forEach(el => existing.set(el.dataset.id, el));

  state.levelData.flowers.forEach(f => {
    const el = existing.get(f.id);
    existing.delete(f.id);
    if (el && el.dataset.signature === flowerSignature(f)) {
      el.dataset.fill = f.fill;
      el.dataset.rate = f.rate;
      updateFill(el);
    } else if (el) {
      el.replaceWith(createFlower(f));
    } else {
      playArea.appendChild(createFlower(f));
    }
  });

  existing.forEach(el => el.remove());
}

// Harvest by any player (SSE `harvest` event): set the fill and flash the center
export function showHarvest(data) {
  const flowerEl = playArea.querySelector(`.flower[data-id="${data.flowerId}"]`);
  if (!flowerEl) return;
  flowerEl.dataset.fill = typeof data.fill === "number" ? data.fill : 0;
  updateFill(flowerEl);
  const center = flowerEl.querySelector(".center");
  if (center) {
    center.classList.remove("depleted");
    void center.offsetWidth;
    center.classList.add("depleted");
  }
}

// Passive flower fill growth, predicted at the server's pace (rate per second); level-update and
// harvest events overwrite the predicted value
export function startFillGrowth() {
  setInterval(() => {
    document.querySelectorAll(".flower").forEach(flowerEl => {
      let val = parseFloat(flowerEl.dataset.fill);
      let rate = parseFloat(flowerEl.dataset.rate);
      val = Math.min(1, val + rate);
      flowerEl.dataset.fill = val;
      updateFill(flowerEl);
    });
  }, 1000);
}
