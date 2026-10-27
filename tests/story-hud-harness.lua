-- Execute both actual clients with UI/service doubles, never Roblox Studio.
local function signal()
    local s = {handlers = {}}
    function s:Connect(fn) table.insert(self.handlers, fn) end
    function s:Fire(...) for _, fn in ipairs(self.handlers) do fn(...) end end
    return s
end
local methods = {}
local function object(class)
    return setmetatable({class = class, props = {}, children = {}, properties = {}, signals = {}, attributes = {}, Activated = signal()}, {
        __index = function(t, key) return methods[key] or t.props[key] end,
        __newindex = function(t, key, value)
            if key == "Parent" then
                local previous = t.props.Parent
                if previous then for i, child in ipairs(previous.children) do if child == t then table.remove(previous.children, i) break end end end
                if value then table.insert(value.children, t) end
            end
            local old = t.props[key] t.props[key] = value
            if old ~= value and t.properties[key] then t.properties[key]:Fire() end
        end,
    })
end
function methods:GetChildren() local result = {} for _, child in ipairs(self.children) do table.insert(result, child) end return result end
function methods:GetDescendants() local result = {} for _, child in ipairs(self.children) do table.insert(result, child) for _, other in ipairs(child:GetDescendants()) do table.insert(result, other) end end return result end
function methods:Destroy() for _, child in ipairs(self:GetChildren()) do child:Destroy() end self.Parent = nil self.destroyed = true end
function methods:FindFirstChild(name, recursive)
    for _, child in ipairs(self.children) do if child.Name == name then return child end end
    if recursive then for _, child in ipairs(self.children) do local found = child:FindFirstChild(name, true) if found then return found end end end
end
function methods:IsA(class) return self.class == class or class == "BasePart" and self.class == "Part" end
function methods:GetAttribute(name) return self.attributes[name] end
function methods:SetAttribute(name, value) self.attributes[name] = value if self.signals[name] then self.signals[name]:Fire() end end
function methods:GetAttributeChangedSignal(name) if not self.signals[name] then self.signals[name] = signal() end return self.signals[name] end
function methods:GetPropertyChangedSignal(name) if not self.properties[name] then self.properties[name] = signal() end return self.properties[name] end

