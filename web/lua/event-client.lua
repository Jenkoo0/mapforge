-- MapForge: event HUD, local graphics and server-confirmed rally results.
local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local Tween=game:GetService("TweenService")
local Lighting=game:GetService("Lighting")
local Run=game:GetService("RunService")
local Gui=game:GetService("GuiService")
local Config=require(RS:WaitForChild("MapForgeConfig"))
if not Config.Events or Config.Events.Mode=="off" then return end
local player=Players.LocalPlayer
local remote=RS:WaitForChild("MapForgeEvents",20)
if not remote then warn("[MapForge] Event server unavailable.") return end
local looks={
    {Name="Polarlicht",Color=Color3.fromRGB(147,238,212),Tint=Color3.fromRGB(236,255,249)},
    {Name="Goldene Stunde",Color=Color3.fromRGB(255,211,140),Tint=Color3.fromRGB(255,247,234)},
    {Name="Mondblüte",Color=Color3.fromRGB(187,180,255),Tint=Color3.fromRGB(242,242,255)},
}
local dark=Color3.fromRGB(17,28,39) local light=Color3.fromRGB(239,247,246)
local gui=Instance.new("ScreenGui") gui.Name="MapForgeEventHUD" gui.ResetOnSpawn=false gui.DisplayOrder=50 gui.ZIndexBehavior=Enum.ZIndexBehavior.Sibling gui.Parent=player:WaitForChild("PlayerGui")
local function rounded(obj) local c=Instance.new("UICorner") c.CornerRadius=UDim.new(0,12) c.Parent=obj end
local function label(parent,text,y,height,size)
    local t=Instance.new("TextLabel") t.Size=UDim2.new(1,-32,0,height) t.Position=UDim2.fromOffset(16,y) t.Text=text t.TextSize=size or 14 t.Font=Enum.Font.GothamMedium t.TextColor3=light t.TextWrapped=true t.TextXAlignment=Enum.TextXAlignment.Left t.BackgroundTransparency=1 t.Parent=parent return t
end
local function button(parent,text,pos,size,fn)
    local b=Instance.new("TextButton") b.Position=pos b.Size=size b.Text=text b.TextSize=13 b.Font=Enum.Font.GothamBold b.TextColor3=light b.BackgroundColor3=Color3.fromRGB(43,62,76) b.BorderSizePixel=0 b.Parent=parent rounded(b) b.Activated:Connect(fn) return b
