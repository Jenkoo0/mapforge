# MapForge

A browser-based Roblox map generator with editable Obby, Only Up and Tycoon designs, minigame arenas, progression, cosmetic-pass setup and Roblox XML export.

## Public snapshot

Version **3.25.0-public.1**, based on the local 3.25.0 source. This is a sanitised source snapshot, not the private project history or a website deployment. Demo names and seeds are neutral examples. Site identity, account settings, private handoffs, screenshots, personal outputs, release archives and generated Roblox files are excluded. SOURCE-MANIFEST.json identifies the included source bytes.

The cosmetic menu contains three optional character trails. Pass IDs are empty by default; no paid product is created or configured by cloning this repository. See [cosmetic setup](docs/KOSMETIK-SHOP-EINRICHTUNG.md). A Roblox account, real experience-specific pass IDs and a deliberate purchase test are required before claiming paid functionality works.

## Run locally

Node.js 22+ and Python 3.10+ are required for the complete checks. The application itself has no npm dependencies or API key requirements.

```sh
npm run dev
```

Open http://localhost:4173. The dev command builds the embedded Worker before serving the application. No website or Roblox game is published.

## Test

```sh
bash scripts/cloud-setup.sh
npm run test:cloud
```

Setup uses a native Lua 5.4 library when available, otherwise installs pinned Lupa 2.8 into ignored .cloud-deps. It never needs Roblox credentials, OpenAI keys or Site credentials. Package installation needs the normal permitted package-manager network connection; do not bypass a configured proxy or security policy.

The test command rebuilds ignored generated assets/examples, runs all JavaScript tests with two workers, executes the actual Lua behaviour harnesses with service doubles, checks 17 Roblox XML examples and validates the portable Worker artifact. It writes a local verification report under outputs/cloud-test. This does not run Roblox Studio, real multiplayer or purchases.

For separate checks:

```sh
npm test
npm run examples
python3 tools/check-lua.py
python3 tools/check-export.py
npm run build
```

If Lupa was installed into .cloud-deps, use test:cloud so PYTHONPATH is supplied correctly.

## Cloud task

Use the existing Codex Cloud setup for Jenkoo0/mapforge. Select the reviewed main commit, run scripts/cloud-setup.sh during installation and use [CLOUD-TEST.md](CLOUD-TEST.md) as the bounded verification task. Environment setup, published source and a running Cloud task are separate states: only a Cloud report with its actual checked-out commit and command results demonstrates a Cloud run.

No default deployment target or private hosting identity is included. Build output is a portable Worker artifact only. No license has been added by this export.
