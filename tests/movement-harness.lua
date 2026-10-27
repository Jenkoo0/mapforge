-- Execute both actual movement scripts with deterministic service doubles.
local function signal()
    local s = {listeners = {}}
    function s:Connect(fn)
        local connection = {active = true, fn = fn}
        function connection:Disconnect() self.active = false end
        table.insert(self.listeners, connection) return connection
    end
    function s:Fire(...) for _, c in ipairs(self.listeners) do if c.active then c.fn(...) end end end
    function s:Count() local n = 0 for _, c in ipairs(self.listeners) do if c.active then n = n + 1 end end return n end
    return s
end
local function humanoid()
    local h = {Health = 100, Sit = false, PlatformStand = false, Died = signal(), StateChanged = signal(), signals = {}, state = 'Running'}
    function h:IsA(name) return name == 'Humanoid' end
    function h:GetState() return self.state end
    function h:GetPropertyChangedSignal(name) self.signals[name] = self.signals[name] or signal() return self.signals[name] end
    return h
end
local function setup(mode, walk, jump, sprint, enabled)
    local now, remote = 1, nil
    local p = {CharacterAdded = signal(), CharacterRemoving = signal(), attributes = {}, attrSignals = {}}
    function p:SetAttribute(name, value) local changed = self.attributes[name] ~= value self.attributes[name] = value if changed and self.attrSignals[name] then self.attrSignals[name]:Fire() end end
    function p:GetAttribute(name) return self.attributes[name] end
    function p:GetAttributeChangedSignal(name) self.attrSignals[name] = self.attrSignals[name] or signal() return self.attrSignals[name] end
    local players = {PlayerAdded = signal(), PlayerRemoving = signal(), LocalPlayer = p}
    function players:GetPlayers() return {p} end
    p.Parent = players
    local function char(h) return {WaitForChild = function(_, name) assert(name == 'Humanoid') return h end} end
    p.Character = char(humanoid())
    local config = {Mode = mode, WalkSpeed = walk, JumpPower = jump, Movement = {SprintEnabled = enabled, SprintSpeed = sprint}}
    local rs = {} function rs:WaitForChild(name) if name == 'MapForgeConfig' then return config end if name == 'MapForgeMovement' then return remote end error(name) end
    local input = {WindowFocusReleased = signal(), TextBoxFocused = signal(), focused = nil}
    function input:GetFocusedTextBox() return self.focused end
    local gui = {MenuIsOpen = false, MenuOpened = signal()}
    local cas = {bindings = {}, titles = {}, positions = {}}
    function cas:BindAction(name, fn, touch, ...) self.bindings[name] = {fn = fn, touch = touch, keys = {...}} end
    function cas:UnbindAction(name) self.bindings[name] = nil end
    function cas:SetTitle(name, title) self.titles[name] = title end
    function cas:SetDescription(name, description) self.description = description end
    function cas:SetPosition(name, position) self.positions[name] = position end
    local services = {Players = players, ReplicatedStorage = rs, ContextActionService = cas, UserInputService = input, GuiService = gui}
    local destroyed, pending, sent = signal(), {}, {}
    local env = setmetatable({game = {GetService = function(_, name) assert(services[name], name) return services[name] end}, require = function(value) return value end, Enum = {HumanoidStateType = {Swimming = 'Swimming', Climbing = 'Climbing'}, UserInputState = {Begin = 'Begin', End = 'End', Cancel = 'Cancel'}, KeyCode = {LeftShift = 'LeftShift', ButtonL3 = 'ButtonL3'}, UserInputType = {Touch = 'Touch'}, ContextActionResult = {Pass = 'Pass', Sink = 'Sink'}}, Instance = {new = function(class)
        assert(class == 'RemoteEvent') remote = {OnServerEvent = signal()}
        function remote:FireServer(active) table.insert(sent, active) self.OnServerEvent:Fire(p, active) end
        return remote
    end}, os = {clock = function() return now end}, task = {spawn = function(fn, ...)
        local thread = coroutine.create(fn) local ok, reason = coroutine.resume(thread, ...) assert(ok, reason)
        if coroutine.status(thread) ~= 'dead' then table.insert(pending, thread) end
    end}, UDim2 = {new = function(...) return {...} end}, script = {Destroying = destroyed}, warn = function() end}, {__index = _G})
    assert(loadfile(MOVEMENT_SERVER_PATH, 't', env))()
    assert(loadfile(MOVEMENT_CLIENT_PATH, 't', env))()
    return {p = p, players = players, config = config, cas = cas, input = input, gui = gui, remote = remote, env = env, char = char, pending = pending, sent = sent, destroy = destroyed, advance = function(seconds) now = now + seconds end}
