-- Execute the actual event core, server and client with deterministic service doubles.
local E=assert(loadfile(EVENT_CORE_PATH))()
local pickIndex=0
local s=E.New(function(n) pickIndex=pickIndex+1 return (pickIndex*7)%n+1 end,0)
local previous=nil
for round=1,40 do
    assert(E.Advance(s,s.deadline) and s.phase=="warning" and s.round==round)
    assert(s.look~=previous,"no adjacent repeated event, including deck boundaries") previous=s.look
    assert(#s.order==8) local seen={}
    for i=1,4 do seen[s.order[i]]=true assert(s.order[i]==s.order[i+4]) if i>1 then assert(s.order[i]~=s.order[i-1]) end end
    for i=1,4 do assert(seen[i]) end
    assert(not E.Start(s,1,s.deadline-1))
    E.Advance(s,s.deadline) local now=s.deadline-160
    assert(E.Start(s,10,now)) assert(not E.Start(s,10,now))
    assert(not E.Hit(s,10,99,now+1,1)) assert(s.runs[10].step==0)
    local ok,why=E.Hit(s,10,s.order[1],now+.1,1) assert(not ok and why=="speed" and not s.runs[10])
    for id=1,7 do
        assert(E.Start(s,id,now))
        for i=1,8 do local good,kind,time=E.Hit(s,id,s.order[i],now+i*2,1) assert(good) if i==8 then assert(kind=="finish" and time==16) end end
        assert(not E.Hit(s,id,s.order[8],now+17,1),"duplicate finish ignored")
    end
    local top=E.Top(s) assert(#top==5 and top[1].id==1 and top[5].id==5)
    E.Remove(s,1) assert(not s.best[1] and E.Top(s)[1].id==2)
    assert(not E.Start(s,20,s.deadline-74.9))
    assert(E.Start(s,20,s.deadline-75))
    ok,why=E.Hit(s,20,s.order[1],s.deadline+.1,1) assert(not ok)
    E.Advance(s,s.deadline) assert(s.phase=="rest" and next(s.runs)==nil)
end
print("Event core: 40 rounds, shuffled decks, route parity, deadlines, duplicate finishes, best times and ties passed")

local function signal()
    local v={listeners={}}
    function v:Connect(fn) local c={fn=fn,active=true} function c:Disconnect() self.active=false end table.insert(self.listeners,c) return c end
    function v:Fire(...) for _,c in ipairs(self.listeners) do if c.active then c.fn(...) end end end
    return v
end
local methods={}
local function obj(class)
    return setmetatable({class=class,props={},children={},attributes={},signals={},Activated=signal(),Triggered=signal(),CharacterRemoving=signal(),CharacterAdded=signal(),OnServerEvent=signal(),OnClientEvent=signal(),Destroying=signal()}, {
        __index=function(t,k) return methods[k] or t.props[k] end,
        __newindex=function(t,k,v)
            if k=="Parent" then
                local p=t.props.Parent if p then for i,c in ipairs(p.children) do if c==t then table.remove(p.children,i) break end end end
                if v and v.children then table.insert(v.children,t) end
            end
            t.props[k]=v if t.signals[k] then t.signals[k]:Fire() end
        end,
    })
end
function methods:FindFirstChild(name) for _,v in ipairs(self.children) do if v.Name==name then return v end end end
function methods:WaitForChild(name) return assert(self:FindFirstChild(name),name) end
function methods:FindFirstChildWhichIsA(class) for _,v in ipairs(self.children) do if v.class==class then return v end end end
methods.FindFirstChildOfClass=methods.FindFirstChildWhichIsA
function methods:GetAttribute(name) return self.attributes[name] end
function methods:SetAttribute(name,v) self.attributes[name]=v end
function methods:GetPropertyChangedSignal(name) self.signals[name]=self.signals[name] or signal() return self.signals[name] end
function methods:Destroy() for i=#self.children,1,-1 do self.children[i]:Destroy() end self.Parent=nil self.destroyed=true end
function methods:FireClient(player,snapshot) self.messages=self.messages or {} self.messages[player]=snapshot end
function methods:FireServer(...) self.sent={...} end
function methods:Clear() self.cleared=true end
local vec
local vectorMT={__sub=function(a,b) return vec(a.X-b.X,a.Y-b.Y,a.Z-b.Z) end,__add=function(a,b) return vec(a.X+b.X,a.Y+b.Y,a.Z+b.Z) end,__index=function(t,k) if k=="Magnitude" then return math.sqrt(t.X*t.X+t.Y*t.Y+t.Z*t.Z) end end}
vec=function(x,y,z) return setmetatable({X=x,Y=y,Z=z},vectorMT) end
local function child(parent,class,name,pos) local p=obj(class) p.Name=name p.Position=pos p.Parent=parent return p end
local function boot(mode,gameType,grind)
    local now=0 local players=obj("Players") local pg=obj("PlayerGui") local rs=obj("ReplicatedStorage") local run={Heartbeat=signal()} local lighting=obj("Lighting")
    players.PlayerAdded=signal() players.PlayerRemoving=signal()
    local p=obj("Player") p.Name="Alice" p.UserId=10 p.DisplayName="Alice" p.Parent=players
    function players:GetPlayers() return p.Parent and {p} or {} end
    function players:GetPlayerByUserId(id) if id==p.UserId and p.Parent then return p end end
    function p:RequestStreamAroundAsync() if p.pauseStream then coroutine.yield("stream") end end
    local char=obj("Model") p.Character=char
    local root=child(char,"Part","HumanoidRootPart",vec(0,4,0)) local hum=child(char,"Humanoid","Humanoid") hum.Health=100
    function char:PivotTo(frame) root.Position=frame end
    pg.Name="PlayerGui" pg.Parent=p
    local world=obj("Model") world.Name="MapForgeWorld"
    local ws=obj("Workspace") world.Parent=ws ws.CurrentCamera=obj("Camera")
    local spawn=child(world,"Folder","spawn") child(spawn,"SpawnLocation","StartSpawn",vec(0,0,0))
    local arena=child(world,"Folder","event")
    local start=child(arena,"Part","RallyStart",vec(0,0,0))
    child(arena,"Part","RallyPortal",vec(0,0,0)) child(arena,"Part","RallyReturn",vec(0,0,32))
    local points={vec(-24,1,-24),vec(24,1,-24),vec(24,1,24),vec(-24,1,24)}
    for i=1,4 do child(arena,"Part","RallySignal"..i,points[i]) end
    local config={Events={Mode=mode},WalkSpeed=16,Movement={SprintSpeed=24},Minigame=gameType,Grind={Enabled=grind==true}}
    local cfg=child(rs,"ModuleScript","MapForgeConfig") cfg.module=config
    local scriptObject=obj("Script") local service=obj("ServerScriptService") scriptObject.Parent=service
    local core=child(service,"ModuleScript","MapForgeEventCore") core.module=E
    local awards={}
    local workshop=child(service,"ModuleScript","MapForgeWorkshop") workshop.module={Award=function(player,key,marks,xp) table.insert(awards,{player=player,key=key,marks=marks,xp=xp}) return true end}
    local guiService=obj("GuiService") guiService.ReducedMotionEnabled=false
    local tween={count=0} function tween:Create(target,_,props) self.count=self.count+1 return {Play=function() for k,v in pairs(props) do target[k]=v end end,Cancel=function() end} end
    local services={Players=players,ReplicatedStorage=rs,RunService=run,Lighting=lighting,TweenService=tween,GuiService=guiService,HttpService={GenerateGUID=function() return "TEST-SESSION" end}}
    local enum=setmetatable({}, {__index=function(t,k) local v=setmetatable({}, {__index=function(_,name) return k.."."..name end}) rawset(t,k,v) return v end})
    local env=setmetatable({game={GetService=function(_,name) return assert(services[name],name) end},workspace=ws,script=scriptObject,
        Instance={new=obj},Random={new=function() return {NextInteger=function(_,a,b) return b end} end},Vector3={new=vec},Vector2={new=function(x,y) return {X=x,Y=y} end},
        UDim={new=function(...) return {...} end},UDim2={new=function(...) return {...} end,fromOffset=function(x,y) return {0,x,0,y} end,fromScale=function(x,y) return {x,0,y,0} end},
        Color3={new=function(...) return {...} end,fromRGB=function(...) return {...} end},ColorSequence={new=function(x) return x end},NumberRange={new=function(...) return {...} end},NumberSequence={new=function(x) return x end},TweenInfo={new=function(...) return {...} end},CFrame={new=function(v) return v end},Enum=enum,
        require=function(module) return assert(module.module) end,os={clock=function() return now end},task={spawn=function(fn) fn() end},warn=function() end}, {__index=_G})
    assert(loadfile(EVENT_SERVER_PATH,'t',env))()
    local remote=rs:FindFirstChild("MapForgeEvents") players.LocalPlayer=p
    assert(loadfile(EVENT_CLIENT_PATH,'t',env))()
    local function advance(seconds) now=now+seconds run.Heartbeat:Fire(seconds) end
    local function press(name) arena:WaitForChild(name):WaitForChild("MapForgeRallyPrompt").Triggered:Fire(p) end
    return {p=p,players=players,rs=rs,run=run,remote=remote,root=root,hum=hum,arena=arena,start=start,points=points,pg=pg,gui=guiService,lighting=lighting,camera=ws.CurrentCamera,tween=tween,script=scriptObject,advance=advance,press=press,awards=awards}
end
for _,mode in ipairs({"rally","ambient","off"}) do
    local t=boot(mode)
    if mode=="off" then assert(not t.remote and #t.pg.children==0)
    else
        assert(t.remote and t.remote.sent[1]=="sync")
        t.advance(1) local state=t.remote.messages[t.p] assert(state.Phase=="warning")
        t.remote.OnClientEvent:Fire(state)
        local gui=t.pg:WaitForChild("MapForgeEventHUD") local chip=gui:WaitForChild("MapForgeEventToggle") local panel=gui:WaitForChild("MapForgeEventPanel")
        assert(panel.Visible==false and panel.ZIndex>(chip.ZIndex or 1),"panel must stay above chip in short landscape") chip.Activated:Fire() assert(panel.Visible)
        for _,size in ipairs({{390,760},{844,350},{1280,720}}) do gui.AbsoluteSize={X=size[1],Y=size[2]} assert(panel.Size[2]<=size[1]-24 and panel.Size[4]<=size[2]-24) end
        t.advance(20) state=t.remote.messages[t.p] assert(state.Phase=="active") t.remote.OnClientEvent:Fire(state)
        local grade=t.lighting:WaitForChild("MapForgeEventTint") local cloud=t.camera:WaitForChild("MapForgeEventMotes") local motes=cloud:WaitForChild("EventMotes")
        assert(grade.Enabled and motes.Enabled)
        t.gui.ReducedMotionEnabled=true assert(not motes.Enabled and grade.Enabled)
        t.gui.ReducedMotionEnabled=false assert(motes.Enabled)
        local scroll=panel:WaitForChild("MapForgeEventScroll") local effectButton
        for _,o in ipairs(scroll.children) do if o.class=="TextButton" and o.Text=="Lichteffekte: an" then effectButton=o end end
        assert(effectButton) effectButton.Activated:Fire() assert(not grade.Enabled and not motes.Enabled) effectButton.Activated:Fire() assert(grade.Enabled)
        if mode=="rally" then
            t.root.Position=vec(100,0,0) t.press("RallyPortal") assert(not t.p:GetAttribute("MapForgeInArena"),"forged far prompt refused")
            t.advance(1) t.root.Position=vec(0,4,0) t.press("RallyPortal") assert(t.p:GetAttribute("MapForgeInArena"))
            t.advance(3) t.press("RallyStart") state=t.remote.messages[t.p] assert(state.Running and state.Step==0)
            t.remote.OnServerEvent:Fire(t.p,"finish",.01) assert(t.remote.messages[t.p].Best==nil)
            local order=state.Order
            for i=1,8 do t.advance(4) t.root.Position=t.points[order[i]] t.press("RallySignal"..order[i]) end
            state=t.remote.messages[t.p] assert(not state.Running and state.Best==32 and #state.Leaders==1)
            t.remote.OnClientEvent:Fire(state) assert(string.find(chip.Text,"s"))
            t.advance(4) t.root.Position=vec(0,4,0) t.press("RallyStart") assert(t.remote.messages[t.p].Running)
            t.p.CharacterRemoving:Fire() assert(not t.remote.messages[t.p].Running and not t.p:GetAttribute("MapForgeInArena"))
            t.advance(3) t.root.Position=vec(0,4,0) t.press("RallyPortal") t.advance(3) t.press("RallyStart")
            t.root.Position=vec(100,4,0) t.advance(1) assert(not t.remote.messages[t.p].Running)
            t.advance(3) t.root.Position=vec(0,4,0) t.press("RallyStart")
            t.advance(.3) t.root.Position=t.points[order[1]] t.press("RallySignal"..order[1]) assert(not t.remote.messages[t.p].Running,"impossibly fast leg cancelled")
            t.advance(3) t.root.Position=vec(0,4,0) t.press("RallyStart") t.hum.Health=0 t.advance(1) assert(not t.remote.messages[t.p].Running)
        else assert(not t.start:FindFirstChild("MapForgeRallyPrompt")) end
        t.advance(200) t.remote.OnClientEvent:Fire(t.remote.messages[t.p]) assert(not grade.Enabled and not motes.Enabled)
        t.script.Destroying:Fire() assert(gui.destroyed and grade.destroyed and cloud.destroyed)
        t.players.PlayerRemoving:Fire(t.p)
    end
end
print("Actual event server/client: remote forgery, proximity, route, times, respawn, bounds, death, modes, UI resize, reduced motion, FX toggle and cleanup passed (service doubles)")

local transit=boot("rally") transit.advance(1) transit.advance(20)
transit.root.Position=vec(0,4,0) transit.press("RallyPortal") transit.advance(3)
transit.root.Position=vec(0,0,32) transit.p.pauseStream=true
local leaving=coroutine.create(function() transit.press("RallyReturn") end)
assert(coroutine.resume(leaving)) assert(coroutine.status(leaving)=="suspended")
transit.root.Position=vec(0,4,0) transit.advance(1) transit.press("RallyStart") assert(not transit.remote.messages[transit.p].Running,"no new run while leaving teleport yields")
transit.p.pauseStream=false assert(coroutine.resume(leaving)) assert(not transit.p:GetAttribute("MapForgeInArena"))
transit.script.Destroying:Fire()
print("Event regression: pending streaming teleport blocks new starts; modal stays above chip")

for _,gameType in ipairs({"signal","memory","collect"}) do
 local t=boot("rally",gameType,true) t.advance(1) t.advance(20)
 t.root.Position=vec(0,4,0) t.press("RallyPortal") t.advance(3) t.press("RallyStart")
 local initial=t.remote.messages[t.p] local order=initial.Order local total=gameType=="memory" and 6 or 8
 assert(initial.Game==gameType and initial.Total==total and initial.Running)
 if gameType=="memory" then
  assert(initial.Preview==6 and #order==6)
  local panel=t.pg:WaitForChild("MapForgeEventHUD"):WaitForChild("MapForgeEventPanel")
  t.remote.OnClientEvent:Fire(initial) assert(panel.Visible,"the preview must open immediately")
  t.advance(6) local hidden=t.remote.messages[t.p] assert(hidden.Preview==0 and #hidden.Order==0,"no hidden route or next-signal leak")
  t.remote.OnClientEvent:Fire(hidden)
 end
 for i=1,total do
  local index=gameType=="collect" and ({2,4,1,3})[(i-1)%4+1] or order[i]
  t.advance(4) t.root.Position=t.points[index] t.press("RallySignal"..index)
 end
 local done=t.remote.messages[t.p] assert(not done.Running and done.Best==total*4)
 assert(#t.awards==1 and t.awards[1].marks==(total*4<30 and 7 or 6) and t.awards[1].xp==10)
 local oldKey=t.awards[1].key
 t.remote.OnServerEvent:Fire(t.p,"award",1000000) assert(#t.awards==1)
 t.advance(4) t.root.Position=vec(0,4,0) t.press("RallyStart")
 if gameType=="memory" then t.advance(6) end
 for i=1,total do local index=gameType=="collect" and ({2,4,1,3})[(i-1)%4+1] or order[i] t.advance(4) t.root.Position=t.points[index] t.press("RallySignal"..index) end
 assert(not t.remote.messages[t.p].Running and #t.awards==1,"repeat valid finishes cannot mint another round award")
 t.advance(200) t.advance(60) t.advance(20) t.advance(4) t.root.Position=vec(0,4,0) t.press("RallyStart")
 local nextRun=t.remote.messages[t.p] assert(nextRun.Running)
 order=nextRun.Order if gameType=="memory" then t.advance(6) end
 for i=1,total do local index=gameType=="collect" and ({2,4,1,3})[(i-1)%4+1] or order[i] t.advance(4) t.root.Position=t.points[index] t.press("RallySignal"..index) end
 assert(#t.awards==2 and t.awards[2].key~=oldKey,"next server round may grant one new award")
 t.script.Destroying:Fire()
end
print("Actual minigame server/client: hidden memory, auto-open preview, three rule sets, once-per-round server rewards and next-round renewal passed (service doubles)")
