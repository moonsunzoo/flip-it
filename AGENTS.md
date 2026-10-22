# Project guidance

- Work in the existing checkout. Cloud tasks are already isolated; do not create a worktree unless the user asks.
- Read `docs/prd/README.md`, the current PRD, and `docs/implementation-status.md` before changing product behavior.
- Keep uploaded PRD versions unchanged. Record implementation decisions separately; add a new PRD version when requirements are revised with the user.
- Use Node.js 24 and the npm lockfile. In this cloud environment, set `npm_config_cache=/workspace/.cache/npm` when installing.
- Student bundles may contain only public content. Never put teacher credentials, drafts, private notes, or provider keys in `src/` or `public/`.
- Preserve stable card IDs, independent deck sessions, snapshot history, and explicit completion. Update meaningful tests when these behaviors change.
- Run `npm run check` for application changes. For user flows, build and run `npm run test:e2e`; use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` when using this cloud machine's browser.
- Update implementation status honestly. Student flow completion is not Phase A completion; teacher operations and bulk image production remain required P0 work.
