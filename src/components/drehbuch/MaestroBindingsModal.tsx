import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Tag,
  Layers,
  Sparkles,
  Info,
  Shield,
  FileCode,
  Download,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { ConfigReference, TargetAudience } from '../../types';
import { getMaestro216Bindings, generateMaestroSlotsMappingText } from '../../utils/windowPromptFormatter';

interface MaestroBindingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  references: ConfigReference[];
  projectTitle?: string;
  targetAudience?: TargetAudience;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const MaestroBindingsModal: React.FC<MaestroBindingsModalProps> = ({
  isOpen,
  onClose,
  references,
  projectTitle = 'Drehbuch Projekt',
  targetAudience,
  onShowToast,
}) => {
  const [copiedSlot, setCopiedSlot] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'rawText' | 'instructions'>('cards');

  if (!isOpen) return null;

  const bindings = getMaestro216Bindings(references);
  const rawTextMapping = generateMaestroSlotsMappingText(references, projectTitle);

  const handleCopySlot = (slotIdx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSlot(slotIdx);
    onShowToast?.('success', `Label "${text}" in die Zwischenablage kopiert!`);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(rawTextMapping);
    setCopiedAll(true);
    onShowToast?.('success', 'Komplette Maestro 2.1.6 Slot-Matrix kopiert!');
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([rawTextMapping], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}_maestro_2_1_6_slots.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    onShowToast?.('success', 'Maestro 2.1.6 Konfigurationsdatei heruntergeladen!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 font-mono font-bold text-base shadow-sm">
              M2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900">Maestro 2.1.6 Reference Bindings</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  v2.1.6 Slot Matrix
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Genaue Zuordnung aller Bild-Referenzen zu den erforderlichen Maestro 2.1.6 Anchors & Prompt-Tags
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 hover:bg-stone-800 text-white transition-colors shadow-sm"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAll ? 'Kopiert!' : 'Alle Slots kopieren'}
            </button>
            <button
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 transition-colors"
              title="Als Textdatei speichern"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              .TXT
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'cards'
                ? 'border-amber-500 text-amber-700 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Slot Übersicht ({bindings.length})
          </button>
          <button
            onClick={() => setActiveTab('rawText')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'rawText'
                ? 'border-amber-500 text-amber-700 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Cheat-Sheet TXT
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'instructions'
                ? 'border-amber-500 text-amber-700 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Maestro 2.1.6 Anleitung
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Wichtig für Maestro 2.1.6:</span> Trage in Maestro für jeden Slot exakt das angegebene{' '}
                  <code className="bg-amber-100/80 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">@Anchor_Label</code> ein. Im generierten Prompt wird das entsprechende{' '}
                  <code className="bg-amber-100/80 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">&lt;Tag&gt;</code> referenziert. Nur so ordnet die KI Gesichter, Häuser und Objekte fehlerfrei zu.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bindings.map((b) => {
                  const isHuman = b.category === 'human';
                  const isBuilding = b.category === 'building';
                  const isLogo = b.category === 'logo';
                  const isObject = b.category === 'object';

                  const badgeColor = isHuman
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : isBuilding
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isLogo
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200';

                  return (
                    <div
                      key={b.slotIndex}
                      className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-amber-400/80 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Slot Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                              {b.slotIndex}
                            </span>
                            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
                              {b.category}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                            {b.promptTag}
                          </span>
                        </div>

                        {/* Image & Main Info */}
                        <div className="flex items-start gap-3 mb-3">
                          {b.photoUrl ? (
                            <img
                              src={b.photoUrl}
                              alt={b.referenceName}
                              className="w-14 h-14 object-cover rounded-lg border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center shrink-0 text-stone-400">
                              <Tag className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-stone-900 truncate">{b.referenceName}</h4>
                            <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{b.roleOrAction}</p>
                          </div>
                        </div>

                        {/* Maestro 2.1.6 Exact Label Copy Field */}
                        <div className="mt-2 bg-stone-50 border border-stone-200 rounded-lg p-2 flex items-center justify-between">
                          <div className="min-w-0 flex-1 mr-2">
                            <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                              Maestro 2.1.6 Label
                            </div>
                            <div className="font-mono text-xs font-bold text-stone-900 truncate">
                              {b.maestroLabel}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopySlot(b.slotIndex, b.maestroLabel)}
                            className="p-1.5 rounded-md hover:bg-stone-200/80 text-stone-600 hover:text-stone-900 transition-colors shrink-0"
                            title="Label kopieren"
                          >
                            {copiedSlot === b.slotIndex ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Prompt Action EN */}
                        {b.roleOrActionEn && (
                          <div className="mt-2 text-[11px] text-stone-600 bg-stone-50/60 rounded-md p-2 border border-stone-100">
                            <span className="font-semibold text-stone-700">Action (EN):</span> {b.roleOrActionEn}
                          </div>
                        )}
                      </div>

                      {/* Footer Info */}
                      {isLogo && (
                        <div className="mt-3 text-[10px] font-semibold text-amber-700 bg-amber-50/80 rounded px-2 py-1 border border-amber-200/50">
                          Wasserzeichen-Regel: IMMER rechts unten (25% Deckkraft)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'rawText' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Cheat-Sheet zum direkten Einfügen in Dokumentationen oder Notizen:</span>
                <button
                  onClick={handleCopyAll}
                  className="text-amber-700 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Alles in die Zwischenablage
                </button>
              </div>
              <pre className="bg-stone-900 text-stone-100 font-mono text-xs p-4 rounded-xl overflow-x-auto leading-relaxed border border-stone-800 shadow-inner max-h-[500px]">
                {rawTextMapping}
              </pre>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4 max-w-2xl mx-auto text-sm text-stone-700 leading-relaxed bg-white p-6 rounded-xl border border-stone-200">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                So trägst du die Referenzen in Maestro 2.1.6 ein:
              </h3>
              
              <ol className="space-y-3 list-decimal list-inside text-stone-600 text-xs sm:text-sm">
                <li>
                  <strong className="text-stone-900">Slot öffnen:</strong> Öffne in Maestro 2.1.6 die Slot-Verwaltung (z.B. Reference Slot 1, Slot 2).
                </li>
                <li>
                  <strong className="text-stone-900">Bild hochladen:</strong> Lade das entsprechende Referenzbild in den Slot hoch (liegt auch lokal im Projektordner unter <code className="bg-stone-100 text-stone-800 px-1 py-0.5 rounded font-mono">/data/projects/[Projekt]/references/</code>).
                </li>
                <li>
                  <strong className="text-stone-900">Anchor eintragen:</strong> Kopiere das <code className="bg-stone-100 text-amber-800 px-1 py-0.5 rounded font-mono font-bold">@Subject...</code> bzw. <code className="bg-stone-100 text-emerald-800 px-1 py-0.5 rounded font-mono font-bold">@Building...</code> Label aus diesem Fenster und füge es als Maestro-Namen ein.
                </li>
                <li>
                  <strong className="text-stone-900">Single-Line Prompt nutzen:</strong> Kopiere den generierten Prompt (aus der Fenster-Generierung). Die Tags <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">&lt;Subject 1&gt;</code> und <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">&lt;Building 1&gt;</code> verknüpfen sich nun automatisch 100% konsistent!
                </li>
              </ol>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600">
                <strong className="text-stone-800">Hinweis zu Dialogen:</strong> Alle Dialoge sind im Prompt sauber nach Sprache getaggt (z.B. <code className="bg-stone-200/80 px-1 py-0.5 rounded">&lt;d[Bauherrin][German]&gt; ... &lt;/d&gt;</code>). Die restliche Regieanweisung und Kameraführung ist 100% in Englisch formuliert.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200 bg-stone-50 text-xs text-stone-500">
          <div>
            Projekt: <strong className="text-stone-800">{projectTitle}</strong> • {bindings.length} aktive Referenz-Slots
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Fertig & Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
