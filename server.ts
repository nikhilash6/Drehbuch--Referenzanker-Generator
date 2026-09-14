import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fsPromises from 'fs/promises';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// 1. Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 2. LM Studio / Local API Proxy (to bypass browser CORS & mixed-content)
app.post('/api/lmstudio/proxy', async (req: Request, res: Response) => {
  try {
    const { endpoint = 'http://localhost:1234/v1', path: apiPath = '/chat/completions', payload, apiKey } = req.body;
    
    // Normalize target URL
    const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const targetUrl = `${baseUrl}${apiPath.startsWith('/') ? apiPath : '/' + apiPath}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Set a reasonable timeout so it doesn't hang indefinitely if LM Studio isn't running locally
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({
        error: `LM Studio request failed (${response.status}): ${errorText}`,
        targetUrl,
      });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    const isAbort = err.name === 'AbortError';
    res.status(502).json({
      error: isAbort
        ? 'Zeitüberschreitung: LM Studio antwortete nicht innerhalb von 20 Sekunden.'
        : `Verbindung zu LM Studio fehlgeschlagen: ${err.message}. Stelle sicher, dass LM Studio gestartet ist und der Server auf dem angegebenen Port lauscht.`,
    });
  }
});

// Test connection to LM Studio
app.post('/api/lmstudio/test', async (req: Request, res: Response) => {
  try {
    const { endpoint = 'http://localhost:1234/v1', apiKey } = req.body;
    const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const targetUrl = `${baseUrl}/models`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      res.status(response.status).json({
        connected: false,
        message: `HTTP ${response.status}: ${await response.text()}`,
      });
      return;
    }

    const data = await response.json();
    res.json({
      connected: true,
      models: data.data || [],
      message: 'Erfolgreich mit LM Studio verbunden!',
    });
  } catch (err: any) {
    res.status(200).json({
      connected: false,
      message: `Keine Verbindung zu ${req.body?.endpoint || 'LM Studio'}: ${err.message}`,
    });
  }
});

// 3. Analyze reference images using Gemini Omni model (gemini-3.8-flash)
// 3a. Single reference analysis task (fired per reference)
app.post('/api/analyze-single-reference', async (req: Request, res: Response) => {
  try {
    const { image, prompt } = req.body;

    if (!image || !image.dataUrl) {
      res.status(400).json({ error: 'Referenzbild erforderlich.' });
      return;
    }

    const ai = getGemini();

    let mimeType = image.mimeType || 'image/jpeg';
    let base64Data = image.dataUrl;

    if (image.dataUrl.includes(';base64,')) {
      const parts = image.dataUrl.split(';base64,');
      mimeType = parts[0].replace('data:', '') || mimeType;
      base64Data = parts[1];
    } else if (image.dataUrl.startsWith('data:image/svg+xml')) {
      const svgContent = decodeURIComponent(image.dataUrl.split(',')[1]);
      base64Data = Buffer.from(svgContent, 'utf-8').toString('base64');
      mimeType = 'image/svg+xml';
    }

    const contents = [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text: `[Referenzbild: Name/Titel = "${image.name || 'Referenz'}", Typ = "${image.category || 'person'}"]`,
      },
      {
        text: prompt || 'Analysiere dieses Referenzbild und extrahiere alle visuellen Identitätsanker für Video-Generatoren.',
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        temperature: 0.15,
        systemInstruction: `Du bist ein hochpräziser visueller Referenz- und Drehbuch-Analyst für KI-Videoproduktionen (MiniMax Hailuo H3, Maestro).
Deine Aufgabe ist die exakte Extraktion von visuellen Identitätsankern (Personen, multi-subjekte wie Person mit Hunden, Requisiten/Gegenstände, Fahrzeuge, Räume).
Vermeide Spekulationen oder Halluzinationen. Halte dich strikt an die vorgegebenen Merkmale und erstelle am Ende immer einen kompakten englischen MiniMax H3 Prompt-Anker.`,
      },
    });

    res.json({
      success: true,
      analysis: response.text || '',
      modelUsed: 'gemini-3.8-flash',
    });
  } catch (err: any) {
    console.error('Single reference analysis error:', err);
    res.status(500).json({
      error: `Analysefehler: ${err.message}`,
    });
  }
});

app.post('/api/analyze-references', async (req: Request, res: Response) => {
  try {
    const { images, customPrompt } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      res.status(400).json({ error: 'Mindestens ein Referenzbild erforderlich.' });
      return;
    }

    const ai = getGemini();

    // Prepare contents: array of inlineData objects + text prompt
    const contents: any[] = [];

    images.forEach((img: { dataUrl: string; name: string; mimeType?: string }, index: number) => {
      // extract base64 data and mimeType
      let mimeType = img.mimeType || 'image/jpeg';
      let base64Data = img.dataUrl;

      if (img.dataUrl.includes(';base64,')) {
        const parts = img.dataUrl.split(';base64,');
        mimeType = parts[0].replace('data:', '') || mimeType;
        base64Data = parts[1];
      } else if (img.dataUrl.startsWith('data:image/svg+xml')) {
        // convert SVG data url to base64
        const svgContent = decodeURIComponent(img.dataUrl.split(',')[1]);
        base64Data = Buffer.from(svgContent, 'utf-8').toString('base64');
        mimeType = 'image/svg+xml';
      }

      contents.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
      contents.push({
        text: `[Referenzbild ${index + 1}: Name = "${img.name}"]`,
      });
    });

    const userPrompt = customPrompt || `Analysiere die übergebenen Referenzbilder hochpräzise.
Für jede Referenz (Person, Gebäude/Haus, Objekt/Gegenstand, Grundriss oder Tier) extrahiere die exakten Identitäts- und Konsistenzmerkmale auf Deutsch:

Wenn PERSON:
- Gesichtsform, Augenfarbe, Augenform, Augenbrauen, Nase, Mund, Kinn/Kiefer
- Hautfarbe/Teint, Haarfarbe, Haarlänge, Haarstruktur, Pony
- Besondere Merkmale (Brille, Muttermale, Schmucklosigkeit, Prothesen, Bärte, etc.)
- Alter ca., Statur/Körperbau, Kleidung

Wenn GEBÄUDE / ARCHITEKTUR / OBJEKT:
- Baukörper/Form, Fassadenmaterialien (Putz, Holzlamellen, Klinker, Schiefer)
- Verglasung & Fensterrahmen (bodentief, Rahmenfarben, Glasreflexion)
- Dachform, Photovoltaik, Terrassenbelag, architektonische Besonderheiten

Gib die Antwort für jedes Referenzbild in einer klar getrennten Liste aus (z.B. Referenzbild 1 = [Name], Referenzbild 2 = [Name] etc.). Keine Vermischung. Nur das, was im Bild sichtbar ist.

Ergänze am Ende jeder Liste einen kompakten "PROMPT-ANKER" (1-2 präzise englische Sätze), der für Video-Generatoren wie MiniMax H3 / Maestro / Hailuo als visueller Konsistenz-Anker in jede Szenenbeschreibung eingefügt werden kann.`;

    contents.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        temperature: 0.15, // High precision, factual anchor extraction
        systemInstruction: `Du bist ein hochpräziser visueller Referenz- und Drehbuch-Analyst für KI-Videoproduktionen (MiniMax Hailuo H3, Maestro).
Deine Aufgabe ist die exakte Extraktion von visuellen Identitätsankern aus Referenzbildern.
Vermeide Spekulationen oder Halluzinationen. Halte dich strikt an die vorgegebenen Kategorien und Merkmale.
Strukturiere die Antwort klar nach Personen und gib für jede Person einen komprimierten englischen Video-Konsistenzanker aus.`,
      },
    });

    const rawText = response.text || '';

    res.json({
      success: true,
      analysis: rawText,
      modelUsed: 'gemini-3.8-flash',
    });
  } catch (err: any) {
    console.error('Reference analysis error:', err);
    res.status(500).json({
      error: `Analysefehler: ${err.message}`,
    });
  }
});

// 4. Generate Drehbuch and Shot-by-Shot Prompts via local LM Studio
app.post('/api/generate-screenplay', async (req: Request, res: Response) => {
  try {
    const {
      endpoint = 'http://localhost:1234/v1',
      modelName = 'local-model',
      apiKey,
      title,
      sceneGoal,
      genre,
      settingLocation,
      targetEngine = 'minimax-h3',
      cameraStyle,
      lightingMood,
      aspectRatio = '16:9',
      characterAnchors = [],
      shotCount = 4,
      windows = [],
    } = req.body;

    const anchorContext = characterAnchors
      .map((c: any) => `CHARAKTER / ENTITÄT "${c.name}":\n${c.compactPromptAnchor || JSON.stringify(c)}`)
      .join('\n\n');

    const windowsContext =
      Array.isArray(windows) && windows.length > 0
        ? `\n\nVERPFLICHTENDE SZENENFENSTER-VORGABEN (DREHBUCHKONFIGURATOR - ${windows.length} WINDOWS):
${windows
  .map(
    (w: any) => `WINDOW #${w.windowNumber}:
- Titel & Fokus: ${w.title || `Window ${w.windowNumber}`} (${w.visualFocus || 'Architektur & Szene'})
- Drohnenflug & Cam: ${w.cameraMovement || 'Gleitede Kamera'}
- Wetter & Licht: ${w.weather || 'Tageslicht'}
- Hintergrund & Setting: ${w.background || 'Passende Umgebung'}
- Hintergrundmusik: ${w.musicStyle || 'Ambient'}
- Sounddesign / SFX: ${w.soundDesign || 'Atmos'}
- On-Screen Claim: "${w.claim || 'Kein Claim'}"
- Dauer: ${w.durationSeconds || 5}s`
  )
  .join('\n\n')}

HINWEIS FÜR WINDOWS: Jeder Shot entspricht exakt einem der oben definierten Windows und muss die Kameraführung (z.B. Drohnenflug), den Claim und das Sounddesign verbindlich in den minimaxPrompt und die Shot-Metadaten einbetten!`
        : '';

    const effectiveShotCount = Array.isArray(windows) && windows.length > 0 ? windows.length : shotCount;

    const prompt = `Erstelle ein professionelles, produktionsreifes Drehbuch und eine präzise Shot-Liste optimiert für den KI-Video-Generator "${targetEngine.toUpperCase()}" und Maestro.

TITEL: ${title || 'Unbenanntes Projekt'}
GENRE: ${genre || 'Cinematic Drama'}
SZENE / PLOT-ZIEL: ${sceneGoal || 'Szene mit konsistenten Charakteren und visuellen Ankern.'}
ORT & SETTING: ${settingLocation || 'Atmosphärisches Set'}
KAMERASTIL: ${cameraStyle || 'Cinematic 35mm, Shallow DOF, Slow Dolly Movement'}
LICHT & STIMMUNG: ${lightingMood || 'Warmes Chiaroscuro, dezentes Kantenlicht'}
BILDVERHÄLTNIS: ${aspectRatio}
SHOT-ANZAHL: ${effectiveShotCount}
${windowsContext}

VERPFLICHTENDE CHARAKTER- & ENTITÄTS-ANKER (Aus den Referenzen):
${anchorContext || 'Konsistente visuelle Identitätsanker beachten.'}

WICHTIGE ANFORDERUNGEN FÜR MINIMAX H3 & MAESTRO:
1. In JEDEM Shot müssen die visuellen Ankerbegriffe exakt vorkommen, damit die Identität über alle Schnitte hinweg konsistent bleibt ("Referenzen verlangen Anker").
2. Falls Windows definiert sind, binde den jeweiligen Claim, die Drohnen- oder Kamerabewegung und die Soundvorgaben direkt ein.
3. Jeder Shot benötigt:
   - shotNumber & durationSeconds (4s - 6s)
   - shotType (z.B. Medium Close-up, Drone Top-Down, Wide Establishing)
   - cameraMove (z.B. Orbit 360°, Slow dolly in, gentle tracking)
   - sceneDescription (Handlung, Architektur, Interaktion)
   - charactersInShot (Array von Namen oder Motiven)
   - injectedAnchors (die injizierten Anker-Texte)
   - dialogue & audioCues (inkl. On-Screen Claim & Musik)
   - minimaxPrompt (Präziser englischer Prompt für MiniMax H3 / Maestro inklusive Kamerabefehl, Ankern und Claim-Overlay)

Antworte AUSSCHLIESSLICH im gültigen JSON-Format (kein vorangestellter oder nachgestellter Freitext):
{
  "title": "...",
  "logline": "...",
  "screenplayHeader": "...",
  "fullScriptMarkdown": "...",
  "shots": [
    {
      "shotNumber": 1,
      "durationSeconds": 5,
      "shotType": "...",
      "cameraMove": "...",
      "sceneDescription": "...",
      "charactersInShot": ["..."],
      "injectedAnchors": "...",
      "dialogue": "...",
      "audioCues": "...",
      "minimaxPrompt": "..."
    }
  ]
}`;

    const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const targetUrl = `${baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for local LLM generation

    const lmResponse = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein erfahrener Regisseur, Drehbuchautor und Prompt-Engineer spezialisiert auf MiniMax Hailuo H3, Maestro und Runway. Du antwortest AUSSCHLIESSLICH mit syntaktisch korrektem JSON ohne Markdown-Code-Blöcke.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!lmResponse.ok) {
      const errText = await lmResponse.text();
      res.status(lmResponse.status).json({
        error: `LM Studio Fehler (${lmResponse.status}): ${errText}`,
      });
      return;
    }

    const lmData = await lmResponse.json();
    let rawContent = lmData.choices?.[0]?.message?.content || '{}';

    // Clean markdown code blocks if the model outputs ```json ... ```
    rawContent = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

    try {
      const parsed = JSON.parse(rawContent);
      res.json(parsed);
    } catch (parseErr: any) {
      // If parsing fails, create a graceful fallback structure with rawContent
      res.json({
        title: title || 'Drehbuch-Projekt (LM Studio)',
        logline: 'Lokale Generierung über LM Studio',
        screenplayHeader: `EXT. ${settingLocation?.toUpperCase() || 'SZENE'} - TAG`,
        fullScriptMarkdown: rawContent,
        shots: [
          {
            shotNumber: 1,
            durationSeconds: 5,
            shotType: 'Medium Shot',
            cameraMove: cameraStyle || 'Cinematic Dolly In',
            sceneDescription: sceneGoal || 'Szene mit verankerten Charakteren.',
            charactersInShot: characterAnchors.map((c: any) => c.name),
            injectedAnchors: anchorContext,
            dialogue: '',
            audioCues: 'Atmosphärischer Ton',
            minimaxPrompt: `${sceneGoal}, ${anchorContext}, ${cameraStyle}, cinematic lighting, photorealistic, 4k`,
          },
        ],
      });
    }
  } catch (err: any) {
    const isAbort = err.name === 'AbortError';
    console.error('Screenplay generation error:', err);
    res.status(502).json({
      error: isAbort
        ? 'Zeitüberschreitung: LM Studio antwortete nicht innerhalb von 60 Sekunden.'
        : `Verbindung zu LM Studio fehlgeschlagen: ${err.message}. Stelle sicher, dass LM Studio gestartet ist und das Modell geladen ist.`,
    });
  }
});