end
for _, mode in ipairs({'obby', 'tycoon'}) do
    for _, values in ipairs({{16,50,16,false},{14,50,14,false},{16,50,24,true},{18,55,26,true}}) do
        local w, j, sprint, enabled = table.unpack(values)
        local t = setup(mode, w, j, sprint, enabled)
        local h = t.p.Character:WaitForChild('Humanoid')
        assert(h.WalkSpeed == w and h.JumpPower == j and h.UseJumpPower == true)
        local function event(active) t.advance(.2) t.remote.OnServerEvent:Fire(t.p, active) end
        for _, forged in ipairs({999,'true',{},0}) do event(forged) assert(h.WalkSpeed == w) end
        event(true) assert(h.WalkSpeed == (enabled and sprint or w))
        event(false) assert(h.WalkSpeed == w and t.p:GetAttribute('MapForgeSprinting') == false)
        if enabled then
            local binding = assert(t.cas.bindings.MapForgeSprint) assert(binding.touch and binding.keys[1] == 'LeftShift' and binding.keys[2] == 'ButtonL3')
            local function key(state, code, kind) t.advance(.2) return binding.fn('MapForgeSprint', state, {KeyCode = code or 'LeftShift', UserInputType = kind or 'Keyboard'}) end
            key('Begin') assert(h.WalkSpeed == sprint and t.cas.titles.MapForgeSprint == 'Gehen')
            key('End') assert(h.WalkSpeed == w and t.cas.titles.MapForgeSprint == 'Sprint')
            key('Begin', 'ButtonL3') key('End', 'ButtonL3') assert(h.WalkSpeed == sprint)
            key('Begin', 'ButtonL3') assert(h.WalkSpeed == w)
            key('Begin', nil, 'Touch') key('End', nil, 'Touch') assert(h.WalkSpeed == sprint)
            t.input.WindowFocusReleased:Fire() assert(h.WalkSpeed == w)
            key('Begin') t.input.TextBoxFocused:Fire() assert(h.WalkSpeed == w)
            t.input.focused = {} assert(key('Begin') == 'Pass' and h.WalkSpeed == w) t.input.focused = nil
            key('Begin') t.gui.MenuOpened:Fire() assert(h.WalkSpeed == w)
            t.gui.MenuIsOpen = true assert(key('Begin') == 'Pass' and h.WalkSpeed == w) t.gui.MenuIsOpen = false
            key('Begin') key('Cancel') assert(h.WalkSpeed == w)
            for _, special in ipairs({'Swimming','Climbing'}) do event(true) h.state = special h.StateChanged:Fire() assert(h.WalkSpeed == w) event(true) assert(h.WalkSpeed == w) h.state = 'Running' end
            event(true) h.Sit = true h:GetPropertyChangedSignal('Sit'):Fire() assert(h.WalkSpeed == w) h.Sit = false
            event(true) h.PlatformStand = true h:GetPropertyChangedSignal('PlatformStand'):Fire() assert(h.WalkSpeed == w) event(true) assert(h.WalkSpeed == w) h.PlatformStand = false
            event(true) t.remote.OnServerEvent:Fire(t.p, false) assert(h.WalkSpeed == w)
            t.remote.OnServerEvent:Fire(t.p, true) assert(h.WalkSpeed == w, 'rate-limited start cannot cancel an immediate stop')
            event(true) h.Health = 0 h.Died:Fire() assert(h.WalkSpeed == w) event(true) assert(h.WalkSpeed == w)
        else assert(t.cas.bindings.MapForgeSprint == nil) end
        local new = humanoid() t.p.CharacterRemoving:Fire() t.p.Character = t.char(new) t.p.CharacterAdded:Fire(t.p.Character)
        assert(new.WalkSpeed == w and new.JumpPower == j and not t.p:GetAttribute('MapForgeSprinting'))
        -- A late Humanoid from an older character must not overwrite a new respawn.
        local oldHum = humanoid() local oldChar = {WaitForChild = function() return coroutine.yield() end}
        t.p.Character = oldChar t.p.CharacterAdded:Fire(oldChar)
        local finalHum = humanoid() t.p.Character = t.char(finalHum) t.p.CharacterAdded:Fire(t.p.Character)
        local ok, reason = coroutine.resume(t.pending[#t.pending], oldHum) assert(ok, reason)
        assert(oldHum.WalkSpeed == nil and finalHum.WalkSpeed == w and finalHum.JumpPower == j)
        t.players.PlayerRemoving:Fire(t.p)
        assert(t.p.CharacterAdded:Count() == (enabled and 1 or 0))
        if enabled then t.destroy:Fire() assert(t.cas.bindings.MapForgeSprint == nil and t.p.CharacterAdded:Count() == 0) end
        assert(t.p.CharacterRemoving:Count() == 0)
    end
end
print('Actual movement server/client: four profiles, both modes, input isolation, respawn/race cleanup, bounded sprint intent and stop conditions passed (service doubles)')
