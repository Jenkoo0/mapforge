-- Execute the actual client with UI/service doubles. This is not Roblox Studio.
local function signal()
    local s={handlers={}}
    function s:Connect(fn) table.insert(self.handlers,fn) end
    function s:Fire(...) for _,fn in ipairs(self.handlers) do fn(...) end end
    return s
end
local methods={}
local function object(class)
    local o={class=class,props={},children={},propertySignals={},attributeSignals={},attributes={},Activated=signal()}
    return setmetatable(o,{
        __index=function(t,k) return methods[k] or t.props[k] end,
        __newindex=function(t,k,v)
            if k=="Adornee" then assert(v==nil or type(v)=="table" and v.class,"Adornee expects an Instance or nil, never a boolean") end
            if k=="Parent" then
                local previous=t.props.Parent
                if previous then for i,c in ipairs(previous.children) do if c==t then table.remove(previous.children,i) break end end end
                if v then table.insert(v.children,t) end
            end
            local old=t.props[k] t.props[k]=v
            if old~=v and t.propertySignals[k] then t.propertySignals[k]:Fire() end
        end
    })
end
function methods:GetChildren() local c={} for _,v in ipairs(self.children) do table.insert(c,v) end return c end
function methods:GetDescendants() local c={} for _,v in ipairs(self.children) do table.insert(c,v) for _,n in ipairs(v:GetDescendants()) do table.insert(c,n) end end return c end
function methods:Destroy() for _,v in ipairs(self:GetChildren()) do v:Destroy() end self.Parent=nil self.destroyed=true end
function methods:FindFirstChild(name) for _,v in ipairs(self.children) do if v.Name==name then return v end end end
function methods:IsA(class) return self.class==class or class=="BasePart" and (self.class=="Part" or self.class=="SpawnLocation") end
function methods:GetAttribute(name) return self.attributes[name] end
function methods:SetAttribute(name,value) self.attributes[name]=value if self.attributeSignals[name] then self.attributeSignals[name]:Fire() end end
function methods:GetPropertyChangedSignal(name) if not self.propertySignals[name] then self.propertySignals[name]=signal() end return self.propertySignals[name] end
function methods:GetAttributeChangedSignal(name) if not self.attributeSignals[name] then self.attributeSignals[name]=signal() end return self.attributeSignals[name] end
local gui=object("PlayerGui")
local player={WaitForChild=function() return gui end}
local action={events={}} function action:FireServer(...) table.insert(self.events,{...}) end
local notice,update={OnClientEvent=signal()},{OnClientEvent=signal()}
local remotes={WaitForChild=function(_,name) return ({Action=action,Notice=notice,Update=update})[name] end}
local cfg={Name="HUD Test",UpgradeCount=48,ShopEnabled=false,ShopHints=false,Skins={},Research={},Quests={},Products={},Passes={}}
local world=object("Folder") world.Name="MapForgeWorld" world.DescendantAdded=signal() world.DescendantRemoving=signal()
local rs={WaitForChild=function(_,name) return name=="MapForgeConfig" and cfg or remotes end}
local services={Players={LocalPlayer=player},ReplicatedStorage=rs,MarketplaceService={},TweenService={}}
game={GetService=function(_,name) return assert(services[name],name) end}
workspace={WaitForChild=function() return world end,FindFirstChild=function() return world end}
Instance={new=object}
UDim2={new=function(...) return {...} end,fromOffset=function(x,y) return {0,x,0,y} end,fromScale=function(x,y) return {x,0,y,0} end}
UDim={new=function(...) return {...} end}
Vector2={new=function(x,y) return {X=x,Y=y} end}
Vector3={new=function(...) return {...} end}
Color3={fromRGB=function(...) return {...} end}
Enum=setmetatable({},{__index=function(t,k) local e=setmetatable({},{__index=function(_,n) return k.."."..n end}) rawset(t,k,e) return e end})
task={delay=function() end,spawn=function() end}
warn=function() end require=function(module) return module end
local earlyClaim=object("ProximityPrompt") earlyClaim.Name="MapForgeClaimPrompt" earlyClaim.Enabled=true earlyClaim:SetAttribute("MapForgeAvailable",true) earlyClaim.Parent=world
assert(loadfile(CLIENT_PATH))()
assert(earlyClaim.Enabled==false,"claim prompts stay hidden until player ownership loads")
local function find(predicate) for _,o in ipairs(gui:GetDescendants()) do if predicate(o) then return o end end error(debug.traceback("UI object not found")) end
local s={Cash=10,Bank=0,Gems=0,Rebirths=0,Count=3,Income=8,Boost=0,Plot=1,FirstCollect=true,Next={Id="u04",Name="Next",Cost=100,Income=4},Research={},Skins={},Daily={},Flags={},Contracts={Limit=3,Completed=0,Choices={{Id="build",Name="Bauauftrag",Target=3,Reward=12,Available=true},{Id="research",Name="Forschung",Target=1,Reward=8,Available=true}}}}
update.OnClientEvent:Fire(s)
local navigation=find(function(o) return o.Name=="MapForgeNavigation" end)
local menu=find(function(o) return o.class=="TextButton" and o.Text=="Fabrikmenü" end)
assert(navigation.Visible==false,"navigation starts compact")
menu.Activated:Fire() assert(navigation.Visible==true,"single menu action exposes destinations")
find(function(o) return o.class=="TextButton" and o.Text=="Aufträge" end).Activated:Fire()
assert(navigation.Visible==false,"selecting a destination closes navigation")
-- Check the actual client after viewport changes and resource/goal updates.
local screen=find(function(o) return o.class=="ScreenGui" end)
local cash=find(function(o) return o.Name=="MapForgeCash" end)
local bank=find(function(o) return o.Name=="MapForgeBank" end)
local gems=find(function(o) return o.Name=="MapForgeGems" end)
assert(cash.Text=="$ 10" and bank.Text=="$ 0" and gems.Text=="0","resources have independent values")
local tracker=find(function(o) return o.Name=="MapForgeStatus" end)
for _,size in ipairs({{390,760},{844,350},{1280,720}}) do
 screen.AbsoluteSize=Vector2.new(size[1],size[2])
 assert(tracker.Size[2]<=size[1]-24,"HUD remains inside narrow viewport")
 assert(navigation.Size[4]+navigation.Position[4]<=size[2]-12,"drawer stays on-screen at short landscape height")
