-- MapForge: opt-in cosmetic pass shop. Prices from this client; ownership from server.
local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local Market=game:GetService("MarketplaceService")
local Gui=game:GetService("GuiService")
local Input=game:GetService("UserInputService")
local Config=require(RS:WaitForChild("MapForgeConfig"))
if not Config.Cosmetics or not Config.Cosmetics.Enabled then return end
local remote=RS:WaitForChild("MapForgeCosmetics",20) if not remote then warn("[MapForge] Cosmetics server unavailable") return end
local player=Players.LocalPlayer local pg=player:WaitForChild("PlayerGui")
local gui=Instance.new("ScreenGui") gui.Name="MapForgeCosmeticsHUD" gui.ResetOnSpawn=false gui.DisplayOrder=55 gui.ZIndexBehavior=Enum.ZIndexBehavior.Sibling gui.ScreenInsets=Enum.ScreenInsets.CoreUISafeInsets gui.Parent=pg
local dark=Color3.fromRGB(20,28,42) local light=Color3.fromRGB(241,246,252) local accent=Color3.fromRGB(172,226,220)
local function round(o) local c=Instance.new("UICorner") c.CornerRadius=UDim.new(0,12) c.Parent=o end
local function label(parent,text,y,h,size)
    local o=Instance.new("TextLabel") o.Text=text o.Position=UDim2.fromOffset(16,y) o.Size=UDim2.new(1,-32,0,h) o.TextSize=size or 13 o.TextWrapped=true o.TextColor3=light o.Font=Enum.Font.GothamMedium o.BackgroundTransparency=1 o.TextXAlignment=Enum.TextXAlignment.Left o.Parent=parent return o
end
local function button(parent,name,text,y,h,fn)
    local b=Instance.new("TextButton") b.Name=name b.Text=text b.Position=UDim2.fromOffset(16,y) b.Size=UDim2.new(1,-32,0,h) b.TextSize=13 b.TextWrapped=true b.Font=Enum.Font.GothamBold b.TextColor3=dark b.BackgroundColor3=accent b.BorderSizePixel=0 b.Selectable=true b.Parent=parent round(b) b.Activated:Connect(fn) return b
end
local panel=Instance.new("Frame") panel.Name="CosmeticsPanel" panel.AnchorPoint=Vector2.new(.5,.5) panel.Position=UDim2.fromScale(.5,.5) panel.BackgroundColor3=dark panel.BorderSizePixel=0 panel.Visible=false panel.ZIndex=2 panel.Parent=gui round(panel)
local close,render,latest local rows={} local prices={} local prompting=nil
local competing={WorkshopPanel=true,MapForgeEventPanel=true,MapForgeStoryJournal=true,MapForgeFactoryPanel=true,MapForgeShopPanel=true}
local function watch(other)
    if competing[other.Name] then other:GetPropertyChangedSignal("Visible"):Connect(function() if other.Visible then panel.Visible=false end end) end
end
for _,other in ipairs(pg:GetDescendants()) do watch(other) end
pg.DescendantAdded:Connect(function(other) task.defer(function() watch(other) end) end)
local toggle=button(gui,"CosmeticsToggle","Looks",0,40,function()
    panel.Visible=not panel.Visible
    if panel.Visible then
        for _,other in ipairs(pg:GetDescendants()) do if competing[other.Name] then other.Visible=false end end
        Gui.SelectedObject=close remote:FireServer("sync") if render then render() end
    end
end)
toggle.AnchorPoint=Vector2.new(0,1) toggle.Position=UDim2.new(0,16,1,-132) toggle.Size=UDim2.fromOffset(166,40)
label(panel,"DEINE LOOKS",10,32,18)
close=button(panel,"CosmeticsClose","×",10,36,function() panel.Visible=false Gui.SelectedObject=toggle end)
close.Position=UDim2.new(1,-48,0,10) close.Size=UDim2.fromOffset(36,36)
local scroll=Instance.new("ScrollingFrame") scroll.Name="CosmeticsScroll" scroll.Position=UDim2.fromOffset(0,54) scroll.Size=UDim2.new(1,0,1,-62) scroll.CanvasSize=UDim2.fromOffset(0,642) scroll.BackgroundTransparency=1 scroll.BorderSizePixel=0 scroll.ScrollBarThickness=4 scroll.Parent=panel
label(scroll,"Dauerhafte Figuren-Lichtspuren. Keine Spielvorteile. Roblox bestätigt den endgültigen Preis.",0,50,12)
local note=label(scroll,"Besitz wird geprüft …",52,60,12)
local standard=button(scroll,"CosmeticsNone","Standard / bezahlten Effekt entfernen",116,40,function() if latest and not latest.Loading and not latest.SavingPaused then remote:FireServer("equip","none") end end)
local function loadPrice(item)
    if not item.Configured or not panel.Visible then return end
    local old=prices[item.Id] local now=os.clock()
    if old and (old.loading or now-old.at<(old.ok and 120 or 15)) then return end
    local entry={loading=true,at=now,ok=false} prices[item.Id]=entry
    task.spawn(function()
        local ok,info=pcall(function() return Market:GetProductInfoAsync(item.PassId,Enum.InfoType.GamePass) end)
        if prices[item.Id]~=entry then return end
        entry.loading=false entry.at=os.clock()
        entry.ok=ok and type(info)=="table" and info.IsForSale==true and type(info.PriceInRobux)=="number" and info.PriceInRobux>=0 and info.PriceInRobux<math.huge and info.PriceInRobux==info.PriceInRobux
        entry.price=entry.ok and info.PriceInRobux or nil
        if render then render() end
    end)
