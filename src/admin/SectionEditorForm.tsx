import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Save, RotateCcw, Code, Eye, Plus, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, ShieldCheck, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { CodeValue } from '../core/types';
import { getAtPath, parseFieldPath } from '../core/paths';
import { isColorField, isFontField } from '../core/theme';
import { JsonInspectorModal } from './JsonInspectorModal';
import { LivePreviewModal } from './LivePreviewModal';
import { VisualImagePicker } from './VisualImagePicker';
import { VisualIconPicker } from './VisualIconPicker';
import { TagInput, isTagListField } from './TagInput';
import { useStudio } from './StudioContext';

export interface SectionEditorFormProps {
  page: string;
  sectionKey: string;
  /** Human-readable section name shown in the toolbar. */
  sectionLabel?: string;
  /** Public route of the page, used by the preview modal. */
  pagePath: string;
  initialData: unknown;
  hasCustomOverride: boolean;
  isPublished: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  onSave: (content: unknown, isPublished: boolean) => Promise<void>;
  onReset: () => Promise<void>;
  onChangeDraft?: (draftContent: unknown) => void;
  /** Normaliser applied to the data before it is loaded into the form. */
  transform?: (data: unknown) => unknown;
  /** Show only this field ("items.0.title") instead of the whole section. */
  focusPath?: string | null;
  /** Called when the editor asks to see every field of the section again. */
  onClearFocus?: () => void;
  /** Tells the studio whether this form holds unsaved edits. */
  onDirtyChange?: (dirty: boolean) => void;
  /**
   * "record" edits a collection record (saved straight to the site's database): one Save
   * button, no draft or reset.
   */
  mode?: 'section' | 'record';
}

/** True for objects shaped like { html, css, js } with string values. */
function isCodeValue(value: unknown): value is CodeValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    keys.length === 3 &&
    keys[0] === 'css' && keys[1] === 'html' && keys[2] === 'js' &&
    keys.every((k) => typeof (value as Record<string, unknown>)[k] === 'string')
  );
}

