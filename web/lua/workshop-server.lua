local Config=require(game:GetService("ReplicatedStorage"):WaitForChild("MapForgeConfig"))
if Config.Grind and Config.Grind.Enabled==true then
    require(script.Parent:WaitForChild("MapForgeWorkshop")).Start()
end
