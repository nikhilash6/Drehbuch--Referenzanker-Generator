import {
  ConfigReference,
  ConceptProposal,
  DialogueLanguage,
  SingleLineWindow,
  WindowConfig,
  TargetAudience,
  ScreenplayReferenceCategory,
} from '../types';

/**
 * Format a number of seconds into MM:SS.000 timecode
 * e.g. 0 -> "00:00.000", 14 -> "00:14.000", 72.5 -> "01:12.500"
 */
export function formatTimecode(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const wholeSecs = Math.floor(secs);
  const millis = Math.round((secs - wholeSecs) * 1000);

  const mStr = String(mins).padStart(2, '0');
  const sStr = String(wholeSecs).padStart(2, '0');
  const msStr = String(millis).padStart(3, '0');

  return `${mStr}:${sStr}.${msStr}`;
}

/**
 * Regex-based sanitization function that escapes all internal single/double quotes
 * within dialogue segments and character anchors to prevent JSON parsing errors in LM Studio.
 */
export function sanitizeQuotesForJSON(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?<!\\)"/g, '\\"')
    .replace(/(?<!\\)'/g, "\\'")
    .replace(/„|“|”|“/g, '\\"');
}

/**
 * Strict single-line cleaner: removes all carriage returns, newlines, tabs, and duplicate spaces.
 * Guarantees that the resulting string is 100% on 1 single line with no line breaks!
 */
