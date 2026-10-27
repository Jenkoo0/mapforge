-- MapForge 3.13.0. Compact resource cards, next-goal tracker and responsive factory drawer.
local Players, RS = game:GetService("Players"), game:GetService("ReplicatedStorage")
local Market, Tween = game:GetService("MarketplaceService"), game:GetService("TweenService")
local player = Players.LocalPlayer
local Config = require(RS:WaitForChild("MapForgeConfig"))
local story = type(Config.Story) == "table" and type(Config.Story.Chapters) == "table" and Config.Story or nil
local remotes = RS:WaitForChild("MapForgeRemotes", 30)
if not remotes then warn("[MapForge] Server not ready. Check Output.") return end
local action, notice, update = remotes:WaitForChild("Action"), remotes:WaitForChild("Notice"), remotes:WaitForChild("Update")
local gui = Instance.new("ScreenGui") gui.Name = "MapForgeTycoonHUD" gui.ResetOnSpawn = false gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling gui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets gui.Parent = player:WaitForChild("PlayerGui")
local dark, light, accent = Color3.fromRGB(15, 23, 35), Color3.fromRGB(240, 246, 252), Color3.fromRGB(137, 245, 196)
local state, tab, confirmUntil = {}, "shop", 0
local open, navigation
local collectGoal = false
local hintsOff, hintCount, lastHint, seenHints = false, 0, -1000, {}
local hintKey, focusedOffer
local contractCancelUntil = 0
local navButtons = {}
local claimPrompts = setmetatable({}, {__mode = "k"})
local function refreshClaimPrompt(p)
    local enabled = state.Plot == 0 and p:GetAttribute("MapForgeAvailable") == true
    if p.Enabled ~= enabled then p.Enabled = enabled end
end
local function watchClaimPrompt(p)
    if not p:IsA("ProximityPrompt") or p.Name ~= "MapForgeClaimPrompt" or claimPrompts[p] then return end
    claimPrompts[p] = true
    p:GetAttributeChangedSignal("MapForgeAvailable"):Connect(function() refreshClaimPrompt(p) end)
    p:GetPropertyChangedSignal("Enabled"):Connect(function() refreshClaimPrompt(p) end)
    refreshClaimPrompt(p)
end
local function money(n)
    n = n or 0
    if n >= 1e9 then return string.format("%.1fB", n / 1e9) end
    if n >= 1e6 then return string.format("%.1fM", n / 1e6) end
    if n >= 1e3 then return string.format("%.1fK", n / 1e3) end
    return tostring(math.floor(n))
end
local function round(o) local c = Instance.new("UICorner") c.CornerRadius = UDim.new(0, 10) c.Parent = o end
local function box(parent, size, pos)
    local f = Instance.new("Frame") f.Size = size f.Position = pos f.BackgroundColor3 = dark f.BackgroundTransparency = 0.08 f.BorderSizePixel = 0 f.Parent = parent round(f) return f
end
local function label(parent, text, size, pos, font)
    local l = Instance.new("TextLabel") l.Size = size l.Position = pos l.Text = text l.TextColor3 = light l.TextSize = font or 14 l.Font = Enum.Font.GothamMedium l.TextXAlignment = Enum.TextXAlignment.Left l.BackgroundTransparency = 1 l.TextWrapped = true l.Parent = parent return l
end
local function button(parent, text, size, pos, fn)
    local b = Instance.new("TextButton") b.Size = size b.Position = pos b.Text = text b.TextColor3 = dark b.BackgroundColor3 = accent b.TextSize = 13 b.TextWrapped = true b.Font = Enum.Font.GothamBold b.BorderSizePixel = 0 b.Parent = parent round(b) b.Activated:Connect(fn) return b
end
local show
local muted, surface = Color3.fromRGB(155, 175, 196), Color3.fromRGB(25, 38, 54)
local gold, violet = Color3.fromRGB(255, 211, 117), Color3.fromRGB(193, 174, 255)
local function stroke(o, color)
    local line = Instance.new("UIStroke") line.Color = color or Color3.fromRGB(55, 75, 92) line.Thickness = 1 line.Transparency = .35 line.Parent = o
end
-- Default Roblox core-safe insets remain enabled. The HUD lives on the right,
-- away from the top-left chat, with no full-width opaque banner.
local hud = box(gui, UDim2.fromOffset(396, 198), UDim2.new(1, -16, 0, 12)) hud.Name = "MapForgeStatus" hud.AnchorPoint = Vector2.new(1, 0) hud.BackgroundTransparency = 1
local name = label(hud, string.upper(Config.Name), UDim2.new(1, 0, 0, 20), UDim2.new(), 12) name.TextColor3 = muted name.TextTruncate = Enum.TextTruncate.AtEnd name.TextWrapped = false
local function resource(title, x, tint)
    local card = box(hud, UDim2.new(1/3, -5, 0, 62), UDim2.new(x, x == 0 and 0 or 3, 0, 26)) card.BackgroundColor3 = surface stroke(card)
    local caption = label(card, title, UDim2.new(1, -20, 0, 17), UDim2.fromOffset(10, 7), 10) caption.TextColor3 = muted caption.TextWrapped = false
    local value = label(card, "0", UDim2.new(1, -20, 0, 28), UDim2.fromOffset(10, 26), 22) value.Font = Enum.Font.GothamBold value.TextColor3 = tint value.TextWrapped = false value.TextTruncate = Enum.TextTruncate.AtEnd
    return value
