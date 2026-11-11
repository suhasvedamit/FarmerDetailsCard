import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { FarmerRecord } from '../types';
import { buildVerificationUrl } from './verificationUrl';
import {
  CARD_CANVAS_HEIGHT,
  CARD_CANVAS_WIDTH,
  CardSide,
  CardTemplate,
  CustomCardStyle,
  getCardTemplate,
  getCardTemplateUrl,
} from './cardTemplates';
import { drawSafeZonesOverlay } from './customDesignUtils';

export interface CardRenderOptions {
  templateOverride?: CardTemplate;
  showSafeZones?: boolean;
}

const templateImageCache = new Map<string, Promise<HTMLImageElement>>();

function getResolvedTemplate(
  templateId?: string,
  options?: CardRenderOptions
): CardTemplate | undefined {
  return options?.templateOverride || getCardTemplate(templateId);
}

function getResolvedTemplateUrl(
  templateId?: string,
  side: CardSide = 'front',
  options?: CardRenderOptions
): string | undefined {
  if (options?.templateOverride) {
    return side === 'back'
      ? options.templateOverride.backUrl || options.templateOverride.frontUrl
      : options.templateOverride.frontUrl || options.templateOverride.backUrl;
  }
  return getCardTemplateUrl(templateId, side);
}

function getCardTextPalette(customStyle?: CustomCardStyle) {
  if (customStyle?.textTheme === 'light') {
    return {
      labelColor: '#ffffff',
      colonColor: '#cbd5e1',
      valueColor: '#f1f5f9',
      photoBorderColor: '#cbd5e1',
      sectionTitleColor: '#ffffff',
      tableHeaderColor: '#e2e8f0',
      tableDividerColor: 'rgba(203, 213, 225, 0.45)',
      sectionSeparatorColor: 'rgba(226, 232, 240, 0.35)',
      tableValueColor: '#f8fafc',
    };
  }

  return {
    labelColor: '#0f172a',
    colonColor: '#64748b',
    valueColor: '#1e293b',
    photoBorderColor: '#94a3b8',
    sectionTitleColor: '#0f172a',
    tableHeaderColor: '#1e293b',
    tableDividerColor: '#cbd5e1',
    sectionSeparatorColor: '#e2e8f0',
    tableValueColor: '#0c2d19ff',
  };
}

async function getCardTemplateImage(
  templateId?: string,
  side: CardSide = 'front',
  options?: CardRenderOptions
): Promise<HTMLImageElement> {
  const imageUrl = getResolvedTemplateUrl(templateId, side, options);
  if (!imageUrl) {
    throw new Error('No card template images found in src/assets/card_template/');
  }

  const cached = templateImageCache.get(imageUrl);
  if (cached) {
    return cached;
  }

  if (templateImageCache.size >= 40) {
    const oldestKey = templateImageCache.keys().next().value;
    if (oldestKey) {
      templateImageCache.delete(oldestKey);
    }
  }

  const loadPromise = loadImage(imageUrl).catch((err) => {
    templateImageCache.delete(imageUrl);
    throw err;
  });
  templateImageCache.set(imageUrl, loadPromise);
  return loadPromise;
}

/**
 * High-resolution canvas dimensions matching standard CR80 ID Card aspect ratio (85.6 x 54 mm).
 */
export const CARD_WIDTH = CARD_CANVAS_WIDTH;
export const CARD_HEIGHT = CARD_CANVAS_HEIGHT;

/**
 * Draws the shared ID Card base using the selected template front/back image.
 */
