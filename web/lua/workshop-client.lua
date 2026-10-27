-- Workshop UI displays server snapshots only. Upgrades never change movement or rally times.
local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local Gui=game:GetService("GuiService")
local Input=game:GetService("UserInputService")
local Config=require(RS:WaitForChild("MapForgeConfig"))
if not Config.Grind or Config.Grind.Enabled~=true then return end
local player=Players.LocalPlayer local remote=RS:WaitForChild("MapForgeWorkshop",20)
if not remote then warn("[MapForge] Workshop server unavailable.") return end
local dark=Color3.fromRGB(18,31,39) local light=Color3.fromRGB(240,248,243) local mint=Color3.fromRGB(171,236,188)
local gui=Instance.new("ScreenGui") gui.Name="MapForgeWorkshopHUD" gui.ResetOnSpawn=false gui.DisplayOrder=60 gui.ZIndexBehavior=Enum.ZIndexBehavior.Sibling gui.ScreenInsets=Enum.ScreenInsets.CoreUISafeInsets gui.Parent=player:WaitForChild("PlayerGui")
local function round(o) local c=Instance.new("UICorner") c.CornerRadius=UDim.new(0,12) c.Parent=o end
local function label(parent,text,y,height,size)
    local o=Instance.new("TextLabel") o.Position=UDim2.fromOffset(16,y) o.Size=UDim2.new(1,-32,0,height) o.Text=text o.TextSize=size or 14 o.TextColor3=light o.Font=Enum.Font.GothamMedium o.TextXAlignment=Enum.TextXAlignment.Left o.TextWrapped=true o.BackgroundTransparency=1 o.Parent=parent return o
end
local function button(parent,text,pos,size,fn)
    local b=Instance.new("TextButton") b.Text=text b.Position=pos b.Size=size b.TextSize=13 b.Font=Enum.Font.GothamBold b.TextColor3=dark b.BackgroundColor3=mint b.BorderSizePixel=0 b.Selectable=true b.Parent=parent round(b) b.Activated:Connect(fn) return b
end
local panel=Instance.new("Frame") panel.Name="WorkshopPanel" panel.AnchorPoint=Vector2.new(.5,.5) panel.Position=UDim2.fromScale(.5,.5) panel.BackgroundColor3=dark panel.BorderSizePixel=0 panel.Visible=false panel.ZIndex=2 panel.Parent=gui round(panel)
local close
local chip=button(gui,"Werkstatt lädt …",UDim2.new(0,16,1,-80),UDim2.fromOffset(166,40),function()
    panel.Visible=not panel.Visible if panel.Visible then Gui.SelectedObject=close remote:FireServer("sync") end
end)
chip.Name="WorkshopToggle" chip.AnchorPoint=Vector2.new(0,1)
label(panel,"DEINE WERKSTATT",12,32,18)
close=button(panel,"×",UDim2.new(1,-48,0,10),UDim2.fromOffset(36,36),function() panel.Visible=false Gui.SelectedObject=chip end)
local scroll=Instance.new("ScrollingFrame") scroll.Name="WorkshopScroll" scroll.Position=UDim2.fromOffset(0,56) scroll.Size=UDim2.new(1,0,1,-64) scroll.BackgroundTransparency=1 scroll.BorderSizePixel=0 scroll.ScrollBarThickness=4 scroll.CanvasSize=UDim2.fromOffset(0,636) scroll.Parent=panel
local rank=label(scroll,"Profil wird geladen …",0,30,18)
local xp=label(scroll,"",34,24,12)
local rail=Instance.new("Frame") rail.Position=UDim2.fromOffset(16,64) rail.Size=UDim2.new(1,-32,0,5) rail.BackgroundColor3=Color3.fromRGB(49,68,77) rail.BorderSizePixel=0 rail.Parent=scroll round(rail)
local fill=Instance.new("Frame") fill.Size=UDim2.fromScale(0,1) fill.BackgroundColor3=mint fill.BorderSizePixel=0 fill.Parent=rail round(fill)
local sources=label(scroll,"Werkmarken durch Spielen. Keine Robux notwendig.",82,64,12)
local rows={} local titles={power="Maschinenkraft",yield="Sammelgeschick",focus="Zielfokus"}
local function effect(id,level)
    if id=="power" then return "+"..(level*4).." % Maschinenproduktion" end
    if id=="yield" then return "+"..level.." Münzen je gesammelter Streckenmünze" end
    return "+"..(level*5).." Münzen je abgeschlossenem Obby" end