end
local wallet = resource("CASH", 0, accent) wallet.Name = "MapForgeCash"
local bankValue = resource("TRESOR", 1/3, gold) bankValue.Name = "MapForgeBank"
local gemsValue = resource("KRISTALLE", 2/3, violet) gemsValue.Name = "MapForgeGems"
local income = label(hud, "Produktion wird geladen …", UDim2.new(1, 0, 0, 22), UDim2.fromOffset(0, 94), 12) income.TextColor3 = light income.TextTruncate = Enum.TextTruncate.AtEnd income.TextWrapped = false
local tracker = box(hud, UDim2.new(1, 0, 0, 112), UDim2.fromOffset(0, 122)) tracker.Name = "MapForgeGoalCard" stroke(tracker)
local goalTitle = label(tracker, "DEIN NÄCHSTES ZIEL", UDim2.new(1, -134, 0, 20), UDim2.fromOffset(12, 9), 11) goalTitle.TextColor3 = accent goalTitle.Font = Enum.Font.GothamBold
local goal = label(tracker, "Fabrik wird geladen …", UDim2.new(1, -24, 0, 49), UDim2.fromOffset(12, 45), 14) goal.Name = "MapForgeGoalText" goal.TextYAlignment = Enum.TextYAlignment.Top
local goalAction = button(tracker, "Ziel zeigen", UDim2.fromOffset(106, 36), UDim2.new(1, -118, 0, 7), function()
    if not state.Plot or state.Plot <= 0 then show("Warte auf ein freies Grundstück.") return end
    if state.SavingPaused then show("Speicherpause: Bitte kurz warten.") return end
    if not state.Next then open("rebirth") return end
    action:FireServer(collectGoal and "Vault" or "Next")
end)
local progressTrack = box(tracker, UDim2.new(1, -24, 0, 5), UDim2.new(0, 12, 1, -14)) progressTrack.BackgroundColor3 = surface
local progressFill = box(progressTrack, UDim2.fromScale(0, 1), UDim2.new()) progressFill.Name = "MapForgeBuildProgress" progressFill.BackgroundColor3 = accent progressFill.BackgroundTransparency = 0
local toast = label(gui, "", UDim2.new(.85, 0, 0, 58), UDim2.new(.5, 0, .75, 0), 15) toast.AnchorPoint = Vector2.new(.5, .5) toast.TextXAlignment = Enum.TextXAlignment.Center toast.ZIndex = 30 toast.BackgroundColor3 = dark toast.BackgroundTransparency = 1 round(toast)
local toastId = 0
show = function(text) toastId = toastId + 1 local id = toastId toast.Text = text toast.BackgroundTransparency = .08 task.delay(4, function() if toastId == id then toast.Text = "" toast.BackgroundTransparency = 1 end end) end
local panel = box(gui, UDim2.new(.94, 0, .75, 0), UDim2.fromScale(.5, .5)) panel.AnchorPoint = Vector2.new(.5, .5) panel.Visible = false panel.ZIndex = 20 stroke(panel)
panel.Name = "MapForgeFactoryPanel"
local limit = Instance.new("UISizeConstraint") limit.MaxSize = Vector2.new(540, 550) limit.Parent = panel
local heading = label(panel, "DEINE FABRIK", UDim2.new(1, -80, 0, 36), UDim2.fromOffset(16, 9), 18)
button(panel, "×", UDim2.fromOffset(36, 35), UDim2.new(1, -48, 0, 9), function() panel.Visible = false end)
local scroll = Instance.new("ScrollingFrame") scroll.Size = UDim2.new(1, -24, 1, -60) scroll.Position = UDim2.fromOffset(12, 52) scroll.BackgroundTransparency = 1 scroll.BorderSizePixel = 0 scroll.ScrollBarThickness = 4 scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y scroll.CanvasSize = UDim2.new() scroll.Parent = panel
local list = Instance.new("UIListLayout") list.Padding = UDim.new(0, 10) list.Parent = scroll
list.SortOrder = Enum.SortOrder.LayoutOrder
local rows, renderedTab, rowIndex = {}, nil, 0
local function clear()
    rowIndex = 0
    if renderedTab ~= tab then
        for _, item in ipairs(rows) do item.object:Destroy() end
        rows = {} renderedTab = tab scroll.CanvasPosition = Vector2.new(0, 0)
    end
end
local function slot(kind)
    rowIndex = rowIndex + 1
    local item = rows[rowIndex]
    if item and item.kind ~= kind then item.object:Destroy() item = nil end
    if not item then item = {kind=kind} rows[rowIndex] = item end
    return item
end
local function paragraph(text, height)
    local item = slot("label")
    if not item.object then item.object = label(scroll, text, UDim2.new(), UDim2.new(), 14) end
    item.object.Text = text item.object.Size = UDim2.new(1, -5, 0, height or 54) item.object.LayoutOrder = rowIndex
    return item.object
end
local function row(text, fn, tint)
    local item = slot("button") item.fn = fn
    if not item.object then item.object = button(scroll, text, UDim2.new(), UDim2.new(), function() if item.fn then item.fn() end end) end
    local b = item.object b.Text = text b.Size = UDim2.new(1, -5, 0, 57) b.LayoutOrder = rowIndex b.TextSize = 14 b.BackgroundColor3 = tint or surface b.TextColor3 = light return b