local function boot(mode, withStory)
    local pg, player, world = object("PlayerGui"), object("Player"), object("Folder")
    function player:WaitForChild(name) assert(name == "PlayerGui") return pg end
    world.DescendantAdded = signal() world.DescendantRemoving = signal()
    local action = {events = {}} function action:FireServer(...) table.insert(self.events, {...}) end
    local notice, update = {OnClientEvent = signal()}, {OnClientEvent = signal()}
    local remotes = {WaitForChild = function(_, name) return assert(({Action = action, Notice = notice, Update = update})[name]) end}
    local config = {Name = "Story HUD Test", StageCount = 12, UpgradeCount = 48, ShopEnabled = false, ShopHints = false, Products = {Boost15 = 0, Coins500 = 0}, Passes = {}, Skins = {}, Research = {}, Quests = {}}
    if withStory then config.Story = {
        Title = "Ein manuell lesbares Journal", Premise = "Die Ausgangslage bleibt jederzeit nachlesbar.", Goal = "Erreiche das vorhandene Spielziel.",
        Chapters = {
            {Title = "Geheimer Titel eins", Text = "ERSTER-KAPITELTEXT", Target = mode == "tycoon" and 1 or 0},
            {Title = "Geheimer Titel zwei", Text = "ZWEITER-KAPITELTEXT", Target = mode == "tycoon" and 24 or 6},
            {Title = "Geheimer Titel drei", Text = "DRITTER-KAPITELTEXT", Target = mode == "tycoon" and 48 or 12},
        },
    } end
    local rs = {WaitForChild = function(_, name) return name == "MapForgeConfig" and config or remotes end}
    local services = {Players = {LocalPlayer = player}, ReplicatedStorage = rs, MarketplaceService = {}, TweenService = {}}
    game = {GetService = function(_, name) return assert(services[name], name) end}
    workspace = {WaitForChild = function() return world end, FindFirstChild = function() return world end}
    Instance = {new = object}
    UDim2 = {new = function(...) return {...} end, fromOffset = function(x, y) return {0, x, 0, y} end, fromScale = function(x, y) return {x, 0, y, 0} end}
    UDim = {new = function(...) return {...} end}
    Vector2 = {new = function(x, y) return {X = x, Y = y} end}
    Vector3 = {new = function(...) return {...} end}
    Color3 = {fromRGB = function(...) return {...} end}
    Enum = setmetatable({}, {__index = function(t, key) local value = setmetatable({}, {__index = function(_, name) return key .. "." .. name end}) rawset(t, key, value) return value end})
    task = {delay = function() end, spawn = function() end}
    warn = function() end require = function(value) return value end
    local path = mode == "tycoon" and CLIENT_PATH or CLIENT_PATH:gsub("tycoon%-client%.lua$", "client.lua")
    assert(loadfile(path))()
    local result = {pg = pg, player = player, action = action, notice = notice, update = update, config = config}
    function result:find(name) return pg:FindFirstChild(name, true) end
    function result:hasText(text)
        for _, child in ipairs(pg:GetDescendants()) do if type(child.Text) == "string" and string.find(child.Text, text, 1, true) then return true end end
        return false
    end
    result.state = {Count = 0, Cash = 0, Bank = 0, Gems = 0, Rebirths = 0, Income = 0, Boost = 0, Plot = 1, FirstCollect = false, Next = {Id = "u01", Name = "Starter", Cost = 0, Income = 2}, Research = {}, Skins = {}, Daily = {}, Flags = {}}
    function result:progress(value)
        if mode == "tycoon" then self.state.Count = value self.update.OnClientEvent:Fire(self.state)
        else self.player:SetAttribute("Stage", value) end
    end
    result:progress(0)
    return result
end

