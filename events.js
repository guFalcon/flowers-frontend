import { SSEConnectionManager } from "./sse-connection.js";
import { EVENTS_URL } from "./config.js";
import { audioSystem } from "./audio.js";
import { init, applyLevel } from "./level.js";
import { showHarvest } from "./flowers.js";

const connectionStatusEl = document.getElementById("connectionStatus");

// ====== SSE Connection ======
export function connectEvents() {
  const sseManager = new SSEConnectionManager(EVENTS_URL, {
    onConnectionChange: (status, message) => {
      connectionStatusEl.className = `connection-status ${status}`;
      connectionStatusEl.textContent = message;
      if (status === "connected") audioSystem.play("ambient");
      else audioSystem.pause("ambient");
    },

    onMessage: async (data) => {
      if (data.type === "levelRestarted") {
        await init();
      } else if (data.type === "harvest") {
        showHarvest(data);
      } else if (data.type === "level-update") {
        let level = data.level;
        if (typeof level === "string") {
          try { level = JSON.parse(level); } catch { return; }
        }
        applyLevel(level);
      }
    }
  });
  sseManager.connect();
}
