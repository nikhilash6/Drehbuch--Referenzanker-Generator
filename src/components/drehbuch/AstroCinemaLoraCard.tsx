import React from 'react';
import { Sparkles, Film, ExternalLink, CheckCircle2, ShieldCheck, Sliders, Info, Zap } from 'lucide-react';
import { Language } from '../../utils/i18n';

export interface AstroCinemaLoraConfig {
  enabled: boolean;
  activationTag: string;
  recommendedWeight: string;
  addAtmosphericKeywords: boolean;
  modelUrl: string;
}

interface AstroCinemaLoraCardProps {
  enabled: boolean;
  addAtmosphericKeywords?: boolean;
  onToggle: (enabled: boolean) => void;
  onToggleKeywords?: (enabled: boolean) => void;
  language: Language;
}

export const AstroCinemaLoraCard: React.FC<AstroCinemaLoraCardProps> = ({
  enabled,
  addAtmosphericKeywords = true,
  onToggle,
  onToggleKeywords,
  language,
}) => {
  return (
    <div
      className={`rounded-2xl border transition-all p-5 shadow-xs ${
        enabled
          ? 'bg-gradient-to-br from-amber-950/90 via-zinc-900 to-zinc-950 text-white border-amber-500/40 ring-1 ring-amber-500/20'
          : 'bg-white border-zinc-200 text-zinc-800'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider flex items-center gap-1 ${
                enabled
                  ? 'bg-amber-400 text-zinc-950'
                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Cinematic Style V2 (LoRA)</span>
            </span>
            <a
              href="https://civitai.red/user/Astroburner"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                enabled
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/60 hover:bg-amber-900 hover:text-amber-200'
                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'
              }`}
            >
              MiniMax H3 &bull; Creator: Astroburner
            </a>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                enabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>{language === 'EN' ? 'Global Anti-Babble & Silence Lock' : 'Globaler Anti-Geplapper & Silence-Lock'}</span>
            </span>
          </div>

          <h3 className="text-sm font-bold flex items-center gap-2">
            <span>AstroCinema V2 Detail Enhancer &amp; Kamera-Geometrie</span>
          </h3>

          <p className={`text-xs leading-relaxed ${enabled ? 'text-zinc-300' : 'text-zinc-500'}`}>
            Aktiviert das trainierte LoRA für <strong>echte Film-Ästhetik</strong>:{' '}
            <span className={enabled ? 'text-amber-300 font-semibold' : 'font-semibold'}>
              {language === 'EN'
                ? 'Motivated lighting, organic 35mm grain, true skin translucency & Dutch/Overhead camera positions.'
                : 'Motiviertes Licht, organisches 35mm-Korn, Haut-Transluzenz, Dutch Angles & Overhead-Perspektiven.'}
            </span>{' '}
            Funktioniert nahtlos gekoppelt mit dem <strong>Silence-Lock</strong> (strikte Mundruhe für alle nicht-sprechenden Personen).
          </p>
        </div>

        {/* Master Toggle Switch */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggle(!enabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? 'bg-amber-500' : 'bg-zinc-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Content when Enabled */}
      {enabled && (
        <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3">
          {/* Activation Tag Badge & Maestro Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{language === 'EN' ? 'Trained Trigger Word' : 'Trainiertes Trigger-Wort'}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <code className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-xs font-bold border border-amber-500/30 select-all">
                  ASTROCINEMAV01K2T
                </code>
                <span className="text-[10px] text-zinc-400">Injected into Window Header</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>{language === 'EN' ? 'Maestro GUI Setting' : 'Empfohlene Maestro-Einstellung'}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-300 font-medium">
                <span>{language === 'EN' ? 'Recommended Weight:' : 'Empfohlene Stärke:'}</span>
                <span className="font-bold text-cyan-300">0.85 – 1.00</span>
              </div>
            </div>
          </div>

          {/* Sub-option: Atmospheric Keywords */}
          {onToggleKeywords && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100 transition-colors pt-1">
              <input
                type="checkbox"
                checked={addAtmosphericKeywords}
                onChange={(e) => onToggleKeywords(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500/30 w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px]">
                {language === 'EN'
                  ? 'Inject V2 lighting & texture descriptors (motivated lighting, 35mm organic grain, subtle halation, highlight rolloff)'
                  : 'V2-Licht & Texturbegriffe einstanzen (Motivated Lighting, organisches 35mm Korn, subtile Halation, Highlight-Rolloff)'}
              </span>
            </label>
          )}

          {/* Civitai Link & Anti-Babble Note */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-800/50 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {language === 'EN'
                  ? 'Guaranteed Anti-Babble across all windows: non-speaking characters remain silent with closed lips.'
                  : 'Globaler Silence-Lock aktiv: Nicht-sprechende Personen behalten geschlossene Lippen ohne Phantom-Geplapper.'}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://civitai.red/user/Astroburner"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
              >
                <span>Astroburner Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://civitai.red/models/2849726/cinematic-style-lora-detail-enhancer-for-minimax-h3"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
              >
                <span>Civitai Model Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
