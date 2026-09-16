import React, { useState, useMemo, useRef } from 'react';
import {
  Compass,
  Layers,
  Sparkles,
  CheckCircle2,
  Copy,
  Film,
  Upload,
  Camera,
  MessageSquare,
  Users,
  Building2,
  FolderSync,
  FileText,
  Terminal,
  X,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  ReferenceImage,
  DrehbuchKonfig,
  FloorplanRoomStation,
  SingleLineWindow,
  LMStudioSettings,
  ConfigReference,
} from '../types';
import { TARGET_AUDIENCE_CATALOG } from '../utils/targetAudienceCatalog';
import { DEFAULT_SUBJECT_REFERENCES } from '../utils/windowPromptFormatter';
import { TimelineExportModal } from './drehbuch/TimelineExportModal';
import { ReferenceManagerSection } from './drehbuch/ReferenceManagerSection';
import { Language } from '../utils/i18n';

interface FloorplanDirectorViewProps {
  references: ReferenceImage[];
  drehbuchKonfig: DrehbuchKonfig;
  onChangeDrehbuchKonfig: (config: DrehbuchKonfig) => void;
  onApplyToDrehbuch: (config: DrehbuchKonfig) => void;
  onAddReference: (ref: ReferenceImage) => void;
  settings?: LMStudioSettings;
  connectionStatus?: 'connected' | 'error' | 'untested';
  onTestConnection?: (endpoint: string, apiKey?: string) => Promise<{ connected: boolean; message: string; models?: any[] }>;
  onSaveSettings?: (newSettings: LMStudioSettings) => void;
  language: Language;
  onShowToast: (type: 'success' | 'info' | 'error', message: string) => void;
}