end
local offers = {
    {"TCashSmall", "25.000 Cash", false}, {"TCashLarge", "1.000.000 Cash", false}, {"TGems100", "100 Kristalle", false}, {"TGems500", "500 Kristalle", false},
    {"TBoost15", "2× Produktion · 15 Minuten Spielzeit", false}, {"TBundle", "250.000 Cash + 250 Kristalle", false},
    {"VIP", "VIP · Titel, Gold-Akzente und +25 %", true}, {"AutoCollect", "Auto-Collect · dauerhaft", true}, {"DoubleIncome", "2× Produktion · dauerhaft", true}
}
local cashAmounts = {TCashSmall=25000, TCashLarge=1000000, TBundle=250000}
-- Per-client prices preserve regional pricing. One request per typed ID,
-- including while the HUD synchronizes; failures retry after a short cooldown.
local priceCache, renderGeneration, calibrationTracking = {}, 0, false
local function requestPrice(id, pass, target, callback)
    local key = (pass and "pass:" or "product:")..tostring(id)
    local entry = priceCache[key]
    if entry and not entry.loading and os.clock()<entry.expires then callback(entry) return end
    if entry and entry.loading then entry.waiters[target]=callback return end
    entry={loading=true,expires=0,waiters={[target]=callback}} priceCache[key]=entry
    task.spawn(function()
        local ok, info=pcall(function() return Market:GetProductInfoAsync(id,pass and Enum.InfoType.GamePass or Enum.InfoType.Product) end)
        entry.info=ok and info or nil entry.loading=false
        entry.valid=type(entry.info)=="table" and entry.info.IsForSale==true and type(entry.info.PriceInRobux)=="number" and entry.info.PriceInRobux>=0
        entry.expires=os.clock()+(entry.valid and 120 or 15)
        local waiting=entry.waiters entry.waiters={}
        for _,fn in pairs(waiting) do fn(entry) end
    end)
end
local offerDetails = {
    AutoCollect="Sammelt deinen Tresor automatisch. Manuelles Abholen bleibt kostenlos.",
    DoubleIncome="Dauerhaft 2x Produktion. Alle Ausbauten sind auch kostenlos erreichbar.",
    VIP="Gold-Akzente, VIP-Titel und +25 % Produktion.",
    TBoost15="2x Produktion für 15 Minuten Spielzeit. Restzeit wird gespeichert.",
    TGems100="100 Kristalle für Designs. Aufträge und Bau-Meilensteine geben kostenlose Kristalle.",
    TGems500="500 Kristalle für Designs. Alle Designs sind auch erspielbar.",
    TCashSmall="Fester Betrag: 25.000 Cash. Cash wird beim Rebirth zurückgesetzt.",
    TCashLarge="Fester Betrag: 1.000.000 Cash. Cash wird beim Rebirth zurückgesetzt.",
    TBundle="250.000 Cash + 250 Kristalle. Cash wird beim Rebirth zurückgesetzt."
}
local hint = box(gui, UDim2.new(.67, 0, 0, 116), UDim2.new(.5, 0, 1, -158)) hint.AnchorPoint = Vector2.new(.5, 1) hint.Visible = false
local hintCap = Instance.new("UISizeConstraint") hintCap.MaxSize = Vector2.new(430, 116) hintCap.Parent = hint
local hintText = label(hint, "", UDim2.new(1, -46, 0, 66), UDim2.fromOffset(10, 2), 11)
button(hint, "×", UDim2.fromOffset(28, 28), UDim2.new(1, -34, 0, 5), function() hint.Visible = false end)
button(hint, "Ansehen", UDim2.new(.45, -12, 0, 32), UDim2.new(0, 10, 1, -39), function() hint.Visible = false open("shop", hintKey) end)
button(hint, "Tipps aus", UDim2.new(.55, -16, 0, 32), UDim2.new(.45, 2, 1, -39), function() hintsOff = true hint.Visible = false show("Angebotshinweise für diese Sitzung ausgeschaltet.") end)

