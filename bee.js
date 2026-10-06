import { serverNow } from "./clock.js";

// Position on a path of keyframes [{t, x, y}] at server time t: the first keyframe before the flight, the
// last one after it, linear in between (same as Bee.positionAt in the backend)
export function positionOnPath(path, t) {
  const first = path[0];
  if (t <= first.t) return { x: first.x, y: first.y };
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    if (t < to.t) {
      const f = (t - from.t) / (to.t - from.t);
      return { x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f };
    }
  }
  const last = path[path.length - 1];
  return { x: last.x, y: last.y };
}

// ======================
// Multi-instance Bee.js
// ======================
export class Bee {
  beeRelX = 0.5;
  beeRelY = 0.5;
  jitterAmount = 0.025;
  flightId = 0;
  isFlying = false;
  // Server time (epoch ms) at which the current flight ends
  flightEndTime = null;
  path = null;
  pathKey = null;
  jitterActive = false;
  jitterFrame = null;

  constructor(playArea, audioSystem, id = null) {
    this.playArea = playArea;
    this.audioSystem = audioSystem;
    this.id = id || crypto.randomUUID();
    this.createElements();
    this.update();
  }

  // Create wrapper + bee image — unique per instance
  createElements() {
    // --- wrapper ---
    this.wrapper = document.createElement("div");
    this.wrapper.className = "bee-tint-wrapper";
    this.wrapper.dataset.beeId = this.id;
    this.wrapper.style.position = "absolute";
    this.wrapper.style.pointerEvents = "none";
    this.wrapper.style.zIndex = 5000;

    // --- bee image ---
    this.bee = document.createElement("div");
    this.bee.className = "bee";
    this.bee.style.width = "100%";
    this.bee.style.height = "100%";
    this.bee.style.background = "url('bee.png') center/contain no-repeat";
    this.bee.style.position = "absolute";
    this.bee.style.left = 0;
    this.bee.style.top = 0;
    this.bee.style.pointerEvents = "none";

    this.wrapper.appendChild(this.bee);

    if (!this.wrapper.classList.contains("bee-tint")) {
      this.wrapper.classList.add("bee-tint");
    }

    this.playArea.appendChild(this.wrapper);
  }

  // Update DOM position and jitter offset
  update(jitterX = 0, jitterY = 0) {
    const areaW = this.playArea.clientWidth;
    const areaH = this.playArea.clientHeight;
    const beeSize = areaH * 0.07;
    this.wrapper.style.width = beeSize + "px";
    this.wrapper.style.height = beeSize + "px";
    this.wrapper.style.left = this.beeRelX * areaW - beeSize / 2 + "px";
    this.wrapper.style.top = this.beeRelY * areaH - beeSize / 2 + "px";
    this.wrapper.style.transform = `translate(${jitterX * areaW}px, ${jitterY * areaH}px)`;
  }

  // Put the bee at relative coords at once: no flight animation, no sound
  placeAt(relX, relY) {
    this.beeRelX = relX;
    this.beeRelY = relY;
    this.update(0, 0);
  }

  incrementFlightId() {
    this.flightId = (this.flightId || 0) + 1;
    return this.flightId;
  }

  // Follow the server path: keyframes [{t, x, y}] in server time, straight lines at constant speed in
  // between. The bee is placed at its position for the current server time at once, so a bee that shows
  // up mid-flight continues from there instead of flying in.
  setPath(path) {
    if (!Array.isArray(path) || path.length === 0) return;
    const last = path[path.length - 1];
    const key = `${last.t}|${last.x}|${last.y}`;
    if (key === this.pathKey) return;
    this.pathKey = key;
    this.path = path;
    this.stopJitter();

    if (serverNow() >= last.t) {
      this.endFlight();
      return;
    }
    if (!this.isFlying) this.audioSystem.play("bee");
    this.isFlying = true;
    this.flightEndTime = last.t;
    this.jitterActive = true;
    this.followPath();
  }

  // One step per frame along the path, with a small random wiggle while flying
  followPath() {
    const t = serverNow();
    if (t >= this.flightEndTime) {
      this.endFlight();
      return;
    }
    const p = positionOnPath(this.path, t);
    this.beeRelX = p.x;
    this.beeRelY = p.y;
    const jitterX = (Math.random() - 0.5) * this.jitterAmount * 2;
    const jitterY = (Math.random() - 0.5) * this.jitterAmount * 2;
    this.update(jitterX, jitterY);
    this.jitterFrame = requestAnimationFrame(() => this.followPath());
  }

  endFlight() {
    const last = this.path[this.path.length - 1];
    this.jitterActive = false;
    this.jitterFrame = null;
    this.placeAt(last.x, last.y);
    if (this.isFlying) this.audioSystem.stop("bee");
    this.isFlying = false;
    this.flightEndTime = null;
  }

  stopJitter() {
    this.jitterActive = false;
    if (this.jitterFrame) {
      cancelAnimationFrame(this.jitterFrame);
      this.jitterFrame = null;
    }
    this.update(0, 0);
  }

  setTint(color) {
    this.wrapper.style.setProperty("--bee-tint", color);
  }

  destroy() {
    this.stopJitter();
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.remove();
    }
  }
}
