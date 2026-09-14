import React, { useState } from 'react';
import {
  Film,
  Video,
  Clapperboard,
  Sparkles,
  Copy,
  Check,
  Camera,
  MessageSquare,
  Volume2,
  FileDown
} from 'lucide-react';
import { CharacterAnchorFeatures, ScreenplayProject, DrehbuchKonfiguratorState, WindowConfig } from '../types';
import { Language, t } from '../utils/i18n';

interface ScreenplayGeneratorProps {
  anchors: CharacterAnchorFeatures[];
  drehbuchKonfig?: DrehbuchKonfiguratorState;
  onGenerateScript: (params: {
    title: string;
    sceneGoal: string;
    genre: string;
    settingLocation: string;
    targetEngine: 'minimax-h3' | 'maestro' | 'runway' | 'kling';
    cameraStyle: string;
    lightingMood: string;
    aspectRatio: '16:9' | '9:16' | '2.39:1';
    shotCount: number;
    characterAnchors: CharacterAnchorFeatures[];
    windows?: WindowConfig[];
  }) => Promise<ScreenplayProject>;
  isGenerating: boolean;
  project: ScreenplayProject | null;
  language?: Language;
}

export const ScreenplayGenerator: React.FC<ScreenplayGeneratorProps> = ({
  anchors,
  drehbuchKonfig,
  onGenerateScript,
  isGenerating,
  project,
  language = 'DE',
}) => {
  // Form State
  const [title, setTitle] = useState(() =>
    drehbuchKonfig && drehbuchKonfig.windows.length > 0
      ? `Architektur & Lifestyle Film (${drehbuchKonfig.windowCount} Windows)`
      : 'Architektur- & Charakter-Szene'
  );
  const [sceneGoal, setSceneGoal] = useState(() =>
    drehbuchKonfig && drehbuchKonfig.rawClaimsText
      ? `Visualisierung der Architektur und des Raumgefühls basierend auf den Kern-Claims: ${drehbuchKonfig.extractedClaims.map((c) => `"${c.text}"`).join(', ') || drehbuchKonfig.rawClaimsText.slice(0, 150)}`
      : 'Elegante Kameraführung durch das Objekt, Fokussierung auf Licht, Material und Raumarchitektur im Einklang mit den Referenzankern.'
  );
  const [genre, setGenre] = useState('High-End Architectural & Cinematic Visual');
  const [settingLocation, setSettingLocation] = useState(() =>
    drehbuchKonfig?.globalBackground || 'Modernes Fertighaus / Designer-Wohnung mit Terrasse und Garten'
  );
  const [targetEngine, setTargetEngine] = useState<'minimax-h3' | 'maestro' | 'runway' | 'kling'>('minimax-h3');
  const [cameraStyle, setCameraStyle] = useState(() =>
    drehbuchKonfig?.windows[0]?.cameraMovement || 'Drohnenflug Orbit 360°, Steadicam Walkthrough, Cinematic 35mm'
  );
  const [lightingMood, setLightingMood] = useState(() =>
    drehbuchKonfig?.globalWeather || 'Goldene Stunde / Sunset mit warmem Gegenlicht und weichen Schatten'
  );
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '2.39:1'>('16:9');
  const [shotCount, setShotCount] = useState(() => drehbuchKonfig?.windowCount || 4);

  // Sync when drehbuchKonfig changes
  const handleLoadFromKonfigurator = () => {
    if (!drehbuchKonfig) return;
    setShotCount(drehbuchKonfig.windowCount);
    if (drehbuchKonfig.globalBackground) {
      setSettingLocation(drehbuchKonfig.globalBackground);
    }
    if (drehbuchKonfig.globalWeather) {
      setLightingMood(drehbuchKonfig.globalWeather);
    }
    if (drehbuchKonfig.windows[0]?.cameraMovement) {
      setCameraStyle(`${drehbuchKonfig.windows[0].cameraMovement} & flüssige Gimbal-Fahrten`);
    }
    if (drehbuchKonfig.extractedClaims.length > 0) {
      setSceneGoal(
        `Architekturfilm mit ${drehbuchKonfig.windowCount} Windows. Kern-Claims: ${drehbuchKonfig.extractedClaims.map((c) => `"${c.text}"`).join(', ')}`
      );
    }
  };

  // UI state
  const [copiedShotIndex, setCopiedShotIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerateScript({
      title,
      sceneGoal,
      genre,
      settingLocation,
      targetEngine,
      cameraStyle,
      lightingMood,
      aspectRatio,
      shotCount,
      characterAnchors: anchors,
      windows: drehbuchKonfig?.windows,
    });
  };

  const handleCopyShot = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedShotIndex(index);
    setTimeout(() => setCopiedShotIndex(null), 2000);
  };

  const handleCopyAllForMaestro = () => {
    if (!project) return;
    const allPrompts = project.shots
      .map(
        (s) =>
          `### SHOT ${s.shotNumber} (${s.durationSeconds}s) [${s.shotType} | ${s.cameraMove}]\nPROMPT:\n${s.minimaxPrompt}\n\nDIALOG/CUES:\n${s.dialogue || 'None'}\nAUDIO: ${s.audioCues || 'None'}`
      )
      .join('\n\n------------------------------------\n\n');
    navigator.clipboard.writeText(allPrompts);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadProject = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_drehbuch_minimax.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Konfigurator sync banner if available */}
      {/* Konfigurator sync banner if available */}
      {drehbuchKonfig && drehbuchKonfig.windows.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-950">
                {language === 'EN'
                  ? `Screenplay Configurator linked: ${drehbuchKonfig.windowCount} Windows defined`
                  : `Drehbuchkonfigurator verknüpft: ${drehbuchKonfig.windowCount} Windows definiert`}
              </p>
              <p className="text-[11px] text-indigo-700">
                {language === 'EN'
                  ? `Drone flights, weather (${drehbuchKonfig.globalWeather}), sound design, and extracted claims flow directly into shots.`
                  : `Drohnenflüge, Wetter (${drehbuchKonfig.globalWeather}), Sounddesign und extrahierte Claims fließen direkt in die Shots ein.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadFromKonfigurator}
            className="text-[11px] font-bold text-indigo-900 bg-white hover:bg-indigo-100 border border-indigo-300 px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-2xs"
          >
            {language === 'EN' ? 'Resynchronize Defaults' : 'Vorgaben neu synchronisieren'}
          </button>
        </div>
      )}

      {/* Script Generator Setup Form */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {language === 'EN' ? 'Step 3: Screenplay & Shot Generator' : 'Schritt 3: Drehbuch- & Shot-Generator'}
            </span>
            <h3 className="text-base font-bold text-zinc-900 mt-1">
              {language === 'EN' ? 'Scenes & Prompts for MiniMax H3 & Maestro' : 'Szenen & Prompts für MiniMax H3 & Maestro'}
            </h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              {language === 'EN'
                ? 'Generates a scenic screenplay with automatic injection of anchored features into every prompt.'
                : 'Generiert ein szenisches Drehbuch mit automatischer Injektion der fixierten Anker in jeden Prompt.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">
              {language === 'EN' ? 'Anchored Characters:' : 'Verankerte Charaktere:'}
            </span>
            <div className="flex items-center gap-1.5">
              {anchors.map((a) => (
                <span
                  key={a.name}
                  className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200"
                >
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                {language === 'EN' ? 'Project Title / Scene' : 'Projekttitel / Szene'}
              </label>
              <input
                type="text"
                id="input-script-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                placeholder={language === 'EN' ? 'e.g. Encounter at the Café' : 'z.B. Die Begegnung im Café'}
                required
              />
            </div>

            {/* Target Video Model */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                {language === 'EN' ? 'Target Video Model' : 'Ziel-Video-Modell'}
              </label>
              <select
                id="select-target-engine"
                value={targetEngine}
                onChange={(e) => setTargetEngine(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white cursor-pointer font-medium"
              >
                <option value="minimax-h3">MiniMax Hailuo H3 ({language === 'EN' ? 'High Character & Motion Consistency' : 'Hohe Personen- & Bewegungskonsistenz'})</option>
                <option value="maestro">Maestro ({language === 'EN' ? 'Multi-Shot Workflow & Sequencing' : 'Multi-Shot Workflow & Sequenzierung'})</option>
                <option value="kling">Kling AI (1080p Cinematic / 10s)</option>
                <option value="runway">Runway Gen-3 Alpha</option>
              </select>
            </div>
          </div>

          {/* Scene Goal */}
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1">
              {language === 'EN' ? 'Scene Goal & Plot (What happens between characters?)' : 'Szenenziel & Handlung (Was geschieht zwischen den Figuren?)'}
            </label>
            <textarea
              id="textarea-scene-goal"
              rows={3}
              value={sceneGoal}
              onChange={(e) => setSceneGoal(e.target.value)}
              className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white leading-relaxed"
              placeholder={language === 'EN' ? 'Describe action, tension, and emotion...' : 'Beschreibe die Handlung, Spannungsbögen und Emotionen...'}
              required
            />
          </div>

          {/* Location & Genre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                {language === 'EN' ? 'Location & Setting (Background Anchor)' : 'Ort & Setting (Hintergrund-Anker)'}
              </label>
              <input
                type="text"
                id="input-location"
                value={settingLocation}
                onChange={(e) => setSettingLocation(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                placeholder={language === 'EN' ? 'e.g. Café, Bar, Outdoors...' : 'z.B. Café, Bar, Außenbereich...'}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                {language === 'EN' ? 'Genre & Tonality' : 'Genre & Tonalität'}
              </label>
              <input
                type="text"
                id="input-genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                placeholder={language === 'EN' ? 'e.g. Mystery Noir, Drama, Sci-Fi...' : 'z.B. Mystery Noir, Drama, Sci-Fi...'}
              />
            </div>
          </div>

          {/* Camera Style, Lighting & Shots */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                {language === 'EN' ? 'Camera Style & Optics' : 'Kamerastil & Optik'}
              </label>
              <input
                type="text"
                id="input-camerastyle"
                value={cameraStyle}
                onChange={(e) => setCameraStyle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                placeholder={language === 'EN' ? 'e.g. Arri Alexa, Dolly In, 35mm' : 'z.B. Arri Alexa, Dolly In, 35mm'}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                {language === 'EN' ? 'Lighting & Atmosphere' : 'Licht & Atmosphäre'}
              </label>
              <input
                type="text"
                id="input-lighting"
                value={lightingMood}
                onChange={(e) => setLightingMood(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                placeholder={language === 'EN' ? 'e.g. Chiaroscuro, Edge Light...' : 'z.B. Chiaroscuro, Kantenlicht...'}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  {language === 'EN' ? 'Aspect Ratio' : 'Format'}
                </label>
                <select
                  id="select-aspect-ratio"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full px-2 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                >
                  <option value="16:9">16:9 Widescreen</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="2.39:1">2.39:1 Cinema</option>
                </select>
              </div>

              <div className="w-24">
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Shots
                </label>
                <select
                  id="select-shot-count"
                  value={shotCount}
                  onChange={(e) => setShotCount(Number(e.target.value))}
                  className="w-full px-2 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                >
                  <option value={3}>3 Shots</option>
                  <option value={4}>4 Shots</option>
                  <option value={5}>5 Shots</option>
                  <option value={6}>6 Shots</option>
                  <option value={8}>8 Shots</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              id="btn-generate-screenplay"
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{language === 'EN' ? 'Generating screenplay & MiniMax shot prompts...' : 'Generiere Drehbuch & MiniMax Shot-Prompts...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'EN' ? 'Generate Screenplay & Shot Prompts Now' : 'Drehbuch & Shot-Prompts jetzt generieren'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Project Section */}
      {project && (
        <div className="space-y-4">
          {/* Top toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-zinc-200 p-4 rounded-xl shadow-xs">
            <div>
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {language === 'EN' ? 'PROJECT READY' : 'PROJEKT BEREIT'}
              </span>
              <h4 className="text-base font-bold text-zinc-900 mt-1">{project.title}</h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-copy-all-maestro"
                onClick={handleCopyAllForMaestro}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-200 transition cursor-pointer"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{language === 'EN' ? 'All Copied!' : 'Alle kopiert!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{language === 'EN' ? 'Copy All Shots for Maestro' : 'Alle Shots für Maestro kopieren'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-download-json"
                onClick={handleDownloadProject}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-200 shadow-xs transition cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-zinc-600" />
                <span>JSON Export</span>
              </button>
            </div>
          </div>

          {/* Shot Cards */}
          <div className="space-y-3">
            {project.shots.map((shot, idx) => (
              <div
                key={shot.shotNumber || idx}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs"
              >
                {/* Shot Header */}
                <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-mono text-xs font-bold">
                      SHOT #{shot.shotNumber} &bull; {shot.durationSeconds}s
                    </span>
                    <span className="text-xs font-bold text-zinc-800">
                      {shot.shotType}
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-zinc-400" />
                      {shot.cameraMove}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {shot.charactersInShot?.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200/80 text-zinc-800"
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyShot(shot.minimaxPrompt, idx)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold border border-zinc-200 transition cursor-pointer"
                      title={language === 'EN' ? 'Copy exact prompt for MiniMax H3' : 'Kopiere den exakten Prompt für MiniMax H3'}
                    >
                      {copiedShotIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">{language === 'EN' ? 'Copied' : 'Kopiert'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-500" />
                          <span>{language === 'EN' ? 'Copy Prompt' : 'Prompt kopieren'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="text-xs text-zinc-700 leading-relaxed">
                    <strong className="text-zinc-900">{language === 'EN' ? 'Scene Action: ' : 'Szenenhandlung: '}</strong>
                    {shot.sceneDescription}
                  </div>

                  {/* Dialogue & Audio */}
                  {(shot.dialogue || shot.audioCues) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      {shot.dialogue && (
                        <div className="flex items-start gap-1.5 text-zinc-700">
                          <MessageSquare className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-zinc-900">{language === 'EN' ? 'Dialogue:' : 'Dialog:'}</strong> {shot.dialogue}
                          </span>
                        </div>
                      )}
                      {shot.audioCues && (
                        <div className="flex items-start gap-1.5 text-zinc-600">
                          <Volume2 className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-zinc-900">{language === 'EN' ? 'Audio/SFX:' : 'Audio/SFX:'}</strong> {shot.audioCues}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prompt Box */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                        <Video className="w-3 h-3 text-amber-600" />
                        {language === 'EN' ? 'MiniMax H3 / Maestro Ready-Prompt (incl. Identity Anchors)' : 'MiniMax H3 / Maestro Ready-Prompt (inkl. Identitätsanker)'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {language === 'EN' ? 'Aspect Ratio' : 'Format'}: {aspectRatio}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-300 font-mono text-xs text-zinc-900 leading-relaxed">
                      {shot.minimaxPrompt}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
