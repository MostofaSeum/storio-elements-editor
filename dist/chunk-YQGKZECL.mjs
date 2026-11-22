"use client";

// src/core/defineCms.ts
function findGlobalPage(config) {
  return config.pages.find((p) => p.global);
}
function resolveSectionPage(config, currentPage, sectionKey, requestedPage) {
  const has = (key) => !!key && !!findPage(config, key)?.sections.some((s) => s.key === sectionKey);
  if (requestedPage) return has(requestedPage) ? requestedPage : void 0;
  if (has(currentPage)) return currentPage;
  const globalPage = findGlobalPage(config);
  return globalPage && has(globalPage.key) ? globalPage.key : void 0;
}
function findPage(config, pageKey) {
  return config.pages.find((p) => p.key === pageKey);
}

// src/core/merge.ts
function clone(value) {
  if (value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}
function mergePageContent(page, records, options = {}) {
  const result = clone(page.defaults);
  for (const record of records) {
    if (record.page !== page.key) continue;
    if (!options.includeDrafts && !record.isPublished) continue;
    if (record.content !== null && record.content !== void 0) {
      result[record.sectionKey] = clone(record.content);
    }
  }
  return result;
}
function getSectionDetail(page, sectionKey, record) {
  const hasDefault = Object.prototype.hasOwnProperty.call(page.defaults, sectionKey);
  const declared = page.sections.some((s) => s.key === sectionKey);
  if (!record && !hasDefault && !declared) return null;
  const content = record && record.content !== null && record.content !== void 0 ? record.content : page.defaults[sectionKey] ?? {};
  return {
    page: page.key,
    sectionKey,
    content: clone(content),
    hasCustomOverride: Boolean(record),
    isPublished: record ? record.isPublished : true,
    updatedAt: record ? record.updatedAt : null,
    updatedBy: record?.updatedBy ?? null
  };
}

// src/core/messages.ts
var CMS_MESSAGE = {
  /** iframe -> studio: a section's, a single field's or a record field's edit button was clicked. */
  EDIT_SECTION: "CMS_EDIT_SECTION",
  /** studio -> iframe: scroll to and highlight a section. */
  SCROLL_TO_SECTION: "SCROLL_TO_SECTION",
  /** studio -> iframe: show or hide the edit affordances. */
  SET_EDIT_MODE: "SET_CMS_EDIT_MODE",
  /** studio -> iframe: unsaved form content to render immediately. */
  DRAFT_PREVIEW: "CMS_DRAFT_PREVIEW",
  /** studio -> iframe: content was saved or reset, fetch it again. */
  CONTENT_UPDATED: "CMS_CONTENT_UPDATED",
  /** studio -> iframe: unsaved values of a collection record, to render immediately. */
  ITEM_DRAFT: "CMS_ITEM_DRAFT"
};
var PREVIEW_PARAM = "cms_preview";
var EDIT_MODE_PARAM = "cms_edit_mode";
var MESSAGE_TYPES = new Set(Object.values(CMS_MESSAGE));
function isCmsMessage(data) {
  return typeof data === "object" && data !== null && typeof data.type === "string" && MESSAGE_TYPES.has(data.type);
}
function originOf(url, base) {
  if (!url) return null;
  try {
    return new URL(url, base).origin;
  } catch {
    return null;
  }
}
function trustedOrigins(extra = []) {
  const set = /* @__PURE__ */ new Set();
  if (typeof window !== "undefined") set.add(window.location.origin);
  for (const value of extra) {
    const origin = originOf(value ?? void 0);
    if (origin) set.add(origin);
  }
  return Array.from(set);
}
function postCmsMessage(target, message, origins) {
  if (!target) return;
  const payload = JSON.parse(JSON.stringify(message));
  for (const origin of origins) {
    try {
      target.postMessage(payload, origin);
    } catch {
    }
  }
}
function listenForCmsMessages(handler, options) {
  if (typeof window === "undefined") return () => void 0;
  const listener = (event) => {
    if (!options.origins.includes(event.origin)) return;
    if (options.source) {
      const expected = options.source();
      if (expected && event.source !== expected) return;
    }
    if (!isCmsMessage(event.data)) return;
    handler(event.data, event);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

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
function parseFieldPath(path) {
  return path.split(".").map((part) => /^\d+$/.test(part) ? Number(part) : part);
}
function getAtPath(data, path) {
  let current = data;
  for (const part of path) {
    if (current === null || typeof current !== "object") return void 0;
    if (Array.isArray(current) && typeof part !== "number") return void 0;
    if (!Object.prototype.hasOwnProperty.call(current, part)) return void 0;
    current = current[part];
  }
  return current;
}
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

export {
  findGlobalPage,
  resolveSectionPage,
  findPage,
  mergePageContent,
  getSectionDetail,
  CMS_MESSAGE,
  PREVIEW_PARAM,
  EDIT_MODE_PARAM,
  originOf,
  trustedOrigins,
  postCmsMessage,
  listenForCmsMessages,
  themeToCss,
  isColorField,
  isFontField,
  parseFieldPath,
  getAtPath,
  publicUrl,
  buildPreviewUrl
};
