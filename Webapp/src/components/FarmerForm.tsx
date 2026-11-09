import React from 'react';
import { User, Phone, MapPin, Calendar, CreditCard, Building2, Landmark, FileText, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { FarmerRecord, LandRow } from '../types';

interface FarmerFormProps {
  data: FarmerRecord;
  onChange: (updated: FarmerRecord) => void;
}

export const FarmerForm: React.FC<FarmerFormProps> = ({ data, onChange }) => {
  const updateField = (field: keyof FarmerRecord, val: any) => {
    onChange({ ...data, [field]: val });
  };

  // Ensure there is always at least 1 land row, up to maximum 5 rows
  const currentLandRows: LandRow[] = (data.land_records && data.land_records.length > 0)
    ? data.land_records
    : [{
      survey_no: data.land_detail?.survey_gat_no || '',
      village: data.land_detail?.village || '',
      owner_type: '',
      area: data.land_detail?.total_area_hectare || '',
    }];

  const updateLandRow = (index: number, field: keyof LandRow, val: string) => {
    const updatedRows = currentLandRows.map((row, idx) =>
      idx === index ? { ...row, [field]: val } : row
    );

    // Keep data.land_detail in sync with row 0 for backward compatibility
    const updatedLandDetail = { ...data.land_detail };
    if (index === 0) {
      if (field === 'survey_no') updatedLandDetail.survey_gat_no = val;
      if (field === 'village') updatedLandDetail.village = val;
      if (field === 'area') updatedLandDetail.total_area_hectare = val;
    }
    updatedLandDetail.number_of_lands = String(updatedRows.length);

    onChange({
      ...data,
      land_records: updatedRows,
      land_detail: updatedLandDetail,
    });
  };

  const addLandRow = () => {
    if (currentLandRows.length >= 5) return;
    const newRows: LandRow[] = [
      ...currentLandRows,
      {
        survey_no: '',
        village: currentLandRows[0]?.village || '',
        owner_type: '',
        area: '',
      },
    ];

    onChange({
      ...data,
      land_records: newRows,
      land_detail: {
        ...data.land_detail,
        number_of_lands: String(newRows.length),
      },
    });
  };

  const removeLandRow = (index: number) => {
    if (index === 0) return; // Show first row always
    const newRows = currentLandRows.filter((_, idx) => idx !== index);

    onChange({
      ...data,
      land_records: newRows,
      land_detail: {
        ...data.land_detail,
        number_of_lands: String(newRows.length),
      },
    });
  };

  const updateBankField = (key: string, val: string) => {
    onChange({
      ...data,
      bank_detail: {
        bank_name_branch: data.bank_detail?.bank_name_branch || '',
        bank_name: data.bank_detail?.bank_name || '',
        account_no: data.bank_detail?.account_no || '',
        ifsc_code: data.bank_detail?.ifsc_code || '',
        [key]: val,
        ...(key === 'bank_name_branch' ? { bank_name: val } : {}),
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold flex items-center space-x-2">
            {/* <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5 shadow-sm"> */}
            {/* <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" /> */}
            {/* </div> */}
            <span>Farmer ID Card Information
            </span>
          </h2>
          <p className="text-xs text-emerald-100">
            Review and edit details for both Front & Back sides of the ID card
          </p>
        </div>
        {/* <span className="hidden sm:inline-flex items-center text-xs bg-emerald-900/60 text-emerald-200 px-3 py-1 rounded-full font-medium border border-emerald-500/30">
          Front & Back 2-Sided
        </span> */}
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
              Personal Details
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
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center">
                  <CreditCard className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>पॅन कार्ड (Farmer PAN Card)</span>
                </span>
                {data.pan_card && (
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Extracted
                  </span>
                )}
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
                <span>PM किसान नंबर</span>
              </label>
              <input
                type="text"
                placeholder="Enter PM Kisan No"
                value={data.enrollment_no || ''}
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
          <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-xl border border-emerald-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                <span>जमिनीचा तपशील (Land Details)</span>
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {currentLandRows.length} / 5 नोंदी (Records)
                </span>
                {data.land_detail?.khata_no && (
                  <span className="text-[10px] text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                    खाता क्र: {data.land_detail.khata_no}
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Table View (md and up) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-emerald-200/80 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-transparent text-slate-800 font-bold border-b border-emerald-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-1/4">सर्वे नंबर (Survey Number)</th>
                    <th className="py-2.5 px-3 w-1/4">गाव (Village)</th>
                    <th className="py-2.5 px-3 w-1/4">मालकी प्रकार (Owner Type)</th>
                    <th className="py-2.5 px-3 w-1/4">क्षेत्र (Area)</th>
                    <th className="py-2.5 px-2 w-12 text-center">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {currentLandRows.map((row, index) => (
                    <tr key={index} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-500 font-bold">
                        {index + 1}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="उदा. 102/9"
                          value={row.survey_no}
                          onChange={e => updateLandRow(index, 'survey_no', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="उदा. शिरूर"
                          value={row.village}
                          onChange={e => updateLandRow(index, 'village', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          list="owner-type-options"
                          placeholder="उदा. स्वतःची / सामाईक"
                          value={row.owner_type}
                          onChange={e => updateLandRow(index, 'owner_type', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="उदा. 0.72 Ha"
                          value={row.area}
                          onChange={e => updateLandRow(index, 'area', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        {index > 0 ? (
                          <button
                            type="button"
                            onClick={() => removeLandRow(index)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            title="नोंद हटवा (Remove row)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal"></span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden space-y-3">
              {currentLandRows.map((row, index) => (
                <div
                  key={index}
                  className="bg-white p-3.5 rounded-lg border border-emerald-100 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-emerald-800 flex items-center">
                      नोंद #{index + 1}
                      {index === 0 && (
                        <span className="ml-2 text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          मुख्य नोंद
                        </span>
                      )}
                    </span>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeLandRow(index)}
                        className="inline-flex items-center text-xs text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-0.5 rounded"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        <span>हटवा</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        सर्वे नंबर (Survey Number)
                      </label>
                      <input
                        type="text"
                        placeholder="उदा. 102/9"
                        value={row.survey_no}
                        onChange={e => updateLandRow(index, 'survey_no', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        गाव (Village)
                      </label>
                      <input
                        type="text"
                        placeholder="उदा. शिरूर"
                        value={row.village}
                        onChange={e => updateLandRow(index, 'village', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        मालकी प्रकार (Owner Type)
                      </label>
                      <input
                        type="text"
                        list="owner-type-options"
                        placeholder="उदा. स्वतःची / सामाईक"
                        value={row.owner_type}
                        onChange={e => updateLandRow(index, 'owner_type', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        क्षेत्र (Area)
                      </label>
                      <input
                        type="text"
                        placeholder="उदा. 0.72 Ha"
                        value={row.area}
                        onChange={e => updateLandRow(index, 'area', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <datalist id="owner-type-options">
              <option value="Single" />
              <option value="Joint" />
            </datalist>

            {/* Add New Record Option */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              {currentLandRows.length < 5 ? (
                <button
                  type="button"
                  onClick={addLandRow}
                  className="inline-flex items-center text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100/60 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  <span>नवीन नोंद जोडा (Add New Record)</span>
                </button>
              ) : (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                  जास्तीत जास्त ५ नोंदींची मर्यादा पूर्ण झाली (Max 5 records limit reached)
                </span>
              )}
              <span className="text-[11px] text-slate-500">
                मर्यादा: जास्तीत जास्त ५ नोंदी (Max 5 rows)
              </span>
            </div>
          </div>

          {/* Sub-section: बँक तपशील (Bank Details) */}
          <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center">
                <Landmark className="w-3.5 h-3.5 mr-1.5 text-sky-700" />
                <span>बँक तपशील (Bank Details)</span>
              </h4>
              {(data.bank_detail?.bank_name_branch || data.bank_detail?.account_no || data.bank_detail?.ifsc_code) && (
                <span className="inline-flex items-center text-[10px] font-semibold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full border border-sky-200">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-sky-600" />
                  Auto-extracted
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  बँकचे नाव (Bank Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={data.bank_detail?.bank_name_branch || ''}
                  onChange={e => updateBankField('bank_name_branch', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  बँक खाते क्रमांक (Bank Account Number)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 023200100013822"
                  value={data.bank_detail?.account_no || ''}
                  onChange={e => updateBankField('account_no', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  IFSC कोड (IFSC Code)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SBI0000000"
                  value={data.bank_detail?.ifsc_code || ''}
                  onChange={e => updateBankField('ifsc_code', e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 uppercase font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
