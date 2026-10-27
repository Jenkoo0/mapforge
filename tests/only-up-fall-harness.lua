-- Exercise the actual exported fall handler with profile/character doubles.
local file=assert(io.open(OBBY_SERVER_PATH,"r")) local source=file:read("*a") file:close()
local chunk=assert(source:match("local function onlyUpFall%(player%).-\nend"))
local config={ObbyStyle="onlyup"} local p={arena=false}
function p:GetAttribute() return self.arena end
local root={Position={Y=200}} local hum={Health=100}
p.Character={FindFirstChild=function() return root end,FindFirstChildOfClass=function() return hum end}
local d={Checkpoint=100} local state={[p]={stage=101}} local pads={[100]={Position={Y=200}}}
local env=setmetatable({Config=config,Data={Read=function() return d end},state=state,pads=pads},{__index=_G})
local fall=assert(load(chunk.."\nreturn onlyUpFall","only-up-fall","t",env))()
fall(p) assert(hum.Health==100)
root.Position.Y=180 fall(p) assert(hum.Health==100)
root.Position.Y=179.9 fall(p) assert(hum.Health==0,"below checkpoint minus 20 returns via normal death/respawn")
hum.Health=100 p.arena=true fall(p) assert(hum.Health==100,"rally arena is exempt")
p.arena=false config.ObbyStyle="classic" fall(p) assert(hum.Health==100,"classic behaviour unchanged")
config.ObbyStyle="onlyup" d=nil fall(p) assert(hum.Health==100,"unloaded data cannot kill character")
d={Checkpoint=100} state[p]=nil fall(p) assert(hum.Health==100)
print("Actual Only-Up fall handler: threshold, arena isolation, classic compatibility and unloaded state passed (doubles)")
