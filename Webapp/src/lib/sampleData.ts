import { FarmerRecord } from '../types';
import demoFarmerPhoto from '../assets/demo_farmer.jpg';

export const DEMO_PHOTO_URL = demoFarmerPhoto;

export const DEMO_FARMER_RECORD: FarmerRecord = {
  farmer_id: 'MH147852XXXX',
  enrollment_no: 'PMK9823XXXX',
  farmer_name: 'John Doe',
  identifier_name: 'John Doe',
  dob: '15/06/1975',
  age: '49',
  gender: 'Male',
  caste_category: 'General',
  mobile_number: 'XXXX012345',
  aadhaar_number: 'XXXX-XXXX-4589',
  pan_card: 'ABCPS1XXXF',
  land_detail: {
    khata_no: '482',
    total_area_hectare: '1.85',
    number_of_lands: '2',
    survey_gat_no: '142/2A',
    village: 'Baramati',
    sub_district: 'Baramati',
    district: 'PUNE',
    state: 'MAHARASHTRA',
    summary: '142/2A',
  },
  land_records: [
    {
      survey_no: '142/2A',
      village: 'Baramati',
      owner_type: 'Single',
      area: '1.20',
    },
    {
      survey_no: '145/1',
      village: 'Baramati',
      owner_type: 'Joint',
      area: '0.65',
    },
  ],
  bank_detail: {
    bank_name_branch: 'Bank of Maharashtra',
    bank_name: 'Bank of Maharashtra',
    account_no: '6012345XXXX',
    ifsc_code: 'MAHB0000123',
  },
  address: 'Baramati, Pune, Maharashtra - 413102',
  photo_url: DEMO_PHOTO_URL,
  raw_photo_url: DEMO_PHOTO_URL,
};

export const EMPTY_FARMER_RECORD: FarmerRecord = {
  farmer_id: '',
  enrollment_no: '',
  farmer_name: '',
  identifier_name: '',
  dob: '',
  age: '',
  gender: '',
  caste_category: '',
  mobile_number: '',
  aadhaar_number: '',
  pan_card: '',
  land_detail: {
    khata_no: '',
    total_area_hectare: '',
    number_of_lands: '',
    survey_gat_no: '',
    village: '',
    sub_district: '',
    district: '',
    state: '',
    summary: '',
  },
  land_records: [
    {
      survey_no: '',
      village: '',
      owner_type: '',
      area: '',
    },
  ],
  bank_detail: {
    bank_name_branch: '',
    account_no: '',
    ifsc_code: '',
  },
  address: '',
};

export function cloneFarmerRecord(record: FarmerRecord): FarmerRecord {
  return {
    ...record,
    land_detail: { ...record.land_detail },
    land_records: record.land_records?.map((row) => ({ ...row })),
    bank_detail: record.bank_detail ? { ...record.bank_detail } : undefined,
    photo_bbox: record.photo_bbox ? { ...record.photo_bbox } : undefined,
    photo_transform: record.photo_transform ? { ...record.photo_transform } : undefined,
  };
}

export function createEmptyFarmerRecord(): FarmerRecord {
  return cloneFarmerRecord(EMPTY_FARMER_RECORD);
}
