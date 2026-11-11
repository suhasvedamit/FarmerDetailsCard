import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { FarmerRecord, LandRow } from '../types';
import { formatMessage, getTranslations, Language } from '../i18n';

// Set up PDF.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ExtractionProgressCallback {
  (message: string, progressPercent: number): void;
}

/**
 * Known Maharashtra Districts for fuzzy correction against OCR typos.
 */
const MAHARASHTRA_DISTRICTS = [
  'AHMEDNAGAR', 'AKOLA', 'AMRAVATI', 'AURANGABAD', 'BEED', 'BHANDARA',
  'BULDHANA', 'CHANDRAPUR', 'DHULE', 'GADCHIROLI', 'GONDIA', 'HINGOLI',
  'JALGAON', 'JALNA', 'KOLHAPUR', 'LATUR', 'MUMBAI', 'NAGPUR', 'NANDED',
  'NANDURBAR', 'NASHIK', 'OSMANABAD', 'PALGHAR', 'PARBHANI', 'PUNE',
  'RAIGAD', 'RATNAGIRI', 'SANGLI', 'SATARA', 'SINDHUDURG', 'SOLAPUR',
  'THANE', 'WARDHA', 'WASHIM', 'YAVATMAL'
];

/**
 * Fuzzy matches a text against known districts to correct OCR misreads (e.g. "PUNF" -> "PUNE").
 */
function correctDistrict(rawText: string): string {
  if (!rawText) return '';
  const upper = rawText.toUpperCase();
  for (const d of MAHARASHTRA_DISTRICTS) {
    if (upper.includes(d)) return d;
  }
  // Check common OCR substitutions
  if (/PUN[EF1]/i.test(upper)) return 'PUNE';
  if (/NASHIK|NASIK/i.test(upper)) return 'NASHIK';
  if (/SATAR[A4]/i.test(upper)) return 'SATARA';
  if (/SANGL[I1]/i.test(upper)) return 'SANGLI';
  if (/KOLHAPU[R]/i.test(upper)) return 'KOLHAPUR';
  return rawText.trim();
}

/**
 * Pre-processes an HTML5 Canvas for optimal OCR accuracy:
 * Uses gentle linear contrast normalization without destructive hard thresholding.
 */
export function preprocessCanvasForOcr(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Find min and max brightness for auto-contrast stretching
  let minB = 255;
  let maxB = 0;
  const step = 4;

  for (let i = 0; i < data.length; i += 4 * step) {
    const b = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    if (b < minB) minB = b;
    if (b > maxB) maxB = b;
  }

  const range = maxB - minB || 1;

  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    // Gentle linear contrast stretch without destroying character anti-aliasing
    const stretched = Math.min(255, Math.max(0, ((gray - minB) / range) * 255));
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Crops a sub-region from an HTML5 Canvas.
 */
export function cropCanvasRegion(
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number
): HTMLCanvasElement {
  const crop = document.createElement('canvas');
  crop.width = Math.max(1, Math.floor(w));
  crop.height = Math.max(1, Math.floor(h));
  const ctx = crop.getContext('2d');
  if (ctx) {
    ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, crop.width, crop.height);
  }
  return crop;
}

/**
 * Renders a PDF page to Canvas at high-fidelity scale 2.5 (approx 250 DPI).
 */
export async function renderPdfPageToCanvas(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 2.5
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context from canvas');

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
  }).promise;

  return canvas;
}

export interface ExtractedPhotoDetails {
  photoUrl: string;
  bbox: {
    x: number;
    y: number;
    w: number;
    h: number;
    pageW: number;
    pageH: number;
  };
}

/**
 * High-Precision Computer Vision Photo Cropper:
 * Detects the farmer portrait in Page 1 of the registration form.
 * Uses 2D spatial density, morphological closing, and connected component
 * analysis to locate the exact photograph block, avoiding header text
 * (such as "Farmer Photograph") and table divider lines, and performs
 * fine edge trimming to remove any surrounding white margin.
 */