export const SectionEditorForm: React.FC<SectionEditorFormProps> = ({
  page,
  sectionKey,
  initialData,
  hasCustomOverride,
  isPublished: initialPublished,
  updatedAt,
  updatedBy,
  onSave,
  onReset,
  onChangeDraft,
  sectionLabel,
  pagePath,
  transform,
  focusPath,
  onClearFocus,
  onDirtyChange,
  mode = 'section',
}) => {
  const isRecord = mode === 'record';
  const { config } = useStudio();
  const collectionLimits = config.collectionLimits ?? {};
  const CodeWidget = config.widgets?.code;

  const getEffectiveInitialData = (data: unknown) => {
    return transform ? transform(data) : data;
  };

  const [formData, setFormData] = useState<unknown>(() => getEffectiveInitialData(initialData));
  const [published, setPublished] = useState<boolean>(initialPublished);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData(getEffectiveInitialData(initialData));
    setPublished(initialPublished);
    setIsDirty(false);
  }, [initialData, initialPublished]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  const focusSegments = useMemo(() => (focusPath ? parseFieldPath(focusPath) : null), [focusPath]);
  const focusValue = focusSegments ? getAtPath(formData, focusSegments) : undefined;
  const isFocused = focusValue !== undefined && focusValue !== null;
  const focusAreaRef = useRef<HTMLDivElement>(null);

  // Put the cursor in the field the editor just opened.
  useEffect(() => {
    if (!focusPath) return;
    const input = focusAreaRef.current?.querySelector<HTMLElement>('input:not([type=checkbox]), textarea');
    input?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPath, isFocused]);

  // Deep clone utility
  const cloneData = <T,>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  };

  // Helper to create a clean empty template for newly added items
  const createEmptyTemplate = (template: unknown): unknown => {
    if (template === null || template === undefined) return '';
    if (typeof template === 'string') return '';
    if (typeof template === 'number') return 0;
    if (typeof template === 'boolean') return false;
    if (Array.isArray(template)) return [];
    if (typeof template === 'object') {
      const empty: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(template as Record<string, unknown>)) {
        if (k.toLowerCase() === 'id') {
          empty[k] = typeof v === 'number' ? 0 : `item_${Date.now()}`;
        } else if (typeof v === 'string') {
          empty[k] = '';
        } else if (typeof v === 'boolean') {
          empty[k] = false;
        } else if (typeof v === 'number') {
          empty[k] = 0;
        } else if (Array.isArray(v)) {
          empty[k] = [];
        } else if (typeof v === 'object' && v !== null) {
          empty[k] = createEmptyTemplate(v);
        } else {
          empty[k] = '';
        }
      }
      return empty;
    }
    return '';
  };

  // Generic field update by dot-path
  const handleFieldChange = (path: (string | number)[], value: unknown) => {
    setFormData((prev: unknown) => {
      const copy = cloneData(prev);
      let curr = copy as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        curr = curr[path[i]] as Record<string, unknown>;
      }
      curr[path[path.length - 1]] = value;
      if (onChangeDraft) {
        onChangeDraft(copy);
      }
      return copy;
    });
    setIsDirty(true);
  };

  // Helper to look up collection limit by dot-path
  const getArrayLimit = (path: (string | number)[]) => {
    // Construct keys such as "home.features.items" or "home.items"
    const specificKey = `${page}.${sectionKey}.${path.join('.')}`;
    const directKey = `${page}.${path.join('.')}`;
    const simpleKey = `${sectionKey}.${path.join('.')}`;

    return collectionLimits[specificKey] ||
      collectionLimits[directKey] ||
      collectionLimits[simpleKey] ||
      collectionLimits[`${page}.${sectionKey}`] ||
      null;
  };

  const handleArrayAdd = (path: (string | number)[], template: unknown) => {
    // Check limit before adding
    const limitInfo = getArrayLimit(path);

    setFormData((prev: unknown) => {
      const copy = cloneData(prev);
      let curr = copy as Record<string, unknown>;
      for (let i = 0; i < path.length; i++) {
        curr = curr[path[i]] as Record<string, unknown>;
      }
      if (Array.isArray(curr)) {
        if (limitInfo && curr.length >= limitInfo.max) {
          toast.error(
            `Maximum limit reached: You cannot add more than ${limitInfo.max} ${limitInfo.label} to preserve design and layout integrity.`,
            { duration: 4000 }
          );
          return prev;
        }

        const newItem = cloneData(createEmptyTemplate(template));
        if (newItem && typeof newItem === 'object' && 'id' in (newItem as Record<string, unknown>)) {
          (newItem as Record<string, unknown>).id =
            typeof (template as Record<string, unknown>)?.id === 'number'
              ? curr.length + 1
              : `item_${Date.now()}`;
        }
        curr.push(newItem);
        if (onChangeDraft) {
          onChangeDraft(copy);
        }
      }
      return copy;
    });
    setIsDirty(true);
  };

  const handleArrayDelete = (path: (string | number)[], index: number) => {
    setFormData((prev: unknown) => {
      const copy = cloneData(prev);
      let curr = copy as Record<string, unknown>;
      for (let i = 0; i < path.length; i++) {
        curr = curr[path[i]] as Record<string, unknown>;
      }
      if (Array.isArray(curr)) {
        curr.splice(index, 1);
      }
      if (onChangeDraft) {
        onChangeDraft(copy);
      }
      return copy;
    });
    setIsDirty(true);
  };

  const handleArrayMove = (path: (string | number)[], index: number, direction: 'up' | 'down') => {
    setFormData((prev: unknown) => {
      const copy = cloneData(prev);
      let curr = copy as Record<string, unknown>;
      for (let i = 0; i < path.length; i++) {
        curr = curr[path[i]] as Record<string, unknown>;
      }
      if (Array.isArray(curr)) {
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx >= 0 && targetIdx < curr.length) {
          const temp = curr[index];
          curr[index] = curr[targetIdx];
          curr[targetIdx] = temp;
        }
      }
      if (onChangeDraft) {
        onChangeDraft(copy);
      }
      return copy;
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData, isRecord ? true : published);
      setIsDirty(false);
      toast.success(isRecord ? 'Saved. The page shows it now.' : published ? 'Section saved and published' : 'Section saved as draft');
    } catch (err) {
      const detail = err instanceof Error && err.message ? `: ${err.message}` : '';
      toast.error(isRecord ? `Could not save this record${detail}` : 'Failed to save section changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to revert this section to default content? All custom changes will be discarded.')) {
      return;
    }
    setIsResetting(true);
    try {
      await onReset();
      setIsDirty(false);
      toast.success('Reverted back to default template content');
    } catch {
      toast.error('Failed to reset section');
    } finally {
      setIsResetting(false);
    }
  };

  const isIconField = (fieldName: string): boolean => {
    const lower = fieldName.toLowerCase();
    // A favicon is an image file, not a picked icon.
    if (lower.endsWith('favicon') || /colou?r$/.test(lower)) return false;
    return (
      lower === 'icon' ||
      lower.endsWith('icon') ||
      lower.endsWith('_icon') ||
      lower.startsWith('icon') ||
      lower === 'iconname' ||
      lower === 'badgeicon'
    );
  };

  const isImageField = (fieldName: string, val: unknown): boolean => {
    if (typeof val !== 'string') return false;
    // 1. If it's an icon field, always prioritize icon picker
    if (isIconField(fieldName)) return false;

    const lowerKey = fieldName.toLowerCase();

    // 2. Reject label/text/alt/desc/badge fields from being treated as images even if key contains 'logo' or 'image'
    const nonImageLabelSuffixes = ['alt', 'label', 'desc', 'description', 'title', 'heading', 'text', 'badge'];
    if (nonImageLabelSuffixes.some((s) => lowerKey.endsWith(s) || lowerKey.endsWith(`_${s}`))) {
      return false;
    }

    const imageKeyKeywords = [
      'image', 'img', 'avatar', 'logo', 'photo', 
      'banner', 'cover', 'thumbnail', 'preview', 'picture', 'src', 'ogimage', 'favicon'
    ];
    const hasImageKey = imageKeyKeywords.some((kw) => lowerKey.includes(kw));
    const trimmed = val.trim();
    const hasImageExt = /\.(png|jpe?g|webp|svg|gif|avif|ico)(\?.*)?$/i.test(trimmed);
    const hasImagePath =
      trimmed.startsWith('/images/') ||
      trimmed.startsWith('/assets/') ||
      trimmed.startsWith('data:image/');

    return hasImageKey || hasImageExt || hasImagePath;
  };

  // Flat, Space-Optimized Form Renderer (No heavy nested box-under-box borders)
  const renderField = (key: string, value: unknown, path: (string | number)[]): React.ReactNode => {
    const fieldId = path.join('.');

    // 1. Primitive: String
    if (typeof value === 'string') {
      const isIdField = key.toLowerCase() === 'id';
      if (isIdField) {
        return (
          <div key={fieldId} className="w-full flex items-center justify-between py-1 text-xs border-b border-slate-800/40">
            <div className="flex items-center gap-1.5 min-w-0">
              <Lock className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="text-slate-400 font-mono text-[11px] shrink-0">{key}:</span>
              <span className="text-purple-300 font-mono font-medium px-1.5 py-0.2 rounded bg-purple-950/60 text-[11px] truncate">{value}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono shrink-0">system id</span>
          </div>
        );
      }

      if (isIconField(key)) {
        return (
          <div key={fieldId} className="w-full py-1">
            <VisualIconPicker
              value={value}
              onChange={(newIcon) => handleFieldChange(path, newIcon)}
              label={key}
              fieldId={fieldId}
              icons={config.icons}
            />
          </div>
        );
      }

      if (isColorField(key, value)) {
        const isHex = /^#([0-9a-f]{3}){1,2}$/i.test(value.trim());
        // <input type="color"> only takes #rrggbb.
        const pickerValue = isHex
          ? value.trim().length === 4
            ? `#${value.trim().slice(1).split('').map((c) => c + c).join('')}`
            : value.trim()
          : '#000000';
        return (
          <div key={fieldId} className="w-full space-y-1 py-1">
            <div className="flex items-center justify-between gap-1">
              <label htmlFor={`${fieldId}-color`} className="text-xs font-semibold text-slate-200 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <span className="text-[10px] font-mono text-slate-500">{fieldId}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={`${fieldId}-color`}
                type="color"
                value={pickerValue}
                onChange={(e) => handleFieldChange(path, e.target.value)}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-700 bg-slate-950/90 p-1"
              />
              <input
                type="text"
                value={value}
                aria-label={`${key} hex value`}
                placeholder="#7c3aed"
                onChange={(e) => handleFieldChange(path, e.target.value)}
                className="w-full text-xs px-3 py-2 font-mono rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
          </div>
        );
      }

      if (isFontField(key, value, config.fonts)) {
        const fonts = config.fonts ?? [];
        return (
          <div key={fieldId} className="w-full space-y-1 py-1">
            <div className="flex items-center justify-between gap-1">
              <label htmlFor={`${fieldId}-font`} className="text-xs font-semibold text-slate-200 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <span className="text-[10px] font-mono text-slate-500">{fieldId}</span>
            </div>
            <select
              id={`${fieldId}-font`}
              value={value}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-colors"
            >
              {!fonts.includes(value) && <option value={value}>{value || 'Choose a font'}</option>}
              {fonts.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        );
      }

      if (isImageField(key, value)) {
        return (
          <div key={fieldId} className="w-full py-1">
            <VisualImagePicker
              value={value}
              onChange={(newUrl) => handleFieldChange(path, newUrl)}
              label={key}
              fieldId={fieldId}
            />
          </div>
        );
      }

      const displayLabel = key.replace(/([A-Z])/g, ' $1');

      const isLongText = value.length > 70 || value.includes('\n');
      return (
        <div key={fieldId} className="w-full space-y-1 py-1">
          <div className="flex items-center justify-between gap-1">
            <label className="text-xs font-semibold text-slate-200 capitalize flex items-center gap-1.5">
              <span>{displayLabel}</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">{fieldId}</span>
          </div>
          {isLongText ? (
            <textarea
              value={value}
              rows={3}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-colors"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-colors"
            />
          )}
        </div>
      );
    }

    // 2. Primitive: Number
    if (typeof value === 'number') {
      const isIdField = key.toLowerCase() === 'id';
      if (isIdField) {
        return (
          <div key={fieldId} className="w-full flex items-center justify-between py-1 text-xs border-b border-slate-800/40">
            <div className="flex items-center gap-1.5 min-w-0">
              <Lock className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="text-slate-400 font-mono text-[11px] shrink-0">{key}:</span>
              <span className="text-purple-300 font-mono font-medium px-1.5 py-0.2 rounded bg-purple-950/60 text-[11px] truncate">{value}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono shrink-0">system id</span>
          </div>
        );
      }

      return (
        <div key={fieldId} className="w-full space-y-1 py-1">
          <div className="flex items-center justify-between gap-1">
            <label className="text-xs font-semibold text-slate-200 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </label>
            <span className="text-[10px] font-mono text-slate-500">{fieldId}</span>
          </div>
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(path, parseFloat(e.target.value) || 0)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 font-mono"
          />
        </div>
      );
    }

    // 3. Primitive: Boolean
    if (typeof value === 'boolean') {
      return (
        <div key={fieldId} className="w-full flex items-center justify-between py-2 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-200 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </span>
            <span className="block text-[10px] font-mono text-slate-500">{fieldId}</span>
          </div>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleFieldChange(path, e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 cursor-pointer"
          />
        </div>
      );
    }

    // 4a. Keywords, tags: a tag input instead of one box per item
    if (isTagListField(key, value)) {
      const tagLimit = getArrayLimit(path);
      return (
        <TagInput
          key={fieldId}
          label={key.replace(/([A-Z])/g, ' $1')}
          fieldId={fieldId}
          value={value}
          max={tagLimit?.max}
          hint={
            /keywords?$/i.test(key)
              ? 'Enter or comma adds a keyword; paste a comma-separated list to add many. Google does not use meta keywords for ranking.'
              : undefined
          }
          onChange={(next) => handleFieldChange(path, next)}
        />
      );
    }

    // 4. Array of primitives or objects (Flat card list without extreme padding)
    if (Array.isArray(value)) {
      const isPrimitiveArray = value.length === 0 || typeof value[0] !== 'object';
      const itemTemplate = value.length > 0 ? (typeof value[0] === 'object' ? value[0] : '') : '';
      const limitInfo = getArrayLimit(path);
      const isMaxReached = limitInfo ? value.length >= limitInfo.max : false;

      return (
        <div key={fieldId} className="w-full space-y-2 py-2">
          {/* Array Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isMaxReached
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-500/30'
                  : 'bg-purple-900/60 text-purple-200'
              }`}>
                {value.length}{limitInfo ? ` / ${limitInfo.max} max` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleArrayAdd(path, itemTemplate)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                isMaxReached
                  ? 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700/80'
                  : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40'
              }`}
              title={isMaxReached ? `Limit of ${limitInfo?.max} reached` : 'Add new item'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isMaxReached ? 'Max Reached' : 'Add'}</span>
            </button>
          </div>

          {/* Array Items: Clean, thin flat items */}
          <div className="space-y-2.5">
            {value.map((item, idx) => (
              <div
                key={`${fieldId}.${idx}`}
                className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
              >
                {/* Item Toolbar */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-purple-300">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleArrayMove(path, idx, 'up')}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === value.length - 1}
                      onClick={() => handleArrayMove(path, idx, 'down')}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArrayDelete(path, idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors ml-1"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isPrimitiveArray ? (
                  isImageField(key, item) ? (
                    <VisualImagePicker
                      value={(item as string) || ''}
                      onChange={(newUrl) => handleFieldChange([...path, idx], newUrl)}
                      label={`${key} #${idx + 1}`}
                      fieldId={`${fieldId}.${idx}`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={item as string}
                      onChange={(e) => handleFieldChange([...path, idx], e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-400"
                    />
                  )
                ) : (
                  <div className="space-y-2 pt-1">
                    {Object.entries(item as Record<string, unknown>).map(([subKey, subVal]) =>
                      renderField(subKey, subVal, [...path, idx, subKey])
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 5. Nested Object (Flat subtle separator instead of nesting a bulky outer box)
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={fieldId} className="w-full space-y-2 py-2 border-t border-slate-800/80 first:border-t-0">
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-xs font-bold text-slate-200 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </span>
            <span className="text-[10px] font-mono text-slate-500">({fieldId})</span>
          </div>
          <div className="space-y-2 pl-1">
            {Object.entries(value as Record<string, unknown>).map(([subKey, subVal]) =>
              renderField(subKey, subVal, [...path, subKey])
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Action Bar: Clean Flat Toolbar (Sticky so never scrolls away) */}
      <div className="sticky top-0 z-30 rounded-xl bg-slate-900/95 border border-purple-500/30 overflow-hidden shadow-lg backdrop-blur-md">
        <div className="p-3 flex items-center justify-between gap-2 border-b border-purple-500/20">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold text-white capitalize truncate">
              {sectionLabel || sectionKey.replace(/([A-Z])/g, ' $1')}
            </h2>
            {isRecord ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 shrink-0 font-medium"
                title="Saving writes this record to the site's database and the page shows it right away."
              >
                <span>Database record</span>
              </span>
            ) : hasCustomOverride ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Custom</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0 font-medium">
                <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Default</span>
              </span>
            )}
          </div>

          {/* Primary Save Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              isSaving
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95'
            }`}
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span>{isSaving ? 'Saving...' : isRecord ? 'Save' : published ? 'Save & Publish' : 'Save Draft'}</span>
          </button>
        </div>

        {/* Secondary Toolbar */}
        <div className="px-3 py-2 bg-slate-950/60 flex items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 min-w-0 text-[11px]">
            <span className="text-purple-300 font-mono truncate">
              {pagePath}
            </span>
            {updatedAt && (
              <span className="text-slate-500 hidden sm:inline truncate">
                {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              title="Preview Section"
            >
              <Eye className="w-3.5 h-3.5 text-purple-400" />
            </button>

            <button
              type="button"
              onClick={() => setIsJsonModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              title="View Raw JSON"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            {hasCustomOverride && !isRecord && (
              <button
                type="button"
                disabled={isResetting}
                onClick={handleReset}
                className="p-1.5 rounded-lg text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/60 transition-colors"
                title="Reset to Template Default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Flat Form Container: Full Width, No Box Shrinking */}
      <div className="bg-slate-900/80 border border-purple-500/20 rounded-xl p-3 sm:p-4 space-y-3">
        {focusPath && !isFocused && (
          <p role="status" className="text-xs rounded-lg px-3 py-2 bg-amber-950/40 border border-amber-700/60 text-amber-200">
            {isRecord ? 'This field could not be found, so every field of the record is shown.' : 'This field could not be found, so the whole section is shown.'}
          </p>
        )}
        {isFocused && focusSegments ? (
          <div ref={focusAreaRef} key={focusPath} className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-purple-500/20">
              <span className="text-[11px] font-semibold text-purple-200">Editing one field</span>
              <button
                type="button"
                onClick={onClearFocus}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-purple-200 bg-purple-600/25 hover:bg-purple-600/45 border border-purple-500/40 transition-colors"
              >
                {isRecord ? 'Show all fields of this record' : 'Show all fields in this section'}
              </button>
            </div>
            {renderField(
              String([...focusSegments].reverse().find((part) => typeof part === 'string') ?? focusPath),
              focusValue,
              focusSegments
            )}
          </div>
        ) : CodeWidget && isCodeValue(formData) ? (
          <>
          <CodeWidget
            value={formData}
            onChange={(next) => {
              const updated = {
                html: next.html,
                css: next.css,
                js: next.js,
              };
              setFormData(updated);
              setIsDirty(true);
              if (onChangeDraft) {
                onChangeDraft(updated);
              }
            }}
          />
          <div className="flex items-center justify-between pt-3 border-t border-purple-500/20">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span>{isDirty ? 'Unsaved edits in studio' : 'Ready / Up to date'}</span>
            </span>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isSaving
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 active:scale-95'
              }`}
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
            </button>
          </div>
          </>
        ) : formData && typeof formData === 'object' ? (
          <div className="space-y-3">
            {Object.entries(formData as Record<string, unknown>).map(([key, val]) => renderField(key, val, [key]))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400">
            No editable data found for this section.
          </div>
        )}
      </div>

      {/* Raw JSON Modal */}
      <JsonInspectorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        sectionTitle={sectionKey}
        jsonData={formData}
        onApply={(data) => {
          setFormData(data);
          setIsDirty(true);
          if (onChangeDraft) {
            onChangeDraft(data);
          }
        }}
      />

      {/* Live Preview Modal */}
      <LivePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pagePath={pagePath}
      />
    </div>
  );
};
