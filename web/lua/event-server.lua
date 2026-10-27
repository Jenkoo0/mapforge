-- MapForge: shared random events and optional physical Signal-Rallye. Basic plausibility checks, not complete anti-cheat.
local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local Run=game:GetService("RunService")
local Config=require(RS:WaitForChild("MapForgeConfig"))
if not Config.Events or Config.Events.Mode=="off" then return end
local E=require(script.Parent:WaitForChild("MapForgeEventCore"))
local random=Random.new()
local state=E.New(function(n) return random:NextInteger(1,n) end,os.clock(),Config.Minigame)
local Workshop=nil
local session=nil
if Config.Grind and Config.Grind.Enabled then
    Workshop=require(script.Parent:WaitForChild("MapForgeWorkshop"))
    session=game:GetService("HttpService"):GenerateGUID(false)
end
local gameNames={signal="Signal-Rallye",memory="Echohöfe",collect="Funkenjagd"}
local gameName=gameNames[state.game]
local remote=Instance.new("RemoteEvent") remote.Name="MapForgeEvents" remote.Parent=RS
local world=workspace:WaitForChild("MapForgeWorld")
local arena=world:FindFirstChild("event")
local start=arena and arena:FindFirstChild("RallyStart")
local home=world:WaitForChild("spawn"):FindFirstChildWhichIsA("SpawnLocation")
local signals,connections,lastAction,cooldowns,transits={},{},{},{},{}
if arena then for i=1,4 do signals[i]=arena:FindFirstChild("RallySignal"..i) end end
local maxSpeed=math.max(Config.WalkSpeed or 16,(Config.Movement or {}).SprintSpeed or 16)
local function body(player)
    local char=player.Character local root=char and char:FindFirstChild("HumanoidRootPart")
    local hum=char and char:FindFirstChildOfClass("Humanoid")
    if root and hum and hum.Health>0 and not hum.Sit and not hum.PlatformStand then return root,hum end
end
local function close(player,part,distance)
    local root=body(player) return root and part and (root.Position-part.Position).Magnitude<=distance
end
local function snapshot(player,note)
    local run=state.runs[player.UserId]
    local now=os.clock()
    local preview=run and math.max(0,math.ceil(run.previewUntil-now)) or 0
    local order=state.order
    if state.game=="memory" and preview==0 then order={} end
    local open={}
    if state.game=="collect" then for i=1,4 do if not run or (not run.visited[i] and run.lastSignal~=i) then table.insert(open,i) end end end
    local leaders={}
    for _,row in ipairs(E.Top(state)) do
        local other=Players:GetPlayerByUserId(row.id)
        if other then table.insert(leaders,{Name=other.DisplayName,Time=row.time,You=other==player}) end
    end
    return {Phase=state.phase,Round=state.round,Look=state.look or 1,Remaining=math.max(0,math.ceil(state.deadline-os.clock())),
        Rally=Config.Events.Mode=="rally",Game=state.game,GameName=gameName,Total=#state.order,Preview=preview,Order=order,OpenStations=open,Step=run and run.step or 0,
        Elapsed=run and math.max(0,os.clock()-run.started) or 0,Running=run~=nil,
        Best=state.best[player.UserId],Leaders=leaders,Note=note,InArena=player:GetAttribute("MapForgeInArena")==true}
end
local function send(player,note) if player.Parent then remote:FireClient(player,snapshot(player,note)) end end
local function broadcast() for _,player in ipairs(Players:GetPlayers()) do send(player) end end
local function cancel(player,note)
    if state.runs[player.UserId] then state.runs[player.UserId]=nil send(player,note or "Lauf abgebrochen.") end
end
local function teleport(player,target,inside)
    if not target or transits[player] then return end
    local root=body(player) if not root then return end
    transits[player]=true cancel(player)
    local char=player.Character
    -- Pre-stream the destination; abort stale character replies rather than moving a respawn.
    pcall(function() player:RequestStreamAroundAsync(target.Position,3) end)
    if player.Parent and player.Character==char and body(player) then
        char:PivotTo(CFrame.new(target.Position+Vector3.new(0,4,0)))
        player:SetAttribute("MapForgeInArena",inside)
        cooldowns[player]=os.clock()+2 send(player,inside and (gameName..": Am mittleren Startfeld beginnen.") or "Zurück in deiner Map.")
    end
    transits[player]=nil
end
local function gate(player,fn)
    local now=os.clock() if now-(lastAction[player] or -math.huge)<.2 then return end lastAction[player]=now fn(now)
end
local function prompt(part,title,verb,fn)
    if not part then return end
    local p=Instance.new("ProximityPrompt") p.Name="MapForgeRallyPrompt" p.ObjectText=title p.ActionText=verb
    p.MaxActivationDistance=6 p.RequiresLineOfSight=false p.HoldDuration=0 p.Parent=part
    p.Triggered:Connect(function(player) gate(player,function(now) if close(player,part,8) then fn(player,now) end end) end)
