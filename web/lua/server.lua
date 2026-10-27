-- MapForge 1.0.0: server-authoritative gameplay, opt-in purchases, session-backed saving.
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local Run = game:GetService("RunService")
local Market = game:GetService("MarketplaceService")
local Config = require(RS:WaitForChild("MapForgeConfig"))
local Data = require(script.Parent:WaitForChild("MapForgeData"))
local workshopEnabled=Config.Grind and Config.Grind.Enabled==true
local Workshop=workshopEnabled and require(script.Parent:WaitForChild("MapForgeWorkshopCore")) or nil
local world = workspace:WaitForChild("MapForgeWorld")
local remotes = Instance.new("Folder")
remotes.Name = "MapForgeRemotes"
remotes.Parent = RS
local action = Instance.new("RemoteEvent")
action.Name = "Action"
action.Parent = remotes
local notice = Instance.new("RemoteEvent")
notice.Name = "Notice"
notice.Parent = remotes
local state, joining = {}, {}
local pads, hazardList = {}, {}
for _, p in ipairs(world.stage:GetChildren()) do
    if p:IsA("BasePart") and p:FindFirstChild("MFStage") then pads[p.MFStage.Value] = p end
end
-- Tall courses should return a fallen player to their checkpoint without a long fall to the world floor.
local function onlyUpFall(player)
    if Config.ObbyStyle ~= "onlyup" or player:GetAttribute("MapForgeInArena") == true then return end
    local d=Data.Read(player) local s=state[player]
    local char=player.Character local root=char and char:FindFirstChild("HumanoidRootPart")
    local hum=char and char:FindFirstChildOfClass("Humanoid")
    local pad=d and pads[d.Checkpoint]
    if s and pad and root and hum and hum.Health>0 and root.Position.Y<pad.Position.Y-20 then hum.Health=0 end
end
local fallTick=0
Run.Heartbeat:Connect(function(dt)
    if Config.ObbyStyle~="onlyup" then return end
    fallTick=fallTick+dt if fallTick<.25 then return end fallTick=0
    for _,player in ipairs(Players:GetPlayers()) do onlyUpFall(player) end
end)
local function sync(player)
    local d, s = Data.Read(player), state[player]
    if not d or not s then return end
    player:SetAttribute("Stage", s.stage)
    player:SetAttribute("Coins", d.Coins)
    player:SetAttribute("Wins", d.Wins)
    player:SetAttribute("BoostSeconds", d.BoostSeconds)
    player:SetAttribute("TrailOwned", d.Trail)
    player:SetAttribute("CanPurchase", Data.CanPurchase(player) and Config.ShopEnabled and Config.Products.Boost15 > 0 and Config.Products.Coins500 > 0 and Config.Products.Boost15 ~= Config.Products.Coins500)
    local stats = player:FindFirstChild("leaderstats")
    if stats then stats.Stage.Value = s.stage stats.Coins.Value = d.Coins stats.Wins.Value = d.Wins end
end
local function message(player, text) if player.Parent then notice:FireClient(player, text) end end
local function getPlayer(hit, part, distance)
    local character = hit:FindFirstAncestorOfClass("Model")
    local player = character and Players:GetPlayerFromCharacter(character)
    local root = character and character:FindFirstChild("HumanoidRootPart")
    local hum = character and character:FindFirstChildOfClass("Humanoid")
    if not player or not root or not hum or hum.Health <= 0 or not state[player] or not Data.CanProgress(player) then return nil end
    if (root.Position - part.Position).Magnitude > distance then return nil end
    return player
end
local function applyTrail(player)
    local d = Data.Read(player)
    local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    if not d or not d.Trail or not root or root:FindFirstChild("MFGlowTrail") then return end
    local a, b = Instance.new("Attachment"), Instance.new("Attachment")
    a.Position = Vector3.new(-0.7, -1, 0) b.Position = Vector3.new(0.7, -1, 0)
    a.Parent = root b.Parent = root
    local trail = Instance.new("Trail")
    trail.Name = "MFGlowTrail" trail.Attachment0 = a trail.Attachment1 = b
    trail.Color = ColorSequence.new(Color3.fromRGB(186, 255, 98), Color3.fromRGB(123, 137, 255))
    trail.Lifetime = 0.45 trail.LightEmission = 0.6 trail.Parent = root
