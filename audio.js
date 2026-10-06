import { AudioSystem } from "./audio-system.js";

// ====== Audio System ======
export const audioSystem = new AudioSystem();
audioSystem.register('bee', 'bee-loop.mp3', { loop: true, volume: 0.5 });
audioSystem.register('ambient', 'bees.mp3', { loop: true, volume: 0.3 });
audioSystem.register('slurp', 'slurp.mp3', { volume: 0.7 });
audioSystem.register('bump', 'bump.mp3', { volume: 0.6 });

document.body.addEventListener('pointerdown', () => {
  audioSystem.play('ambient');
}, { once: true });

// Pause/resume all sounds when the window loses or gains focus
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    audioSystem.pauseAll?.(); // if you have pauseAll() implemented
    audioSystem.pause('bee');
    audioSystem.pause('ambient');
  } else {
    // Resume ambient but NOT bee loop (bee starts on movement)
    audioSystem.play('ambient');
  }
});

window.addEventListener("blur", () => {
  audioSystem.pause('bee');
  audioSystem.pause('ambient');
});

window.addEventListener("focus", () => {
  audioSystem.play('ambient');
});
