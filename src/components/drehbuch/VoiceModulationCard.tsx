import React from 'react';
import { VoiceModulationConfig } from '../../types';
import {
  Mic,
  Volume2,
  Sliders,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  Radio,
} from 'lucide-react';
import { Language } from '../../utils/i18n';

interface VoiceModulationCardProps {
  config?: VoiceModulationConfig;
  onChangeConfig: (newConfig: VoiceModulationConfig) => void;
  language?: Language;
}

const defaultConfig: VoiceModulationConfig = {
  enabled: true,
  voiceCharacter: 'makler_authority',
  pacing: 'measured',
  acousticEnvironment: 'warm_foyer',
  antiBabbleLock: true,
  nonSpeakingListenerLock: true,
};

export const VoiceModulationCard: React.FC<VoiceModulationCardProps> = ({
  config = defaultConfig,
  onChangeConfig,
  language = 'DE',
}) => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(Boolean(config.enabled));

  const isEnabled = config.enabled !== false;

  const toggleEnabled = (checked: boolean) => {
    onChangeConfig({
      ...config,
      enabled: checked,
      voiceCharacter: config.voiceCharacter || 'makler_authority',
      pacing: config.pacing || 'measured',
      acousticEnvironment: config.acousticEnvironment || 'warm_foyer',
      antiBabbleLock: config.antiBabbleLock !== undefined ? config.antiBabbleLock : true,
      nonSpeakingListenerLock: config.nonSpeakingListenerLock !== undefined ? config.nonSpeakingListenerLock : true,
    });
    if (checked) {
      setIsExpanded(true);
    }
  };

  const updateField = <K extends keyof VoiceModulationConfig>(key: K, value: VoiceModulationConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="bg-white border border-blue-200/90 rounded-xl overflow-hidden shadow-xs transition-all">
      {/* Header Bar */}
      <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white flex items-center justify-between gap-3 border-b border-blue-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                {language === 'EN'
                  ? 'Voice & Dialogue Modulator (Anti-Babble & Acoustic Control)'
                  : 'Voice- & Dialog-Modulator (Stimm-Dynamik & Anti-Geplapper)'}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {language === 'EN' ? 'Active Lip-Sync Guard' : 'Aktiv: Lip-Sync Schutz'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {language === 'EN'
                ? 'Accurate voice timbre, natural speech cadence, and strict silence locks for non-speaking characters.'
                : 'Moduliert Stimmklang, Sprechtempo und verhindert Geplapper/Phantommund-Bewegungen bei Pausen & Begleitpersonen.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => toggleEnabled(e.target.checked)}
              className="rounded border-blue-400 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span>{language === 'EN' ? 'Enabled' : 'Aktiviert'}</span>
          </label>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-blue-100/50 text-zinc-500 transition cursor-pointer"
            title={isExpanded ? 'Einklappen' : 'Ausklappen'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white text-xs">
          {/* Preset Pickers: Stimmcharakter & Pacing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Voice Character */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'EN' ? 'Voice Timbre & Character' : 'Stimmcharakter & Tonalität'}</span>
              </label>
              <select
                value={config.voiceCharacter || 'makler_authority'}
                onChange={(e) => updateField('voiceCharacter', e.target.value as any)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs font-medium text-zinc-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
              >
                <option value="makler_authority">
                  {language === 'EN' ? 'Sovereign Real Estate Authority (Warm Baritone)' : 'Souveräner Makler / Berater (Warmer Bariton, vertrauensvoll)'}
                </option>
                <option value="warm_narrator">
                  {language === 'EN' ? 'Warm Documentary Narrator (Calm & Resonant)' : 'Warmer Dokumentar-Erzähler (Ruhig, sonorer Klang)'}
                </option>
                <option value="emotional_buyer">
                  {language === 'EN' ? 'Delighted Homebuyer (Expressive & Joyful)' : 'Begeisterte/r Käufer/in (Emotional, glücklich, lebendig)'}
                </option>
                <option value="calm_architect">
                  {language === 'EN' ? 'Focused Architect (Precise & Mindful)' : 'Präziser Architekt (Bedacht, strukturiert, fokussiert)'}
                </option>
                <option value="dynamic_commercial">
                  {language === 'EN' ? 'Dynamic Commercial Voice (Engaging & Clear)' : 'Dynamischer Werbesprecher (Klar, mitreißend, pointiert)'}
                </option>
              </select>
            </div>

            {/* 2. Pacing */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'EN' ? 'Speech Pacing & Cadence' : 'Sprechgeschwindigkeit & Pausen'}</span>
              </label>
              <select
                value={config.pacing || 'measured'}
                onChange={(e) => updateField('pacing', e.target.value as any)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs font-medium text-zinc-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
              >
                <option value="measured">
                  {language === 'EN' ? 'Measured Pace (~110 wpm, clear pauses)' : 'Bedacht & Natürlich (~110 W/Min., organische Pausen)'}
                </option>
                <option value="relaxed">
                  {language === 'EN' ? 'Calm & Leisurely (~95 wpm, breath-synced)' : 'Entspannt & Getragen (~95 W/Min., sanfte Atemzüge)'}
                </option>
                <option value="dynamic">
                  {language === 'EN' ? 'Dynamic & Fluid (~130 wpm, energetic)' : 'Dynamisch & Flüssig (~130 W/Min., lebendiger Redefluss)'}
                </option>
              </select>
            </div>

            {/* 3. Acoustic Environment */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-600" />
                <span>{language === 'EN' ? 'Acoustic Space / Microphony' : 'Akustik-Raum & Mikrofonie'}</span>
              </label>
              <select
                value={config.acousticEnvironment || 'warm_foyer'}
                onChange={(e) => updateField('acousticEnvironment', e.target.value as any)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-xs font-medium text-zinc-800 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition cursor-pointer"
              >
                <option value="warm_foyer">
                  {language === 'EN' ? 'Spacious Foyer & Living Area (Warm natural reverb)' : 'Helles Foyer & Wohnbereich (Warmer, natürlicher Raumhall)'}
                </option>
                <option value="studio_condenser">
                  {language === 'EN' ? 'Studio Condenser Mic (Ultra-dry close voice)' : 'Studio-Kondensatormikrofon (Trockene, präsente Nahstimme)'}
                </option>
                <option value="natural_room">
                  {language === 'EN' ? 'Quiet Interior Room (Dry acoustic damping)' : 'Gedämpfter Innenraum (Hohe Schallabsorption, kein Dröhnen)'}
                </option>
                <option value="open_terrace">
                  {language === 'EN' ? 'Open Terrace / Garden (Outdoor air, distant breeze)' : 'Offene Terrasse & Garten (Freiluft-Akustik, sanfte Brise)'}
                </option>
              </select>
            </div>
          </div>

          {/* Anti-Babble & Non-Speaking Listener Guard Switches */}
          <div className="pt-2 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Anti-Babble Lock */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 cursor-pointer hover:bg-emerald-50 transition">
              <input
                type="checkbox"
                checked={config.antiBabbleLock !== false}
                onChange={(e) => updateField('antiBabbleLock', e.target.checked)}
                className="mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer shrink-0"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-900 block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {language === 'EN' ? 'Strict Anti-Babble Lip Lock' : 'Strikter Anti-Geplapper Lip-Lock'}
                </span>
                <span className="text-[11px] text-zinc-600 block leading-tight">
                  {language === 'EN'
                    ? 'Prevents phantom lip movements before/after spoken dialogue. Lips stay closed in a natural relaxed smile.'
                    : 'Verhindert Gebrabbel & Phantommund-Bewegungen vor/nach dem Satz. Lippen bleiben bei Sprechpausen geschlossen.'}
                </span>
              </div>
            </label>

            {/* Non-Speaking Listener Guard */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 cursor-pointer hover:bg-blue-50 transition">
              <input
                type="checkbox"
                checked={config.nonSpeakingListenerLock !== false}
                onChange={(e) => updateField('nonSpeakingListenerLock', e.target.checked)}
                className="mt-0.5 rounded border-blue-400 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-900 block flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  {language === 'EN' ? 'Non-Speaking Listener Silence Guard' : 'Begleitpersonen-Ruheschutz'}
                </span>
                <span className="text-[11px] text-zinc-600 block leading-tight">
                  {language === 'EN'
                    ? 'Enforces non-speaking companions (<Subject 3>, <Subject 4>) to listen attentively with closed mouths, smiling and nodding.'
                    : 'Verhindert, dass Begleiter (<Subject 3>, <Subject 4>) unaufgefordert mitplappern. Münder bleiben beim Zuhören geschlossen.'}
                </span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