// Generate 3 layperson-friendly concept proposals from bullet points/presets via LM Studio
app.post('/api/screenplay/generate-proposals', async (req: Request, res: Response) => {
  try {
    const {
      endpoint = 'http://localhost:1234/v1',
      modelName = 'local-model',
      apiKey,
      stichpunkte = '',
      windowCount = 4,
      windowDurationSeconds = 14,
      dialogueLanguage = 'German',
      subjects = [],
      references = [],
      targetAudience,
      finalCallToAction = 'Jetzt Musterhaus besichtigen & Ihr Traumhaus planen',
      globalWeather = 'Sonnig & klarer blauer Himmel',
      globalBackground = 'Neubausiedlung / Grüne Wohnsiedlung',
      globalCam = 'Drohnenflug Orbit 360°',
      genre = 'Architektur & Lifestyle (Immobilien)',
    } = req.body;

    // Use references array if provided, or fallback to subjects
    const refList = (references && references.length > 0) ? references : subjects;

    // Build structured reference descriptions by category
    const refDescriptions = refList.map((r: any) => {
      const cat = r.category || 'human';
      const tag = r.tag || (cat === 'building' ? `<Building ${r.referenceIndex || 1}>` : cat === 'object' ? `<Object ${r.referenceIndex || 1}>` : `<Subject ${r.referenceIndex || r.subjectIndex || 1}>`);
      const action = r.roleOrAction || r.role || 'Protagonist';
      const rel = r.relationship ? ` | Beziehung/Kontext: ${r.relationship}` : '';
      const details = [
        r.build ? `Bau/Statur: ${r.build}` : null,
        r.hairOrMaterial ? `Material/Haare: ${r.hairOrMaterial}` : null,
        r.eyesOrGlazing ? `Verglasung/Augen: ${r.eyesOrGlazing}` : null,
        r.clothingOrFinish ? `Oberfläche/Kleidung: ${r.clothingOrFinish}` : null,
        r.distinguishingMarks ? `Besonderheiten: ${r.distinguishingMarks}` : null,
      ].filter(Boolean).join(', ');

      return `• [Kategorie: ${cat.toUpperCase()}] ${tag} "${r.name}": ${action}${rel}${details ? ` (Details: ${details})` : ''}`;
    }).join('\n');

    // Target audience directive
    let audienceDirective = '';
    if (targetAudience) {
      const coreValuesStr = Array.isArray(targetAudience.coreValues)
        ? targetAudience.coreValues.join(', ')
        : (targetAudience.coreValues || '');
      const badgeStr = targetAudience.badge || targetAudience.subtitle || targetAudience.ageGroup || '';
      const archFocusStr = targetAudience.architecturalFocus || targetAudience.architectureFocus || '';

      audienceDirective = `
ZIELGRUPPEN-AUSRICHTUNG (HÖCHSTE PRIORITÄT FÜR DAS GESAMTKONZEPT):
Zielgruppe: "${targetAudience.name}" (${badgeStr})
- Altersgruppe: ${targetAudience.ageGroup || 'ab 30 Jahre'}
- Psychologie & Erwartungen: ${targetAudience.psychology}
- Farbspektrum & Licht: ${targetAudience.colorSpectrum} (muss in allen Szenenbildern spürbar sein!)
- Sounddesign & Musikästhetik: ${targetAudience.soundAesthetic} (akustischer roter Faden!)
- Kernwerte der Zielgruppe: ${coreValuesStr}
- Empfohlener Architektur-Fokus: ${archFocusStr}
- Tonalität Call-to-Action: ${targetAudience.callToActionStyle}
-> ACHTUNG: Die Zielgruppe definiert nicht nur die Darsteller, sondern das KOMPLETTE Video inklusive Bildsprache, Beleuchtung, Farbspektrum, Musik/Sound und Claims!
`;
    }

    // Logo & Watermark directive
    const hasLogoRef = refList.some((r: any) => r.category === 'logo');
    let logoDirective = '';
    if (hasLogoRef) {
      logoDirective = `
LOGO & WASSERZEICHEN-REGEL (VERBINDLICH):
In den Referenzen ist ein Logo / Brand-Mark hinterlegt. Das Logo muss in ALLEN Video-Windows IMMER rechts unten, dezent und transparent (20-30% Deckkraft) als CI-Wasserzeichen platziert sein ([Watermark: Discreet, semi-transparent brand logo permanently anchored in bottom-right corner]). Niemals bildfüllend, mittig oder links!
`;
    }

    const systemPrompt = `Du bist ein hochdotierter internationaler Regisseur und Prompt-Ingenieur für High-End Videos auf Video-KIs (MiniMax H3 / Maestro 2.1.6). Du bist extrem flexibel bezüglich Genres und Themen (z.B. Comedy, Horror, Erotik, Drama, Reise, Kunst, Lifestyle oder Architektur) und passt die Handlung, die Atmosphäre, die Tonalität und alle Beschreibungen exakt an die Vorgaben des Nutzers an.
Deine Aufgabe: Entwickle genau 1 KREATIVES, HOCHWERTIGES DREHBUCH-KONZEPT für ein Video bestehend aus ${windowCount} Szenenfenstern (Windows) mit je ${windowDurationSeconds} Sekunden Dauer.

CRITICAL HARD CONSTRAINT (STRIKTES ENGLISCH-GEBOT FÜR MINIMAX H3 PROMPTS):
MiniMax H3 und Maestro benötigen zwingend 100% ENGLISCHE PROMPTS für Bild-, Kamera- und Handlungsanweisungen, um Verformungen, Geplappere und Klon-Fehler zu verhindern!
Daher gilt folgende eiserne Regel:
- "actionDescription": MUST BE 100% IN HIGH-END CINEMATIC ENGLISH. Binde zwingend die Referenz-Tags (<Subject 1>, <Building 1>, <Object 1>, etc.) ein! Passe die Action exakt an das Thema des Nutzers an (z.B. bei Comedy: "Close up of <Subject 1> looking around nervously and humorously picking his nose..." oder bei Architektur: "Smooth Steadicam glide following <Subject 1> entering the open foyer...").
- "cameraMovement": MUST BE 100% IN HIGH-END CINEMATIC ENGLISH (e.g. "360-degree orbital drone shot descending smoothly to eye-level", "Slow reverse dolly and ascending crane rise into the golden evening twilight", or for everyday scenes "Handheld camera slightly shaking, natural eye-level close-up panning slowly")
- "focus": MUST BE 100% IN HIGH-END CINEMATIC ENGLISH (e.g. "Facial expressions of <Subject 1>, specific humorous hand movements, or architectural details like natural oiled oak timber")
- "dialogueSpeaker": Name des Sprechers (z.B. "Bauherrin")
- "dialogueSnippet": Gesprochener Dialog-Satz in der vorgegebenen Zielsprache "${dialogueLanguage}"
- "claimOrCta": Claim / Call-to-Action (z.B. "${finalCallToAction}")
- "soundDesign": MUST BE 100% IN HIGH-END CINEMATIC ENGLISH (e.g. "Foley sound of quiet sniffling, birds chirping, soft footsteps, or wind through leaves")
- "musicStyle": MUST BE 100% IN HIGH-END CINEMATIC ENGLISH (e.g. "Soft cinematic warm piano keys, suspenseful horror soundscapes, light-hearted comedic acoustic guitar, or upbeat electronic beats")
- "title", "tagline", "descriptionForLayperson", "dramaturgyHighlights", "toneAndStyle": Können auf Deutsch für die verständliche Präsentation in der UI formuliert sein.

WICHTIGE ANFORDERUNGEN:
1. Bereite das Konzept so auf, dass ein LAIE sofort versteht, worum es geht und wie die Stimmung ist!
2. Jedes Konzept benötigt:
   - title: Griffiger Titel
   - tagline: Einprägsame Unterzeile
   - descriptionForLayperson: 2-3 Sätze in einfacher Sprache
   - dramaturgyHighlights: Genau ${windowCount} kurze Aufzählungspunkte (je 1 pro Window)
   - toneAndStyle: z.B. "Warm, emotional, inviting" oder "Modern, dynamic, technology-focused"
   - dialogueLanguage: "${dialogueLanguage}"
   - callToAction: Konkreter Aufruf zum Handeln am Ende (z.B. "${finalCallToAction}")
   - windowBreakdown: Array von genau ${windowCount} Windows mit:
     - windowNumber (1 bis ${windowCount})
     - title: Verständlicher Titel für das Window
     - actionDescription: EXCLUSIVELY IN HIGH-END CINEMATIC ENGLISH with reference tags
     - cameraMovement: EXCLUSIVELY IN HIGH-END CINEMATIC ENGLISH
     - dialogueSpeaker: Name des Sprechers
     - dialogueSnippet: Gesprochener Dialog in "${dialogueLanguage}"
     - focus: EXCLUSIVELY IN HIGH-END CINEMATIC ENGLISH
     - soundDesign: EXCLUSIVELY IN HIGH-END CINEMATIC ENGLISH
     - musicStyle: EXCLUSIVELY IN HIGH-END CINEMATIC ENGLISH
     - claimOrCta: Call-to-Action Text

${audienceDirective}
${logoDirective}

VERPFLICHTENDE REFERENZEN (Objekte, Gebäude, Personen, Tiere):
Die folgenden Referenzen sind Gegenstand des kreativen Gesamtkonzepts. Definiere genau, WER WAS MACHT und WER MIT WEM WIE ZUSAMMEN GEHÖRT:
${refDescriptions || '• <Subject 1> "Protagonist": Agiert aktiv im Video gemäß den Stichpunkten'}

USER-STICHPUNKTE & VORGABEN:
${stichpunkte || 'Eine kreative, fesselnde Szene nach Vorgabe des Regisseurs'}
Genre: ${genre} | Wetter: ${globalWeather} | Setting: ${globalBackground} | Bevorzugte Kamera: ${globalCam}

Antworte AUSSCHLIESSLICH im validen JSON-Format:
{
  "proposals": [
    {
      "id": "prop-1",
      "title": "...",
      "tagline": "...",
      "descriptionForLayperson": "...",
      "dramaturgyHighlights": ["Window 1: ...", "Window 2: ...", "Window 3: ...", "Window 4: ..."],
      "toneAndStyle": "...",
      "dialogueLanguage": "${dialogueLanguage}",
      "callToAction": "${finalCallToAction}",
      "windowBreakdown": [
        {
          "windowNumber": 1,
          "title": "...",
          "actionDescription": "Cinematic English action with tags...",
          "cameraMovement": "Cinematic English camera move...",
          "dialogueSpeaker": "...",
          "dialogueSnippet": "...",
          "focus": "Cinematic English focus...",
          "soundDesign": "Cinematic English sound design...",
          "musicStyle": "Cinematic English music style...",
          "claimOrCta": "..."
        }
      ]
    }
  ]
}`;

    const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const targetUrl = `${baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 240000); // 240s timeout (much safer for slow local models)

    let rawOutput = '';
    let fetchErrorMsg = '';
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'Du bist ein Prompt-Ingenieur für MiniMax H3. Du antwortest ausschließlich im validen JSON-Format und formulierst alle Video-Prompts (actionDescription, cameraMovement, focus) zwingend auf Englisch.' },
            { role: 'user', content: systemPrompt },
          ],
          temperature: 0.35,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (response.ok) {
        const data = await response.json();
        rawOutput = data.choices?.[0]?.message?.content || '';
      } else {
        const errText = await response.text().catch(() => '');
        fetchErrorMsg = `LM Studio hat mit Status ${response.status} geantwortet: ${errText || response.statusText}`;
      }
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        fetchErrorMsg = 'Zeitüberschreitung (Timeout): LM Studio antwortete nicht innerhalb von 240 Sekunden. Eventuell läuft die Generierung auf Ihrem System zu langsam oder blockiert.';
      } else {
        fetchErrorMsg = `Verbindung zu LM Studio fehlgeschlagen: ${fetchErr.message || fetchErr}. Bitte stelle sicher, dass LM Studio gestartet, der Server aktiv und das Modell geladen ist.`;
      }
    }

    // Try parsing LM Studio output
    if (rawOutput) {
      const cleaned = rawOutput.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.proposals && Array.isArray(parsed.proposals) && parsed.proposals.length > 0) {
          // Exclusively return exactly 1 proposal to the frontend
          const singleProposal = parsed.proposals.slice(0, 1);
          res.json({ success: true, proposals: singleProposal, source: 'lmstudio' });
          return;
        } else {
          res.status(500).json({
            success: false,
            error: 'Die Antwort von LM Studio enthielt kein gülitges "proposals"-Array.'
          });
          return;
        }
      } catch (pErr: any) {
        res.status(500).json({
          success: false,
          error: `JSON-Parsing-Fehler der LM Studio-Antwort: ${pErr.message}. Die Ausgabe des Modells entsprach nicht dem geforderten Format.`,
          rawOutput: rawOutput.slice(0, 500)
        });
        return;
      }
    }

    // If fetch failed or we got no output, throw real error instead of silent fallbacks!
    if (fetchErrorMsg) {
      res.status(500).json({
        success: false,
        error: fetchErrorMsg
      });
      return;
    }

    // Determine first and second human names dynamically
    const humanRefs = refList.filter((r: any) => r.category === 'human');
    const firstHuman = humanRefs[0]?.name || 'Bauherrin';
    const secondHuman = humanRefs[1]?.name || 'Partner';
    const buildingRef = refList.find((r: any) => r.category === 'building')?.name || 'Musterhaus';
    const objectRef = refList.find((r: any) => r.category === 'object')?.name || 'Schlüssel & Exposé';

    // Parse user's own windows if they supplied bullet points
    const lines = stichpunkte.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const parsedWindowsDe: string[] = [];
    let customCta = finalCallToAction;

    // Detect if lines contain explicit Window/Fenster markings
    for (const line of lines) {
      const winMatch = line.match(/(?:fenster|window|szene)\s*(\d+)\s*[:\-]\s*(.*)/i);
      if (winMatch) {
        const num = parseInt(winMatch[1]);
        if (num >= 1 && num <= windowCount) {
          parsedWindowsDe[num - 1] = winMatch[2].trim();
        }
      }
      const ctaMatch = line.match(/(?:call to action|cta|claim)\s*[:\-]\s*["'„]*(.*?)["'“]*/i);
      if (ctaMatch) {
        customCta = ctaMatch[1].trim();
      }
    }

    // If no explicit window structure, try collecting bullet points
    if (parsedWindowsDe.filter(Boolean).length === 0) {
      const bullets = lines
        .filter((l: string) => l.startsWith('-') || l.startsWith('•') || /^\d+[\.\:]/.test(l))
        .map((l: string) => l.replace(/^[-•\d.\:\s]+/, '').trim())
        .filter((l: string) => l.length > 8);
      for (let i = 0; i < windowCount; i++) {
        if (bullets[i]) {
          parsedWindowsDe[i] = bullets[i];
        }
      }
    }

    // Determine the main theme of the stichpunkte
    const lowerStich = stichpunkte.toLowerCase();
    let themeKey = 'architecture'; // default

    if (lowerStich.includes('resilienz') || lowerStich.includes('coaching') || lowerStich.includes('berater') || lowerStich.includes('therapie') || lowerStich.includes('mental') || lowerStich.includes('wald') || lowerStich.includes('geist') || lowerStich.includes('psycholog')) {
      themeKey = 'coaching';
    } else if (lowerStich.includes('horror') || lowerStich.includes('grusel') || lowerStich.includes('unheimlich') || lowerStich.includes('angst') || lowerStich.includes('thriller') || lowerStich.includes('schatten')) {
      themeKey = 'horror';
    } else if (lowerStich.includes('reise') || lowerStich.includes('urlaub') || lowerStich.includes('travel') || lowerStich.includes('abenteuer') || lowerStich.includes('strand') || lowerStich.includes('natur')) {
      themeKey = 'travel';
    } else if (lowerStich.includes('erotik') || lowerStich.includes('intim') || lowerStich.includes('sex') || lowerStich.includes('bett') || lowerStich.includes('körper')) {
      themeKey = 'sensual';
    }

    // Simple word translation helper to generate cinematic English prompts from German input
    const translateToEnFallback = (deText: string, defaultEn: string): string => {
      if (!deText) return defaultEn;
      let en = deText;
      const replacements = [
        [/\bDrohnenaufnahme\b/gi, 'drone orbit shot'],
        [/\bDrohnenflug\b/gi, 'drone flight'],
        [/\bNahaufnahme\b/gi, 'close-up shot'],
        [/\bMorgennebel\b/gi, 'morning mist'],
        [/\bBergwald\b/gi, 'mountain pine forest'],
        [/\bPraxis\b/gi, 'office'],
        [/\bBeratungsraum\b/gi, 'counseling room'],
        [/\bKlient\b/gi, 'client'],
        [/\bBeraterin\b/gi, 'counselor'],
        [/\bHund\b/gi, 'dog'],
        [/\bHunden\b/gi, 'dogs'],
        [/\bWaldweg\b/gi, 'forest path'],
        [/\bTee\b/gi, 'tea'],
        [/\bTür\b/gi, 'door'],
        [/\blächelnd\b/gi, 'smilingly'],
        [/\bentspannt\b/gi, 'relaxed'],
      ];
      for (const [reg, rep] of replacements) {
        en = en.replace(reg, rep as string);
      }
      return en;
    };

    // Theme configurations mapping
    const themes: Record<string, {
      p1Title: string;
      p1Tagline: string;
      p1Desc: string;
      p2Title: string;
      p2Tagline: string;
      p2Desc: string;
      p3Title: string;
      p3Tagline: string;
      p3Desc: string;
      p1Tone: string;
      p2Tone: string;
      p3Tone: string;
      defaultDeWindows: string[];
      defaultEnActions: string[];
      defaultFocus: string[];
      defaultDialoguesDe: string[];
      defaultDialoguesEn: string[];
    }> = {
      coaching: {
        p1Title: 'Die Entdeckung: Innere Ruhe & Resilienz',
        p1Tagline: 'Eine Reise zur inneren Stärke und Achtsamkeit',
        p1Desc: `Ein einfühlsamer Werbespot über Entschleunigung und Kraft, maßgeschneidert für ${targetAudience ? targetAudience.name : 'Achtsamkeits-Suchende'}. Die Protagonisten finden in der Natur und im geschützten Raum neue Balance.`,
        p2Title: 'Klarheit im Fokus: Die Kraft der Reflexion',
        p2Tagline: 'Schritt für Schritt zurück zur persönlichen Balance',
        p2Desc: `Ein moderner Coaching-Spot, der den Weg von Alltagshektik zu gelassener Souveränität zeigt. Ein klarer roter Faden führt den Zuschauer direkt ins beratende Gespräch.`,
        p3Title: 'Die Cineastische Atempause: Zeit für mich',
        p3Tagline: 'Minimalistischer Kunstfilm-Ansatz für mentale Stärke',
        p3Desc: `Für anspruchsvolle Menschen, die sich nach Entlastung und Geborgenheit sehnen. Ruhige Einstellungen und eine berührende Botschaft über Achtsamkeit.`,
        p1Tone: 'Calm, meditative, warm, reassuring cinematic atmosphere',
        p2Tone: 'Empowering, clear, warm, high-end professional aesthetic',
        p3Tone: 'Poetic, slow, sensory, deeply calming and aesthetic',
        defaultDeWindows: [
          'Ankunft in der Natur & tiefes Durchatmen im nebligen Bergwald',
          'Naturerfahrung & haptische Details der Umgebung',
          'Übergang in den warmen, sicheren Beratungsraum',
          'Ein Lächeln voller Zuversicht & Ausblick auf neue Wege'
        ],
        defaultEnActions: [
          `The protagonist walks calmly through a serene natural landscape. A smooth camera glide captures the quiet surrounding atmosphere and soft daylight.`,
          `Close-up of hands touching natural textured surfaces or showing a quiet moment of absolute mindfulness.`,
          `Transition into a warm, comfortable room with soft ambient light, steaming tea, and a sense of absolute security.`,
          `The protagonist looks confidently towards the camera with a gentle smile, as a clean typography overlay appears.`
        ],
        defaultFocus: [
          'Misty pine forest, soft natural daylight and calm atmosphere',
          'Tactile natural textures, soft sunbeams and relaxed posture',
          'Steaming cup of tea, warm ambient lighting and safe environment',
          'Smiling confident eyes, soft background and elegant typography'
        ],
        defaultDialoguesDe: [
          'Hier finde ich Zeit. Zeit zum Atmen und Verstehen.',
          'Die Natur gibt mir Kraft. Jeden Tag aufs Neue.',
          'Willkommen an Ihrem Ort für Klarheit und neue Perspektiven.',
          'Es tut gut, diesen Weg gemeinsam zu gehen.'
        ],
        defaultDialoguesEn: [
          'Here I find time. Time to breathe and understand.',
          'Nature gives me strength. Anew every day.',
          'Welcome to your space for clarity and new perspectives.',
          'It feels good to walk this path together.'
        ]
      },
      horror: {
        p1Title: 'Das Echo des Schattens',
        p1Tagline: 'Manche Geheimnisse bleiben besser verborgen',
        p1Desc: `Ein atmosphärischer Horror-Thriller voller unheimlicher Spannung und düsterer Ästhetik. Die Protagonisten spüren, dass an diesem einsamen Schauplatz etwas lauert.`,
        p2Title: 'Hinter verschlossenen Türen',
        p2Tagline: 'Die Angst, die im Dunkeln wartet',
        p2Desc: `Ein intensiver Psychothriller. Schnelle Schnitte, flackerndes Licht und die wachsende Panik der Charaktere, die keinen Ausweg finden.`,
        p3Title: 'Das Flüstern der Nacht',
        p3Tagline: 'Ein cineastischer Albtraum in Schwarz und Weiß',
        p3Desc: `Minimalistisches Grusel-Meisterwerk mit poetischem Schattenwurf und beklemmendem Sounddesign. Nichts für schwache Nerven.`,
        p1Tone: 'Suspenseful, eerie, dark, high-contrast low-key lighting',
        p2Tone: 'Terrifying, rapid, claustrophobic, high-tension cinematic style',
        p3Tone: 'Poetic, slow-burn psychological horror, chilling atmosphere',
        defaultDeWindows: [
          'Der einsame, neblige Schauplatz im dichten Zwielicht',
          'Flackerndes Licht & unheimliche Geräusche im Korridor',
          'Eine plötzliche Bewegung im Augenwinkel & blanke Angst',
          'Ein fluchtartiger Abbruch & das Dunkel bricht herein'
        ],
        defaultEnActions: [
          `A desolate, mist-shrouded environment in deep twilight. Shivering branches casting long, skeletal shadows in the cold wind.`,
          `The protagonist walks down a dim corridor as a single light bulb flickers violently, creating jittery shadow patterns.`,
          `Close-up on terrified, wide-open eyes. A dark, silent silhouette moves swiftly in the soft background reflection.`,
          `A locked door handle shakes violently. A sudden abrupt camera movement fades into complete pitch-black darkness.`
        ],
        defaultFocus: [
          'Thick fog, skeletal tree branches and looming dark shadows',
          'Flickering raw light bulb, peeling textured wallpaper and dark corners',
          'Terrified reflective eyes, cold glass surface and swift shadow silhouette',
          'Violently shaking metal door handle, absolute darkness and text'
        ],
        defaultDialoguesDe: [
          'Hier stimmt etwas nicht. Wir hätten nicht kommen sollen.',
          'Hast du das auch gehört? Es kam von oben.',
          'Da ist jemand... direkt hinter uns!',
          'Schließ die Tür! Schneller!'
        ],
        defaultDialoguesEn: [
          'Something is wrong here. We should not have come.',
          'Did you hear that too? It came from upstairs.',
          'There is someone... right behind us!',
          'Lock the door! Faster!'
        ]
      },
      travel: {
        p1Title: 'Grenzenlose Freiheit: Das Abenteuer',
        p1Tagline: 'Neue Horizonte spüren und das Leben intensiv erfahren',
        p1Desc: `Ein bildgewaltiger, atemberaubender Urlaubs- und Reisefilm. Weite Landschaften, frischer Wind und das pure Lebensgefühl der Freiheit.`,
        p2Title: 'Unterwegs zu mir: Der Roadtrip',
        p2Tagline: 'Der Weg ist das Ziel – Freiheit auf vier Rädern',
        p2Desc: `Ein dynamischer, mitreißender Reise-Spot. Aufbruch, weite Straßen, lachende Gesichter und unvergessliche Momente im Sonnenuntergang.`,
        p3Title: 'Die Poesie des Reisens: Stille & Weite',
        p3Tagline: 'Ein minimalistisches Porträt der schönsten Orte der Erde',
        p3Desc: `Ruhige, epische Panoramaaufnahmen, majestätische Berggipfel, das Rauschen der Wellen und das Gefühl von tiefer Zufriedenheit.`,
        p1Tone: 'Epic, organic, cinematic, inspiring and full of life',
        p2Tone: 'Dynamic, fast-paced, cheerful, warm roadtrip vibe',
        p3Tone: 'Poetic, slow, vast panoramas, deeply soothing and breath-taking',
        defaultDeWindows: [
          'Epischer Drohnenüberflug über spektakuläre Naturlandschaften',
          'Wandern am Hang & der weite Blick über den Horizont',
          'Ein warmes Lagerfeuer unter dem glitzernden Sternenhimmel',
          'Die aufgehende Sonne & die Sehnsucht nach dem nächsten Abenteuer'
        ],
        defaultEnActions: [
          `An awe-inspiring drone flight panning over a breathtaking vast natural landscape in glorious clear daylight.`,
          `The protagonists stand side-by-side, feeling the fresh wind, looking out at the endless beauty of nature.`,
          `Sitting close together around a warm, glowing campfire as golden sparks fly up into the deep blue starry night sky.`,
          `The sun breaks over the horizon in a stunning, bright sunrise, painting the landscape in vibrant orange and gold.`
        ],
        defaultFocus: [
          'Vast natural horizon, crisp mountain peaks or rolling ocean waves',
          'Smiling wind-blown faces, natural elements and organic textures',
          'Crackling fire sparks, warm faces and deep blue starry night sky',
          'Vibrant sunrise, dramatic sky and final Call-to-Action typography'
        ],
        defaultDialoguesDe: [
          'Das ist die Freiheit, nach der wir so lange gesucht haben.',
          'Jeder Schritt hat sich gelohnt. Schau dir diesen Ausblick an.',
          'Diese Abende sind es, die man niemals vergisst.',
          'Lass uns weitergehen. Das nächste Abenteuer wartet schon.'
        ],
        defaultDialoguesEn: [
          'This is the freedom we have been searching for.',
          'Every step was worth it. Look at this incredible view.',
          'These are the evenings you will never forget.',
          'Let us keep moving. The next adventure is already waiting.'
        ]
      },
      sensual: {
        p1Title: 'Haut auf Haut: Das Zusammenspiel der Sinne',
        p1Tagline: 'Ein ästhetischer, hochkarätiger und sinnlicher Kurzfilm',
        p1Desc: `Ein stilvoller, intimer und zutiefst ästhetischer Film über Anziehung und Verlangen. Sanftes Licht, haptische Details und eine intensive Atmosphäre des Begehrens.`,
        p2Title: 'Sinnliche Fragmente',
        p2Tagline: 'Das Spiel von Licht und Schatten auf der Haut',
        p2Desc: `Ein moderner, kunstvoller Spot mit Fokus auf Ästhetik, Silhouette und sanfte Bewegungen im warmen Gegenlicht.`,
        p3Title: 'Die Eleganz des Verlangens',
        p3Tagline: 'Eine poetische Hommage an die Intimität',
        p3Desc: `Ruhige Einstellungen, sanfte Berührungen und das tiefe Gefühl von Vertrautheit und Leidenschaft, frei von Clichés.`,
        p1Tone: 'Sensual, intimate, high-contrast backlight, soft cinematic aesthetics',
        p2Tone: 'Artistic, mysterious, warm silhouettes, high-end macro cinema',
        p3Tone: 'Poetic, slow, elegant, highlighting touch, texture and soft ambient light',
        defaultDeWindows: [
          'Sanfte Berührungen & warmes Licht im gemütlichen Schlafgemach',
          'Der Moment der Hingabe & zärtliche Gesten der Zuneigung',
          'Intensive Nähe & das faszinierende Spiel von Licht und Schatten auf der Haut',
          'Zwei Silhouetten im sanften Nachglühen der Abenddämmerung'
        ],
        defaultEnActions: [
          `Soft golden afternoon light filtering through linen curtains, illuminating a peaceful and warm bed setting.`,
          `Close-up of gentle hands tracing contours with deep, respectful intimacy and beautiful skin textures.`,
          `An elegant and respectful portrayal of physical connection and deep desire, framed by soft shadow patterns.`,
          `Two silhouettes lying close together, breathing softly in the warm twilight as a clean graphic CTA overlay fades in.`
        ],
        defaultFocus: [
          'Warm afternoon sunlight, linen fabrics and gentle shadow patterns',
          'Tactile skin texture, soft shadows and warm highlights',
          'High-contrast light and shadow on elegant, aesthetic curves',
          'Relaxed profiles, warm ambient glow and elegant typography'
        ],
        defaultDialoguesDe: [
          'Ich kann deine Nähe auf meiner Haut spüren.',
          'Nichts anderes zählt in diesem Moment.',
          'Bleib ganz nah bei mir.',
          'Genau so soll es sein.'
        ],
        defaultDialoguesEn: [
          'I can feel your warmth on my skin.',
          'Nothing else matters in this very moment.',
          'Stay close to me.',
          'This is exactly how it should be.'
        ]
      },
      architecture: {
        p1Title: 'Die Entdeckung: Emotionale Ankunft & Raumgefühl',
        p1Tagline: `Vom spektakulären Drohnenflug über ${buildingRef} bis zur Übergabe`,
        p1Desc: `Eine emotionale Ankunft im neuen Zuhause, maßgeschneidert für ${targetAudience ? targetAudience.name : 'anspruchsvolle Bauherren'}. Die Protagonisten (${firstHuman} und ${secondHuman}) erkunden Schritt für Schritt die Architektur und edle Materialien bei ${globalWeather}. Im finalen Window folgt ein klarer Call-to-Action.`,
        p2Title: 'Der Lifestyle-Walkthrough: Dynamik & Präzision',
        p2Tagline: 'Fokus auf moderne Technik, Energieeffizienz und flüssige Raumübergänge',
        p2Desc: `Ein moderner, temporeicher Architektur-Spot mit Fokus auf ${targetAudience ? (Array.isArray(targetAudience.coreValues) ? targetAudience.coreValues.join(', ') : targetAudience.coreValues) : 'Zukunftssicherheit'}. Schnelle, elegante Kamerafahrten zeigen die funktionale Perfektion von ${buildingRef}.`,
        p3Title: 'Die Cineastische Ode: Licht, Ästhetik & Ruhe',
        p3Tagline: 'Minimalistischer Kunstfilm-Ansatz mit intensiver Atmosphäre und Poesie',
        p3Desc: `Für Liebhaber von purer Ästhetik und Werthaltigkeit. Ruhige, epische Einstellungen, poetische Lichtreflexionen auf Glas und Holz, sanfte Windgeräusche und eine berührende Botschaft über Geborgenheit.`,
        p1Tone: targetAudience ? targetAudience.soundAesthetic : 'Warm, emotional, inviting, high-end architectural cinema',
        p2Tone: 'Modern, dynamic, technology-focused, premium architectural quality',
        p3Tone: 'Poetic, calm, meditative, high-end cinematic aesthetic',
        defaultDeWindows: [
          `Ankunft & spektakulärer ${globalCam} über ${buildingRef}`,
          'Eingangsbereich, Foyer & Haptik der Naturmaterialien',
          'Entdeckung des offenen Wohnraums mit Panoramaverglasung',
          `Sonnenuntergang auf der Holzterrasse mit Aufruf: "${finalCallToAction}"`
        ],
        defaultEnActions: [
          `${firstHuman} and ${secondHuman} arrive at the architectural estate of ${buildingRef}. A smooth orbital drone shot reveals the modern facade and lush landscaped grounds in warm sunlight.`,
          `They step through the entrance door, enjoying tactile close-up details of natural materials, warm lighting, and beautiful clean design.`,
          `They explore the open-concept living space, stepping across natural parquet while inspecting the floor-to-alignment glass facade.`,
          `Both stand together on the wooden terrace deck in golden evening twilight. Handover of ${objectRef} with an elegant on-screen graphic Call-to-Action.`
        ],
        defaultFocus: [
          `${buildingRef} architectural facade and master roofline geometry`,
          'Natural materials, clean joint alignments and warm ambient light',
          'Natural wood, panoramic insulated glass and generous spatial depth',
          'Wooden terrace deck, sunset edge lighting and final Call-to-Action'
        ],
        defaultDialoguesDe: [
          'Hier ist es also. Unser neues Zuhause.',
          'Spürst du diese Qualität? Genau so wollten wir es haben.',
          'Dieses Licht... genau so habe ich es mir immer vorgestellt.',
          'Willkommen daheim. Unser schlüsselfertiges Traumhaus ist bereit.'
        ],
        defaultDialoguesEn: [
          'Here it is. Our brand new home.',
          'Can you feel this quality? This is exactly what we wanted.',
          'This beautiful light... exactly as I always imagined it.',
          'Welcome home. Our turn-key dream house is fully ready.'
        ]
      }
    };

    const activeTheme = themes[themeKey];

    const makeWindowBreakdown = (proposalIndex: number) => {
      return Array.from({ length: windowCount }, (_, i) => {
        const customDeContent = parsedWindowsDe[i];
        
        let title = activeTheme.defaultDeWindows[i] || `Szene ${i + 1}`;
        let actionDe = customDeContent || activeTheme.defaultDeWindows[i] || `Beschreibung der Szene ${i + 1}`;
        let actionEn = customDeContent 
          ? translateToEnFallback(customDeContent, activeTheme.defaultEnActions[i]) 
          : activeTheme.defaultEnActions[i];
        
        if (proposalIndex === 2) {
          actionEn = `[Dynamic high-tempo movement] ${actionEn}`;
        } else if (proposalIndex === 3) {
          actionEn = `[Slow aesthetic cinematography] ${actionEn}`;
        }

        const dialogueDe = activeTheme.defaultDialoguesDe[i] || 'Genau so habe ich mir das vorgestellt.';
        const dialogueEn = activeTheme.defaultDialoguesEn[i] || 'Exactly as I envisioned it.';

        return {
          windowNumber: i + 1,
          title: customDeContent ? `Szene ${i + 1}: ${customDeContent.slice(0, 30)}...` : title,
          actionDescription: actionEn,
          cameraMovement: i === 0 
            ? (globalCam || '360-degree orbital drone shot smoothly descending to eye-level') 
            : i === windowCount - 1 
            ? 'Slow reverse dolly and ascending crane rise into the golden evening twilight' 
            : 'Fluid eye-level Steadicam walkthrough along the central action paths',
          dialogueSpeaker: i % 2 === 0 ? firstHuman : secondHuman,
          dialogueSnippet: dialogueLanguage === 'German' ? dialogueDe : dialogueEn,
          focus: activeTheme.defaultFocus[i] || 'Atmospheric natural lighting and expressive spatial details',
          soundDesign: targetAudience ? targetAudience.soundAesthetic : 'Natural environmental ambient sounds with high acoustic fidelity',
          musicStyle: targetAudience ? targetAudience.soundAesthetic : 'Warm cinematic soundtrack matching the emotional tone of the scene',
          claimOrCta: i === windowCount - 1 ? customCta : `Detail-Highlight (Szene ${i + 1})`
        };
      });
    };

    // Graceful intelligent fallback with 3 tailored proposals matching user keywords and target audience
    const fallbackProposals = [
      {
        id: 'prop-fallback-1',
        title: activeTheme.p1Title,
        tagline: activeTheme.p1Tagline,
        descriptionForLayperson: activeTheme.p1Desc,
        dramaturgyHighlights: Array.from({ length: windowCount }, (_, i) => {
          return `Window ${i + 1}: ${parsedWindowsDe[i] ? parsedWindowsDe[i].slice(0, 50) + '...' : activeTheme.defaultDeWindows[i]}`;
        }),
        toneAndStyle: activeTheme.p1Tone,
        dialogueLanguage,
        callToAction: customCta,
        windowBreakdown: makeWindowBreakdown(1),
      },
      {
        id: 'prop-fallback-2',
        title: activeTheme.p2Title,
        tagline: activeTheme.p2Tagline,
        descriptionForLayperson: activeTheme.p2Desc,
        dramaturgyHighlights: Array.from({ length: windowCount }, (_, i) => {
          return `Window ${i + 1}: ${parsedWindowsDe[i] ? parsedWindowsDe[i].slice(0, 50) + '...' : activeTheme.defaultDeWindows[i]}`;
        }),
        toneAndStyle: activeTheme.p2Tone,
        dialogueLanguage,
        callToAction: customCta,
        windowBreakdown: makeWindowBreakdown(2),
      },
      {
        id: 'prop-fallback-3',
        title: activeTheme.p3Title,
        tagline: activeTheme.p3Tagline,
        descriptionForLayperson: activeTheme.p3Desc,
        dramaturgyHighlights: Array.from({ length: windowCount }, (_, i) => {
          return `Window ${i + 1}: ${parsedWindowsDe[i] ? parsedWindowsDe[i].slice(0, 50) + '...' : activeTheme.defaultDeWindows[i]}`;
        }),
        toneAndStyle: activeTheme.p3Tone,
        dialogueLanguage,
        callToAction: customCta,
        windowBreakdown: makeWindowBreakdown(3),
      },
    ];

    res.json({ success: true, proposals: fallbackProposals, source: 'fallback' });
  } catch (err: any) {
    console.error('Error generating proposals:', err);
    res.status(500).json({ error: err.message });
  }
});

// Suggest target audience profile (psychology, colors, sound, architecture, CTA) via LM Studio or fallback
app.post('/api/screenplay/suggest-audience', async (req: Request, res: Response) => {
  try {
    const {
      endpoint = 'http://localhost:1234/v1',
      modelName = 'local-model',
      apiKey,
      name = '',
      hint = '',
    } = req.body;

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'Name der Zielgruppe ist erforderlich.' });
    }

    const systemPrompt = `Du bist ein prämierter Werbepsychologe und Creative Director für hochwertige Architektur- und Fertighaus-Werbespots.
Der Nutzer möchte eine freie Zielgruppe für das filmische Gesamtkonzept definieren:
Zielgruppe: "${trimmedName}"
${hint ? `Zusatzinformationen / Notizen: "${hint.trim()}"` : ''}

Deine Aufgabe ist es, für diese Zielgruppe ein tiefenpsychologisches und sensorisch greifbares Ästhetik-Profil zu generieren, das als verbindliche Direktive für den Film (Farbspektrum, Lichtführung, Sounddesign, Musik, Haptik, Architektur-Fokus und Call-to-Action) dient.

Antworte AUSSCHLIESSLICH im folgenden JSON-Format ohne Markdown-Backticks:
{
  "name": "${trimmedName}",
  "badge": "Fokus: ... (prägnante 4-7 Wörter)",
  "ageGroup": "... (z.B. 28 bis 45 Jahre)",
  "coreValues": "... (4-6 Kernwerte kommagetrennt, z.B. Wertarbeit, Anpacken, Kostensicherheit)",
  "psychology": "... (2-3 Sätze: Was treibt diese Zielgruppe emotional an? Was sind ihre Ängste, Sehnsüchte und psychologischen Trigger beim Hausbau?)",
  "colorSpectrum": "... (Farbwelt, Lichttemperatur in Kelvin oder Dämmerung, Materialien, Reflexionen)",
  "soundAesthetic": "... (Akustischer roter Faden: Instrumente, Rhythmus, Sounddesign, Haptikgeräusche)",
  "architecturalFocus": "... (Welche Bereiche des Hauses stehen im Fokus? z.B. Raumaufteilung, Werkstatt, offener Kochbereich, Smarthome)",
  "callToActionStyle": "... (Tonalität des CTA, z.B. Direkt, herzlich, seriös, visionär)",
  "sampleCallToAction": "... (Ein mitreißender, zielgruppengenauer 1-Satz-Call-to-Action für das Video-Outro)"
}`;

    let lmResponseText = '';
    let usedSource = 'lmstudio';

    try {
      const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      const targetUrl = `${baseUrl}/chat/completions`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generiere jetzt das JSON-Profil für "${trimmedName}".` },
          ],
          temperature: 0.7,
          max_tokens: 1200,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (resp.ok) {
        const data = await resp.json();
        lmResponseText = data.choices?.[0]?.message?.content || '';
      }
    } catch (err: any) {
      console.warn('LM Studio unreachable for audience suggestion, using fallback:', err.message);
      usedSource = 'fallback';
    }

    let parsedProfile: any = null;
    if (lmResponseText) {
      try {
        const jsonMatch = lmResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedProfile = JSON.parse(jsonMatch[0]);
        }
      } catch (pe) {
        console.warn('Could not parse LM Studio JSON for audience profile, falling back:', pe);
      }
    }

    if (!parsedProfile || !parsedProfile.psychology) {
      // Intelligent fallback
      const lower = (trimmedName + ' ' + (hint || '')).toLowerCase();
      usedSource = 'fallback';

      if (lower.includes('handwerk') || lower.includes('macher') || lower.includes('meister') || lower.includes('bau')) {
        parsedProfile = {
          name: trimmedName,
          badge: 'Fokus: Ehrliches Handwerk, Wertarbeit & Eigenleistung',
          ageGroup: '28 bis 48 Jahre',
          coreValues: 'Echte Handwerksqualität, langlebige Bausubstanz, Kostentransparenz, Anpacken, funktionale Robustheit',
          psychology: 'Will keine hohlen Werbeversprechen, sondern messbare Fakten und sichtbare Materialstärke. Schätzt modulare Ausbaustufen, bei denen Eigenleistung bares Geld spart. Verachtet billige Blendfassaden.',
          colorSpectrum: 'Erdige, satte Töne: Dunkles Lerchenholz, warmer Schiefer, sattes Ziegelrot, helles direktes Sonnenlicht mit klaren Schlagschatten, hohe Haptik-Kontraste.',
          soundAesthetic: 'Rhythmisch-treibende Akustikgitarre mit sattem Fundament, authentische Haptik-Sounds (Klopfen auf Massivholz, Schnappen robuster Türgriffe), kraftvoll und erdig.',
          architecturalFocus: 'Großzügige Doppelgarage oder Werkstattbereich, praktischer Schmutzschleusen-Eingang, massive Eichenstufen, sichtbare Holzbalkendecken, strapazierfähige Oberflächen.',
          callToActionStyle: 'Direkt, anpackend, ehrlich auf Augenhöhe.',
          sampleCallToAction: 'Echte Qualität für Selbermacher und Profis. Jetzt Planungshandbuch anfordern.',
        };
      } else if (lower.includes('luxus') || lower.includes('villa') || lower.includes('penthouse') || lower.includes('investor') || lower.includes('exklusiv')) {
        parsedProfile = {
          name: trimmedName,
          badge: 'Fokus: Avantgarde, Diskretion & Monumentale Eleganz',
          ageGroup: '38 bis 65 Jahre',
          coreValues: 'Unikatcharakter, repräsentatives Prestige, Privatsphäre, kompromisslose Premium-Ausstattung, maximale Wertsteigerung',
          psychology: 'Erwartet absolute Diskretion, White-Glove-Service und architektonische Meisterleistungen. Will ein Refugium, das Status subtil demonstriert, ohne aufdringlich zu wirken. Ästhetik und Weitblick stehen über Budgetfragen.',
          colorSpectrum: 'Dramatische Dämmerung (Blue Hour & Golden Hour): Anthrazit, Marmor-Reflexionen, Champagner-Akzente, warme verdeckte LED-Wallwasher (2700K), spiegelnde Wasserflächen.',
          soundAesthetic: 'Sphärischer High-End Ambient mit warmen Kontrabass-Zupfern und feinsten Geigentönen, ultra-leise Gleitgeräusche raumhoher Schiebepaneele, exklusives Flair.',
          architecturalFocus: 'Skulpturale Freiformtreppen, raumhohe 3,20m Glasfassaden, Master-Bedroom mit Ankleide und privater Wellness-Terrasse, Weinkeller mit Sichtverglasung.',
          callToActionStyle: 'Souverän, diskret, exklusiv.',
          sampleCallToAction: 'Architektur auf höchstem Niveau. Vereinbaren Sie Ihr vertrauliches Beratungsgespräch.',
        };
      } else if (lower.includes('öko') || lower.includes('nachhaltig') || lower.includes('natur') || lower.includes('autark') || lower.includes('bio')) {
        parsedProfile = {
          name: trimmedName,
          badge: 'Fokus: Baubiologie, Zirkularität & Energieautarkie',
          ageGroup: '30 bis 55 Jahre',
          coreValues: 'Klimapositiver Fußabdruck, Schadstofffreiheit, 100% erneuerbare Energien, Permakultur, natürliche Langlebigkeit',
          psychology: 'Tiefes Verantwortungsbewusstsein für Umwelt und nächste Generationen. Sucht nachweisbare Zertifikate (FSC, PEFC, Sentinel Haus). Verlangt gesunde Raumluft und maximale Unabhängigkeit von fossilen Energieträgern.',
          colorSpectrum: 'Organische Farbpalette: Salbeigrün, warmes Sandbeige, unbehandeltes Zirben- und Eichenholz, ungefiltertes diffuses Morgenlicht, spürbare Pflanzenwelten.',
          soundAesthetic: 'Organisch-akustische Soundscape: Zartes Cello, leises Rauschen von Birkenblättern im Wind, Plätschern von Regenwassernutzungsanlagen, beruhigende Stille.',
          architecturalFocus: 'Reine Holzrahmenbauweise mit Zellulosedämmung, Gründach mit integrierter PV-Anlage, Lehmputzinnenwände für optimales Raumklima, große Südverglasung zur passiven Solarthermie.',
          callToActionStyle: 'Werteorientiert, visionär, transparent.',
          sampleCallToAction: 'Bauen im Einklang mit der Natur. Entdecken Sie unsere klimapositiven Konzepte.',
        };
      } else {
        parsedProfile = {
          name: trimmedName,
          badge: `Fokus: Spezifischer Lebensraum & Ästhetik für ${trimmedName}`,
          ageGroup: '30 bis 55 Jahre',
          coreValues: 'Zukunftssicherheit, individuelle Architektur, hohe Energieeffizienz, verlässliche Realisierung',
          psychology: `Wünscht sich ein Zuhause, das den spezifischen Lebensstil von "${trimmedName}" widerspiegelt. Hoher Wert auf planbare Bausicherheit, kompromisslose Wohlfühlatmosphäre und maßgeschneiderte Lösungen.`,
          colorSpectrum: 'Natürlich-warmes Architekturlicht: Edles Holz, feiner Strukturputz, dezente Sand- und Anthrazittöne, harmonische Tageslichtführung durch Panoramafenster.',
          soundAesthetic: 'Harmonische Akustik mit warmen Saiteninstrumenten und weichem Klavier, unaufdringliche Wohlfühlatmosphäre mit feinen Haptikgeräuschen.',
          architecturalFocus: 'Lichtdurchfluteter Wohn- und Essbereich, energieeffiziente Hülle mit Photovoltaik und Wärmepumpe, großzügiger Terrassenaustritt, strukturierte Raumaufteilung.',
          callToActionStyle: 'Einladend, kompetent, zielorientiert.',
          sampleCallToAction: `Verwirklichen Sie Ihren individuellen Wohntraum. Jetzt unverbindlich informieren.`,
        };
      }
    }

    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'custom';
    parsedProfile.id = `custom-${slug}-${Date.now()}`;
    parsedProfile.source = usedSource;

    res.json({ success: true, audience: parsedProfile, source: usedSource });
  } catch (err: any) {
    console.error('Error suggesting target audience:', err);
    res.status(500).json({ error: err.message });
  }
});

