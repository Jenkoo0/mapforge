#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
node -e 'if(Number(process.versions.node.split(".")[0])<22)throw Error("Node.js 22+ required");console.log("Node",process.versions.node)'
python3 -c 'import sys; assert sys.version_info >= (3,10), "Python 3.10+ required"; print("Python",sys.version.split()[0])'
if python3 -c 'import ctypes.util; assert ctypes.util.find_library("lua5.4") or ctypes.util.find_library("lua54")' >/dev/null 2>&1; then
  echo 'Native Lua 5.4 is available; no Python package installation required.'
else
  python3 -m pip install --disable-pip-version-check --target .cloud-deps -r requirements-cloud.txt
fi
node tools/build-worker.mjs
echo 'MapForge setup complete. Run npm run test:cloud; no service or credentials required.'
