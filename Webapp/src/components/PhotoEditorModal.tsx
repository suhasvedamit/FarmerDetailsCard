import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  ScanFace,
  Upload,
  RefreshCw,
  Check,
  Image as ImageIcon,
  FileText,
  Eye,
  Target,
} from 'lucide-react';
import { PhotoTransform, PhotoBBox } from '../types';

interface PhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  originalImageUrl?: string;
  pdfPageImageUrl?: string;
  photoBBox?: PhotoBBox;
  initialTransform?: PhotoTransform;
  farmerName?: string;
  farmerId?: string;
  onSave: (croppedDataUrl: string, rawImageUrl: string, transform: PhotoTransform) => void;
  onResetOriginal?: () => void;
}

// Fixed target aspect ratio matching the ID Card photo slot (191 x 241)
const TARGET_ASPECT = 191 / 241; // ~0.7925
const INTERNAL_CANVAS_W = 382;
const INTERNAL_CANVAS_H = 482;
const EXPORT_CANVAS_W = 764; // 4x for crystal clear 300 DPI ID card printing
const EXPORT_CANVAS_H = 964;

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  originalImageUrl,
  pdfPageImageUrl,
  photoBBox,
  initialTransform,
  farmerName,
  farmerId,
  onSave,
  onResetOriginal,
}) => {
  // Source mode: 'pdf' (whole PDF page), 'extracted' (only auto-detected photo box), 'custom' (user uploaded image)
  const [sourceMode, setSourceMode] = useState<'pdf' | 'extracted' | 'custom'>(
    pdfPageImageUrl ? 'pdf' : 'extracted'
  );

  // Active raw image URL currently loaded into the editor
  const [currentRawUrl, setCurrentRawUrl] = useState<string>('');
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);

  // Transform states
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);

  // Guide overlay states
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Live preview thumbnail data
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>('');

  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper: compute initial focus onto the photo box on the full PDF page
  const computePdfFocus = useCallback(
    (imgW: number, imgH: number, bbox?: PhotoBBox) => {
      const isRotatedQuarter = rotation === 90 || rotation === 270;
      const effW = isRotatedQuarter ? imgH : imgW;
      const effH = isRotatedQuarter ? imgW : imgH;
      const baseScale = Math.min(INTERNAL_CANVAS_W / effW, INTERNAL_CANVAS_H / effH);

      if (bbox && bbox.w > 20 && bbox.h > 20) {
        // Find scale needed for bbox to fill the crop viewport
        const targetScale = Math.max(INTERNAL_CANVAS_W / bbox.w, INTERNAL_CANVAS_H / bbox.h);
        const initZoom = Math.min(25.0, Math.max(0.5, targetScale / baseScale));
        const totalScale = baseScale * initZoom;

        const centerX = bbox.x + bbox.w / 2;
        const centerY = bbox.y + bbox.h / 2;
        const offsetX = centerX - imgW / 2;
        const offsetY = centerY - imgH / 2;

        return {
          zoom: Number(initZoom.toFixed(2)),
          panX: Math.round(-offsetX * totalScale),
          panY: Math.round(-offsetY * totalScale),
        };
      } else {
        // Default to top-right quadrant of Page 1
        const initZoom = 3.6;
        const totalScale = baseScale * initZoom;
        const centerX = imgW * 0.75;
        const centerY = imgH * 0.25;
        const offsetX = centerX - imgW / 2;
        const offsetY = centerY - imgH / 2;

        return {
          zoom: initZoom,
          panX: Math.round(-offsetX * totalScale),
          panY: Math.round(-offsetY * totalScale),
        };
      }
    },
    [rotation]
  );

  // Select initial source and transform when opening
  useEffect(() => {
    if (!isOpen) return;

    if (pdfPageImageUrl) {
      setSourceMode('pdf');
      setCurrentRawUrl(pdfPageImageUrl);
    } else {
      setSourceMode('extracted');
      setCurrentRawUrl(imageUrl || originalImageUrl || '');
    }

    if (initialTransform) {
      setZoom(initialTransform.zoom);
      setPanX(initialTransform.panX);
      setPanY(initialTransform.panY);
      setRotation(initialTransform.rotation);
      setFlipH(initialTransform.flipH || false);
    } else {
      // Will be initialized when image loads
      setRotation(0);
      setFlipH(false);
    }
  }, [isOpen, pdfPageImageUrl, imageUrl, originalImageUrl, initialTransform]);

  // Load image element from currentRawUrl
  useEffect(() => {
    if (!currentRawUrl) {
      setLoadedImage(null);
      return;
    }

    setIsLoadingImage(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImage(img);
      setIsLoadingImage(false);

      // If opening in PDF mode for the first time without prior custom transform, auto-focus on photo
      if (sourceMode === 'pdf' && !initialTransform) {
        const focus = computePdfFocus(img.naturalWidth, img.naturalHeight, photoBBox);
        setZoom(focus.zoom);
        setPanX(focus.panX);
        setPanY(focus.panY);
      } else if (sourceMode !== 'pdf' && !initialTransform) {
        setZoom(1);
        setPanX(0);
        setPanY(0);
      }
    };
    img.onerror = () => {
      console.error('Failed to load image for photo editor:', currentRawUrl);
      setIsLoadingImage(false);
    };
    img.src = currentRawUrl;
  }, [currentRawUrl, sourceMode, initialTransform, photoBBox, computePdfFocus]);

  // Calculate base scale
  const getBaseScale = useCallback(
    (img: HTMLImageElement) => {
      const isRotatedQuarter = rotation === 90 || rotation === 270;
      const rotatedW = isRotatedQuarter ? img.naturalHeight : img.naturalWidth;
      const rotatedH = isRotatedQuarter ? img.naturalWidth : img.naturalHeight;

      if (sourceMode === 'pdf') {
        // In PDF page mode, baseScale fits the full page within the canvas viewport
        return Math.min(INTERNAL_CANVAS_W / (rotatedW || 1), INTERNAL_CANVAS_H / (rotatedH || 1));
      } else {
        // In single photo mode, baseScale covers the canvas viewport
        return Math.max(INTERNAL_CANVAS_W / (rotatedW || 1), INTERNAL_CANVAS_H / (rotatedH || 1));
      }
    },
    [rotation, sourceMode]
  );

  // Redraw canvas whenever transform or guide options change
  const renderCanvas = useCallback(
    (includeGuides = true): HTMLCanvasElement | null => {
      const canvas = canvasRef.current;
      if (!canvas || !loadedImage) return null;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const cw = INTERNAL_CANVAS_W;
      const ch = INTERNAL_CANVAS_H;

      ctx.save();
      // Clear canvas with neutral light background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);

      // Clip strictly inside the card photo boundaries
      ctx.beginPath();
      ctx.rect(0, 0, cw, ch);
      ctx.clip();

      const baseScale = getBaseScale(loadedImage);
      const totalScale = baseScale * zoom;

      // Center and transform
      ctx.translate(cw / 2 + panX, ch / 2 + panY);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) {
        ctx.scale(-1, 1);
      }

      const drawW = loadedImage.naturalWidth * totalScale;
      const drawH = loadedImage.naturalHeight * totalScale;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(loadedImage, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Draw alignment guides if requested
      if (includeGuides) {
        // 3x3 Rule-of-Thirds Grid
        if (showGrid) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);

          // Vertical lines
          const x1 = cw / 3;
          const x2 = (cw / 3) * 2;
          ctx.beginPath();
          ctx.moveTo(x1, 0);
          ctx.lineTo(x1, ch);
          ctx.moveTo(x2, 0);
          ctx.lineTo(x2, ch);
          ctx.stroke();

          // Horizontal lines
          const y1 = ch / 3;
          const y2 = (ch / 3) * 2;
          ctx.beginPath();
          ctx.moveTo(0, y1);
          ctx.lineTo(cw, y1);
          ctx.moveTo(0, y2);
          ctx.lineTo(cw, y2);
          ctx.stroke();

          ctx.restore();
        }

        // Passport Face Oval Guide
        if (showFaceGuide) {
          ctx.save();
          const faceCenterX = cw / 2;
          const faceCenterY = ch * 0.44;
          const faceRadiusX = cw * 0.32;
          const faceRadiusY = ch * 0.32;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 3;

          // Oval outline
          ctx.strokeStyle = '#10b981'; // emerald
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.ellipse(faceCenterX, faceCenterY, faceRadiusX, faceRadiusY, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Eye line indicator
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          const eyeY = ch * 0.40;
          ctx.beginPath();
          ctx.moveTo(faceCenterX - faceRadiusX * 0.75, eyeY);
          ctx.lineTo(faceCenterX + faceRadiusX * 0.75, eyeY);
          ctx.stroke();

          // Chin level line
          const chinY = faceCenterY + faceRadiusY;
          ctx.beginPath();
          ctx.moveTo(faceCenterX - faceRadiusX * 0.4, chinY);
          ctx.lineTo(faceCenterX + faceRadiusX * 0.4, chinY);
          ctx.stroke();

          ctx.restore();
        }
      }

      return canvas;
    },
    [loadedImage, zoom, panX, panY, rotation, flipH, showGrid, showFaceGuide, getBaseScale]
  );

  // Redraw when states change
  useEffect(() => {
    if (loadedImage) {
      renderCanvas(true);

      // Generate a mini clean preview without guides
      const cleanCanvas = document.createElement('canvas');
      cleanCanvas.width = INTERNAL_CANVAS_W;
      cleanCanvas.height = INTERNAL_CANVAS_H;
      const cleanCtx = cleanCanvas.getContext('2d');
      if (cleanCtx && loadedImage) {
        cleanCtx.fillStyle = '#ffffff';
        cleanCtx.fillRect(0, 0, INTERNAL_CANVAS_W, INTERNAL_CANVAS_H);

        const baseScale = getBaseScale(loadedImage);
        const totalScale = baseScale * zoom;

        cleanCtx.save();
        cleanCtx.translate(INTERNAL_CANVAS_W / 2 + panX, INTERNAL_CANVAS_H / 2 + panY);
        cleanCtx.rotate((rotation * Math.PI) / 180);
        if (flipH) cleanCtx.scale(-1, 1);
        const dw = loadedImage.naturalWidth * totalScale;
        const dh = loadedImage.naturalHeight * totalScale;
        cleanCtx.drawImage(loadedImage, -dw / 2, -dh / 2, dw, dh);
        cleanCtx.restore();

        setLivePreviewUrl(cleanCanvas.toDataURL('image/jpeg', 0.85));
      }
    }
  }, [loadedImage, zoom, panX, panY, rotation, flipH, showGrid, showFaceGuide, renderCanvas, getBaseScale]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!isDragging || !canvasRef.current) return;
    e.preventDefault();

    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = INTERNAL_CANVAS_W / (rect.width || 1);

    setPanX(prev => Math.round(prev + dx * scale));
    setPanY(prev => Math.round(prev + dy * scale));

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLElement>) => {
    e.preventDefault();
    const maxZ = sourceMode === 'pdf' ? 25.0 : 8.0;
    const minZ = sourceMode === 'pdf' ? 0.1 : 0.4;
    const delta = -e.deltaY * (sourceMode === 'pdf' ? 0.005 : 0.002);
    setZoom(prev => {
      const next = Math.max(minZ, Math.min(maxZ, prev + delta));
      return Number(next.toFixed(2));
    });
  };

  // Touch pan & pinch zoom handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistanceRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (!canvasRef.current) return;

    const maxZ = sourceMode === 'pdf' ? 25.0 : 8.0;
    const minZ = sourceMode === 'pdf' ? 0.1 : 0.4;

    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      const dx = e.touches[0].clientX - lastMousePosRef.current.x;
      const dy = e.touches[0].clientY - lastMousePosRef.current.y;

      const rect = canvasRef.current.getBoundingClientRect();
      const scale = INTERNAL_CANVAS_W / (rect.width || 1);

      setPanX(prev => Math.round(prev + dx * scale));
      setPanY(prev => Math.round(prev + dy * scale));

      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const diff = (currentDist - touchDistanceRef.current) * 0.005;

      setZoom(prev => {
        const next = Math.max(minZ, Math.min(maxZ, prev + diff));
        return Number(next.toFixed(2));
      });
      touchDistanceRef.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Nudge controls
  const nudge = (dx: number, dy: number) => {
    setPanX(prev => prev + dx);
    setPanY(prev => prev + dy);
  };

  const centerPhoto = () => {
    setPanX(0);
    setPanY(0);
  };

  // Rotation controls
  const rotateClockwise = () => setRotation(prev => (prev + 90) % 360);
  const rotateCounterClockwise = () => setRotation(prev => (prev - 90 + 360) % 360);
  const toggleFlip = () => setFlipH(prev => !prev);

  // Switch between Whole PDF Page vs Extracted Photo
  const handleSwitchSource = (mode: 'pdf' | 'extracted') => {
    if (mode === 'pdf' && pdfPageImageUrl) {
      setSourceMode('pdf');
      setCurrentRawUrl(pdfPageImageUrl);
      setRotation(0);
      setFlipH(false);
    } else if (mode === 'extracted' && (imageUrl || originalImageUrl)) {
      setSourceMode('extracted');
      setCurrentRawUrl(imageUrl || originalImageUrl || '');
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      setFlipH(false);
    }
  };

  // Focus directly onto the detected photo area on the PDF page
  const handleFocusDetectedPhoto = () => {
    if (!loadedImage || sourceMode !== 'pdf') return;
    const focus = computePdfFocus(loadedImage.naturalWidth, loadedImage.naturalHeight, photoBBox);
    setZoom(focus.zoom);
    setPanX(focus.panX);
    setPanY(focus.panY);
    setRotation(0);
    setFlipH(false);
  };

  // Fit the whole PDF page in the frame
  const handleFitWholePage = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setFlipH(false);
  };

  // Click on minimap to jump to that coordinate on the PDF page
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current || !loadedImage || sourceMode !== 'pdf') return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = rect.width / loadedImage.naturalWidth;
    const scaleY = rect.height / loadedImage.naturalHeight;

    const targetPageX = clickX / (scaleX || 1);
    const targetPageY = clickY / (scaleY || 1);

    const baseScale = getBaseScale(loadedImage);
    const totalScale = baseScale * zoom;

    setPanX(Math.round(-(targetPageX - loadedImage.naturalWidth / 2) * totalScale));
    setPanY(Math.round(-(targetPageY - loadedImage.naturalHeight / 2) * totalScale));
  };

  // Upload custom photo from disk
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSourceMode('custom');
        setCurrentRawUrl(reader.result);
        setZoom(1);
        setPanX(0);
        setPanY(0);
        setRotation(0);
        setFlipH(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Revert back to original PDF photo
  const handleRevertToOriginal = () => {
    if (pdfPageImageUrl) {
      handleSwitchSource('pdf');
    } else if (originalImageUrl) {
      handleSwitchSource('extracted');
    }
    if (onResetOriginal) onResetOriginal();
  };

  // High resolution export & save
  const handleApply = () => {
    if (!loadedImage) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = EXPORT_CANVAS_W;
    exportCanvas.height = EXPORT_CANVAS_H;
    const eCtx = exportCanvas.getContext('2d');
    if (!eCtx) return;

    eCtx.fillStyle = '#ffffff';
    eCtx.fillRect(0, 0, EXPORT_CANVAS_W, EXPORT_CANVAS_H);

    const baseScale = getBaseScale(loadedImage);
    const totalScale = baseScale * zoom;

    // Pan factor scaled from internal canvas to high-res export canvas
    const factor = EXPORT_CANVAS_W / INTERNAL_CANVAS_W;

    eCtx.save();
    eCtx.translate(EXPORT_CANVAS_W / 2 + panX * factor, EXPORT_CANVAS_H / 2 + panY * factor);
    eCtx.rotate((rotation * Math.PI) / 180);
    if (flipH) {
      eCtx.scale(-1, 1);
    }

    const edw = loadedImage.naturalWidth * totalScale * factor;
    const edh = loadedImage.naturalHeight * totalScale * factor;

    eCtx.imageSmoothingEnabled = true;
    eCtx.imageSmoothingQuality = 'high';
    eCtx.drawImage(loadedImage, -edw / 2, -edh / 2, edw, edh);
    eCtx.restore();

    const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
    onSave(croppedDataUrl, currentRawUrl, { zoom, panX, panY, rotation, flipH });
    onClose();
  };

  if (!isOpen) return null;

  const maxZoomValue = sourceMode === 'pdf' ? 25.0 : 8.0;
  const minZoomValue = sourceMode === 'pdf' ? 0.1 : 0.4;

  const getZoomStep = (currentZoom: number) => {
    if (currentZoom >= 10) return 1.0;
    if (currentZoom >= 4) return 0.5;
    if (currentZoom >= 1) return 0.25;
    return 0.1;
  };

  // Calculate minimap crop frame rectangle if loadedImage exists and is in PDF mode
  let minimapBox: { left: string; top: string; width: string; height: string } | null = null;
  if (loadedImage && sourceMode === 'pdf') {
    const baseScale = getBaseScale(loadedImage);
    const totalScale = baseScale * zoom;
    const mappedCenterX = loadedImage.naturalWidth / 2 - panX / totalScale;
    const mappedCenterY = loadedImage.naturalHeight / 2 - panY / totalScale;
    const viewW = INTERNAL_CANVAS_W / totalScale;
    const viewH = INTERNAL_CANVAS_H / totalScale;

    const leftPct = ((mappedCenterX - viewW / 2) / loadedImage.naturalWidth) * 100;
    const topPct = ((mappedCenterY - viewH / 2) / loadedImage.naturalHeight) * 100;
    const widthPct = (viewW / loadedImage.naturalWidth) * 100;
    const heightPct = (viewH / loadedImage.naturalHeight) * 100;

    minimapBox = {
      left: `${Math.max(0, leftPct)}%`,
      top: `${Math.max(0, topPct)}%`,
      width: `${Math.min(100, widthPct)}%`,
      height: `${Math.min(100, heightPct)}%`,
    };
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-base">Crop & Adjust Farmer Photo</h3>
                {sourceMode === 'pdf' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <FileText className="w-3 h-3 text-emerald-600" />
                    <span>Whole PDF Document Mode</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Crop directly from the complete document page so no part of the head or shoulders is clipped.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Mode Selector Banner if PDF is available */}
        {pdfPageImageUrl && (
          <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">Document Source:</span>
              <button
                type="button"
                onClick={() => handleSwitchSource('pdf')}
                className={`px-3 py-1 rounded-md font-bold transition flex items-center space-x-1.5 ${
                  sourceMode === 'pdf'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Whole PDF Page (Recommended)</span>
              </button>
              {(imageUrl || originalImageUrl) && (
                <button
                  type="button"
                  onClick={() => handleSwitchSource('extracted')}
                  className={`px-3 py-1 rounded-md font-bold transition flex items-center space-x-1.5 ${
                    sourceMode === 'extracted'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Auto-Detected Box Only</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              {sourceMode === 'pdf' && (
                <>
                  <button
                    type="button"
                    onClick={handleFocusDetectedPhoto}
                    className="text-[11px] text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 font-bold px-2.5 py-1 rounded-md transition flex items-center space-x-1"
                    title="Jump directly to the detected photo box on the PDF page"
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Focus Photo Box</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFitWholePage}
                    className="text-[11px] text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 font-semibold px-2.5 py-1 rounded-md transition flex items-center space-x-1"
                    title="Zoom out to see the entire PDF registration form"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Entire Page</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Canvas Viewport */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative bg-slate-900 rounded-2xl p-4 shadow-inner border border-slate-800 flex flex-col items-center w-full">
                {/* Viewport Frame with exact ID Card Aspect Ratio */}
                <div
                  className={`relative overflow-hidden rounded-xl border-2 border-emerald-500/80 shadow-2xl bg-slate-950 touch-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    width: '100%',
                    maxWidth: '286px',
                    aspectRatio: `${TARGET_ASPECT}`,
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {isLoadingImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                      <span>Loading full document page...</span>
                    </div>
                  ) : currentRawUrl ? (
                    <canvas
                      ref={canvasRef}
                      width={INTERNAL_CANVAS_W}
                      height={INTERNAL_CANVAS_H}
                      className="w-full h-full block"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                      <p className="font-medium">No document or photo loaded</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Upload Photo
                      </button>
                    </div>
                  )}

                  {/* Floating guide hint pill */}
                  {currentRawUrl && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-slate-200 text-[10px] px-2.5 py-1 rounded-full shadow pointer-events-none border border-slate-700/60 flex items-center space-x-1 whitespace-nowrap">
                      <span>🖐️ Drag across document</span>
                      <span className="opacity-40">•</span>
                      <span>🔍 Scroll to zoom</span>
                    </div>
                  )}
                </div>

                {/* Micro Nudge & Re-center D-pad below canvas */}
                <div className="mt-3.5 flex items-center justify-between w-full max-w-[286px] px-1">
                  <span className="text-[11px] font-medium text-slate-400 flex items-center">
                    Micro Nudge:
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => nudge(-8, 0)}
                      title="Move Left"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition shadow-sm active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => nudge(0, -8)}
                      title="Move Up"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition shadow-sm active:scale-95"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={centerPhoto}
                      title="Center Photo"
                      className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-md transition shadow-sm active:scale-95"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => nudge(0, 8)}
                      title="Move Down"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition shadow-sm active:scale-95"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => nudge(8, 0)}
                      title="Move Right"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition shadow-sm active:scale-95"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Controls, Minimap & Live Card Preview */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              {/* Zoom & Scale Slider */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zoom & Scale</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setZoom(prev => Math.max(minZoomValue, Number((prev - getZoomStep(prev)).toFixed(2))))}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min={minZoomValue}
                    max={maxZoomValue}
                    step="0.05"
                    value={zoom}
                    onChange={e => setZoom(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <button
                    onClick={() => setZoom(prev => Math.min(maxZoomValue, Number((prev + getZoomStep(prev)).toFixed(2))))}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {sourceMode === 'pdf' ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-semibold text-slate-600">
                    <span className="text-[10px] text-slate-400 mr-0.5">Presets:</span>
                    <button
                      type="button"
                      onClick={handleFitWholePage}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      Fit Page
                    </button>
                    <button
                      type="button"
                      onClick={handleFocusDetectedPhoto}
                      className="px-2 py-0.5 rounded bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold transition"
                    >
                      Photo Box
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(6.0)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      600%
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(12.0)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      1200%
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(20.0)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      2000%
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-semibold text-slate-600">
                    <span className="text-[10px] text-slate-400 mr-0.5">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setPanX(0);
                        setPanY(0);
                      }}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      Fit (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(1.5)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      150%
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(3.0)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      300%
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(5.0)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      500%
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(8.0)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition"
                    >
                      800%
                    </button>
                  </div>
                )}
              </div>

              {/* PDF Document Page Minimap / Overview */}
              {sourceMode === 'pdf' && pdfPageImageUrl && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Whole PDF Page Overview</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Click anywhere to jump</span>
                  </div>

                  <div className="flex items-center justify-center">
                    <div
                      ref={minimapRef}
                      onClick={handleMinimapClick}
                      className="relative border-2 border-slate-300 rounded-lg overflow-hidden shadow-sm cursor-crosshair bg-white hover:border-emerald-500 transition select-none"
                      style={{ width: '130px', aspectRatio: '1 / 1.414' }}
                      title="Click anywhere on the document to focus the crop frame"
                    >
                      <img
                        src={pdfPageImageUrl}
                        alt="PDF Page 1 Thumbnail"
                        className="w-full h-full object-cover pointer-events-none opacity-85"
                      />

                      {/* Active Crop Frame highlight overlay */}
                      {minimapBox && (
                        <div
                          className="absolute border-2 border-emerald-600 bg-emerald-500/30 rounded-sm pointer-events-none shadow"
                          style={{
                            left: minimapBox.left,
                            top: minimapBox.top,
                            width: minimapBox.width,
                            height: minimapBox.height,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Orientation & Guides */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">Rotate & Flip</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={rotateCounterClockwise}
                      className="flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>-90°</span>
                    </button>
                    <button
                      onClick={rotateClockwise}
                      className="flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>+90°</span>
                    </button>
                    <button
                      onClick={toggleFlip}
                      className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 border text-xs font-semibold rounded-lg shadow-sm transition ${
                        flipH
                          ? 'bg-emerald-100/80 border-emerald-400 text-emerald-800'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span>Flip</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">Alignment Guides</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowFaceGuide(!showFaceGuide)}
                      className={`flex items-center justify-center space-x-1.5 px-2.5 py-1.5 border text-xs font-semibold rounded-lg transition ${
                        showFaceGuide
                          ? 'bg-emerald-100/80 border-emerald-400 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <ScanFace className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Face Oval</span>
                    </button>
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      className={`flex items-center justify-center space-x-1.5 px-2.5 py-1.5 border text-xs font-semibold rounded-lg transition ${
                        showGrid
                          ? 'bg-emerald-100/80 border-emerald-400 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>3x3 Grid</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live ID Card Preview Thumbnail */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block mr-1"></span>
                    Live Card Result
                  </span>
                  <span className="text-[10px] text-slate-500">Real-time appearance</span>
                </div>

                <div className="bg-white rounded-lg p-2.5 border border-slate-200 shadow-sm flex items-center space-x-3">
                  {/* Photo thumbnail inside card mini box */}
                  <div
                    className="w-14 bg-slate-100 rounded-md overflow-hidden border border-emerald-700 shadow-inner flex-shrink-0"
                    style={{ aspectRatio: `${TARGET_ASPECT}` }}
                  >
                    {livePreviewUrl ? (
                      <img src={livePreviewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">
                        Preview
                      </div>
                    )}
                  </div>
                  <div className="text-xs overflow-hidden space-y-0.5">
                    <p className="font-bold text-slate-800 truncate text-[11px]">
                      {farmerName || 'Farmer Name'}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-800 font-semibold truncate">
                      ID: {farmerId || 'IDFARMER123'}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Crop directly from the document to include full head & shoulders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Source Photo Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Different Image</span>
                </button>

                {sourceMode === 'custom' && (
                  <button
                    onClick={handleRevertToOriginal}
                    className="px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    Revert to PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 hidden sm:block">
            {sourceMode === 'pdf'
              ? 'Cropping from full 250 DPI PDF document page for maximum print sharpness.'
              : 'Changes apply directly to your generated card preview and downloads.'}
          </p>
          <div className="flex items-center space-x-2.5 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!currentRawUrl}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
