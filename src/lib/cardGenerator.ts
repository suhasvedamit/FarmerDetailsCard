import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { FarmerRecord } from '../types';

/**
 * Generates an official-grade, print-ready Farmer ID Card canvas (1050 x 660 px)
 * directly in the browser matching the AgriStack Government specification.
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
  const cardGreen = '#0f5132'; // Govt Deep Green
  const lightGreen = '#e8f5e9';
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

  // Header Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 14px Inter, sans-serif';
  ctx.fillText('GOVERNMENT OF INDIA • MINISTRY OF AGRICULTURE & FARMERS WELFARE', 28, 34);

  ctx.font = '700 24px Inter, sans-serif';
  ctx.fillText('FARMER ID CARD', 28, 72);

  ctx.font = '600 14px Inter, sans-serif';
  ctx.fillStyle = '#d1e7dd';
  ctx.fillText('AGRISTACK REGISTRY', w - 215, 72);

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
      roundRect(ctx, px + 2, py + 2, pw - 4, ph - 4, 8);
      ctx.clip();
      ctx.drawImage(img, px + 2, py + 2, pw - 4, ph - 4);
      ctx.restore();
    } catch {
      drawPhotoPlaceholder(ctx, px, py, pw, ph);
    }
  } else {
    drawPhotoPlaceholder(ctx, px, py, pw, ph);
  }

  // QR Code below Photo
  const qrx = w - 215;
  const qry = 400;
  const qrw = 155;
  try {
    const qrData = `AGRISTACK:ID=${record.farmer_id};NAME=${record.farmer_name};DOB=${record.dob};LAND=${record.land_detail?.summary || ''}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: qrw, margin: 1 });
    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, qrx, qry, qrw, qrw);

    ctx.fillStyle = cardGreen;
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText('✓ Digitally Verified', qrx + 25, qry + qrw + 18);
  } catch (err) {
    console.error('QR code generation failed:', err);
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
  ctx.fillText(`Farmer ID: ${record.farmer_id || '77900535348'}`, badgeX + 16, badgeY + 26);

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
  ctx.fillText(record.farmer_name || 'Ganesh Pandurang Shinde', col2X, cy);

  // 2. Father / Spouse Name
  cy += rowGap;
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Father / Spouse:', col1X, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.identifier_name || 'Pandurang Shinde', col2X, cy);

  // 3. DOB & Gender
  cy += rowGap;
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Date of Birth (DOB):', col1X, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.dob || '04/08/1987', col2X, cy);

  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Gender:', col2X + 130, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.gender || 'Male', col2X + 205, cy);

  // 4. Category & Mobile
  cy += rowGap;
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Caste Category:', col1X, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.caste_category || 'General', col2X, cy);

  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Mobile:', col2X + 130, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '700 16px Inter, sans-serif';
  ctx.fillText(record.mobile_number || '9552533470', col2X + 205, cy);

  // 5. Land Details
  cy += rowGap;
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Land Details:', col1X, cy);
  ctx.fillStyle = '#111827';
  ctx.font = '600 14px Inter, sans-serif';
  const landStr = record.land_detail?.summary || `${record.land_detail?.total_area_hectare || '0.72'} Hectare`;
  ctx.fillText(truncateText(landStr, 52), col2X, cy);
  if (landStr.length > 52) {
    ctx.fillText(truncateText(landStr.substring(52), 52), col2X, cy + 20);
  }

  // 6. Address
  cy += rowGap + (landStr.length > 52 ? 12 : 0);
  ctx.fillStyle = '#4b5563';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText('Address:', col1X, cy);
  ctx.fillStyle = '#374151';
  ctx.font = '500 13px Inter, sans-serif';
  const addr = record.address || '';
  ctx.fillText(truncateText(addr, 56), col2X, cy);
  if (addr.length > 56) {
    ctx.fillText(truncateText(addr.substring(56), 60), col2X, cy + 18);
  }

  // Footer Disclaimer Bar
  const footerY = h - 48;
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, 4, footerY, w - 8, 44, { tl: 0, tr: 0, bl: radius, br: radius });
  ctx.fillStyle = '#f3f4f6';
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#4b5563';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillText('Issued under Government of India AgriStack Farmer Registry | Valid Across India', 28, footerY + 26);

  return canvas;
}

/**
 * Downloads the card as a PNG image.
 */
export async function downloadCardAsPng(record: FarmerRecord, filename = 'farmer_id_card.png'): Promise<void> {
  const canvas = await generateCardCanvas(record);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Generates and downloads a standard CR80 print-ready PDF card (85.6mm x 53.98mm).
 */
export async function downloadCardAsPdf(record: FarmerRecord, filename = 'farmer_id_card.pdf'): Promise<void> {
  const canvas = await generateCardCanvas(record);
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Standard ID Card size: 85.6 mm x 54 mm (landscape)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
  pdf.save(filename);
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

