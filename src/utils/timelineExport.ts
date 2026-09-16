import { SingleLineWindow, DialogueLanguage } from '../types';

export interface TimelineExportOptions {
  projectTitle: string;
  fps: 24 | 25 | 30;
  dialogueLanguage?: DialogueLanguage | string;
  genre?: string;
  aspectRatio?: string;
  targetAudienceName?: string;
  weather?: string;
  background?: string;
}

/**
 * Formats seconds into SMPTE Timecode HH:MM:SS:FF based on framerate
 */
export function formatSmpteTimecode(totalSeconds: number, fps: number = 24): string {
  const roundedSec = Math.max(0, totalSeconds);
  const hours = Math.floor(roundedSec / 3600);
  const minutes = Math.floor((roundedSec % 3600) / 60);
  const seconds = Math.floor(roundedSec % 60);
  const remainderSec = roundedSec - Math.floor(roundedSec);
  const frames = Math.floor(remainderSec * fps);

  const pad = (num: number, len: number = 2) => String(num).padStart(len, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/**
 * Cleans string for safe inclusion in CMX 3600 EDL comments
 */
function sanitizeEdlString(str: string): string {
  return str.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Cleans string for XML attribute or text node
 */
function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates universal CMX 3600 Edit Decision List (.edl)
 * Compatible with DaVinci Resolve, Adobe Premiere Pro, Avid, and Final Cut Pro
 */
export function generateEdlTimeline(
  windows: SingleLineWindow[],
  options: TimelineExportOptions
): string {
  const fps = options.fps || 24;
  const safeTitle = (options.projectTitle || 'Drehbuch_Timeline')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '_')
    .slice(0, 32);

  const lines: string[] = [
    `TITLE: ${safeTitle}`,
    `FCM: NON-DROP FRAME`,
    ``,
  ];

  let currentRecordSeconds = 0;

  windows.forEach((win, index) => {
    const editNumber = String(index + 1).padStart(3, '0');
    const duration = win.durationSeconds || 14;

    const srcIn = formatSmpteTimecode(0, fps);
    const srcOut = formatSmpteTimecode(duration, fps);
    const recIn = formatSmpteTimecode(currentRecordSeconds, fps);
    const recOut = formatSmpteTimecode(currentRecordSeconds + duration, fps);

    // Event line format: EditNumber Reel Track Transition SourceIn SourceOut RecordIn RecordOut
    // 'AX' is standard auxiliary reel, 'V' is Video, 'C' is Cut
    lines.push(`${editNumber}  AX       V     C        ${srcIn} ${srcOut} ${recIn} ${recOut}`);

    // Clip name and director comments
    const clipName = `Window_${String(win.windowNumber).padStart(2, '0')}_${(win.title || 'Scene').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    lines.push(`* FROM CLIP NAME: ${clipName}`);

    if (win.summary) {
      lines.push(`* COMMENT: ${sanitizeEdlString(win.summary)}`);
    }
    if (win.dialogueSnippet) {
      lines.push(`* DIALOGUE: ${sanitizeEdlString(win.dialogueSnippet)}`);
    }
    if (win.cameraMove) {
      lines.push(`* CAMERA: ${sanitizeEdlString(win.cameraMove)}`);
    }
    if (win.musicAudio) {
      lines.push(`* AUDIO: ${sanitizeEdlString(win.musicAudio)}`);
    }
    if (win.claimOrCta) {
      lines.push(`* CTA: ${sanitizeEdlString(win.claimOrCta)}`);
    }
    if (win.singleLinePrompt) {
      lines.push(`* PROMPT: ${sanitizeEdlString(win.singleLinePrompt)}`);
    }

    lines.push(``); // Blank line between EDL events per CMX 3600 standard
    currentRecordSeconds += duration;
  });

  return lines.join('\r\n');
}

/**
 * Generates Final Cut Pro XML v1.9 (.fcpxml)
 * Natively imported by DaVinci Resolve (File > Import > Timeline... > FCPXML)
 */
export function generateFcpxmlTimeline(
  windows: SingleLineWindow[],
  options: TimelineExportOptions
): string {
  const fps = options.fps || 24;
  const frameDuration = fps === 25 ? '100/2500s' : fps === 30 ? '100/3000s' : '100/2400s';
  const formatName = fps === 25 ? 'FFVideoFormat1080p25' : fps === 30 ? 'FFVideoFormat1080p30' : 'FFVideoFormat1080p24';

  const totalDurationSeconds = windows.reduce((sum, w) => sum + (w.durationSeconds || 14), 0);
  const safeProjectName = escapeXml(options.projectTitle || 'Drehbuch Studio Timeline');

  let currentOffsetSeconds = 0;
  const spineItems: string[] = [];

  windows.forEach((win) => {
    const duration = win.durationSeconds || 14;
    const title = escapeXml(win.title || `Window ${win.windowNumber}`);
    const summary = escapeXml(win.summary || '');
    const dialogue = escapeXml(win.dialogueSnippet || '');
    const camera = escapeXml(win.cameraMove || '');
    const prompt = escapeXml(win.singleLinePrompt || '');
    const cta = escapeXml(win.claimOrCta || '');

    const markerNotes = [
      summary ? `SZENE: ${summary}` : '',
      dialogue ? `DIALOG: ${dialogue}` : '',
      camera ? `KAMERA: ${camera}` : '',
      cta ? `CTA/CLAIM: ${cta}` : '',
      prompt ? `PROMPT: ${prompt}` : '',
    ].filter(Boolean).join('&#10;');

    spineItems.push(`            <gap name="${title}" offset="${currentOffsetSeconds}/1s" duration="${duration}/1s" start="0/1s">
                <marker start="0/1s" duration="${duration}/1s" value="W${win.windowNumber}: ${title}" note="${markerNotes}" posterOffset="0/1s"/>
            </gap>`);

    currentOffsetSeconds += duration;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
    <resources>
        <format id="r1" name="${formatName}" frameDuration="${frameDuration}" width="1920" height="1080"/>
    </resources>
    <library>
        <event name="Drehbuch Event">
            <project name="${safeProjectName}">
                <sequence format="r1" duration="${totalDurationSeconds}/1s" tcStart="0/1s">
                    <spine>
${spineItems.join('\n')}
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>
`;
}

/**
 * Generates UTF-8 CSV table with BOM for Excel & Google Sheets
 */
export function generateCsvExport(
  windows: SingleLineWindow[],
  options: TimelineExportOptions
): string {
  const delimiter = ';';
  const headers = [
    'Window_Nr',
    'Timecode_Start',
    'Timecode_Ende',
    'Dauer_Sekunden',
    'Titel',
    'Zusammenfassung',
    'Kamerabewegung_Objektiv',
    'Gesprochener_Dialog',
    'Sounddesign_Musik',
    'Claim_CTA',
    'Aktive_Referenzen',
    'Single_Line_Prompt_MiniMax_H3'
  ];

  const escapeCsv = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return '""';
    const clean = String(val).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = windows.map((w) => [
    w.windowNumber,
    w.timecodeStart || formatSmpteTimecode((w.windowNumber - 1) * (w.durationSeconds || 14), options.fps),
    w.timecodeEnd || formatSmpteTimecode(w.windowNumber * (w.durationSeconds || 14), options.fps),
    w.durationSeconds || 14,
    w.title || '',
    w.summary || '',
    w.cameraMove || '',
    w.dialogueSnippet || '',
    w.musicAudio || '',
    w.claimOrCta || '',
    (w.activeSubjects || []).join(', '),
    w.singleLinePrompt || '',
  ].map(escapeCsv).join(delimiter));

  // Prepend UTF-8 BOM so Excel opens German Umlauts properly without questions
  return '\uFEFF' + [headers.map(escapeCsv).join(delimiter), ...rows].join('\r\n');
}

/**
 * Generates human-readable Markdown Production Screenplay Document
 */
export function generateMarkdownScreenplay(
  windows: SingleLineWindow[],
  options: TimelineExportOptions
): string {
  const totalSeconds = windows.reduce((sum, w) => sum + (w.durationSeconds || 14), 0);

  let md = `# 🎬 Drehbuch- & Timeline-Ablaufplan: ${options.projectTitle || 'KI-Videoproduktion'}\n\n`;
  md += `> **Format**: ${options.aspectRatio || '16:9'} | **Framerate**: ${options.fps || 24} fps | **Gesamtlaufzeit**: ${totalSeconds} Sekunden (${windows.length} Windows à ${windows[0]?.durationSeconds || 14}s)\n`;
  if (options.targetAudienceName) md += `> **Zielgruppe**: ${options.targetAudienceName}\n`;
  if (options.dialogueLanguage) md += `> **Dialogsprache**: ${options.dialogueLanguage}\n`;
  if (options.weather) md += `> **Wetter/Licht**: ${options.weather}\n`;
  if (options.background) md += `> **Location**: ${options.background}\n`;
  md += `\n---\n\n`;

  windows.forEach((win) => {
    md += `## ⏱️ Window ${win.windowNumber}: ${win.title || 'Szene'} (${win.timecodeStart} – ${win.timecodeEnd})\n\n`;
    if (win.summary) md += `**Handlung & Bild**: ${win.summary}\n\n`;
    if (win.cameraMove) md += `- 🎥 **Kamera & Optik**: ${win.cameraMove}\n`;
    if (win.dialogueSnippet) md += `- 💬 **Spoken Dialogue**: ${win.dialogueSnippet}\n`;
    if (win.musicAudio) md += `- 🎵 **Sound & Akustik**: ${win.musicAudio}\n`;
    if (win.claimOrCta) md += `- 🏷️ **Claim / CTA Einblendung**: ${win.claimOrCta}\n`;
    if (win.activeSubjects && win.activeSubjects.length > 0) {
      md += `- 👥 **Gebundene Referenzen**: ${win.activeSubjects.join(', ')}\n`;
    }
    md += `\n**Single-Line Prompt (MiniMax H3 / Maestro 2.1.6)**:\n`;
    md += `\`\`\`text\n${win.singleLinePrompt}\n\`\`\`\n\n`;
    md += `---\n\n`;
  });

  return md;
}

/**
 * Triggers browser download of text content with proper filename and mime type
 */
export function downloadExportFile(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