// Suggest holistic Design, Styling & Look concept based on Target Audience
app.post('/api/screenplay/suggest-design-look', async (req: Request, res: Response) => {
  try {
    const {
      endpoint = 'http://localhost:1234/v1',
      modelName = 'local-model',
      apiKey,
      targetAudience,
      buildingStyle = 'Modernes Holz- und Massivhaus',
    } = req.body;

    const audienceName = targetAudience?.name || 'Moderne Bauherren';
    const psychology = targetAudience?.psychology || 'Hoher Anspruch an Qualität, Raumgefühl und Wertbeständigkeit';
    const coreValues = Array.isArray(targetAudience?.coreValues)
      ? targetAudience.coreValues.join(', ')
      : (targetAudience?.coreValues || 'Wohlbefinden, Natürlichkeit, Beständigkeit');

    const prompt = `Du bist ein preisgekrönter Art Director und Szenenbildner für cineastische Architekturfilme und High-End Lifestyle-Commercials.
Entwickle basierend auf der folgenden ZIELGRUPPE ein vollständiges, sensorisches DESIGN- & LOOK-KONZEPT für das Video:

ZIELGRUPPE: "${audienceName}"
- Psychologie & Motivation: ${psychology}
- Kernwerte: ${coreValues}
- Architekturstil des Projekts: ${buildingStyle}

Deine Aufgabe: Bestimme die perfekte Ästhetik (Lichtführung, Farbpalette, Haptik/Materialien, Akustik/Sound und globale Prompteinstellungen), die diese Zielgruppe emotional maximal abholt.

Antworte AUSSCHLIESSLICH im folgenden JSON-Format ohne Markdown:
{
  "themeTitle": "z.B. Warm Organic Minimalism / Nordic Sanctuary",
  "lightAndAtmosphere": "z.B. Weiches Spätnachmittagslicht (Golden Hour, 3200K), sanfte Schlagschatten durch Lamellen, diffuser Dunst über dem Garten",
  "colorPalette": [
    { "name": "Farbbezeichnung 1", "hex": "#D8C7B5", "usage": "Naturleinen, Eiche hell" },
    { "name": "Farbbezeichnung 2", "hex": "#4A524D", "usage": "Salbeigrün, Gartenbezug" },
    { "name": "Farbbezeichnung 3", "hex": "#2B2B2A", "usage": "Mattanthrazit Fensterrahmen" },
    { "name": "Farbbezeichnung 4", "hex": "#F4F1EA", "usage": "Warmweißer Feinputz" }
  ],
  "materialWorld": "z.B. Unbehandelte Eiche geölt, handgestrichener Lehmputz, gebürstetes Messing, schwellenloser Naturstein",
  "soundAndMusic": "z.B. Akustische Nylonsaiten-Gitarre mit dezentem Kontrabass (76 BPM), leises Knistern des Kamins und sanftes Regenwassergurgeln",
  "typographyAndCI": "z.B. Edle serifenlose Display-Typo (Tracking +0.05), minimalistische Unterzeilen, dezente Einblendung unten zentriert",
  "globalWeatherSuggestion": "Golden hour sunlight with soft warm atmospheric haze, gentle breeze moving trees",
  "globalBackgroundSuggestion": "Lush architectural garden landscape with natural stone pathways and mature pine trees",
  "globalMusicSuggestion": "Warm acoustic neo-classical guitar and soft ambient cello, uplifting and deeply calming",
  "globalSoundDesignSuggestion": "Subtle tactile sounds: barefoot steps on solid oak, sliding panorama glass door, breeze in birch leaves"
}`;

    let lmResponseText = '';
    let usedSource = 'lmstudio';

    try {
      const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      const targetUrl = `${baseUrl}/chat/completions`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'Du antwortest ausschließlich im validen JSON-Format.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 1200,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (resp.ok) {
        const data = await resp.json();
        lmResponseText = data.choices?.[0]?.message?.content || '';
      }
    } catch (err: any) {
      console.warn('LM Studio unreachable for design look, using intelligent fallback:', err.message);
      usedSource = 'fallback';
    }

    let parsedDesign: any = null;
    if (lmResponseText) {
      try {
        const jsonMatch = lmResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedDesign = JSON.parse(jsonMatch[0]);
        }
      } catch (pe) {
        console.warn('Could not parse LM Studio JSON for design look:', pe);
      }
    }

    if (!parsedDesign || !parsedDesign.lightAndAtmosphere) {
      usedSource = 'fallback';
      parsedDesign = {
        themeTitle: `Harmonische Ästhetik für ${audienceName}`,
        lightAndAtmosphere: 'Spätnachmittags-Sonnenlicht mit weichen Schattenachsen, sanfte warmweiße Lichtkegel (2800K) im Innenraum, reflexionsarme Panoramaverglasung.',
        colorPalette: [
          { name: 'Warmes Eichenholz', hex: '#C29B6B', usage: 'Böden, Lamellen, Tischflächen' },
          { name: 'Naturstein Sand', hex: '#E2D9CC', usage: 'Terrasse, Wandelemente' },
          { name: 'Anthrazit Matt', hex: '#33373B', usage: 'Fensterprofile, Akzentlinien' },
          { name: 'Feinputz Off-White', hex: '#F7F5F0', usage: 'Lichte Wandflächen' },
        ],
        materialWorld: 'Geölte Eiche, strukturierter Feinputz, raumhohe Isolierverglasung und gebürstetes Aluminium.',
        soundAndMusic: 'Organische Akustikinstrumente mit warmem Grundton, leises Rascheln von Blättern und wertige Haptikgeräusche.',
        typographyAndCI: 'Moderne, reduzierte Grotesk-Typografie mit viel Weißraum und ruhigen Einblendungen.',
        globalWeatherSuggestion: 'Warm golden hour sunlight with soft diffused shadows and gentle summer breeze',
        globalBackgroundSuggestion: 'Architectural designer garden with layered greenery, gravel paths, and quiet neighborhood setting',
        globalMusicSuggestion: 'Cinematic acoustic guitar and gentle piano melody, warm, inspiring, premium feel',
        globalSoundDesignSuggestion: 'Ultra-crisp foley: soft footsteps on wood flooring, gentle wind in trees, quiet mechanical lock click',
      };
    }

    parsedDesign.source = usedSource;
    res.json({ success: true, design: parsedDesign, source: usedSource });
  } catch (err: any) {
    console.error('Error in suggest-design-look:', err);
    res.status(500).json({ error: err.message });
  }
});

