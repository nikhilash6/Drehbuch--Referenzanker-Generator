import { ReferenceImage, CharacterAnchorFeatures } from '../types';
import { PROMPT_CATALOG, getPromptForCategory } from './promptCatalog';

// Default prompt fallback if none selected
export const DEFAULT_ANCHOR_PROMPT = PROMPT_CATALOG[0].prompt;

// Initial references: Start empty as requested by user ("ich schmeisse da die referenzen als bilder rein")
export const INITIAL_REFERENCES: ReferenceImage[] = [];

// Optional Demo Presets (Clean, multi-category examples: 1 Person, 1 Person mit 2 Hunden, 1 Gegenstand)
// Users can click "Demodaten laden" if they want to test without uploading their own images immediately.
export const DEMO_PRESET_REFERENCES: ReferenceImage[] = [
  {
    id: 'demo-char-1',
    name: 'Hauptfigur (Detektiv)',
    category: 'person',
    label: 'Referenz 1 (Person)',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
        <rect width="400" height="500" fill="#0f172a"/>
        <circle cx="200" cy="180" r="90" fill="#fcd34d" opacity="0.9"/>
        <path d="M 120 420 C 130 300, 270 300, 280 420 Z" fill="#334155"/>
        <rect x="150" y="240" width="100" height="70" fill="#fcd34d" opacity="0.9"/>
        <circle cx="175" cy="175" r="8" fill="#1e293b"/>
        <circle cx="225" cy="175" r="8" fill="#1e293b"/>
        <rect x="155" y="160" width="40" height="24" rx="4" fill="none" stroke="#000" stroke-width="3"/>
        <rect x="205" y="160" width="40" height="24" rx="4" fill="none" stroke="#000" stroke-width="3"/>
        <path d="M 195 172 L 205 172" stroke="#000" stroke-width="3"/>
        <path d="M 180 215 Q 200 225 220 215" stroke="#991b1b" stroke-width="3" fill="none"/>
        <text x="200" y="470" fill="#94a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">DEMO: Person (Detektiv)</text>
      </svg>
    `)}`,
    mimeType: 'image/svg+xml',
    assignedPrompt: getPromptForCategory('person'),
    taskStatus: 'idle',
  },
  {
    id: 'demo-multi-dogs',
    name: 'Person mit 2 Schäferhunden',
    category: 'multi_subject',
    label: 'Referenz 2 (Person + 2 Hunde)',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
        <rect width="400" height="500" fill="#18181b"/>
        <!-- Central Person -->
        <circle cx="200" cy="160" r="50" fill="#fdba74"/>
        <path d="M 150 360 C 160 230, 240 230, 250 360 Z" fill="#3f3f46"/>
        <!-- Left Dog -->
        <path d="M 60 380 C 70 300, 130 300, 140 380 Z" fill="#78350f"/>
        <polygon points="70,300 85,250 100,300" fill="#78350f"/>
        <polygon points="100,300 115,250 130,300" fill="#78350f"/>
        <circle cx="100" cy="310" r="4" fill="#000"/>
        <!-- Right Dog -->
        <path d="M 260 380 C 270 300, 330 300, 340 380 Z" fill="#451a03"/>
        <polygon points="270,300 285,250 300,300" fill="#451a03"/>
        <polygon points="300,300 315,250 330,300" fill="#451a03"/>
        <circle cx="300" cy="310" r="4" fill="#000"/>
        <text x="200" y="470" fill="#a1a1aa" font-family="sans-serif" font-size="14" text-anchor="middle">DEMO: Person mit 2 Hunden</text>
      </svg>
    `)}`,
    mimeType: 'image/svg+xml',
    assignedPrompt: getPromptForCategory('multi_subject'),
    taskStatus: 'idle',
  },
  {
    id: 'demo-prop-amulet',
    name: 'Antikes Bronze-Amulett',
    category: 'object',
    label: 'Referenz 3 (Requisite/Objekt)',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
        <rect width="400" height="500" fill="#0c0a09"/>
        <!-- Chain -->
        <path d="M 120 80 Q 200 220 280 80" stroke="#d97706" stroke-width="4" fill="none" stroke-dasharray="6,4"/>
        <!-- Medallion -->
        <circle cx="200" cy="260" r="90" fill="#b45309" stroke="#fbbf24" stroke-width="6"/>
        <circle cx="200" cy="260" r="70" fill="#78350f" stroke="#f59e0b" stroke-width="3"/>
        <polygon points="200,200 215,245 260,260 215,275 200,320 185,275 140,260 185,245" fill="#fef08a"/>
        <circle cx="200" cy="260" r="12" fill="#0284c7"/>
        <text x="200" y="470" fill="#a8a29e" font-family="sans-serif" font-size="14" text-anchor="middle">DEMO: Requisite / Prop</text>
      </svg>
    `)}`,
    mimeType: 'image/svg+xml',
    assignedPrompt: getPromptForCategory('object'),
    taskStatus: 'idle',
  },
];

export const PRESET_EXTRACTED_ANCHORS: CharacterAnchorFeatures[] = [];