end
local goalAction=find(function(o) return o.class=="TextButton" and o.Text=="Ziel zeigen" end)
goalAction.Activated:Fire() assert(action.events[#action.events][1]=="Next","quick goal sends navigation, never a purchase")
s.Bank=20 update.OnClientEvent:Fire(s)
assert(bank.Text=="$ 20" and goalAction.Text=="Zum Tresor","bank and action reflect collect goal")
goalAction.Activated:Fire() assert(action.events[#action.events][1]=="Vault")
s.Bank=0 update.OnClientEvent:Fire(s)
print("Actual HUD: separate resources, viewport resize and context navigation passed (doubles)")
if HUD_SNAPSHOT_PATH then
 local function encode(v)
  if v==nil then return "null" elseif type(v)=="string" then
   local escaped=v:gsub("[\0-\31\\\"]",function(c) return string.format("\\u%04x",string.byte(c)) end)
   return '\"'..escaped..'\"'
  elseif type(v)=="number" or type(v)=="boolean" then return tostring(v) elseif type(v)~="table" then return "null" end
  local result={} if #v>0 then for _,x in ipairs(v) do table.insert(result,encode(x)) end return "["..table.concat(result,",").."]" end
  for k,x in pairs(v) do table.insert(result,encode(tostring(k))..":"..encode(x)) end return "{"..table.concat(result,",").."}"
 end
 local function tree(o)
  local props={} for k,v in pairs(o.props) do if k~="Parent" and (type(v)=="table" or type(v)=="string" or type(v)=="number" or type(v)=="boolean") then props[k]=v end end
  local children={} for _,c in ipairs(o.children) do table.insert(children,tree(c)) end
  return {class=o.class,props=props,children=children}
 end
 local snapshots={}
 for _,size in ipairs({{816,640},{390,760},{844,350}}) do
  screen.AbsoluteSize=Vector2.new(size[1],size[2])
  -- Close detail panel through its actual close action, then toggle the real drawer.
  find(function(o) return o.class=="TextButton" and o.Text=="×" and o.Parent~=navigation and o.Parent.class=="Frame" and o.Parent.Size[4]>200 end).Activated:Fire()
  navigation.Visible=false
  table.insert(snapshots,{width=size[1],height=size[2],tree=tree(screen)})
  menu.Activated:Fire() table.insert(snapshots,{width=size[1],height=size[2],tree=tree(screen)})
 end
 local file=assert(io.open(HUD_SNAPSHOT_PATH,"w")) file:write(encode(snapshots)) file:close()
 notice.OnClientEvent:Fire("open-quests")
end


local scroll=find(function(o) return o.class=="ScrollingFrame" end)
local first=find(function(o) return o.class=="TextButton" and string.find(o.Text,"Bauauftrag",1,true) end)
scroll.CanvasPosition=Vector2.new(0,140)
local childCount=#scroll:GetChildren()
update.OnClientEvent:Fire(s)
assert(not first.destroyed and #scroll:GetChildren()==childCount,"unchanged menu rows reused")
assert(scroll.CanvasPosition.Y==140,"progress sync preserves scroll position")
first.Activated:Fire()
assert(action.events[#action.events][1]=="ContractStart" and action.events[#action.events][2]=="build")
s.Contracts.Active={Id="build",Target=3,Progress=0,Reward=12}
update.OnClientEvent:Fire(s)
find(function(o) return o.class=="TextButton" and o.Text=="Zum nächsten Ausbau" end).Activated:Fire()
assert(action.events[#action.events][1]=="Next","reused rows have current callback")
notice.OnClientEvent:Fire("open-quests")
s.Contracts.Active.Progress=3 update.OnClientEvent:Fire(s)
find(function(o) return o.class=="TextButton" and o.Text=="Fertig! Kostenlose Kristalle abholen" end).Activated:Fire()
assert(action.events[#action.events][1]=="ContractClaim","finished contract sends server claim only")
print("Actual HUD: stable rows, retained scroll, updated callbacks, contract selection and claim passed (service doubles)")
-- Follow the actual starter -> vault -> build loop and reopen help after progress.
find(function(o) return o.class=="TextButton" and o.Text=="Spielziel / Hilfe" end).Activated:Fire()
assert(find(function(o) return o.class=="TextLabel" and string.find(o.Text,"48 Ausbauten",1,true) end))
s.Count=0 s.Bank=0 s.Cash=0 s.FirstCollect=false
update.OnClientEvent:Fire(s)
assert(find(function(o) return o.class=="TextLabel" and string.find(o.Text,"1/3 STARTEN",1,true) end))
s.Count=1 s.Bank=3 s.Income=2
update.OnClientEvent:Fire(s)
assert(find(function(o) return o.class=="TextLabel" and string.find(o.Text,"2/3 ABHOLEN",1,true) end))
s.FirstCollect=true s.Bank=0 s.Cash=100
update.OnClientEvent:Fire(s)
assert(find(function(o) return o.class=="TextLabel" and string.find(o.Text,"3/3 BAUEN",1,true) end))
find(function(o) return o.class=="TextButton" and o.Text=="Zeige mir meinen nächsten Ausbau" end).Activated:Fire()
assert(action.events[#action.events][1]=="Next")
print("Actual HUD: starter, vault, next build and reusable help guidance passed")

-- The actual client watches existing and newly streamed claim prompts.
local claim=object("ProximityPrompt") claim.Name="MapForgeClaimPrompt" claim.Enabled=true claim:SetAttribute("MapForgeAvailable",true) claim.Parent=world
world.DescendantAdded:Fire(claim)
assert(claim.Enabled==false,"owned plot hides foreign free claim prompt")
claim.Enabled=true
assert(claim.Enabled==false,"server re-enable cannot expose foreign claim prompt")
s.Plot=0 update.OnClientEvent:Fire(s)
assert(claim.Enabled==true,"player without plot can see available claim prompt")
local marker=find(function(o) return o.Name=="MapForgeNextGoal" end)
local highlight=find(function(o) return o.Name=="MapForgeGoalHighlight" end)
assert(marker.Adornee==nil and highlight.Adornee==nil and marker.Enabled==false and highlight.Enabled==false,"no-plot updates clear both navigation targets without assigning false")
claim:SetAttribute("MapForgeAvailable",false)
assert(claim.Enabled==false,"occupied plot cannot be claimed")
claim:SetAttribute("MapForgeAvailable",true)
assert(claim.Enabled==true,"newly freed plot becomes available without rejoin")
s.Plot=2 update.OnClientEvent:Fire(s)
assert(claim.Enabled==false,"claim hides when ownership arrives")
local goalPart=object("Part") goalPart.Name="P2_Button_"..s.Next.Id goalPart.Parent=world
update.OnClientEvent:Fire(s)
assert(marker.Adornee==goalPart and highlight.Adornee==goalPart and marker.Enabled and highlight.Enabled,"navigation can recover to an actual goal Instance")
goalPart.Parent=nil update.OnClientEvent:Fire(s)
assert(marker.Adornee==nil and highlight.Adornee==nil and not marker.Enabled and not highlight.Enabled,"missing or streamed-out targets clear the previous goal Instance")
local wrongTarget=object("Folder") wrongTarget.Name="P2_Button_"..s.Next.Id wrongTarget.Parent=world
update.OnClientEvent:Fire(s)
assert(marker.Adornee==nil and highlight.Adornee==nil,"non-part name collisions cannot become navigation targets")
wrongTarget.Parent=nil
print("Actual HUD: claim prompt ownership, availability and streaming passed (service doubles)")
print("Actual HUD navigation: no plot, valid Instance, missing target and non-part collision passed (service doubles)")
-- Price requests are queued so a tab switch can occur while Roblox is responding.
local queued,requests,prompts={},0,0 local clock=10 local priceOK=true
os.clock=function() return clock end
task.spawn=function(fn) table.insert(queued,fn) end
local market=services.MarketplaceService
function market:GetProductInfoAsync(id,kind) requests=requests+1 assert(id==123) if not priceOK then error('offline') end return {IsForSale=true,PriceInRobux=37} end
function market:PromptProductPurchase(_,id) assert(id==123) prompts=prompts+1 end
cfg.Products={TCashSmall=123} cfg.Passes={} cfg.ShopEnabled=true
s.CanPurchase=true s.ProductReady={TCashSmall=true} s.Plot=1 s.Flags={}
notice.OnClientEvent:Fire('open-shop')
local offer=find(function(o) return o.class=='TextButton' and string.find(o.Text,'25.000 Cash',1,true) end)
update.OnClientEvent:Fire(s) update.OnClientEvent:Fire(s)
assert(#queued==1 and requests==0,'single in-flight query for repeated shop syncs')
notice.OnClientEvent:Fire('open-research')
local researchHeading=find(function(o) return o.class=='TextLabel' and o.Text=='FORSCHUNG MIT CASH' end)
table.remove(queued,1)()
assert(requests==1 and researchHeading.Text=='FORSCHUNG MIT CASH' and offer.Parent==nil,'late price response cannot change another menu')
notice.OnClientEvent:Fire('open-shop') update.OnClientEvent:Fire(s)
assert(#queued==0 and requests==1,'successful price cached across tab changes and updates')
offer=find(function(o) return o.class=='TextButton' and string.find(o.Text,'37 Robux',1,true) end)
offer.Activated:Fire() assert(prompts==1,'displayed price and configured typed product used')
s.ProductReady.TCashSmall=false update.OnClientEvent:Fire(s)
offer.Activated:Fire() assert(prompts==1,'unverified catalog membership blocks prompt')
s.ProductReady.TCashSmall=true clock=131 priceOK=false update.OnClientEvent:Fire(s)
assert(#queued==1) table.remove(queued,1)()
update.OnClientEvent:Fire(s) assert(requests==2 and #queued==0,'failed price has retry cooldown')
offer.Activated:Fire() assert(prompts==1,'failed price is never purchasable')
clock=147 priceOK=true update.OnClientEvent:Fire(s) assert(#queued==1) table.remove(queued,1)()
assert(requests==3,'failed price can recover after cooldown')
print('Actual HUD shop: in-flight deduplication, cache, expiry, async tab race, membership, failed price and retry passed')
