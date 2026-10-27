math.clamp = function(n, lo, hi) return math.max(lo, math.min(hi, n)) end
local E = assert(loadfile(ECONOMY_PATH))()
local function profile()
 return {TycoonCash=0,TycoonBank=0,Gems=0,TycoonRebirths=0,TycoonOwned={},TycoonBoost=0,TycoonLastSeen=100000,TycoonDaily={},TycoonSkins={mint=true},TycoonSkin="mint"}
end
local p, now = profile(), 100000
assert(E.Income(p,{}) == 0 and E.Count(p) == 0)
assert(not E.Buy(p,"u02",now), "cannot skip prerequisites")
assert(not E.Buy(p,"anything",now))
assert(E.Buy(p,"u01",now), "free starter")
assert(not E.Buy(p,"u01",now), "no duplicate upgrade")
assert(E.Income(p,{}) == 3)
E.Tick(p,10,{},now+10)
assert(p.TycoonBank==30 and p.TycoonCash==0)
assert(E.Collect(p,now+10)==30 and p.TycoonBank==0 and p.TycoonCash==30)
assert(not E.Buy(p,"u02",now+10), "cannot spend bank or insufficient cash")
p.TycoonCash=100
assert(E.Buy(p,"u02",now+10))
local rate=E.Income(p,{})
p.TycoonBoost=900
assert(E.Income(p,{DoubleIncome=true,VIP=true})==rate*5, "pass/time/VIP factors stack")
local before=p.TycoonCash
E.Tick(p,100,{AutoCollect=true},now+20)
assert(p.TycoonBoost==890 and p.TycoonCash==before+rate*2*10, "tick clamped, auto collect server-side")
local boost=p.TycoonBoost
p.TycoonLastSeen=now
local offline=E.Offline(p,now+999999)
assert(offline==math.floor(rate*7200*.2) and p.TycoonBoost==boost,"offline cap and boost time preserved")
assert(E.Offline(p,now+999999)==0,"offline claim cannot repeat")
assert(not E.Rebirth(p),"cannot prestige early")
local full=profile()
full.TycoonCash=1e15
for _,u in ipairs(E.Upgrades) do assert(E.Buy(full,u.Id,now),u.Id) end
assert(E.Count(full)==#E.Upgrades and not E.Next(full))
assert(full.Gems==70,"four free milestones give exactly 70 gems")
full.TycoonSkins.gold=true full.TycoonSkin="gold" full.Gems=80 full.TycoonBoost=900
assert(E.Rebirth(full))
assert(E.Count(full)==0 and full.TycoonCash==0 and full.TycoonBank==0)
assert(full.TycoonRebirths==1 and full.Gems==105 and full.TycoonSkins.gold and full.TycoonSkin=="gold" and full.TycoonBoost==900)
full.TycoonCash=1e15
for _,u in ipairs(E.Upgrades) do assert(E.Buy(full,u.Id,now)) end
assert(full.Gems==105,"milestone rewards cannot repeat after rebirth")
local d=profile()
E.Day(d,now).Buys=3
assert(E.Claim(d,"build",now) and d.Gems==10)
assert(not E.Claim(d,"build",now),"daily reward exactly once")
assert(not E.Claim(d,"unknown",now))
E.Day(d,now+86400)
assert(not E.Claim(d,"build",now+86400),"new day resets progress")
d.Gems=100
assert(E.Skin(d,"gold") and d.Gems==0)
assert(E.Skin(d,"gold") and d.Gems==0,"owned skin can equip free")
assert(not E.Skin(d,"void") and not E.Skin(d,"unknown"))
local research=profile()
research.TycoonCash=1e15
assert(not E.Study(research,"unknown"))
for _,r in ipairs(E.ResearchTracks) do
 for level=1,r.Max do assert(E.Study(research,r.Id) and research.TycoonResearch[r.Id]==level) end
 assert(not E.Study(research,r.Id),"research max enforced")
end
assert(E.Buy(research,"u01",now))
assert(math.abs(E.Income(research,{})-4.8)<.0001,"efficiency raises base income")
research.TycoonLastSeen=now
assert(E.Offline(research,now+999999)==math.floor(4.8*21600*.2),"research extends offline window")
for _,u in ipairs(E.Upgrades) do if not research.TycoonOwned[u.Id] then assert(E.Buy(research,u.Id,now)) end end
assert(E.Rebirth(research) and research.Gems==135,"prestige research plus 70 milestone gems")
assert(research.TycoonResearch.efficiency==12 and research.TycoonResearch.logistics==8,"research survives rebirth")
local poor=profile()
assert(not E.Study(poor,"efficiency") and not E.Skin(poor,"prism"),"no negative wallet")
local daily=E.Day(poor,now) daily.Buys=12 daily.Seconds=900 daily.Collected=10000
for _,q in ipairs(E.Quests) do assert(E.Claim(poor,q.Id,now)) assert(not E.Claim(poor,q.Id,now)) end
assert(poor.Gems==115,"six daily rewards")
print("Tycoon economy: prerequisites, affordability, production, multipliers, offline cap, rebirth, quests and cosmetics passed")
local recommendations=profile()
recommendations.TycoonCash=1e15
for i=1,5 do assert(E.Buy(recommendations,E.Upgrades[i].Id,now)) end
local cfg={ShopEnabled=true,ShopHints=true,Persistence=true,ShopHintDelay=180,Products={TCashSmall=101,TBoost15=102,TGems100=103},Passes={AutoCollect=201,VIP=202,DoubleIncome=203}}
local session={seconds=179,collects=3,flags={}}
assert(#E.Recommend(cfg,recommendations,session)==0,"no early offers")
session.seconds=180
local function contains(rows,key) for _,k in ipairs(rows) do if k==key then return true end end return false end
assert(contains(E.Recommend(cfg,recommendations,session),"AutoCollect"),"comfort after manual loop")
assert(not contains(E.Recommend(cfg,recommendations,session),"TGems100"),"no design prompt without interest")
session.designInterest=true
assert(contains(E.Recommend(cfg,recommendations,session),"TGems100"))
session.flags.AutoCollect=true
assert(not contains(E.Recommend(cfg,recommendations,session),"AutoCollect"),"owned pass excluded")
cfg.ShopFocus="designs"
assert(not contains(E.Recommend(cfg,recommendations,session),"TCashSmall"))
cfg.ShopHints=false assert(#E.Recommend(cfg,recommendations,session)==0)
cfg.ShopHints=true cfg.Persistence=false assert(#E.Recommend(cfg,recommendations,session)==0)
cfg.Persistence=true cfg.ShopEnabled=false assert(#E.Recommend(cfg,recommendations,session)==0)
cfg.ShopEnabled=true cfg.ShopFocus="balanced" session.seconds=99999 session.collects=0
assert(#E.Recommend(cfg,recommendations,session)==0,"time alone is insufficient")
recommendations.TycoonFunnelStage=0 assert(E.NextOnboardingStage(recommendations)==1)
recommendations.TycoonFunnelStage=1 assert(E.NextOnboardingStage(recommendations)==2)
recommendations.TycoonFunnelStage=2 assert(not E.NextOnboardingStage(recommendations),"cannot infer collection from five builds")
recommendations.TycoonBank=1 E.Collect(recommendations,now)
assert(recommendations.TycoonFirstCollect and E.NextOnboardingStage(recommendations)==3)
recommendations.TycoonFunnelStage=3 assert(E.NextOnboardingStage(recommendations)==4)
recommendations.TycoonFunnelStage=-1 assert(not E.NextOnboardingStage(recommendations),"legacy cohort excluded")
print("Contextual offers, free milestones, no repeated rewards and sequential onboarding passed")
local contracts=profile() contracts.TycoonCash=1e15
assert(not E.StartContract(contracts,"build",now,{}),"contracts start after three actual builds")
for i=1,3 do assert(E.Buy(contracts,E.Upgrades[i].Id,now)) end
assert(E.StartContract(contracts,"build",now,{}))
assert(not E.StartContract(contracts,"research",now,{}),"one active contract")
assert(not E.ClaimContract(contracts,now),"no premature reward")
for i=4,6 do assert(E.Buy(contracts,E.Upgrades[i].Id,now)) end
assert(contracts.TycoonContracts.Active.Progress==3)
assert(not E.CancelContract(contracts),"complete contract cannot be accidentally discarded")
assert(E.ClaimContract(contracts,now) and contracts.Gems==12)
assert(not E.ClaimContract(contracts,now),"no repeated claim")
assert(E.StartContract(contracts,"research",now,{}))
assert(E.Study(contracts,"efficiency") and E.ClaimContract(contracts,now) and contracts.Gems==20)
assert(E.StartContract(contracts,"collect",now,{}))
local target=contracts.TycoonContracts.Active.Target
assert(not E.ClaimContract(contracts,now))
contracts.TycoonBank=target E.Collect(contracts,now)
assert(E.ClaimContract(contracts,now) and contracts.Gems==28)
assert(not E.StartContract(contracts,"build",now,{}),"three rewards per day")
assert(E.StartContract(contracts,"build",now+86400,{}),"UTC day resets allowance")
assert(E.ContractStatus(contracts,now+86400,{}).Completed==0)
assert(E.CancelContract(contracts))
assert(E.StartContract(contracts,"collect",now+86400,{}))
local snapshotTarget=contracts.TycoonContracts.Active.Target
contracts.TycoonBoost=900
assert(contracts.TycoonContracts.Active.Target==snapshotTarget,"target fixed when accepted")
contracts.TycoonContracts.Active.Reward=9999
assert(not E.ClaimContract(contracts,now+86400),"stored reward must match actual definition")
assert(E.StartContract(contracts,"research",now+86400,{}),"invalid old record replaced safely")
for _,u in ipairs(E.Upgrades) do contracts.TycoonOwned[u.Id]=true end
local active=contracts.TycoonContracts.Active
assert(E.Rebirth(contracts) and contracts.TycoonContracts.Active==active,"active contract survives rebirth")
for _,factor in ipairs({.7,1,1.25}) do
 local p=profile() assert(E.Buy(p,"u01",now,factor))
 local cost=E.BuildCost(E.Upgrades[2],factor)
 p.TycoonCash=cost-1 assert(not E.Buy(p,"u02",now,factor))
 p.TycoonCash=cost assert(E.Next(p,factor).Cost==cost and E.Buy(p,"u02",now,factor) and p.TycoonCash==0)
 assert(E.Income(p,{})==5,"pacing does not change production")
 local build=profile() local seconds=0 local rate=0
 for _,u in ipairs(E.Upgrades) do
  local price=E.BuildCost(u,factor)
  assert(E.Next(build,factor).Cost==price,"next price matches authoritative buy price")
  if price>0 then
   build.TycoonCash=price-1
   assert(not E.Buy(build,u.Id,now,factor) and not build.TycoonOwned[u.Id],"late builds reject insufficient cash")
   seconds=seconds+price/rate
  end
  build.TycoonCash=price
  assert(E.Buy(build,u.Id,now,factor) and build.TycoonCash==0,"exact price buys each build once")
  rate=E.Income(build,{})
  if u.Id=="u06" and factor==1 then assert(seconds<90,"quick entry preserved") end
 end
 assert(seconds/factor>119*60 and seconds/factor<121*60,"extended construction curve exported")
 assert(E.Count(build)==48 and build.Gems==70,"same builds and free rewards")
end
print("Contracts: actual progress, choices, one active, daily cap, stable targets, rebirth, duplicate/forged claims and pacing passed")
local calibration=profile() calibration.TycoonCash=1e12
assert(not E.Calibrate(calibration,1,now),"three actual builds required")
for i=1,3 do assert(E.Buy(calibration,E.Upgrades[i].Id,now)) end
assert(not E.Calibrate(calibration,2,now),"station order checked")
assert(E.Calibrate(calibration,1,now) and not E.Calibrate(calibration,1,now))
assert(not E.Calibrate(calibration,2,now+3),"durable minimum interval survives uncertain responses and rejoin")
assert(E.Calibrate(calibration,2,now+4) and E.Calibrate(calibration,3,now+8))
assert(calibration.TycoonCalibrationSeconds==120 and calibration.TycoonCalibrationReadyAt==now+188)
assert(not E.Calibrate(calibration,1,now+187),"cooldown cannot be skipped")
local calibratedRate=E.Income(calibration,{})
calibration.TycoonCalibrationSeconds=2 calibration.TycoonBank=0
E.Tick(calibration,5,{},now+13)
assert(math.abs(calibration.TycoonBank-(calibratedRate*2+calibratedRate/1.15*3))<.00001,"bonus expiration splits production correctly")
assert(calibration.TycoonCalibrationSeconds==0)
calibration.TycoonCalibrationSeconds=120 calibration.TycoonLastSeen=now
local offlineBase=E.Income(calibration,{})/1.15
assert(E.Offline(calibration,now+100)==math.floor(offlineBase*100*.2),"calibration never multiplies offline earnings")
assert(calibration.TycoonCalibrationSeconds==120,"offline visit preserves playable bonus time")
assert(E.Calibrate(calibration,1,now+188),"new round after cooldown")
for _,u in ipairs(E.Upgrades) do calibration.TycoonOwned[u.Id]=true end
local step,ready=calibration.TycoonCalibrationStep,calibration.TycoonCalibrationReadyAt
assert(E.Rebirth(calibration) and calibration.TycoonCalibrationStep==step and calibration.TycoonCalibrationReadyAt==ready and calibration.TycoonCalibrationSeconds==120)
print("Calibration economy: unlock, order, duplicate/cooldown, exact bonus expiry, offline exclusion and rebirth preservation passed")
local namesBefore={} for _,u in ipairs(E.Upgrades) do namesBefore[u.Id]={Name=u.Name,Cost=u.Cost,Income=u.Income,Requires=u.Requires} end
for _,theme in ipairs({'sky','neon','lava','jungle'}) do
 E.SetTheme(theme) local seen={}
 for _,u in ipairs(E.Upgrades) do
  assert(not seen[u.Name],'unique themed upgrade names') seen[u.Name]=true
  local original=namesBefore[u.Id] assert(original and original.Cost==u.Cost and original.Income==u.Income and original.Requires==u.Requires,'themed labels never change stable economy/IDs')
  assert(u.Name==E.ThemeNames[theme][u.Id])
 end
 local starter=profile() assert(E.Next(starter).Name==E.ThemeNames[theme].u01,'next target and in-world purchase use the chosen theme')
end
E.SetTheme('invalid') assert(E.Upgrades[1].Name==namesBefore.u01.Name,'old/invalid config keeps original theme')
print('Actual economy: themed names, next target and unchanged IDs/costs/income/prerequisites passed')
