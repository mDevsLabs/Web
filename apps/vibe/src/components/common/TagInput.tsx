/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — TAG INPUT (src/components/common/TagInput.tsx)
 * Saisie de tags sous forme de chips : Entrée/virgule pour ajouter, Retour
 * arrière pour retirer, dédoublonnage insensible à la casse, compteur max.
 * ============================================================================
 */

import React, { useRef, useState } from 'react';
import { PlusIcon as Plus, XIcon as X } from "@mdevs/icons";
import { INTEREST_SUGGESTIONS, MAX_INTERESTS, MAX_INTEREST_LENGTH, normalizeInterest } from '../../data/interests';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  maxLength?: number;
  placeholder?: string;
  suggestions?: string[];
  disabled?: boolean;
  className?: string;
  id?: string;
}

const keyOf = (tag: string) => tag.toLowerCase();

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  max = MAX_INTERESTS,
  maxLength = MAX_INTEREST_LENGTH,
  placeholder = 'Ajouter un centre d’intérêt…',
  suggestions = INTEREST_SUGGESTIONS,
  disabled = false,
  className = '',
  id,
}) => {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isFull = value.length >= max;

  const addTags = (raws: string[]) => {
    const next = [...value];
    const seen = new Set(next.map(keyOf));
    for (const raw of raws) {
      const tag = normalizeInterest(raw, maxLength);
      if (!tag) continue;
      const key = keyOf(tag);
      if (seen.has(key)) continue;
      if (next.length >= max) break;
      seen.add(key);
      next.push(tag);
    }
    if (next.length !== value.length) onChange(next);
  };

  const commitDraft = () => {
    if (!draft.trim()) {
      if (draft) setDraft('');
      return;
    }
    addTags(draft.split(','));
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Tab' && draft.trim()) {
      commitDraft();
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remainingSuggestions = suggestions.filter((s) => !value.some((t) => keyOf(t) === keyOf(s)));

  return (
    <div className={className}>
      <div
        className={`w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-zinc-500 flex flex-wrap items-center gap-1.5 cursor-text transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.length > 0 && (
          <ul role="list" className="flex flex-wrap items-center gap-1.5">
            {value.map((tag, index) => (
              <li
                key={`${tag}-${index}`}
                role="listitem"
                className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5"
              >
                <span className="max-w-[10rem] truncate">{tag}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  disabled={disabled}
                  aria-label={`Retirer ${tag}`}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text/plain');
            if (text.includes(',')) {
              e.preventDefault();
              addTags(text.split(','));
            }
          }}
          placeholder={isFull ? '' : placeholder}
          disabled={disabled || isFull}
          maxLength={maxLength}
          className="flex-1 min-w-[8rem] bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none disabled:cursor-not-allowed"
          aria-describedby={id ? `${id}-hint` : undefined}
        />
      </div>

      <p
        id={id ? `${id}-hint` : undefined}
        aria-live="polite"
        className={`mt-1.5 text-[10px] ${isFull ? 'text-amber-400' : 'text-zinc-500'}`}
      >
        {isFull
          ? `Maximum ${max} centres d’intérêt atteint — retirez-en un pour en ajouter un autre.`
          : `${value.length}/${max} centres d’intérêt — ${maxLength} caractères max chacun.`}
      </p>

      {!disabled && !isFull && remainingSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {remainingSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTags([suggestion])}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
