/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — MODEL DROPDOWN (src/components/common/ModelDropdown.tsx)
 * Custom Sleek AI Model Selector with Search Bar, Name & Selection
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { CpuIcon as Cpu, ChevronDownIcon as ChevronDown, CheckIcon as Check, SparklesIcon as Sparkles, SearchIcon as Search, XIcon as X } from "@mdevs/icons";

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  contextWindow?: number;
  tierRequired?: string;
}

interface ModelDropdownProps {
  models: AIModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  className?: string;
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search and focus input when opening
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => setSearchQuery(''));
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0] || {
    id: selectedModelId,
    name: 'mAI 1.5 Apex',
  };

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-white text-xs font-semibold shadow-md transition-all hover:bg-zinc-800 focus:outline-none"
        title="Changer de modèle d'intelligence artificielle"
      >
        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0">
          <Cpu className="w-3 h-3 text-black" />
        </div>

        {/* Display Name Prominently */}
        <span className="font-bold text-white tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
          {selectedModel.name}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl vibe-menu shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-black/5 dark:bg-black/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <Sparkles className="w-3.5 h-3.5 text-zinc-700 dark:text-white" />
              <span>Modèles IA</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{filteredModels.length} modèle{filteredModels.length > 1 ? 's' : ''}</span>
          </div>

          {/* Search Bar */}
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 bg-black/5 dark:bg-black/40">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un modèle..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-zinc-400 hover:text-black dark:hover:text-white p-0.5"
                  title="Effacer la recherche"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Model Options List — minimalist : nom + petite coche, sans séparateurs */}
          <div className="max-h-72 overflow-y-auto p-1 space-y-0.5">
            {filteredModels.map((model) => {
              const isSelected = model.id === selectedModelId;

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-left transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-900/90 text-zinc-900 dark:text-white font-semibold'
                      : 'font-medium hover:bg-black/5 dark:hover:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="text-xs truncate">{model.name}</span>
                  {isSelected && <Check className="w-3 h-3 shrink-0" />}
                </button>
              );
            })}

            {filteredModels.length === 0 && (
              <div className="p-6 text-center text-xs text-zinc-500">
                Aucun modèle ne correspond à « {searchQuery} »
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