local function render()
    renderGeneration=renderGeneration+1
    local generation=renderGeneration
    clear()
    if tab == "story" and story then
        heading.Text = "DEINE GESCHICHTE"
        local count = math.max(0, state.Count or 0)
        local function storyText(text, name, font)
            local p = paragraph(text, 24) p.Name = name p.AutomaticSize = Enum.AutomaticSize.Y
            p.TextYAlignment = Enum.TextYAlignment.Top p.TextSize = font or 14
            return p
        end
        storyText(story.Title, "MapForgeStoryTitle", 18).TextColor3 = accent
        storyText(story.Premise, "MapForgeStoryPremise")
        storyText("Dein Ziel: " .. story.Goal, "MapForgeStoryGoal")
        storyText("Kapitel folgen deinem aktuellen Ausbau. Beim Rebirth beginnt die Geschichte mit deiner Fabrik von vorn.", "MapForgeStoryScope", 12).TextColor3 = muted
        for i, chapter in ipairs(story.Chapters) do
            local reached = count >= chapter.Target
            local text = reached and ("Kapitel " .. tostring(i) .. " · " .. chapter.Title .. "\n" .. chapter.Text)
                or ("Kapitel " .. tostring(i) .. " · Noch verborgen\n" .. tostring(math.min(count, chapter.Target)) .. "/" .. tostring(chapter.Target) .. " Ausbauten · Baue weiter, um dieses Kapitel zu lesen.")
            storyText(text, "MapForgeStoryChapter_" .. tostring(i)).TextColor3 = reached and light or muted
        end
    elseif tab == "help" then
        heading.Text = "DEIN WEG " .. string.upper(Config.FactoryWay or "zur Fabrik")
        paragraph("Dein Ziel: Baue eine Fabrik mit 48 Ausbauten. Maschinen produzieren Cash; damit kaufst du mehr Produktion. Dafür brauchst du keine Robux.", 78)
        paragraph("1. Gratis-Starter bauen. 2. Cash am Tresor abholen. 3. Nächsten Ausbau kaufen. Wiederholen: Deine Fabrik wird größer und schneller.", 78)
        paragraph("Dein Stand: " .. tostring(state.Count or 0) .. "/48 Ausbauten. Ab 3 Ausbauten: wählbare Aufträge. Bei 12/24/36/48: einmalig kostenlose Kristalle für Designs.", 78)
        paragraph("Langfristig: Forschung verbessert deine Produktion dauerhaft. Nach 48 Ausbauten ist Rebirth optional: Fabrik und Cash neu starten, Bonus verdienen. Forschung, Designs und Kristalle bleiben.", 95)
        paragraph("Bedienung: WASD/Stick zum Laufen, Leertaste/Sprungtaste zum Springen. Am leuchtenden Ziel die angezeigte Interaktion halten oder auf dem Handy antippen.", 85)
        row("Zeige mir meinen nächsten Ausbau", function() panel.Visible = false action:FireServer("Next") end)
        row("Zum Tresor gehen", function() panel.Visible = false action:FireServer("Vault") end)
        row("Kostenlose Aufträge ansehen", function() open("quests") end)
    elseif tab == "shop" then
        heading.Text = "EXTRAS FÜR DEIN EMPIRE"
        paragraph("Optionale Extras. Preise kommen direkt von Roblox. Kristalle gibt es auch durch Aufträge, Bau-Meilensteine und Rebirth. Cash verfällt beim Rebirth.", 80)
        local contextKey = focusedOffer or (state.Offers and state.Offers[1])
        if contextKey then paragraph("Optionales Extra im Detail: " .. (offerDetails[contextKey] or ""), 70) end
        for _, offer in ipairs(offers) do
            local key, title, pass = offer[1], offer[2], offer[3]
            local id = (pass and Config.Passes[key] or Config.Products[key]) or 0
            local ready = false local b
            local checkedPrice
            local equivalent = cashAmounts[key] and (state.Income or 0) > 0 and cashAmounts[key] / state.Income
            local detail = offerDetails[key] or ""
            if equivalent then detail = detail .. " Ca. " .. (equivalent < 1 and "<1" or money(equivalent)) .. " Sek. aktueller Produktion." end
            b = row(title .. " · " .. (id > 0 and "Preis wird geladen" or "nicht eingerichtet"), function()
                if not state.CanPurchase or not ready or not checkedPrice or os.clock()>=checkedPrice.expires then show("Preis oder Shop noch nicht bereit. Kurz warten und erneut öffnen.") return end
                if not pass and not (state.ProductReady and state.ProductReady[key]) then show("Produktzuordnung wird geprüft. Versuche es später erneut.") return end
                if pass and state.Flags and state.Flags[key] then show("Diesen Pass besitzt du bereits.") return end
                local ok = pcall(function() if pass then Market:PromptGamePassPurchase(player, id) else Market:PromptProductPurchase(player, id) end end)
                if not ok then show("Kauffenster gerade nicht verfügbar.") end
            end)
            b.Size = UDim2.new(1, -5, 0, 98)
            local baseTitle = title
            if id > 0 then requestPrice(id,pass,b,function(entry)
                if b.Parent and tab=="shop" and generation==renderGeneration then
                    checkedPrice=entry
                    if entry.valid then
                        ready = true b.Text = baseTitle .. " · " .. tostring(entry.info.PriceInRobux) .. " Robux\n" .. detail
                        if not pass and not (state.ProductReady and state.ProductReady[key]) then ready=false b.Text=baseTitle.." · Produktzuordnung nicht bestätigt\n"..detail end
                        if pass and state.Flags and state.Flags[key] then b.Text = baseTitle .. " · bereits vorhanden\n" .. detail end
                    else b.Text = baseTitle .. " · Preis nicht verfügbar\n" .. detail end
                end
            end) end
        end
    elseif tab == "skins" then
        heading.Text = "DEIN FABRIK-DESIGN"
        paragraph("Wähle dein Design gezielt aus. Alle Preise hier sind Kristalle. Kostenlos: Bau-Meilensteine, Tagesaufträge und Rebirth.", 74)
        for _, skin in ipairs(Config.Skins) do
            local id, title, cost = skin.Id, skin.Name, skin.Cost
            local owned = state.Skins and state.Skins[id]
            row(title .. (state.Skin == id and " · ausgewählt" or owned and " · auswählen" or (" · " .. tostring(cost) .. " Kristalle")), function()
                if not owned and (state.Gems or 0) < cost then show("Es fehlen " .. tostring(cost - (state.Gems or 0)) .. " Kristalle. Aufträge und Meilensteine helfen kostenlos.") return end
                action:FireServer("Skin", id)
            end)
        end
        row("Kostenlose Kristalle: Aufträge & Meilensteine", function() open("quests") end)
        if Config.ShopEnabled then row("Optionale Kristall-Pakete ansehen", function() open("shop") end) end
    elseif tab == "research" then
        heading.Text = "FORSCHUNG MIT CASH"
        paragraph("28 dauerhafte Forschungsstufen. Du bezahlst mit erspieltem Cash. Forschung bleibt beim Rebirth erhalten.", 70)
        for _, track in ipairs(Config.Research) do
            local id = track.Id
            local level = state.Research and state.Research[id] or 0
            local cost = math.floor(track.Base * track.Growth ^ level)
            local text = track.Name .. " · " .. tostring(level) .. "/" .. tostring(track.Max) .. "\n" .. track.Detail
            row(text .. (level >= track.Max and " · MAX" or " · " .. money(cost) .. " Cash"), function() action:FireServer("Research", id) end)
        end
    elseif tab == "quests" then
        heading.Text = "DEIN AUFTRAGSBRETT"
        local calibration=state.Calibration
        if calibration then
            paragraph("GRATIS-KALIBRIERUNG · Drei Stationen in deiner Fabrik der Reihe nach besuchen. +15 % Produktion für 120 Sekunden Spielzeit; neue Runde nach 180 Sekunden. Kein Robux-Kauf nötig.",105)
            if not calibration.Available then paragraph("Ab drei Ausbauten wird die Kalibrierungsrunde frei.",42)
            elseif calibration.Cooldown>0 then paragraph("Nächste Runde in "..tostring(math.ceil(calibration.Cooldown)).." Sek. · Bonus noch "..tostring(math.ceil(calibration.Bonus)).." Sek.",48)
            else row("Station "..tostring(calibration.Next).."/3 markieren",function() calibrationTracking=true panel.Visible=false action:FireServer("Get") end) end
        end
        local contracts = state.Contracts or {Limit=3, Completed=0, Choices={}}
        local active = contracts.Active
        paragraph("Wähle dein eigenes Ziel. Ein Auftrag gleichzeitig, bis zu " .. tostring(contracts.Limit) .. " Belohnungen pro UTC-Tag. " .. tostring(contracts.Completed) .. " bereits erhalten. Aktive Aufträge laufen nicht ab.", 88)
        if active then
            local title = active.Id
            for _, c in ipairs(contracts.Choices) do if c.Id == active.Id then title = c.Name end end
            local unit = active.Id == "collect" and " Cash" or active.Id == "build" and " Ausbauten" or " Forschungsstufe"
            paragraph(title .. " · " .. money(active.Progress) .. "/" .. money(active.Target) .. unit .. "\nBelohnung: " .. tostring(active.Reward) .. " Kristalle", 62)
            if active.Progress >= active.Target then row("Fertig! Kostenlose Kristalle abholen", function() action:FireServer("ContractClaim") end)
            else
                row(active.Id == "research" and "Zur Forschung" or active.Id == "collect" and "Zum Tresor" or "Zum nächsten Ausbau", function()
                    if active.Id == "research" then open("research") else panel.Visible = false action:FireServer(active.Id == "collect" and "Vault" or "Next") end
                end)
                local changing = os.clock() < contractCancelUntil
                row(changing and "Erneut tippen: Auftragsfortschritt verwerfen" or "Anderen Auftrag wählen (ohne Kosten)", function()
                    if os.clock() > contractCancelUntil then contractCancelUntil = os.clock() + 5 render() return end
                    contractCancelUntil = 0 action:FireServer("ContractCancel")
                end)
            end
        elseif contracts.Completed >= contracts.Limit then paragraph("Heute sind alle " .. tostring(contracts.Limit) .. " Zusatzbelohnungen abgeholt. Du kannst normal weiterbauen; ab 00:00 UTC sind neue Aufträge verfügbar.", 78)
        elseif (state.Count or 0) < 3 then paragraph("Baue zuerst drei Ausbauten. Danach entscheidest du, ob du bauen, forschen oder liefern möchtest.", 66)
        else
            for _, choice in ipairs(contracts.Choices) do
                local id = choice.Id
                local unit = id == "collect" and " Cash abholen" or id == "build" and " Ausbauten bauen" or " Forschungsstufe"
                local b = row(choice.Name .. " · " .. money(choice.Target) .. unit .. "\n+" .. tostring(choice.Reward) .. " Kristalle" .. (choice.Available and " · Annehmen" or " · ausgeschöpft"), function()
                    if not choice.Available then show("Dieses Ziel ist für deine Fabrik schon ausgeschöpft. Wähle einen anderen Auftrag.") return end
                    action:FireServer("ContractStart", id)
                end) b.Size = UDim2.new(1, -5, 0, 72)
            end
        end
        paragraph("TAGESAUFTRÄGE & BAU-MEILENSTEINE", 32)
        paragraph("Neue Aufgaben um 00:00 UTC. Gesammelte Belohnungen bleiben erhalten.")
        for _, milestone in ipairs(state.Milestones or {}) do
            paragraph(tostring(milestone.Count) .. " Ausbauten: +" .. tostring(milestone.Reward) .. " Kristalle · " .. ((state.MilestoneClaims or {})[milestone.Id] and "bereits erhalten" or "einmalig beim Bauen"), 38)
        end
        local d = state.Daily or {} local claims = d.Claims or {}
        for _, q in ipairs(Config.Quests) do
            local id = q.Id
            row(q.Name .. " · " .. money(math.min(d[q.Field] or 0, q.Target)) .. "/" .. money(q.Target) .. " · " .. tostring(q.Reward) .. " Kristalle" .. (claims[id] and " · erledigt" or ""), function() action:FireServer("Quest", id) end)
        end
    elseif tab == "rebirth" then
        heading.Text = "DEIN NÄCHSTES EMPIRE"
        paragraph("Baue alle " .. tostring(Config.UpgradeCount) .. " Ausbaustufen. Rebirth gibt +20 % Basisproduktion und " .. tostring(25 + ((state.Research or {}).mastery or 0) * 5) .. " Kristalle. Cash, Tresor und Ausbauten werden zurückgesetzt, auch gekauftes Cash. Forschung, Kristalle, Skins, Pässe und Boost bleiben.", 152)
        local b
        b = row("Rebirth · " .. tostring(state.Count or 0) .. "/" .. tostring(Config.UpgradeCount) .. " gebaut", function()
            if (state.Count or 0) < Config.UpgradeCount then show("Baue zuerst alle " .. tostring(Config.UpgradeCount) .. " Ausbaustufen.") return end
            if os.clock() > confirmUntil then confirmUntil = os.clock() + 5 b.Text = "Nochmal tippen: Cash und Fabrik zurücksetzen" return end
            confirmUntil = 0 action:FireServer("Rebirth") panel.Visible = false
        end)
    else
        heading.Text = "DEIN NÄCHSTER AUSBAU"
        local nextUpgrade = state.Next
        if nextUpgrade then
            paragraph(nextUpgrade.Name .. "\n" .. money(nextUpgrade.Cost) .. " Cash · +" .. money(nextUpgrade.Income) .. " Produktion/Sek.", 70)
            if (state.Cash or 0) < nextUpgrade.Cost and (state.Bank or 0) > 0 then paragraph("Im Tresor liegen " .. money(state.Bank) .. " Cash. Hole sie kostenlos ab.", 44) end
            if state.Milestone then paragraph("Nächster Gratis-Meilenstein: " .. tostring(state.Milestone.Count) .. " Ausbauten → +" .. tostring(state.Milestone.Reward) .. " Kristalle.", 52) end
            row("Zum Kauf-Feld gehen", function() panel.Visible = false action:FireServer("Next") end)
            row("Ausbau kaufen (in der Nähe)", function() action:FireServer("Buy", nextUpgrade.Id) end)
        else paragraph("Alle Ausbauten fertig! Ein Rebirth startet dein nächstes Empire.", 80) end
        row("Zum Tresor", function() panel.Visible = false action:FireServer("Vault") end)
        row("Tresor abholen (in der Nähe)", function() action:FireServer("Collect") end)
        if state.StudioTools then
            paragraph("STUDIO-TESTHELFER · Nur im getrennten Studio-Testprofil. Damit kannst du Kamera, Laufwege und den vollständigen Ausbau schneller prüfen.", 78)
            row("Test-Cash geben", function() action:FireServer("TestCash") end)
            row("Alle Ausbauten zum Testen freischalten", function() action:FireServer("TestBuild") end)
            row("Test-Fabrik zurücksetzen", function() action:FireServer("TestClear") end)
        end
    end
    for i = #rows, rowIndex + 1, -1 do rows[i].object:Destroy() rows[i] = nil end
