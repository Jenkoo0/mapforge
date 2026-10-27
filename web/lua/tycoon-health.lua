-- MapForge 3.0.0. Startup checks never reveal locked factory items.
local world = workspace:FindFirstChild("MapForgeWorld")
local cfg = game:GetService("ReplicatedStorage"):FindFirstChild("MapForgeConfig")
if not world or not cfg then warn("[MapForge Health] Missing world/config") return end
local Config = require(cfg)
local E = require(script.Parent:WaitForChild("MapForgeTycoon"))
local plots, fixes, count = {}, 0, 0
for _, p in ipairs(world:GetDescendants()) do
    if p:IsA("BasePart") and p:FindFirstChild("MFKind") then
        count = count + 1
        if not p.Anchored then p.Anchored = true fixes = fixes + 1 end
        local id = p:FindFirstChild("MFPlot")
        if id and id.Value > 0 then
            local n = id.Value plots[n] = plots[n] or {Buttons = {}, Claim = 0, Collect = 0}
            local role = p:FindFirstChild("MFRole")
            if role then
                if role.Value == "Claim" then plots[n].Claim = plots[n].Claim + 1 end
                if role.Value == "Collect" then plots[n].Collect = plots[n].Collect + 1 end
                if role.Value == "Button" and p:FindFirstChild("MFUpgrade") then plots[n].Buttons[p.MFUpgrade.Value] = true end
            end
        end
    end
end
for id = 1, Config.PlotCount do
    local p = plots[id]
    if not p or p.Claim ~= 1 or p.Collect ~= 1 then warn("[MapForge Health] Plot claim/collector invalid: " .. tostring(id)) end
    for _, u in ipairs(E.Upgrades) do if not p or not p.Buttons[u.Id] then warn("[MapForge Health] Missing purchase button " .. tostring(id) .. "/" .. u.Id) end end
end
local seen = {}
for kind, id in pairs(Config.Products) do if id > 0 then if seen[id] then warn("[MapForge Health] Duplicate product ID") end seen[id] = kind end end
print("[MapForge Health] " .. tostring(count) .. " parts; anchor repairs " .. tostring(fixes) .. "; " .. tostring(Config.PlotCount) .. " plots / " .. tostring(#E.Upgrades) .. " upgrades")
print("[MapForge Health] Required: two-player ownership, save/rejoin, rebirth, offline earnings and real purchase tests.")
