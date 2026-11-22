import React from 'react';
import { Monitor, Tablet, Smartphone, RotateCcw, Save, Loader2, X } from 'lucide-react';
import type { CmsStyleOptions, FieldStyle, StyleProps } from '../core/types';

export type StudioDevice = 'desktop' | 'tablet' | 'mobile';
type StyleDevice = 'desktop' | 'tablet' | 'phone';

export interface StylePanelProps {
  /** The field's current style (saved or being edited). */
  value: FieldStyle | undefined;
  /** The studio's device (its Desktop / Tablet / Mobile buttons); "mobile" edits the phone values. */
  device: StudioDevice;
  options?: CmsStyleOptions;
  fonts?: string[];
  /** An image: shows image size, fit and focus, corners and border instead of the text options. */
  isImage: boolean;
  onChange: (style: FieldStyle) => void;
  onSave: () => Promise<void>;
  onReset: () => Promise<void>;
  isSaving: boolean;
  hasSavedStyle: boolean;
}

const DEVICES: { key: StudioDevice; style: StyleDevice; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'desktop', style: 'desktop', label: 'Desktop', icon: Monitor },
  { key: 'tablet', style: 'tablet', label: 'Tablet', icon: Tablet },
  { key: 'mobile', style: 'phone', label: 'Phone', icon: Smartphone },
];

/** Narrower devices fall back to the wider ones: phone → tablet → desktop. */
const FALLBACK: Record<StyleDevice, StyleDevice[]> = { desktop: [], tablet: ['desktop'], phone: ['tablet', 'desktop'] };

const inputClass =
  'w-full min-w-0 text-xs px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors';
const chipClass = (active: boolean) =>
  `px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
    active ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-950/70 text-slate-300 border-slate-700 hover:border-slate-500'
  }`;

/** One property: its label, a clear button (own value) or the inherited value, then its controls. */
const Row: React.FC<{ label: string; ownValue?: string; inheritedValue?: string; onClear: () => void; children: React.ReactNode }> = ({
  label,
  ownValue,
  inheritedValue,
  onClear,
  children,
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold text-slate-300">{label}</span>
      {ownValue ? (
        <button type="button" onClick={onClear} className="text-slate-500 hover:text-rose-300" title={`Clear ${label}`} aria-label={`Clear ${label}`}>
          <X className="w-3 h-3" />
        </button>
      ) : inheritedValue ? (
        <span className="text-[10px] text-slate-500">inherited: {inheritedValue}</span>
      ) : null}
    </div>
    {children}
  </div>
);

const Group: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
    <legend className="px-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">{title}</legend>
    {children}
  </fieldset>
);

/** A colour that <input type="color"> can show, or black. */
function pickerColor(value: string | undefined): string {
  const v = (value ?? '').trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) return `#${v.slice(1).split('').map((c) => c + c).join('')}`;
  return '#000000';
}

/**
 * The Style tab of one field: presets from `styles` in defineCms plus custom values, for the
 * device chosen at the top. Values left empty on tablet or phone inherit the wider device.
 */
