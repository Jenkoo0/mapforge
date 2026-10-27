-- MapForge: touch-friendly HUD and opt-in shop. No client-side rewards.
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local Market = game:GetService("MarketplaceService")
local player = Players.LocalPlayer
local Config = require(RS:WaitForChild("MapForgeConfig"))
local story = type(Config.Story) == "table" and type(Config.Story.Chapters) == "table" and Config.Story or nil
local remotes = RS:WaitForChild("MapForgeRemotes", 20)
if not remotes then warn("[MapForge] Server not ready. Check Server Output.") return end
local action, notice = remotes:WaitForChild("Action"), remotes:WaitForChild("Notice")
local pg = player:WaitForChild("PlayerGui")
if pg:FindFirstChild("MapForgeHUD") then pg.MapForgeHUD:Destroy() end
local gui = Instance.new("ScreenGui")
gui.Name = "MapForgeHUD" gui.ResetOnSpawn = false gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling gui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets gui.Parent = pg
local dark = Color3.fromRGB(23, 25, 39)
local light = Color3.fromRGB(242, 244, 253)
local accent = Color3.fromRGB(186, 255, 98)
local function round(obj)
    local corner = Instance.new("UICorner") corner.CornerRadius = UDim.new(0, 12) corner.Parent = obj
end
local function frame(parent, size, pos)
    local f = Instance.new("Frame") f.Size = size f.Position = pos f.BackgroundColor3 = dark f.BackgroundTransparency = 0.08 f.BorderSizePixel = 0 f.Parent = parent round(f) return f
end
local function label(parent, text, size, pos, fontSize)
    local l = Instance.new("TextLabel") l.Size = size l.Position = pos l.Text = text l.TextSize = fontSize or 15 l.Font = Enum.Font.GothamMedium l.TextColor3 = light l.BackgroundTransparency = 1 l.TextXAlignment = Enum.TextXAlignment.Left l.Parent = parent return l
end
local function button(parent, text, size, pos, callback)
    local b = Instance.new("TextButton") b.Size = size b.Position = pos b.Text = text b.TextSize = 14 b.Font = Enum.Font.GothamBold b.BackgroundColor3 = accent b.TextColor3 = dark b.BorderSizePixel = 0 b.Parent = parent round(b) b.Activated:Connect(callback) return b
end
local hud = frame(gui, UDim2.new(0.92, 0, 0, 112), UDim2.new(0.5, 0, 0, 12)) hud.AnchorPoint = Vector2.new(0.5, 0)
local limit = Instance.new("UISizeConstraint") limit.MaxSize = Vector2.new(500, 112) limit.Parent = hud
local title = label(hud, Config.Name, UDim2.new(1, -24, 0, 24), UDim2.new(0, 12, 0, 6), 16) title.TextTruncate = Enum.TextTruncate.AtEnd
local progress = label(hud, "Laden ...", UDim2.new(0.57, 0, 0, 25), UDim2.new(0, 12, 0, 35), 14)
local coins = label(hud, "0 Münzen", UDim2.new(0.43, -24, 0, 25), UDim2.new(0.57, 0, 0, 35), 14) coins.TextXAlignment = Enum.TextXAlignment.Right coins.TextColor3 = accent
local purpose = label(hud, "Ziel: Alle Plattformen bis zum Ende schaffen. Münzen sind optional.", UDim2.new(1, -24, 0, 40), UDim2.fromOffset(12, 65), 12) purpose.TextWrapped = true
if Config.OnlyUp then purpose.Text="Only Up · vier Themenkapitel. Sauber landen, Checkpoints sichern und den Gipfel erreichen." end
local toast = label(gui, "", UDim2.new(0.9, 0, 0, 64), UDim2.new(0.5, 0, 0, 125), 16) toast.AnchorPoint = Vector2.new(0.5, 0) toast.TextXAlignment = Enum.TextXAlignment.Center toast.TextWrapped = true
local toastIndex = 0
local function show(text)
    toastIndex = toastIndex + 1 local current = toastIndex toast.Text = text
    task.delay(4, function() if current == toastIndex then toast.Text = "" end end)
