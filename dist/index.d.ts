import { a as CmsConfig, P as PageDef, b as StyleProps, F as FieldStyle, c as StyleSheetData, S as SectionRecord, d as SectionDetail, e as SectionMetadata, f as CollectionItemSummary } from './types-D_1RArqc.js';
export { C as CmsStorageAdapter, g as CmsStyleOptions, h as CmsWidgets, i as CodeValue, j as CodeWidgetProps, k as CollectionLimit, I as IconComponent, l as ImagePreset, m as ImagePresetCategory, L as ListOptions, M as MediaItem, n as SaveRecordInput, o as SectionDef } from './types-D_1RArqc.js';
import 'react';

/** True for keys safe to use as page or section identifiers in storage and URLs. */
declare function isValidKey(key: string): boolean;
/**
 * Validate and return a CMS configuration. Throws on duplicate or malformed keys
 * so mistakes surface at startup instead of as silent save failures.
 */
declare function defineCms(config: CmsConfig): CmsConfig;
/** The page with `global: true` (site-wide content), if any. */
declare function findGlobalPage(config: Pick<CmsConfig, 'pages'>): PageDef | undefined;
/**
 * Which page a section belongs to, as seen from the page open in the studio: the page named by
 * the click, else the open page, else the global page.
 */
declare function resolveSectionPage(config: Pick<CmsConfig, 'pages'>, currentPage: string, sectionKey: string, requestedPage?: string): string | undefined;
declare function findPage(config: Pick<CmsConfig, 'pages'>, pageKey: string): PageDef | undefined;

/**
 * Turn a theme section ({ primaryColor: "#7c3aed", headingFont: "Inter" }) into CSS variables
 * (--primary-color, --heading-font). Nested objects are joined with "-": { colors: { brand } }
 * becomes --colors-brand. Only strings and numbers are used, and values that could break out of
 * the declaration (";", "{", "}", "<", ">", "\" or a line break) are skipped, because editors type them.
 */
declare function themeToCssVariables(theme: unknown, options?: {
    prefix?: string;
}): Record<string, string>;
/** CSS text for a theme section: `:root{--primary-color:#7c3aed;}`. Use `selector` for a scope other than :root. */
declare function themeToCss(theme: unknown, options?: {
    prefix?: string;
    selector?: string;
}): string;
/** True when a form field holds a colour: a hex value, or a name ending in "color"/"colour". */
declare function isColorField(fieldName: string, value: unknown): boolean;
/** True when a form field picks one of the site's fonts (`fonts` in defineCms). */
declare function isFontField(fieldName: string, value: unknown, fonts: string[] | undefined): boolean;

/**
 * Field styles: the look of one field (colour, size, spacing...) set in the studio's Style tab.
 * A page's styles are one record, { page, sectionKey: "_styles", content: StyleSheetData }, saved
 * through the normal storage adapter, so they reach the site with the page content.
 */
declare const STYLES_KEY = "_styles";
/** Default widths at which the tablet and phone values take over. */
declare const DEFAULT_BREAKPOINTS: {
    readonly tablet: 1024;
    readonly phone: 768;
};
declare const STYLE_PROPERTIES: (keyof StyleProps)[];
/** Id of a field in the data-cms-style attribute and in its CSS selector. */
declare function styleId(page: string, section: string, path: string): string;
/** Keep only known properties with safe, non-empty string values. */
declare function sanitizeStyleProps(props: unknown): StyleProps;
/** True when the field has at least one usable value on any device. */
declare function hasFieldStyle(style: FieldStyle | undefined | null): boolean;
/**
 * CSS for one field: the desktop rules, then media blocks for tablet and phone. The attribute is
 * repeated in the selector (specificity 0,2,0) so the rules win over single utility classes.
 * `wrapper`: the element is the <span> the library added, which needs inline-block for box values.
 */
declare function fieldStyleToCss(id: string, style: FieldStyle | undefined | null, options?: {
    breakpoints?: {
        tablet?: number;
        phone?: number;
    };
    wrapper?: boolean;
}): string;
/** Set (or with null, remove) one field's style, keeping every other field of the page. */
declare function setFieldStyle(sheet: StyleSheetData | undefined | null, section: string, path: string, style: FieldStyle | null): StyleSheetData;
/** True when a URL path matches a page route; "[slug]" matches one segment. */
declare function routeMatches(route: string, pathname: string): boolean;
/**
 * The page a field's styles belong to: the page given on the field or its section; otherwise the
 * only page with this section key (the global page included); otherwise the page whose route
 * matches `pathname`. Undefined when it cannot be told.
 */
declare function resolveFieldPage(config: Pick<CmsConfig, 'pages'>, section: string, explicitPage?: string, pathname?: string): string | undefined;

/**
 * Full content of a page: its defaults, with each saved override replacing its
 * section. Unpublished overrides are applied only when `includeDrafts` is true.
 */
declare function mergePageContent<T = Record<string, unknown>>(page: PageDef, records: SectionRecord[], options?: {
    includeDrafts?: boolean;
}): T;
/** Every editable section key of a page: its defaults' keys, then any extra declared sections. */
declare function getSectionKeys(page: PageDef): string[];
/** Metadata for every editable section of the given pages. */
declare function listManagedSections(pages: PageDef[], records: SectionRecord[]): SectionMetadata[];
/**
 * One section as the editor sees it: the saved override (draft or published) if
 * there is one, otherwise the default. Returns null for an unknown section.
 */
declare function getSectionDetail<T = unknown>(page: PageDef, sectionKey: string, record: SectionRecord | null): SectionDetail<T> | null;

/**
 * Messages exchanged between the studio (parent window) and the public page in
 * the preview iframe. Names are part of the public protocol; keep them stable.
 */
