import { FarmerRecord, createEmptyFarmerRecord } from '../types';

const CARD_DRAFT_STORAGE_KEY = 'farmer_card_studio_draft_v1';
const DISCLAIMER_SESSION_KEY = 'farmer_card_disclaimer_accepted_v1';

export interface CardDraftState {
  data: FarmerRecord;
  originalExtractedData: FarmerRecord | null;
  dataSource: 'manual' | 'pdf';
  uploadedFileName: string;
  sessionId: string;
}

export function createSessionId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createInitialCardDraft(): CardDraftState {
  return {
    data: createEmptyFarmerRecord(),
    originalExtractedData: null,
    dataSource: 'manual',
    uploadedFileName: '',
    sessionId: createSessionId(),
  };
}

export function hasFarmerRecordContent(record: FarmerRecord): boolean {
  if (
    record.farmer_id ||
    record.enrollment_no ||
    record.farmer_name ||
    record.identifier_name ||
    record.dob ||
    record.age ||
    record.gender ||
    record.caste_category ||
    record.mobile_number ||
    record.aadhaar_number ||
    record.pan_card ||
    record.address ||
    record.photo_url ||
    record.raw_photo_url
  ) {
    return true;
  }

  if (
    record.bank_detail?.bank_name_branch ||
    record.bank_detail?.bank_name ||
    record.bank_detail?.account_no ||
    record.bank_detail?.ifsc_code
  ) {
    return true;
  }

  if (record.land_records && record.land_records.length > 1) {
    return true;
  }

  if (
    record.land_records?.some(
      (row) => row.khata_no || row.survey_no || row.village || row.owner_type || row.area
    )
  ) {
    return true;
  }

  return Boolean(
    record.land_detail?.khata_no ||
      record.land_detail?.total_area_hectare ||
      record.land_detail?.survey_gat_no ||
      record.land_detail?.village ||
      record.land_detail?.sub_district ||
      record.land_detail?.district ||
      record.land_detail?.state ||
      record.land_detail?.summary
  );
}

// Automatically purge any previously cached draft data for privacy
if (typeof window !== 'undefined') {
  try {
    window.sessionStorage?.removeItem(CARD_DRAFT_STORAGE_KEY);
    window.localStorage?.removeItem(CARD_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveCardDraft(_draft: CardDraftState): void {
  // Details are kept strictly in-memory in React state (App.tsx).
  // Never stored in localStorage, sessionStorage, or browser cache for farmer privacy.
  clearCardDraft();
}

export function loadCardDraft(): CardDraftState {
  // Details are kept strictly in-memory — no local storage or cache.
  clearCardDraft();
  return createInitialCardDraft();
}

export function clearCardDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage?.removeItem(CARD_DRAFT_STORAGE_KEY);
    window.localStorage?.removeItem(CARD_DRAFT_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function loadDisclaimerAccepted(): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return false;
  try {
    return window.sessionStorage.getItem(DISCLAIMER_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveDisclaimerAccepted(accepted: boolean): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    if (accepted) {
      window.sessionStorage.setItem(DISCLAIMER_SESSION_KEY, '1');
    } else {
      window.sessionStorage.removeItem(DISCLAIMER_SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