// Default high-precision architectural room stations for 4 windows (56 seconds total)
const INITIAL_ROOM_STATIONS: FloorplanRoomStation[] = [
  {
    id: 'station-1',
    windowNumber: 1,
    name: 'Foyer / Haupteingang & Windfang',
    nameEn: 'Entrance Foyer & Vestibule',
    zoneType: 'entrance',
    cameraTrajectory: 'Steadicam Dolly-In (1.2 m/s) entlang der zentralen Flurachse',
    cameraTrajectoryEn: 'Steadicam slow forward dolly-in through solid wood front door into welcoming foyer',
    lensType: 'Cooke Speed Panchro 24mm T2.0 (Wide Architectural Context)',
    lightingAndAtmosphere: 'Morgendliches Streiflicht durch schmales vertikales Lichtband, matter warmer Glanz',
    lightingAndAtmosphereEn: 'Morning side-light beam through narrow vertical window slit, warm matte wood bounce',
    keyMaterialsAndFeatures: ['Eichenparkett Landhausdiele', 'Eingelassene Garderobennische', 'Deckenbündige Lichtfugen'],
    actorAction: 'Tritt mit leichtem Schritt durch die Eingangstür, schließt die Tür geräuschlos und blickt in die Weite des Hauses.',
    actorActionEn: 'Enters gracefully through entrance door, pauses to take in the spatial depth of the home',
    soundAndAcoustics: 'Sattes, sachtes Schließen der Haustür, leise Schritte auf Eiche, dezent warmer Raumhall',
    dialogueSnippet: 'Hier beginnt das Ankommen. Jeder Raum folgt einer klaren architektonischen Linie.',
    claimOrOverlay: 'RAUM FÜR ANKUNFT',
    mapCoords: { x: 22, y: 78 }, // bottom left in floorplan
    directionAngle: 45, // pointing towards center
    activeSubjects: ['<Subject 1> Bauherrin'],
  },
  {
    id: 'station-2',
    windowNumber: 2,
    name: 'Flur-Sichtachse & Treppenaufgang',
    nameEn: 'Hallway Sightline & Architectural Staircase',
    zoneType: 'hallway',
    cameraTrajectory: 'Gleitender Tracking-Shot auf Augenhöhe, vorbei an freitragenden Holzstufen mit Glasgeländer',
    cameraTrajectoryEn: 'Continuous eye-level tracking passing the cantilevered oak staircase with frameless glass balustrade',
    lensType: 'ARRI Master Prime 35mm T1.3 (Spatial Flow & Minimal Distortion)',
    lightingAndAtmosphere: 'Diffuses Tageslicht von oben durch Oberlicht-Luftraum, klare Konturen ohne Schlagschatten',
    lightingAndAtmosphereEn: 'Soft daylight wash from overhead skylight void, clean shadowless architectural lines',
    keyMaterialsAndFeatures: ['Freitragende Eichentreppe', 'Struktureller Sichtbeton', 'Schwarze Aluminium-Lichtbänder'],
    actorAction: 'Gleitet mit der Hand sanft über das Glasgeländer und wendet sich der sich öffnenden Küche zu.',
    actorActionEn: 'Fingertips gently brush along glass balustrade, turning gaze naturally towards open living space',
    soundAndAcoustics: 'Warme Klavierakkorde setzen sanft ein, samtiges Atmo-Rauschen, luftiges Raumgefühl',
    dialogueSnippet: 'Offene Sichtachsen verbinden die Ebenen zu einem harmonischen Gesamtbild.',
    claimOrOverlay: 'FLIESSENDE SICHTACHSEN',
    mapCoords: { x: 42, y: 56 }, // center transition
    directionAngle: 30, // pointing towards kitchen
    activeSubjects: ['<Subject 1> Bauherrin'],
  },
  {
    id: 'station-3',
    windowNumber: 3,
    name: 'Showküche & Essbereich mit Kochinsel',
    nameEn: 'Designer Open Kitchen Island & Dining',
    zoneType: 'kitchen',
    cameraTrajectory: 'Sanfter 180°-Halborbit um die freistehende Kochinsel mit Blick auf den Esstisch',
    cameraTrajectoryEn: 'Gentle 180-degree semi-orbit around monolithic kitchen island, revealing dining table',
    lensType: 'Leica Summilux-C 35mm T1.4 (Creamy Falloff & Texture Depth)',
    lightingAndAtmosphere: 'Warmes Tageslicht von Südseite, reflexfreie Spiegelungen auf Nero Assoluto Naturstein',
    lightingAndAtmosphereEn: 'Warm Southern daylight glancing off matte Nero Assoluto granite counter surfaces',
    keyMaterialsAndFeatures: ['Naturstein-Kochinsel mattschwarz', 'Gedämpfte grifflose Eichenfronten', 'Design-Pendelleuchten'],
    actorAction: 'Stellt eine filigrane Kaffeetasse auf der Kochinsel ab und lässt den Blick über die raumhohe Fensterfront wandern.',
    actorActionEn: 'Places a delicate ceramic coffee cup on the monolithic island, turning gaze towards the expansive terrace glass',
    soundAndAcoustics: 'Sanftes Klacken von Keramik auf Granit, dezentes Brutzeln im Hintergrund, warmer Raumklang',
    dialogueSnippet: 'Kochen und Leben gehen hier nahtlos ineinander über.',
    claimOrOverlay: 'LEBENSMITTELPUNKT',
    mapCoords: { x: 68, y: 35 }, // top right in floorplan
    directionAngle: 180, // pointing down/left towards dining
    activeSubjects: ['<Subject 1> Bauherrin', '<Subject 2> Partner'],
  },
  {
    id: 'station-4',
    windowNumber: 4,
    name: 'Wohnbereich & Panorama-Gartenterrasse',
    nameEn: 'Living Lounge & Panorama Garden Terrace',
    zoneType: 'terrace',
    cameraTrajectory: 'Fließender Push-Out durch die geöffnete bodentiefe Schiebetür auf die Holzterrasse',
    cameraTrajectoryEn: 'Smooth push-out transition through open ceiling-height sliding glass portal onto timber sun deck',
    lensType: 'Angénieux Optimo 28-76mm Zoom (Expanding Horizon Depth)',
    lightingAndAtmosphere: 'Goldene Stunde / Spätnachmittagssonne (2800K), lange weiche Schatten, warmer Schimmer',
    lightingAndAtmosphereEn: 'Golden hour late afternoon sunlight (2800K), long gentle shadows, warm outdoor glow',
    keyMaterialsAndFeatures: ['Bodentiefe 3-fach Verglasung', 'Thermo-Esche Terrassendeck', 'Bündige Schwellenlosigkeit'],
    actorAction: 'Tritt barfuß auf die sonnengewärmten Holzbohlen der Terrasse, atmet tief ein und blickt in die Natur.',
    actorActionEn: 'Steps barefoot onto the sun-warmed timber terrace boards, breathing in deeply while smiling towards garden',
    soundAndAcoustics: 'Sanfter Übergang zu leisem Wind in Baumkronen, Vogelgezwitscher, volles Crescendo der Musik',
    dialogueSnippet: 'Hier verbindet sich Architektur mit echter Lebensqualität.',
    claimOrOverlay: 'JETZT MUSTERHAUS ERLEBEN',
    mapCoords: { x: 75, y: 72 }, // bottom right
    directionAngle: 90, // pointing outward to terrace
    activeSubjects: ['<Subject 1> Bauherrin', '<Subject 2> Partner', '<Building 1> Musterhaus'],
  },
];