end
open = function(which, focus)
    if navigation then navigation.Visible=false end
    tab = which panel.Visible = true hint.Visible = false
    focusedOffer = focus
    if which == "skins" then action:FireServer("DesignInterest") end
    render()
end
navigation=box(gui,UDim2.fromOffset(296,410),UDim2.new(1,-16,0,294)) navigation.Name="MapForgeNavigation" navigation.AnchorPoint=Vector2.new(1,0) navigation.Visible=false navigation.ZIndex=15 stroke(navigation)
button(navigation,"×",UDim2.fromOffset(28,28),UDim2.new(1,-36,0,4),function() navigation.Visible=false end)
local navCaption=label(navigation,"DEINE FABRIK",UDim2.new(1,-60,0,26),UDim2.fromOffset(12,7),11) navCaption.TextColor3=muted
local navScroll=Instance.new("ScrollingFrame") navScroll.Size=UDim2.new(1,-16,1,-44) navScroll.Position=UDim2.fromOffset(8,36) navScroll.BackgroundTransparency=1 navScroll.BorderSizePixel=0 navScroll.ScrollBarThickness=3 navScroll.AutomaticCanvasSize=Enum.AutomaticSize.Y navScroll.CanvasSize=UDim2.new() navScroll.ScrollingDirection=Enum.ScrollingDirection.Y navScroll.Parent=navigation
local navList=Instance.new("UIListLayout") navList.Padding=UDim.new(0,7) navList.SortOrder=Enum.SortOrder.LayoutOrder navList.Parent=navScroll
local menu=button(gui,"Fabrikmenü",UDim2.fromOffset(154,40),UDim2.new(1,-170,0,252),function() navigation.Visible=not navigation.Visible panel.Visible=false hint.Visible=false end) menu.Name="MapForgeMenuToggle" menu.BackgroundColor3=surface menu.TextColor3=light stroke(menu)
local destinations = {
    {"Ausbau", "build", "+", "Maschinen & Produktion", accent},
    {"Aufträge", "quests", "!", "Kostenlose Belohnungen", gold},
    {"Forschung", "research", "F", "Dauerhafte Verbesserungen", Color3.fromRGB(131,204,255)},
    {"Designs", "skins", "D", "Deine Fabrik gestalten", violet},
    {"Rebirth", "rebirth", "R", "Ein neues Empire starten", gold},
    {"Shop", "shop", "$", "Optionale Robux-Extras", violet},
    {"Spielziel / Hilfe", "help", "?", "So funktioniert dein Spiel", muted}
}
if story then table.insert(destinations, 7, {"Geschichte", "story", "G", "Deine freigeschalteten Kapitel", accent}) end
for i, entry in ipairs(destinations) do
    local target = entry[2] local b=button(navScroll,entry[1],UDim2.new(1,-5,0,58),UDim2.new(),function() open(target) end)
    b.Name="MapForgeNav_"..target b.LayoutOrder=i b.BackgroundColor3=surface b.TextColor3=light b.TextSize=14 b.TextXAlignment=Enum.TextXAlignment.Left b.TextYAlignment=Enum.TextYAlignment.Top navButtons[target]=b
    local pad=Instance.new("UIPadding") pad.PaddingLeft=UDim.new(0,48) pad.PaddingTop=UDim.new(0,9) pad.Parent=b
    -- Separate title/description from the icon so hierarchy remains legible.
    local icon=label(b,entry[3],UDim2.fromOffset(28,28),UDim2.fromOffset(-38,4),19) icon.TextColor3=entry[5] icon.TextXAlignment=Enum.TextXAlignment.Center icon.Font=Enum.Font.GothamBold
    local subtitle=label(b,entry[4],UDim2.new(1,-8,0,18),UDim2.fromOffset(0,22),11) subtitle.TextColor3=muted subtitle.TextWrapped=false
    if target=="shop" then b.Visible=Config.ShopEnabled end
