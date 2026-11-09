import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FarmerRecord } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Safely initialize client without throwing even if env vars are malformed or missing
export let supabase: SupabaseClient | null = null;
try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
} catch (initErr) {
  console.warn('[Supabase] Client initialization failed (non-fatal):', initErr);
  supabase = null;
}

/**
 * 5-second timeout wrapper so blocked networks or ad-blockers never stall the app
 */
function withTimeout<T>(promiseLike: PromiseLike<T>, timeoutMs = 5000): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out after 5s')), timeoutMs)
    ),
  ]);
}

/**
 * Strips out heavy photo/image fields so only clean text/metadata is sent to database.
 */
function cleanRecordData(record: FarmerRecord) {
  try {
    const {
      photo_base64,
      photo_url,
      raw_photo_url,
      pdf_page_image_url,
      photo_bbox,
      photo_transform,
      ...clean
    } = record;
    return clean;
  } catch {
    return {};
  }
}

/**
 * Detects which fields the user modified between extraction and card generation.
 */
function getModifiedFields(original: FarmerRecord, current: FarmerRecord): string[] {
  const fields: string[] = [];

  try {
    const check = (key: keyof FarmerRecord, label: string) => {
      if ((original[key] || '').toString().trim() !== (current[key] || '').toString().trim()) {
        fields.push(label);
      }
    };

    check('farmer_id', 'farmer_id');
    check('enrollment_no', 'enrollment_no');
    check('farmer_name', 'farmer_name');
    check('identifier_name', 'identifier_name');
    check('dob', 'dob');
    check('age', 'age');
    check('gender', 'gender');
    check('caste_category', 'caste_category');
    check('mobile_number', 'mobile_number');
    check('address', 'address');
    check('pan_card', 'pan_card');

    // Bank details check
    const origBank = original.bank_detail || ({} as any);
    const currBank = current.bank_detail || ({} as any);
    const checkBank = (key: string, label: string) => {
      if ((origBank[key] || '').toString().trim() !== (currBank[key] || '').toString().trim()) {
        fields.push(`bank_${label}`);
      }
    };
    checkBank('bank_name_branch', 'bank_name');
    checkBank('account_no', 'account_no');
    checkBank('ifsc_code', 'ifsc_code');

    // Land details check
    const origLand = original.land_detail || ({} as any);
    const currLand = current.land_detail || ({} as any);

    const checkLand = (key: string, label: string) => {
      if ((origLand[key] || '').toString().trim() !== (currLand[key] || '').toString().trim()) {
        fields.push(`land_${label}`);
      }
    };

    checkLand('total_area_hectare', 'total_area_hectare');
    checkLand('number_of_lands', 'number_of_lands');
    checkLand('survey_gat_no', 'survey_gat_no');
    checkLand('village', 'village');
    checkLand('sub_district', 'sub_district');
    checkLand('district', 'district');
    checkLand('state', 'state');
  } catch (diffErr) {
    console.warn('[Supabase] Failed to compute diff (non-fatal):', diffErr);
  }

  return fields;
}

/**
 * Saves raw extracted data immediately after PDF parsing.
 * Guaranteed NEVER to throw or block the user interface.
 */
export async function saveExtractedRecord(
  record: FarmerRecord,
  sessionId: string,
  fileName?: string
): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    const cleanData = cleanRecordData(record);
    const row = {
      session_id: sessionId,
      file_name: fileName || '',
      farmer_id: record.farmer_id || '',
      enrollment_no: record.enrollment_no || '',
      farmer_name: record.farmer_name || '',
      identifier_name: record.identifier_name || '',
      dob: record.dob || '',
      age: record.age || '',
      gender: record.gender || '',
      caste_category: record.caste_category || '',
      mobile_number: record.mobile_number || '',
      address: record.address || '',
      village: record.land_detail?.village || '',
      sub_district: record.land_detail?.sub_district || '',
      district: record.land_detail?.district || '',
      state: record.land_detail?.state || '',
      total_area_hectare: record.land_detail?.total_area_hectare || '',
      survey_gat_no: record.land_detail?.survey_gat_no || '',
      number_of_lands: record.land_detail?.number_of_lands || '',
      land_summary: record.land_detail?.summary || '',
      raw_data: cleanData,
    };

    const result = await withTimeout(
      supabase.from('extracted_records').insert([row])
    );

    if (result && result.error) {
      console.warn('[Supabase] Background sync failed for extracted_records (non-fatal):', result.error.message || result.error);
    }
  } catch (err: any) {
    // Silently log warning in console - NEVER interrupt or alert the user
    console.warn('[Supabase] Background sync error for extracted_records (non-fatal):', err?.message || err);
  }
}

/**
 * Saves reviewed/edited data when user clicks "Review Changes and Generate Card".
 * Automatically detects whether any fields were edited to measure app accuracy.
 * Guaranteed NEVER to throw or block the user interface.
 */
export async function saveGeneratedRecord(
  record: FarmerRecord,
  sessionId: string,
  originalRecord?: FarmerRecord | null
): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    const cleanData = cleanRecordData(record);
    const modifiedFields = originalRecord ? getModifiedFields(originalRecord, record) : [];
    const hasCorrections = modifiedFields.length > 0;

    const row = {
      session_id: sessionId,
      farmer_id: record.farmer_id || '',
      enrollment_no: record.enrollment_no || '',
      farmer_name: record.farmer_name || '',
      identifier_name: record.identifier_name || '',
      dob: record.dob || '',
      age: record.age || '',
      gender: record.gender || '',
      caste_category: record.caste_category || '',
      mobile_number: record.mobile_number || '',
      address: record.address || '',
      village: record.land_detail?.village || '',
      sub_district: record.land_detail?.sub_district || '',
      district: record.land_detail?.district || '',
      state: record.land_detail?.state || '',
      total_area_hectare: record.land_detail?.total_area_hectare || '',
      survey_gat_no: record.land_detail?.survey_gat_no || '',
      number_of_lands: record.land_detail?.number_of_lands || '',
      land_summary: record.land_detail?.summary || '',
      has_corrections: hasCorrections,
      corrections_count: modifiedFields.length,
      modified_fields: modifiedFields,
      raw_data: cleanData,
    };

    const result = await withTimeout(
      supabase.from('generated_records').insert([row])
    );

    if (result && result.error) {
      console.warn('[Supabase] Background sync failed for generated_records (non-fatal):', result.error.message || result.error);
    }
  } catch (err: any) {
    // Silently log warning in console - NEVER interrupt or alert the user
    console.warn('[Supabase] Background sync error for generated_records (non-fatal):', err?.message || err);
  }
}
