-- Isolated behavioural tests for the REAL exported profile module, not a reimplementation.
local dataPath = DATA_PATH
local storeNames = {}
local records, fail, studio, noStore, lostResponse, guid = {}, false, false, false, false, 0
local cfg = {RouteKey = "test", StageCount = 36, Persistence = true}
local function deep(t)
    if type(t) ~= "table" then return t end
    local o = {} for k, v in pairs(t) do o[k] = deep(v) end return o
end
local store = {}
function store:UpdateAsync(key, fn)
    if fail then error("SIMULATED_DATASTORE_OUTAGE") end
    local result = fn(deep(records[key]))
    if result == nil then return nil end
    records[key] = deep(result)
    if lostResponse then lostResponse = false error("COMMITTED_BUT_RESPONSE_LOST") end
    return deep(result)
end
local services = {
    DataStoreService = {GetDataStore = function(_, name) table.insert(storeNames, name) if noStore then error("NOT_PUBLISHED") end return store end},
    RunService = {IsStudio = function() return studio end},
    HttpService = {GenerateGUID = function() guid = guid + 1 return "test-transaction-" .. tostring(guid) end},
    ReplicatedStorage = {WaitForChild = function() return cfg end}
}
game = {JobId = "server-A", GetService = function(_, name) return services[name] end}
require = function(module) return module end
warn = function() end
task = {wait = function() end, defer = function(fn) fn() end}
math.clamp = function(n, lo, hi) return math.max(lo, math.min(hi, n)) end
local function player(id)
    return {UserId = id, Kick = function(self, reason) self.kicked = reason end}
end
local function loadData() return assert(loadfile(dataPath))() end
local Data, p = loadData(), player(1)
assert(Data.Open(p))
assert(Data.CanPurchase(p))
assert(Data.Edit(p, function(d) d.Coins = 25 end, false))
assert(Data.Receipt(p, "receipt-one", "Coins500"))
assert(Data.Read(p).Coins == 525 and records["1"].Coins == 525, "benefit saved with unsaved earned coins")
assert(records["1"].Receipts["receipt-one"] == true, "receipt saved atomically")
assert(Data.Receipt(p, "receipt-one", "Coins500"))
assert(Data.Read(p).Coins == 525, "duplicate receipt does not double grant")
assert(Data.Receipt(p, "boost-one", "Boost15"))
assert(Data.Read(p).BoostSeconds == 900)
assert(Data.Receipt(p, "boost-one", "Boost15"))
assert(Data.Read(p).BoostSeconds == 900, "boost duplicate protected")
fail = true
assert(not Data.Receipt(p, "failed-one", "Coins500"))
assert(Data.Read(p).Coins == 525 and not Data.Read(p).Receipts["failed-one"], "failure cannot grant in memory")
assert(not Data.CanPurchase(p), "new prompts blocked after save failure")
fail = false
assert(Data.Receipt(p, "failed-one", "Coins500"))
assert(Data.Read(p).Coins == 1025, "existing receipt retry can recover")
assert(Data.CanPurchase(p))
lostResponse = true
assert(not Data.Receipt(p, "response-lost", "Coins500"))
assert(records["1"].Coins == 1525 and Data.Read(p).Coins == 1025)
assert(not Data.CanProgress(p), "ambiguous write blocks later state edits")
assert(not Data.Edit(p, function(d) d.Coins = 0 end, false))
assert(Data.Receipt(p, "different-receipt", "Coins500"))
assert(Data.Read(p).Coins == 2025, "pending benefit recovered before next receipt")
assert(Data.Read(p).Receipts["response-lost"])
assert(Data.Receipt(p, "response-lost", "Coins500"))
assert(Data.Read(p).Coins == 2025, "lost response cannot lose receipt and double grant")
assert(not Data.Receipt(p, "bad-product", "Unknown"))
assert(Data.Edit(p, function(d) if d.Coins < 3000 then return false end d.Coins = 0 end, true) == false)
assert(Data.Read(p).Coins == 2025, "rejected transform unchanged")
-- A different server cannot load an active session.
game.JobId = "server-B"
local Other = loadData()
local otherPlayer = player(1)
local opened, reason = Other.Open(otherPlayer)
assert(not opened and reason == "SESSION_BUSY")
Data.Close(p)
assert(records["1"].Session == nil, "close releases session")
assert(Other.Open(otherPlayer))
assert(Other.Read(otherPlayer).Coins == 2025)
assert(Other.Receipt(otherPlayer, "receipt-one", "Coins500"))
assert(Other.Read(otherPlayer).Coins == 2025, "cross-session duplicate protected")
-- Ownership loss cannot overwrite a new server's record.
records["1"].Session = {Id = "server-C", Expires = os.time() + 180}
assert(not Other.Save(otherPlayer))
assert(otherPlayer.kicked and records["1"].Session.Id == "server-C")
Other.Close(otherPlayer)
assert(records["1"].Session.Id == "server-C")
-- Live outage does not silently replace persistent data with a blank profile.
fail = true
assert(not loadData().Open(player(2)))
studio = true
local Demo, d = loadData(), player(3)
assert(Demo.Open(d))
assert(not Demo.CanPurchase(d))
assert(not Demo.Receipt(d, "demo-receipt", "Coins500"))
fail = false noStore = true
local Unpublished, u = loadData(), player(4)
assert(Unpublished.Open(u))
assert(not Unpublished.CanPurchase(u))
studio = false
assert(not loadData().Open(player(5)))
noStore = false
local RouteTest, r = loadData(), player(6)
assert(RouteTest.Open(r))
assert(RouteTest.Edit(r, function(v) v.Coins = 123 v.Trail = true v.Checkpoint = 10 end, true))
RouteTest.Close(r)
cfg.RouteKey = "new-route"
local NewMap, n = loadData(), player(6)
assert(NewMap.Open(n))
assert(NewMap.Read(n).Checkpoint == 0, "new route resets incompatible checkpoints")
assert(NewMap.Read(n).Coins == 123 and NewMap.Read(n).Trail, "map changes preserve paid/earned wallet and cosmetics")
NewMap.Close(n)
local Tycoon, tp = loadData(), player(7)
assert(Tycoon.Open(tp))
for _, item in ipairs({{"TCashSmall",25000,0,0},{"TCashLarge",1000000,0,0},{"TGems100",0,100,0},{"TGems500",0,500,0},{"TBoost15",0,0,900},{"TBundle",250000,250,0}}) do
 local b=Tycoon.Read(tp) local cash,gems,boost=b.TycoonCash,b.Gems,b.TycoonBoost
 assert(Tycoon.Receipt(tp,"tycoon-"..item[1],item[1]))
 local a=Tycoon.Read(tp)
 assert(a.TycoonCash==cash+item[2] and a.Gems==gems+item[3] and a.TycoonBoost==boost+item[4])
 assert(Tycoon.Receipt(tp,"tycoon-"..item[1],item[1]))
 assert(Tycoon.Read(tp).TycoonCash==a.TycoonCash and Tycoon.Read(tp).Gems==a.Gems and Tycoon.Read(tp).TycoonBoost==a.TycoonBoost)
