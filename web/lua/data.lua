-- MapForge 1.0.0. Session-owned profiles; receipts and benefits share one atomic write.
local DS = game:GetService("DataStoreService")
local Run = game:GetService("RunService")
local Http = game:GetService("HttpService")
local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("MapForgeConfig"))
-- Roblox already isolates DataStores per experience. Keep purchases across map edits.
local storeOK, Store = pcall(function() return DS:GetDataStore(Run:IsStudio() and Config.StudioTestData ~= false and "MapForge_Studio_v1" or "MapForge_v1") end)
if not storeOK then Store = nil end
local owner = game.JobId ~= "" and game.JobId or Http:GenerateGUID(false)
local profiles = {}
local Data = {}
local function copy(t)
    if type(t) ~= "table" then return t end
    local out = {}
    for k, v in pairs(t) do out[k] = copy(v) end
    return out
end
local function defaults(t)
    t = type(t) == "table" and t or {}
    if t.RouteKey ~= Config.RouteKey then t.Checkpoint = 0 end
    t.RouteKey = Config.RouteKey
    t.Coins = math.max(0, tonumber(t.Coins) or 0)
    t.Checkpoint = math.clamp(tonumber(t.Checkpoint) or 0, 0, Config.StageCount)
    t.Wins = math.max(0, tonumber(t.Wins) or 0)
    t.BoostSeconds = math.max(0, tonumber(t.BoostSeconds) or 0)
    t.Trail = t.Trail == true
    local cosmetic=t.CosmeticStyle
    t.CosmeticStyle=(cosmetic=="aurora" or cosmetic=="solar" or cosmetic=="nebula") and cosmetic or "none"
    t.Receipts = type(t.Receipts) == "table" and t.Receipts or {}
    t.TycoonCash = math.max(0, tonumber(t.TycoonCash) or 0)
    t.TycoonBank = math.max(0, tonumber(t.TycoonBank) or 0)
    t.Gems = math.max(0, tonumber(t.Gems) or 0)
    t.TycoonBoost = math.max(0, tonumber(t.TycoonBoost) or 0)
    t.TycoonCalibrationSeconds = math.clamp(tonumber(t.TycoonCalibrationSeconds) or 0, 0, 120)
    t.TycoonCalibrationStep = math.clamp(math.floor(tonumber(t.TycoonCalibrationStep) or 0), 0, 2)
    t.TycoonCalibrationReadyAt = math.max(0, tonumber(t.TycoonCalibrationReadyAt) or 0)
    t.TycoonCalibrationLastAt = math.max(0, tonumber(t.TycoonCalibrationLastAt) or 0)
    t.TycoonRebirths = math.max(0, tonumber(t.TycoonRebirths) or 0)
    t.TycoonResearch = type(t.TycoonResearch) == "table" and t.TycoonResearch or {}
    for key, limit in pairs({efficiency=12, logistics=8, mastery=8}) do
        t.TycoonResearch[key] = math.clamp(math.floor(tonumber(t.TycoonResearch[key]) or 0), 0, limit)
    end
    t.TycoonOwned = type(t.TycoonOwned) == "table" and t.TycoonOwned or {}
    t.TycoonFirstCollect = t.TycoonFirstCollect == true
    t.TycoonContracts = type(t.TycoonContracts) == "table" and t.TycoonContracts or {}
    local contracts = t.TycoonContracts
    contracts.Day = math.floor(tonumber(contracts.Day) or -1)
    contracts.Completed = math.clamp(math.floor(tonumber(contracts.Completed) or 0), 0, 100)
    if type(contracts.Active) ~= "table" then contracts.Active = nil end
    t.TycoonMilestones = type(t.TycoonMilestones) == "table" and t.TycoonMilestones or {}
    -- Existing factories are excluded from the new onboarding cohort.
    if type(t.TycoonFunnelStage) ~= "number" then
        t.TycoonFunnelStage = (next(t.TycoonOwned) or t.TycoonRebirths > 0 or t.TycoonFirstCollect) and -1 or 0
    end
    t.TycoonFunnelStage = math.clamp(math.floor(t.TycoonFunnelStage), -1, 4)
    t.TycoonSkins = type(t.TycoonSkins) == "table" and t.TycoonSkins or {mint = true}
    t.TycoonSkin = type(t.TycoonSkin) == "string" and t.TycoonSkin or "mint"
    t.TycoonLastSeen = tonumber(t.TycoonLastSeen) or os.time()
    t.TycoonDaily = type(t.TycoonDaily) == "table" and t.TycoonDaily or {}
    -- Additive migration, deliberately independent of optional UI/modules and route resets.
    local raw=type(t.Workshop)=="table" and t.Workshop or {}
    local function bounded(v,limit)
        if type(v)~="number" or v~=v or v==math.huge or v==-math.huge then return 0 end
        return math.max(0,math.min(limit,math.floor(v)))
    end
    local w={Marks=bounded(raw.Marks,1e9),XP=bounded(raw.XP,1e9),Levels={},Claims={},Builds={}}
    for _,id in ipairs({"power","yield","focus"}) do w.Levels[id]=bounded(type(raw.Levels)=="table" and raw.Levels[id],5) end
    local seen={}
    if type(raw.Claims)=="table" then
        for i=math.max(1,#raw.Claims-63),#raw.Claims do
            local id=raw.Claims[i]
            if type(id)=="string" and #id>0 and #id<=160 and not seen[id] then seen[id]=true table.insert(w.Claims,id) end
        end
    end
    if type(raw.Builds)=="table" then for i=1,48 do local id=string.format("u%02d",i) if raw.Builds[id]==true then w.Builds[id]=true end end end
    t.Workshop=w
    return t
end
local function lock(p)
    while p.busy do task.wait() end
    p.busy = true
end
local function flushPending(player, p)
    local op = p.pending
    if not op then return true end
    local nextRecord = copy(op.data)
    nextRecord.LastWrite = op.id
    if op.release then nextRecord.Session = nil
    else nextRecord.Session = {Id = owner, Expires = os.time() + 180} end
    local ok, result = pcall(function()
        return Store:UpdateAsync(tostring(player.UserId), function(old)
            -- An earlier request may have committed even when its response was lost.
            if type(old) == "table" and old.LastWrite == op.id then
                if op.release or (old.Session and old.Session.Id == owner) then return old end
                return nil
            end
            if type(old) ~= "table" or not old.Session or old.Session.Id ~= owner then return nil end
            return nextRecord
        end)
    end)
    if not ok or not result then
        warn("[MapForge] DataStore save failed; purchases remain unacknowledged.")
        p.writeHealthy = false
        if not ok then return false end
        p.lost = true
        task.defer(function() player:Kick("Profil-Sitzung verloren. Bitte neu verbinden.") end)
        return false
    end
    p.writeHealthy = true
    p.data = defaults(result)
    p.pending = nil
    return true
end
local function commit(player, p, candidate, release)
    if p.demo then p.data = candidate return true end
    -- Keep exactly this operation pending after an ambiguous network failure.
    -- No later edits may overwrite it; retries reuse the same transaction identity.
    assert(not p.pending, "Resolve pending write first")
    p.pending = {id = Http:GenerateGUID(false), data = copy(candidate), release = release}
    return flushPending(player, p)
end
function Data.Open(player)
    if profiles[player] then return false end
    local demo = not Config.Persistence or (not Store and Run:IsStudio())
    if not Store and not demo then return false, "DATASTORE_UNAVAILABLE" end
    local record, busy
    if not demo then
        local ok, result = pcall(function()
            return Store:UpdateAsync(tostring(player.UserId), function(old)
                old = defaults(old)
                if old.Session and old.Session.Id ~= owner and (tonumber(old.Session.Expires) or 0) > os.time() then
                    busy = true
                    return nil
                end
                old.Session = {Id = owner, Expires = os.time() + 180}
                return old
            end)
        end)
        if ok and result then record = defaults(result)
        elseif not ok and Run:IsStudio() then
            demo = true
            warn("[MapForge] Studio DataStore unavailable: demo only, Robux purchases disabled.")
        else return false, busy and "SESSION_BUSY" or "DATASTORE_UNAVAILABLE" end
    end
    profiles[player] = {data = record or defaults({}), demo = demo, busy = false, closing = false, writeHealthy = true}
    return true
end
function Data.Read(player)
    local p = profiles[player]
    return p and p.data
end
function Data.CanPurchase(player)
    local p = profiles[player]
    return p ~= nil and not p.demo and not p.closing and not p.lost and p.writeHealthy
end
function Data.CanProgress(player)
    local p = profiles[player]
    return p ~= nil and not p.pending and not p.closing and not p.lost
end
function Data.Edit(player, transform, durable)
    local p = profiles[player]
    if not p then return false end
    lock(p)
    if p.closing or p.lost then p.busy = false return false end
    if p.pending then
        if not durable or not flushPending(player, p) then p.busy = false return false end
    end
    local candidate = copy(p.data)
    local ok, change = pcall(transform, candidate)
    if not ok then p.busy = false warn("[MapForge] Profile transform failed") return false end
    if change == false then p.busy = false return false end
    local saved = true
    if durable then saved = commit(player, p, candidate, false)
    else p.data = candidate end
    p.busy = false
    return saved
end
function Data.Save(player)
    local p = profiles[player]
    if not p then return false end
    lock(p)
    local ok = not p.closing and not p.lost and flushPending(player, p)
    if ok then ok = commit(player, p, p.data, false) end
    p.busy = false
    return ok
end
function Data.Receipt(player, purchaseId, kind)
    -- Never acknowledge even an existing receipt from an in-memory demo profile.
    local p = profiles[player]
    if not p or p.demo or p.closing or p.lost then return false end
    if type(purchaseId) ~= "string" or #purchaseId == 0 or #purchaseId > 200 then return false end
    return Data.Edit(player, function(d)
        if d.Receipts[purchaseId] then return end
        if kind == "Boost15" then d.BoostSeconds = d.BoostSeconds + 900
        elseif kind == "Coins500" then d.Coins = d.Coins + 500
        elseif kind == "TCashSmall" then d.TycoonCash = d.TycoonCash + 25000
        elseif kind == "TCashLarge" then d.TycoonCash = d.TycoonCash + 1000000
        elseif kind == "TGems100" then d.Gems = d.Gems + 100
        elseif kind == "TGems500" then d.Gems = d.Gems + 500
        elseif kind == "TBoost15" then d.TycoonBoost = d.TycoonBoost + 900
        elseif kind == "TBundle" then d.TycoonCash = d.TycoonCash + 250000 d.Gems = d.Gems + 250
        else error("Unknown product") end
        d.Receipts[purchaseId] = true
    end, true)
end
function Data.Close(player)
    local p = profiles[player]
    if not p then return end
    lock(p)
    if p.closing then p.busy = false return end
    p.closing = true
    if not p.lost then
        for attempt = 1, 3 do
            if flushPending(player, p) then break end
            task.wait(attempt)
        end
        if not p.pending and not p.lost then
            commit(player, p, p.data, true)
            for attempt = 1, 3 do
                if not p.pending or flushPending(player, p) then break end
                task.wait(attempt)
            end
        end
    end
    p.busy = false
    profiles[player] = nil
end
return Data
