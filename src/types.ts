export type ReferenceCategory =
  | 'person'
  | 'multi_subject' // e.g. Person with 2 dogs / companions
  | 'object'        // e.g. Prop, weapon, item, artifact
  | 'vehicle'       // e.g. Car, bike, spaceship
  | 'environment'   // e.g. Location, room, setting
  | 'architecture'  // e.g. Fertighaus, Fassade, Gebäude, 3D-Render
  | 'floorplan'     // e.g. Wohnungsgrundriss, Raumaufteilung, Flurachsen
  | 'style';        // e.g. Color grading, film stock, lighting

export type TaskStatus = 'idle' | 'queued' | 'running' | 'completed' | 'error';

export interface ReferenceImage {
  id: string;
  name: string;
  category: ReferenceCategory;
  dataUrl: string; // base64 data url
  mimeType: string;
  label?: string;
  assignedPrompt: string;
  taskStatus?: TaskStatus;
  taskProgress?: string;
  taskError?: string;
  extractedAnchor?: ExtractedAnchor;
}

export interface ExtractedAnchor {
  id: string;
  referenceId: string;
  name: string;
  category: ReferenceCategory;
  rawText: string;
  // Dynamic fields or structured attributes
  attributes: Record<string, string>;
  compactPromptAnchor: string; // Dense string for MiniMax H3 / Maestro injection
  secondaryEntities?: {
    name: string;
    type: 'animal' | 'person' | 'object';
    attributes: Record<string, string>;
    anchorTag: string;
  }[];
}

export interface CharacterAnchorFeatures {
  name: string;
  gesichtsform: string;
  augenfarbe: string;
  augenform: string;
  augenbrauen: string;
  nase: string;
  mund: string;
  kiefer_kinn: string;
  hautfarbe_teint: string;
  haarfarbe: string;
  haarlaenge: string;
  haarstruktur: string;
  pony: string;
  besondere_merkmale: string;
  alter_ca: string;
  koerperbau: string;
  groesse_verhaeltnis?: string;
  compactPromptAnchor: string;
  // Multi-subject support (e.g. 2 dogs)
  companionDetails?: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: ReferenceCategory;
  badge: string;
  description: string;
  prompt: string;
  keywords: string[];
}

export interface LMStudioSettings {
  endpoint: string; // default http://localhost:1234/v1
  modelName: string;
  apiKey?: string;
  activeProvider: 'lmstudio' | 'gemini';
  useProxy: boolean;
  timeoutSeconds?: number; // default 240 seconds
}

export interface ShotPrompt {
  shotNumber: number;
  durationSeconds: number;
  shotType: string;
  cameraMove: string;
  sceneDescription: string;
  charactersInShot: string[];
  injectedAnchors: string;
  dialogue?: string;
  audioCues?: string;
  minimaxPrompt: string;
}

export interface ScreenplayProject {
  title: string;
  sceneGoal: string;
  genre: string;
  settingLocation: string;
  targetEngine: 'minimax-h3' | 'maestro' | 'runway' | 'kling';
  cameraStyle: string;
  lightingMood: string;
  aspectRatio: '16:9' | '9:16' | '2.39:1';
  rawScript: string;
  shots: ShotPrompt[];
}

export type DialogueLanguage = 'German' | 'English' | 'French' | 'Spanish' | 'Italian';

export type ScreenplayReferenceCategory = 'human' | 'building' | 'object' | 'animal' | 'environment' | 'logo';

export interface TargetAudience {
  id: string;
  name: string;
  badge: string;
  ageGroup: string;
  coreValues: string;
  psychology: string;
  colorSpectrum: string; // Farbspektrum, Lichtführung
  soundAesthetic: string; // Sounddesign, Musik, Akustik
  architecturalFocus: string; // Raumaufteilung, Haptik, Smarthome, etc.
  callToActionStyle: string; // Tonalität des Calls-to-Action
  sampleCallToAction: string;
}

