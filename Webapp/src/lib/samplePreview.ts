import { FarmerRecord } from '../types';
import { getTranslations, Language } from '../i18n';
import sampleFarmerPhoto from '../assets/sample-farmer.jpg';

export const SAMPLE_FARMER_PHOTO_URL = sampleFarmerPhoto;

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

