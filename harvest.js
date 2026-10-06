import { HARVEST_URL, SET_TARGET_URL } from "./config.js";
import { state } from "./state.js";
import { playArea } from "./layout.js";
import { beeInstances } from "./bees.js";
import { audioSystem } from "./audio.js";
import { showHoney } from "./honey.js";

// Click → fly the own bee there → ask the server to harvest under the bee on arrival
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
    .then(() => {
      // start local flight timer (acts like await new Promise(...))
      setTimeout(() => {
        // Only harvest if this is still the latest flight
        if (thisFlightId !== myBee.flightId) return;
        harvest();
      }, duration);
    }).catch(e => console.error("Failed to set target", e));
  });
}

// The server decides which flower is under the bee and whether it yields honey; the flower itself
// is updated for every client by the SSE `harvest` event
async function harvest() {
  try {
    const res = await fetch(HARVEST_URL(state.yourBeeId), { method: "POST" });
    if (!res.ok) return;
    const json = await res.json(); // { flowerId, gained, total }

    if (json.gained > 0) {
      showHoney(json.total);
      audioSystem.play('slurp');
    } else if (json.flowerId != null) {
      // On a flower that yields nothing; the bare meadow (flowerId null) stays silent
      audioSystem.play('bump');
      if (navigator.vibrate) navigator.vibrate(15);
    }
  } catch (e) {
    console.error("harvest failed", e);
  }
}