end
if Config.Events.Mode=="rally" and start then
    prompt(arena:FindFirstChild("RallyPortal"),gameName,"Arena betreten",function(player) teleport(player,start,true) end)
    prompt(arena:FindFirstChild("RallyReturn"),"Zurück zur Map","Arena verlassen",function(player) teleport(player,home,false) end)
    prompt(start,gameName.." · gleiche Regeln für alle","Zeitlauf starten",function(player,now)
        if transits[player] or player:GetAttribute("MapForgeInArena")~=true or now<(cooldowns[player] or 0) then return end
        local ok,why=E.Start(state,player.UserId,now)
        if ok then
            local run=state.runs[player.UserId] local root=body(player) run.position=root.Position
            send(player,state.game=="memory" and "Merke die sechs Signale. Nach 6 Sekunden verschwindet die Folge; dann beginnt die Zeitmessung." or state.game=="collect" and "Zwei Durchgänge: Je vier verschiedene Funken sammeln. Reihenfolge frei; dieselbe Station darf nicht direkt folgen." or "Los! Folge dem markierten Signal.")
        else send(player,why=="running" and "Dein Lauf läuft bereits." or ("Neue Starts zu Beginn des nächsten Events. Mindestens "..(state.game=="memory" and "81" or "75").." Sekunden Restzeit nötig.")) end
    end)
    for i=1,4 do
        prompt(signals[i],"Signal "..i,"Signal bestätigen",function(player,now)
            local run=state.runs[player.UserId] if transits[player] or not run then return end
            local root=body(player)
            local distance=(run.position-root.Position).Magnitude
            -- Travel time includes small replication tolerance; the client never supplies a score or timestamp.
            local minimum=math.max(.25,(distance-8)/(maxSpeed*1.35))
            local ok,why,time=E.Hit(state,player.UserId,i,now,minimum)
            if ok then
                if why=="finish" then
                    cooldowns[player]=now+3 send(player,string.format("Ziel! %.3f s · Bestzeit dieser Runde gespeichert.",time)) broadcast()
                    if Workshop and not state.rewarded[player.UserId] then
                        local round=state.round
                        state.rewarded[player.UserId]=true
                        task.spawn(function()
                            local marks=5+(time<45 and 1 or 0)+(time<30 and 1 or 0)
                            local saved,already=Workshop.Award(player,session..":"..round,marks,10)
                            if not saved and state.round==round then state.rewarded[player.UserId]=nil end
                            send(player,saved and (already and "Werkstattprämie dieser Runde bereits gespeichert. Weitere Versuche verbessern deine Zeit." or "Werkstatt: +"..marks.." Werkmarken · +10 XP gespeichert. Weitere Versuche verbessern deine Zeit.") or "Zeit gültig. Werkstatt-Speicherung nicht bestätigt; Fortschrittsanzeige prüfen und später erneut versuchen.")
                        end)
                    end
                else run.position=root.Position send(player,"Signal "..run.step.."/"..#state.order.." bestätigt.") end
            elseif why=="order" then send(player,"Nächstes Signal: "..tostring(state.order[run.step+1]))
            elseif why=="preview" then send(player,"Noch merken: Die Zeitmessung beginnt nach der Vorschau.")
            elseif why=="repeat" then send(player,"Wechsle zu einer anderen Funkenstation.")
            elseif why=="visited" then send(player,"Diese Station ist in diesem Durchgang schon gesammelt. Wähle eine offene Station.")
            elseif why=="memory" then send(player,"Die Merkfolge war anders. Am Startfeld erneut versuchen.")
            else send(player,"Lauf ungültig oder abgelaufen. Am Startfeld neu beginnen.") end
        end)
    end
end
-- Remote only requests a fresh display. Gameplay actions use server-checked world prompts.
remote.OnServerEvent:Connect(function(player,command)
    if command~="sync" then return end
    gate(player,function() send(player) end)
end)
local function join(player)
    connections[player]=player.CharacterRemoving:Connect(function()
        cancel(player,"Respawn: Lauf abgebrochen.") player:SetAttribute("MapForgeInArena",false)
    end)
end
Players.PlayerAdded:Connect(join)
Players.PlayerRemoving:Connect(function(player)
    E.Remove(state,player.UserId) lastAction[player]=nil cooldowns[player]=nil transits[player]=nil
    if connections[player] then connections[player]:Disconnect() connections[player]=nil end
end)
for _,player in ipairs(Players:GetPlayers()) do join(player) end
local tick=0
Run.Heartbeat:Connect(function(dt)
    tick=tick+dt if tick<1 then return end tick=0
    local now=os.clock() E.Advance(state,now)
    for _,player in ipairs(Players:GetPlayers()) do
        local run=state.runs[player.UserId]
        if run then
            local root=body(player)
            local off=root and start and root.Position-start.Position
            if not off or math.abs(off.X)>39 or math.abs(off.Z)>39 or math.abs(off.Y)>18 or now-run.started>E.Limit then cancel(player,"Lauf beendet: Arena verlassen, gestorben oder 75 Sekunden überschritten.") end
        end
        send(player)
    end
end)
