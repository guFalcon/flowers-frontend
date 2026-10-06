export const playArea = document.getElementById("playArea");

// ====== Layout helpers ======
export function resizePlayArea() {
  const aspect = 9 / 16;
  const availableHeight = window.innerHeight - 80;
  const availableWidth = window.innerWidth;
  let height = availableHeight;
  let width = height * aspect;
  if (width > availableWidth) {
    width = availableWidth;
    height = width / aspect;
  }
  playArea.style.width = width + "px";
  playArea.style.height = height + "px";
}
