import { ADMIN_RESTART_URL } from "./config.js";

const qrModal = document.getElementById("qrModal");
const isAdmin = new URLSearchParams(window.location.search).get("admin") === "true";

// ====== Admin/QR ======
function openQrModal() {
  qrModal.classList.add("open");
  qrModal.setAttribute("aria-hidden", "false");
  document.addEventListener("keydown", escClose);
  document.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", closeQrModal);
  });
}
function closeQrModal() {
  qrModal.classList.remove("open");
  qrModal.setAttribute("aria-hidden", "true");
  document.removeEventListener("keydown", escClose);
  document.querySelectorAll("[data-close-modal]").forEach(el => {
    el.removeEventListener("click", closeQrModal);
  });
}
function escClose(e) { if (e.key === "Escape") closeQrModal(); }

// onRestart: reloads the level after the backend generated a new one
export function mountAdminOrQrButton({ onRestart }) {
  document.querySelectorAll(".admin-panel, .qr-fab").forEach(n => n.remove());
  if (isAdmin) {
    const panel = document.createElement("div");
    panel.className = "admin-panel";
    panel.innerHTML = `
      <div class="admin-title">Admin</div>
      <div class="admin-row">
        <button id="restartBtn">Restart Level</button>
      </div>
      <div class="admin-row">QR (join):</div>
      <img src="qr.png" alt="Join QR code" class="admin-qr" />
    `;
    document.body.appendChild(panel);
    document.getElementById("restartBtn").addEventListener("click", async () => {
      await fetch(ADMIN_RESTART_URL, { method: "POST" });
      await onRestart();
    });
  } else {
    const fab = document.createElement("button");
    fab.className = "qr-fab";
    fab.type = "button";
    fab.innerHTML = `📷 Show QR`;
    fab.addEventListener("click", openQrModal);
    document.body.appendChild(fab);
  }
}
