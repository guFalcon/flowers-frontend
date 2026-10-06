import { state } from "./state.js";

const honeyEl = document.getElementById("honey");
const ownNameEl = document.getElementById("ownName");

// The honey is the server's score; the page only shows the latest value it got
export function showHoney(value) {
  honeyEl.textContent = value;
}

// Own bee's honey from a level (GET /api/level or SSE `level-update`)
export function showOwnHoney(level) {
  const bee = level?.bees?.find(b => b.id === state.yourBeeId);
  if (typeof bee?.honey === "number") showHoney(bee.honey);
}

// Own bee's name from a level, shown next to the honey
export function showOwnName(level) {
  const bee = level?.bees?.find(b => b.id === state.yourBeeId);
  if (typeof bee?.name === "string") ownNameEl.textContent = bee.name;
}
