-- MapForge: persistent workshop progression. Pure Lua; no client-supplied rewards or movement modifiers.
local W={Costs={5,10,18,30,45},Ids={"power","yield","focus"}}
local function integer(v,limit)
    if type(v)~="number" or v~=v or v==math.huge or v==-math.huge then return 0 end
    return math.max(0,math.min(limit,math.floor(v)))
end
local function key(v) return type(v)=="string" and #v>0 and #v<=160 end
function W.Clean(raw)
    raw=type(raw)=="table" and raw or {}
    local out={Marks=integer(raw.Marks,1e9),XP=integer(raw.XP,1e9),Levels={},Claims={},Builds={}}
    for _,id in ipairs(W.Ids) do out.Levels[id]=integer(type(raw.Levels)=="table" and raw.Levels[id],5) end
    local seen={}
    if type(raw.Claims)=="table" then
        for i=math.max(1,#raw.Claims-63),#raw.Claims do
            local id=raw.Claims[i]
            if key(id) and not seen[id] then seen[id]=true table.insert(out.Claims,id) end
            if #out.Claims>64 then seen[table.remove(out.Claims,1)]=nil end
        end
    end
    if type(raw.Builds)=="table" then
        for i=1,48 do local id=string.format("u%02d",i) if raw.Builds[id]==true then out.Builds[id]=true end end
    end
    return out
end
function W.Levels(d) return W.Clean(d.Workshop).Levels end
function W.HasClaim(d,id)
    for _,old in ipairs(W.Clean(d.Workshop).Claims) do if old==id then return true end end return false
end
function W.Award(d,id,marks,xp)
    if not key(id) or type(marks)~="number" or type(xp)~="number" or marks~=integer(marks,1000) or xp~=integer(xp,1000) then return false end
    local w=W.Clean(d.Workshop)
    for _,old in ipairs(w.Claims) do if old==id then return false end end
    w.Marks=math.min(1e9,w.Marks+marks) w.XP=math.min(1e9,w.XP+xp)
    table.insert(w.Claims,id) if #w.Claims>64 then table.remove(w.Claims,1) end
    d.Workshop=w return true
end
function W.Build(d,id)
    local n=type(id)=="string" and tonumber(string.match(id,"^u(%d%d)$")) or nil
    if not n or n<1 or n>48 then return false end
    local w=W.Clean(d.Workshop) if w.Builds[id] then return false end
    w.Builds[id]=true w.Marks=math.min(1e9,w.Marks+1) w.XP=math.min(1e9,w.XP+2) d.Workshop=w return true
end
function W.Buy(d,id)
    if id~="power" and id~="yield" and id~="focus" then return false end
    local w=W.Clean(d.Workshop) local level=w.Levels[id] local cost=W.Costs[level+1]
    if not cost or w.Marks<cost then return false end
    w.Marks=w.Marks-cost w.Levels[id]=level+1 d.Workshop=w return true
end
function W.IncomeFactor(d) return 1+.04*W.Levels(d).power end
function W.Coin(d,base) return base+W.Levels(d).yield end
function W.FinishCoins(d) return 50+5*W.Levels(d).focus end
function W.Snapshot(d,mode)
    local w=W.Clean(d.Workshop) local branches={}
    for _,id in ipairs(W.Ids) do
        local level=w.Levels[id]
        table.insert(branches,{Id=id,Level=level,Cost=W.Costs[level+1],Max=level==5,
            Available=(id=="power" and mode=="tycoon") or (id~="power" and mode~="tycoon")})
    end
    return {Marks=w.Marks,XP=w.XP,Rank=math.min(999,math.floor(w.XP/100)+1),RankXP=w.XP%100,Branches=branches,Mode=mode}
end
return W
