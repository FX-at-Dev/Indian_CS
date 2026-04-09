---
description: "Use when deployment URLs, CORS, Netlify redirects, or hosting config need syncing"
---

# Deployment Sync

Use this prompt when the app is being deployed, the backend URL changes, or frontend and backend hosting settings need to stay aligned.

## What to check

- `assets/js/app.js`
- `assets/js/config.js`
- `backend/server.js`
- `netlify.toml`
- `_redirects`
- `DEPLOYMENT.md`

## What to do

1. Inspect the current frontend API base URL, backend CORS origin, and any redirect rules.
2. Update all deployment-sensitive values together so they do not drift.
3. Keep the static frontend structure intact; do not introduce a build step.
4. Preserve backend route names and existing API behavior unless the deployment change requires a documented route update.
5. Update deployment documentation if the hosting process or environment variables change.

## Typical changes

- Sync the frontend API base URL with the deployed backend.
- Update Socket.IO CORS origins when the frontend domain changes.
- Keep Netlify redirects pointing at the active backend URL.
- Verify environment variable names in deployment docs match the backend code.

## Output expectation

- List the files that need updating.
- Make the minimal code or configuration edits needed.
- Call out any deployment steps the user must perform outside the repo.