---
description: "Use when making routine frontend or backend edits in the Indian Civic Sense repo"
---

# Maintenance

Use this prompt for everyday changes that touch the static frontend, the Express backend, or both.

## Focus Areas

- HTML pages at the repository root
- `assets/js/**` and `assets/css/**`
- `backend/**`
- `README.md` and `DEPLOYMENT.md` when behavior changes

## Working Rules

1. Keep the existing static-page structure intact unless the task explicitly needs a refactor.
2. Match current patterns in the relevant layer before introducing new abstractions.
3. Check both frontend API config files when changing request URLs or environment handling.
4. Update backend routes, models, and middleware together when changing server behavior.
5. Prefer the smallest change that solves the problem at the root cause.

## Common Checks

- Verify frontend changes still work through HTTP, not `file://`.
- Verify backend changes still match the documented route names and auth behavior.
- Update documentation only when the user-facing behavior or setup changes.
- Keep IDs, endpoints, and exported function names stable unless a rename is required.

## Output Expectation

- Make the required code edits.
- Summarize the files changed and any follow-up verification that is still needed.