end
Tycoon.Close(tp)
studio = true cfg.StudioTestData = true
loadData()
assert(storeNames[#storeNames]=="MapForge_Studio_v1","Studio uses separate DataStore")
studio = false
loadData()
assert(storeNames[#storeNames]=="MapForge_v1","live uses stable purchase namespace")
print("Profile harness: receipts, duplicate/retry/outage, session locks, release/rejoin and demo gating passed")

-- Contract claims use the same atomic update, including an ambiguous response.
local Economy=assert(loadfile(ECONOMY_PATH))()
studio=false
local ContractData,cp=loadData(),player(8)
assert(ContractData.Open(cp))
assert(ContractData.Edit(cp,function(d)
 d.TycoonCash=1e9
 for i=1,3 do assert(Economy.Buy(d,Economy.Upgrades[i].Id,os.time())) end
 assert(Economy.StartContract(d,"research",os.time(),{}))
 assert(Economy.Study(d,"efficiency"))
end,true))
lostResponse=true
assert(not ContractData.Edit(cp,function(d) return Economy.ClaimContract(d,os.time()) end,true))
assert(records["8"].Gems==8 and records["8"].TycoonContracts.Completed==1)
assert(not ContractData.CanProgress(cp))
assert(not ContractData.Edit(cp,function(d) return Economy.ClaimContract(d,os.time()) end,true))
assert(ContractData.Read(cp).Gems==8 and ContractData.Read(cp).TycoonContracts.Completed==1,"retry resolves saved claim without duplicate gems")
ContractData.Close(cp)
local Rejoin,cp2=loadData(),player(8)
assert(Rejoin.Open(cp2) and Rejoin.Read(cp2).Gems==8)
Rejoin.Close(cp2)
print("Actual Data + Economy: contract reward/limit atomic, lost-response retry and rejoin passed")
local CalibrationData,calp=loadData(),player(9)
assert(CalibrationData.Open(calp))
assert(CalibrationData.Edit(calp,function(d)
 d.TycoonCash=1e12 for i=1,3 do assert(Economy.Buy(d,Economy.Upgrades[i].Id,os.time())) end
 assert(Economy.Calibrate(d,1,100000)) assert(Economy.Calibrate(d,2,100004))
end,true))
lostResponse=true
assert(not CalibrationData.Edit(calp,function(d) return Economy.Calibrate(d,3,100008) end,true))
assert(records["9"].TycoonCalibrationSeconds==120 and records["9"].TycoonCalibrationStep==0)
assert(not CalibrationData.Edit(calp,function(d) return Economy.Calibrate(d,3,100008) end,true))
assert(CalibrationData.Read(calp).TycoonCalibrationSeconds==120 and CalibrationData.Read(calp).TycoonCalibrationReadyAt==100188,"ambiguous save recovered without a second reward")
CalibrationData.Close(calp)
local CalibrationRejoin,calp2=loadData(),player(9)
assert(CalibrationRejoin.Open(calp2) and CalibrationRejoin.Read(calp2).TycoonCalibrationSeconds==120 and CalibrationRejoin.Read(calp2).TycoonCalibrationReadyAt==100188)
CalibrationRejoin.Close(calp2)
print("Actual Data + Economy: calibration bonus/cooldown atomic, lost-response retry and rejoin passed")