async function drawCardBase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  templateId?: string,
  side: CardSide = 'front',
  options?: CardRenderOptions
) {
  const template = getResolvedTemplate(templateId, options);
  const customStyle = template?.customStyle;

  // 1. Clear background
  ctx.fillStyle = customStyle?.textTheme === 'light' ? '#0f172a' : '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // 2. Draw user-provided or built-in background card template for the requested side
  try {
    const templateImg = await getCardTemplateImage(templateId, side, options);
    ctx.drawImage(templateImg, 0, 0, w, h);
  } catch (err) {
    console.warn(`Could not draw card ${side} template image:`, err);
  }

  // 2b. Optional readability panel behind data fields/tables for busy custom backgrounds
  if (customStyle?.contentBackdrop === 'light' || customStyle?.contentBackdrop === 'dark') {
    const isLightPanel = customStyle.contentBackdrop === 'light';
    ctx.save();
    ctx.fillStyle = isLightPanel ? 'rgba(255, 255, 255, 0.86)' : 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = isLightPanel ? 'rgba(226, 232, 240, 0.9)' : 'rgba(51, 65, 85, 0.85)';
    ctx.lineWidth = 1.5;
    if (side === 'front') {
      roundRect(ctx, 10, 130, 1030, 472, 16);
    } else {
      roundRect(ctx, 32, 130, 986, 452, 16);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 3. Crisp outer rounded card border (unless disabled on custom template)
  if (customStyle?.borderColor !== 'none') {
    ctx.save();
    ctx.strokeStyle = customStyle?.borderColor || '#15803d';
    ctx.lineWidth = 2.5;
    roundRect(ctx, 2, 2, w - 4, h - 4, 20);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Generates FRONT SIDE ID Card Canvas.
 */
export async function generateFrontCardCanvas(
  record: FarmerRecord,
  templateId?: string,
  options?: CardRenderOptions
): Promise<HTMLCanvasElement> {
  // Wait for Google Fonts to be ready for perfect Devanagari text rendering
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch { }
  }

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context for card generation');

  const resolvedTemplate = getResolvedTemplate(templateId, options);
  const palette = getCardTextPalette(resolvedTemplate?.customStyle);

  // Shared Base Frame (Front template)
  await drawCardBase(ctx, CARD_WIDTH, CARD_HEIGHT, templateId, 'front', options);

  // 1. Photo Frame (Left side matching template)
  const px = 36;
  const py = 152;
  const pw = 191;
  const ph = 241;
  const photoRadius = 16;

  ctx.save();
  if (record.photo_url) {
    try {
      const img = await loadImage(record.photo_url);
      ctx.beginPath();
      roundRect(ctx, px, py, pw, ph, photoRadius);
      ctx.clip();

      // Detect content bounds to trim any white paper margin on all 4 sides (top, bottom, left, right)
      const bounds = detectContentBounds(img);
      const targetAspect = pw / ph;
      const contentAspect = bounds.w / bounds.h;

      let sx = bounds.x;
      let sy = bounds.y;
      let sw = bounds.w;
      let sh = bounds.h;

      if (contentAspect >= targetAspect) {
        // Content is wider than frame -> fit height, crop excess width centered
        sw = Math.round(bounds.h * targetAspect);
        sx = bounds.x + Math.round((bounds.w - sw) / 2);
        sy = bounds.y;
        sh = bounds.h;
      } else {
        // Content is narrower/taller than frame -> fit width, crop excess height anchored to bottom
        sw = bounds.w;
        sh = Math.round(bounds.w / targetAspect);
        sx = bounds.x;
        // Anchor to bottom so the shirt cleanly touches the bottom of the photo frame with ZERO white gap
        sy = bounds.y + Math.max(0, bounds.h - sh);
      }

      ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
    } catch {
      drawPhotoPlaceholder(ctx, px, py, pw, ph, photoRadius);
    }
  } else {
    drawPhotoPlaceholder(ctx, px, py, pw, ph, photoRadius);
  }
  ctx.restore();

  // Photo border
  ctx.save();
  ctx.strokeStyle = palette.photoBorderColor;
  ctx.lineWidth = 1.5;
  roundRect(ctx, px, py, pw, ph, photoRadius);
  ctx.stroke();
  ctx.restore();

  // 2. Information Fields List (Middle Section)
  // Matching the Marathi labels in the PDF:
  // नाव, जन्म दिनांक, लिंग, मोबाईल नंबर, पॅन कार्ड, PM किसान नंबर, आधार नंबर, फार्मर नंबर
  const fields = [
    { label: 'नाव', value: record.farmer_name || '--' },
    { label: 'जन्म दिनांक', value: record.dob || '--' },
    { label: 'लिंग', value: formatGender(record.gender) },
    { label: 'मोबाईल नंबर', value: record.mobile_number || '--' },
    { label: 'पॅन कार्ड', value: record.pan_card || '--' },
    { label: 'PM किसान नंबर', value: record.enrollment_no || '' },
    { label: 'आधार नंबर', value: formatAadhaar(record.aadhaar_number) },
    { label: 'फार्मर नंबर', value: record.farmer_id || '--' },
  ];

  let cy = 166;
  const rowGap = 37;
  const labelColX = 260;
  const colonColX = 490;
  const valColX = 508;

  fields.forEach((field, idx) => {
    // Label in Devanagari (Enhanced 30px font)
    ctx.fillStyle = palette.labelColor;
    ctx.font = '700 30px "Noto Sans Devanagari", Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(field.label, labelColX, cy);

    // Separator colon (Enhanced 30px font)
    ctx.fillStyle = palette.colonColor;
    ctx.font = '700 30px Inter, sans-serif';
    ctx.fillText(':', colonColX, cy);

    // Value (Enhanced 30px font, auto-scaled if long, NEVER cropped!)
    // Rows 0-2 (नाव, जन्म दिनांक, लिंग) are above QR code and have 495px width
    // Rows 3-7 have 325px width before QR code at x = 835
    const availableValW = idx < 3 ? 495 : 325;
    const valText = field.value !== undefined ? field.value : '--';

    ctx.fillStyle = palette.valueColor;
    let valFontSize = 30;
    ctx.font = `600 ${valFontSize}px Inter, "Noto Sans Devanagari", sans-serif`;

    // Scale font size down if text exceeds width so ALL text is shown without cropping
    while (valFontSize > 16 && ctx.measureText(valText).width > availableValW) {
      valFontSize -= 1;
      ctx.font = `600 ${valFontSize}px Inter, "Noto Sans Devanagari", sans-serif`;
    }

    // Draw full value without truncation
    ctx.fillText(valText, valColX, cy);

    cy += rowGap;
  });

  // 3. Address (पत्ता) (Enhanced 28px/25px font, full text, never cropped)
  const addrY = cy + 12;
  ctx.fillStyle = palette.labelColor;
  ctx.font = '700 28px "Noto Sans Devanagari", Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('पत्ता', labelColX, addrY);

  ctx.fillStyle = palette.colonColor;
  ctx.font = '700 28px Inter, sans-serif';
  ctx.fillText(':', colonColX, addrY);

  const rawAddress = record.address?.trim() || '--';
  const footerY = CARD_HEIGHT - 54 - 4; // Footer top boundary
  const maxAvailableH = footerY - addrY - 6;

  // Wide wrapping width (500px) allowing address to display in full
  const maxAddrW = 500;
  let addrFontSize = 25;
  let addrLineH = 30;
  ctx.font = `500 ${addrFontSize}px Inter, "Noto Sans Devanagari", sans-serif`;

  let addrLines = wrapTextToLines(ctx, rawAddress, maxAddrW);

  // If address has many lines, auto-adjust font size & line height so ALL lines fit above the footer
  if (addrLines.length * addrLineH > maxAvailableH) {
    addrFontSize = Math.max(16, Math.floor(maxAvailableH / addrLines.length) - 2);
    addrLineH = addrFontSize + 4;
    ctx.font = `500 ${addrFontSize}px Inter, "Noto Sans Devanagari", sans-serif`;
    addrLines = wrapTextToLines(ctx, rawAddress, maxAddrW);
  }

  // Draw ALL address lines without slicing or cropping
  ctx.fillStyle = palette.valueColor;
  addrLines.forEach((line, i) => {
    ctx.fillText(line, valColX, addrY + i * addrLineH);
  });

  // 4. Scannable QR Code (Right Side Box in Vertical Center of Card)
  const qw = 235;
  const qh = 235;
  const qx = 805;
  const qy = 180; // Positioned with fields for better vertical balance and spacing
  const qRadius = 12;

  // Outer QR container box
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  roundRect(ctx, qx, qy, qw, qh, qRadius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Generate & Draw QR code
  try {
    // Generate URL that navigates to the verification page with farmer data in param
    const qrPayload = buildVerificationUrl(record) || [
      `Name: ${record.farmer_name || '--'}`,
      `Farmer ID: ${record.farmer_id || '--'}`,
      `PM Kisan: ${record.enrollment_no || '--'}`,
      `DOB: ${record.dob || '--'}`,
      `Mobile: ${record.mobile_number || '--'}`,
      `Aadhaar: ${record.aadhaar_number || '--'}`,
      `PAN: ${record.pan_card || '--'}`,
      `Gat No: ${record.land_records?.[0]?.survey_no || record.land_detail?.survey_gat_no || '--'}`,
      `Village: ${record.land_records?.[0]?.village || record.land_detail?.village || '--'}`,
      `District: ${record.land_detail?.district || '--'}`,
    ].join('\n');

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      errorCorrectionLevel: 'M',
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, qx + 8, qy + 8, qw - 16, qh - 16);
  } catch (qrErr) {
    console.warn('QR Code generation failed:', qrErr);
  }

  if (options?.showSafeZones) {
    drawSafeZonesOverlay(ctx, CARD_WIDTH, CARD_HEIGHT, 'front');
  }

  return canvas;
}

/**
 * Draws text centered at (centerX, y), dynamically reducing font size if it exceeds maxW,
 * and gracefully truncating with an ellipsis if it still exceeds maxW.
 */
function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxW: number,
  baseFontSize: number,
  fontFamily: string = 'Inter, "Noto Sans Devanagari", sans-serif'
) {
  let size = baseFontSize;
  ctx.font = `700 ${size}px ${fontFamily}`;
  while (size > 13 && ctx.measureText(text).width > maxW) {
    size -= 1;
    ctx.font = `700 ${size}px ${fontFamily}`;
  }
  let display = text;
  if (ctx.measureText(display).width > maxW) {
    while (display.length > 2 && ctx.measureText(display + '…').width > maxW) {
      display = display.slice(0, -1);
    }
    display = display + '…';
  }
  ctx.fillText(display, centerX, y);
}

/**
 * Wraps and fits a bank name into multiple lines if long:
 * - If bank name is short and fits within maxWidth on one line, returns single line
 * - If bank name is long, wraps words and shifts text onto next line (2 balanced lines,
 *   or max 3 lines if exceptionally long)
 * - Automatically finds natural break points (e.g. after comma/hyphen or before Branch/शाखा)
 */
function wrapBankNameToLines(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number,
  baseFontSize: number,
  fontFamily: string = '"Noto Sans Devanagari", Inter, sans-serif'
): { lines: string[]; fontSize: number; lineH: number } {
  const text = (rawText || '--').trim();
  if (!text || text === '--') {
    return { lines: ['--'], fontSize: baseFontSize, lineH: baseFontSize + 6 };
  }

  // 1. If explicit newlines are present, honor them
  if (text.includes('\n')) {
    const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (rawLines.length > 0) {
      let currentSize = baseFontSize;
      ctx.font = `700 ${currentSize}px ${fontFamily}`;
      while (currentSize > 15 && rawLines.some(l => ctx.measureText(l).width > maxWidth)) {
        currentSize -= 1;
        ctx.font = `700 ${currentSize}px ${fontFamily}`;
      }
      return {
        lines: rawLines,
        fontSize: currentSize,
        lineH: currentSize + (currentSize <= 20 ? 5 : 6),
      };
    }
  }

  // 2. Check if the entire text fits on a single line at the base font size
  ctx.font = `700 ${baseFontSize}px ${fontFamily}`;
  if (ctx.measureText(text).width <= maxWidth) {
    return { lines: [text], fontSize: baseFontSize, lineH: baseFontSize + 6 };
  }

  // 3. Text is long! Wrap and shift overflowing words to next line
  // Ensure space after punctuation like commas, semicolons, or slashes if not already spaced
  const normalizedText = text.replace(/([,;/])(?=[^\s])/g, '$1 ');
  const words = normalizedText.split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    // Single unbroken word that exceeds maxWidth: scale font down
    let currentSize = baseFontSize;
    ctx.font = `700 ${currentSize}px ${fontFamily}`;
    while (currentSize > 14 && ctx.measureText(text).width > maxWidth) {
      currentSize -= 1;
      ctx.font = `700 ${currentSize}px ${fontFamily}`;
    }
    return { lines: [text], fontSize: currentSize, lineH: currentSize + 6 };
  }

  // 4. Try 2-line balanced wrap (ideal for card layout)
  // Search from baseFontSize down to 18px for the best 2-line split
  for (let s = baseFontSize; s >= 18; s--) {
    ctx.font = `700 ${s}px ${fontFamily}`;

    let bestSplit = -1;
    let minScore = Infinity;

    for (let k = 1; k < words.length; k++) {
      const l1 = words.slice(0, k).join(' ');
      const l2 = words.slice(k).join(' ');
      const w1 = ctx.measureText(l1).width;
      const w2 = ctx.measureText(l2).width;

      if (w1 <= maxWidth && w2 <= maxWidth) {
        // Natural break bonus if l1 ends with a comma/dash or l2 starts with branch/शाखा
        const endsWithPunctuation = /[,;:\-–]$/.test(l1);
        const isBranchWord = /^(?:Branch|शाखा|Br\.|Br\b|Ta\.|Dist\.)/i.test(words[k]);
        const bonus = (endsWithPunctuation ? 60 : 0) + (isBranchWord ? 80 : 0);

        const diff = Math.abs(w1 - w2);
        const score = diff - bonus;

        if (score < minScore) {
          minScore = score;
          bestSplit = k;
        }
      }
    }

    if (bestSplit !== -1) {
      const line1 = words.slice(0, bestSplit).join(' ');
      const line2 = words.slice(bestSplit).join(' ');
      return {
        lines: [line1, line2],
        fontSize: s,
        lineH: s + (s <= 20 ? 5 : 6),
      };
    }
  }

  // 5. If it cannot fit in 2 lines even at 18px, wrap into 3 lines
  let currentSize = Math.min(baseFontSize, 20);
  ctx.font = `700 ${currentSize}px ${fontFamily}`;
  let wrappedLines = wrapTextToLines(ctx, normalizedText, maxWidth);

  while (currentSize > 15 && wrappedLines.length > 3) {
    currentSize -= 1;
    ctx.font = `700 ${currentSize}px ${fontFamily}`;
    wrappedLines = wrapTextToLines(ctx, normalizedText, maxWidth);
  }

  return {
    lines: wrappedLines,
    fontSize: currentSize,
    lineH: currentSize + 5,
  };
}

/**
 * Generates BACK SIDE ID Card Canvas.
 * Matches the layout from the attached PDF:
 * - Top Header: MyAgriCard, माझे  किसान कार्ड, leaves with dew drops
 * - Section 1: जमिनीचा तपशील (1 to 5 rows: Survay Number, Village, Owner Type, Area)
 * - Section 2: बँक तपशील (बँकचे नाव आणि शाखा, बचत खाता नंबर, IFSC CODE)
 * - Bottom Landscape: rolling hills, tractor, birds
 * - Bottom Footer: "This card is only for personal use not for Govt. issue card. —— | फार्मर आईडी"
 */
export async function generateBackCardCanvas(
  record: FarmerRecord,
  templateId?: string,
  options?: CardRenderOptions
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch { }
  }

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context for card generation');

  const resolvedTemplate = getResolvedTemplate(templateId, options);
  const palette = getCardTextPalette(resolvedTemplate?.customStyle);

  // Shared Base Frame (Back template)
  await drawCardBase(ctx, CARD_WIDTH, CARD_HEIGHT, templateId, 'back', options);

  const centerX = CARD_WIDTH / 2;

  // ==========================================
  // SECTION 1: जमिनीचा तपशील (Land Details)
  // Unified Table UI for 1 to 5 records (Always in sync)
  // Columns: Survay Number, Village, Owner Type, Area
  // ==========================================
  const col1X = 165; // Survay Number (सर्वे नंबर)
  const col2X = 405; // Village (गाव)
  const col3X = 655; // Owner Type (मालकी प्रकार)
  const col4X = 895; // Area (क्षेत्र)

  const landRows = (record.land_records && record.land_records.length > 0)
    ? record.land_records.slice(0, 5)
    : [{
      survey_no: record.land_detail?.survey_gat_no || '--',
      village: record.land_detail?.village || '--',
      owner_type: '--',
      area: record.land_detail?.total_area_hectare
        ? `${record.land_detail.total_area_hectare} Ha`
        : (record.land_detail?.summary || '--'),
    }];
  const numRows = landRows.length;

  ctx.save();
  ctx.textAlign = 'center';

  // Dynamic layout metrics that keep the table UI completely unified and in sync
  const s1Y = numRows <= 1 ? 182 : numRows <= 2 ? 178 : numRows <= 3 ? 174 : 170;
  const headerPillH = numRows <= 2 ? 34 : 30;
  const headerFontSize = numRows <= 2 ? 23 : 21;
  const rowHeight = numRows <= 1 ? 42 : numRows === 2 ? 38 : numRows === 3 ? 32 : numRows === 4 ? 28 : 26;
  const valFontSize = numRows <= 1 ? 26 : numRows === 2 ? 24 : numRows === 3 ? 21 : numRows === 4 ? 19 : 18;

  // Title: जमिनीचा तपशील
  ctx.fillStyle = palette.sectionTitleColor;
  ctx.font = '700 34px "Noto Sans Devanagari", Inter, sans-serif';
  ctx.fillText('जमिनीचा तपशील', centerX, s1Y);

  // Table Header (No background, clean text)
  const tableHeaderY = s1Y + 38;
  ctx.fillStyle = palette.tableHeaderColor;
  ctx.font = `700 ${headerFontSize}px "Noto Sans Devanagari", Inter, sans-serif`;
  ctx.fillText('सर्वे नंबर', col1X, tableHeaderY);
  ctx.fillText('गाव', col2X, tableHeaderY);
  ctx.fillText('मालकी प्रकार', col3X, tableHeaderY);
  ctx.fillText('क्षेत्र', col4X, tableHeaderY);

  // Divider line between table header and table body
  const tableDividerY = tableHeaderY + 12;
  ctx.strokeStyle = palette.tableDividerColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, tableDividerY);
  ctx.lineTo(CARD_WIDTH - 70, tableDividerY);
  ctx.stroke();

  // Table Data Rows
  const startRowY = tableDividerY + (numRows <= 1 ? 32 : 24);

  landRows.forEach((row, i) => {
    const rY = startRowY + (i * rowHeight);

    // Table body text
    ctx.fillStyle = palette.tableValueColor;
    drawFittedText(ctx, row.survey_no || '--', col1X, rY, 210, valFontSize);
    drawFittedText(ctx, row.village || '--', col2X, rY, 230, valFontSize);
    drawFittedText(ctx, row.owner_type || '--', col3X, rY, 230, valFontSize);
    drawFittedText(ctx, row.area || '--', col4X, rY, 210, valFontSize);
  });

  const tableBottomY = startRowY + ((numRows - 1) * rowHeight) + (numRows <= 1 ? 16 : 10);
  const separatorY = Math.max(320, tableBottomY + 12);
  const s2Y = separatorY + 34;

  // Subtle separator line
  ctx.strokeStyle = palette.sectionSeparatorColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, separatorY);
  ctx.lineTo(CARD_WIDTH - 80, separatorY);
  ctx.stroke();

  // ==========================================
  // SECTION 2: बँक तपशील (Bank Details)
  // Same unified table styling as Land Details
  // ==========================================
  const bankHeaderFontSize = numRows <= 2 ? 24 : 22;
  const bankValFontSize = numRows <= 2 ? 26 : 24;

  ctx.fillStyle = palette.sectionTitleColor;
  ctx.font = '700 34px "Noto Sans Devanagari", Inter, sans-serif';
  ctx.fillText('बँक तपशील', centerX, s2Y);

  const bankCol1X = 230;
  const bankCol2X = 525;
  const bankCol3X = 820;

  // Bank Header (No background, clean text)
  const bankHeaderY = s2Y + (numRows <= 2 ? 36 : 34);
  ctx.fillStyle = palette.tableHeaderColor;
  ctx.font = `700 ${bankHeaderFontSize}px "Noto Sans Devanagari", Inter, sans-serif`;
  ctx.fillText('बँकचे नाव आणि शाखा', bankCol1X, bankHeaderY);
  ctx.fillText('बचत खाता नंबर', bankCol2X, bankHeaderY);
  ctx.fillText('IFSC CODE', bankCol3X, bankHeaderY);

  // Divider line between bank header and bank values
  const bankDividerY = bankHeaderY + 12;
  ctx.strokeStyle = palette.tableDividerColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, bankDividerY);
  ctx.lineTo(CARD_WIDTH - 70, bankDividerY);
  ctx.stroke();

  // Bank Values row
  const bankValY = bankDividerY + (numRows <= 2 ? 28 : 25);
  ctx.fillStyle = palette.tableValueColor;

  const bankNameVal = record.bank_detail?.bank_name_branch || '--';
  const accountVal = record.bank_detail?.account_no || '--';
  const ifscVal = record.bank_detail?.ifsc_code || '--';

  // Bank name wrapping: if bank name is long, wrap and shift text onto next line
  const wrappedBank = wrapBankNameToLines(ctx, bankNameVal, 330, bankValFontSize);
  wrappedBank.lines.forEach((line, idx) => {
    drawFittedText(
      ctx,
      line,
      bankCol1X,
      bankValY + idx * wrappedBank.lineH,
      330,
      wrappedBank.fontSize,
      '"Noto Sans Devanagari", Inter, sans-serif'
    );
  });

  drawFittedText(ctx, accountVal, bankCol2X, bankValY, 260, bankValFontSize);
  drawFittedText(ctx, ifscVal, bankCol3X, bankValY, 220, bankValFontSize);
  ctx.restore();

  if (options?.showSafeZones) {
    drawSafeZonesOverlay(ctx, CARD_WIDTH, CARD_HEIGHT, 'back');
  }

  return canvas;
}

