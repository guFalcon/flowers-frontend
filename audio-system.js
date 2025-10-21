class AudioSystem {
  constructor() {
    this.sounds = {}; // { handle: { audio: Audio, loop: bool } }
  }

  /**
   * Register a sound.
   * @param {string} handle - Unique name for this sound.
   * @param {string} src - Path to the audio file.
   * @param {object} options - { loop: boolean, volume: 0..1 }
   */
  register(handle, src, options = {}) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.loop = !!options.loop;
    audio.volume = typeof options.volume === "number" ? options.volume : 1.0;
    this.sounds[handle] = { audio, src, options };
  }

  /**
   * Play a sound by handle.
   * For non-looping sounds, clones and plays so multiple can overlap.
   * For looping sounds, plays the registered audio element.
   */
  play(handle) {
    const entry = this.sounds[handle];
    if (!entry) return;
    if (entry.audio.loop) {
      if (entry.audio.paused) {
        entry.audio.currentTime = 0;
        entry.audio.play().catch(() => {});
      }
    } else {
      // Play a clone for overlapping one-shots
      const clone = entry.audio.cloneNode();
      clone.volume = entry.audio.volume;
      clone.play().catch(() => {});
    }
  }

  /**
   * Pause a looping sound.
   */
  pause(handle) {
    const entry = this.sounds[handle];
    if (entry && entry.audio.loop) {
      entry.audio.pause();
    }
  }

  pauseAll() {
    for (const name in this.sounds) {
      this.pause(name);
    }
  }


  /**
   * Stop a looping sound and rewind.
   */
  stop(handle) {
    const entry = this.sounds[handle];
    if (entry && entry.audio.loop) {
      entry.audio.pause();
      entry.audio.currentTime = 0;
    }
  }

  /**
   * Set volume for a sound.
   */
  setVolume(handle, volume) {
    const entry = this.sounds[handle];
    if (entry) {
      entry.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

// Make available globally
window.AudioSystem = AudioSystem;