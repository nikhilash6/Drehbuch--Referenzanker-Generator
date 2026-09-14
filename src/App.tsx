import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Language } from './utils/i18n';
import { ReferenceManager } from './components/ReferenceManager';
import { AnchorInspector } from './components/AnchorInspector';
import { DrehbuchKonfigurator } from './components/DrehbuchKonfigurator';
import { ScreenplayGenerator } from './components/ScreenplayGenerator';
import { LMStudioView } from './components/LMStudioView';
import { WorkflowDebateView } from './components/WorkflowDebateView';
import { LMStudioModal } from './components/LMStudioModal';
import {
  ReferenceImage,
  CharacterAnchorFeatures,
  LMStudioSettings,
  ScreenplayProject,
  DrehbuchKonfiguratorState,
} from './types';
import {
  INITIAL_REFERENCES,
  DEMO_PRESET_REFERENCES,
  PRESET_EXTRACTED_ANCHORS,
} from './utils/sampleData';
import { parseSingleReferenceAnalysis } from './utils/anchorParser';
import {
  DEFAULT_SUBJECT_REFERENCES,
  DEFAULT_PROPOSALS,
  pressProposalToSingleLineWindows,
} from './utils/windowPromptFormatter';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('referenzen');
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'EN' || saved === 'DE') ? saved : 'DE';
  });

  const handleToggleLanguage = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('app_language', newLang);
  };

  // Settings State: Default STRICTLY to local LM Studio
  const [settings, setSettings] = useState<LMStudioSettings>(() => {
    const saved = localStorage.getItem('lmstudio_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          activeProvider: 'lmstudio', // Always enforce LM Studio
        };
      } catch {
        // ignore
      }
    }
    return {
      endpoint: 'http://localhost:1234/v1',
      modelName: 'local-model',
      activeProvider: 'lmstudio',
      useProxy: true,
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'untested'>('untested');
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // References State (Clean start per user instruction)
  const [references, setReferences] = useState<ReferenceImage[]>(INITIAL_REFERENCES);

  // Anchors & Analysis State
  const [anchors, setAnchors] = useState<CharacterAnchorFeatures[]>(PRESET_EXTRACTED_ANCHORS);
  const [rawAnalysisText, setRawAnalysisText] = useState<string>('');
  const [isAnalyzingAny, setIsAnalyzingAny] = useState(false);

  // Drehbuchkonfigurator State (Default: 4 Windows, 14s pro Window, Single-Line Format)
  const [drehbuchKonfig, setDrehbuchKonfig] = useState<DrehbuchKonfiguratorState>(() => {
    const defaultPressed = pressProposalToSingleLineWindows({
      proposal: DEFAULT_PROPOSALS[0],
      allSubjects: DEFAULT_SUBJECT_REFERENCES,
      windowDurationSeconds: 14,
      dialogueLanguage: 'German',
      actionCode: 'ASTROCINEMAV01K2T',
      aspectRatio: '16:9',
      globalWeather: 'Sonnig & klarer blauer Himmel',
      globalBackground: 'Neubausiedlung / Grüne Wohnsiedlung mit gepflegtem Vorgarten',
      finalCallToAction: 'Jetzt Musterhaus besichtigen & Ihr Traumhaus planen',
    });

    const saved = localStorage.getItem('drehbuch_konfig_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.windowCount === 'number') {
          return {
            ...parsed,
            windowDurationSeconds: parsed.windowDurationSeconds || 14,
            dialogueLanguage: parsed.dialogueLanguage || 'German',
            actionCode: parsed.actionCode || 'ASTROCINEMAV01K2T',
            aspectRatio: parsed.aspectRatio || '16:9',
            targetAudienceId: parsed.targetAudienceId || 'oeffentlicher-dienst',
            references: Array.isArray(parsed.references) ? parsed.references : (Array.isArray(parsed.subjects) ? parsed.subjects : DEFAULT_SUBJECT_REFERENCES),
            subjects: Array.isArray(parsed.references) ? parsed.references : (Array.isArray(parsed.subjects) ? parsed.subjects : DEFAULT_SUBJECT_REFERENCES),
            proposals: parsed.proposals && parsed.proposals.length > 0 ? parsed.proposals : DEFAULT_PROPOSALS,
            selectedProposalId: parsed.selectedProposalId || DEFAULT_PROPOSALS[0].id,
            pressedWindows: parsed.pressedWindows && parsed.pressedWindows.length > 0 ? parsed.pressedWindows : defaultPressed,
          };
        }
      } catch {}
    }

    return {
      windowCount: 4,
      windowDurationSeconds: 14,
      dialogueLanguage: 'German',
      actionCode: 'ASTROCINEMAV01K2T',
      aspectRatio: '16:9',
      finalCallToAction: 'Jetzt Musterhaus besichtigen & Ihr Traumhaus planen',
      globalWeather: 'Sonnig & klarer blauer Himmel',
      globalBackground: 'Neubausiedlung / Grüne Wohnsiedlung mit gepflegtem Vorgarten',
      globalMusic: 'Cinematic Ambient (Elegante Streicher, dezente Synths, exklusiver Touch)',
      globalSoundDesign: 'Drohnensurren & sanfte Sommerwind-Brise',
      rawClaimsText: '',
      extractedClaims: [],
      stichpunkte: '',
      targetAudienceId: 'oeffentlicher-dienst',
      references: DEFAULT_SUBJECT_REFERENCES,
      subjects: DEFAULT_SUBJECT_REFERENCES,
      proposals: DEFAULT_PROPOSALS,
      selectedProposalId: DEFAULT_PROPOSALS[0].id,
      pressedWindows: defaultPressed,
      windows: [
        {
          id: 'win-1',
          windowNumber: 1,
          title: 'Window 1: Anflug & Totale',
          durationSeconds: 14,
          cameraMovement: 'Drohnenflug Orbit 360° (Gleitender Kreisflug um das Gebäude)',
          weather: 'Sonnig & klarer blauer Himmel',
          background: 'Neubausiedlung / Grüne Wohnsiedlung mit gepflegtem Vorgarten',
          musicStyle: 'Cinematic Ambient (Elegante Streicher, dezente Synths, exklusiver Touch)',
          soundDesign: 'Drohnensurren & sanfte Sommerwind-Brise',
          claim: 'Architektur, die begeistert',
          visualFocus: 'Fassade, Kubatur & Außenanlagen im Weitwinkel',
        },
        {
          id: 'win-2',
          windowNumber: 2,
          title: 'Window 2: Eingang & Materialdetails',
          durationSeconds: 14,
          cameraMovement: 'Dolly-In (Gleitende Kamerafahrt auf die Eingangstür / Fassade)',
          weather: 'Sonnig & klarer blauer Himmel',
          background: 'Neubausiedlung / Grüne Wohnsiedlung mit gepflegtem Vorgarten',
          musicStyle: 'Cinematic Ambient (Elegante Streicher, dezente Synths, exklusiver Touch)',
          soundDesign: 'Vogelgezwitscher, Wind in den Bäumen & Naturnähe',
          claim: 'Präzision bis ins letzte Detail',
          visualFocus: 'Vertikale Lärchenholz-Lamellen & anthrazitfarbene Rahmen',
        },
        {
          id: 'win-3',
          windowNumber: 3,
          title: 'Window 3: Offener Wohnraum & Lichtachsen',
          durationSeconds: 14,
          cameraMovement: 'Steadicam Walkthrough (Flüssiger Spaziergang auf Augenhöhe durch den Flur)',
          weather: 'Sonnig & klarer blauer Himmel',
          background: 'Neubausiedlung / Grüne Wohnsiedlung mit gepflegtem Vorgarten',
          musicStyle: 'Cinematic Ambient (Elegante Streicher, dezente Synths, exklusiver Touch)',
          soundDesign: 'Moderne Raumakustik, leise Schritte auf Eichenparkett, Wohlfühl-Atmo',
          claim: 'Lichtdurchflutete Raumkonzepte für Generationen',
          visualFocus: 'Galerie, offener Koch-Essbereich & Panoramaverglasung',
        },
        {
          id: 'win-4',
          windowNumber: 4,
          title: 'Window 4: Terrasse, Sunset & Outro',
          durationSeconds: 14,
          cameraMovement: 'Crane-Up (Vertikale Kranfahrt vom Vorgarten bis zum Dachfirst)',
          weather: 'Goldene Stunde / Sunset (Warme Abendsonne, lange weiche Schatten)',
          background: 'Neubausiedlung / Grüne Wohnsiedlung mit gepflegtem Vorgarten',
          musicStyle: 'Cinematic Ambient (Elegante Streicher, dezente Synths, exklusiver Touch)',
          soundDesign: 'Sanftes Wasserplätschern & Grillenzirpen',
          claim: 'Jetzt Musterhaus besichtigen & Ihr Traumhaus planen',
          visualFocus: 'Holzterrasse im warmen Abendlicht, PV-Aufdach & Übergabe',
        },
      ],
    };
  });

  // Screenplay Project State
  const [project, setProject] = useState<ScreenplayProject | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  );

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Connection tester
  const handleTestConnection = async (endpoint: string, apiKey?: string) => {
    setIsCheckingConnection(true);
    try {
      const res = await fetch('/api/lmstudio/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, apiKey }),
      });
      const data = await res.json();
      if (data.connected) {
        setConnectionStatus('connected');
        return { connected: true, message: data.message, models: data.models };
      } else {
        setConnectionStatus('error');
        return { connected: false, message: data.message };
      }
    } catch (err: any) {
      setConnectionStatus('error');
      return { connected: false, message: `Verbindungsfehler zu LM Studio: ${err.message}` };
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleSaveSettings = (newSettings: LMStudioSettings) => {
    const updated = { ...newSettings, activeProvider: 'lmstudio' as const };
    setSettings(updated);
    localStorage.setItem('lmstudio_settings', JSON.stringify(updated));
    showToast('success', `Einstellungen gespeichert: LM Studio (${updated.endpoint})`);
  };

  const handleLoadDemoPresets = () => {
    setReferences(DEMO_PRESET_REFERENCES);
    showToast('info', 'Demodaten geladen: Person, Person mit 2 Hunden & Requisite.');
  };

  // Task execution: Exclusively sent to local LM Studio via proxy
  const handleRunSingleTask = async (refId: string) => {
    const targetRef = references.find((r) => r.id === refId);
    if (!targetRef) return;

    // Set task to running
    setReferences((prev) =>
      prev.map((r) => (r.id === refId ? { ...r, taskStatus: 'running', taskError: undefined } : r))
    );

    try {
      const payload = {
        model: settings.modelName || 'local-model',
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein hochpräziser visueller Referenz- und Drehbuch-Analyst für MiniMax H3 und Maestro. Extrahiere exakte Merkmale und erstelle am Ende immer einen kompakten englischen Prompt-Anker.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: targetRef.assignedPrompt },
              {
                type: 'image_url',
                image_url: { url: targetRef.dataUrl },
              },
            ],
          },
        ],
        temperature: 0.15,
      };

      const res = await fetch('/api/lmstudio/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: settings.endpoint,
          path: '/chat/completions',
          payload,
          apiKey: settings.apiKey,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'LM Studio Anfrage fehlgeschlagen');
      }

      const data = await res.json();
      const analysisText = data.choices?.[0]?.message?.content || '';

      // Parse single reference anchor
      const { extractedAnchor, characterFeature } = parseSingleReferenceAnalysis(
        analysisText,
        targetRef.id,
        targetRef.name,
        targetRef.category
      );

      // Update reference state with extracted features
      setReferences((prev) =>
        prev.map((r) =>
          r.id === refId
            ? {
                ...r,
                taskStatus: 'completed',
                extractedAnchor,
                hairOrMaterial: characterFeature?.haarfarbe && characterFeature.haarfarbe !== '-' ? `${characterFeature.haarfarbe}${characterFeature.haarlaenge !== '-' ? `, ${characterFeature.haarlaenge}` : ''}` : r.hairOrMaterial,
                eyesOrGlazing: characterFeature?.augenfarbe && characterFeature.augenfarbe !== '-' ? characterFeature.augenfarbe : r.eyesOrGlazing,
                clothingOrFinish: extractedAnchor?.attributes['Kleidung'] || extractedAnchor?.attributes['Oberfläche / Finish'] || r.clothingOrFinish,
                distinguishingMarks: characterFeature?.besondere_merkmale && characterFeature.besondere_merkmale !== '-' ? characterFeature.besondere_merkmale : r.distinguishingMarks,
                ageRange: characterFeature?.alter_ca && characterFeature.alter_ca !== '-' ? characterFeature.alter_ca : r.ageRange,
                build: characterFeature?.koerperbau && characterFeature.koerperbau !== '-' ? characterFeature.koerperbau : r.build,
              }
            : r
        )
      );

      // Append/Update anchors collection
      if (characterFeature) {
        setAnchors((prev) => {
          const existsIdx = prev.findIndex((a) => a.name.toLowerCase() === targetRef.name.toLowerCase());
          if (existsIdx >= 0) {
            const copy = [...prev];
            copy[existsIdx] = characterFeature;
            return copy;
          }
          return [...prev, characterFeature];
        });
      }

      setRawAnalysisText((prev) =>
        prev
          ? `${prev}\n\n=== [${targetRef.name} (${targetRef.category})] ===\n${analysisText}`
          : `=== [${targetRef.name} (${targetRef.category})] ===\n${analysisText}`
      );

      showToast('success', `Task für "${targetRef.name}" über LM Studio abgeschlossen!`);
    } catch (err: any) {
      console.error(err);
      setReferences((prev) =>
        prev.map((r) =>
          r.id === refId ? { ...r, taskStatus: 'error', taskError: err.message } : r
        )
      );
      showToast('error', `Fehler bei "${targetRef.name}": ${err.message}`);
    }
  };

  // Run all reference tasks sequentially on local LM Studio
  const handleRunAllTasks = async () => {
    if (references.length === 0) return;
    setIsAnalyzingAny(true);

    try {
      for (const ref of references) {
        await handleRunSingleTask(ref.id);
      }
      showToast('success', `Alle ${references.length} Referenz-Tasks über LM Studio abgeschlossen!`);
    } finally {
      setIsAnalyzingAny(false);
    }
  };

  // Generate Screenplay exclusively using local LM Studio
  const handleGenerateScript = async (params: {
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
  }): Promise<ScreenplayProject> => {
    setIsGeneratingScript(true);
    try {
      const res = await fetch('/api/generate-screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          endpoint: settings.endpoint,
          modelName: settings.modelName,
          apiKey: settings.apiKey,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Drehbuch-Generierung in LM Studio fehlgeschlagen');
      }

      const data = await res.json();
      const screenplay: ScreenplayProject = {
        title: data.title || params.title,
        sceneGoal: params.sceneGoal,
        genre: params.genre,
        settingLocation: params.settingLocation,
        targetEngine: params.targetEngine,
        cameraStyle: params.cameraStyle,
        lightingMood: params.lightingMood,
        aspectRatio: params.aspectRatio,
        rawScript: data.fullScriptMarkdown || '',
        shots: data.shots || [],
      };

      setProject(screenplay);
      showToast('success', `Drehbuch und ${screenplay.shots.length} Shots über LM Studio generiert!`);
      return screenplay;
    } catch (err: any) {
      console.error(err);
      showToast('error', `LM Studio Fehler beim Drehbuch: ${err.message}`);
      throw err;
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleApplyToScreenplay = () => {
    setCurrentTab('drehbuch');
    showToast('success', 'Charakter-Anker im Drehbuch-Generator verankert!');
  };

  return (
    <div className="min-h-screen bg-zinc-100/60 text-zinc-900 font-sans flex antialiased selection:bg-zinc-900 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-white border-emerald-300 text-emerald-800'
                : notification.type === 'error'
                ? 'bg-white border-rose-300 text-rose-800'
                : 'bg-white border-zinc-300 text-zinc-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        referenceCount={references.length}
        anchorsCount={anchors.length}
        shotsCount={project?.shots?.length || 0}
        windowsCount={drehbuchKonfig.windowCount}
        settings={settings}
        onChangeProvider={() => {}}
        connectionStatus={connectionStatus}
        isCheckingConnection={isCheckingConnection}
        onOpenSettings={() => setIsSettingsOpen(true)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          settings={settings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onResetPresets={handleLoadDemoPresets}
          isCheckingConnection={isCheckingConnection}
          connectionStatus={connectionStatus}
          language={language}
        />

        {/* Dynamic Tab View */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {currentTab === 'referenzen' && (
            <ReferenceManager
              references={references}
              onUpdateReferences={setReferences}
              onRunSingleTask={handleRunSingleTask}
              onRunAllTasks={handleRunAllTasks}
              isAnalyzingAny={isAnalyzingAny}
              activeProvider="lmstudio"
              onProceedToAnchors={() => setCurrentTab('anker')}
              language={language}
            />
          )}

          {currentTab === 'anker' && (
            <AnchorInspector
              anchors={anchors}
              onUpdateAnchors={setAnchors}
              rawAnalysisText={rawAnalysisText}
              onApplyToScreenplay={handleApplyToScreenplay}
              language={language}
            />
          )}

          {currentTab === 'drehbuchkonfigurator' && (
            <DrehbuchKonfigurator
              config={drehbuchKonfig}
              references={references}
              onChangeConfig={(newCfg) => {
                setDrehbuchKonfig(newCfg);
                localStorage.setItem('drehbuch_konfig_state', JSON.stringify(newCfg));
              }}
              onApplyToScreenplay={(appliedCfg) => {
                setDrehbuchKonfig(appliedCfg);
                localStorage.setItem('drehbuch_konfig_state', JSON.stringify(appliedCfg));

                if (appliedCfg.pressedWindows && appliedCfg.pressedWindows.length > 0) {
                  const generatedShots = appliedCfg.pressedWindows.map((win) => ({
                    shotNumber: win.windowNumber,
                    durationSeconds: win.durationSeconds || appliedCfg.windowDurationSeconds || 14,
                    shotType: 'Widescreen 16:9',
                    cameraMove: win.cameraMove || 'Drohnenflug Orbit 360°',
                    sceneDescription: win.summary,
                    charactersInShot: win.activeSubjects,
                    injectedAnchors: win.activeSubjects.map((name) => `<Subject> ${name}`).join(', '),
                    dialogue: win.dialogueSnippet || '',
                    audioCues: win.musicAudio || 'Atmo & Music',
                    minimaxPrompt: win.singleLinePrompt,
                  }));

                  setProject({
                    title: `Single-Line Windows Drehbuch (${appliedCfg.windowCount} Windows à ${appliedCfg.windowDurationSeconds || 14}s)`,
                    sceneGoal: appliedCfg.stichpunkte || 'Architektur & Lifestyle Film mit Single-Line Prompt Format',
                    genre: 'High-End Architecture & Lifestyle',
                    settingLocation: appliedCfg.globalBackground || 'Modernes Anwesen',
                    targetEngine: 'minimax-h3',
                    cameraStyle: appliedCfg.windows?.[0]?.cameraMovement || 'Drohnenflug Orbit 360°',
                    lightingMood: appliedCfg.globalWeather || 'Sonnig & klarer blauer Himmel',
                    aspectRatio: appliedCfg.aspectRatio || '16:9',
                    rawScript: appliedCfg.pressedWindows.map((w) => w.singleLinePrompt).join('\n\n'),
                    shots: generatedShots,
                  });
                }

                setCurrentTab('drehbuch');
                showToast(
                  'success',
                  `${appliedCfg.windowCount} Windows à ${appliedCfg.windowDurationSeconds || 14}s aus dem Konfigurator in Drehbuch & Shots übertragen!`
                );
              }}
              settings={settings}
              onShowToast={showToast}
              language={language}
            />
          )}

          {currentTab === 'drehbuch' && (
            <ScreenplayGenerator
              anchors={anchors}
              drehbuchKonfig={drehbuchKonfig}
              onGenerateScript={handleGenerateScript}
              isGenerating={isGeneratingScript}
              project={project}
              language={language}
            />
          )}

          {currentTab === 'lmstudio' && (
            <LMStudioView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onTestConnection={handleTestConnection}
              connectionStatus={connectionStatus}
              isCheckingConnection={isCheckingConnection}
              language={language}
            />
          )}

          {currentTab === 'workflow' && <WorkflowDebateView language={language} />}
        </main>
      </div>

      {/* LM Studio Modal for quick access */}
      <LMStudioModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onTestConnection={handleTestConnection}
      />
    </div>
  );
}
