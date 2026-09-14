import { PromptTemplate, ReferenceCategory } from '../types';

export const INITIAL_PROMPT_CATALOG: PromptTemplate[] = [
  {
    id: 'single-person-anchor',
    title: 'Einzelperson: Physiognomie & Identitätsanker',
    category: 'person',
    badge: 'Standard Person',
    description: 'Exakte Extraktion aller Gesichts- und Körpermerkmale für MiniMax H3 / Maestro zur Vermeidung von Gesichtsmutationen.',
    keywords: ['Gesichtsform', 'Augen', 'Nase', 'Mund', 'Haare', 'Teint', 'Brille', 'Muttermal'],
    prompt: `Analysiere dieses Referenzbild der Person. Extrahiere genau diese Merkmale, in Stichpunkten, auf Deutsch:
- Name / Rolle der Person (falls erkennbar oder aus Kontext)
- Gesichtsform (rund, oval, eckig, schmal, breit)
- Augenfarbe (exakt)
- Augenform (rund, mandelförmig, schmal, groß, klein)
- Augenbrauen (dick, dünn, dunkel, hell, geschwungen, gerade)
- Nase (schmal, breit, gerade, Stupsnase, lang, kurz)
- Mund / Lippen (voll, schmal, Lippenform, Amorbogen)
- Kiefer / Kinn (kantig, weich, rund, spitz, markant)
- Hautfarbe / Teint (hell, gebräunt, oliv, Sommersprossen)
- Haarfarbe (exakt: schwarz, dunkelbraun, mittelbraun, hellbraun, blond, rot)
- Haarlänge (kurz, schulterlang, lang, sehr lang)
- Haarstruktur (glatt, wellig, lockig, kraus)
- Pony (ja / nein, wenn ja: welche Form)
- Besondere Merkmale (Muttermal, Narbe, Brille, Ohrringe, Zahnlücke, Sommersprossen, Tattoo, Piercing)
- Alter ca.
- Körperbau (schlank, sportlich, kurvig, zierlich, kräftig)
- Kleidung & Stil (Farbe, Schnitt, Material)

Gib am Ende einen kompakten "PROMPT-ANKER" (1-2 englische Sätze) aus, der als permanenter visueller Anker in MiniMax H3 / Maestro Videoprompts kopiert werden kann. Keine Interpretation, nur sichtbare Fakten.`,
  },
  {
    id: 'person-with-dogs',
    title: 'Person mit 2 Hunden / Begleitern (Multi-Entität)',
    category: 'multi_subject',
    badge: 'Multi-Entität (Person + 2 Hunde)',
    description: 'Spezifisch für Bilder mit einer Person und zwei Hunden (oder Haustieren). Trennt Person, Hund 1 und Hund 2 sauber auf.',
    keywords: ['Person', 'Hund 1', 'Hund 2', 'Rasse', 'Fell', 'Größe', 'Interaktion'],
    prompt: `Analysiere dieses Referenzbild (Person mit 2 Hunden / Haustieren).
Trenne die Analyse strikt in DREI Listen plus räumliche Relation:

LISTE 1: PERSON (HAUPTSUBJEKT)
- Name / Identifikator
- Gesichtsform & Teint
- Augen & Augenbrauen
- Haare (Farbe, Länge, Schnitt)
- Besondere Merkmale (Brille, Schmuck, Muttermale)
- Alter ca. & Körperbau
- Kleidung (Jacke, Hose, Schuhe)

LISTE 2: HUND 1 (z.B. linker Hund oder Primärhund)
- Erkennbare Rasse / Mischung (z.B. Schäferhund, Golden Retriever, Dobermann, Terrier)
- Fellfarbe & Muster (z.B. schwarz-braun, gestromt, uni-weiß, Flecken)
- Felllänge & Textur (kurzhaarig, zottelig, glänzend, dicht)
- Statur & Größe (groß, mittel, klein, muskulös, schlank)
- Kopf- & Ohrenform (Stehohren, Hängeohren, Schnauzenlänge)
- Zubehör (Halsband, Geschirr, Leinenfarbe)

LISTE 3: HUND 2 (z.B. rechter Hund oder Sekundärhund)
- Erkennbare Rasse / Mischung
- Fellfarbe & Muster (deutlicher Kontrast zu Hund 1)
- Felllänge & Textur
- Statur & Größe (im Vergleich zu Hund 1)
- Kopf- & Ohrenform
- Zubehör (Halsband, Geschirr)

RÄUMLICHE RELATION & INTERAKTION:
- Positionierung (wer steht/sitzt links, rechts, vordergründig)
- Haltung der Person (an der Leine, Hand auf dem Kopf, stehend, hockend)
- Blickrichtungen aller 3 Subjekte

Gib am Ende einen kompakten englischen "MULTI-ENTITY PROMPT-ANKER" aus, der Person, Hund 1 und Hund 2 für MiniMax H3 / Maestro eindeutig formuliert, damit kein Tier morpht oder verschwindet.`,
  },
  {
    id: 'object-prop-anchor',
    title: 'Gegenstand / Requisite (Prop-Anker)',
    category: 'object',
    badge: 'Requisite / Objekt',
    description: 'Exakte Material-, Form- und Texturanalyse für Requisiten (z.B. Waffe, Koffer, Amulett, Uhr, Buch, Flasche).',
    keywords: ['Material', 'Form', 'Patina', 'Gravur', 'Größe', 'Oberfläche'],
    prompt: `Analysiere diesen Gegenstand / diese Requisite (Prop) als visuellen Anker für Videoproduktionen:
- Gegenstandsart & Funktion (z.B. antikes Lederbuch, chromfarbener Revolver, silbernes Amulett)
- Geometrische Form & Proportionen (Maße im Verhältnis zu einer Menschenhand)
- Hauptmaterial (Messing, gebürsteter Stahl, dunkles Mahagoniholz, abgewetztes Leder, Glas)
- Oberflächentextur & Zustand (glänzend, matt, verkratzt, Patina, Fingerabdrücke, Rost, poliert)
- Farbgebung & Reflexionsverhalten (Primärfarbe, Akzente, Glanzpunkte)
- Besondere Kennzeichen (Gravuren, Symbole, Nähte, Schrauben, Beschläge, Schalter, leuchtende Elemente)
- Typische Handhabung (wird in der Hand gehalten, am Gürtel getragen, auf dem Tisch stehend)

Gib am Ende einen kompakten englischen "PROP PROMPT-ANKER" für MiniMax H3 aus, der das Objekt fotorealistisch und konsistent in jede Szene einbettet.`,
  },
  {
    id: 'vehicle-tech-anchor',
    title: 'Fahrzeug / Maschine / Tech-Objekt',
    category: 'vehicle',
    badge: 'Fahrzeug & Tech',
    description: 'Analyse von Autos, Motorrädern, Drohnen oder futuristischer Technologie für Szenenkonsistenz.',
    keywords: ['Fahrzeugtyp', 'Karosserie', 'Lackfarbe', 'Scheinwerfer', 'Felgen', 'Zustand'],
    prompt: `Analysiere dieses Fahrzeug oder Tech-Objekt als visuellen Konsistenz-Anker:
- Typ & Modellkategorie (z.B. 1970er Muscle Car, futuristisches Drohnensystem, klassisches Motorrad)
- Karosserieform & Silhouette (kantig, aerodynamisch, bullig, kompakt)
- Lackierung & Farbe (Metallic, Matt, Zweifarbig, Verwitterung)
- Front & Scheinwerfer-Signatur (runde Lichter, LED-Band, Kühlergrill)
- Felgen, Reifen & mechanische Details
- Verschleiß & Patina (Schlammspritzer, Dellen, fabrikneu poliert)
- Innenraum / Cockpit-Sichtbarkeit (falls im Bild)

Gib am Ende einen englischen "VEHICLE PROMPT-ANKER" für MiniMax H3 / Maestro aus.`,
  },
  {
    id: 'environment-location-anchor',
    title: 'Umgebung / Location & Raum (Set-Anker)',
    category: 'environment',
    badge: 'Location & Set',
    description: 'Extraktion von architektonischen Merkmalen, Wandbeschaffenheiten, Requisiten und Lichtarchitektur.',
    keywords: ['Architektur', 'Wände', 'Boden', 'Lichtquellen', 'Möbel', 'Atmosphäre'],
    prompt: `Analysiere diesen Raum / diese Location als szenischen Hintergrund-Anker:
- Location-Typ (z.B. verlassenes Industrielager, viktorianisches Arbeitszimmer, verregnete Neon-Seitengasse)
- Architektonische Elemente (Deckenhöhe, Säulen, Fensterart, Treppen)
- Wand- & Bodenmaterial (Backstein, feuchter Asphalt, Fischgrätparkett, Beton)
- Requisiten & Set-Dressing im Raum (welche Möbel, Lampen, Gegenstände stehen wo)
- Lichtarchitektur & Primärlichtquellen (Sonnenstrahlen durch Fenster, Deckenpendelleuchte, Neonschein)
- Farbtemperatur & Atmosphäre (kaltblau, warmes Bernstein, düster-diffus)

Gib am Ende einen prägnanten englischen "ENVIRONMENT PROMPT-ANKER" für MiniMax H3 aus.`,
  },
  {
    id: 'duo-two-persons',
    title: 'Zwei Personen (Duo / Gegenüberstellung)',
    category: 'multi_subject',
    badge: 'Zwei Personen',
    description: 'Für Referenzbilder mit zwei Charakteren. Trennt beide Personen strikt voneinander ab.',
    keywords: ['Person 1', 'Person 2', 'Größenverhältnis', 'Kontrast', 'Interaktion'],
    prompt: `Analysiere dieses Referenzbild mit ZWEI Personen.
Erstelle zwei klar getrennte Listen (Person 1 links/vorne, Person 2 rechts/hinten):

Für jede Person getrennt:
- Name / Identifikator
- Gesichtsform, Teint, Augen
- Haare (Farbe, Schnitt, Länge)
- Kleidung & Stil
- Besondere Merkmale (Brille, Narben, Schmuck)
- Statur & sichtbares Alter

ZUSÄTZLICH:
- Größen- und Proportionsverhältnis zueinander
- Räumliche Beziehung und Interaktionshaltung

Gib am Ende zwei getrennte englische Prompt-Anker aus.`,
  },
  {
    id: 'style-aesthetic-anchor',
    title: 'Stil, Optik & Film-Look (Grading-Anker)',
    category: 'style',
    badge: 'Stil & Look',
    description: 'Definiert den visuellen Stil, Körnung, Optik und Farbstimmung für das gesamte Projekt.',
    keywords: ['35mm', 'Filmkorn', 'Color Grading', 'Kontrast', 'Linse', 'Bokeh'],
    prompt: `Analysiere den visuellen Stil, die Kameraoptik und das Color Grading dieses Bildes:
- Film-Look & Ästhetik (z.B. 35mm Vintage Noir, 16mm Indie-Korn, 70mm IMAX-Schärfe, Neo-Noir)
- Farbpalette & Dominanz (Entsättigt, Teal-and-Orange, warme Erdtöne, monochrome Schatten)
- Kontrast & Beleuchtungscharakter (High-Key, Low-Key, Chiaroscuro, starkes Kantenlicht)
- Objektivcharakteristik (Weitwinkel, Tele-Bokeh, anamorphotische Reflexionen, sanfte Vignette)

Gib einen englischen "CINEMATIC STYLE ANCHOR" für MiniMax H3 aus.`,
  },
  {
    id: 'costume-wardrobe-anchor',
    title: 'Kostüm, Kleidung & Stoff-Textur',
    category: 'person',
    badge: 'Kleidung & Textur',
    description: 'Fokussiert auf Kleidungsdetails, Stoffe, Schnitt, Abnutzung und Accessoires der Figur.',
    keywords: ['Kostüm', 'Kleidung', 'Stoff', 'Schnitt', 'Leder', 'Accessoires'],
    prompt: `Analysiere ausschließlich das Kostüm und die Kleidung dieser Figur für MiniMax H3:
- Oberbekleidung (Art, Schnitt, Material: Leder, Wolle, Seide, Denim)
- Farbton & Muster (Farbcodes, Karomuster, verwaschen, gebleicht)
- Zustand & Abnutzung (neu, abgewetzt, Schmutzflecken, Risse, Faltenwurf)
- Accessoires (Gürtel, Schal, Handschuhe, Schmuck, Knöpfe, Reißverschlüsse)
- Beinkleid & Schuhe (falls sichtbar)

Gib am Ende einen englischen "WARDROBE PROMPT-ANKER" für MiniMax H3 aus.`,
  },
  {
    id: 'weapon-tactical-anchor',
    title: 'Waffe & Taktische Ausrüstung',
    category: 'object',
    badge: 'Waffe & Taktik',
    description: 'Präzise Erfassung von Waffen, Klingen, Holstern und taktischer Ausrüstung.',
    keywords: ['Waffe', 'Kaliber', 'Metall', 'Griffstück', 'Holster', 'Optik'],
    prompt: `Analysiere diese Waffe oder taktische Ausrüstung als Requisiten-Anker:
- Typ & Modellbezeichnung (z.B. Polymer-Pistole, Jagdmesser, Scharfschützengewehr)
- Material & Finish (mattschwarz beschichtet, polierter Stahl, Holzgriffschalen)
- Anbauteile & Optik (Zielfernrohr, Schalldämpfer, Taschenlampe, Lasermodul)
- Gebrauchsspuren & Gravuren (Kratzer an Kanten, Seriennummer, Abnutzung am Schlitten)
- Handhabungspose & Positionierung

Gib am Ende einen präzisen englischen "TACTICAL WEAPON ANCHOR" für MiniMax H3 aus.`,
  },
  {
    id: 'floorplan-apartment-anchor',
    title: 'Wohnungs-Grundriss: Raumaufteilung & Kamerafahrt-Achsen',
    category: 'floorplan',
    badge: 'Grundriss & Raumplan',
    description: 'Extrahiert Raumaufteilung, Flurachsen, Fenster/Lichtachsen, Wandverläufe und empfohlene Kameraflug-Pfade aus 2D/3D-Wohnungsgrundrissen.',
    keywords: ['Grundriss', 'Wohnung', 'Raumaufteilung', 'Fensterachsen', 'Kameraflug', 'Offenes Wohnen', 'Architektur'],
    prompt: `Analysiere diesen Wohnungsgrundriss als exakten räumlichen Anker für Video-Kamerafahrten und fotorealistische Raumübergänge (MiniMax H3 / Maestro):
- Wohnungsgröße & Typ (z.B. 3-Zimmer-Wohnung, offenes Loft, Maisonette, Penthouse)
- Raumaufteilung & Zonen (Eingang/Flur, offener Wohn-/Essbereich, Master-Bedroom, Kinder-/Arbeitszimmer, Badezimmer, Balkon/Loggia)
- Fensterfronten & Lichtachsen (Haupteinfallstor des Tageslichts, Ausrichtung, bodentiefe Verglasung)
- Wandverläufe & Raumfluss (offenes Raumkonzept vs. geschlossener Flurtrakt, Schiebetüren, Durchgänge)
- Vorgesehene Möblierung & Key-Positionen (Kücheninsel-Platzierung, Esstisch, Sofalandschaft, Bett)
- Bodenbeläge & Materialhinweise (soweit lesbar: Eichenparkett, großformatige Fliesen, Sichtbeton)
- Logische Kameraflug-Achse (Empfehlung für Steadicam/FPV-Walkthrough: z.B. Eingangstür -> Flur -> Öffnung in lichtdurchfluteten Wohnbereich -> Schwenk zur Terrasse)

Gib am Ende einen prägnanten englischen "FLOORPLAN ARCHITECTURE ANCHOR" für MiniMax H3 / Maestro aus, der den räumlichen Fluss und die exakten Proportionen fixiert.`,
  },
  {
    id: 'prefab-house-exterior',
    title: 'Fertighaus-Visualisierung: Fassade, Kubatur & Außenanlagen',
    category: 'architecture',
    badge: 'Fertighaus Exterior',
    description: 'Analysiert 3D-Renderings von Fertigteilhäusern: Baustil, Holzlamellen/Putz-Fassaden, Dachform, Fensterbänder, Carport & Drohnen-Überflug.',
    keywords: ['Fertighaus', 'Fassade', 'Holzlamellen', 'Kubatur', 'Flachdach', 'Drohnenflug', 'Außenanlagen', 'Render'],
    prompt: `Analysiere diese Visualisierung / dieses 3D-Rendering des Fertigteilhauses als visuellen Architektur-Anker:
- Haustyp & Baustil (z.B. modernes Bauhaus-Flachdach, skandinavisches Holzhaus mit Satteldach, kubische Stadtvilla, Pultdach-Bungalow)
- Kubatur & Baukörper (Zweigeschossig, L-Form, Erker, auskragendes Obergeschoss, Doppelhaushälfte)
- Fassadenmaterial & Texturen (z.B. weiße Glattputz-Fassade kombiniert mit warmen Lärchenholz-Lamellen, Anthrazit-Faserzementplatten)
- Dachform & Eindeckung (Satteldach mit anthrazitfarbenen Ziegeln, Flachdach mit Attika/Begrünung, integrierte PV-Module)
- Fensterarchitektur (bodentiefe Hebeschiebe-Türen, anthrazitfarbene Aluminiumrahmen, schmale Lichtbänder)
- Außenanlagen & Setting (Holzterrasse, Poolbereich, moderner Steingarten, Carport/Garage, Pflasterung, Rasenfläche)
- Beleuchtungskonzept & Atmosphäre (Fassaden-Up-Downlights, indirekte Terrassenbeleuchtung, Abendstimmung / goldene Stunde)
- Drohnen-Perspektive (Empfehlung für Drohnenüberflug: z.B. Weitwinkel Orbit-Shot, fly-in auf Eingangsbereich)

Gib am Ende einen englischen "PREFAB HOME ARCHITECTURAL ANCHOR" für MiniMax H3 / Maestro aus, der Baukörper, Material und Licht fotorealistisch fixiert.`,
  },
  {
    id: 'prefab-house-interior',
    title: 'Fertighaus-Innenraum: Licht, Holz & offene Wohnkonzepte',
    category: 'architecture',
    badge: 'Interieur & Visualisierung',
    description: 'Für gerenderte Innenraum-Perspektiven von Musterhäusern / Fertighäusern: Holztreppen, Galerie, Luftraum, Deckenhöhe, Fußböden und Möbeldesign.',
    keywords: ['Innenraum', 'Galerie', 'Fertighaus', 'Eichenholz', 'Glasgeländer', 'Panoramafenster'],
    prompt: `Analysiere diesen visualisierten Innenraum des Fertighauses / Musterhauses:
- Raumeindruck & Deckenhöhe (Luftraum/Galerie, Sichtdachstuhl, standard 2.70m Raumhöhe)
- Leitmaterialien & Farbwelt (Helles Eichenholz, Sichtbetonwand, matte weiße Wände, schwarze Metallakzente)
- Treppenarchitektur & Geländer (Freitragende Holzstufen, Glasgeländer, Wangentreppe)
- Fenster- & Lichteinfall (Großflächige Panoramascheiben, Lichteinfallswinkel, Verbindung zu Garten/Terrasse)
- Ausstattungsdetails (Kaminofen, Einbauküche mit Kochinsel, Design-Pendelleuchten)
- Kamera-Führung (Gleitender Steadicam-Schwenk auf Augenhöhe durch den Raum)

Gib am Ende einen englischen "INTERIOR ARCHITECTURE ANCHOR" für MiniMax H3 / Maestro aus.`,
  },
];

// Helper functions for persistent storage in localStorage / data layer
const STORAGE_KEY = 'prompt_catalog_data';

export function loadPromptCatalog(): PromptTemplate[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure new default templates (e.g. floorplan, prefab house) are merged if missing
        const existingIds = new Set(parsed.map((p: PromptTemplate) => p.id));
        const missingDefaults = INITIAL_PROMPT_CATALOG.filter((item) => !existingIds.has(item.id));
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          savePromptCatalog(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch {
    // Fallback to initial
  }
  return INITIAL_PROMPT_CATALOG;
}

export function savePromptCatalog(catalog: PromptTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  } catch (err) {
    console.error('Error saving prompt catalog:', err);
  }
}

export function resetPromptCatalog(): PromptTemplate[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return INITIAL_PROMPT_CATALOG;
}
