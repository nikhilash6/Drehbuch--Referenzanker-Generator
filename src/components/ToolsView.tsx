import React, { useState } from 'react';
import {
  Wrench,
  Sparkles,
  Copy,
  Check,
  Zap,
  Layers,
  ArrowRight,
  FileText,
  Clock,
  Ratio,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { Language, t } from '../utils/i18n';

interface ToolsViewProps {
  language: Language;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ language = 'DE', onShowToast }) => {
  // Tool 1: Single Window Prompt Compressor
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [windowNumber, setWindowNumber] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('00:00.000');
  const [endTime, setEndTime] = useState<string>('00:14.000');
  const [aspectRatio, setAspectRatio] = useState<string>('Native 16:9 widescreen');
  const [autoAddHeader, setAutoAddHeader] = useState<boolean>(true);
  const [outputSingleLine, setOutputSingleLine] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Quick preset samples
  const samplePrompts = [
    {
      title: 'Heidi Odenwald (Achtsamkeit)',
      prompt: `Subject definitions: <Subject 1> is heidi (@Subject1_heidi). Straight blonde hair styled with a full fringe falling to shoulder length, clear light-toned eyes with an empathetic mindful gaze.
Wears exactly a stylish dark brown soft leather jacket over a clean charcoal top, fitted black denim jeans, and clean white minimalist designer sneakers.
Role & Action: Walks peacefully along a scenic natural riverbank trail through the misty Odenwald mountain forest.
Sweeping cinematic panorama of the Odenwald low mountain range in Germany, rolling densely forested green ridges enveloped in thick early morning valley mist.
TIMECODE 00:07.000, <Subject 1> heidi: [TIME:0s-14s] <d[heidi][German]> Manchmal ist der erste Schritt zur Stärke der Weg zurück zu sich selbst. </d>
Camera: Shot on Cooke Speed Panchro 50mm T2.3, signature Cooke Look, warm painterly skin tones, gentle organic focus roll-off.
Audio Design: Melodic rushing of clear mountain stream, whispering wind through ancient Odenwald beech canopies.`,
    },
    {
      title: 'Schlichter Freitext / Notizen',
      prompt: `Eine Frau geht bei Sonnenaufgang durch den herbstlichen Wald.
Nahaufnahme auf ihre weißen Sneaker am Ufer eines Gebirgsbachs.
Sie blickt in die Ferne und atmet tief ein.
Später sieht man den Schriftzug 'NEUE ENERGIE' und Instagram: @dr.heidi_klein in feiner Goldschrift.`,
    },
  ];

  // Core Compression Function
  const handleCompressToSingleLineWindow = () => {
    if (!inputPrompt.trim()) {
      if (onShowToast) {
        onShowToast('info', language === 'DE' ? 'Bitte geben Sie zuerst einen Text oder Prompt ein.' : 'Please enter a prompt text first.');
      }
      return;
    }

    let raw = inputPrompt.trim();

    // 1. Check if the prompt already begins with windowX: (...) pattern
    const windowHeaderRegex = /^window\s*\d*\s*:\s*\([^)]+\)\s*[^.]*\.\s*/i;
    const hasExistingHeader = windowHeaderRegex.test(raw);

    let cleanBody = raw;
    if (hasExistingHeader) {
      cleanBody = raw.replace(windowHeaderRegex, '').trim();
    }

    // 2. Remove all line breaks and compress redundant whitespace
    // Replace newlines and carriage returns with a space
    let singleLineBody = cleanBody
      .replace(/[\r\n]+/g, ' ')
      .replace(/\t+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // 3. Assemble Header if requested
    let finalWindowPrompt = '';
    if (autoAddHeader) {
      const header = `window${windowNumber}: (${startTime}–${endTime}) ${aspectRatio}. `;
      finalWindowPrompt = `${header}${singleLineBody}`;
    } else {
      finalWindowPrompt = singleLineBody;
    }

    // 4. Ensure absolute zero line breaks
    finalWindowPrompt = finalWindowPrompt.replace(/[\r\n]/g, ' ').replace(/\s{2,}/g, ' ').trim();

    setOutputSingleLine(finalWindowPrompt);
    setCopied(false);

    if (onShowToast) {
      onShowToast(
        'success',
        language === 'DE'
          ? `Erfolgreich in 1 Single-Line Window komprimiert (0 Zeilenumbrüche)!`
          : `Successfully compressed into 1 single-line window (0 line breaks)!`
      );
    }
  };

  const handleCopy = async () => {
    if (!outputSingleLine) return;
    try {
      await navigator.clipboard.writeText(outputSingleLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onShowToast) {
        onShowToast('success', language === 'DE' ? 'Single-Line Window in die Zwischenablage kopiert!' : 'Single-Line Window copied to clipboard!');
      }
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = outputSingleLine;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClear = () => {
    setInputPrompt('');
    setOutputSingleLine('');
    setCopied(false);
  };

  // Quick preset load
  const handleLoadSample = (sampleText: string) => {
    setInputPrompt(sampleText);
    setOutputSingleLine('');
    setCopied(false);
  };

  const lineBreakCount = (outputSingleLine.match(/[\r\n]/g) || []).length;
  const wordCount = outputSingleLine ? outputSingleLine.split(/\s+/).filter(Boolean).length : 0;
  const charCount = outputSingleLine.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                {language === 'DE' ? 'Produktions-Tools' : 'Production Tools'}
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                {language === 'DE'
                  ? 'Spezialwerkzeuge für MiniMax H3, Maestro 2.1.6 & Single-Line Prompt Formatierung'
                  : 'Special utilities for MiniMax H3, Maestro 2.1.6 & Single-Line prompt formatting'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 border border-zinc-200">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'DE' ? 'Tool #1: Window-Kompressor' : 'Tool #1: Window Compressor'}</span>
          </div>
        </div>
      </div>

      {/* Main Tool: Single-Line Window Compressor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Input */}
        <div className="lg:col-span-6 space-y-5">
          {/* Input Box */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>{language === 'DE' ? '1. Beliebigen Prompt eingeben' : '1. Enter Any Prompt'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-zinc-400 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
                  title="Eingabe leeren"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'DE' ? 'Leeren' : 'Clear'}</span>
                </button>
              </div>
            </div>

            {/* Presets / Sample Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-zinc-400">
                {language === 'DE' ? 'Vorlagen:' : 'Presets:'}
              </span>
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadSample(s.prompt)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-100 hover:bg-amber-100 hover:text-amber-900 text-zinc-700 border border-zinc-200 transition cursor-pointer"
                >
                  {s.title}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={
                  language === 'DE'
                    ? 'Fügen Sie hier Ihren Prompt ein (egal ob mit Absätzen, Notizen, mehreren Zeilen oder Stichpunkten)...'
                    : 'Paste any prompt here (with multiple lines, paragraphs, notes or bullet points)...'
                }
                rows={9}
                className="w-full p-3.5 text-xs font-mono rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition leading-relaxed resize-y"
              />
              <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                <span>{inputPrompt.length} Zeichen</span>
                <span>{(inputPrompt.match(/[\r\n]/g) || []).length} Zeilenumbrüche im Original</span>
              </div>
            </div>

            {/* Window Settings */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{language === 'DE' ? 'Window-Parameter' : 'Window Parameters'}</span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 font-medium">
                  <input
                    type="checkbox"
                    checked={autoAddHeader}
                    onChange={(e) => setAutoAddHeader(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>{language === 'DE' ? 'Window-Auszeichnung anfügen' : 'Add Window Header'}</span>
                </label>
              </div>

              {autoAddHeader && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      {language === 'DE' ? 'Window-Nr.' : 'Window #'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={windowNumber}
                      onChange={(e) => setWindowNumber(parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      {language === 'DE' ? 'Timecode' : 'Timecode'}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        placeholder="00:00.000"
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-mono text-center"
                      />
                      <span className="text-zinc-400 text-xs">–</span>
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        placeholder="00:14.000"
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-mono text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      {language === 'DE' ? 'Format' : 'Format'}
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-medium"
                    >
                      <option value="Native 16:9 widescreen">16:9 Widescreen</option>
                      <option value="Native 9:16 vertical">9:16 Vertical (Reels/TikTok)</option>
                      <option value="Native 2.39:1 anamorphic">2.39:1 Anamorphic Cinema</option>
                      <option value="Native 4:3 standard">4:3 Standard</option>
                      <option value="Native 1:1 square">1:1 Square</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleCompressToSingleLineWindow}
              className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>
                {language === 'DE'
                  ? 'Per Knopfdruck in EIN Single-Line Window verwandeln'
                  : 'Convert to ONE Single-Line Window'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Output & Verification */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <span>{language === 'DE' ? '2. Ergebnis (100% Single-Line Window)' : '2. Output (100% Single-Line Window)'}</span>
              </div>

              {outputSingleLine && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>0 Zeilenumbrüche</span>
                  </span>
                </div>
              )}
            </div>

            {outputSingleLine ? (
              <div className="space-y-3">
                {/* Result Display Box */}
                <div className="relative group">
                  <textarea
                    readOnly
                    value={outputSingleLine}
                    rows={8}
                    className="w-full p-4 text-xs font-mono rounded-xl border border-emerald-200 bg-emerald-50/30 text-zinc-900 focus:outline-none leading-relaxed select-all"
                  />

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-amber-400'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'DE' ? 'Kopiert!' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{language === 'DE' ? '1-Klick Kopieren' : '1-Click Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Metrics Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {language === 'DE' ? 'Format' : 'Format'}
                    </div>
                    <div className="text-xs font-bold text-zinc-800 truncate">
                      {autoAddHeader ? `window${windowNumber}` : 'Flacher Text'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {language === 'DE' ? 'Wörter' : 'Words'}
                    </div>
                    <div className="text-xs font-bold text-zinc-800">{wordCount}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {language === 'DE' ? 'Zeichen' : 'Characters'}
                    </div>
                    <div className="text-xs font-bold text-zinc-800">{charCount}</div>
                  </div>
                </div>

                {/* Big Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20 active:scale-[0.99]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{language === 'DE' ? 'In Zwischenablage kopiert!' : 'Copied to Clipboard!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>
                        {language === 'DE'
                          ? 'Fertigen Single-Line Prompt kopieren (für Maestro / MiniMax H3)'
                          : 'Copy Single-Line Prompt (for Maestro / MiniMax H3)'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="h-64 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-2">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-zinc-600">
                  {language === 'DE' ? 'Noch kein Window generiert' : 'No window generated yet'}
                </div>
                <p className="text-[11px] text-zinc-400 max-w-xs">
                  {language === 'DE'
                    ? 'Fügen Sie links Ihren Prompt ein und klicken Sie auf den Button, um ihn als saubere 1-Zeile mit Window-Kennzeichnung zu exportieren.'
                    : 'Paste your prompt on the left and click the button to compress it into a clean single line with window formatting.'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Rules Info Card */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-950 space-y-1.5">
            <div className="text-xs font-bold flex items-center gap-1.5 text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
              <span>{language === 'DE' ? 'MiniMax H3 Single-Line Mandat' : 'MiniMax H3 Single-Line Mandate'}</span>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              {language === 'DE'
                ? 'MiniMax H3 und Maestro 2.1.6 interpretieren jeden Zeilenumbruch als neuen Szenenabschnitt. Dieser Generator stellt sicher, dass der gesamte Prompt inklusive Kamera, Subjekt-Tags und Audio als exakt eine einzige, ununterbrochene Zeile übergeben wird.'
                : 'MiniMax H3 and Maestro 2.1.6 treat line breaks as separate scene segments. This compressor ensures the entire prompt including camera, subject tags, and audio is passed as exactly one uninterrupted line.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
