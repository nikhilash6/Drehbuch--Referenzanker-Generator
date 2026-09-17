import React from 'react';
import {
  Film,
  Users,
  ShieldCheck,
  Clapperboard,
  Server,
  Sliders,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  LayoutGrid,
  ExternalLink,
  Globe,
  Sparkles,
  Wrench,
  Compass,
  Instagram,
} from 'lucide-react';
import { LMStudioSettings } from '../types';
import { Language, t } from '../utils/i18n';

export type NavTab =
  | 'referenzen'
  | 'anker'
  | 'grundriss'
  | 'drehbuchkonfigurator'
  | 'drehbuch'
  | 'tools'
  | 'lmstudio'
  | 'workflow';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  referenceCount: number;
  anchorsCount: number;
  shotsCount: number;
  windowsCount?: number;
  settings: LMStudioSettings;
  onChangeProvider: (provider: 'lmstudio' | 'gemini') => void;
  connectionStatus: 'connected' | 'error' | 'untested';
  isCheckingConnection: boolean;
  onOpenSettings: () => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  referenceCount,
  anchorsCount,
  shotsCount,
  windowsCount = 4,
  settings,
  onChangeProvider,
  connectionStatus,
  isCheckingConnection,
  onOpenSettings,
  language = 'DE',
  onToggleLanguage,
}) => {
  const navItems = [
    {
      id: 'referenzen' as NavTab,
      label: t(language, 'nav.referenzen'),
      description: t(language, 'nav.referenzen_desc'),
      icon: Users,
      badge: `${referenceCount} ${language === 'DE' ? 'Bilder' : 'Images'}`,
    },
    {
      id: 'anker' as NavTab,
      label: t(language, 'nav.anker'),
      description: t(language, 'nav.anker_desc'),
      icon: ShieldCheck,
      badge: anchorsCount > 0 ? `${anchorsCount} ${language === 'DE' ? 'Anker' : 'Anchors'}` : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'drehbuchkonfigurator' as NavTab,
      label: t(language, 'nav.drehbuchkonfigurator'),
      description: t(language, 'nav.drehbuchkonfigurator_desc'),
      icon: LayoutGrid,
      badge: `${windowsCount} Windows`,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'grundriss' as NavTab,
      label: t(language, 'nav.grundriss'),
      description: t(language, 'nav.grundriss_desc'),
      icon: Compass,
      badge: language === 'DE' ? 'Kamera-Routen' : 'Camera Paths',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold',
    },
    {
      id: 'drehbuch' as NavTab,
      label: t(language, 'nav.drehbuch'),
      description: t(language, 'nav.drehbuch_desc'),
      icon: Clapperboard,
      badge: shotsCount > 0 ? `${shotsCount} Shots` : undefined,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'tools' as NavTab,
      label: t(language, 'nav.tools'),
      description: t(language, 'nav.tools_desc'),
      icon: Wrench,
      badge: 'Single-Line',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
    },
    {
      id: 'lmstudio' as NavTab,
      label: t(language, 'nav.lmstudio'),
      description: t(language, 'nav.lmstudio_desc'),
      icon: Server,
      badge: settings.activeProvider === 'lmstudio' ? (language === 'DE' ? 'Aktiv' : 'Active') : undefined,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'workflow' as NavTab,
      label: t(language, 'nav.workflow'),
      description: t(language, 'nav.workflow_desc'),
      icon: Sliders,
    },
  ];

  return (
    <aside className="w-72 bg-white border-r border-zinc-200 flex flex-col shrink-0 h-screen sticky top-0 shadow-xs select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm tracking-tight text-zinc-900">
                  {t(language, 'header.title')}
                </h1>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300 rounded-md tracking-wider">
                  v2.1
                </span>
              </div>
              <p className="text-[11px] font-medium text-zinc-500">
                MiniMax H3 &bull; Maestro Pipeline
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          {t(language, 'nav.production_steps')}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs truncate">{item.label}</div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge ? (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${
                    item.badgeColor || 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}
                >
                  {item.badge}
                </span>
              ) : (
                isActive && <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sponsoren & Language Section */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-50/70 space-y-3">
        {/* Language Switcher */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 bg-white p-2 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <span>{t(language, 'nav.language')}</span>
          </div>
          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button
              onClick={() => onToggleLanguage('DE')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                language === 'DE'
                  ? 'bg-zinc-900 text-amber-400 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              DE
            </button>
            <button
              onClick={() => onToggleLanguage('EN')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                language === 'EN'
                  ? 'bg-zinc-900 text-amber-400 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Engine Status */}
        <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-zinc-700" />
              <span>LM Studio</span>
            </div>
            <button
              onClick={onOpenSettings}
              className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-600 border border-zinc-200 transition cursor-pointer"
            >
              :1234
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
            <div className="flex items-center gap-1 truncate">
              {isCheckingConnection ? (
                <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
              ) : connectionStatus === 'connected' ? (
                <CheckCircle className="w-3 h-3 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-600" />
              )}
              <span className="truncate">
                {connectionStatus === 'connected'
                  ? t(language, 'nav.active_model')
                  : t(language, 'nav.local_api_active')}
              </span>
            </div>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
          </div>
        </div>

        {/* Sponsoren & Referenzen Footer */}
        <div className="pt-1 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{t(language, 'sponsors.title')} &amp; {language === 'DE' ? 'Referenz' : 'Reference'}</span>
          </div>

          <a
            href="https://www.instagram.com/mo_ment_e"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-50/70 to-pink-50/70 hover:from-purple-100 hover:to-pink-100 border border-purple-200/80 text-purple-950 text-[11px] font-semibold transition group shadow-2xs"
            title={language === 'DE' ? 'Instagram Showcase & Video-Anfragen per DM' : 'Instagram Showcase & Video requests via DM'}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              <span className="truncate">@mo_ment_e (Videos per DM)</span>
            </div>
            <ExternalLink className="w-3 h-3 text-purple-400 group-hover:text-purple-700 shrink-0 ml-1" />
          </a>

          <div className="grid grid-cols-2 gap-1.5">
            <a
              href="https://ai-wizards.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-zinc-200 hover:border-amber-300 text-zinc-700 hover:text-amber-900 text-[11px] font-semibold transition group shadow-2xs"
            >
              <span className="truncate">AI Wizards</span>
              <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-amber-600 shrink-0 ml-1" />
            </a>
            <a
              href="https://johannes-wobus.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-zinc-200 hover:border-amber-300 text-zinc-700 hover:text-amber-900 text-[11px] font-semibold transition group shadow-2xs"
            >
              <span className="truncate">J. Wobus</span>
              <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-amber-600 shrink-0 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
