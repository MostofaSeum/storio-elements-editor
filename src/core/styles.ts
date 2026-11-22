import type { CmsConfig, FieldStyle, StyleProps, StyleSheetData } from './types';

/**
 * Field styles: the look of one field (colour, size, spacing...) set in the studio's Style tab.
 * A page's styles are one record, { page, sectionKey: "_styles", content: StyleSheetData }, saved
 * through the normal storage adapter, so they reach the site with the page content.
 */
export const STYLES_KEY = '_styles';

/** Default widths at which the tablet and phone values take over. */
export const DEFAULT_BREAKPOINTS = { tablet: 1024, phone: 768 } as const;

/** Every style property the Style tab can set, mapped to its CSS name. */
const CSS_NAMES: Record<keyof StyleProps, string> = {
  color: 'color',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  textAlign: 'text-align',
  fontFamily: 'font-family',
  marginTop: 'margin-top',
  marginRight: 'margin-right',
  marginBottom: 'margin-bottom',
  marginLeft: 'margin-left',
  paddingTop: 'padding-top',
  paddingRight: 'padding-right',
  paddingBottom: 'padding-bottom',
  paddingLeft: 'padding-left',
  width: 'width',
  maxWidth: 'max-width',
  height: 'height',
  backgroundColor: 'background-color',
  borderRadius: 'border-radius',
  borderWidth: 'border-width',
  borderColor: 'border-color',
  objectFit: 'object-fit',
  opacity: 'opacity',
};

export const STYLE_PROPERTIES = Object.keys(CSS_NAMES) as (keyof StyleProps)[];

/** Properties that only work on a box, so a wrapper <span> needs display: inline-block for them. */
const BOX_PROPERTIES: (keyof StyleProps)[] = [
  'width', 'maxWidth', 'height', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom',
  'backgroundColor', 'borderRadius', 'borderWidth',
];

/** Characters that could end the declaration or the <style> element. Editors type these values. */
const UNSAFE = /[;{}<>\\\r\n]/;

/** Id of a field in the data-cms-style attribute and in its CSS selector. */
export function styleId(page: string, section: string, path: string): string {
  return `${page}:${section}:${path}`;
}

/** Keep only known properties with safe, non-empty string values. */
export function sanitizeStyleProps(props: unknown): StyleProps {
  const out: StyleProps = {};
  if (!props || typeof props !== 'object') return out;
  for (const [key, value] of Object.entries(props)) {
    if (!(key in CSS_NAMES)) continue;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    const text = String(value).trim();
    if (!text || UNSAFE.test(text)) continue;
    out[key as keyof StyleProps] = text;
  }
  return out;
}

/** True when the field has at least one usable value on any device. */
export function hasFieldStyle(style: FieldStyle | undefined | null): boolean {
  if (!style) return false;
  return (['desktop', 'tablet', 'phone'] as const).some((d) => Object.keys(sanitizeStyleProps(style[d])).length > 0);
}

function declarations(props: StyleProps, wrapper: boolean): string {
  let css = '';
  for (const key of STYLE_PROPERTIES) {
    const value = props[key];
    if (value === undefined) continue;
    css += `${CSS_NAMES[key]}:${value};`;
    if (key === 'borderWidth') css += 'border-style:solid;';
  }
  if (wrapper && BOX_PROPERTIES.some((key) => props[key] !== undefined)) css += 'display:inline-block;';
  return css;
}

/**
 * CSS for one field: the desktop rules, then media blocks for tablet and phone. The attribute is
 * repeated in the selector (specificity 0,2,0) so the rules win over single utility classes.
 * `wrapper`: the element is the <span> the library added, which needs inline-block for box values.
 */
export function fieldStyleToCss(
  id: string,
  style: FieldStyle | undefined | null,
  options: { breakpoints?: { tablet?: number; phone?: number }; wrapper?: boolean } = {}
): string {
  if (!style) return '';
  const attr = `[data-cms-style="${id.replace(/["\\]/g, '\\$&')}"]`;
  const selector = attr + attr;
  const wrapper = options.wrapper ?? false;
  const tablet = options.breakpoints?.tablet ?? DEFAULT_BREAKPOINTS.tablet;
  const phone = options.breakpoints?.phone ?? DEFAULT_BREAKPOINTS.phone;
  let css = '';
  const desktop = declarations(sanitizeStyleProps(style.desktop), wrapper);
  if (desktop) css += `${selector}{${desktop}}`;
  for (const [device, width] of [['tablet', tablet], ['phone', phone]] as const) {
    const body = declarations(sanitizeStyleProps(style[device]), wrapper);
    if (body) css += `@media (max-width:${width - 0.02}px){${selector}{${body}}}`;
  }
  return css;
}

/** Set (or with null, remove) one field's style, keeping every other field of the page. */
export function setFieldStyle(
  sheet: StyleSheetData | undefined | null,
  section: string,
  path: string,
  style: FieldStyle | null
): StyleSheetData {
  const next: StyleSheetData = {};
  for (const [key, fields] of Object.entries(sheet ?? {})) next[key] = { ...fields };
  if (style && hasFieldStyle(style)) {
    next[section] = { ...(next[section] ?? {}), [path]: style };
  } else if (next[section]) {
    delete next[section][path];
    if (Object.keys(next[section]).length === 0) delete next[section];
  }
  return next;
}

/** True when a URL path matches a page route; "[slug]" matches one segment. */
export function routeMatches(route: string, pathname: string): boolean {
  const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);
  const pattern = clean(route)
    .split('/')
    .map((part) => (/^\[[^\]]+\]$/.test(part) ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return new RegExp(`^${pattern}$`).test(clean(pathname));
}

/**
 * The page a field's styles belong to: the page given on the field or its section; otherwise the
 * only page with this section key (the global page included); otherwise the page whose route
 * matches `pathname`. Undefined when it cannot be told.
 */
export function resolveFieldPage(
  config: Pick<CmsConfig, 'pages'>,
  section: string,
  explicitPage?: string,
  pathname?: string
): string | undefined {
  if (explicitPage) return explicitPage;
  const owners = config.pages.filter((p) => p.sections.some((s) => s.key === section));
  if (owners.length === 1) return owners[0].key;
  if (owners.length === 0 || !pathname) return undefined;
  const matching = owners.filter((p) => !p.global && routeMatches(p.route, pathname));
  return matching.length === 1 ? matching[0].key : undefined;
}
