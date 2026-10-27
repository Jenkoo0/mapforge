import {vertices} from './geometry.js';

export const QUALITY_SOURCES=[
 {title:'Roblox · Greybox your environment',url:'https://create.roblox.com/docs/tutorials/curriculums/environmental-art/greybox-your-environment'},
 {title:'Roblox · Construct your world',url:'https://create.roblox.com/docs/tutorials/curriculums/environmental-art/construct-your-world'},
 {title:'Roblox · Improve performance',url:'https://create.roblox.com/docs/performance-optimization/improve'},
 {title:'Roblox · Collisions',url:'https://create.roblox.com/docs/workspace/collisions'},
 {title:'Roblox · Pathfinding',url:'https://create.roblox.com/docs/characters/pathfinding'},
 {title:'Roblox · Test on hardware',url:'https://create.roblox.com/docs/performance-optimization/test-on-hardware'}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:1});
const budgetFor=map=>map.config.mode==='tycoon'?5200:map.config.obbyStyle==='onlyup'?9500:850;
// Small visual objects do not need to cast a separate shadow or answer raycasts.
// Interactive targets remain queryable even when they are non-colliding.
export function partQuery(p){return p.query??Boolean(p.collide||p.role||['stage','spawn','hazard','coin'].includes(p.kind));}
export function partShadow(p){return p.castShadow??Boolean(!p.neon&&(p.transparency||0)<.5&&(p.size[1]>=1&&(p.collide||Math.max(...p.size)>=6)));}
export function mapMetrics(map){
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];let fingerprint=2166136261;
 for(const p of map.parts){
  for(const v of vertices(p))for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],v[i]);hi[i]=Math.max(hi[i],v[i]);}
  for(const ch of JSON.stringify([p.name,p.kind,p.pos,p.size,p.rotation,p.color,p.material,p.neon,p.transparency,p.light,partQuery(p),partShadow(p),p.role,p.sign,p.label,p.collide,p.anchored,p.unlock,p.hiddenAtStart]))fingerprint=Math.imul(fingerprint^ch.charCodeAt(0),16777619);
 }
 const total=map.parts.length,materials={};
 for(const p of map.parts){const key=p.neon?'Neon':p.material||'SmoothPlastic';materials[key]=(materials[key]||0)+1;}
 return {total,initial:map.parts.filter(p=>!p.hiddenAtStart).length,colliding:map.parts.filter(p=>p.collide).length,queries:map.parts.filter(partQuery).length,shadows:map.parts.filter(partShadow).length,lights:map.parts.filter(p=>p.light).length,neon:map.parts.filter(p=>p.neon).length,transparent:map.parts.filter(p=>p.transparency>0&&p.transparency<1).length,spawns:map.parts.filter(p=>p.kind==='spawn').length,bounds:total?hi.map((n,i)=>Math.round((n-lo[i])*10)/10):[0,0,0],materials,budget:budgetFor(map),fingerprint:(fingerprint>>>0).toString(16).padStart(8,'0')};
}
export function metricsHtml(map){
 const m=mapMetrics(map),entries=[['Bauteile',`${fmt(m.total)} / ${fmt(m.budget)}`],['Im Export sichtbar',fmt(m.initial)],['Kollidierende Teile',fmt(m.colliding)],['Lokale Lichtquellen',fmt(m.lights)],['Materialien',fmt(Object.keys(m.materials).length)],['Ausdehnung in Studs',m.bounds.map(fmt).join(' × ')]];
 return `<div class="metrics-heading"><div><span class="tiny-label">DEINE AKTUELLE MAP</span><h2>Qualität wird konkret.</h2></div><span class="beta-tag">${esc(m.fingerprint)}</span></div><div class="metric-grid">${entries.map(([label,value])=>`<div class="metric-item"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('')}</div><p class="micro">Aus der tatsächlichen Export-Geometrie berechnet. Das Bauteilbudget ist ein Planungswert. Licht, Physik und Bildrate prüfst du mit dem Studio-Prüfskript und auf echten Geräten.</p>`;
}
export function qualityDossier(map){
 const m=mapMetrics(map),c=map.config;
 return `# Map-Dossier · ${c.name}\n\nMapForge ${map.version} · Geometrie-Fingerabdruck ${m.fingerprint} (FNV-1a, keine Sicherheitsprüfsumme).\nModus ${c.mode} · Design ${c.theme} · Seed ${c.seed}.\n\n## Gemessene Exportdaten\n| Messwert | Ergebnis |\n| --- | --- |\n| Bauteile (Vollausbau) | ${m.total} |\n| Im Export sichtbar | ${m.initial} |\n| Kollidierende Teile (Vollausbau) | ${m.colliding} |\n| Abfragbare Teile | ${m.queries} |\n| Schattenwerfende Teile | ${m.shadows} |\n| Lokale Lichtquellen (Vollausbau) | ${m.lights} |\n| Neon-Teile | ${m.neon} |\n| Teiltransparente Teile | ${m.transparent} |\n| Echte SpawnLocations | ${m.spawns} |\n| Ausdehnung X × Y × Z | ${m.bounds.join(' × ')} Studs |\n\nMaterialverteilung: ${Object.entries(m.materials).sort((a,b)=>b[1]-a[1]).map(([key,n])=>`${key}: ${n}`).join(', ')}.\n\n## Kriterien für den Entwurf\n- Hauptwege vor Landschaft und Details reservieren. Orientierung über Eingang, Landmarke, Materialzonen und Wegweiser.\n- Statische Geometrie verankern; kleine rein visuelle Details ohne Kollisions- und Abfragekosten. Neon und Transparenz bewusst begrenzen.\n- ${c.mode==='tycoon'?'Spielstart, ersten Ausbau und Vollausbau getrennt beurteilen. Alle Grundstücke und alle Layouts testen.':'Jeden Sprung und Checkpoint mit der exportierten Geh-/Sprunggeschwindigkeit testen; die Datenprüfung ist nur eine konservative Näherung.'}\n\n## So prüfst du den exportierten Platz\n1. Die zu diesem Dossier gehörende frische .rbxlx in einem separaten Testplatz öffnen.\n2. In Studio Play starten, auf Server wechseln und Studio-Map-Audit.lua in der Command Bar ausführen. Das Skript liest nur und läuft ausschließlich in Studio. Output enthält Spawn-Freiraum, echte Instanzzahlen und beim Tycoon berechnete Wege zu den Eingängen und Sammelstellen.\n3. Tycoon: zunächst leer testen, dann über die Studio-Testhelfer voll ausbauen und erneut prüfen. Nicht gebaute Teile beeinflussen die Navigation noch nicht. Es wird der tatsächlich geladene Stand geprüft; Streaming/Client-Ansichten separat testen.\n4. ${c.mode==='tycoon'?'Jedes Grundstück beanspruchen, Produktion starten, zum Tresor und zum nächsten Kauf gehen.':'Jeden Abschnitt ohne Boost schaffen, Tod und Respawn an jedem Checkpoint prüfen.'} Mit zwei Spielern und Touch wiederholen.\n5. Auf einem echten schwachen Gerät Bildrate, Speicher und Beitrittszeit messen. Bei Problemen MicroProfiler nutzen, Details oder Lichtquellen gezielt reduzieren und denselben Ablauf erneut messen.\n\nEin erfolgreicher Pathfinding-Aufruf bestätigt einen berechneten Weg für AgentRadius 2 / AgentHeight 5. Er beweist keine Obby-Sprünge, keine Bedienbarkeit, keine stabilen FPS und keinen Spielspaß. Fehler sind Hinweise zur Untersuchung; das Skript repariert oder veröffentlicht nichts.\n\n## Recherche · geprüft am 24.10.2026\n${QUALITY_SOURCES.map(s=>`- [${s.title}](${s.url})`).join('\n')}\n\nDiese Entscheidungen übertragen offizielle Roblox-Empfehlungen auf den vorhandenen prozeduralen Generator. Ein Sprachmodell oder Roblox Studio wird bei der Browser-Generierung nicht ausgeführt.\n`;
}
export function studioMapAudit(map){
 const m=mapMetrics(map),tycoon=map.config.mode==='tycoon';
 return `-- MapForge ${map.version} · Studio Map Audit · expected geometry ${m.fingerprint}
-- READ ONLY. Run in Studio Play > Server > Command Bar, on a separate test place.
-- Inspects the currently loaded world, not a simulated full build. Does not alter the place.
local RunService = game:GetService("RunService")
assert(RunService:IsStudio(), "MapForge audit is only available in Roblox Studio")
local world = workspace:FindFirstChild("MapForgeWorld")
assert(world, "MapForgeWorld missing: open the matching complete .rbxlx")
local parts, spawns, targets = {}, {}, {}
local unanchored, colliding, lights, hidden = 0, 0, 0, 0
for _, obj in ipairs(world:GetDescendants()) do
 if obj:IsA("BasePart") then
  table.insert(parts, obj)
  if not obj.Anchored then unanchored = unanchored + 1 end
  if obj.CanCollide then colliding = colliding + 1 end
  if obj.Transparency >= 1 then hidden = hidden + 1 end
  if obj:IsA("SpawnLocation") then table.insert(spawns, obj) end
  local role = obj:FindFirstChild("MFRole")
  if role and (role.Value == "Claim" or role.Value == "Collect") then table.insert(targets, obj) end
 elseif obj:IsA("PointLight") and obj.Enabled then lights = lights + 1 end
end
print(string.format("[MapForge Audit] Parts=%d, colliding=%d, hidden=%d, active lights=%d, unanchored=%d", #parts, colliding, hidden, lights, unanchored))
if #parts ~= ${m.total} then warn("[MapForge Audit] Expected ${m.total} generated parts; current world differs or is only partially loaded") end
if unanchored > 0 then warn("[MapForge Audit] Inspect unanchored map parts") end
if #spawns ~= 1 then warn("[MapForge Audit] Expected exactly one SpawnLocation, found " .. #spawns) end
for _, spawn in ipairs(spawns) do
 local params = OverlapParams.new()
 params.FilterType = Enum.RaycastFilterType.Exclude
 params.FilterDescendantsInstances = {spawn}
 local center = spawn.CFrame + Vector3.new(0, spawn.Size.Y / 2 + 3, 0)
 local blocked = {}
 for _, hit in ipairs(workspace:GetPartBoundsInBox(center, Vector3.new(4, 5, 4), params)) do
  if hit:IsDescendantOf(world) and hit.CanCollide then table.insert(blocked, hit.Name) end
 end
 if #blocked > 0 then warn("[MapForge Audit] Spawn clearance: " .. table.concat(blocked, ", ")) else print("[MapForge Audit] Spawn clearance OK (4x5x4 bounding box)") end
end
if ${tycoon} and #spawns == 1 and RunService:IsRunning() then
 local PathfindingService = game:GetService("PathfindingService")
 table.sort(targets, function(a,b) return a.Name < b.Name end)
 for _, target in ipairs(targets) do
  local role = target:FindFirstChild("MFRole")
  -- Approach collectors from the side, safely inside the floor footprint.
  local offset = role and role.Value == "Collect" and Vector3.new(target.Size.X / 2 + 4, 0, 0) or Vector3.new(0, 0, target.Size.Z / 2 + 4)
  local destination = target.CFrame:PointToWorldSpace(offset)
  local ok, result = pcall(function()
   local path = PathfindingService:CreatePath({AgentRadius=2, AgentHeight=5, AgentCanJump=true, WaypointSpacing=4})
   path:ComputeAsync(spawns[1].Position + Vector3.new(0, 3, 0), destination)
   return path.Status
  end)
  if ok and result == Enum.PathStatus.Success then print("[MapForge Audit] Path OK: " .. target.Name) else warn("[MapForge Audit] Inspect route to " .. target.Name .. ": " .. tostring(result)) end
 end
else
 print("[MapForge Audit] Pathfinding skipped. Tycoon paths require Studio Play > Server; Obby jumps require a real playtest.")
end
print("[MapForge Audit] Done. Real mobile, multiplayer, physics, streaming, saving and purchase tests remain open.")
`;
}
