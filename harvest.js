import { HARVEST_URL, SET_TARGET_URL } from "./config.js";
import { state } from "./state.js";
import { playArea } from "./layout.js";
import { beeInstances } from "./bees.js";
import { audioSystem } from "./audio.js";
import { serverNow } from "./clock.js";
import { init } from "./level.js";

// Running rejoin, shared by rapid clicks so only one level request is in flight
let rejoining = null;

// Loads the level again, which re-registers the own bee on the server and shows it
function rejoin() {
  if (!rejoining) rejoining = init().finally(() => { rejoining = null; });
  return rejoining;
}

function ownBee() {
  return state.yourBeeId ? beeInstances?.get?.(state.yourBeeId) : undefined;
}

// Click → the server computes the flight → the own bee follows the returned path → ask the server to
// harvest under the bee at the path's arrival time
export function enableHarvestOnClick() {
  playArea.addEventListener("pointerdown", async (e) => {
    const rect = playArea.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    let myBee = ownBee();
    if (!myBee) {
      // The own bee is not on screen (e.g. removed for inactivity): rejoin, then fly to the click
      await rejoin();
      myBee = ownBee();
      if (!myBee) {
        console.warn("Own bee still missing after rejoin");
        return;
      }
    }

    const thisFlightId = myBee.incrementFlightId();

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
      // The own bee as it is on screen now, which may differ from the one at click time
      const bee = ownBee();
      // Gone, or a newer click has started another flight in the meantime
      if (!bee || thisFlightId !== bee.flightId) return;
      const path = json.path;
      bee.setPath(path);
      const arrival = path[path.length - 1].t;
      setTimeout(() => {
        // Only harvest if this is still the latest flight
        if (thisFlightId !== ownBee()?.flightId) return;
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
