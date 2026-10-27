-- MapForge: shared permanent cosmetic passes. No receipts, economy or movement changes.
local Players=game:GetService("Players")
local RS=game:GetService("ReplicatedStorage")
local Market=game:GetService("MarketplaceService")
local Run=game:GetService("RunService")
local Config=require(RS:WaitForChild("MapForgeConfig"))
if not Config.Cosmetics or not Config.Cosmetics.Enabled then return end
local Data=require(script.Parent:WaitForChild("MapForgeData"))
local items,counts={},{}
for _,id in pairs(Config.Passes or {}) do if type(id)=="number" and id>0 then counts[id]=(counts[id] or 0)+1 end end
for _,item in ipairs(Config.Cosmetics.Items or {}) do
    if type(item.Id)=="string" and type(item.PassId)=="number" then
        items[item.Id]=item
        if item.PassId>0 then counts[item.PassId]=(counts[item.PassId] or 0)+1 end
    end
end
local remote=Instance.new("RemoteEvent") remote.Name="MapForgeCosmetics" remote.Parent=RS
local states={}
local function configured(item) return item.PassId>0 and item.PassId%1==0 and counts[item.PassId]==1 end
local function send(player,note)
    local s=states[player] if not s or not player.Parent then return end
    local d=Data.Read(player)
    local rows={}
    for _,item in ipairs(Config.Cosmetics.Items) do
        table.insert(rows,{Id=item.Id,Name=item.Name,PassId=item.PassId,ColorA=item.ColorA,ColorB=item.ColorB,
            Configured=configured(item),Verified=s.verified[item.Id]==true,Owned=s.owned[item.Id]==true,
            CanBuy=configured(item) and not s.busy and s.verified[item.Id]==true and not s.owned[item.Id] and Config.ShopEnabled==true and Data.CanPurchase(player)==true})
    end
    remote:FireClient(player,{Loading=d==nil,Items=rows,Selected=d and d.CosmeticStyle or "none",Busy=s.busy==true,Demo=d~=nil and Data.CanProgress(player) and not Data.CanPurchase(player),
        SavingPaused=d~=nil and not Data.CanProgress(player),ShopEnabled=Config.ShopEnabled==true,Note=note})
end
local function clear(root)
    for _,name in ipairs({"MapForgeCosmeticTrail","MapForgeCosmeticA","MapForgeCosmeticB"}) do
        local old=root:FindFirstChild(name) if old then old:Destroy() end
    end
end
local function apply(player)
    local s=states[player] local d=Data.Read(player)
    local char=player.Character local root=char and char:FindFirstChild("HumanoidRootPart")
    if not s or not d or not root then return end
    local selected=d.CosmeticStyle or "none"
    local item=items[selected]
    local active=item and configured(item) and s.verified[selected] and s.owned[selected] and selected or "none"
    if s.root~=root or s.active~=active or (active~="none" and not root:FindFirstChild("MapForgeCosmeticTrail")) then
        clear(root) s.root=root s.active=active
        if active~="none" then
            local a=Instance.new("Attachment") a.Name="MapForgeCosmeticA" a.Position=Vector3.new(-.65,-.8,0) a.Parent=root
            local b=Instance.new("Attachment") b.Name="MapForgeCosmeticB" b.Position=Vector3.new(.65,-.8,0) b.Parent=root
            local trail=Instance.new("Trail") trail.Name="MapForgeCosmeticTrail" trail.Attachment0=a trail.Attachment1=b
            trail.Color=ColorSequence.new(Color3.fromHex(item.ColorA),Color3.fromHex(item.ColorB))
            trail.Lifetime=item.Lifetime trail.LightEmission=.45 trail.MinLength=.1 trail.FaceCamera=true
            trail.Transparency=NumberSequence.new(.2) trail.Parent=root
        end
    end
    -- Preserve the earned free trail; restore it when the premium style is removed.
    local free=root:FindFirstChild("MFGlowTrail") if free then free.Enabled=active=="none" end
end
local function refresh(player)
    local s=states[player] if not s or s.busy then return end
    s.busy=true send(player)
    for _,item in ipairs(Config.Cosmetics.Items) do
        local ok,owns=false,false
        if configured(item) then ok,owns=pcall(function() return Market:UserOwnsGamePassAsync(player.UserId,item.PassId) end) end
        if states[player]~=s or not player.Parent then return end
        s.verified[item.Id]=ok s.owned[item.Id]=ok and owns==true
    end
    s.busy=false s.loaded=true apply(player) send(player)
end
local function join(player)
    if states[player] then return end
    local s={owned={},verified={},last=-math.huge,lastRefresh=-math.huge,loaded=false} states[player]=s
    s.character=player.CharacterAdded:Connect(function() s.root=nil task.defer(function() if states[player]==s then apply(player) end end) end)
    if Data.Read(player) then task.spawn(refresh,player) end
end
remote.OnServerEvent:Connect(function(player,command,id)
    local s=states[player] if not s or type(command)~="string" then return end
    if command~="sync" and command~="refresh" and command~="equip" then return end
    if command=="equip" and (type(id)~="string" or (id~="none" and not items[id])) then return end
    local now=os.clock() if now-s.last<.35 then return end s.last=now
    if command=="sync" then send(player) return end
    if command=="refresh" then
        if now-s.lastRefresh<5 then send(player,"Bitte kurz warten, dann Besitz erneut prüfen.") return end
        s.lastRefresh=now task.spawn(refresh,player) return
    end
    if not Data.Read(player) then send(player,"Profil wird noch geladen.") return end
    if id~="none" and (not configured(items[id]) or not s.verified[id] or not s.owned[id]) then
        send(player,"Besitz nicht bestätigt. Roblox-Besitz erneut prüfen.") return
    end
    local ok=Data.Edit(player,function(d) d.CosmeticStyle=id end,true)
    if states[player]==s then apply(player) send(player,ok and (Data.CanPurchase(player) and "Look gespeichert." or "Look für diese Demo-Sitzung geändert; nicht dauerhaft gespeichert.") or "Speichern nicht bestätigt. Bisher bestätigten Look beibehalten; Speicherstatus prüfen.") end
end)
-- A finished prompt is only a reason to re-query ownership, never an entitlement.
Market.PromptGamePassPurchaseFinished:Connect(function(player,passId,bought)
    if not bought or not states[player] then return end
    for _,item in ipairs(Config.Cosmetics.Items) do
        if configured(item) and item.PassId==passId then task.spawn(refresh,player) return end
    end
end)
Players.PlayerAdded:Connect(join)
Players.PlayerRemoving:Connect(function(player)
    local s=states[player] states[player]=nil
    if s and s.character then s.character:Disconnect() end
end)
for _,player in ipairs(Players:GetPlayers()) do join(player) end
local elapsed=0
Run.Heartbeat:Connect(function(dt)
    elapsed=elapsed+dt if elapsed<2 then return end elapsed=0
    for player,s in pairs(states) do
        if Data.Read(player) then
            if not s.loaded and not s.busy then task.spawn(refresh,player) end
            apply(player) send(player)
        end
    end
end)
