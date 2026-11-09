export interface LandDetail {
  khata_no?: string;
  total_area_hectare: string;
  number_of_lands: string;
  survey_gat_no: string;
  village: string;
  sub_district: string;
  district: string;
  state: string;
  summary: string;
}

export interface BankDetail {
  bank_name_branch: string;
  account_no: string;
  ifsc_code: string;
}

export interface PhotoBBox {
  x: number;
  y: number;
  w: number;
  h: number;
  pageW: number;
  pageH: number;
}

export interface PhotoTransform {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  flipH?: boolean;
}

export interface FarmerRecord {
  farmer_id: string;
  enrollment_no: string;
  farmer_name: string;
  identifier_name: string;
  dob: string;
  age: string;
  gender: string;
  caste_category: string;
  mobile_number: string;
  aadhaar_number?: string;
  pan_card?: string;
  land_detail: LandDetail;
  bank_detail?: BankDetail;
  address: string;
  photo_base64?: string;
  photo_url?: string;
  raw_photo_url?: string;
  pdf_page_image_url?: string;
  photo_bbox?: PhotoBBox;
  photo_transform?: PhotoTransform;
}

