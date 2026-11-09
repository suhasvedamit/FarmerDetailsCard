import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { FarmerRecord } from '../types';
import { LOGO_DATA_URL } from '../assets/logoData';

let cachedLogoImg: HTMLImageElement | null = null;
async function getLogoImage(): Promise<HTMLImageElement> {
  if (cachedLogoImg) return cachedLogoImg;
  cachedLogoImg = await loadImage(LOGO_DATA_URL);
  return cachedLogoImg;
}

/**
 * High-resolution canvas dimensions matching standard CR80 ID Card aspect ratio (85.6 x 54 mm).
 */
export const CARD_WIDTH = 1050;
export const CARD_HEIGHT = 660;

/**
 * Top-Right Leaf Foliage with dew drops and water bubbles.
 */
const FOLIAGE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="320" height="220">
  <defs>
    <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#86efac"/>
      <stop offset="30%" stop-color="#22c55e"/>
      <stop offset="80%" stop-color="#15803d"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
    <linearGradient id="leafGrad2" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#a3e635"/>
      <stop offset="40%" stop-color="#4ade80"/>
      <stop offset="90%" stop-color="#16a34a"/>
    </linearGradient>
    <linearGradient id="leafGrad3" x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="#bbf7d0"/>
      <stop offset="50%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#0f5132"/>
    </linearGradient>
    <radialGradient id="dewGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="30%" stop-color="#e0f2fe" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="#38bdf8" stop-opacity="0.4"/>
      <stop offset="95%" stop-color="#0284c7" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.8"/>
    </radialGradient>
    <radialGradient id="dewGradSmall" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="#bae6fd" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.75"/>
    </radialGradient>
    <filter id="dewShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="1.5" dy="2" stdDeviation="1.5" flood-color="#064e3b" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Curving Branch -->
  <path d="M 320 0 Q 260 40 220 90 Q 180 140 170 170" fill="none" stroke="#166534" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M 260 45 Q 220 50 180 40" fill="none" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
  <path d="M 230 80 Q 200 110 150 115" fill="none" stroke="#166534" stroke-width="3" stroke-linecap="round"/>

  <!-- Leaf 1 (Top large curving leaf) -->
  <path d="M 320 10 C 270 15, 200 40, 160 30 C 200 70, 260 70, 320 35 Z" fill="url(#leafGrad1)"/>
  <path d="M 320 18 Q 230 45 160 30" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.8"/>

  <!-- Leaf 2 (Main lush curving leaf pointing downwards) -->
  <path d="M 270 40 C 230 70, 180 90, 130 110 C 160 145, 230 140, 260 90 Z" fill="url(#leafGrad2)"/>
  <path d="M 265 50 Q 200 105 130 110" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
  <path d="M 210 85 Q 225 72 238 70" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <path d="M 185 98 Q 195 86 210 82" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <path d="M 190 102 Q 180 120 170 125" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>

  <!-- Leaf 3 (Lower drooping leaf) -->
  <path d="M 220 90 C 180 120, 150 160, 155 200 C 190 180, 225 150, 235 110 Z" fill="url(#leafGrad3)"/>
  <path d="M 222 95 Q 180 150 155 200" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.8"/>

  <!-- Leaf 4 (Small side leaf) -->
  <path d="M 290 60 C 260 70, 240 100, 230 120 C 260 115, 280 95, 305 75 Z" fill="url(#leafGrad1)"/>

  <!-- Leaf 5 (Corner leaf) -->
  <path d="M 320 50 C 295 65, 280 85, 285 105 C 305 95, 318 75, 320 60 Z" fill="url(#leafGrad2)"/>

  <!-- Water droplet on Leaf 2 -->
  <g filter="url(#dewShadow)">
    <ellipse cx="185" cy="115" rx="14" ry="11" transform="rotate(-15 185 115)" fill="url(#dewGrad)"/>
    <ellipse cx="181" cy="111" rx="4.5" ry="2.5" transform="rotate(-15 181 111)" fill="#ffffff" opacity="0.95"/>
    <circle cx="189" cy="118" r="1.5" fill="#ffffff" opacity="0.7"/>
  </g>

  <!-- Water droplet on Leaf 1 -->
  <g filter="url(#dewShadow)">
    <ellipse cx="230" cy="45" rx="10" ry="7.5" transform="rotate(10 230 45)" fill="url(#dewGrad)"/>
    <ellipse cx="227" cy="43" rx="3" ry="1.8" transform="rotate(10 227 43)" fill="#ffffff" opacity="0.9"/>
  </g>

  <!-- Water droplet on Leaf 3 -->
  <g filter="url(#dewShadow)">
    <circle cx="185" cy="165" r="7" fill="url(#dewGradSmall)"/>
    <circle cx="183" cy="163" r="2.2" fill="#ffffff" opacity="0.9"/>
  </g>

  <!-- Bokeh circles & floating droplets -->
  <circle cx="140" cy="65" r="14" fill="rgba(255,255,255,0.2)" stroke="rgba(74,222,128,0.5)" stroke-width="1.5"/>
  <circle cx="136" cy="61" r="3" fill="#ffffff" opacity="0.75"/>
  <circle cx="120" cy="140" r="8.5" fill="url(#dewGrad)" filter="url(#dewShadow)"/>
  <circle cx="118" cy="138" r="2.5" fill="#ffffff" opacity="0.9"/>
  <circle cx="210" cy="180" r="10" fill="rgba(255,255,255,0.15)" stroke="rgba(163,230,53,0.5)" stroke-width="1.2"/>
  <circle cx="105" cy="100" r="6" fill="rgba(255,255,255,0.25)" stroke="rgba(74,222,128,0.4)" stroke-width="1"/>