end
local panel = frame(gui, UDim2.new(0.92, 0, 0, 342), UDim2.new(0.5, 0, 0.5, 0)) panel.AnchorPoint = Vector2.new(0.5, 0.5) panel.Visible = false
panel.Name = "MapForgeShopPanel"
local plimit = Instance.new("UISizeConstraint") plimit.MaxSize = Vector2.new(440, 342) plimit.Parent = panel
label(panel, "DEIN SHOP", UDim2.new(1, -80, 0, 35), UDim2.new(0, 18, 0, 10), 20)
button(panel, "×", UDim2.fromOffset(38, 36), UDim2.new(1, -54, 0, 12), function() panel.Visible = false end)
local hint = label(panel, "Alles spielbar ohne Robux. Preise lädt Roblox.", UDim2.new(1, -36, 0, 42), UDim2.new(0, 18, 0, 52), 12) hint.TextWrapped = true
local buyButtons = {}
local function offer(key, text, ypos)
    local id = Config.Products[key]
    local priceReady = false
    local b
    b = button(panel, text .. " · nicht eingerichtet", UDim2.new(1, -36, 0, 52), UDim2.new(0, 18, 0, ypos), function()
        if not Config.ShopEnabled or not player:GetAttribute("CanPurchase") or not priceReady then show("Robux-Shop ist noch nicht bereit. Kostenlose Münzen und Leuchtspur funktionieren.") return end
        local ok = pcall(function() Market:PromptProductPurchase(player, id) end)
        if not ok then show("Kauffenster konnte nicht geöffnet werden. Bitte später erneut versuchen.") end
    end)
    b.TextSize = 12 b.TextWrapped = true
    table.insert(buyButtons, b)
    if id > 0 then task.spawn(function()
        local ok, info = pcall(function() return Market:GetProductInfoAsync(id, Enum.InfoType.Product) end)
        if ok and info and info.IsForSale and type(info.PriceInRobux) == "number" then b.Text = text .. " · " .. tostring(info.PriceInRobux) .. " Robux" priceReady = true
        else b.Text = text .. " · Preis nicht verfügbar" end
    end) end