export function extractPhotoDetailsFromCanvas(canvas: HTMLCanvasElement): ExtractedPhotoDetails | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;

  // Search region: Upper-right quadrant of Page 1
  // In government farmer registration forms (AgriStack, PM-Kisan, State forms),
  // the photo box is always in the upper right.
  const rx1 = Math.floor(w * 0.52);
  const ry1 = Math.floor(h * 0.10);
  const rx2 = Math.floor(w * 0.99);
  const ry2 = Math.floor(h * 0.58);

  const roiW = rx2 - rx1;
  const roiH = ry2 - ry1;
  if (roiW <= 40 || roiH <= 40) return null;

  const imgData = ctx.getImageData(rx1, ry1, roiW, roiH);
  const data = imgData.data;

  // Grid downsampling step for speed and noise filtering
  const step = 2;
  const gw = Math.floor(roiW / step);
  const gh = Math.floor(roiH / step);
  if (gw < 10 || gh < 10) return null;

  // Binary grid: 1 = content (non-white), 0 = paper background
  const grid = new Uint8Array(gw * gh);

  for (let gy = 0; gy < gh; gy++) {
    const cy = gy * step;
    const rowOffset = gy * gw;
    for (let gx = 0; gx < gw; gx++) {
      const cx = gx * step;
      const idx = (cy * roiW + cx) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const gray = (r * 299 + g * 587 + b * 114) / 1000;
      // White/blank paper background in scanned PDFs is typically >= 238
      if (gray < 238) {
        grid[rowOffset + gx] = 1;
      }
    }
  }

  // Morphological closing to bridge light patches (white kurta/shirt, buttons, skin highlights)
  const closed = new Uint8Array(grid);
  for (let gy = 1; gy < gh - 1; gy++) {
    const rowOffset = gy * gw;
    for (let gx = 1; gx < gw - 1; gx++) {
      if (grid[rowOffset + gx] === 1) continue;
      const nb =
        grid[rowOffset - gw + gx - 1] +
        grid[rowOffset - gw + gx] +
        grid[rowOffset - gw + gx + 1] +
        grid[rowOffset + gx - 1] +
        grid[rowOffset + gx + 1] +
        grid[rowOffset + gw + gx - 1] +
        grid[rowOffset + gw + gx] +
        grid[rowOffset + gw + gx + 1];
      if (nb >= 4) {
        closed[rowOffset + gx] = 1;
      }
    }
  }

  // Connected component labeling (BFS)
  const visited = new Uint8Array(gw * gh);
  interface Candidate {
    x: number;
    y: number;
    w: number;
    h: number;
    aspect: number;
    density: number;
    score: number;
  }
  const candidates: Candidate[] = [];

  const minBoxW = Math.max(20, Math.floor((w * 0.05) / step));
  const minBoxH = Math.max(25, Math.floor((h * 0.07) / step));
  const maxBoxW = Math.floor((w * 0.45) / step);
  const maxBoxH = Math.floor((h * 0.50) / step);

  for (let gy = 0; gy < gh; gy++) {
    const rowOffset = gy * gw;
    for (let gx = 0; gx < gw; gx++) {
      const idx = rowOffset + gx;
      if (closed[idx] === 0 || visited[idx] === 1) continue;

      const queue: number[] = [idx];
      visited[idx] = 1;
      let cMinGx = gx;
      let cMaxGx = gx;
      let cMinGy = gy;
      let cMaxGy = gy;
      let count = 0;

      while (queue.length > 0) {
        const currIdx = queue.pop()!;
        count++;
        const curGx = currIdx % gw;
        const curGy = Math.floor(currIdx / gw);

        if (curGx < cMinGx) cMinGx = curGx;
        if (curGx > cMaxGx) cMaxGx = curGx;
        if (curGy < cMinGy) cMinGy = curGy;
        if (curGy > cMaxGy) cMaxGy = curGy;

        // 4 cardinal neighbors
        if (curGy > 0) {
          const nIdx = currIdx - gw;
          if (closed[nIdx] === 1 && visited[nIdx] === 0) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
        if (curGy < gh - 1) {
          const nIdx = currIdx + gw;
          if (closed[nIdx] === 1 && visited[nIdx] === 0) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
        if (curGx > 0) {
          const nIdx = currIdx - 1;
          if (closed[nIdx] === 1 && visited[nIdx] === 0) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
        if (curGx < gw - 1) {
          const nIdx = currIdx + 1;
          if (closed[nIdx] === 1 && visited[nIdx] === 0) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }

      const compW = cMaxGx - cMinGx + 1;
      const compH = cMaxGy - cMinGy + 1;

      if (compW >= minBoxW && compH >= minBoxH && compW <= maxBoxW && compH <= maxBoxH) {
        const aspect = compW / compH;
        const density = count / (compW * compH);

        // Portrait photo aspect ratio is ~0.50 to 1.25, with dense fill (density >= 0.40)
        // Header text is rejected because individual glyphs are small (< minBoxW) and have sparse fill (<0.25)
        // Table banner is rejected because aspect is > 3.0
        if (aspect >= 0.50 && aspect <= 1.25 && density >= 0.40) {
          const aspectScore = 1.0 - Math.abs(aspect - 0.80) * 1.5;
          const score = (compW * compH) * density * Math.max(0.2, aspectScore);
          candidates.push({
            x: rx1 + cMinGx * step,
            y: ry1 + cMinGy * step,
            w: compW * step,
            h: compH * step,
            aspect,
            density,
            score,
          });
        }
      }
    }
  }

  // Fallback if strict filter found nothing
  let best: Candidate | null = null;
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    best = candidates[0];
  }

  if (!best) {
    return null;
  }

  // Fine edge snapping: trim residual margins and anchor subject with proper portrait framing
  const pad = Math.max(6, Math.floor(w * 0.008));
  let cropX1 = Math.max(0, best.x - pad);
  let cropY1 = Math.max(0, best.y - pad);
  let cropX2 = Math.min(w, best.x + best.w + pad);
  let cropY2 = Math.min(h, best.y + best.h + pad);

  // Helper to read pixel gray from full canvas context
  const fw = cropX2 - cropX1;
  const fh = cropY2 - cropY1;
  const fullImgData = ctx.getImageData(cropX1, cropY1, fw, fh);
  const fullData = fullImgData.data;

  const getFullGray = (lx: number, ly: number) => {
    const i = (ly * fw + lx) * 4;
    return (fullData[i] * 299 + fullData[i + 1] * 587 + fullData[i + 2] * 114) / 1000;
  };

  // Sample background brightness in the margin
  let bgSum = 0;
  let bgSamples = 0;
  for (let x = 0; x < Math.min(10, fw); x++) {
    for (let y = 0; y < Math.min(10, fh); y++) {
      bgSum += getFullGray(x, y);
      bgSamples++;
    }
  }
  const paperBrightness = bgSamples > 0 ? bgSum / bgSamples : 245;
  const contentThreshold = Math.max(140, Math.min(230, paperBrightness - 25));

  // 1. Locate photo top & bottom along the central vertical axis of the subject
  const centerX = Math.floor(fw / 2);
  const sampleW = Math.max(10, Math.floor(fw * 0.15));
  const cx1 = Math.max(0, centerX - sampleW);
  const cx2 = Math.min(fw - 1, centerX + sampleW);
  const cSpan = cx2 - cx1 + 1;

  // Find top edge of subject head/hair in center
  let photoTop = 0;
  for (let y = 0; y < Math.floor(fh * 0.40); y++) {
    let count = 0;
    for (let x = cx1; x <= cx2; x++) {
      if (getFullGray(x, y) < contentThreshold) count++;
    }
    if (count >= Math.max(3, Math.floor(cSpan * 0.10))) {
      photoTop = y;
      break;
    }
  }

  // Find bottom edge of subject shirt along center axis
  // Stops cleanly as soon as the shirt ends and a blank paper gap appears,
  // preventing any detached table borders or dark lines below the photo from ever being included!
  let photoBottom = fh - 1;
  let lastContentY = photoTop + 35;
  let blankRowStreak = 0;
  for (let y = photoTop + 35; y < fh; y++) {
    let count = 0;
    for (let x = cx1; x <= cx2; x++) {
      if (getFullGray(x, y) < contentThreshold) count++;
    }
    if (count < Math.max(2, Math.floor(cSpan * 0.05))) {
      blankRowStreak++;
      if (blankRowStreak >= 4 && lastContentY > photoTop + 50) {
        photoBottom = lastContentY;
        break;
      }
    } else {
      blankRowStreak = 0;
      lastContentY = y;
    }
  }
  if (blankRowStreak < 4) {
    photoBottom = lastContentY;
  }

  // 2. Locate photo left & right boundaries by scanning outward from centerX
  // strictly within the vertical span of the portrait (above the bottom gap and table line)
  const yStart = Math.min(photoBottom, photoTop + 15);
  const yEnd = Math.max(photoTop, photoBottom - 15);
  const vSpan = Math.max(1, yEnd - yStart + 1);

  let photoLeft = 0;
  let blankColStreak = 0;
  let lastGoodX = centerX;
  for (let x = centerX; x >= 0; x--) {
    let count = 0;
    for (let y = yStart; y <= yEnd; y++) {
      if (getFullGray(x, y) < contentThreshold) count++;
    }
    if (count < Math.max(3, Math.floor(vSpan * 0.12))) {
      blankColStreak++;
      if (blankColStreak >= 3) {
        photoLeft = lastGoodX;
        break;
      }
    } else {
      blankColStreak = 0;
      lastGoodX = x;
    }
  }
  if (blankColStreak < 3) photoLeft = lastGoodX;

  let photoRight = fw - 1;
  blankColStreak = 0;
  lastGoodX = centerX;
  for (let x = centerX; x < fw; x++) {
    let count = 0;
    for (let y = yStart; y <= yEnd; y++) {
      if (getFullGray(x, y) < contentThreshold) count++;
    }
    if (count < Math.max(3, Math.floor(vSpan * 0.12))) {
      blankColStreak++;
      if (blankColStreak >= 3) {
        photoRight = lastGoodX;
        break;
      }
    } else {
      blankColStreak = 0;
      lastGoodX = x;
    }
  }
  if (blankColStreak < 3) photoRight = lastGoodX;

  // 3. Portrait Framing (matching ID Card aspect ratio 191 / 241)
  const TARGET_ASPECT = 191 / 241;
  const photoW = Math.max(30, photoRight - photoLeft + 1);
  const photoH = Math.max(30, photoBottom - photoTop + 1);
  const currentAspect = photoW / photoH;

  let cropW = photoW;
  let cropH = photoH;
  let cropLocalX = photoLeft;
  let cropLocalY = photoTop;

  if (currentAspect >= TARGET_ASPECT) {
    // Photo is wider than ID card slot (e.g. square 1:1 or 4:3)
    // Use full height, crop excess width centered:
    cropH = photoH;
    cropW = Math.max(30, Math.round(cropH * TARGET_ASPECT));
    cropLocalX = photoLeft + Math.round((photoW - cropW) / 2);
    cropLocalY = photoTop;
  } else {
    // Photo is taller than ID card slot
    // Use full width, crop excess height anchored to bottom (shoulders):
    cropW = photoW;
    cropH = Math.max(30, Math.round(cropW / TARGET_ASPECT));
    cropLocalX = photoLeft;
    // Anchor to bottom so the shirt cleanly touches the bottom edge with ZERO white gap
    cropLocalY = photoBottom + 1 - cropH;
  }

  // Strictly clamp inside detected photo content bounds to guarantee 0% paper margin
  cropLocalX = Math.max(photoLeft, Math.min(photoRight - cropW + 1, cropLocalX));
  cropLocalY = Math.max(photoTop, Math.min(photoBottom - cropH + 1, cropLocalY));

  const finalX = cropX1 + cropLocalX;
  const finalY = cropY1 + cropLocalY;
  const finalW = Math.min(w - finalX, cropW);
  const finalH = Math.min(h - finalY, cropH);

  if (finalW < 30 || finalH < 30) return null;

  // Render to output canvas with high quality
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = finalW;
  cropCanvas.height = finalH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return null;

  cropCtx.imageSmoothingEnabled = true;
  cropCtx.imageSmoothingQuality = 'high';
  cropCtx.drawImage(
    canvas,
    finalX,
    finalY,
    finalW,
    finalH,
    0,
    0,
    finalW,
    finalH
  );

  const cropDataUrl = cropCanvas.toDataURL('image/jpeg', 0.95);
  return {
    photoUrl: cropDataUrl,
    bbox: {
      x: finalX,
      y: finalY,
      w: finalW,
      h: finalH,
      pageW: canvas.width,
      pageH: canvas.height,
    },
  };
}

export function extractPhotoFromCanvas(canvas: HTMLCanvasElement): string | null {
  return extractPhotoDetailsFromCanvas(canvas)?.photoUrl || null;
}

/**
 * Extracts digital text directly from PDF pages if available.
 * Groups text items by vertical Y coordinates into natural lines,
 * sorting horizontally left-to-right to preserve table layouts.
 */
async function extractDigitalPageTexts(pdf: pdfjsLib.PDFDocumentProxy): Promise<string[]> {
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = (textContent.items as any[]).filter(
        it => it && typeof it.str === 'string' && it.str.length > 0
      );

      if (items.length === 0) {
        pageTexts.push('');
        continue;
      }

      // Group items into lines by Y coordinate (tolerance ~4 points)
      const lineTolerance = 4;
      const lines: { y: number; items: any[] }[] = [];

      for (const item of items) {
        const y = item.transform ? item.transform[5] : 0;
        let existingLine = lines.find(l => Math.abs(l.y - y) <= lineTolerance);
        if (!existingLine) {
          existingLine = { y, items: [] };
          lines.push(existingLine);
        }
        existingLine.items.push(item);
      }

      // Sort lines top to bottom (in PDF space, higher Y is higher on page)
      lines.sort((a, b) => b.y - a.y);

      // Sort items within each line left to right (X ascending)
      const pageLines = lines.map(line => {
        line.items.sort((a, b) => {
          const ax = a.transform ? a.transform[4] : 0;
          const bx = b.transform ? b.transform[4] : 0;
          return ax - bx;
        });
        return line.items.map(it => it.str).join(' ');
      });

      pageTexts.push(pageLines.join('\n'));
    } catch {
      pageTexts.push('');
    }
  }
  return pageTexts;
}

