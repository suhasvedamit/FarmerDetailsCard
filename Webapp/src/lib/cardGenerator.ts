import { jsPDF } from 'jspdf';
import { FarmerRecord } from '../types';

/**
 * Generates an unofficial, printable Farmer Details Card canvas (1050 x 660 px)
 * directly in the browser for personal informational reference.
 */
export async function generateCardCanvas(record: FarmerRecord): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const w = 1050;
  const h = 660;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context for card generation');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Outer Border & Rounded Corner Card Box
  const cardGreen = '#0f5132'; // Deep Green
  const radius = 24;

  ctx.strokeStyle = cardGreen;
  ctx.lineWidth = 4;
  roundRect(ctx, 4, 4, w - 8, h - 8, radius);
  ctx.stroke();

  // Top Header Banner
  const headerHeight = 98;
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, 4, 4, w - 8, headerHeight, { tl: radius, tr: radius, bl: 0, br: 0 });
  ctx.fillStyle = cardGreen;
  ctx.fill();
  ctx.restore();

  // Header Typography - Farmer Details Card (No Government/Ministry details)
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px Inter, sans-serif';
  ctx.fillText('FARMER DETAILS CARD', 28, 60);

  // Farmer Photo (Right Side Box matching template)
  const px = w - 235;
  const py = 125;
  const pw = 195;
  const ph = 245;

  ctx.strokeStyle = cardGreen;
  ctx.lineWidth = 3;
  roundRect(ctx, px, py, pw, ph, 10);
  ctx.stroke();

  if (record.photo_url) {
    try {
      const img = await loadImage(record.photo_url);
      ctx.save();
      const targetW = pw - 4;
      const targetH = ph - 4;
      roundRect(ctx, px + 2, py + 2, targetW, targetH, 8);
      ctx.clip();

      // Proportional center-cover to ensure natural facial aspect ratio
      const targetAspect = targetW / targetH;
      const imgAspect = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgAspect > targetAspect) {
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, px + 2, py + 2, targetW, targetH);
      ctx.restore();
    } catch {
      drawPhotoPlaceholder(ctx, px, py, pw, ph);
    }
  } else {
    drawPhotoPlaceholder(ctx, px, py, pw, ph);
  }

  // Farmer ID Pill Badge
  const badgeX = 32;
  const badgeY = 120;
  const badgeW = 460;
  const badgeH = 40;

  ctx.strokeStyle = '#22c55e';
  ctx.fillStyle = '#f0fdf4';
  ctx.lineWidth = 1.5;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#14532d';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(`Farmer ID: ${record.farmer_id || '--'}`, badgeX + 16, badgeY + 26);

  // Information Rows (Clean English Typography)
  let cy = 195;
  const col1X = 32;
  const col2X = 220;
  const rowGap = 42;

  // 1. Farmer Name
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Farmer Name:', col1X, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 17px Inter, sans-serif';
  ctx.fillText(record.farmer_name || '--', col2X, cy);

  // 2. Father / Spouse Name
  cy += rowGap;
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Father / Spouse:', col1X, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.identifier_name || '--', col2X, cy);

  // 3. DOB & Gender
  cy += rowGap;
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Date of Birth (DOB):', col1X, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.dob || '--', col2X, cy);

  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Gender:', col2X + 130, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.gender || '--', col2X + 205, cy);

  // 4. Category & Mobile
  cy += rowGap;
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Caste Category:', col1X, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.caste_category || '--', col2X, cy);

  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Mobile:', col2X + 130, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.mobile_number || '--', col2X + 205, cy);

  // 5. Land Details
  cy += rowGap;
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Land Details:', col1X, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '600 14px Inter, sans-serif';
  const landStr = record.land_detail?.summary || (record.land_detail?.total_area_hectare ? `${record.land_detail.total_area_hectare} Hectare` : '--');
  ctx.fillText(truncateText(landStr, 52), col2X, cy);
  if (landStr.length > 52) {
    ctx.fillText(truncateText(landStr.substring(52), 52), col2X, cy + 20);
  }

  // Footer Disclaimer Bar position
  const footerY = h - 48;

  // 6. Address
  cy += rowGap + (landStr.length > 52 ? 12 : 0);
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Address:', col1X, cy);

  ctx.fillStyle = '#374151';
  let addrFontSize = 13;
  let addrLineHeight = 19;
  ctx.font = `500 ${addrFontSize}px Inter, sans-serif`;

  const addr = record.address?.trim() || '--';
  const maxAddrWidth = 780;
  const maxBottomY = footerY - 14;
  const availableHeight = maxBottomY - cy;

  let addrLines = wrapTextToLines(ctx, addr, maxAddrWidth);

  // If text is unusually long, scale down slightly so all lines fit comfortably
  if (addrLines.length * addrLineHeight > availableHeight) {
    addrFontSize = 11.5;
    addrLineHeight = 15;
    ctx.font = `500 ${addrFontSize}px Inter, sans-serif`;
    addrLines = wrapTextToLines(ctx, addr, maxAddrWidth);
  }

  // Draw wrapped address lines
  addrLines.forEach((line, index) => {
    const lineY = cy + index * addrLineHeight;
    if (lineY <= maxBottomY) {
      const isLastFittingLine = (lineY + addrLineHeight > maxBottomY) && (index < addrLines.length - 1);
      ctx.fillText(isLastFittingLine ? truncateText(line, 85) : line, col2X, lineY);
    }
  });

  // Footer Disclaimer Bar
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, 4, footerY, w - 8, 44, { tl: 0, tr: 0, bl: radius, br: radius });
  ctx.fillStyle = '#f3f4f6';
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#4b5563';
  ctx.font = '600 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('This is for information purpose only and no official usage.', w / 2, footerY + 27);
  ctx.textAlign = 'start';

  return canvas;
}

