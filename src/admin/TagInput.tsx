import React, { useState } from 'react';
import { X } from 'lucide-react';

/** A list of plain texts named like keywords or tags gets the tag input instead of one box per item. */
export function isTagListField(fieldName: string, value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'string') &&
    /(keywords?|tags?|keyphrases?)$/i.test(fieldName)
  );
}

/** Split typed or pasted text into tags: commas and line breaks separate them. */
export function splitTags(text: string): string[] {
  return text
    .split(/[,\n\r]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Add tags to a list, skipping empty ones and ones already there (any letter case). */
export function addTags(list: string[], incoming: string[], max?: number): string[] {
  const next = [...list];
  const seen = new Set(list.map((tag) => tag.toLowerCase()));
  for (const tag of incoming) {
    if (max !== undefined && next.length >= max) break;
    const lower = tag.toLowerCase();
    if (!tag || seen.has(lower)) continue;
    seen.add(lower);
    next.push(tag);
  }
  return next;
}

export interface TagInputProps {
  label: string;
  fieldId: string;
  value: string[];
  onChange: (value: string[]) => void;
  /** Most tags allowed (from collectionLimits). */
  max?: number;
  hint?: string;
}

/**
 * Tag input: type a keyword and press Enter or comma to add it; paste a comma-separated list to add
 * many at once; × removes one; Backspace in the empty box removes the last.
 */
export const TagInput: React.FC<TagInputProps> = ({ label, fieldId, value, onChange, max, hint }) => {
  const [draft, setDraft] = useState('');
  const isFull = max !== undefined && value.length >= max;

  const commit = (text: string) => {
    const tags = splitTags(text);
    if (tags.length > 0) onChange(addTags(value, tags, max));
    setDraft('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (/[,\n\r]/.test(text)) {
      e.preventDefault();
      commit(draft + text);
    }
  };

  return (
    <div className="w-full space-y-1.5 py-2" data-cms-tag-input={fieldId}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`${fieldId}-tag`} className="text-xs font-semibold text-slate-200 capitalize flex items-center gap-1.5">
          {label}
          <span className="text-[10px] px-1.5 rounded-full font-mono bg-purple-900/60 text-purple-200">
            {value.length}
            {max !== undefined ? ` / ${max}` : ''}
          </span>
        </label>
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-[10px] text-slate-500 hover:text-rose-300">
            Clear all
          </button>
        )}
      </div>
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/90 p-2 focus-within:border-purple-400 transition-colors"
        onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}
      >
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 max-w-full rounded-md bg-purple-600/25 border border-purple-500/40 pl-2 pr-1 py-0.5 text-[11px] text-purple-100"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="rounded p-0.5 text-purple-300 hover:text-white hover:bg-purple-500/40"
              aria-label={`Remove ${tag}`}
              title={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          id={`${fieldId}-tag`}
          type="text"
          value={draft}
          disabled={isFull}
          placeholder={isFull ? 'Limit reached' : value.length === 0 ? 'Type and press Enter, or paste a list' : 'Add…'}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => draft.trim() && commit(draft)}
          className="flex-1 min-w-[8rem] bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none py-0.5"
        />
      </div>
      <p className="text-[10px] text-slate-500">{hint ?? 'Enter or comma adds a tag. Paste a comma-separated list to add many at once.'}</p>
    </div>
  );
};