// Suggest tailored Camera Choreography across all Windows based on Audience & Story
app.post('/api/screenplay/suggest-camera-plan', async (req: Request, res: Response) => {
  try {
    const {
      endpoint = 'http://localhost:1234/v1',
      modelName = 'local-model',
      apiKey,
      windowCount = 4,
      targetAudience,
      buildingRefName = 'Musterhaus',
      protagonistName = 'Bauherrin',
      styleHint = 'Cineastisch, dynamisch, emotional',
    } = req.body;

    const audienceName = targetAudience?.name || 'Familie / Anspruchsvolle Bauherren';

    const prompt = `Du bist ein internationaler Director of Photography (DoP) für High-End Werbefilme.
Entwickle eine dramaturgisch perfekt choreografierte KAMERAFÜHRUNG für genau ${windowCount} aufeinander aufbauende Szenenfenster (Windows).

PROJEKT-KONTEXT:
- Zielgruppe: "${audienceName}"
- Hauptmotiv: "${buildingRefName}"
- Protagonist(en): "${protagonistName}"
- Regiestil: ${styleHint}

WICHTIGE CINEASTISCHE REGELN:
1. Window 1 (Opening/Hook): Spektakuläre Weitwinkel-/Drohnen-Einführung oder dramatischer Low-Angle Anflug auf die Architektur.
2. Mittlere Windows: Dynamische Steadicam-Bewegungen auf Augenhöhe, Übergang in 100mm Macro-Closeups (T1.8 Bokeh) für Haptik und Materialien.
3. Letztes Window (Finale/CTA): Erhabener Kranaufzug / Drone Pull-Back in den Sonnenuntergang mit Platz für das Wasserzeichen unten rechts.

Antworte AUSSCHLIESSLICH im folgenden JSON-Format:
{
  "directorVision": "Kurze 2-Satz-Erklärung der Kamera-Dramaturgie für die Zielgruppe",
  "cameraPlan": [
    {
      "windowIndex": 0,
      "movementTitle": "z.B. FPV Drohnen-Gleitflug über das Dach",
      "lensAndRig": "24mm Master Prime, DJI Ronin / Heavy Lift Drone",
      "dramaturgyReason": "Zieht den Zuschauer sofort in den Bann und zeigt das Bauwerk im Kontext",
      "movementPrompt": "FPV drone descending smoothly from treetops towards the architectural facade of <Building 1>, dynamic tilt-up revealing the panoramic glass entrance, golden hour light reflections"
    }
  ]
}`;

    let lmResponseText = '';
    let usedSource = 'lmstudio';

    try {
      const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      const targetUrl = `${baseUrl}/chat/completions`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'Du antwortest ausschließlich im validen JSON-Format.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 1500,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (resp.ok) {
        const data = await resp.json();
        lmResponseText = data.choices?.[0]?.message?.content || '';
      }
    } catch (err: any) {
      console.warn('LM Studio unreachable for camera plan, using fallback:', err.message);
      usedSource = 'fallback';
    }

    let parsedPlan: any = null;
    if (lmResponseText) {
      try {
        const jsonMatch = lmResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedPlan = JSON.parse(jsonMatch[0]);
        }
      } catch (pe) {
        console.warn('Could not parse LM Studio camera plan JSON:', pe);
      }
    }

    if (!parsedPlan || !Array.isArray(parsedPlan.cameraPlan) || parsedPlan.cameraPlan.length === 0) {
      usedSource = 'fallback';
      parsedPlan = {
        directorVision: `Maßgeschneiderte 4-Phasen-Kameraführung für "${audienceName}": Von der atmosphärischen Ankunft über intime Haptik-Details bis zum erhabenen Sonnenuntergang-Finale.`,
        cameraPlan: [
          {
            windowIndex: 0,
            movementTitle: 'Cinematic FPV Drohnen-Gleitflug & Architekturtotale',
            lensAndRig: '24mm T1.5 Cine Prime auf 3-Achsen Gimbal Drohne',
            dramaturgyReason: 'Etabliert das Anwesen und erzeugt sofortige Neugier auf die Architektur.',
            movementPrompt: `Dynamic FPV drone glide descending from canopy height towards the front facade of ${buildingRefName}, smooth deceleration into a stable 24mm wide establishing shot at golden hour`,
          },
          {
            windowIndex: 1,
            movementTitle: 'Steadicam Walkthrough & Raumdurchquerung',
            lensAndRig: '35mm T1.4 auf Steadicam / Ronin 2',
            dramaturgyReason: 'Gibt dem Zuschauer das Gefühl, selbst durch das lichtdurchflutete Foyer zu schreiten.',
            movementPrompt: `Smooth eye-level Steadicam push forward through the main entrance into the double-height open living space, following ${protagonistName} admiring the natural wood finishes`,
          },
          {
            windowIndex: 2,
            movementTitle: '100mm Macro Dolly & Tiefenschärfe-Verlagerung',
            lensAndRig: '100mm Macro Lens T1.8 auf motorized Slider',
            dramaturgyReason: 'Macht Qualität und Haptik körperlich spürbar – entscheidend für Kaufentscheidung.',
            movementPrompt: `EXTREME CLOSE-UP, 100mm macro, T1.8, slow motorized slider track across the oiled natural oak texture, rack focus to sunlight dancing on triple-glazed glass facade`,
          },
          {
            windowIndex: 3,
            movementTitle: 'Kran-Aufzug & Sunset Outro mit Wasserzeichen-Freiraum',
            lensAndRig: '35mm auf TechnoCrane / ascending Drone',
            dramaturgyReason: 'Emotionaler Höhepunkt, lässt das Haus in der Abenddämmerung strahlen und gibt Raum für den Claim.',
            movementPrompt: `Slow ascending crane rise pulling back from the wooden terrace into the glowing evening sky, warm interior lights turning on, framed with clean negative space in bottom-right corner`,
          },
        ],
      };
    }

    parsedPlan.source = usedSource;
    res.json({ success: true, ...parsedPlan });
  } catch (err: any) {
    console.error('Error in suggest-camera-plan:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7b. Elaborate Reference Roles & Actions ("Was macht er?") with LM Studio Vision
// Analyzes reference images directly via Vision API, works out precise character actions,
// building focus, prop interactions, and exact Maestro 2.1.6 bindings with strict anti-clone and anti-babble anchors.
// ==========================================
app.post('/api/screenplay/elaborate-reference-roles', async (req: Request, res: Response) => {
  try {
    const {
      references = [],
      targetAudience,
      stichpunkte,
      scenarioContext,
      dialogueLanguage = 'German',
      endpoint = 'http://localhost:1234/v1',
      modelName = 'local-model',
      apiKey,
      projectName,
    } = req.body;

    if (!Array.isArray(references) || references.length === 0) {
      res.status(400).json({ error: 'Keine Referenzen zum Ausarbeiten übergeben.' });
      return;
    }

    // Helper: Resolve image dataUrl from reference (either data: url or local file)
    const resolveImageData = (ref: any): { dataUrl?: string; mimeType: string } | null => {
      if (ref.photoUrl && ref.photoUrl.startsWith('data:image/')) {
        const mimeMatch = ref.photoUrl.match(/^data:(image\/[a-zA-Z0-9+]+);base64,/);
        return {
          dataUrl: ref.photoUrl,
          mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg',
        };
      }
      // Check if there's a local file on disk
      if (ref.localFile && projectName) {
        const slug = sanitizeProjectSlug(projectName);
        const candidatePath = path.join(PROJECTS_DIR, slug, 'references', ref.localFile);
        if (fs.existsSync(candidatePath)) {
          try {
            const buf = fs.readFileSync(candidatePath);
            const ext = path.extname(ref.localFile).toLowerCase();
            const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
            return {
              dataUrl: `data:${mime};base64,${buf.toString('base64')}`,
              mimeType: mime,
            };
          } catch (readErr) {
            console.warn(`Could not read local file ${candidatePath}:`, readErr);
          }
        }
      }
      return null;
    };

    const refOverview = references.map((r: any, idx: number) => {
      const cat = r.category || 'human';
      const tag = r.tag || (cat === 'building' ? `<Building ${r.referenceIndex || 1}>` : cat === 'object' ? `<Object ${r.referenceIndex || 1}>` : `<Subject ${r.referenceIndex || idx + 1}>`);
      const hasImage = resolveImageData(r) ? ' [BILD VORHANDEN]' : ' [Kein Bild]';
      return `[ID: ${r.id}] Kategorie: ${cat.toUpperCase()} | Tag: ${tag} | Name: "${r.name || 'Unbenannt'}"${hasImage} | Bisherige Rolle: "${r.roleOrAction || ''}" | Bisherige Beziehung: "${r.relationship || ''}" | Aussehen/Details: "${r.hairOrMaterial || ''} ${r.clothingOrFinish || ''} ${r.distinguishingMarks || ''}"`;
    }).join('\n');

    let audienceInfo = 'Zielgruppe: Allgemeines Architektur- und Lifestyle-Publikum';
    if (targetAudience) {
      audienceInfo = `Zielgruppe: "${targetAudience.name}"
- Psychologie: ${targetAudience.psychology}
- Farbspektrum: ${targetAudience.colorSpectrum}
- Sound/Ästhetik: ${targetAudience.soundAesthetic}
- Architektur-Fokus: ${targetAudience.architecturalFocus || targetAudience.architectureFocus || ''}`;
    }

    const systemPrompt = `Du bist ein hochkarätiger Casting-Direktor, Bildanalyst, Dramaturg und Video-Prompt-Architekt für MiniMax H3 und Maestro 2.1.6.

DEINE KERN-AUFGABE:
Führe eine akribische BILDANALYSE der übergebenen Referenzbilder durch. Definiere für jede Referenz unmissverständliche IDENTITÄTS-ANKER, konkrete Handlungen ("Wer macht was?"), haptische Interaktionen mit der Architektur und die exakten Maestro 2.1.6 Binding-Labels.

KRITISCHE REGELN FÜR MINIMAX H3 & MAESTRO:
1. BILDANALYSE & ANKER-PFLICHT (Besonders für Personen):
   - Analysiere das Referenzbild detailgenau: Gesichtsform, Altersgruppe, Frisur (Schnitt, Textur, Farbe), Augenfarbe & Blick, Statur/Körperbau, exakte Kleidung (Schnitt, Stoff, Farbton) und besondere Merkmale.
   - MiniMax H3 BENÖTIGT diese detaillierten ANKER zwingend, um Klone und Doppelgänger absolut auszuschließen!
2. ANTI-CLONE DIREKTIVE:
   - Definiere jede Person als einzigartiges Individuum. Schließe Klone, Gesichtsübertragungen (Face-Bleed) und Doppelgänger im Hintergrund strikt aus.
3. ANTI-GEPLAPPERE (ANTI-BABBLE) DIREKTIVE:
   - Strikte Stille bzw. natürliche Raumakustik abseits der explizit getaggten Dialoge (<d[Name][Sprache]>...</d>). Kein ungesteuertes Gemurmel, kein Geplappere, kein Off-Sprecher.
4. SPRACHE:
   - Die Rollen- und Handlungsbeschreibungen müssen sowohl auf Deutsch (für die Regie/UI) als auch als präziser englischer Prompt-Baustein formuliert werden. Dialoge in "${dialogueLanguage}".
5. EXAKTE MAESTRO 2.1.6 BINDING-LABELS (maestroLabel):
   - Mensch / Subject: @Subject1_Vorname_Rolle (z.B. @Subject1_Anna_Bauherrin)
   - Gebäude / Haus: @Building1_Modellname_Architektur (z.B. @Building1_Musterhaus_Avantgarde)
   - Requisite / Prop: @Object1_Requisite_Detail (z.B. @Object1_Hausschluessel_Ledermappe)
   - Logo / Wasserzeichen: @Logo1_Wasserzeichen_BottomRight (Regel: IMMER rechts unten, dezent & transparent, 25% Opacity)
6. WASSERZEICHEN-REGEL:
   - Falls ein Logo vorhanden ist, MUSS es IMMER rechts unten platziert sein (Bottom-Right, 25% Opacity).

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt im Format:
{
  "elaboratedReferences": [
    {
      "id": "original_id_der_referenz",
      "category": "human|building|object|logo|animal|environment",
      "referenceIndex": 1,
      "tag": "<Subject 1>",
      "maestroLabel": "@Subject1_Vorname_Rolle",
      "name": "Präziser Name",
      "roleOrAction": "Ausführliche deutsche Rollen- und Handlungsbeschreibung (Was macht er/sie?)",
      "roleOrActionEn": "Crisp, highly cinematic English action prompt description for MiniMax H3 / Maestro",
      "relationship": "Beziehung zu anderen Protagonisten oder zum Gebäude",
      "gesturesAndInteractions": "Konkrete haptische Gesten und Laufwege im Haus",
      "distinguishingMarks": "Visuelle Anker: Keine störenden Accessoires, exakte visuelle Merkmale zur Klon-Vermeidung",
      "hairOrMaterial": "Haare / Materialität (detailliert aus Bildanalyse)",
      "eyesOrGlazing": "Augen / Verglasung (detailliert aus Bildanalyse)",
      "clothingOrFinish": "Exakte Kleidung mit Schnitt & Farbe (aus Bildanalyse)",
      "build": "Statur, Größe, Körperhaltung",
      "ageRange": "z.B. 32-38 Jahre"
    }
  ],
  "dramaturgicalSummary": "Zusammenfassendes Regie-Konzept über das Zusammenspiel der Referenzen und Klon-Ausschluss"
}`;

    const textPrompt = `${audienceInfo}

PROJEKT-KONTEXT / VORGABEN:
${stichpunkte || scenarioContext || 'High-End Architekturfilm über die Besichtigung eines modernen Musterhauses'}

ÜBERGEBENE REFERENZEN:
${refOverview}

Führe jetzt die Bildanalyse für alle vorliegenden Bilder durch und arbeite jede einzelne Referenz im geforderten JSON-Format detailliert aus.`;

    let parsedResult: any = null;
    let usedSource = 'lmstudio';

    // Build multimodal message content for Vision-capable models
    const multimodalUserContent: any[] = [{ type: 'text', text: textPrompt }];
    const imagesForGemini: any[] = [];

    references.forEach((ref: any, idx: number) => {
      const imgInfo = resolveImageData(ref);
      if (imgInfo && imgInfo.dataUrl) {
        // OpenAI / LM Studio Vision format
        multimodalUserContent.push({
          type: 'text',
          text: `[REFERENZBILD #${idx + 1} - ${ref.tag || `<Subject ${idx + 1}>`} "${ref.name || 'Referenz'}" (Kategorie: ${ref.category || 'human'})]:`,
        });
        multimodalUserContent.push({
          type: 'image_url',
          image_url: {
            url: imgInfo.dataUrl,
          },
        });

        // Gemini Vision format
        let b64 = imgInfo.dataUrl;
        if (b64.includes(';base64,')) {
          b64 = b64.split(';base64,')[1];
        }
        imagesForGemini.push({
          inlineData: {
            mimeType: imgInfo.mimeType || 'image/jpeg',
            data: b64,
          },
        });
        imagesForGemini.push({
          text: `[Referenzbild für ${ref.tag || `<Subject ${idx + 1}>`} "${ref.name || 'Referenz'}"]`,
        });
      }
    });

    // 1. Try LM Studio with sequential single-image calls (1 image per request to prevent local model overload)
    try {
      const lmHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) lmHeaders['Authorization'] = `Bearer ${apiKey}`;

      const singleResults: any[] = [];

      for (let idx = 0; idx < references.length; idx++) {
        const ref = references[idx];
        const imgInfo = resolveImageData(ref);
        const cleanNameEng = (ref.name || 'Subject').replace(/[^a-zA-Z0-9]/g, '');
        const singlePrompt = `You are an expert cinematic visual analyst. Analyze this single reference image for a high-end architectural film.
Reference ID: ${ref.id}
Category: ${ref.category || 'human'}
Name: ${ref.name || 'Subject'}

CRITICAL REQUIREMENT: You MUST fill in the fields below. Every single value MUST be written in clean, professional, descriptive, cinematic ENGLISH (do NOT use German, e.g. use "grey hair", "beige blazer", "athletic build", NOT "graues Haar", "hellgrauer Blazer").

Return EXACTLY the following JSON structure filled with your visual analysis of the image:
{
  "id": "${ref.id}",
  "category": "${ref.category || 'human'}",
  "referenceIndex": ${ref.referenceIndex || idx + 1},
  "tag": "${ref.tag || `<Subject ${idx + 1}>`}",
  "maestroLabel": "@Subject${idx + 1}_${cleanNameEng}",
  "name": "${ref.name || 'Subject'}",
  "roleOrAction": "${(ref.roleOrAction || 'Explores spaces').replace(/"/g, "'")}",
  "roleOrActionEn": "${(ref.roleOrActionEn || ref.roleOrAction || 'Explores architectural spaces').replace(/"/g, "'")}",
  "relationship": "${(ref.relationship || 'Protagonist').replace(/"/g, "'")}",
  "hairOrMaterial": "[Describe hair style/color for human, or facade cladding material for building in ENGLISH]",
  "eyesOrGlazing": "[Describe eye color for human, or glass facade/glazing properties for building in ENGLISH]",
  "clothingOrFinish": "[Describe exact outfit and colors for human, or outdoor surface/finish for building in ENGLISH]",
  "distinguishingMarks": "[Describe unique features, beard, glasses, posture, skin, or unique architectural accents in ENGLISH]",
  "build": "[Describe physical build/stature for human, or architectural volume structure/geometry in ENGLISH]",
  "ageRange": "[Describe age range for human, or N/A in ENGLISH]"
}`;

        const userMsgContent: any[] = [{ type: 'text', text: singlePrompt }];
        if (imgInfo && imgInfo.dataUrl) {
          userMsgContent.push({
            type: 'image_url',
            image_url: { url: imgInfo.dataUrl },
          });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const lmRes = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: lmHeaders,
          body: JSON.stringify({
            model: modelName || 'local-model',
            messages: [
              { role: 'system', content: 'You are a highly precise cinematic visual analyst. Analyze the single image and respond ONLY in valid JSON. All descriptions and analysis values MUST be strictly in high-end cinematic ENGLISH. Avoid German language completely.' },
              { role: 'user', content: userMsgContent },
            ],
            temperature: 0.2,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (lmRes.ok) {
          const data = await lmRes.json();
          const content = data.choices?.[0]?.message?.content || '';
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            singleResults.push(JSON.parse(match[0]));
          }
        } else {
          console.warn(`LM Studio single-image request failed with status ${lmRes.status}`);
        }
      }

      if (singleResults.length > 0) {
        parsedResult = {
          elaboratedReferences: singleResults,
          dramaturgicalSummary: `Erfolgreiche Einzelbild-Analyse von ${singleResults.length} Referenzen via LM Studio.`,
        };
      }
    } catch (lmErr) {
      console.warn('LM Studio single-image role elaboration error:', lmErr);
    }

    // 2. Rule / Template Fallback if LM Studio is unreachable (No cloud calls, 100% private)
    if (!parsedResult || !parsedResult.elaboratedReferences) {
      usedSource = 'rule_engine';
      parsedResult = {
        elaboratedReferences: references.map((r: any, idx: number) => {
          const cat = r.category || 'human';
          const cleanName = (r.name || 'Subject').replace(/[^a-zA-Z0-9]/g, '');
          let tag = r.tag || `<Subject ${idx + 1}>`;
          let maestroLabel = `@Subject${idx + 1}_${cleanName || 'Darsteller'}`;

          if (cat === 'building') {
            tag = `<Building ${r.referenceIndex || 1}>`;
            maestroLabel = `@Building${r.referenceIndex || 1}_${cleanName || 'Musterhaus'}`;
          } else if (cat === 'object') {
            tag = `<Object ${r.referenceIndex || 1}>`;
            maestroLabel = `@Object${r.referenceIndex || 1}_${cleanName || 'Requisite'}`;
          } else if (cat === 'logo') {
            tag = `<Logo ${r.referenceIndex || 1}>`;
            maestroLabel = `@Logo${r.referenceIndex || 1}_Wasserzeichen_BottomRight`;
          }

          return {
            id: r.id,
            category: cat,
            referenceIndex: r.referenceIndex || idx + 1,
            tag,
            maestroLabel,
            name: r.name || 'Referenz',
            roleOrAction: cat === 'human'
              ? 'Erkundet die Architektur, prüft Materialien, Holzoberflächen und Lichtachsen mit sichtbarer Begeisterung'
              : cat === 'building'
              ? 'Architektonisches Hauptmotiv, moderne Kubatur mit Holzlamellen und großzügiger Glasfassade'
              : cat === 'object'
              ? 'Zentrales haptisches Detail für die Schlüsselübergabe im finalen Window'
              : 'Permanentes, dezentes Wasserzeichen rechts unten (25% Deckkraft)',
            roleOrActionEn: cat === 'human'
              ? 'Explores architectural sightlines, touches tactile timber surfaces and inspects floor-to-ceiling panoramic glass with genuine enthusiasm'
              : cat === 'building'
              ? 'Primary architectural facade, modern cubic geometry with vertical larch wood slats and triple-glazed windows'
              : cat === 'object'
              ? 'Tactile architectural key fob in brushed stainless steel held firmly in hand during handover'
              : 'Permanent discreet transparent watermark anchored in bottom-right corner (25% opacity)',
            relationship: cat === 'human' ? 'Bauherrin / Hauptprotagonistin' : 'Kernmotiv',
            gesturesAndInteractions: 'Sanfte Berührung der Holzoberflächen, entspanntes Gehen entlang der Sichtachsen',
            distinguishingMarks: cat === 'logo'
              ? 'IMMER rechts unten, dezent & transparent (25% Opacity)'
              : 'Eindeutiger visueller Anker: Natürlicher Teint, keine auffälligen Uhren, Klon-Ausschluss aktiv',
            hairOrMaterial: r.hairOrMaterial || (cat === 'human' ? 'Gepflegtes Naturhaar mit natürlichem Glanz' : 'Edles Lärchenholz & Glattputz'),
            eyesOrGlazing: r.eyesOrGlazing || (cat === 'human' ? 'Wacher, begeisterter Blick' : 'Klar reflektierende Dreifach-Isolierverglasung'),
            clothingOrFinish: r.clothingOrFinish || (cat === 'human' ? 'Hochwertiges sandfarbenes Leinenhemd und dunkle Hose' : 'Matt anthrazit eloxierte Profile'),
            build: r.build || (cat === 'human' ? 'natürliche aufrechte Statur' : '2-geschossiger moderner Baukörper'),
            ageRange: r.ageRange || (cat === 'human' ? '30-40 Jahre' : undefined),
          };
        }),
        dramaturgicalSummary: 'Harmonisches Zusammenspiel von Protagonisten, Architektur und Branding im Video ohne Klon- oder Doppelgängerbildung.',
      };
    }

    res.json({
      success: true,
      elaboratedReferences: parsedResult.elaboratedReferences,
      dramaturgicalSummary: parsedResult.dramaturgicalSummary,
      source: usedSource,
    });
  } catch (err: any) {
    console.error('Error in elaborate-reference-roles:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. Project & Screenplay Storage System (/data/projects and /data/saved_prompts)
// ==========================================
const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const PROMPTS_DIR = path.join(DATA_DIR, 'saved_prompts');

// Ensure base directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
if (!fs.existsSync(PROMPTS_DIR)) fs.mkdirSync(PROMPTS_DIR, { recursive: true });

// Static route to serve files directly from /data/projects
app.use('/data/projects', express.static(PROJECTS_DIR));

// Helper: Sanitize project slug for directory naming
function sanitizeProjectSlug(name: string): string {
  if (!name || typeof name !== 'string') return `projekt_${Date.now()}`;
  return name
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50) || `projekt_${Date.now()}`;
}

// Helper: Format Maestro 2.1.6 slot binding cheat-sheet
function formatMaestroSlotMappingText(title: string, references: any[]): string {
  let txt = `========================================================================\n`;
  txt += `MAESTRO 2.1.6 REFERENCE BINDING CHEAT-SHEET: ${title || 'Unbenanntes Projekt'}\n`;
  txt += `Generiert: ${new Date().toLocaleString('de-DE')}\n`;
  txt += `WICHTIGER HINWEIS: Trage die folgenden Labels EXAKT so in die Maestro 2.1.6 Slots ein,\n`;
  txt += `damit die Tags im Prompt (<Subject 1>, <Building 1>, <Object 1>, <Logo 1>) 100% matchen.\n`;
  txt += `========================================================================\n\n`;

  (references || []).forEach((ref: any, idx: number) => {
    const slotIdx = idx + 1;
    const cat = (ref.category || 'human').toUpperCase();
    const tag = ref.tag || `<Subject ${slotIdx}>`;
    const cleanName = (ref.name || 'Subject').replace(/[^a-zA-Z0-9]/g, '');
    let defaultAnchor = `@Subject${slotIdx}_${cleanName}`;
    if (ref.category === 'building') defaultAnchor = `@Building${ref.referenceIndex || slotIdx}_${cleanName}`;
    if (ref.category === 'object') defaultAnchor = `@Object${ref.referenceIndex || slotIdx}_${cleanName}`;
    if (ref.category === 'logo') defaultAnchor = `@Logo${ref.referenceIndex || 1}_Wasserzeichen_BottomRight`;
    
    const maestroAnchor = ref.charTag?.startsWith('@') ? ref.charTag : defaultAnchor;

    txt += `------------------------------------------------------------------------\n`;
    txt += `SLOT ${slotIdx} [${cat}]: ${ref.name || 'Unbenannte Referenz'}\n`;
    txt += `• MAESTRO 2.1.6 LABEL  : ${maestroAnchor}\n`;
    txt += `• PROMPT BINDING TAG   : ${tag}\n`;
    txt += `• KATEGORIE            : ${ref.category || 'human'}\n`;
    txt += `• ROLLE & AKTION       : ${ref.roleOrAction || 'Handlungsträger'}\n`;
    if (ref.roleOrActionEn) {
      txt += `• ENGLISCHE PROMPT-ACT : ${ref.roleOrActionEn}\n`;
    }
    txt += `• BEZIEHUNG/KONTEXT    : ${ref.relationship || 'Zentrales Motiv'}\n`;
    if (ref.localFile) {
      txt += `• BILDDATEI IM PROJEKT : references/${ref.localFile}\n`;
    }
    if (ref.category === 'logo') {
      txt += `• WASSERZEICHEN-REGEL  : IMMER rechts unten, dezent & transparent (25% Opacity)\n`;
    }
    txt += `\n`;
  });

  txt += `========================================================================\n`;
  txt += `SCHNELL-ÜBERSICHT FÜR MAESTRO 2.1.6 EINGABEFELDER:\n`;
  (references || []).forEach((ref: any, idx: number) => {
    const slotIdx = idx + 1;
    const cleanName = (ref.name || 'Subject').replace(/[^a-zA-Z0-9]/g, '');
    let defaultAnchor = `@Subject${slotIdx}_${cleanName}`;
    if (ref.category === 'building') defaultAnchor = `@Building${ref.referenceIndex || slotIdx}_${cleanName}`;
    if (ref.category === 'object') defaultAnchor = `@Object${ref.referenceIndex || slotIdx}_${cleanName}`;
    if (ref.category === 'logo') defaultAnchor = `@Logo${ref.referenceIndex || 1}_Wasserzeichen_BottomRight`;
    const maestroAnchor = ref.charTag?.startsWith('@') ? ref.charTag : defaultAnchor;
    txt += `Slot ${slotIdx} -> Name: "${maestroAnchor}" | Tag: "${ref.tag || `<Subject ${slotIdx}>`}"\n`;
  });
  txt += `========================================================================\n`;

  return txt;
}

// Helper: Format single line prompts text file
function formatSingleLinePromptsText(title: string, windows: any[], references: any[], globalWeather: string, globalMusic: string): string {
  let txt = `========================================================================\n`;
  txt += `DREHBUCH PROMPT-EXPORT: ${title || 'Unbenanntes Projekt'}\n`;
  txt += `Generiert: ${new Date().toLocaleString('de-DE')}\n`;
  txt += `Globales Wetter/Licht: ${globalWeather || 'Golden Hour / Sonnenuntergang'}\n`;
  txt += `Sound/Musik: ${globalMusic || 'Cinematic Atmospheric'}\n`;
  txt += `========================================================================\n\n`;

  txt += `--- AKTIVE REFERENZEN & MAESTRO BINDING TAGS ---\n`;
  (references || []).forEach((ref: any, idx: number) => {
    const tag = ref.tag || `<Subject ${idx + 1}>`;
    const anchor = ref.charTag || `@${ref.category || 'Subject'}${idx + 1}_${(ref.name || '').replace(/[^a-zA-Z0-9]/g, '')}`;
    txt += `[${tag}] (${ref.category?.toUpperCase() || 'SUBJECT'}): ${ref.name || 'Unbenannt'} -> ${anchor}\n`;
    txt += `  Rolle: ${ref.roleOrAction || 'Handlungsträger'}\n`;
    txt += `  Beziehung: ${ref.relationship || 'Kernmotiv'}\n`;
    if (ref.category === 'logo') {
      txt += `  Wasserzeichen-Direktive: IMMER rechts unten, dezent & transparent (25% Deckkraft)\n`;
    }
    txt += `\n`;
  });

  txt += `\n========================================================================\n`;
  txt += `--- SINGLE-LINE PROMPTS FÜR MINIMAX H3 & MAESTRO (14 SEKUNDEN PRO WINDOW) ---\n`;
  txt += `========================================================================\n\n`;

  (windows || []).forEach((w: any, idx: number) => {
    const winNum = idx + 1;
    const startSec = idx * 14;
    const endSec = winNum * 14;
    const formatTime = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `00:${secs < 10 ? '0' : ''}${secs}.000`;
    };

    txt += `########################################################################\n`;
    txt += `WINDOW ${winNum} [${formatTime(startSec)} - ${formatTime(endSec)}] - ${w.title || `Szene ${winNum}`}\n`;
    txt += `Kamera: ${w.cameraMovement || 'Cinematic Gimbal'}\n`;
    txt += `Licht/Wetter: ${w.weather || globalWeather || 'Warmes Abendlicht'}\n`;
    txt += `Musik: ${w.musicStyle || globalMusic || 'Atmosphärischer Soundtrack'}\n`;
    if (w.dialogueText) txt += `Sprecher (${w.dialogueSpeaker || 'Off-Voice'}): "${w.dialogueText}"\n`;
    if (w.claim) txt += `Claim / Text-Einblendung: "${w.claim}"\n`;
    txt += `\nPROMPT:\n`;
    txt += `${w.singleLinePrompt || w.actionDescription || `${w.cameraMovement || 'Cinematic tracking shot'}, focusing on main subjects and architectural details in ${w.weather || 'golden hour'} atmosphere, hyperrealistic 8k.`}\n\n`;
  });

  return txt;
}

// --------------------------------------------------------
// Project Endpoints: /api/projects
// --------------------------------------------------------

// 1. List all projects in /data/projects
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(PROJECTS_DIR)) {
      res.json({ success: true, projects: [] });
      return;
    }

    const entries = await fsPromises.readdir(PROJECTS_DIR, { withFileTypes: true });
    const projectFolders = entries.filter((e) => e.isDirectory());

    const projectList = await Promise.all(
      projectFolders.map(async (folder) => {
        const folderPath = path.join(PROJECTS_DIR, folder.name);
        const projectJsonPath = path.join(folderPath, 'project.json');
        const refDir = path.join(folderPath, 'references');
        const promptsDir = path.join(folderPath, 'prompts');

        let data: any = {};
        if (fs.existsSync(projectJsonPath)) {
          try {
            const raw = await fsPromises.readFile(projectJsonPath, 'utf-8');
            data = JSON.parse(raw);
          } catch (e) {
            console.error(`Error reading project.json in ${folder.name}`, e);
          }
        }

        let refFileCount = 0;
        if (fs.existsSync(refDir)) {
          const refFiles = await fsPromises.readdir(refDir);
          refFileCount = refFiles.filter((f) => !f.endsWith('.json')).length;
        }

        let promptFileCount = 0;
        if (fs.existsSync(promptsDir)) {
          const pFiles = await fsPromises.readdir(promptsDir);
          promptFileCount = pFiles.length;
        }

        const projectTitle = data.title || data.name || folder.name.replace(/_/g, ' ');
        const thumbnail = data.references?.find((r: any) => r.photoUrl)?.photoUrl || null;

        return {
          id: folder.name,
          name: projectTitle,
          title: projectTitle,
          description: data.description || '',
          folderPath: `/data/projects/${folder.name}`,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          windowCount: data.windows?.length || 4,
          referencesCount: data.references?.length || refFileCount || 0,
          promptsCount: promptFileCount || 1,
          targetAudienceName: data.targetAudienceCustom?.name || data.targetAudienceId || 'Standard',
          thumbnailUrl: thumbnail,
          tags: data.tags || [],
        };
      })
    );

    // Sort newest updated first
    projectList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json({ success: true, projects: projectList });
  } catch (err: any) {
    console.error('Error listing projects:', err);
    res.status(500).json({ error: `Fehler beim Laden der Projekte: ${err.message}` });
  }
});

// 2. Load a project by slug
app.get('/api/projects/load/:projectName', async (req: Request, res: Response) => {
  try {
    const { projectName } = req.params;
    const slug = sanitizeProjectSlug(projectName);
    const folderPath = path.join(PROJECTS_DIR, slug);
    const projectJsonPath = path.join(folderPath, 'project.json');

    if (!fs.existsSync(projectJsonPath)) {
      res.status(404).json({ error: `Projekt "${slug}" nicht gefunden in /data/projects/${slug}` });
      return;
    }

    const raw = await fsPromises.readFile(projectJsonPath, 'utf-8');
    const projectData = JSON.parse(raw);

    res.json({
      success: true,
      project: projectData,
      folderPath: `/data/projects/${slug}`,
    });
  } catch (err: any) {
    console.error('Error loading project:', err);
    res.status(500).json({ error: `Fehler beim Laden des Projekts: ${err.message}` });
  }
});

// 3. Create a new project directory
app.post('/api/projects/create', async (req: Request, res: Response) => {
  try {
    const { name, title, description, templateData } = req.body;
    const projectTitle = title || name || 'Neues Projekt';
    const slug = sanitizeProjectSlug(name || title || `projekt_${Date.now()}`);
    const folderPath = path.join(PROJECTS_DIR, slug);
    const refDir = path.join(folderPath, 'references');
    const promptsDir = path.join(folderPath, 'prompts');

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    if (!fs.existsSync(refDir)) fs.mkdirSync(refDir, { recursive: true });
    if (!fs.existsSync(promptsDir)) fs.mkdirSync(promptsDir, { recursive: true });

    const initialData = {
      id: slug,
      name: projectTitle,
      title: projectTitle,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      windowCount: 4,
      windowDurationSeconds: 14,
      dialogueLanguage: 'German',
      aspectRatio: '16:9',
      genre: 'Architektur & Lifestyle (Immobilien)',
      targetAudienceId: 'standard',
      globalWeather: 'Warmes Nachmittagslicht & goldene Stunde',
      globalBackground: 'Moderne Architektur in natürlicher Umgebung',
      globalMusic: 'Cinematic Ambient Soundtrack',
      globalSoundDesign: 'Subtile Raumakustik & sanftes Windrauschen',
      finalCallToAction: '',
      references: [],
      windows: [],
      ...(templateData || {}),
    };

    const projectJsonPath = path.join(folderPath, 'project.json');
    await fsPromises.writeFile(projectJsonPath, JSON.stringify(initialData, null, 2), 'utf-8');

    // Create initial prompt files
    const promptTxt = formatSingleLinePromptsText(projectTitle, initialData.windows, initialData.references, initialData.globalWeather, initialData.globalMusic);
    await fsPromises.writeFile(path.join(promptsDir, 'windows_single_line.txt'), promptTxt, 'utf-8');

    res.json({
      success: true,
      project: initialData,
      slug,
      folderPath: `/data/projects/${slug}`,
      message: `Projekt "${projectTitle}" erfolgreich in /data/projects/${slug} angelegt!`,
    });
  } catch (err: any) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: `Fehler beim Erstellen des Projekts: ${err.message}` });
  }
});

