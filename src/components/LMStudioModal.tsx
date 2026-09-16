import React, { useState } from 'react';
import { X, Check, Server, RefreshCw, AlertCircle, Sparkles, Terminal, Globe, HelpCircle } from 'lucide-react';
import { LMStudioSettings } from '../types';

interface LMStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LMStudioSettings;
  onSaveSettings: (newSettings: LMStudioSettings) => void;
  onTestConnection: (endpoint: string, apiKey?: string) => Promise<{ connected: boolean; message: string; models?: any[] }>;
}

export const LMStudioModal: React.FC<LMStudioModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTestConnection,
}) => {
  if (!isOpen) return null;

  const [provider, setProvider] = useState<'lmstudio' | 'gemini'>(settings.activeProvider);
  const [endpoint, setEndpoint] = useState(settings.endpoint);
  const [modelName, setModelName] = useState(settings.modelName || 'local-model');
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [useProxy, setUseProxy] = useState(settings.useProxy ?? true);
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string; models?: any[] } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTestConnection(endpoint, apiKey);
      setTestResult(result);
      if (result.models && result.models.length > 0 && (!modelName || modelName === 'local-model')) {
        setModelName(result.models[0].id || result.models[0].name || 'local-model');
      }
    } catch (e: any) {
      setTestResult({
        connected: false,
        message: `Fehler beim Testen: ${e.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      activeProvider: provider,
      endpoint,
      modelName,
      apiKey: apiKey || undefined,
      useProxy,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-zinc-900">
        {/* Close Button */}
        <button
          id="btn-close-modal"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1.5 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
            <Server className="w-5 h-5 text-zinc-800" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">LM Studio Schnittstelle (100% Lokal)</h3>
            <p className="text-xs text-zinc-500">
              Konfiguriere deinen lokalen LM Studio Endpunkt (Port 1234) &bull; Keine externe KI
            </p>
          </div>
        </div>

        {/* LM Studio Specific Settings */}
        <div className="space-y-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 mb-5">
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1.5">
              LM Studio API-Endpunkt (Standard Port 1234)
            </label>
            <input
              id="input-lmstudio-endpoint"
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:1234/v1"
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Standard: <code className="text-zinc-700 font-mono font-bold">http://localhost:1234/v1</code>
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1.5">
              Modell-Identifikator in LM Studio
            </label>
            <input
              id="input-lmstudio-model"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="z.B. qwen2.5-vl, llama-3.2-vision, oder local-model"
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Gib hier den Namen des Modells ein, das du in LM Studio geladen hast.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                id="checkbox-use-proxy"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
              />
              <span>Server-Proxy nutzen (verhindert Browser-CORS-Blockaden)</span>
            </label>

            <button
              type="button"
              id="btn-test-lmstudio"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                  <span>Verbinde...</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Verbindung testen</span>
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                testResult.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.connected ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{testResult.message}</p>
                  {testResult.models && testResult.models.length > 0 && (
                    <p className="mt-1 font-mono text-[11px] text-zinc-700">
                      Erkannte Modelle: {testResult.models.map((m: any) => m.id || m.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
          <button
            id="btn-cancel-settings"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            id="btn-save-settings"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            Einstellungen übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};
