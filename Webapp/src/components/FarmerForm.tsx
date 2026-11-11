import React from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Building2,
  Landmark,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { FarmerRecord, LandRow } from '../types';
import { useLanguage } from '../i18n';

interface FarmerFormProps {
  data: FarmerRecord;
  onChange: (updated: FarmerRecord) => void;
  disabled?: boolean;
  showExtractedBadges?: boolean;
  onReset?: () => void;
  canReset?: boolean;
}

export const FarmerForm: React.FC<FarmerFormProps> = ({
  data,
  onChange,
  disabled = false,
  showExtractedBadges = true,
  onReset,
  canReset = false,
}) => {
  const { t, format } = useLanguage();

  const updateField = (field: keyof FarmerRecord, val: any) => {
    onChange({ ...data, [field]: val });
  };

  // Ensure there is always at least 1 land row, up to maximum 5 rows
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

  const updateLandRow = (index: number, field: keyof LandRow, val: string) => {
    const updatedRows = currentLandRows.map((row, idx) =>
      idx === index ? { ...row, [field]: val } : row
    );

    // Keep data.land_detail in sync with row 0 for backward compatibility
    const updatedLandDetail = { ...data.land_detail };
    if (index === 0) {
      if (field === 'khata_no') updatedLandDetail.khata_no = val;
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
        khata_no: '',
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
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center space-x-2">
            <span>{t.farmerForm.title}</span>
          </h2>
          <p className="text-sm text-emerald-100 mt-0.5">{t.farmerForm.subtitle}</p>
        </div>
        {onReset && canReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-900/50 hover:bg-emerald-900/80 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-100 border border-emerald-500/40 text-sm font-semibold transition cursor-pointer shrink-0"
            title={t.farmerForm.clearFormTitle}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.farmerForm.clearForm}</span>
          </button>
        )}
      </div>

      <div className="p-6">
        <fieldset disabled={disabled} className="min-w-0 w-full border-0 p-0 m-0 space-y-6">
          {/* ========================================================= */}
          {/* SECTION 1: FRONT SIDE DETAILS                             */}
          {/* ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 text-sm font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  {t.farmerForm.section1Title}
                </h3>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
                {t.farmerForm.section1Badge}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Farmer Name */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                  <span>{t.farmerForm.farmerNameLabel}</span>
                </label>
                <input
                  type="text"
                  placeholder={t.farmerForm.farmerNamePlaceholder}
                  value={data.farmer_name}
                  onChange={(e) => updateField('farmer_name', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium text-slate-900"
                />
              </div>

              {/* 2. Farmer Number / ID */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center">
                  <CreditCard className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                  <span>{t.farmerForm.farmerIdLabel}</span>
                </label>
                <input
                  type="text"
                  placeholder={t.farmerForm.farmerIdPlaceholder}
                  value={data.farmer_id}
                  onChange={(e) => updateField('farmer_id', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono font-bold text-emerald-900"
                />
              </div>
            </div>

            {/* Row 2: DOB, Gender, Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                  <span>{t.farmerForm.dobLabel}</span>
                </label>
                <input
                  type="text"
                  placeholder={t.farmerForm.dobPlaceholder}
                  value={data.dob}
                  onChange={(e) => updateField('dob', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                  <span>{t.farmerForm.genderLabel}</span>
                </label>
                <input
                  type="text"
                  placeholder={t.farmerForm.genderPlaceholder}
                  value={data.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center">
                  <Phone className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                  <span>{t.farmerForm.mobileLabel}</span>
                </label>
                <input
                  type="text"
                  placeholder={t.farmerForm.mobilePlaceholder}
                  value={data.mobile_number}
                  onChange={(e) => updateField('mobile_number', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
                />
              </div>
            </div>

            {/* Row 3: PAN, Enrollment, Aadhaar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 flex flex-wrap items-center justify-between gap-1">
                  <span className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                    <span>{t.farmerForm.panLabel}</span>
                  </span>
                  {showExtractedBadges && data.pan_card && (
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t.farmerForm.extractedBadge}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={t.farmerForm.panPlaceholder}
                  value={data.pan_card || ''}
                  onChange={(e) => updateField('pan_card', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                  <span>{t.farmerForm.pmKisanLabel}</span>
                </label>
                <input
                  type="text"
                  placeholder={t.farmerForm.pmKisanPlaceholder}
                  value={data.enrollment_no || ''}
                  onChange={(e) => updateField('enrollment_no', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center">
                  <CreditCard className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                  <span>{t.farmerForm.aadhaarLabel}</span>
                </label>
                <input
                  type="text"
                  placeholder={t.farmerForm.aadhaarPlaceholder}
                  value={data.aadhaar_number || ''}
                  onChange={(e) => updateField('aadhaar_number', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
                />
              </div>
            </div>

            {/* Row 4: Address */}
            <div>
              <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                <span>{t.farmerForm.addressLabel}</span>
              </label>
              <textarea
                rows={2}
                placeholder={t.farmerForm.addressPlaceholder}
                value={data.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: BACK SIDE DETAILS                              */}
          {/* ========================================================= */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 text-sm font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  {t.farmerForm.section2Title}
                </h3>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
                {t.farmerForm.section2Badge}
              </span>
            </div>

            {/* Sub-section: Land Details */}
            <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-xl border border-emerald-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm sm:text-base font-bold text-emerald-900 uppercase tracking-wider flex items-center">
                  <Building2 className="w-4 h-4 mr-1.5 text-emerald-700" />
                  <span>{t.farmerForm.landDetailsHeading}</span>
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-100/90 px-3 py-0.5 rounded-full border border-emerald-200">
                    {format(t.farmerForm.recordsCount, { count: currentLandRows.length })}
                  </span>
                </div>
              </div>

              {/* Desktop Table View (md and up) */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-emerald-200/80 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-transparent text-slate-800 font-bold border-b border-emerald-200">
                    <tr>
                      <th className="py-3 px-2.5 w-10 text-center">#</th>
                      <th className="py-3 px-2.5 w-[19%] min-w-[110px] whitespace-nowrap">{t.farmerForm.colSurveyNo}</th>
                      <th className="py-3 px-2.5 w-[17%] min-w-[100px] whitespace-nowrap">{t.farmerForm.colKhataNo}</th>
                      <th className="py-3 px-2.5 w-[22%] min-w-[120px] whitespace-nowrap">{t.farmerForm.colVillage}</th>
                      <th className="py-3 px-2.5 w-[22%] min-w-[120px] whitespace-nowrap">{t.farmerForm.colOwnerType}</th>
                      <th className="py-3 px-2.5 w-[20%] min-w-[105px] whitespace-nowrap">{t.farmerForm.colArea}</th>
                      <th className="py-3 px-2 w-11 text-center whitespace-nowrap">{t.farmerForm.colAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {currentLandRows.map((row, index) => (
                      <tr key={index} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-2.5 px-2.5 text-center text-slate-500 font-bold">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-1.5">
                          <input
                            type="text"
                            placeholder={t.farmerForm.surveyPlaceholder}
                            value={row.survey_no}
                            onChange={(e) => updateLandRow(index, 'survey_no', e.target.value)}
                            className="w-full px-2.5 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                          />
                        </td>
                        <td className="py-2.5 px-1.5">
                          <input
                            type="text"
                            placeholder={t.farmerForm.khataPlaceholder}
                            value={row.khata_no || ''}
                            onChange={(e) => updateLandRow(index, 'khata_no', e.target.value)}
                            className="w-full px-2.5 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                          />
                        </td>
                        <td className="py-2.5 px-1.5">
                          <input
                            type="text"
                            placeholder={t.farmerForm.villagePlaceholder}
                            value={row.village}
                            onChange={(e) => updateLandRow(index, 'village', e.target.value)}
                            className="w-full px-2.5 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                          />
                        </td>
                        <td className="py-2.5 px-1.5">
                          <input
                            type="text"
                            list="owner-type-options"
                            placeholder={t.farmerForm.ownerTypePlaceholder}
                            value={row.owner_type}
                            onChange={(e) => updateLandRow(index, 'owner_type', e.target.value)}
                            className="w-full px-2.5 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                          />
                        </td>
                        <td className="py-2.5 px-1.5">
                          <input
                            type="text"
                            placeholder={t.farmerForm.areaPlaceholder}
                            value={row.area}
                            onChange={(e) => updateLandRow(index, 'area', e.target.value)}
                            className="w-full px-2.5 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                          />
                        </td>
                        <td className="py-2.5 px-1.5 text-center">
                          {index > 0 ? (
                            <button
                              type="button"
                              onClick={() => removeLandRow(index)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                              title={t.farmerForm.removeRowTitle}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-normal"></span>
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
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-sm font-bold text-emerald-800 flex items-center">
                        {format(t.farmerForm.mobileRecordTitle, { num: index + 1 })}
                        {index === 0 && (
                          <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {t.farmerForm.mainRecordBadge}
                          </span>
                        )}
                      </span>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeLandRow(index)}
                          className="inline-flex items-center text-sm text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          <span>{t.farmerForm.removeBtn}</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          {t.farmerForm.colSurveyNo}
                        </label>
                        <input
                          type="text"
                          placeholder={t.farmerForm.surveyPlaceholder}
                          value={row.survey_no}
                          onChange={(e) => updateLandRow(index, 'survey_no', e.target.value)}
                          className="w-full px-3 py-2 text-base bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          {t.farmerForm.colKhataNo}
                        </label>
                        <input
                          type="text"
                          placeholder={t.farmerForm.khataPlaceholder}
                          value={row.khata_no || ''}
                          onChange={(e) => updateLandRow(index, 'khata_no', e.target.value)}
                          className="w-full px-3 py-2 text-base bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          {t.farmerForm.colVillage}
                        </label>
                        <input
                          type="text"
                          placeholder={t.farmerForm.villagePlaceholder}
                          value={row.village}
                          onChange={(e) => updateLandRow(index, 'village', e.target.value)}
                          className="w-full px-3 py-2 text-base bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          {t.farmerForm.colOwnerType}
                        </label>
                        <input
                          type="text"
                          list="owner-type-options"
                          placeholder={t.farmerForm.ownerTypePlaceholder}
                          value={row.owner_type}
                          onChange={(e) => updateLandRow(index, 'owner_type', e.target.value)}
                          className="w-full px-3 py-2 text-base bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                          {t.farmerForm.colArea}
                        </label>
                        <input
                          type="text"
                          placeholder={t.farmerForm.areaPlaceholder}
                          value={row.area}
                          onChange={(e) => updateLandRow(index, 'area', e.target.value)}
                          className="w-full px-3 py-2 text-base bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <datalist id="owner-type-options">
                <option value={t.farmerForm.ownerOptionSingle} />
                <option value={t.farmerForm.ownerOptionJoint} />
              </datalist>

              {/* Add New Record Option */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                {currentLandRows.length < 5 ? (
                  <button
                    type="button"
                    onClick={addLandRow}
                    className="inline-flex items-center text-sm font-bold text-emerald-800 bg-white hover:bg-emerald-100/60 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-300 px-3.5 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1.5 text-emerald-600" />
                    <span>{t.farmerForm.addNewRecord}</span>
                  </button>
                ) : (
                  <span className="text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">
                    {t.farmerForm.maxRecordsReached}
                  </span>
                )}
                <span className="text-xs sm:text-sm text-slate-500">
                  {t.farmerForm.maxRowsHint}
                </span>
              </div>
            </div>

            {/* Sub-section: Bank Details */}
            <div className="bg-sky-50/60 p-4 sm:p-5 rounded-xl border border-sky-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-sky-900 uppercase tracking-wider flex items-center">
                  <Landmark className="w-4 h-4 mr-1.5 text-sky-700" />
                  <span>{t.farmerForm.bankDetailsHeading}</span>
                </h4>
                {showExtractedBadges &&
                  (data.bank_detail?.bank_name_branch ||
                    data.bank_detail?.account_no ||
                    data.bank_detail?.ifsc_code) && (
                    <span className="inline-flex items-center text-xs font-semibold text-sky-700 bg-sky-100/80 px-2.5 py-0.5 rounded-full border border-sky-200">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-sky-600" />
                      {t.farmerForm.autoExtractedBadge}
                    </span>
                  )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t.farmerForm.bankNameLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.farmerForm.bankNamePlaceholder}
                    value={data.bank_detail?.bank_name_branch || ''}
                    onChange={(e) => updateBankField('bank_name_branch', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t.farmerForm.accountNoLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.farmerForm.accountNoPlaceholder}
                    value={data.bank_detail?.account_no || ''}
                    onChange={(e) => updateBankField('account_no', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t.farmerForm.ifscLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.farmerForm.ifscPlaceholder}
                    value={data.bank_detail?.ifsc_code || ''}
                    onChange={(e) => updateBankField('ifsc_code', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 uppercase font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
};