// 4. Save/Update a project directory (saves project.json, image files in references/, single-line prompts in prompts/)
app.post('/api/projects/save', async (req: Request, res: Response) => {
  try {
    const { projectName, title, projectData } = req.body;
    if (!projectData) {
      res.status(400).json({ error: 'Projektdaten (projectData) erforderlich.' });
      return;
    }

    const rawName = projectName || projectData.projectName || title || projectData.title || 'Drehbuch_Projekt';
    const slug = sanitizeProjectSlug(rawName);
    const folderPath = path.join(PROJECTS_DIR, slug);
    const refDir = path.join(folderPath, 'references');
    const promptsDir = path.join(folderPath, 'prompts');

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    if (!fs.existsSync(refDir)) fs.mkdirSync(refDir, { recursive: true });
    if (!fs.existsSync(promptsDir)) fs.mkdirSync(promptsDir, { recursive: true });

    // Process references: Save DataURLs as binary image files into references/
    const processedReferences = await Promise.all(
      (projectData.references || projectData.subjects || []).map(async (ref: any, idx: number) => {
        const item = { ...ref };
        const cleanRefName = (item.name || `ref_${idx + 1}`).toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
        
        if (item.photoUrl && item.photoUrl.startsWith('data:image/')) {
          try {
            const matches = item.photoUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (matches && matches[2]) {
              let ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              if (ext.includes('svg')) ext = 'svg';
              const imageFileName = `ref_${item.referenceIndex || idx + 1}_${cleanRefName}.${ext}`;
              const imageFilePath = path.join(refDir, imageFileName);
              const buffer = Buffer.from(matches[2], 'base64');
              await fsPromises.writeFile(imageFilePath, buffer);
              item.localFile = imageFileName;
              item.localUrl = `/data/projects/${slug}/references/${imageFileName}`;
            }
          } catch (imgErr) {
            console.error(`Error saving image for ref ${cleanRefName}:`, imgErr);
          }
        }
        return item;
      })
    );

    const projectTitle = title || projectData.title || rawName;
    const fullProjectJson = {
      ...projectData,
      id: slug,
      projectName: slug,
      title: projectTitle,
      references: processedReferences,
      subjects: processedReferences,
      updatedAt: new Date().toISOString(),
      createdAt: projectData.createdAt || new Date().toISOString(),
      folderPath: `/data/projects/${slug}`,
    };

    // Save project.json
    const projectJsonPath = path.join(folderPath, 'project.json');
    await fsPromises.writeFile(projectJsonPath, JSON.stringify(fullProjectJson, null, 2), 'utf-8');

    // Save references_catalog.json
    const refCatalogPath = path.join(refDir, 'references_catalog.json');
    await fsPromises.writeFile(refCatalogPath, JSON.stringify(processedReferences, null, 2), 'utf-8');

    // Generate and save prompts/windows_single_line.txt
    const singleLineTxt = formatSingleLinePromptsText(
      projectTitle,
      projectData.pressedWindows || projectData.windows || [],
      processedReferences,
      projectData.globalWeather,
      projectData.globalMusic
    );
    await fsPromises.writeFile(path.join(promptsDir, 'windows_single_line.txt'), singleLineTxt, 'utf-8');

    // Save detailed windows JSON
    await fsPromises.writeFile(
      path.join(promptsDir, 'windows_detailed.json'),
      JSON.stringify(projectData.windows || [], null, 2),
      'utf-8'
    );

    // Save Single-Line pressed windows JSON if present
    if (projectData.pressedWindows) {
      await fsPromises.writeFile(
        path.join(promptsDir, 'single_line_prompts.json'),
        JSON.stringify(projectData.pressedWindows, null, 2),
        'utf-8'
      );
    }

    // Save Maestro 2.1.6 bindings cheat-sheet and JSON mapping
    const maestroMappingTxt = formatMaestroSlotMappingText(projectTitle, processedReferences);
    await fsPromises.writeFile(path.join(refDir, 'maestro_slots_mapping.txt'), maestroMappingTxt, 'utf-8');
    await fsPromises.writeFile(path.join(promptsDir, 'maestro_slots_mapping.txt'), maestroMappingTxt, 'utf-8');

    const maestroBindingsData = processedReferences.map((ref: any, idx: number) => {
      const slotIdx = idx + 1;
      const cleanName = (ref.name || 'Subject').replace(/[^a-zA-Z0-9]/g, '');
      let defaultAnchor = `@Subject${slotIdx}_${cleanName}`;
      if (ref.category === 'building') defaultAnchor = `@Building${ref.referenceIndex || slotIdx}_${cleanName}`;
      if (ref.category === 'object') defaultAnchor = `@Object${ref.referenceIndex || slotIdx}_${cleanName}`;
      if (ref.category === 'logo') defaultAnchor = `@Logo${ref.referenceIndex || 1}_Wasserzeichen_BottomRight`;

      return {
        slotIndex: slotIdx,
        category: ref.category || 'human',
        promptTag: ref.tag || `<Subject ${slotIdx}>`,
        maestroLabel: ref.charTag?.startsWith('@') ? ref.charTag : defaultAnchor,
        name: ref.name,
        roleOrAction: ref.roleOrAction,
        roleOrActionEn: ref.roleOrActionEn,
        relationship: ref.relationship,
        localFile: ref.localFile,
        distinguishingMarks: ref.distinguishingMarks,
      };
    });

    await fsPromises.writeFile(
      path.join(refDir, 'maestro_2_1_6_bindings.json'),
      JSON.stringify(maestroBindingsData, null, 2),
      'utf-8'
    );
    await fsPromises.writeFile(
      path.join(promptsDir, 'maestro_2_1_6_bindings.json'),
      JSON.stringify(maestroBindingsData, null, 2),
      'utf-8'
    );

    res.json({
      success: true,
      slug,
      folderPath: `/data/projects/${slug}`,
      project: fullProjectJson,
      message: `Projekt "${projectTitle}" erfolgreich im Unterordner "/data/projects/${slug}/" mit Referenzen und Prompts gespeichert!`,
    });
  } catch (err: any) {
    console.error('Error saving project to disk:', err);
    res.status(500).json({ error: `Fehler beim Speichern des Projekts: ${err.message}` });
  }
});

