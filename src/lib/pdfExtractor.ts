import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { FarmerRecord } from '../types';

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
  return '';
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

/**
 * Advanced Photo Cropper:
 * Uses both edge gradients (facial/clothing features) and background margin scanning
 * to capture the full portrait from hair to shoulders without clipping light clothing.
 */
export function extractPhotoFromCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;

  // Search zone in top-right quadrant beneath "Farmer Photograph"
  const rx1 = Math.floor(w * 0.68);
  const ry1 = Math.floor(h * 0.14);
  const rx2 = Math.floor(w * 0.98);
  const ry2 = Math.floor(h * 0.48);

  const roiW = rx2 - rx1;
  const roiH = ry2 - ry1;

  const imgData = ctx.getImageData(rx1, ry1, roiW, roiH);
  const data = imgData.data;

  const getPixel = (x: number, y: number) => {
    const idx = (y * roiW + x) * 4;
    return (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
  };

  // 1. Find top edge of photo (head/hair)
  let topEdge = 0;
  for (let y = 0; y < roiH; y++) {
    let nonWhite = 0;
    for (let x = 0; x < roiW; x += 2) {
      if (getPixel(x, y) < 238) nonWhite++;
    }
    if (nonWhite > (roiW / 2) * 0.30) {
      topEdge = y;
      break;
    }
  }

  // 2. Find bottom edge of photo:
  // Detect where the photo content ends and white margin gap begins before the next table header bar
  let bottomEdge = roiH;
  for (let y = topEdge + 80; y < roiH; y++) {
    let rowSum = 0;
    let sampled = 0;
    for (let x = 0; x < roiW; x += 3) {
      rowSum += getPixel(x, y);
      sampled++;
    }
    const avg = rowSum / sampled;
    if (avg > 248) { // Distinct white margin band
      bottomEdge = y;
      break;
    }
  }

  // 3. Find left and right edges within [topEdge, bottomEdge]
  const cropH = bottomEdge - topEdge;
  let leftEdge = 0;
  for (let x = 0; x < roiW; x++) {
    let nonWhite = 0;
    for (let y = topEdge; y < bottomEdge; y += 3) {
      if (getPixel(x, y) < 238) nonWhite++;
    }
    if (nonWhite > (cropH / 3) * 0.25) {
      leftEdge = x;
      break;
    }
  }

  let rightEdge = roiW;
  for (let x = roiW - 1; x > leftEdge; x--) {
    let nonWhite = 0;
    for (let y = topEdge; y < bottomEdge; y += 3) {
      if (getPixel(x, y) < 238) nonWhite++;
    }
    if (nonWhite > (cropH / 3) * 0.25) {
      rightEdge = x;
      break;
    }
  }

  let finalW = rightEdge - leftEdge;
  let finalH = bottomEdge - topEdge;

  if (finalW < 40 || finalH < 40) return null;

  // Enforce standard passport portrait aspect ratio (~3:4 or ~4:5)
  // If slightly off due to margins, trim proportionally
  const idealAspect = 0.80; // width / height
  const currentAspect = finalW / finalH;
  if (currentAspect < 0.65) {
    finalW = Math.floor(finalH * idealAspect);
  } else if (currentAspect > 1.05) {
    finalH = Math.floor(finalW / idealAspect);
  }

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = finalW;
  cropCanvas.height = finalH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return null;

  cropCtx.drawImage(
    canvas,
    rx1 + leftEdge,
    ry1 + topEdge,
    finalW,
    finalH,
    0,
    0,
    finalW,
    finalH
  );

  return cropCanvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Extracts digital text directly from PDF pages if available.
 */
async function extractDigitalPageTexts(pdf: pdfjsLib.PDFDocumentProxy): Promise<string[]> {
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const str = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      pageTexts.push(str);
    } catch {
      pageTexts.push('');
    }
  }
  return pageTexts;
}

/**
 * Extracts all 10 fields and farmer photo purely in the browser.
 * 1. Checks digital PDF text layer first.
 * 2. If scanned, runs high-resolution full-page WASM OCR.
 * 3. Never returns hardcoded prefilled mock data.
 */