end
offer("Boost15", "2× Münzen · 15 Minuten Spielzeit", 102)
offer("Coins500", "500 Münzen", 166)
local trailButton
trailButton = button(panel, "Leuchtspur · 250 Spielmünzen", UDim2.new(1, -36, 0, 52), UDim2.new(0, 18, 0, 230), function() action:FireServer("Trail") end)
trailButton.TextSize = 12
local boost = label(panel, "", UDim2.new(1, -36, 0, 38), UDim2.new(0, 18, 0, 292), 12) boost.TextWrapped = true
local journal, renderStory, storyButton
local shopButton = button(gui, "Shop", UDim2.fromOffset(104, 42), UDim2.new(1, -118, 0, 98), function()
    if journal then journal.Visible = false end
    panel.Visible = not panel.Visible
end)
shopButton.Name = "MapForgeShopToggle"
local restarting = false
local restartButton = button(gui, "Neustart", UDim2.fromOffset(104, 42), UDim2.new(1, -118, 0, 150), function()
    if not restarting then restarting = true show("Nochmal tippen: Runde ab Start. Münzen bleiben erhalten.") task.delay(4, function() restarting = false end) return end
    restarting = false
    local w = workspace:FindFirstChild("MapForgeWorld")
    if w and w:FindFirstChild("coin") then for _, c in ipairs(w.coin:GetChildren()) do if c:IsA("BasePart") then c.LocalTransparencyModifier = 0 end end end
    action:FireServer("Restart")
end)
restartButton.Name = "MapForgeRestartToggle"
if story then
    journal = frame(gui, UDim2.fromOffset(440, 480), UDim2.fromScale(.5, .5))
    journal.Name = "MapForgeStoryJournal" journal.AnchorPoint = Vector2.new(.5, .5) journal.Visible = false journal.ZIndex = 20
    label(journal, "DEINE GESCHICHTE", UDim2.new(1, -80, 0, 34), UDim2.fromOffset(16, 9), 18)
    button(journal, "×", UDim2.fromOffset(38, 36), UDim2.new(1, -54, 0, 9), function() journal.Visible = false end)
    local scroll = Instance.new("ScrollingFrame") scroll.Name = "MapForgeStoryScroll" scroll.Size = UDim2.new(1, -28, 1, -62) scroll.Position = UDim2.fromOffset(14, 52) scroll.BackgroundTransparency = 1 scroll.BorderSizePixel = 0 scroll.ScrollBarThickness = 4 scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y scroll.CanvasSize = UDim2.new() scroll.ScrollingDirection = Enum.ScrollingDirection.Y scroll.Parent = journal
    local list = Instance.new("UIListLayout") list.Padding = UDim.new(0, 16) list.SortOrder = Enum.SortOrder.LayoutOrder list.Parent = scroll
    local function storyText(text, name, order, font)
        local p = label(scroll, text, UDim2.new(1, -8, 0, 24), UDim2.new(), font or 14)
        p.Name = name p.TextWrapped = true p.TextYAlignment = Enum.TextYAlignment.Top p.AutomaticSize = Enum.AutomaticSize.Y p.LayoutOrder = order
        return p
    end
    storyText(story.Title, "MapForgeStoryTitle", 1, 18).TextColor3 = accent
    storyText(story.Premise, "MapForgeStoryPremise", 2)
    storyText("Dein Ziel: " .. story.Goal, "MapForgeStoryGoal", 3)
    local storyProgress = storyText("", "MapForgeStoryProgress", 4, 12) storyProgress.TextColor3 = accent
    local chapters = {}
    for i in ipairs(story.Chapters) do chapters[i] = storyText("", "MapForgeStoryChapter_" .. tostring(i), i + 4) end
    storyText("Kapitel folgen deinem aktuellen Abschnitt. Neustart und Rückkehr zum Checkpoint setzen die Lesefreigabe passend zu deiner Route zurück.", "MapForgeStoryScope", #chapters + 5, 12)
    renderStory = function()
        local stage = math.max(0, player:GetAttribute("Stage") or 0)
        local unlocked = 0
        for i, chapter in ipairs(story.Chapters) do
            local reached = stage >= chapter.Target
            if reached then unlocked = unlocked + 1 end
            chapters[i].Text = reached and ("Kapitel " .. tostring(i) .. " · " .. chapter.Title .. "\n" .. chapter.Text)
                or ("Kapitel " .. tostring(i) .. " · Noch verborgen\nAbschnitt " .. tostring(math.min(stage, chapter.Target)) .. "/" .. tostring(chapter.Target) .. " erreichen, um dieses Kapitel zu lesen.")
        end
        storyProgress.Text = tostring(unlocked) .. "/" .. tostring(#chapters) .. " Kapitel · Abschnitt " .. tostring(stage) .. "/" .. tostring(Config.StageCount)
    end
    storyButton = button(gui, "Geschichte", UDim2.fromOffset(104, 42), UDim2.new(1, -118, 0, 202), function()
        panel.Visible = false journal.Visible = not journal.Visible
        if journal.Visible then scroll.CanvasPosition = Vector2.new(0, 0) renderStory() end
    end)
    storyButton.Name = "MapForgeStoryToggle"
end
local function resizeHUD()
    local size = gui.AbsoluteSize or Vector2.new(816, 640)
    local width, height = math.max(240, size.X), math.max(240, size.Y)
    local buttons = {shopButton, restartButton}
    if storyButton then table.insert(buttons, storyButton) end
    if width < 620 or height < 420 then
        local buttonWidth = math.min(104, (width - 24 - (#buttons - 1) * 8) / #buttons)
        local start = (width - (#buttons * buttonWidth + (#buttons - 1) * 8)) / 2
        for i, b in ipairs(buttons) do b.Size = UDim2.fromOffset(buttonWidth, 42) b.Position = UDim2.fromOffset(start + (i - 1) * (buttonWidth + 8), 136) end
        toast.Position = UDim2.new(.5, 0, 0, 188)
    else
        for i, b in ipairs(buttons) do b.Size = UDim2.fromOffset(104, 42) b.Position = UDim2.new(1, -118, 0, 98 + (i - 1) * 52) end
        toast.Position = UDim2.new(.5, 0, 0, 125)
    end
    if journal then journal.Size = UDim2.fromOffset(math.min(480, width - 24), math.min(520, height - 24)) end
end
gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(resizeHUD)
resizeHUD()
local function update()
    local stage = player:GetAttribute("Stage") or 0
    purpose.Text = stage >= Config.StageCount and "Ziel erreicht! Sammle weiter Münzen für die Leuchtspur oder starte eine neue Runde." or ("Nächstes Ziel: Plattform " .. tostring(stage + 1) .. ". Checkpoints sichern deinen Weg; Münzen sind optional.")
    if Config.OnlyUp and stage<Config.StageCount then
        local chapter="Zum Gipfel"
        for _,entry in ipairs(Config.OnlyUp.Chapters or {}) do if stage<=entry.Finish then chapter=entry.Title break end end
        purpose.Text=chapter.." · Nächste Plattform: "..tostring(stage+1)..". Sauber landen und Checkpoints sichern."
    end
    progress.Text = "Abschnitt " .. tostring(player:GetAttribute("Stage") or 0) .. " / " .. tostring(Config.StageCount)
    coins.Text = tostring(player:GetAttribute("Coins") or 0) .. " Münzen"
    local seconds = player:GetAttribute("BoostSeconds") or 0
    boost.Text = seconds > 0 and ("2× Münzen aktiv · noch ca. " .. tostring(math.ceil(seconds / 60)) .. " Minuten Spielzeit") or "Münzboost startet nach Kauf. Zeit pausiert offline."
    if player:GetAttribute("TrailOwned") then trailButton.Text = "Leuchtspur bereits freigeschaltet" else trailButton.Text = "Leuchtspur · 250 Spielmünzen" end
    for _, b in ipairs(buyButtons) do b.BackgroundColor3 = player:GetAttribute("CanPurchase") and accent or Color3.fromRGB(133, 138, 158) end
    if journal and journal.Visible then renderStory() end
end
for _, a in ipairs({"Stage", "Coins", "BoostSeconds", "TrailOwned", "CanPurchase"}) do player:GetAttributeChangedSignal(a):Connect(update) end
notice.OnClientEvent:Connect(function(text, coinName)
    if text == "coin" then
        local w = workspace:FindFirstChild("MapForgeWorld")
        local c = w and w:FindFirstChild("coin") and w.coin:FindFirstChild(coinName)
        if c then c.LocalTransparencyModifier = 1 end
    else show(text) end
end)
update()
