import React from 'react';
import { TypographyOverlayConfig } from '../../types';
import {
  Type,
  PenTool,
  VolumeX,
  Volume2,
  Sparkles,
  Sliders,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TypographyOverlayCardProps {
  overlay?: TypographyOverlayConfig;
  onChangeOverlay: (newOverlay: TypographyOverlayConfig) => void;
  windowCount: number;
  genre?: string;
}

const defaultOverlay: TypographyOverlayConfig = { enabled: false };

export const TypographyOverlayCard: React.FC<TypographyOverlayCardProps> = ({
  overlay = defaultOverlay,
  onChangeOverlay,
  windowCount,
  genre,
}) => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(Boolean(overlay.enabled));

  const isEnabled = Boolean(overlay.enabled);

  const toggleEnabled = (checked: boolean) => {
    const updated: TypographyOverlayConfig = {
      ...overlay,
      enabled: checked,
      // Provide clean initial defaults if activating for the first time
      openingPosition: overlay.openingPosition || 'upper_third',
      openingAccentRule: overlay.openingAccentRule !== undefined ? overlay.openingAccentRule : true,
      teaserPosition: overlay.teaserPosition || 'lower_right',
      teaserStyle: overlay.teaserStyle || 'soft_handwritten',
      closingPosition: overlay.closingPosition || 'exact_center',
      closingAccentBar: overlay.closingAccentBar !== undefined ? overlay.closingAccentBar : true,
      textureLook: overlay.textureLook || 'heavy_matte',
    };
    if (checked) {
      setIsExpanded(true);
    }
    onChangeOverlay(updated);
  };

  const updateField = <K extends keyof TypographyOverlayConfig>(key: K, value: TypographyOverlayConfig[K]) => {
    onChangeOverlay({
      ...overlay,
      [key]: value,
    });
  };

  const isImageVideoGenre =
    genre?.toLowerCase().includes('image') ||
    genre?.toLowerCase().includes('brand') ||
    genre?.toLowerCase().includes('musik') ||
    genre?.toLowerCase().includes('showcase');

  return (
    <div
      className={`border rounded-2xl transition-all ${
        isEnabled
          ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 border-indigo-200 shadow-sm'
          : 'bg-white/80 border-zinc-200 hover:border-zinc-300 shadow-2xs'
      }`}
    >
      {/* Header bar with toggle */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isEnabled ? 'bg-indigo-600 text-white shadow-xs' : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            <Type className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-zinc-900">
                Erweiterte Typografie &amp; On-Screen Claims (Imagevideo-Modus)
              </h4>
              {isImageVideoGenre && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                  Empfohlen für Leit-Genre
                </span>
              )}
              {isEnabled && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Aktiv
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              Präzise On-Screen Typografie mit Block- und Schreibschrift, Ausblick-Text (Teaser) und stummer Musik-Option.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => toggleEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-zinc-800">
              {isEnabled ? 'Aktiviert' : 'Aktivieren'}
            </span>
          </label>

          {isEnabled && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition"
              title={isExpanded ? 'Einklappen' : 'Ausklappen'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded configuration body */}
      {isEnabled && isExpanded && (
        <div className="p-4 pt-1 border-t border-indigo-100 space-y-5">
          {/* Section 1: Opening Hook (Window 1) */}
          <div className="bg-white/90 border border-indigo-100/80 rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Eröffnungs-Claim &amp; Typografie-Mix (Window 1 / Hook)</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">
                Mischung aus Blockschrift &amp; Schreibschrift
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-700 flex items-center gap-1">
                  <span>Hauptzeile (Blockschrift / Geometric Sans)</span>
                </label>
                <input
                  type="text"
                  value={overlay.openingMainLine || ''}
                  onChange={(e) => updateField('openingMainLine', e.target.value)}
                  placeholder="z.B. EIN KLANG ZWISCHEN ZEITEN"
                  className="w-full text-xs font-bold uppercase bg-zinc-50/60 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-700 flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-indigo-500" />
                  <span>Unterzeile (Elegante Schreibschrift / Cursive Script)</span>
                </label>
                <input
                  type="text"
                  value={overlay.openingSubLine || ''}
                  onChange={(e) => updateField('openingSubLine', e.target.value)}
                  placeholder="z.B. Tradition und Innovation im Einklang"
                  className="w-full text-xs italic bg-zinc-50/60 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-100 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Position:</span>
                <select
                  value={overlay.openingPosition || 'upper_third'}
                  onChange={(e) => updateField('openingPosition', e.target.value as any)}
                  className="text-xs bg-zinc-50 border border-zinc-300 rounded-md px-2 py-1 text-zinc-800 font-medium focus:outline-none"
                >
                  <option value="upper_third">Oberes Drittel (Upper third)</option>
                  <option value="center">Exakt zentriert (Center)</option>
                  <option value="lower_third">Unteres Drittel (Lower third)</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700">
                <input
                  type="checkbox"
                  checked={overlay.openingAccentRule !== false}
                  onChange={(e) => updateField('openingAccentRule', e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 rounded border-zinc-300"
                />
                <span>Feine goldene Akzentlinie unter dem Eröffnungstext</span>
              </label>
            </div>
          </div>

          {/* Section 2: Ausblick-Text / Teaser Claim (Middle Windows) */}
          <div className="bg-white/90 border border-purple-100/80 rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-purple-950 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-600" />
                <span>2. Der „Ausblick-Text“ / Teaser-Claim (Zwischensequenz)</span>
              </span>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                Dramaturgische Zwischeneinblendung
              </span>
            </div>

            <p className="text-[11px] text-zinc-500">
              Ein dezent platzierter Teaser-Satz in sanfter Schreibschrift oder edler Blockschrift, der dem Zuschauer während der Szenen-Bewegung Orientierung und Poesie gibt.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-zinc-700">Ausblick-Text (Teaser)</label>
                <input
                  type="text"
                  value={overlay.teaserClaim || ''}
                  onChange={(e) => updateField('teaserClaim', e.target.value)}
                  placeholder="z.B. Ein Hauch von Weite und Stille"
                  className="w-full text-xs italic bg-zinc-50/60 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-700">Schrift-Stil</label>
                <select
                  value={overlay.teaserStyle || 'soft_handwritten'}
                  onChange={(e) => updateField('teaserStyle', e.target.value as any)}
                  className="w-full text-xs bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-2 text-zinc-800 font-medium focus:outline-none"
                >
                  <option value="soft_handwritten">Sanfte Schreibschrift (Soft cursive)</option>
                  <option value="refined_geometric">Edle Blockschrift (Geometric)</option>
                  <option value="italic_sans">Klassisch kursiv (Italic Sans)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 text-[11px]">
              <span className="text-zinc-500 font-medium">Positionierung:</span>
              <select
                value={overlay.teaserPosition || 'lower_right'}
                onChange={(e) => updateField('teaserPosition', e.target.value as any)}
                className="text-xs bg-zinc-50 border border-zinc-300 rounded-md px-2 py-1 text-zinc-800 font-medium focus:outline-none"
              >
                <option value="lower_right">Rechts unten (Lower right)</option>
                <option value="lower_left">Links unten (Lower left)</option>
                <option value="center">Mitte (Center)</option>
                <option value="upper_third">Oben (Upper third)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Final Brand & Callout (Window 4 / Last) */}
          <div className="bg-white/90 border border-amber-100/80 rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>3. Schluss-Claim &amp; Brand-Outro (Window {windowCount} / Finale)</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">
                Kanal-, Projekt- oder Markenabschluss
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-700">
                  Marke / Projektname (Blockschrift / Clean Geometric)
                </label>
                <input
                  type="text"
                  value={overlay.closingBrandName || ''}
                  onChange={(e) => updateField('closingBrandName', e.target.value)}
                  placeholder="z.B. DIE_MARKE_FILM"
                  className="w-full text-xs font-mono font-bold bg-zinc-50/60 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-700 flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-amber-600" />
                  <span>Callout / Handlungsimpuls (Dezente Schreibschrift)</span>
                </label>
                <input
                  type="text"
                  value={overlay.closingCallout || ''}
                  onChange={(e) => updateField('closingCallout', e.target.value)}
                  placeholder="z.B. Jetzt entdecken"
                  className="w-full text-xs italic bg-zinc-50/60 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-100 text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700">
                <input
                  type="checkbox"
                  checked={overlay.closingAccentBar !== false}
                  onChange={(e) => updateField('closingAccentBar', e.target.checked)}
                  className="w-3.5 h-3.5 text-amber-600 rounded border-zinc-300"
                />
                <span>Solide Akzentleiste mit sanftem Lichtimpuls zum Takt</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Textur &amp; Stil:</span>
                <select
                  value={overlay.textureLook || 'heavy_matte'}
                  onChange={(e) => updateField('textureLook', e.target.value as any)}
                  className="text-xs bg-zinc-50 border border-zinc-300 rounded-md px-2 py-1 text-zinc-800 font-medium focus:outline-none"
                >
                  <option value="heavy_matte">Heavy Matte Paper (Klassisch matt &amp; edel)</option>
                  <option value="cinematic_minimal">Cinematic Minimal (Ultrascharf &amp; reduziert)</option>
                  <option value="clean_digital">Clean Digital (Modern &amp; digital klar)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Mute Voiceover Option (Stummes Imagevideo) */}
          <div className="p-3 bg-zinc-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                {overlay.muteVoiceover ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  <span>Stummes Imagevideo (Rein visuell &amp; musikalisch)</span>
                </span>
                <p className="text-[11px] text-zinc-400">
                  Unterbindet jegliche gesprochenen Dialoge (<code className="text-amber-300 font-mono text-[10px]">&lt;d[...]&gt;</code>). Perfekt für reine Musik- und Imagefilme, bei denen ausschließlich die Musik und Typografie wirken.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 self-end sm:self-center px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition border border-zinc-700">
              <input
                type="checkbox"
                checked={Boolean(overlay.muteVoiceover)}
                onChange={(e) => updateField('muteVoiceover', e.target.checked)}
                className="w-4 h-4 text-amber-400 rounded border-zinc-500 focus:ring-amber-400"
              />
              <span className="text-xs font-bold text-zinc-200">
                {overlay.muteVoiceover ? 'Dialoge stumm' : 'Dialoge aktiv'}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
