local byId = {}
for _, u in ipairs(E.Upgrades) do byId[u.Id] = u end
local workshopEnabled=false
function E.SetWorkshop(enabled) workshopEnabled=enabled==true end
local function workshopLevel(d,id)
    local w=d.Workshop local n=type(w)=="table" and type(w.Levels)=="table" and w.Levels[id]
    if type(n)~="number" or n~=n or n==math.huge or n==-math.huge then return 0 end
    return math.clamp(math.floor(n),0,5)
end
function E.Day(d, now)
    local day = math.floor(now / 86400)
    if d.TycoonDaily.Day ~= day then d.TycoonDaily = {Day = day, Buys = 0, Seconds = 0, Collected = 0, Claims = {}} end
    return d.TycoonDaily
end
function E.Count(d)
    local n = 0 for _, u in ipairs(E.Upgrades) do if d.TycoonOwned[u.Id] then n = n + 1 end end return n
end
function E.Income(d, flags)
    local n = 0
    for _, u in ipairs(E.Upgrades) do if d.TycoonOwned[u.Id] then n = n + u.Income end end
    local levels = d.TycoonResearch or {}
    local factor = (1 + math.min(100, d.TycoonRebirths) * 0.2) * (1 + math.clamp(levels.efficiency or 0, 0, 12) * 0.05)
    if (d.TycoonCalibrationSeconds or 0) > 0 then factor = factor * E.Calibration.BonusFactor end
    flags = flags or {}
    if flags.DoubleIncome then factor = factor * 2 end
    if flags.VIP then factor = factor * 1.25 end
    if d.TycoonBoost > 0 then factor = factor * 2 end
    if workshopEnabled then factor=factor*(1+.04*workshopLevel(d,"power")) end
    return n * factor
end
function E.BuildCost(u, factor)
    return math.floor(u.Cost * math.clamp(tonumber(factor) or 1, 0.5, 2) + 0.5)
end
function E.Next(d, factor)
    for _, u in ipairs(E.Upgrades) do
        if not d.TycoonOwned[u.Id] and (not u.Requires or d.TycoonOwned[u.Requires]) then
            return {Id=u.Id, Name=u.Name, Cost=E.BuildCost(u, factor), Income=u.Income, Requires=u.Requires}
        end
    end
    return nil
end
function E.Buy(d, id, now, factor)
    local u = byId[id]
    if not u or d.TycoonOwned[id] or (u.Requires and not d.TycoonOwned[u.Requires]) then return false end
    local cost = E.BuildCost(u, factor)
    if d.TycoonCash < cost then return false end
    d.TycoonCash = d.TycoonCash - cost d.TycoonOwned[id] = true
    if workshopEnabled then
        -- Machine milestones survive rebirth; repeated factory construction grants no second mark.
        d.Workshop=type(d.Workshop)=="table" and d.Workshop or {Marks=0,XP=0,Levels={power=0,yield=0,focus=0},Claims={}}
        local w=d.Workshop w.Builds=type(w.Builds)=="table" and w.Builds or {}
        if not w.Builds[id] then
            w.Builds[id]=true w.Marks=math.min(1e9,(w.Marks or 0)+1) w.XP=math.min(1e9,(w.XP or 0)+2)
        end
    end
    E.AdvanceContract(d, "build", 1)
    local daily = E.Day(d, now) daily.Buys = daily.Buys + 1
    d.TycoonMilestones = d.TycoonMilestones or {}
    for _, milestone in ipairs(E.Milestones) do
        if E.Count(d) >= milestone.Count and not d.TycoonMilestones[milestone.Id] then
            d.TycoonMilestones[milestone.Id] = true d.Gems = d.Gems + milestone.Reward
        end
    end
    return true
end
function E.Tick(d, seconds, flags, now)
    seconds = math.clamp(seconds, 0, 10)
    local calibrated = math.min(seconds, d.TycoonCalibrationSeconds or 0)
    local rate = E.Income(d, flags)
    local earned = (d.TycoonCalibrationSeconds or 0) > 0 and rate * calibrated + rate / E.Calibration.BonusFactor * (seconds - calibrated) or rate * seconds
    d.TycoonBank = math.min(1e15, d.TycoonBank + earned)
    d.TycoonBoost = math.max(0, d.TycoonBoost - seconds)
    d.TycoonCalibrationSeconds = math.max(0, (d.TycoonCalibrationSeconds or 0) - seconds)
    d.TycoonLastSeen = now
    local daily = E.Day(d, now) daily.Seconds = daily.Seconds + seconds
    if flags.AutoCollect then E.Collect(d, now) end
