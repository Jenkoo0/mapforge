// Curated parameter studies, not new game systems or copied environments.
// Official references were opened and reviewed on 26 October 2026.
const REFERENCES = {
  modular: {
    title: 'Assemble modular environments',
    url: 'https://create.roblox.com/docs/tutorials/use-case-tutorials/modeling/assemble-modular-environments',
    principle: 'Wiederkehrende Bauteile zu unterschiedlichen Baugruppen und Silhouetten kombinieren.',
  },
  greybox: {
    title: 'Greybox your environment',
    url: 'https://create.roblox.com/docs/tutorials/curriculums/environmental-art/greybox-your-environment',
    principle: 'Wegführung und Größen zuerst prüfen, danach die Umgebung ausarbeiten.',
  },
  polish: {
    title: 'Apply polished assets',
    url: 'https://create.roblox.com/docs/tutorials/curriculums/core/building/apply-polished-assets',
    principle: 'Plattformen und Umgebung mit einer durchgängigen Formsprache gestalten.',
  },
};

const directions = [
  {
    id: 'prismahafen', title: 'Prismahafen', mode: 'tycoon',
    hook: 'Eine Kristallfabrik wächst zu einer gestaffelten Industriekulisse.',
    shape: 'Türme bündeln sich hinten zur zentralen Skyline; davor bleiben Produktion und Wege lesbar. Kühles Metall, Glas und mintfarbene Kristallakzente.',
    scope: '48 kaufbare Ausbauten je Grundstück, vorhandene Produktionsschleife und eine Kristall-Landmarke im späteren Ausbau. Skyline-Anordnung mit Umgebungsdetails.',
    config: { mode: 'tycoon', theme: 'sky', layout: 'skyline', detail: 3, polish: 1, pacing: 'brisk' },
    sources: [REFERENCES.modular, REFERENCES.greybox],
  },
  {
    id: 'blattwerk-campus', title: 'Blattwerk Campus', mode: 'tycoon',
    hook: 'Die Biofabrik fühlt sich wie ein Netz aus grünen Werkhöfen an.',
    shape: 'Gleiche Maschinentypen bilden Werkbereiche; Holzwege, bepflanzte Beete und Blütendetails verbinden die niedrigen Hallen mit den Randtürmen.',
    scope: '48 kaufbare Ausbauten je Grundstück, thematische Bio-Maschinen und die vorhandene Produktionsschleife. Campus-Anordnung mit hohem Umgebungsdetailgrad.',
    config: { mode: 'tycoon', theme: 'jungle', layout: 'campus', detail: 2, polish: 2, pacing: 'balanced' },
    sources: [REFERENCES.modular, REFERENCES.polish],
  },
  {
    id: 'glutachse', title: 'Glutachse', mode: 'tycoon',
    hook: 'Eine dunkle Gießerei erzählt ihren Ausbau entlang einer Produktionsstraße.',
    shape: 'Maschinen folgen dem Baufortschritt, hohe Gebäude stehen am hinteren Rand. Basaltflächen, warme Erzfarben und eine kantige Fels-Landmarke geben der Fabrik Gewicht.',
    scope: '48 kaufbare Ausbauten je Grundstück mit Vulkan-Maschinennamen und vorhandener Produktionsschleife. Lineare Anordnung und die langsamere bestehende Baukostenkurve.',
    config: { mode: 'tycoon', theme: 'lava', layout: 'flow', detail: 3, polish: 1, pacing: 'relaxed' },
    sources: [REFERENCES.modular, REFERENCES.greybox],
  },
  {
    id: 'wolkensaum', title: 'Wolkensaum', mode: 'obby',
    hook: 'Eine kurze, sanft steigende Inselrunde für einen übersichtlichen Einstieg.',
    shape: 'Helle Plattformen ziehen einen weichen Bogen durch Wolken und schwebende Nebeninseln. Kleine Höhenunterschiede halten das Ziel räumlich nah.',
    scope: '18 Abschnitte, leichte Hindernisdichte, 2,5 Studs konfigurierter Abstand, 0,6 Studs Anstieg und Checkpoints alle 3 Abschnitte. Vorhandene Münzen und Zielmarkierung.',
    config: { mode: 'obby', theme: 'sky', stages: 18, difficulty: 'easy', gap: 2.5, rise: .6, checkpointEvery: 3, detail: 2 },
    sources: [REFERENCES.greybox, REFERENCES.polish],
  },
  {
    id: 'signalsteg', title: 'Signalsteg', mode: 'obby',
    hook: 'Ein Stadtsignal wird zu einem aufsteigenden Zickzack-Parcours.',
    shape: 'Gerade Läufe und Richtungswechsel falten die Strecke zwischen metallischen Plattformen und kleinen Gebäudekulissen. Mintfarbene Kanten markieren die Route.',
    scope: '36 Abschnitte, normale Hindernisdichte, 4 Studs konfigurierter Abstand, 1,4 Studs Anstieg und Checkpoints alle 5 Abschnitte. Vorhandene Hindernisse, Gefahren und Münzen.',
    config: { mode: 'obby', theme: 'neon', stages: 36, difficulty: 'normal', gap: 4, rise: 1.4, checkpointEvery: 5, detail: 2 },
    sources: [REFERENCES.greybox, REFERENCES.modular],
  },
  {
    id: 'aschepfad', title: 'Aschepfad', mode: 'obby',
    hook: 'Eine längere Vulkanroute setzt auf Höhe, Kehren und dichtere Hindernisse.',
    shape: 'Basaltplattformen steigen in kantigen Bahnen an. Dunkle Felsen, helle Glutlinien und wiederkehrende Checkpoint-Tore gliedern den langen Aufstieg.',
    scope: '54 Abschnitte, hohe Hindernisdichte, 5 Studs konfigurierter Abstand, 2,2 Studs Anstieg und Checkpoints alle 6 Abschnitte. Vorhandene Hindernisse, Gefahren und Münzen.',
    config: { mode: 'obby', theme: 'lava', stages: 54, difficulty: 'hard', gap: 5, rise: 2.2, checkpointEvery: 6, detail: 2 },
    sources: [REFERENCES.greybox, REFERENCES.polish],
  },
  {
    id: 'nachtpost', title: 'Nachtpost', mode: 'tycoon',
    hook: 'Zwischen Neonfenstern warten Briefe, die noch niemand geschrieben hat.',
    shape: 'Kühle Werkhöfe bündeln gleiche Maschinen. Niedrige Hallen, Lichtgärten und Randtürme lassen die zentralen Wege offen.',
    scope: '48 vorhandene Produktionsausbauten mit Neon-Maschinen, Campus-Anordnung und ausgearbeiteten Umgebungsdetails. Die Postgeschichte ist ein Erzählrahmen; ein Brief- oder Liefersystem ist nicht enthalten.',
    config: { mode: 'tycoon', theme: 'neon', layout: 'campus', detail: 2, polish: 2, pacing: 'brisk' },
    sources: [REFERENCES.modular, REFERENCES.greybox],
  },
  {
    id: 'kupferpause', title: 'Kupferpause', mode: 'tycoon',
    hook: 'Zwischen warmem Basalt und Werkhallen sucht eine Stadt ihre verlorene Mittagspause.',
    shape: 'Erdfarbene Maschinenhöfe, gegliederte Werkbereiche und eine kantige Landmarke bilden ein kompaktes Vulkanwerk. Glut bleibt ein Akzent.',
    scope: '48 vorhandene Ausbauten, Campus-Anordnung, mittlerer Umgebungsdetailgrad und zusätzliche Gestaltung. Kein Kochsystem, kein Stadt-NPC und keine neue Pausenmechanik.',
    config: { mode: 'tycoon', theme: 'lava', layout: 'campus', detail: 2, polish: 2, pacing: 'balanced' },
    sources: [REFERENCES.modular, REFERENCES.polish],
  },
  {
    id: 'wolkenfundamt', title: 'Wolkenfundamt', mode: 'tycoon',
    hook: 'Ein Fundamt für verlorene Schatten erhält eine helle Kristallwerkstatt als Zuhause.',
    shape: 'Die Produktionsstraße folgt der Baufolge, während hohe Gebäude den hinteren Rand fassen. Glas, Metall und helle Kristallgruppen gliedern die Werkstatt.',
    scope: '48 vorhandene Produktionsausbauten in Flow-Anordnung, zügige bestehende Baukostenkurve und zusätzliche Gestaltung. Schatten sind Teil der Geschichte, keine sammelbaren Gegenstände.',
    config: { mode: 'tycoon', theme: 'sky', layout: 'flow', detail: 2, polish: 2, pacing: 'brisk' },
    sources: [REFERENCES.greybox, REFERENCES.polish],
  },
  {
    id: 'tautreppe', title: 'Tautreppe', mode: 'obby',
    hook: 'Eine kleine Morgenreise steigt zwischen Blättern und schwebenden Inseln auf.',
    shape: 'Eine grüne Spiralroute mit niedrigen Höhenwechseln. Dichte Baumkronen und Nebeninseln rahmen die Plattformen, ohne neue Sprungfähigkeiten einzuführen.',
    scope: '24 Abschnitte, leichte Hindernisdichte, 2 Studs konfigurierter Abstand, 0,45 Studs Anstieg und Checkpoints alle 3 Abschnitte. Vorhandene Gefahren bleiben aktiv; kein gefahrloser Spaziermodus.',
    config: { mode: 'obby', theme: 'jungle', stages: 24, difficulty: 'easy', gap: 2, rise: .45, checkpointEvery: 3, detail: 3 },
    sources: [REFERENCES.greybox, REFERENCES.polish],
  },
  {
    id: 'mondumschlag', title: 'Mondumschlag', mode: 'obby',
    hook: 'Ein wortloser Brief folgt einer Wolkenspirale bis zum Rand des Mondlichts.',
    shape: 'Helle Inseln ziehen eine steigende Kurve, Wolkenkörper und Kristallakzente setzen wiederkehrende räumliche Bezugspunkte.',
    scope: '30 Abschnitte, normale Hindernisdichte, 3,2 Studs konfigurierter Abstand, 1 Stud Anstieg und Checkpoints alle 5 Abschnitte. Kein Flug, Mondziel-Asset oder transportierbarer Brief.',
    config: { mode: 'obby', theme: 'sky', stages: 30, difficulty: 'normal', gap: 3.2, rise: 1, checkpointEvery: 5, detail: 3 },
    sources: [REFERENCES.modular, REFERENCES.greybox],
  },
  {
    id: 'nachtgarten', title: 'Nachtgarten', mode: 'obby',
    hook: 'Folge dem Fensterlicht über einer Stadt, die noch nicht schlafen will.',
    shape: 'Eine flach steigende Zickzackroute läuft zwischen vorhandenen Gebäudekulissen. Viele kleine Stadtdetails kontrastieren mit klaren Plattformen.',
    scope: '20 Abschnitte, leichte Hindernisdichte, 2,8 Studs konfigurierter Abstand, 0,5 Studs Anstieg und Checkpoints alle 4 Abschnitte. Kein Pflanzen-, Tageszeiten- oder Schlafsystem; vorhandene Gefahren bleiben aktiv.',
    config: { mode: 'obby', theme: 'neon', stages: 20, difficulty: 'easy', gap: 2.8, rise: .5, checkpointEvery: 4, detail: 3 },
    sources: [REFERENCES.greybox, REFERENCES.polish],
  },
];