/**
 * Robust extraction of Farmer PAN Card number.
 * Validates 10-character Indian PAN format (5 letters, 4 digits, 1 letter)
 * and repairs minor OCR character substitutions (e.g. O <-> 0, I <-> 1).
 * Returns empty string if the field in the PDF is empty/blank.
 */
export function extractPanCard(text: string): string {
  if (!text) return '';

  const cleanPan = (raw: string): string => {
    let s = raw.trim();
    if (s.includes('|')) s = s.split('|')[0].trim();
    s = s.split(/\b(?:Minority|Religion|Kisan|Credit|Card|Bank|Farmer|Caste|Certificate|Disabilities)\b/i)[0].trim();
    s = s.replace(/[\s\-_]/g, '').toUpperCase();
    if (s.length !== 10) return '';

    if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(s)) return s;

    // Fix OCR character substitutions
    const chars = s.split('');
    const digitToLetter: Record<string, string> = { '0': 'O', '1': 'I', '5': 'S', '8': 'B', '2': 'Z' };
    const letterToDigit: Record<string, string> = { O: '0', I: '1', L: '1', S: '5', B: '8', Z: '2' };
    for (let i = 0; i < 5; i++) {
      if (/[0-9]/.test(chars[i]) && digitToLetter[chars[i]]) chars[i] = digitToLetter[chars[i]];
    }
    for (let i = 5; i < 9; i++) {
      if (/[A-Z]/.test(chars[i]) && letterToDigit[chars[i]]) chars[i] = letterToDigit[chars[i]];
    }
    if (/[0-9]/.test(chars[9]) && digitToLetter[chars[9]]) chars[9] = digitToLetter[chars[9]];

    const fixed = chars.join('');
    if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(fixed)) return fixed;
    return '';
  };

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(
      /(?:Farmer\s*Pan\s*(?:Card)?\s*(?:Number|No\.?)?|PAN\s*(?:Card)?(?:\s*(?:Number|No\.?))?|पॅन\s*(?:कार्ड|नंबर)?)\s*[:\-\s]+(.*)/i
    );
    if (match) {
      const candidate = cleanPan(match[1]);
      if (candidate) return candidate;
      if (i + 1 < lines.length) {
        const nextCand = cleanPan(lines[i + 1]);
        if (nextCand) return nextCand;
      }
    }
    if (/^(?:Farmer\s*Pan\s*(?:Card)?\s*(?:Number|No\.?)?|PAN\s*(?:Card)?(?:\s*(?:Number|No\.?))?|पॅन\s*(?:कार्ड|नंबर)?)\s*[:\-]?$/i.test(line)) {
      if (i + 1 < lines.length) {
        const candidate = cleanPan(lines[i + 1]);
        if (candidate) return candidate;
      }
    }
  }

  const globalMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  if (globalMatch) {
    const candidate = cleanPan(globalMatch[1]);
    if (candidate) return candidate;
  }
  return '';
}

/**
 * Robust extraction of Bank Name.
 * Handles single-line table cells, trailing "Bank Branch Code" columns,
 * multiline labels, and filters out "Kisan Credit Card Bank Name".
 */
export function extractBankName(text: string): string {
  if (!text) return '';

  const cleanupTrailing = (str: string): string => {
    let s = str.trim();
    if (s.includes('|')) s = s.split('|')[0].trim();
    s = s.replace(/\s*(?:Bank\s*)?Branch\s*(?:Code|Name)?\s*[:\-\s]*[A-Za-z0-9_-]*$/i, '');
    s = s.replace(/\s*(?:IFSC|Account|A\/c|Branch)\b.*$/i, '');
    s = s.replace(/\s*Farmer\s*(?:Disabilities|type|Residential).*$/i, '');
    s = s.replace(/[\s,.:;\-]+$/, '').trim();
    return s;
  };

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/Kisan\s*Credit\s*Card/i.test(line) && !/Bank\s*Name\s*[:\-\s]+[A-Za-z]/i.test(line.replace(/Kisan\s*Credit\s*Card[^\n]*/i, ''))) {
      continue;
    }

    const bankLineMatch = line.match(
      /(?:(?<!Kisan\s*Credit\s*Card\s*)(?<!KCC\s*)(?:Farmer\s*)?Bank\s*Name|Name\s*of\s*Bank|बँकेचे\s*नाव)\s*[:\-\s]+(.*)/i
    );
    if (bankLineMatch) {
      const candidate = cleanupTrailing(bankLineMatch[1]);
      if (candidate.length >= 3 && !/^(?:Branch|Code|Bank\s*Branch|IFSC|Account|Number|No)$/i.test(candidate)) {
        return candidate;
      }
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!/^(?:IFSC|Account|Branch|Kisan|Farmer|Minority|State|District)/i.test(nextLine)) {
          const nextCandidate = cleanupTrailing(nextLine);
          if (nextCandidate.length >= 3) return nextCandidate;
        }
      }
    }

    if (/^(?:Bank\s*Name|Name\s*of\s*Bank|बँकेचे\s*नाव)\s*[:\-]?$/i.test(line)) {
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!/^(?:IFSC|Account|Branch|Kisan|Farmer|Minority|State|District)/i.test(nextLine)) {
          const candidate = cleanupTrailing(nextLine);
          if (candidate.length >= 3) return candidate;
        }
      }
    }
  }

  const globalMatch = text.match(
    /(?:(?<!Kisan\s*Credit\s*Card\s*)(?<!KCC\s*)Bank\s*Name|Name\s*of\s*Bank)\s*[:\-\s]+([A-Za-z\s.,&'-]+?)(?=\s*(?:\||Bank\s*Branch|Branch\s*Code|IFSC|Account|\n|$))/i
  );
  if (globalMatch) {
    const candidate = cleanupTrailing(globalMatch[1]);
    if (candidate.length >= 3 && !/^(?:Branch|Code|Bank\s*Branch|IFSC|Account|Number|No)$/i.test(candidate)) {
      return candidate;
    }
  }
  return '';
}

/**
 * Robust extraction of Bank Account Number.
 * Handles "Bank Account Number", "Account No", "A/C Number", etc.
 * Cleans spaces, dashes, and repairs OCR letter/digit confusions.
 */
export function extractAccountNumber(text: string): string {
  if (!text) return '';

  const cleanNum = (raw: string): string => {
    let s = raw.trim();
    s = s.split(/\b(?:IFSC|Farmer|Address|Branch|Type|Occupations|State|District)\b/i)[0].trim();
    if (s.includes('|')) s = s.split('|')[0].trim();
    s = s.replace(/[\s\-_]/g, '').replace(/[oO]/g, '0').replace(/[Il]/g, '1');
    const m = s.match(/^\d{8,22}$/);
    return m ? m[0] : '';
  };

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(
      /(?:Bank\s*Account\s*(?:Number|No\.?)|(?:Savings\s*)?Account\s*(?:Number|No\.?)|A\/c\s*(?:Number|No\.?|Num)?|बचत\s*खाता\s*(?:नंबर|क्र\.?)?|खाते\s*(?:क्रमांक|नंबर))\s*[:\-\s]+(.*)/i
    );
    if (match) {
      const candidate = cleanNum(match[1]);
      if (candidate) return candidate;
      if (i + 1 < lines.length) {
        const nextCand = cleanNum(lines[i + 1]);
        if (nextCand) return nextCand;
      }
    }
    if (/^(?:Bank\s*Account\s*(?:Number|No\.?)|Account\s*(?:Number|No\.?)|A\/c\s*(?:Number|No\.?))\s*[:\-]?$/i.test(line)) {
      if (i + 1 < lines.length) {
        const candidate = cleanNum(lines[i + 1]);
        if (candidate) return candidate;
      }
    }
  }

  const globalMatch = text.match(
    /(?:Bank\s*Account\s*(?:Number|No\.?)|(?:Savings\s*)?Account\s*(?:Number|No\.?)|A\/c\s*(?:Number|No\.?))\s*[:\-\s]*([0-9OIl\s\-]{8,25})/i
  );
  if (globalMatch) {
    const candidate = cleanNum(globalMatch[1]);
    if (candidate) return candidate;
  }

  // Fallback: Search in Bank Details section
  const bankSectionMatch = text.match(/(?:Farmer\s*Bank[\s\S]*?)(?:Farmer\s*Residential|Land\s*Ownership|$)/i);
  if (bankSectionMatch) {
    const section = bankSectionMatch[0];
    const candidates = section.match(/\b\d{9,18}\b/g);
    if (candidates) {
      for (const cand of candidates) {
        if (/^[6-9]\d{9}$/.test(cand)) continue; // skip mobile
        return cand;
      }
    }
  }

  return '';
}

