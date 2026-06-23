# Deploy PyMeet

This project is configured for a single public Render URL. The Docker image builds the React frontend, copies it into the FastAPI backend, and serves the API, Socket.IO, and frontend from the same HTTPS domain.

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

For Render, set only this value when the Blueprint asks:

```env
DATABASE_URL=<paste your existing Render Postgres Internal Database URL here>
```

It should look like this, but with your real Render values:

```text
postgresql://render_user:render_password@dpg-xxxxx-a.oregon-postgres.render.com/render_database
```

## After Deploy

- Create a fresh account on the public URL. Local Docker users are not copied to the cloud database.
- The app uses the existing Render Postgres database from `DATABASE_URL`.
- Camera and microphone access require HTTPS. The Render URL is HTTPS, so allow camera and microphone permissions when the browser asks.
- If you add a custom domain later, update `FRONTEND_ORIGIN` in Render to that domain.
