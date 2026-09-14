import React, { useState, useRef } from 'react';
import {
  Users,
  Home,
  Box,
  Dog,
  Trees,
  Plus,
  Trash2,
  Settings2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Tag,
  Eye,
  Camera,
  Sparkles,
  Layers,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Sliders,
  Droplets,
  Loader2,
  BookOpen,
} from 'lucide-react';
import {
  ConfigReference,
  ScreenplayReferenceCategory,
  ReferenceImage,
  TargetAudience,
} from '../../types';
import { BatchReferenceAnalyzerModal } from './BatchReferenceAnalyzerModal';
import { MaestroBindingsModal } from './MaestroBindingsModal';

interface ReferenceManagerSectionProps {
  references: ConfigReference[];
  onUpdateReferences: (references: ConfigReference[]) => void;
  appReferences?: ReferenceImage[];
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  dialogueLanguage?: string;
  targetAudience?: TargetAudience;
  projectTitle?: string;
  stichpunkte?: string;
  lmStudioEndpoint?: string;
  lmStudioModel?: string;
  lmStudioApiKey?: string;
}

const CATEGORY_CONFIG: Record<
  ScreenplayReferenceCategory,
  {
    label: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
    tagPrefix: string;
    anchorPrefix: string;
  }
> = {
  human: {
    label: 'Mensch / Protagonist',
    sub: 'Schauspieler, Bauherren, Figuren',
    icon: <Users className="w-4 h-4 text-blue-600" />,
    color: 'border-blue-200 bg-blue-50/50 text-blue-900',
    badge: 'bg-blue-100 text-blue-900 border-blue-300',
    tagPrefix: 'Subject',
    anchorPrefix: 'Subject',
  },
  building: {
    label: 'Objekt: Haus & Grundriss',
    sub: 'Fertigteilhaus, Fassade, Architektur',
    icon: <Home className="w-4 h-4 text-amber-600" />,
    color: 'border-amber-200 bg-amber-50/50 text-amber-900',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    tagPrefix: 'Building',
    anchorPrefix: 'Building',
  },
  object: {
    label: 'Gegenstand / Prop',
    sub: 'Schlüssel, Requisite, Smarthome-Panel',
    icon: <Box className="w-4 h-4 text-emerald-600" />,
    color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    tagPrefix: 'Object',
    anchorPrefix: 'Object',
  },
  logo: {
    label: 'Firmenlogo (Wasserzeichen)',
    sub: 'IMMER rechts unten, dezent & transparent (25%)',
    icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
    color: 'border-indigo-200 bg-indigo-50/50 text-indigo-900',
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    tagPrefix: 'Logo',
    anchorPrefix: 'Logo',
  },
  animal: {
    label: 'Tier / Begleiter',
    sub: 'Familienhund, Haustiere',
    icon: <Dog className="w-4 h-4 text-purple-600" />,
    color: 'border-purple-200 bg-purple-50/50 text-purple-900',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    tagPrefix: 'Animal',
    anchorPrefix: 'Animal',
  },
  environment: {
    label: 'Umgebung & Kulisse',
    sub: 'Garten, Holzsteg, Dachterrasse',
    icon: <Trees className="w-4 h-4 text-teal-600" />,
    color: 'border-teal-200 bg-teal-50/50 text-teal-900',
    badge: 'bg-teal-100 text-teal-900 border-teal-300',
    tagPrefix: 'Env',
    anchorPrefix: 'Env',
  },
};