export async function extractFarmerDataFromPdf(
  pdfBuffer: ArrayBuffer,
  onProgress?: ExtractionProgressCallback
): Promise<FarmerRecord> {
  onProgress?.('Loading PDF document in browser memory...', 10);
  const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
  const totalPages = pdf.numPages;

  onProgress?.('Rendering Page 1 at 250 DPI & extracting photograph...', 25);
  // High-res canvas render
  const p1RawCanvas = await renderPdfPageToCanvas(pdf, 1, 2.5);
  const photoUrl = extractPhotoFromCanvas(p1RawCanvas);

  // Check if digital text exists in the PDF
  const digitalTexts = await extractDigitalPageTexts(pdf);
  const hasDigitalText = digitalTexts.some(t => t.trim().length > 60);

  let p1Text = digitalTexts[0] || '';
  let p2Text = digitalTexts[1] || '';
  let p3Text = digitalTexts[2] || '';

  // If digital text is missing or sparse (scanned form), perform OCR
  if (!hasDigitalText || p1Text.trim().length < 60) {
    onProgress?.('Initializing Tesseract WebAssembly engine...', 40);
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          const pct = Math.floor(40 + (m.progress || 0) * 45);
          onProgress?.(`Recognizing text (${Math.floor(m.progress * 100)}%)...`, pct);
        }
      }
    });

    // Page 1 OCR (Full page to avoid slicing lines in table layouts)
    onProgress?.('Recognizing text on Page 1...', 50);
    const p1Canvas = preprocessCanvasForOcr(p1RawCanvas);
    const p1Res = await worker.recognize(p1Canvas);
    p1Text = p1Res.data.text;

    // Page 2 OCR (Mobile & Address)
    if (totalPages >= 2) {
      onProgress?.('Recognizing text on Page 2...', 70);
      const p2RawCanvas = await renderPdfPageToCanvas(pdf, 2, 2.5);
      const p2Canvas = preprocessCanvasForOcr(p2RawCanvas);
      const p2Res = await worker.recognize(p2Canvas);
      p2Text = p2Res.data.text;
    }

    // Page 3 OCR (Land Details)
    if (totalPages >= 3) {
      onProgress?.('Recognizing text on Page 3...', 85);
      const p3RawCanvas = await renderPdfPageToCanvas(pdf, 3, 2.5);
      const p3Canvas = preprocessCanvasForOcr(p3RawCanvas);
      const p3Res = await worker.recognize(p3Canvas);
      p3Text = p3Res.data.text;
    }

    await worker.terminate();
  }

  onProgress?.('Validating and normalizing extracted fields...', 95);

  const fullText = [p1Text, p2Text, p3Text].join('\n---\n');

  // 1. Farmer ID
  let farmerId = '';
  const fidMatch = p1Text.match(/(?:Farmer\s*ID|Farmer\s*Id|FarmerID|Farmer\s*Identification)\s*[:\-\s]*\n*([A-Za-z0-9_-]{6,30})/i) ||
                   fullText.match(/(?:Farmer\s*ID|Farmer\s*Id|FarmerID)\s*[:\-\s]*\n*([A-Za-z0-9_-]{6,30})/i);
  if (fidMatch) {
    farmerId = fidMatch[1].trim();
  } else {
    const idMatch = p1Text.match(/\b([A-Z]{2}\d{8,14}|\d{11,14})\b/);
    if (idMatch) farmerId = idMatch[1].trim();
  }

  // Enrollment Number
  let enrollmentNo = '';
  const enrMatch = p1Text.match(/(?:Enrol+ment|Registration)\s*(?:Number|No)?\s*[:\-\s]*\n*([0-9_]{10,45})/i) ||
                   fullText.match(/(?:Enrol+ment|Registration)\s*(?:Number|No)?\s*[:\-\s]*\n*([0-9_]{10,45})/i);
  if (enrMatch) {
    enrollmentNo = enrMatch[1].trim();
  } else {
    const enrPattern = p1Text.match(/\b(\d{2}_\d{2,4}_\d{3,5}_\d{5,8}_\d{4,8}(?:_\d+)?)\b/);
    if (enrPattern) enrollmentNo = enrPattern[1].trim();
  }

  // 2. Farmer Name
  let farmerName = '';
  const nameMatch = p1Text.match(/(?:Farmer\s*Name|Name\s*of\s*Farmer)(?:\s*(?:In\s*English|\(English\)|English))?\s*[:\-\s]*\n*([A-Za-z\s\.\'\-]{2,45}?)(?=\n*\s*(?:Identifier|Father|Husband|Spouse|Gender|DOB|Date\s*of\s*Birth|Age|Caste|Category|Mobile|Address|Local|\d{2}\/)|$)/i);
  if (nameMatch) {
    let raw = nameMatch[1].replace(/^(?:In\s*English|English|Name|Farmer)\s*/i, '').trim();
    raw = raw.replace(/[^A-Za-z\s\.\'\-]/g, '').trim();
    if (raw.length >= 3 && !/^(Gender|Male|Female|Caste|Category|Identifier)$/i.test(raw)) {
      farmerName = raw;
    }
  }
  if (!farmerName) {
    const lines = p1Text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/Farmer\s*Name/i.test(lines[i])) {
        const colonIdx = lines[i].indexOf(':');
        if (colonIdx !== -1) {
          const after = lines[i].substring(colonIdx + 1).replace(/[^A-Za-z\s]/g, '').trim();
          if (after.length >= 3 && !/^(English|Local)$/i.test(after)) {
            farmerName = after;
            break;
          }
        }
        if (i + 1 < lines.length) {
          const next = lines[i + 1].replace(/[^A-Za-z\s]/g, '').trim();
          if (next.length >= 3 && !/^(Gender|Identifier|DOB|Date|Age|English|Local)/i.test(next)) {
            farmerName = next;
            break;
          }
        }
      }
    }
  }

  // 3. Identifier Name (Father / Spouse)
  let identifierName = '';
  const idMatch = p1Text.match(/(?:Identifier\s*Name|Father(?:\'s)?\s*Name|Husband(?:\'s)?\s*Name|Spouse(?:\'s)?\s*Name)(?:\s*(?:In\s*English|\(English\)|English))?\s*[:\-\s]*\n*([A-Za-z\s\.\'\-]{2,45}?)(?=\n*\s*(?:Identifier\s*Type|Relationship|Gender|DOB|Date\s*of\s*Birth|Age|Caste|Category|Mobile|Address|Local|\d{2}\/)|$)/i);
  if (idMatch) {
    let raw = idMatch[1].replace(/^(?:In\s*English|English|Name)\s*/i, '').trim();
    raw = raw.replace(/[^A-Za-z\s\.\'\-]/g, '').trim();
    if (raw.length >= 3 && !/^(Gender|Male|Female|Caste|Category|Identifier|Relationship)$/i.test(raw)) {
      identifierName = raw;
    }
  }

  // 4. DOB & Age
  let dob = '';
  const dobMatch = p1Text.match(/(?:DOB|Date\s*of\s*Birth|Birth\s*Date)[^\d\n]*([0-3]?\d[\/\.\-][0-1]?\d[\/\.\-](?:19|20)\d{2})/i) ||
                   fullText.match(/(?:DOB|Date\s*of\s*Birth|Birth\s*Date)[^\d\n]*([0-3]?\d[\/\.\-][0-1]?\d[\/\.\-](?:19|20)\d{2})/i);
  if (dobMatch) {
    dob = dobMatch[1].trim();
  } else {
    const genericDob = p1Text.match(/\b([0-3]\d[\/\.\-][0-1]\d[\/\.\-](?:19|20)\d{2})\b/);
    if (genericDob) dob = genericDob[1].trim();
  }

  let age = '';
  const ageMatch = p1Text.match(/(?:Age|Age\s*in\s*Years|Age\s*\(Years\))\s*[:\-\s]*(\d{1,3})/i) ||
                   p1Text.match(/\b(\d{1,3})\s*(?:Years|Yrs)\b/i);
  if (ageMatch) age = ageMatch[1].trim();

  // 5. Gender
  let gender = '';
  const genMatch = p1Text.match(/(?:Gender|Sex)\s*[:\-\s]*(Male|Female|Transgender)/i);
  if (genMatch) {
    gender = genMatch[1].trim();
  } else {
    const standaloneGen = p1Text.match(/\b(Female|Male|Transgender)\b/i);
    if (standaloneGen) gender = standaloneGen[1].trim();
  }

  // 6. Caste Category
  let casteCategory = '';
  const casteMatch = p1Text.match(/(?:Caste\s*Category|Social\s*Category|Category)\s*[:\-\s]*([A-Za-z]+)/i);
  if (casteMatch) {
    const c = casteMatch[1].trim();
    if (/^(General|OBC|SC|ST|SEBC|Open|NT|VJNT)$/i.test(c)) {
      casteCategory = c;
    } else if (!/^(Mobile|Gender|Identifier|DOB)$/i.test(c)) {
      casteCategory = c;
    }
  } else {
    const standaloneCat = p1Text.match(/\b(General|OBC|SC|ST|SEBC|Open)\b/i);
    if (standaloneCat) casteCategory = standaloneCat[1].trim();
  }

  // 7. Mobile Number
  let mobileNumber = '';
  const mobMatch = p2Text.match(/(?:Mobile|Phone|Contact)(?:\s*(?:Number|No))?\s*[:\-\s]*(?:\+?91[\s\-]*)?([6-9]\d{4}\s*\d{5}|[6-9]\d{9})\b/i) ||
                   fullText.match(/(?:Mobile|Phone|Contact)(?:\s*(?:Number|No))?\s*[:\-\s]*(?:\+?91[\s\-]*)?([6-9]\d{4}\s*\d{5}|[6-9]\d{9})\b/i);
  if (mobMatch) {
    mobileNumber = mobMatch[1].replace(/\s+/g, '').trim();
  } else {
    const genMob = p2Text.match(/\b([6-9]\d{9})\b/) || fullText.match(/\b([6-9]\d{9})\b/);
    if (genMob) mobileNumber = genMob[1].trim();
  }

  // 8. Land Details
  let totalArea = '';
  const areaMatch = (p3Text || fullText).match(/(?:Total\s*(?:Land)?\s*Area\s*(?:Owned)?|Land\s*Area)\s*(?:\([^\)]*\))?\s*[:\-\s]*([\d\.]+)/i);
  if (areaMatch) totalArea = areaMatch[1].trim();

  let landCount = '';
  const countMatch = (p3Text || fullText).match(/(?:Number\s*of\s*Lands?\s*(?:Owned)?|Total\s*Plots?)\s*[:\-\s]*(\d+)/i);
  if (countMatch) landCount = countMatch[1].trim();

  let surveyNo = '';
  const surMatch = (p3Text || fullText).match(/(?:Survey|Gat|Khasra|Dag|Plot)\s*(?:No|Number)?\s*[:\-\s]*([A-Za-z0-9\s\/\-_]+?)(?=\n|Village|Area|$)/i);
  if (surMatch) {
    surveyNo = surMatch[1].replace(/\s+/g, ' ').trim();
  } else {
    const rawSurvey = (p3Text || fullText).match(/(\d{2,4})\s*[\/]\s*(\d{1,3})/);
    if (rawSurvey) surveyNo = `${rawSurvey[1]} / ${rawSurvey[2]}`;
  }

  let village = '';
  const vMatch = (p3Text || fullText).match(/(?:Village|Town)\s*[:\-\s]*([A-Za-z\s]+?)(?=\n|Taluka|Sub|District|$)/i);
  if (vMatch) village = vMatch[1].trim();

  let subDistrict = '';
  const sdMatch = (p3Text || fullText).match(/(?:Sub\s*District|Taluka|Tahsil|Tehsil|Block)\s*[:\-\s]*([A-Za-z\s]+?)(?=\n|District|State|$)/i);
  if (sdMatch) subDistrict = sdMatch[1].trim();

  let district = '';
  const distMatch = (p3Text || fullText).match(/(?:District)\s*[:\-\s]*([A-Za-z\s]+?)(?=\n|State|Pincode|$)/i);
  if (distMatch) {
    district = correctDistrict(distMatch[1]);
  } else if (p3Text || fullText) {
    district = correctDistrict(p3Text || fullText);
  }

  let state = '';
  const stMatch = (p3Text || fullText).match(/(?:State)\s*[:\-\s]*([A-Za-z\s]+?)(?=\n|Pincode|Pin|$)/i);
  if (stMatch) {
    state = stMatch[1].trim();
  } else if (/Maharashtra/i.test(fullText)) {
    state = 'MAHARASHTRA';
  }

  const summaryParts: string[] = [];
  if (totalArea) summaryParts.push(`${totalArea} Hectare`);
  if (surveyNo) summaryParts.push(`Gat No: ${surveyNo}`);
  if (village) summaryParts.push(village);
  if (subDistrict) summaryParts.push(subDistrict);
  if (district) summaryParts.push(district);
  if (state) summaryParts.push(state);
  const landSummary = summaryParts.join(', ');

  // 9. Address
  let address = '';
  const addrMatch = (p2Text || fullText).match(/(?:Residential\s*Address|Address\s*(?:In\s*English|in\s*English)?)\s*[:\-\s]*\n*([\s\S]+?)(?=\n*\s*(?:Farmer\s*type|Occupations?|Land\s*Ownership|Crop|Bank|Declaration|Signature|Page|\f|$))/i);
  if (addrMatch) {
    const raw = addrMatch[1];
    const lines = raw.split('\n')
      .map(l => l.replace(/\|\s*Address In.*/i, '').replace(/Local|Language|Address/i, '').trim())
      .filter(l => l.length > 0 && !/^(Address|In|English)$/i.test(l) && !/[\u0900-\u097F]/.test(l));
    address = lines.join(', ').replace(/[\s,]+,/g, ',').replace(/\s*,\s*/g, ', ').trim();
  }

  onProgress?.('Complete!', 100);

  return {
    farmer_id: farmerId,
    enrollment_no: enrollmentNo,
    farmer_name: farmerName,
    identifier_name: identifierName,
    dob: dob,
    age: age,
    gender: gender,
    caste_category: casteCategory,
    mobile_number: mobileNumber,
    land_detail: {
      total_area_hectare: totalArea,
      number_of_lands: landCount,
      survey_gat_no: surveyNo,
      village,
      sub_district: subDistrict,
      district,
      state,
      summary: landSummary,
    },
    address: address,
    photo_url: photoUrl || undefined,
  };
}
