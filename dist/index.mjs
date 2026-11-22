import {
  CMS_MESSAGE,
  EDIT_MODE_PARAM,
  PREVIEW_PARAM,
  defineCms,
  findGlobalPage,
  findPage,
  getSectionDetail,
  getSectionKeys,
  isCmsMessage,
  isValidKey,
  listManagedSections,
  listenForCmsMessages,
  mergePageContent,
  originOf,
  postCmsMessage,
  resolveSectionPage,
  trustedOrigins
} from "./chunk-MZUPSDIN.mjs";

// src/core/theme.ts
function themeToCssVariables(theme, options = {}) {
  const prefix = options.prefix ?? "--";
  const out = {};
  const walk = (value, name) => {
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (!text || /[;{}<>\\\r\n]/.test(text)) return;
      const key = name.map(toKebab).filter(Boolean).join("-");
      if (/^[a-z0-9-]+$/.test(key)) out[prefix + key] = text;
      return;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, inner] of Object.entries(value)) walk(inner, [...name, key]);
    }
  };
  walk(theme, []);
  return out;
}
function themeToCss(theme, options = {}) {
  const vars = themeToCssVariables(theme, options);
  const body = Object.entries(vars).map(([key, value]) => `${key}:${value};`).join("");
  return body ? `${options.selector ?? ":root"}{${body}}` : "";
}
function toKebab(part) {
  return part.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[_\s]+/g, "-").toLowerCase();
}
function isColorField(fieldName, value) {
  if (typeof value !== "string") return false;
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim())) return true;
  return /colou?r$/i.test(fieldName) && (value === "" || /^#/.test(value.trim()));
}
function isFontField(fieldName, value, fonts) {
  return !!fonts?.length && typeof value === "string" && /font$/i.test(fieldName);
}

// src/core/styles.ts
var STYLES_KEY = "_styles";
var DEFAULT_BREAKPOINTS = { tablet: 1024, phone: 768 };
var CSS_NAMES = {
  color: "color",
  fontSize: "font-size",
  fontWeight: "font-weight",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  textAlign: "text-align",
  fontFamily: "font-family",
  marginTop: "margin-top",
  marginRight: "margin-right",
  marginBottom: "margin-bottom",
  marginLeft: "margin-left",
  paddingTop: "padding-top",
  paddingRight: "padding-right",
  paddingBottom: "padding-bottom",
  paddingLeft: "padding-left",
  width: "width",
  maxWidth: "max-width",
  height: "height",
  backgroundColor: "background-color",
  borderRadius: "border-radius",
  borderWidth: "border-width",
  borderColor: "border-color",
  objectFit: "object-fit",
  objectPosition: "object-position",
  aspectRatio: "aspect-ratio",
  opacity: "opacity"
};
var STYLE_PROPERTIES = Object.keys(CSS_NAMES);
var BOX_PROPERTIES = [
  "width",
  "maxWidth",
  "height",
  "aspectRatio",
  "marginTop",
  "marginBottom",
  "paddingTop",
  "paddingBottom",
  "backgroundColor",
  "borderRadius",
  "borderWidth"
];
var IMAGE_INNER = ["objectFit", "objectPosition"];
var UNSAFE = /[;{}<>\\\r\n]/;
function styleId(page, section, path) {
  return `${page}:${section}:${path}`;
}
function sanitizeStyleProps(props) {
  const out = {};
  if (!props || typeof props !== "object") return out;
  for (const [key, value] of Object.entries(props)) {
    if (!(key in CSS_NAMES)) continue;
    if (typeof value !== "string" && typeof value !== "number") continue;
    const text = String(value).trim();
    if (!text || UNSAFE.test(text)) continue;
    out[key] = text;
  }
  return out;
}
function hasFieldStyle(style) {
  if (!style) return false;
  return ["desktop", "tablet", "phone"].some((d) => Object.keys(sanitizeStyleProps(style[d])).length > 0);
}
function declarations(props, wrapper, skip = []) {
  let css = "";
  for (const key of STYLE_PROPERTIES) {
    const value = props[key];
    if (value === void 0 || skip.includes(key)) continue;
    css += `${CSS_NAMES[key]}:${value};`;
    if (key === "borderWidth") css += "border-style:solid;";
  }
  if (wrapper && BOX_PROPERTIES.some((key) => props[key] !== void 0)) css += "display:inline-block;";
  return css;
}
function imageWrapperDeclarations(props) {
  let outer = declarations(props, true, IMAGE_INNER);
  if (outer.includes("display:inline-block;")) outer += "vertical-align:top;";
  if (props.borderRadius !== void 0) outer += "overflow:hidden;";
  let inner = "";
  if (props.width !== void 0 || props.maxWidth !== void 0) inner += "width:100%;";
  if (props.height !== void 0 || props.aspectRatio !== void 0) inner += "height:100%;";
  for (const key of IMAGE_INNER) if (props[key] !== void 0) inner += `${CSS_NAMES[key]}:${props[key]};`;
  if (props.borderRadius !== void 0) inner += `border-radius:${props.borderRadius};`;
  return [outer, inner];
}
function fieldStyleToCss(id, style, options = {}) {
  if (!style) return "";
  const attr = `[data-cms-style="${id.replace(/["\\]/g, "\\$&")}"]`;
  const selector = attr + attr;
  const wrapper = options.wrapper ?? false;
  const tablet = options.breakpoints?.tablet ?? DEFAULT_BREAKPOINTS.tablet;
  const phone = options.breakpoints?.phone ?? DEFAULT_BREAKPOINTS.phone;
  const imageInWrapper = style.kind === "image" && wrapper;
  const rules = (props) => {
    if (!imageInWrapper) {
      const body = declarations(props, wrapper);
      return body ? `${selector}{${body}}` : "";
    }
    const [outer, inner] = imageWrapperDeclarations(props);
    return (outer ? `${selector}{${outer}}` : "") + (inner ? `${selector} img{${inner}}` : "");
  };
  let css = rules(sanitizeStyleProps(style.desktop));
  for (const [device, width] of [["tablet", tablet], ["phone", phone]]) {
    const body = rules(sanitizeStyleProps(style[device]));
    if (body) css += `@media (max-width:${width - 0.02}px){${body}}`;
  }
  return css;
}
function setFieldStyle(sheet, section, path, style) {
  const next = {};
  for (const [key, fields] of Object.entries(sheet ?? {})) next[key] = { ...fields };
  if (style && hasFieldStyle(style)) {
    next[section] = { ...next[section] ?? {}, [path]: style };
  } else if (next[section]) {
    delete next[section][path];
    if (Object.keys(next[section]).length === 0) delete next[section];
  }
  return next;
}
function routeMatches(route, pathname) {
  const clean = (p) => p.length > 1 ? p.replace(/\/+$/, "") : p;
  const pattern = clean(route).split("/").map((part) => /^\[[^\]]+\]$/.test(part) ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("/");
  return new RegExp(`^${pattern}$`).test(clean(pathname));
}
function resolveFieldPage(config, section, explicitPage, pathname) {
  if (explicitPage) return explicitPage;
  const owners = config.pages.filter((p) => p.sections.some((s) => s.key === section));
  if (owners.length === 1) return owners[0].key;
  if (owners.length === 0 || !pathname) return void 0;
  const matching = owners.filter((p) => !p.global && routeMatches(p.route, pathname));
  return matching.length === 1 ? matching[0].key : void 0;
}

