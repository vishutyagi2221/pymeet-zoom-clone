# PyMeet - Zoom Clone

PyMeet is a production-style video conferencing application built with FastAPI, SQLAlchemy, JWT auth, Socket.IO signaling, React, TypeScript, TailwindCSS, Framer Motion, and the browser WebRTC APIs.

## Features

- Email/password registration and login
- JWT-protected REST APIs
- bcrypt password hashing
- PostgreSQL support with SQLite fallback for local development
- Create and join meetings with generated meeting IDs
- Meeting history and participant tracking
- WebRTC multi-participant video and audio calling
- Camera toggle, microphone toggle, screen sharing, and leave controls
- Socket.IO real-time signaling for offers, answers, ICE candidates, chat, reactions, media state, join, leave, and host removal events
- PWA install support with offline shell caching and mobile app metadata
- Animated chat panel with timestamps and avatars
- Participant sidebar with host badges, remove controls, and waiting-room admission
- Premium dark SaaS UI using TailwindCSS, glass panels, soft shadows, Lucide icons, and Framer Motion
- Docker Compose setup for backend, frontend, and PostgreSQL

## Architecture

The backend exposes REST APIs under `/api` and a Socket.IO signaling endpoint at `/socket.io`. FastAPI handles authentication, meeting persistence, and health checks. SQLAlchemy models store users, meetings, and meeting participant history. The Socket.IO layer keeps live room membership in memory and relays WebRTC signaling messages between browser peers.

The frontend is a Vite React application. It stores the JWT in local storage, protects routes through `AuthContext`, calls REST APIs through `src/services/api.ts`, and uses `useWebRTC` plus Socket.IO to coordinate peer connections inside a meeting room.

For participants joining from different networks, configure `VITE_TURN_URL`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL` before building the frontend. STUN-only connections are suitable for local/LAN testing but cannot traverse every NAT or corporate firewall.

If the React frontend is deployed separately on Vercel, set `VITE_API_URL` and `VITE_SOCKET_URL` to the Render backend URL before building, and include the Vercel domain in the backend `FRONTEND_ORIGIN` comma-separated list. The included Vercel rewrites route direct SPA links back to `index.html`.

## Folder Structure

```text
backend/
  app/
    main.py
    config.py
    database.py
    models/
    schemas/
    routes/
    services/
    utils/
    websocket/
frontend/
  src/
    components/
    pages/
    hooks/
    services/
    context/
    types/
```

## WebRTC Flow

1. A logged-in user opens a meeting room.
2. The browser requests local camera and microphone with `getUserMedia()`.
3. The frontend connects to Socket.IO with the JWT and emits `join-room`.
4. The server returns the active participant list.
5. The joining browser creates `RTCPeerConnection` objects for existing participants and sends `offer` events.
6. Receivers set the remote description, create an `answer`, and send it back.
7. Both sides exchange `ice-candidate` events until a direct media path is established.
8. Screen sharing uses `getDisplayMedia()` and replaces the active video track on each peer sender.
9. Chat, participant updates, host removals, and leave events are sent through Socket.IO.

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

On macOS/Linux, activate with `source .venv/bin/activate` instead.

The backend runs at `http://localhost:8000` and API docs are available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173`.

If you run the backend on a different local port, set `VITE_DEV_API_PROXY` in `frontend/.env`.

## Docker

```bash
copy .env.example .env
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

## API Docs

FastAPI generates OpenAPI documentation automatically:

- Swagger UI: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`

Main REST endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/meetings`
- `GET /api/meetings`
- `GET /api/meetings/{meeting_id}`
- `POST /api/meetings/join`

Socket.IO events:

- `join-room`
- `offer`
- `answer`
- `ice-candidate`
- `media-state`
- `chat-message`
- `reaction`
- `user-left`
- `waiting-list`
- `admit-participant`
- `remove-participant`

## Deployment Notes

- Render uses `render.yaml` and waits for GitHub checks to pass before auto-deploying.
- The single Render Docker image serves the React app, REST API, Socket.IO, PWA manifest, and service worker from one HTTPS origin.
- Camera, microphone, and screen sharing require HTTPS in production.
- For reliable calls across different networks, configure TURN credentials before building/deploying.

## Testing

Recommended checks after installing dependencies:

```bash
cd backend
python -m compileall app
uvicorn app.main:app --reload
```

```bash
cd frontend
npm run build
```

For a full manual WebRTC test, open two browser windows with different accounts, create a meeting in one window, join it from the other, admit the waiting participant, and verify video, audio, chat, screen sharing, participant list, and leave events.

