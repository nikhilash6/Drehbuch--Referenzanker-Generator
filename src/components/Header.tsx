import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { LMStudioSettings } from '../types';
import { NavTab } from './Sidebar';
import { Language, t } from '../utils/i18n';

interface HeaderProps {
  currentTab: NavTab;
  settings: LMStudioSettings;
  onOpenSettings: () => void;
  onResetPresets: () => void;
  isCheckingConnection: boolean;
  connectionStatus: 'connected' | 'error' | 'untested';
  language: Language;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  settings,
  onOpenSettings,
  onResetPresets,
  language = 'DE',
}) => {
  const getTabLabel = () => {
    switch (currentTab) {
      case 'referenzen':
        return t(language, 'ref.title');
      case 'anker':
        return t(language, 'anker.title');
      case 'drehbuchkonfigurator':
        return t(language, 'konfig.title');
      case 'drehbuch':
        return t(language, 'generator.title');
      case 'lmstudio':
        return t(language, 'lmstudio.title');
      case 'workflow':
        return t(language, 'workflow.title');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{language === 'DE' ? 'Produktion' : 'Production'}</span>
          <span>/</span>
          <span className="text-zinc-600 font-medium">{getTabLabel()}</span>
        </div>
        <h2 className="text-base font-bold text-zinc-900 tracking-tight">
          {getTabLabel()}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Demo Data Loader */}
        <button
          type="button"
          onClick={onResetPresets}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition cursor-pointer"
          title={language === 'DE' ? 'Demodaten laden' : 'Load Demo Data'}
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
          <span>{language === 'DE' ? 'Demodaten laden' : 'Load Demo Data'}</span>
        </button>

        {/* LM Studio quick trigger */}
        <button
          type="button"
          id="btn-open-settings"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-zinc-500" />
          <span>LM Studio Port: {settings.endpoint.split(':').pop()?.replace('/v1', '') || '1234'}</span>
        </button>
      </div>
    </header>
  );
};