declare const CMS_MESSAGE: {
    /** iframe -> studio: a section's, a single field's or a record field's edit button was clicked. */
    readonly EDIT_SECTION: "CMS_EDIT_SECTION";
    /** studio -> iframe: scroll to and highlight a section. */
    readonly SCROLL_TO_SECTION: "SCROLL_TO_SECTION";
    /** studio -> iframe: show or hide the edit affordances. */
    readonly SET_EDIT_MODE: "SET_CMS_EDIT_MODE";
    /** studio -> iframe: unsaved form content to render immediately. */
    readonly DRAFT_PREVIEW: "CMS_DRAFT_PREVIEW";
    /** studio -> iframe: content was saved or reset, fetch it again. */
    readonly CONTENT_UPDATED: "CMS_CONTENT_UPDATED";
    /** studio -> iframe: unsaved values of a collection record, to render immediately. */
    readonly ITEM_DRAFT: "CMS_ITEM_DRAFT";
    /** studio -> iframe: unsaved style of one field (null clears it), to render immediately. */
    readonly STYLE_DRAFT: "CMS_STYLE_DRAFT";
};
/** Query flag that marks a page as loaded inside the studio. */
declare const PREVIEW_PARAM = "cms_preview";
/** Query flag that turns the hover-to-edit buttons on. */
declare const EDIT_MODE_PARAM = "cms_edit_mode";
type CmsMessage = {
    type: typeof CMS_MESSAGE.EDIT_SECTION;
    sectionKey: string;
    /** Page the section belongs to, e.g. the global page for a navbar. Default: the open page. */
    page?: string;
    title?: string;
    fieldPath?: string;
    /** Set when the field belongs to a collection record instead of a section. */
    collection?: string;
    item?: string;
} | {
    type: typeof CMS_MESSAGE.SCROLL_TO_SECTION;
    sectionKey: string;
} | {
    type: typeof CMS_MESSAGE.SET_EDIT_MODE;
    enabled: boolean;
} | {
    type: typeof CMS_MESSAGE.DRAFT_PREVIEW;
    page: string;
    sectionKey: string;
    draftContent: unknown;
} | {
    type: typeof CMS_MESSAGE.CONTENT_UPDATED;
} | {
    type: typeof CMS_MESSAGE.ITEM_DRAFT;
    collection: string;
    item: string;
    values: Record<string, unknown> | null;
} | {
    type: typeof CMS_MESSAGE.STYLE_DRAFT;
    page: string;
    sectionKey: string;
    path: string;
    style: FieldStyle | null;
};
declare function isCmsMessage(data: unknown): data is CmsMessage;
/** Origin of a URL, or null when it cannot be parsed. */
declare function originOf(url: string | undefined | null, base?: string): string | null;
/** The current window's origin plus any extra allowed origins, de-duplicated. */
declare function trustedOrigins(extra?: (string | null | undefined)[]): string[];
/**
 * Send a message to another window, once per trusted origin. The browser drops
 * the copies whose origin does not match the target, so content never leaks to
 * an unexpected page (unlike posting with "*").
 */
declare function postCmsMessage(target: Window | null | undefined, message: CmsMessage, origins: string[]): void;
/** Subscribe to CMS messages from trusted origins (and optionally one source window). */
declare function listenForCmsMessages(handler: (message: CmsMessage, event: MessageEvent) => void, options: {
    origins: string[];
    source?: () => Window | null | undefined;
}): () => void;

/** Absolute public URL of a route, using `publicSiteUrl` when the site runs on another origin. */
declare function publicUrl(route: string, publicSiteUrl?: string): string;
/** URL loaded in the studio's preview iframe. */
declare function buildPreviewUrl(route: string, options?: {
    publicSiteUrl?: string;
    editMode?: boolean;
    cacheBust?: number | string;
}): string;

/** True for routes with a [param] segment, such as "/blog/[slug]". */
declare function isDynamicRoute(route: string): boolean;
/**
 * The public URL of one record: each [name] in the route is replaced by `item.params[name]`,
 * or by the id when there is no such param. "/blog/[slug]" + { id: "school" } -> "/blog/school".
 */
declare function fillRoute(route: string, item: Pick<CollectionItemSummary, 'id' | 'params'>): string;
/** Pages shown in the studio's page menu: every page that does not belong to a parent page. */
declare function topLevelPages(config: Pick<CmsConfig, 'pages'>): PageDef[];
/** The top-level page a page is listed under (itself when it has no parent). */
declare function groupPageOf(config: Pick<CmsConfig, 'pages'>, page: PageDef): PageDef;
/**
 * The pages whose records appear in the record menu of a top-level page: its children with a
 * collection, plus the page itself when it shows records.
 */
declare function recordPagesOf(config: Pick<CmsConfig, 'pages'>, group: PageDef): PageDef[];

export { CMS_MESSAGE, CmsConfig, type CmsMessage, CollectionItemSummary, DEFAULT_BREAKPOINTS, EDIT_MODE_PARAM, FieldStyle, PREVIEW_PARAM, PageDef, STYLES_KEY, STYLE_PROPERTIES, SectionDetail, SectionMetadata, SectionRecord, StyleProps, StyleSheetData, buildPreviewUrl, defineCms, fieldStyleToCss, fillRoute, findGlobalPage, findPage, getSectionDetail, getSectionKeys, groupPageOf, hasFieldStyle, isCmsMessage, isColorField, isDynamicRoute, isFontField, isValidKey, listManagedSections, listenForCmsMessages, mergePageContent, originOf, postCmsMessage, publicUrl, recordPagesOf, resolveFieldPage, resolveSectionPage, routeMatches, sanitizeStyleProps, setFieldStyle, styleId, themeToCss, themeToCssVariables, topLevelPages, trustedOrigins };
