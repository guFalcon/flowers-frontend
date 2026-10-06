import { HARVEST_URL, SET_TARGET_URL } from "./config.js";
import { state } from "./state.js";
import { playArea } from "./layout.js";
import { beeInstances } from "./bees.js";
import { audioSystem } from "./audio.js";
import { updateFill } from "./flowers.js";

const honeyEl = document.getElementById("honey");

// Click → fly the own bee there → harvest the flower under the target on arrival
export function enableHarvestOnClick() {
  playArea.addEventListener("pointerdown", (e) => {
    if (!state.yourBeeId) return;

    const rect = playArea.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    const myBee = beeInstances?.get?.(state.yourBeeId);
    if (!myBee) {
      console.warn("No bee instance for yourBeeId yet");
      return;
    }

    myBee.incrementFlightId();
    const thisFlightId = myBee.flightId;
    const duration = myBee.moveTo(relX, relY);

    fetch(SET_TARGET_URL(state.yourBeeId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: relX, y: relY })
    })
    .then(r => {
      // start local flight timer (acts like await new Promise(...))
      setTimeout(() => {
        // Only harvest if this is still the latest flight
        if (thisFlightId !== myBee.flightId) return;

        // Find the closest flower center under click
        const centers = Array.from(playArea.querySelectorAll(".center"));
        let minDist = Infinity, closest = null;
        centers.forEach(center => {
          const crect = center.getBoundingClientRect();
          const cx = (crect.left + crect.width / 2 - rect.left) / rect.width;
          const cy = (crect.top + crect.height / 2 - rect.top) / rect.height;
          const dist = Math.hypot(cx - relX, cy - relY);
          if (dist < (crect.width / 2) / rect.width) {
            if (dist < minDist) {
              minDist = dist;
              closest = center;
            }
          }
        });

        // trigger harvest if bee arrived and target still valid
        if (closest) {
          const root = closest.closest(".flower");
          const id = root?.dataset.id;
          const data = state.levelData.flowers.find(f => f.id == id);
          if (data) {
            harvestFlower(closest, data, root);
          }
        }
      }, duration);
    }).catch(e => console.error("Failed to set target", e));
  });
}

async function harvestFlower(centerEl, data, root) {
  try {
    const id = data.id ?? root.dataset.id;
    const res = await fetch(HARVEST_URL(id), { method: "POST" });
    if (!res.ok) return;

    const json = await res.json(); // { flowerId, honey, fill? }
    const gained = Number(json.honey) || 0;

    // Update UI based on server response
    const el = playArea.querySelector(`.flower[data-id="${json.flowerId}"]`) || root;
    if (typeof json.fill === "number") {
      el.dataset.fill = json.fill;
      updateFill(el);
    } else if (gained > 0) {
      el.dataset.fill = 0;
      updateFill(el);
    }

    if (gained > 0) {
      state.userHoney += Math.round(gained * 10);
      honeyEl.textContent = state.userHoney;
      audioSystem.play('slurp');
    } else {
      audioSystem.play('bump');
      if (navigator.vibrate) navigator.vibrate(15);
    }
  } catch (e) {
    console.error("harvest failed", e);
  }
}
