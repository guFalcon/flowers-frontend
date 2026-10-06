import { Bee } from "./bee.js";
import { playArea } from "./layout.js";
import { audioSystem } from "./audio.js";
import { state } from "./state.js";

// ====== Bee instances map ======
export const beeInstances = new Map();

// ====== Bee rendering ======
export function renderBees(bees = []) {
  if (!Array.isArray(bees)) bees = [];

  bees.forEach(b => {
    let bee = beeInstances.get(b.id);
    if (!bee) {
      bee = new Bee(playArea, audioSystem, b.id);
      bee.setTint(b.color);
      // A bee shows up where the server says it is; its path below then lets it fly on from there
      if (typeof b.x === "number" && typeof b.y === "number") bee.placeAt(b.x, b.y);
      beeInstances.set(b.id, bee);
    }

    // 🔑 mark self vs other for styling (opacity + halo)
    if (b.id === state.yourBeeId) {
      bee.wrapper.classList.add('is-self');
      bee.wrapper.classList.remove('is-other');
    } else {
      bee.wrapper.classList.add('is-other');
      bee.wrapper.classList.remove('is-self');
    }

    // Movement follows the server path; setPath ignores a path the bee already follows
    bee.setPath(b.path);
  });

  // GC
  for (const [id, inst] of beeInstances) {
    if (!bees.find(b => b.id === id)) {
      inst.destroy?.();
      beeInstances.delete(id);
    }
  }
}
