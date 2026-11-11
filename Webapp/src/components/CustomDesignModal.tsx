import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Download,
  Eye,
  Grid,
  Image as ImageIcon,
  Layers,
  Palette,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CARD_CANVAS_HEIGHT,
  CARD_CANVAS_WIDTH,
  CardSide,
  CardTemplate,
  CustomBackMode,
  ImageFitMode,
  getCustomCardTemplates,
} from '../lib/cardTemplates';
import {
  createBlankCardBackground,
  downloadCardLayoutGuidePng,
  drawSafeZonesOverlay,
  readImageFileAsDataUrl,
  renderFittedCardBackground,
} from '../lib/customDesignUtils';
import {
  deleteAndUnregisterCustomTemplate,
  saveAndRegisterCustomTemplate,
} from '../lib/customTemplatesStorage';
import { generateBackCardCanvas, generateFrontCardCanvas } from '../lib/cardGenerator';
import { SAMPLE_FARMER_RECORD } from '../lib/samplePreview';
import { FarmerRecord } from '../types';

interface CustomDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate?: CardTemplate | null;
  previewRecord?: FarmerRecord;
  onSaveSuccess: (savedTemplate: CardTemplate) => void;
  onDeleted?: (deletedTemplateId: string) => void;
}

interface ImageDropSlotProps {
  label: string;
  imageUrl: string;
  dimensionsLabel?: string;
  fitMode: ImageFitMode;
  onFitModeChange: (mode: ImageFitMode) => void;
  onFileSelected: (file: File) => void;
  onClear?: () => void;
  helperText?: string;
}

const FIT_MODE_OPTIONS: { value: ImageFitMode; label: string; title: string }[] = [
  { value: 'cover', label: 'Cover', title: 'Scale to fill entire card without stretching' },
  { value: 'contain', label: 'Fit Inside', title: 'Show full image with padding if needed' },
  { value: 'stretch', label: 'Stretch', title: 'Stretch edges to exact 1050×660 dimensions' },
];

const BORDER_PRESETS: { label: string; value: string; swatchClass: string }[] = [
  { label: 'Emerald', value: '#15803d', swatchClass: 'bg-emerald-700' },
  { label: 'Slate', value: '#334155', swatchClass: 'bg-slate-700' },
  { label: 'Gold', value: '#b45309', swatchClass: 'bg-amber-700' },
  { label: 'None', value: 'none', swatchClass: 'bg-white border-dashed border-slate-400' },
];

function hasNonEmptyRecordFields(record?: FarmerRecord): boolean {
  if (!record) return false;
  return Boolean(
    record.farmer_name?.trim() ||
      record.farmer_id?.trim() ||
      record.mobile_number?.trim() ||
      record.address?.trim() ||
      record.photo_url
  );
}

