# flowers-frontend

Browser client of **flowers**, a small multiplayer browser game used for teaching at HTL: every
player steers a bee across a meadow and harvests honey from flowers. All players share one level
that is kept by the backend and pushed to every browser via Server-Sent Events (SSE).

- Play: <https://flowers.htl.dev> — admin view: <https://flowers.htl.dev/?admin=true>
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
  as the flower fills up; a full flower gives the most honey, an (almost) empty one gives nothing and you hear a bump.
- Your honey total is shown below the meadow. It is kept in the browser only and starts at 0 on
  every reload.
- "📷 Show QR" shows a QR code so others can join.
- Sound starts after the first click (browsers block audio before a user gesture).

**Admin mode** (`?admin=true`) replaces the QR button with a panel that shows the QR code
permanently and has a **Restart Level** button, which makes the backend generate new flowers for
everyone. There is no protection — anyone who knows the URL parameter is admin.

## Local development

Requirements: Node 20 (see `.nvmrc`).

```shell
npm ci
npm start          # nodemon, restarts on changes to .js files
```

The game is served at <http://localhost:8081> (override the port with `INTERNAL_PORT`).

By default the page talks to the **live backend**. To use a backend running locally on port 8084,
switch the `SERVER` constant near the top of the script in `index.html`:

```js
const SERVER = "http://localhost:8084";
//const SERVER = "https://flowers-backend.htl.dev";
```

Don't commit that switch — a push to `main` deploys the file as it is. The backend allows the
origins `http://localhost:8080` and `http://localhost:8081` (CORS); see the backend README for
how to run it.

## Files

| File | Role |
|---|---|
| `index.html` | Page markup and the main script: backend URLs, player id, level and flower rendering, bee rendering, SSE event handling, click → fly → harvest, admin panel / QR modal |
| `bee.js` | `Bee` class: one DOM element per bee, flight animation (duration from distance), jitter while flying, tint colour |
| `sse-connection.js` | `SSEConnectionManager`: `EventSource` wrapper with connection status, exponential back-off reconnect (max. 10 attempts) and reconnect when the tab becomes visible again |
| `audio-system.js` | `AudioSystem`: registers and plays the looping and one-shot sounds |
| `styles.css` | Layout, flowers, bees, admin panel, QR modal |
| `app.js` | Express server that serves the directory statically |
| `*.mp3`, `*.png`, `*.jpg`, `favicon.ico` | Sounds, bee sprite, background, QR code |
| `Dockerfile`, `deploy/` | Container image and docker compose deployment |

## Talking to the backend

The player id is a UUID stored in `localStorage` (`playerId`), so a reload keeps the same bee.

1. On start the page opens the SSE stream `GET /api/events` and loads the level with
   `GET /api/level/{playerId}`, which also tells it which bee is its own (`yourBeeId`).
2. A click animates the own bee immediately and sends `POST /api/player/{playerId}/target`
   with `{x, y}` relative to the play area.
3. When the flight time is over and the target lies on a flower centre, the page sends
   `POST /api/harvest/{flowerId}` and adds the returned honey to the total.
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