export interface ConfigReference {
  id: string;
  category: ScreenplayReferenceCategory; // 'human' | 'building' | 'object' | 'animal' | 'environment' | 'logo'
  referenceIndex: number; // e.g. 1 for <Subject 1>, <Building 1>, <Object 1>
  tag: string; // e.g. "<Subject 1>", "<Building 1>", "<Object 1>", "<Logo 1>"
  charTag?: string; // e.g. "char Protagonist_1", "building Musterhaus_1", "@Subject1_Bauherrin"
  maestroLabel?: string; // Exact binding label in Maestro 2.1.6 e.g. "@Subject1_Anna_Bauherrin"
  name: string; // e.g. "Bauherrin", "Musterhaus Avantgarde", "Firmenlogo"
  roleOrAction: string; // "Wer was macht" in German (e.g. "Erkundet Räume und prüft Holzoberflächen")
  roleOrActionEn?: string; // Cinematic English action description for MiniMax H3 / Maestro prompt embedding
  relationship: string; // "Wer mit wem wie zusammen gehört" (e.g. "Ehepartner von Person 2", "Hauptgebäude")
  relationshipEn?: string; // English relationship description
  gesturesAndInteractions?: string; // Specific physical actions in the house
  referenceImageId?: string;
  photoUrl?: string;
  localFile?: string; // e.g. "ref_1_bauherrin.jpg" in project references/
  localUrl?: string;
  gender?: 'female' | 'male' | 'nonbinary' | 'other';
  ageRange?: string; // e.g. "30 to 40"
  build?: string; // e.g. "slim", "athletic", "2-geschossiger Flachdachkubus"
  hairOrMaterial?: string; // e.g. "dunkelbraunes schulterlanges Haar" or "Weißer Edelsplit-Putz & Eichenholzlamellen"
  eyesOrGlazing?: string; // e.g. "braune Augen" or "Dreifach-Isolierglas mit Aluminium-Schlankrahmen"
  clothingOrFinish?: string; // e.g. "schlichtes Leinenhemd" or "Photovoltaik-Flachdach mit Zinkverblechung"
  distinguishingMarks?: string; // e.g. "schmucklos" or "IMMER rechts unten, dezent & transparent (25% Deckkraft)"
  isActiveInProject?: boolean;
}

// Backward compatibility alias: SubjectReference can be used wherever ConfigReference is used
export type SubjectReference = ConfigReference;

export interface SingleLineWindow {
  windowNumber: number;
  timecodeStart: string; // "00:00.000"
  timecodeEnd: string; // "00:14.000"
  durationSeconds: number; // 14
  singleLinePrompt: string; // Strictly 1 line without \n!
  title: string;
  summary: string;
  activeSubjects: string[];
  activeReferences?: string[];
  dialogueSnippet?: string;
  extremeCloseups?: string[];
  cameraMove?: string;
  musicAudio?: string;
  claimOrCta?: string;
}

export type ClaimFontStyle = 'blockschrift' | 'handschrift' | 'serif' | 'condensed_bold';
export type ClaimAnimation = 'blur_reveal' | 'fade_in' | 'typewriter' | 'hard_cut';
export type ClaimPlacement = 'lower_third' | 'center' | 'top_third' | 'lower_right';

export interface WindowClaimTypography {
  fontStyle: ClaimFontStyle; // 'blockschrift' (Modern Sans) | 'handschrift' (Cursive Script) | 'serif' (Editorial Serif) | 'condensed_bold' (Poster Bold)
  animation: ClaimAnimation; // 'blur_reveal' | 'fade_in' | 'typewriter' | 'hard_cut'
  placement: ClaimPlacement; // 'lower_third' | 'center' | 'top_third' | 'lower_right'
  hasCursiveAccent?: boolean; // Handschriftlicher Akzent-Zusatz (z.B. geschwungener Untertitel)
  cursiveNote?: string; // z.B. "Exklusiv reservieren" / "Handcrafted" / "Seit 1994"
}

export interface ConceptProposalWindow {
  windowNumber: number;
  title: string;
  actionDescription: string;
  cameraMovement: string;
  dialogueSnippet?: string;
  dialogueSpeaker?: string;
  focus: string;
  claimOrCta?: string;
  claimTypography?: WindowClaimTypography;
  soundDesign?: string;
  musicStyle?: string;
}

export interface ConceptProposal {
  id: string;
  title: string;
  tagline: string;
  descriptionForLayperson: string; // Simple, layperson explanation
  dramaturgyHighlights: string[]; // 3-4 simple bullet points
  toneAndStyle: string; // e.g. "Warm, emotional, hochwertig"
  dialogueLanguage: DialogueLanguage;
  callToAction: string; // e.g. "Jetzt Musterhaus besichtigen"
  callToActionTypography?: WindowClaimTypography;
  windowBreakdown: ConceptProposalWindow[];
}

export interface WindowConfig {
  id: string;
  windowNumber: number;
  title: string;
  durationSeconds: number;
  cameraMovement: string;
  weather: string;
  background: string;
  musicStyle: string;
  soundDesign: string;
  claim: string;
  visualFocus: string;
  dialogueSpeaker?: string;
  dialogueText?: string;
  activeSubjectIndices?: number[];
}

export interface ExtractedClaimItem {
  id: string;
  text: string;
  targetWindow?: number;
  hookType?: string;
}

export interface TypographyOverlayConfig {
  enabled: boolean;
  // Hook / Opening (Window 1)
  openingMainLine?: string; // Blockschrift / Geometric Sans (All-Caps or bold)
  openingSubLine?: string; // Elegante Schreibschrift / Cursive Script / Subline
  openingPosition?: 'upper_third' | 'center' | 'lower_third';
  openingAccentRule?: boolean; // Fine accent line / rule

