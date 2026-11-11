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

function stripHeavyFields(
  record: FarmerRecord,
  level: 'pdf_only' | 'all_raw' | 'all_images'
): FarmerRecord {
  const next: FarmerRecord = { ...record };
  delete next.pdf_page_image_url;
  if (level === 'all_raw' || level === 'all_images') {
    delete next.raw_photo_url;
  }
  if (level === 'all_images') {
    delete next.photo_url;
    delete next.photo_base64;
  }
  return next;
}

export function saveCardDraft(draft: CardDraftState): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;

  // Strip heavy PDF page bitmap from originalExtractedData since it's only used for diffing
  const sanitizedOriginal = draft.originalExtractedData
    ? stripHeavyFields(draft.originalExtractedData, 'all_images')
    : null;

  const tryPersist = (dataCopy: FarmerRecord): boolean => {
    try {
      const payload: CardDraftState = {
        ...draft,
        data: dataCopy,
        originalExtractedData: sanitizedOriginal,
      };
      window.sessionStorage.setItem(CARD_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  };

  if (tryPersist(draft.data)) return;
  if (tryPersist(stripHeavyFields(draft.data, 'pdf_only'))) return;
  if (tryPersist(stripHeavyFields(draft.data, 'all_raw'))) return;
  tryPersist(stripHeavyFields(draft.data, 'all_images'));
}

export function loadCardDraft(): CardDraftState {
  const fallback = createInitialCardDraft();
  if (typeof window === 'undefined' || !window.sessionStorage) return fallback;

  try {
    const raw = window.sessionStorage.getItem(CARD_DRAFT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<CardDraftState>;
    if (!parsed || !parsed.data) return fallback;

    const empty = createEmptyFarmerRecord();
    return {
      data: {
        ...empty,
        ...parsed.data,
        land_detail: {
          ...empty.land_detail,
          ...(parsed.data.land_detail || {}),
        },
        bank_detail: {
          ...empty.bank_detail,
          ...(parsed.data.bank_detail || {}),
        },
        land_records:
          parsed.data.land_records && parsed.data.land_records.length > 0
            ? parsed.data.land_records
            : empty.land_records,
      },
      originalExtractedData: parsed.originalExtractedData || null,
      dataSource: parsed.dataSource === 'pdf' ? 'pdf' : 'manual',
      uploadedFileName: parsed.uploadedFileName || '',
      sessionId: parsed.sessionId || createSessionId(),
    };
  } catch {
    return fallback;
  }
}

export function clearCardDraft(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(CARD_DRAFT_STORAGE_KEY);
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

