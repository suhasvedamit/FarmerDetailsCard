import { useSyncExternalStore } from 'react';

export type CardSide = 'front' | 'back';
export type ImageFitMode = 'cover' | 'contain' | 'stretch';
export type CustomBackMode = 'separate' | 'same_as_front' | 'blank';

export const CARD_CANVAS_WIDTH = 1050;
export const CARD_CANVAS_HEIGHT = 660;

export interface CustomCardStyle {
  textTheme?: 'dark' | 'light';
  contentBackdrop?: 'none' | 'light' | 'dark';
  borderColor?: string;
  frontFitMode?: ImageFitMode;
  backFitMode?: ImageFitMode;
  backMode?: CustomBackMode;
}

export interface CardTemplate {
  id: string;
  name: string;
  folderName: string;
  frontUrl: string;
  backUrl: string;
  url: string;
  hasSeparateBack: boolean;
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
  rawFrontUrl?: string;
  rawBackUrl?: string;
  customStyle?: CustomCardStyle;
}

const templateModules = import.meta.glob(
  '../assets/card_template/**/*.{png,jpg,jpeg,webp,svg,PNG,JPG,JPEG,WEBP,SVG}',
  {
    eager: true,
    import: 'default',
  }
) as Record<string, string>;

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

function formatTemplateName(rawName: string): string {
  const spaced = rawName
    .replace(/[_-]+/g, ' ')
    .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
    .replace(/(\d+)([a-zA-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (!spaced) return rawName;

  return spaced
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function detectCardSide(baseName: string): CardSide | null {
  const normalized = baseName.trim().toLowerCase();
  if (
    normalized === 'front' ||
    /(?:^|[_\-\s])front$/.test(normalized) ||
    /^front(?:[_\-\s]|$)/.test(normalized)
  ) {
    return 'front';
  }
  if (
    normalized === 'back' ||
    /(?:^|[_\-\s])back$/.test(normalized) ||
    /^back(?:[_\-\s]|$)/.test(normalized)
  ) {
    return 'back';
  }
  return null;
}

interface MutableTemplateEntry {
  id: string;
  name: string;
  folderName: string;
  frontUrl?: string;
  backUrl?: string;
  otherUrls: string[];
}

const templateEntries = new Map<string, MutableTemplateEntry>();

for (const [modulePath, url] of Object.entries(templateModules)) {
  if (!url) continue;

  const marker = '/card_template/';
  const markerIndex = modulePath.indexOf(marker);
  const relativePath =
    markerIndex !== -1
      ? modulePath.slice(markerIndex + marker.length)
      : modulePath.split('/').slice(-2).join('/');

  const segments = relativePath.split('/').filter(Boolean);
  if (segments.length === 0) continue;

  if (segments.length === 1) {
    // Fallback for single flat image placed directly inside card_template/
    const fileName = segments[0];
    const baseName = stripExtension(fileName);
    if (!templateEntries.has(fileName)) {
      templateEntries.set(fileName, {
        id: fileName,
        name: formatTemplateName(baseName),
        folderName: baseName,
        frontUrl: url,
        otherUrls: [],
      });
    }
    continue;
  }

  const fileName = segments[segments.length - 1];
  const folderSegments = segments.slice(0, -1);
  const folderId = folderSegments.join('/');
  const displayFolderName = folderSegments.map(formatTemplateName).join(' / ');
  const baseName = stripExtension(fileName);
  const side = detectCardSide(baseName);

  let entry = templateEntries.get(folderId);
  if (!entry) {
    entry = {
      id: folderId,
      name: displayFolderName,
      folderName: folderId,
      otherUrls: [],
    };
    templateEntries.set(folderId, entry);
  }

  if (side === 'front' && !entry.frontUrl) {
    entry.frontUrl = url;
  } else if (side === 'back' && !entry.backUrl) {
    entry.backUrl = url;
  } else {
    entry.otherUrls.push(url);
  }
}

export const CARD_TEMPLATES: CardTemplate[] = Array.from(templateEntries.values())
  .map((entry): CardTemplate | null => {
    const resolvedFront = entry.frontUrl || entry.otherUrls[0] || entry.backUrl || '';
    const resolvedBack =
      entry.backUrl ||
      (entry.frontUrl ? entry.frontUrl : entry.otherUrls[1] || entry.otherUrls[0]) ||
      '';

    if (!resolvedFront && !resolvedBack) return null;

    return {
      id: entry.id,
      name: entry.name,
      folderName: entry.folderName,
      frontUrl: resolvedFront,
      backUrl: resolvedBack,
      url: resolvedFront,
      hasSeparateBack: Boolean(entry.frontUrl && entry.backUrl),
    };
  })
  .filter((t): t is CardTemplate => t !== null)
  .sort((a, b) => {
    // Keep original card_template.* as the default first option when present
    const isDefaultA = a.folderName.toLowerCase() === 'card_template';
    const isDefaultB = b.folderName.toLowerCase() === 'card_template';
    if (isDefaultA !== isDefaultB) {
      return isDefaultA ? -1 : 1;
    }

    const nameOrder = a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    if (nameOrder !== 0) return nameOrder;

    return a.id.localeCompare(b.id, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

export const BUILT_IN_CARD_TEMPLATES: CardTemplate[] = CARD_TEMPLATES;

export const DEFAULT_CARD_TEMPLATE_ID: string = CARD_TEMPLATES[0]?.id ?? '';

export interface CardTemplatesSnapshot {
  all: CardTemplate[];
  builtIn: CardTemplate[];
  custom: CardTemplate[];
}

let customTemplatesList: CardTemplate[] = [];
const listeners = new Set<() => void>();

let cachedSnapshot: CardTemplatesSnapshot = {
  all: CARD_TEMPLATES,
  builtIn: CARD_TEMPLATES,
  custom: [],
};

function sortCustomTemplates(templates: CardTemplate[]): CardTemplate[] {
  return [...templates].sort((a, b) => {
    const timeA = a.updatedAt ?? a.createdAt ?? 0;
    const timeB = b.updatedAt ?? b.createdAt ?? 0;
    if (timeA !== timeB) return timeB - timeA;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}

function rebuildAndNotify(): void {
  cachedSnapshot = {
    all: [...customTemplatesList, ...CARD_TEMPLATES],
    builtIn: CARD_TEMPLATES,
    custom: customTemplatesList,
  };
  listeners.forEach((listener) => listener());
}

export function getCustomCardTemplates(): CardTemplate[] {
  return customTemplatesList;
}

export function getAllCardTemplates(): CardTemplate[] {
  return cachedSnapshot.all;
}

export function setCustomCardTemplates(templates: CardTemplate[]): void {
  customTemplatesList = sortCustomTemplates(templates.map((t) => ({ ...t, isCustom: true })));
  rebuildAndNotify();
}

export function upsertCustomCardTemplate(template: CardTemplate): void {
  const normalized: CardTemplate = { ...template, isCustom: true };
  const existingIdx = customTemplatesList.findIndex((t) => t.id === normalized.id);
  const next = [...customTemplatesList];
  if (existingIdx >= 0) {
    next[existingIdx] = normalized;
  } else {
    next.unshift(normalized);
  }
  customTemplatesList = sortCustomTemplates(next);
  rebuildAndNotify();
}

export function removeCustomCardTemplate(templateId: string): void {
  customTemplatesList = customTemplatesList.filter((t) => t.id !== templateId);
  rebuildAndNotify();
}

export function subscribeCardTemplates(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCardTemplatesSnapshot(): CardTemplatesSnapshot {
  return cachedSnapshot;
}

export function useCardTemplates(): CardTemplatesSnapshot {
  return useSyncExternalStore(
    subscribeCardTemplates,
    getCardTemplatesSnapshot,
    getCardTemplatesSnapshot
  );
}

export function getCardTemplateById(templateId?: string): CardTemplate | undefined {
  if (!templateId) return undefined;
  return (
    customTemplatesList.find((t) => t.id === templateId || t.folderName === templateId) ||
    CARD_TEMPLATES.find((t) => t.id === templateId || t.folderName === templateId)
  );
}

export function getCardTemplate(templateId?: string): CardTemplate | undefined {
  if (!templateId) return CARD_TEMPLATES[0] || customTemplatesList[0];
  return (
    getCardTemplateById(templateId) ||
    CARD_TEMPLATES[0] ||
    customTemplatesList[0]
  );
}

export function getCardTemplateUrl(
  templateId?: string,
  side: CardSide = 'front'
): string | undefined {
  const template = getCardTemplate(templateId);
  if (!template) return undefined;
  return side === 'back'
    ? template.backUrl || template.frontUrl
    : template.frontUrl || template.backUrl;
}

