# MapForge contributor instructions

This is a sanitised public snapshot, version 3.25.0-public.1.

- Read README.md and CLOUD-TEST.md before a Cloud verification task.
- Preserve product/pass IDs, upgrade IDs, receipt processing, session locks and saved data. Unconfigured cosmetic IDs stay empty and unavailable for purchase.
- Never publish a website or Roblox game, access personal account data or initiate purchases as part of testing.
- Use `bash scripts/cloud-setup.sh` and `npm run test:cloud` for the complete offline verification. No application API keys are needed. Respect the environment's network policy; do not bypass its proxy.
- No npm packages are required. Lua checks use native Lua 5.4 or pinned Lupa from requirements-cloud.txt.
- Generated examples, embedded worker/index.js, dist, .cloud-deps and outputs are ignored. Do not add those artifacts to Git.
- Do not weaken tests to make a verification task pass. Report a reproducible failure with the exact command and affected source; a read-only test task does not authorize unrelated feature changes.
- Report `git rev-parse HEAD`, the package version, pass/fail counts and remaining Roblox-engine limitations. Do not describe service doubles as real Roblox clients.
- For the initial Cloud task, do not create other chats, agents, scheduled jobs, PRs or deployments. Run only this repository's checks and return the report.