// src/core/paths.ts
function publicUrl(route, publicSiteUrl) {
  if (!publicSiteUrl) return route;
  return `${publicSiteUrl.replace(/\/+$/, "")}${route.startsWith("/") ? route : `/${route}`}`;
}
function buildPreviewUrl(route, options = {}) {
  const base = publicUrl(route, options.publicSiteUrl);
  const params = [`${PREVIEW_PARAM}=1`];
  if (options.editMode) params.push(`${EDIT_MODE_PARAM}=1`);
  if (options.cacheBust !== void 0) params.push(`t=${encodeURIComponent(String(options.cacheBust))}`);
  return `${base}${base.includes("?") ? "&" : "?"}${params.join("&")}`;
}

// src/core/collections.ts
var BRACKET = /\[(?:\.\.\.)?([A-Za-z0-9_]+)\]/g;
function isDynamicRoute(route) {
  return /\[[^\]]+\]/.test(route);
}
function fillRoute(route, item) {
  return route.replace(BRACKET, (_, name) => encodeURIComponent(item.params?.[name] ?? item.id));
}
function topLevelPages(config) {
  return config.pages.filter((p) => !p.parent);
}
function groupPageOf(config, page) {
  return page.parent && config.pages.find((p) => p.key === page.parent) || page;
}
function recordPagesOf(config, group) {
  const children = config.pages.filter((p) => p.parent === group.key && p.collection);
  return group.collection ? [group, ...children] : children;
}
export {
  CMS_MESSAGE,
  DEFAULT_BREAKPOINTS,
  EDIT_MODE_PARAM,
  PREVIEW_PARAM,
  STYLES_KEY,
  STYLE_PROPERTIES,
  buildPreviewUrl,
  defineCms,
  fieldStyleToCss,
  fillRoute,
  findGlobalPage,
  findPage,
  getSectionDetail,
  getSectionKeys,
  groupPageOf,
  hasFieldStyle,
  isCmsMessage,
  isColorField,
  isDynamicRoute,
  isFontField,
  isValidKey,
  listManagedSections,
  listenForCmsMessages,
  mergePageContent,
  originOf,
  postCmsMessage,
  publicUrl,
  recordPagesOf,
  resolveFieldPage,
  resolveSectionPage,
  routeMatches,
  sanitizeStyleProps,
  setFieldStyle,
  styleId,
  themeToCss,
  themeToCssVariables,
  topLevelPages,
  trustedOrigins
};
