-- MapForge: deterministic round state and server-owned race results; no DataStore or economy.
local E = {}
E.Warning, E.Active, E.Rest, E.Limit = 20, 160, 60, 75
function E.New(pick, now, game)
    return {pick=pick, phase="rest", deadline=now, round=0, deck={}, last=nil, runs={}, best={}, order={}, rewarded={}, game=(game=="memory" or game=="collect") and game or "signal"}
end
local function shuffle(items, pick)
    for i=#items,2,-1 do local j=pick(i) items[i],items[j]=items[j],items[i] end
    return items
end
function E.Advance(s, now)
    if now < s.deadline then return false end
    if s.phase == "rest" then
        if #s.deck == 0 then
            s.deck=shuffle({1,2,3},s.pick)
            if s.deck[#s.deck] == s.last then s.deck[1],s.deck[#s.deck]=s.deck[#s.deck],s.deck[1] end
        end
        s.look=table.remove(s.deck) s.last=s.look s.round=s.round+1
        s.phase="warning" s.deadline=now+E.Warning s.runs={} s.best={} s.rewarded={}
        local route=shuffle({1,2,3,4},s.pick) s.order={}
        for _=1,2 do for _,id in ipairs(route) do table.insert(s.order,id) end end
        if s.game=="memory" then while #s.order>6 do table.remove(s.order) end end
    elseif s.phase == "warning" then s.phase="active" s.deadline=now+E.Active
    else s.phase="rest" s.deadline=now+E.Rest s.runs={} end
    return true
end
function E.Start(s, id, now)
    local preview=s.game=="memory" and 6 or 0
    if s.phase ~= "active" or s.deadline-now < E.Limit+preview then return false,"wait" end
    if s.runs[id] then return false,"running" end
    s.runs[id]={started=now+preview,last=now,previewUntil=now+preview,step=0,lastSignal=nil,visited={}} return true
end
function E.Hit(s,id,checkpoint,now,minimum)
    local run=s.runs[id]
    if not run or s.phase~="active" or now>=s.deadline then return false,"inactive" end
    if now<run.previewUntil then return false,"preview" end
    if now-run.started > E.Limit then s.runs[id]=nil return false,"expired" end
    if type(checkpoint)~="number" or checkpoint%1~=0 or checkpoint<1 or checkpoint>4 then return false,"order" end
    if s.game=="collect" then
        if checkpoint==run.lastSignal then return false,"repeat" end
        if run.visited[checkpoint] then return false,"visited" end
    elseif checkpoint~=s.order[run.step+1] then
        if s.game=="memory" then s.runs[id]=nil return false,"memory" end
        return false,"order"
    end
    if now-run.last < math.max(.25,minimum or 0) then s.runs[id]=nil return false,"speed" end
    run.step=run.step+1 run.last=now run.lastSignal=checkpoint
    if s.game=="collect" then run.visited[checkpoint]=true if run.step%4==0 then run.visited={} end end
    if run.step==#s.order then
        local elapsed=math.floor((now-run.started)*1000+.5)/1000
        s.runs[id]=nil
        if not s.best[id] or elapsed<s.best[id] then s.best[id]=elapsed end
        return true,"finish",elapsed
    end
    return true,"checkpoint"
end
function E.Top(s)
    local rows={} for id,time in pairs(s.best) do table.insert(rows,{id=id,time=time}) end
    table.sort(rows,function(a,b) return a.time==b.time and a.id<b.id or a.time<b.time end)
    while #rows>5 do table.remove(rows) end return rows
end
function E.Remove(s,id) s.runs[id]=nil s.best[id]=nil end
return E
