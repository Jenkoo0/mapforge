-- MapForge 3.3.0: contextual offers and free milestones; all economic actions on the server.
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local Market = game:GetService("MarketplaceService")
local Run = game:GetService("RunService")
local Analytics = game:GetService("AnalyticsService")
local studioTools = false
local Config = require(RS:WaitForChild("MapForgeConfig"))
studioTools = Run:IsStudio() and Config.StudioTestData == true and Config.StudioTestTools == true
local Data = require(script.Parent:WaitForChild("MapForgeData"))
local E = require(script.Parent:WaitForChild("MapForgeTycoon"))
E.SetTheme(Config.Theme or "sky")
E.SetWorkshop(Config.Grind and Config.Grind.Enabled == true)
local world = workspace:WaitForChild("MapForgeWorld")
local remotes = Instance.new("Folder") remotes.Name = "MapForgeRemotes" remotes.Parent = RS
local action = Instance.new("RemoteEvent") action.Name = "Action" action.Parent = remotes
local notice = Instance.new("RemoteEvent") notice.Name = "Notice" notice.Parent = remotes
local update = Instance.new("RemoteEvent") update.Name = "Update" update.Parent = remotes
local states, joining, plots = {}, {}, {}
local catalogIds, catalogStatus = {}, "loading"
local function fetchProductCatalog()
    local ok, result = pcall(function()
        local ids, pages = {}, Market:GetDeveloperProductsAsync()
        repeat
            for _, info in ipairs(pages:GetCurrentPage()) do
                if type(info.ProductId)=="number" and info.ProductId>0 then ids[info.ProductId]=true end
            end
            if pages.IsFinished then break end
            pages:AdvanceToNextPageAsync()
        until false
        return ids
    end)
    return ok and result or nil
end
local function productAvailability()
    local counts, ready = {}, {}
    for _, id in pairs(Config.Products) do if id>0 then counts[id]=(counts[id] or 0)+1 end end
    for key, id in pairs(Config.Products) do ready[key]=id>0 and counts[id]==1 and catalogIds[id]==true end
    return ready
end
local function tell(player, text) if player.Parent then notice:FireClient(player, text) end end
local function value(part, name) local v = part:FindFirstChild(name) return v and v.Value end
local function near(player, part)
    local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
    return root and hum and hum.Health > 0 and part and (root.Position - part.Position).Magnitude <= 18
end
local function money(n)
    if n >= 1e9 then return string.format("%.1fB", n / 1e9) end
    if n >= 1e6 then return string.format("%.1fM", n / 1e6) end
    if n >= 1e3 then return string.format("%.1fK", n / 1e3) end
    return tostring(math.floor(n))
end
local function trackOnboarding(player)
    local s, d = states[player], Data.Read(player)
    if not s or not d or s.tracking or Run:IsStudio() or not Config.OnboardingAnalytics or not Config.Persistence then return end
    s.tracking = true
    for _ = 1, 4 do
        d = Data.Read(player)
        local nextStep = d and E.NextOnboardingStage(d)
        if not nextStep then break end
        local names = {"Factory Joined", "Free Starter Built", "First Collection", "Five Builds"}
        local ok = pcall(function() Analytics:LogOnboardingFunnelStepEvent(player, nextStep, names[nextStep]) end)
        if not ok then
            if not s.analyticsWarning then warn("[MapForge] Analytics unavailable; gameplay continues.") s.analyticsWarning = true end
            break
        end
        if not Data.Edit(player, function(record) record.TycoonFunnelStage = nextStep end, false) then break end
    end
    s.tracking = false
end
local function visible(part, on)
    part.Transparency = on and (value(part, "MFTransparency") or 0) or 1
    for _, child in ipairs(part:GetChildren()) do
        if child:IsA("Light") or child:IsA("BillboardGui") or child:IsA("SurfaceGui") then child.Enabled = on end
    end
    part.CanCollide = on and value(part, "MFCollide") == true
end
local function billboard(part)
    local existing = part:FindFirstChild("MapForgeSign")
    if existing and existing:FindFirstChild("Text") then return existing.Text end
    local g = Instance.new("BillboardGui") g.Name = "MapForgeSign" g.Size = UDim2.fromOffset(152, 42) g.StudsOffset = Vector3.new(0, 3.4, 0) g.AlwaysOnTop = false g.MaxDistance = 26 g.Parent = part
    local t = Instance.new("TextLabel") t.Size = UDim2.fromScale(1, 1) t.BackgroundColor3 = Color3.fromRGB(25, 33, 44) t.BackgroundTransparency = 0.15 t.TextColor3 = Color3.fromRGB(225, 244, 238) t.TextSize = 14 t.TextWrapped = true t.Font = Enum.Font.GothamBold t.Parent = g
    local corner = Instance.new("UICorner") corner.CornerRadius = UDim.new(0, 8) corner.Parent = t
    return t