for _, mode in ipairs({"tycoon", "obby"}) do
    local absent = boot(mode, false)
    assert(not absent:find("MapForgeNav_story") and not absent:find("MapForgeStoryToggle"), mode .. ": no destination without a story")
    assert(not absent:find("MapForgeStoryJournal"), mode .. ": no unused journal")

    local h = boot(mode, true)
    local toggle = assert(h:find(mode == "tycoon" and "MapForgeNav_story" or "MapForgeStoryToggle"))
    local count = #h.action.events
    assert(not h:find("MapForgeStoryChapter_1") or h:find("MapForgeStoryJournal").Visible == false, mode .. ": journal never opens itself")
    h:progress(mode == "tycoon" and 24 or 6)
    if mode == "obby" then assert(h:find("MapForgeStoryJournal").Visible == false, "progress cannot auto-open the journal") end
    h:progress(0)
    toggle.Activated:Fire()
    assert(#h.action.events == count, mode .. ": opening stories sends no server command or purchase")
    assert(h:hasText(h.config.Story.Premise) and h:hasText(h.config.Story.Goal))
    assert(not h:hasText("ZWEITER-KAPITELTEXT") and not h:hasText("DRITTER-KAPITELTEXT"), mode .. ": locked chapter bodies are absent")
    assert(not h:hasText("Geheimer Titel zwei") and not h:hasText("Geheimer Titel drei"), mode .. ": future titles are not spoilers")
    assert(h:hasText(mode == "tycoon" and "0/24 Ausbauten" or "Abschnitt 0/6"), mode .. ": locked chapter shows real progress")
    assert(h:hasText("ERSTER-KAPITELTEXT") == (mode == "obby"), mode .. ": a stage-zero chapter is readable at the start")

    local chapter = assert(h:find("MapForgeStoryChapter_2"))
    local scroll, screen = chapter.Parent, chapter.Parent.Parent.Parent
    assert(chapter.AutomaticSize == Enum.AutomaticSize.Y and chapter.TextWrapped, "journal text wraps and grows vertically")
    scroll.CanvasPosition = Vector2.new(0, 73)
    local children = #scroll:GetChildren()
    h:progress(mode == "tycoon" and 23 or 5)
    assert(not h:hasText("ZWEITER-KAPITELTEXT"), mode .. ": immediately before target remains locked")
    h:progress(mode == "tycoon" and 24 or 6)
    assert(h:hasText("ZWEITER-KAPITELTEXT") and not h:hasText("DRITTER-KAPITELTEXT"), mode .. ": exact milestone unlocks only its chapter")
    assert(h:find("MapForgeStoryChapter_2") == chapter and not chapter.destroyed and #scroll:GetChildren() == children, mode .. ": progress reuses rows")
    assert(scroll.CanvasPosition.Y == 73, mode .. ": updates preserve reading position")

    for _, size in ipairs({{390, 760}, {844, 350}, {320, 240}}) do
        screen.AbsoluteSize = Vector2.new(size[1], size[2])
        local panel = scroll.Parent
        assert(panel.Size[2] <= size[1] - 24 and panel.Size[4] <= size[2] - 24, mode .. ": journal fits viewport")
        if mode == "obby" then
            local buttons = {h:find("MapForgeShopToggle"), h:find("MapForgeRestartToggle"), toggle}
            for i, button in ipairs(buttons) do
                assert(button.Position[2] >= 12 and button.Position[2] + button.Size[2] <= size[1] - 12, "touch controls stay inside screen")
                assert(button.Position[4] + button.Size[4] <= size[2] - 12)
                if i > 1 then assert(button.Position[2] >= buttons[i - 1].Position[2] + buttons[i - 1].Size[2] + 7, "controls do not overlap") end
            end
        end
    end

    h:progress(mode == "tycoon" and 48 or 12)
    assert(h:hasText("DRITTER-KAPITELTEXT"), mode .. ": completion exposes final chapter")
    if mode == "tycoon" then h.state.Rebirths = 1 end
    h:progress(0)
    assert(not h:hasText("ZWEITER-KAPITELTEXT") and not h:hasText("DRITTER-KAPITELTEXT"), mode .. ": restart/rebirth clears chapter access")
    assert(h:hasText("ERSTER-KAPITELTEXT") == (mode == "obby"), mode .. ": reset follows actual progress instead of a saved read flag")

    if mode == "obby" then
        local journal = h:find("MapForgeStoryJournal")
        h:find("MapForgeShopToggle").Activated:Fire()
        local shop
        for _, child in ipairs(h.pg:GetDescendants()) do if child.Text == "DEIN SHOP" then shop = child.Parent end end
        assert(shop and shop.Visible and not journal.Visible, "opening shop closes story modal")
        toggle.Activated:Fire()
        assert(journal.Visible and not shop.Visible, "opening story closes shop modal")
        local close
        for _, child in ipairs(journal:GetChildren()) do if child.Text == "×" then close = child end end
        assert(close).Activated:Fire() h:progress(12)
        assert(not journal.Visible, "completion never reopens a dismissed journal")
        toggle.Activated:Fire() assert(h:hasText("DRITTER-KAPITELTEXT"), "reopening reads latest server stage")
    else
        h:find("MapForgeNav_help").Activated:Fire()
        assert(not h:find("MapForgeStoryChapter_2") and chapter.destroyed, "help replaces story content in the existing drawer")
        toggle.Activated:Fire()
        assert(not h:hasText("ZWEITER-KAPITELTEXT"), "reopening story applies reset progress")
    end
    assert(#h.action.events == count, mode .. ": reading and unlocking never grants rewards or sends purchases")
end
print("Actual story HUDs: optional UI, manual reading, no spoilers, exact milestones, reset, viewport fit, cached rows and exclusive panels passed (service doubles)")
