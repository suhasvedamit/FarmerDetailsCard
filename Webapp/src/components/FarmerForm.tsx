import React from 'react';
import { User, Phone, MapPin, Calendar, CreditCard, Building2, Landmark, FileText, CheckCircle2 } from 'lucide-react';
import { FarmerRecord } from '../types';

interface FarmerFormProps {
  data: FarmerRecord;
  onChange: (updated: FarmerRecord) => void;
}

export const FarmerForm: React.FC<FarmerFormProps> = ({ data, onChange }) => {
  const updateField = (field: keyof FarmerRecord, val: any) => {
    onChange({ ...data, [field]: val });
  };

  const updateLandField = (key: string, val: string) => {
    onChange({
      ...data,
      land_detail: {
        ...data.land_detail,
        [key]: val,
      },
    });
  };

  const updateBankField = (key: string, val: string) => {
    onChange({
      ...data,
      bank_detail: {
        bank_name_branch: data.bank_detail?.bank_name_branch || '',
        account_no: data.bank_detail?.account_no || '',
        ifsc_code: data.bank_detail?.ifsc_code || '',
        [key]: val,
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold flex items-center space-x-2">
            <span>🌾</span>
            <span>Farmer ID Card Information</span>
          </h2>
          <p className="text-xs text-emerald-100">
            Review and edit details for both Front & Back sides of the ID card
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center text-xs bg-emerald-900/60 text-emerald-200 px-3 py-1 rounded-full font-medium border border-emerald-500/30">
          Front & Back 2-Sided
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* ========================================================= */}
        {/* SECTION 1: FRONT SIDE DETAILS                             */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-slate-800 text-sm">
                Front Side Details (समोरील बाजू)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Personal & IDs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Farmer Name (नाव) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>नाव (Farmer Name)</span>
              </label>
              <input
                type="text"
                placeholder="Full Name of Farmer"
                value={data.farmer_name}
                onChange={e => updateField('farmer_name', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium text-slate-900"
              />
            </div>

            {/* 2. Farmer Number / ID (फार्मर नंबर) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <CreditCard className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>फार्मर नंबर (Farmer ID Number)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MH123456789"
                value={data.farmer_id}
                onChange={e => updateField('farmer_id', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono font-bold text-emerald-900"
              />
            </div>
          </div>

          {/* Row 2: DOB, Gender, Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>जन्म दिनांक (Date of Birth)</span>
              </label>
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={data.dob}
                onChange={e => updateField('dob', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>लिंग (Gender)</span>
              </label>
              <input
                type="text"
                placeholder="Male / Female"
                value={data.gender}
                onChange={e => updateField('gender', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>मोबाईल नंबर (Mobile)</span>
              </label>
              <input
                type="text"
                placeholder="10-digit mobile"
                value={data.mobile_number}
                onChange={e => updateField('mobile_number', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Row 3: PAN, Enrollment, Aadhaar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <CreditCard className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>पॅन कार्ड (PAN Card)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F"
                value={data.pan_card || ''}
                onChange={e => updateField('pan_card', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>किसान रजिस्टर नंबर (Enrollment No)</span>
              </label>
              <input
                type="text"
                placeholder="Registration / Enrollment No"
                value={data.enrollment_no}
                onChange={e => updateField('enrollment_no', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <CreditCard className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>आधार नंबर (Aadhaar Number)</span>
              </label>
              <input
                type="text"
                placeholder="XXXX XXXX XXXX"
                value={data.aadhaar_number || ''}
                onChange={e => updateField('aadhaar_number', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Row 4: Address (पत्ता) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              <span>पत्ता (Address)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Full Residential Address"
              value={data.address}
              onChange={e => updateField('address', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: BACK SIDE DETAILS                              */}
        {/* ========================================================= */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-slate-800 text-sm">
                Back Side Details (मागील बाजू)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Land & Bank Details
            </span>
          </div>

          {/* Sub-section: जमिनीचा तपशील (Land Details) */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              <span>जमिनीचा तपशील (Land Details)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  खाता नंबर (Khata / Account No)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 124"
                  value={data.land_detail?.khata_no || ''}
                  onChange={e => updateLandField('khata_no', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  सर्वे नंबर (Survey / Gat No)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 102/9"
                  value={data.land_detail?.survey_gat_no || ''}
                  onChange={e => updateLandField('survey_gat_no', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  एकूण क्षेत्र (Total Area)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0.72 Hectare"
                  value={data.land_detail?.total_area_hectare || ''}
                  onChange={e => updateLandField('total_area_hectare', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Sub-section: बँक तपशील (Bank Details) */}
          <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 space-y-3">
            <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center">
              <Landmark className="w-3.5 h-3.5 mr-1.5 text-sky-700" />
              <span>बँक तपशील (Bank Details)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  बँकचे नाव आणि शाखा (Bank & Branch)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SBI, Junnar"
                  value={data.bank_detail?.bank_name_branch || ''}
                  onChange={e => updateBankField('bank_name_branch', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  बचत खाता नंबर (Account No)
                </label>
                <input
                  type="text"
                  placeholder="Savings Account Number"
                  value={data.bank_detail?.account_no || ''}
                  onChange={e => updateBankField('account_no', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  IFSC CODE
                </label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  value={data.bank_detail?.ifsc_code || ''}
                  onChange={e => updateBankField('ifsc_code', e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