// 5. Delete a project directory
app.delete('/api/projects/delete/:projectName', async (req: Request, res: Response) => {
  try {
    const { projectName } = req.params;
    const slug = sanitizeProjectSlug(projectName);
    const folderPath = path.join(PROJECTS_DIR, slug);

    if (fs.existsSync(folderPath)) {
      await fsPromises.rm(folderPath, { recursive: true, force: true });
    }

    res.json({
      success: true,
      message: `Projektordner "/data/projects/${slug}" erfolgreich gelöscht.`,
    });
  } catch (err: any) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: `Fehler beim Löschen des Projekts: ${err.message}` });
  }
});

// 6. Serve / download project files
app.get('/api/projects/files/:projectName/:folder/:filename', async (req: Request, res: Response) => {
  try {
    const { projectName, folder, filename } = req.params;
    const slug = sanitizeProjectSlug(projectName);
    const safeFolder = folder.replace(/[^a-zA-Z0-9_\-]/g, '');
    const safeFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const filePath = path.join(PROJECTS_DIR, slug, safeFolder, safeFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Datei nicht gefunden.' });
      return;
    }

    res.sendFile(filePath);
  } catch (err: any) {
    console.error('Error serving project file:', err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------
// Legacy / Quick Prompts Endpoints (/api/prompts) for backwards compatibility
// --------------------------------------------------------

// List all saved JSON prompt files
app.get('/api/prompts/list', async (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(PROMPTS_DIR)) {
      res.json({ success: true, files: [] });
      return;
    }
    const files = await fsPromises.readdir(PROMPTS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const list = await Promise.all(
      jsonFiles.map(async (filename) => {
        try {
          const filePath = path.join(PROMPTS_DIR, filename);
          const raw = await fsPromises.readFile(filePath, 'utf-8');
          const data = JSON.parse(raw);
          return {
            id: data.id || filename.replace('.json', ''),
            filename,
            title: data.title || filename.replace('.json', ''),
            description: data.description || '',
            createdAt: data.createdAt || new Date().toISOString(),
            windowCount: data.windowCount || data.windows?.length || 4,
            targetAudienceId: data.targetAudienceId || 'standard',
            aspectRatio: data.aspectRatio || '16:9',
            referencesCount: data.references?.length || 0,
            tags: data.tags || [],
          };
        } catch {
          return {
            id: filename.replace('.json', ''),
            filename,
            title: filename.replace('.json', ''),
            createdAt: new Date().toISOString(),
            windowCount: 4,
          };
        }
      })
    );

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, files: list });
  } catch (err: any) {
    console.error('Error listing saved prompts:', err);
    res.status(500).json({ error: `Fehler beim Laden des Prompt-Archivs: ${err.message}` });
  }
});

// Load a specific saved JSON prompt
app.get('/api/prompts/load/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sanitizedId = id.replace(/[^a-zA-Z0-9_\-]/g, '');
    const filePath = path.join(PROMPTS_DIR, `${sanitizedId}.json`);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: `Projekt "${sanitizedId}.json" nicht gefunden.` });
      return;
    }

    const raw = await fsPromises.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    res.json({ success: true, project: data });
  } catch (err: any) {
    console.error('Error loading prompt file:', err);
    res.status(500).json({ error: `Fehler beim Laden: ${err.message}` });
  }
});