end
local function sync(player)
    local s, d = states[player], Data.Read(player)
    if not s or not d or not player.Parent then return end
    local nextUpgrade = E.Next(d, Config.BuildCostFactor)
    local nextMilestone
    for _, milestone in ipairs(E.Milestones) do if not d.TycoonMilestones[milestone.Id] then nextMilestone = milestone break end end
    local contracts = E.ContractStatus(d, os.time(), s.flags)
    local productReady, offerKeys = productAvailability(), {}
    if s.passesLoaded and Data.CanPurchase(player) then
        for _, key in ipairs(E.Recommend(Config,d,s)) do
            if (Config.Passes[key] or 0)>0 or productReady[key] then table.insert(offerKeys,key) end
        end
    end
    local ready = contracts.Active and contracts.Active.Progress >= contracts.Active.Target
    if ready and not s.contractReady then tell(player, "Auftrag fertig! Unter Aufträge kannst du deine Kristalle abholen.") end
    s.contractReady = ready == true
    local daily = d.TycoonDaily
    if daily.Day ~= math.floor(os.time() / 86400) then daily = {Day=math.floor(os.time()/86400),Buys=0,Seconds=0,Collected=0,Claims={}} end
    update:FireClient(player, {Cash = d.TycoonCash, Bank = d.TycoonBank, Gems = d.Gems, Rebirths = d.TycoonRebirths, Count = E.Count(d), Total = #E.Upgrades, Research = d.TycoonResearch, Income = E.Income(d, s.flags), Boost = d.TycoonBoost, Plot = s.plot and s.plot.id or 0, Next = nextUpgrade, FirstCollect = d.TycoonFirstCollect, Milestone = nextMilestone, Milestones = E.Milestones, MilestoneClaims = d.TycoonMilestones, Offers = offerKeys, ProductReady = productReady, CatalogStatus = catalogStatus, Calibration = E.CalibrationStatus(d, os.time()), Skins = d.TycoonSkins, Skin = d.TycoonSkin, Daily = daily, Contracts = contracts, Flags = s.flags, StudioTools = studioTools, CanPurchase = Config.ShopEnabled and Data.CanPurchase(player), SavingPaused = not Data.CanProgress(player)})
    local stats = player:FindFirstChild("leaderstats")
    if stats then stats.Cash.Value = math.floor(d.TycoonCash) stats.Rebirths.Value = d.TycoonRebirths end
    if s.plot then s.plot.bankLabel.Text = "TRESOR\n" .. money(d.TycoonBank) .. " Cash" end
end
local function rebuild(plot)
    local p = plot.owner
    local d = p and Data.Read(p)
    local nextUpgrade = d and E.Next(d, Config.BuildCostFactor)
    local skinColor
    if d then for _, skin in ipairs(E.Skins) do if skin.Id == d.TycoonSkin and skin.Id ~= "mint" then skinColor = Color3.fromHex(skin.Color) end end end
    if p and states[p] and states[p].flags.VIP and d.TycoonSkin == "mint" then skinColor = Color3.fromRGB(255, 220, 134) end
    for _, part in ipairs(plot.parts) do
        local role, unlock = value(part, "MFRole"), value(part, "MFUnlock")
        if role == "Button" then
            local id = value(part, "MFUpgrade")
            local on = nextUpgrade ~= nil and nextUpgrade.Id == id
            visible(part, on)
            local prompt = part:FindFirstChildOfClass("ProximityPrompt")
            if prompt then prompt.Enabled = on end
        elseif unlock then visible(part, d ~= nil and d.TycoonOwned[unlock] == true) end
        if value(part, "MFSkin") then
            local original = value(part, "MFColor")
            part.Color = skinColor or (original and Color3.fromHex(original)) or part.Color
            for _, child in ipairs(part:GetChildren()) do if child:IsA("Light") then child.Color = part.Color end end
        end
    end
    plot.claimPrompt:SetAttribute("MapForgeAvailable", p == nil)
    plot.claimPrompt.Enabled = p == nil
    plot.claimLabel.Text = p and (p.DisplayName .. "\nFACTORY " .. tostring(plot.id)) or ("FREIES GRUNDSTÜCK\nFACTORY " .. tostring(plot.id))
    if not p then plot.bankLabel.Text = "TRESOR\nNoch frei" end
end
local function teleport(player)
    local s = states[player]
    local char = player.Character
    if not s or not s.plot or not char then return end
    local root = char:WaitForChild("HumanoidRootPart", 10)
    if root then char:PivotTo(s.plot.claim.CFrame + Vector3.new(0, 5, 0)) end
end
local function claim(player, plot, quiet)
    local s = states[player]
    if not s then return false end
    if s.plot then if not quiet then tell(player, "Du hast bereits Grundstück " .. tostring(s.plot.id) .. ". Nutze Ausbau oder Zum Grundstück.") end return false end
    if plot.owner then if not quiet then tell(player, "Dieses Grundstück wurde gerade vergeben. Wähle einen anderen freien Platz.") end return false end
    s.plot = plot plot.owner = player rebuild(plot) sync(player) task.spawn(teleport, player)
    tell(player, "Deine Fabrik! Kaufe den kostenlosen Starter am leuchtenden Feld.")
    return true
end
local function transact(player, command, id)
    local s = states[player]
    if not s then return end
    if command == "Get" then sync(player) return end
    if command == "DesignInterest" then s.designInterest = true sync(player) return end
    if command == "Home" then teleport(player) return end
    if not s.plot or s.plot.owner ~= player then tell(player, "Beanspruche zuerst ein freies Grundstück.") return end
    local plot, ok = s.plot, false
    local before = Data.Read(player)
    local beforeGems, beforeCount = before.Gems, E.Count(before)
    local collected = 0
    if command == "Next" or command == "Vault" then
        local nextUpgrade = E.Next(Data.Read(player), Config.BuildCostFactor)
        local target = command == "Vault" and plot.collector or (nextUpgrade and plot.buttons[nextUpgrade.Id])
        if target and player.Character then player.Character:PivotTo(target.CFrame * CFrame.new(0, 4, 5)) end return
    end
    if command == "TestCash" or command == "TestBuild" or command == "TestClear" then
        if not studioTools then return end
        ok = Data.Edit(player, function(d)
            if command == "TestCash" then d.TycoonCash = 1e12
            elseif command == "TestBuild" then for _, u in ipairs(E.Upgrades) do d.TycoonOwned[u.Id] = true end
            else d.TycoonOwned = {} d.TycoonCash = 0 d.TycoonBank = 0 end
        end, true)
        if ok then tell(player, "Studio-Testprofil geändert. Live-Spielstände bleiben getrennt.") end
    elseif command == "Calibrate" then
        local station = tonumber(id)
        local target = station and plot.calibration[station]
        if not near(player,target) then tell(player,"Gehe zur markierten Kalibrierungsstation in deiner Fabrik.") return end
        if s.lastCalibrationAt and os.clock()-s.lastCalibrationAt<4 then tell(player,"Gehe zur nächsten Station. Die Runde braucht kurze Laufwege.") return end
        ok = Data.Edit(player,function(d) return E.Calibrate(d,station,os.time()) end,true)
        if ok then
            s.lastCalibrationAt = os.clock()
            local progress = E.CalibrationStatus(Data.Read(player),os.time())
            tell(player,progress.Step==0 and "Runde geschafft! +15 % Produktion für 120 Sekunden Spielzeit, kostenlos." or ("Station kalibriert! Weiter zu Station "..tostring(progress.Next).."/3."))
        end
    elseif command == "Buy" then
        local button = plot.buttons[id]
        if not near(player, button) then tell(player, "Gehe zum nächsten Kauf-Feld in deiner Fabrik.") return end
        ok = Data.Edit(player, function(d) return E.Buy(d, id, os.time(), Config.BuildCostFactor) end, true)
    elseif command == "Collect" then
        if not near(player, plot.collector) then tell(player, "Gehe zum grünen Tresor, um Cash abzuholen.") return end
        ok = Data.Edit(player, function(d) collected = E.Collect(d, os.time()) end, false)
        if ok and collected > 0 then s.collects = s.collects + 1 tell(player, "+" .. money(collected) .. " Cash abgeholt. Bereit für den nächsten Ausbau!") end
    elseif command == "Rebirth" then
        ok = Data.Edit(player, function(d) return E.Rebirth(d) end, true)
        if ok then tell(player, "Rebirth! +20 % Basisproduktion und Kristalle. Forschung, Skins, Pässe und Boost bleiben erhalten.") end
    elseif command == "Skin" then ok = Data.Edit(player, function(d) return E.Skin(d, id) end, true)
    elseif command == "Research" then ok = Data.Edit(player, function(d) return E.Study(d, id) end, true)
    elseif command == "ContractStart" then ok = Data.Edit(player, function(d) return E.StartContract(d, id, os.time(), s.flags) end, true)
    elseif command == "ContractClaim" then
        ok = Data.Edit(player, function(d) return E.ClaimContract(d, os.time()) end, true)
        if ok then tell(player, "Auftrag erledigt: kostenlose Kristalle gespeichert!") end
    elseif command == "ContractCancel" then ok = Data.Edit(player, function(d) return E.CancelContract(d) end, true)
    elseif command == "Quest" then ok = Data.Edit(player, function(d) return E.Claim(d, id, os.time()) end, true)
    end
    if ok then
        rebuild(plot)
        local after = Data.Read(player)
        if command == "Buy" and E.Count(after) > beforeCount then
            tell(player, "Ausbau fertig!" .. (after.Gems > beforeGems and (" Meilenstein: +" .. tostring(after.Gems - beforeGems) .. " kostenlose Kristalle.") or " Deine Fabrik wächst."))
        end
        if command == "Buy" or command == "Collect" then task.spawn(trackOnboarding, player) end
    elseif command ~= "Get" then tell(player, "Noch nicht verfügbar, nicht genug Guthaben oder Speicher vorübergehend belegt.") end
    sync(player)
end
local function prompt(part, object, text, callback, promptName)
    local p = Instance.new("ProximityPrompt") p.Name = promptName or "MapForgePrompt" p.ActionText = text p.ObjectText = object p.MaxActivationDistance = 12 p.HoldDuration = 0.2 p.RequiresLineOfSight = false p.Parent = part
    p.Triggered:Connect(callback) return p
end
for i = 1, Config.PlotCount do plots[i] = {id = i, parts = {}, buttons = {}, calibration = {}} end
for _, part in ipairs(world:GetDescendants()) do
    if part:IsA("BasePart") then
        local labelText = value(part, "MFLabel")
        if labelText then local text = billboard(part) text.Text = labelText text.Parent.Enabled = part.Transparency < 1 end
        local id = value(part, "MFPlot")
        if id and plots[id] then
            local plot = plots[id] table.insert(plot.parts, part)
            local role = value(part, "MFRole")
            if role == "Claim" then
                plot.claim = part plot.claimLabel = billboard(part)
                plot.claimPrompt = prompt(part, "Grundstück " .. tostring(id), "Beanspruchen", function(player) if near(player, part) then claim(player, plot) end end, "MapForgeClaimPrompt")
            elseif role == "Collect" then
                plot.collector = part plot.bankLabel = billboard(part)
                prompt(part, "Tresor", "Cash abholen", function(player) if plot.owner == player then transact(player, "Collect") end end)
            elseif role == "Rebirth" then
                -- Rebirth is confirmed in the HUD; the world prompt opens its info panel.
                prompt(part, "Prestige", "Rebirth ansehen", function(player) if plot.owner == player then notice:FireClient(player, "open-rebirth") end end)
            elseif role == "ContractBoard" then
                prompt(part, "Dein Auftragsbrett", "Auftrag wählen", function(player) if plot.owner == player then notice:FireClient(player, "open-quests") end end)
            elseif role == "Shop" or role == "Research" then
                local target = role == "Shop" and "open-shop" or "open-research"
                prompt(part, role == "Shop" and "Empire-Shop" or "Forschung", "Öffnen", function(player) if plot.owner == player then notice:FireClient(player, target) end end)
            elseif role and string.match(role,"^Calibration[123]$") then
                local station = tonumber(string.sub(role,-1)) plot.calibration[station] = part
                prompt(part,"Station "..tostring(station).."/3 · Gratis-Runde","Kalibrieren",function(player) if plot.owner==player then transact(player,"Calibrate",tostring(station)) end end)
            elseif role == "Button" then
                local upgradeId = value(part, "MFUpgrade") plot.buttons[upgradeId] = part
                local u for _, item in ipairs(E.Upgrades) do if item.Id == upgradeId then u = item break end end
                if u then local pr = prompt(part, u.Name .. " · " .. money(E.BuildCost(u, Config.BuildCostFactor)) .. " Cash", "Bauen", function(player) if plot.owner == player then transact(player, "Buy", upgradeId) end end) pr.Enabled = false end
            end
        end
    end
end
for _, plot in ipairs(plots) do rebuild(plot) end
local function refreshPasses(player)
    local s = states[player] if not s then return end
    local allVerified = true
    for name, id in pairs(Config.Passes) do
        if id > 0 then local ok, owns = pcall(function() return Market:UserOwnsGamePassAsync(player.UserId, id) end) if ok and states[player] == s then s.flags[name] = owns == true else allVerified = false end end
    end
    s.passesLoaded = allVerified
    if s.plot then rebuild(s.plot) end sync(player)
end
local function join(player)
    if joining[player] or states[player] then return end joining[player] = true
    local ok, reason = Data.Open(player) joining[player] = nil
    if not ok then player:Kick(reason == "SESSION_BUSY" and "Profil noch auf anderem Server aktiv. Bitte kurz warten." or "Speicher nicht erreichbar. Bitte später erneut versuchen.") return end
    if not player.Parent then Data.Close(player) return end
    states[player] = {flags = {}, plot = nil, lastAction = 0, seconds = 0, collects = 0, designInterest = false}
    local stats = Instance.new("Folder") stats.Name = "leaderstats" stats.Parent = player
    for _, name in ipairs({"Cash", "Rebirths"}) do local v = Instance.new("NumberValue") v.Name = name v.Parent = stats end
    local offline = 0
    Data.Edit(player, function(d) offline = E.Offline(d, os.time()) end, true)
    for _, plot in ipairs(plots) do if claim(player, plot, true) then break end end
    player.CharacterAdded:Connect(function() task.spawn(teleport, player) end)
    task.spawn(refreshPasses, player) sync(player) task.spawn(trackOnboarding, player)
    if offline > 0 then task.delay(3, function() tell(player, "Offline produziert: " .. money(offline) .. " Cash im Tresor.") end) end
end
action.OnServerEvent:Connect(function(player, command, id)
    local s = states[player]
    if not s or type(command) ~= "string" or #command > 20 or (id ~= nil and (type(id) ~= "string" or #id > 30)) then return end
    if os.clock() - s.lastAction < 0.4 then return end s.lastAction = os.clock()
    transact(player, command, id)
end)
Market.ProcessReceipt = function(receipt)
    local player = Players:GetPlayerByUserId(receipt.PlayerId)
    if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
    local kind, matches = nil, 0
    for key, id in pairs(Config.Products) do if id > 0 and id == receipt.ProductId then kind = key matches = matches + 1 end end
    if matches ~= 1 then warn("[MapForge] Unknown/duplicate product ID; receipt deferred.") return Enum.ProductPurchaseDecision.NotProcessedYet end
    for attempt = 1, 3 do
        if Data.Receipt(player, tostring(receipt.PurchaseId), kind) then sync(player) tell(player, "Kauf dauerhaft gespeichert. Danke!") return Enum.ProductPurchaseDecision.PurchaseGranted end
        task.wait(attempt)
    end
    sync(player) return Enum.ProductPurchaseDecision.NotProcessedYet
end
Market.PromptGamePassPurchaseFinished:Connect(function(player, id, bought) if bought and states[player] then task.spawn(refreshPasses, player) end end)
Players.PlayerAdded:Connect(join)
Players.PlayerRemoving:Connect(function(player)
    local s = states[player] states[player] = nil
    if s and s.plot then
        local free = s.plot free.owner = nil rebuild(free)
        for other, state in pairs(states) do if other.Parent and not state.plot then claim(other, free) break end end
    end
    Data.Close(player)
end)
for _, player in ipairs(Players:GetPlayers()) do task.spawn(join, player) end
task.spawn(function()
    local last, ticks = os.clock(), 0
    while task.wait(1) do
        local now = os.clock() local dt = math.min(10, now - last) last = now ticks = ticks + 1
        for player, s in pairs(states) do
            if player.Parent and s.plot then
                local progressed = Data.Edit(player, function(d) E.Tick(d, dt, s.flags, os.time()) end, false)
                if progressed then s.seconds = s.seconds + dt end
                if ticks % 30 == 0 then task.spawn(trackOnboarding, player) end
            end
            if ticks % 2 == 0 then sync(player) end
        end
        if ticks % 45 == 0 then for player in pairs(states) do task.spawn(function() Data.Save(player) sync(player) end) end end
    end
end)
game:BindToClose(function()
    local pending = 0
    for _, player in ipairs(Players:GetPlayers()) do pending = pending + 1 task.spawn(function() Data.Close(player) pending = pending - 1 end) end
    local deadline = os.clock() + 25 while pending > 0 and os.clock() < deadline do task.wait(0.1) end
end)
task.spawn(function()
    local configured=false for _,id in pairs(Config.Products) do if id>0 then configured=true end end
    if not configured then catalogStatus="not-configured" return end
    repeat
        local result=fetchProductCatalog()
        catalogIds=result or {} catalogStatus=result and "ready" or "unavailable"
        if not result then warn("[MapForge] Product catalog unavailable; new developer-product prompts remain disabled until retry.") end
        for player in pairs(states) do sync(player) end
    until not task.wait(catalogStatus=="ready" and 300 or 30)
end)