for i,id in ipairs({"power","yield","focus"}) do
    local y=154+(i-1)*112
    local title=label(scroll,titles[id],y,26,15)
    local detail=label(scroll,"",y+28,34,12)
    local buy=button(scroll,"Laden …",UDim2.fromOffset(16,y+66),UDim2.new(1,-32,0,38),function()
        if rows[id].enabled then remote:FireServer("upgrade",id,rows[id].level) end
    end)
    rows[id]={title=title,detail=detail,buy=buy,enabled=false}
end
local note=label(scroll,"",496,56,12)
label(scroll,"Alle Werte werden am Server gespeichert. Ausbau bleibt nach Wiedergeburt erhalten. Bewegung und Signal-Rallye erhalten keine Ausbauvorteile.",558,70,12)
local latestNote="" local noteUntil=0
remote.OnClientEvent:Connect(function(s)
    if type(s)~="table" then return end
    if s.Loading then chip.Text="Werkstatt · lädt …" return end
    if s.Note then latestNote=s.Note noteUntil=os.clock()+7 end
    chip.Text="Werkstatt · "..s.Marks.." Marken"
    rank.Text="Rang "..s.Rank.." · "..s.Marks.." Werkmarken"
    xp.Text=s.XP.." EP gesamt"..(s.Rank<999 and (" · "..s.RankXP.." / 100 bis Rang "..(s.Rank+1)) or " · Höchster Rang")
    fill.Size=UDim2.fromScale(s.Rank>=999 and 1 or s.RankXP/100,1)
    sources.Text=s.Mode=="tycoon" and "Neue Maschine: 1 Marke + 2 EP, einmal je Maschine. Ein gültiger Minispiel-Abschluss pro Runde bringt weitere Marken." or "Obby-Ziel: 3 Marken + 6 EP. Ein gültiger Minispiel-Abschluss pro Runde bringt weitere Marken. Münz-Upgrades gelten für Streckenmünzen."
    for _,b in ipairs(s.Branches) do
        local row=rows[b.Id]
        if row then
            row.level=b.Level
            row.title.Text=titles[b.Id].." · "..b.Level.." / 5"
            row.detail.Text=effect(b.Id,b.Level)..(not b.Max and (" → "..effect(b.Id,b.Level+1)) or "")
            row.enabled=b.Available and not b.Max and s.Marks>=(b.Cost or math.huge) and not s.SavingPaused
            row.buy.Active=row.enabled row.buy.Selectable=b.Available row.buy.AutoButtonColor=row.enabled
            row.buy.BackgroundColor3=row.enabled and mint or Color3.fromRGB(56,74,81) row.buy.TextColor3=row.enabled and dark or light
            row.buy.Text=not b.Available and (b.Id=="power" and "Für Tycoon-Maschinen" or "Für Obby-Strecken") or b.Max and "Vollständig ausgebaut" or s.SavingPaused and "Speichern pausiert" or ("Ausbauen · "..b.Cost.." Werkmarken"..(s.Marks<b.Cost and " · noch "..(b.Cost-s.Marks).." fehlen" or ""))
        end
    end
    note.Text=s.SavingPaused and "Speichern pausiert. Es wird kein Ausbau als gespeichert angezeigt. Bitte erneut versuchen, sobald die Verbindung zurück ist." or os.clock()<noteUntil and latestNote or "Wähle deinen nächsten Ausbau. Preise: 5 / 10 / 18 / 30 / 45 Marken."
end)
local function resize()
    local size=gui.AbsoluteSize or Vector2.new(800,600)
    panel.Size=UDim2.fromOffset(math.max(220,math.min(430,size.X-24)),math.max(170,math.min(740,size.Y-24)))
    chip.Size=UDim2.fromOffset(math.min(166,math.max(132,size.X-32)),40)
end
gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(resize) resize()
Input.InputBegan:Connect(function(input,processed)
    if panel.Visible and not processed and (input.KeyCode==Enum.KeyCode.ButtonB or input.KeyCode==Enum.KeyCode.Escape) then panel.Visible=false Gui.SelectedObject=chip end
end)
remote:FireServer("sync")
