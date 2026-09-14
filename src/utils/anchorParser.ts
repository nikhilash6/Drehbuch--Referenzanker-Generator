import { CharacterAnchorFeatures, ExtractedAnchor, ReferenceCategory } from '../types';

export function parseSingleReferenceAnalysis(
  rawText: string,
  referenceId: string,
  referenceName: string,
  category: ReferenceCategory
): { extractedAnchor: ExtractedAnchor; characterFeature?: CharacterAnchorFeatures } {
  const text = rawText || '';

  const extractField = (patterns: RegExp[]): string => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m && m[1]) {
        return m[1].replace(/^[–\-*:]\s*/, '').trim();
      }
    }
    return '';
  };

  // Find explicit compact prompt anchor in output
  let compactAnchor = extractField([
    /(?:PROMPT-ANKER|Prompt Anker|Konsistenz-Anker|Anchor Tag|MULTI-ENTITY PROMPT-ANKER|PROP PROMPT-ANKER|VEHICLE PROMPT-ANKER|ENVIRONMENT PROMPT-ANKER)[:\s]+([^\n]+(?:\n[^\n]+)?)/i,
  ]);

  const attributes: Record<string, string> = {};

  if (category === 'person') {
    const gesichtsform = extractField([/Gesichtsform[:\s]+([^\n]+)/i, /Gesicht[:\s]+([^\n]+)/i]);
    const augenfarbe = extractField([/Augenfarbe[:\s]+([^\n]+)/i]);
    const augenform = extractField([/Augenform[:\s]+([^\n]+)/i]);
    const augenbrauen = extractField([/Augenbrauen[:\s]+([^\n]+)/i]);
    const nase = extractField([/Nase[:\s]+([^\n]+)/i]);
    const mund = extractField([/Mund[:\s]+([^\n]+)/i, /Lippen[:\s]+([^\n]+)/i]);
    const kiefer_kinn = extractField([/(?:Kiefer|Kinn)[:\s]+([^\n]+)/i]);
    const hautfarbe_teint = extractField([/(?:Hautfarbe|Teint|Haut)[:\s]+([^\n]+)/i]);
    const haarfarbe = extractField([/Haarfarbe[:\s]+([^\n]+)/i]);
    const haarlaenge = extractField([/Haarlänge[:\s]+([^\n]+)/i]);
    const haarstruktur = extractField([/Haarstruktur[:\s]+([^\n]+)/i]);
    const pony = extractField([/Pony[:\s]+([^\n]+)/i]);
    const besondere_merkmale = extractField([/Besondere Merkmale[:\s]+([^\n]+)/i, /Merkmale[:\s]+([^\n]+)/i]);
    const alter_ca = extractField([/Alter(?:\s*ca\.?)?[:\s]+([^\n]+)/i]);
    const koerperbau = extractField([/Körperbau[:\s]+([^\n]+)/i, /Statur[:\s]+([^\n]+)/i]);

    attributes['Gesichtsform'] = gesichtsform || 'Oval';
    attributes['Augenfarbe'] = augenfarbe || 'Dunkel';
    attributes['Augenform'] = augenform || 'Mandelförmig';
    attributes['Augenbrauen'] = augenbrauen || 'Definiert';
    attributes['Nase'] = nase || 'Gerade';
    attributes['Mund / Lippen'] = mund || 'Normal';
    attributes['Kiefer / Kinn'] = kiefer_kinn || 'Weich';
    attributes['Hautfarbe / Teint'] = hautfarbe_teint || 'Hell/Medium';
    attributes['Haarfarbe'] = haarfarbe || 'Braun';
    attributes['Haarlänge'] = haarlaenge || 'Schulterlang';
    attributes['Haarstruktur'] = haarstruktur || 'Glatt';
    attributes['Pony'] = pony || 'Nein';
    attributes['Besondere Merkmale'] = besondere_merkmale || 'Keine auffälligen Narben';
    attributes['Alter'] = alter_ca || 'ca. 25-30';
    attributes['Körperbau'] = koerperbau || 'Normal/Schlank';

    if (!compactAnchor) {
      const parts = [
        referenceName,
        alter_ca ? `${alter_ca}yo` : '',
        gesichtsform ? `${gesichtsform} face` : '',
        augenfarbe ? `${augenfarbe} eyes` : '',
        haarfarbe ? `${haarlaenge} ${haarstruktur} ${haarfarbe} hair` : '',
        besondere_merkmale ? besondere_merkmale : '',
      ].filter(Boolean);
      compactAnchor = parts.join(', ');
    }

    const charFeature: CharacterAnchorFeatures = {
      name: referenceName,
      gesichtsform: attributes['Gesichtsform'],
      augenfarbe: attributes['Augenfarbe'],
      augenform: attributes['Augenform'],
      augenbrauen: attributes['Augenbrauen'],
      nase: attributes['Nase'],
      mund: attributes['Mund / Lippen'],
      kiefer_kinn: attributes['Kiefer / Kinn'],
      hautfarbe_teint: attributes['Hautfarbe / Teint'],
      haarfarbe: attributes['Haarfarbe'],
      haarlaenge: attributes['Haarlänge'],
      haarstruktur: attributes['Haarstruktur'],
      pony: attributes['Pony'],
      besondere_merkmale: attributes['Besondere Merkmale'],
      alter_ca: attributes['Alter'],
      koerperbau: attributes['Körperbau'],
      compactPromptAnchor: compactAnchor,
    };

    const extractedAnchor: ExtractedAnchor = {
      id: `anchor-${referenceId}`,
      referenceId,
      name: referenceName,
      category,
      rawText,
      attributes,
      compactPromptAnchor: compactAnchor,
    };

    return { extractedAnchor, characterFeature: charFeature };
  }

  if (category === 'multi_subject') {
    // E.g. Person with 2 dogs
    const hund1Rasse = extractField([/(?:Hund 1|Tier 1)[^:]*Rasse[:\s]+([^\n]+)/i, /Hund 1[:\s]+([^\n]+)/i]);
    const hund1Fell = extractField([/(?:Hund 1|Tier 1)[^:]*Fell(?:farbe)?[:\s]+([^\n]+)/i]);
    const hund2Rasse = extractField([/(?:Hund 2|Tier 2)[^:]*Rasse[:\s]+([^\n]+)/i, /Hund 2[:\s]+([^\n]+)/i]);
    const hund2Fell = extractField([/(?:Hund 2|Tier 2)[^:]*Fell(?:farbe)?[:\s]+([^\n]+)/i]);
    const relation = extractField([/(?:Räumliche Relation|Relation|Positionierung|Interaktion)[:\s]+([^\n]+)/i]);

    attributes['Hauptperson'] = extractField([/(?:LISTE 1: PERSON|Person)[:\s]+([^\n]+)/i]) || referenceName;
    attributes['Hund 1 (Primär)'] = `${hund1Rasse || 'Hund 1'} ${hund1Fell ? `(${hund1Fell})` : ''}`.trim();
    attributes['Hund 2 (Sekundär)'] = `${hund2Rasse || 'Hund 2'} ${hund2Fell ? `(${hund2Fell})` : ''}`.trim();
    attributes['Räumliche Relation'] = relation || 'Person zwischen beiden Hunden';

    if (!compactAnchor) {
      compactAnchor = `${referenceName}, flanked by two distinct dogs (${hund1Rasse || 'dog 1'} on the left, ${hund2Rasse || 'dog 2'} on the right), consistent breed markings, coherent physical proximity`;
    }

    const charFeature: CharacterAnchorFeatures = {
      name: referenceName,
      gesichtsform: 'Siehe Multi-Subjekt',
      augenfarbe: 'Siehe Multi-Subjekt',
      augenform: 'Siehe Multi-Subjekt',
      augenbrauen: 'Siehe Multi-Subjekt',
      nase: 'Siehe Multi-Subjekt',
      mund: 'Siehe Multi-Subjekt',
      kiefer_kinn: 'Siehe Multi-Subjekt',
      hautfarbe_teint: 'Siehe Multi-Subjekt',
      haarfarbe: 'Siehe Multi-Subjekt',
      haarlaenge: 'Siehe Multi-Subjekt',
      haarstruktur: 'Siehe Multi-Subjekt',
      pony: 'nein',
      besondere_merkmale: `Begleiter: ${attributes['Hund 1 (Primär)']}, ${attributes['Hund 2 (Sekundär)']}`,
      alter_ca: 'Erwachsen',
      koerperbau: 'Normal',
      compactPromptAnchor: compactAnchor,
      companionDetails: `2 Hunde: ${attributes['Hund 1 (Primär)']} & ${attributes['Hund 2 (Sekundär)']} | Relation: ${attributes['Räumliche Relation']}`,
    };

    return {
      extractedAnchor: {
        id: `anchor-${referenceId}`,
        referenceId,
        name: referenceName,
        category,
        rawText,
        attributes,
        compactPromptAnchor: compactAnchor,
      },
      characterFeature: charFeature,
    };
  }

  // Floorplan / Architecture / Building Layout parsing
  if (category === 'floorplan' || category === 'architecture') {
    const raumaufteilung = extractField([/(?:Raumaufteilung|Räume|Zimmer|Layout)[:\s]+([^\n]+)/i]);
    const kuecheLage = extractField([/(?:Küche|Kochbereich|Kitchen)[:\s]+([^\n]+)/i]);
    const sichtachse = extractField([/(?:Sichtachse|Blickachse|Flurachse|Korridor)[:\s]+([^\n]+)/i]);
    const terrasseGarten = extractField([/(?:Terrasse|Gartenanbindung|Außenbereich)[:\s]+([^\n]+)/i]);
    const besonderheiten = extractField([/(?:Besonderheiten|Architektur-Merkmale|Grundriss-Details)[:\s]+([^\n]+)/i]);

    if (raumaufteilung) attributes['Raumaufteilung'] = raumaufteilung;
    if (kuecheLage) attributes['Lage der Küche'] = kuecheLage;
    if (sichtachse) attributes['Hauptsichtachse'] = sichtachse;
    if (terrasseGarten) attributes['Terrassenzugang'] = terrasseGarten;
    if (besonderheiten) attributes['Grundriss-Besonderheiten'] = besonderheiten;

    if (!compactAnchor) {
      const roomStr = raumaufteilung || 'open floor plan layout with seamless room transitions';
      const kitchenStr = kuecheLage ? `, kitchen located at ${kuecheLage}` : '';
      const axisStr = sichtachse ? `, primary sightline: ${sichtachse}` : '';
      compactAnchor = `architectural floorplan layout of ${referenceName}: ${roomStr}${kitchenStr}${axisStr}, precise spatial geometry and clean room flow`;
    }

    return {
      extractedAnchor: {
        id: `anchor-${referenceId}`,
        referenceId,
        name: referenceName,
        category,
        rawText,
        attributes,
        compactPromptAnchor: compactAnchor,
      },
      characterFeature: {
        name: referenceName,
        gesichtsform: '-',
        augenfarbe: '-',
        augenform: '-',
        augenbrauen: '-',
        nase: '-',
        mund: '-',
        kiefer_kinn: '-',
        hautfarbe_teint: '-',
        haarfarbe: '-',
        haarlaenge: '-',
        haarstruktur: '-',
        pony: 'nein',
        besondere_merkmale: Object.entries(attributes).map(([k, v]) => `${k}: ${v}`).join('; ') || 'Wohnungsgrundriss & Raumaufteilung',
        alter_ca: '-',
        koerperbau: '-',
        compactPromptAnchor: compactAnchor,
      },
    };
  }

  // Object / Vehicle / Environment / Style
  const material = extractField([/(?:Material|Hauptmaterial)[:\s]+([^\n]+)/i]);
  const form = extractField([/(?:Form|Geometrische Form|Silhouette)[:\s]+([^\n]+)/i]);
  const farbe = extractField([/(?:Farbgebung|Farbe|Lackierung)[:\s]+([^\n]+)/i]);
  const zustand = extractField([/(?:Zustand|Oberfläche|Patina|Verschleiß)[:\s]+([^\n]+)/i]);
  const details = extractField([/(?:Besondere Kennzeichen|Details|Gravuren)[:\s]+([^\n]+)/i]);

  if (material) attributes['Material'] = material;
  if (form) attributes['Form / Proportion'] = form;
  if (farbe) attributes['Farbe / Lack'] = farbe;
  if (zustand) attributes['Oberfläche / Patina'] = zustand;
  if (details) attributes['Details / Merkmale'] = details;

  if (!compactAnchor) {
    compactAnchor = `${referenceName}, ${farbe ? farbe + ' ' : ''}${material ? material + ' ' : ''}${form || 'prop'}, authentic surface wear, photorealistic consistent lighting`;
  }

  return {
    extractedAnchor: {
      id: `anchor-${referenceId}`,
      referenceId,
      name: referenceName,
      category,
      rawText,
      attributes,
      compactPromptAnchor: compactAnchor,
    },
    characterFeature: {
      name: referenceName,
      gesichtsform: '-',
      augenfarbe: '-',
      augenform: '-',
      augenbrauen: '-',
      nase: '-',
      mund: '-',
      kiefer_kinn: '-',
      hautfarbe_teint: '-',
      haarfarbe: '-',
      haarlaenge: '-',
      haarstruktur: '-',
      pony: 'nein',
      besondere_merkmale: Object.entries(attributes).map(([k, v]) => `${k}: ${v}`).join('; '),
      alter_ca: '-',
      koerperbau: '-',
      compactPromptAnchor: compactAnchor,
    },
  };
}

export function parseAnchorAnalysisText(rawText: string, defaultNames: string[] = ['Referenz 1', 'Referenz 2']): CharacterAnchorFeatures[] {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const listRegex = /(?:^|\n)(?:[#*_\s]*)(?:Liste\s*\d+|Person\s*\d+|Charakter\s*\d+|Referenz\s*\d+)[^\n]*/gi;
  const sections: { title: string; body: string }[] = [];

  let match: RegExpExecArray | null;
  const matches: { index: number; title: string }[] = [];
  while ((match = listRegex.exec(rawText)) !== null) {
    matches.push({ index: match.index, title: match[0].trim() });
  }

  if (matches.length >= 2) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i < matches.length - 1 ? matches[i + 1].index : rawText.length;
      sections.push({
        title: matches[i].title,
        body: rawText.slice(start, end).trim(),
      });
    }
  } else {
    sections.push({ title: defaultNames[0] || 'Referenz 1', body: rawText });
  }

  return sections.map((sec, idx) => {
    const single = parseSingleReferenceAnalysis(
      sec.body,
      `ref-${idx + 1}`,
      defaultNames[idx] || `Referenz ${idx + 1}`,
      'person'
    );
    return single.characterFeature!;
  });
}
