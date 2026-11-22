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
} from "./chunk-CEOSGCRC.mjs";

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
  EDIT_MODE_PARAM,
  PREVIEW_PARAM,
  buildPreviewUrl,
  defineCms,
  fillRoute,
  findGlobalPage,
  findPage,
  getSectionDetail,
  getSectionKeys,
  groupPageOf,
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
  resolveSectionPage,
  themeToCss,
  themeToCssVariables,
  topLevelPages,
  trustedOrigins
};
