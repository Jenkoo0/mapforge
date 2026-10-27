-- Real workshop modules + real profile transactions; deterministic Roblox service doubles.
math.clamp=function(n,a,b) return math.max(a,math.min(b,n)) end
local W=assert(loadfile(WORKSHOP_CORE_PATH))()
local cleaned=W.Clean({Marks=0/0,XP=math.huge,Levels={power=-9,yield=99,focus="4"},Claims={"one","one",false},Builds={u01=true,u48=true,u49=true}})
assert(cleaned.Marks==0 and cleaned.XP==0 and cleaned.Levels.power==0 and cleaned.Levels.yield==5 and cleaned.Levels.focus==0)
assert(#cleaned.Claims==1 and cleaned.Builds.u01 and cleaned.Builds.u48 and not cleaned.Builds.u49)
local d={}
assert(not W.Award(d,{},1,2) and not W.Award(d,"nan",0/0,2) and not W.Award(d,"negative",-1,2) and not W.Award(d,"fraction",.5,2))
assert(W.Award(d,"first",8,10) and not W.Award(d,"first",8,10))
assert(W.Buy(d,"power") and d.Workshop.Marks==3 and d.Workshop.Levels.power==1)
assert(not W.Buy(d,"bad") and not W.Buy(d,"power"))
assert(math.abs(W.IncomeFactor(d)-1.04)<1e-9 and W.Coin(d,5)==5 and W.FinishCoins(d)==50)
for i=1,80 do assert(W.Award(d,"claim"..i,1,2)) end assert(#d.Workshop.Claims==64)
d.Workshop.Marks=1000
for _,id in ipairs(W.Ids) do while W.Buy(d,id) do end assert(d.Workshop.Levels[id]==5 and not W.Buy(d,id)) end
assert(W.Coin(d,5)==10 and W.Coin(d,10)==15 and W.FinishCoins(d)==75 and W.IncomeFactor(d)==1.2)
assert(W.Build(d,"u01") and not W.Build(d,"u01") and W.Build(d,"u48") and not W.Build(d,"u00"))
local snap=W.Snapshot({Workshop={XP=1e9}},"obby") assert(snap.Rank==999 and not snap.Branches[1].Available and snap.Branches[2].Available)

local function signal()
    local s={listeners={}} function s:Connect(f) table.insert(self.listeners,f) return {Disconnect=function() end} end
    function s:Fire(...) for _,f in ipairs(self.listeners) do f(...) end end return s
end
local methods={}
local function obj(class)
    return setmetatable({class=class,props={},children={},signals={},Activated=signal(),OnServerEvent=signal(),OnClientEvent=signal(),PlayerRemoving=signal(),Heartbeat=signal(),InputBegan=signal()}, {
        __index=function(t,k) return methods[k] or t.props[k] end,
        __newindex=function(t,k,v) t.props[k]=v if k=="Parent" and v then table.insert(v.children,t) end end})
end
function methods:FindFirstChild(name) for _,v in ipairs(self.children) do if v.Name==name then return v end end end
function methods:WaitForChild(name) return assert(self:FindFirstChild(name),name) end
function methods:GetPropertyChangedSignal(name) self.signals[name]=self.signals[name] or signal() return self.signals[name] end
function methods:FireClient(player,s) self.last=s self.OnClientEvent:Fire(s) end
function methods:FireServer(...) self.sent={...} end
local function child(parent,class,name,module) local x=obj(class) x.Name=name x.module=module x.Parent=parent return x end
local records={} local fail=false local lost=false local guid=0 local clock=10
local function copy(t) if type(t)~="table" then return t end local n={} for k,v in pairs(t) do n[k]=copy(v) end return n end
local store={}
function store:UpdateAsync(key,fn)
    if fail then error("offline") end local v=fn(copy(records[key])) if not v then return end records[key]=copy(v)
    if lost then lost=false error("response lost after commit") end return copy(v)
end
local rs=obj("ReplicatedStorage") local players=obj("Players") local run=obj("RunService") local p=child(players,"Player","Alice") p.UserId=201 p.Kick=function(self,note) self.kicked=note end
local pg=child(p,"PlayerGui","PlayerGui") players.LocalPlayer=p
function players:GetPlayers() return {p} end
function run:IsStudio() return false end
local cfg={RouteKey="workshop-test",StageCount=36,Persistence=true,Mode="tycoon",Grind={Enabled=true}}
child(rs,"ModuleScript","MapForgeConfig",cfg)
local input=obj("UserInputService") local guiService=obj("GuiService")
local services={Players=players,ReplicatedStorage=rs,RunService=run,GuiService=guiService,UserInputService=input,
    DataStoreService={GetDataStore=function() return store end},HttpService={GenerateGUID=function() guid=guid+1 return "transaction"..guid end}}
local gameObject={JobId="workshop-A",GetService=function(_,id) return assert(services[id],id) end}
local env=setmetatable({game=gameObject,require=function(m) return assert(m.module) end,warn=function() end,
    task={wait=function() end,defer=function(f) f() end},os={clock=function() return clock end,time=os.time}}, {__index=_G})
local Data=assert(loadfile(DATA_PATH,"t",env))() assert(Data.Open(p))
assert(Data.Read(p).Workshop.Marks==0)
assert(Data.Edit(p,function(r) return W.Award(r,"first",20,25) end,true))
fail=true assert(not Data.Edit(p,function(r) return W.Buy(r,"power") end,true))
assert(Data.Read(p).Workshop.Marks==20 and Data.Read(p).Workshop.Levels.power==0 and not Data.CanProgress(p))
fail=false assert(Data.Save(p))
assert(Data.Read(p).Workshop.Marks==15 and Data.Read(p).Workshop.Levels.power==1)
lost=true assert(not Data.Edit(p,function(r) return W.Award(r,"ambiguous",7,10) end,true))
assert(Data.Read(p).Workshop.Marks==15 and records["201"].Workshop.Marks==22)
assert(Data.Save(p)) assert(not Data.Edit(p,function(r) return W.Award(r,"ambiguous",7,10) end,true))
assert(Data.Read(p).Workshop.Marks==22)
assert(Data.Receipt(p,"shop500","Coins500") and Data.Read(p).Coins==500,"shop amounts remain fixed")
Data.Close(p) gameObject.JobId="workshop-B"
Data=assert(loadfile(DATA_PATH,"t",env))() assert(Data.Open(p))
assert(Data.Read(p).Workshop.Marks==22 and Data.Read(p).Workshop.Levels.power==1 and W.HasClaim(Data.Read(p),"ambiguous"))
local E=assert(loadfile(ECONOMY_PATH))() E.SetWorkshop(true)
assert(Data.Edit(p,function(r) r.TycoonCash=1e15 return E.Buy(r,"u01",100,1) end,true))
local amount=Data.Read(p).Workshop.Marks assert(amount==23 and Data.Read(p).Workshop.Builds.u01)
assert(math.abs(E.Income(Data.Read(p),{})-E.Upgrades[1].Income*1.04)<1e-6)
assert(Data.Edit(p,function(r) for _,u in ipairs(E.Upgrades) do r.TycoonOwned[u.Id]=true end return E.Rebirth(r) end,true))
assert(Data.Read(p).Workshop.Marks==amount and Data.Read(p).Workshop.Builds.u01)
assert(Data.Edit(p,function(r) r.TycoonCash=1e15 return E.Buy(r,"u01",100,1) end,true))
assert(Data.Read(p).Workshop.Marks==amount,"rebuilt machines cannot farm milestone marks")

local scripts=obj("ServerScriptService") local scriptObject=child(scripts,"Script","WorkshopTest") env.script=scriptObject
child(scripts,"ModuleScript","MapForgeData",Data) child(scripts,"ModuleScript","MapForgeWorkshopCore",W)
local enum=setmetatable({}, {__index=function(_,k) return setmetatable({}, {__index=function(_,v) return k.."."..v end}) end})
env.Instance={new=obj} env.Enum=enum env.Vector2={new=function(x,y) return {X=x,Y=y} end}
env.Color3={fromRGB=function(...) return {...} end} env.UDim={new=function(...) return {...} end}
env.UDim2={new=function(...) return {...} end,fromOffset=function(...) return {...} end,fromScale=function(...) return {...} end}
local S=assert(loadfile(WORKSHOP_SERVICE_PATH,"t",env))() child(scripts,"ModuleScript","MapForgeWorkshop",S)
assert(loadfile(WORKSHOP_SERVER_PATH,"t",env))() S.Start()
local remote=rs:WaitForChild("MapForgeWorkshop") local count=#rs.children S.Start() assert(#rs.children==count)
remote.OnServerEvent:Fire(p,{},"power") assert(not remote.last)
remote.OnServerEvent:Fire(p,"upgrade",{}) assert(not remote.last)
remote.OnServerEvent:Fire(p,"sync") assert(remote.last.Marks==amount)
clock=clock+1 remote.OnServerEvent:Fire(p,"award",999) assert(Data.Read(p).Workshop.Marks==amount)
clock=clock+1 remote.OnServerEvent:Fire(p,"upgrade","yield",0) assert(Data.Read(p).Workshop.Levels.yield==0)
clock=clock+1 remote.OnServerEvent:Fire(p,"upgrade","power",999999) assert(Data.Read(p).Workshop.Levels.power==1,"invalid expected level")
clock=clock+1 remote.OnServerEvent:Fire(p,"upgrade","power",1) assert(Data.Read(p).Workshop.Levels.power==2 and Data.Read(p).Workshop.Marks==amount-10)
remote.OnServerEvent:Fire(p,"upgrade","power",2) assert(Data.Read(p).Workshop.Levels.power==2,"rate bound")
assert(Data.Edit(p,function(r) return W.Award(r,"test-funds",100,0) end,true))
lost=true clock=clock+1 remote.OnServerEvent:Fire(p,"upgrade","power",2) assert(remote.last.Branches[1].Level==2 and remote.last.SavingPaused)
clock=clock+1 remote.OnServerEvent:Fire(p,"upgrade","power",2)
assert(Data.Read(p).Workshop.Levels.power==3,"old expected level cannot double buy after a lost response")
fail=true clock=clock+1 remote.OnServerEvent:Fire(p,"upgrade","power",3) assert(remote.last.Branches[1].Level==3)
fail=false assert(Data.Save(p))
assert(S.Award(p,"event-round-1",5,10)) local savedMarks=Data.Read(p).Workshop.Marks
local acknowledged,already=S.Award(p,"event-round-1",5,10) assert(acknowledged and already and Data.Read(p).Workshop.Marks==savedMarks)
assert(loadfile(WORKSHOP_CLIENT_PATH,"t",env))()
run.Heartbeat:Fire(2)
local screen=pg:WaitForChild("MapForgeWorkshopHUD") local panel=screen:WaitForChild("WorkshopPanel") local toggle=screen:WaitForChild("WorkshopToggle")
assert(string.find(toggle.Text,"Werkstatt",1,true)) toggle.Activated:Fire() assert(panel.Visible and guiService.SelectedObject)
input.InputBegan:Fire({KeyCode=enum.KeyCode.ButtonB},false) assert(not panel.Visible)
screen.AbsoluteSize={X=320,Y=240} screen:GetPropertyChangedSignal("AbsoluteSize"):Fire()
assert(panel.Size[1]==296 and panel.Size[2]==216,"small viewport bounds")
assert(not string.find(remote.sent[1],"award",1,true),"client has no reward command")
-- Exercise the actual obby touch handlers, with the real profile/core transaction path.
local file=assert(io.open(OBBY_SERVER_PATH,"r")) local source=file:read("*a") file:close()
local stages=assert(source:match("(for index, pad in pairs%(pads%) do.-)\nfor _, coin in ipairs"))
local coins=assert(source:match("(for _, coin in ipairs%(world.coin:GetChildren%(%)%) do.-)\nfor _, hazard in ipairs"))
assert(Data.Edit(p,function(r) r.Coins=0 r.Wins=0 r.BoostSeconds=0 r.Workshop.Levels.focus=3 r.Workshop.Levels.yield=2 end,true))
local pad={Touched=signal()} local states={[p]={stage=1,lastMove=0,finished=false,runKey="obby-finish-real",collected={}}}
local messages={} clock=100
local touchEnv=setmetatable({pads={[2]=pad},getPlayer=function() return p end,state=states,Data=Data,Workshop=W,workshopEnabled=true,
    Config={StageCount=2,CheckpointEvery=1},os={clock=function() return clock end},message=function(_,s) table.insert(messages,s) end,sync=function() end}, {__index=_G})
assert(load(stages,"actual obby stage handler","t",touchEnv))()
local before=Data.Read(p).Workshop.Marks
fail=true pad.Touched:Fire({})
assert(Data.Read(p).Wins==0 and not states[p].finished and string.find(messages[#messages],"nicht gespeichert",1,true))
fail=false assert(Data.Save(p)) assert(Data.Read(p).Wins==1 and Data.Read(p).Coins==65 and Data.Read(p).Workshop.Marks==before+3)
clock=clock+1 pad.Touched:Fire({})
assert(states[p].finished and Data.Read(p).Wins==1 and Data.Read(p).Coins==65 and Data.Read(p).Workshop.Marks==before+3,"ambiguous completion retry cannot double award wins, coins or marks")
local coin={Name="Coin2",MFStage={Value=2},Touched=signal(),IsA=function() return true end,FindFirstChild=function() return true end}
touchEnv.world={coin={GetChildren=function() return {coin} end}} local hidden=0 touchEnv.notice={FireClient=function() hidden=hidden+1 end}
assert(load(coins,"actual obby coin handler","t",touchEnv))()
coin.Touched:Fire({}) assert(Data.Read(p).Coins==72 and hidden==1,"base 5 plus earned yield level 2")
coin.Touched:Fire({}) assert(Data.Read(p).Coins==72,"duplicate pickup ignored")
states[p].collected={} assert(Data.Edit(p,function(r) r.BoostSeconds=20 end,false)) coin.Touched:Fire({})
assert(Data.Read(p).Coins==84,"boosted base 10 plus earned yield level 2")
print("Workshop: sanitization, bounded claims, 15 upgrades, fixed shop rewards, durable failure/recovery/rejoin, lost responses, machine rebirth, server validation, rate bound and responsive client passed")