// These are editorial story beats tied to existing progress, not runtime quests.
const upgradeChapter = (count, title, text) => ({ title, text, trigger: { kind: 'upgrade', id: `u${String(count).padStart(2, '0')}`, count } });
const stageChapter = (index, title, text) => ({ title, text, trigger: { kind: 'stage', index } });
const stories = {
  prismahafen: {
    premise: 'Am Rand des Himmels suchen die Farben vergessener Regenbögen einen Hafen. Zwischen Kristall und Glas wächst eine Stadt, in der selbst das blasseste Blau einen Platz findet.',
    playerRole: 'Hafenmeisterin oder Hafenmeister der verlorenen Farben.',
    goal: 'Baue den Gratis-Starter und entwickle dein Grundstück bis zum 48. Ausbau.',
    chapters: [
      upgradeChapter(1, 'Die erste Farbe', 'Ein einzelner Kristallsammler steht im weiten Hof. Sein heller Akzent ist das erste Hafenlicht; ringsum wartet noch genug Himmel auf eine Farbe.'),
      upgradeChapter(30, 'Ein Zeichen am Horizont', 'Die Kristall-Landmarke ragt über die Werkhöfe. Zwischen den Türmen liegt ein Stück Himmel wie ein offenes Hafentor.'),
      upgradeChapter(48, 'Platz für alle Farben', 'Unter dem Weltwunder stehen Hallen, Türme und Kristalle dicht beieinander. Vom Eingang aus passt die ganze leuchtende Stadt in einen einzigen Blick.'),
    ],
  },
  'blattwerk-campus': {
    premise: 'Wo bewahrt der Frühling den Duft nach Regen auf? Zwischen grünen Werkhöfen entsteht sein Archiv: mit Beeten vor den Hallen und einem Gewächshaus für die stillen Nachmittage.',
    playerRole: 'Gärtnerische Werkleitung für das Archiv des Frühlings.',
    goal: 'Starte die Saatgut-Produktion und vervollständige alle 48 Ausbauten deines Campus.',
    chapters: [
      upgradeChapter(1, 'Ein Samenkorn aus Metall', 'Der Saatgutsammler steht zwischen Holzwegen und frischem Grün. Eine kleine Maschine für einen großen Anfang: Hier bekommt der Frühling seinen ersten Werkhof.'),
      upgradeChapter(34, 'Ein Dach für den Regen', 'Das Gewächshaus schließt eine helle Lücke zwischen den Hallen. Hinter seinem Glas scheint selbst ein grauer Nachmittag einen grünen Rand zu haben.'),
      upgradeChapter(48, 'Der Frühling bleibt als Bild', 'Beete, Hallen und Türme fassen die fertigen Höfe. Auf dem Weg zurück zum Eingang fällt auf, wie viele kleine grüne Ecken zwischen die Maschinen passen.'),
    ],
  },
  glutachse: {
    premise: 'Tief im dunklen Erz liegt die Wärme eines alten Berges. Entlang einer Straße aus Basalt wächst eine Gießerei, deren helle Kanten diese Wärme bis an den Himmel tragen.',
    playerRole: 'Werkleitung einer Gießerei für warme Berggeschichten.',
    goal: 'Entwickle deine Gießerei entlang der Produktionsstraße bis zum 48. Ausbau.',
    chapters: [
      upgradeChapter(1, 'Ein Funke im Erz', 'Der erste Erzsammler setzt einen warmen Punkt in den dunklen Hof. Hinter ihm liegt noch eine lange Straße, breit genug für ein ganzes Werk.'),
      upgradeChapter(24, 'Wärme in der Mitte', 'Der Reaktor steht im Herzen der Gießerei. Zwischen kantigen Hallen und Basaltflächen hat die Glut nun einen festen Mittelpunkt.'),
      upgradeChapter(48, 'Der Berg bekommt eine Silhouette', 'Über der fertigen Produktionsstraße steht das Weltwunder. Vom Eingang bis zu den hinteren Türmen zieht sich eine neue Bergkante aus Metall und warmem Licht.'),
    ],
  },
  wolkensaum: {
    premise: 'Am Horizont hat sich eine Naht gelöst. Die Wolken halten ihre Ränder noch zusammen, und eine Reihe heller Inseln zieht sich wie ein lockerer Faden durch den Himmel.',
    playerRole: 'Horizontschneiderin oder Horizontschneider auf einer Reise ohne Nadel.',
    goal: 'Erreiche die Zielplattform nach 18 Abschnitten; Münzen bleiben unterwegs optional.',
    chapters: [
      stageChapter(3, 'Der erste Stich', 'Die ersten Inseln liegen schon hinter dir. Zwischen ihren hellen Kanten spannt sich der erste kleine Bogen; der weite Himmel fühlt sich ein Stück näher an.'),
      stageChapter(9, 'Ein Bogen im Himmel', 'Die Inseln ziehen eine sanfte Kurve durch die Wolken. Hier in der Mitte lässt sich ihr Faden in beide Richtungen verfolgen.'),
      stageChapter(18, 'Der Horizont hält', 'Der letzte Sprung ist geschafft. Hinter dir liegt eine feine Naht aus hellen Inseln, und der Horizont sieht aus, als hätte er nie anders zusammengehört.'),
    ],
  },
  signalsteg: {
    premise: 'Zwischen den Neonfenstern fehlt der Stadt ein leiser Ton. Ihre Lichtkanten setzen die Suche über den Dächern fort: geradeaus, um die Ecke und immer ein Stück höher.',
    playerRole: 'Spurensucherin oder Spurensucher im Licht der Stadt.',
    goal: 'Folge dem Zickzack-Parcours bis Abschnitt 36 und erreiche die Zielplattform.',
    chapters: [
      stageChapter(5, 'Die erste Adresse', 'Die erste Ecke liegt hinter dir. Metallene Stege und helle Fenster stehen dicht zusammen, als hätte die Stadt hier eine kleine Nachricht hinterlassen.'),
      stageChapter(20, 'Zwischen den Fenstern', 'Unter dir staffeln sich die Lichter der Stadt. Mit jedem Richtungswechsel fügen sich ihre Kanten zu einer anderen Zeile zusammen.'),
      stageChapter(36, 'Ein stilles Schlusslicht', 'Auf der letzten Plattform endet die Reihe der Lichtzeichen. Für einen Moment braucht die Stadt keinen weiteren Ton: Die kurze Pause nach dem Sprung genügt.'),
    ],
  },
  aschepfad: {
    premise: 'Im dunklen Gestein zieht sich eine Spur aus hellen Glutkanten bergauf. Ihre Kehren gleichen einer Schrift, deren letzte Zeile erst von ganz oben zu lesen ist.',
    playerRole: 'Leserin oder Leser einer Spur aus Basalt und Glut.',
    goal: 'Bewältige die 54 Abschnitte mit hoher Hindernisdichte und erreiche die letzte Plattform.',
    chapters: [
      stageChapter(6, 'Die erste Zeile', 'Die ersten Basaltstufen liegen unter dir. Zwischen den Felsen bleibt ihre helle Kante sichtbar, wie der Anfang einer Zeile im schwarzen Stein.'),
      stageChapter(30, 'Über der eigenen Spur', 'Eine Kehre liegt über der anderen. Durch die Lücken zwischen den Felsen siehst du, wie weit sich deine Spur schon vom Boden entfernt hat.'),
      stageChapter(54, 'Die Nachricht ist der Weg', 'Vom Ziel aus fügen sich die Kehren zu einer einzigen langen Linie. Was unten wie einzelne Sprünge aussah, ist hier oben eine ganze Geschichte.'),
    ],
  },
  nachtpost: {
    premise: 'Ungeschriebene Briefe brauchen eine Adresse. Zwischen kühlen Neonhöfen wächst ein Postamt für erste Sätze, späte Grüße und alles, was bis morgen warten darf.',
    playerRole: 'Nachtpostmeisterin oder Nachtpostmeister für ungeschriebene Briefe.',
    goal: 'Entwickle dein Neon-Labor vom ersten Photonensammler bis zum 48. Ausbau.',
    chapters: [
      upgradeChapter(1, 'Das Postamt hat eine Steckdose', 'Der Photonensammler setzt das erste Licht in den leeren Hof. Noch steht hier wenig, doch das kleine Leuchten sieht schon nach einer Adresse aus.'),
      upgradeChapter(40, 'Die Adresse der Nacht', 'Die Antenne der Signalstation steht über den Werkhöfen. Unter ihr haben die Hallen und Türme etwas von aufgereihten Briefen, jeder mit seinem eigenen Fensterlicht.'),
      upgradeChapter(48, 'Alle Fenster bleiben im Bild', 'Das Weltwunder überragt den fertigen Campus. Ein letzter Blick durch die Höfe: So viele helle Fenster, und hinter jedem könnte ein guter erster Satz beginnen.'),
    ],
  },
  kupferpause: {
    premise: 'Irgendwo zwischen ihren Werkhallen hat die Stadt die Mittagspause verlegt. Im warmen Basalt bekommt ein neuer Campus breite Höfe und einen kleinen Garten zwischen den Maschinen.',
    playerRole: 'Werkleitung für verlegte Pausen und warme Minuten.',
    goal: 'Vervollständige alle 48 Ausbauten und entdecke die ruhigen Ecken deines Werks.',
    chapters: [
      upgradeChapter(1, 'Eine Minute beginnt klein', 'Neben dem ersten Erzsammler ist der Hof noch fast leer. Für einen Moment reicht eine einzige warme Farbe, um aus dem Basalt einen freundlichen Ort zu machen.'),
      upgradeChapter(39, 'Ein Garten zwischen Maschinen', 'Der Lavasteingarten liegt zwischen den Werkbereichen. Seine niedrigen Formen lassen eine kleine Lücke im Rhythmus der hohen Hallen.'),
      upgradeChapter(48, 'Zeit für einen Blick zurück', 'Der fertige Campus hat seine eigene Berglinie bekommen. Die verlorene Mittagspause liegt vielleicht genau hier: zwischen dem großen Weltwunder und dem kleinen Garten.'),
    ],
  },
  wolkenfundamt: {
    premise: 'Über den Wolken verlieren selbst die kleinsten Dinge ihren Schatten. Zwischen Glas und Kristall wächst ein Fundamt für herrenlose Umrisse, mit reichlich Platz für seltsame Zufälle.',
    playerRole: 'Fundamtsleitung für herrenlose Schatten.',
    goal: 'Baue die Kristall-Produktionsstraße vom Gratis-Starter bis zum 48. Ausbau.',
    chapters: [
      upgradeChapter(1, 'Fundstück Nummer eins', 'Ein Kristallsammler steht mitten auf der freien Fläche. Seine scharfen Kanten geben dem Fundamt einen Anfang, klein wie der Schatten einer einzelnen Wolke.'),
      upgradeChapter(33, 'Ein Depot für Abwesendes', 'Das Lager steht an der Produktionsstraße. Zwischen seinen geraden Wänden und den hellen Kristallen wirkt jede freie Ecke wie ein Platz für einen sonderbaren Fund.'),
      upgradeChapter(48, 'Ein Dach über jedem Schatten', 'Unter dem Weltwunder ist aus der ersten Maschine eine ganze Werkstattstadt geworden. Ihre vielen Dächer zeichnen so viele Umrisse, dass keiner mehr allein sein muss.'),
    ],
  },
  tautreppe: {
    premise: 'Der Morgen hängt noch zwischen den Blättern. Über grünen Inseln windet sich eine kleine Treppe nach oben, so leicht, als hätte ein Tautropfen ihren Verlauf gezeichnet.',
    playerRole: 'Morgenkurierin oder Morgenkurier zwischen Blättern und Inseln.',
    goal: 'Erreiche nach 24 Abschnitten die Zielplattform; Münzen sind freiwillige kleine Umwege.',
    chapters: [
      stageChapter(3, 'Bevor der Morgen spricht', 'Die ersten Inseln liegen hinter dir, die nächsten noch dicht beieinander. Über ihren Kanten hängen grüne Kronen wie ein Himmel aus Blättern.'),
      stageChapter(12, 'Zwischen zwei Blattkronen', 'Auf halber Höhe öffnet sich der Blick zwischen den Bäumen. Die Inseln unter dir bilden eine grüne Spirale, klein und sorgfältig wie ein eingerolltes Blatt.'),
      stageChapter(24, 'Der Morgen ist angekommen', 'Die letzte Plattform liegt über der grünen Inselreihe. Hinter dir schwingt die kleine Treppe durch die Baumkronen; für diesen Blick hat sich der frühe Aufbruch gelohnt.'),
    ],
  },
  mondumschlag: {
    premise: 'Ein leerer Umschlag kann eine ganze Reise enthalten. Zwischen Wolken und hellen Inseln liegt eine Nachricht an den Mond, geschrieben in Bögen, Lücken und kleinen mutigen Sprüngen.',
    playerRole: 'Briefträgerin oder Briefträger einer wortlosen Nachricht.',
    goal: 'Bewältige die 30 Abschnitte der Wolkenroute und erreiche ihre höchste Zielplattform.',
    chapters: [
      stageChapter(5, 'Ein Umschlag aus Luft', 'Hinter der ersten Wolkenkurve liegt der Anfang deiner Route wie eine offene Falte. Ein paar helle Inseln genügen schon für den ersten Satz.'),
      stageChapter(15, 'Die halbe Nachricht', 'In der Mitte der Spirale stehen Wolken und Kristalle um die Plattformen. Vor und hinter dir bleiben helle Inselbögen, wie zwei Hälften eines aufgefalteten Briefs.'),
      stageChapter(30, 'Keine Worte mehr nötig', 'Die letzte Insel ist erreicht. Unten zieht sich die ganze Wolkenroute durch die Luft; ihre Bögen sagen alles, was auf eine leere Seite passen sollte.'),
    ],
  },
  nachtgarten: {
    premise: 'Über den Straßen wachsen die Fenster zu kleinen Lichtbeeten zusammen. Ein schmaler Weg zieht sich durch diesen Garten aus Neon, Metall und den warmen Rechtecken einer wachen Stadt.',
    playerRole: 'Nachtschwärmerin oder Nachtschwärmer auf einer Lichtgartenreise.',
    goal: 'Erreiche Abschnitt 20 und die Zielplattform der kurzen Neonroute.',
    chapters: [
      stageChapter(4, 'Das erste Lichtbeet', 'Die ersten Stege liegen zwischen den Häusern. Über den metallenen Kanten stehen helle Fenster dicht beieinander, ein kleines Beet mitten in der Stadt.'),
      stageChapter(12, 'Fenster statt Blätter', 'Der Weg knickt zwischen den Gebäuden ab. Aus diesem Winkel liegen ihre Fenster übereinander wie Blätter an einem Zweig.'),
      stageChapter(20, 'Der Garten bleibt ein Bild', 'Am Ende der Route öffnet sich der Blick über die Fensterreihen. Unter dir liegt ein ganzer Garten aus Licht, und jedes Dach zieht seine eigene dunkle Linie dazwischen.'),
    ],
  },
};
function freezeStory(story) {
  return Object.freeze({ ...story, chapters: Object.freeze(story.chapters.map(chapter => Object.freeze({ ...chapter, trigger: Object.freeze({ ...chapter.trigger }) }))) });
}

