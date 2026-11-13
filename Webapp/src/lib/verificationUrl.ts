import { FarmerRecord } from '../types';

export interface FarmerVerificationData {
  farmer_id: string;
  enrollment_no: string; // PM Kisan Number
  farmer_name: string;
  identifier_name?: string;
  dob?: string;
  age?: string;
  gender?: string;
  caste_category?: string;
  mobile_number?: string;
  aadhaar_number?: string;
  pan_card?: string;
  survey_no?: string;
  khata_no?: string;
  village?: string;
  sub_district?: string;
  district?: string;
  state?: string;
  total_area?: string;
  address?: string;
  bank_name?: string;
  account_no?: string;
  ifsc_code?: string;
  photo_url?: string;
}

// Compact key mappings to minimize URL length for optimal QR code scannability
interface CompactFarmerPayload {
  id?: string;    // farmer_id
  name?: string;  // farmer_name
  pm?: string;    // enrollment_no (PM Kisan)
  dob?: string;   // dob
  age?: string;   // age
  gen?: string;   // gender
  cst?: string;   // caste_category
  mob?: string;   // mobile_number
  adh?: string;   // aadhaar_number
  pan?: string;   // pan_card
  gat?: string;   // survey_no
  kht?: string;   // khata_no
  vil?: string;   // village
  tal?: string;   // sub_district / taluka
  dist?: string;  // district
  st?: string;    // state
  area?: string;  // total_area
  addr?: string;  // address
  bank?: string;  // bank_name
  ac?: string;    // account_no
  ifsc?: string;  // ifsc_code
  photo?: string; // photo_url (if hosted http/https URL)
}

/**
 * Encodes a JavaScript object into a URL-safe Base64 string supporting full UTF-8 Unicode
 */
export function encodeDataParam(obj: any): string {
  try {
    const jsonStr = JSON.stringify(obj);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to encode data param:', err);
    return '';
  }
}

/**
 * Decodes a URL-safe Base64 string back into an object supporting full UTF-8 Unicode
 */
