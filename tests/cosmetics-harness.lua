-- Actual shared scripts + actual Data module with isolated Roblox service doubles.
math.clamp=function(n,a,b) return math.max(a,math.min(b,n)) end
local function signal()
 local s={listeners={}} function s:Connect(fn) local c={fn=fn,on=true} function c:Disconnect() self.on=false end table.insert(self.listeners,c) return c end
 function s:Fire(...) for _,c in ipairs(self.listeners) do if c.on then c.fn(...) end end end return s
end
local methods={}
local function obj(class)
 return setmetatable({class=class,props={},children={},signals={},Activated=signal(),OnClientEvent=signal(),OnServerEvent=signal(),CharacterAdded=signal(),DescendantAdded=signal()}, {
  __index=function(t,k) return methods[k] or t.props[k] end,
  __newindex=function(t,k,v)
   if k=="Parent" then local old=t.props.Parent if old then for i,c in ipairs(old.children) do if c==t then table.remove(old.children,i) break end end end if v then table.insert(v.children,t) end end
   t.props[k]=v
  end})
end
function methods:FindFirstChild(name) for _,v in ipairs(self.children) do if v.Name==name then return v end end end
function methods:GetDescendants() local all={} for _,v in ipairs(self.children) do table.insert(all,v) for _,c in ipairs(v:GetDescendants()) do table.insert(all,c) end end return all end
function methods:WaitForChild(name) return assert(self:FindFirstChild(name),name) end
function methods:Destroy() self.Parent=nil self.destroyed=true end
function methods:GetPropertyChangedSignal(name) self.signals[name]=self.signals[name] or signal() return self.signals[name] end
local function child(parent,class,name) local o=obj(class) o.Name=name o.Parent=parent return o end
local function copy(t) if type(t)~="table" then return t end local n={} for k,v in pairs(t) do n[k]=copy(v) end return n end
local function boot(options)
 options=options or {}
 local now=10 local records={} local fail=false local lost=false local owns={} local queries={} local prices={} local prompts={} local priceFail=false
 local rs=obj("ReplicatedStorage") local players=obj("Players") players.PlayerAdded=signal() players.PlayerRemoving=signal()
 local run={Heartbeat=signal(),IsStudio=function() return false end}
 local existingReceipt=function() return "unchanged" end
 local market={PromptGamePassPurchaseFinished=signal(),ProcessReceipt=existingReceipt}
 function market:UserOwnsGamePassAsync(uid,id) table.insert(queries,{uid,id}) if owns[uid..":"..id]=="error" then error("ownership offline") end return owns[uid..":"..id]==true end
 function market:GetProductInfoAsync(id,kind) assert(kind=="InfoType.GamePass") if priceFail then error("price offline") end return prices[id] or {IsForSale=true,PriceInRobux=87} end
 function market:PromptGamePassPurchase(player,id) table.insert(prompts,{player,id}) end
 local store={}
 function store:UpdateAsync(key,fn) if fail then error("store offline") end local r=fn(copy(records[key])) if not r then return end records[key]=copy(r) if lost then lost=false error("saved response lost") end return copy(r) end
 local cfg={RouteKey="cosmetics-test",StageCount=36,Persistence=options.persistence~=false,ShopEnabled=options.shop~=false,
  Passes={VIP=options.duplicate and 22 or 0},Cosmetics={Enabled=options.enabled~=false,Items={
   {Id="aurora",Name="Polarlicht",PassId=options.empty and 0 or 11,ColorA="#93eed4",ColorB="#e3a7cd",Lifetime=.6},
   {Id="solar",Name="Sonne",PassId=options.empty and 0 or 22,ColorA="#ffd38c",ColorB="#fff3db",Lifetime=.4},
   {Id="nebula",Name="Nebel",PassId=options.empty and 0 or 33,ColorA="#bbb4ff",ColorB="#9dd8ff",Lifetime=.8}}}}
 child(rs,"ModuleScript","MapForgeConfig").module=cfg
 local guid=0 local services={Players=players,ReplicatedStorage=rs,MarketplaceService=market,RunService=run,
  HttpService={GenerateGUID=function() guid=guid+1 return "cosmetic-write-"..guid end},DataStoreService={GetDataStore=function() return store end},GuiService=obj("GuiService"),UserInputService={InputBegan=signal()}}
 local enum=setmetatable({}, {__index=function(_,k) return setmetatable({}, {__index=function(_,v) return k.."."..v end}) end})
 local env=setmetatable({game={JobId="cosmetic-session",GetService=function(_,name) return assert(services[name],name) end},
  require=function(m) return assert(m.module) end,Instance={new=obj},os={clock=function() return now end,time=os.time},warn=function() end,
  task={spawn=function(fn,...) fn(...) end,defer=function(fn,...) fn(...) end,wait=function() end},
  Vector2={new=function(x,y) return {X=x,Y=y} end},Vector3={new=function(...) return {...} end},
  UDim={new=function(...) return {...} end},UDim2={new=function(...) return {...} end,fromOffset=function(x,y) return {0,x,0,y} end,fromScale=function(x,y) return {x,0,y,0} end},
  Color3={fromRGB=function(...) return {...} end,fromHex=function(s) return s end},ColorSequence={new=function(...) return {...} end},NumberSequence={new=function(n) return n end},Enum=enum}, {__index=_G})
 local Data=assert(loadfile(DATA_PATH,"t",env))()
 local scripts=obj("ServerScriptService") local scriptObject=child(scripts,"Script","Cosmetics") env.script=scriptObject
 child(scripts,"ModuleScript","MapForgeData").module=Data
 function players:GetPlayers() local a={} for _,p in ipairs(self.children) do table.insert(a,p) end return a end
 local function character(player)
  local char=obj("Model") local root=child(char,"Part","HumanoidRootPart") local free=child(root,"Trail","MFGlowTrail") free.Enabled=true player.Character=char player.CharacterAdded:Fire(char) return root,free
 end
 local function add(uid,name)
  local p=child(players,"Player",name) p.UserId=uid child(p,"PlayerGui","PlayerGui") character(p) assert(Data.Open(p)) players.PlayerAdded:Fire(p) return p
 end
 local alice=add(201,"Alice") local bob=add(202,"Bob")
 owns["201:11"]=true
 local localPlayer=nil
 function methods:FireClient(p,s) self.messages=self.messages or {} self.messages[p]=s if p==localPlayer then self.OnClientEvent:Fire(s) end end
 function methods:FireServer(...) self.OnServerEvent:Fire(localPlayer,...) end
 assert(loadfile(COSMETICS_SERVER_PATH,"t",env))()
 assert(market.ProcessReceipt==existingReceipt,"cosmetics never replaces an existing receipt handler")
 local remote=rs:FindFirstChild("MapForgeCosmetics")
 local function step(dt) now=now+(dt or 1) run.Heartbeat:Fire(dt or 1) end
 local function command(p,...) step(1) remote.OnServerEvent:Fire(p,...) end
 local function client(p) localPlayer=p players.LocalPlayer=p assert(loadfile(COSMETICS_CLIENT_PATH,"t",env))() return p:WaitForChild("PlayerGui"):WaitForChild("MapForgeCosmeticsHUD") end
 return {alice=alice,bob=bob,rs=rs,remote=remote,Data=Data,records=records,cfg=cfg,owns=owns,queries=queries,prices=prices,prompts=prompts,market=market,players=players,step=step,command=command,client=client,character=character,services=services,
  fail=function(v) fail=v end,lost=function() lost=true end,priceFail=function(v) priceFail=v end}
