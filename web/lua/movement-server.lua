-- MapForge: per-map movement settings and bounded sprint intent. Not an anti-cheat.
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local Config = require(RS:WaitForChild("MapForgeConfig"))
local movement = Config.Movement or {}
local function bounded(value, fallback, low, high)
    if type(value) ~= "number" or value ~= value or value == math.huge or value == -math.huge then return fallback end
    return math.max(low, math.min(high, value))
end
local walk = bounded(Config.WalkSpeed, 16, 8, 32)
local jump = bounded(Config.JumpPower, 50, 20, 70)
local sprint = bounded(movement.SprintSpeed, walk, walk, 32)
local enabled = movement.SprintEnabled == true and sprint > walk
local remote = Instance.new("RemoteEvent")
remote.Name = "MapForgeMovement" remote.Parent = RS
local states = {}
local function disconnected(connections)
    for _, connection in ipairs(connections) do connection:Disconnect() end
end
local function canRun(hum)
    if not hum or hum.Health <= 0 or hum.Sit or hum.PlatformStand then return false end
    local state = hum:GetState()
    return state ~= Enum.HumanoidStateType.Swimming and state ~= Enum.HumanoidStateType.Climbing
end
local function setRunning(player, state, active)
    active = active == true and enabled and canRun(state.humanoid)
    state.running = active
    if state.humanoid then state.humanoid.WalkSpeed = active and sprint or walk end
    player:SetAttribute("MapForgeSprinting", active)
end
local function character(player, state, char)
    state.generation = state.generation + 1 local generation = state.generation
    disconnected(state.characterConnections) state.characterConnections = {}
    state.humanoid = nil setRunning(player, state, false)
    local hum = char:WaitForChild("Humanoid", 10)
    if not hum or not hum:IsA("Humanoid") or states[player] ~= state or player.Character ~= char or generation ~= state.generation then return end
    state.humanoid = hum
    hum.UseJumpPower = true hum.JumpPower = jump setRunning(player, state, false)
    table.insert(state.characterConnections, hum.Died:Connect(function() setRunning(player, state, false) end))
    table.insert(state.characterConnections, hum.StateChanged:Connect(function() if not canRun(hum) then setRunning(player, state, false) end end))
    table.insert(state.characterConnections, hum:GetPropertyChangedSignal("Sit"):Connect(function() if hum.Sit then setRunning(player, state, false) end end))
    table.insert(state.characterConnections, hum:GetPropertyChangedSignal("PlatformStand"):Connect(function() if hum.PlatformStand then setRunning(player, state, false) end end))
end
local function join(player)
    if states[player] then return end
    local state = {generation = 0, characterConnections = {}, connections = {}, lastStart = -math.huge, running = false}
    states[player] = state player:SetAttribute("MapForgeSprinting", false)
    table.insert(state.connections, player.CharacterAdded:Connect(function(char) task.spawn(character, player, state, char) end))
    table.insert(state.connections, player.CharacterRemoving:Connect(function()
        state.generation = state.generation + 1 setRunning(player, state, false)
        disconnected(state.characterConnections) state.characterConnections = {} state.humanoid = nil
    end))
    if player.Character then task.spawn(character, player, state, player.Character) end
end
remote.OnServerEvent:Connect(function(player, active)
    local state = states[player]
    if not state or type(active) ~= "boolean" then return end
    -- Stop is never rate-limited; repeated starts do not perform more work.
    if not active then if state.running then setRunning(player, state, false) end return end
    if not enabled or state.running or not canRun(state.humanoid) then return end
    local now = os.clock() if now - state.lastStart < .15 then return end
    state.lastStart = now setRunning(player, state, true)
end)
Players.PlayerAdded:Connect(join)
Players.PlayerRemoving:Connect(function(player)
    local state = states[player] if not state then return end
    state.generation = state.generation + 1 disconnected(state.connections) disconnected(state.characterConnections) states[player] = nil
end)
for _, player in ipairs(Players:GetPlayers()) do join(player) end