end
local function spawnCharacter(player, char)
    local root = char:WaitForChild("HumanoidRootPart", 10)
    local hum = char:WaitForChild("Humanoid", 10)
    if not root or not hum then return end
    -- MapForgeMovementServer applies the profile once per character, independently of data loading.
    local d, s = Data.Read(player), state[player]
    if not d or not s then return end
    s.stage = d.Checkpoint
    s.lastMove = os.clock()
    local pad = pads[d.Checkpoint] or pads[0]
    if pad then
        local nextPad = pads[math.min(d.Checkpoint + 1, Config.StageCount)]
        local at = pad.Position + Vector3.new(0, 5, 0)
        local target = nextPad and Vector3.new(nextPad.Position.X, at.Y, nextPad.Position.Z) or at + Vector3.new(0, 0, -1)
        if (at - target).Magnitude < 0.1 then target = at + Vector3.new(0, 0, -1) end
        char:PivotTo(CFrame.lookAt(at, target))
    end
    applyTrail(player) sync(player)
end
local function join(player)
    if state[player] or joining[player] then return end
    joining[player] = true
    local ok, reason = Data.Open(player)
    joining[player] = nil
    if not ok then player:Kick(reason == "SESSION_BUSY" and "Profil noch in anderer Sitzung aktiv. Bitte kurz warten und neu verbinden." or "Speicher vorübergehend nicht erreichbar. Bitte später erneut versuchen.") return end
    if not player.Parent then Data.Close(player) return end
    local d = Data.Read(player)
    state[player] = {stage = d.Checkpoint, collected = {}, lastMove = os.clock(), lastAction = 0, finished = false,
        runKey=workshopEnabled and ("obby:"..game:GetService("HttpService"):GenerateGUID(false)) or nil}
    local stats = Instance.new("Folder") stats.Name = "leaderstats" stats.Parent = player
    for _, name in ipairs({"Stage", "Coins", "Wins"}) do local v = Instance.new("IntValue") v.Name = name v.Parent = stats end
    player.CharacterAdded:Connect(function(char) spawnCharacter(player, char) end)
    if player.Character then task.spawn(spawnCharacter, player, player.Character) end
    sync(player)
end
for index, pad in pairs(pads) do
    pad.Touched:Connect(function(hit)
        local player = getPlayer(hit, pad, 13)
        if not player then return end
        local s = state[player]
        if index ~= s.stage + 1 or os.clock() - s.lastMove < 0.35 then return end
        s.stage = index s.lastMove = os.clock()
        if index % Config.CheckpointEvery == 0 then
            Data.Edit(player, function(d) d.Checkpoint = index end, false)
            message(player, "Checkpoint " .. tostring(index) .. " erreicht")
        end
        if index == Config.StageCount and not s.finished then
            local finishCoins=50
            local saved=Data.Edit(player, function(d)
                finishCoins=Workshop and Workshop.FinishCoins(d) or 50
                if Workshop and Workshop.HasClaim(d,s.runKey) then return end
                d.Wins=d.Wins+1 d.Coins=d.Coins+finishCoins d.Checkpoint=0
                if Workshop then assert(Workshop.Award(d,s.runKey,3,6)) end
            end,workshopEnabled==true)
            if saved then
                s.finished=true
                message(player,"Geschafft! +"..finishCoins.." Münzen"..(Workshop and " · +3 Werkmarken · +6 EP" or "")..". Mit Neustart eine weitere Runde beginnen.")
            else
                -- Keep completion retryable; the profile layer resolves the same pending write first.
                s.stage=index-1
                message(player,"Zielprämie noch nicht gespeichert. Bei gesundem Speicher das Ziel erneut berühren.")
            end
        end
        sync(player)
    end)
end
for _, coin in ipairs(world.coin:GetChildren()) do
    if coin:IsA("BasePart") and coin:FindFirstChild("MFStage") then
        local index = coin.MFStage.Value
        coin.Touched:Connect(function(hit)
            local player = getPlayer(hit, coin, 10)
            if not player then return end
            local s = state[player]
            if s.collected[index] or s.stage < index - 1 or s.stage > index + 1 then return end
            s.collected[index] = true
            local granted = Data.Edit(player, function(d)
                local amount=d.BoostSeconds>0 and 10 or 5
                d.Coins=d.Coins+(Workshop and Workshop.Coin(d,amount) or amount)
            end, false)
            if not granted then s.collected[index] = nil return end
            notice:FireClient(player, "coin", coin.Name)
            sync(player)
        end)
    end
