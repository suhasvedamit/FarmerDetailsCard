import {
  CARD_CANVAS_HEIGHT,
  CARD_CANVAS_WIDTH,
  CardSide,
  ImageFitMode,
} from './cardTemplates';

export const CUSTOM_IMAGE_MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const TARGET_EXPORT_W = CARD_CANVAS_WIDTH * 2; // 2100 px
const TARGET_EXPORT_H = CARD_CANVAS_HEIGHT * 2; // 1320 px

const ALLOWED_EXTENSIONS = /\.(png|jpe?g|webp|svg)$/i;

export interface LoadedImageFileResult {
  dataUrl: string;
  width: number;
  height: number;
  fileName: string;
}

function loadImgElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the selected image file.'));
    img.src = src;
  });
}

export async function readImageFileAsDataUrl(file: File): Promise<LoadedImageFileResult> {
  const isImageMime = file.type.startsWith('image/');
  const hasAllowedExt = ALLOWED_EXTENSIONS.test(file.name);
  if (!isImageMime && !hasAllowedExt) {
    throw new Error('Please upload a valid image file (PNG, JPG, WebP, or SVG).');
  }

  if (file.size > CUSTOM_IMAGE_MAX_BYTES) {
    throw new Error('Image file is larger than 15 MB. Please upload a smaller image.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await loadImgElement(dataUrl);
  const width = img.naturalWidth || img.width || TARGET_EXPORT_W;
  const height = img.naturalHeight || img.height || TARGET_EXPORT_H;

  return {
    dataUrl,
    width,
    height,
    fileName: file.name,
  };
}

function canvasToOptimizedDataUrl(canvas: HTMLCanvasElement): string {
  const pngUrl = canvas.toDataURL('image/png');
  // Keep PNG unless exceptionally large (e.g. heavy photographic texture > 3.5 MB base64)
  if (pngUrl.length <= 3_500_000) {
    return pngUrl;
  }
  const webpUrl = canvas.toDataURL('image/webp', 0.94);
  if (webpUrl.startsWith('data:image/webp') && webpUrl.length < pngUrl.length) {
    return webpUrl;
  }
  return pngUrl;
}

export async function renderFittedCardBackground(
  sourceUrl: string,
  fitMode: ImageFitMode = 'cover',
  fillColor: string = '#ffffff'
): Promise<string> {
  const img = await loadImgElement(sourceUrl);
  const imgW = img.naturalWidth || img.width || TARGET_EXPORT_W;
  const imgH = img.naturalHeight || img.height || TARGET_EXPORT_H;

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_EXPORT_W;
  canvas.height = TARGET_EXPORT_H;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }

  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, TARGET_EXPORT_W, TARGET_EXPORT_H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (fitMode === 'stretch') {
    ctx.drawImage(img, 0, 0, TARGET_EXPORT_W, TARGET_EXPORT_H);
  } else if (fitMode === 'contain') {
    const scale = Math.min(TARGET_EXPORT_W / imgW, TARGET_EXPORT_H / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const dx = (TARGET_EXPORT_W - drawW) / 2;
    const dy = (TARGET_EXPORT_H - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
  } else {
    // 'cover'
    const scale = Math.max(TARGET_EXPORT_W / imgW, TARGET_EXPORT_H / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const dx = (TARGET_EXPORT_W - drawW) / 2;
    const dy = (TARGET_EXPORT_H - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  return canvasToOptimizedDataUrl(canvas);
}

export function createBlankCardBackground(textTheme: 'dark' | 'light' = 'dark'): string {
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_EXPORT_W;
  canvas.height = TARGET_EXPORT_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (textTheme === 'light') {
    const grad = ctx.createLinearGradient(0, 0, TARGET_EXPORT_W, TARGET_EXPORT_H);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillRect(0, 0, TARGET_EXPORT_W, TARGET_EXPORT_H);

  return canvas.toDataURL('image/png');
}

interface SafeZoneBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  stroke: string;
  fill: string;
  textColor: string;
}

function getSafeZoneBoxes(side: CardSide): SafeZoneBox[] {
  if (side === 'back') {
    return [
      {
        x: 16,
        y: 12,
        w: 1018,
        h: 112,
        label: 'HEADER ZONE (Title / Logo)',
        stroke: '#0284c7',
        fill: 'rgba(14, 165, 233, 0.08)',
        textColor: '#0369a1',
      },
      {
        x: 65,
        y: 138,
        w: 920,
        h: 196,
        label: 'LAND DETAILS TABLE (Keep clear for text)',
        stroke: '#dc2626',
        fill: 'rgba(239, 68, 68, 0.07)',
        textColor: '#b91c1c',
      },
      {
        x: 65,
        y: 348,
        w: 920,
        h: 184,
        label: 'BANK DETAILS TABLE (Keep clear for text)',
        stroke: '#dc2626',
        fill: 'rgba(239, 68, 68, 0.07)',
        textColor: '#b91c1c',
      },
      {
        x: 16,
        y: 590,
        w: 1018,
        h: 58,
        label: 'FOOTER ZONE (Disclaimer / Branding)',
        stroke: '#0284c7',
        fill: 'rgba(14, 165, 233, 0.08)',
        textColor: '#0369a1',
      },
    ];
  }

  return [
    {
      x: 16,
      y: 12,
      w: 1018,
      h: 112,
      label: 'HEADER ZONE (Title / Logo)',
      stroke: '#0284c7',
      fill: 'rgba(14, 165, 233, 0.08)',
      textColor: '#0369a1',
    },
    {
      x: 36,
      y: 152,
      w: 191,
      h: 241,
      label: 'PHOTO SLOT (191×241)',
      stroke: '#7c3aed',
      fill: 'rgba(124, 58, 237, 0.09)',
      textColor: '#6d28d9',
    },
    {
      x: 252,
      y: 136,
      w: 540,
      h: 296,
      label: 'FARMER DETAILS (Keep clear)',
      stroke: '#dc2626',
      fill: 'rgba(239, 68, 68, 0.07)',
      textColor: '#b91c1c',
    },
    {
      x: 252,
      y: 444,
      w: 760,
      h: 154,
      label: 'ADDRESS AREA (Keep clear)',
      stroke: '#ea580c',
      fill: 'rgba(234, 88, 12, 0.07)',
      textColor: '#c2410c',
    },
    {
      x: 805,
      y: 180,
      w: 235,
      h: 235,
      label: 'QR CODE (235×235)',
      stroke: '#7c3aed',
      fill: 'rgba(124, 58, 237, 0.09)',
      textColor: '#6d28d9',
    },
    {
      x: 16,
      y: 604,
      w: 1018,
      h: 44,
      label: 'FOOTER ZONE (Disclaimer / Branding)',
      stroke: '#0284c7',
      fill: 'rgba(14, 165, 233, 0.08)',
      textColor: '#0369a1',
    },
  ];
}

export function drawSafeZonesOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  side: CardSide
): void {
  const scaleX = w / CARD_CANVAS_WIDTH;
  const scaleY = h / CARD_CANVAS_HEIGHT;
  const boxes = getSafeZoneBoxes(side);

  ctx.save();
  for (const box of boxes) {
    const bx = box.x * scaleX;
    const by = box.y * scaleY;
    const bw = box.w * scaleX;
    const bh = box.h * scaleY;

    ctx.fillStyle = box.fill;
    ctx.fillRect(bx, by, bw, bh);

    ctx.setLineDash([7 * scaleX, 5 * scaleX]);
    ctx.lineWidth = Math.max(1.5, 2 * scaleX);
    ctx.strokeStyle = box.stroke;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.setLineDash([]);

    // Label tag inside top-left corner of zone
    const fontSize = Math.round(13 * scaleX);
    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
    const padX = 7 * scaleX;
    const tagH = 20 * scaleY;
    const textW = ctx.measureText(box.label).width;
    const tagW = Math.min(bw - 4 * scaleX, textW + padX * 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(bx + 2 * scaleX, by + 2 * scaleY, tagW, tagH);

    ctx.fillStyle = box.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(box.label, bx + 2 * scaleX + padX, by + 2 * scaleY + tagH / 2);
  }
  ctx.restore();
}

export function downloadCardLayoutGuidePng(): void {
  const padding = 48;
  const gap = 48;
  const headerH = 92;
  const cardW = CARD_CANVAS_WIDTH;
  const cardH = CARD_CANVAS_HEIGHT;
  const totalW = cardW * 2 + gap + padding * 2;
  const totalH = cardH + headerH + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, totalW, totalH);

  // Title header
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 28px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Custom Card Design Layout Guide (CR80 • 1050 × 660 px per side)', padding, 50);

  ctx.fillStyle = '#475569';
  ctx.font = '500 17px Inter, sans-serif';
  ctx.fillText(
    'Design your Front & Back artwork at 1050×660 px (or 2100×1320 / 3235×2040 px). Keep red/purple zones clean for photo, text & QR.',
    padding,
    80
  );

  // Front Guide Card
  const frontX = padding;
  const cardY = headerH + 16;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(frontX, cardY, cardW, cardH);
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(frontX, cardY, cardW, cardH);

  ctx.save();
  ctx.translate(frontX, cardY);
  drawSafeZonesOverlay(ctx, cardW, cardH, 'front');
  ctx.restore();

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRONT SIDE (1050 × 660 px)', frontX + cardW / 2, cardY + cardH + 28);

  // Back Guide Card
  const backX = padding + cardW + gap;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(backX, cardY, cardW, cardH);
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(backX, cardY, cardW, cardH);

  ctx.save();
  ctx.translate(backX, cardY);
  drawSafeZonesOverlay(ctx, cardW, cardH, 'back');
  ctx.restore();

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BACK SIDE (1050 × 660 px)', backX + cardW / 2, cardY + cardH + 28);

  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'farmer_card_design_layout_guide.png';
  a.click();
}