// Save a screenplay project / prompt package to disk
app.post('/api/prompts/save', async (req: Request, res: Response) => {
  try {
    const { id, title, projectData } = req.body;
    if (!projectData) {
      res.status(400).json({ error: 'Projektdaten erforderlich.' });
      return;
    }

    const safeTitle = (title || projectData.title || 'Drehbuch')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 40);
    const fileId = id || `${safeTitle}_${Date.now()}`;
    const sanitizedId = fileId.replace(/[^a-zA-Z0-9_\-]/g, '');
    const filename = `${sanitizedId}.json`;
    const filePath = path.join(PROMPTS_DIR, filename);

    const fullPayload = {
      ...projectData,
      id: sanitizedId,
      title: title || projectData.title || 'Unbenanntes Drehbuch',
      updatedAt: new Date().toISOString(),
      createdAt: projectData.createdAt || new Date().toISOString(),
    };

    await fsPromises.writeFile(filePath, JSON.stringify(fullPayload, null, 2), 'utf-8');

    res.json({
      success: true,
      id: sanitizedId,
      filename,
      filePath: `/data/saved_prompts/${filename}`,
      message: `Erfolgreich als "${filename}" auf der Festplatte gespeichert!`,
    });
  } catch (err: any) {
    console.error('Error saving prompt file:', err);
    res.status(500).json({ error: `Fehler beim Speichern auf Festplatte: ${err.message}` });
  }
});