export function decodeDataParam<T = any>(param: string): T | null {
  try {
    let base64 = param.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr) as T;
  } catch {
    // Fallback: try direct JSON URI decode if not base64
    try {
      return JSON.parse(decodeURIComponent(param)) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Converts a FarmerRecord into a compact verification payload
 */
export function createVerificationPayload(record: FarmerRecord): CompactFarmerPayload {
  const p: CompactFarmerPayload = {};

  if (record.farmer_id) p.id = record.farmer_id.trim();
  if (record.farmer_name) p.name = record.farmer_name.trim();
  if (record.enrollment_no) p.pm = record.enrollment_no.trim();
  if (record.dob) p.dob = record.dob.trim();
  if (record.age) p.age = record.age.trim();
  if (record.gender) p.gen = record.gender.trim();
  if (record.caste_category) p.cst = record.caste_category.trim();
  if (record.mobile_number) p.mob = record.mobile_number.trim();
  if (record.aadhaar_number) p.adh = record.aadhaar_number.trim();
  if (record.pan_card) p.pan = record.pan_card.trim();

  // Land info
  const surveyNo = record.land_records?.[0]?.survey_no || record.land_detail?.survey_gat_no;
  if (surveyNo) p.gat = surveyNo.trim();

  const khataNo = record.land_records?.[0]?.khata_no || record.land_detail?.khata_no;
  if (khataNo) p.kht = khataNo.trim();

  const village = record.land_records?.[0]?.village || record.land_detail?.village;
  if (village) p.vil = village.trim();

  if (record.land_detail?.sub_district) p.tal = record.land_detail.sub_district.trim();
  if (record.land_detail?.district) p.dist = record.land_detail.district.trim();
  if (record.land_detail?.state) p.st = record.land_detail.state.trim();
  if (record.land_detail?.total_area_hectare) p.area = record.land_detail.total_area_hectare.trim();

  // Address
  if (record.address) p.addr = record.address.trim();

  // Bank details
  const bankName = record.bank_detail?.bank_name_branch || record.bank_detail?.bank_name;
  if (bankName) p.bank = bankName.trim();
  if (record.bank_detail?.account_no) p.ac = record.bank_detail.account_no.trim();
  if (record.bank_detail?.ifsc_code) p.ifsc = record.bank_detail.ifsc_code.trim();

  // If photo_url is a hosted web link (http/https), include it; do not include base64
  if (record.photo_url && record.photo_url.startsWith('http')) {
    p.photo = record.photo_url;
  }

  return p;
}

/**
 * Converts a compact payload into standard FarmerVerificationData
 */
export function compactToVerificationData(c: CompactFarmerPayload): FarmerVerificationData {
  return {
    farmer_id: c.id || '',
    farmer_name: c.name || '',
    enrollment_no: c.pm || '',
    dob: c.dob || '',
    age: c.age || '',
    gender: c.gen || '',
    caste_category: c.cst || '',
    mobile_number: c.mob || '',
    aadhaar_number: c.adh || '',
    pan_card: c.pan || '',
    survey_no: c.gat || '',
    khata_no: c.kht || '',
    village: c.vil || '',
    sub_district: c.tal || '',
    district: c.dist || '',
    state: c.st || '',
    total_area: c.area || '',
    address: c.addr || '',
    bank_name: c.bank || '',
    account_no: c.ac || '',
    ifsc_code: c.ifsc || '',
    photo_url: c.photo || '',
  };
}

/**
 * Returns the base verification URL for the current application
 */
export function getBaseVerificationUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/verify`;
  }
  return 'https://cardstudio.vedamit.com/verify';
}

/**
 * Builds the complete Verification URL containing the farmer data in query param.
 * When scanned by any smartphone camera QR scanner, it opens this exact link.
 */
export function buildVerificationUrl(record: FarmerRecord): string {
  const base = getBaseVerificationUrl();
  const payload = createVerificationPayload(record);
  const encoded = encodeDataParam(payload);

  if (!base) return '';

  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}page=verify&data=${encoded}`;
}

/**
 * Checks if the current page was opened as a verification page
 */
export function isVerificationMode(): boolean {
  if (typeof window === 'undefined') return false;

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;

  return (
    searchParams.get('page') === 'verify' ||
    searchParams.has('verify') ||
    searchParams.has('data') ||
    searchParams.has('farmer_id') ||
    searchParams.has('id') ||
    hash.includes('verify')
  );
}

/**
 * Extracts and decodes farmer data from the current URL params or hash
 */
export function extractVerificationDataFromUrl(): FarmerVerificationData | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);

  // Check hash params as well in case hash router or fragment is used
  let hashParams: URLSearchParams | null = null;
  if (window.location.hash.includes('?')) {
    hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
  }

  const getParam = (key: string): string | null => {
    return urlParams.get(key) || (hashParams ? hashParams.get(key) : null);
  };

  const dataParam = getParam('data');

  let result: Partial<FarmerVerificationData> = {};

  if (dataParam) {
    const compact = decodeDataParam<CompactFarmerPayload>(dataParam);
    if (compact) {
      result = compactToVerificationData(compact);
    }
  }

  // Also allow fallback / overrides from individual query parameters
  const id = getParam('id') || getParam('farmer_id');
  const name = getParam('name') || getParam('farmer_name');
  const pm = getParam('pm') || getParam('pm_kisan') || getParam('enrollment_no');
  const dob = getParam('dob');
  const age = getParam('age');
  const gender = getParam('gender') || getParam('gen');
  const caste = getParam('caste') || getParam('caste_category');
  const mobile = getParam('mobile') || getParam('mobile_number') || getParam('mob');
  const aadhaar = getParam('aadhaar') || getParam('aadhaar_number') || getParam('adh');
  const pan = getParam('pan') || getParam('pan_card');
  const survey = getParam('survey_no') || getParam('gat') || getParam('gat_no');
  const khata = getParam('khata_no') || getParam('khata') || getParam('kht');
  const village = getParam('village') || getParam('vil');
  const subDistrict = getParam('sub_district') || getParam('taluka') || getParam('tal');
  const district = getParam('district') || getParam('dist');
  const state = getParam('state') || getParam('st');
  const totalArea = getParam('total_area') || getParam('area');
  const address = getParam('address') || getParam('addr');
  const bankName = getParam('bank') || getParam('bank_name');
  const accountNo = getParam('account_no') || getParam('ac');
  const ifsc = getParam('ifsc') || getParam('ifsc_code');
  const photo = getParam('photo') || getParam('photo_url');

  if (id) result.farmer_id = id;
  if (name) result.farmer_name = name;
  if (pm) result.enrollment_no = pm;
  if (dob) result.dob = dob;
  if (age) result.age = age;
  if (gender) result.gender = gender;
  if (caste) result.caste_category = caste;
  if (mobile) result.mobile_number = mobile;
  if (aadhaar) result.aadhaar_number = aadhaar;
  if (pan) result.pan_card = pan;
  if (survey) result.survey_no = survey;
  if (khata) result.khata_no = khata;
  if (village) result.village = village;
  if (subDistrict) result.sub_district = subDistrict;
  if (district) result.district = district;
  if (state) result.state = state;
  if (totalArea) result.total_area = totalArea;
  if (address) result.address = address;
  if (bankName) result.bank_name = bankName;
  if (accountNo) result.account_no = accountNo;
  if (ifsc) result.ifsc_code = ifsc;
  if (photo) result.photo_url = photo;

  // If there's at least one identifying field, return it
  if (result.farmer_id || result.farmer_name || result.enrollment_no || result.mobile_number) {
    return {
      farmer_id: result.farmer_id || '',
      enrollment_no: result.enrollment_no || '',
      farmer_name: result.farmer_name || '',
      identifier_name: result.identifier_name || '',
      dob: result.dob || '',
      age: result.age || '',
      gender: result.gender || '',
      caste_category: result.caste_category || '',
      mobile_number: result.mobile_number || '',
      aadhaar_number: result.aadhaar_number || '',
      pan_card: result.pan_card || '',
      survey_no: result.survey_no || '',
      khata_no: result.khata_no || '',
      village: result.village || '',
      sub_district: result.sub_district || '',
      district: result.district || '',
      state: result.state || '',
      total_area: result.total_area || '',
      address: result.address || '',
      bank_name: result.bank_name || '',
      account_no: result.account_no || '',
      ifsc_code: result.ifsc_code || '',
      photo_url: result.photo_url || '',
    };
  }

  return null;
}