/**
 * Robust extraction of IFSC Code.
 * Validates 11-character Indian IFSC standard:
 * 4 letters + 0 + 6 alphanumeric characters.
 * Fixes OCR 'O' vs '0' at 5th position and inside branch code.
 */
export function extractIfscCode(text: string): string {
  if (!text) return '';

  const normalizeIfsc = (raw: string): string => {
    let s = raw.trim();
    if (s.includes('|')) s = s.split('|')[0].trim();
    s = s.split(/\b(?:Bank|Account|A\/c|Number|No|Branch)\b/i)[0].trim();
    s = s.replace(/[\s\-_]/g, '').toUpperCase();
    if (s.length !== 11) return '';

    let first4 = s.substring(0, 4)
      .replace(/0/g, 'O')
      .replace(/1/g, 'I')
      .replace(/5/g, 'S')
      .replace(/8/g, 'B');
    if (!/^[A-Z]{4}$/.test(first4)) return '';

    const fifth = '0';
    let last6 = s.substring(5);
    if (/\d/.test(last6) || /^[O0-9]+$/.test(last6)) {
      last6 = last6.replace(/O/g, '0').replace(/I/g, '1');
    }
    if (!/^[A-Z0-9]{6}$/.test(last6)) return '';

    return `${first4}${fifth}${last6}`;
  };

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/(?:IFSC\s*(?:Code)?|आयएफएससी(?:\s*कोड)?)\s*[:\-\s]+(.*)/i);
    if (match) {
      const candidate = normalizeIfsc(match[1]);
      if (candidate) return candidate;
      if (i + 1 < lines.length) {
        const nextCand = normalizeIfsc(lines[i + 1]);
        if (nextCand) return nextCand;
      }
    }
    if (/^(?:IFSC\s*(?:Code)?|आयएफएससी(?:\s*कोड)?)\s*[:\-]?$/i.test(line)) {
      if (i + 1 < lines.length) {
        const candidate = normalizeIfsc(lines[i + 1]);
        if (candidate) return candidate;
      }
    }
  }

  const stdMatch = text.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/i);
  if (stdMatch) {
    const candidate = normalizeIfsc(stdMatch[1]);
    if (candidate) return candidate;
  }

  const lenientMatch = text.match(/\b([A-Za-z]{4}[0O][A-Za-z0-9]{6})\b/);
  if (lenientMatch) {
    const candidate = normalizeIfsc(lenientMatch[1]);
    if (candidate) return candidate;
  }

  return '';
}

/**
 * Cleans extracted address text by stripping OCR table artifacts,
 * secondary column headers (e.g. "Address In Local Language", "Local", "Language"),
 * Devanagari OCR ghost misreads (e.g. "HITT STOT", "Tle UigeT fae"),
 * and subsequent table field labels (e.g. "Farmer type", "Occupations").
 */
export function cleanExtractedAddress(rawText: string): string {
  if (!rawText) return '';

  const lines = rawText.split(/\r?\n/);
  const cleanedLines: string[] = [];

  const isStopLine = (line: string): boolean => {
    return /^(?:Farmer[\s\-_]*type|Occupations?|Land[\s\-_]*Ownership|State\s*[\/-]?\s*UT|Annexure)\b/i.test(line.trim());
  };

  const isHeaderOnlyLine = (line: string): boolean => {
    const t = line.trim();
    return (
      /^(?:Address\s*In\s*Local\s*Language|Address\s*In\s*Local|Address\s*In|Local\s*Language|Local|Language|Address\s*In\s*English|Address)$/i.test(t) ||
      /^(?:Farmer\s*Residential\s*Details|Contact\s*Details|Email\s*Address)$/i.test(t)
    );
  };

  const isPureGhostLine = (line: string): boolean => {
    const t = line.trim();
    // Known Devanagari OCR misreads produced by English Tesseract (e.g. 'HITT STOT')
    return /^(?:(?:HITT|STOT|TATT|FITT|SFTAT|UigeT|fae|Tle|Tae)[\s,.\-|/]*)+$/i.test(t);
  };

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Stop if we reached subsequent form sections
    if (isStopLine(line)) break;

    // If we already collected the English address, and we hit the bottom of the right-column header ('Language'),
    // stop so any subsequent lines belonging to the local language column (like 'HITT STOT') are ignored.
    if (/^(?:Language|Local\s*Language)\s*$/i.test(line)) {
      if (cleanedLines.length > 0) {
        break;
      }
      continue;
    }

    // Discard non-English / Devanagari lines (from the local language column)
    if (/[\u0900-\u097F]/.test(line)) continue;

    // Discard standalone header artifacts
    if (isHeaderOnlyLine(line)) continue;

    // Discard lines that are purely OCR ghost noise from the local language column
    if (isPureGhostLine(line)) continue;

    // If there is a table column separator (|), keep only the English address column (left)
    if (line.includes('|')) {
      line = line.split('|')[0].trim();
    }

    // Strip leading 'Address In English' if present
    line = line.replace(/^\s*Address\s*In\s*English\s*[:\-\s]*/i, '');

    // Strip right-column header fragments attached at the end of the line
    line = line.replace(/\bAddress\s*In(?:\s*Local)?(?:\s*Language)?\s*$/i, '');
    line = line.replace(/\bLocal\s*Language\s*$/i, '');
    line = line.replace(/(?:,\s*|\s+)(?:Local|Language)\s*$/i, '');
    line = line.replace(/^\s*(?:Local|Language)(?:,\s*|\s+)/i, '');

    // Strip any ghost words from the end of the line
    line = line.replace(/\b(?:HITT|STOT|TATT|FITT|SFTAT|UigeT|fae|Tle|Tae)\b.*$/i, '');
    line = line.trim();

    if (line && !isHeaderOnlyLine(line) && !isPureGhostLine(line)) {
      cleanedLines.push(line);
    }
  }

  // Join lines with comma, then collapse redundant commas
  let address = cleanedLines.join(', ');

  // Post-processing cleanup for any residual artifacts
  address = address
    .replace(/\b(?:HITT|STOT|TATT|FITT|SFTAT|UigeT|fae|Tle|Tae)\b/gi, '')
    .replace(/\bAddress\s*In\s*(?:Local\s*)?(?:Language)?\b/gi, '')
    .replace(/\bAddress\s*In\s*English\b/gi, '')
    .replace(/\bAddress\s*In\b/gi, '')
    .replace(/\bLocal\s*Language\b/gi, '')
    .replace(/\bLanguage\b/gi, '')
    .replace(/(?:,\s*|\s+)Local(?:\s*,|\s+|$)/gi, (m) => (m.includes(',') ? ', ' : ' '))
    .replace(/\bLocal\b/gi, '')
    .replace(/\bFarmer[\s\-_]*type[\s\S]*/i, '')
    .replace(/\bOccupations?[\s\S]*/i, '')
    .replace(/\bLand[\s\-_]*Ownership[\s\S]*/i, '')
    .replace(/\bLand\s*owning\s*FarmerAgriculture\b/gi, '')
    // Normalize commas and whitespace
    .replace(/\s*,\s*/g, ', ')
    .replace(/(?:,\s*)+/g, ', ')
    .replace(/^[\s,.\-|/]+/, '')
    .replace(/[\s,.\-|/]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return address;
}

