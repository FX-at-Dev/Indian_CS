---
description: "Backend guidance for the Express, Socket.IO, and MongoDB app"
applyTo:
  - "backend/**"
---

# Backend Guidance

- Keep changes aligned with the current Express + Mongoose structure and the existing route factories.
- Check [backend/server.js](backend/server.js) before changing middleware, route mounting, Socket.IO, or startup behavior.
- Preserve the current auth model: login and token verification are active, and report closing is restricted to government or admin roles.
- Keep route and endpoint names consistent with the current API shape, especially `PATCH /api/reports/:id/close` and `GET /api/reports/kpis`.
- Update model, controller, and route files together when changing report or auth behavior.
- Use the migration guide in [backend/README-migration.md](backend/README-migration.md) when working on MySQL-to-MongoDB data movement, and run `--dry-run` first.
- Prefer linking to [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md) when setup or deployment details change.