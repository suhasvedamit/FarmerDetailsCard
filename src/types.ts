export interface LandDetail {
  total_area_hectare: string;
  number_of_lands: string;
  survey_gat_no: string;
  village: string;
  sub_district: string;
  district: string;
  state: string;
  summary: string;
}

export interface FarmerRecord {
  farmer_id: string;
  enrollment_no: string;
  farmer_name: string;
  farmer_name_local: string;
  identifier_name: string;
  identifier_name_local: string;
  dob: string;
  age: string;
  gender: string;
  caste_category: string;
  mobile_number: string;
  land_detail: LandDetail;
  address: string;
  photo_base64?: string;
  photo_url?: string;
}
