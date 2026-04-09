---
description: "Frontend guidance for the static HTML, CSS, and vanilla JavaScript app"
applyTo:
  - "*.html"
  - "assets/js/**"
  - "assets/css/**"
---

# Frontend Guidance

- Treat the HTML pages and static assets as the source of truth; there is no frontend build step.
- Keep IDs, form names, and event hooks stable because multiple scripts depend on them.
- Use the existing vanilla JavaScript patterns instead of introducing a framework or bundler.
- When changing API calls or environment handling, update both `assets/js/app.js` and `assets/js/config.js` together.
- Preserve the current token flow in localStorage and the base64 image upload behavior.
- Test through HTTP, not `file://`, to avoid broken asset loading or API behavior.
- Prefer linking to [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md) instead of repeating setup or hosting instructions.
