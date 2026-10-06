import { LEVEL_URL, PLAYER_ID } from "./config.js";
import { state } from "./state.js";
import { setServerTime } from "./clock.js";
import { resizePlayArea } from "./layout.js";
import { buildLevel } from "./flowers.js";
import { renderBees } from "./bees.js";
import { renderClouds } from "./clouds.js";
import { renderLeaderboard } from "./leaderboard.js";

// ====== Data I/O ======
async function fetchLevel() {
  const res = await fetch(`${LEVEL_URL}/${PLAYER_ID}`);
  if (!res.ok) throw new Error("Failed to load level");
  state.levelData = await res.json();
  setServerTime(state.levelData?.serverTime);
  if (state.levelData?.yourBeeId) state.yourBeeId = state.levelData.yourBeeId;
}

// ====== Init ======
export async function init() {
  resizePlayArea();
  try {
    await fetchLevel();
    buildLevel();
    renderClouds(state.levelData);
    renderBees(state.levelData?.bees || []);
    renderLeaderboard(state.levelData?.bees || []);
  } catch (e) { console.error("Error fetching level", e); }
}

// Level pushed by the backend (SSE `level-update` event)
export function applyLevel(level) {
  setServerTime(level?.serverTime);
  if (level?.yourBeeId) state.yourBeeId = level.yourBeeId;
  state.levelData = level;
  buildLevel();
  renderClouds(state.levelData);
  renderBees(state.levelData.bees || []);
  renderLeaderboard(state.levelData.bees || []);
}
