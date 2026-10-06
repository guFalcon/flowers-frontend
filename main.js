// Entry module: wires the modules together and starts the game.
import { connectEvents } from "./events.js";
import { mountAdminOrQrButton } from "./admin.js";
import { init } from "./level.js";
import { enableHarvestOnClick } from "./harvest.js";
import { resizePlayArea } from "./layout.js";
import { beeInstances } from "./bees.js";
import { startFillGrowth } from "./flowers.js";

console.log("App started");

// ====== Start ======
connectEvents();
mountAdminOrQrButton({ onRestart: init });
init();

// ===== Event Listeners ======
enableHarvestOnClick();

// Relayout on resize
window.addEventListener("resize", () => {
  resizePlayArea();
  beeInstances.forEach(bee => bee.update());
});

startFillGrowth();