export function enforceSingleLine(text: string): string {
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates whether a text block is strictly single-line
 */
export function checkSingleLineValidity(text: string): {
  isValid: boolean;
  lineCount: number;
  totalCharacters: number;
  issues: string[];
} {
  const lineCount = (text.match(/\n/g) || []).length + 1;
  const issues: string[] = [];

  if (lineCount > 1) {
    issues.push(`Enthält ${lineCount - 1} unerlaubte Zeilenumbrüche (Muss genau 1 Zeile sein)`);
  }
  if (!text.startsWith('window')) {
    issues.push('Beginnt nicht mit dem geforderten "windowX:" Präfix');
  }
  if (!text.includes('Action:')) {
    issues.push('Fehlende "Action:" Deklaration');
  }
  if (!text.includes('TIMECODE')) {
    issues.push('Fehlende "TIMECODE" Abschnitte');
  }
  if (!text.includes('EXTREME CLOSE-UP, 100mm macro, T1.8')) {
    issues.push('Fehlende 100mm Macro-Extreme-Closeups');
  }
  if (!text.includes('Active_References:')) {
    issues.push('Fehlende "Active_References:" Abschlusszeile');
  }

  return {
    isValid: issues.length === 0,
    lineCount,
    totalCharacters: text.length,
    issues,
  };
}

/**
 * Clean, customizable categorized default references
 * Distinguishes between Human, Building (Objekt: Haus), Object (Gegenstand), Animal, and Environment.
 */
export const DEFAULT_SUBJECT_REFERENCES: ConfigReference[] = [
  {
    id: 'ref-1',
    category: 'human',
    referenceIndex: 1,
    tag: '<Subject 1>',
    charTag: 'char Protagonistin',
    name: 'Bauherrin',
    roleOrAction: 'Erkundet die Architektur, prüft Materialien, Holzoberflächen und Lichtachsen',
    relationship: 'Ehepaar / Lebenspartner mit Partner (Subject 2)',
    gender: 'female',
    ageRange: '30 to 38',
    build: 'slim and natural posture',
    hairOrMaterial: 'shoulder-length chestnut brown hair worn loose with natural soft waves',
    eyesOrGlazing: 'warm brown almond-shaped eyes, natural defined eyebrows',
    clothingOrFinish: 'high-quality tailored beige linen blouse and relaxed white linen trousers, leather sandals',
    distinguishingMarks: 'no heavy jewelry, no watch, natural glowing skin, relaxed and curious expression',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    isActiveInProject: true,
  },
  {
    id: 'ref-2',
    category: 'human',
    referenceIndex: 2,
    tag: '<Subject 2>',
    charTag: 'char Partner',
    name: 'Partner',
    roleOrAction: 'Begleitet die Besichtigung, testet Smarthome-Bedienfeld, geht über Parkett zur Terrasse',
    relationship: 'Ehepaar / Lebenspartner mit Bauherrin (Subject 1)',
    gender: 'male',
    ageRange: '32 to 42',
    build: 'athletic build, upright confident stance',
    hairOrMaterial: 'short well-groomed dark brown hair with subtle silver temples, short trimmed beard',
    eyesOrGlazing: 'calm grey-green eyes',
    clothingOrFinish: 'open light-blue casual linen shirt rolled to the forearms, dark navy chinos, loafers',
    distinguishingMarks: 'minimalist mechanical wristwatch, subtle smile of deep satisfaction',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isActiveInProject: true,
  },
  {
    id: 'ref-3',
    category: 'building',
    referenceIndex: 1,
    tag: '<Building 1>',
    charTag: 'building Musterhaus_Avantgarde',
    name: 'Musterhaus Avantgarde',
    roleOrAction: 'Hauptmotiv und architektonische Kulisse über alle 4 Windows',
    relationship: 'Architektonisches Zentrum & Anwesen',
    build: '2-geschossiger moderner Baukörper mit Flachdach, klarer Geometrie und überdachter Terrasse',
    hairOrMaterial: 'Edler weißer Strukturputz kombiniert mit vertikalen Lärchenholz-Lamellen und Schiefer-Sockel',
    eyesOrGlazing: 'Bodentiefe Dreifach-Schallschutzverglasung mit schlanken anthrazitfarbenen Aluminiumprofilen',
    clothingOrFinish: 'Integrierte Indach-Photovoltaikanlage, rahmenlose Glas-Brüstungen und großzügige 60m² Holzterrasse',
    distinguishingMarks: 'Verdeckte Regenrinne, bündig eingelassene LED-Lichtbänder im Dachüberstand',
    photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    isActiveInProject: true,
  },
  {
    id: 'ref-4',
    category: 'object',
    referenceIndex: 1,
    tag: '<Object 1>',
    charTag: 'prop Schluessel_Expose',
    name: 'Schlüsselbund & Übergabe-Mappe',
    roleOrAction: 'Zentrales haptisches Detail bei der Übergabe im finalen Window',
    relationship: 'Requisite für Schlussszene (Window 4)',
    build: 'Hochwertiger mattierter Edelstahlschlüssel mit graviertem Logo-Anhänger und Lederetui',
    hairOrMaterial: 'Matt gebürsteter Edelstahl, cognacfarbenes Naturleder mit feiner Ziernaht',
    eyesOrGlazing: 'Glänzende Gravur mit filigranen Kantenreflexionen',
    clothingOrFinish: 'Handgefertigte Prägemappe aus festem Naturkarton für Baupläne und Garantieurkunde',
    distinguishingMarks: 'Präzise haptische Kanten, reflexionsfreie matte Oberfläche',
    photoUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80',
    isActiveInProject: true,
  },
  {
    id: 'ref-5',
    category: 'logo',
    referenceIndex: 1,
    tag: '<Logo 1>',
    charTag: 'logo Brand_Watermark',
    name: 'Firmenlogo / Brand-Mark',
    roleOrAction: 'Permanentes, dezentes Wasserzeichen strictly in der rechten unteren Ecke (25% Opacity)',
    relationship: 'Unternehmensidentität & Branding über alle Video-Windows',
    build: 'Minimalistisches Vektor-Emblem mit klaren Konturen',
    hairOrMaterial: 'Halbtransparentes weiß/silbergraues Signet mit feiner Konturierung',
    eyesOrGlazing: '25-30% Transparenz für organische Einbettung ohne Bildstörung',
    clothingOrFinish: 'Feste Positionierung: Untere rechte Ecke mit 40px Randabstand',
    distinguishingMarks: 'IMMER rechts unten, dezent & transparent, niemals bildfüllend',
    photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    isActiveInProject: true,
  },
];

/**
 * 3 High-Quality, Layperson-friendly Concept Proposals
 * Fully neutral, professional, free of fantasy names
 */
export const DEFAULT_PROPOSALS: ConceptProposal[] = [
  {
    id: 'prop-1',
    title: 'Die Entdeckung: Emotionale Ankunft & Raumgefühl',
    tagline: 'Vom spektakulären Drohnen-Orbit über das Anwesen bis zum gemeinsamen Ausklang auf der Terrasse',
    descriptionForLayperson:
      'Eine emotionale Geschichte über das erste Betreten des fertigen Zuhauses. Die Protagonisten erkunden Schritt für Schritt die Architektur, spüren die Haptik der Naturmaterialien und erleben im finalen Window den Sonnenuntergang auf der Terrasse mit klarem Call-to-Action.',
    dramaturgyHighlights: [
      'Window 1: Ankunft am Grundstück & eleganter 360° Drohnenüberflug über das Haus',
      'Window 2: Eingangsbereich, Foyer & haptische Detailaufnahmen der Naturmaterialien',
      'Window 3: Entdeckung des lichtdurchfluteten Wohnraums mit freiem Gartenblick',
      'Window 4: Sonnenuntergang auf der Holzterrasse, Schlüsselübergabe & starker Call-to-Action',
    ],
    toneAndStyle: 'Warm, emotional, einladend, High-End Architekturfilm',
    dialogueLanguage: 'German',
    callToAction: 'Jetzt Musterhaus besichtigen & Ihr Traumhaus planen',
    windowBreakdown: [
      {
        windowNumber: 1,
        title: 'Ankunft & Drohnenflug-Totale',
        actionDescription:
          'Die Protagonisten kommen am Anwesen an. Ein sanfter Drohnen-Orbit zeigt die moderne Fassade von <Building 1>, die gepflegte Außenanlage und die Photovoltaikanlage im warmen Sonnenlicht.',
        cameraMovement: 'Drohnenflug Orbit 360° und sanfter Sinkflug auf Augenhöhe',
        dialogueSnippet: 'Hier ist es also. Unser neues Zuhause.',
        dialogueSpeaker: 'Bauherrin',
        focus: 'Fassade von <Building 1>, Kubatur und harmonische Einbettung in das Grundstück',
        claimOrCta: 'Architektur, die begeistert',
      },
      {
        windowNumber: 2,
        title: 'Eingang, Foyer & Materialdetails',
        actionDescription:
          'Sie treten durch die Eingangstür. Haptische Nahaufnahmen von geölter Eiche, anthrazitfarbenen Türgriffen und dem warmen Lichtkegel im Foyer.',
        cameraMovement: 'Dolly-In durch die Eingangstür mit flüssiger Steadicam-Führung',
        dialogueSnippet: 'Spürst du diese Qualität? Genau so wollten wir es haben.',
        dialogueSpeaker: 'Partner',
        focus: 'Holzlamellen, Naturstein und präzise handwerkliche Fugen',
        claimOrCta: 'Präzision bis ins letzte Detail',
      },
      {
        windowNumber: 3,
        title: 'Offener Wohnbereich & Panoramaverglasung',
        actionDescription:
          'Der Blick öffnet sich in den großzügigen Wohn- und Kochbereich. Licht fällt durch raumhohe Schiebefenster. Sie blicken gemeinsam in den Garten.',
        cameraMovement: 'Steadicam Walkthrough entlang der Sichtachse Richtung Garten',
        dialogueSnippet: 'Dieses Licht... genau so habe ich es mir immer vorgestellt.',
        dialogueSpeaker: 'Bauherrin',
        focus: 'Offene Raumachsen, Kücheninsel und nahtloser Übergang zum Garten',
        claimOrCta: 'Lichtdurchflutete Raumkonzepte für Generationen',
      },
      {
        windowNumber: 4,
        title: 'Terrasse, Sunset & Call-to-Action',
        actionDescription:
          'Beide stehen entspannt auf der Holzterrasse. Die Abendsonne taucht das Gebäude in goldenes Licht. Die Schlüsselübergabe mit <Object 1> erfolgt, gefolgt von einer eleganten Einblendung des finalen Call-to-Actions.',
        cameraMovement: 'Langsamer Rückwärts-Dolly und Aufstieg der Kamera in die Abenddämmerung',
        dialogueSnippet: 'Willkommen daheim. Ihr schlüsselfertiges Traumhaus ist bereit.',
        dialogueSpeaker: 'Partner',
        focus: 'Terrasse, warmes Kantenlicht, Übergabe von <Object 1> und Schluss-Grafik',
        claimOrCta: 'Jetzt Musterhaus besichtigen & Ihr Traumhaus planen',
      },
    ],
  },
];

/**
 * Builds the EXACT single-line window string adhering strictly to the user's example prompt.
 * Seamlessly integrates human subjects, buildings (houses), objects, and animals into
 * definitions, anti-crossbleed rules, macro close-ups, and audio delivery tags.
 */
interface DistinctVisualDefaults {
  hair: string;
  eyes: string;
  marks: string;
  clothing: string;
  age: string;
  build: string;
}

/**
 * Generates guaranteed distinct physical attributes for each human subject index
 * to prevent MiniMax H3 / Maestro from cloning faces or clothing when attributes are omitted.
 */
function getDistinctSubjectVisualDefaults(idx: number, name: string, gender?: string, roleOrAction?: string): DistinctVisualDefaults {
  const isAgent = /makler|verkäufer|agent|berater|coach/i.test(name) || /makler|verkäufer|agent|berater|coach/i.test(roleOrAction || '');
  const isFemale = gender === 'female' || /frau|bauherrin|partnerin|kundin|heidi/i.test(name);

  if (isAgent) {
    return {
      hair: 'receding silver-grey hair with neat side trim',
      eyes: 'sharp steel-blue eyes',
      marks: 'distinguished mature facial structure, gold wire-frame glasses, clean-shaven',
      clothing: 'dark charcoal tailored blazer over crisp white shirt',
      age: '45 to 52',
      build: 'upright professional poise',
    };
  }

  // Preset distinct profiles by reference index
  const presets: Record<number, DistinctVisualDefaults> = {
    1: {
      hair: isFemale ? 'shoulder-length chestnut brown hair' : 'short textured dark brown hair',
      eyes: 'warm hazel eyes',
      marks: 'clean-shaven, distinct sharp jawline, zero facial similarity to other actors',
      clothing: 'slate blue linen shirt and dark trousers',
      age: '30 to 35',
      build: 'natural athletic posture',
    },
    2: {
      hair: isFemale ? 'honey-blonde wavy hair' : 'short sandy blonde hair with side part',
      eyes: 'emerald green eyes',
      marks: 'delicate features, high cheekbones, zero facial similarity to other actors',
      clothing: 'cream silk blouse and beige trousers',
      age: '28 to 34',
      build: 'slender natural posture',
    },
    3: {
      hair: 'short dark espresso-brown hair with subtle side part',
      eyes: 'deep brown eyes',
      marks: 'neat short stubble beard, athletic frame, unique facial bone structure distinct from all other male actors',
      clothing: 'navy blue casual jacket over heather grey t-shirt',
      age: '34 to 38',
      build: 'broad-shouldered athletic build',
    },
    4: {
      hair: 'long dark brunette hair in loose natural waves',
      eyes: 'dark almond-shaped eyes',
      marks: 'warm expressive face, clear natural complexion, unique facial structure',
      clothing: 'terracotta knit sweater and dark denim',
      age: '31 to 36',
      build: 'toned natural posture',
    },
    7: {
      hair: 'distinguished silver-grey hair with neat side trim',
      eyes: 'clear blue eyes behind gold wire-frame glasses',
      marks: 'mature refined facial features, distinct square jaw, zero facial overlap with younger male actors',
      clothing: 'dark charcoal tailored suit jacket over crisp white shirt',
      age: '46 to 52',
      build: 'tall professional posture',
    },
  };

  if (presets[idx]) {
    return presets[idx];
  }

  return {
    hair: isFemale ? `distinct dark auburn hair (Subject ${idx})` : `distinct short black hair (Subject ${idx})`,
    eyes: `distinct dark brown eyes (Subject ${idx})`,
    marks: `unique facial structure for Subject ${idx}, zero feature overlap with other cast members`,
    clothing: `distinct casual attire in olive green (Subject ${idx})`,
    age: `${28 + (idx * 3) % 20} to ${35 + (idx * 3) % 20}`,
    build: 'natural posture',
  };
}

export function buildSingleLineWindowPrompt(params: {
  windowNumber: number;
  totalWindows: number;
  durationSeconds: number;
  actionCode?: string;
  aspectRatio?: '16:9' | '9:16' | '2.39:1';
  weather?: string;
  background?: string;
  cameraMovement?: string;
  visualFocus?: string;
  soundDesign?: string;
  musicStyle?: string;
  dialogueLanguage?: DialogueLanguage;
  dialogueSpeaker?: string;
  dialogueText?: string;
  claimOrCta?: string;
  isLastWindow?: boolean;
  activeSubjects: ConfigReference[];
  allSubjects: ConfigReference[];
  narrativeAction?: string;
  targetAudience?: TargetAudience;
}): SingleLineWindow {
  const {
    windowNumber,
    totalWindows,
    durationSeconds = 14,
    actionCode = 'ASTROCINEMAV01K2T',
    aspectRatio = '16:9',
    weather = 'Bright daylight, clear blue sky, soft sunbeams, warm natural illumination',
    background = 'A modern high-end architectural residence with landscaped grounds and wooden terrace',
    cameraMovement = 'Drohnenflug Orbit 360° gliding smoothly around the building and descending to eye-level',
    visualFocus = 'Facade, wooden louvers, floor-to-ceiling glass and seamless indoor-outdoor transition',
    soundDesign = 'Gentle breeze in the trees, footsteps on oak parquet, subtle acoustic warmth',
    musicStyle = 'Cinematic ambient music, elegant acoustic warmth, no harsh synthesizers',
    dialogueLanguage = 'German',
    dialogueSpeaker,
    dialogueText,
    claimOrCta,
    isLastWindow = windowNumber === totalWindows,
    activeSubjects = [],
    allSubjects = [],
    narrativeAction,
    targetAudience,
  } = params;

  const startSec = (windowNumber - 1) * durationSeconds;
  const endSec = windowNumber * durationSeconds;

  const tcStart = formatTimecode(startSec);
  const tcEnd = formatTimecode(endSec);

  // Group references by category
  const activeHumans = activeSubjects.filter((r) => r.category === 'human');
  const activeBuildings = activeSubjects.filter((r) => r.category === 'building');
  const activeObjects = activeSubjects.filter((r) => r.category === 'object');
  const activeLogos = allSubjects.filter((r) => r.category === 'logo' && r.isActiveInProject !== false);

  // Fallbacks if empty
  const primaryHuman1 = activeHumans[0] || allSubjects.find((r) => r.category === 'human') || {
    id: 'ref-default-1',
    category: 'human' as const,
    referenceIndex: 1,
    tag: '<Subject 1>',
    charTag: 'char Protagonist',
    name: 'Protagonist',
    roleOrAction: 'Nimmt aktiv an der Haupthandlung teil',
    relationship: 'Hauptprotagonist',
  };
  const primaryBuilding = activeBuildings[0] || allSubjects.find((r) => r.category === 'building');
  const primaryObject = activeObjects[0] || allSubjects.find((r) => r.category === 'object');

  // Align visual focus with primaryBuilding if present
  let enVisualFocus = toEnglishCinematicText(visualFocus, 'The primary subject of the scene and its atmospheric surroundings');
  if (primaryBuilding) {
    const bldMat = primaryBuilding.hairOrMaterial || primaryBuilding.clothingOrFinish || '';
    if (bldMat && /wood|plaster|glass|aluminum|modern/i.test(bldMat) && /brick|traditional roofline/i.test(enVisualFocus)) {
      enVisualFocus = toEnglishCinematicText(bldMat);
    }
  }

  // 1. Window Tag & Action header
  const windowTag = `window${windowNumber}: (${tcStart}–${tcEnd}) Native ${aspectRatio} widescreen.`;

  // English-normalized scene descriptors
  const enWeather = toEnglishCinematicText(weather, 'Natural clear daylight with balanced atmospheric illumination');
  const enBackground = toEnglishCinematicText(background, 'A cinematic environment matching the scene context');
  const enCamMovement = toEnglishCinematicText(cameraMovement, 'Smooth cinematic camera glide');
  const enSoundDesign = toEnglishCinematicText(soundDesign, 'Natural environmental ambience matching the surroundings');
  const enMusicStyle = toEnglishCinematicText(musicStyle, 'Cinematic music matching the tone of the scene');

  // 2. Setting and Environment (Strict Cinematic English)
  const audienceColor = targetAudience?.colorSpectrum ? `, Color palette: ${toEnglishCinematicText(targetAudience.colorSpectrum)}` : '';
  const envWeather = `${enWeather}${audienceColor}`;
  const settingSegment = `${envWeather}. ${enBackground}. Focus on ${enVisualFocus}.`;

  // 3. Definitions Segment (Strict Cinematic English & Clean Maestro Anchors)
  const definitionsParts: string[] = [];

  if (activeHumans.length > 0) {
    const humanDefs = activeHumans.map((s) => {
      const idx = s.referenceIndex || 1;
      const cleanName = cleanMaestroAnchorName(s.name, `Subject${idx}`);
      const maestroAnchor = `@Subject${idx}_${cleanName}`;
      const defaults = getDistinctSubjectVisualDefaults(idx, s.name, s.gender, s.roleOrAction);

      const hair = s.hairOrMaterial ? toEnglishCinematicText(s.hairOrMaterial) : defaults.hair;
      const eyes = s.eyesOrGlazing ? toEnglishCinematicText(s.eyesOrGlazing) : defaults.eyes;
      const marks = s.distinguishingMarks ? toEnglishCinematicText(s.distinguishingMarks) : defaults.marks;
      const clothing = s.clothingOrFinish ? toEnglishCinematicText(s.clothingOrFinish) : defaults.clothing;
      const age = s.ageRange || defaults.age;
      const build = s.build ? toEnglishCinematicText(s.build) : defaults.build;
      const actionDesc = s.roleOrActionEn ? toEnglishCinematicText(s.roleOrActionEn) : (s.roleOrAction ? toEnglishCinematicText(s.roleOrAction) : 'Explores architectural spaces and interacts naturally');
      const relDesc = s.relationshipEn ? toEnglishCinematicText(s.relationshipEn) : (s.relationship ? toEnglishCinematicText(s.relationship) : 'Protagonist in the screenplay');

      return `${s.tag} is ${cleanName} (${maestroAnchor}). ${hair}, ${eyes}, ${marks}. Wears exactly ${clothing}. Age ${age}, ${build}. Role & Action: ${actionDesc}. Relationship: ${relDesc}. [UNIQUE IDENTITY LOCK: <Subject ${idx}> has distinct face and attire, zero similarity to other subjects].`;
    });
    definitionsParts.push(`Subject definitions: ${humanDefs.join(' ')}`);
  }

  if (activeBuildings.length > 0) {
    const bldDefs = activeBuildings.map((b) => {
      const idx = b.referenceIndex || 1;
      const cleanName = cleanMaestroAnchorName(b.name, `Building${idx}`);
      const maestroAnchor = `@Building${idx}_${cleanName}`;
      const bldAction = b.roleOrActionEn ? toEnglishCinematicText(b.roleOrActionEn) : (b.roleOrAction ? toEnglishCinematicText(b.roleOrAction) : 'Primary architectural facade');
      const bldMat = toEnglishCinematicText(b.hairOrMaterial, 'modern facade with natural wood and fine plaster');
      const bldGlaz = toEnglishCinematicText(b.eyesOrGlazing, 'triple-pane panoramic glazing with slim aluminium profiles');
      const bldFin = toEnglishCinematicText(b.clothingOrFinish, 'integrated solar roof and spacious wooden deck');

      return `${b.tag} is ${cleanName} (${maestroAnchor}). Architecture & materials: ${bldMat}, glazing: ${bldGlaz}, finish: ${bldFin}. Function: ${bldAction}.`;
    });
    definitionsParts.push(`Building definitions: ${bldDefs.join(' ')}`);
  }

  if (activeObjects.length > 0) {
    const objDefs = activeObjects.map((o) => {
      const idx = o.referenceIndex || 1;
      const cleanName = cleanMaestroAnchorName(o.name, `Object${idx}`);
      const maestroAnchor = `@Object${idx}_${cleanName}`;
      const objAction = o.roleOrActionEn ? toEnglishCinematicText(o.roleOrActionEn) : (o.roleOrAction ? toEnglishCinematicText(o.roleOrAction) : 'Central tactile prop');
      const objFin = toEnglishCinematicText(o.clothingOrFinish, 'brushed stainless steel');
      const objMarks = toEnglishCinematicText(o.distinguishingMarks, 'precision craftsmanship and engraved logo');

      return `${o.tag} is ${cleanName} (${maestroAnchor}). Finish: ${objFin}, details: ${objMarks}. Function: ${objAction}.`;
    });
    definitionsParts.push(`Object definitions: ${objDefs.join(' ')}`);
  }

  if (activeLogos.length > 0) {
    const logoDefs = activeLogos.map((l) => {
      const maestroAnchor = `@Logo1_Wasserzeichen_BottomRight`;
      return `${l.tag} is ${l.name} (${maestroAnchor}). Permanent watermark: strictly positioned in the bottom-right corner, subtle and semi-transparent (25% opacity), non-intrusive CI overlay.`;
    });
    definitionsParts.push(`Logo watermark definitions: ${logoDefs.join(' ')}`);
  }

  const definitionsSegment = definitionsParts.join(' ');

  // 4. Separation & Anti-Crossbleed Declarations (Strict MiniMax H3 Anti-Clone Anchor)
  let separationSegment = '';
  if (activeHumans.length > 1) {
    const names = activeHumans.map((s) => {
      const idx = s.referenceIndex || 1;
      const cleanName = cleanMaestroAnchorName(s.name, `Subject${idx}`);
      return `${s.tag} ${cleanName} (@Subject${idx}_${cleanName})`;
    }).join(' and ');
    separationSegment = `ANTI-CLONE & IDENTITY LOCK: ${names} are strictly separate, unique human individuals. Zero feature transfer, zero facial blending, zero morphing, and zero twin duplications. Each actor appears strictly ONCE in this frame. No duplicate or background clones.`;
  } else if (activeHumans.length === 1) {
    const h = activeHumans[0];
    const idx = h.referenceIndex || 1;
    const cleanName = cleanMaestroAnchorName(h.name, `Subject${idx}`);
    separationSegment = `ANTI-CLONE & IDENTITY LOCK: ${h.tag} ${cleanName} (@Subject${idx}_${cleanName}) appears strictly ONCE in this frame as a unique individual. Zero duplicate clones, zero face morphing, zero background twins.`;
  }

  // 5. Timecoded Narrative Sequence (100% Contiguous without time gaps)
  const quarterDur = durationSeconds / 4;
  const t1End = formatTimecode(startSec + quarterDur);
  const t2End = formatTimecode(startSec + quarterDur * 2);
  const t3End = formatTimecode(startSec + quarterDur * 3);

  // Build human tags string INCLUDING ALL active humans (e.g. Subject 2, Subject 3, Subject 4)
  const humanTags = activeHumans.map((h) => {
    const cleanName = cleanMaestroAnchorName(h.name, `Subject${h.referenceIndex || 1}`);
    return `${h.tag} ${cleanName}`;
  });
  const humanTagsStr = humanTags.length > 2
    ? `${humanTags.slice(0, -1).join(', ')} and ${humanTags[humanTags.length - 1]}`
    : humanTags.join(' and ') || `${primaryHuman1.tag} ${primaryHuman1.name}`;

  const bldTagStr = primaryBuilding ? ` at ${primaryBuilding.tag} (${cleanMaestroAnchorName(primaryBuilding.name, 'Building')})` : '';

  const enNarrativeAction = toEnglishCinematicText(narrativeAction);

  // Timecode 1: Start to T1
  let timecodeSegment = `TIMECODE ${tcStart}–${t1End}: ${humanTagsStr} interact in the scene${bldTagStr}. ${enCamMovement}. `;

  // Timecode 2: T1 to T2
  if (enNarrativeAction) {
    timecodeSegment += `TIMECODE ${t1End}–${t2End}: ${enNarrativeAction}. The environment and elements of ${enVisualFocus} are visible. `;
  } else {
    timecodeSegment += `TIMECODE ${t1End}–${t2End}: They explore and interact with ${enVisualFocus}. The scene lighting emphasizes authentic details. `;
  }

  // Dialogue Trigger exactly at T2 (No gap between T2 and dialogue!)
  let speakerObj = activeHumans[0] || primaryHuman1;
  if (dialogueSpeaker) {
    const allHumans = allSubjects.filter((s) => s.category === 'human');
    const matched = allHumans.find((h) => 
      h.tag.toLowerCase() === dialogueSpeaker.toLowerCase() ||
      h.name.toLowerCase() === dialogueSpeaker.toLowerCase() ||
      dialogueSpeaker.toLowerCase().includes(h.name.toLowerCase()) ||
      h.name.toLowerCase().includes(dialogueSpeaker.toLowerCase()) ||
      (h.roleOrAction && h.roleOrAction.toLowerCase().includes(dialogueSpeaker.toLowerCase())) ||
      (h.roleOrAction && dialogueSpeaker.toLowerCase().includes(h.roleOrAction.toLowerCase()))
    );
    if (matched) {
      speakerObj = matched;
      if (!activeHumans.some((h) => h.id === speakerObj.id)) {
        activeHumans.push(speakerObj);
      }
    }
  }
  const speakerIdx = speakerObj.referenceIndex || 1;
  const cleanSpeakerName = cleanMaestroAnchorName(speakerObj.name, `Subject${speakerIdx}`);
  const speakerAnchorTag = `@Subject${speakerIdx}_${cleanSpeakerName}`;
  const sanitizedDialogue = sanitizeQuotesForJSON(dialogueText || 'Hier beginnt unser neues Kapitel.');
  const sanitizedSpeakerAnchor = sanitizeQuotesForJSON(speakerAnchorTag);
  const cleanClaimOrCta = sanitizeQuotesForJSON(claimOrCta || '');
  const timePrefix = `[TIME:${startSec}s-${endSec}s]`;

  // Clean timecoded dialogue trigger: strictly matching working template to prevent off-speaker babbling!
  if (dialogueText) {
    timecodeSegment += `TIMECODE ${t2End}, ${speakerObj.tag} ${cleanSpeakerName}: ${timePrefix} <d[${cleanSpeakerName}][${dialogueLanguage}]> ${sanitizedDialogue} </d> `;
  }

  // Timecode 3: T2 to T3 (Reaction of other humans, e.g. Subject 3 and Subject 4, simultaneous with dialogue)
  const otherHumans = activeHumans.filter((h) => h.id !== speakerObj.id);
  if (otherHumans.length > 0) {
    const otherNames = otherHumans.map((h) => `${h.tag} ${cleanMaestroAnchorName(h.name, 'Partner')}`).join(' and ');
    timecodeSegment += `TIMECODE ${t2End}–${t3End}: Simultaneously, ${otherNames} listen attentively and react naturally in the environment, taking in the scene. `;
  } else {
    timecodeSegment += `TIMECODE ${t2End}–${t3End}: Simultaneously, the camera glides fluidly across the space, highlighting ${enVisualFocus}. `;
  }

  // Timecode 4: T3 to End (Final Call to Action or smooth transition)
  if (isLastWindow && cleanClaimOrCta) {
    const objMention = primaryObject ? ` Featuring ${primaryObject.tag} (${cleanMaestroAnchorName(primaryObject.name, 'Object')}).` : '';
    timecodeSegment += `TIMECODE ${t3End}–${tcEnd}: The camera captures the final moments of the scene.${objMention} Graphic Call-to-Action overlay fades in with text: '${cleanClaimOrCta}'. Fade to soft cinematic black over the last second.`;
  } else {
    timecodeSegment += `TIMECODE ${t3End}–${tcEnd}: Smooth cinematic transition into the next perspective with ${enVisualFocus} gleaming in the light.`;
  }

  // 6. EXTREME CLOSE-UP Macro Inserts (100mm macro, T1.8)
  const macro1 = `EXTREME CLOSE-UP, 100mm macro, T1.8 – close observation of ${enVisualFocus}, capturing fine details in the light.`;
  const macro2 = primaryBuilding
    ? `EXTREME CLOSE-UP, 100mm macro, T1.8 – reflections and ambient light interacting with ${primaryBuilding.tag}.`
    : `EXTREME CLOSE-UP, 100mm macro, T1.8 – reflections and ambient light interacting with the environment, emphasizing depth.`;
  const macro3 = isLastWindow && cleanClaimOrCta
    ? (primaryObject
        ? `EXTREME CLOSE-UP, 100mm macro, T1.8 – ${primaryObject.tag} (${primaryObject.name}) held firmly in hand, followed by the crisp typography of '${cleanClaimOrCta}'.`
        : `EXTREME CLOSE-UP, 100mm macro, T1.8 – a central focal detail of the final scene, followed by the pristine typography of '${cleanClaimOrCta}'.`)
    : `EXTREME CLOSE-UP, 100mm macro, T1.8 – soft light patterns moving slowly across the surface, emphasizing the passage of time.`;

  const macroSegment = `${macro1} ${macro2} ${macro3}`;

  // 7. Camera section (Strict Cinematic English)
  const cameraSegment = `Camera: ${envWeather}, ${enBackground}, ${enCamMovement}, focusing on ${primaryHuman1.tag} ${primaryHuman1.name}, ${enVisualFocus}, shallow depth of field, 35mm master prime, cinematic framing, no artifacts, consistent lighting and anatomy throughout.`;

  // 8. Audio Delivery, Audio Design & Music (Strict Anti-Babble & Anti-Geplappere Lock)
  const targetSoundEn = targetAudience?.soundAesthetic ? toEnglishCinematicText(targetAudience.soundAesthetic) : '';
  const soundAcoustic = targetSoundEn ? `${enSoundDesign}. ${targetSoundEn}` : enSoundDesign;
  const musicAcoustic = targetSoundEn ? `${enMusicStyle}. ${targetSoundEn}` : enMusicStyle;

  const audioDeliverySegment = dialogueText
    ? `Audio Delivery: STRICTLY ZERO rambling, ZERO background chatter, ZERO unsolicited speech fragments, ZERO voice-over. Only the single precise marked dialogue line spoken cleanly by ${cleanSpeakerName}.`
    : `Audio Delivery: STRICTLY ZERO speech, ZERO rambling, ZERO background talking. Pure silent cinematic ambience only.`;
  const audioDesignSegment = `Audio Design: ${soundAcoustic}, nothing else.`;
  const musicSegment = dialogueText
    ? `Music: ${musicAcoustic}. Only ambience and the marked dialogue lines.`
    : `Music: ${musicAcoustic}. Only ambience.`;

  // 9. Active References Tag
  const activeRefTags: string[] = [];
  activeSubjects.forEach((ref) => {
    const typeLabel = ref.category === 'human' ? 'char' : ref.category === 'building' ? 'building' : ref.category === 'object' ? 'prop' : ref.category === 'logo' ? 'logo-watermark' : 'env';
    activeRefTags.push(`${ref.tag} ${ref.name} (${typeLabel})`);
  });

  // Always bind active logo to active references
  activeLogos.forEach((logo) => {
    if (!activeRefTags.some((t) => t.startsWith(logo.tag))) {
      activeRefTags.push(`${logo.tag} ${logo.name} (logo-watermark-bottom-right)`);
    }
  });

  const activeReferencesSegment =
    activeRefTags.length > 0
      ? `Active_References: ${activeRefTags.join(', ')}.`
      : `Active_References: ${primaryHuman1.tag} ${primaryHuman1.name} (char).`;

  // 10. Permanent Logo Watermark Rule (Strictly bottom-right corner, subtle, semi-transparent)
  const logoWatermarkSegment = activeLogos.length > 0
    ? `Watermark: Brand logo ${activeLogos.map((l) => l.tag).join(', ')} must appear permanently in the bottom-right corner (bottom-right, 25% opacity, subtle, non-intrusive transparent overlay).`
    : '';

  // Combine ALL segments into one string and strictly enforce 0 line breaks!
  const rawCombined = [
    windowTag,
    settingSegment,
    definitionsSegment,
    separationSegment,
    timecodeSegment,
    macroSegment,
    cameraSegment,
    audioDeliverySegment,
    audioDesignSegment,
    musicSegment,
    logoWatermarkSegment,
    activeReferencesSegment,
  ]
    .filter(Boolean)
    .join(' ');

  const singleLinePrompt = enforceSingleLine(rawCombined);

  return {
    windowNumber,
    timecodeStart: tcStart,
    timecodeEnd: tcEnd,
    durationSeconds,
    singleLinePrompt,
    title: `Window ${windowNumber}: ${visualFocus.slice(0, 30)}...`,
    summary: narrativeAction || `${visualFocus} mit ${cameraMovement}`,
    activeSubjects: activeSubjects.map((s) => s.name),
    activeReferences: activeSubjects.map((s) => `${s.tag} ${s.name}`),
    dialogueSnippet: dialogueText ? `${timePrefix} <d[${cleanSpeakerName}][${dialogueLanguage}]> ${sanitizedDialogue} </d>` : undefined,
    extremeCloseups: [macro1, macro2, macro3],
    cameraMove: cameraMovement,
    musicAudio: `${musicAcoustic} / ${soundAcoustic}`,
    claimOrCta: claimOrCta || (isLastWindow ? 'Call to Action' : undefined),
  };
}

/**
 * Transforms an entire Concept Proposal into the strict Single-Line Windows format
 */
export function pressProposalToSingleLineWindows(params: {
  proposal: ConceptProposal;
  allSubjects: ConfigReference[];
  windowDurationSeconds?: number;
  dialogueLanguage?: DialogueLanguage;
  actionCode?: string;
  aspectRatio?: '16:9' | '9:16' | '2.39:1';
  globalWeather?: string;
  globalBackground?: string;
  finalCallToAction?: string;
  targetAudience?: TargetAudience;
}): SingleLineWindow[] {
  const {
    proposal,
    allSubjects,
    windowDurationSeconds = 14,
    dialogueLanguage = proposal.dialogueLanguage || 'German',
    actionCode = 'ASTROCINEMAV01K2T',
    aspectRatio = '16:9',
    globalWeather,
    globalBackground,
    finalCallToAction,
    targetAudience,
  } = params;

  const totalWindows = proposal.windowBreakdown.length;
  const activeRefs = allSubjects.filter((r) => r.isActiveInProject !== false);

  return proposal.windowBreakdown.map((win, idx) => {
    const isLast = idx === totalWindows - 1;
    const cta = isLast ? (finalCallToAction || proposal.callToAction || win.claimOrCta) : win.claimOrCta;

    const firstHuman = allSubjects.find((r) => r.category === 'human') || allSubjects[0];

    return buildSingleLineWindowPrompt({
      windowNumber: win.windowNumber,
      totalWindows,
      durationSeconds: windowDurationSeconds,
      actionCode,
      aspectRatio,
      weather: globalWeather || (targetAudience ? targetAudience.colorSpectrum : 'Bright daylight, warm natural sunlight with crisp architectural shadows'),
      background: globalBackground || 'Modern energy-efficient residence with landscaped grounds and wooden terrace',
      cameraMovement: win.cameraMovement,
      visualFocus: win.focus,
      soundDesign: win.soundDesign || (targetAudience ? targetAudience.soundAesthetic : 'Gentle breeze, crisp footsteps, acoustic resonance of high ceiling rooms'),
      musicStyle: win.musicStyle || (targetAudience ? targetAudience.soundAesthetic : 'Cinematic ambient music with warm acoustic presence'),
      dialogueLanguage,
      dialogueSpeaker: win.dialogueSpeaker || firstHuman?.name || 'Bauherrin',
      dialogueText: win.dialogueSnippet,
      claimOrCta: cta,
      isLastWindow: isLast,
      activeSubjects: activeRefs.length > 0 ? activeRefs : allSubjects.slice(0, 3),
      allSubjects,
      narrativeAction: win.actionDescription,
      targetAudience,
    });
  });
}

/**
 * Cinematic English Normalizer & Translator:
 * Translates and standardizes German film, architectural, lighting, acoustic, and character
 * descriptions into high-end cinematic English prompt terminology strictly required for MiniMax H3 / Maestro.
 */
export function toEnglishCinematicText(text?: string, fallback: string = ''): string {
  if (!text || typeof text !== 'string') return fallback;
  const trimmed = text.trim();
  if (!trimmed) return fallback;

  // 1. Exact Multi-Word Phrase & Sentence Replacements (Sorted by specificity)
  const phraseReplacements: [RegExp, string][] = [
    // Target Audience Color & Atmosphere Presets
    [/Ruhige,\s*zeitlose\s*Natur-\s*und\s*Erdtöne\s*\(Sandstein,\s*warmes\s*Grau,\s*helles\s*Eichenholz\)[^.]*\./gi, 'Calm, timeless natural earth tones (sandstone, warm gray, light natural oak wood), neutral warm diffused daylight and harmonic contrast.'],
    [/Monochrome\s*Eleganz\s*mit\s*warmen\s*Akzenten[^.]*\./gi, 'Monochrome architectural elegance with warm accents: anthracite, exposed fair-faced concrete, dark smoked oak, champagne brass details, dramatic blue hour lighting with indirect warm LED lines.'],
    [/Sanfte\s*Salbei-,\s*Eukalyptus-\s*und\s*helle\s*Naturtöne[^.]*\./gi, 'Soft sage green, eucalyptus and light natural hues, gentle diffused light through architectural louvers, organic shapes, uninterrupted view of lush garden greenery.'],
    [/Warme,\s*sonnige\s*und\s*lebendige\s*Töne[^.]*\./gi, 'Warm, sunny and vibrant color palette: light golden honey wood, crisp fresh summer daylight, sunlit open spaces, lush green designer garden.'],
    [/Kreative\s*Loft-Ästhetik[^.]*\./gi, 'Creative loft aesthetic: raw exposed concrete, warm oak slats, matte black steel accents, dynamic architectural lighting.'],
    [/Warme,\s*edle\s*Cremetöne[^.]*\./gi, 'Warm, sophisticated cream tones, gentle late afternoon golden light, warm timber terrace deck, welcoming and glare-free illumination.'],

    // Target Audience Sound Aesthetic Presets
    [/Klassisch-harmonische\s*Streicher\s*mit\s*ruhigem\s*Klavier[^.]*\./gi, 'Classical harmonic strings with calm acoustic piano, deep dampened foley of closing solid doors, natural footsteps on real oak parquet, zero harsh electronic synths.'],
    [/Präziser\s*Modern-Electronic\s*Ambient[^.]*\./gi, 'Precise modern ambient soundscape with subtle sub-bass pulse, delicate neo-classical piano notes, whisper-quiet tactile foley of sliding panoramic glass and high-end switches.'],
    [/Meditative,\s*organische\s*Klanglandschaft[^.]*\./gi, 'Meditative organic soundscape: gentle warm cello, soft summer breeze in treetops, quiet water ripple, serene acoustic room isolation.'],
    [/Wärmende\s*akustische\s*Gitarre[^.]*\./gi, 'Warm acoustic guitar, gentle piano melody, lively family comfort ambience, soft breeze.'],
    [/Inspirierende\s*Neo-Klassik[^.]*\./gi, 'Inspiring neo-classical ambient sound with warm acoustic texture, crisp keyboard foley and vinyl presence.'],
    [/Ruhige,\s*feinsinnige\s*Akustik[^.]*\./gi, 'Serene, sophisticated acoustic soundscape with piano, acoustic guitar and gentle natural birdsong and soft breeze.'],

    // Weather & Atmosphere Sentences
    [/Bewölkter\s*Tag\s*bei\s*leichtem\s*Nieselregen[^.]*diffus[^.]*\./gi, 'Overcast day with gentle atmospheric drizzle, soft and diffused cinematic light with cozy and enduring warmth.'],
    [/Warmes\s*Abendlicht\s*&\s*goldene\s*Stunde/gi, 'Warm golden hour sunlight with soft diffused shadows and ambient twilight glow'],
    [/Warmes\s*Nachmittagslicht\s*&\s*goldene\s*Stunde/gi, 'Warm golden hour sunlight with soft diffused shadows and ambient twilight glow'],
    [/Sonnig\s*&\s*klarer\s*blauer\s*Himmel/gi, 'Sunny and clear blue sky with warm architectural illumination and crisp shadows'],
    [/Dunst\s*steigt\s*über\s*der\s*Wiese\s*auf[^.]*\./gi, 'Morning mist rising over the meadow, morning sun breaking through pine treetops, casting warm edge light on the facade.'],
    [/Morgenstille\s*&\s*Naturerwachen/gi, 'Serene morning silence and natural dawn, golden early morning sunlight'],
    [/Dämmerung\s*&\s*Leuchtendes\s*Zuhause/gi, 'Blue hour twilight, glowing interior warm light emanating through floor-to-ceiling glass'],

    // Camera Movements & Presets
    [/Drohnenflug\s*Orbit\s*360°\s*und\s*sanfter\s*Sinkflug\s*auf\s*Augenhöhe/gi, '360-degree orbital drone flight smoothly descending to eye-level'],
    [/Drohnenflug\s*Orbit\s*360°/gi, '360-degree orbital drone shot gliding smoothly around the building'],
    [/Dolly-In\s*durch\s*die\s*Eingangstür\s*mit\s*flüssiger\s*Steadicam-Führung/gi, 'Smooth Steadicam dolly-in gliding through the entrance door into the open foyer'],
    [/Steadicam\s*Walkthrough\s*entlang\s*der\s*Sichtachse\s*Richtung\s*Garten/gi, 'Fluid Steadicam walkthrough along architectural sightlines towards the garden terrace'],
    [/Langsamer\s*Rückwärts-Dolly\s*und\s*Aufstieg\s*der\s*Kamera\s*in\s*die\s*Abenddämmerung/gi, 'Slow reverse dolly and gentle crane rise into the golden evening twilight'],
    [/Dolly-In\s*mit\s*35mm\s*Prime/gi, 'Smooth forward dolly-in with 35mm master prime lens at eye level'],
    [/Kran-Aufzug\s*&\s*Sunset\s*Outro/gi, 'Slow ascending crane rise pulling back from the wooden terrace into the glowing evening sky'],
    [/FPV\s*Fly-Through\s*entlang\s*der\s*Dachlinie/gi, 'Dynamic FPV fly-through along the solar roofline and architectural facade'],
    [/Sanfter\s*Kameraschwenk/gi, 'Gentle cinematic camera pan'],
    [/Statische\s*Meistereinstellung\s*mit\s*sanftem\s*Micro-Dolly/gi, 'Static cinematic master shot with gentle micro-dolly track'],
    [/Low-Angle\s*Steadicam\s*auf\s*die\s*Schritte/gi, 'Low-angle Steadicam tracking the footsteps, then tilting up to the face'],

    // Actions & Character Interactions
    [/Er\s*ist\s*(the\s*)?Makler\s*(und|and)\s*Verkäufer\s*(des\s*Hauses)?/gi, 'He is the real estate agent and seller of the house'],
    [/Sie\s*ist\s*(the\s*)?Partnerin\s*(von|of)\s*subject3_mann/gi, 'She is the partner of Subject 3'],
    [/Sicht\s*(auf|on)\s*(eine|a)\s*stabile,\s*solide\s*Infrastruktur/gi, 'View facing stable, enduring infrastructure'],
    [/Einfache,\s*funktionale\s*Gestaltung\s*without\s*übermäßige\s*Dekoration/gi, 'Clean, functional design without excessive decoration'],
    [/Szenerie\s*radiates\s*cozy\s*warmth\s*and\s*security\s*and\s*timeless\s*durability/gi, 'Scene radiates cozy warmth, security, and timeless durability'],
    [/Er\s*begrüßt\s*seine\s*Gäste\s*und\s*führt\s*sie\s*durch\s*das\s*Haus/gi, 'He warmly welcomes his guests and guides them through the architectural residence'],
    [/Erkundet\s*die\s*Architektur\s*und\s*prüft\s*die\s*Materialien/gi, 'Explores the architectural sightlines, admiring panoramic glass and touching natural wood surfaces'],
    [/Erkundet\s*die\s*Architektur/gi, 'Explores architectural sightlines, touches tactile timber surfaces and inspects panoramic glass'],
    [/Begleitet\s*die\s*Besichtigung/gi, 'Accompanies the walkthrough with confident satisfaction'],
    [/Sie\s*treten\s*durch\s*die\s*Eingangstür/gi, 'They step through the front entrance into the spacious foyer'],
    [/Der\s*Blick\s*öffnet\s*sich\s*in\s*den\s*großzügigen\s*Wohn-\s*und\s*Kochbereich/gi, 'The view opens into the spacious open-concept living and kitchen area with natural sunlight pouring in'],
    [/Beide\s*stehen\s*entspannt\s*auf\s*der\s*Holzterrasse/gi, 'Both stand relaxed on the wooden terrace deck bathed in golden evening light'],
    [/Die\s*Schlüsselübergabe\s*erfolgt/gi, 'The handover of the keys takes place in a tactile close-up'],
    [/Geht\s*barfuß\s*über\s*den\s*warmen\s*Parkettboden/gi, 'Walks barefoot across the warm oak parquet flooring, holding a steaming cup of coffee in both hands'],
    [/Sitzt\s*auf\s*der\s*Lesebank\s*im\s*Fenstererker/gi, 'Sits comfortably on the reading bench by the panoramic bay window with a book on her lap'],
    [/Zentrales\s*haptisches\s*Detail\s*bei\s*der\s*Übergabe/gi, 'Central tactile prop in handover sequence, held firmly in hand'],
    [/Permanentes,\s*dezentes\s*Wasserzeichen/gi, 'Permanent discreet transparent watermark anchored in bottom-right corner (25% opacity)'],

    // Settings & Environments
    [/Moderne\s*Architektur\s*in\s*natürlicher\s*Umgebung/gi, 'A modern high-end architectural residence with landscaped grounds and wooden terrace'],
    [/Neubausiedlung\s*mit\s*gepflegtem\s*Vorgarten/gi, 'Suburban upscale residential setting with manicured lawn and wooden deck'],
    [/Gut\s*gepflegter,\s*naturnaher\s*Garten\s*mit\s*robusten\s*Bäumen\s*und\s*Sträuchern/gi, 'Well-maintained naturalistic landscaped designer garden with lush trees and shrubs'],
    [/Gut\s*gepflegter,\s*naturnaher\s*landscaped\s*designer\s*garden\s*mit\s*robusten\s*Bäumen\s*und\s*Sträuchern/gi, 'Well-maintained naturalistic landscaped designer garden with lush trees and shrubs'],
    [/Subtile\s*Raumakustik\s*&\s*sanftes\s*Windrauschen/gi, 'Subtle acoustic room presence, soft breeze through trees and gentle footsteps on wood'],
    [/Cinematic\s*Ambient\s*Soundtrack/gi, 'Warm cinematic ambient soundtrack with gentle acoustic guitar and piano accents'],
    [/Hauptmotiv\s*und\s*architektonische\s*Kulisse/gi, 'Primary architectural facade, modern cubic geometry with vertical larch wood slats and triple-glazed windows'],
  ];

  let res = trimmed;

  for (const [regex, rep] of phraseReplacements) {
    res = res.replace(regex, rep);
  }

  // 2. Vocabulary & Word-Level Architectural / Cinematic Replacements
  const vocabReplacements: [RegExp, string][] = [
    // Custom German to English references and descriptors
    [/\bdunkles\b/gi, 'dark'],
    [/\bgepflegtes\b/gi, 'well-groomed'],
    [/\bHaar\b/gi, 'hair'],
    [/\bHaare\b/gi, 'hair'],
    [/\bAugen\b/gi, 'eyes'],
    [/\bleichter\b/gi, 'light'],
    [/\bleichtes\b/gi, 'light'],
    [/\bleichte\b/gi, 'light'],
    [/\bBart\b/gi, 'beard'],
    [/\bBartwuchs\b/gi, 'beard growth'],
    [/\bfreundliches\b/gi, 'friendly'],
    [/\bfreundliche\b/gi, 'friendly'],
    [/\bLächeln\b/gi, 'smile'],
    [/\bhellgraues\b/gi, 'light gray'],
    [/\bhellgrauer\b/gi, 'light gray'],
    [/\bhellgrau\b/gi, 'light gray'],
    [/\bBlazer\b/gi, 'blazer'],
    [/\büber\b/gi, 'over'],
    [/\blueber\b/gi, 'over'],
    [/\bdunklen\b/gi, 'dark'],
    [/\bdunkle\b/gi, 'dark'],
    [/\bdunkler\b/gi, 'dark'],
    [/\bdunkles\b/gi, 'dark'],
    [/\bHosen\b/gi, 'trousers'],
    [/\bHose\b/gi, 'trousers'],
    [/\bsportlich\b/gi, 'athletic'],
    [/\bMittelblondes\b/gi, 'medium blonde'],
    [/\bmittelblond\b/gi, 'medium blonde'],
    [/\bwelliges\b/gi, 'wavy'],
    [/\bwellige\b/gi, 'wavy'],
    [/\bnatürlichen\b/gi, 'natural'],
    [/\bnatürliche\b/gi, 'natural'],
    [/\bnatuerliche\b/gi, 'natural'],
    [/\bBräunungen\b/gi, 'highlights'],
    [/\bsanften\b/gi, 'soft'],
    [/\bsanfte\b/gi, 'soft'],
    [/\bWellen\b/gi, 'waves'],
    [/\bDunkelbraune\b/gi, 'dark brown'],
    [/\bdunkelbraune\b/gi, 'dark brown'],
    [/\bFeine\b/gi, 'fine'],
    [/\bfeine\b/gi, 'fine'],
    [/\bgoldfarbene\b/gi, 'golden'],
    [/\bgoldene\b/gi, 'golden'],
    [/\bHalskette\b/gi, 'necklace'],
    [/\bdezente\b/gi, 'subtle'],
    [/\bdezent\b/gi, 'subtle'],
    [/\bOhrringe\b/gi, 'earrings'],
    [/\boffenes\b/gi, 'open'],
    [/\boffene\b/gi, 'open'],
    [/\bprofessionelle\b/gi, 'professional'],
    [/\bwarme\b/gi, 'warm'],
    [/\bwarmer\b/gi, 'warm'],
    [/\bwarmes\b/gi, 'warm'],
    [/\bAusstrahlung\b/gi, 'aura/look'],
    [/\bElegante\b/gi, 'elegant'],
    [/\belegante\b/gi, 'elegant'],
    [/\bcremefarbene\b/gi, 'cream-colored'],
    [/\bSeidenbluse\b/gi, 'silk blouse'],
    [/\bV-Ausschnitt\b/gi, 'V-neck'],
    [/\bmineblaue\b/gi, 'navy blue'],
    [/\bmarineblaue\b/gi, 'navy blue'],
    [/\bmarineblau\b/gi, 'navy blue'],
    [/\bstrukturierte\b/gi, 'structured'],
    [/\bstrukturiert\b/gi, 'structured'],
    [/\bJahre\b/gi, 'years'],
    [/\bStatur\b/gi, 'stature'],
    [/\bschlank\b/gi, 'slender'],
    [/\bschlanke\b/gi, 'slender'],
    [/\bproportioniert\b/gi, 'proportioned'],
    [/\bkahlköpfig\b/gi, 'bald'],
    [/\bmeliertes\b/gi, 'grizzled'],
    [/\bmelierter\b/gi, 'grizzled'],
    [/\bschwarze\b/gi, 'black'],
    [/\bschwarzer\b/gi, 'black'],
    [/\bBrille\b/gi, 'glasses'],
    [/\bsilberner\b/gi, 'silver'],
    [/\bsilberne\b/gi, 'silver'],
    [/\bArmbanduhr\b/gi, 'wristwatch'],
    [/\bam\b/gi, 'on'],
    [/\blinken\b/gi, 'left'],
    [/\bHandgelenk\b/gi, 'wrist'],
    [/\bblauer\b/gi, 'blue'],
    [/\bblaues\b/gi, 'blue'],
    [/\bmassgeschneiderter\b/gi, 'tailored'],
    [/\btailored\b/gi, 'tailored'],
    [/\bHemd\b/gi, 'shirt'],
    [/\bAnzug\b/gi, 'suit'],
    [/\bBlazer\b/gi, 'blazer'],
    [/\bGrauer\b/gi, 'gray'],
    [/\bgrauer\b/gi, 'gray'],
    [/\bgraues\b/gi, 'gray'],
    [/\bFassadenbereichen\b/gi, 'facade areas'],
    [/\bGroßflächige\b/gi, 'large panoramic'],
    [/\bgrossflaechige\b/gi, 'large panoramic'],
    [/\bschwarzem\b/gi, 'black'],
    [/\bschwarzen\b/gi, 'black'],
    [/\bschwarzer\b/gi, 'black'],
    [/\bRahmen\b/gi, 'frame'],
    [/\btransparenter\b/gi, 'transparent'],
    [/\bVerglasung\b/gi, 'glazing'],
    [/\bTerrasse\b/gi, 'terrace'],
    [/\bmoderne\b/gi, 'modern'],
    [/\bohne\b/gi, 'without'],
    [/\bdekorative\b/gi, 'decorative'],
    [/\bElemente\b/gi, 'elements'],
    [/\bszenerie\b/gi, 'scenery'],
    [/\bMusterhaus\b/gi, 'show home'],
    [/\bTraumhaus\b/gi, 'dream home'],
    [/\bEinfache\b/gi, 'clean'],
    [/\beinfache\b/gi, 'clean'],
    [/\bfunktionale\b/gi, 'functional'],
    [/\bGestaltung\b/gi, 'design'],
    [/\bübermäßige\b/gi, 'excessive'],
    [/\buebermaessige\b/gi, 'excessive'],
    [/\bDekoration\b/gi, 'decoration'],
    [/\bgut\b/gi, 'well-'],
    [/\bbefestigte\b/gi, 'paved'],
    [/\bStraße\b/gi, 'road'],
    [/\bStrasse\b/gi, 'road'],
    [/\bStrukturierte\b/gi, 'structured'],

    // Shot types & Camera
    [/\bTotale\b/gi, 'Wide establishing shot'],
    [/\bHalbtotale\b/gi, 'Medium wide shot'],
    [/\bNahaufnahme\b/gi, 'Close-up shot'],
    [/\bDetailaufnahme\b/gi, 'Tactile detail shot'],
    [/\bKameraführung\b/gi, 'camera movement'],
    [/\bKamerabewegung\b/gi, 'camera movement'],
    [/\bDrohne\b/gi, 'drone'],
    [/\bDrohnenflug\b/gi, 'drone flight'],
    [/\bSchwenk\b/gi, 'camera pan'],
    [/\bKranfahrt\b/gi, 'crane shot'],

    // Weather & Light
    [/\bBewölkt\b/gi, 'Overcast'],
    [/\bbewölkter Tag\b/gi, 'overcast day'],
    [/\bbei leichtem Nieselregen\b/gi, 'with gentle drizzle'],
    [/\bNieselregen\b/gi, 'gentle drizzle'],
    [/\bSonnenuntergang\b/gi, 'sunset'],
    [/\bAbenddämmerung\b/gi, 'evening twilight'],
    [/\bMorgensonne\b/gi, 'morning sun'],
    [/\bAbendsonne\b/gi, 'golden evening sun'],
    [/\bgoldene Stunde\b/gi, 'golden hour'],
    [/\bdiffus\b/gi, 'diffused'],
    [/\bweich und diffus\b/gi, 'soft and diffused'],
    [/\bLichtkegel\b/gi, 'warm beam of light'],
    [/\bSchattenwurf\b/gi, 'shadow patterns'],
    [/\bTageslicht\b/gi, 'natural daylight'],
    [/\bSonnenstrahl\b/gi, 'sunbeam'],
    [/\bSonnenlicht\b/gi, 'sunlight'],

    // Architecture & Spaces
    [/\bFassade\b/gi, 'facade'],
    [/\bGrundriss\b/gi, 'floorplan layout'],
    [/\bTerrasse\b/gi, 'wooden terrace deck'],
    [/\bHolzterrasse\b/gi, 'wooden terrace deck'],
    [/\bWohnbereich\b/gi, 'open-concept living area'],
    [/\bWohnraum\b/gi, 'living space'],
    [/\bKüche\b/gi, 'minimalist designer kitchen'],
    [/\bKochinsel\b/gi, 'kitchen island'],
    [/\bEingangsbereich\b/gi, 'entrance foyer'],
    [/\bEingangstür\b/gi, 'front entrance door'],
    [/\bFoyer\b/gi, 'spacious foyer'],
    [/\bGarten\b/gi, 'landscaped designer garden'],
    [/\bVorgarten\b/gi, 'front yard'],
    [/\bGalerie\b/gi, 'upper gallery floor'],
    [/\bTreppe\b/gi, 'architectural staircase'],
    [/\bEichentreppe\b/gi, 'floating oak staircase'],
    [/\bBadezimmer\b/gi, 'wellness bathroom'],
    [/\bSchlafzimmer\b/gi, 'master bedroom'],
    [/\bMusterhaus\b/gi, 'modern show home residence'],
    [/\bAnwesen\b/gi, 'residential estate'],
    [/\bZuhause\b/gi, 'home'],
    [/\bGebäude\b/gi, 'architectural building'],
    [/\bHaus\b/gi, 'residence'],
    [/\bBauwerk\b/gi, 'architectural structure'],
    [/\bPhotovoltaikanlage\b/gi, 'integrated rooftop solar photovoltaic array'],
    [/\bSolardach\b/gi, 'solar photovoltaic roof'],
    [/\bWallbox\b/gi, 'EV charging wallbox'],
    [/\bPanoramafenster\b/gi, 'panoramic floor-to-ceiling glass window'],
    [/\bPanoramaverglasung\b/gi, 'floor-to-ceiling panoramic glass facade'],
    [/\bSchiebefenster\b/gi, 'sliding glass doors'],
    [/\bSchiebetür\b/gi, 'sliding glass door'],

    // Materials & Details
    [/\bHolz\b/gi, 'natural wood'],
    [/\bEichenholz\b/gi, 'natural oak wood'],
    [/\bEiche\b/gi, 'oak wood'],
    [/\bEichenparkett\b/gi, 'natural oak parquet'],
    [/\bParkettboden\b/gi, 'hardwood parquet floor'],
    [/\bNaturholzlamellen\b/gi, 'natural timber louvers'],
    [/\bHolzlamellen\b/gi, 'wooden louvers'],
    [/\bLamellen\b/gi, 'vertical louvers'],
    [/\bGlas\b/gi, 'glass'],
    [/\bIsolierglas\b/gi, 'insulated glazing'],
    [/\bDreifach-Isolierglas\b/gi, 'triple-glazed low-E insulated glass'],
    [/\bSichtbeton\b/gi, 'smooth architectural concrete'],
    [/\bNaturstein\b/gi, 'natural sandstone'],
    [/\bSandstein\b/gi, 'sandstone'],
    [/\bEdelstahl\b/gi, 'brushed stainless steel'],
    [/\bAluminium\b/gi, 'slim anodized aluminium profiles'],
    [/\bFeinputz\b/gi, 'smooth white architectural plaster'],
    [/\bLeder\b/gi, 'natural leather'],
    [/\bGranit\b/gi, 'polished granite'],
    [/\bSchlüssel\b/gi, 'architectural key fob'],
    [/\bSchlüsselbund\b/gi, 'tactile key ring'],
    [/\bExposé\b/gi, 'architectural folder'],
    [/\bBäume\b/gi, 'lush trees'],
    [/\bBäumen\b/gi, 'lush trees'],
    [/\bSträucher\b/gi, 'shrubs'],
    [/\bSträuchern\b/gi, 'shrubs'],
    [/\bWiese\b/gi, 'manicured lawn'],
    [/\bPflanzen\b/gi, 'architectural greenery'],

    // Colors & Clothing
    [/\blila Tütü\b/gi, 'vibrant purple ballet tutu dress'],
    [/\bTütü\b/gi, 'ballet tutu dress'],
    [/\blila\b/gi, 'vibrant purple'],
    [/\brosa\b/gi, 'soft pink'],
    [/\bpink\b/gi, 'bright pink'],
    [/\bgelb\b/gi, 'warm yellow'],
    [/\bblau\b/gi, 'deep blue'],
    [/\brot\b/gi, 'vibrant red'],
    [/\bKostüm\b/gi, 'costume outfit'],
    [/\bAnzug\b/gi, 'tailored suit'],
    [/\bKrawatte\b/gi, 'silk tie'],
    [/\bAnthrazit\b/gi, 'anthracite'],
    [/\bWarmes Grau\b/gi, 'warm gray'],
    [/\bGrau\b/gi, 'gray'],
    [/\bWeiß\b/gi, 'crisp white'],
    [/\bSchwarz\b/gi, 'matte black'],
    [/\bBraun\b/gi, 'warm brown'],
    [/\bCognac\b/gi, 'cognac brown'],
    [/\bSilber\b/gi, 'silver'],
    [/\bGold\b/gi, 'golden'],
    [/\bHonig\b/gi, 'golden honey'],
    [/\bGrün\b/gi, 'lush green'],
    [/\bSalbei\b/gi, 'sage green'],

    // Verbs & Actions
    [/\berkundet\b/gi, 'explores'],
    [/\berkunden\b/gi, 'explore'],
    [/\bbegrüßt\b/gi, 'welcomes'],
    [/\bführt\b/gi, 'guides'],
    [/\bberührt\b/gi, 'gently touches'],
    [/\bprüft\b/gi, 'inspects'],
    [/\bblickt\b/gi, 'gazes'],
    [/\bblicken\b/gi, 'look together'],
    [/\bschreitet\b/gi, 'walks gracefully'],
    [/\bgeht\b/gi, 'walks'],
    [/\bsteht\b/gi, 'stands'],
    [/\bstehen\b/gi, 'stand together'],
    [/\bsitzt\b/gi, 'sits'],
    [/\bhält\b/gi, 'holds firmly'],
    [/\blächelt\b/gi, 'smiles with confidence'],
    [/\bstrahlt\b/gi, 'glows warmly'],
    [/\bvermittelt\b/gi, 'radiates'],
    [/\bzeigt\b/gi, 'reveals'],
    [/\bfällt\b/gi, 'streams'],
    [/\bflutet\b/gi, 'floods'],
    [/\böffnet\b/gi, 'opens'],

    // General Words & Connectors
    [/\bGeborgenheit\b/gi, 'cozy warmth and security'],
    [/\bBeständigkeit\b/gi, 'timeless durability and permanence'],
    [/\bWerthaltigkeit\b/gi, 'enduring architectural value'],
    [/\bLebensqualität\b/gi, 'highest living quality'],
    [/\bWohlfühl\b/gi, 'wellbeing and comfort'],
    [/\bAtmosphäre\b/gi, 'cinematic atmosphere'],
    [/\bStimmung\b/gi, 'ambience'],
    [/\bRuhe\b/gi, 'peaceful serenity'],
    [/\bPräzision\b/gi, 'precision craftsmanship'],
    [/\bQualität\b/gi, 'premium quality'],
    [/\bBauherrin\b/gi, 'female client homeowner'],
    [/\bBauherr\b/gi, 'male client homeowner'],
    [/\bPartner\b/gi, 'partner'],
    [/\bGäste\b/gi, 'guests'],
    [/\bProtagonistin\b/gi, 'female protagonist'],
    [/\bProtagonist\b/gi, 'protagonist'],
    [/\bRequisite\b/gi, 'prop'],
    [/\bWasserzeichen\b/gi, 'watermark'],
    [/\brechts unten\b/gi, 'bottom-right corner'],
    [/\bDeckkraft\b/gi, 'opacity'],
    [/\btransparent\b/gi, 'transparent'],
    [/\bdezent\b/gi, 'subtle and discreet'],
    [/\bmit\b/gi, 'with'],
    [/\bund\b/gi, 'and'],
    [/\bfür\b/gi, 'for'],
    [/\bvon\b/gi, 'of'],
    [/\bauf\b/gi, 'on'],
    [/\bin\b/gi, 'in'],
    [/\bim\b/gi, 'in the'],
    [/\bins\b/gi, 'into the'],
    [/\bdas\b/gi, 'the'],
    [/\bder\b/gi, 'the'],
    [/\bdie\b/gi, 'the'],
    [/\bein\b/gi, 'a'],
    [/\beine\b/gi, 'a'],
    [/\beiner\b/gi, 'a'],
    [/\beinem\b/gi, 'a'],
    [/\beinen\b/gi, 'a'],
    [/\bohne\b/gi, 'without'],
    [/\bdurch\b/gi, 'through'],
    [/\bentlang\b/gi, 'along'],
    [/\büber\b/gi, 'over'],
    [/\bhier\b/gi, 'here'],
    [/\balle\b/gi, 'all'],
    [/\balles\b/gi, 'everything'],
    [/\bsehr\b/gi, 'very'],
    [/\bnatürlich\b/gi, 'natural'],
    [/\bhochwertig\b/gi, 'high-end premium'],
    [/\bmodern\b/gi, 'modern'],
    [/\bästhetisch\b/gi, 'aesthetic'],
    [/\belegant\b/gi, 'elegant'],
    [/\bzeitlos\b/gi, 'timeless'],
    [/\bharmonisch\b/gi, 'harmonic'],
  ];

  for (const [regex, rep] of vocabReplacements) {
    res = res.replace(regex, rep);
  }

  // 3. Cleanup formatting, duplicate spaces, hanging German commas/periods
  res = res
    .replace(/\s+/g, ' ')
    .replace(/\s,\s/g, ', ')
    .replace(/\s\.\s/g, '. ')
    .replace(/,\s*,/g, ',')
    .replace(/\.\s*\./g, '.')
    .trim();

  return res || fallback;
}

export interface MaestroBindingSlot {
  slotIndex: number;
  category: ScreenplayReferenceCategory;
  promptTag: string; // e.g. "<Subject 1>", "<Building 1>", "<Object 1>", "<Logo 1>"
  maestroLabel: string; // e.g. "@Subject1_Anna_Bauherrin", "@Building1_Musterhaus_Avantgarde"
  referenceName: string;
  roleOrAction: string;
  roleOrActionEn?: string;
  relationship: string;
  localFile?: string;
  distinguishingMarks?: string;
  photoUrl?: string;
}

function cleanMaestroAnchorName(rawName: string, fallback: string): string {
  if (!rawName) return fallback;
  let clean = rawName.replace(/\.(png|jpg|jpeg|webp|svg|gif)$/i, '').trim();
  // If it's a raw UUID like "05d6ed5c-b891-40d8-8519-69170ee06e51" or raw WhatsApp filename without custom name
  if (/^[0-9a-f]{8}[\s_-][0-9a-f]{4}/i.test(clean) || /^[0-9a-f]{16,}/i.test(clean) || /^whatsapp\s*image/i.test(clean)) {
    return fallback;
  }
  clean = clean.replace(/[^a-zA-Z0-9_]/g, '');
  if (clean.length > 20) clean = clean.substring(0, 20);
  return clean || fallback;
}

/**
 * Derives the exact Maestro 2.1.6 binding slots for reference configuration.
 */
export function getMaestro216Bindings(references: ConfigReference[]): MaestroBindingSlot[] {
  return (references || []).map((ref, idx) => {
    const slotIdx = idx + 1;
    const cat = ref.category || 'human';
    const fallback = cat === 'human' ? `Subject${slotIdx}` : cat === 'building' ? 'Musterhaus' : cat === 'logo' ? 'Wasserzeichen' : 'Requisite';
    const cleanName = cleanMaestroAnchorName(ref.name || '', fallback);
    let tag = ref.tag || `<Subject ${slotIdx}>`;
    let maestroLabel = ref.charTag?.startsWith('@') ? ref.charTag : `@Subject${slotIdx}_${cleanName}`;

    if (cat === 'building') {
      tag = `<Building ${ref.referenceIndex || slotIdx}>`;
      if (!ref.charTag?.startsWith('@')) maestroLabel = `@Building${ref.referenceIndex || slotIdx}_${cleanName}`;
    } else if (cat === 'object') {
      tag = `<Object ${ref.referenceIndex || slotIdx}>`;
      if (!ref.charTag?.startsWith('@')) maestroLabel = `@Object${ref.referenceIndex || slotIdx}_${cleanName}`;
    } else if (cat === 'logo') {
      tag = `<Logo ${ref.referenceIndex || 1}>`;
      if (!ref.charTag?.startsWith('@')) maestroLabel = `@Logo${ref.referenceIndex || 1}_Wasserzeichen_BottomRight`;
    }

    return {
      slotIndex: slotIdx,
      category: cat,
      promptTag: tag,
      maestroLabel,
      referenceName: ref.name || `Referenz ${slotIdx}`,
      roleOrAction: ref.roleOrAction || 'Handlungsträger',
      roleOrActionEn: ref.roleOrActionEn || toEnglishCinematicText(ref.roleOrAction),
      relationship: ref.relationship || 'Kernmotiv',
      localFile: ref.localFile,
      distinguishingMarks: ref.distinguishingMarks,
      photoUrl: ref.photoUrl,
    };
  });
}

/**
 * Builds the cheat-sheet text for pasting into Maestro 2.1.6.
 */
export function generateMaestroSlotsMappingText(references: ConfigReference[], projectTitle?: string): string {
  const bindings = getMaestro216Bindings(references);
  let txt = `========================================================================\n`;
  txt += `MAESTRO 2.1.6 REFERENCE BINDING MATRIX: ${projectTitle || 'Drehbuch Projekt'}\n`;
  txt += `Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
  txt += `========================================================================\n\n`;

  bindings.forEach((b) => {
    txt += `[MAESTRO 2.1.6 SLOT ${b.slotIndex}] (${b.category.toUpperCase()})\n`;
    txt += `• MAESTRO LABEL / NAME : ${b.maestroLabel}\n`;
    txt += `• PROMPT BINDING TAG   : ${b.promptTag}\n`;
    txt += `• ELEMENT-NAME         : ${b.referenceName}\n`;
    txt += `• ROLLE & AKTION (DE)  : ${b.roleOrAction}\n`;
    if (b.roleOrActionEn) {
      txt += `• PROMPT ACTION (EN)   : ${b.roleOrActionEn}\n`;
    }
    txt += `• BEZIEHUNG/KONTEXT    : ${b.relationship}\n`;
    if (b.category === 'logo') {
      txt += `• WASSERZEICHEN-REGEL  : IMMER rechts unten, dezent & transparent (25% Opacity)\n`;
    }
    txt += `\n`;
  });

  return txt;
}

/**
 * Transforms standard WindowConfig list into the strict Single-Line Windows format
 */
export function pressConfigToSingleLineWindows(params: {
  windows: WindowConfig[];
  allSubjects: ConfigReference[];
  windowDurationSeconds?: number;
  dialogueLanguage?: DialogueLanguage;
  actionCode?: string;
  aspectRatio?: '16:9' | '9:16' | '2.39:1';
  globalWeather?: string;
  globalBackground?: string;
  finalCallToAction?: string;
  targetAudience?: TargetAudience;
}): SingleLineWindow[] {
  const {
    windows,
    allSubjects,
    windowDurationSeconds = 14,
    dialogueLanguage = 'German',
    actionCode = 'ASTROCINEMAV01K2T',
    aspectRatio = '16:9',
    globalWeather,
    globalBackground,
    finalCallToAction,
    targetAudience,
  } = params;

  const totalWindows = windows.length;
  const activeRefs = allSubjects.filter((r) => r.isActiveInProject !== false);

  return windows.map((win, idx) => {
    const isLast = idx === totalWindows - 1;
    const cta = isLast ? (finalCallToAction || win.claim) : win.claim;

    // Filter active subjects based on window config or default to project-active
    let activeSubjs: ConfigReference[] = [];
    if (win.activeSubjectIndices && win.activeSubjectIndices.length > 0) {
      activeSubjs = allSubjects.filter((s) => win.activeSubjectIndices?.includes(s.referenceIndex));
    }
    if (activeSubjs.length === 0) {
      activeSubjs = activeRefs.length > 0 ? activeRefs : allSubjects.slice(0, 3);
    }

    const firstHuman = activeSubjs.find((r) => r.category === 'human') || activeSubjs[0];

    return buildSingleLineWindowPrompt({
      windowNumber: win.windowNumber,
      totalWindows,
      durationSeconds: win.durationSeconds || windowDurationSeconds,
      actionCode,
      aspectRatio,
      weather: win.weather || globalWeather,
      background: win.background || globalBackground,
      cameraMovement: win.cameraMovement,
      visualFocus: win.visualFocus,
      soundDesign: win.soundDesign,
      musicStyle: win.musicStyle,
      dialogueLanguage,
      dialogueSpeaker: win.dialogueSpeaker || firstHuman?.name,
      dialogueText: win.dialogueText,
      claimOrCta: cta,
      isLastWindow: isLast,
      activeSubjects: activeSubjs,
      allSubjects,
      narrativeAction: `${win.title}: Kamera führt ${win.cameraMovement} aus. Fokus auf ${win.visualFocus}.`,
      targetAudience,
    });
  });
}

export interface GermanPromptBreakdown {
  titel: string;
  zeitspanne: string;
  szenenHandlung: string;
  kamerafuehrung: string;
  aktiveReferenzen: string[];
  dialogueGerman?: string;
  closeupsGerman: string[];
  musikUndSound: string;
  callToActionGerman?: string;
  hinweis: string;
}

/**
 * Translates and breaks down a dense technical single-line window prompt into clear, human-understandable German.
 */
export function translateWindowPromptToGerman(win: SingleLineWindow): GermanPromptBreakdown {
  const p = win.singleLinePrompt || '';

  // Extract Action description
  let handlung = win.summary || 'Szene wird aufgebaut und abgebildet.';
  if (win.title && !win.title.startsWith('Window')) {
    handlung = `${win.title}: ${handlung}`;
  }

  // Extract dialogue
  let dialogueGerman = win.dialogueSnippet;
  if (!dialogueGerman && p.includes('<d[')) {
    const dMatch = p.match(/<d\[([^\]]+)\]\[([^\]]+)\]>\s*([^<]+)\s*<\/d>/i);
    if (dMatch) {
      dialogueGerman = `${dMatch[1]} spricht auf ${dMatch[2]}: „${dMatch[3].trim()}“`;
    }
  }

  // Camera movement
  const kamera = win.cameraMove || 'Flüssige, professionelle Kamerabewegung auf Augenhöhe mit Kino-Schärfentiefe';

  // Active references
  const refs = win.activeReferences && win.activeReferences.length > 0
    ? win.activeReferences
    : win.activeSubjects || [];

  // Macro closeups
  const closeups = win.extremeCloseups && win.extremeCloseups.length > 0
    ? win.extremeCloseups.map(c => c.replace(/^EXTREME CLOSE-UP, 100mm macro, T1.8\s*–?\s*/i, 'Extreme Nahaufnahme (100mm Makro): '))
    : ['Detailaufnahme von Material und Haptik'];

  // Music & Sound
  const musikUndSound = win.musicAudio || 'Warme Akustik-Atmosphäre ohne störende Nebengeräusche';

  // CTA
  const callToActionGerman = win.claimOrCta;

  return {
    titel: `Window ${win.windowNumber}`,
    zeitspanne: `Sekunde ${win.timecodeStart} bis ${win.timecodeEnd} (${win.durationSeconds} Sek. Gesamtdauer)`,
    szenenHandlung: handlung,
    kamerafuehrung: kamera,
    aktiveReferenzen: refs,
    dialogueGerman,
    closeupsGerman: closeups,
    musikUndSound,
    callToActionGerman,
    hinweis: 'Dieser Prompt ist technisch im Single-Line Format (0 Zeilenumbrüche) für MiniMax H3 / Maestro optimiert.',
  };
}