// Demo Floorplan SVG Data
const DEMO_FLOORPLAN_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" stroke-width="0.8"/>
    </pattern>
    <linearGradient id="terraceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.1"/>
    </linearGradient>
  </defs>

  <rect width="800" height="600" fill="#090d16" />
  <rect width="800" height="600" fill="url(#grid)" />

  <rect x="100" y="80" width="600" height="440" fill="#0f172a" stroke="#38bdf8" stroke-width="3" rx="4"/>
  
  <rect x="520" y="320" width="220" height="230" fill="url(#terraceGrad)" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,4" rx="4"/>
  <text x="630" y="440" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle" letter-spacing="2">PANORAMA-TERRASSE</text>

  <line x1="100" y1="360" x2="300" y2="360" stroke="#38bdf8" stroke-width="2" />
  <line x1="300" y1="360" x2="300" y2="520" stroke="#38bdf8" stroke-width="2" />
  <text x="200" y="450" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">FOYER &amp; WINDFANG</text>
  <text x="200" y="470" fill="#0284c7" font-family="system-ui, sans-serif" font-size="10" font-weight="700" text-anchor="middle">[W1: 00:00 - 00:14]</text>

  <rect x="160" y="515" width="50" height="10" fill="#38bdf8" rx="2" />
  <text x="185" y="540" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">HAUPTEINGANG</text>

  <rect x="290" y="240" width="120" height="90" fill="#1e293b" stroke="#64748b" stroke-width="1.5" />
  <line x1="310" y1="240" x2="310" y2="330" stroke="#475569" stroke-width="1.5" />
  <line x1="330" y1="240" x2="330" y2="330" stroke="#475569" stroke-width="1.5" />
  <line x1="350" y1="240" x2="350" y2="330" stroke="#475569" stroke-width="1.5" />
  <line x1="370" y1="240" x2="370" y2="330" stroke="#475569" stroke-width="1.5" />
  <line x1="390" y1="240" x2="390" y2="330" stroke="#475569" stroke-width="1.5" />
  <text x="350" y="225" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">FLUR &amp; TREPPENACHSE</text>
  <text x="350" y="350" fill="#0284c7" font-family="system-ui, sans-serif" font-size="10" font-weight="700" text-anchor="middle">[W2: 00:14 - 00:28]</text>

  <rect x="440" y="110" width="230" height="190" fill="#1e293b" fill-opacity="0.4" stroke="#64748b" stroke-width="1" />
  <rect x="490" y="170" width="130" height="70" fill="#0f172a" stroke="#38bdf8" stroke-width="2" rx="4" />
  <text x="555" y="210" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">KOCHINSEL</text>
  <text x="555" y="140" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">SHOWKÜCHE / ESSBEREICH</text>
  <text x="555" y="270" fill="#0284c7" font-family="system-ui, sans-serif" font-size="10" font-weight="700" text-anchor="middle">[W3: 00:28 - 00:42]</text>

  <text x="440" y="440" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">WOHNBEREICH &amp; SALON</text>
  <text x="440" y="460" fill="#0284c7" font-family="system-ui, sans-serif" font-size="10" font-weight="700" text-anchor="middle">[W4: 00:42 - 00:56]</text>
  <polygon points="410,500 430,470 450,500" fill="#ef4444" stroke="#f87171" stroke-width="1.5" />
  <text x="430" y="515" fill="#f87171" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">KAMIN</text>

  <line x1="520" y1="360" x2="700" y2="360" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
  <text x="610" y="380" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="middle">HEBE-SCHIEBETÜR (GLASFASSADE)</text>

  <g transform="translate(140, 130)">
    <circle cx="0" cy="0" r="22" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
    <polygon points="0,-18 5,0 0,-4 -5,0" fill="#38bdf8"/>
    <polygon points="0,18 5,0 0,4 -5,0" fill="#64748b"/>
    <text x="0" y="-22" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">N</text>
  </g>

  <text x="120" y="580" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">Musterhaus Avantgarde – EG Grundriss 1:100 (Architekturachsen)</text>
</svg>
`)}`;

