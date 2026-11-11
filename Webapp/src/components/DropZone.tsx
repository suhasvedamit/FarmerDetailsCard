import React, { useRef, useState } from 'react';
import { UploadCloud, Sparkles, CheckCircle2, Zap, FileCheck2, Clock } from 'lucide-react';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  uploadedFileName?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const EXTRACTED_FIELDS = [
  'Farmer Photo',
  'Personal & ID Info',
  'Land Survey Rows',
  'Bank & IFSC Details',
];

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelected,
  isProcessing,
  uploadedFileName,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (isProcessing) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('File size exceeds the 5 MB limit. Please upload a PDF under 5 MB.');
      return;
    }
    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const openFilePicker = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 p-4 sm:p-6 transition-all shadow-md ${isDragOver
        ? 'border-emerald-600 bg-emerald-50 ring-4 ring-emerald-500/20 scale-[1.005]'
        : 'border-emerald-400/90 bg-gradient-to-br from-emerald-50 via-white to-teal-50/70 ring-4 ring-emerald-500/10'
        } ${isProcessing ? 'opacity-70 pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
          }
          e.target.value = '';
        }}
        disabled={isProcessing}
      />

      {/* Highlighted USP Header & Primary Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-emerald-200/80">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Smart Auto-Extract • Recommended</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>No Manual Typing Needed</span>
            </span>
            {uploadedFileName && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs sm:text-sm font-bold max-w-full">
                <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate max-w-[220px] sm:max-w-xs">
                  Extracted: {uploadedFileName}
                </span>
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Upload Farmer Registration PDF to Auto-Fill Everything
          </h2>
        </div>

        {/* <button
          type="button"
          onClick={openFilePicker}
          disabled={isProcessing}
          className="self-start lg:self-center shrink-0 px-5 py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center space-x-2 cursor-pointer"
        >
          <UploadCloud className="w-5 h-5" />
          <span>{uploadedFileName ? 'Upload Another PDF' : 'Select PDF to Auto-Extract'}</span>
        </button> */}
      </div>

      {/* Interactive Drop Area */}
      <div
        onClick={openFilePicker}
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        aria-disabled={isProcessing}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        className={`border-2 border-dashed rounded-xl px-4 py-5 sm:px-6 sm:py-6 text-center transition cursor-pointer ${isDragOver
          ? 'border-emerald-600 bg-emerald-100/70'
          : 'border-emerald-400/80 hover:border-emerald-600 bg-white/90 hover:bg-emerald-50/50'
          }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center sm:text-left">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-700 shrink-0 shadow-sm">
            <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="space-y-0.5">
            <div className="text-base sm:text-lg font-semibold text-slate-800">
              <span className="bg-emerald-100 px-1.5 py-0.5 rounded-md text-emerald-700 font-bold underline decoration-emerald-400 underline-offset-2">
                Select PDF to Auto-Extract
              </span>{' '}
              or drag and drop your Farmer Registration PDF here
            </div>
            <p className="text-sm text-slate-500">
              Supports PDF files up to 5 MB • Quick OCR extraction — get your card immediately
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
