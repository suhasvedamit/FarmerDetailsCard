import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { CARD_TEMPLATES, getCardTemplate } from '../lib/cardTemplates';

interface BackgroundSelectorProps {
  selectedTemplateId: string;
  onChange: (templateId: string) => void;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedTemplateId,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap flex items-center gap-1">
        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
        <span>Card Design:</span>
      </span>

      <div ref={containerRef} className="relative flex-1 min-w-0">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={CARD_TEMPLATES.length === 0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Select card background template"
          className={`w-full flex items-center justify-between gap-2.5 bg-white border rounded-lg px-2.5 py-1.5 transition text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-200 hover:border-emerald-400'
            }`}
        >
          {selectedTemplate ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <img
                src={selectedTemplate.frontUrl}
                alt={selectedTemplate.name}
                className="w-10 h-[25px] rounded border border-slate-200 object-cover bg-white flex-shrink-0 shadow-sm"
              />
              <span className="text-xs font-bold text-slate-800 truncate">
                {selectedTemplate.name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">No background templates found</span>
          )}

          <ChevronDown
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-emerald-600' : ''
              }`}
          />
        </button>

        {isOpen && CARD_TEMPLATES.length > 0 && (
          <div
            role="listbox"
            aria-label="Card background templates"
            className="absolute mt-1.5 z-40 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 max-h-72 overflow-y-auto left-0 right-0 sm:left-auto sm:right-0 sm:w-80"
          >
            {CARD_TEMPLATES.map((template) => {
              const isSelected = template.id === selectedTemplate?.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(template.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition cursor-pointer ${isSelected
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <img
                      src={template.frontUrl}
                      alt={`${template.name} front`}
                      title="Front side template"
                      className={`w-14 h-[35px] rounded object-cover bg-white border shadow-sm ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-200'
                        }`}
                    />
                    {template.hasSeparateBack && (
                      <img
                        src={template.backUrl}
                        alt={`${template.name} back`}
                        title="Back side template"
                        className={`w-14 h-[35px] rounded object-cover bg-white border shadow-sm ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-200'
                          }`}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">{template.name}</div>
                    {/* <div className="text-[10px] text-slate-400 truncate">
                      {template.hasSeparateBack ? 'Front & Back' : 'Single image'}
                    </div> */}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