end
for i,item in ipairs(Config.Cosmetics.Items) do
    local y=170+(i-1)*124
    local title=label(scroll,item.Name,y,26,15)
    local swatch=Instance.new("Frame") swatch.Name="CosmeticSwatch_"..item.Id swatch.Position=UDim2.fromOffset(16,y+30) swatch.Size=UDim2.new(1,-32,0,8) swatch.BackgroundColor3=Color3.fromHex(item.ColorA) swatch.BorderSizePixel=0 swatch.Parent=scroll round(swatch)
    local gradient=Instance.new("UIGradient") gradient.Color=ColorSequence.new(Color3.fromHex(item.ColorA),Color3.fromHex(item.ColorB)) gradient.Parent=swatch
    local action
    action=button(scroll,"CosmeticAction_"..item.Id,"Noch nicht eingerichtet",y+48,54,function()
        local row=rows[item.Id] local s=row and row.state
        if not s or not latest or latest.Loading or latest.SavingPaused then return end
        if s.Owned and s.Verified then remote:FireServer("equip",item.Id) return end
        local price=prices[item.Id]
        if not s.CanBuy or not price or not price.ok or prompting then return end
        prompting=item.PassId render()
        local ok=pcall(function() Market:PromptGamePassPurchase(player,item.PassId) end)
        if not ok then prompting=nil latest.Note="Kauffenster nicht erreichbar. Später erneut versuchen." render() end
    end)
    rows[item.Id]={title=title,action=action}
end
local refresh=button(scroll,"CosmeticsRefresh","Besitz & Preise prüfen",552,40,function()
    for _,entry in pairs(prices) do if not entry.loading then entry.at=-math.huge end end
    remote:FireServer("refresh") if render then render() end
end)
label(scroll,"Nur in dieser Experience. Keine Kleidung für dein globales Roblox-Avatarinventar. Standard ist kostenlos.",596,44,11)
local function active(button,enabled) button.Active=enabled button.Selectable=enabled button.AutoButtonColor=enabled button.BackgroundColor3=enabled and accent or Color3.fromRGB(65,78,94) end
render=function()
    if not latest then return end
    for _,item in ipairs(latest.Items or {}) do
        local row=rows[item.Id]
        if row then
            row.state=item local p=prices[item.Id]
            row.title.Text=item.Name..(latest.Selected==item.Id and " · angelegt" or "")
            local enabled=false
            if not item.Configured then row.action.Text="Nicht eingerichtet · eigene Pass-ID fehlt/ist doppelt"
            elseif not item.Verified then row.action.Text=latest.Busy and "Besitz wird geprüft …" or "Besitz nicht bestätigt · erneut prüfen"
            elseif item.Owned then row.action.Text=latest.Selected==item.Id and "Angelegt" or "Im Besitz · anlegen" enabled=latest.Selected~=item.Id
            elseif not latest.ShopEnabled then row.action.Text="Robux-Shop ausgeschaltet"
            elseif not item.CanBuy then row.action.Text="Kauf gesperrt · Profil/Speicher prüfen"
            elseif not p or p.loading then row.action.Text="Roblox-Preis wird geladen …"
            elseif not p.ok then row.action.Text="Preis/Verkauf nicht verfügbar · erneut prüfen"
            else row.action.Text="Einmalig kaufen · "..tostring(p.price).." Robux" enabled=true end
            active(row.action,enabled and not latest.Loading and not latest.SavingPaused and not prompting)
            loadPrice(item)
        end
    end
    active(standard,not latest.Loading and not latest.SavingPaused and latest.Selected~="none")
    if latest.SavingPaused then note.Text="Speichern pausiert. Neue Käufe und Wechsel bleiben gesperrt."
    elseif latest.Note then note.Text=latest.Note
    elseif latest.Loading then note.Text="Profil wird geladen …"
    elseif latest.Demo then note.Text="Demo-Profil: keine Robux-Käufe; Look-Auswahl gilt nur für diese Sitzung."
    else note.Text="Besitz kommt von Roblox; deine Auswahl wird gespeichert. Fehlende Pass-IDs sind nicht kaufbar." end
end
remote.OnClientEvent:Connect(function(s) if type(s)=="table" then latest=s render() end end)
Market.PromptGamePassPurchaseFinished:Connect(function(who,id)
    if who==player and prompting==id then prompting=nil remote:FireServer("refresh") render() end
end)
local function resize()
    local size=gui.AbsoluteSize or Vector2.new(800,600)
    panel.Size=UDim2.fromOffset(math.max(220,math.min(430,size.X-24)),math.max(160,math.min(710,size.Y-24)))
end
gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(resize) resize()
Input.InputBegan:Connect(function(input,processed) if panel.Visible and not processed and (input.KeyCode==Enum.KeyCode.ButtonB or input.KeyCode==Enum.KeyCode.Escape) then panel.Visible=false Gui.SelectedObject=toggle end end)
remote:FireServer("sync")