</svg>
`;

/**
 * Bottom Landscape with rolling hills, flying birds, and green farm tractor.
 */
const LANDSCAPE_TRACTOR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1050 260" width="1050" height="260">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="40%" stop-color="#f0fdf4" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#dcfce7" stop-opacity="0.55"/>
    </linearGradient>

    <linearGradient id="hillFarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bef264"/>
      <stop offset="60%" stop-color="#86efac"/>
      <stop offset="100%" stop-color="#4ade80"/>
    </linearGradient>

    <linearGradient id="hillNearGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="40%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#16a34a"/>
    </linearGradient>

    <linearGradient id="tractorBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="50%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>

    <linearGradient id="tractorTireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <linearGradient id="tractorRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>

  <!-- Sky gradient wash -->
  <rect x="0" y="0" width="1050" height="260" fill="url(#skyGrad)"/>

  <!-- Distant Birds in flight -->
  <g fill="none" stroke="#475569" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.65">
    <path d="M 230 45 Q 235 39 240 45 Q 245 39 250 45" />
    <path d="M 258 55 Q 262 50 266 55 Q 270 50 274 55" />
    <path d="M 242 66 Q 245 62 249 66 Q 252 62 256 66" />
    <path d="M 310 50 Q 314 46 318 50 Q 322 46 326 50" />
    <path d="M 328 62 Q 332 58 335 62 Q 339 58 342 62" />
  </g>

  <!-- Distant rolling hill -->
  <path d="M 0 160 Q 250 110 550 140 T 1050 110 L 1050 260 L 0 260 Z" fill="url(#hillFarGrad)" opacity="0.75"/>

  <!-- Distant trees on ridge -->
  <g fill="#15803d" opacity="0.45">
    <circle cx="480" cy="135" r="14"/>
    <circle cx="495" cy="133" r="11"/>
    <circle cx="510" cy="136" r="13"/>
    <circle cx="720" cy="120" r="12"/>
    <circle cx="735" cy="118" r="10"/>
    <circle cx="750" cy="122" r="11"/>
  </g>

  <!-- Foreground rolling hill -->
  <path d="M 0 140 Q 180 120 400 160 Q 700 200 1050 150 L 1050 260 L 0 260 Z" fill="url(#hillNearGrad)"/>
  <path d="M 0 140 Q 180 120 400 160 Q 700 200 1050 150" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2.5"/>

  <!-- CLASSIC GREEN FARM TRACTOR (Sitting on left hill) -->
  <g id="tractor" transform="translate(85, 90)">
    <!-- Exhaust pipe -->
    <rect x="75" y="0" width="4.5" height="24" fill="#334155" rx="1.5"/>
    <path d="M 73 2 Q 78 5 83 2" stroke="#334155" stroke-width="2.5" fill="none"/>
    <circle cx="82" cy="-4" r="3.5" fill="#94a3b8" opacity="0.5"/>
    <circle cx="87" cy="-9" r="4.5" fill="#cbd5e1" opacity="0.4"/>
    <circle cx="94" cy="-14" r="5.5" fill="#e2e8f0" opacity="0.3"/>

    <!-- Steering wheel and column -->
    <line x1="42" y1="20" x2="48" y2="10" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="49" cy="8" rx="8" ry="3" transform="rotate(-25 49 8)" fill="none" stroke="#0f172a" stroke-width="2.5"/>

    <!-- Tractor Seat -->
    <path d="M 24 16 Q 28 24 36 24" fill="none" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round"/>

    <!-- Tractor Green Engine Hood -->
    <path d="M 38 22 L 88 22 Q 92 22 93 25 L 94 44 L 38 44 Z" fill="url(#tractorBodyGrad)"/>
    <path d="M 90 25 L 94 25 L 94 42 L 90 42 Z" fill="#1e293b"/>
    <line x1="91" y1="28" x2="91" y2="39" stroke="#94a3b8" stroke-width="1.5"/>
    <circle cx="92" cy="28" r="3.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>

    <line x1="48" y1="28" x2="84" y2="28" stroke="#14532d" stroke-width="2"/>
    <line x1="56" y1="34" x2="84" y2="34" stroke="#14532d" stroke-width="1.5"/>
    <line x1="62" y1="38" x2="84" y2="38" stroke="#14532d" stroke-width="1.5"/>

    <!-- Rear Fender -->
    <path d="M 8 28 Q 20 8 38 12 Q 36 24 34 32 Q 22 24 8 28 Z" fill="url(#tractorBodyGrad)"/>

    <!-- Large Rear Tire -->
    <g transform="translate(22, 40)">
      <circle cx="0" cy="0" r="26" fill="url(#tractorTireGrad)"/>
      <g stroke="#475569" stroke-width="3" stroke-linecap="round">
        <line x1="0" y1="-26" x2="0" y2="-21"/>
        <line x1="18" y1="-18" x2="15" y2="-15"/>
        <line x1="26" y1="0" x2="21" y2="0"/>
        <line x1="18" y1="18" x2="15" y2="15"/>
        <line x1="0" y1="26" x2="0" y2="21"/>
        <line x1="-18" y1="18" x2="-15" y2="15"/>
        <line x1="-26" y1="0" x2="-21" y2="0"/>
        <line x1="-18" y1="-18" x2="-15" y2="-15"/>
      </g>
      <circle cx="0" cy="0" r="15" fill="url(#tractorRimGrad)"/>
      <circle cx="0" cy="0" r="7" fill="#854d0e"/>
      <circle cx="0" cy="0" r="3.5" fill="#fef08a"/>
    </g>

    <!-- Small Front Tire -->
    <g transform="translate(86, 46)">
      <circle cx="0" cy="0" r="14" fill="url(#tractorTireGrad)"/>
      <circle cx="0" cy="0" r="8" fill="url(#tractorRimGrad)"/>
      <circle cx="0" cy="0" r="3.5" fill="#854d0e"/>
      <circle cx="0" cy="0" r="1.8" fill="#fef08a"/>
    </g>

    <line x1="68" y1="44" x2="86" y2="46" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>
`;

