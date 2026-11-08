import React, { useRef, useState } from 'react';
import { UploadCloud, FileCheck2 } from 'lucide-react';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition cursor-pointer shadow-sm ${
        isDragOver
          ? 'border-emerald-600 bg-emerald-50/70 scale-[1.005]'
          : 'border-emerald-300 hover:border-emerald-500 bg-white'
      } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && onFileSelected(e.target.files[0])}
        disabled={isProcessing}
      />
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div className="text-sm font-medium text-slate-700">
          <span className="text-emerald-700 font-semibold hover:underline">Click to upload</span> or drag and drop Farmer Registration PDF
        </div>
        <p className="text-xs text-slate-400">
          Processed locally in your browser with WebAssembly OCR (No files sent to any server)
        </p>
      </div>
    </div>
  );
};

