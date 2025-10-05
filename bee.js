class Bee {
  baseSpeed = 4.5; // seconds per unit distance
  flightId = 0;

  constructor(playArea) {
    this.playArea = playArea;
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
    const duration = this.getTravelDurationInMillis(relX, relY) / 1000;
    // Set transition duration dynamically
    this.wrapper.style.transition = 
        `left ${duration}s linear, top ${duration}s linear, width 0.2s, height 0.2s, transform 0.12s`;

    this.beeRelX = relX;
    this.beeRelY = relY;
    this.startJitter(duration * 1000);
  }

  setTint(color) {
    this.wrapper.style.setProperty('--bee-tint', color);
  }

  startJitter(duration = 700) {
    if (this.jitterActive) return;
    this.jitterActive = true;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      if (elapsed > duration) {
        this.jitterActive = false;
        this.update(0, 0);
        return;
      }
      // More frequent and larger jitter
      const jitterX = (Math.random() - 0.5) * this.jitterAmount * 2;
      const jitterY = (Math.random() - 0.5) * this.jitterAmount * 2;
      this.update(jitterX, jitterY);
      this.jitterFrame = requestAnimationFrame(animate);
    };
    this.jitterFrame = requestAnimationFrame(animate);
  }
}

window.Bee = Bee;