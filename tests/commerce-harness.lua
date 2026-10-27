-- Actual server functions executed with minimal service doubles; no Roblox engine.
math.clamp=function(n,a,b) return math.max(a,math.min(b,n)) end
local f=assert(io.open(SERVER_PATH)) local source=f:read('*a') f:close()
local function actual(start,finish,name,env)
 local a=assert(source:find(start,1,true)) local b=assert(source:find(finish,a+1,true))
 return assert(load(source:sub(a,b-1)..'\nreturn '..name,'actual '..name,'t',env))()
end
local page=1
local pages={IsFinished=false}
function pages:GetCurrentPage() return page==1 and {{ProductId=111,AssetId=999},{ProductId=222}} or {{ProductId=333}} end
function pages:AdvanceToNextPageAsync() page=page+1 self.IsFinished=true end
local market={GetDeveloperProductsAsync=function() page=1 pages.IsFinished=false return pages end}
local catalog=actual('local function fetchProductCatalog(','local function productAvailability(','fetchProductCatalog',{pcall=pcall,type=type,ipairs=ipairs,Market=market})
local ids=catalog() assert(ids[111] and ids[222] and ids[333] and not ids[999],'all pages, developer ProductId instead of AssetId')
local advance=pages.AdvanceToNextPageAsync
pages.AdvanceToNextPageAsync=function() error('upstream error') end
assert(catalog()==nil,'failed later page must not expose a partially verified catalog')
pages.AdvanceToNextPageAsync=advance
local cfg={Products={TCashSmall=111,TCashLarge=111,TGems100=222,TGems500=444,TBoost15=0},Passes={}}
local ready=actual('local function productAvailability(','local function tell(','productAvailability',{pairs=pairs,Config=cfg,catalogIds=ids})()
assert(not ready.TCashSmall and not ready.TCashLarge and ready.TGems100 and not ready.TGems500 and not ready.TBoost15,'duplicates, missing membership and zero IDs fail closed')
local a=assert(source:find('Market.ProcessReceipt = function(receipt)',1,true))
local b=assert(source:find('Market.PromptGamePassPurchaseFinished',a,true))
local receiptSource=source:sub(a,b-1):gsub('Market.ProcessReceipt = function','local processReceipt = function',1)
local player,receiptCalls={},0 local saveOK=true local lastKind
local receipt=assert(load(receiptSource..'\nreturn processReceipt','actual receipt','t',{
 Players={GetPlayerByUserId=function(_,id) return id==1 and player end},Config=cfg,pairs=pairs,tostring=tostring,
 Enum={ProductPurchaseDecision={NotProcessedYet='deferred',PurchaseGranted='granted'}},
 Data={Receipt=function(_,_,kind) receiptCalls=receiptCalls+1 lastKind=kind return saveOK end},
 task={wait=function() end},sync=function() end,tell=function() end,warn=function() end
}))()
assert(receipt({PlayerId=2,ProductId=222,PurchaseId='p'})=='deferred' and receiptCalls==0)
assert(receipt({PlayerId=1,ProductId=111,PurchaseId='p'})=='deferred' and receiptCalls==0)
assert(receipt({PlayerId=1,ProductId=999,PurchaseId='p'})=='deferred' and receiptCalls==0)
assert(receipt({PlayerId=1,ProductId=222,PurchaseId='p'})=='granted' and receiptCalls==1 and lastKind=='TGems100','known paid receipts continue without a catalog call')
saveOK=false
assert(receipt({PlayerId=1,ProductId=222,PurchaseId='retry'})=='deferred' and receiptCalls==4,'never acknowledge failed durable reward')
print('Actual commerce server: full catalog pagination, failures, ProductId, duplicate/missing IDs and durable receipt routing passed')

local E=assert(loadfile(ECONOMY_PATH))()
local d={Gems=0,TycoonOwned={u01=true,u02=true,u03=true},TycoonCash=0,TycoonBank=0,TycoonResearch={},TycoonBoost=0,TycoonRebirths=0}
local plot={owner=player,calibration={{allowed=true},{allowed=true},{allowed=true}},buttons={}}
local states={[player]={plot=plot,flags={}}} local clock=10 local edits=0
local env={states=states,Config={},E=E,os={time=function() return 100000+clock end,clock=function() return clock end},
 tonumber=tonumber,tostring=tostring,ipairs=ipairs,type=type,string=string,math=math,
 Data={Read=function() return d end,Edit=function(_,fn,durable) assert(durable) edits=edits+1 return fn(d)~=false end},
 near=function(_,target) return target and target.allowed end,tell=function() end,sync=function() end,rebuild=function() end,
 task={spawn=function() end}}
local transact=actual('local function transact(','local function prompt(','transact',env)
transact(player,'Calibrate','bad') assert(edits==0)
plot.calibration[1].allowed=false transact(player,'Calibrate','1') assert(edits==0,'remote cannot skip physical range')
plot.calibration[1].allowed=true transact(player,'Calibrate','2') assert((d.TycoonCalibrationStep or 0)==0,'wrong first station rejected')
transact(player,'Calibrate','1') assert(d.TycoonCalibrationStep==1)
clock=11 transact(player,'Calibrate','2') assert(d.TycoonCalibrationStep==1,'rapid remote hopping rejected')
clock=14 transact(player,'Calibrate','2') assert(d.TycoonCalibrationStep==2)
clock=18 transact(player,'Calibrate','3') assert(d.TycoonCalibrationSeconds==120)
clock=22 transact(player,'Calibrate','1') assert(d.TycoonCalibrationStep==0,'persisted cooldown checked')
plot.owner={} local before=edits transact(player,'Calibrate','1') assert(edits==before,'foreign plot ownership rejected before editing')
print('Actual calibration server: range, ownership, station order, minimum travel interval and cooldown passed')