/**
 * Draws the shared ID Card base:
 * - Card rounded border
 * - Top Header: "MyAgriCard" logo, "माझे  किसान कार्ड" + floral diamond ornament, foliage with dew drops
 * - Bottom Background Landscape: rolling hills, tractor, birds
 * - Bottom Footer Bar: Dark green bar with disclaimer & "फार्मर आईडी"
 */
async function drawCardBase(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 1. Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const radius = 28;

  // 2. Landscape graphic at bottom
  try {
    const landscapeImg = await loadSvgImage(LANDSCAPE_TRACTOR_SVG);
    // Position landscape in bottom 250px above footer
    ctx.drawImage(landscapeImg, 0, h - 260, w, 260);
  } catch (err) {
    console.warn('Could not draw landscape SVG:', err);
  }

  // 3. Foliage graphic at top right
  try {
    const foliageImg = await loadSvgImage(FOLIAGE_SVG);
    const fw = 320;
    const fh = 220;
    ctx.drawImage(foliageImg, w - fw, 0, fw, fh);
  } catch (err) {
    console.warn('Could not draw foliage SVG:', err);
  }

  // 4. Outer Green Border
  ctx.save();
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 3;
  roundRect(ctx, 4, 4, w - 8, h - 8, radius);
  ctx.stroke();
  ctx.restore();

  // 5. Header: Logo (Top-Left)
  await drawCardLogo(ctx, 36, 16);

  // 6. Header: "माझे  किसान कार्ड" (Top-Center)
  const centerX = w / 2;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c2410c'; // Warm terracotta / rust red
  ctx.font = '700 46px "Noto Sans Devanagari", Inter, sans-serif';
  ctx.fillText('माझे  किसान कार्ड', centerX, 52);

  // Ornamental motif below "माझे  किसान कार्ड"
  drawHeaderMotif(ctx, centerX, 74);
  ctx.restore();

  // 7. Footer Bar (Dark Green Banner at Bottom)
  const footerH = 54;
  const footerY = h - footerH - 4;

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, 4, footerY, w - 8, footerH, { tl: 0, tr: 0, bl: radius - 2, br: radius - 2 });
  ctx.fillStyle = '#064e3b'; // Deep emerald forest green
  ctx.fill();

  // Left Disclaimer Text (Double / Enhanced readable font)
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 20px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('This card is only for personal use not for Govt. issue card.  ——', 36, footerY + 34);

  // Vertical Divider
  const divX = w - 265;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(divX, footerY + 10);
  ctx.lineTo(divX, footerY + footerH - 10);
  ctx.stroke();

  // Right Badge Text: "फार्मर आईडी" (Enhanced large readable font)
  ctx.fillStyle = '#a3e635'; // Vibrant bright lime
  ctx.font = '700 32px "Noto Sans Devanagari", Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('फार्मर आईडी', divX + 128, footerY + 37);
  ctx.restore();
}

