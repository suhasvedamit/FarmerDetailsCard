import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  ChevronDown,
  Image as ImageIcon,
  Pencil,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  CardTemplate,
  DEFAULT_CARD_TEMPLATE_ID,
  getCardTemplate,
  useCardTemplates,
} from '../lib/cardTemplates';
import { FarmerRecord } from '../types';
import { CustomDesignModal } from './CustomDesignModal';

interface BackgroundSelectorProps {
  selectedTemplateId: string;
  onChange: (templateId: string) => void;
  previewRecord?: FarmerRecord;
  showQuickCustomButton?: boolean;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedTemplateId,
  onChange,
  previewRecord,
  showQuickCustomButton = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { all: allTemplates, builtIn: builtInTemplates, custom: customTemplates } =
    useCardTemplates();
  const selectedTemplate = getCardTemplate(selectedTemplateId);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (templateId: string) => {
    onChange(templateId);
    setIsOpen(false);
  };

  const openCreateCustom = () => {
    setIsOpen(false);
    setEditingTemplate(null);
    setIsCustomModalOpen(true);
  };

  const openEditCustom = (template: CardTemplate) => {
    setIsOpen(false);
    setEditingTemplate(template);
    setIsCustomModalOpen(true);
  };

  const renderTemplateRow = (template: CardTemplate) => {
    const isSelected = template.id === selectedTemplate?.id;

    return (
      <div
        key={template.id}
        role="option"
        tabIndex={0}
        aria-selected={isSelected}
        onClick={() => handleSelect(template.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect(template.id);
          }
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition cursor-pointer ${
          isSelected ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <img
            src={template.frontUrl}
            alt={`${template.name} front`}
            title="Front side template"
            className={`w-14 h-[35px] rounded object-cover bg-white border shadow-sm ${
              isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-200'
            }`}
          />
          {template.hasSeparateBack && (
            <img
              src={template.backUrl}
              alt={`${template.name} back`}
              title="Back side template"
              className={`w-14 h-[35px] rounded object-cover bg-white border shadow-sm ${
                isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-200'
              }`}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold truncate">{template.name}</span>
            {template.isCustom && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold uppercase tracking-wide flex-shrink-0">
                Custom
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {template.isCustom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditCustom(template);
              }}
              title="Edit custom design"
              aria-label={`Edit ${template.name}`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-100/70 transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 w-full">
        <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>Card Design:</span>
        </span>

        <div ref={containerRef} className="relative flex-1 min-w-0 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={allTemplates.length === 0}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label="Select card background template"
            className={`w-full flex items-center justify-between gap-2.5 bg-white border rounded-lg px-2.5 py-1.5 transition text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              isOpen
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-400'
            }`}
          >
            {selectedTemplate ? (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <img
                  src={selectedTemplate.frontUrl}
                  alt={selectedTemplate.name}
                  className="w-10 h-[25px] rounded border border-slate-200 object-cover bg-white flex-shrink-0 shadow-sm"
                />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {selectedTemplate.name}
                </span>
                {selectedTemplate.isCustom && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold uppercase flex-shrink-0">
                    Custom
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-400">No background templates found</span>
            )}

            <ChevronDown
              className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-emerald-600' : ''
              }`}
            />
          </button>

          {selectedTemplate?.isCustom && !showQuickCustomButton && (
            <button
              type="button"
              onClick={() => openEditCustom(selectedTemplate)}
              title="Edit current custom design"
              aria-label="Edit current custom design"
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition flex-shrink-0 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {isOpen && allTemplates.length > 0 && (
            <div
              role="listbox"
              aria-label="Card background templates"
              className="absolute top-full mt-1.5 z-40 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden left-0 right-0 sm:left-auto sm:right-0 sm:w-80 flex flex-col"
            >
              {/* Upload Custom Design Quick CTA */}
              <div className="p-2 bg-emerald-50/70 border-b border-emerald-100">
                <button
                  type="button"
                  onClick={openCreateCustom}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Custom Card Design</span>
                </button>
              </div>

              <div className="py-1.5 max-h-72 overflow-y-auto">
                {customTemplates.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Your Custom Designs</span>
                    </div>
                    {customTemplates.map(renderTemplateRow)}
                    <div className="my-1.5 border-t border-slate-100" />
                    <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Built-in Designs
                    </div>
                  </div>
                )}

                {builtInTemplates.map(renderTemplateRow)}
              </div>
            </div>
          )}
        </div>
      </div>

      {showQuickCustomButton && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={openCreateCustom}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              {customTemplates.length > 0
                ? 'Upload Another Custom Design'
                : 'Use Your Own Custom Design'}
            </span>
          </button>

          {selectedTemplate?.isCustom && (
            <button
              type="button"
              onClick={() => openEditCustom(selectedTemplate)}
              className="py-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              title="Edit selected custom card design"
            >
              <Pencil className="w-3 h-3 text-slate-500" />
              <span>Edit</span>
            </button>
          )}
        </div>
      )}

      <CustomDesignModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        editingTemplate={editingTemplate}
        previewRecord={previewRecord}
        onSaveSuccess={(saved) => {
          onChange(saved.id);
        }}
        onDeleted={(deletedId) => {
          if (selectedTemplateId === deletedId) {
            onChange(DEFAULT_CARD_TEMPLATE_ID);
          }
        }}
      />
    </div>
  );
};
