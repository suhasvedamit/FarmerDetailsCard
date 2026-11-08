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
  land_detail: {
    total_area_hectare: '',
    number_of_lands: '',
    survey_gat_no: '',
    village: '',
    sub_district: '',
    district: '',
    state: '',
    summary: '',
  },
  address: '',
};
