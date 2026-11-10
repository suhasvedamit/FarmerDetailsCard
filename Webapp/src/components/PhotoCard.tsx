import React, { useRef } from 'react';
import { UserCheck, Image as ImageIcon, Crop, Upload, Sparkles } from 'lucide-react';
import { PhotoTransform } from '../types';

interface PhotoCardProps {
  photoUrl?: string;
  rawPhotoUrl?: string;
  photoTransform?: PhotoTransform;
  onOpenEditor: () => void;
  onPhotoUploaded: (rawUrl: string) => void;
  onResetToOriginal?: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photoUrl,
  rawPhotoUrl,
  photoTransform,
  onOpenEditor,
  onPhotoUploaded,
  onResetToOriginal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isAdjusted = Boolean(
    photoTransform &&
      (photoTransform.zoom !== 1 ||
        photoTransform.panX !== 0 ||
        photoTransform.panY !== 0 ||
        photoTransform.rotation !== 0 ||
        photoTransform.flipH)
  );

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onPhotoUploaded(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center">
          <UserCheck className="w-4 h-4 text-emerald-600 mr-2" />
          Farmer Photograph
        </h2>
        {isAdjusted && (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Adjusted</span>
          </span>
        )}
      </div>

      {/* Photo Box */}
      <div className="flex flex-col items-center">
        <div
          onClick={() => {
            if (photoUrl || rawPhotoUrl) {
              onOpenEditor();
            } else {
              fileInputRef.current?.click();
            }
          }}
          className="w-40 bg-slate-100 rounded-lg overflow-hidden border-2 border-emerald-600/30 shadow-inner flex items-center justify-center relative group transition-all cursor-pointer hover:border-emerald-600 hover:shadow-md"
          style={{ aspectRatio: '191 / 241' }}
          title={photoUrl ? 'Click to crop, resize or reposition photo' : 'Click to upload photo'}
        >
          {photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt="Farmer Portrait"
                className="w-full h-full object-cover object-bottom transition duration-200 group-hover:scale-[1.02]"
              />
              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold p-2 text-center">
                <Crop className="w-5 h-5 mb-1 text-emerald-400" />
                <span>Click to Crop & Reposition</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-slate-400 text-xs p-3 text-center">
              <ImageIcon className="w-8 h-8 mb-1.5 opacity-60" />
              <span className="font-medium text-slate-600">No Photo</span>
              <span className="text-[10px] text-emerald-600 mt-1 font-semibold underline">
                Click to upload
              </span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="w-full space-y-2 mt-3.5">
          <button
            type="button"
            onClick={onOpenEditor}
            disabled={!photoUrl && !rawPhotoUrl}
            className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 disabled:opacity-50 disabled:pointer-events-none text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Crop className="w-3.5 h-3.5 text-emerald-600" />
            <span>Crop & Reposition Photo</span>
          </button>

          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFilePicked}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition flex items-center justify-center space-x-1"
            >
              <Upload className="w-3 h-3 text-slate-500" />
              <span>{photoUrl ? 'Upload New' : 'Upload Photo'}</span>
            </button>

            {isAdjusted && onResetToOriginal && (
              <button
                type="button"
                onClick={onResetToOriginal}
                className="py-1.5 px-2.5 text-slate-500 hover:text-slate-800 text-[11px] font-semibold rounded-lg hover:bg-slate-100 transition"
                title="Reset to original photo"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
