# flowers-frontend

Browser client of **flowers**, a small multiplayer browser game used for teaching at HTL: every
player steers a bee across a meadow and harvests honey from flowers. All players share one level
that is kept by the backend and pushed to every browser via Server-Sent Events (SSE).

- Play: <https://flowers.htl.dev> — admin view: `https://flowers.htl.dev/?admin=<admin token>`
- Backend: [guFalcon/flowers-backend](https://github.com/guFalcon/flowers-backend)
  (live at <https://flowers-backend.htl.dev>)

Plain HTML, CSS and JavaScript — no framework, no build step. A tiny Express server only serves
the static files.

![Component overview](https://github.com/guFalcon/flowers-backend/raw/main/docs/diagrams/architecture.svg)

## How to play

- Open the game on a phone or in a browser; your bee is fully opaque with a glow, the other
  players' bees are semi-transparent.
- Click or tap anywhere on the meadow — your bee flies there.
- Land on the centre of a flower to harvest its nectar. The orange ring around a flower's centre grows
  as the flower fills up; a full flower gives the most honey, an (almost) empty one or the bare
  meadow gives nothing and you hear a bump. The backend decides, from where your bee really is.
- Your honey total is shown below the meadow. The backend keeps it, so it survives a reload; an
  admin restart sets everyone back to 0.
- "📷 Show QR" shows a QR code so others can join.
- Sound starts after the first click (browsers block audio before a user gesture).

**Admin mode** (`?admin=<admin token>`) replaces the QR button with a panel that shows the QR code
permanently and has a **Restart Level** button, which makes the backend generate new flowers for
everyone. The value of `admin` is sent as the header `X-Admin-Token`; the backend accepts it only if
it equals its `FLOWERS_ADMIN_TOKEN` (locally in `quarkus:dev`: `dev-admin-token`), otherwise the
panel shows "Admin token rejected".

## Local development

Requirements: Node 24 (see `.nvmrc`).

```shell
npm ci
npm start          # nodemon, restarts on changes to .js files
```

The game is served at <http://localhost:8081> (override the port with `INTERNAL_PORT`). The scripts
are native ES modules, so the page must be served over HTTP — opening `index.html` directly
(`file://`) does not work.

By default the page talks to the **live backend**. To use a backend running locally on port 8084,
switch the `SERVER` constant in `config.js`:

```js
export const SERVER = "http://localhost:8084";
//export const SERVER = "https://flowers-backend.htl.dev";
```

Don't commit that switch — a push to `main` deploys the file as it is. The backend allows the
origins `http://localhost:8080` and `http://localhost:8081` (CORS); see the backend README for
how to run it.

## Files

| File | Role |
|---|---|
| `index.html` | Page markup; loads `main.js` as the only script |
| `main.js` | Entry module: wires the modules together and starts the game (SSE, admin/QR button, level, click handler, resize, fill growth) |
| `config.js` | Backend base URL (`SERVER`), API URLs, player id from `localStorage` |
| `state.js` | Shared mutable state: level data, own bee id |
| `layout.js` | Play-area element and resizing to the 9:16 aspect ratio |
| `audio.js` | The `AudioSystem` instance, sound registration, pause/resume on focus and visibility changes |
| `flowers.js` | Flower rendering, fill display, harvest flash, passive fill growth (2 s interval) |
| `bees.js` | Bee rendering: one `Bee` per backend bee, own vs. other bees, removal of vanished bees |
| `level.js` | Loads the level (`GET /api/level/{playerId}`) and applies levels pushed via SSE |
| `events.js` | SSE connection and dispatch of `levelRestarted`, `harvest` and `level-update` events, connection status |
| `harvest.js` | Click → fly → harvest request, slurp/bump feedback |
| `honey.js` | Honey display: the own bee's honey from the level or the latest harvest response |
| `admin.js` | QR modal and admin panel (restart button with admin token) |
| `bee.js` | `Bee` class: one DOM element per bee, placement without animation, flight animation (duration from distance), jitter while flying, tint colour |
| `sse-connection.js` | `SSEConnectionManager`: `EventSource` wrapper with connection status, exponential back-off reconnect (max. 10 attempts) and reconnect when the tab becomes visible again |
| `audio-system.js` | `AudioSystem`: registers and plays the looping and one-shot sounds |
| `styles.css` | Layout, flowers, bees, admin panel, QR modal |
| `app.js` | Express server that serves the directory statically |
| `*.mp3`, `*.png`, `*.jpg`, `favicon.ico` | Sounds, bee sprite, background, QR code |
| `Dockerfile`, `deploy/` | Container image and docker compose deployment |

## Talking to the backend

The player id is a UUID stored in `localStorage` (`playerId`), so a reload keeps the same bee.

1. On start the page opens the SSE stream `GET /api/events` and loads the level with
   `GET /api/level/{playerId}`, which also tells it which bee is its own (`yourBeeId`). Bees appear
   at their current position from the level and fly on if they have a different target; the own
   bee's `honey` is shown as the total.
2. A click animates the own bee immediately and sends `POST /api/player/{playerId}/target`
   with `{x, y}` relative to the play area.
3. When the flight time is over (and no newer flight started), the page sends
   `POST /api/player/{playerId}/harvest`. The backend harvests the flower under the bee; if
   `gained > 0` the page plays the slurp and shows `total`, otherwise it plays the bump.
4. SSE `level-update` events redraw flowers and move the other bees, `harvest` empties a flower,
   `levelRestarted` reloads the level.

The full contract — request and response shapes, event payloads, timings — is documented in the
[backend README](https://github.com/guFalcon/flowers-backend#rest-api).

![One game round](https://github.com/guFalcon/flowers-backend/raw/main/docs/diagrams/game-round.svg)

## Build and deployment

```shell
docker build -t flowers-frontend:local .
docker run --rm -p 8080:8080 -e INTERNAL_PORT=8080 flowers-frontend:local
```

Every push to `main` runs `.github/workflows/pipeline.yml`, built entirely from shared workflows:
bump the semantic version → `npm ci` + `npm run build` (a no-op) → build the image and push it to
Docker Hub as `gufalcon/flowers-frontend:latest` → deploy with `deploy/up.sh`
(`docker-compose pull && up`). `deploy/docker-compose.yml` runs the container with
`INTERNAL_PORT=8080` in the external Traefik network `proxy_default` and routes `flowers.htl.dev`
to it.

Planning (OpenSpec changes, backlog) for both repos lives in the backend repo.

## License

MIT — see [LICENSE](LICENSE).
