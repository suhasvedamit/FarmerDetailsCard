import { FarmerRecord, LandRow } from '../types';
import { Translations } from '../i18n/types';

export interface EmptyFormField {
  key: string;
  label: string;
  section: 'front' | 'land' | 'bank' | 'photo';
  sectionName: string;
}

/**
 * Checks whether any field in the farmer form is empty.
 * Returns true immediately on the first empty field encountered.
 */
export function hasEmptyFormFields(data: FarmerRecord): boolean {
  if (!data.farmer_name || !data.farmer_name.trim()) return true;
  if (!data.farmer_id || !data.farmer_id.trim()) return true;
  if (!data.dob || !data.dob.trim()) return true;
  if (!data.gender || !data.gender.trim()) return true;
  if (!data.mobile_number || !data.mobile_number.trim()) return true;
  if (!data.pan_card || !data.pan_card.trim()) return true;
  if (!data.enrollment_no || !data.enrollment_no.trim()) return true;
  if (!data.aadhaar_number || !data.aadhaar_number.trim()) return true;
  if (!data.address || !data.address.trim()) return true;
  if (!data.photo_url || !data.photo_url.trim()) return true;

  const currentLandRows: LandRow[] =
    data.land_records && data.land_records.length > 0
      ? data.land_records
      : [
          {
            khata_no: data.land_detail?.khata_no || '',
            survey_no: data.land_detail?.survey_gat_no || '',
            village: data.land_detail?.village || '',
            owner_type: '',
            area: data.land_detail?.total_area_hectare || '',
          },
        ];

  for (const row of currentLandRows) {
    if (!row.survey_no || !row.survey_no.trim()) return true;
    if (!row.khata_no || !row.khata_no.trim()) return true;
    if (!row.village || !row.village.trim()) return true;
    if (!row.owner_type || !row.owner_type.trim()) return true;
    if (!row.area || !row.area.trim()) return true;
  }

  const bankName =
    data.bank_detail?.bank_name_branch || data.bank_detail?.bank_name || '';
  if (!bankName.trim()) return true;
  if (!data.bank_detail?.account_no || !data.bank_detail.account_no.trim()) return true;
  if (!data.bank_detail?.ifsc_code || !data.bank_detail.ifsc_code.trim()) return true;

  return false;
}

/**
 * Full inspection of empty fields across the record.
 */
export function getEmptyFormFields(data: FarmerRecord, t: Translations): EmptyFormField[] {
  const empty: EmptyFormField[] = [];

  const sectionFront = t.farmerForm.section1Title || 'Personal Details';
  const sectionLand = t.farmerForm.landDetailsHeading || 'Land Details';
  const sectionBank = t.farmerForm.bankDetailsHeading || 'Bank Details';
  const sectionPhoto = t.photoCard.title || 'Photograph';

  if (!data.farmer_name || !data.farmer_name.trim()) {
    empty.push({ key: 'farmer_name', label: t.farmerForm.farmerNameLabel, section: 'front', sectionName: sectionFront });
  }
  if (!data.farmer_id || !data.farmer_id.trim()) {
    empty.push({ key: 'farmer_id', label: t.farmerForm.farmerIdLabel, section: 'front', sectionName: sectionFront });
  }
  if (!data.dob || !data.dob.trim()) {
    empty.push({ key: 'dob', label: t.farmerForm.dobLabel, section: 'front', sectionName: sectionFront });
  }
  if (!data.gender || !data.gender.trim()) {
    empty.push({ key: 'gender', label: t.farmerForm.genderLabel, section: 'front', sectionName: sectionFront });
  }
  if (!data.mobile_number || !data.mobile_number.trim()) {
    empty.push({ key: 'mobile_number', label: t.farmerForm.mobileLabel, section: 'front', sectionName: sectionFront });
  }
  if (!data.pan_card || !data.pan_card.trim()) {
    empty.push({ key: 'pan_card', label: t.farmerForm.panLabel, section: 'front', sectionName: sectionFront });
  }
  if (!data.enrollment_no || !data.enrollment_no.trim()) {
    empty.push({ key: 'enrollment_no', label: t.farmerForm.pmKisanLabel, section: 'front', sectionName: sectionFront });
  }
  if (!data.aadhaar_number || !data.aadhaar_number.trim()) {
    empty.push({ key: 'aadhaar_number', label: t.farmerForm.aadhaarLabel, section: 'front', sectionName: sectionFront });
  }
  if (!data.address || !data.address.trim()) {
    empty.push({ key: 'address', label: t.farmerForm.addressLabel, section: 'front', sectionName: sectionFront });
  }
  if (!data.photo_url || !data.photo_url.trim()) {
    empty.push({ key: 'photo_url', label: t.photoCard.title, section: 'photo', sectionName: sectionPhoto });
  }

  const currentLandRows: LandRow[] =
    data.land_records && data.land_records.length > 0
      ? data.land_records
      : [
          {
            khata_no: data.land_detail?.khata_no || '',
            survey_no: data.land_detail?.survey_gat_no || '',
            village: data.land_detail?.village || '',
            owner_type: '',
            area: data.land_detail?.total_area_hectare || '',
          },
        ];

  currentLandRows.forEach((row, index) => {
    const rowPrefix = currentLandRows.length > 1 ? `#${index + 1} ` : '';
    if (!row.survey_no || !row.survey_no.trim()) {
      empty.push({ key: `land_${index}_survey_no`, label: `${rowPrefix}${t.farmerForm.colSurveyNo}`, section: 'land', sectionName: sectionLand });
    }
    if (!row.khata_no || !row.khata_no.trim()) {
      empty.push({ key: `land_${index}_khata_no`, label: `${rowPrefix}${t.farmerForm.colKhataNo}`, section: 'land', sectionName: sectionLand });
    }
    if (!row.village || !row.village.trim()) {
      empty.push({ key: `land_${index}_village`, label: `${rowPrefix}${t.farmerForm.colVillage}`, section: 'land', sectionName: sectionLand });
    }
    if (!row.owner_type || !row.owner_type.trim()) {
      empty.push({ key: `land_${index}_owner_type`, label: `${rowPrefix}${t.farmerForm.colOwnerType}`, section: 'land', sectionName: sectionLand });
    }
    if (!row.area || !row.area.trim()) {
      empty.push({ key: `land_${index}_area`, label: `${rowPrefix}${t.farmerForm.colArea}`, section: 'land', sectionName: sectionLand });
    }
  });

  const bankName =
    data.bank_detail?.bank_name_branch || data.bank_detail?.bank_name || '';
  if (!bankName.trim()) {
    empty.push({ key: 'bank_name', label: t.farmerForm.bankNameLabel, section: 'bank', sectionName: sectionBank });
  }
  if (!data.bank_detail?.account_no || !data.bank_detail.account_no.trim()) {
    empty.push({ key: 'account_no', label: t.farmerForm.accountNoLabel, section: 'bank', sectionName: sectionBank });
  }
  if (!data.bank_detail?.ifsc_code || !data.bank_detail.ifsc_code.trim()) {
    empty.push({ key: 'ifsc_code', label: t.farmerForm.ifscLabel, section: 'bank', sectionName: sectionBank });
  }

  return empty;
}