  // Ausblick-Text / Teaser Claim (Middle Windows)
  teaserClaim?: string; // Ausblick-Text / Zwischeneinblendung
  teaserPosition?: 'lower_right' | 'lower_left' | 'center' | 'upper_third';
  teaserStyle?: 'soft_handwritten' | 'refined_geometric' | 'italic_sans';

  // Outro / Final Brand & Action (Final Window)
  closingBrandName?: string; // Brand / Project name in geometric block
  closingCallout?: string; // Callout in Schreibschrift / Cursive (e.g. Jetzt entdecken)
  closingPosition?: 'exact_center' | 'lower_third';
  closingAccentBar?: boolean; // Solid accent bar / subtle pulse

  // Overall visual presentation
  textureLook?: 'heavy_matte' | 'clean_digital' | 'cinematic_minimal';
  muteVoiceover?: boolean; // No spoken words. Pure silent ambience and music.
}

export interface DrehbuchKonfiguratorState {
  title?: string;
  windowCount: number;
  windowDurationSeconds: number; // default: 14s
  dialogueLanguage: DialogueLanguage; // default: 'German'
  actionCode: string; // default: 'ASTROCINEMAV01K2T'
  aspectRatio: '16:9' | '9:16' | '2.39:1';
  genre?: string;
  targetAudienceId: string; // ID of selected target audience
  targetAudienceCustom?: TargetAudience;
  customTargetAudiences?: TargetAudience[];
  globalMusic: string;
  globalSoundDesign: string;
  globalWeather: string;
  globalBackground: string;
  finalCallToAction: string;
  rawClaimsText: string;
  stichpunkte: string;
  extractedClaims: ExtractedClaimItem[];
  windows: WindowConfig[];
  references: ConfigReference[];
  subjects: ConfigReference[]; // Alias/synced with references for compatibility
  proposals: ConceptProposal[];
  selectedProposalId: string | null;
  pressedWindows: SingleLineWindow[] | null;
  projectName?: string; // current active project folder name in /data/projects/{projectName}
  projectId?: string;
  typographyOverlay?: TypographyOverlayConfig;
  darkRetributionDisclaimerAccepted?: boolean;
  ultraPhysicsMode?: boolean; // Ultra-Detail Kausalitätskette, Muskelkontraktion, Subsurface-Gegenlicht & Haptik
}

export type DrehbuchKonfig = DrehbuchKonfiguratorState;

export interface ScreenplayProjectMetadata {
  id: string; // folder name in /data/projects/{id}
  name: string; // display name
  title: string;
  description?: string;
  folderPath: string; // e.g. "/data/projects/musterhaus_alpenblick"
  createdAt: string;
  updatedAt: string;
  windowCount: number;
  referencesCount: number;
  promptsCount?: number;
  targetAudienceName?: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface FloorplanRoomStation {
  id: string;
  windowNumber: number; // 1 to 4
  name: string; // e.g. "Foyer / Haupteingang"
  nameEn: string; // e.g. "Entrance Foyer & Vestibule"
  zoneType: 'entrance' | 'hallway' | 'kitchen' | 'living' | 'terrace' | 'bedroom' | 'bathroom' | 'exterior';
  cameraTrajectory: string; // e.g. "Steadicam Dolly-In (1.2m/s) entlang der Hauptachse"
  cameraTrajectoryEn: string;
  lensType: string; // e.g. "Cooke Speed Panchro 24mm T2.0 (Wide Architectural Context)"
  lightingAndAtmosphere: string; // e.g. "Morgensonne / Streiflicht durch bodentiefe Verglasung"
  lightingAndAtmosphereEn: string;
  keyMaterialsAndFeatures: string[]; // e.g. ["Eichenparkett Landhausdiele", "Aluminium-Schlankrahmen Anthrazit"]
  actorAction: string; // e.g. "Tritt durch die Haustür, lässt die Hand über die Wandverkleidung gleiten"
  actorActionEn: string;
  soundAndAcoustics: string; // e.g. "Leises Schließen der Haustür, samtiges Hallen im Foyer, dezent warmer Kontrabass"
  dialogueSnippet?: string;
  claimOrOverlay?: string;
  mapCoords: { x: number; y: number }; // Percentage (0 - 100%) on 2D floorplan image
  directionAngle?: number; // 0-360 degrees for sightline arrow
  activeSubjects?: string[]; // Project references active in this room station (e.g. ['<Subject 1> Bauherrin'])
}

export interface FloorplanRouteConfig {
  floorplanReferenceId?: string;
  floorplanName: string;
  floorplanImageUrl?: string;
  buildingStyle: string; // e.g. "Modernes Flachdach-Musterhaus (Bauhaus-Stil)"
  buildingStyleEn: string;
  totalFloors: string;
  stations: FloorplanRoomStation[];
}


