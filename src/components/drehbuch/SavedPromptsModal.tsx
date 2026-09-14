import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Save,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Clock,
  LayoutGrid,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { DrehbuchKonfiguratorState } from '../../types';

interface SavedPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: DrehbuchKonfiguratorState;
  onLoadState: (loadedState: Partial<DrehbuchKonfiguratorState>, title?: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface SavedPromptMeta {
  id: string;
  filename: string;
  title: string;
  description?: string;
  createdAt: string;
  windowCount: number;
  targetAudienceId?: string;
  aspectRatio?: string;
  referencesCount?: number;
  tags?: string[];
}

export const SavedPromptsModal: React.FC<SavedPromptsModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onLoadState,
  onShowToast,
}) => {
  const [files, setFiles] = useState<SavedPromptMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'load' | 'save' | 'export'>('load');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch list of saved JSON files
  const fetchSavedList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/prompts/list');
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (err: any) {
      console.error('Error fetching saved prompts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSavedList();
      if (!saveTitle) {
        setSaveTitle(`Drehbuch_${new Date().toISOString().slice(0, 10)}`);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle saving current project as JSON
  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) {
      onShowToast('error', 'Bitte einen Projekttitel angeben.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/prompts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: saveTitle.trim(),
          projectData: {
            ...currentState,
            title: saveTitle.trim(),
            description: saveDescription.trim(),
            savedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        onShowToast('success', `Projekt gespeichert: "${data.filename}" in /data/saved_prompts/`);
        fetchSavedList();
        setActiveTab('load');
      } else {
        onShowToast('error', data.error || 'Fehler beim Speichern.');
      }
    } catch (err: any) {
      onShowToast('error', `Speicherfehler: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle loading a saved JSON file into state
  const handleLoadFile = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/prompts/load/${id}`);
      const data = await res.json();
      if (data.success && data.project) {
        onLoadState(data.project, data.project.title);
        onShowToast('success', `Projekt "${data.project.title || id}" erfolgreich geladen!`);
        onClose();
      } else {
        onShowToast('error', data.error || 'Datei konnte nicht geladen werden.');
      }
    } catch (err: any) {
      onShowToast('error', `Ladefehler: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a saved JSON file
  const handleDeleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Möchtest du das gespeicherte Projekt wirklich löschen?`)) return;

    try {
      const res = await fetch(`/api/prompts/delete/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('info', 'Projektdatei gelöscht.');
        fetchSavedList();
      } else {
        onShowToast('error', data.error || 'Fehler beim Löschen.');
      }
    } catch (err: any) {
      onShowToast('error', `Löschfehler: ${err.message}`);
    }
  };

  // Handle JSON export / download
  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(
      {
        ...currentState,
        title: saveTitle || 'drehbuch_projekt',
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(saveTitle || 'drehbuch_projekt').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('success', 'JSON-Projektdatei heruntergeladen!');
  };

  // Handle local JSON file import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onLoadState(parsed, parsed.title || file.name);
        onShowToast('success', `Projekt aus "${file.name}" importiert!`);
        onClose();
      } catch (err: any) {
        onShowToast('error', `Ungültiges JSON-Format: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center shadow-xs">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Prompt-Archiv &amp; JSON-Speicher (data/saved_prompts)
              </h2>
              <p className="text-xs text-zinc-500">
                Drehbücher, Windows &amp; Referenzen als JSON auf Festplatte speichern &amp; laden
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-zinc-200 bg-white flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('load')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'load'
                ? 'border-amber-500 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            <span>Gespeicherte Projekte ({files.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('save')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'save'
                ? 'border-amber-500 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Save className="w-4 h-4 text-emerald-600" />
            <span>Aktuelles Projekt speichern</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'export'
                ? 'border-amber-500 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Import / Export (JSON Datei)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-zinc-50/50">
          {activeTab === 'load' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>Verfügbare JSON-Dateien in <code>/data/saved_prompts/*.json</code>:</span>
                <button
                  type="button"
                  onClick={fetchSavedList}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Aktualisieren</span>
                </button>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-12 bg-white border border-dashed border-zinc-300 rounded-xl p-8">
                  <FileJson className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-zinc-800">Noch keine JSON-Projekte gespeichert</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Speichere deinen aktuellen Drehbuch-Entwurf oder wähle den Tab „Aktuelles Projekt speichern“.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleLoadFile(file.id)}
                      className="group bg-white p-4 rounded-xl border border-zinc-200 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-sm text-zinc-900 group-hover:text-amber-700 transition line-clamp-1">
                            {file.title}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFile(file.id, e)}
                            title="Löschen"
                            className="text-zinc-400 hover:text-red-600 p-1 rounded transition opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {file.description && (
                          <p className="text-xs text-zinc-600 line-clamp-2 mb-3">{file.description}</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <LayoutGrid className="w-3 h-3 text-indigo-500" />
                          {file.windowCount} Windows
                        </span>
                        <span>{new Date(file.createdAt).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'save' && (
            <form onSubmit={handleSaveCurrent} className="space-y-4 max-w-lg mx-auto bg-white p-6 rounded-xl border border-zinc-200 shadow-xs">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Projekttitel / Dateiname
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="z.B. Musterhaus_Avantgarde_4K"
                  className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Wird als <code>data/saved_prompts/[name].json</code> auf dem Server gespeichert.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Beschreibung / Notizen (optional)
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="z.B. Zielgruppe Handwerk & Bauherren, 4 Windows, 35mm Steadicam, warmes Licht..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs text-zinc-700 space-y-1">
                <div className="font-bold text-zinc-900">Umfang des Speicherstands:</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{currentState.windows?.length || currentState.windowCount} Windows mit Camführungen</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{currentState.references?.length || 0} Referenzen (inkl. Logo-Wasserzeichen)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Aktive Zielgruppe &amp; Call-to-Action</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Wird gespeichert...' : 'Jetzt als JSON im System speichern'}</span>
              </button>
            </form>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-zinc-900">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>1-Click JSON-Export herunterladen</span>
                </div>
                <p className="text-xs text-zinc-600">
                  Lädt den aktuellen Drehbuchstand als saubere <code>.json</code> Datei auf deinen Computer herunter.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>JSON-Datei herunterladen</span>
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-zinc-900">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Externe JSON-Datei importieren</span>
                </div>
                <p className="text-xs text-zinc-600">
                  Lade eine zuvor exportierte Drehbuch-JSON Datei hoch, um das Projekt direkt wiederherzustellen.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>JSON-Datei auswählen &amp; laden</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Dateipfad: <code>/data/saved_prompts/</code></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg font-bold transition cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