end
local panel=Instance.new("Frame") panel.Name="MapForgeEventPanel" panel.AnchorPoint=Vector2.new(.5,.5) panel.Position=UDim2.fromScale(.5,.5) panel.BackgroundColor3=dark panel.BorderSizePixel=0 panel.Visible=false panel.ZIndex=2 panel.Parent=gui rounded(panel)
local close
local chip=button(gui,"Events laden …",UDim2.new(.5,0,1,-16),UDim2.fromOffset(238,44),function() panel.Visible=not panel.Visible if panel.Visible then Gui.SelectedObject=close end end)
chip.Name="MapForgeEventToggle" chip.AnchorPoint=Vector2.new(.5,1)
chip.TextWrapped=true chip.TextSize=12
local stroke=Instance.new("UIStroke") stroke.Thickness=1 stroke.Color=looks[1].Color stroke.Parent=chip
close=button(panel,"×",UDim2.new(1,-48,0,10),UDim2.fromOffset(36,36),function() panel.Visible=false if Gui.SelectedObject==close then Gui.SelectedObject=chip end end)
label(panel,"EVENTS / MINISPIELE",12,30,16)
local scroll=Instance.new("ScrollingFrame") scroll.Name="MapForgeEventScroll" scroll.Size=UDim2.new(1,0,1,-62) scroll.Position=UDim2.fromOffset(0,56) scroll.BackgroundTransparency=1 scroll.BorderSizePixel=0 scroll.ScrollBarThickness=3 scroll.CanvasSize=UDim2.fromOffset(0,530) scroll.Parent=panel
local heading=label(scroll,"Nächste Serverrunde",0,36,22)
local phase=label(scroll,"",42,42,14)
local route=label(scroll,"",92,48,20)
local progress=Instance.new("Frame") progress.Position=UDim2.fromOffset(16,148) progress.Size=UDim2.new(1,-32,0,5) progress.BackgroundColor3=Color3.fromRGB(48,64,76) progress.BorderSizePixel=0 progress.Parent=scroll rounded(progress)
local fill=Instance.new("Frame") fill.Size=UDim2.fromScale(0,1) fill.BackgroundColor3=looks[1].Color fill.BorderSizePixel=0 fill.Parent=progress rounded(fill)
local status=label(scroll,"Am Terminal im Startbereich gelangst du zur Arena.",168,56,14)
local best=label(scroll,"Persönliche Rundenbestzeit: —",232,26,13)
local board=label(scroll,"TOP 5 · DIESE SERVERRUNDE\nNoch keine Zielzeit.",270,130,14)
local rules=label(scroll,"Gleiche Route und Bewegungsprofil für alle. Nur die acht Signale in Reihenfolge zählen. Zeitmessung am Server; keine Kaufvorteile. Bestzeiten gelten bis zum Rundenwechsel.",408,82,12)
local effects=true local lastKey=nil local current=nil local tween=nil local note="" local noteUntil=0
local grade=Instance.new("ColorCorrectionEffect") grade.Name="MapForgeEventTint" grade.Enabled=false grade.TintColor=Color3.new(1,1,1) grade.Parent=Lighting
local cloud=Instance.new("Part") cloud.Name="MapForgeEventMotes" cloud.Size=Vector3.new(24,.2,24) cloud.Transparency=1 cloud.Anchored=true cloud.CanCollide=false cloud.CanTouch=false cloud.CanQuery=false cloud.CastShadow=false cloud.Parent=workspace.CurrentCamera
local motes=Instance.new("ParticleEmitter") motes.Name="EventMotes" motes.Texture="rbxasset://textures/particles/sparkles_main.dds" motes.Enabled=false motes.Rate=8 motes.Lifetime=NumberRange.new(2,3) motes.Speed=NumberRange.new(.3,1) motes.Size=NumberSequence.new(.18) motes.Transparency=NumberSequence.new(.35) motes.LightEmission=.35 motes.SpreadAngle=Vector2.new(180,180) motes.Parent=cloud
local markers={}
local function clearMarkers() for _,m in ipairs(markers) do m:Destroy() end markers={} end
local function paintEffect()
    local active=current and current.Phase=="active" and effects
    local look=looks[current and current.Look or 1] or looks[1]
    if tween then tween:Cancel() tween=nil end
    grade.Enabled=active==true
    local reduced=false pcall(function() reduced=Gui.ReducedMotionEnabled end)
    motes.Enabled=active==true and not reduced
    motes.Color=ColorSequence.new(look.Color)
    if not active then motes:Clear() return end
    if reduced then grade.TintColor=look.Tint
    else tween=Tween:Create(grade,TweenInfo.new(2),{TintColor=look.Tint}) tween:Play() end
end
local preferenceConnection=Gui:GetPropertyChangedSignal("ReducedMotionEnabled"):Connect(paintEffect)
local elapsed=0
local effectConnection=Run.Heartbeat:Connect(function(dt)
    elapsed=elapsed+dt if elapsed<.25 then return end elapsed=0
    local root=player.Character and player.Character:FindFirstChild("HumanoidRootPart")
    if root and motes.Enabled then cloud.Position=root.Position+Vector3.new(0,7,0) end
end)
local effectButton=button(scroll,"Lichteffekte: an",UDim2.fromOffset(16,496),UDim2.new(1,-32,0,34),function() effects=not effects paintEffect() end)
effectButton.Activated:Connect(function() effectButton.Text=effects and "Lichteffekte: an" or "Lichteffekte: aus" end)
local function markTarget(s)
    clearMarkers() if not s.Running or (s.Game and s.Game~="signal") then return end
    local world=workspace:FindFirstChild("MapForgeWorld") local arena=world and world:FindFirstChild("event")
    local target=arena and arena:FindFirstChild("RallySignal"..tostring(s.Order[s.Step+1]))
    if target then
        local h=Instance.new("Highlight") h.Name="MapForgeNextSignal" h.Adornee=target h.FillColor=looks[s.Look].Color h.FillTransparency=.65 h.OutlineTransparency=0 h.DepthMode=Enum.HighlightDepthMode.Occluded h.Parent=target table.insert(markers,h)
    end
end
local function resize()
    local size=gui.AbsoluteSize or Vector2.new(800,600)
    panel.Size=UDim2.fromOffset(math.max(220,math.min(420,size.X-24)),math.max(160,math.min(620,size.Y-24)))
    chip.Size=UDim2.fromOffset(math.max(130,math.min(238,size.X-220)),44)