end
function E.Collect(d, now)
    local amount = d.TycoonBank
    if amount > 0 then d.TycoonFirstCollect = true end
    d.TycoonCash = math.min(1e15, d.TycoonCash + amount) d.TycoonBank = 0
    local daily = E.Day(d, now) daily.Collected = daily.Collected + amount
    E.AdvanceContract(d, "collect", amount)
    return amount
end
function E.Offline(d, now)
    local elapsed = math.clamp(now - d.TycoonLastSeen, 0, 7200 + math.clamp((d.TycoonResearch or {}).logistics or 0, 0, 8) * 1800)
    -- Offline earnings use base production and rebirths; no paid multipliers or time consumption.
    local boost, calibration = d.TycoonBoost, d.TycoonCalibrationSeconds d.TycoonBoost = 0 d.TycoonCalibrationSeconds = 0
    local amount = math.floor(E.Income(d, {}) * elapsed * 0.2)
    d.TycoonBoost = boost d.TycoonCalibrationSeconds = calibration d.TycoonBank = math.min(1e15, d.TycoonBank + amount) d.TycoonLastSeen = now
    E.Day(d, now)
    return amount
end
function E.CalibrationStatus(d, now)
    local step = math.clamp(math.floor(tonumber(d.TycoonCalibrationStep) or 0), 0, E.Calibration.Stations - 1)
    return {Step=step, Next=step+1, Cooldown=math.max(0, (d.TycoonCalibrationReadyAt or 0)-now), Bonus=d.TycoonCalibrationSeconds or 0, Available=E.Count(d)>=E.Calibration.MinimumBuilds}
end
function E.Calibrate(d, station, now)
    local status = E.CalibrationStatus(d, now)
    if not status.Available or status.Cooldown>0 or station~=status.Next then return false end
    if now-(d.TycoonCalibrationLastAt or 0)<E.Calibration.MinimumInterval then return false end
    if status.Next==E.Calibration.Stations then
        d.TycoonCalibrationStep = 0 d.TycoonCalibrationReadyAt = now+E.Calibration.Cooldown d.TycoonCalibrationSeconds = E.Calibration.BonusSeconds
    else d.TycoonCalibrationStep = status.Next end
    d.TycoonCalibrationLastAt=now
    return true
end
function E.Rebirth(d)
    if E.Count(d) < #E.Upgrades then return false end
    d.TycoonCash = 0 d.TycoonBank = 0 d.TycoonOwned = {}
    d.TycoonRebirths = d.TycoonRebirths + 1 d.Gems = d.Gems + 25 + math.clamp((d.TycoonResearch or {}).mastery or 0, 0, 8) * 5
    return true
end
function E.Claim(d, id, now)
    local daily = E.Day(d, now)
    if daily.Claims[id] then return false end
    for _, q in ipairs(E.Quests) do
        if q.Id == id and (daily[q.Field] or 0) >= q.Target then
            daily.Claims[id] = true d.Gems = d.Gems + q.Reward return true
        end
    end
    return false
end
function E.Skin(d, id)
    for _, skin in ipairs(E.Skins) do
        if skin.Id == id then
            if not d.TycoonSkins[id] then
                if d.Gems < skin.Cost then return false end
                d.Gems = d.Gems - skin.Cost d.TycoonSkins[id] = true
            end
            d.TycoonSkin = id return true
        end
    end
    return false
end
function E.Study(d, id)
    d.TycoonResearch = d.TycoonResearch or {}
    for _, r in ipairs(E.ResearchTracks) do
        if r.Id == id then
            local level = math.clamp(math.floor(d.TycoonResearch[id] or 0), 0, r.Max)
            if level >= r.Max then return false end
            local cost = math.floor(r.Base * r.Growth ^ level)
            if d.TycoonCash < cost then return false end
            d.TycoonCash = d.TycoonCash - cost d.TycoonResearch[id] = level + 1
            E.AdvanceContract(d, "research", 1) return true
        end
    end
    return false
end
local function contractDefinition(id)
    for _, c in ipairs(E.Contracts) do if c.Id == id then return c end end
end
function E.ValidContract(active)
    if type(active) ~= "table" then return false end
    local c = contractDefinition(active.Id)
    if not c or type(active.Target) ~= "number" or type(active.Progress) ~= "number" then return false end
    local target = active.Target
    if target ~= target or active.Progress ~= active.Progress or target ~= math.floor(target) or active.Progress < 0 or active.Progress > target then return false end
    if c.Id == "build" then return target >= 1 and target <= c.Target and active.Reward == math.floor(c.Reward * target / c.Target) end
    return active.Reward == c.Reward and ((c.Id == "research" and target == 1) or (c.Id == "collect" and target >= 100 and target <= 1e15))
