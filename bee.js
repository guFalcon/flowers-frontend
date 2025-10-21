// ======================
// Multi-instance Bee.js
// ======================
class Bee {
  beeRelX = 0.5;
  beeRelY = 0.5;
  jitterAmount = 0.025;
  baseSpeed = 5; // seconds per unit distance
  flightId = 0;
  isFlying = false;
  flightEndTime = null;
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

  // Calculate travel duration in milliseconds
  getTravelDurationInMillis(fromRelX, fromRelY, toRelX, toRelY) {
    const dx = toRelX - fromRelX;
    const dy = toRelY - fromRelY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDuration = 0.2; // seconds
    const duration = Math.max(dist * this.baseSpeed, minDuration) * 1000;
    return duration;
  }

  incrementFlightId() {
    this.flightId = (this.flightId || 0) + 1;
    return this.flightId;
  }

  // Smoothly move the bee to new relative coords
  moveTo(relX, relY) {
    this.audioSystem.play("bee");

    const myFlight = this.flightId;

    // Get actual current position from DOM
    const areaW = this.playArea.clientWidth;
    const areaH = this.playArea.clientHeight;
    const rect = this.wrapper.getBoundingClientRect();
    const areaRect = this.playArea.getBoundingClientRect();
    const currentLeft = rect.left + rect.width / 2 - areaRect.left;
    const currentTop = rect.top + rect.height / 2 - areaRect.top;
    const currentRelX = currentLeft / areaW;
    const currentRelY = currentTop / areaH;

    const duration = this.getTravelDurationInMillis(
      currentRelX,
      currentRelY,
      relX,
      relY
    );

    // Apply transition BEFORE updating target
    this.wrapper.style.transition = `left ${
      duration / 1000
    }s linear, top ${duration / 1000}s linear, width 0.2s, height 0.2s, transform 0.12s`;

    // Update target position
    this.beeRelX = relX;
    this.beeRelY = relY;

    this.isFlying = true;
    this.flightEndTime = performance.now() + duration;
    this.startJitter(duration, myFlight);

    return duration;
  }

  // Small random wiggle while flying
  startJitter(duration = 700, flightId = this.flightId) {
    this.stopJitter();
    this.jitterActive = true;
    const start = performance.now();

    const animate = (now) => {
      // Stop if another flight started
      if (flightId !== this.flightId) {
        this.jitterActive = false;
        this.update(0, 0);
        return;
      }

      const elapsed = now - start;
      if (elapsed > duration) {
        this.jitterActive = false;
        this.update(0, 0);
        this.isFlying = false;
        this.flightEndTime = null;
        this.audioSystem.stop("bee");
        return;
      }

      const jitterX = (Math.random() - 0.5) * this.jitterAmount * 2;
      const jitterY = (Math.random() - 0.5) * this.jitterAmount * 2;
      this.update(jitterX, jitterY);
      this.jitterFrame = requestAnimationFrame(animate);
    };

    this.jitterFrame = requestAnimationFrame(animate);
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

// Expose globally
window.Bee = Bee;