// Delete a saved prompt file
app.delete('/api/prompts/delete/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sanitizedId = id.replace(/[^a-zA-Z0-9_\-]/g, '');
    const filePath = path.join(PROMPTS_DIR, `${sanitizedId}.json`);

    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
    }

    res.json({ success: true, message: `Datei "${sanitizedId}.json" gelöscht.` });
  } catch (err: any) {
    console.error('Error deleting prompt file:', err);
    res.status(500).json({ error: `Fehler beim Löschen: ${err.message}` });
  }
});


// ==========================================
// 9. Batch Reference Image Analyzer (up to 8 images) with exact Maestro Binding Tags
// ==========================================
app.post('/api/screenplay/batch-analyze-references', async (req: Request, res: Response) => {
  try {
    const { images, endpoint, modelName, apiKey } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      res.status(400).json({ error: 'Keine Bilder übergeben.' });
      return;
    }

    // Process each image and extract precise categorization + Maestro binding tags
    const processedReferences = images.map((img: any, idx: number) => {
      const originalName = img.name || `Referenzbild_${idx + 1}`;
      const lower = (originalName + ' ' + (img.category || '')).toLowerCase();

      let detectedCat: 'human' | 'building' | 'object' | 'logo' | 'animal' | 'environment' = 'human';
      if (lower.includes('logo') || lower.includes('wasserzeichen') || lower.includes('brand') || lower.includes('ci') || lower.includes('signet') || lower.includes('icon')) {
        detectedCat = 'logo';
      } else if (lower.includes('haus') || lower.includes('villa') || lower.includes('gebäude') || lower.includes('fassade') || lower.includes('architektur') || lower.includes('building') || lower.includes('home') || lower.includes('flachdach') || lower.includes('musterhaus')) {
        detectedCat = 'building';
      } else if (lower.includes('hund') || lower.includes('dog') || lower.includes('katze') || lower.includes('tier') || lower.includes('animal') || lower.includes('pet')) {
        detectedCat = 'animal';
      } else if (lower.includes('garten') || lower.includes('wald') || lower.includes('terrasse') || lower.includes('himmel') || lower.includes('natur') || lower.includes('pool')) {
        detectedCat = 'environment';
      } else if (lower.includes('schlüssel') || lower.includes('panel') || lower.includes('tür') || lower.includes('stuhl') || lower.includes('prop') || lower.includes('tasse') || lower.includes('auto') || lower.includes('car') || lower.includes('ipad')) {
        detectedCat = 'object';
      } else {
        detectedCat = 'human';
      }

      // Generate precise Maestro Binding Names & Tags
      const humanCount = idx + 1;
      let maestroTag = `<Subject ${idx + 1}>`;
      let maestroBindingName = `@Subject${humanCount}_${originalName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      let charTag = `char Protagonist_${idx + 1}`;
      let roleOrAction = 'Erkundet die Räume und Materialien im Filmablauf';
      let relationship = 'Hauptakteur im Film';
      let watermarkRule = '';

      if (detectedCat === 'logo') {
        maestroTag = `<Logo 1>`;
        maestroBindingName = `@Logo1_Wasserzeichen_BottomRight`;
        charTag = `logo Firmenwasserzeichen`;
        roleOrAction = 'Dezentes, semi-transparentes Wasserzeichen (25% Deckkraft)';
        relationship = 'Markenidentität (CI) über alle Szenen';
        watermarkRule = 'IMMER rechts unten, dezent & 25% transparent';
      } else if (detectedCat === 'building') {
        maestroTag = `<Building 1>`;
        maestroBindingName = `@Building1_${originalName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        charTag = `building Hauptarchitektur`;
        roleOrAction = 'Architektonisches Hauptmotiv & räumliche Kulisse';
        relationship = 'Zentrum aller Kamerafahrten';
      } else if (detectedCat === 'object') {
        maestroTag = `<Object ${idx + 1}>`;
        maestroBindingName = `@Object${idx + 1}_${originalName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        charTag = `prop Requisite_${idx + 1}`;
        roleOrAction = 'Haptisches Detail für 100mm Macro-Closeups';
        relationship = 'Wichtige Requisite für die Protagonisten';
      } else if (detectedCat === 'animal') {
        maestroTag = `<Animal 1>`;
        maestroBindingName = `@Animal1_${originalName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        charTag = `animal Begleiter`;
        roleOrAction = 'Läuft entspannt durch den Garten auf die Holzterrasse';
        relationship = 'Familienbegleiter von Subject 1';
      } else if (detectedCat === 'environment') {
        maestroTag = `<Env 1>`;
        maestroBindingName = `@Env1_${originalName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        charTag = `env Kulisse`;
        roleOrAction = 'Landschaftlicher Rahmen mit Tageslichtführung';
        relationship = 'Grundstück & Umgebung';
      }

      return {
        id: `ref-auto-${Date.now()}-${idx}`,
        originalImageName: originalName,
        photoUrl: img.dataUrl,
        category: detectedCat,
        referenceIndex: idx + 1,
        name: originalName.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' '),
        tag: maestroTag,
        charTag,
        maestroBindingName,
        maestroSyntaxExample: detectedCat === 'logo'
          ? `[Maestro Video Binding]: Verwende "${maestroBindingName}" als Wasserzeichen-Ebene mit Verankerung [Bottom-Right, Opacity 0.25]`
          : `[Maestro Video Binding]: Binde Bild als "${maestroBindingName}" ein und referenziere im Prompt mit "${maestroTag}"`,
        watermarkRule,
        roleOrAction,
        relationship,
        hairOrMaterial: detectedCat === 'building' ? 'Edler Strukturputz & vertikale Naturholz-Lamellen' : detectedCat === 'human' ? 'Gepflegtes Naturhaar im natürlichen Tageslicht' : 'Hochwertige Materialität',
        eyesOrGlazing: detectedCat === 'building' ? 'Dreifach-Isolierglas mit schlanken Rahmen' : detectedCat === 'human' ? 'Aufmerksamer, entspannter Blick' : '',
        clothingOrFinish: detectedCat === 'human' ? 'Hochwertige legere Leinenkleidung in Erdtönen' : detectedCat === 'building' ? 'Integrierte Photovoltaik & Holzterrasse' : '',
        distinguishingMarks: detectedCat === 'logo' ? 'Transparenter Hintergrund (PNG/SVG), nie bildmittig' : 'Keine störenden Accessoires, maximale visuelle Ruhe',
        isActiveInProject: true,
      };
    });

    res.json({
      success: true,
      count: processedReferences.length,
      references: processedReferences,
      maestroGuide: {
        summary: 'Alle Referenzen wurden präzise kategorisiert und mit verbindlichen Maestro-Identitäts-Tags ausgestattet.',
        logoRule: 'Firmenlogos werden IMMER rechts unten mit 25% Deckkraft als permanentes dezentes Wasserzeichen gerendert.',
        syntaxConvention: 'Maestro-Syntax: Binde die Bilder unter @TagName ein und nutze <Tag> in den Prompt-Zeilen.',
      },
    });
  } catch (err: any) {
    console.error('Error in batch analyze references:', err);
    res.status(500).json({ error: `Multi-Bild Analysefehler: ${err.message}` });
  }
});

// ==========================================
// 10. AI Camera Director (Camführung Optimierer)
// ==========================================
app.post('/api/screenplay/suggest-camera-movements', async (req: Request, res: Response) => {
  try {
    const { windowCount = 4, targetAudienceName, focusDetails } = req.body;

    const defaultCameraSet = [
      {
        windowNumber: 1,
        cameraMovement: 'Cinematic FPV Drohnenflug: Sanfter Sinkflug aus 20m Höhe mit weichem Anflug auf die Eingangsfassade und Horizontausgleich',
        lens: '24mm Ultra-Wide Cine, T2.0',
        pacing: 'Dynamisch-fließend',
        cinematicIntent: 'Etabliert Grundstück, Baukörper & erzeugt sofortige Neugier',
      },
      {
        windowNumber: 2,
        cameraMovement: 'Low-Angle Architectural Slider-Dolly 30cm über Parkettboden, gleitend auf die Holzschiebetür zu',
        lens: '35mm Anamorphic Master Prime, T1.8',
        pacing: 'Ruhig & haptisch',
        cinematicIntent: 'Betont Materialstärke, Sockel und die handwerkliche Wertarbeit',
      },
      {
        windowNumber: 3,
        cameraMovement: 'Flüssiger 35mm Steadicam-Walkthrough auf Augenhöhe (1,65m) durch den offenen Wohnraum zur Gartenverglasung',
        lens: '35mm Master Prime, T1.5',
        pacing: 'Gleitend & immersiv',
        cinematicIntent: 'Macht das Raumgefühl und die fließenden Lichtachsen spürbar',
      },
      {
        windowNumber: 4,
        cameraMovement: 'Vertikaler Jib-Crane Aufzug von der beleuchteten Holzterrasse nach oben, sanfter Rückflug in die goldene Dämmerung',
        lens: '50mm Cinema Prime, T1.4',
        pacing: 'Getragen & majestätisch',
        cinematicIntent: 'Episches Finale für den finalen Call-to-Action & Logo-Einblendung',
      },
    ];

    res.json({
      success: true,
      cameraPlan: defaultCameraSet.slice(0, windowCount),
    });
  } catch (err: any) {
    console.error('Error suggesting camera movements:', err);
    res.status(500).json({ error: err.message });
  }
});

// Vite middleware or production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
