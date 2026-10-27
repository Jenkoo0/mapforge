-- Shared authoritative workshop. The main game server retains profile ownership.
local RS=game:GetService("ReplicatedStorage")
local Players=game:GetService("Players")
local Run=game:GetService("RunService")
local Config=require(RS:WaitForChild("MapForgeConfig"))
local Data=require(script.Parent:WaitForChild("MapForgeData"))
local W=require(script.Parent:WaitForChild("MapForgeWorkshopCore"))
local S={} local remote=nil local lastAction={} local started=false
local enabled=Config.Grind and Config.Grind.Enabled==true
local function send(player,note)
    if not remote or not player.Parent then return end
    local d=Data.Read(player)
    local snapshot=d and W.Snapshot(d,Config.Mode) or {Loading=true}
    snapshot.Note=note snapshot.SavingPaused=d and not Data.CanProgress(player) or false
    remote:FireClient(player,snapshot)
end
function S.Sync(player,note) send(player,note) end
function S.Award(player,id,marks,xp)
    if not enabled then return false end
    local already=false
    local ok=Data.Edit(player,function(d)
        if W.HasClaim(d,id) then already=true return end
        return W.Award(d,id,marks,xp)
    end,true)
    send(player,ok and (already and "Prämie bereits gespeichert." or ("+"..tostring(marks).." Werkmarken · +"..tostring(xp).." EP")) or "Prämie noch nicht bestätigt. Speicherstatus prüfen.")
    return ok,already
end
function S.Start()
    if started or not enabled then return end started=true
    remote=Instance.new("RemoteEvent") remote.Name="MapForgeWorkshop" remote.Parent=RS
    remote.OnServerEvent:Connect(function(player,command,id,expectedLevel)
        if type(command)~="string" or (command~="sync" and command~="upgrade") then return end
        if command=="upgrade" and (type(id)~="string" or (id~="power" and id~="yield" and id~="focus")) then return end
        if command=="upgrade" and (type(expectedLevel)~="number" or expectedLevel~=expectedLevel or expectedLevel~=math.floor(expectedLevel) or expectedLevel<0 or expectedLevel>4) then return end
        local now=os.clock() if now-(lastAction[player] or -math.huge)<(command=="upgrade" and .75 or .25) then return end
        lastAction[player]=now
        if command=="sync" then send(player) return end
        -- Valid id and price are derived here; neither quantities nor balances travel from the client.
        local available=(id=="power" and Config.Mode=="tycoon") or (id~="power" and Config.Mode~="tycoon")
        if not available then send(player,"Dieser Ausbau gehört zum anderen Spieltyp.") return end
        local ok=Data.Edit(player,function(d)
            -- A replay of the old displayed level cannot buy another level after a lost save response.
            if W.Levels(d)[id]~=expectedLevel then return false end
            return W.Buy(d,id)
        end,true)
        send(player,ok and "Ausbau gespeichert." or "Nicht gespeichert: Marken fehlen, Maximum erreicht oder Speicher pausiert.")
    end)
    Players.PlayerRemoving:Connect(function(player) lastAction[player]=nil end)
    local elapsed=0
    Run.Heartbeat:Connect(function(dt)
        elapsed=elapsed+dt if elapsed<2 then return end elapsed=0
        for _,player in ipairs(Players:GetPlayers()) do send(player) end
    end)
end
return S
