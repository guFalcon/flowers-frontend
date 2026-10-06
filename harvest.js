import { HARVEST_URL, SET_TARGET_URL } from "./config.js";
import { state } from "./state.js";
import { playArea } from "./layout.js";
import { beeInstances } from "./bees.js";
import { audioSystem } from "./audio.js";
import { serverNow } from "./clock.js";

// Click → the server computes the flight → the own bee follows the returned path → ask the server to
// harvest under the bee at the path's arrival time
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

    fetch(SET_TARGET_URL(state.yourBeeId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: relX, y: relY })
    })
    .then(res => {
      if (!res.ok) throw new Error("setTarget answered " + res.status);
      return res.json(); // { status, path: [{t, x, y}, …] }
    })
    .then(json => {
      // A newer click has started another flight in the meantime
      if (thisFlightId !== myBee.flightId) return;
      const path = json.path;
      myBee.setPath(path);
      const arrival = path[path.length - 1].t;
      setTimeout(() => {
        // Only harvest if this is still the latest flight
        if (thisFlightId !== myBee.flightId) return;
        harvest();
      }, Math.max(0, arrival - serverNow()));
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