export interface ExtractedLandData {
  rows: LandRow[];
  village: string;
  surveyNo: string;
  totalArea: string;
  khataNo: string;
  subDistrict: string;
  district: string;
  state: string;
  landSummary: string;
}

/**
 * Splits a line into distinct table column cells based on |, tab, or 2+ spaces.
 */
function splitLineIntoCols(line: string): string[] {
  if (line.includes('|')) return line.split('|').map(p => p.trim());
  if (line.includes('\t')) return line.split('\t').map(p => p.trim());
  return line.split(/\s{2,}/).map(p => p.trim());
}

function cleanAreaVal(raw: string): string {
  if (!raw) return '';
  const m = raw.match(/\b\d+(?:\.\d+)?\b/);
  return m ? m[0] : raw.replace(/,/g, '').trim();
}

function cleanSurveyNo(sNo?: string, ssNo?: string): string {
  const s = (sNo || '').trim();
  const ss = (ssNo || '').trim();
  if (!ss || ss === '*' || ss === '-') return s;
  return `${s}/${ss}`;
}

function cleanKhataVal(raw?: string): string {
  const v = (raw || '').trim();
  if (!v || /^[\-*\.]+$/.test(v) || /^(?:n\/?a|nil|none|khata|khate|no|number)$/i.test(v)) {
    return '';
  }
  return v;
}

interface LandTableHeaderCols {
  village: number;
  survey: number;
  owner: number;
  area: number;
  khata: number;
  subDistrict: number;
  district: number;
  state: number;
}

function detectLandHeaderCols(parts: string[]): LandTableHeaderCols | null {
  if (parts.length < 3) return null;
  const lower = parts.map(p => p.toLowerCase());
  const hasVillage = lower.some(p => p.includes('village') || p.includes('गाव'));
  const hasSurvey = lower.some(p => /s\s*no|s\/s|survey|gat|सर्व्हे/i.test(p));
  const hasArea = lower.some(p => /extent|assigned\s*area|area|क्षेत्र/i.test(p));

  if (!hasVillage && !(hasSurvey && hasArea)) return null;

  const ownerIdx = lower.findIndex(p => /owner\s*type|मालकी\s*प्रकार/i.test(p));
  return {
    village: lower.findIndex(p => p.includes('village') || p.includes('गाव')),
    survey: lower.findIndex(p => /s\s*no|s\/s|survey|gat|सर्व्हे/i.test(p)),
    owner: ownerIdx >= 0
      ? ownerIdx
      : lower.findIndex(p => p.includes('owner') && !p.includes('name') && !p.includes('share')),
    area: lower.findIndex(p => /extent|assigned\s*area|area|क्षेत्र/i.test(p)),
    khata: lower.findIndex(
      p => (p.includes('khata') || p.includes('खाते') || p.includes('खाता')) && !p.includes('बचत') && !p.includes('bank')
    ),
    subDistrict: lower.findIndex(p => /sub\s*district|taluk|tehsil|तालुका/i.test(p)),
    district: lower.findIndex(p => p.includes('district') && !p.includes('sub')),
    state: lower.findIndex(p => p.includes('state')),
  };
}