/**
 * Universal wrapper for single side:
 * - 'front' -> Front side canvas
 * - 'back' -> Back side canvas
 */
export async function generateCardCanvas(
  record: FarmerRecord,
  side: 'front' | 'back' = 'front',
  templateId?: string,
  options?: CardRenderOptions
): Promise<HTMLCanvasElement> {
  return side === 'back'
    ? generateBackCardCanvas(record, templateId, options)
    : generateFrontCardCanvas(record, templateId, options);
}

/**
 * Combines pre-rendered Front and Back card canvases side-by-side on a unified canvas.
 */
export function combineCardCanvases(
  frontCanvas: HTMLCanvasElement,
  backCanvas: HTMLCanvasElement
): HTMLCanvasElement {
  const gap = 30;
  const padding = 20;
  const totalW = frontCanvas.width * 2 + gap + padding * 2;
  const totalH = frontCanvas.height + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return frontCanvas;

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, totalW, totalH);

  // Draw Front Side
  ctx.drawImage(frontCanvas, padding, padding);

  // Draw Back Side
  ctx.drawImage(backCanvas, padding + frontCanvas.width + gap, padding);

  return canvas;
}

/**
 * Generates both Front and Back cards side-by-side on a single unified canvas:
 * Ideal for quick 1-click preview and combined PNG export!
 */
