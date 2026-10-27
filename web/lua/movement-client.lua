-- MapForge: native movement, hold-to-sprint keyboard and toggle touch/gamepad.
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local Config = require(RS:WaitForChild("MapForgeConfig"))
if not Config.Movement or Config.Movement.SprintEnabled ~= true then return end
local CAS = game:GetService("ContextActionService")
local Input = game:GetService("UserInputService")
local Gui = game:GetService("GuiService")
local player = Players.LocalPlayer
local remote = RS:WaitForChild("MapForgeMovement", 20)
if not remote then warn("[MapForge] Movement server not ready.") return end
local ACTION = "MapForgeSprint"
local held, toggled, sent = false, false, false
local connections = {}
local function send(force)
    local active = held or toggled
    if force or active ~= sent then sent = active remote:FireServer(active) end
end
local function reset()
    held = false toggled = false send(true)
end
local function paint()
    CAS:SetTitle(ACTION, player:GetAttribute("MapForgeSprinting") and "Gehen" or "Sprint")
end
local function handle(_, state, input)
    if state == Enum.UserInputState.Cancel then reset() return Enum.ContextActionResult.Pass end
    if Input:GetFocusedTextBox() or Gui.MenuIsOpen then reset() return Enum.ContextActionResult.Pass end
    local toggle = input and (input.UserInputType == Enum.UserInputType.Touch or input.KeyCode == Enum.KeyCode.ButtonL3)
    if toggle then if state == Enum.UserInputState.Begin then toggled = not toggled send() end
    elseif state == Enum.UserInputState.Begin then held = true send()
    elseif state == Enum.UserInputState.End then held = false send() end
    return Enum.ContextActionResult.Sink
end
CAS:BindAction(ACTION, handle, true, Enum.KeyCode.LeftShift, Enum.KeyCode.ButtonL3)
CAS:SetPosition(ACTION, UDim2.new(1, -180, 1, -100))
CAS:SetDescription(ACTION, "Umschalt halten · L3 oder Touch zum Umschalten")
paint()
table.insert(connections, player:GetAttributeChangedSignal("MapForgeSprinting"):Connect(function()
    if not player:GetAttribute("MapForgeSprinting") then held = false toggled = false sent = false end
    paint()
end))
table.insert(connections, player.CharacterAdded:Connect(reset))
table.insert(connections, player.CharacterRemoving:Connect(reset))
table.insert(connections, Input.WindowFocusReleased:Connect(reset))
table.insert(connections, Input.TextBoxFocused:Connect(reset))
table.insert(connections, Gui.MenuOpened:Connect(reset))
script.Destroying:Connect(function()
    reset() CAS:UnbindAction(ACTION)
    for _, connection in ipairs(connections) do connection:Disconnect() end
end)
