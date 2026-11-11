import { FarmerRecord } from '../types';
import { getTranslations, Language } from '../i18n';

const SAMPLE_FARMER_PORTRAIT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="382" height="482" viewBox="0 0 382 482">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d7eee1"/>
      <stop offset="100%" stop-color="#c3e4d2"/>
    </linearGradient>
    <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="382" height="482" fill="url(#bg)"/>
  <!-- Soft radial accent -->
  <circle cx="191" cy="185" r="135" fill="#b7dec8" opacity="0.55"/>
  <!-- Shoulders & Kurta -->
  <path d="M46 482 C52 365, 112 325, 191 325 C270 325, 330 365, 336 482 Z" fill="url(#shirt)" stroke="#94a3b8" stroke-width="2"/>
  <path d="M162 327 L191 388 L220 327" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
  <path d="M191 388 L191 482" stroke="#cbd5e1" stroke-width="2"/>
  <!-- Green scarf / Gamcha accent -->
  <path d="M126 342 C145 390, 152 440, 154 482 L120 482 C116 432, 110 384, 108 352 Z" fill="#15803d"/>
  <path d="M256 342 C237 390, 230 440, 228 482 L262 482 C266 432, 272 384, 274 352 Z" fill="#15803d"/>
  <!-- Neck -->
  <rect x="163" y="268" width="56" height="68" rx="22" fill="#d99b72"/>
  <path d="M163 292 Q191 312 219 292" fill="#c4835a" opacity="0.55"/>
  <!-- Ears -->
  <ellipse cx="122" cy="212" rx="13" ry="22" fill="#d99b72"/>
  <ellipse cx="260" cy="212" rx="13" ry="22" fill="#d99b72"/>
  <!-- Face -->
  <path d="M125 185 C125 130, 257 130, 257 185 C257 254, 232 292, 191 292 C150 292, 125 254, 125 185 Z" fill="#e4a980"/>
  <!-- Hair / Forehead -->
  <path d="M124 182 C122 128, 160 110, 191 110 C222 110, 260 128, 258 182 C245 152, 224 140, 191 140 C158 140, 137 152, 124 182 Z" fill="#334155"/>
  <!-- Turban / Pheta -->
  <path d="M114 166 C112 104, 152 72, 191 72 C230 72, 270 104, 268 166 C244 148, 218 140, 191 140 C164 140, 138 148, 114 166 Z" fill="#ea580c"/>
  <path d="M116 146 C148 122, 234 114, 266 142" fill="none" stroke="#c2410c" stroke-width="5"/>
  <path d="M124 124 C162 102, 226 98, 256 122" fill="none" stroke="#fb923c" stroke-width="4" opacity="0.8"/>
  <!-- Eyebrows & Eyes -->
  <path d="M148 192 Q164 185 178 191" fill="none" stroke="#1e293b" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M204 191 Q218 185 234 192" fill="none" stroke="#1e293b" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="164" cy="204" r="5.5" fill="#1e293b"/>
  <circle cx="218" cy="204" r="5.5" fill="#1e293b"/>
  <!-- Nose -->
  <path d="M191 204 L186 232 Q191 236 196 232" fill="none" stroke="#b97850" stroke-width="3.2" stroke-linecap="round"/>
  <!-- Mustache & Smile -->
  <path d="M164 246 Q178 237 191 244 Q204 237 218 246 Q205 252 191 248 Q177 252 164 246 Z" fill="#334155"/>
  <path d="M174 260 Q191 271 208 260" fill="none" stroke="#9a5b3a" stroke-width="3.5" stroke-linecap="round"/>
</svg>
`.trim();

export const SAMPLE_FARMER_PHOTO_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  SAMPLE_FARMER_PORTRAIT_SVG
)}`;

export function getSampleFarmerRecord(language: Language = 'en'): FarmerRecord {
  const sample = getTranslations(language).cardCanvas.sampleRecord;

  return {
    farmer_id: 'MH2710045892',
    enrollment_no: 'MH284910234',
    farmer_name: sample.farmer_name,
    identifier_name: sample.identifier_name,
    dob: '15/06/1982',
    age: '44',
    gender: sample.gender,
    caste_category: 'OBC',
    mobile_number: '98XXXXXX21',
    aadhaar_number: 'XXXX XXXX 4821',
    pan_card: 'ABCDE1234F',
    address: sample.address,
    photo_url: SAMPLE_FARMER_PHOTO_URL,
    land_detail: {
      khata_no: '412',
      total_area_hectare: '1.85',
      number_of_lands: '2',
      survey_gat_no: '102/4',
      village: sample.village,
      sub_district: sample.sub_district,
      district: sample.district,
      state: sample.state,
      summary: '102/4 (1.20 Ha), 105/1 (0.65 Ha)',
    },
    land_records: [
      {
        khata_no: '412',
        survey_no: '102/4',
        village: sample.village,
        owner_type: sample.owner_type_1,
        area: '1.20 Ha',
      },
      {
        khata_no: '518',
        survey_no: '105/1',
        village: sample.village,
        owner_type: sample.owner_type_2,
        area: '0.65 Ha',
      },
    ],
    bank_detail: {
      bank_name_branch: sample.bank_name_branch,
      bank_name: sample.bank_name_branch,
      account_no: 'XXXXXXXX4910',
      ifsc_code: 'SBIN0000482',
    },
  };
}

export const SAMPLE_FARMER_RECORD: FarmerRecord = getSampleFarmerRecord('en');