end
for _, hazard in ipairs(world.hazard:GetChildren()) do
    if hazard:IsA("BasePart") and hazard:FindFirstChild("MFMode") then
        table.insert(hazardList, {part = hazard, base = hazard.CFrame, mode = hazard.MFMode.Value, active = true})
        hazard.Touched:Connect(function(hit)
            if not hazard.CanTouch then return end
            local player = getPlayer(hit, hazard, 12)
            if player then local h = player.Character:FindFirstChildOfClass("Humanoid") if h then h.Health = 0 end end
        end)
    end
end
local elapsed, accumulator = 0, 0
Run.Heartbeat:Connect(function(dt)
    elapsed = elapsed + dt accumulator = accumulator + dt
    if accumulator < 1 / 20 then return end
    accumulator = 0
    for _, h in ipairs(hazardList) do
        if h.mode == "Sweep" then h.part.CFrame = h.base * CFrame.Angles(0, elapsed * 0.8, 0)
        else
            local active = elapsed % 4 < 2
            if active ~= h.active then h.active = active h.part.CanTouch = active h.part.Transparency = active and 0 or 0.85 end
        end
    end
end)
action.OnServerEvent:Connect(function(player, kind)
    local s = state[player]
    if not s or type(kind) ~= "string" or os.clock() - s.lastAction < 1 then return end
    s.lastAction = os.clock()
    if kind == "Restart" then
        if not Data.Edit(player, function(d) d.Checkpoint = 0 end, false) then return end
        s.collected = {} s.finished = false
        if Workshop then s.runKey="obby:"..game:GetService("HttpService"):GenerateGUID(false) end
        player:LoadCharacterAsync()
    elseif kind == "Trail" then
        local ok = Data.Edit(player, function(d)
            if d.Trail or d.Coins < 250 then return false end
            d.Coins = d.Coins - 250 d.Trail = true
        end, true)
        if ok then applyTrail(player) message(player, "Leuchtspur freigeschaltet") else message(player, "250 Münzen benötigt oder Spur bereits vorhanden. Bei Speicherfehlern erneut versuchen.") end
    end
    sync(player)
end)
Market.ProcessReceipt = function(receipt)
    local player = Players:GetPlayerByUserId(receipt.PlayerId)
    if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
    -- Resolve old valid receipts even if the shop was later hidden. Keep old product IDs configured.
    local kind
    if receipt.ProductId > 0 and receipt.ProductId == Config.Products.Boost15 then kind = "Boost15"
    elseif receipt.ProductId > 0 and receipt.ProductId == Config.Products.Coins500 then kind = "Coins500" end
    if not kind or Config.Products.Boost15 == Config.Products.Coins500 then
        warn("[MapForge] Unknown/duplicate product ID; receipt deferred.")
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end
    local ok = false
    for attempt = 1, 3 do
        ok = Data.Receipt(player, tostring(receipt.PurchaseId), kind)
        if ok then break end
        task.wait(attempt)
    end
    sync(player)
    if ok then message(player, "Kauf gespeichert. Danke!") return Enum.ProductPurchaseDecision.PurchaseGranted end
    return Enum.ProductPurchaseDecision.NotProcessedYet
end
Players.PlayerAdded:Connect(join)
Players.PlayerRemoving:Connect(function(player) Data.Close(player) state[player] = nil end)
for _, player in ipairs(Players:GetPlayers()) do task.spawn(join, player) end
task.spawn(function()
    while task.wait(10) do
        for _, player in ipairs(Players:GetPlayers()) do
            local d = Data.Read(player)
            if d and d.BoostSeconds > 0 then Data.Edit(player, function(v) v.BoostSeconds = math.max(0, v.BoostSeconds - 10) end, false) end
            sync(player)
        end
    end
end)
task.spawn(function()
    while task.wait(45) do
        for _, player in ipairs(Players:GetPlayers()) do task.spawn(function() Data.Save(player) sync(player) end) end
    end
end)
game:BindToClose(function()
    local pending = 0
    for _, player in ipairs(Players:GetPlayers()) do
        pending = pending + 1
        task.spawn(function() Data.Close(player) pending = pending - 1 end)
    end
    local deadline = os.clock() + 25
    while pending > 0 and os.clock() < deadline do task.wait(0.1) end
end)
