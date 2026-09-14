import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  FileImage,
  RefreshCw,
  Users,
  Home,
  Box,
  Dog,
  Trees,
  Layers,
  HelpCircle,
  Copy,
  Tag,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { ConfigReference, ScreenplayReferenceCategory } from '../../types';

interface BatchReferenceAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportReferences: (newReferences: ConfigReference[]) => void;
  lmStudioEndpoint?: string;
  lmStudioModel?: string;
  lmStudioApiKey?: string;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface UploadedFilePreview {
  id: string;
  file: File;
  name: string;
  dataUrl: string;
  mimeType: string;
}

interface AnalyzedResultItem extends ConfigReference {
  maestroBindingName: string;
  maestroSyntaxExample: string;
  watermarkRule?: string;
}

export const BatchReferenceAnalyzerModal: React.FC<BatchReferenceAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onImportReferences,
  lmStudioEndpoint = 'http://localhost:1234/v1',
  lmStudioModel = 'local-model',
  lmStudioApiKey,
  onShowToast,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilePreview[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedResults, setAnalyzedResults] = useState<AnalyzedResultItem[]>([]);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle files selection (up to 8 files)
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).slice(0, 8);
    const newItems: UploadedFilePreview[] = [];

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        newItems.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          dataUrl,
          mimeType: file.type || 'image/jpeg',
        });

        if (newItems.length === fileList.length) {
          setUploadedFiles((prev) => [...prev, ...newItems].slice(0, 8));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove individual file from preview
  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Trigger batch analysis task via LM Studio / Server
  const handleRunBatchAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      onShowToast('error', 'Bitte mindestens 1 Referenzbild hochladen.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const payload = {
        images: uploadedFiles.map((f) => ({
          name: f.name,
          dataUrl: f.dataUrl,
          mimeType: f.mimeType,
        })),
        endpoint: lmStudioEndpoint,
        modelName: lmStudioModel,
        apiKey: lmStudioApiKey,
      };

      const res = await fetch('/api/screenplay/batch-analyze-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.references)) {
        setAnalyzedResults(data.references);
        onShowToast('success', `${data.references.length} Referenzen erfolgreich analysiert & Maestro-Tags generiert!`);
      } else {
        onShowToast('error', data.error || 'Analyse fehlgeschlagen.');
      }
    } catch (err: any) {
      onShowToast('error', `Fehler beim Analysetask: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy Maestro tag to clipboard
  const handleCopyTag = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(text);
    setTimeout(() => setCopiedTag(null), 2000);
    onShowToast('info', `Tag kopiert: ${text}`);
  };

  // Update category of an analyzed item
  const handleUpdateAnalyzedCategory = (id: string, newCat: ScreenplayReferenceCategory) => {
    setAnalyzedResults((prev) =>
      prev.map((item, idx) => {
        if (item.id === id) {
          const indexNum = item.referenceIndex || idx + 1;
          const prefix =
            newCat === 'building'
              ? 'Building'
              : newCat === 'object'
              ? 'Object'
              : newCat === 'logo'
              ? 'Logo'
              : newCat === 'animal'
              ? 'Animal'
              : newCat === 'environment'
              ? 'Env'
              : 'Subject';

          const tag = `<${prefix} ${indexNum}>`;
          const cleanName = (item.name || `Ref_${indexNum}`).replace(/[^a-zA-Z0-9]/g, '');
          const maestroBindingName =
            newCat === 'logo'
              ? `@Logo${indexNum}_Wasserzeichen_BottomRight`
              : `@${prefix}${indexNum}_${cleanName || 'Element'}`;

          return {
            ...item,
            category: newCat,
            tag,
            charTag: maestroBindingName,
            maestroBindingName,
            roleOrAction:
              newCat === 'logo'
                ? 'Dezentes CI-Wasserzeichen in der rechten unteren Ecke'
                : newCat === 'building'
                ? 'Architektonisches Hauptmotiv für Drohnen- und Innenaufnahmen'
                : item.roleOrAction,
          };
        }
        return item;
      })
    );
  };

  // Import all into Drehbuch
  const handleConfirmImport = () => {
    if (analyzedResults.length === 0) return;
    onImportReferences(analyzedResults);
    onShowToast('success', `${analyzedResults.length} Referenzen ins Drehbuch übernommen!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">
                  8-Bilder KI-Multi-Scan &amp; Maestro-Namen Assistent
                </h2>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full font-mono">
                  LM Studio Vision Task
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Lade bis zu 8 Bilder hoch. Die KI extrahiert automatisch Kategorien, Rollen, Beziehungen und die exakten Maestro-Namen.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-zinc-50/40">
          {/* 1. Upload Dropzone */}
          <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-zinc-300 hover:border-indigo-400 transition text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                1 bis 8 Referenzbilder hier ablegen oder auswählen
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Unterstützt Personen, Musterhäuser/Architektur, Requisiten, Tiere &amp; Firmenlogos (PNG mit Transparenz)
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFilesSelected(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                + Bilder vom Computer wählen
              </button>

              {uploadedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleRunBatchAnalysis}
                  disabled={isAnalyzing}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>
                    {isAnalyzing
                      ? 'Analysiere Bilder via LM Studio...'
                      : `🚀 ${uploadedFiles.length} Bilder auf LM Studio analysieren`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Image Previews Grid */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-600 font-bold">
                <span>Hochgeladene Bilder ({uploadedFiles.length}/8):</span>
                {uploadedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFiles([]);
                      setAnalyzedResults([]);
                    }}
                    className="text-red-500 hover:text-red-700 text-[11px] font-normal cursor-pointer"
                  >
                    Alle entfernen
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {uploadedFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className="relative group bg-white p-1 rounded-xl border border-zinc-200 shadow-xs flex flex-col items-center"
                  >
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      className="w-full h-16 object-cover rounded-lg border border-zinc-100"
                    />
                    <span className="text-[10px] text-zinc-600 font-mono line-clamp-1 mt-1 px-1 w-full text-center">
                      #{idx + 1} {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Analyzed Results & Maestro Mapping Table */}
          {analyzedResults.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Maestro Einbindungs- &amp; Zuordnungs-Leitfaden</span>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Diese Namen &amp; Tags sind exakt auf die Video-Synthese in Maestro und MiniMax H3 abgestimmt.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Alle {analyzedResults.length} Referenzen übernehmen</span>
                </button>
              </div>

              {/* Watermark Notice if logo present */}
              {analyzedResults.some((r) => r.category === 'logo') && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">
                    ↘
                  </div>
                  <div>
                    <span className="font-bold">Verbindliche Firmenlogo-Vorgabe:</span> Das Logo wird im Prompt und Maestro <strong>IMMER rechts unten, dezent &amp; transparent (25% Deckkraft)</strong> als permanentes Wasserzeichen verankert.
                  </div>
                </div>
              )}

              {/* Detailed Reference Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analyzedResults.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3 relative"
                  >
                    <div className="flex items-start gap-3">
                      {ref.photoUrl && (
                        <img
                          src={ref.photoUrl}
                          alt={ref.name}
                          className="w-14 h-14 object-cover rounded-lg border border-zinc-300 shadow-2xs shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-zinc-900 text-white font-mono font-bold text-xs rounded-md">
                            {ref.tag}
                          </span>
                          <span className="text-xs font-bold text-zinc-900 line-clamp-1">
                            {ref.name}
                          </span>

                          {/* Category select dropdown */}
                          <select
                            value={ref.category}
                            onChange={(e) => handleUpdateAnalyzedCategory(ref.id, e.target.value as ScreenplayReferenceCategory)}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-300 bg-white text-zinc-800 cursor-pointer focus:outline-none"
                            title="Kategorie manuell anpassen"
                          >
                            <option value="building">🏠 Haus / Baukörper</option>
                            <option value="human">👤 Mensch / Protagonist</option>
                            <option value="object">📦 Requisite / Prop</option>
                            <option value="logo">✨ Firmenlogo (Wasserzeichen)</option>
                            <option value="animal">🐕 Tier / Begleiter</option>
                            <option value="environment">🌲 Umgebung / Kulisse</option>
                          </select>
                        </div>

                        {/* Maestro Binding Tag Display */}
                        <div className="mt-1.5 flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-zinc-200 text-[11px] font-mono">
                          <span className="text-zinc-500 font-sans text-[10px] font-bold">Maestro:</span>
                          <span className="text-indigo-700 font-bold">{ref.maestroBindingName}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyTag(ref.maestroBindingName)}
                            title="Kopieren"
                            className="ml-auto text-zinc-400 hover:text-zinc-700 p-0.5"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Semantic Details */}
                    <div className="text-[11px] text-zinc-700 space-y-1 bg-white p-2.5 rounded-lg border border-zinc-200">
                      <div>
                        <strong>Wer was macht:</strong> {ref.roleOrAction}
                      </div>
                      <div>
                        <strong>Beziehung:</strong> {ref.relationship}
                      </div>
                      {ref.category === 'logo' && (
                        <div className="text-indigo-700 font-bold">
                          <strong>Wasserzeichen-Position:</strong> IMMER rechts unten (25% Transparenz)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-100 flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            {uploadedFiles.length} Bild{uploadedFiles.length === 1 ? '' : 'er'} bereitgestellt
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg font-bold transition cursor-pointer"
            >
              Abbrechen
            </button>
            {analyzedResults.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
              >
                In Projekt übernehmen ({analyzedResults.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