end
local function resizeHUD()
    local size=gui.AbsoluteSize or Vector2.new(816,640)
    local width,height=math.max(240,size.X),math.max(240,size.Y)
    local narrow=width<620
    local short=height<480
    local hudWidth=math.min(narrow and 340 or 396,width-24)
    hud.Size=UDim2.fromOffset(hudWidth,234) hud.Position=UDim2.new(1,-12,0,narrow and not short and 56 or 12)
    name.TextSize=narrow and 10 or 12
    tracker.Size=UDim2.new(1,0,0,short and 102 or narrow and 122 or 112)
    goal.Size=UDim2.new(1,-24,0,short and 40 or narrow and 58 or 49)
    local top=(narrow and not short and 56 or 12)+122+(short and 102 or narrow and 122 or 112)+10
    menu.Position=UDim2.new(1,-166,0,top)
    local drawerHeight=short and height-24 or math.max(80,math.min(480,height-top-64))
    navigation.Size=UDim2.fromOffset(math.min(296,width-24),drawerHeight)
    navigation.Position=UDim2.new(1,-12,0,short and 12 or math.min(top+46,height-drawerHeight-12))
    panel.Size=UDim2.fromOffset(math.min(540,width-24),math.min(550,height-24))
end
gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(resizeHUD)
resizeHUD()
notice.OnClientEvent:Connect(function(text) if text == "open-quests" then open("quests") elseif text == "open-rebirth" then open("rebirth") elseif text == "open-shop" then open("shop") elseif text == "open-research" then open("research") else show(text) end end)
local lastGoalKey, goalSince, helpShown = nil, os.clock(), false
local marker = Instance.new("BillboardGui") marker.Name = "MapForgeNextGoal" marker.Size = UDim2.fromOffset(160, 38) marker.StudsOffset = Vector3.new(0, 6, 0) marker.AlwaysOnTop = true marker.MaxDistance = 85 marker.Parent = gui
local markerText = label(marker, "", UDim2.fromScale(1, 1), UDim2.new(), 13) markerText.TextXAlignment = Enum.TextXAlignment.Center markerText.BackgroundColor3 = dark markerText.BackgroundTransparency = .15 markerText.TextColor3 = accent round(markerText)
local highlight = Instance.new("Highlight") highlight.Name = "MapForgeGoalHighlight" highlight.FillTransparency = .8 highlight.OutlineColor = accent highlight.DepthMode = Enum.HighlightDepthMode.Occluded highlight.Parent = gui
update.OnClientEvent:Connect(function(s)
    state = s
    for p in pairs(claimPrompts) do if p.Parent then refreshClaimPrompt(p) end end
    local activeContract = s.Contracts and s.Contracts.Active
    local contractReady = activeContract and activeContract.Progress >= activeContract.Target
    navButtons.quests.Text = contractReady and "Auftrag abholen!" or activeContract and ("Aufträge · " .. tostring(math.floor(activeContract.Progress / activeContract.Target * 100)) .. "%") or "Aufträge"
    navButtons.quests.TextColor3 = contractReady and gold or light
    wallet.Text = "$ " .. money(s.Cash)
    bankValue.Text = "$ " .. money(s.Bank)
    gemsValue.Text = money(s.Gems)
    progressFill.Size = UDim2.fromScale(math.min(1,math.max(0,(s.Count or 0)/math.max(1,Config.UpgradeCount))),1)
    income.Text = money(s.Income) .. "/Sek.  ·  " .. tostring(s.Count) .. "/" .. tostring(Config.UpgradeCount) .. " Ausbauten  ·  " .. tostring(s.Rebirths) .. " Rebirths" .. (s.Flags.VIP and " · VIP" or "")
    collectGoal = s.Next and s.Count > 0 and ((not s.FirstCollect and s.Bank >= 3) or (s.Cash < s.Next.Cost and s.Bank > 0))
    local goalKey = tostring(s.Plot) .. ":" .. tostring(s.Count) .. ":" .. tostring(s.FirstCollect) .. ":" .. tostring(collectGoal)
    if goalKey ~= lastGoalKey then lastGoalKey = goalKey goalSince = os.clock() helpShown = false end
    if not helpShown and not s.SavingPaused and s.Plot > 0 and os.clock() - goalSince >= 35 then
        helpShown = true
        show("Noch unsicher? Öffne Fabrikmenü → Spielziel / Hilfe. Dort kannst du dich direkt zum Ausbau oder Tresor führen lassen.")
    end
    if s.Plot == 0 then goal.Text = "Alle Grundstücke belegt. Warte auf einen freien Platz oder wechsle den Server."
    elseif s.SavingPaused then goal.Text = "Speicherpause: ausstehende Transaktion wird geklärt."
    elseif s.Count == 0 then goal.Text = "Gratis-Starter bauen. Er produziert dein erstes Cash!"
    elseif collectGoal then goal.Text = "$ " .. money(s.Bank) .. " am Tresor abholen und weiterbauen."
    elseif s.Next then
        local missing = math.max(0, s.Next.Cost - s.Cash - s.Bank)
        local waitTime = s.Income > 0 and math.ceil(missing / s.Income) or 0
        goal.Text = s.Cash >= s.Next.Cost and (s.Next.Name .. " · $ " .. money(s.Next.Cost) .. " · bereit zum Bauen") or (s.Next.Name .. " · noch $ " .. money(missing) .. (waitTime > 0 and (" · ca. " .. tostring(waitTime) .. " Sek.") or ""))
        -- Active side goals remain in Aufträge instead of expanding the HUD text.
    else goal.Text = "Fabrik fertig! Designs, Forschung oder das nächste Empire mit Rebirth." end
    goalTitle.Text = s.SavingPaused and "SPEICHERPAUSE" or s.Plot == 0 and "GRUNDSTÜCK GESUCHT" or s.Count == 0 and "1/3 STARTEN" or collectGoal and "2/3 ABHOLEN" or s.Next and "3/3 BAUEN" or "FABRIK VOLLSTÄNDIG"
    goalAction.Text = collectGoal and "Zum Tresor" or s.Next and "Ziel zeigen" or "Rebirth ansehen"
    goalAction.Visible = s.Plot > 0 and not s.SavingPaused
    local targetName
    if s.Plot > 0 then targetName="P" .. tostring(s.Plot) .. "_" .. (collectGoal and "Collector" or s.Next and ("Button_" .. s.Next.Id) or "Rebirth") end
    if targetName and calibrationTracking and s.Calibration and s.Calibration.Available and s.Calibration.Cooldown<=0 then targetName="P"..tostring(s.Plot).."_Calibration_"..tostring(s.Calibration.Next)
    else calibrationTracking=false end
    local world = workspace:FindFirstChild("MapForgeWorld")
    -- Adornee accepts an Instance or nil. Lua's chained `and` can return false
    -- while no plot is assigned; streamed-out or missing targets also clear it.
    local target
    if world and targetName then
        local candidate=world:FindFirstChild(targetName, true)
        if candidate and candidate:IsA("BasePart") then target=candidate end
    end
    marker.Adornee = target marker.Enabled = target ~= nil and not s.SavingPaused
    highlight.Adornee = target highlight.Enabled = marker.Enabled
    markerText.Text = collectGoal and "↓ CASH ABHOLEN" or s.Count == 0 and "↓ GRATIS STARTER" or s.Next and "↓ NÄCHSTER AUSBAU" or "↓ REBIRTH"
    if calibrationTracking then markerText.Text="↓ STATION "..tostring(s.Calibration.Next).."/3" end
    if not s.CanPurchase or s.SavingPaused then hint.Visible = false end
    if s.CanPurchase and not s.SavingPaused and Config.ShopHints and not hintsOff and hintCount < 2 and not panel.Visible and not navigation.Visible and os.clock() - lastHint >= 600 then
        for _, key in ipairs(s.Offers or {}) do
            if not seenHints[key] then
                seenHints[key] = true hintCount = hintCount + 1 lastHint = os.clock()
                hintKey = key
                hintText.Text = "Optionales Extra: " .. (offerDetails[key] or key) hint.Visible = true
                local generation = hintCount
                task.delay(15, function() if hintCount == generation then hint.Visible = false end end)
                break
            end
        end
    end
    if panel.Visible and tab ~= "rebirth" then render() end
end)
task.delay(2, function() action:FireServer("Get") end)
-- Cosmetic ore is local, capped and unrelated to economic rewards.
local outputs = setmetatable({}, {__mode = "k"})
local world = workspace:WaitForChild("MapForgeWorld")
local function consider(p)
    if not p:IsA("BasePart") or not string.find(p.Name, "_Output_", 1, true) then return end
    local role = p:WaitForChild("MFRole", 3)
    if role and role.Value == "Output" and p.Parent then outputs[p] = true end
