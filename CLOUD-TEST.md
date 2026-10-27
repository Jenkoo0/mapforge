# Bounded initial Cloud test

Goal: verify that this exact public MapForge snapshot can be built and tested in the published Codex Cloud environment, with particular attention to cosmetic passes and minigame progression.

1. Confirm the repository is Jenkoo0/mapforge. Record the actual HEAD SHA, branch and package version. Do not use an empty checkout or silently substitute another repository.
2. Read SOURCE-MANIFEST.json. Verify its listed source hashes against the checkout before rebuilding ignored artifacts. If files differ, report the differences before claiming the reviewed snapshot was tested.
3. Run `bash scripts/cloud-setup.sh` and `npm run test:cloud`. Expected baseline: 263 JavaScript tests, twelve Lua behaviour harnesses and 17 generated example maps. Let the actual commands determine success; report changed counts or failures accurately.
4. Inspect the cosmetics checks: empty/duplicate pass IDs, isolated player ownership, failed ownership/price query, purchase cancellation, saved equip/remove, storage failure/lost response, respawn/rejoin, existing receipt handler, disabled shop and demo profile.
5. Confirm minigame and Workshop checks still cover memory preview, collection rules, once-per-round rewards and saved upgrades. No Roblox service or account connection is needed by these checks.
6. Return the actual source SHA/version, executed commands, pass/fail counts, verification report and any reproducible failure. Do not modify tracked source, create a PR, publish the environment, publish the website or game, or contact other chats from this test task. Generated ignored files are expected.

If dependency installation or GitHub access fails because the managed proxy is unreachable, report the exact failed operation and environment state. Do not disable or bypass network protections. A successful local test or public GitHub upload is not a Cloud test.

Roblox Studio physics, real multiplayer, mobile rendering and real Robux purchases remain outside this test's scope.
