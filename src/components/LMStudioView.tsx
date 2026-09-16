import React, { useState } from 'react';
import { Server, Globe, Check, AlertCircle, RefreshCw, Sparkles, Terminal, Info } from 'lucide-react';
import { LMStudioSettings } from '../types';
import { Language, t } from '../utils/i18n';

interface LMStudioViewProps {
  settings: LMStudioSettings;
  onSaveSettings: (settings: LMStudioSettings) => void;
  onTestConnection: (endpoint: string, apiKey?: string) => Promise<{ connected: boolean; message: string; models?: any[] }>;
  connectionStatus: 'connected' | 'error' | 'untested';
  isCheckingConnection: boolean;
  language?: Language;
}

export const LMStudioView: React.FC<LMStudioViewProps> = ({
  settings,
  onSaveSettings,
  onTestConnection,
  connectionStatus,
  isCheckingConnection,
  language = 'DE',
}) => {
  const [provider, setProvider] = useState<'lmstudio' | 'gemini'>(settings.activeProvider);
  const [endpoint, setEndpoint] = useState(settings.endpoint);
  const [modelName, setModelName] = useState(settings.modelName || 'local-model');
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [useProxy, setUseProxy] = useState(settings.useProxy ?? true);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(settings.timeoutSeconds ?? 240);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string; models?: any[] } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(endpoint, apiKey);
      setTestResult(res);
      if (res.models && res.models.length > 0 && (!modelName || modelName === 'local-model')) {
        setModelName(res.models[0].id || res.models[0].name || 'local-model');
      }
    } catch (e: any) {
      setTestResult({ connected: false, message: `Fehler: ${e.message}` });
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
      timeoutSeconds: Number(timeoutSeconds) || 240,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl select-none">
      {/* Overview Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {language === 'DE' ? 'Schnittstellen-Konfiguration' : 'Interface Configuration'}
          </span>
          <h3 className="text-base font-bold text-zinc-900 mt-1">
            {t(language, 'lmstudio.title')}
          </h3>
          <p className="text-xs text-zinc-600 mt-0.5">
            {t(language, 'lmstudio.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            {language === 'DE' ? 'Einstellungen speichern' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Provider Info Banner (Strictly Local LM Studio) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600" />
            <span>{language === 'DE' ? 'Aktive Inferenz-Engine: LM Studio (100% Lokal • Keine externe Cloud)' : 'Active Inference Engine: LM Studio (100% Local • No External Cloud)'}</span>
          </label>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {language === 'DE' ? 'Aktiv' : 'Active'}
          </span>
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed">
          {language === 'DE'
            ? 'Alle Referenz-Analysen und Drehbuch-Generierungen laufen ausschließlich über dein lokales LM Studio (Port 1234). Es werden keine Daten an externe Cloud-Dienste gesendet.'
            : 'All reference analysis and screenplay generation run exclusively through your local LM Studio (Port 1234). No data is sent to external cloud services.'}
        </p>
      </div>

      {/* LM Studio Details */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-2">
          <Server className="w-4 h-4 text-zinc-600" />
          {language === 'DE' ? 'LM Studio Verbindungsparameter' : 'LM Studio Connection Parameters'}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1">
              {t(language, 'lmstudio.endpoint')}
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:1234/v1"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1">
              {t(language, 'lmstudio.model')}
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="z.B. qwen2.5-vl, llama-3.2-vision, oder local-model"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-zinc-700 block">
                {t(language, 'lmstudio.timeout')}
              </label>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                Default: 240s
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={10}
                max={1200}
                step={10}
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(Math.max(10, parseInt(e.target.value, 10) || 240))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
              />
              <span className="absolute right-3 top-2 text-xs font-medium text-zinc-400 pointer-events-none">
                Sekunden
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
            />
            <span>{language === 'DE' ? 'Server-Proxy aktivieren (verhindert Browser-CORS & Mixed-Content)' : 'Enable Server Proxy (prevents browser CORS & Mixed-Content)'}</span>
          </label>

          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-300 transition cursor-pointer disabled:opacity-50"
          >
            {testing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                <span>{language === 'DE' ? 'Teste Verbindung...' : 'Testing Connection...'}</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-zinc-600" />
                <span>{t(language, 'lmstudio.test_connection')}</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs ${
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
                    {language === 'DE' ? 'Gefundene Modelle:' : 'Discovered Models:'} {testResult.models.map((m: any) => m.id || m.name).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Setup Guide */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs text-zinc-600 space-y-2">
        <h4 className="font-bold text-zinc-900 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-zinc-500" />
          {t(language, 'lmstudio.instructions')}
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-zinc-700">
          <li>{t(language, 'lmstudio.step1')}</li>
          <li>{t(language, 'lmstudio.step2')}</li>
          <li>{t(language, 'lmstudio.step3')}</li>
          <li>{language === 'DE' ? 'Die App verbindet sich über den lokalen Endpunkt und überträgt Bilder & Prompts direkt.' : 'The app connects via the local endpoint and passes images & prompts directly.'}</li>
        </ol>
      </div>
    </div>
  );
};
