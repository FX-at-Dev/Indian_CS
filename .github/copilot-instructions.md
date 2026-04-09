# Indian Civic Sense Workspace Instructions

## Project Shape

- Frontend is plain HTML, CSS, and vanilla JavaScript at the repository root and in `assets/`.
- Backend is a separate Express + MongoDB app in `backend/`.
- There is no frontend build step. Treat the HTML pages and static assets as the source of truth.

## Common Commands

- Install frontend dependencies with `npm install` at the repo root.
- Install backend dependencies with `cd backend && npm install`.
- Start the backend with `cd backend && npm start`.
- Run backend development mode with `cd backend && npm run dev`.
- Run migration with `cd backend && npm run migrate`, and prefer `--dry-run` first.
- Serve the frontend through HTTP, not `file://`. Use a local server such as `python -m http.server 8080` or `npx http-server -p 8080`.

## Working Rules

- Preserve the existing vanilla JS and static-page structure unless the task explicitly requires a larger refactor.
- Keep changes small and focused. Avoid introducing a framework or build tool unless asked.
- When editing API calls, check both `assets/js/app.js` and `assets/js/config.js` because the backend URL is configured in more than one place.
- Prefer linking to the established docs instead of repeating them in new files.

## Backend Conventions

- The backend uses Express routes, Mongoose models, and JWT-based auth.
- `backend/routes/auth.routes.js` currently provides login and token verification; registration logic is not active there.
- `backend/routes/report.routes.js` exposes public report reads plus a government/admin-only close flow.
- The report close endpoint is `PATCH /api/reports/:id/close`.
- The KPI route in the current code is `GET /api/reports/kpis`.
- `backend/server.js` wires the HTTP server, Socket.IO, auth routes, report routes, leaderboard routes, and the global error handler.

## Frontend Conventions

- Frontend scripts use fetch-based helpers and localStorage for the auth token.
- Base64 image uploads are part of the current report flow, so keep multipart or file-handling changes compatible with that behavior.
- The UI is implemented as static pages; keep IDs, forms, and event hooks stable when possible because multiple scripts depend on them.

## Pitfalls To Watch

- Opening the frontend directly from disk can break asset loading or API behavior. Use a local HTTP server.
- Deployment URLs are easy to get out of sync. Check `assets/js/app.js`, `assets/js/config.js`, `netlify.toml`, and `_redirects` together when changing endpoints.
- Socket.IO CORS is configured in `backend/server.js`; update it when the deployed frontend origin changes.
- The backend and README contain a few stale path or endpoint references. Verify the code before copying examples into new work.

## Documentation To Prefer

- [README.md](README.md) for setup, feature overview, and the project structure.
- [DEPLOYMENT.md](DEPLOYMENT.md) for hosting and environment-specific steps.
- [backend/README-migration.md](backend/README-migration.md) for the MySQL to MongoDB migration flow.

## When Updating The Repo

- Keep file names, routes, and page links consistent with the existing structure.
- Update documentation when you change setup, deployment, or route behavior.
- Validate backend changes against the current route names before assuming README examples are still correct.