export async function generateBothCardsCanvas(
  record: FarmerRecord,
  templateId?: string
): Promise<HTMLCanvasElement> {
  const [frontCanvas, backCanvas] = await Promise.all([
    generateFrontCardCanvas(record, templateId),
    generateBackCardCanvas(record, templateId),
  ]);

  return combineCardCanvases(frontCanvas, backCanvas);
}

/**
 * Downloads the card as a PNG image:
 * side: 'front' | 'back' | 'both'
 */
export async function downloadCardAsPng(
  record: FarmerRecord,
  side: 'front' | 'back' | 'both' = 'front',
  filename?: string,
  templateId?: string
): Promise<void> {
  let canvas: HTMLCanvasElement;
  const cleanName = (record.farmer_name || 'farmer').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

  if (side === 'both') {
    canvas = await generateBothCardsCanvas(record, templateId);
    filename = filename || `${cleanName}_id_card_both_sides.png`;
  } else if (side === 'back') {
    canvas = await generateBackCardCanvas(record, templateId);
    filename = filename || `${cleanName}_id_card_back.png`;
  } else {
    canvas = await generateFrontCardCanvas(record, templateId);
    filename = filename || `${cleanName}_id_card_front.png`;
  }

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Creates a standard 2-page duplex PDF in CR80 card size (85.6 mm x 54 mm):
 * - Page 1: Front Side
 * - Page 2: Back Side
 */
export async function createCardPdf(record: FarmerRecord, templateId?: string): Promise<jsPDF> {
  const [frontCanvas, backCanvas] = await Promise.all([
    generateFrontCardCanvas(record, templateId),
    generateBackCardCanvas(record, templateId),
  ]);

  const frontData = frontCanvas.toDataURL('image/png', 1.0);
  const backData = backCanvas.toDataURL('image/png', 1.0);

  // Standard CR80 landscape card size in mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54],
  });

  // Page 1: Front Side
  pdf.addImage(frontData, 'PNG', 0, 0, 85.6, 54);

  // Page 2: Back Side
  pdf.addPage([85.6, 54], 'landscape');
  pdf.addImage(backData, 'PNG', 0, 0, 85.6, 54);

  return pdf;
}