end
for _, p in ipairs(world:GetDescendants()) do watchClaimPrompt(p) task.spawn(consider, p) end
world.DescendantAdded:Connect(function(p) watchClaimPrompt(p) task.spawn(consider, p) end)
world.DescendantRemoving:Connect(function(p) outputs[p] = nil end)
task.spawn(function()
    while task.wait(2) do
        local active = {}
        for output in pairs(outputs) do
            if output.Parent and state.Plot and output:FindFirstChild("MFPlot") and output.MFPlot.Value == state.Plot and output.Transparency < .5 then table.insert(active, output) end
        end
        for i = #active, 2, -1 do local j = math.random(i) active[i], active[j] = active[j], active[i] end
        for i = 1, math.min(8, #active) do
            local output = active[i]
            local ore = Instance.new("Part") ore.Shape = Enum.PartType.Ball ore.Size = Vector3.new(.6, .6, .6) ore.Anchored = true ore.CanCollide = false ore.CanTouch = false ore.CanQuery = false ore.Material = Enum.Material.Neon ore.Color = output.Color ore.Position = output.Position + Vector3.new(0, 1, 1) ore.Parent = workspace.CurrentCamera
            local tween = Tween:Create(ore, TweenInfo.new(1.4, Enum.EasingStyle.Linear), {Position = ore.Position + Vector3.new(0, -.8, 5), Transparency = 1})
            tween.Completed:Connect(function() ore:Destroy() end) tween:Play()
        end
    end
end)