const DesignImageDropSlot: React.FC<ImageDropSlotProps> = ({
  label,
  imageUrl,
  dimensionsLabel,
  fitMode,
  onFitModeChange,
  onFileSelected,
  onClear,
  helperText,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = '';
        }}
      />

      {imageUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border p-2.5 bg-white transition ${
            isDragOver ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={imageUrl}
              alt={label}
              className="w-20 h-[50px] rounded-lg border border-slate-200 object-cover bg-slate-50 flex-shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 truncate">{label}</span>
                {dimensionsLabel && (
                  <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                    {dimensionsLabel}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                >
                  Replace
                </button>
                {onClear && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="px-2 py-1 rounded-md text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Image Fit Mode Pills */}
          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">Image Fit:</span>
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {FIT_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.title}
                  onClick={() => onFitModeChange(opt.value)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    fitMode === opt.value
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
            isDragOver
              ? 'border-emerald-600 bg-emerald-50/70'
              : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-700">
              <span className="text-emerald-700 underline">Choose image</span> or drag &amp; drop
            </div>
            <p className="text-[10px] text-slate-500">
              {helperText || 'PNG, JPG, WebP or SVG • Recommended 1050×660 px (CR80)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

async function renderBlankBackgroundOnlyPreview(
  bgUrl: string,
  side: CardSide,
  textTheme: 'dark' | 'light',
  contentBackdrop: 'none' | 'light' | 'dark',
  borderColor: string,
  showSafeZones: boolean
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_CANVAS_WIDTH;
  canvas.height = CARD_CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = textTheme === 'light' ? '#0f172a' : '#ffffff';
  ctx.fillRect(0, 0, CARD_CANVAS_WIDTH, CARD_CANVAS_HEIGHT);

  if (bgUrl) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = bgUrl;
      });
      ctx.drawImage(img, 0, 0, CARD_CANVAS_WIDTH, CARD_CANVAS_HEIGHT);
    } catch {
      // ignore preview decode glitch
    }
  }

  if (contentBackdrop === 'light' || contentBackdrop === 'dark') {
    const isLightPanel = contentBackdrop === 'light';
    ctx.save();
    ctx.fillStyle = isLightPanel ? 'rgba(255, 255, 255, 0.86)' : 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = isLightPanel ? 'rgba(226, 232, 240, 0.9)' : 'rgba(51, 65, 85, 0.85)';
    ctx.lineWidth = 1.5;
    const bx = side === 'front' ? 10 : 32;
    const bw = side === 'front' ? 1030 : 986;
    const bh = side === 'front' ? 472 : 452;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(bx, 130, bw, bh, 16);
    } else {
      ctx.rect(bx, 130, bw, bh);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (borderColor !== 'none') {
    ctx.save();
    ctx.strokeStyle = borderColor || '#15803d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(2, 2, CARD_CANVAS_WIDTH - 4, CARD_CANVAS_HEIGHT - 4, 20);
    } else {
      ctx.rect(2, 2, CARD_CANVAS_WIDTH - 4, CARD_CANVAS_HEIGHT - 4);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (showSafeZones) {
    drawSafeZonesOverlay(ctx, CARD_CANVAS_WIDTH, CARD_CANVAS_HEIGHT, side);
  }

  return canvas;
}

export const CustomDesignModal: React.FC<CustomDesignModalProps> = ({
  isOpen,
  onClose,
  editingTemplate,
  previewRecord,
  onSaveSuccess,
  onDeleted,
}) => {
  const [designName, setDesignName] = useState('');
  const [frontRawUrl, setFrontRawUrl] = useState('');
  const [frontDimensions, setFrontDimensions] = useState('');
  const [frontFitMode, setFrontFitMode] = useState<ImageFitMode>('cover');

  const [backMode, setBackMode] = useState<CustomBackMode>('separate');
  const [backRawUrl, setBackRawUrl] = useState('');
  const [backDimensions, setBackDimensions] = useState('');
  const [backFitMode, setBackFitMode] = useState<ImageFitMode>('cover');

  const [textTheme, setTextTheme] = useState<'dark' | 'light'>('dark');
  const [contentBackdrop, setContentBackdrop] = useState<'none' | 'light' | 'dark'>('none');
  const [borderColor, setBorderColor] = useState<string>('#15803d');

  const [fittedFrontUrl, setFittedFrontUrl] = useState('');
  const [fittedBackUrl, setFittedBackUrl] = useState('');
  const [previewSide, setPreviewSide] = useState<CardSide>('front');
  const [showSampleData, setShowSampleData] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState('');
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Initialize form state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);
    setConfirmDelete(false);
    setPreviewSide('front');

    if (editingTemplate) {
      setDesignName(editingTemplate.name);
      setFrontRawUrl(editingTemplate.rawFrontUrl || editingTemplate.frontUrl || '');
      setFrontDimensions('');
      setFrontFitMode(editingTemplate.customStyle?.frontFitMode || 'cover');

      const resolvedBackMode: CustomBackMode =
        editingTemplate.customStyle?.backMode ||
        (editingTemplate.hasSeparateBack ? 'separate' : 'same_as_front');
      setBackMode(resolvedBackMode);
      setBackRawUrl(
        resolvedBackMode === 'separate'
          ? editingTemplate.rawBackUrl || editingTemplate.backUrl || ''
          : ''
      );
      setBackDimensions('');
      setBackFitMode(editingTemplate.customStyle?.backFitMode || 'cover');

      setTextTheme(editingTemplate.customStyle?.textTheme || 'dark');
      setContentBackdrop(editingTemplate.customStyle?.contentBackdrop || 'none');
      setBorderColor(editingTemplate.customStyle?.borderColor ?? '#15803d');
    } else {
      const nextIndex = getCustomCardTemplates().length + 1;
      setDesignName(`Custom Design ${nextIndex}`);
      setFrontRawUrl('');
      setFrontDimensions('');
      setFrontFitMode('cover');
      setBackMode('separate');
      setBackRawUrl('');
      setBackDimensions('');
      setBackFitMode('cover');
      setTextTheme('dark');
      setContentBackdrop('none');
      setBorderColor('#15803d');
    }
  }, [isOpen, editingTemplate]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Re-fit Front background image whenever source/fit/theme changes
  useEffect(() => {
    if (!isOpen) return;
    if (!frontRawUrl) {
      setFittedFrontUrl('');
      return;
    }

    let cancelled = false;
    const fill = textTheme === 'light' ? '#0f172a' : '#ffffff';
    renderFittedCardBackground(frontRawUrl, frontFitMode, fill)
      .then((url) => {
        if (!cancelled) setFittedFrontUrl(url);
      })
      .catch((err) => {
        console.warn('Front fit error:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, frontRawUrl, frontFitMode, textTheme]);

  // Re-fit Back background image whenever back mode/source/fit/theme changes
  useEffect(() => {
    if (!isOpen) return;

    if (backMode === 'same_as_front') {
      setFittedBackUrl(fittedFrontUrl);
      return;
    }

    if (backMode === 'blank' || !backRawUrl) {
      setFittedBackUrl(createBlankCardBackground(textTheme));
      return;
    }

    let cancelled = false;
    const fill = textTheme === 'light' ? '#0f172a' : '#ffffff';
    renderFittedCardBackground(backRawUrl, backFitMode, fill)
      .then((url) => {
        if (!cancelled) setFittedBackUrl(url);
      })
      .catch((err) => {
        console.warn('Back fit error:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, backMode, backRawUrl, backFitMode, fittedFrontUrl, textTheme]);

  // Render live card canvas preview
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const renderPreview = async () => {
      setIsRenderingPreview(true);
      try {
        const blankFallback = createBlankCardBackground(textTheme);
        const resolvedFront = fittedFrontUrl || blankFallback;
        const resolvedBack =
          backMode === 'same_as_front'
            ? resolvedFront
            : fittedBackUrl || blankFallback;

        const activeBg = previewSide === 'back' ? resolvedBack : resolvedFront;

        if (!showSampleData) {
          const canvas = await renderBlankBackgroundOnlyPreview(
            activeBg,
            previewSide,
            textTheme,
            contentBackdrop,
            borderColor,
            showSafeZones
          );
          if (!cancelled) {
            setLivePreviewUrl(canvas.toDataURL('image/png'));
          }
          return;
        }

        const tempTemplate: CardTemplate = {
          id: '__preview_custom__',
          name: designName || 'Custom Design',
          folderName: '__preview_custom__',
          frontUrl: resolvedFront,
          backUrl: resolvedBack,
          url: resolvedFront,
          hasSeparateBack: backMode !== 'same_as_front',
          isCustom: true,
          customStyle: {
            textTheme,
            contentBackdrop,
            borderColor,
            frontFitMode,
            backFitMode,
            backMode,
          },
        };

        const activeRecord = hasNonEmptyRecordFields(previewRecord)
          ? previewRecord!
          : SAMPLE_FARMER_RECORD;

        const canvas =
          previewSide === 'back'
            ? await generateBackCardCanvas(activeRecord, undefined, {
                templateOverride: tempTemplate,
                showSafeZones,
              })
            : await generateFrontCardCanvas(activeRecord, undefined, {
                templateOverride: tempTemplate,
                showSafeZones,
              });

        if (!cancelled) {
          setLivePreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.warn('Custom preview render warning:', err);
      } finally {
        if (!cancelled) {
          setIsRenderingPreview(false);
        }
      }
    };

    renderPreview();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    previewSide,
    fittedFrontUrl,
    fittedBackUrl,
    backMode,
    textTheme,
    contentBackdrop,
    borderColor,
    frontFitMode,
    backFitMode,
    showSampleData,
    showSafeZones,
    designName,
    previewRecord,
  ]);

  if (!isOpen) return null;

  const handleFrontFile = async (file: File) => {
    setErrorMessage(null);
    try {
      const loaded = await readImageFileAsDataUrl(file);
      setFrontRawUrl(loaded.dataUrl);
      setFrontDimensions(`${loaded.width} × ${loaded.height} px`);
      setPreviewSide('front');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not load front image.');
    }
  };

  const handleBackFile = async (file: File) => {
    setErrorMessage(null);
    try {
      const loaded = await readImageFileAsDataUrl(file);
      setBackRawUrl(loaded.dataUrl);
      setBackDimensions(`${loaded.width} × ${loaded.height} px`);
      setBackMode('separate');
      setPreviewSide('back');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not load back image.');
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);

    if (!frontRawUrl) {
      setErrorMessage('Please upload a Front side background image for your custom design.');
      return;
    }

    if (backMode === 'separate' && !backRawUrl) {
      setErrorMessage(
        'Please upload a Back side image, or choose "Same as Front" / "Clean Blank".'
      );
      return;
    }

    setIsSaving(true);
    try {
      const fill = textTheme === 'light' ? '#0f172a' : '#ffffff';
      const finalFrontUrl =
        fittedFrontUrl || (await renderFittedCardBackground(frontRawUrl, frontFitMode, fill));

      let finalBackUrl = finalFrontUrl;
      if (backMode === 'blank') {
        finalBackUrl = createBlankCardBackground(textTheme);
      } else if (backMode === 'separate' && backRawUrl) {
        finalBackUrl =
          fittedBackUrl || (await renderFittedCardBackground(backRawUrl, backFitMode, fill));
      }

      const now = Date.now();
      const id =
        editingTemplate?.id ||
        `custom_${now}_${Math.random().toString(36).substring(2, 7)}`;

      const savedTemplate: CardTemplate = {
        id,
        name: designName.trim() || 'Custom Card Design',
        folderName: id,
        frontUrl: finalFrontUrl,
        backUrl: finalBackUrl,
        url: finalFrontUrl,
        hasSeparateBack: backMode === 'separate' || backMode === 'blank',
        isCustom: true,
        createdAt: editingTemplate?.createdAt || now,
        updatedAt: now,
        rawFrontUrl: frontRawUrl,
        rawBackUrl: backMode === 'separate' ? backRawUrl : undefined,
        customStyle: {
          textTheme,
          contentBackdrop,
          borderColor,
          frontFitMode,
          backFitMode,
          backMode,
        },
      };

      await saveAndRegisterCustomTemplate(savedTemplate);
      onSaveSuccess(savedTemplate);
      onClose();
    } catch (err: any) {
      console.error('Failed to save custom design:', err);
      setErrorMessage(
        err?.message ||
          'Could not save custom design in browser storage. Try a smaller image.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTemplate) return;
    setIsSaving(true);
    try {
      await deleteAndUnregisterCustomTemplate(editingTemplate.id);
      onDeleted?.(editingTemplate.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete custom design.');
    } finally {
      setIsSaving(false);
    }
  };

  const customBorderValue =
    borderColor !== 'none' && borderColor.startsWith('#') ? borderColor : '#15803d';

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-[70] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-design-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3
                id="custom-design-modal-title"
                className="font-extrabold text-slate-900 text-sm sm:text-base truncate"
              >
                {editingTemplate ? 'Edit Custom Card Design' : 'Upload Your Custom Card Design'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                Upload Front &amp; Back background artwork (CR80 1050×660) and preview live with card details
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={downloadCardLayoutGuidePng}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              title="Download PNG layout guide with exact safe zones for Canva / Photoshop / CorelDraw"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Download Layout Guide</span>
              <span className="sm:hidden">Guide</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close modal"
              className="text-slate-400 hover:text-slate-700 rounded-lg p-1.5 hover:bg-slate-200/70 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Controls & Uploads */}
            <div className="lg:col-span-5 space-y-4">
              {/* Design Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="custom-design-name"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Design Name
                </label>
                <input
                  id="custom-design-name"
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  maxLength={40}
                  placeholder="e.g. My Shop Green Card"
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              {/* Front Side Upload */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Front Side Design (समोरील)</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                </div>

                <DesignImageDropSlot
                  label="Front Background"
                  imageUrl={frontRawUrl}
                  dimensionsLabel={frontDimensions}
                  fitMode={frontFitMode}
                  onFitModeChange={setFrontFitMode}
                  onFileSelected={handleFrontFile}
                  onClear={() => {
                    setFrontRawUrl('');
                    setFrontDimensions('');
                  }}
                />
              </div>

              {/* Back Side Upload / Mode */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Back Side Design (मागील)</span>
                  </span>
                </div>

                {/* Back Mode Selector */}
                <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setBackMode('separate');
                      setPreviewSide('back');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      backMode === 'separate'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Upload Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBackMode('same_as_front');
                      setPreviewSide('back');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      backMode === 'same_as_front'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Same as Front
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBackMode('blank');
                      setPreviewSide('back');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      backMode === 'blank'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Clean Blank
                  </button>
                </div>

                {backMode === 'separate' && (
                  <DesignImageDropSlot
                    label="Back Background"
                    imageUrl={backRawUrl}
                    dimensionsLabel={backDimensions}
                    fitMode={backFitMode}
                    onFitModeChange={setBackFitMode}
                    onFileSelected={handleBackFile}
                    onClear={() => {
                      setBackRawUrl('');
                      setBackDimensions('');
                    }}
                    helperText="Upload separate artwork for Land & Bank details side"
                  />
                )}

                {backMode === 'same_as_front' && (
                  <p className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2">
                    Your Front background artwork will automatically be used on the Back side too.
                  </p>
                )}

                {backMode === 'blank' && (
                  <p className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2">
                    Uses a clean solid card back so Land &amp; Bank tables stay crisp and uncluttered.
                  </p>
                )}
              </div>

              {/* Text & Card Appearance Options */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Text Contrast &amp; Card Border</span>
                </div>

                {/* Text Color Theme */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">Text Color:</span>
                  <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTextTheme('dark')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        textTheme === 'dark'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dark Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextTheme('light')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        textTheme === 'light'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Light Text
                    </button>
                  </div>
                </div>

                {/* Content Readability Backdrop */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Readability Panel:
                  </span>
                  <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200">
                    {(
                      [
                        { value: 'none', label: 'None' },
                        { value: 'light', label: 'White' },
                        { value: 'dark', label: 'Dark' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setContentBackdrop(opt.value)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                          contentBackdrop === opt.value
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outer Border Color */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">Card Border:</span>
                  <div className="flex items-center gap-1.5">
                    {BORDER_PRESETS.map((preset) => {
                      const active = borderColor.toLowerCase() === preset.value.toLowerCase();
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setBorderColor(preset.value)}
                          title={preset.label}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border flex items-center space-x-1 transition cursor-pointer ${
                            active
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/30'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full border border-slate-300 ${preset.swatchClass}`}
                          />
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                    <label
                      className="w-6 h-6 rounded-md border border-slate-300 bg-white flex items-center justify-center cursor-pointer overflow-hidden shadow-sm"
                      title="Pick custom border color"
                    >
                      <input
                        type="color"
                        value={customBorderValue}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-8 h-8 border-0 p-0 cursor-pointer"
                        aria-label="Custom card border color"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Card Preview Studio */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              {/* Preview Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="inline-flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewSide('front')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      previewSide === 'front'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Front Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSide('back')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                      previewSide === 'back'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Back Side</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSampleData((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition flex items-center space-x-1 cursor-pointer ${
                      showSampleData
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Fields</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSafeZones((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition flex items-center space-x-1 cursor-pointer ${
                      showSafeZones
                        ? 'bg-sky-50 border-sky-300 text-sky-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Safe Zones</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Canvas Stage */}
              <div className="flex-1 bg-gradient-to-b from-slate-100 to-slate-200/80 rounded-2xl border border-slate-200 p-3 sm:p-5 flex flex-col items-center justify-center relative min-h-[260px]">
                {livePreviewUrl ? (
                  <div className="w-full relative flex items-center justify-center">
                    <img
                      src={livePreviewUrl}
                      alt={`Custom Card Preview - ${previewSide}`}
                      className={`w-full max-w-[660px] rounded-xl shadow-xl border border-slate-300/80 object-contain transition-opacity duration-150 ${
                        isRenderingPreview ? 'opacity-65' : 'opacity-100'
                      }`}
                      style={{ aspectRatio: '1050 / 660' }}
                    />
                    {!frontRawUrl && previewSide === 'front' && (
                      <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
                        <span className="px-3 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-semibold shadow backdrop-blur-sm">
                          Upload a Front image on the left to replace this blank preview
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="w-full max-w-[660px] rounded-xl bg-white/70 border border-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500"
                    style={{ aspectRatio: '1050 / 660' }}
                  >
                    Rendering card preview...
                  </div>
                )}
              </div>

              {/* Helpful Alignment Tip */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-[11px] text-emerald-900 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Design Tip:</strong> Standard card size is <strong>1050 × 660 px</strong>{' '}
                  (CR80 85.6 × 54 mm). Toggle <strong>Safe Zones</strong> above or{' '}
                  <strong>Download Layout Guide</strong> to make sure your header/footer artwork does not overlap the farmer photo, details, or QR code.
                </p>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs text-rose-800 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span className="font-semibold">{errorMessage}</span>
                  </div>
                  {backMode === 'separate' && !backRawUrl && frontRawUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setBackMode('same_as_front');
                        setErrorMessage(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 text-[11px] font-bold hover:bg-rose-100 whitespace-nowrap cursor-pointer"
                    >
                      Use Same as Front
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {editingTemplate && (
              confirmDelete ? (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1">
                  <span className="text-[11px] font-bold text-rose-800">Delete design?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isSaving}
                    className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 text-[11px] font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Design</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center space-x-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !frontRawUrl}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/15 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Saving...'
                  : editingTemplate
                    ? 'Save Changes & Apply'
                    : 'Save & Use Design'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
