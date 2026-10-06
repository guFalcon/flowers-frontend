// ====== Player ======
export const PLAYER_ID = localStorage.getItem("playerId") || crypto.randomUUID();
localStorage.setItem("playerId", PLAYER_ID);

// ====== Backend URLs ======
//export const SERVER = "http://localhost:8084";
export const SERVER = "https://flowers-backend.htl.dev";
export const LEVEL_URL = SERVER + "/api/level";
export const ADMIN_RESTART_URL = SERVER + "/api/admin/restart";
export const HARVEST_URL = (id) => SERVER + "/api/player/" + id + "/harvest";
export const EVENTS_URL = SERVER + "/api/events";
export const SET_TARGET_URL = (id) => SERVER + "/api/player/" + id + "/target";
