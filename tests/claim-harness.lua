-- Execute the actual server's functions against small service doubles.
-- Extraction avoids a second implementation of ownership/sign rules.
local file=assert(io.open(SERVER_PATH,"r")) local source=file:read("*a") file:close()
local function actual(first,nextName,env,name)
    local a=assert(source:find(first,1,true)) local b=assert(source:find(nextName,a+1,true))
    return assert(load(source:sub(a,b-1).."\nreturn "..name,"actual server "..name,"t",env))()
end
local player,other={},{} local states={} local notices={} local rebuilds,syncs,teleports=0,0,0
local env={states=states,tostring=tostring,tell=function(_,text) table.insert(notices,text) end,rebuild=function() rebuilds=rebuilds+1 end,sync=function() syncs=syncs+1 end,teleport=function() teleports=teleports+1 end,task={spawn=function(fn,p) fn(p) end}}
local claim=actual("local function claim(","local function transact(",env,"claim")
local free={id=1} assert(not claim(player,free) and free.owner==nil,"unloaded player cannot claim")
states[player]={plot={id=2}}
assert(not claim(player,free) and string.find(notices[#notices],"bereits",1,true),"owner receives clear message")
assert(free.owner==nil and rebuilds==0 and syncs==0,"failed claim leaves ownership unchanged")
states[player]={} local occupied={id=3,owner=other} local before=#notices
assert(not claim(player,occupied,true) and #notices==before,"auto assignment silently skips occupied plots")
assert(not claim(player,occupied) and string.find(notices[#notices],"vergeben",1,true),"manual race gives clear feedback")
assert(claim(player,free) and free.owner==player and states[player].plot==free)
assert(rebuilds==1 and syncs==1 and teleports==1,"successful claim updates world and owner once")
assert(not claim(player,{id=4}) and rebuilds==1,"second plot rejected")
local text={} local sign={FindFirstChild=function(_,n) return n=="Text" and text end,Text=text}
local billboard=actual("local function billboard(","local function sync(",{},"billboard")
assert(billboard({FindFirstChild=function(_,n) assert(n=="MapForgeSign") return sign end})==text,"existing surface sign reused without duplication")
local surface={Enabled=true,IsA=function(_,cls) return cls=="SurfaceGui" end}
local part={Transparency=0,GetChildren=function() return {surface} end}
local visible=actual("local function visible(","local function billboard(",{ipairs=ipairs,value=function(_,key) return key=="MFCollide" end},"visible")
visible(part,false) assert(surface.Enabled==false and part.Transparency==1 and part.CanCollide==false)
visible(part,true) assert(surface.Enabled==true and part.Transparency==0 and part.CanCollide==true)
print("Actual server functions: claim ownership/race/quiet assignment, sign reuse and SurfaceGui visibility passed (doubles)")