/**
 * Generates an A4 Printable Sheet PDF with Front and Back side-by-side with cut guidelines.
 * Perfect for standard desktop paper and PVC printer sheets.
 */
export async function createPrintSheetPdf(record: FarmerRecord, templateId?: string): Promise<jsPDF> {
  const [frontCanvas, backCanvas] = await Promise.all([
    generateFrontCardCanvas(record, templateId),
    generateBackCardCanvas(record, templateId),
  ]);

  const frontData = frontCanvas.toDataURL('image/png', 1.0);
  const backData = backCanvas.toDataURL('image/png', 1.0);

  // Standard A4 portrait (210 x 297 mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardW = 85.6;
  const cardH = 54;
  const startX = (210 - cardW * 2 - 10) / 2; // Center horizontally
  const startY = 40;

  // Header title on A4 sheet
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(21, 128, 61);
  pdf.text('MyAgriCard - Farmer ID Card Print Sheet', 105, 22, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Farmer: ${record.farmer_name || '--'}  |  ID: ${record.farmer_id || '--'}`, 105, 29, { align: 'center' });

  // Draw Front Card
  pdf.addImage(frontData, 'PNG', startX, startY, cardW, cardH);
  pdf.setFontSize(9);
  pdf.text('FRONT SIDE', startX + cardW / 2, startY + cardH + 6, { align: 'center' });

  // Draw Back Card
  const backX = startX + cardW + 10;
  pdf.addImage(backData, 'PNG', backX, startY, cardW, cardH);
  pdf.text('BACK SIDE', backX + cardW / 2, startY + cardH + 6, { align: 'center' });

  // Fold / Cut instruction
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Cut along the card borders and fold/laminate together.', 105, startY + cardH + 16, { align: 'center' });

  return pdf;
}

/**
 * Downloads the 2-page duplex PDF (Page 1 = Front, Page 2 = Back).
 */
export async function downloadCardAsPdf(
  record: FarmerRecord,
  filename?: string,
  templateId?: string
): Promise<void> {
  const cleanName = (record.farmer_name || 'farmer').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  filename = filename || `${cleanName}_id_card_2sided.pdf`;
  const pdf = await createCardPdf(record, templateId);
  pdf.save(filename);
}

/**
 * Downloads the A4 printable sheet PDF.
 */
export async function downloadCardPrintSheetPdf(
  record: FarmerRecord,
  filename?: string,
  templateId?: string
): Promise<void> {
  const cleanName = (record.farmer_name || 'farmer').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  filename = filename || `${cleanName}_id_card_print_sheet.pdf`;
  const pdf = await createPrintSheetPdf(record, templateId);
  pdf.save(filename);
}

// ==========================================
// UTILITY HELPERS
// ==========================================

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for remote http(s) URLs (e.g. remote photos)
    // to avoid CORS issues on local assets or data URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = src;
  });
}

interface ContentBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Accurately detects the active photo content boundaries by trimming any blank,
 * transparent, or white scanned paper margins on all 4 sides (top, bottom, left, right),
 * and cleanly isolates the subject from any detached dark table lines or signatures below a blank gap.
 */
function detectContentBounds(img: HTMLImageElement): ContentBounds {
  const naturalW = img.naturalWidth || img.width || 100;
  const naturalH = img.naturalHeight || img.height || 100;

  try {
    const sw = 160;
    const sh = Math.max(1, Math.round((naturalH / naturalW) * sw));

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { x: 0, y: 0, w: naturalW, h: naturalH };

    ctx.drawImage(img, 0, 0, sw, sh);
    const imgData = ctx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    // Helper: is a pixel blank/white/transparent paper background?
    const isBlank = (x: number, y: number) => {
      const idx = (y * sw + x) * 4;
      const a = data[idx + 3];
      if (a < 35) return true;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const gray = (r * 299 + g * 587 + b * 114) / 1000;
      return gray >= 235;
    };

    const centerX = Math.floor(sw / 2);
    const sampleW = Math.max(8, Math.floor(sw * 0.15));
    const cx1 = Math.max(0, centerX - sampleW);
    const cx2 = Math.min(sw - 1, centerX + sampleW);
    const cSpan = cx2 - cx1 + 1;

    // 1. Locate subject top along central axis
    let topRow = 0;
    for (let y = 0; y < Math.floor(sh * 0.40); y++) {
      let count = 0;
      for (let x = cx1; x <= cx2; x++) {
        if (!isBlank(x, y)) count++;
      }
      if (count >= Math.max(2, Math.floor(cSpan * 0.10))) {
        topRow = y;
        break;
      }
    }

    // 2. Locate subject bottom along central axis
    // If a blank gap (>= 4 rows) appears below the shirt, stop immediately
    // so any detached table borders or dark lines below the gap are cleanly excluded!
    let bottomRow = sh - 1;
    let lastContentY = topRow + 30;
    let blankRowStreak = 0;
    for (let y = topRow + 30; y < sh; y++) {
      let count = 0;
      for (let x = cx1; x <= cx2; x++) {
        if (!isBlank(x, y)) count++;
      }
      if (count < Math.max(2, Math.floor(cSpan * 0.05))) {
        blankRowStreak++;
        if (blankRowStreak >= 4 && lastContentY > topRow + 35) {
          bottomRow = lastContentY;
          break;
        }
      } else {
        blankRowStreak = 0;
        lastContentY = y;
      }
    }
    if (blankRowStreak < 4) {
      bottomRow = lastContentY;
    }

    // 3. Scan outwards horizontally from centerX strictly within [yStart..yEnd]
    const yStart = Math.min(bottomRow, topRow + 10);
    const yEnd = Math.max(topRow, bottomRow - 10);
    const vSpan = Math.max(1, yEnd - yStart + 1);

    // Left edge: scan leftwards from centerX
    let leftCol = 0;
    let blankColStreak = 0;
    let lastGoodX = centerX;
    for (let x = centerX; x >= 0; x--) {
      let count = 0;
      for (let y = yStart; y <= yEnd; y++) {
        if (!isBlank(x, y)) count++;
      }
      if (count < Math.max(2, Math.floor(vSpan * 0.10))) {
        blankColStreak++;
        if (blankColStreak >= 3) {
          leftCol = lastGoodX;
          break;
        }
      } else {
        blankColStreak = 0;
        lastGoodX = x;
      }
    }
    if (blankColStreak < 3) leftCol = lastGoodX;

    // Right edge: scan rightwards from centerX
    let rightCol = sw - 1;
    blankColStreak = 0;
    lastGoodX = centerX;
    for (let x = centerX; x < sw; x++) {
      let count = 0;
      for (let y = yStart; y <= yEnd; y++) {
        if (!isBlank(x, y)) count++;
      }
      if (count < Math.max(2, Math.floor(vSpan * 0.10))) {
        blankColStreak++;
        if (blankColStreak >= 3) {
          rightCol = lastGoodX;
          break;
        }
      } else {
        blankColStreak = 0;
        lastGoodX = x;
      }
    }
    if (blankColStreak < 3) rightCol = lastGoodX;

    const scaleX = naturalW / sw;
    const scaleY = naturalH / sh;

    const cropX = Math.max(0, Math.round(leftCol * scaleX));
    const cropY = Math.max(0, Math.round(topRow * scaleY));
    const cropW = Math.min(naturalW - cropX, Math.round((rightCol - leftCol + 1) * scaleX));
    const cropH = Math.min(naturalH - cropY, Math.round((bottomRow - topRow + 1) * scaleY));

    // Safety fallback: if detected box is unreasonably small, fallback to full image
    if (cropW < naturalW * 0.4 || cropH < naturalH * 0.4) {
      return { x: 0, y: 0, w: naturalW, h: naturalH };
    }

    return { x: cropX, y: cropY, w: cropW, h: cropH };
  } catch {
    return { x: 0, y: 0, w: naturalW, h: naturalH };
  }
}

function drawPhotoPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, radius);
  // Cornflower / light blue background matching the PDF template
  ctx.fillStyle = '#5b9bd5';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 36px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Photo', x + w / 2, y + h / 2 + 12);
  ctx.restore();
}

function formatGender(gender?: string): string {
  if (!gender) return '--';
  const g = gender.trim().toLowerCase();
  if (g === 'male' || g === 'm' || g === 'पुरुष') return 'Male';
  if (g === 'female' || g === 'f' || g === 'स्त्री') return 'Female';
  return gender;
}

function formatAadhaar(aadhaar?: string): string {
  if (!aadhaar) return '--';
  const digits = aadhaar.replace(/\s+/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }
  return aadhaar;
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (!text) return '--';
  if (ctx.measureText(text).width <= maxW) return text;

  let truncated = text;
  while (truncated.length > 3 && ctx.measureText(truncated + '...').width > maxW) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
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
