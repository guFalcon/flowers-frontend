import { state } from "./state.js";

const TOP_COUNT = 5;
const leaderboardEl = document.getElementById("leaderboard");

// Honey descending, ties by name
function rank(bees) {
  return [...bees].sort((a, b) =>
    (b.honey ?? 0) - (a.honey ?? 0) || (a.name ?? "").localeCompare(b.name ?? "", "de"));
}

// Names come from the server: plain text only, never HTML
function buildRow(bee, position) {
  const row = document.createElement("div");
  row.className = "leaderboard-row";
  if (bee.id === state.yourBeeId) row.classList.add("is-self");

  const rankEl = document.createElement("span");
  rankEl.className = "rank";
  rankEl.textContent = position;

  const dot = document.createElement("span");
  dot.className = "dot";
  dot.style.backgroundColor = bee.color;

  const name = document.createElement("span");
  name.className = "name";
  name.textContent = bee.name ?? "";

  const honey = document.createElement("span");
  honey.className = "honey";
  honey.textContent = bee.honey ?? 0;

  row.append(rankEl, dot, name, honey);
  return row;
}

// Top bees by honey plus the own bee with its real rank when it is not among them
export function renderLeaderboard(bees = []) {
  if (!Array.isArray(bees)) bees = [];
  const ranked = rank(bees);
  const rows = ranked.slice(0, TOP_COUNT).map((b, i) => buildRow(b, i + 1));

  const ownIndex = ranked.findIndex(b => b.id === state.yourBeeId);
  if (ownIndex >= TOP_COUNT) rows.push(buildRow(ranked[ownIndex], ownIndex + 1));

  leaderboardEl.replaceChildren(...rows);
}

// SSE `harvest` event: take over the harvesting bee's new honey right away
export function applyHarvestToLeaderboard(event) {
  const bees = state.levelData?.bees;
  if (!Array.isArray(bees)) return;
  const bee = bees.find(b => b.id === event?.beeId);
  if (bee && typeof event.honey === "number") bee.honey = event.honey;
  renderLeaderboard(bees);
}