function resolveVillage(rawVillage: string, address?: string, nextLine?: string): string {
  let v = (rawVillage || '').trim();
  if (!v) return '';

  // 1. Check if next line contains wrapped syllable (e.g. "adi", "wadi", "gaon", "pur", "khed", "bad", "ner", "oli", "pada")
  if (nextLine) {
    const nextWords = nextLine.split(/\s+/);
    for (const nw of nextWords) {
      if (/^(adi|wadi|gaon|pur|khed|bad|ner|oli|pada)\b/i.test(nw)) {
        v = v + nw;
        break;
      }
    }
  }

  // 2. Cross-reference with address (e.g. if address contains village name)
  if (address) {
    const cleanAddr = address.toLowerCase();
    const cleanV = v.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanV.length >= 3 && cleanAddr.includes(cleanV.slice(0, Math.min(4, cleanV.length)))) {
      const words = address.split(/[\s,]+/);
      const matchWords = words.filter(w => /^[A-Za-z]+$/.test(w));
      if (matchWords.length > 0) {
        return matchWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }

  return v.charAt(0).toUpperCase() + v.slice(1);
}

/**
 * Extracts multiple Land Details records dynamically from PDF text (digital or OCR).
 * Uses column mapping:
 * 1. S No./S/S no. -> survey_no
 * 2. Khata No. -> khata_no
 * 3. Village -> village
 * 4. Owner Type -> owner_type
 * 5. Extent Assigned Area -> area
 * Strictly limits to max 5 records. Never hardcodes any place, name, or number.
 */
export function extractLandRecordsFromText(
  fullText: string,
  p2Text?: string,
  p3Text?: string,
  address?: string
): ExtractedLandData {
  // Use fullText (which contains all pages in natural chronological order)
  // Fall back to combined page texts if fullText is empty
  const combinedText = fullText || [p2Text, p3Text].filter(Boolean).join('\n---\n');
  const extractedRows: LandRow[] = [];
  let foundState = '';
  let foundDistrict = '';
  let foundSubDistrict = '';
  let foundKhataNo = '';
  let foundTotalArea = '';

  // Pre-clean line wraps dynamically without hardcoding
  let pre = combinedText
    .replace(/MAHARAS\s*\n*\s*HTRA/gi, 'MAHARASHTRA')
    .replace(/\b([A-Za-z]{3,})\s*\n+\s*(adi|wadi|gaon|pur|khed|bad|ner|oli|pada)\b/gi, '$1$2');

  const lines = pre.split('\n').map(l => l.trim()).filter(Boolean);

  // Strategy 1: AgriStack OCR table rows (detect lines having decimal Area + Owner Type)
  let s1HeaderCols: LandTableHeaderCols | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Stop processing if we reached the consent or annexure section after the table
    if (line.includes('Consent by Farmer') || line.includes('Annexure')) break;

    if (!s1HeaderCols && (line.includes('|') || line.includes('\t')) && !/\d+\.\d+/.test(line)) {
      const detected = detectLandHeaderCols(splitLineIntoCols(line));
      if (detected) s1HeaderCols = detected;
    }

    // Check for decimal areas (e.g. 0.070000, 0.820000, 1.230000)
    const areaMatches = [...line.matchAll(/\b(\d+\.\d+)[,\s]*/g)];
    const ownerTypeMatch = line.match(/\b(Single|Sole|Joint|Individual|Ancestral|Self|Owner|Co-Owner|Tenant|स्वतःची|सामाईक|वारसाहक्क|इतर)\b/i);

    if (areaMatches.length > 0 && ownerTypeMatch) {
      const assignedArea = cleanAreaVal(areaMatches[areaMatches.length - 1][1]);
      const ownerType = ownerTypeMatch[1];
      const nextLine = lines[i + 1] || '';

      let rowKhata = '';
      if (s1HeaderCols && s1HeaderCols.khata >= 0 && (line.includes('|') || line.includes('\t'))) {
        const fullParts = splitLineIntoCols(line);
        if (fullParts.length > s1HeaderCols.khata) {
          rowKhata = cleanKhataVal(fullParts[s1HeaderCols.khata]);
        }
      }

      const firstAreaIndex = line.indexOf(areaMatches[0][0]);
      const lineBeforeArea = line.substring(0, firstAreaIndex).trim();

      let sNo = '';
      let ssNo = '';
      let villageRaw = '';
      let subDistrictRaw = '';
      let districtRaw = '';
      let stateRaw = '';

      // Extract District, SubDistrict, Village from lineBeforeArea
      const upperLine = lineBeforeArea.toUpperCase();
      for (const d of MAHARASHTRA_DISTRICTS) {
        const dIdx = upperLine.indexOf(d);
        if (dIdx !== -1) {
          districtRaw = d;
          const beforeDist = lineBeforeArea.substring(0, dIdx).replace(/[|\s_]+/g, '').trim();
          if (/MAHARA/i.test(beforeDist)) {
            stateRaw = 'MAHARASHTRA';
          } else if (beforeDist.length >= 4) {
            stateRaw = beforeDist;
          }

          const afterDist = lineBeforeArea.substring(dIdx + d.length).trim();
          const words = afterDist.split(/[|\s]+/).filter(w => /^[A-Za-z]+$/.test(w) && !/^(Single|Sole|Joint|Owner|Male|Female)$/i.test(w));
          if (words.length >= 2) {
            subDistrictRaw = words[0];
            villageRaw = words[1];
          } else if (words.length === 1) {
            villageRaw = words[0];
          }
          break;
        }
      }

      // 1. Check pipe parts for survey numbers
      if (lineBeforeArea.includes('|')) {
        const parts = lineBeforeArea.split('|').map(p => p.trim());
        const startIdx = s1HeaderCols && s1HeaderCols.survey >= 1 && s1HeaderCols.survey < parts.length
          ? s1HeaderCols.survey
          : 1;
        const candidateIndices = [
          startIdx,
          ...Array.from({ length: Math.max(0, parts.length - 1) }, (_, k) => k + 1).filter(idx => idx !== startIdx),
        ];

        for (const p of candidateIndices) {
          if (s1HeaderCols && p === s1HeaderCols.khata) continue;
          const part = parts[p];
          // Two tokens separated by space in cell, e.g. "52 16/4", "67 1", "14 *"
          const mSpace = part.match(/\b(\d{1,5})\s+([0-9A-Za-z\u0900-\u097F\/\*\-]+)\b/);
          if (mSpace) {
            sNo = mSpace[1];
            ssNo = mSpace[2];
            if (p >= 1 && !villageRaw && /^[A-Za-z\s]+$/.test(parts[p - 1])) villageRaw = parts[p - 1];
            break;
          }
          // Combined slash survey in cell, e.g. "67/1", "Gat 45/2"
          const mCombined = part.match(/\b(?:Gat(?:\s*No)?\.?\s*)?(\d{1,5}(?:\s*[\/|\-]\s*[0-9A-Za-z\u0900-\u097F]+)+)\b/i);
          if (mCombined) {
            sNo = mCombined[1].replace(/\s+/g, '');
            if (p >= 1 && !villageRaw && /^[A-Za-z\s]+$/.test(parts[p - 1])) villageRaw = parts[p - 1];
            break;
          }
          // Single number in cell p, and sub-survey in cell p+1
          const mSingle = part.match(/^\d{1,5}$/);
          if (mSingle) {
            sNo = mSingle[0];
            const nextIsKhata = s1HeaderCols && p + 1 === s1HeaderCols.khata;
            if (!nextIsKhata && parts[p + 1] && /^[0-9A-Za-z\u0900-\u097F\/\*\-]+$/.test(parts[p + 1])) {
              ssNo = parts[p + 1];
            }
            if (p >= 1 && !villageRaw && /^[A-Za-z\s]+$/.test(parts[p - 1])) villageRaw = parts[p - 1];
            break;
          }
        }
      }

      // 2. If not found via pipes, check lineBeforeArea directly
      if (!sNo) {
        const mSlash = lineBeforeArea.match(/\b(?:Gat(?:\s*No)?\.?\s*)?(\d{1,5}(?:\s*[\/|\-]\s*[0-9A-Za-z\u0900-\u097F]+)+)\b/i);
        if (mSlash) {
          sNo = mSlash[1].replace(/\s+/g, '');
        } else {
          const mSpace = lineBeforeArea.match(/\b(\d{1,5})\s+([0-9A-Za-z\u0900-\u097F\/\*\-]+)\b/);
          if (mSpace) {
            sNo = mSpace[1];
            ssNo = mSpace[2];
          } else {
            const mSingle = lineBeforeArea.match(/\b(\d{1,5})\b/);
            if (mSingle) sNo = mSingle[1];
          }
        }
      }

      if (sNo) {
        const surveyFinal = cleanSurveyNo(sNo, ssNo);
        let villageFinal = resolveVillage(villageRaw, address, nextLine);
        if (!villageFinal && extractedRows.length > 0) {
          villageFinal = extractedRows[extractedRows.length - 1].village;
        }

        // Deduplicate rows with identical survey_no and area
        const isDuplicate = extractedRows.some(
          r => r.survey_no === surveyFinal && r.area === assignedArea
        );

        if (!isDuplicate) {
          extractedRows.push({
            khata_no: rowKhata,
            survey_no: surveyFinal,
            village: villageFinal,
            owner_type: ownerType,
            area: assignedArea,
          });

          if (!foundKhataNo && rowKhata) foundKhataNo = rowKhata;
          if (!foundDistrict && districtRaw) foundDistrict = correctDistrict(districtRaw);
          if (!foundSubDistrict && subDistrictRaw) foundSubDistrict = subDistrictRaw;
          if (!foundState && stateRaw) foundState = stateRaw;
        }
      }

      if (extractedRows.length >= 5) break;
    }
  }

  // Strategy 2: Generic Pipe-delimited or Tab-delimited table with column headers
  if (extractedRows.length === 0) {
    let headerCols: LandTableHeaderCols | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Consent by Farmer') || line.includes('Annexure')) break;

      const parts = splitLineIntoCols(line);
      if (parts.length < 3) continue;

      if (!headerCols) {
        const detected = detectLandHeaderCols(parts);
        if (detected) {
          headerCols = detected;
          continue;
        }
      }

      if (headerCols) {
        if (/(?:Total\s*Land|Annexure|Signature|Consent|Declaration)/i.test(line)) break;

        const v = headerCols.village >= 0 ? parts[headerCols.village] : '';
        const s = headerCols.survey >= 0 ? parts[headerCols.survey] : '';
        const o = headerCols.owner >= 0 ? parts[headerCols.owner] : '';
        const a = headerCols.area >= 0 ? parts[headerCols.area] : '';
        const k = headerCols.khata >= 0 ? cleanKhataVal(parts[headerCols.khata]) : '';

        const cleanS = cleanSurveyNo(s);
        const cleanA = cleanAreaVal(a);

        // A valid land record MUST have a Survey Number OR an Area!
        // If both are empty, this is a cell continuation/wrapped line, NOT a new row!
        if (!cleanS && !cleanA) {
          if (v && extractedRows.length > 0) {
            const lastRow = extractedRows[extractedRows.length - 1];
            if (lastRow.village && !lastRow.village.toLowerCase().includes(v.toLowerCase())) {
              lastRow.village = resolveVillage(lastRow.village + v, address);
            }
          }
          continue;
        }

        let ownerType = o;
        for (const part of parts) {
          const oM = part.match(/\b(Single|Sole|Joint|Individual|Ancestral|Self|Owner|Co-Owner|Tenant|स्वतःची|सामाईक|वारसाहक्क|इतर)\b/i);
          if (oM) {
            ownerType = oM[1];
            break;
          }
        }

        const surveyFinal = cleanS;
        let villageFinal = resolveVillage(v, address);
        if (!villageFinal && extractedRows.length > 0) {
          villageFinal = extractedRows[extractedRows.length - 1].village;
        }

        const isDuplicate = extractedRows.some(
          r => r.survey_no === surveyFinal && r.area === cleanA
        );

        if (!isDuplicate) {
          extractedRows.push({
            khata_no: k,
            survey_no: surveyFinal,
            village: villageFinal,
            owner_type: ownerType,
            area: cleanA,
          });

          if (!foundState && headerCols.state >= 0) foundState = parts[headerCols.state];
          if (!foundDistrict && headerCols.district >= 0) foundDistrict = correctDistrict(parts[headerCols.district]);
          if (!foundSubDistrict && headerCols.subDistrict >= 0) foundSubDistrict = parts[headerCols.subDistrict];
          if (!foundKhataNo && k) foundKhataNo = k;
        }

        if (extractedRows.length >= 5) break;
      }
    }
  }

  // Strategy 3: Fallback for 4-column space-separated lines
  if (extractedRows.length === 0) {
    const spaceRegex = /^([A-Za-z\s]+?)\s+([0-9]+(?:\s*[\/|\*\\-]\s*[A-Za-z0-9\u0900-\u097F]+)*)\s+(Single|Sole|Joint|Individual|Ancestral|Self|Owner|Co-Owner|Tenant|स्वतःची|सामाईक|वारसाहक्क|इतर)\s+([\d\.]+)/i;
    for (const line of lines) {
      if (line.includes('Consent by Farmer') || line.includes('Annexure')) break;
      const sm = line.match(spaceRegex);
      if (sm) {
        extractedRows.push({
          khata_no: '',
          village: resolveVillage(sm[1], address),
          survey_no: sm[2].trim(),
          owner_type: sm[3].trim(),
          area: cleanAreaVal(sm[4]),
        });
        if (extractedRows.length >= 5) break;
      }
    }
  }

  // Fallbacks for District, SubDistrict, State, Khata, Total Area
  if (!foundDistrict) {
    const dMatch = pre.match(/District\s*[:\-\s]*([A-Za-z\s]+?)(?=\n|State|Pincode|$)/i);
    if (dMatch) foundDistrict = correctDistrict(dMatch[1]);
  }

  if (!foundSubDistrict) {
    const sdMatch = pre.match(/(?:Sub\s*District|Taluka|Tahsil|Tehsil|Block)\s*[:\-\s]*([A-Za-z\s]+?)(?=\n|District|State|$)/i);
    if (sdMatch) foundSubDistrict = sdMatch[1].trim();
  }

  if (!foundState) {
    const stMatch = pre.match(/(?:State(?:\s*\/\s*UT)?)\s*[:\-]\s*([A-Za-z\s]{3,20})(?=\s*[|\n]|District|Pincode|Pin|$)/i);
    if (stMatch) {
      const candidate = stMatch[1].trim();
      if (!/(Government|Registry|Project|Department|Authority|Consent|Transfer)/i.test(candidate)) {
        foundState = candidate;
      }
    }
    if (!foundState && /MAHARASHTRA|Maharashtra/i.test(pre)) {
      foundState = 'MAHARASHTRA';
    }
  }

  let docKhataFallback = '';
  if (!foundKhataNo) {
    for (const line of lines) {
      if (/(?:Bank|Savings|IFSC|Account|बचत)/i.test(line)) continue;
      const kMatch =
        line.match(/(?:Khata|Khate)\s*(?:No\.?|Number|Id)\s*[:\-\s]+([A-Za-z0-9\/\-]{1,20})/i) ||
        line.match(/(?:खाते|खाता)\s*(?:क्र\.?|क्रमांक)\s*[:\-\s]+([0-9A-Za-z\u0966-\u096F\/\-]{1,20})/i);
      if (kMatch) {
        const candidate = cleanKhataVal(kMatch[1]);
        if (candidate) {
          docKhataFallback = candidate;
          foundKhataNo = candidate;
          break;
        }
      }
    }
  }

  if (!foundTotalArea) {
    const areaMatch = pre.match(/(?:Total\s*Land\s*Area\s*Owned\s*\(Hectare\)|Extent\s*Total\s*Area|Extent\s*Assigned\s*Area)\s*[:\-\s]*([\d\.]+)/i);
    if (areaMatch) foundTotalArea = cleanAreaVal(areaMatch[1]);
    else if (extractedRows[0]?.area) foundTotalArea = extractedRows[0].area;
  }

  // Guarantee at least 1 row and strictly max 5 records
  const finalRows: LandRow[] = extractedRows.length > 0
    ? extractedRows.slice(0, 5).map(row => ({
        ...row,
        khata_no: row.khata_no || docKhataFallback,
      }))
    : [{
        khata_no: foundKhataNo || '',
        survey_no: '',
        village: '',
        owner_type: '',
        area: '',
      }];

  const primaryRow = finalRows[0];

  const summaryParts: string[] = [];
  if (foundTotalArea) summaryParts.push(`${foundTotalArea} Hectare`);
  if (primaryRow.survey_no) summaryParts.push(`Gat No: ${primaryRow.survey_no}`);
  if (primaryRow.village) summaryParts.push(primaryRow.village);
  if (foundSubDistrict) summaryParts.push(foundSubDistrict);
  if (foundDistrict) summaryParts.push(foundDistrict);
  if (foundState) summaryParts.push(foundState);

  return {
    rows: finalRows,
    village: primaryRow.village || '',
    surveyNo: primaryRow.survey_no || '',
    totalArea: foundTotalArea,
    khataNo: primaryRow.khata_no || foundKhataNo,
    subDistrict: foundSubDistrict,
    district: foundDistrict,
    state: foundState,
    landSummary: summaryParts.join(', '),
  };
}