export const StylePanel: React.FC<StylePanelProps> = ({
  value,
  device,
  options,
  fonts,
  isImage,
  onChange,
  onSave,
  onReset,
  isSaving,
  hasSavedStyle,
}) => {
  const currentDevice = DEVICES.find((d) => d.key === device) ?? DEVICES[0];
  const styleDevice = currentDevice.style;
  const own: StyleProps = value?.[styleDevice] ?? {};

  const inherited = (key: keyof StyleProps): string | undefined => {
    for (const d of FALLBACK[styleDevice]) {
      const v = value?.[d]?.[key];
      if (v) return v;
    }
    return undefined;
  };

  const set = (changes: Partial<StyleProps>) => {
    const next: StyleProps = { ...own };
    for (const [key, v] of Object.entries(changes) as [keyof StyleProps, string | undefined][]) {
      if (v === undefined || v.trim() === '') delete next[key];
      else next[key] = v;
    }
    const style: FieldStyle = { ...(value ?? {}) };
    if (Object.keys(next).length > 0) style[styleDevice] = next;
    else delete style[styleDevice];
    onChange(style);
  };

  const row = (label: string, prop: keyof StyleProps, children: React.ReactNode) => (
    <Row label={label} ownValue={own[prop]} inheritedValue={inherited(prop)} onClear={() => set({ [prop]: undefined })}>
      {children}
    </Row>
  );

  const textInput = (prop: keyof StyleProps, placeholder: string) => (
    <input
      type="text"
      value={own[prop] ?? ''}
      placeholder={inherited(prop) ?? placeholder}
      aria-label={prop}
      onChange={(e) => set({ [prop]: e.target.value })}
      className={inputClass}
    />
  );

  const presets = (prop: keyof StyleProps, list: Record<string, string> | undefined) =>
    list && Object.keys(list).length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {Object.entries(list).map(([name, v]) => (
          <button key={name} type="button" className={chipClass(own[prop] === v)} onClick={() => set({ [prop]: v })} title={v}>
            {name}
          </button>
        ))}
      </div>
    ) : null;

  const colorRow = (label: string, prop: keyof StyleProps) =>
    row(
      label,
      prop,
      <>
      {options?.colors && Object.keys(options.colors).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(options.colors).map(([name, v]) => (
            <button key={name} type="button" className={`${chipClass(own[prop] === v)} flex items-center gap-1`} onClick={() => set({ [prop]: v })} title={v}>
              <span className="w-3 h-3 rounded-full border border-white/30" style={{ background: v }} />
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={pickerColor(own[prop] ?? inherited(prop))}
          aria-label={`${label} picker`}
          onChange={(e) => set({ [prop]: e.target.value })}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-slate-700 bg-slate-950/90 p-0.5"
        />
        {textInput(prop, '#000000 or var(--color)')}
      </div>
      </>
    );

  const sides = (group: 'margin' | 'padding') => {
    const keys = (['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => `${group}${side}` as keyof StyleProps);
    const all = (v: string | undefined) => set(Object.fromEntries(keys.map((k) => [k, v])) as Partial<StyleProps>);
    const allSame = keys.every((k) => own[k] && own[k] === own[keys[0]]) ? own[keys[0]] : undefined;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 capitalize">{group}</span>
          {keys.some((k) => own[k]) && (
            <button type="button" onClick={() => all(undefined)} className="text-slate-500 hover:text-rose-300" aria-label={`Clear ${group}`}>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {options?.spacing && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(options.spacing).map(([name, v]) => (
              <button key={name} type="button" className={chipClass(allSame === v)} onClick={() => all(v)} title={v}>
                {name}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-4 gap-1">
          {keys.map((k, i) => (
            <input
              key={k}
              type="text"
              value={own[k] ?? ''}
              placeholder={inherited(k) ?? ['↑', '→', '↓', '←'][i]}
              aria-label={k}
              title={k}
              onChange={(e) => set({ [k]: e.target.value })}
              className={`${inputClass} text-center px-1`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3" data-cms-style-panel>
      {/* The device is chosen with the preview's Desktop / Tablet / Mobile buttons at the top. */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-2.5 py-1.5 text-[11px] text-slate-300">
        {React.createElement(currentDevice.icon, { className: 'w-3.5 h-3.5 text-purple-300 shrink-0' })}
        <span>
          Editing <strong className="text-white">{currentDevice.label}</strong> styles.
          {styleDevice !== 'desktop'
            ? ` Empty values use the ${styleDevice === 'phone' ? 'tablet or desktop' : 'desktop'} value.`
            : ' Switch device with the buttons above the preview.'}
        </span>
      </div>

      {isImage ? (
        <>
          {/* An image: size, crop, corners and frame. Text options do not apply. */}
          <Group title="Image size">
            <div className="grid grid-cols-3 gap-2">
              {row('Width', 'width', <>{textInput('width', 'e.g. 300 or 50%')}</>)}
              {row('Max width', 'maxWidth', <>{textInput('maxWidth', 'e.g. 600')}</>)}
              {row('Height', 'height', <>{textInput('height', 'e.g. 200')}</>)}
            </div>
            {row('Aspect ratio', 'aspectRatio', <>{presets('aspectRatio', { Square: '1 / 1', '4:3': '4 / 3', '3:2': '3 / 2', '16:9': '16 / 9', Portrait: '3 / 4' })}
              {textInput('aspectRatio', 'e.g. 16 / 9')}</>)}
          </Group>

          <Group title="Fit & focus">
            {row('Fit', 'objectFit', <>{presets('objectFit', { Cover: 'cover', Contain: 'contain', Fill: 'fill', None: 'none' })}</>)}
            {row('Focus', 'objectPosition', <>{presets('objectPosition', { Center: 'center', Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' })}
              {textInput('objectPosition', 'e.g. 50% 20%')}</>)}
            {row('Opacity', 'opacity', <>{presets('opacity', { '100%': '1', '75%': '0.75', '50%': '0.5', '25%': '0.25' })}
              {textInput('opacity', '0 to 1')}</>)}
          </Group>

          <Group title="Corners & border">
            {row('Corner radius', 'borderRadius', <>{presets('borderRadius', options?.radii)}
              {textInput('borderRadius', 'e.g. 12px')}</>)}
            {row('Border width', 'borderWidth', <>{textInput('borderWidth', 'e.g. 1px')}</>)}
            {colorRow('Border colour', 'borderColor')}
          </Group>

          <Group title="Spacing">{sides('margin')}</Group>
        </>
      ) : (
        <>
          <Group title="Typography">
            {colorRow('Colour', 'color')}
            {row('Font size', 'fontSize', <>{presets('fontSize', options?.fontSizes)}
              {textInput('fontSize', 'e.g. 2rem or 32px')}</>)}
            {row('Weight', 'fontWeight', <>{presets('fontWeight', { Light: '300', Regular: '400', Medium: '500', Semibold: '600', Bold: '700', Black: '800' })}</>)}
            {fonts && fonts.length > 0 && row('Font', 'fontFamily', <>{presets('fontFamily', Object.fromEntries(fonts.map((f) => [f, f])))}</>)}
            <div className="grid grid-cols-2 gap-2">
              {row('Line height', 'lineHeight', <>{textInput('lineHeight', 'e.g. 1.4')}</>)}
              {row('Letter spacing', 'letterSpacing', <>{textInput('letterSpacing', 'e.g. 0.02em')}</>)}
            </div>
            {row('Align', 'textAlign', <>{presets('textAlign', { Left: 'left', Center: 'center', Right: 'right', Justify: 'justify' })}</>)}
          </Group>

          <Group title="Spacing">
            {sides('margin')}
            {sides('padding')}
          </Group>

          <Group title="Size">
            <div className="grid grid-cols-3 gap-2">
              {row('Width', 'width', <>{textInput('width', 'e.g. 300 or 50%')}</>)}
              {row('Max width', 'maxWidth', <>{textInput('maxWidth', 'e.g. 600')}</>)}
              {row('Height', 'height', <>{textInput('height', 'e.g. 200')}</>)}
            </div>
          </Group>

          <Group title="Background & border">
            {colorRow('Background', 'backgroundColor')}
            {row('Corner radius', 'borderRadius', <>{presets('borderRadius', options?.radii)}
              {textInput('borderRadius', 'e.g. 12px')}</>)}
            {row('Border width', 'borderWidth', <>{textInput('borderWidth', 'e.g. 1px')}</>)}
            {colorRow('Border colour', 'borderColor')}
          </Group>
        </>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => void onReset()}
          disabled={isSaving || !hasSavedStyle}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-200 bg-amber-950/40 border border-amber-700/60 hover:bg-amber-900/60 disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset styles
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 border border-purple-400 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save & Publish
        </button>
      </div>
    </div>
  );
};
