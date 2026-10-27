-- Conservative startup repairs; only touches tagged MapForge geometry.
local world = workspace:FindFirstChild("MapForgeWorld")
if not world then warn("[MapForge Health] ERROR: MapForgeWorld missing") return end
local RS = game:GetService("ReplicatedStorage")
local module = RS:FindFirstChild("MapForgeConfig")
if not module then warn("[MapForge Health] ERROR: MapForgeConfig missing") return end
local Config = require(module)
local fixed, checked, stages = 0, 0, {}
for _, p in ipairs(world:GetDescendants()) do
    if p:IsA("BasePart") and p:FindFirstChild("MFKind") then
        checked = checked + 1
        if not p.Anchored then p.Anchored = true fixed = fixed + 1 end
        local kind = p.MFKind.Value
        if kind == "stage" then
            if not p.CanCollide then p.CanCollide = true fixed = fixed + 1 end
            if not p.CanTouch then p.CanTouch = true fixed = fixed + 1 end
            if p:FindFirstChild("MFStage") then stages[p.MFStage.Value] = p end
        elseif kind == "coin" or kind == "hazard" then
            if p.CanCollide then p.CanCollide = false fixed = fixed + 1 end
        end
    end
end
local errors = 0
for i = 0, Config.StageCount do
    if not stages[i] then errors = errors + 1 warn("[MapForge Health] Missing stage " .. tostring(i)) end
    if i > 0 and stages[i] and stages[i - 1] then
        local a, b = stages[i - 1], stages[i]
        local delta = b.Position - a.Position
        local gap = Vector2.new(math.max(0, math.abs(delta.X) - (a.Size.X + b.Size.X) / 2), math.max(0, math.abs(delta.Z) - (a.Size.Z + b.Size.Z) / 2)).Magnitude
        if gap > 6.01 or delta.Y > 3.01 then errors = errors + 1 warn("[MapForge Health] Retest jump at stage " .. tostring(i)) end
    end
end
local spawnCount = 0
for _, p in ipairs(world:GetDescendants()) do if p:IsA("SpawnLocation") then spawnCount = spawnCount + 1 end end
if spawnCount ~= 1 then errors = errors + 1 warn("[MapForge Health] Expected exactly one SpawnLocation") end
print("[MapForge Health] Checked " .. tostring(checked) .. " tagged parts; safe repairs " .. tostring(fixed) .. "; layout warnings " .. tostring(errors))
print("[MapForge Health] Still required: playtest, multiplayer, mobile, save/rejoin and purchase retry tests.")