end
gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(resize) resize()
local connection=remote.OnClientEvent:Connect(function(s)
    if (s.Preview or 0)>0 and (not current or (current.Preview or 0)==0) then panel.Visible=true end
    current=s local look=looks[s.Look] or looks[1]
    local key=s.Phase..":"..s.Look
    if key~=lastKey then lastKey=key paintEffect() end
    if s.Note then note=s.Note noteUntil=os.clock()+6 if string.sub(note,1,5)=="Ziel!" then panel.Visible=true end end
    heading.Text=s.Rally and (s.GameName or "Signal-Rallye") or look.Name heading.TextColor3=look.Color stroke.Color=look.Color fill.BackgroundColor3=look.Color
    local stage=s.Phase=="warning" and "Beginnt in " or s.Phase=="active" and "Aktiv · noch " or "Nächste Runde in "
    phase.Text=look.Name.." · Runde "..s.Round.." · "..stage..s.Remaining.." s"
    local order={} for i,id in ipairs(s.Order) do table.insert(order,(s.Running and i==s.Step+1 and "["..id.."]" or tostring(id))) end
    local total=s.Total or 8
    local preview=s.Preview or 0
    if not s.Rally then route.Text="Licht-Events · entspannt weiterspielen"
    elseif s.Game=="memory" then route.Text=preview>0 and ("MERKEN · "..preview.." s\n"..table.concat(order," › ")) or s.Running and "Jetzt aus dem Gedächtnis bestätigen." or "Sechs Signale merken. Sechs Sekunden Vorschau."
    elseif s.Game=="collect" then
        local open={} for _,id in ipairs(s.OpenStations or {}) do table.insert(open,tostring(id)) end
        route.Text="Zwei Durchgänge · vier Stationen\n"..(s.Running and ("Noch offen: "..table.concat(open," · ")) or "Je Station einmal pro Durchgang, Reihenfolge frei.")
    else route.Text=table.concat(order," › ") end
    fill.Size=UDim2.fromScale(s.Running and s.Step/total or 0,1)
    if s.Running and preview>0 then chip.Text="MERKEN · "..preview.." s · Folge im Eventfenster"
    elseif s.Running and s.Game and s.Game~="signal" then chip.Text=string.format("%d/%d · %.1f s",s.Step,total,s.Elapsed)
    elseif s.Running then chip.Text=string.format("%d/8 → %d · %.1f s",s.Step,s.Order[s.Step+1],s.Elapsed)
    else chip.Text=(s.Phase=="active" and "● " or "◇ ")..look.Name.." · "..s.Remaining.." s" end
    status.Text=os.clock()<noteUntil and note or s.Running and (s.Game=="memory" and (preview>0 and "Öffne die Folge, merke sie dir und positioniere dich. Bestätigen zählt erst nach der Vorschau." or "Merke die Reihenfolge. Ein falsches Signal beendet diesen Versuch.") or s.Game=="collect" and "Vier Stationen, freie Wahl. Direkte Wiederholungen zählen nicht." or "Folge dem markierten Signal. E / X / Touch bestätigt vor Ort.") or not s.Rally and "Licht-Events verändern keine Spielwerte." or s.InArena and "Mittleres Startfeld: Zeitlauf beginnen. Hinteres Terminal: zurück zur Map." or "Am Terminal im Startbereich gelangst du zur Arena."
    rules.Text=(s.Game=="memory" and "Sechs Sekunden merken und positionieren; danach 75 Sekunden Zeit. Nach der Vorschau bleiben Folge und nächstes Signal verborgen. " or s.Game=="collect" and "Je Durchgang alle vier Stationen genau einmal. Zwei Durchgänge, freie Reihenfolge. Auch dazwischen dieselbe Station nicht direkt wiederholen. " or "Acht Signale in derselben Reihenfolge für alle. ").."Werkstatt-Upgrades verändern keine Laufwerte. Die Top 5 gilt nur für diese Serverrunde."
    best.Text="Persönliche Rundenbestzeit: "..(s.Best and string.format("%.3f s",s.Best) or "—")
    local rows={"TOP 5 · DIESE SERVERRUNDE"}
    for i,row in ipairs(s.Leaders) do table.insert(rows,string.format("%d. %s%s · %.3f s",i,row.You and "Du · " or "",row.Name,row.Time)) end
    if #s.Leaders==0 then table.insert(rows,"Noch keine Zielzeit.") end board.Text=table.concat(rows,"\n")
    markTarget(s)
end)
remote:FireServer("sync")
script.Destroying:Connect(function() connection:Disconnect() preferenceConnection:Disconnect() effectConnection:Disconnect() if tween then tween:Cancel() end clearMarkers() cloud:Destroy() grade:Destroy() gui:Destroy() end)
