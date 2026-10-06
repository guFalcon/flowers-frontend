import { ADMIN_RESTART_URL } from "./config.js";

const qrModal = document.getElementById("qrModal");
// Admin mode: the page is opened with ?admin=<token>; the token goes along with every admin request
const adminToken = new URLSearchParams(window.location.search).get("admin") || "";
const isAdmin = adminToken !== "";

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
      <div class="admin-row admin-error" id="adminError" hidden>Admin token rejected</div>
      <div class="admin-row">QR (join):</div>
      <img src="qr.png" alt="Join QR code" class="admin-qr" />
    `;
    document.body.appendChild(panel);
    document.getElementById("restartBtn").addEventListener("click", async () => {
      const errorEl = document.getElementById("adminError");
      const res = await fetch(ADMIN_RESTART_URL, {
        method: "POST",
        headers: { "X-Admin-Token": adminToken }
      });
      errorEl.hidden = res.status !== 403;
      if (res.status === 403) return;
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