/**
 * Downloads the card as a PNG image.
 */
export async function downloadCardAsPng(record: FarmerRecord, filename = 'farmer_details_card.png'): Promise<void> {
  const canvas = await generateCardCanvas(record);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Creates the jsPDF document for the card.
 */
export async function createCardPdf(record: FarmerRecord): Promise<jsPDF> {
  const canvas = await generateCardCanvas(record);
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Standard ID Card size: 85.6 mm x 54 mm (landscape)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
  return pdf;
}

/**
 * Generates and downloads a standard CR80 print-ready PDF card (85.6mm x 53.98mm).
 */
export async function downloadCardAsPdf(record: FarmerRecord, filename = 'farmer_details_card.pdf'): Promise<void> {
  const pdf = await createCardPdf(record);
  pdf.save(filename);
}

/**
 * Shares the card PDF via WhatsApp:
 * - On Mobile (Web Share API supported): Opens native share directly with the PDF file attached to send to WhatsApp.
 * - On Desktop / Fallback: Downloads the PDF card file and opens WhatsApp Web with a pre-filled summary message.
 */
export async function shareCardPdfViaWhatsApp(record: FarmerRecord): Promise<{ sharedDirectly: boolean }> {
  const cleanName = (record.farmer_name || 'Farmer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanName}_Farmer_Card.pdf`;
  const pdf = await createCardPdf(record);

  const shareText = `🌾 Farmer Details Card\n👤 Name: ${record.farmer_name || 'N/A'}\n🆔 Farmer ID: ${record.farmer_id || 'N/A'}\n📍 Village/Dist: ${record.land_detail?.village || record.land_detail?.district || 'N/A'}`;

  // Check if Web Share API with file support is available (Mobile Chrome / Safari / Edge)
  const pdfBlob = pdf.output('blob');
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `${record.farmer_name || 'Farmer'} - Details Card`,
        text: shareText,
      });
      return { sharedDirectly: true };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User closed the share sheet
        return { sharedDirectly: true };
      }
      console.warn('Web Share failed, falling back to WhatsApp link:', err);
    }
  }

  // Desktop / unsupported browser fallback:
  // 1. Download the PDF to the user's computer
  pdf.save(filename);

  // 2. Open WhatsApp Web / App with pre-filled message
  const waMsg = encodeURIComponent(
    `${shareText}\n\n📎 (Card PDF has been saved to your downloads — please attach it here)`
  );
  window.open(`https://api.whatsapp.com/send?text=${waMsg}`, '_blank');
  return { sharedDirectly: false };
}

// Helpers
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = src;
  });
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text;
}

function wrapTextToLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text || !text.trim()) return ['--'];

  const paragraphs = text.split(/\r?\n/);
  const resultLines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          resultLines.push(currentLine);
          currentLine = '';
        }

        // If a single word is wider than maxWidth, split it character-by-character
        if (ctx.measureText(word).width > maxWidth) {
          let partial = '';
          for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (ctx.measureText(partial + char).width <= maxWidth) {
              partial += char;
            } else {
              resultLines.push(partial);
              partial = char;
            }
          }
          currentLine = partial;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines.length > 0 ? resultLines : ['--'];
}

function drawPhotoPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '600 14px Inter, sans-serif';
  ctx.fillText('PASSPORT PHOTO', x + 25, y + h / 2);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number | { tl?: number; tr?: number; bl?: number; br?: number }
) {
  let r = { tl: 0, tr: 0, bl: 0, br: 0 };
  if (typeof radius === 'number') {
    r = { tl: radius, tr: radius, bl: radius, br: radius };
  } else {
    r = { ...r, ...radius };
  }

  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}

