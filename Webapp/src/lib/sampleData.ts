import { FarmerRecord } from '../types';

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
