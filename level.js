import { LEVEL_URL, PLAYER_ID } from "./config.js";
import { state } from "./state.js";
import { resizePlayArea } from "./layout.js";
import { buildLevel } from "./flowers.js";
import { renderBees } from "./bees.js";
import { showOwnHoney } from "./honey.js";

// ====== Data I/O ======
async function fetchLevel() {
  const res = await fetch(`${LEVEL_URL}/${PLAYER_ID}`);
  if (!res.ok) throw new Error("Failed to load level");
  state.levelData = await res.json();
  if (state.levelData?.yourBeeId) state.yourBeeId = state.levelData.yourBeeId;
}

// ====== Init ======
export async function init() {
  resizePlayArea();
  try {
    await fetchLevel();
    buildLevel();
    renderBees(state.levelData?.bees || []);
    showOwnHoney(state.levelData);
  } catch (e) { console.error("Error fetching level", e); }
}

// Level pushed by the backend (SSE `level-update` event)
export function applyLevel(level) {
  if (level?.yourBeeId) state.yourBeeId = level.yourBeeId;
  state.levelData = level;
  buildLevel();
  renderBees(state.levelData.bees || []);
  showOwnHoney(state.levelData);
}
