import React, { useRef, useState } from 'react';
import { UploadCloud, Sparkles, Zap, FileCheck2 } from 'lucide-react';
import { useLanguage } from '../i18n';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  uploadedFileName?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelected,
  isProcessing,
  uploadedFileName,
}) => {
  const { t, format } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (isProcessing) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(t.dropZone.fileSizeAlert);
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
              <span>{t.dropZone.recommendedBadge}</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.dropZone.noTypingBadge}</span>
            </span>
            {uploadedFileName && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs sm:text-sm font-bold max-w-full">
                <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate max-w-[220px] sm:max-w-xs">
                  {format(t.dropZone.extractedBadge, { fileName: uploadedFileName })}
                </span>
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.dropZone.heading}
          </h2>
        </div>
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
                {t.dropZone.selectPdfLink}
              </span>{' '}
              {t.dropZone.dragDropRest}
            </div>
            <p className="text-sm text-slate-500">
              {t.dropZone.supportsHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