/**
 * Draws the official logo emblem and "MyAgriCard" branding at top-left of the card.
 */
async function drawCardLogo(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const logoSize = 60;
  try {
    const logoImg = await getLogoImage();
    ctx.drawImage(logoImg, x, y, logoSize, logoSize);
  } catch (err) {
    console.warn('Could not draw logo image on card:', err);
  }

  // Brand Name "MyAgriCard"
  ctx.save();
  const textX = x + logoSize + 10;
  const textY = y + 42;

  // // "Agri" in dark green
  // ctx.fillStyle = '#15803d';
  // ctx.font = '800 36px Inter, -apple-system, sans-serif';
  // ctx.textAlign = 'left';
  // ctx.fillText('MyAgri', textX, textY);

  // const agriW = ctx.measureText('MyAgri').width;

  // // "Card" in warm rust orange
  // ctx.fillStyle = '#ea580c';
  // ctx.font = '800 36px Inter, -apple-system, sans-serif';
  // ctx.fillText('Card', textX + agriW, textY);
  // ctx.restore();
}

/**
 * Draws the elegant 4-point diamond flower and lines underneath the title.
 */
function drawHeaderMotif(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = '#16a34a';
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 2;

  // Center 4-pointed sparkle
  const s = 8;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.quadraticCurveTo(cx, cy, cx + s, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + s);
  ctx.quadraticCurveTo(cx, cy, cx - s, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - s);
  ctx.closePath();
  ctx.fill();

  // Center tiny core dot
  ctx.fillStyle = '#ca8a04';
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();

  // Left line and dot
  ctx.strokeStyle = '#16a34a';
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy);
  ctx.lineTo(cx - 65, cy);
  ctx.stroke();

  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(cx - 69, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // Right line and dot
  ctx.beginPath();
  ctx.moveTo(cx + 16, cy);
  ctx.lineTo(cx + 65, cy);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx + 69, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Generates FRONT SIDE ID Card Canvas.
 */
export async function generateFrontCardCanvas(record: FarmerRecord): Promise<HTMLCanvasElement> {
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

  // Shared Base Frame
  await drawCardBase(ctx, CARD_WIDTH, CARD_HEIGHT);

  // 1. Photo Frame (Left side matching template)
  const px = 36;
  const py = 125;
  const pw = 190;
  const ph = 240;
  const photoRadius = 16;

  ctx.save();
  if (record.photo_url) {
    try {
      const img = await loadImage(record.photo_url);
      ctx.beginPath();
      roundRect(ctx, px, py, pw, ph, photoRadius);
      ctx.clip();

      // Aspect cover fit
      const targetAspect = pw / ph;
      const imgAspect = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgAspect > targetAspect) {
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
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
  ctx.strokeStyle = '#94a3b8';
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

  let cy = 139;
  const rowGap = 37;
  const labelColX = 236;
  const colonColX = 490;
  const valColX = 508;

  fields.forEach((field, idx) => {
    // Label in Devanagari (Enhanced 30px font)
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 30px "Noto Sans Devanagari", Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(field.label, labelColX, cy);

    // Separator colon (Enhanced 30px font)
    ctx.fillStyle = '#64748b';
    ctx.font = '700 30px Inter, sans-serif';
    ctx.fillText(':', colonColX, cy);

    // Value (Enhanced 30px font, auto-scaled if long, NEVER cropped!)
    // Rows 0-2 (नाव, जन्म दिनांक, लिंग) are above QR code and have 495px width
    // Rows 3-7 have 325px width before QR code at x = 835
    const availableValW = idx < 3 ? 495 : 325;
    const valText = field.value !== undefined ? field.value : '--';

    ctx.fillStyle = '#1e293b';
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
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 28px "Noto Sans Devanagari", Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('पत्ता', labelColX, addrY);

  ctx.fillStyle = '#64748b';
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
  ctx.fillStyle = '#1e293b';
  addrLines.forEach((line, i) => {
    ctx.fillText(line, valColX, addrY + i * addrLineH);
  });

  // 4. Scannable QR Code (Right Side Box in Vertical Center of Card)
  const qw = 175;
  const qh = 175;
  const qx = 835;
  const qy = 230; // Positioned 30px higher for better vertical balance and spacing
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
    const qrPayload = [
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
 * Generates BACK SIDE ID Card Canvas.
 * Matches the layout from the attached PDF:
 * - Top Header: MyAgriCard, माझे  किसान कार्ड, leaves with dew drops
 * - Section 1: जमिनीचा तपशील (1 to 5 rows: Survay Number, Village, Owner Type, Area)
 * - Section 2: बँक तपशील (बँकचे नाव आणि शाखा, बचत खाता नंबर, IFSC CODE)
 * - Bottom Landscape: rolling hills, tractor, birds
 * - Bottom Footer: "This card is only for personal use not for Govt. issue card. —— | फार्मर आईडी"
 */
export async function generateBackCardCanvas(record: FarmerRecord): Promise<HTMLCanvasElement> {
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

  // Shared Base Frame
  await drawCardBase(ctx, CARD_WIDTH, CARD_HEIGHT);

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
  const s1Y = numRows <= 1 ? 154 : numRows <= 2 ? 150 : numRows <= 3 ? 146 : 142;
  const headerPillH = numRows <= 2 ? 34 : 30;
  const headerFontSize = numRows <= 2 ? 23 : 21;
  const rowHeight = numRows <= 1 ? 42 : numRows === 2 ? 38 : numRows === 3 ? 32 : numRows === 4 ? 28 : 26;
  const valFontSize = numRows <= 1 ? 26 : numRows === 2 ? 24 : numRows === 3 ? 21 : numRows === 4 ? 19 : 18;

  // Title: जमिनीचा तपशील
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 34px "Noto Sans Devanagari", Inter, sans-serif';
  ctx.fillText('जमिनीचा तपशील', centerX, s1Y);

  // Table Header (No background, clean text)
  const tableHeaderY = s1Y + 38;
  ctx.fillStyle = '#1e293b';
  ctx.font = `700 ${headerFontSize}px "Noto Sans Devanagari", Inter, sans-serif`;
  ctx.fillText('सर्वे नंबर', col1X, tableHeaderY);
  ctx.fillText('गाव', col2X, tableHeaderY);
  ctx.fillText('मालकी प्रकार', col3X, tableHeaderY);
  ctx.fillText('क्षेत्र', col4X, tableHeaderY);

  // Divider line between table header and table body
  const tableDividerY = tableHeaderY + 12;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, tableDividerY);
  ctx.lineTo(CARD_WIDTH - 70, tableDividerY);
  ctx.stroke();

  // Table Data Rows
  const startRowY = tableDividerY + (numRows <= 1 ? 32 : 24);

  landRows.forEach((row, i) => {
    const rY = startRowY + (i * rowHeight);

    // Subtle alternating striping for multi-rows
    if (numRows > 1 && i % 2 === 1) {
      ctx.fillStyle = 'rgba(240, 253, 244, 0.55)';
      roundRect(ctx, 60, rY - valFontSize + 2, CARD_WIDTH - 120, rowHeight, 4);
      ctx.fill();
    }

    ctx.fillStyle = '#047857';
    drawFittedText(ctx, row.survey_no || '--', col1X, rY, 210, valFontSize);
    drawFittedText(ctx, row.village || '--', col2X, rY, 230, valFontSize);
    drawFittedText(ctx, row.owner_type || '--', col3X, rY, 230, valFontSize);
    drawFittedText(ctx, row.area || '--', col4X, rY, 210, valFontSize);
  });

  const tableBottomY = startRowY + ((numRows - 1) * rowHeight) + (numRows <= 1 ? 16 : 10);
  const separatorY = Math.max(292, tableBottomY + 12);
  const s2Y = separatorY + 34;

  // Subtle separator line
  ctx.strokeStyle = '#e2e8f0';
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

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 34px "Noto Sans Devanagari", Inter, sans-serif';
  ctx.fillText('बँक तपशील', centerX, s2Y);

  const bankCol1X = 230;
  const bankCol2X = 525;
  const bankCol3X = 820;

  // Bank Header (No background, clean text)
  const bankHeaderY = s2Y + (numRows <= 2 ? 36 : 34);
  ctx.fillStyle = '#1e293b';
  ctx.font = `700 ${bankHeaderFontSize}px "Noto Sans Devanagari", Inter, sans-serif`;
  ctx.fillText('बँकचे नाव आणि शाखा', bankCol1X, bankHeaderY);
  ctx.fillText('बचत खाता नंबर', bankCol2X, bankHeaderY);
  ctx.fillText('IFSC CODE', bankCol3X, bankHeaderY);

  // Divider line between bank header and bank values
  const bankDividerY = bankHeaderY + 12;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, bankDividerY);
  ctx.lineTo(CARD_WIDTH - 70, bankDividerY);
  ctx.stroke();

  // Bank Values row
  const bankValY = bankDividerY + (numRows <= 2 ? 28 : 25);
  ctx.fillStyle = '#047857';

  const bankNameVal = record.bank_detail?.bank_name_branch || '--';
  const accountVal = record.bank_detail?.account_no || '--';
  const ifscVal = record.bank_detail?.ifsc_code || '--';

  drawFittedText(ctx, bankNameVal, bankCol1X, bankValY, 340, bankValFontSize);
  drawFittedText(ctx, accountVal, bankCol2X, bankValY, 280, bankValFontSize);
  drawFittedText(ctx, ifscVal, bankCol3X, bankValY, 220, bankValFontSize);
  ctx.restore();

  return canvas;
}

/**
 * Universal wrapper for single side:
 * - 'front' -> Front side canvas
 * - 'back' -> Back side canvas
 */
export async function generateCardCanvas(
  record: FarmerRecord,
  side: 'front' | 'back' = 'front'
): Promise<HTMLCanvasElement> {
  return side === 'back' ? generateBackCardCanvas(record) : generateFrontCardCanvas(record);
}

/**
 * Generates both Front and Back cards side-by-side on a single unified canvas:
 * Ideal for quick 1-click preview and combined PNG export!
 */
export async function generateBothCardsCanvas(record: FarmerRecord): Promise<HTMLCanvasElement> {
  const frontCanvas = await generateFrontCardCanvas(record);
  const backCanvas = await generateBackCardCanvas(record);

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
 * Applies a visible, tamper-resistant watermark to a card canvas for preview display.
 * Creates a new canvas clone so the original remains completely pristine for official downloads.
 */
export function addWatermarkToCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const watermarkedCanvas = document.createElement('canvas');
  watermarkedCanvas.width = w;
  watermarkedCanvas.height = h;

  const ctx = watermarkedCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  // 1. Draw original card contents
  ctx.drawImage(sourceCanvas, 0, 0);

  // 2. Draw repeating diagonal watermark ribbons
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-28 * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);

  const isBoth = w > 1500;
  const fontSize = isBoth ? 36 : 30;
  ctx.font = `800 ${fontSize}px "Noto Sans Devanagari", Inter, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const line1 = 'PREVIEW ONLY  •  नमुना प्रत  •  DO NOT COPY  •  PREVIEW ONLY';
  const line2 = 'USE DOWNLOAD BUTTON  •  माझे किसान कार्ड  •  SAMPLE ONLY';

  const stepY = isBoth ? 130 : 105;
  const stepX = isBoth ? 700 : 560;
  const startY = -h * 1.5;
  const endY = h * 2.5;
  const startX = -w * 1.5;
  const endX = w * 2.5;

  let lineIdx = 0;
  for (let y = startY; y < endY; y += stepY) {
    lineIdx++;
    const text = lineIdx % 2 === 0 ? line2 : line1;
    const isLine2 = lineIdx % 2 === 0;

    for (let x = startX; x < endX; x += stepX) {
      const offsetX = (Math.floor(y / stepY) % 2 === 0) ? 0 : stepX / 2;

      // Soft white outline for readability over dark background sections
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(text, x + offsetX + 1, y + 1);

      // Main watermark fill (semi-transparent slate/crimson tint)
      ctx.fillStyle = isLine2
        ? 'rgba(185, 28, 28, 0.22)'
        : 'rgba(30, 41, 59, 0.20)';
      ctx.fillText(text, x + offsetX, y);
    }
  }
  ctx.restore();

  // 3. Draw Security Stamp / Badge
  const drawStamp = (cx: number, cy: number, badgeW: number, badgeH: number) => {
    ctx.save();
    // Translucent dark slate badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.70)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);

    const rx = cx - badgeW / 2;
    const ry = cy - badgeH / 2;
    const radius = 16;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rx, ry, badgeW, badgeH, radius);
    } else {
      ctx.rect(rx, ry, badgeW, badgeH);
    }
    ctx.fill();
    ctx.stroke();

    // Text shadow for high contrast
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Line 1: Header
    ctx.font = '800 28px "Noto Sans Devanagari", Inter, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒 PREVIEW ONLY • नमुना प्रत', cx, cy - 22);

    // Line 2: Action prompt
    ctx.font = '700 17px Inter, -apple-system, sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText('USE DOWNLOAD BUTTONS BELOW', cx, cy + 22);

    ctx.restore();
  };

  if (isBoth) {
    drawStamp(545, h / 2, 540, 115);
    drawStamp(1625, h / 2, 540, 115);
  } else {
    drawStamp(w / 2, h / 2, 540, 115);
  }

  return watermarkedCanvas;
}

/**
 * Downloads the card as a PNG image:
 * side: 'front' | 'back' | 'both'
 */
export async function downloadCardAsPng(
  record: FarmerRecord,
  side: 'front' | 'back' | 'both' = 'front',
  filename?: string
): Promise<void> {
  let canvas: HTMLCanvasElement;
  const cleanName = (record.farmer_name || 'farmer').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

  if (side === 'both') {
    canvas = await generateBothCardsCanvas(record);
    filename = filename || `${cleanName}_id_card_both_sides.png`;
  } else if (side === 'back') {
    canvas = await generateBackCardCanvas(record);
    filename = filename || `${cleanName}_id_card_back.png`;
  } else {
    canvas = await generateFrontCardCanvas(record);
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
export async function createCardPdf(record: FarmerRecord): Promise<jsPDF> {
  const frontCanvas = await generateFrontCardCanvas(record);
  const backCanvas = await generateBackCardCanvas(record);

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
export async function createPrintSheetPdf(record: FarmerRecord): Promise<jsPDF> {
  const frontCanvas = await generateFrontCardCanvas(record);
  const backCanvas = await generateBackCardCanvas(record);

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
export async function downloadCardAsPdf(record: FarmerRecord, filename?: string): Promise<void> {
  const cleanName = (record.farmer_name || 'farmer').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  filename = filename || `${cleanName}_id_card_2sided.pdf`;
  const pdf = await createCardPdf(record);
  pdf.save(filename);
}

/**
 * Downloads the A4 printable sheet PDF.
 */
export async function downloadCardPrintSheetPdf(record: FarmerRecord, filename?: string): Promise<void> {
  const cleanName = (record.farmer_name || 'farmer').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  filename = filename || `${cleanName}_id_card_print_sheet.pdf`;
  const pdf = await createPrintSheetPdf(record);
  pdf.save(filename);
}

// ==========================================
// UTILITY HELPERS
// ==========================================

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = src;
  });
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
  });
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
  if (g === 'male' || g === 'm' || g === 'पुरुष') return 'पुरुष / Male';
  if (g === 'female' || g === 'f' || g === 'स्त्री') return 'स्त्री / Female';
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