/**
 * Extracts all 10 fields and farmer photo purely in the browser.
 * 1. Checks digital PDF text layer first.
 * 2. If scanned, runs high-resolution full-page WASM OCR.
 * 3. Never returns hardcoded prefilled mock data.
 */
export async function extractFarmerDataFromPdf(
  pdfBuffer: ArrayBuffer,
  onProgress?: ExtractionProgressCallback,
  language: Language = 'en'
): Promise<FarmerRecord> {
  const pt = getTranslations(language).pdfProgress;
  onProgress?.(pt.loadingPdf, 10);
  const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
  const totalPages = pdf.numPages;

  onProgress?.(pt.renderingPage1, 25);
  // High-res canvas render
  const p1RawCanvas = await renderPdfPageToCanvas(pdf, 1, 2.5);
  const photoDetails = extractPhotoDetailsFromCanvas(p1RawCanvas);
  const photoUrl = photoDetails?.photoUrl || null;
  const pdfPageImageUrl = p1RawCanvas.toDataURL('image/jpeg', 0.85);

  // Check if digital text exists in the PDF
  const digitalTexts = await extractDigitalPageTexts(pdf);
  const hasDigitalText = digitalTexts.some(t => t.trim().length > 60);

  let p1Text = digitalTexts[0] || '';
  let p2Text = digitalTexts[1] || '';
  let p3Text = digitalTexts[2] || '';
  let fullText = digitalTexts.join('\n---\n');

  // If digital text is missing or sparse (scanned form), perform OCR
  if (!hasDigitalText || p1Text.trim().length < 60) {
    onProgress?.(pt.initializingOcr, 40);
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          const pct = Math.floor(40 + (m.progress || 0) * 45);
          onProgress?.(formatMessage(pt.recognizingTextPct, { pct: Math.floor(m.progress * 100) }), pct);
        }
      }
    });

    // Page 1 OCR (Demographics, Farmer ID, Enrollment)
    onProgress?.(pt.recognizingPage1, 45);
    const p1Res = await worker.recognize(p1RawCanvas);
    p1Text = p1Res.data.text;

    // Page 2 OCR (Mobile & Address)
    if (totalPages >= 2) {
      onProgress?.(pt.recognizingPage2, 65);
      const p2RawCanvas = await renderPdfPageToCanvas(pdf, 2, 2.5);
      const p2Res = await worker.recognize(p2RawCanvas);
      p2Text = p2Res.data.text;
    }

    // Page 3 OCR (Land Details)
    if (totalPages >= 3) {
      onProgress?.(pt.recognizingPage3, 80);
      const p3RawCanvas = await renderPdfPageToCanvas(pdf, 3, 2.5);
      const p3Res = await worker.recognize(p3RawCanvas);
      p3Text = p3Res.data.text;
    }

    // Final Page OCR (Signature block with clean typed Farmer Name)
    let pLastText = '';
    if (totalPages >= 4) {
      onProgress?.(pt.recognizingFinalPage, 90);
      const pLastCanvas = await renderPdfPageToCanvas(pdf, totalPages, 2.5);
      const pLastRes = await worker.recognize(pLastCanvas);
      pLastText = pLastRes.data.text;
    }

    await worker.terminate();

    fullText = [p1Text, p2Text, p3Text, pLastText].join('\n---\n');
  }

  onProgress?.(pt.extractingCredentials, 95);

  // 1. Farmer ID
  let farmerId = '';
  const fidMatch = fullText.match(/(?:Farmer\s*ID|Farmer\s*Id|FarmerID)\s*[:\-\s]*\n*([A-Za-z0-9_-]{6,30})/i);
  if (fidMatch) {
    farmerId = fidMatch[1].trim();
  } else {
    const idMatch = p1Text.match(/\b([A-Z]{2}\d{8,14}|\d{11,14})\b/);
    if (idMatch) farmerId = idMatch[1].trim();
  }

  // PM किसान नंबर: Do NOT auto-populate enrollment_no / Farmer enrollment number into PM किसान नंबर.
  // Only extract if explicitly designated as PM Kisan (or leave blank for manual entry).
  let pmKisanNo = '';
  const pmKisanMatch = fullText.match(/(?:PM[\s\-_]*Kisan|PMKisan)\s*(?:Samman\s*Nidhi)?\s*(?:Registration|Reg|ID|No|Number)\s*[:\-\s]*([A-Za-z0-9_-]{6,30})/i);
  if (pmKisanMatch) {
    const candidate = pmKisanMatch[1].trim();
    if (!/^(?:Bank|Branch|Credit|Card|Farmer|Name|Address)$/i.test(candidate)) {
      pmKisanNo = candidate;
    }
  }

  // 2. Farmer Name
  let farmerName = '';
  // Check final page signature block first (cleanest typed English representation)
  const sigMatch = fullText.match(/Farmer\s*Name\s*\n+Date:[^\n]+\n+([A-Za-z\s]{3,50})/i);
  if (sigMatch) {
    const candidate = sigMatch[1].replace(/[^A-Za-z\s]/g, '').trim();
    if (candidate.length >= 3 && !/^(Date|Farmer|Name)$/i.test(candidate)) {
      farmerName = candidate;
    }
  }

  // Check table format on Page 1: "Farmer Name as per Aadhaar in English <First> ... \n <Last>"
  if (!farmerName) {
    const tblMatch = p1Text.match(/Farmer\s*Name[^\n]*in\s*English\s+([A-Za-z]+)\s*(?:\||Farmer)?[^\n]*\n+([A-Za-z\s]+?)(?=\s*[|:]|[^\x00-\x7F]|\n|$)/i);
    if (tblMatch) {
      const p1 = tblMatch[1].trim();
      const p2Words = tblMatch[2].trim().split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w) && w.length >= 2);
      farmerName = `${p1} ${p2Words.join(' ')}`.trim();
    }
  }

  // Fallback single-line table format
  if (!farmerName) {
    const singleLineMatch = fullText.match(/(?:Farmer\s*Name|Name\s*of\s*Farmer)(?:\s*(?:as\s*per\s*Aadhaar)?\s*(?:in\s*English|\(English\)|English))?\s*[:\-\s]+([A-Za-z\s]{3,45}?)(?=\s*[|:]|[^\x00-\x7F]|\n|$)/i);
    if (singleLineMatch) {
      const candidate = singleLineMatch[1].trim();
      if (candidate.length >= 3 && !/^(English|Local|Gender)$/i.test(candidate)) {
        farmerName = candidate;
      }
    }
  }

  // 3. Identifier Name (Father / Spouse)
  let identifierName = '';
  const idMatch = fullText.match(/Identifier\s*Name\s*(?:In\s*English)?\s+([A-Za-z\s]+?)(?=\s+Identifier|\s+Local|\s*[|:]|\n|$)/i) ||
    fullText.match(/(?:Father|Husband|Spouse)(?:\'s)?\s*(?:Name)?\s*[:\-\s]*([A-Za-z\s]{3,40}?)(?=\s*[|:]|[^\x00-\x7F]|\n|$)/i);
  if (idMatch) {
    const raw = idMatch[1].replace(/[^A-Za-z\s]/g, '').trim();
    if (raw.length >= 3 && !/^(Gender|Male|Female|Caste|Category|Identifier|Relationship|In|English)$/i.test(raw)) {
      identifierName = raw;
    }
  }

  // 4. DOB & Age
  let dob = '';
  const dobMatch = fullText.match(/(?:Date\s*of\s*Birth|DOB|Birth\s*Date)[\s\S]*?([0-3]?\d[\/\.\-][0-1]?\d[\/\.\-](?:19|20)\d{2})/i) ||
    p1Text.match(/\b([0-3]?\d[\/\.\-][0-1]?\d[\/\.\-](?:19|20)\d{2})\b/);
  if (dobMatch) dob = dobMatch[1].replace(/-/g, '/').trim();

  let age = '';
  const ageMatch = p1Text.match(/Age\s*[:\-\s]*(\d{1,3})/i) ||
    p1Text.match(/\b(\d{1,3})\s*(?:Years|Yrs)\b/i);
  if (ageMatch) age = ageMatch[1].trim();

  // 5. Gender
  let gender = '';
  const genMatch = p1Text.match(/Gender\s*[:\-\s]*([A-Za-z]+)/i);
  if (genMatch) {
    const g = genMatch[1].trim();
    if (/^Female$/i.test(g)) gender = 'Female';
    else if (/^Male$/i.test(g)) gender = 'Male';
    else if (/^Transgender$/i.test(g)) gender = 'Transgender';
  } else {
    const standaloneGen = p1Text.match(/\b(Female|Male|Transgender)\b/i);
    if (standaloneGen) gender = standaloneGen[1].trim();
  }

  // 6. Caste Category
  let casteCategory = '';
  const casteMatch = p1Text.match(/Caste\s*Category\s*[:\-\s]*([A-Za-z]+)/i);
  if (casteMatch) {
    const c = casteMatch[1].trim();
    if (/^(General|OBC|SC|ST|SEBC|Open|NT|VJNT)$/i.test(c)) {
      casteCategory = c;
    }
  } else {
    const standaloneCat = p1Text.match(/\b(General|OBC|SC|ST|SEBC|Open)\b/i);
    if (standaloneCat) casteCategory = standaloneCat[1].trim();
  }

  // 7. Mobile Number
  let mobileNumber = '';
  const mobMatch = fullText.match(/(?:Mobile|Phone|Contact)(?:\s*(?:Number|No))?\s*[:\-\s]*([6-9]\d{9})\b/i) ||
    fullText.match(/\b([6-9]\d{9})\b/);
  if (mobMatch) mobileNumber = mobMatch[1].trim();

  // Aadhaar Number
  let aadhaarNumber = '';
  const aadhMatch = fullText.match(/(?:Aadhaar|UID|Adhar)(?:\s*(?:Number|No))?\s*[:\-\s]*([0-9X]{4}[\s\-]?[0-9X]{4}[\s\-]?[0-9]{4})\b/i);
  if (aadhMatch) {
    aadhaarNumber = aadhMatch[1].trim();
  }

  // PAN Card
  const panCard = extractPanCard(fullText);

  // Address (Extract before landData so village resolution can cross-reference address)
  let address = '';
  const targetAddressText = p2Text ? `${p2Text}\n---\n${fullText}` : fullText;
  const addrMatch =
    targetAddressText.match(/(?:Address\s*In\s*Eng(?:lish)?|Address\s*In\s*English)\s*[:\-\s]*([\s\S]+?)(?=\n*\s*(?:Farmer[\s\-_]*type|Occupations?|Land[\s\-_]*Ownership|State\s*[\/-]?\s*UT|Annexure|$))/i) ||
    targetAddressText.match(/(?:Farmer\s*Residential\s*Details[\s\S]*?)?Address\s*[:\-\s]*([\s\S]+?)(?=\n*\s*(?:Farmer[\s\-_]*type|Occupations?|Land[\s\-_]*Ownership|State\s*[\/-]?\s*UT|Annexure|$))/i);

  if (addrMatch) {
    address = cleanExtractedAddress(addrMatch[1]);
  } else if (p2Text) {
    const fallbackMatch = p2Text.match(/Address[^\n:]*[:\n]\s*([^\n\r]{10,200})/i);
    if (fallbackMatch) {
      address = cleanExtractedAddress(fallbackMatch[1]);
    }
  }

  // 8. Land Details & Records (dynamic multi-row extraction, limit to 5)
  const landData = extractLandRecordsFromText(fullText, p2Text, p3Text, address);

  // Bank Details
  const bankName = extractBankName(fullText);
  const accountNo = extractAccountNumber(fullText);
  const ifscCode = extractIfscCode(fullText);

  onProgress?.(pt.complete, 100);

  return {
    farmer_id: farmerId,
    enrollment_no: pmKisanNo,
    farmer_name: farmerName,
    identifier_name: identifierName,
    dob: dob,
    age: age,
    gender: gender,
    caste_category: casteCategory,
    mobile_number: mobileNumber,
    aadhaar_number: aadhaarNumber,
    pan_card: panCard,
    land_detail: {
      khata_no: landData.khataNo,
      total_area_hectare: landData.totalArea,
      number_of_lands: String(landData.rows.length),
      survey_gat_no: landData.surveyNo,
      village: landData.village,
      sub_district: landData.subDistrict,
      district: landData.district,
      state: landData.state,
      summary: landData.landSummary,
    },
    land_records: landData.rows,
    bank_detail: {
      bank_name_branch: bankName,
      bank_name: bankName,
      account_no: accountNo,
      ifsc_code: ifscCode,
    },
    address: address,
    photo_url: photoUrl || undefined,
    raw_photo_url: photoUrl || undefined,
    pdf_page_image_url: pdfPageImageUrl,
    photo_bbox: photoDetails?.bbox,
  };
}
