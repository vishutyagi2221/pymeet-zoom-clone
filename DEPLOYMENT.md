# Deploy PyMeet

This project supports either a single Render URL or a Vercel frontend with a Render backend. The live frontend URL currently used for QA is:

```text
https://pymeet-zoom-clone.vercel.app
```

For a single Render deploy, the Docker image builds the React frontend, copies it into the FastAPI backend, and serves the API, Socket.IO, and frontend from the same HTTPS domain. For a Vercel frontend, Vercel serves the React app and the browser talks to the Render backend through `VITE_API_URL` and `VITE_SOCKET_URL`.

## Render Blueprint

1. Push this repository to GitHub.
2. Open Render and create a new Blueprint from the repository.
3. Render will read `render.yaml` and create `pymeet`, a Docker web service.
4. When Render asks for `DATABASE_URL`, paste the **Internal Database URL** from your existing Render Postgres database.
5. After deploy, open the service URL shown by Render, usually:

```text
https://pymeet.onrender.com
```

If Render assigns a different service slug, use that URL instead.

## Render Environment

Do not paste the local Docker database values into Render:

```env
POSTGRES_USER=pymeet
POSTGRES_PASSWORD=pymeet_password
POSTGRES_DB=pymeet
DATABASE_URL=postgresql://pymeet:pymeet_password@postgres:5432/pymeet
```

Those values only work inside local `docker-compose.yml`, where the database container is named `postgres`.

For Render, set this database value when the Blueprint asks:

```env
DATABASE_URL=<paste your existing Render Postgres Internal Database URL here>
```

It should look like this, but with your real Render values:

```text
postgresql://render_user:render_password@dpg-xxxxx-a.oregon-postgres.render.com/render_database
```

Also keep `FRONTEND_ORIGIN` aligned with every public frontend domain that will call the backend:

```env
FRONTEND_ORIGIN=https://pymeet-zoom-clone.vercel.app,https://pymeet.onrender.com
```

If Render assigns a different backend URL, replace `https://pymeet.onrender.com` with the actual Render service URL.

## Vercel Frontend

When deploying `frontend/` on Vercel, set these environment variables in the Vercel project:

```env
VITE_API_URL=https://<your-render-service>.onrender.com
VITE_SOCKET_URL=https://<your-render-service>.onrender.com
VITE_API_TIMEOUT_MS=45000
```

Use the same Render backend URL for both HTTP APIs and Socket.IO. After changing any `VITE_*` value, redeploy the Vercel project because Vite embeds those values at build time.

This repo includes Vercel rewrite rules at both `vercel.json` and `frontend/vercel.json`. They make direct links and refreshes such as `/meeting/CF39-372C-08D5`, `/join`, and `/register` serve the React app instead of a Vercel 404, whether the Vercel project root is the repository root or `frontend/`.

## After Deploy

- Create a fresh account on the public URL. Local Docker users are not copied to the cloud database.
- The app uses the existing Render Postgres database from `DATABASE_URL`.
- Camera and microphone access require HTTPS. The Render URL is HTTPS, so allow camera and microphone permissions when the browser asks.
- If you add a custom domain later, update `FRONTEND_ORIGIN` in Render and redeploy Vercel with the matching backend URL if it changes.

## Final QA Checklist

Before sharing the app publicly:

- GitHub Actions should pass on the latest commit.
- Register two fresh accounts on the deployed public URL.
- Create a meeting, copy the ID, and join from another browser/device.
- Verify waiting-room admit, chat, emoji reactions, camera, microphone, screen sharing, leave, and host end meeting.
- Install/open the PWA on Android/desktop and add it to the home screen on iOS Safari.
- Test at least one mobile browser and one desktop browser over HTTPS.
- Configure TURN (`VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`) before production launch if users will join from different networks.
