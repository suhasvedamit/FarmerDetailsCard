export interface CardTemplate {
  id: string;
  name: string;
  fileName: string;
  url: string;
}

const templateModules = import.meta.glob(
  '../assets/card_template/*.{png,jpg,jpeg,webp,svg,PNG,JPG,JPEG,WEBP,SVG}',
  {
    eager: true,
    import: 'default',
  }
) as Record<string, string>;

function formatTemplateName(fileName: string): string {
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const spaced = baseName
    .replace(/[_-]+/g, ' ')
    .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
    .replace(/(\d+)([a-zA-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (!spaced) return fileName;

  return spaced
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getBaseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

const templateMap = new Map<string, CardTemplate>();

for (const [modulePath, url] of Object.entries(templateModules)) {
  if (!url) continue;
  const fileName = modulePath.split('/').pop() || modulePath;
  if (!templateMap.has(fileName)) {
    templateMap.set(fileName, {
      id: fileName,
      name: formatTemplateName(fileName),
      fileName,
      url,
    });
  }
}

export const CARD_TEMPLATES: CardTemplate[] = Array.from(templateMap.values()).sort((a, b) => {
  const baseA = getBaseName(a.fileName);
  const baseB = getBaseName(b.fileName);

  // Keep original card_template.* as the default first option when present
  const isDefaultA = baseA.toLowerCase() === 'card_template';
  const isDefaultB = baseB.toLowerCase() === 'card_template';
  if (isDefaultA !== isDefaultB) {
    return isDefaultA ? -1 : 1;
  }

  const baseOrder = baseA.localeCompare(baseB, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  if (baseOrder !== 0) return baseOrder;

  return a.fileName.localeCompare(b.fileName, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
});

export const DEFAULT_CARD_TEMPLATE_ID: string = CARD_TEMPLATES[0]?.id ?? '';

export function getCardTemplate(templateId?: string): CardTemplate | undefined {
  if (!templateId) return CARD_TEMPLATES[0];
  return (
    CARD_TEMPLATES.find((t) => t.id === templateId || t.fileName === templateId) ||
    CARD_TEMPLATES[0]
  );
}