// Shared records cannot be altered by a card or preview consumer.
for (const reference of Object.values(REFERENCES)) Object.freeze(reference);
export const CREATIVE_DIRECTIONS = Object.freeze(directions.map(direction => Object.freeze({
  ...direction,
  story: freezeStory(stories[direction.id]),
  config: Object.freeze({ ...direction.config }),
  sources: Object.freeze([...direction.sources]),
})));

export const CREATIVE_VARIANT_COUNT = 3;
export const normalizeCreativeVariant = value => Number.isInteger(value) && value >= 1 && value <= CREATIVE_VARIANT_COUNT ? value : 1;

/** Only editorial IDs belonging to the current game mode are accepted. */
export function normalizeStoryId(value, mode) {
  return typeof value === 'string' && CREATIVE_DIRECTIONS.some(direction => direction.id === value && direction.mode === mode) ? value : '';
}

/** Legacy projects had no story ID; their exact curated seeds remain readable. */
export function legacyStoryId(seed, mode) {
  if (typeof seed !== 'string') return '';
  return CREATIVE_DIRECTIONS.find(direction => direction.mode === mode && Array.from({ length: CREATIVE_VARIANT_COUNT }, (_, index) => `MF-DIRECTION-${direction.id}-${String(index + 1).padStart(2, '0')}`).includes(seed))?.id || '';
}
