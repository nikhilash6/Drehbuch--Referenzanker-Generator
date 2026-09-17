import React from 'react';
import { Sun, Sparkles, Contrast, Film, CheckCircle2 } from 'lucide-react';

export interface VisualStyleOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeStyle?: string;
}

export const VISUAL_STYLE_OPTIONS: VisualStyleOption[] = [
  {
    id: 'natural',
    name: 'Natürliches Tageslicht',
    tagline: 'Standard • Realistisch',
    description: 'Sanfte, neutrale Kontraste, realistische Farbpalette mit ausgewogener atmosphärischer Tageslicht-Ausleuchtung.',
    icon: Sun,
  },
  {
    id: 'golden_hour',
    name: 'High-End Golden Hour',
    tagline: 'Warm • Atmosphärisch',
    description: 'Warme, cinematische Lichttöne, lange Schatten, atmosphärisches Gegenlicht und feine, goldene Staub-Flares.',
    icon: Sparkles,
    badge: 'Kino-Look',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'art_noir',
    name: 'Mamiya RZ67 Art Noir',
    tagline: 'S/W • Rembrandt • Stummfilm',
    description: 'Extremer Chiaroscuro-Kontrast, tiefes Schwarz, grobes 120mm Filmkorn und vollständige Reduktion auf Graustufen. Deaktiviert Dialoge für maximale Bildkraft.',
    icon: Contrast,
    badge: 'Meisterwerk',
    badgeStyle: 'bg-zinc-800 text-zinc-100 border-zinc-700',
  },
  {
    id: 'vintage_16mm',
    name: 'Vintage 16mm Indie',
    tagline: 'Retro • Nostalgisch',
    description: 'Warmer Retro-Look, weichere Kontraste, feine Farbverschiebungen, leichtes Bildflackern und organische Vintage-Körnung.',
    icon: Film,
  },
];

interface VisualStyleCardProps {
  selectedStyleId?: string;
  onSelectStyle: (styleId: string) => void;
}

export const VisualStyleCard: React.FC<VisualStyleCardProps> = ({
  selectedStyleId = 'natural',
  onSelectStyle,
}) => {
  const currentStyle = VISUAL_STYLE_OPTIONS.find(opt => opt.id === selectedStyleId) || VISUAL_STYLE_OPTIONS[0];

  return (
    <div
      className={`rounded-2xl border transition-all p-5 shadow-xs ${
        selectedStyleId === 'art_noir'
          ? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white border-zinc-800 ring-1 ring-zinc-700/30'
          : selectedStyleId === 'golden_hour'
          ? 'bg-gradient-to-br from-amber-950/20 via-zinc-900/40 to-zinc-950 text-zinc-800 border-amber-500/20'
          : 'bg-white border-zinc-200 text-zinc-800'
      }`}
    >
      <div className="space-y-1.5 max-w-2xl mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider flex items-center gap-1 ${
              selectedStyleId === 'art_noir'
                ? 'bg-zinc-100 text-zinc-950'
                : selectedStyleId === 'golden_hour'
                ? 'bg-amber-400 text-zinc-950'
                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
            }`}
          >
            <span>Visueller Stil &amp; Filmstock</span>
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              selectedStyleId === 'art_noir'
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                : selectedStyleId === 'golden_hour'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            Bildästhetik-Ebene • Erweitert
          </span>
        </div>

        <h3 className="text-sm font-bold flex items-center gap-2">
          <span>{currentStyle.name}</span>
        </h3>

        <p className={`text-xs leading-relaxed ${selectedStyleId === 'art_noir' ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Definiert die Lichtstimmung, die chromatische Textur und die Filmkorn-Charakteristik des gesamten Drehbuchs. Dieser Stil wird nahtlos in die Prompt-Architektur injiziert.
        </p>
      </div>

      {/* Grid of style choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {VISUAL_STYLE_OPTIONS.map((style) => {
          const isSelected = style.id === selectedStyleId;
          const Icon = style.icon;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelectStyle(style.id)}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative ${
                isSelected
                  ? style.id === 'art_noir'
                    ? 'bg-zinc-900 border-zinc-100 text-white shadow-md shadow-black/40 ring-1 ring-zinc-500'
                    : style.id === 'golden_hour'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-950 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500'
                    : 'bg-zinc-50 border-zinc-800 text-zinc-950 shadow-sm ring-1 ring-zinc-800'
                  : selectedStyleId === 'art_noir'
                  ? 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full mb-2">
                <div
                  className={`p-1.5 rounded-lg border ${
                    isSelected
                      ? style.id === 'art_noir'
                        ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                        : style.id === 'golden_hour'
                        ? 'bg-amber-500 text-white border-amber-400'
                        : 'bg-zinc-950 text-white border-zinc-900'
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {style.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${style.badgeStyle}`}>
                    {style.badge}
                  </span>
                )}
                {isSelected && (
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      style.id === 'art_noir'
                        ? 'text-white'
                        : style.id === 'golden_hour'
                        ? 'text-amber-500'
                        : 'text-zinc-950'
                    }`}
                  />
                )}
              </div>

              <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-zinc-950 dark:text-white' : ''}`}>
                {style.name}
              </div>
              <div className={`text-[10px] font-medium mt-0.5 mb-1.5 opacity-80 ${isSelected ? 'text-amber-600 dark:text-zinc-300 font-semibold' : 'text-zinc-400'}`}>
                {style.tagline}
              </div>
              <div className="text-[10px] leading-relaxed opacity-90 text-zinc-500 dark:text-zinc-400 line-clamp-3">
                {style.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