end
local disabled=boot({enabled=false}) assert(not disabled.remote and #disabled.queries==0)
local empty=boot({empty=true}) local eg=empty.client(empty.alice) eg:WaitForChild("CosmeticsToggle").Activated:Fire()
local ep=eg:WaitForChild("CosmeticsPanel"):WaitForChild("CosmeticsScroll")
ep:WaitForChild("CosmeticAction_aurora").Activated:Fire()
assert(#empty.prompts==0 and string.find(ep:WaitForChild("CosmeticAction_aurora").Text,"Nicht eingerichtet",1,true))

local t=boot({duplicate=true}) local a,b=t.alice,t.bob local r=t.remote local D=t.Data
assert(r.messages[a].Items[1].Owned and not r.messages[b].Items[1].Owned)
assert(not r.messages[a].Items[2].Configured,"VIP alias blocks cosmetic pass")
t.command(b,"equip","aurora") assert(D.Read(b).CosmeticStyle=="none","foreign ownership denied")
t.command(b,"equip",{}) t.command(b,"equip","forged") t.command(b,"grant",11)
assert(D.Read(b).CosmeticStyle=="none")
t.market.PromptGamePassPurchaseFinished:Fire(b,11,true) assert(not r.messages[b].Items[1].Owned,"finished signal cannot fabricate ownership")
assert(D.Edit(a,function(d) d.Coins=73 d.Workshop.Marks=9 end,true))
t.command(a,"equip","aurora")
local root=a.Character:WaitForChild("HumanoidRootPart")
assert(D.Read(a).CosmeticStyle=="aurora" and root:FindFirstChild("MapForgeCosmeticTrail") and root:FindFirstChild("MFGlowTrail").Enabled==false)
assert(D.Read(a).Coins==73 and D.Read(a).Workshop.Marks==9 and not root:FindFirstChild("WalkSpeed"))
t.command(a,"equip","none") assert(not root:FindFirstChild("MapForgeCosmeticTrail") and root:FindFirstChild("MFGlowTrail").Enabled)
t.fail(true) t.command(a,"equip","aurora") assert(D.Read(a).CosmeticStyle=="none" and r.messages[a].SavingPaused and not root:FindFirstChild("MapForgeCosmeticTrail"))
t.fail(false) assert(D.Save(a)) t.step(2) assert(D.Read(a).CosmeticStyle=="aurora" and root:FindFirstChild("MapForgeCosmeticTrail"))
t.lost() t.command(a,"equip","none") assert(D.Read(a).CosmeticStyle=="aurora" and t.records["201"].CosmeticStyle=="none")
assert(D.Save(a)) t.step(2) assert(D.Read(a).CosmeticStyle=="none" and not root:FindFirstChild("MapForgeCosmeticTrail"))
assert(D.Receipt(a,"old-currency-receipt","Coins500") and D.Read(a).Coins==573,"existing receipt path untouched")
t.command(a,"equip","aurora") local newRoot=t.character(a) t.step(2) assert(newRoot:FindFirstChild("MapForgeCosmeticTrail"),"respawn reapplies owned style")
D.Close(a) t.players.PlayerRemoving:Fire(a) a.Parent=nil
local replacement=child(t.players,"Player","AliceRejoined") replacement.UserId=201 child(replacement,"PlayerGui","PlayerGui") t.character(replacement)
assert(D.Open(replacement)) t.players.PlayerAdded:Fire(replacement) t.step(2)
assert(D.Read(replacement).CosmeticStyle=="aurora" and replacement.Character:WaitForChild("HumanoidRootPart"):FindFirstChild("MapForgeCosmeticTrail"))
assert(D.Read(replacement).Coins==573 and D.Read(replacement).Receipts["old-currency-receipt"])

local c=boot() local workshop=child(c.bob:WaitForChild("PlayerGui"),"Frame","WorkshopPanel") workshop.Visible=true
local gui=c.client(c.bob) local panel=gui:WaitForChild("CosmeticsPanel") local toggle=gui:WaitForChild("CosmeticsToggle")
toggle.Activated:Fire() assert(panel.Visible)
assert(not workshop.Visible,"opening cosmetics closes the competing workshop")
workshop.Visible=true workshop:GetPropertyChangedSignal("Visible"):Fire() assert(not panel.Visible,"opening another panel closes cosmetics")
toggle.Activated:Fire()
local scroll=panel:WaitForChild("CosmeticsScroll") local buy=scroll:WaitForChild("CosmeticAction_aurora")
assert(string.find(buy.Text,"87 Robux",1,true) and buy.Active)
buy.Activated:Fire() buy.Activated:Fire() assert(#c.prompts==1,"single active purchase prompt")
c.market.PromptGamePassPurchaseFinished:Fire(c.bob,11,false) assert(not c.remote.messages[c.bob].Items[1].Owned)
c.owns["202:11"]=true c.market.PromptGamePassPurchaseFinished:Fire(c.bob,11,true)
assert(c.remote.messages[c.bob].Items[1].Owned)
c.step(1) buy.Activated:Fire() assert(c.Data.Read(c.bob).CosmeticStyle=="aurora")
gui.AbsoluteSize={X=320,Y=240} gui:GetPropertyChangedSignal("AbsoluteSize"):Fire()
assert(panel.Size[2]==296 and panel.Size[4]==216,"short mobile viewport")
c.services.UserInputService.InputBegan:Fire({KeyCode="KeyCode.ButtonB"},false) assert(not panel.Visible)
local off=boot({shop=false}) off.command(off.alice,"equip","aurora") assert(off.Data.Read(off.alice).CosmeticStyle=="aurora" and not off.remote.messages[off.bob].Items[1].CanBuy)
local demo=boot({persistence=false}) assert(not demo.remote.messages[demo.bob].Items[1].CanBuy,"demo cannot initiate paid prompt")
assert(demo.remote.messages[demo.bob].Demo)
local noSale=boot() noSale.prices[11]={IsForSale=false,PriceInRobux=87}
local noSaleGui=noSale.client(noSale.bob) noSaleGui:WaitForChild("CosmeticsToggle").Activated:Fire()
local offButton=noSaleGui:WaitForChild("CosmeticsPanel"):WaitForChild("CosmeticsScroll"):WaitForChild("CosmeticAction_aurora")
assert(not offButton.Active) offButton.Activated:Fire() assert(#noSale.prompts==0,"off-sale pass has no buy prompt")
local noPrice=boot() noPrice.priceFail(true)
local noPriceGui=noPrice.client(noPrice.bob) noPriceGui:WaitForChild("CosmeticsToggle").Activated:Fire()
local badButton=noPriceGui:WaitForChild("CosmeticsPanel"):WaitForChild("CosmeticsScroll"):WaitForChild("CosmeticAction_aurora")
assert(not badButton.Active) badButton.Activated:Fire() assert(#noPrice.prompts==0,"failed client price query has no buy prompt")
local errorCase=boot() errorCase.owns["202:11"]="error" errorCase.command(errorCase.bob,"refresh")
assert(not errorCase.remote.messages[errorCase.bob].Items[1].Verified and not errorCase.remote.messages[errorCase.bob].Items[1].CanBuy)
errorCase.command(errorCase.bob,"equip","aurora") assert(errorCase.Data.Read(errorCase.bob).CosmeticStyle=="none")
print("Actual cosmetics server/client + Data: zero IDs, duplicates, two players, forged ownership, prompt cancel/recheck, prices, saved equip/remove, outage/lost response/rejoin, respawn, receipts, shop-off, demo, API failure and short mobile UI passed (service doubles)")
