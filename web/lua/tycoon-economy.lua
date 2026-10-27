-- MapForge 3.24.0. Generated from the same economy plan used by the editor.
local E = {}
E.Upgrades = {
    {Id="u01", Name="Starterbohrer", Cost=0, Income=3, Requires=nil},
    {Id="u02", Name="Förderband A", Cost=41, Income=2, Requires="u01"},
    {Id="u03", Name="Kristallpresse", Cost=77, Income=3, Requires="u02"},
    {Id="u04", Name="Extraktor II", Cost=137, Income=4, Requires="u03"},
    {Id="u05", Name="Energieverteiler", Cost=226, Income=6, Requires="u04"},
    {Id="u06", Name="Werkhalle", Cost=369, Income=0, Requires="u05"},
    {Id="u07", Name="Förderband B", Cost=430, Income=9, Requires="u06"},
    {Id="u08", Name="Doppelbohrer", Cost=743, Income=14, Requires="u07"},
    {Id="u09", Name="Laser-Schneider", Cost=1290, Income=21, Requires="u08"},
    {Id="u10", Name="Forschungslabor", Cost=2209, Income=32, Requires="u09"},
    {Id="u11", Name="Fassaden-Upgrade", Cost=3764, Income=0, Requires="u10"},
    {Id="u12", Name="Reaktorkern", Cost=4205, Income=49, Requires="u11"},
    {Id="u13", Name="Automatisierte Presse", Cost=7104, Income=74, Requires="u12"},
    {Id="u14", Name="Förderstrecke C", Cost=11910, Income=113, Requires="u13"},
    {Id="u15", Name="Plasma-Extraktor", Cost=19915, Income=172, Requires="u14"},
    {Id="u16", Name="Drohnenstation", Cost=33168, Income=261, Requires="u15"},
    {Id="u17", Name="Kontrollturm", Cost=54977, Income=397, Requires="u16"},
    {Id="u18", Name="Quantenreaktor", Cost=90821, Income=603, Requires="u17"},
    {Id="u19", Name="Kristall-Labor", Cost=149493, Income=917, Requires="u18"},
    {Id="u20", Name="Industriebohrer", Cost=245363, Income=1394, Requires="u19"},
    {Id="u21", Name="Veredelungsanlage", Cost=401580, Income=2118, Requires="u20"},
    {Id="u22", Name="Neon-Fassade", Cost=655413, Income=0, Requires="u21"},
    {Id="u23", Name="Orbit-Transmitter", Cost=702079, Income=3220, Requires="u22"},
    {Id="u24", Name="Meisterreaktor", Cost=1140546, Income=4894, Requires="u23"},
    {Id="u25", Name="Hyperpresse", Cost=1848826, Income=7439, Requires="u24"},
    {Id="u26", Name="Skyline-Turm", Cost=2990974, Income=11307, Requires="u25"},
    {Id="u27", Name="Energiegarten", Cost=4829557, Income=17187, Requires="u26"},
    {Id="u28", Name="Dimensionskern", Cost=7784605, Income=26124, Requires="u27"},
    {Id="u29", Name="Empire-Zentrale", Cost=12526733, Income=39709, Requires="u28"},
    {Id="u30", Name="Prestige-Monument", Cost=20125891, Income=0, Requires="u29"},
    {Id="u31", Name="Solar-Array", Cost=21241176, Income=60357, Requires="u30"},
    {Id="u32", Name="Kühltürme", Cost=34027440, Income=91743, Requires="u31"},
    {Id="u33", Name="Logistikdepot", Cost=54437384, Income=139449, Requires="u32"},
    {Id="u34", Name="Bio-Gewächshaus", Cost=86978169, Income=211963, Requires="u33"},
    {Id="u35", Name="Verladekran", Cost=138802157, Income=322184, Requires="u34"},
    {Id="u36", Name="Tiefenkernbohrer", Cost=221248211, Income=489719, Requires="u35"},
    {Id="u37", Name="Robotik-Labor", Cost=352276679, Income=744373, Requires="u36"},
    {Id="u38", Name="Fusionsanlage", Cost=560312961, Income=1131447, Requires="u37"},
    {Id="u39", Name="Zen-Energiegarten", Cost=890308145, Income=1719800, Requires="u38"},
    {Id="u40", Name="Orbital-Antenne", Cost=1413292135, Income=2614096, Requires="u39"},
    {Id="u41", Name="Nano-Veredelung", Cost=2241419547, Income=3973426, Requires="u40"},
    {Id="u42", Name="Skyline-Residenz", Cost=3551653993, Income=6039607, Requires="u41"},
    {Id="u43", Name="Dimensionsportal", Cost=5623025486, Income=9180203, Requires="u42"},
    {Id="u44", Name="Drohnen-Helipad", Cost=8895207623, Income=13953908, Requires="u43"},
    {Id="u45", Name="Antimaterie-Kern", Cost=14060558979, Income=21209940, Requires="u44"},
    {Id="u46", Name="Zukunfts-Campus", Cost=22208672095, Income=32239109, Requires="u45"},
    {Id="u47", Name="Empire-Wolkenkratzer", Cost=35053259815, Income=49003446, Requires="u46"},
    {Id="u48", Name="Weltwunder", Cost=55288100196, Income=0, Requires="u47"},
}
E.Skins = {
    {Id="mint", Name="Mint", Cost=0, Color="#86f0d0"},
    {Id="violet", Name="Violet", Cost=50, Color="#b3a1ff"},
    {Id="gold", Name="Gold", Cost=100, Color="#ffdc86"},
    {Id="ruby", Name="Ruby", Cost=150, Color="#ff899f"},
    {Id="ice", Name="Ice", Cost=250, Color="#9be3ff"},
    {Id="void", Name="Void", Cost=400, Color="#c38df3"},
    {Id="ocean", Name="Ocean", Cost=500, Color="#52cde8"},
    {Id="ember", Name="Ember", Cost=600, Color="#ffab75"},
    {Id="rose", Name="Rose", Cost=700, Color="#f5a4cb"},
    {Id="aurora", Name="Aurora", Cost=850, Color="#8defbc"},
    {Id="royal", Name="Royal", Cost=1100, Color="#a69dff"},
    {Id="prism", Name="Prism", Cost=1500, Color="#eef7ff"},
}
E.ResearchTracks = {
    {Id="efficiency", Name="Prozessoptimierung", Max=12, Base=1500, Growth=3, Detail="+5 % Basisproduktion je Stufe"},
    {Id="logistics", Name="Offline-Logistik", Max=8, Base=3500, Growth=4, Detail="+30 Minuten Offline-Fenster je Stufe"},
    {Id="mastery", Name="Prestige-Forschung", Max=8, Base=10000, Growth=5, Detail="+5 Kristalle je Rebirth und Stufe"},
}
E.Quests = {
    {Id="build", Name="3 Ausbauten bauen", Field="Buys", Target=3, Reward=10},
    {Id="play", Name="5 Minuten spielen", Field="Seconds", Target=300, Reward=15},
    {Id="collect", Name="500 Cash abholen", Field="Collected", Target=500, Reward=10},
    {Id="architect", Name="12 Ausbauten bauen", Field="Buys", Target=12, Reward=25},
    {Id="session", Name="15 Minuten spielen", Field="Seconds", Target=900, Reward=30},
    {Id="industrialist", Name="10.000 Cash abholen", Field="Collected", Target=10000, Reward=25},
}
E.Milestones = {
    {Id="build12", Count=12, Reward=10},
    {Id="build24", Count=24, Reward=15},
    {Id="build36", Count=36, Reward=20},
    {Id="build48", Count=48, Reward=25},
}
E.OfferRules = {
    {Key="AutoCollect", Pass=true, Builds=5, Seconds=180, Collects=3, Design=false, Cash=0},
    {Key="TBoost15", Pass=false, Builds=8, Seconds=240, Collects=1, Design=false, Cash=0},
    {Key="DoubleIncome", Pass=true, Builds=12, Seconds=300, Collects=1, Design=false, Cash=0},
    {Key="VIP", Pass=true, Builds=18, Seconds=360, Collects=1, Design=false, Cash=0},
    {Key="TCashSmall", Pass=false, Builds=5, Seconds=180, Collects=1, Design=false, Cash=25000},
    {Key="TCashLarge", Pass=false, Builds=12, Seconds=300, Collects=1, Design=false, Cash=1000000},
    {Key="TGems100", Pass=false, Builds=5, Seconds=180, Collects=1, Design=true, Cash=0},
    {Key="TGems500", Pass=false, Builds=12, Seconds=300, Collects=1, Design=true, Cash=0},
    {Key="TBundle", Pass=false, Builds=12, Seconds=300, Collects=1, Design=true, Cash=250000},
}
E.Contracts = {
    {Id="build", Name="Bauauftrag", Metric="build", Target=3, Reward=12},
    {Id="research", Name="Forschungsauftrag", Metric="research", Target=1, Reward=8},
    {Id="collect", Name="Lieferauftrag", Metric="collect", Target=120, Reward=8},
}
E.ContractLimit = 3
E.Calibration = {MinimumBuilds=3, Stations=3, BonusFactor=1.15, BonusSeconds=120, Cooldown=180, MinimumInterval=4}
E.ThemeNames={sky={["u01"]="Starterbohrer",["u02"]="Förderband A",["u03"]="Kristallpresse",["u04"]="Extraktor II",["u05"]="Energieverteiler",["u06"]="Werkhalle",["u07"]="Förderband B",["u08"]="Doppelbohrer",["u09"]="Laser-Schneider",["u10"]="Forschungslabor",["u11"]="Fassaden-Upgrade",["u12"]="Reaktorkern",["u13"]="Automatisierte Presse",["u14"]="Förderstrecke C",["u15"]="Plasma-Extraktor",["u16"]="Drohnenstation",["u17"]="Kontrollturm",["u18"]="Quantenreaktor",["u19"]="Kristall-Labor",["u20"]="Industriebohrer",["u21"]="Veredelungsanlage",["u22"]="Neon-Fassade",["u23"]="Orbit-Transmitter",["u24"]="Meisterreaktor",["u25"]="Hyperpresse",["u26"]="Skyline-Turm",["u27"]="Energiegarten",["u28"]="Dimensionskern",["u29"]="Empire-Zentrale",["u30"]="Prestige-Monument",["u31"]="Solar-Array",["u32"]="Kühltürme",["u33"]="Logistikdepot",["u34"]="Bio-Gewächshaus",["u35"]="Verladekran",["u36"]="Tiefenkernbohrer",["u37"]="Robotik-Labor",["u38"]="Fusionsanlage",["u39"]="Zen-Energiegarten",["u40"]="Orbital-Antenne",["u41"]="Nano-Veredelung",["u42"]="Skyline-Residenz",["u43"]="Dimensionsportal",["u44"]="Drohnen-Helipad",["u45"]="Antimaterie-Kern",["u46"]="Zukunfts-Campus",["u47"]="Empire-Wolkenkratzer",["u48"]="Weltwunder"},neon={["u01"]="Gratis-Photonensammler",["u02"]="Energietransport",["u03"]="Laserpresse",["u04"]="Photonen-Extraktor 2",["u05"]="Plasma-Reaktor",["u06"]="Cyber-Werkhalle",["u07"]="Energietransport 2",["u08"]="Photonen-Extraktor 3",["u09"]="Laserpresse 2",["u10"]="Photonenlabor",["u11"]="Hologrammfassade",["u12"]="Plasma-Reaktor 2",["u13"]="Laserpresse 3",["u14"]="Energietransport 3",["u15"]="Photonen-Extraktor 4",["u16"]="Photonenlabor 2",["u17"]="Datenturm",["u18"]="Plasma-Reaktor 3",["u19"]="Photonenlabor 3",["u20"]="Photonen-Extraktor 5",["u21"]="Laserpresse 4",["u22"]="Hologrammfassade 2",["u23"]="Datenturm 2",["u24"]="Plasma-Reaktor 4",["u25"]="Laserpresse 5",["u26"]="Datenturm 3",["u27"]="Photonenlabor 4",["u28"]="Plasma-Reaktor 5",["u29"]="Datenturm 4",["u30"]="Neon-Monument",["u31"]="Photonen-Array",["u32"]="Kryo-Kühlung",["u33"]="Energiespeicher",["u34"]="Hydroponik-Labor",["u35"]="Magnetkran",["u36"]="Photonen-Extraktor 6",["u37"]="Photonenlabor 5",["u38"]="Plasma-Reaktor 6",["u39"]="Lichtgarten",["u40"]="Signalstation",["u41"]="Laserpresse 6",["u42"]="Datenturm 5",["u43"]="Quantenportal",["u44"]="Cyber-Drohnenplatz",["u45"]="Plasma-Reaktor 7",["u46"]="Photonenlabor 6",["u47"]="Datenturm 6",["u48"]="Neon-Monument 2"},lava={["u01"]="Gratis-Erzsammler",["u02"]="Erz-Förderband",["u03"]="Schmelzpresse",["u04"]="Erzbohrer 2",["u05"]="Magmakern",["u06"]="Gießereihalle",["u07"]="Erz-Förderband 2",["u08"]="Erzbohrer 3",["u09"]="Schmelzpresse 2",["u10"]="Legierungslabor",["u11"]="Basaltfassade",["u12"]="Magmakern 2",["u13"]="Schmelzpresse 3",["u14"]="Erz-Förderband 3",["u15"]="Erzbohrer 4",["u16"]="Legierungslabor 2",["u17"]="Hochofen",["u18"]="Magmakern 3",["u19"]="Legierungslabor 3",["u20"]="Erzbohrer 5",["u21"]="Schmelzpresse 4",["u22"]="Basaltfassade 2",["u23"]="Hochofen 2",["u24"]="Magmakern 4",["u25"]="Schmelzpresse 5",["u26"]="Hochofen 3",["u27"]="Legierungslabor 4",["u28"]="Magmakern 5",["u29"]="Hochofen 4",["u30"]="Vulkan-Monument",["u31"]="Wärmekollektoren",["u32"]="Kühltürme",["u33"]="Erzlager",["u34"]="Wärmegewächshaus",["u35"]="Gießereikran",["u36"]="Erzbohrer 6",["u37"]="Legierungslabor 5",["u38"]="Magmakern 6",["u39"]="Lavasteingarten",["u40"]="Vulkan-Messstation",["u41"]="Schmelzpresse 6",["u42"]="Hochofen 5",["u43"]="Glutportal",["u44"]="Erzdrohnenplatz",["u45"]="Magmakern 7",["u46"]="Legierungslabor 6",["u47"]="Hochofen 6",["u48"]="Vulkan-Monument 2"},jungle={["u01"]="Gratis-Saatgutsammler",["u02"]="Pflanzen-Förderband",["u03"]="Blütenpresse",["u04"]="Saatgut-Extraktor 2",["u05"]="Bio-Reaktor",["u06"]="Gewächshalle",["u07"]="Pflanzen-Förderband 2",["u08"]="Saatgut-Extraktor 3",["u09"]="Blütenpresse 2",["u10"]="Pflanzenlabor",["u11"]="Rankenfassade",["u12"]="Bio-Reaktor 2",["u13"]="Blütenpresse 3",["u14"]="Pflanzen-Förderband 3",["u15"]="Saatgut-Extraktor 4",["u16"]="Pflanzenlabor 2",["u17"]="Wachstumsturm",["u18"]="Bio-Reaktor 3",["u19"]="Pflanzenlabor 3",["u20"]="Saatgut-Extraktor 5",["u21"]="Blütenpresse 4",["u22"]="Rankenfassade 2",["u23"]="Wachstumsturm 2",["u24"]="Bio-Reaktor 4",["u25"]="Blütenpresse 5",["u26"]="Wachstumsturm 3",["u27"]="Pflanzenlabor 4",["u28"]="Bio-Reaktor 5",["u29"]="Wachstumsturm 4",["u30"]="Blütenmonument",["u31"]="Solarblätter",["u32"]="Bewässerungstürme",["u33"]="Saatgutlager",["u34"]="Blütengewächshaus",["u35"]="Erntekran",["u36"]="Saatgut-Extraktor 6",["u37"]="Pflanzenlabor 5",["u38"]="Bio-Reaktor 6",["u39"]="Botanischer Garten",["u40"]="Wetterstation",["u41"]="Blütenpresse 6",["u42"]="Wachstumsturm 5",["u43"]="Biomportal",["u44"]="Erntedrohnenplatz",["u45"]="Bio-Reaktor 7",["u46"]="Pflanzenlabor 6",["u47"]="Wachstumsturm 6",["u48"]="Blütenmonument 2"}}
function E.SetTheme(theme)
 local names=E.ThemeNames[theme] or E.ThemeNames.sky
 for _,u in ipairs(E.Upgrades) do u.Name=names[u.Id] end
end
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
