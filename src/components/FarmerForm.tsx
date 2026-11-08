import React from 'react';
import { CheckCircle2, User, Phone, MapPin, Calendar, Users, Award, FileText } from 'lucide-react';
import { FarmerRecord } from '../types';

interface FarmerFormProps {
  data: FarmerRecord;
  onChange: (updated: FarmerRecord) => void;
}

export const FarmerForm: React.FC<FarmerFormProps> = ({ data, onChange }) => {
  const updateField = (field: keyof FarmerRecord, val: any) => {
    onChange({ ...data, [field]: val });
  };

  const updateLandField = (val: string) => {
    onChange({
      ...data,
      land_detail: {
        ...data.land_detail,
        summary: val
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-800">Extracted Farmer Credentials</h2>
          <p className="text-xs text-slate-500">Verified extraction from AgriStack Govt Registration Form</p>
        </div>
        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          10/10 Fields Extracted
        </span>
      </div>

      <form className="space-y-4" onSubmit={e => e.preventDefault()}>
        {/* Row 1: Farmer ID & Enrollment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold">1</span>
              Farmer ID
            </label>
            <input
              type="text"
              value={data.farmer_id}
              onChange={e => updateField('farmer_id', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono font-bold text-emerald-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Enrollment Number
            </label>
            <input
              type="text"
              value={data.enrollment_no}
              onChange={e => updateField('enrollment_no', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-700"
            />
          </div>
        </div>

        {/* Row 2: Farmer Name & Identifier Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold">2</span>
              Farmer Name
            </label>
            <input
              type="text"
              value={data.farmer_name}
              onChange={e => updateField('farmer_name', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold">3</span>
              Father / Spouse Name
            </label>
            <input
              type="text"
              value={data.identifier_name}
              onChange={e => updateField('identifier_name', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Row 4: DOB, Age, Gender, Category */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold">4</span>
              DOB (DD/MM/YYYY)
            </label>
            <input
              type="text"
              value={data.dob}
              onChange={e => updateField('dob', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
            <input
              type="text"
              value={data.age}
              onChange={e => updateField('age', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold">5</span>
              Gender
            </label>
            <input
              type="text"
              value={data.gender}
              onChange={e => updateField('gender', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold">6</span>
              Category
            </label>
            <input
              type="text"
              value={data.caste_category}
              onChange={e => updateField('caste_category', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Row 5: Mobile Number & Land Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold">7</span>
              Mobile Number
            </label>
            <input
              type="text"
              value={data.mobile_number}
              onChange={e => updateField('mobile_number', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold">8</span>
              Land Summary
            </label>
            <input
              type="text"
              value={data.land_detail?.summary || ''}
              onChange={e => updateLandField(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Row 6: Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center justify-center text-[10px] mr-1.5 font-bold">9</span>
            Residential Address
          </label>
          <textarea
            rows={2}
            value={data.address}
            onChange={e => updateField('address', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
          />
        </div>
      </form>
    </div>
  );
};

