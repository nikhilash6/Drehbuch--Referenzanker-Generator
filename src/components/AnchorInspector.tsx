import React, { useState } from 'react';
import { Copy, Check, Sparkles, User, Tag, Edit3, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { CharacterAnchorFeatures } from '../types';
import { Language, t } from '../utils/i18n';

interface AnchorInspectorProps {
  anchors: CharacterAnchorFeatures[];
  onUpdateAnchors: (updated: CharacterAnchorFeatures[]) => void;
  rawAnalysisText?: string;
  onApplyToScreenplay: () => void;
  language?: Language;
}

export const AnchorInspector: React.FC<AnchorInspectorProps> = ({
  anchors,
  onUpdateAnchors,
  rawAnalysisText,
  onApplyToScreenplay,
  language = 'DE',
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'raw'>('cards');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAnchorFieldChange = (charIndex: number, field: keyof CharacterAnchorFeatures, val: string) => {
    const updated = [...anchors];
    updated[charIndex] = {
      ...updated[charIndex],
      [field]: val,
    };
    onUpdateAnchors(updated);
  };

  if (anchors.length === 0 && !rawAnalysisText) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-zinc-500 shadow-xs select-none">
        <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-zinc-900">{t(language, 'anker.no_anchors')}</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
          {language === 'DE'
            ? 'Lade im Bereich "Referenzen & Bilder" deine Referenzbilder hoch und starte die Tasks, um exakte visuelle Identitätsanker für MiniMax H3 und Maestro zu generieren.'
            : 'Upload reference images in "References & Images" and run tasks to generate precise visual identity anchors for MiniMax H3 and Maestro.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Top action & status banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {language === 'DE' ? 'Schritt 2: Extrahierte Charakter-Anker' : 'Step 2: Extracted Character Anchors'}
            </span>
            <span className="text-xs font-semibold text-zinc-500">
              ({anchors.length} {language === 'DE' ? 'Personen fixiert' : 'Persons Locked'})
            </span>
          </div>
          <h3 className="text-base font-bold text-zinc-900 mt-1.5">
            {t(language, 'anker.title')}
          </h3>
          <p className="text-xs text-zinc-600 max-w-2xl mt-0.5 leading-relaxed">
            {t(language, 'anker.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-white text-zinc-900 shadow-xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {language === 'DE' ? 'Anker-Karten' : 'Anchor Cards'}
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'raw'
                  ? 'bg-white text-zinc-900 shadow-xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {language === 'DE' ? 'Roh-Ausgabe' : 'Raw Output'}
            </button>
          </div>

          <button
            type="button"
            id="btn-apply-anchors-to-script"
            onClick={onApplyToScreenplay}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <span>{language === 'DE' ? 'In Drehbuch übernehmen' : 'Apply to Screenplay'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {anchors.map((char, index) => (
            <div
              key={char.name || index}
              className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs flex flex-col"
            >
              {/* Card Header */}
              <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      {language === 'DE' ? 'Liste' : 'List'} {index + 1} = {char.name}
                    </h4>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {char.alter_ca || (language === 'DE' ? 'ca. 25 Jahre' : 'approx. 25 years')} &bull; {char.koerperbau || (language === 'DE' ? 'Statur normal' : 'Normal build')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-200 transition cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-zinc-500" />
                  <span>{editingIndex === index ? (language === 'DE' ? 'Speichern' : 'Save') : (language === 'DE' ? 'Bearbeiten' : 'Edit')}</span>
                </button>
              </div>

              {/* Table / List of attributes */}
              <div className="p-4 space-y-1.5 text-xs flex-1">
                <FeatureRow
                  label={language === 'DE' ? 'Gesichtsform' : 'Face Shape'}
                  value={char.gesichtsform}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'gesichtsform', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Augenfarbe' : 'Eye Color'}
                  value={char.augenfarbe}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'augenfarbe', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Augenform' : 'Eye Shape'}
                  value={char.augenform}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'augenform', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Augenbrauen' : 'Eyebrows'}
                  value={char.augenbrauen}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'augenbrauen', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Nase' : 'Nose'}
                  value={char.nase}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'nase', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Mund / Lippen' : 'Mouth / Lips'}
                  value={char.mund}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'mund', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Kiefer / Kinn' : 'Jaw / Chin'}
                  value={char.kiefer_kinn}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'kiefer_kinn', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Hautfarbe / Teint' : 'Skin Color / Complexion'}
                  value={char.hautfarbe_teint}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'hautfarbe_teint', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Haare (Farbe & Länge)' : 'Hair (Color & Length)'}
                  value={`${char.haarfarbe || ''}, ${char.haarlaenge || ''}, ${char.haarstruktur || ''}`}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'haarfarbe', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Pony' : 'Bangs'}
                  value={char.pony}
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'pony', v)}
                />
                <FeatureRow
                  label={language === 'DE' ? 'Besondere Merkmale' : 'Distinctive Features'}
                  value={char.besondere_merkmale}
                  highlight
                  isEditing={editingIndex === index}
                  onChange={(v) => handleAnchorFieldChange(index, 'besondere_merkmale', v)}
                />
                {char.companionDetails && (
                  <FeatureRow
                    label={language === 'DE' ? 'Begleiter / Hunde' : 'Companions / Dogs'}
                    value={char.companionDetails}
                    highlight
                    isEditing={editingIndex === index}
                    onChange={(v) => handleAnchorFieldChange(index, 'companionDetails', v)}
                  />
                )}
                {char.groesse_verhaeltnis && (
                  <FeatureRow
                    label={language === 'DE' ? 'Größenverhältnis' : 'Height / Proportions'}
                    value={char.groesse_verhaeltnis}
                    isEditing={editingIndex === index}
                    onChange={(v) => handleAnchorFieldChange(index, 'groesse_verhaeltnis', v)}
                  />
                )}

                {/* Compact MiniMax H3 Prompt Tag */}
                <div className="mt-4 pt-3 border-t border-zinc-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-amber-600" />
                      MiniMax H3 / Maestro {language === 'DE' ? 'Konsistenz-Tag (Prompt-Injektion)' : 'Consistency Tag (Prompt Injection)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(char.compactPromptAnchor, index)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition cursor-pointer"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">{t(language, 'konfig.copy_success')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-500" />
                          <span>{language === 'DE' ? 'Kopieren' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-xs text-zinc-800 leading-relaxed break-words">
                    {char.compactPromptAnchor || `${char.name}, consistent identity anchor with defined visual features`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Raw Analysis Output View */
        <div className="p-4 rounded-xl bg-white border border-zinc-200 font-mono text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed shadow-xs max-h-96 overflow-y-auto">
          {rawAnalysisText || (language === 'DE' ? 'Keine Rohausgabe vorhanden.' : 'No raw output available.')}
        </div>
      )}
    </div>
  );
};

const FeatureRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  isEditing?: boolean;
  onChange?: (val: string) => void;
}> = ({ label, value, highlight, isEditing, onChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 py-1.5 border-b border-zinc-100 last:border-0">
      <span className="text-zinc-500 text-[11px] font-medium min-w-[130px]">{label}:</span>
      {isEditing ? (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 px-2 py-1 bg-white border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
        />
      ) : (
        <span
          className={`text-xs text-right ${
            highlight ? 'text-amber-900 font-bold bg-amber-50 px-1.5 py-0.5 rounded' : 'text-zinc-800 font-medium'
          }`}
        >
          {value || '–'}
        </span>
      )}
    </div>
  );
};
