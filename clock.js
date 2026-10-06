// ====== Server clock ======
// Offset between the server clock and ours, taken from the `serverTime` of the latest level, so server
// times (path keyframes, cloud anchors, wind) can be compared with our own time. Latency is ignored.
let offset = 0;

export function setServerTime(serverTime) {
  if (typeof serverTime === "number") offset = serverTime - Date.now();
}

// Current time on the server clock (epoch ms)
export function serverNow() {
  return Date.now() + offset;
}
