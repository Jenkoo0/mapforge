"""Compile exported Lua and execute behavioural tests with Lua 5.4.
This checks Lua-compatible syntax and profile logic, not Roblox engine behaviour.
Use a native Lua 5.4 library when available, otherwise the optional Lupa lua54 module.
"""
import ctypes
import ctypes.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
native_candidates = [ctypes.util.find_library(name) for name in ("lua5.4", "lua54")]
legacy_library = Path("/usr/lib/x86_64-linux-gnu/liblua5.4.so.0.0.0")
if legacy_library.is_file():
    native_candidates.append(str(legacy_library))
lua = None
for library in dict.fromkeys(filter(None, native_candidates)):
    try:
        lua = ctypes.CDLL(library)
        break
    except OSError:
        continue

if lua is not None:
    lua.luaL_newstate.restype = ctypes.c_void_p
    lua.luaL_openlibs.argtypes = [ctypes.c_void_p]
    lua.luaL_loadbufferx.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_size_t, ctypes.c_char_p, ctypes.c_char_p]
    lua.lua_pcallk.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_ssize_t, ctypes.c_void_p]
    lua.lua_tolstring.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.POINTER(ctypes.c_size_t)]
    lua.lua_tolstring.restype = ctypes.c_char_p
    lua.lua_close.argtypes = [ctypes.c_void_p]
    print("Lua backend: native Lua 5.4")
else:
    try:
        from lupa.lua54 import LuaRuntime
    except ImportError as error:
        raise SystemExit(
            "Lua 5.4 is unavailable. Provide a native Lua 5.4 library or the optional "
            "Lupa package (lupa.lua54) on PYTHONPATH. No Roblox tests were run."
        ) from error
    print("Lua backend: Lupa lua54 (Lua 5.4)")

def check(source, name, execute=False):
    if lua is None:
        runtime = LuaRuntime(register_eval=False, register_builtins=False)
        if runtime.lua_version != (5, 4):
            raise RuntimeError("The selected Lupa runtime must use Lua 5.4")
        compiled = runtime.compile(source, name=name)
        if execute:
            compiled()
        return
    state = lua.luaL_newstate()
    if not state:
        raise RuntimeError("Could not allocate a Lua state")
    try:
        lua.luaL_openlibs(state)
        data = source.encode()
        result = lua.luaL_loadbufferx(state, data, len(data), name.encode(), None)
        if result == 0 and execute:
            result = lua.lua_pcallk(state, 0, 0, 0, 0, None)
        if result:
            raise RuntimeError(lua.lua_tolstring(state, -1, None).decode())
    finally:
        lua.lua_close(state)

for path in sorted((ROOT / "web/lua").glob("*.lua")):
    check(path.read_text(encoding="utf-8"), path.name)
    print(f"{path.name}: syntax passed")
example_scripts = set((ROOT / "examples").glob("Shop-*.lua")) | set((ROOT / "examples").glob("Studio-*.lua"))
for path in sorted(example_scripts):
    check(path.read_text(encoding="utf-8"), path.name)
    print(f"{path.name}: syntax passed")
data_path = str(ROOT / "web/lua/data.lua")
economy_path = str(ROOT / "web/lua/tycoon-economy.lua")
client_path = str(ROOT / "web/lua/tycoon-client.lua")
server_path = str(ROOT / "web/lua/tycoon-server.lua")
import json, os
preamble = "DATA_PATH = " + json.dumps(data_path) + "\nECONOMY_PATH = " + json.dumps(economy_path) + "\nCLIENT_PATH = " + json.dumps(client_path) + "\n"
preamble += "SERVER_PATH = " + json.dumps(server_path) + "\n"
preamble += "MOVEMENT_SERVER_PATH = " + json.dumps(str(ROOT / "web/lua/movement-server.lua")) + "\nMOVEMENT_CLIENT_PATH = " + json.dumps(str(ROOT / "web/lua/movement-client.lua")) + "\n"
preamble += "EVENT_CORE_PATH = " + json.dumps(str(ROOT / "web/lua/event-core.lua")) + "\nEVENT_SERVER_PATH = " + json.dumps(str(ROOT / "web/lua/event-server.lua")) + "\nEVENT_CLIENT_PATH = " + json.dumps(str(ROOT / "web/lua/event-client.lua")) + "\n"
preamble += "OBBY_SERVER_PATH = " + json.dumps(str(ROOT / "web/lua/server.lua")) + "\n"
preamble += "COSMETICS_SERVER_PATH = " + json.dumps(str(ROOT / "web/lua/cosmetics-server.lua")) + "\nCOSMETICS_CLIENT_PATH = " + json.dumps(str(ROOT / "web/lua/cosmetics-client.lua")) + "\n"
for workshop_name in ["core","service","server","client"]:
    preamble += "WORKSHOP_"+workshop_name.upper()+"_PATH = "+json.dumps(str(ROOT / ("web/lua/workshop-"+workshop_name+".lua")))+"\n"
if os.environ.get("MAPFORGE_HUD_SNAPSHOT"):
    preamble += "HUD_SNAPSHOT_PATH = " + json.dumps(os.environ["MAPFORGE_HUD_SNAPSHOT"]) + "\n"
for name in ["data-harness", "economy-harness", "hud-harness", "claim-harness", "commerce-harness", "story-hud-harness", "movement-harness", "event-harness", "only-up-fall-harness", "workshop-harness", "minigame-harness", "cosmetics-harness"]:
    check(preamble + (ROOT / "tests" / (name + ".lua")).read_text(encoding="utf-8"), name, True)