end
function E.ContractChoices(d, flags)
    local result, count = {}, E.Count(d)
    for _, c in ipairs(E.Contracts) do
        local target, reward, available = c.Target, c.Reward, count >= 3
        if c.Id == "build" then target = math.min(c.Target, #E.Upgrades - count) reward = math.floor(c.Reward * target / c.Target) available = available and target > 0
        elseif c.Id == "research" then
            local remaining = false
            for _, r in ipairs(E.ResearchTracks) do if ((d.TycoonResearch or {})[r.Id] or 0) < r.Max then remaining = true end end
            available = available and remaining
        elseif c.Id == "collect" then
            local rate = E.Income(d, flags or {})
            target = math.min(1e15, math.max(100, math.ceil(rate * c.Target))) available = available and rate > 0
        end
        table.insert(result, {Id=c.Id, Name=c.Name, Target=target, Reward=reward, Available=available})
    end
    return result
end
local function contractRecord(d, now)
    d.TycoonContracts = d.TycoonContracts or {Day=-1, Completed=0}
    local record = d.TycoonContracts local day = math.floor(now / 86400)
    if record.Day ~= day then record.Day = day record.Completed = 0 end
    return record
end
function E.ContractStatus(d, now, flags)
    local record = d.TycoonContracts or {}
    return {Limit=E.ContractLimit, Completed=record.Day == math.floor(now / 86400) and (record.Completed or 0) or 0, Active=E.ValidContract(record.Active) and record.Active or nil, Choices=E.ContractChoices(d, flags)}
end
function E.StartContract(d, id, now, flags)
    local record = contractRecord(d, now)
    if E.ValidContract(record.Active) or record.Completed >= E.ContractLimit then return false end
    for _, c in ipairs(E.ContractChoices(d, flags)) do
        if c.Id == id and c.Available then record.Active = {Id=c.Id, Target=c.Target, Progress=0, Reward=c.Reward} return true end
    end
    return false
end
function E.AdvanceContract(d, metric, amount)
    local active = d.TycoonContracts and d.TycoonContracts.Active
    if not E.ValidContract(active) then return end
    local definition = contractDefinition(active.Id)
    if definition.Metric == metric then active.Progress = math.min(active.Target, active.Progress + math.max(0, amount)) end
end
function E.ClaimContract(d, now)
    local record = contractRecord(d, now) local active = record.Active
    if not E.ValidContract(active) or active.Progress < active.Target or record.Completed >= E.ContractLimit then return false end
    d.Gems = d.Gems + active.Reward record.Completed = record.Completed + 1 record.Active = nil return true
end
function E.CancelContract(d)
    local record = d.TycoonContracts local active = record and record.Active
    if not E.ValidContract(active) or active.Progress >= active.Target then return false end
    record.Active = nil return true
end
-- Recommendations do not create receipts, grant benefits, or open purchases.
function E.NextOnboardingStage(d)
    local current = d.TycoonFunnelStage or -1
    if current < 0 or current >= 4 then return nil end
    local nextStep = current + 1
    if nextStep == 1 or (nextStep == 2 and d.TycoonOwned.u01) or (nextStep == 3 and d.TycoonFirstCollect) or (nextStep == 4 and E.Count(d) >= 5) then return nextStep end
    return nil
end
function E.Recommend(config, d, session)
    local result = {}
    if not config.ShopEnabled or config.ShopHints == false or not config.Persistence or not E.Next(d) then return result end
    local count, income = E.Count(d), E.Income(d, session.flags)
    for _, rule in ipairs(E.OfferRules) do
        local id = (rule.Pass and config.Passes or config.Products)[rule.Key] or 0
        local eligible = id > 0 and count >= rule.Builds and (session.seconds or 0) >= math.max(config.ShopHintDelay or 180, rule.Seconds) and (session.collects or 0) >= rule.Collects
        if rule.Pass and (session.flags or {})[rule.Key] then eligible = false end
        if rule.Design and not session.designInterest then eligible = false end
        if config.ShopFocus == "designs" and not rule.Design then eligible = false end
        if rule.Key == "TBoost15" and d.TycoonBoost > 0 then eligible = false end
        if rule.Cash > 0 then
            local equivalent = income > 0 and rule.Cash / income or 0
            if equivalent < 30 or equivalent > 1800 then eligible = false end
        end
        if eligible then table.insert(result, rule.Key) end
    end
    return result
end
return E
