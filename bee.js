class Bee {
  baseSpeed = 4.5; // seconds per unit distance
  flightId = 0;
  isFlying = false;
  flightEndTime = null;

  constructor(playArea, audioSystem) {
    this.playArea = playArea;
    this.audioSystem = audioSystem;
    this.beeRelX = 0.5;
    this.beeRelY = 0.5;
    this.jitterAmount = 0.025; // increased jitter
    this.jitterActive = false;
    this.jitterFrame = null;
    this.createElements();
    this.update();
  }

  createElements() {
    this.wrapper = document.getElementById('beeTintWrapper');
    if (!this.wrapper) {
      this.wrapper = document.createElement('div');
      this.wrapper.id = 'beeTintWrapper';
      this.wrapper.style.position = 'absolute';
      this.wrapper.style.pointerEvents = 'none';
      this.wrapper.style.zIndex = 5000;
    }
    this.bee = this.wrapper.querySelector('#bee');
    if (!this.bee) {
      this.bee = document.createElement('div');
      this.bee.id = 'bee';
      this.bee.style.width = '100%';
      this.bee.style.height = '100%';
      this.bee.style.background = "url('bee.png') center/contain no-repeat";
      this.bee.style.position = 'absolute';
      this.bee.style.left = 0;
      this.bee.style.top = 0;
      this.bee.style.pointerEvents = 'none';
      this.wrapper.appendChild(this.bee);
    }
    if (!this.wrapper.classList.contains('bee-tint')) {
      this.wrapper.classList.add('bee-tint');
    }
    if (!this.playArea.contains(this.wrapper)) {
      this.playArea.appendChild(this.wrapper);
    }
  }

  update(jitterX = 0, jitterY = 0) {
    const areaW = this.playArea.clientWidth;
    const areaH = this.playArea.clientHeight;
    const beeSize = areaH * 0.07;
    this.wrapper.style.width = beeSize + "px";
    this.wrapper.style.height = beeSize + "px";
    this.wrapper.style.left = (this.beeRelX * areaW - beeSize/2) + "px";
    this.wrapper.style.top = (this.beeRelY * areaH - beeSize/2) + "px";
    this.wrapper.style.transform = `translate(${jitterX * areaW}px, ${jitterY * areaH}px)`;
  }

  getTravelDurationInMillis(targetRelX, targetRelY) {
    const dx = targetRelX - this.beeRelX;
    const dy = targetRelY - this.beeRelY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist * this.baseSpeed * 1000; // milliseconds
  }

  moveTo(relX, relY) {
    audioSystem.play('bee');
    this.flightId = (this.flightId || 0) + 1;
    const myFlight = this.flightId;

    // Get actual current position from DOM (rendered position)
    const areaW = this.playArea.clientWidth;
    const areaH = this.playArea.clientHeight;
    const rect = this.wrapper.getBoundingClientRect();
    const areaRect = this.playArea.getBoundingClientRect();
    const currentLeft = rect.left + rect.width / 2 - areaRect.left;
    const currentTop = rect.top + rect.height / 2 - areaRect.top;
    const currentRelX = currentLeft / areaW;
    const currentRelY = currentTop / areaH;

    // Compute duration from actual position
    const dx = relX - currentRelX;
    const dy = relY - currentRelY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const minDuration = 0.2; // seconds
    const duration = Math.max(dist * this.baseSpeed, minDuration);

    // Set transition BEFORE updating position
    this.wrapper.style.transition =
      `left ${duration}s linear, top ${duration}s linear, width 0.2s, height 0.2s, transform 0.12s`;

    // Now update target position
    this.beeRelX = relX;
    this.beeRelY = relY;

    this.isFlying = true;
    this.flightEndTime = performance.now() + duration * 1000;
    this.startJitter(duration * 1000, myFlight);
  }

  startJitter(duration = 700, flightId = this.flightId) {
    this.stopJitter();
    this.jitterActive = true;
    const start = performance.now();
    const animate = (now) => {
      // If a new flight started, stop this jitter
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
        if (typeof audioSystem !== "undefined") {
          audioSystem.stop('bee');
        }
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
    this.wrapper.style.setProperty('--bee-tint', color);
  }
}

window.Bee = Bee;