export const FloorplanDirectorView: React.FC<FloorplanDirectorViewProps> = ({
  references,
  drehbuchKonfig,
  onChangeDrehbuchKonfig,
  onApplyToDrehbuch,
  onAddReference,
  settings,
  language,
  onShowToast,
}) => {
  // Main Navigation Tabs: 1. Grundriss-Regie | 2. Referenzen & Objekte (EXACT ReferenceManagerSection) | 3. Single-Line Windows
  const [activeMainTab, setActiveMainTab] = useState<'director' | 'references' | 'pressedView'>('director');

  // References state synchronized with DrehbuchKonfigurator
  const currentReferences: ConfigReference[] = useMemo(() => {
    if (drehbuchKonfig.references && drehbuchKonfig.references.length > 0) {
      return drehbuchKonfig.references;
    }
    if (drehbuchKonfig.subjects && drehbuchKonfig.subjects.length > 0) {
      return drehbuchKonfig.subjects;
    }
    return DEFAULT_SUBJECT_REFERENCES;
  }, [drehbuchKonfig.references, drehbuchKonfig.subjects]);

  const handleUpdateReferences = (newRefs: ConfigReference[]) => {
    onChangeDrehbuchKonfig({
      ...drehbuchKonfig,
      references: newRefs,
      subjects: newRefs,
    });
  };

  // Floorplans from app references
  const floorplanRefs = useMemo(() => {
    return references.filter(
      (r) => r.category === 'floorplan' || r.category === 'architecture'
    );
  }, [references]);

  const [selectedRefId, setSelectedRefId] = useState<string>(
    floorplanRefs[0]?.id || 'demo-floorplan'
  );
  const [stations, setStations] = useState<FloorplanRoomStation[]>(INITIAL_ROOM_STATIONS);
  const [activeStationIndex, setActiveStationIndex] = useState<number>(0);
  const [isTimelineExportOpen, setIsTimelineExportOpen] = useState<boolean>(false);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState<boolean>(false);
  const [promptMode, setPromptMode] = useState<'standard' | 'sunlight' | 'materials'>('standard');
  const [rawVLResponse, setRawVLResponse] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentAudience = useMemo(() => {
    if (drehbuchKonfig.targetAudienceCustom) return drehbuchKonfig.targetAudienceCustom;
    return (
      TARGET_AUDIENCE_CATALOG.find((a) => a.id === drehbuchKonfig.targetAudienceId) ||
      TARGET_AUDIENCE_CATALOG[1] ||
      TARGET_AUDIENCE_CATALOG[0]
    );
  }, [drehbuchKonfig.targetAudienceId, drehbuchKonfig.targetAudienceCustom]);

  // Active Floorplan image url
  const currentFloorplanUrl = useMemo(() => {
    if (selectedRefId === 'demo-floorplan') {
      return DEMO_FLOORPLAN_SVG;
    }
    const found = references.find((r) => r.id === selectedRefId);
    return found?.dataUrl || DEMO_FLOORPLAN_SVG;
  }, [selectedRefId, references]);

  // Generate strict single-line prompts for each window
  const compiledWindows: SingleLineWindow[] = useMemo(() => {
    return stations.map((st, idx) => {
      const windowNum = idx + 1;
      const startSec = (windowNum - 1) * 14;
      const endSec = windowNum * 14;
      const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const rem = s % 60;
        return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}.000`;
      };

      const activeSubjects = st.activeSubjects && st.activeSubjects.length > 0
        ? st.activeSubjects
        : ['<Subject 1> Bauherrin'];
      const subjectsStr = activeSubjects.join(', ');

      const materialsStr = st.keyMaterialsAndFeatures.join(', ');
      const dialogSnippet = st.dialogueSnippet ? ` [German Dialogue: "${st.dialogueSnippet}"]` : '';
      const ctaSnippet = st.claimOrOverlay ? ` [Overlay Claim: "${st.claimOrOverlay}"]` : '';

      // Strict single-line prompt construction: NO newline characters allowed!
      const prompt = `[${formatTime(startSec)} - ${formatTime(endSec)}] Cinematic interior architecture shot of modern luxury prefab home. [Spatial Anchor: Zone: ${st.nameEn} | Subject Anchors: ${subjectsStr} | Camera Trajectory: ${st.cameraTrajectoryEn} | Lens: ${st.lensType}]. Actor action: ${st.actorActionEn}. Architectural finishes & textures: ${materialsStr}. Lighting: ${st.lightingAndAtmosphereEn}. Atmosphere: ${st.soundAndAcoustics}.${dialogSnippet}${ctaSnippet} Photorealistic 8k render, precise spatial consistency, zero morphing, steady camera movement.`.replace(/[\r\n]+/g, ' ').trim();

      return {
        windowNumber: windowNum,
        timecodeStart: formatTime(startSec),
        timecodeEnd: formatTime(endSec),
        durationSeconds: 14,
        title: st.name,
        summary: `${st.name} – ${st.cameraTrajectory}`,
        activeSubjects: activeSubjects,
        dialogueSnippet: st.dialogueSnippet,
        cameraMove: st.cameraTrajectory,
        musicAudio: st.soundAndAcoustics,
        claimOrCta: st.claimOrOverlay,
        singleLinePrompt: prompt,
      };
    });
  }, [stations]);

  // Toggle reference inside active station
  const handleToggleSubjectInStation = (stationIdx: number, subjectTag: string) => {
    setStations((prev) => {
      const updated = [...prev];
      const targetStation = updated[stationIdx];
      if (!targetStation) return prev;

      const current = targetStation.activeSubjects || [];
      const exists = current.includes(subjectTag);
      const nextSubjects = exists
        ? current.filter((s) => s !== subjectTag)
        : [...current, subjectTag];

      updated[stationIdx] = {
        ...targetStation,
        activeSubjects: nextSubjects.length > 0 ? nextSubjects : ['<Subject 1> Bauherrin'],
      };
      return updated;
    });
  };

  // Upload a real floorplan image
  const handleUploadFloorplan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newRef: ReferenceImage = {
        id: `floorplan-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: 'floorplan',
        label: `Grundriss: ${file.name}`,
        dataUrl,
        mimeType: file.type,
        assignedPrompt: 'Architektur-Grundriss für Raumachsen-Analyse',
        taskStatus: 'idle',
      };
      onAddReference(newRef);
      setSelectedRefId(newRef.id);
      onShowToast(
        'success',
        language === 'DE'
          ? `Grundriss "${file.name}" hochgeladen und aktiviert!`
          : `Floorplan "${file.name}" uploaded and activated!`
      );
    };
    reader.readAsDataURL(file);
  };

  // Run AI Vision Analysis via LM Studio (using global LM Studio settings from Sidebar)
  const handleAnalyzeFloorplanVision = async () => {
    const activeRef = floorplanRefs.find((r) => r.id === selectedRefId);
    const payloadImage = activeRef?.dataUrl || DEMO_FLOORPLAN_SVG;

    setIsAnalyzingVision(true);
    try {
      const response = await fetch('/api/floorplan/analyze-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            dataUrl: payloadImage,
            mimeType: activeRef?.mimeType || 'image/svg+xml',
            name: activeRef?.name || 'Musterhaus-Grundriss',
          },
          provider: 'lmstudio',
          endpoint: settings?.endpoint || 'http://localhost:1234/v1',
          modelName: settings?.modelName || 'local-model',
          apiKey: settings?.apiKey,
          targetAudience: currentAudience,
          availableReferences: currentReferences.map((r, i) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            tag: r.tag || `<Subject ${i + 1}>`,
            maestroLabel: r.maestroLabel || r.name,
          })),
          promptMode,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Serverfehler (${response.status})`);
      }

      const result = await response.json();
      if (result.rawResponse) {
        setRawVLResponse(result.rawResponse);
      }

      if (result.data && Array.isArray(result.data.stations) && result.data.stations.length > 0) {
        const newStations: FloorplanRoomStation[] = result.data.stations.slice(0, 4).map((st: any, idx: number) => {
          const fallbackStation = INITIAL_ROOM_STATIONS[idx] || INITIAL_ROOM_STATIONS[0];
          return {
            id: `station-analyzed-${idx + 1}-${Date.now()}`,
            windowNumber: idx + 1,
            name: st.name || fallbackStation.name,
            nameEn: st.nameEn || fallbackStation.nameEn,
            zoneType: st.zoneType || fallbackStation.zoneType,
            cameraTrajectory: st.cameraTrajectory || fallbackStation.cameraTrajectory,
            cameraTrajectoryEn: st.cameraTrajectoryEn || fallbackStation.cameraTrajectoryEn,
            lensType: st.lensType || fallbackStation.lensType,
            lightingAndAtmosphere: st.lightingAndAtmosphere || fallbackStation.lightingAndAtmosphere,
            lightingAndAtmosphereEn: st.lightingAndAtmosphereEn || fallbackStation.lightingAndAtmosphereEn,
            keyMaterialsAndFeatures: Array.isArray(st.keyMaterialsAndFeatures) && st.keyMaterialsAndFeatures.length > 0
              ? st.keyMaterialsAndFeatures
              : fallbackStation.keyMaterialsAndFeatures,
            actorAction: st.actorAction || fallbackStation.actorAction,
            actorActionEn: st.actorActionEn || fallbackStation.actorActionEn,
            soundAndAcoustics: st.soundAndAcoustics || fallbackStation.soundAndAcoustics,
            dialogueSnippet: st.dialogueSnippet || fallbackStation.dialogueSnippet,
            claimOrOverlay: st.claimOrOverlay || fallbackStation.claimOrOverlay,
            mapCoords: st.mapCoords || fallbackStation.mapCoords,
            directionAngle: typeof st.directionAngle === 'number' ? st.directionAngle : fallbackStation.directionAngle,
            activeSubjects: Array.isArray(st.activeSubjects) && st.activeSubjects.length > 0
              ? st.activeSubjects
              : fallbackStation.activeSubjects || ['<Subject 1> Bauherrin'],
          };
        });

        setStations(newStations);
        onShowToast(
          'success',
          language === 'DE'
            ? '4 Raumstationen aus dem Grundriss via LM Studio Vision extrahiert!'
            : 'Extracted 4 room stations from blueprint via LM Studio Vision!'
        );
      } else if (result.rawResponse) {
        onShowToast('info', 'Antwort erhalten! Überprüfe die Rohdaten im VL-Inspektor.');
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      onShowToast('error', `Analysefehler: ${err.message}`);
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  // Transfer all stations & compiled single-line windows into DrehbuchKonfigurator
  const handleSyncToDrehbuch = () => {
    const updatedWindows = stations.map((st) => ({
      id: `win-${st.windowNumber}`,
      windowNumber: st.windowNumber,
      title: st.name,
      durationSeconds: 14,
      cameraMovement: st.cameraTrajectory,
      weather: st.lightingAndAtmosphere,
      background: `${st.name} (Grundriss-Achse: ${st.zoneType})`,
      musicStyle: 'Dezenter cinematografischer Kontrabass & samtige Streicher',
      soundDesign: st.soundAndAcoustics,
      dialogueText: st.dialogueSnippet || '',
      dialogueSpeaker: (st.activeSubjects && st.activeSubjects[0]) || '<Subject 1> Bauherrin',
      focalLength: st.lensType,
      aspectRatio: '16:9',
      fps: 24,
      keyElements: st.keyMaterialsAndFeatures.join(', '),
      screenplayPrompt: compiledWindows[st.windowNumber - 1]?.singleLinePrompt || '',
      charactersInShot: st.activeSubjects || ['<Subject 1> Bauherrin'],
      singleLineValid: true,
      claimOrOverlay: st.claimOrOverlay,
    }));

    const updatedConfig: DrehbuchKonfig = {
      ...drehbuchKonfig,
      windows: updatedWindows,
      pressedWindows: compiledWindows,
      targetAudienceId: currentAudience.id,
      title: drehbuchKonfig.title || 'Musterhaus Avantgarde – Grundriss-Tour',
      references: currentReferences,
      subjects: currentReferences,
    };

    onChangeDrehbuchKonfig(updatedConfig);
    onApplyToDrehbuch(updatedConfig);
    onShowToast(
      'success',
      language === 'DE'
        ? 'Alle 4 Raumstationen und Single-Line Windows ins Drehbuch übertragen!'
        : 'All 4 room stations and single-line windows applied to screenplay!'
    );
  };

  // Copy all compressed single-line windows
  const handleCopyAllPrompts = () => {
    const text = compiledWindows.map((w) => w.singleLinePrompt).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedPromptId('all');
    setTimeout(() => setCopiedPromptId(null), 2500);
    onShowToast(
      'success',
      language === 'DE'
        ? 'Alle 4 Single-Line Prompts (0 Zeilenumbrüche) kopiert!'
        : 'All 4 Single-Line prompts (0 line breaks) copied!'
    );
  };

  const activeStation = stations[activeStationIndex] || stations[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950 border border-cyan-800/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                {language === 'DE' ? 'Architektur-Kamera-Choreografie' : 'Spatial Camera Director'}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                4 Windows à 14s (56s)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                MiniMax H3 / Maestro
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              {language === 'DE' ? 'Grundriss- & Raumachsen-Routenplaner' : 'Floorplan & Spatial Camera Routes'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {language === 'DE'
                ? 'Verankern Sie 2D-Grundrisse, Projekt-Referenzen und Sichtachsen direkt in den 14s-Videoprompts. Verhindert Raum-Morphing und sorgt für nahtlose räumliche Orientierung von Foyer bis Gartenterrasse.'
                : 'Anchor 2D blueprints, project references and sightlines directly into 14s video prompts. Prevents room morphing and ensures spatial camera continuity.'}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSyncToDrehbuch}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/30 transition cursor-pointer"
            >
              <FolderSync className="w-4 h-4" />
              <span>{language === 'DE' ? 'In Drehbuch übernehmen' : 'Apply to Screenplay'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTimelineExportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="DaVinci Resolve EDL, Final Cut Pro XML, CSV"
            >
              <Film className="w-4 h-4 text-slate-950" />
              <span>{language === 'DE' ? 'Timeline-Export' : 'Timeline Export'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAllPrompts}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              {copiedPromptId === 'all' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{language === 'DE' ? 'Alle Prompts kopieren' : 'Copy All Prompts'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TOP TAB NAVIGATION: EXACT MATCH TO DREHBUCHKONFIGURATOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveMainTab('director')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeMainTab === 'director'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-300" />
              <span>1. Grundriss &amp; 4 Raumachsen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('references')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeMainTab === 'references'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-300" />
              <span>2. Referenzen &amp; Objekte ({currentReferences.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('pressedView')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeMainTab === 'pressedView'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Single-Line Windows (0 Linebreaks)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* TAB 2: REFERENCE MANAGER (EXACT SAME COMPONENT AS DREHBUCHKONFIGURATOR) */}
      {activeMainTab === 'references' && (
        <div className="space-y-6">
          <ReferenceManagerSection
            references={currentReferences}
            onUpdateReferences={handleUpdateReferences}
            appReferences={references}
            onShowToast={onShowToast}
            dialogueLanguage={drehbuchKonfig.dialogueLanguage || 'German'}
            targetAudience={currentAudience}
            projectTitle={drehbuchKonfig.title || drehbuchKonfig.projectName || 'Musterhaus Grundriss-Tour'}
            stichpunkte={drehbuchKonfig.stichpunkte}
            lmStudioEndpoint={settings?.endpoint}
            lmStudioModel={settings?.modelName}
            lmStudioApiKey={settings?.apiKey}
          />
        </div>
      )}

      {/* TAB 3: PRESSED SINGLE-LINE WINDOWS VIEW */}
      {activeMainTab === 'pressedView' && (
        <div className="space-y-6">
          {/* Format Validation Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                  <span>100% Valides Single-Line Format bestätigt</span>
                  <span className="text-[10px] font-mono bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded font-bold">
                    0 Linebreaks pro Window
                  </span>
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Jedes Window ist eine einzige, ununterbrochene Zeile inklusive Timecode, Grundriss-Station, Subjekten, Kameraführung und Akustik.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsTimelineExportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Film className="w-4 h-4 text-zinc-950" />
                <span>Timeline-Export (.edl / .fcpxml / .csv)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAllPrompts}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Alle kopieren</span>
              </button>
            </div>
          </div>

          {/* 4 Windows Cards */}
          <div className="grid grid-cols-1 gap-4">
            {compiledWindows.map((win, idx) => (
              <div
                key={win.windowNumber}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-cyan-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                      W{win.windowNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {win.title}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {win.timecodeStart} - {win.timecodeEnd} (14s)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(win.singleLinePrompt);
                      setCopiedPromptId(`w-${win.windowNumber}`);
                      setTimeout(() => setCopiedPromptId(null), 2000);
                      onShowToast('success', `Window ${win.windowNumber} kopiert!`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition"
                  >
                    {copiedPromptId === `w-${win.windowNumber}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopieren</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-cyan-300 leading-relaxed break-all select-all shadow-inner">
                  {win.singleLinePrompt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: DIRECTOR VIEW (GRUNDRISS, KAMERAPFAD & 4 RAUMACHSEN) */}
      {activeMainTab === 'director' && (
        <div className="space-y-6">
          {/* 1-Click Reference Chips Bar (Identitätsanker den Stationen zuweisen) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Referenzen &amp; Identitätsanker (Klick weist der aktiven Station W{activeStationIndex + 1} zu):</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveMainTab('references')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                In Referenzen-Manager bearbeiten &rarr;
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {currentReferences.map((ref, idx) => {
                const tag = ref.tag || `<Subject ${idx + 1}>`;
                const isAssignedToActive = (activeStation.activeSubjects || []).includes(tag);

                return (
                  <button
                    key={ref.id || idx}
                    type="button"
                    onClick={() => handleToggleSubjectInStation(activeStationIndex, tag)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isAssignedToActive
                        ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={`Klicken um ${tag} in Window ${activeStationIndex + 1} (${activeStation.name}) ein-/auszuschalten`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isAssignedToActive ? 'bg-white' : 'bg-cyan-500'}`} />
                    <span>{ref.name}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${isAssignedToActive ? 'bg-cyan-700 text-cyan-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {tag}
                    </span>
                    {isAssignedToActive && <CheckCheck className="w-3 h-3 text-cyan-200" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Grid: Left Column (Blueprint & AI Vision) / Right Column (Station & Prompt Editor) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Blueprint Map & AI Vision Trigger (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Blueprint Selector & Map Canvas Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>{language === 'DE' ? 'Aktiver Grundriss' : 'Active Blueprint'}</span>
                  </h2>
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {floorplanRefs.length > 0
                      ? `${floorplanRefs.length} Grundriss(e)`
                      : 'Standard-Vektorgrundriss'}
                  </span>
                </div>

                {/* Blueprint Selector & Upload Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRefId('demo-floorplan')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      selectedRefId === 'demo-floorplan'
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    Musterhaus EG (Vektor)
                  </button>

                  {floorplanRefs.map((fRef) => (
                    <button
                      key={fRef.id}
                      type="button"
                      onClick={() => setSelectedRefId(fRef.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer truncate max-w-[140px] ${
                        selectedRefId === fRef.id
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                      title={fRef.name}
                    >
                      {fRef.name}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-300 dark:border-slate-700"
                    title="Eigenen Grundriss hochladen (PNG/JPG/SVG/PDF)"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Upload</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleUploadFloorplan}
                    className="hidden"
                  />
                </div>

                {/* Interactive Blueprint Canvas with Clickable Station Nodes */}
                <div className="relative w-full aspect-4/3 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
                  <img
                    src={currentFloorplanUrl}
                    alt="Floorplan"
                    className="w-full h-full object-contain p-2"
                  />

                  {/* Station Pins / Camera Anchors */}
                  {stations.map((st, idx) => {
                    const isActive = activeStationIndex === idx;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveStationIndex(idx)}
                        style={{
                          left: `${st.mapCoords.x}%`,
                          top: `${st.mapCoords.y}%`,
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform cursor-pointer group ${
                          isActive ? 'scale-125 z-20' : 'scale-100 z-10 hover:scale-110'
                        }`}
                        title={`Window ${st.windowNumber}: ${st.name}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 border-white shadow-amber-500/50'
                              : 'bg-cyan-600 text-white border-cyan-300 shadow-cyan-950/50'
                          }`}
                        >
                          {st.windowNumber}
                        </div>

                        {/* Direction Arrow Needle */}
                        <div
                          style={{
                            transform: `rotate(${st.directionAngle}deg) translateY(-14px)`,
                          }}
                          className={`absolute w-1.5 h-3.5 rounded-t-full origin-bottom pointer-events-none transition-transform ${
                            isActive ? 'bg-amber-400' : 'bg-cyan-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* AI Vision Analysis Trigger (Powered by LM Studio Sidebar Connection) */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'DE' ? 'KI-Vision Grundriss-Analyse' : 'AI Vision Blueprint Analysis'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      LM Studio Engine
                    </span>
                  </div>

                  {/* Focus Mode Picker */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'standard', label: 'Standard 4-Raum', desc: 'Eingang -> Garten' },
                      { id: 'sunlight', label: 'Sonnenachsen', desc: 'Ost/West Licht' },
                      { id: 'materials', label: 'Material-Haptik', desc: 'Holz, Stein, Glas' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPromptMode(mode.id as any)}
                        className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                          promptMode === mode.id
                            ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-900 dark:text-cyan-200'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-[11px] font-bold leading-tight">{mode.label}</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{mode.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isAnalyzingVision}
                      onClick={handleAnalyzeFloorplanVision}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-900/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 text-amber-300 ${isAnalyzingVision ? 'animate-spin' : ''}`} />
                      <span>
                        {isAnalyzingVision
                          ? language === 'DE'
                            ? 'LM Studio analysiert Grundriss...'
                            : 'Analyzing floorplan...'
                          : language === 'DE'
                          ? 'Grundriss mit KI-Vision analysieren'
                          : 'Analyze Blueprint with AI Vision'}
                      </span>
                    </button>

                    {rawVLResponse && (
                      <button
                        type="button"
                        onClick={() => setIsInspectorOpen(true)}
                        className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Rohdaten / JSON-Antwort ansehen"
                      >
                        <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Log</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 4 Room Stations Editor & Prompt Generation (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Station Detail Editor */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
                {/* Station Tabs */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {stations.map((st, i) => {
                      const isCur = activeStationIndex === i;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setActiveStationIndex(i)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                            isCur
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>W{st.windowNumber}</span>
                          <span className="opacity-90">{st.name.split('/')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Edit Fields for Current Station */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'DE' ? 'Raumstation / Titel' : 'Station Name'}
                    </label>
                    <input
                      type="text"
                      value={activeStation.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStations((prev) =>
                          prev.map((s, i) => (i === activeStationIndex ? { ...s, name: val } : s))
                        );
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'DE' ? 'Objektiv & Brennweite' : 'Lens & Focal Length'}
                    </label>
                    <input
                      type="text"
                      value={activeStation.lensType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStations((prev) =>
                          prev.map((s, i) => (i === activeStationIndex ? { ...s, lensType: val } : s))
                        );
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{language === 'DE' ? 'Kamera-Trajektorie (Bewegungsvektor durch den Grundriss)' : 'Camera Trajectory'}</span>
                    </label>
                    <input
                      type="text"
                      value={activeStation.cameraTrajectory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStations((prev) =>
                          prev.map((s, i) => (i === activeStationIndex ? { ...s, cameraTrajectory: val } : s))
                        );
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'DE' ? 'Darstellerin / Handlung im Raum' : 'Actor Action in Room'}</span>
                    </label>
                    <textarea
                      rows={2}
                      value={activeStation.actorAction}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStations((prev) =>
                          prev.map((s, i) => (i === activeStationIndex ? { ...s, actorAction: val } : s))
                        );
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span>{language === 'DE' ? 'Sprechertext / Dialog (Optional)' : 'Dialogue / Voiceover'}</span>
                    </label>
                    <input
                      type="text"
                      value={activeStation.dialogueSnippet || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStations((prev) =>
                          prev.map((s, i) => (i === activeStationIndex ? { ...s, dialogueSnippet: val } : s))
                        );
                      }}
                      placeholder="z.B. Hier beginnt das Ankommen..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{language === 'DE' ? 'Typografischer Claim / Overlay' : 'Screen Claim Overlay'}</span>
                    </label>
                    <input
                      type="text"
                      value={activeStation.claimOrOverlay || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStations((prev) =>
                          prev.map((s, i) => (i === activeStationIndex ? { ...s, claimOrOverlay: val } : s))
                        );
                      }}
                      placeholder="z.B. RAUM FÜR ANKUNFT"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* "Verständliches Deutsch" Quick Summary Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === 'DE' ? 'Regie-Ablauf auf Deutsch (Verständliche Aufschlüsselung)' : 'Director Cue Sheet'}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Handlung:</strong> {activeStation.actorAction} | <strong>Kamera:</strong> {activeStation.cameraTrajectory} ({activeStation.lensType}) | <strong>Sound:</strong> {activeStation.soundAndAcoustics}
                  </p>
                </div>

                {/* Live Compressed Single-Line Prompt Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>{language === 'DE' ? 'Gepresster Single-Line Prompt (MiniMax H3 / Maestro)' : 'Compressed Single-Line Prompt'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        0 Newlines (Strikt 1 Zeile)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(compiledWindows[activeStationIndex]?.singleLinePrompt || '');
                          onShowToast(
                            'success',
                            language === 'DE'
                              ? `Single-Line Prompt für Window ${activeStation.windowNumber} kopiert!`
                              : `Single-Line prompt for Window ${activeStation.windowNumber} copied!`
                          );
                        }}
                        className="p-1 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer"
                        title="Prompt kopieren"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-cyan-300 leading-relaxed break-all select-all shadow-inner">
                    {compiledWindows[activeStationIndex]?.singleLinePrompt}
                  </div>
                </div>
              </div>

              {/* Quick Overview of all 4 Windows */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>{language === 'DE' ? 'Gesamte Raum-Routen-Übersicht (4x 14s = 56s)' : 'Full 4-Window Path Overview'}</span>
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stations.map((st, i) => (
                    <div
                      key={st.id}
                      onClick={() => setActiveStationIndex(i)}
                      className={`py-2.5 px-2 rounded-lg flex items-center justify-between gap-4 cursor-pointer transition ${
                        activeStationIndex === i
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold flex items-center justify-center">
                          {st.windowNumber}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {st.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                            {st.cameraTrajectory}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          {compiledWindows[i]?.timecodeStart} - {compiledWindows[i]?.timecodeEnd}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw VL Output Inspector Modal */}
      {isInspectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  VL-Modell Inspektor &amp; Rohdaten
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-300 bg-slate-950/80 leading-relaxed whitespace-pre-wrap select-all">
              {rawVLResponse || 'Keine Rohdaten verfügbar.'}
            </div>

            <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>LM Studio Lokal</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(rawVLResponse || '');
                  onShowToast('success', 'Rohdaten kopiert!');
                }}
                className="px-3 py-1 bg-cyan-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Kopieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Timeline Export Modal */}
      <TimelineExportModal
        isOpen={isTimelineExportOpen}
        onClose={() => setIsTimelineExportOpen(false)}
        windows={compiledWindows}
        projectTitle={drehbuchKonfig.title || 'Musterhaus_Avantgarde_Grundriss_Tour'}
        dialogueLanguage={drehbuchKonfig.dialogueLanguage || 'German'}
        genre="Architektur & Lifestyle (Immobilien)"
        aspectRatio={drehbuchKonfig.aspectRatio || '16:9'}
        targetAudienceName={currentAudience.name}
        weather="Natürliches Tageslicht mit Sonnenachsen"
        background="Musterhaus Avantgarde Grundriss"
        language={language}
        onShowToast={onShowToast}
      />
    </div>
  );
};
