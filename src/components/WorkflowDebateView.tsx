import React, { useState } from 'react';
import { Sliders, Video, Camera, ShieldAlert, FileText, Check, Save } from 'lucide-react';
import { Language, t } from '../utils/i18n';

interface WorkflowDebateViewProps {
  language?: Language;
}

export const WorkflowDebateView: React.FC<WorkflowDebateViewProps> = ({ language = 'DE' }) => {
  const [notes, setNotes] = useState(() => {
    return (
      localStorage.getItem('minimax_workflow_notes') ||
      `- MiniMax H3 reagiert am stärksten auf frühe Substantive im Prompt (z.B. "Anna, 27yo, hazel almond eyes...").
- Kamera-Bewegung immer mit [Camera: ...] oder als einleitender Satz formulieren.
- Brille und Muttermal bei Susi müssen zwingend in jedem Shot wiederholt werden.
- Maestro Batch-Runner: Shots 1 bis 4 nacheinander mit Seed-Locking testen.`
    );
  });
  const [saved, setSaved] = useState(false);

  const handleSaveNotes = () => {
    localStorage.setItem('minimax_workflow_notes', notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl select-none">
      {/* Intro Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {t(language, 'workflow.title')}
        </span>
        <h3 className="text-base font-bold text-zinc-900 mt-1">
          {language === 'DE' ? 'Feinabstimmung & Best Practices' : 'Fine-tuning & Best Practices'}
        </h3>
        <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
          {t(language, 'workflow.subtitle')}
        </p>
      </div>

      {/* Grid of Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Anker-Gewichtung */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>1. {language === 'DE' ? 'Anker-Gewichtung in MiniMax H3' : 'Anchor Weighting in MiniMax H3'}</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {language === 'DE'
              ? 'In MiniMax H3 (Hailuo) gilt das Frontloading-Prinzip: Wesentliche Gesichtsmerkmale (Haarfarbe, Augenform, Brille) müssen zu Beginn des Subjekt-Blocks stehen.'
              : 'In MiniMax H3 (Hailuo), frontloading applies: Essential facial features (hair color, eye shape, glasses) must be placed at the start of the subject block.'}
          </p>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 font-mono text-[11px] text-zinc-800">
            [Subject: Anna, 27yo woman with defined oval face, hazel-green almond eyes, long wavy dark auburn hair]
          </div>
        </div>

        {/* Card 2: Kamera-Kommandos */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>2. {language === 'DE' ? 'Kamera-Trajektorien' : 'Camera Trajectories'}</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {language === 'DE'
              ? 'Zu schnelle Bewegungen zerstören Gesichtsanker. Bewährt haben sich langsame Dolly-Fahrten, ruhige Schwenks oder sanftes Orbiting mit fester Brennweite.'
              : 'Overly fast movements break facial anchors. Slow dolly shots, calm pans, or smooth orbiting with fixed focal lengths are recommended.'}
          </p>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 font-mono text-[11px] text-zinc-800">
            [Camera: Slow Dolly-In, shallow depth of field, 35mm lens, 24fps cinematic pacing]
          </div>
        </div>

        {/* Card 3: Maestro Multi-Shot Batching */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <Video className="w-4 h-4 text-emerald-600" />
            <span>3. {language === 'DE' ? 'Maestro Sequenzierung' : 'Maestro Sequencing'}</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {language === 'DE'
              ? 'Maestro nimmt die Shot-Liste als Batch entgegen. Jeder Shot behält den fixierten Anker als Konstante und variiert lediglich die Handlung und den Dialog.'
              : 'Maestro accepts the shot list as a batch. Each shot retains the locked anchor as a constant and only varies the action and dialogue.'}
          </p>
        </div>

        {/* Card 4: Negative Prompts */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>4. {language === 'DE' ? 'Standard-Negative für Gesichter' : 'Standard Negatives for Faces'}</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {language === 'DE'
              ? 'Empfohlene Negative Prompts zur Vermeidung von Gesichtsdeformationen:'
              : 'Recommended negative prompts to prevent facial deformation:'}
          </p>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 font-mono text-[11px] text-zinc-800">
            morphing faces, shifting features, blurry eyes, double iris, inconsistent hair color, cartoonish, low resolution
          </div>
        </div>
      </div>

      {/* Shared Notes / Scratchpad */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>{language === 'DE' ? 'Workflow-Notizen & Team-Debatte' : 'Workflow Notes & Team Debate'}</span>
          </h4>
          <button
            onClick={handleSaveNotes}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-bold text-xs rounded-lg transition cursor-pointer"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? (language === 'DE' ? 'Gespeichert!' : 'Saved!') : (language === 'DE' ? 'Notizen Speichern' : 'Save Notes')}</span>
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
          placeholder={language === 'DE' ? 'Hier Teambeschlüsse, Prompt-Optimierungen und Modell-Eigenheiten eintragen...' : 'Enter team decisions, prompt optimizations, and model behaviors here...'}
        />
      </div>
    </div>
  );
};
