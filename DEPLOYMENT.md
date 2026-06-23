# Deploy PyMeet

This project is configured for a single public Render URL. The Docker image builds the React frontend, copies it into the FastAPI backend, and serves the API, Socket.IO, and frontend from the same HTTPS domain.

## Render Blueprint

1. Push this repository to GitHub.
2. Open Render and create a new Blueprint from the repository.
3. Render will read `render.yaml` and create:
   - `pymeet`, a Docker web service
   - `pymeet-db`, a managed Postgres database
4. After deploy, open the service URL shown by Render, usually:

```text
https://pymeet.onrender.com
```

If Render assigns a different service slug, use that URL instead.

## After Deploy

- Create a fresh account on the public URL. Local Docker users are not copied to the cloud database.
- Camera and microphone access require HTTPS. The Render URL is HTTPS, so allow camera and microphone permissions when the browser asks.
- If you add a custom domain later, update `FRONTEND_ORIGIN` in Render to that domain.