export const ReferenceManagerSection: React.FC<ReferenceManagerSectionProps> = ({
  references,
  onUpdateReferences,
  appReferences = [],
  onShowToast,
  dialogueLanguage = 'German',
  targetAudience,
  projectTitle = 'Drehbuch Projekt',
  stichpunkte,
  lmStudioEndpoint = 'http://localhost:1234/v1',
  lmStudioModel = 'local-model',
  lmStudioApiKey = '',
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | ScreenplayReferenceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRefIds, setExpandedRefIds] = useState<Set<string>>(new Set());
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isMaestroModalOpen, setIsMaestroModalOpen] = useState(false);
  const [isElaboratingRoles, setIsElaboratingRoles] = useState(false);
  const [analyzingRefId, setAnalyzingRefId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single Reference Analysis via LM Studio
  const handleRunSingleTask = async (refId: string) => {
    const targetRef = references.find((r) => r.id === refId);
    if (!targetRef) return;

    setAnalyzingRefId(refId);
    try {
      const resp = await fetch('/api/screenplay/elaborate-reference-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          references: [targetRef],
          targetAudience,
          stichpunkte,
          dialogueLanguage,
          endpoint: lmStudioEndpoint,
          modelName: lmStudioModel,
          apiKey: lmStudioApiKey,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Serverfehler (${resp.status})`);
      }

      const data = await resp.json();
      if (data && Array.isArray(data.elaboratedReferences) && data.elaboratedReferences.length > 0) {
        const match = data.elaboratedReferences[0];
        const updated = references.map((r) => {
          if (r.id === refId) {
            return {
              ...r,
              name: match.name || r.name,
              tag: match.tag || r.tag,
              charTag: match.maestroLabel || r.charTag,
              maestroLabel: match.maestroLabel || r.maestroLabel,
              roleOrAction: match.roleOrAction || r.roleOrAction,
              roleOrActionEn: match.roleOrActionEn || r.roleOrActionEn,
              relationship: match.relationship || r.relationship,
              gesturesAndInteractions: match.gesturesAndInteractions || r.gesturesAndInteractions,
              distinguishingMarks: match.distinguishingMarks || r.distinguishingMarks,
              hairOrMaterial: match.hairOrMaterial || r.hairOrMaterial,
              eyesOrGlazing: match.eyesOrGlazing || r.eyesOrGlazing,
              clothingOrFinish: match.clothingOrFinish || r.clothingOrFinish,
              build: match.build || r.build,
              ageRange: match.ageRange || r.ageRange,
              taskStatus: 'completed',
            };
          }
          return r;
        });
        onUpdateReferences(updated);
        onShowToast('success', `Einzelbild-Analyse für "${targetRef.name}" via LM Studio abgeschlossen!`);
      } else {
        throw new Error('Keine ausgearbeiteten Daten für das Einzelbild empfangen.');
      }
    } catch (err: any) {
      console.error('Single reference task error:', err);
      onShowToast('error', `Fehler bei Einzelbild-Analyse: ${err.message}`);
    } finally {
      setAnalyzingRefId(null);
    }
  };

  // Helper to ensure valid tag and index
  const getReferenceTag = (ref: ConfigReference, fallbackIdx: number): string => {
    const idx = ref.referenceIndex || fallbackIdx + 1;
    if (ref.tag && !ref.tag.includes('undefined')) return ref.tag;
    const prefix = CATEGORY_CONFIG[ref.category]?.tagPrefix || 'Subject';
    return `<${prefix} ${idx}>`;
  };

  const getMaestroAnchor = (ref: ConfigReference, fallbackIdx: number): string => {
    if (ref.maestroLabel && ref.maestroLabel.startsWith('@')) return ref.maestroLabel;
    if (ref.charTag && ref.charTag.startsWith('@')) return ref.charTag;
    const idx = ref.referenceIndex || fallbackIdx + 1;
    const prefix = CATEGORY_CONFIG[ref.category]?.anchorPrefix || 'Subject';
    const cleanName = (ref.name || 'Ref').replace(/[^a-zA-Z0-9]/g, '');
    if (ref.category === 'logo') {
      return `@Logo${idx}_Wasserzeichen_BottomRight`;
    }
    return `@${prefix}${idx}_${cleanName || 'Objekt'}`;
  };

  // Trigger LM Studio Role Elaboration ("Wer macht was?")
  const handleElaborateRoles = async () => {
    if (references.length === 0) {
      onShowToast('info', 'Bitte füge zuerst mindestens eine Referenz hinzu.');
      return;
    }

    setIsElaboratingRoles(true);
    try {
      const resp = await fetch('/api/screenplay/elaborate-reference-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          references,
          targetAudience,
          stichpunkte,
          dialogueLanguage,
          endpoint: lmStudioEndpoint,
          modelName: lmStudioModel,
          apiKey: lmStudioApiKey,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Serverfehler (${resp.status})`);
      }

      const data = await resp.json();
      if (data && Array.isArray(data.elaboratedReferences)) {
        const elaboratedMap = new Map<string, any>();
        data.elaboratedReferences.forEach((item: any) => {
          if (item.id) elaboratedMap.set(item.id, item);
        });

        const updated = references.map((orig, idx) => {
          const match = elaboratedMap.get(orig.id) || data.elaboratedReferences[idx];
          if (!match) return orig;

          return {
            ...orig,
            name: match.name || orig.name,
            tag: match.tag || orig.tag,
            charTag: match.maestroLabel || orig.charTag,
            maestroLabel: match.maestroLabel || orig.maestroLabel,
            roleOrAction: match.roleOrAction || orig.roleOrAction,
            roleOrActionEn: match.roleOrActionEn || orig.roleOrActionEn,
            relationship: match.relationship || orig.relationship,
            gesturesAndInteractions: match.gesturesAndInteractions || orig.gesturesAndInteractions,
            distinguishingMarks: match.distinguishingMarks || orig.distinguishingMarks,
            hairOrMaterial: match.hairOrMaterial || orig.hairOrMaterial,
            eyesOrGlazing: match.eyesOrGlazing || orig.eyesOrGlazing,
            clothingOrFinish: match.clothingOrFinish || orig.clothingOrFinish,
          };
        });

        onUpdateReferences(updated);
        onShowToast(
          'success',
          `Rollen, Handlungen & Maestro-Bindings via ${data.source === 'lmstudio' ? 'LM Studio' : 'KI'} erfolgreich ausgearbeitet!`
        );
      } else {
        throw new Error('Keine ausgearbeiteten Rollen empfangen.');
      }
    } catch (err: any) {
      console.error('Error elaborating roles:', err);
      onShowToast('error', `Fehler beim Ausarbeiten der Rollen: ${err.message}`);
    } finally {
      setIsElaboratingRoles(false);
    }
  };

  // Filtered references
  const filteredReferences = references.filter((ref, idx) => {
    if (activeCategoryFilter !== 'all' && ref.category !== activeCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const tag = getReferenceTag(ref, idx).toLowerCase();
      const name = (ref.name || '').toLowerCase();
      const role = (ref.roleOrAction || '').toLowerCase();
      const rel = (ref.relationship || '').toLowerCase();
      return tag.includes(q) || name.includes(q) || role.includes(q) || rel.includes(q);
    }
    return true;
  });

  // Calculate counts
  const countAll = references.length;
  const countHumans = references.filter((r) => r.category === 'human').length;
  const countBuildings = references.filter((r) => r.category === 'building').length;
  const countObjects = references.filter((r) => r.category === 'object').length;
  const countLogos = references.filter((r) => r.category === 'logo').length;
  const countAnimals = references.filter((r) => r.category === 'animal').length;

  // Toggle detail accordion
  const toggleExpand = (id: string) => {
    setExpandedRefIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy tag
  const handleCopyTag = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(text);
    setTimeout(() => setCopiedTag(null), 2000);
    onShowToast('info', `Tag "${text}" in die Zwischenablage kopiert.`);
  };

  // Add reference
  const handleAddReference = (category: ScreenplayReferenceCategory = 'human') => {
    const nextIndex = references.length > 0
      ? Math.max(...references.map((r, i) => r.referenceIndex || i + 1)) + 1
      : 1;

    const prefix = CATEGORY_CONFIG[category]?.tagPrefix || 'Subject';
    const tag = `<${prefix} ${nextIndex}>`;

    let defaultName = `Referenz ${nextIndex}`;
    let defaultRole = '';
    let defaultRelationship = '';
    let defaultBuild = '';
    let defaultHairOrMat = '';
    let defaultGlazingOrEyes = '';
    let defaultClothingOrFinish = '';
    let defaultMarks = 'keine visuellen Bildfehler, fotorealistische Konsistenz';

    if (category === 'human') {
      defaultName = `Protagonist ${nextIndex}`;
      defaultRole = 'Nimmt aktiv an der Haupthandlung der Szene teil';
      defaultRelationship = 'Teil der Kernhandlung, Interaktion mit anderen Beteiligten';
      defaultBuild = 'Natürliche, dem Charakter entsprechende Statur';
      defaultHairOrMat = 'Gepflegtes, dem Charakter entsprechendes Haar';
      defaultGlazingOrEyes = 'Wacher und ausdrucksstarker Blick';
      defaultClothingOrFinish = 'Passende zeitgemäße Kleidung je nach Szenen-Kontext';
    } else if (category === 'building') {
      defaultName = `Schauplatz / Kulisse ${nextIndex}`;
      defaultRole = 'Hauptmotiv und Kulisse über alle Szenen hinweg';
      defaultRelationship = 'Zentraler Schauplatz der Handlung';
      defaultBuild = 'Baukörper passend zum gewählten Genre';
      defaultHairOrMat = 'Fassaden- und Wandmaterialien des gewählten Settings';
      defaultGlazingOrEyes = 'Fensterflächen passend zum Baustil';
      defaultClothingOrFinish = 'Oberflächenstruktur passend zur Szenerie';
    } else if (category === 'object') {
      defaultName = `Requisite ${nextIndex}`;
      defaultRole = 'Wird in Window-Closeups und Haptik-Sequenzen fokussiert';
      defaultRelationship = 'Verknüpft mit den Charakteren in der Haupthandlung';
      defaultBuild = 'Kompakt, präzise gefertigt, passend zum Setting';
      defaultHairOrMat = 'Materialien passend zum Verwendungszweck';
      defaultGlazingOrEyes = 'Fein ausgearbeitete Detail-Merkmale';
      defaultClothingOrFinish = 'Oberflächendetails passend zur Szene';
    } else if (category === 'logo') {
      defaultName = `Firmenlogo`;
      defaultRole = 'Dezentes CI-Wasserzeichen in der rechten unteren Ecke (Bottom-Right)';
      defaultRelationship = 'Markenidentität über alle Windows hinweg';
      defaultBuild = 'Vektorbasiert / High-Resolution';
      defaultHairOrMat = 'Transparenter Hintergrund (PNG/SVG)';
      defaultGlazingOrEyes = 'Hoher Kontrast zur Szene';
      defaultClothingOrFinish = '25% Opacity, semi-transparent';
      defaultMarks = 'IMMER rechts unten platziert (Bottom-Right Corner, 25% Deckkraft)';
    }

    const newRef: ConfigReference = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category,
      referenceIndex: nextIndex,
      tag,
      charTag: category === 'human' ? `char Protagonist ${nextIndex}` : undefined,
      name: defaultName,
      roleOrAction: defaultRole,
      relationship: defaultRelationship,
      build: defaultBuild,
      hairOrMaterial: defaultHairOrMat,
      eyesOrGlazing: defaultGlazingOrEyes,
      clothingOrFinish: defaultClothingOrFinish,
      distinguishingMarks: defaultMarks,
      isActiveInProject: true,
    };

    onUpdateReferences([...references, newRef]);
    setExpandedRefIds((prev) => new Set([...prev, newRef.id]));
    onShowToast('success', `${CATEGORY_CONFIG[category].label} "${defaultName}" hinzugefügt.`);
  };

  // Update ref field
  const handleUpdateRef = (id: string, field: keyof ConfigReference, value: any) => {
    const updated = references.map((r, i) => {
      if (r.id === id) {
        const item = { ...r, [field]: value };
        // If category changed, update tag, anchor and default descriptions
        if (field === 'category') {
          const newCat = value as ScreenplayReferenceCategory;
          const idx = item.referenceIndex || i + 1;
          const prefix = CATEGORY_CONFIG[newCat]?.tagPrefix || 'Subject';
          item.category = newCat;
          item.tag = `<${prefix} ${idx}>`;

          const cleanName = (item.name || `Ref_${idx}`).replace(/[^a-zA-Z0-9]/g, '');
          if (newCat === 'logo') {
            item.charTag = `@Logo${idx}_Wasserzeichen_BottomRight`;
            item.distinguishingMarks = 'IMMER rechts unten (Bottom-Right Corner, 25% Deckkraft)';
            if (!item.roleOrAction) item.roleOrAction = 'Dezentes CI-Wasserzeichen in der rechten unteren Ecke (Bottom-Right)';
            if (!item.relationship) item.relationship = 'Markenidentität über alle Windows hinweg';
          } else if (newCat === 'building') {
            item.charTag = `@Building${idx}_${cleanName || 'Kulisse'}`;
            if (!item.roleOrAction) item.roleOrAction = 'Hauptmotiv und Kulisse über alle Szenen hinweg';
            if (!item.relationship) item.relationship = 'Zentraler Schauplatz der Handlung';
          } else if (newCat === 'object') {
            item.charTag = `@Object${idx}_${cleanName || 'Prop'}`;
            if (!item.roleOrAction) item.roleOrAction = 'Wird in Window-Closeups und Haptik-Sequenzen fokussiert';
            if (!item.relationship) item.relationship = 'Verknüpft mit den Charakteren in der Haupthandlung';
          } else if (newCat === 'animal') {
            item.charTag = `@Animal${idx}_${cleanName || 'Tier'}`;
          } else if (newCat === 'environment') {
            item.charTag = `@Env${idx}_${cleanName || 'Umgebung'}`;
          } else {
            item.charTag = `@Subject${idx}_${cleanName || 'Protagonist'}`;
            if (!item.roleOrAction) item.roleOrAction = 'Nimmt aktiv an der Haupthandlung der Szene teil';
            if (!item.relationship) item.relationship = 'Teil der Kernhandlung, Interaktion mit anderen Beteiligten';
          }
        }
        return item;
      }
      return r;
    });
    onUpdateReferences(updated);
  };

  // Delete ref
  const handleDeleteRef = (id: string) => {
    const target = references.find((r) => r.id === id);
    const updated = references.filter((r) => r.id !== id);
    onUpdateReferences(updated);
    onShowToast('info', `Referenz "${target?.name || 'Referenz'}" entfernt.`);
  };

  // Duplicate ref
  const handleDuplicateRef = (ref: ConfigReference) => {
    const nextIndex = references.length > 0
      ? Math.max(...references.map((r, i) => r.referenceIndex || i + 1)) + 1
      : 1;
    const prefix = CATEGORY_CONFIG[ref.category]?.tagPrefix || 'Subject';

    const duplicated: ConfigReference = {
      ...ref,
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      referenceIndex: nextIndex,
      tag: `<${prefix} ${nextIndex}>`,
      name: `${ref.name} (Kopie)`,
    };
    onUpdateReferences([...references, duplicated]);
    onShowToast('success', `"${ref.name}" dupliziert als "${duplicated.name}".`);
  };

  // Process file upload
  const processUploadedFiles = (fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const lower = cleanName.toLowerCase();

        // If user has filtered by category, adopt that category; otherwise detect smart
        let cat: ScreenplayReferenceCategory =
          activeCategoryFilter !== 'all' ? activeCategoryFilter : 'building';

        if (activeCategoryFilter === 'all') {
          if (lower.includes('logo') || lower.includes('brand') || lower.includes('marke') || lower.includes('ci') || lower.includes('watermark')) {
            cat = 'logo';
          } else if (lower.includes('haus') || lower.includes('fassade') || lower.includes('grundriss') || lower.includes('architektur') || lower.includes('building') || lower.includes('villa') || lower.includes('cube') || lower.includes('bungalow') || lower.includes('plan')) {
            cat = 'building';
          } else if (lower.includes('prop') || lower.includes('schlüssel') || lower.includes('objekt') || lower.includes('detail') || lower.includes('griff')) {
            cat = 'object';
          } else if (lower.includes('hund') || lower.includes('tier') || lower.includes('katze')) {
            cat = 'animal';
          } else if (lower.includes('frau') || lower.includes('mann') || lower.includes('mensch') || lower.includes('person') || lower.includes('bauherr') || lower.includes('protagonist')) {
            cat = 'human';
          } else {
            cat = 'building';
          }
        }

        const nextIndex = references.length > 0
          ? Math.max(...references.map((r, i) => r.referenceIndex || i + 1)) + 1
          : 1;
        const prefix = CATEGORY_CONFIG[cat]?.tagPrefix || 'Subject';
        const cleanSafeName = cleanName.replace(/[^a-zA-Z0-9]/g, '');

        const newRef: ConfigReference = {
          id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          category: cat,
          referenceIndex: nextIndex,
          tag: `<${prefix} ${nextIndex}>`,
          charTag: cat === 'logo'
            ? `@Logo${nextIndex}_Wasserzeichen_BottomRight`
            : `@${prefix}${nextIndex}_${cleanSafeName || 'Ref'}`,
          name: cleanName,
          roleOrAction: cat === 'logo'
            ? 'Dezentes CI-Wasserzeichen in der rechten unteren Ecke'
            : cat === 'building'
            ? 'Architektonisches Hauptmotiv für Drohnen- und Innenaufnahmen'
            : cat === 'human'
            ? 'Erkundet Räume, prüft Haptik und interagiert'
            : 'Requisite / Detailaufnahmen',
          relationship: cat === 'logo'
            ? 'CI / Brand-Wasserzeichen über das gesamte Video'
            : cat === 'building'
            ? 'Mittelpunkt aller Raumfolgen'
            : cat === 'human'
            ? 'Protagonist im Drehbuch'
            : 'Verknüpft mit Protagonisten',
          distinguishingMarks: cat === 'logo'
            ? 'IMMER rechts unten, dezent & transparent (25% Deckkraft)'
            : 'keine Bildfehler, hohe fotorealistische Konsistenz',
          photoUrl: dataUrl,
          isActiveInProject: true,
        };

        onUpdateReferences([...references, newRef]);
        onShowToast('success', `Bild "${cleanName}" als ${CATEGORY_CONFIG[cat].label} hinzugefügt!`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-6">
      {/* 1. Header & Dedicated Action Toolbar */}
      <div className="space-y-4 border-b border-zinc-100 pb-5">
        {/* Top Info Block */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Referenz- &amp; Objektkatalog
            </span>
            <span className="text-[11px] font-mono text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200 font-bold">
              {references.length} Referenzen aktiv
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Anti-Clone &amp; Anti-Babble Lock Aktiv
            </span>
          </div>
          <h3 className="text-base md:text-lg font-bold text-zinc-900">
            Referenzen, Darsteller, Baukörper &amp; Wasserzeichen verwalten
          </h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-3xl">
            Definiere exakt, <em>wer was macht</em> und <em>wer mit wem wie zusammengehört</em>. Alle Anker werden im Format{' '}
            <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-300 rounded font-mono text-indigo-900 font-bold">&lt;Subject X&gt;</code>{' '}
            und <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-300 rounded font-mono text-indigo-900 font-bold">@SubjectX_Name</code> verbindlich in LM Studio, Maestro 2.1.6 und MiniMax H3 übernommen.
          </p>
        </div>

        {/* Clean, Fully Responsive Action Toolbar (No Overflow) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50/90 p-3 rounded-2xl border border-zinc-200">
          {/* Primary AI & Analysis Tools Group */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleElaborateRoles}
              disabled={isElaboratingRoles || references.length === 0}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                isElaboratingRoles
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 border border-amber-500/30'
              }`}
              title="Sendet alle Referenzbilder & Kontext an LM Studio Vision zur optischen Analyse (Gesichtszüge, Kleidung, Identitätsanker) und erarbeitet verbindliche Rollen"
            >
              {isElaboratingRoles ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-900" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
              )}
              <span>
                {isElaboratingRoles ? 'Bildanalyse & Rollen laufen...' : '✨ Rollen & Bildanalyse per LM Studio'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsMaestroModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-800 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs border border-zinc-200"
              title="Maestro 2.1.6 Slot-Labels und Bindings anzeigen"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Maestro 2.1.6 Slots ({references.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-800 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs border border-zinc-200"
              title="8 Bilder auf einmal analysieren und importieren"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>8-Bilder Scan</span>
            </button>
          </div>

          {/* Quick Add Reference Group */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900 p-1 rounded-xl shadow-xs text-white">
            <span className="text-[10px] font-bold text-zinc-400 px-2 uppercase tracking-wider">
              + Neu:
            </span>
            <button
              type="button"
              onClick={() => handleAddReference('building')}
              className="px-2.5 py-1.5 hover:bg-zinc-800 text-amber-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="Neues Haus / Grundriss hinzufügen"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Haus</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddReference('human')}
              className="px-2.5 py-1.5 hover:bg-zinc-800 text-blue-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="Neuen Menschen / Darsteller hinzufügen"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mensch</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddReference('object')}
              className="px-2.5 py-1.5 hover:bg-zinc-800 text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="Neuen Gegenstand / Requisite hinzufügen"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Prop</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddReference('logo')}
              className="px-2.5 py-1.5 hover:bg-zinc-800 text-indigo-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="Neues Firmenlogo (25% Deckkraft rechts unten) hinzufügen"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Logo</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddReference('animal')}
              className="px-2.5 py-1.5 hover:bg-zinc-800 text-purple-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="Neues Tier / Begleiter hinzufügen"
            >
              <Dog className="w-3.5 h-3.5" />
              <span>Tier</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-5 border-2 border-dashed rounded-2xl text-center transition cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/80 scale-[0.99]'
            : 'border-zinc-300 bg-zinc-50/70 hover:bg-zinc-100 hover:border-zinc-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processUploadedFiles(e.target.files);
            }
          }}
        />

        <div className="flex items-center gap-3.5 text-left">
          <div className="w-11 h-11 rounded-xl bg-white border border-zinc-200 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900">
              Referenzbilder per Drag &amp; Drop hier ablegen oder durchsuchen
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Fotos von Bauherren, Grundriss-Renderings, Fassaden, Requisiten oder Firmenlogos automatisch importieren.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-medium text-zinc-600 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg shadow-2xs">
            PNG, JPG, WEBP, SVG
          </span>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
            Auto-Klassifizierung
          </span>
        </div>
      </div>

      {/* 3. Filter Navigation & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeCategoryFilter === 'all'
                ? 'bg-zinc-900 text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <span>Alle ({countAll})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryFilter('building')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeCategoryFilter === 'building'
                ? 'bg-amber-500 text-zinc-950 shadow-2xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-amber-600" />
            <span>Haus &amp; Grundriss ({countBuildings})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryFilter('human')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeCategoryFilter === 'human'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Menschen ({countHumans})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryFilter('object')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeCategoryFilter === 'object'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Props ({countObjects})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryFilter('logo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeCategoryFilter === 'logo'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Firmenlogo ({countLogos})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Referenzen filtern..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* 4. Structured References Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredReferences.map((ref, idx) => {
          const catConfig = CATEGORY_CONFIG[ref.category] || CATEGORY_CONFIG.human;
          const isExpanded = expandedRefIds.has(ref.id);
          const currentTag = getReferenceTag(ref, idx);
          const currentAnchor = getMaestroAnchor(ref, idx);

          return (
            <div
              key={ref.id}
              className={`border rounded-2xl p-4.5 space-y-3.5 transition shadow-2xs flex flex-col justify-between ${
                ref.isActiveInProject === false
                  ? 'opacity-60 border-zinc-200 bg-zinc-50'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
            >
              {/* Card Header: Avatar, Tags & Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Photo with hover Camera replacement */}
                  <div className="relative group shrink-0">
                    {ref.photoUrl ? (
                      <div className="relative">
                        <img
                          src={ref.photoUrl}
                          alt={ref.name}
                          className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shadow-2xs group-hover:brightness-90 transition"
                        />
                        {ref.category === 'logo' && (
                          <div
                            title="Wasserzeichen: 25% Deckkraft, IMMER unten rechts"
                            className="absolute bottom-0.5 right-0.5 bg-indigo-950/85 text-white text-[8px] font-bold px-1 py-0.2 rounded shadow-2xs backdrop-blur-xs flex items-center gap-0.5"
                          >
                            <Droplets className="w-2 h-2 text-amber-300" />
                            <span>25% BR</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 text-zinc-400 flex flex-col items-center justify-center border border-zinc-200 relative group-hover:bg-zinc-200 transition">
                        {catConfig.icon}
                        <span className="text-[9px] font-mono mt-0.5 font-bold text-zinc-600">
                          {currentTag}
                        </span>
                      </div>
                    )}

                    {/* Camera Upload Overlay */}
                    <label
                      title="Bild ändern / hochladen"
                      className="absolute inset-0 bg-black/45 text-white opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              handleUpdateRef(ref.id, 'photoUrl', ev.target?.result as string);
                              onShowToast('success', `Bild für "${ref.name}" gespeichert.`);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Identification Details */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Tag Badge */}
                      <span className="text-[11px] font-mono font-bold text-zinc-900 bg-zinc-100 border border-zinc-300 px-2 py-0.5 rounded-md">
                        {currentTag}
                      </span>

                      {/* Interactive Category Selector with Dropdown */}
                      <div className="relative inline-flex items-center">
                        <select
                          value={ref.category}
                          onChange={(e) => {
                            const newCat = e.target.value as ScreenplayReferenceCategory;
                            handleUpdateRef(ref.id, 'category', newCat);
                            onShowToast('info', `Kategorie auf "${CATEGORY_CONFIG[newCat]?.label}" geändert.`);
                          }}
                          className={`text-[10px] font-bold pl-2 pr-5 py-0.5 rounded-md border appearance-none cursor-pointer focus:outline-none transition shadow-2xs font-sans ${catConfig.badge}`}
                          title="Klicke hier, um die Kategorie (Haus & Grundriss, Mensch, Requisite, Logo) manuell umzuschalten"
                        >
                          <option value="building">🏠 Haus &amp; Grundriss (&lt;Building&gt;)</option>
                          <option value="human">👤 Mensch / Darsteller (&lt;Subject&gt;)</option>
                          <option value="object">📦 Gegenstand / Prop (&lt;Object&gt;)</option>
                          <option value="logo">✨ Firmenlogo (25% BR Wasserzeichen)</option>
                          <option value="animal">🐕 Tier / Begleiter (&lt;Animal&gt;)</option>
                          <option value="environment">🌲 Umgebung / Kulisse (&lt;Env&gt;)</option>
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 text-zinc-600 absolute right-1 pointer-events-none" />
                      </div>
                    </div>

                    {/* Name Input */}
                    <input
                      type="text"
                      value={ref.name}
                      onChange={(e) => handleUpdateRef(ref.id, 'name', e.target.value)}
                      placeholder="Name der Referenz..."
                      className="w-full font-bold text-xs text-zinc-900 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:outline-none transition py-0.5"
                    />

                    {/* Maestro Tag Chip */}
                    <button
                      type="button"
                      onClick={() => handleCopyTag(currentAnchor)}
                      title="Klick zum Kopieren des Maestro-Anker-Tags"
                      className="text-[10px] font-mono text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>{currentAnchor}</span>
                      {copiedTag === currentAnchor ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-indigo-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Top Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Active Toggle */}
                  <button
                    type="button"
                    onClick={() => handleUpdateRef(ref.id, 'isActiveInProject', !ref.isActiveInProject)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      ref.isActiveInProject !== false
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {ref.isActiveInProject !== false ? '✓ Aktiv' : 'Pausiert'}
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => handleDuplicateRef(ref)}
                    title="Referenz duplizieren"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteRef(ref.id)}
                    title="Referenz löschen"
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Logo Specific Banner */}
              {ref.category === 'logo' && (
                <div className="bg-indigo-50/90 border border-indigo-200 text-indigo-950 p-2.5 rounded-xl text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <p className="text-[11px] leading-snug">
                    <strong>Wasserzeichen-Regel:</strong> Dieses Logo wird in allen Szenen <strong>IMMER rechts unten, dezent &amp; transparent (25% Deckkraft)</strong> gerendert.
                  </p>
                </div>
              )}

              {/* Key Semantic Fields: "Wer was macht" & "Wer mit wem zusammengehört" */}
              <div className="space-y-2 pt-1 border-t border-zinc-100">
                {/* Wer was macht */}
                <div className="bg-zinc-50/70 p-2.5 rounded-xl border border-zinc-200 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center justify-between">
                    <span>Wer macht was? (Rolle &amp; Handlung im Film):</span>
                  </label>
                  <input
                    type="text"
                    value={ref.roleOrAction || ''}
                    onChange={(e) => handleUpdateRef(ref.id, 'roleOrAction', e.target.value)}
                    placeholder={
                      ref.category === 'logo'
                        ? 'Dezentes Wasserzeichen in der rechten unteren Ecke (Bottom-Right)'
                        : ref.category === 'building'
                        ? 'Architektonisches Hauptmotiv, Drohnenanflug, Panoramafenster, Terrasse'
                        : 'Erkundet Raumachsen, öffnet Schiebetüren, begutachtet Parkett'
                    }
                    className="w-full text-xs text-zinc-900 bg-transparent focus:outline-none placeholder:text-zinc-400"
                  />
                </div>

                {/* Wer mit wem wie zusammen gehört */}
                <div className="bg-zinc-50/70 p-2.5 rounded-xl border border-zinc-200 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center justify-between">
                    <span>Wer gehört mit wem wie zusammen? (Beziehung &amp; Kontext):</span>
                  </label>
                  <input
                    type="text"
                    value={ref.relationship || ''}
                    onChange={(e) => handleUpdateRef(ref.id, 'relationship', e.target.value)}
                    placeholder={
                      ref.category === 'logo'
                        ? 'Markenidentität für alle Windows im Video'
                        : ref.category === 'building'
                        ? 'Architektonisches Zentrum für alle Protagonisten, neues Eigenheim'
                        : 'Ehepaar / Partner mit Subject 2, zieht in Musterhaus (Building 1) ein'
                    }
                    className="w-full text-xs text-zinc-900 bg-transparent focus:outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* Detailed Visual Attributes Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleExpand(ref.id)}
                  className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-zinc-600 hover:text-zinc-900 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Visuelle Details &amp; Haptik (Haare, Material, Verglasung, Kleidung)</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl animate-in fade-in duration-100 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-600 block">
                        {ref.category === 'human' ? 'Statur / Haltung:' : 'Baukörper / Form:'}
                      </label>
                      <input
                        type="text"
                        value={ref.build || ''}
                        onChange={(e) => handleUpdateRef(ref.id, 'build', e.target.value)}
                        placeholder="z.B. schlank, aufrechte Haltung"
                        className="w-full p-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-600 block">
                        {ref.category === 'human' ? 'Haare / Frisur:' : 'Material / Fassade:'}
                      </label>
                      <input
                        type="text"
                        value={ref.hairOrMaterial || ''}
                        onChange={(e) => handleUpdateRef(ref.id, 'hairOrMaterial', e.target.value)}
                        placeholder="z.B. Lärchenholz-Lamellen, Feinputz"
                        className="w-full p-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-600 block">
                        {ref.category === 'human' ? 'Augen / Blick:' : 'Verglasung / Fenster:'}
                      </label>
                      <input
                        type="text"
                        value={ref.eyesOrGlazing || ''}
                        onChange={(e) => handleUpdateRef(ref.id, 'eyesOrGlazing', e.target.value)}
                        placeholder="z.B. bodentiefe Dreifach-Isolierverglasung"
                        className="w-full p-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-600 block">
                        {ref.category === 'human' ? 'Kleidung / Stil:' : 'Finish / Oberflächen:'}
                      </label>
                      <input
                        type="text"
                        value={ref.clothingOrFinish || ''}
                        onChange={(e) => handleUpdateRef(ref.id, 'clothingOrFinish', e.target.value)}
                        placeholder="z.B. Leinenkleidung in Naturtönen"
                        className="w-full p-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-600 block">
                        Besonderheiten &amp; Konsistenz:
                      </label>
                      <input
                        type="text"
                        value={ref.distinguishingMarks || ''}
                        onChange={(e) => handleUpdateRef(ref.id, 'distinguishingMarks', e.target.value)}
                        placeholder="z.B. keine Bildfehler, natürliche Hautreflexionen"
                        className="w-full p-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dedicated Single Image Analysis Button per Card */}
              <div className="pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  id={`btn-single-task-${ref.id}`}
                  onClick={() => handleRunSingleTask(ref.id)}
                  disabled={analyzingRefId === ref.id}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 hover:from-amber-400 hover:to-amber-500 hover:text-zinc-950 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 border border-zinc-700 hover:border-amber-400 group/btn"
                >
                  {analyzingRefId === ref.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span className="text-amber-300">Analysiere Einzelbild #{idx + 1}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover/btn:text-zinc-950 group-hover/btn:fill-zinc-950 transition-colors" />
                      <span>
                        {ref.taskStatus === 'completed'
                          ? `⚡ Einzelbild #${idx + 1} erneut per LM Studio analysieren`
                          : `⚡ Einzelbild #${idx + 1} per LM Studio analysieren`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 8-Bilder KI-Multi-Scan & Maestro-Namen Modal */}
      <BatchReferenceAnalyzerModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onImportReferences={(newRefs) => {
          onUpdateReferences([...references, ...newRefs]);
          setIsBatchModalOpen(false);
        }}
        lmStudioEndpoint={lmStudioEndpoint}
        lmStudioModel={lmStudioModel}
        lmStudioApiKey={lmStudioApiKey}
        onShowToast={onShowToast}
      />

      {/* Maestro 2.1.6 Reference Bindings Matrix Modal */}
      <MaestroBindingsModal
        isOpen={isMaestroModalOpen}
        onClose={() => setIsMaestroModalOpen(false)}
        references={references}
        projectTitle={projectTitle}
        targetAudience={targetAudience}
        onShowToast={onShowToast}
      />
    </div>
  );
};
