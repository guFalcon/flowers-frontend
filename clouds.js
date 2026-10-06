import { playArea } from "./layout.js";
import { serverNow } from "./clock.js";

// ====== Clouds ======
// Mirrors services/Weather.java of the backend exactly, so the clouds are drawn where the server sees them
// when it computes the bees' flights.

// Play-area width per height (aspect 9:16), converts horizontal distances to heights
const WIDTH_PER_HEIGHT = 9 / 16;

let clouds = [];
let wind = [];
let layer = null;
const cloudEls = new Map();
let frame = null;

// A cloud that has completely left the range [0, 1] re-enters on the opposite side
function wrap(p, radius) {
  const min = -radius;
  const span = 1 + 2 * radius;
  return ((p - min) % span + span) % span + min;
}

// Position of the cloud at server time t: its anchor (x, y at cloud.t) moved piece by piece along the
// wind schedule, then wrapped around the play area. x in widths, y in heights.
export function cloudPositionAt(cloud, wind, t) {
  const from = Math.min(cloud.t, t);
  const to = Math.max(cloud.t, t);
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < wind.length; i++) {
    // The first angle also holds before its keyframe, the last one after it
    const start = i === 0 ? -Infinity : wind[i].t;
    const end = i + 1 < wind.length ? wind[i + 1].t : Infinity;
    const overlap = Math.min(to, end) - Math.max(from, start);
    if (overlap <= 0) continue;
    const distance = cloud.speed * overlap / 1000;
    const angle = wind[i].angle + cloud.drift;
    dx += distance * Math.cos(angle);
    dy += distance * Math.sin(angle);
  }
  const sign = t >= cloud.t ? 1 : -1;
  const radius = cloud.size / 2;
  return {
    x: wrap(cloud.x + sign * dx / WIDTH_PER_HEIGHT, radius / WIDTH_PER_HEIGHT),
    y: wrap(cloud.y + sign * dy, radius),
  };
}

function ensureLayer() {
  if (layer && layer.isConnected) return layer;
  layer = document.createElement("div");
  layer.className = "cloud-layer";
  playArea.appendChild(layer);
  return layer;
}

// Replaces the drawn clouds with those of the level and keeps them moving
export function renderClouds(level) {
  clouds = Array.isArray(level?.clouds) ? level.clouds : [];
  wind = Array.isArray(level?.wind) ? level.wind : [];
  const container = ensureLayer();

  const ids = new Set(clouds.map(c => c.id));
  for (const [id, el] of cloudEls) {
    if (!ids.has(id)) {
      el.remove();
      cloudEls.delete(id);
    }
  }
  clouds.forEach(c => {
    if (cloudEls.has(c.id)) return;
    const el = document.createElement("div");
    el.className = "cloud";
    el.dataset.id = c.id;
    container.appendChild(el);
    cloudEls.set(c.id, el);
  });

  positionClouds();
  if (frame === null) frame = requestAnimationFrame(animate);
}

function positionClouds() {
  const areaW = playArea.clientWidth;
  const areaH = playArea.clientHeight;
  const now = serverNow();
  clouds.forEach(c => {
    const el = cloudEls.get(c.id);
    if (!el) return;
    const p = cloudPositionAt(c, wind, now);
    const diameter = c.size * areaH;
    el.style.width = diameter + "px";
    el.style.height = diameter + "px";
    el.style.left = p.x * areaW - diameter / 2 + "px";
    el.style.top = p.y * areaH - diameter / 2 + "px";
  });
}

function animate() {
  positionClouds();
  frame = requestAnimationFrame(animate);
}
