"""Structural checks only: does not claim a Roblox Studio import/playtest."""
from pathlib import Path
import math
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
import re

ROOT = Path(__file__).resolve().parent.parent
for path in sorted((ROOT / "examples").glob("*.rbxlx")):
    root = ET.parse(path).getroot()
    items = root.findall(".//Item")
    refs = [item.attrib["referent"] for item in items]
    assert len(refs) == len(set(refs)), path
    assert len(root.findall('.//Item[@class="SpawnLocation"]')) == 1
    tycoon = path.name.startswith("Tycoon-")
    onlyup = path.name.startswith("OnlyUp-")
    assert len(root.findall('.//ProtectedString[@name="Source"]')) == (17 if tycoon else 16)
    lighting=root.find('./Item[@class="Lighting"]')
    assert lighting is not None
    lp=lighting.find('Properties')
    assert lp.find('token[@name="Technology"]').text == '4'
    assert lp.find('token[@name="LightingStyle"]').text == '0'
    assert lp.find('bool[@name="PrioritizeLightingQuality"]').text == 'true'
    assert float(lp.find('float[@name="ExposureCompensation"]').text) < 0
    grading=lighting.find('./Item[@class="ColorGradingEffect"]/Properties')
    assert grading.find('token[@name="TonemapperPreset"]').text == '0'
    for gui in root.findall('.//Item[@class="BillboardGui"]'):
        assert float(gui.find('Properties/float[@name="MaxDistance"]').text) <= 28
    surfaces=root.findall('.//Item[@class="SurfaceGui"]')
    assert bool(surfaces) == (tycoon or onlyup)
    for gui in surfaces:
        assert gui.find('Properties/token[@name="Face"]').text in ('5','2')
        assert float(gui.find('Properties/float[@name="MaxDistance"]').text) <= 55
    stages = []
    for item in items:
        if item.attrib["class"] not in ("Part", "SpawnLocation"):
            continue
        props = item.find("Properties")
        assert props.find('bool[@name="Anchored"]').text == "true"
        assert props.find('Color3uint8[@name="Color3uint8"]') is not None
        assert props.find('Vector3[@name="size"]') is not None
        assert all(math.isfinite(float(n.text)) for n in props.findall('CoordinateFrame/*'))
        name = props.find('string[@name="Name"]').text
        if name.startswith("Stage_"):
            stages.append(int(name.split("_")[1]))
    if tycoon:
        plots = {}
        for item in items:
            if item.attrib["class"] != "Part": continue
            def val(name):
                child = next((x for x in item.findall("Item") if x.find('Properties/string[@name="Name"]') is not None and x.find('Properties/string[@name="Name"]').text == name), None)
                return child.find("Properties/*[@name='Value']").text if child is not None else None
            if val("MFRole") == "Button":
                plots.setdefault(val("MFPlot"), set()).add(val("MFUpgrade"))
        cylinders=root.findall('.//token[@name="shape"]')
        assert sum(x.text == "2" for x in cylinders) > 50
        assert root.findall('.//Item[@class="Atmosphere"]')
        assert root.findall('.//Item[@class="PointLight"]')
        assert root.find('.//bool[@name="StreamingEnabled"]').text == "true"
        assert any(x.text == "MFTransparency" for x in root.findall('.//string[@name="Name"]'))
        assert len(plots) == 4
        assert all(len(v) == 48 for v in plots.values())
    else:
        project=__import__('json').loads(path.with_suffix('.mapforge.json').read_text(encoding='utf-8'))
        assert sorted(stages) == list(range(project['config']['stages']+1))
    print(f"{path.name}: valid XML, {len(items)} unique instances, structure and runtime sources checked")

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.assets = [], []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for attr in ("href", "src"):
            value = attrs.get(attr, "")
            if value and not value.startswith(("#", "http")):
                self.assets.append(value)

html = (ROOT / "web/index.html").read_text(encoding="utf-8")
doc = Document()
doc.feed(html)
# These fixed elements are mounted by the cosmetics setup component, not index.html.
# Computed offer IDs are exercised by the actual-app export tests.
component = (ROOT / "web/cosmetics.js").read_text(encoding="utf-8")
doc.ids.extend(re.findall(r'\bid="([A-Za-z][\w-]*)"', component))
assert len(doc.ids) == len(set(doc.ids)), "duplicate HTML IDs"
for asset in doc.assets:
    assert (ROOT / "web" / asset).exists(), asset
app = (ROOT / "web/app.js").read_text(encoding="utf-8")
for identifier in re.findall(r"\$\('([\w-]+)'\)", app):
    assert identifier in doc.ids, f"Missing element {identifier}"
for extra in ["trend-ui.js"]:
    source = (ROOT / "web" / extra).read_text(encoding="utf-8")
    for identifier in re.findall(r"\$\('([\w-]+)'\)", source):
        assert identifier in doc.ids, f"Missing element {identifier}"
print("HTML assets, unique IDs and application/trend element bindings passed")
