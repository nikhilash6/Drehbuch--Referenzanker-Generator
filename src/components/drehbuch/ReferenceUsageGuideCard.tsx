import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Copy, ShieldAlert, Users, ArrowRight } from 'lucide-react';
import { ReferenceImage } from '../../types';

interface ReferenceUsageGuideCardProps {
  currentReferences?: ReferenceImage[];
  onInsertTag?: (tagAndName: string) => void;
}

export const ReferenceUsageGuideCard: React.FC<ReferenceUsageGuideCardProps> = ({
  currentReferences = [],
  onInsertTag,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);

  const sampleInteraction = `<Subject 1> Dirk knutscht leidenschaftlich mit <Subject 2> Anna auf der Holzterrasse von <Building 1>`;

  const handleCopyExample = () => {
    if (onInsertTag) {
      onInsertTag(sampleInteraction);
    } else {
      navigator.clipboard.writeText(sampleInteraction);
    }
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-indigo-50/80 border border-amber-200/90 rounded-2xl p-4 shadow-2xs space-y-3 transition-all">
      {/* Header with Title & Quick Toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-950">
                Wie LM Studio deine Referenzen verwertet &amp; warum Klick-Tags entscheidend sind
              </h4>
              <span className="px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 text-[9px] font-black uppercase tracking-wider">
                Regie-Tipp
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
              Direktes Einklinken von <code className="px-1 py-0.5 bg-white border border-amber-200 rounded text-amber-900 font-bold">&lt;Subject 1&gt;</code> und <code className="px-1 py-0.5 bg-white border border-amber-200 rounded text-amber-900 font-bold">&lt;Subject 2&gt;</code> verhindert Charakter-Vertauschungen und steuert die Video-KI pixelgenau.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-100/80 border border-amber-200 px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer shadow-2xs"
        >
          <span>{isOpen ? 'Weniger Details' : 'Infotext lesen'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded detailed Guide */}
      {isOpen && (
        <div className="pt-2 border-t border-amber-200/80 space-y-3 text-xs text-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Box 1 */}
            <div className="bg-white/95 border border-amber-200 rounded-xl p-3 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>1. Mathematische Rollenklarheit</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Schreibst du nur <em>&bdquo;Er knutscht mit ihr&ldquo;</em>, muss LM Studio raten. Mit <strong className="text-zinc-900">&lt;Subject 1&gt;</strong> und <strong className="text-zinc-900">&lt;Subject 2&gt;</strong> weiß das Modell unmissverständlich, wer welche Aktion ausführt.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white/95 border border-amber-200 rounded-xl p-3 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>2. Anti-Crossbleed bei Video-KIs</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                MiniMax H3 und Maestro rendern Gesichter und Kleidung aus deinen Anker-Bildern <strong>nur über die Tags</strong>. Ohne Tag verschmelzen Merkmale oder Kleidung wird beliebig gewechselt.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white/95 border border-amber-200 rounded-xl p-3 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                <Users className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>3. 1-Klick Tag-Einfügung</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Klicke einfach auf die Buttons unten, um deine Personen (<code className="text-amber-900 font-bold">&lt;Subject 1&gt;</code>) direkt an deine Cursor-Position im Textfeld einzusetzen.
              </p>
            </div>
          </div>

          {/* Practical Live Example */}
          <div className="bg-white border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Praxis-Beispiel für deine Stichpunkte:
              </span>
              <p className="font-mono text-[11px] text-zinc-900 bg-amber-50/60 px-2 py-1 rounded border border-amber-200">
                &bdquo;{sampleInteraction}&ldquo;
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyExample}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-lg text-xs transition shrink-0 cursor-pointer shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedExample ? 'Eingefügt!' : 'Beispiel übernehmen'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
