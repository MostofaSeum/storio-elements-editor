"use client";
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/admin/index.ts
var admin_exports = {};
__export(admin_exports, {
  CmsAuthGate: () => CmsAuthGate,
  CmsLogin: () => CmsLogin,
  CmsLogoutButton: () => CmsLogoutButton,
  CmsNavButton: () => CmsNavButton,
  CmsStudio: () => CmsStudio,
  POPULAR_ICONS: () => POPULAR_ICONS,
  getDynamicIcon: () => getDynamicIcon,
  safeNext: () => safeNext
});
module.exports = __toCommonJS(admin_exports);

// src/admin/CmsStudio.tsx
var import_react9 = require("react");
var import_react_hot_toast5 = require("react-hot-toast");
var import_lucide_react8 = require("lucide-react");

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

// src/admin/StudioContext.tsx
var import_react = require("react");

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
  ITEM_DRAFT: "CMS_ITEM_DRAFT",
  /** studio -> iframe: unsaved style of one field (null clears it), to render immediately. */
  STYLE_DRAFT: "CMS_STYLE_DRAFT"
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

// src/admin/StudioContext.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var StudioContext = (0, import_react.createContext)(null);
var StudioProvider = ({ config, children }) => {
  const [origins, setOrigins] = (0, import_react.useState)([]);
  (0, import_react.useEffect)(() => {
    const extra = [...config.allowedOrigins ?? []];
    const siteOrigin = originOf(config.publicSiteUrl);
    if (siteOrigin) extra.push(siteOrigin);
    setOrigins(trustedOrigins(extra));
  }, [config.allowedOrigins, config.publicSiteUrl]);
  const value = (0, import_react.useMemo)(() => ({ config, origins }), [config, origins]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioContext.Provider, { value, children });
};
function useStudio() {
  const ctx = (0, import_react.useContext)(StudioContext);
  if (!ctx) throw new Error("[storio-editor] Studio components must be rendered inside <CmsStudio>.");
  return ctx;
}

// src/admin/CanvasEditor.tsx
var import_react8 = __toESM(require("react"));
var import_lucide_react7 = require("lucide-react");
var import_react_hot_toast4 = __toESM(require("react-hot-toast"));

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

// src/core/merge.ts
function clone(value) {
  if (value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
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

// src/core/styles.ts
var STYLES_KEY = "_styles";
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
var UNSAFE = /[;{}<>\\\r\n]/;
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

// src/admin/SectionEditorForm.tsx
var import_react6 = require("react");
var import_lucide_react5 = require("lucide-react");
var import_react_hot_toast3 = __toESM(require("react-hot-toast"));

// src/core/theme.ts
function isColorField(fieldName, value) {
  if (typeof value !== "string") return false;
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim())) return true;
  return /colou?r$/i.test(fieldName) && (value === "" || /^#/.test(value.trim()));
}
function isFontField(fieldName, value, fonts) {
  return !!fonts?.length && typeof value === "string" && /font$/i.test(fieldName);
}

// src/admin/JsonInspectorModal.tsx
var import_react2 = require("react");
var import_react_dom = require("react-dom");
var import_lucide_react = require("lucide-react");
var import_react_hot_toast = __toESM(require("react-hot-toast"));
var import_jsx_runtime2 = require("react/jsx-runtime");
var JsonInspectorModal = ({
  isOpen,
  onClose,
  sectionTitle,
  jsonData,
  onApply
}) => {
  const [text, setText] = (0, import_react2.useState)("");
  const [error, setError] = (0, import_react2.useState)(null);
  const [copied, setCopied] = (0, import_react2.useState)(false);
  (0, import_react2.useEffect)(() => {
    if (jsonData !== void 0) {
      setText(JSON.stringify(jsonData, null, 2));
      setError(null);
    }
  }, [jsonData, isOpen]);
  if (!isOpen || typeof document === "undefined") return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    import_react_hot_toast.default.success("Copied JSON to clipboard");
    setTimeout(() => setCopied(false), 2e3);
  };
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    try {
      JSON.parse(val);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };
  const handleApply = () => {
    try {
      const parsed = JSON.parse(text);
      onApply(parsed);
      import_react_hot_toast.default.success("Applied JSON edits to form");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON format");
      import_react_hot_toast.default.error("Please fix JSON syntax errors before applying");
    }
  };
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden text-white", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "p-4 border-b border-purple-500/20 flex items-center justify-between bg-slate-800/80", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h3", { className: "text-lg font-bold text-white flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "Raw JSON Inspector:" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-purple-400 font-mono text-sm", children: sectionTitle })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-xs text-slate-400", children: "Direct JSON editing for power users. Changes are validated before applying." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "button",
            {
              onClick: handleCopy,
              className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 transition-colors border border-slate-600",
              children: [
                copied ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react.Check, { className: "w-3.5 h-3.5 text-emerald-400" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react.Copy, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: copied ? "Copied" : "Copy" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: onClose,
              className: "p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors",
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react.X, { className: "w-5 h-5" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex-1 p-4 overflow-hidden flex flex-col", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "textarea",
          {
            value: text,
            onChange: handleTextChange,
            spellCheck: false,
            className: "w-full flex-1 min-h-[400px] font-mono text-xs p-4 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 resize-none"
          }
        ),
        error && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mt-2 flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-lg", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react.AlertCircle, { className: "w-4 h-4 shrink-0" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "font-mono", children: error })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "p-4 border-t border-purple-500/20 bg-slate-800/80 flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-xs text-slate-400", children: error ? "Fix errors to apply" : "Syntax valid" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: onClose,
              className: "px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: handleApply,
              disabled: error !== null,
              className: `px-5 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${error !== null ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"}`,
              children: "Apply to Form"
            }
          )
        ] })
      ] })
    ] }) }),
    document.body
  );
};

// src/admin/LivePreviewModal.tsx
var import_react3 = require("react");
var import_react_dom2 = require("react-dom");
var import_lucide_react2 = require("lucide-react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var LivePreviewModal = ({
  isOpen,
  onClose,
  pagePath
}) => {
  const [device, setDevice] = (0, import_react3.useState)("desktop");
  const [iframeKey, setIframeKey] = (0, import_react3.useState)(0);
  const { config } = useStudio();
  if (!isOpen || typeof document === "undefined") return null;
  const getDeviceWidth = () => {
    switch (device) {
      case "mobile":
        return "w-[375px] h-[667px]";
      case "tablet":
        return "w-[768px] h-[1024px]";
      default:
        return "w-full h-full";
    }
  };
  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };
  const getPublicLiveUrl = (route) => publicUrl(route, config.publicSiteUrl);
  const iframeSrc = buildPreviewUrl(pagePath, { publicSiteUrl: config.publicSiteUrl, cacheBust: iframeKey });
  return (0, import_react_dom2.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "fixed inset-0 z-[99999] flex flex-col bg-slate-950/90 backdrop-blur-md animate-fadeIn", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "h-14 border-b border-purple-500/20 bg-slate-900/90 px-4 flex items-center justify-between text-white", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "font-semibold text-sm sm:text-base text-purple-300", children: [
            "Live Preview: ",
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { className: "text-white bg-slate-800 px-2 py-0.5 rounded", children: pagePath })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "a",
            {
              href: getPublicLiveUrl(pagePath),
              target: "_blank",
              rel: "noopener noreferrer",
              className: "flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors bg-slate-800/80 px-2 py-1 rounded border border-slate-700",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "Open in Tab" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.ExternalLink, { className: "w-3 h-3" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700/60", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "button",
            {
              onClick: () => setDevice("desktop"),
              className: `p-1.5 rounded transition-all flex items-center gap-1 text-xs font-medium ${device === "desktop" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-700"}`,
              title: "Desktop view",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.Monitor, { className: "w-4 h-4" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "hidden sm:inline", children: "Desktop" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "button",
            {
              onClick: () => setDevice("tablet"),
              className: `p-1.5 rounded transition-all flex items-center gap-1 text-xs font-medium ${device === "tablet" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-700"}`,
              title: "Tablet view (768px)",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.Tablet, { className: "w-4 h-4" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "hidden sm:inline", children: "Tablet" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "button",
            {
              onClick: () => setDevice("mobile"),
              className: `p-1.5 rounded transition-all flex items-center gap-1 text-xs font-medium ${device === "mobile" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-700"}`,
              title: "Mobile view (375px)",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.Smartphone, { className: "w-4 h-4" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "hidden sm:inline", children: "Mobile" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              onClick: handleRefresh,
              className: "p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700",
              title: "Refresh preview",
              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.RefreshCw, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              onClick: onClose,
              className: "p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors",
              title: "Close preview",
              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.X, { className: "w-5 h-5" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "div",
        {
          className: `transition-all duration-300 shadow-2xl rounded-xl overflow-hidden border border-purple-500/30 bg-white ${getDeviceWidth()}`,
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "iframe",
            {
              src: iframeSrc,
              title: "Live Preview",
              className: "w-full h-full border-0"
            },
            iframeKey
          )
        }
      ) })
    ] }),
    document.body
  );
};

// src/admin/VisualImagePicker.tsx
var import_react4 = require("react");
var import_react_dom3 = require("react-dom");
var import_lucide_react3 = require("lucide-react");
var import_react_hot_toast2 = __toESM(require("react-hot-toast"));
var import_jsx_runtime4 = require("react/jsx-runtime");
var VisualImagePicker = ({
  value,
  onChange,
  label,
  fieldId,
  autoOpen = false,
  onClose
}) => {
  const { config } = useStudio();
  const adapter = config.adapter;
  const presets = config.imagePresets ?? [];
  const CATEGORY_TABS = (0, import_react4.useMemo)(() => {
    const tabs = [{ id: "all", label: "All Photos" }];
    if (adapter.listMedia || adapter.uploadMedia) tabs.push({ id: "uploaded", label: "Uploaded" });
    if (config.imagePresetCategories) {
      tabs.push(...config.imagePresetCategories.filter((c) => c.id !== "all" && c.id !== "uploaded"));
    } else {
      for (const category of Array.from(new Set(presets.map((p) => p.category)))) {
        if (category !== "uploaded") tabs.push({ id: category, label: category });
      }
    }
    return tabs;
  }, [adapter, config.imagePresetCategories, presets]);
  const [isOpen, setIsOpen] = (0, import_react4.useState)(autoOpen);
  const [activeTab, setActiveTab] = (0, import_react4.useState)("presets");
  const [selectedCategory, setSelectedCategory] = (0, import_react4.useState)("all");
  const [searchQuery, setSearchQuery] = (0, import_react4.useState)("");
  const [selectedPhoto, setSelectedPhoto] = (0, import_react4.useState)(value || "");
  const [customUrlInput, setCustomUrlInput] = (0, import_react4.useState)("");
  const [isUploading, setIsUploading] = (0, import_react4.useState)(false);
  const [backendMedia, setBackendMedia] = (0, import_react4.useState)([]);
  const [isLoadingBackendMedia, setIsLoadingBackendMedia] = (0, import_react4.useState)(false);
  const [mounted, setMounted] = (0, import_react4.useState)(false);
  const fileInputRef = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    setMounted(true);
  }, []);
  (0, import_react4.useEffect)(() => {
    if (isOpen) {
      setSelectedPhoto(value || "");
      setCustomUrlInput(value?.startsWith("http") ? value : "");
      fetchBackendMedia();
    }
  }, [isOpen, value]);
  const fetchBackendMedia = async () => {
    if (!adapter.listMedia) return;
    try {
      setIsLoadingBackendMedia(true);
      const res = await adapter.listMedia();
      setBackendMedia(
        res.filter((item) => item.url).map((item) => ({
          url: item.url,
          title: item.name || "Uploaded Image",
          category: "uploaded",
          tag: "Uploaded"
        }))
      );
    } catch {
    } finally {
      setIsLoadingBackendMedia(false);
    }
  };
  const allAvailablePhotos = (0, import_react4.useMemo)(() => {
    const combined = [...backendMedia, ...presets];
    const seen = /* @__PURE__ */ new Set();
    return combined.filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
  }, [backendMedia, presets]);
  const filteredPhotos = (0, import_react4.useMemo)(() => {
    return allAvailablePhotos.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === "" || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.url.toLowerCase().includes(searchQuery.toLowerCase()) || item.tag && item.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allAvailablePhotos, selectedCategory, searchQuery]);
  const handleFilesUpload = async (files) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      import_react_hot_toast2.default.error("Please upload image files (PNG, JPG, SVG, WebP, GIF)");
      return;
    }
    try {
      setIsUploading(true);
      if (!adapter.uploadMedia) {
        throw new Error("Storage adapter has no uploadMedia");
      }
      const items = await adapter.uploadMedia(fileArray);
      if (items.length > 0) {
        const newUploadedItems = items.map((it) => ({
          url: it.url,
          title: it.name,
          category: "uploaded",
          tag: "Uploaded"
        }));
        setBackendMedia((prev) => [...newUploadedItems, ...prev]);
        setSelectedPhoto(items[0].url);
        setSearchQuery("");
        setSelectedCategory("uploaded");
        setActiveTab("presets");
        import_react_hot_toast2.default.success(`Successfully uploaded ${items.length} image(s)!`);
        return;
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          setSelectedPhoto(result);
          import_react_hot_toast2.default.success("Image loaded locally!");
        }
      };
      reader.readAsDataURL(fileArray[0]);
    } finally {
      setIsUploading(false);
    }
  };
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    import_react_hot_toast2.default.success("Image path copied to clipboard");
  };
  const closeModal = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };
  const handleApply = () => {
    const finalUrl = activeTab === "url" ? customUrlInput.trim() : selectedPhoto;
    onChange(finalUrl);
    closeModal();
    import_react_hot_toast2.default.success("Image updated!");
  };
  const handleClear = () => {
    onChange("");
    setSelectedPhoto("");
    import_react_hot_toast2.default.success("Image removed");
  };
  const modalContent = isOpen ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "div",
    {
      className: "fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200",
      onClick: () => setIsOpen(false),
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "div",
        {
          className: "w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Image, { className: "w-5 h-5" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("h3", { className: "text-base font-bold text-white flex items-center gap-2", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Visual Image Selector" }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/40", children: "SaaS CMS Studio" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "text-xs text-slate-400", children: [
                    "Preview, search, and click to select any photo or logo for",
                    " ",
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-purple-300 font-mono", children: label || fieldId || "this field" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  type: "button",
                  onClick: closeModal,
                  className: "p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors",
                  children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.X, { className: "w-5 h-5" })
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 shrink-0", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setActiveTab("presets"),
                  className: `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "presets" ? "bg-purple-600 text-white shadow-md shadow-purple-900/40" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.FolderOpen, { className: "w-4 h-4" }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Media Library & Presets" }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-200", children: allAvailablePhotos.length })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setActiveTab("upload"),
                  className: `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "upload" ? "bg-purple-600 text-white shadow-md shadow-purple-900/40" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.UploadCloud, { className: "w-4 h-4" }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Upload From Computer" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setActiveTab("url"),
                  className: `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "url" ? "bg-purple-600 text-white shadow-md shadow-purple-900/40" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.ExternalLink, { className: "w-4 h-4" }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "External URL" })
                  ]
                }
              )
            ] }),
            activeTab === "presets" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex-1 overflow-hidden flex flex-col p-6 space-y-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "relative flex-1", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Search, { className: "w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "input",
                    {
                      type: "text",
                      placeholder: "Search photo by name or tag (e.g. logo, teacher, slider, template)...",
                      value: searchQuery,
                      onChange: (e) => setSearchQuery(e.target.value),
                      className: "w-full text-xs pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-750 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    }
                  ),
                  searchQuery && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "button",
                    {
                      type: "button",
                      onClick: () => setSearchQuery(""),
                      className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300",
                      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.X, { className: "w-3.5 h-3.5" })
                    }
                  )
                ] }),
                isLoadingBackendMedia && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-1.5 text-xs text-purple-400 shrink-0", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Loader2, { className: "w-3.5 h-3.5 animate-spin" }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Syncing media..." })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0", children: CATEGORY_TABS.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => setSelectedCategory(tab.id),
                  className: `text-xs px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${selectedCategory === tab.id ? "bg-purple-900/60 text-purple-200 border border-purple-500/50" : "bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800"}`,
                  children: tab.label
                },
                tab.id
              )) }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex-1 overflow-y-auto pr-1 custom-scrollbar", children: filteredPhotos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Image, { className: "w-10 h-10 text-slate-600 mb-2" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-sm font-semibold text-slate-300", children: "No photos match your filter" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-xs text-slate-500 mt-1", children: "Try searching for another keyword or switch category." })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pb-2", children: filteredPhotos.map((photo) => {
                const isSelected = selectedPhoto === photo.url;
                return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                  "div",
                  {
                    onClick: () => setSelectedPhoto(photo.url),
                    onDoubleClick: () => {
                      setSelectedPhoto(photo.url);
                      onChange(photo.url);
                      setIsOpen(false);
                      import_react_hot_toast2.default.success("Image selected!");
                    },
                    className: `group relative rounded-xl border p-2 flex flex-col cursor-pointer transition-all ${isSelected ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-950/50" : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90"}`,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "relative w-full aspect-video rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-center overflow-hidden mb-2", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                          "img",
                          {
                            src: photo.url,
                            alt: photo.title,
                            className: "w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105",
                            onError: (e) => {
                              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="gray" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
                            }
                          }
                        ),
                        isSelected && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Check, { className: "w-3.5 h-3.5 stroke-[3]" }) })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "min-w-0", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-xs font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors", children: photo.title }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center justify-between mt-1", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-[10px] font-mono text-slate-400 truncate max-w-[120px]", children: photo.url }),
                          photo.tag && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium", children: photo.tag })
                        ] })
                      ] })
                    ]
                  },
                  photo.url
                );
              }) }) })
            ] }),
            activeTab === "upload" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex-1 p-8 flex flex-col items-center justify-center", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "input",
                {
                  ref: fileInputRef,
                  type: "file",
                  accept: "image/*",
                  multiple: true,
                  className: "hidden",
                  onChange: (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) handleFilesUpload(files);
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "div",
                {
                  onClick: () => fileInputRef.current?.click(),
                  onDragOver: (e) => e.preventDefault(),
                  onDrop: (e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) handleFilesUpload(files);
                  },
                  className: "w-full max-w-lg p-10 border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-3xl bg-slate-950/50 hover:bg-purple-950/10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform", children: isUploading ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Loader2, { className: "w-8 h-8 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.UploadCloud, { className: "w-8 h-8" }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { className: "text-sm font-bold text-white mb-1", children: isUploading ? "Uploading Images..." : "Click or Drag & Drop Multiple Photos Here" }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-xs text-slate-400 max-w-xs mb-4", children: "Supports single or multiple uploads (PNG, JPG, WebP, SVG, GIF). All uploaded photos appear in your Media Library." }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-colors", children: "Browse from Computer (Select Multiple)" })
                  ]
                }
              ),
              selectedPhoto && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mt-6 flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-xs text-slate-400", children: "Selected photo:" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-xs font-mono text-purple-300 truncate max-w-md", children: selectedPhoto })
              ] })
            ] }),
            activeTab === "url" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex-1 p-8 max-w-xl mx-auto w-full flex flex-col justify-center space-y-5", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "space-y-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "text-xs font-semibold text-slate-300", children: "External Image URL (CDN / Cloudinary / S3 / Web)" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                  "input",
                  {
                    type: "url",
                    placeholder: "https://example.com/images/my-photo.jpg",
                    value: customUrlInput,
                    onChange: (e) => setCustomUrlInput(e.target.value),
                    className: "w-full text-xs p-3.5 rounded-xl bg-slate-950/80 border border-slate-750 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-[11px] text-slate-400", children: "Paste any public image link. Make sure the link is publicly accessible via HTTPS." })
              ] }),
              customUrlInput && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-xs font-semibold text-slate-300", children: "Live Preview:" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-full h-40 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                  "img",
                  {
                    src: customUrlInput,
                    alt: "URL Preview",
                    className: "w-full h-full object-contain p-2",
                    onError: (e) => {
                      e.currentTarget.alt = "Invalid or unreachable image URL";
                    }
                  }
                ) })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-2 min-w-0", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-xs text-slate-400", children: "Selected:" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-xs font-mono text-purple-300 truncate max-w-[280px]", children: activeTab === "url" ? customUrlInput || "None" : selectedPhoto || "None" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: () => setIsOpen(false),
                    className: "px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors",
                    children: "Cancel"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: handleApply,
                    disabled: activeTab === "url" ? !customUrlInput.trim() : !selectedPhoto,
                    className: "flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-md shadow-purple-900/30",
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Check, { className: "w-4 h-4" }),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Confirm & Use Image" })
                    ]
                  }
                )
              ] })
            ] })
          ]
        }
      )
    }
  ) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "space-y-1.5 w-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "text-xs font-semibold text-slate-300 capitalize flex items-center gap-1.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Image, { className: "w-3.5 h-3.5 text-purple-400" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: label?.replace(/([A-Z])/g, " $1") || "Image" })
      ] }),
      fieldId && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-[10px] font-mono text-slate-500", children: fieldId })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "p-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-between gap-3 w-full", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "div",
        {
          onClick: () => setIsOpen(true),
          className: "flex items-center gap-3 min-w-0 flex-1 cursor-pointer group",
          title: "Click to change image",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-purple-500 transition-colors", children: value ? (
              // eslint-disable-next-line @next/next/no-img-element
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "img",
                {
                  src: value,
                  alt: label || "Thumbnail",
                  className: "w-full h-full object-contain p-1",
                  onError: (e) => {
                    e.currentTarget.style.display = "none";
                  }
                }
              )
            ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Image, { className: "w-5 h-5 text-purple-400/70" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: `text-xs font-semibold font-mono truncate ${value ? "text-white" : "text-slate-500 italic"}`, children: value || "No image selected" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-[10px] text-slate-400 truncate", children: value ? "Click to replace or preview" : "Click to select from media presets" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-1.5 shrink-0", children: [
        value && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              onClick: () => handleCopy(value),
              className: "p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors",
              title: "Copy Image Path",
              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Copy, { className: "w-3.5 h-3.5" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              onClick: handleClear,
              className: "p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors",
              title: "Remove Image",
              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Trash2, { className: "w-3.5 h-3.5" })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            onClick: () => setIsOpen(true),
            className: "px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all shrink-0",
            children: value ? "Change Image" : "Select Image"
          }
        )
      ] })
    ] }),
    mounted && typeof document !== "undefined" && modalContent && (0, import_react_dom3.createPortal)(modalContent, document.body)
  ] });
};

// src/admin/VisualIconPicker.tsx
var import_react5 = require("react");
var import_react_dom4 = require("react-dom");
var import_lucide_react4 = require("lucide-react");

// src/admin/dynamicIcon.tsx
var LucideIcons = __toESM(require("lucide-react"));
function getDynamicIcon(iconName, fallback = LucideIcons.Circle) {
  if (!iconName || typeof iconName !== "string") return fallback;
  const cleanName = iconName.trim();
  const pascalName = cleanName.split(/[-_\s]+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
  const Resolved = LucideIcons[cleanName] || LucideIcons[pascalName];
  if (Resolved && typeof Resolved === "object") {
    return Resolved;
  }
  const lowerLookup = Object.keys(LucideIcons).find(
    (k) => k.toLowerCase() === cleanName.toLowerCase() || k.toLowerCase() === pascalName.toLowerCase()
  );
  if (lowerLookup) {
    const LowerResolved = LucideIcons[lowerLookup];
    if (LowerResolved && typeof LowerResolved === "object") {
      return LowerResolved;
    }
  }
  return fallback;
}
var POPULAR_ICONS = [
  // Education & Academics
  { name: "GraduationCap", category: "Education" },
  { name: "School", category: "Education" },
  { name: "BookOpen", category: "Education" },
  { name: "Award", category: "Education" },
  { name: "Trophy", category: "Education" },
  { name: "Medal", category: "Education" },
  { name: "FlaskConical", category: "Education" },
  { name: "Compass", category: "Education" },
  { name: "PenTool", category: "Education" },
  // System & Technology
  { name: "Zap", category: "Technology" },
  { name: "Globe", category: "Technology" },
  { name: "Globe2", category: "Technology" },
  { name: "Terminal", category: "Technology" },
  { name: "Laptop", category: "Technology" },
  { name: "Smartphone", category: "Technology" },
  { name: "Layers", category: "Technology" },
  { name: "Layout", category: "Technology" },
  { name: "LayoutDashboard", category: "Technology" },
  { name: "Cloud", category: "Technology" },
  { name: "Radio", category: "Technology" },
  { name: "Settings2", category: "Technology" },
  // Business & Institutional
  { name: "Landmark", category: "Business" },
  { name: "Building2", category: "Business" },
  { name: "Briefcase", category: "Business" },
  { name: "Users", category: "Business" },
  { name: "CreditCard", category: "Business" },
  { name: "BarChart3", category: "Business" },
  { name: "TrendingUp", category: "Business" },
  { name: "ShieldCheck", category: "Business" },
  { name: "Lock", category: "Business" },
  // Communication & Status
  { name: "Calendar", category: "Communication" },
  { name: "CalendarCheck", category: "Communication" },
  { name: "Headphones", category: "Communication" },
  { name: "Phone", category: "Communication" },
  { name: "Mail", category: "Communication" },
  { name: "MessageSquare", category: "Communication" },
  { name: "MessageCircle", category: "Communication" },
  { name: "BellRing", category: "Communication" },
  { name: "Megaphone", category: "Communication" },
  { name: "Check", category: "Communication" },
  { name: "CheckCircle2", category: "Communication" },
  { name: "ArrowRight", category: "Communication" },
  { name: "ExternalLink", category: "Communication" },
  { name: "FileText", category: "Communication" },
  { name: "FileCheck2", category: "Communication" },
  { name: "MapPin", category: "Communication" },
  // Social
  { name: "Facebook", category: "Social" },
  { name: "Twitter", category: "Social" },
  { name: "Linkedin", category: "Social" },
  { name: "Instagram", category: "Social" }
];

// src/admin/VisualIconPicker.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var VisualIconPicker = ({
  value,
  onChange,
  label,
  fieldId,
  icons
}) => {
  const [isOpen, setIsOpen] = (0, import_react5.useState)(false);
  const [search, setSearch] = (0, import_react5.useState)("");
  const [activeCategory, setActiveCategory] = (0, import_react5.useState)("all");
  const [mounted, setMounted] = (0, import_react5.useState)(false);
  (0, import_react5.useEffect)(() => {
    setMounted(true);
  }, []);
  const catalog = (0, import_react5.useMemo)(
    () => icons ? Object.keys(icons).map((name) => ({ name, category: "Site icons" })) : POPULAR_ICONS,
    [icons]
  );
  const resolveIcon = (name) => icons ? icons[name] ?? getDynamicIcon(name) : getDynamicIcon(name);
  const categories = (0, import_react5.useMemo)(() => {
    const set = new Set(catalog.map((i) => i.category));
    return set.size > 1 ? ["all", ...Array.from(set)] : [];
  }, [catalog]);
  const filteredIcons = (0, import_react5.useMemo)(() => {
    return catalog.filter((item) => {
      const matchCat = activeCategory === "all" || item.category === activeCategory;
      const matchSearch = !search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  }, [catalog, search, activeCategory]);
  const CurrentIcon = resolveIcon(value || "Sparkles");
  const isUnknownSiteIcon = Boolean(icons && value && !icons[value]);
  const modalContent = isOpen ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "div",
    {
      className: "fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md",
      onClick: () => setIsOpen(false),
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
        "div",
        {
          className: "w-full max-w-xl md:max-w-2xl bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0", children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-2.5", children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0" }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { className: "text-sm font-bold text-white", children: icons ? "Choose Icon" : "Choose Lucide Icon" }),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "text-[11px] text-slate-400", children: [
                    "Select an icon for ",
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "font-mono text-purple-300", children: label || fieldId })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => setIsOpen(false),
                  className: "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors",
                  children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react4.X, { className: "w-4 h-4" })
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-4 border-b border-slate-800 space-y-3 bg-slate-950/40 shrink-0", children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "relative", children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react4.Search, { className: "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                  "input",
                  {
                    type: "text",
                    placeholder: "Search icons (e.g. graduation, star, check, globe, book)...",
                    value: search,
                    onChange: (e) => setSearch(e.target.value),
                    className: "w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5", children: categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => setActiveCategory(cat),
                  className: `text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap capitalize transition-all ${activeCategory === cat ? "bg-purple-600 text-white shadow-sm" : "bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800"}`,
                  children: cat
                },
                cat
              )) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-4 overflow-y-auto max-h-[55vh] custom-scrollbar", children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", children: filteredIcons.map((item) => {
                const IconComp = resolveIcon(item.name);
                const isSelected = (value || "").toLowerCase() === item.name.toLowerCase();
                return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      onChange(item.name);
                      setIsOpen(false);
                    },
                    className: `flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all group min-h-[90px] ${isSelected ? "bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/50 shadow-md" : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700"}`,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-slate-300 group-hover:text-purple-300 shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(IconComp, { className: "w-5 h-5" }) }),
                      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "text-xs font-mono text-slate-300 truncate w-full px-1", children: item.name }),
                      isSelected && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react4.Check, { className: "w-3 h-3" }),
                        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "Active" })
                      ] })
                    ]
                  },
                  item.name
                );
              }) }),
              filteredIcons.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-8 text-center text-xs text-slate-500", children: [
                'No icons found matching "',
                search,
                '". Try another search term.'
              ] })
            ] })
          ]
        }
      )
    }
  ) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "space-y-1.5 w-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { className: "text-xs font-semibold text-slate-300 capitalize flex items-center gap-1.5", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: label?.replace(/([A-Z])/g, " $1") || "Icon" }) }),
      fieldId && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "text-[10px] font-mono text-slate-500", children: fieldId })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-between gap-3 w-full", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-3 min-w-0", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-300 shrink-0 shadow-inner", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CurrentIcon, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "min-w-0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "text-xs font-semibold text-white font-mono truncate", children: value || "None selected" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: `text-[10px] truncate ${isUnknownSiteIcon ? "text-amber-400" : "text-slate-400"}`, children: isUnknownSiteIcon ? "The site cannot draw this icon. Pick another." : icons ? "Site icon" : "Lucide icon" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          type: "button",
          onClick: () => setIsOpen(true),
          className: "px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all shrink-0 ml-auto",
          children: "Select Icon"
        }
      )
    ] }),
    mounted && typeof document !== "undefined" && modalContent && (0, import_react_dom4.createPortal)(modalContent, document.body)
  ] });
};

// src/admin/SectionEditorForm.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function isCodeValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  return keys.length === 3 && keys[0] === "css" && keys[1] === "html" && keys[2] === "js" && keys.every((k) => typeof value[k] === "string");
}
var SectionEditorForm = ({
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
  mode = "section"
}) => {
  const isRecord = mode === "record";
  const { config } = useStudio();
  const collectionLimits = config.collectionLimits ?? {};
  const CodeWidget = config.widgets?.code;
  const getEffectiveInitialData = (data) => {
    return transform ? transform(data) : data;
  };
  const [formData, setFormData] = (0, import_react6.useState)(() => getEffectiveInitialData(initialData));
  const [published, setPublished] = (0, import_react6.useState)(initialPublished);
  const [isSaving, setIsSaving] = (0, import_react6.useState)(false);
  const [isResetting, setIsResetting] = (0, import_react6.useState)(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = (0, import_react6.useState)(false);
  const [isPreviewOpen, setIsPreviewOpen] = (0, import_react6.useState)(false);
  const [isDirty, setIsDirty] = (0, import_react6.useState)(false);
  (0, import_react6.useEffect)(() => {
    setFormData(getEffectiveInitialData(initialData));
    setPublished(initialPublished);
    setIsDirty(false);
  }, [initialData, initialPublished]);
  (0, import_react6.useEffect)(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty]);
  const focusSegments = (0, import_react6.useMemo)(() => focusPath ? parseFieldPath(focusPath) : null, [focusPath]);
  const focusValue = focusSegments ? getAtPath(formData, focusSegments) : void 0;
  const isFocused = focusValue !== void 0 && focusValue !== null;
  const focusAreaRef = (0, import_react6.useRef)(null);
  (0, import_react6.useEffect)(() => {
    if (!focusPath) return;
    const input = focusAreaRef.current?.querySelector("input:not([type=checkbox]), textarea");
    input?.focus();
  }, [focusPath, isFocused]);
  const cloneData = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    return JSON.parse(JSON.stringify(obj));
  };
  const createEmptyTemplate = (template) => {
    if (template === null || template === void 0) return "";
    if (typeof template === "string") return "";
    if (typeof template === "number") return 0;
    if (typeof template === "boolean") return false;
    if (Array.isArray(template)) return [];
    if (typeof template === "object") {
      const empty = {};
      for (const [k, v] of Object.entries(template)) {
        if (k.toLowerCase() === "id") {
          empty[k] = typeof v === "number" ? 0 : `item_${Date.now()}`;
        } else if (typeof v === "string") {
          empty[k] = "";
        } else if (typeof v === "boolean") {
          empty[k] = false;
        } else if (typeof v === "number") {
          empty[k] = 0;
        } else if (Array.isArray(v)) {
          empty[k] = [];
        } else if (typeof v === "object" && v !== null) {
          empty[k] = createEmptyTemplate(v);
        } else {
          empty[k] = "";
        }
      }
      return empty;
    }
    return "";
  };
  const handleFieldChange = (path, value) => {
    setFormData((prev) => {
      const copy = cloneData(prev);
      let curr = copy;
      for (let i = 0; i < path.length - 1; i++) {
        curr = curr[path[i]];
      }
      curr[path[path.length - 1]] = value;
      if (onChangeDraft) {
        onChangeDraft(copy);
      }
      return copy;
    });
    setIsDirty(true);
  };
  const getArrayLimit = (path) => {
    const specificKey = `${page}.${sectionKey}.${path.join(".")}`;
    const directKey = `${page}.${path.join(".")}`;
    const simpleKey = `${sectionKey}.${path.join(".")}`;
    return collectionLimits[specificKey] || collectionLimits[directKey] || collectionLimits[simpleKey] || collectionLimits[`${page}.${sectionKey}`] || null;
  };
  const handleArrayAdd = (path, template) => {
    const limitInfo = getArrayLimit(path);
    setFormData((prev) => {
      const copy = cloneData(prev);
      let curr = copy;
      for (let i = 0; i < path.length; i++) {
        curr = curr[path[i]];
      }
      if (Array.isArray(curr)) {
        if (limitInfo && curr.length >= limitInfo.max) {
          import_react_hot_toast3.default.error(
            `Maximum limit reached: You cannot add more than ${limitInfo.max} ${limitInfo.label} to preserve design and layout integrity.`,
            { duration: 4e3 }
          );
          return prev;
        }
        const newItem = cloneData(createEmptyTemplate(template));
        if (newItem && typeof newItem === "object" && "id" in newItem) {
          newItem.id = typeof template?.id === "number" ? curr.length + 1 : `item_${Date.now()}`;
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
  const handleArrayDelete = (path, index) => {
    setFormData((prev) => {
      const copy = cloneData(prev);
      let curr = copy;
      for (let i = 0; i < path.length; i++) {
        curr = curr[path[i]];
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
  const handleArrayMove = (path, index, direction) => {
    setFormData((prev) => {
      const copy = cloneData(prev);
      let curr = copy;
      for (let i = 0; i < path.length; i++) {
        curr = curr[path[i]];
      }
      if (Array.isArray(curr)) {
        const targetIdx = direction === "up" ? index - 1 : index + 1;
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
      import_react_hot_toast3.default.success(isRecord ? "Saved. The page shows it now." : published ? "Section saved and published" : "Section saved as draft");
    } catch (err) {
      const detail = err instanceof Error && err.message ? `: ${err.message}` : "";
      import_react_hot_toast3.default.error(isRecord ? `Could not save this record${detail}` : "Failed to save section changes");
    } finally {
      setIsSaving(false);
    }
  };
  const handleReset = async () => {
    if (!confirm("Are you sure you want to revert this section to default content? All custom changes will be discarded.")) {
      return;
    }
    setIsResetting(true);
    try {
      await onReset();
      setIsDirty(false);
      import_react_hot_toast3.default.success("Reverted back to default template content");
    } catch {
      import_react_hot_toast3.default.error("Failed to reset section");
    } finally {
      setIsResetting(false);
    }
  };
  const isIconField = (fieldName) => {
    const lower = fieldName.toLowerCase();
    if (lower.endsWith("favicon") || /colou?r$/.test(lower)) return false;
    return lower === "icon" || lower.endsWith("icon") || lower.endsWith("_icon") || lower.startsWith("icon") || lower === "iconname" || lower === "badgeicon";
  };
  const isImageField = (fieldName, val) => {
    if (typeof val !== "string") return false;
    if (isIconField(fieldName)) return false;
    const lowerKey = fieldName.toLowerCase();
    const nonImageLabelSuffixes = ["alt", "label", "desc", "description", "title", "heading", "text", "badge"];
    if (nonImageLabelSuffixes.some((s) => lowerKey.endsWith(s) || lowerKey.endsWith(`_${s}`))) {
      return false;
    }
    const imageKeyKeywords = [
      "image",
      "img",
      "avatar",
      "logo",
      "photo",
      "banner",
      "cover",
      "thumbnail",
      "preview",
      "picture",
      "src",
      "ogimage",
      "favicon"
    ];
    const hasImageKey = imageKeyKeywords.some((kw) => lowerKey.includes(kw));
    const trimmed = val.trim();
    const hasImageExt = /\.(png|jpe?g|webp|svg|gif|avif|ico)(\?.*)?$/i.test(trimmed);
    const hasImagePath = trimmed.startsWith("/images/") || trimmed.startsWith("/assets/") || trimmed.startsWith("data:image/");
    return hasImageKey || hasImageExt || hasImagePath;
  };
  const renderField = (key, value, path) => {
    const fieldId = path.join(".");
    if (typeof value === "string") {
      const isIdField = key.toLowerCase() === "id";
      if (isIdField) {
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full flex items-center justify-between py-1 text-xs border-b border-slate-800/40", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-1.5 min-w-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Lock, { className: "w-3 h-3 text-purple-400 shrink-0" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "text-slate-400 font-mono text-[11px] shrink-0", children: [
              key,
              ":"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-purple-300 font-mono font-medium px-1.5 py-0.2 rounded bg-purple-950/60 text-[11px] truncate", children: value })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-[10px] text-slate-500 font-mono shrink-0", children: "system id" })
        ] }, fieldId);
      }
      if (isIconField(key)) {
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "w-full py-1", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          VisualIconPicker,
          {
            value,
            onChange: (newIcon) => handleFieldChange(path, newIcon),
            label: key,
            fieldId,
            icons: config.icons
          }
        ) }, fieldId);
      }
      if (isColorField(key, value)) {
        const isHex = /^#([0-9a-f]{3}){1,2}$/i.test(value.trim());
        const pickerValue = isHex ? value.trim().length === 4 ? `#${value.trim().slice(1).split("").map((c) => c + c).join("")}` : value.trim() : "#000000";
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full space-y-1 py-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between gap-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { htmlFor: `${fieldId}-color`, className: "text-xs font-semibold text-slate-200 capitalize", children: key.replace(/([A-Z])/g, " $1") }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-[10px] font-mono text-slate-500", children: fieldId })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "input",
              {
                id: `${fieldId}-color`,
                type: "color",
                value: pickerValue,
                onChange: (e) => handleFieldChange(path, e.target.value),
                className: "h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-700 bg-slate-950/90 p-1"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "input",
              {
                type: "text",
                value,
                "aria-label": `${key} hex value`,
                placeholder: "#7c3aed",
                onChange: (e) => handleFieldChange(path, e.target.value),
                className: "w-full text-xs px-3 py-2 font-mono rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-colors"
              }
            )
          ] })
        ] }, fieldId);
      }
      if (isFontField(key, value, config.fonts)) {
        const fonts = config.fonts ?? [];
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full space-y-1 py-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between gap-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { htmlFor: `${fieldId}-font`, className: "text-xs font-semibold text-slate-200 capitalize", children: key.replace(/([A-Z])/g, " $1") }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-[10px] font-mono text-slate-500", children: fieldId })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "select",
            {
              id: `${fieldId}-font`,
              value,
              onChange: (e) => handleFieldChange(path, e.target.value),
              className: "w-full text-xs px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-colors",
              children: [
                !fonts.includes(value) && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value, children: value || "Choose a font" }),
                fonts.map((font) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: font, style: { fontFamily: font }, children: font }, font))
              ]
            }
          )
        ] }, fieldId);
      }
      if (isImageField(key, value)) {
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "w-full py-1", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          VisualImagePicker,
          {
            value,
            onChange: (newUrl) => handleFieldChange(path, newUrl),
            label: key,
            fieldId
          }
        ) }, fieldId);
      }
      const displayLabel = key.replace(/([A-Z])/g, " $1");
      const isLongText = value.length > 70 || value.includes("\n");
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full space-y-1 py-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between gap-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { className: "text-xs font-semibold text-slate-200 capitalize flex items-center gap-1.5", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: displayLabel }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-[10px] font-mono text-slate-500", children: fieldId })
        ] }),
        isLongText ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "textarea",
          {
            value,
            rows: 3,
            onChange: (e) => handleFieldChange(path, e.target.value),
            className: "w-full text-xs p-2.5 rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-colors"
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "input",
          {
            type: "text",
            value,
            onChange: (e) => handleFieldChange(path, e.target.value),
            className: "w-full text-xs px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-colors"
          }
        )
      ] }, fieldId);
    }
    if (typeof value === "number") {
      const isIdField = key.toLowerCase() === "id";
      if (isIdField) {
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full flex items-center justify-between py-1 text-xs border-b border-slate-800/40", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-1.5 min-w-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Lock, { className: "w-3 h-3 text-purple-400 shrink-0" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "text-slate-400 font-mono text-[11px] shrink-0", children: [
              key,
              ":"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-purple-300 font-mono font-medium px-1.5 py-0.2 rounded bg-purple-950/60 text-[11px] truncate", children: value })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-[10px] text-slate-500 font-mono shrink-0", children: "system id" })
        ] }, fieldId);
      }
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full space-y-1 py-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between gap-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { className: "text-xs font-semibold text-slate-200 capitalize", children: key.replace(/([A-Z])/g, " $1") }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-[10px] font-mono text-slate-500", children: fieldId })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "input",
          {
            type: "number",
            value,
            onChange: (e) => handleFieldChange(path, parseFloat(e.target.value) || 0),
            className: "w-full text-xs px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 text-white focus:outline-none focus:border-purple-400 font-mono"
          }
        )
      ] }, fieldId);
    }
    if (typeof value === "boolean") {
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full flex items-center justify-between py-2 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-xs font-semibold text-slate-200 capitalize", children: key.replace(/([A-Z])/g, " $1") }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "block text-[10px] font-mono text-slate-500", children: fieldId })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "input",
          {
            type: "checkbox",
            checked: value,
            onChange: (e) => handleFieldChange(path, e.target.checked),
            className: "w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 cursor-pointer"
          }
        )
      ] }, fieldId);
    }
    if (Array.isArray(value)) {
      const isPrimitiveArray = value.length === 0 || typeof value[0] !== "object";
      const itemTemplate = value.length > 0 ? typeof value[0] === "object" ? value[0] : "" : "";
      const limitInfo = getArrayLimit(path);
      const isMaxReached = limitInfo ? value.length >= limitInfo.max : false;
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full space-y-2 py-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between pb-1.5 border-b border-purple-500/30", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-xs font-bold text-purple-300 capitalize", children: key.replace(/([A-Z])/g, " $1") }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: `text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isMaxReached ? "bg-amber-900/60 text-amber-300 border border-amber-500/30" : "bg-purple-900/60 text-purple-200"}`, children: [
              value.length,
              limitInfo ? ` / ${limitInfo.max} max` : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "button",
            {
              type: "button",
              onClick: () => handleArrayAdd(path, itemTemplate),
              className: `flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${isMaxReached ? "bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700/80" : "bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40"}`,
              title: isMaxReached ? `Limit of ${limitInfo?.max} reached` : "Add new item",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Plus, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: isMaxReached ? "Max Reached" : "Add" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "space-y-2.5", children: value.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "div",
          {
            className: "p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-2",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between pb-1 border-b border-slate-800/80", children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "text-[11px] font-bold text-purple-300", children: [
                  "#",
                  idx + 1
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "button",
                    {
                      type: "button",
                      disabled: idx === 0,
                      onClick: () => handleArrayMove(path, idx, "up"),
                      className: "p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors",
                      title: "Move Up",
                      children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.ChevronUp, { className: "w-3.5 h-3.5" })
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "button",
                    {
                      type: "button",
                      disabled: idx === value.length - 1,
                      onClick: () => handleArrayMove(path, idx, "down"),
                      className: "p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors",
                      title: "Move Down",
                      children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.ChevronDown, { className: "w-3.5 h-3.5" })
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleArrayDelete(path, idx),
                      className: "p-1 text-slate-400 hover:text-rose-400 transition-colors ml-1",
                      title: "Delete Item",
                      children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Trash2, { className: "w-3.5 h-3.5" })
                    }
                  )
                ] })
              ] }),
              isPrimitiveArray ? isImageField(key, item) ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                VisualImagePicker,
                {
                  value: item || "",
                  onChange: (newUrl) => handleFieldChange([...path, idx], newUrl),
                  label: `${key} #${idx + 1}`,
                  fieldId: `${fieldId}.${idx}`
                }
              ) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                "input",
                {
                  type: "text",
                  value: item,
                  onChange: (e) => handleFieldChange([...path, idx], e.target.value),
                  className: "w-full text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-400"
                }
              ) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "space-y-2 pt-1", children: Object.entries(item).map(
                ([subKey, subVal]) => renderField(subKey, subVal, [...path, idx, subKey])
              ) })
            ]
          },
          `${fieldId}.${idx}`
        )) })
      ] }, fieldId);
    }
    if (typeof value === "object" && value !== null) {
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full space-y-2 py-2 border-t border-slate-800/80 first:border-t-0", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-1.5 pb-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-xs font-bold text-slate-200 capitalize", children: key.replace(/([A-Z])/g, " $1") }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "text-[10px] font-mono text-slate-500", children: [
            "(",
            fieldId,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "space-y-2 pl-1", children: Object.entries(value).map(
          ([subKey, subVal]) => renderField(subKey, subVal, [...path, subKey])
        ) })
      ] }, fieldId);
    }
    return null;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "space-y-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "sticky top-0 z-30 rounded-xl bg-slate-900/95 border border-purple-500/30 overflow-hidden shadow-lg backdrop-blur-md", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "p-3 flex items-center justify-between gap-2 border-b border-purple-500/20", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { className: "text-sm font-bold text-white capitalize truncate", children: sectionLabel || sectionKey.replace(/([A-Z])/g, " $1") }),
          isRecord ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "span",
            {
              className: "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 shrink-0 font-medium",
              title: "Saving writes this record to the site's database and the page shows it right away.",
              children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "Database record" })
            }
          ) : hasCustomOverride ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 font-medium", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.CheckCircle2, { className: "w-3 h-3 text-emerald-400 shrink-0" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "Custom" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0 font-medium", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.ShieldCheck, { className: "w-3 h-3 text-slate-400 shrink-0" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "Default" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "button",
          {
            type: "button",
            disabled: isSaving,
            onClick: handleSave,
            className: `inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${isSaving ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60" : "bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95"}`,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Save, { className: "w-3.5 h-3.5 shrink-0" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: isSaving ? "Saving..." : isRecord ? "Save" : published ? "Save & Publish" : "Save Draft" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "px-3 py-2 bg-slate-950/60 flex items-center justify-between gap-2 text-xs text-slate-400", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-2 min-w-0 text-[11px]", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-purple-300 font-mono truncate", children: pagePath }),
          updatedAt && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-slate-500 hidden sm:inline truncate", children: new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-1.5 shrink-0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "button",
            {
              type: "button",
              onClick: () => setIsPreviewOpen(true),
              className: "p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors",
              title: "Preview Section",
              children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Eye, { className: "w-3.5 h-3.5 text-purple-400" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "button",
            {
              type: "button",
              onClick: () => setIsJsonModalOpen(true),
              className: "p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors",
              title: "View Raw JSON",
              children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Code, { className: "w-3.5 h-3.5 text-emerald-400" })
            }
          ),
          hasCustomOverride && !isRecord && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "button",
            {
              type: "button",
              disabled: isResetting,
              onClick: handleReset,
              className: "p-1.5 rounded-lg text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/60 transition-colors",
              title: "Reset to Template Default",
              children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.RotateCcw, { className: "w-3.5 h-3.5" })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "bg-slate-900/80 border border-purple-500/20 rounded-xl p-3 sm:p-4 space-y-3", children: [
      focusPath && !isFocused && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { role: "status", className: "text-xs rounded-lg px-3 py-2 bg-amber-950/40 border border-amber-700/60 text-amber-200", children: isRecord ? "This field could not be found, so every field of the record is shown." : "This field could not be found, so the whole section is shown." }),
      isFocused && focusSegments ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { ref: focusAreaRef, className: "space-y-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between gap-2 pb-2 border-b border-purple-500/20", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-[11px] font-semibold text-purple-200", children: "Editing one field" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "button",
            {
              type: "button",
              onClick: onClearFocus,
              className: "text-[11px] font-semibold px-2.5 py-1 rounded-lg text-purple-200 bg-purple-600/25 hover:bg-purple-600/45 border border-purple-500/40 transition-colors",
              children: isRecord ? "Show all fields of this record" : "Show all fields in this section"
            }
          )
        ] }),
        renderField(
          String([...focusSegments].reverse().find((part) => typeof part === "string") ?? focusPath),
          focusValue,
          focusSegments
        )
      ] }, focusPath) : CodeWidget && isCodeValue(formData) ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          CodeWidget,
          {
            value: formData,
            onChange: (next) => {
              const updated = {
                html: next.html,
                css: next.css,
                js: next.js
              };
              setFormData(updated);
              setIsDirty(true);
              if (onChangeDraft) {
                onChangeDraft(updated);
              }
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between pt-3 border-t border-purple-500/20", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "text-xs text-slate-400 flex items-center gap-1.5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: `w-2 h-2 rounded-full ${isDirty ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}` }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: isDirty ? "Unsaved edits in studio" : "Ready / Up to date" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "button",
            {
              type: "button",
              disabled: isSaving,
              onClick: handleSave,
              className: `inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${isSaving ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 active:scale-95"}`,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Save, { className: "w-4 h-4 shrink-0" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: isSaving ? "Saving..." : "Save & Publish" })
              ]
            }
          )
        ] })
      ] }) : formData && typeof formData === "object" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "space-y-3", children: Object.entries(formData).map(([key, val]) => renderField(key, val, [key])) }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "p-4 text-center text-xs text-slate-400", children: "No editable data found for this section." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      JsonInspectorModal,
      {
        isOpen: isJsonModalOpen,
        onClose: () => setIsJsonModalOpen(false),
        sectionTitle: sectionKey,
        jsonData: formData,
        onApply: (data) => {
          setFormData(data);
          setIsDirty(true);
          if (onChangeDraft) {
            onChangeDraft(data);
          }
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      LivePreviewModal,
      {
        isOpen: isPreviewOpen,
        onClose: () => setIsPreviewOpen(false),
        pagePath
      }
    )
  ] });
};

// src/admin/StylePanel.tsx
var import_react7 = __toESM(require("react"));
var import_lucide_react6 = require("lucide-react");
var import_jsx_runtime7 = require("react/jsx-runtime");
var DEVICES = [
  { key: "desktop", style: "desktop", label: "Desktop", icon: import_lucide_react6.Monitor },
  { key: "tablet", style: "tablet", label: "Tablet", icon: import_lucide_react6.Tablet },
  { key: "mobile", style: "phone", label: "Phone", icon: import_lucide_react6.Smartphone }
];
var FALLBACK = { desktop: [], tablet: ["desktop"], phone: ["tablet", "desktop"] };
var inputClass = "w-full min-w-0 text-xs px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors";
var chipClass = (active) => `px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${active ? "bg-purple-600 text-white border-purple-400" : "bg-slate-950/70 text-slate-300 border-slate-700 hover:border-slate-500"}`;
var Row = ({
  label,
  ownValue,
  inheritedValue,
  onClear,
  children
}) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-1", children: [
  /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "text-[11px] font-semibold text-slate-300", children: label }),
    ownValue ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", onClick: onClear, className: "text-slate-500 hover:text-rose-300", title: `Clear ${label}`, "aria-label": `Clear ${label}`, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.X, { className: "w-3 h-3" }) }) : inheritedValue ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "text-[10px] text-slate-500", children: [
      "inherited: ",
      inheritedValue
    ] }) : null
  ] }),
  children
] });
var Group = ({ title, children }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("fieldset", { className: "space-y-2.5 rounded-xl border border-slate-800 bg-slate-950/40 p-3", children: [
  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("legend", { className: "px-1 text-[10px] font-bold uppercase tracking-wider text-purple-300", children: title }),
  children
] });
function pickerColor(value) {
  const v = (value ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) return `#${v.slice(1).split("").map((c) => c + c).join("")}`;
  return "#000000";
}
var StylePanel = ({
  value,
  device,
  options,
  fonts,
  isImage,
  onChange,
  onSave,
  onReset,
  isSaving,
  hasSavedStyle
}) => {
  const currentDevice = DEVICES.find((d) => d.key === device) ?? DEVICES[0];
  const styleDevice = currentDevice.style;
  const own = value?.[styleDevice] ?? {};
  const inherited = (key) => {
    for (const d of FALLBACK[styleDevice]) {
      const v = value?.[d]?.[key];
      if (v) return v;
    }
    return void 0;
  };
  const set = (changes) => {
    const next = { ...own };
    for (const [key, v] of Object.entries(changes)) {
      if (v === void 0 || v.trim() === "") delete next[key];
      else next[key] = v;
    }
    const style = { ...value ?? {} };
    if (Object.keys(next).length > 0) style[styleDevice] = next;
    else delete style[styleDevice];
    onChange(style);
  };
  const row = (label, prop, children) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Row, { label, ownValue: own[prop], inheritedValue: inherited(prop), onClear: () => set({ [prop]: void 0 }), children });
  const textInput = (prop, placeholder) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    "input",
    {
      type: "text",
      value: own[prop] ?? "",
      placeholder: inherited(prop) ?? placeholder,
      "aria-label": prop,
      onChange: (e) => set({ [prop]: e.target.value }),
      className: inputClass
    }
  );
  const presets = (prop, list) => list && Object.keys(list).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex flex-wrap gap-1", children: Object.entries(list).map(([name, v]) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: chipClass(own[prop] === v), onClick: () => set({ [prop]: v }), title: v, children: name }, name)) }) : null;
  const colorRow = (label, prop) => row(
    label,
    prop,
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
      options?.colors && Object.keys(options.colors).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex flex-wrap gap-1", children: Object.entries(options.colors).map(([name, v]) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { type: "button", className: `${chipClass(own[prop] === v)} flex items-center gap-1`, onClick: () => set({ [prop]: v }), title: v, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "w-3 h-3 rounded-full border border-white/30", style: { background: v } }),
        name
      ] }, name)) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "input",
          {
            type: "color",
            value: pickerColor(own[prop] ?? inherited(prop)),
            "aria-label": `${label} picker`,
            onChange: (e) => set({ [prop]: e.target.value }),
            className: "h-8 w-10 shrink-0 cursor-pointer rounded-md border border-slate-700 bg-slate-950/90 p-0.5"
          }
        ),
        textInput(prop, "#000000 or var(--color)")
      ] })
    ] })
  );
  const sides = (group) => {
    const keys = ["Top", "Right", "Bottom", "Left"].map((side) => `${group}${side}`);
    const all = (v) => set(Object.fromEntries(keys.map((k) => [k, v])));
    const allSame = keys.every((k) => own[k] && own[k] === own[keys[0]]) ? own[keys[0]] : void 0;
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "text-[11px] font-semibold text-slate-300 capitalize", children: group }),
        keys.some((k) => own[k]) && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", onClick: () => all(void 0), className: "text-slate-500 hover:text-rose-300", "aria-label": `Clear ${group}`, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.X, { className: "w-3 h-3" }) })
      ] }),
      options?.spacing && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "flex flex-wrap gap-1", children: Object.entries(options.spacing).map(([name, v]) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: chipClass(allSame === v), onClick: () => all(v), title: v, children: name }, name)) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "grid grid-cols-4 gap-1", children: keys.map((k, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "input",
        {
          type: "text",
          value: own[k] ?? "",
          placeholder: inherited(k) ?? ["\u2191", "\u2192", "\u2193", "\u2190"][i],
          "aria-label": k,
          title: k,
          onChange: (e) => set({ [k]: e.target.value }),
          className: `${inputClass} text-center px-1`
        },
        k
      )) })
    ] });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-3", "data-cms-style-panel": true, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-2.5 py-1.5 text-[11px] text-slate-300", children: [
      import_react7.default.createElement(currentDevice.icon, { className: "w-3.5 h-3.5 text-purple-300 shrink-0" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
        "Editing ",
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { className: "text-white", children: currentDevice.label }),
        " styles.",
        styleDevice !== "desktop" ? ` Empty values use the ${styleDevice === "phone" ? "tablet or desktop" : "desktop"} value.` : " Switch device with the buttons above the preview."
      ] })
    ] }),
    isImage ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Group, { title: "Image size", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "grid grid-cols-3 gap-2", children: [
          row("Width", "width", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("width", "auto") })),
          row("Max width", "maxWidth", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("maxWidth", "none") })),
          row("Height", "height", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("height", "auto") }))
        ] }),
        row("Aspect ratio", "aspectRatio", /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          presets("aspectRatio", { Square: "1 / 1", "4:3": "4 / 3", "3:2": "3 / 2", "16:9": "16 / 9", Portrait: "3 / 4" }),
          textInput("aspectRatio", "e.g. 16 / 9")
        ] }))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Group, { title: "Fit & focus", children: [
        row("Fit", "objectFit", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: presets("objectFit", { Cover: "cover", Contain: "contain", Fill: "fill", None: "none" }) })),
        row("Focus", "objectPosition", /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          presets("objectPosition", { Center: "center", Top: "top", Bottom: "bottom", Left: "left", Right: "right" }),
          textInput("objectPosition", "e.g. 50% 20%")
        ] })),
        row("Opacity", "opacity", /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          presets("opacity", { "100%": "1", "75%": "0.75", "50%": "0.5", "25%": "0.25" }),
          textInput("opacity", "0 to 1")
        ] }))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Group, { title: "Corners & border", children: [
        row("Corner radius", "borderRadius", /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          presets("borderRadius", options?.radii),
          textInput("borderRadius", "e.g. 12px")
        ] })),
        row("Border width", "borderWidth", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("borderWidth", "e.g. 1px") })),
        colorRow("Border colour", "borderColor")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Group, { title: "Spacing", children: sides("margin") })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Group, { title: "Typography", children: [
        colorRow("Colour", "color"),
        row("Font size", "fontSize", /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          presets("fontSize", options?.fontSizes),
          textInput("fontSize", "e.g. 2rem or 32px")
        ] })),
        row("Weight", "fontWeight", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: presets("fontWeight", { Light: "300", Regular: "400", Medium: "500", Semibold: "600", Bold: "700", Black: "800" }) })),
        fonts && fonts.length > 0 && row("Font", "fontFamily", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: presets("fontFamily", Object.fromEntries(fonts.map((f) => [f, f]))) })),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "grid grid-cols-2 gap-2", children: [
          row("Line height", "lineHeight", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("lineHeight", "e.g. 1.4") })),
          row("Letter spacing", "letterSpacing", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("letterSpacing", "e.g. 0.02em") }))
        ] }),
        row("Align", "textAlign", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: presets("textAlign", { Left: "left", Center: "center", Right: "right", Justify: "justify" }) }))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Group, { title: "Spacing", children: [
        sides("margin"),
        sides("padding")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Group, { title: "Size", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "grid grid-cols-3 gap-2", children: [
        row("Width", "width", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("width", "auto") })),
        row("Max width", "maxWidth", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("maxWidth", "none") })),
        row("Height", "height", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("height", "auto") }))
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Group, { title: "Background & border", children: [
        colorRow("Background", "backgroundColor"),
        row("Corner radius", "borderRadius", /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
          presets("borderRadius", options?.radii),
          textInput("borderRadius", "e.g. 12px")
        ] })),
        row("Border width", "borderWidth", /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_jsx_runtime7.Fragment, { children: textInput("borderWidth", "e.g. 1px") })),
        colorRow("Border colour", "borderColor")
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center justify-end gap-2 pt-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => void onReset(),
          disabled: isSaving || !hasSavedStyle,
          className: "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-200 bg-amber-950/40 border border-amber-700/60 hover:bg-amber-900/60 disabled:opacity-40",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.RotateCcw, { className: "w-3.5 h-3.5" }),
            "Reset styles"
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => void onSave(),
          disabled: isSaving,
          className: "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 border border-purple-400 disabled:opacity-50",
          children: [
            isSaving ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.Save, { className: "w-3.5 h-3.5" }),
            "Save & Publish"
          ]
        }
      )
    ] })
  ] });
};

// src/admin/CanvasEditor.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var RECORD_SECTION = ":record";
var DEVICE_VIEWPORTS = {
  desktop: { label: "Desktop", width: 1280, icon: import_lucide_react7.Monitor },
  tablet: { label: "Tablet", width: 768, icon: import_lucide_react7.Tablet },
  mobile: { label: "Mobile", width: 390, icon: import_lucide_react7.Smartphone }
};
var CanvasEditor = ({ initialPage, onPageChange }) => {
  const { config, origins } = useStudio();
  const adapter = config.adapter;
  const [activePage, setActivePage] = (0, import_react8.useState)(initialPage || config.pages[0]?.key || "");
  (0, import_react8.useEffect)(() => {
    if (initialPage) setActivePage(initialPage);
  }, [initialPage]);
  const [device, setDevice] = (0, import_react8.useState)("desktop");
  const [isEditModeActive, setIsEditModeActive] = (0, import_react8.useState)(true);
  const [iframeKey, setIframeKey] = (0, import_react8.useState)(0);
  const [isLoadingIframe, setIsLoadingIframe] = (0, import_react8.useState)(true);
  const pageDef = findPage(config, activePage);
  const groupPage = pageDef ? groupPageOf(config, pageDef) : void 0;
  const recordPages = groupPage ? recordPagesOf(config, groupPage) : [];
  const [activeItem, setActiveItem] = (0, import_react8.useState)(null);
  const [itemsByPage, setItemsByPage] = (0, import_react8.useState)({});
  const [recordDetail, setRecordDetail] = (0, import_react8.useState)(null);
  const [isLoadingRecord, setIsLoadingRecord] = (0, import_react8.useState)(false);
  const [recordTarget, setRecordTarget] = (0, import_react8.useState)(null);
  const isRecordOpen = Boolean(recordTarget);
  const globalPage = findGlobalPage(config);
  const globalSections = import_react8.default.useMemo(
    () => globalPage && globalPage.key !== activePage ? globalPage.sections : [],
    [globalPage, activePage]
  );
  const availableSections = import_react8.default.useMemo(() => {
    const sections = [...pageDef?.sections ?? [], ...globalSections];
    if (!recordTarget) return sections;
    const owner = config.pages.find((p) => p.collection === recordTarget.collection);
    return [{ key: RECORD_SECTION, label: `${owner?.title ?? recordTarget.collection}: ${recordTarget.label}`, icon: import_lucide_react7.Database }, ...sections];
  }, [pageDef, globalSections, recordTarget, config.pages]);
  const pageSections = availableSections.filter((s) => !globalSections.includes(s));
  const [activeSectionKey, setActiveSectionKey] = (0, import_react8.useState)(availableSections[0]?.key ?? "");
  const [activeFieldPath, setActiveFieldPath] = (0, import_react8.useState)(null);
  const [activeFieldKind, setActiveFieldKind] = (0, import_react8.useState)(null);
  const hasUnsavedEdits = (0, import_react8.useRef)(false);
  const activeSectionRef = (0, import_react8.useRef)(activeSectionKey);
  activeSectionRef.current = activeSectionKey;
  const recordTargetRef = (0, import_react8.useRef)(recordTarget);
  recordTargetRef.current = recordTarget;
  const itemsRef = (0, import_react8.useRef)(itemsByPage);
  itemsRef.current = itemsByPage;
  const [sectionDetail, setSectionDetail] = (0, import_react8.useState)(null);
  const [isLoadingDetail, setIsLoadingDetail] = (0, import_react8.useState)(false);
  const [isSectionListOpen, setIsSectionListOpen] = (0, import_react8.useState)(false);
  const activeSection = availableSections.find((s) => s.key === activeSectionKey);
  const sectionPageDef = globalPage && globalSections.some((s) => s.key === activeSectionKey) ? globalPage : pageDef;
  const sectionPage = sectionPageDef?.key ?? activePage;
  const listedGlobalSections = globalPage?.listOnEveryPage === false ? globalSections.filter((s) => s.key === activeSectionKey) : globalSections;
  const iframeRef = (0, import_react8.useRef)(null);
  const viewportContainerRef = (0, import_react8.useRef)(null);
  const [containerSize, setContainerSize] = (0, import_react8.useState)({
    width: 1e3,
    height: 800
  });
  (0, import_react8.useEffect)(() => {
    if (!viewportContainerRef.current) return;
    const updateSize = () => {
      if (viewportContainerRef.current) {
        setContainerSize({
          width: viewportContainerRef.current.clientWidth,
          height: viewportContainerRef.current.clientHeight
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewportContainerRef.current);
    return () => observer.disconnect();
  }, []);
  (0, import_react8.useEffect)(() => {
    if (!isLoadingIframe) return;
    const check = () => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (doc && doc.readyState === "complete" && doc.location.href !== "about:blank") {
          setIsLoadingIframe(false);
        }
      } catch {
      }
    };
    check();
    const interval = setInterval(check, 300);
    const timeout = setTimeout(() => setIsLoadingIframe(false), 1e4);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoadingIframe, iframeKey]);
  const currentRoute = pageDef ? pageDef.collection && activeItem ? fillRoute(pageDef.route, activeItem) : pageDef.route : "/";
  const isWaitingForRecord = isDynamicRoute(currentRoute);
  const activePageTitle = groupPage?.title || activePage;
  const activePageIcon = groupPage?.icon || import_lucide_react7.Layers;
  const iframeSrc = buildPreviewUrl(currentRoute, {
    publicSiteUrl: config.publicSiteUrl,
    editMode: isEditModeActive,
    cacheBust: iframeKey
  });
  const sendToPreview = (0, import_react8.useCallback)(
    (message) => {
      postCmsMessage(iframeRef.current?.contentWindow, message, origins);
    },
    [origins]
  );
  const confirmLeavingSection = (0, import_react8.useCallback)(() => {
    if (!hasUnsavedEdits.current) return true;
    if (!window.confirm("You have unsaved changes in this section. Leave without saving them?")) return false;
    hasUnsavedEdits.current = false;
    sendToPreview({ type: CMS_MESSAGE.CONTENT_UPDATED });
    return true;
  }, [sendToPreview]);
  const changePage = (pageKey) => {
    if (!confirmLeavingSection()) return;
    setActiveFieldPath(null);
    setActiveItem(null);
    setRecordTarget(null);
    setRecordDetail(null);
    setActivePage(pageKey);
    const nextSections = findPage(config, pageKey)?.sections ?? [];
    if (nextSections[0]) setActiveSectionKey(nextSections[0].key);
    setIsLoadingIframe(true);
    setIframeKey(Date.now());
    if (onPageChange) onPageChange(pageKey);
  };
  const changeRecord = (value) => {
    if (!groupPage || !confirmLeavingSection()) return;
    setActiveFieldPath(null);
    setRecordDetail(null);
    if (value === "home") {
      setActiveItem(null);
      setRecordTarget(null);
      setActivePage(groupPage.key);
    } else {
      const separator = value.indexOf("::");
      const pageKey = value.slice(0, separator);
      const id = value.slice(separator + 2);
      const state = itemsByPage[pageKey];
      const item = state?.status === "ready" ? state.items.find((i) => i.id === id) : void 0;
      const recordPage = findPage(config, pageKey);
      if (!item || !recordPage?.collection) return;
      setActivePage(pageKey);
      setActiveItem(item);
      setRecordTarget({ collection: recordPage.collection, id: item.id, label: item.label });
      setActiveSectionKey(RECORD_SECTION);
    }
    setIsLoadingIframe(true);
    setIframeKey(Date.now());
  };
  const recordPagesKey = recordPages.map((p) => `${p.key}:${p.collection}`).join("|");
  (0, import_react8.useEffect)(() => {
    for (const page of recordPages) {
      const collection = page.collection;
      if (!adapter.listItems) {
        setItemsByPage((prev) => ({
          ...prev,
          [page.key]: { status: "error", message: "The storage adapter cannot list records (it has no listItems)." }
        }));
        continue;
      }
      setItemsByPage((prev) => prev[page.key]?.status === "ready" ? prev : { ...prev, [page.key]: { status: "loading" } });
      adapter.listItems(collection).then((items) => setItemsByPage((prev) => ({ ...prev, [page.key]: { status: "ready", items } }))).catch(
        (err) => setItemsByPage((prev) => ({
          ...prev,
          [page.key]: {
            status: "error",
            message: err instanceof Error && err.message ? err.message : `Could not load the records of "${collection}".`
          }
        }))
      );
    }
  }, [recordPagesKey, adapter]);
  (0, import_react8.useEffect)(() => {
    if (!pageDef?.collection || activeItem) return;
    const state = itemsByPage[pageDef.key];
    if (state?.status === "ready" && state.items.length > 0) {
      setActiveItem(state.items[0]);
      setRecordTarget({ collection: pageDef.collection, id: state.items[0].id, label: state.items[0].label });
      setActiveSectionKey(RECORD_SECTION);
      setIsLoadingIframe(true);
      setIframeKey(Date.now());
    }
  }, [pageDef, activeItem, itemsByPage]);
  const loadRecord = (0, import_react8.useCallback)(
    async (collection, id) => {
      if (!adapter.getItem) {
        import_react_hot_toast4.default.error("The storage adapter cannot load records (it has no getItem).");
        return;
      }
      setIsLoadingRecord(true);
      try {
        const values = await adapter.getItem(collection, id);
        if (!values) throw new Error("This record was not found.");
        setRecordDetail({ collection, id, values });
      } catch (err) {
        setRecordDetail(null);
        import_react_hot_toast4.default.error(err instanceof Error && err.message ? err.message : "Could not load this record.");
      } finally {
        setIsLoadingRecord(false);
      }
    },
    [adapter]
  );
  (0, import_react8.useEffect)(() => {
    if (!recordTarget) return;
    loadRecord(recordTarget.collection, recordTarget.id);
  }, [recordTarget, loadRecord]);
  const toggleEditMode = () => {
    const next = !isEditModeActive;
    setIsEditModeActive(next);
    sendToPreview({ type: CMS_MESSAGE.SET_EDIT_MODE, enabled: next });
    import_react_hot_toast4.default.success(
      next ? "Edit Mode Active: Hover & click sections to edit" : "Normal Browsing Mode: Edit options hidden",
      { duration: 2500 }
    );
  };
  (0, import_react8.useEffect)(() => {
    if (availableSections.length > 0 && !availableSections.some((section) => section.key === activeSectionKey)) {
      setActiveSectionKey(availableSections[0].key);
    }
  }, [activePage, activeSectionKey, availableSections]);
  const loadSectionData = (0, import_react8.useCallback)(
    async (page, sectionKey) => {
      setIsLoadingDetail(true);
      try {
        const record = await adapter.getRecord(page.key, sectionKey, { includeDrafts: true });
        setSectionDetail(getSectionDetail(page, sectionKey, record));
      } catch {
        import_react_hot_toast4.default.error(`Failed to load data for section '${sectionKey}'`);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [adapter]
  );
  (0, import_react8.useEffect)(() => {
    if (!sectionPageDef) return;
    const isSectionValid = availableSections.some((section) => section.key === activeSectionKey);
    if (activeSectionKey && isSectionValid && activeSectionKey !== RECORD_SECTION) {
      loadSectionData(sectionPageDef, activeSectionKey);
    }
  }, [activePage, sectionPage, activeSectionKey, loadSectionData]);
  const handleSelectSection = (sectionKey) => {
    if (sectionKey !== activeSectionKey && !confirmLeavingSection()) return;
    setActiveFieldPath(null);
    setActiveSectionKey(sectionKey);
    setIsSectionListOpen(false);
    if (sectionKey !== RECORD_SECTION) sendToPreview({ type: CMS_MESSAGE.SCROLL_TO_SECTION, sectionKey });
  };
  (0, import_react8.useEffect)(() => {
    if (origins.length === 0) return;
    return listenForCmsMessages(
      (message) => {
        if (message.type !== CMS_MESSAGE.EDIT_SECTION) return;
        if (message.collection) {
          const id = String(message.item ?? "");
          if (!id || !config.pages.some((p) => p.collection === message.collection)) {
            import_react_hot_toast4.default.error(`No page in the CMS config shows the collection "${message.collection}".`);
            return;
          }
          const current = recordTargetRef.current;
          const isSameRecord = current?.collection === message.collection && current.id === id;
          if (!(isSameRecord && activeSectionRef.current === RECORD_SECTION) && !confirmLeavingSection()) return;
          if (!isSameRecord) {
            const listed = Object.values(itemsRef.current).flatMap((state) => state.status === "ready" ? state.items : []).find((item) => item.id === id);
            setRecordTarget({ collection: message.collection, id, label: listed?.label ?? message.title ?? id });
          }
          setActiveFieldPath(message.fieldPath ?? null);
          setActiveSectionKey(RECORD_SECTION);
          return;
        }
        if (!message.sectionKey) return;
        const ownerPage = resolveSectionPage(config, activePage, message.sectionKey, message.page);
        if (!ownerPage || !availableSections.some((s) => s.key === message.sectionKey)) {
          import_react_hot_toast4.default.error(
            message.page && message.page !== activePage ? `Section '${message.sectionKey}' belongs to the page '${message.page}'. Open that page to edit it.` : `Section '${message.sectionKey}' is not configured for this page`
          );
          return;
        }
        if (message.sectionKey !== activeSectionRef.current && !confirmLeavingSection()) return;
        setActiveFieldPath(message.fieldPath ?? null);
        setActiveFieldKind(message.fieldKind ?? null);
        setActiveSectionKey(message.sectionKey);
        import_react_hot_toast4.default.success(`Selected: ${message.title || message.sectionKey} in Editor`, {
          duration: 2e3
        });
      },
      { origins, source: () => iframeRef.current?.contentWindow }
    );
  }, [origins, availableSections, confirmLeavingSection, config, activePage]);
  const handleSaveSection = async (content, isPublished) => {
    if (!sectionPageDef) return;
    await adapter.saveRecord({ page: sectionPage, sectionKey: activeSectionKey, content, isPublished });
    sendToPreview({
      type: CMS_MESSAGE.DRAFT_PREVIEW,
      page: sectionPage,
      sectionKey: activeSectionKey,
      draftContent: content
    });
    sendToPreview({ type: CMS_MESSAGE.CONTENT_UPDATED });
    const record = await adapter.getRecord(sectionPage, activeSectionKey, { includeDrafts: true });
    setSectionDetail(getSectionDetail(sectionPageDef, activeSectionKey, record));
  };
  const handleResetSection = async () => {
    if (!sectionPageDef) return;
    await adapter.deleteRecord(sectionPage, activeSectionKey);
    sendToPreview({ type: CMS_MESSAGE.CONTENT_UPDATED });
    setSectionDetail(getSectionDetail(sectionPageDef, activeSectionKey, null));
  };
  const handleDraftChange = (draftContent) => {
    sendToPreview({
      type: CMS_MESSAGE.DRAFT_PREVIEW,
      page: sectionPage,
      sectionKey: activeSectionKey,
      draftContent
    });
  };
  const handleSaveRecord = async (content) => {
    if (!recordDetail || !adapter.saveItem) throw new Error("The storage adapter cannot save records (it has no saveItem).");
    const values = await adapter.saveItem(recordDetail.collection, recordDetail.id, content);
    setRecordDetail({ ...recordDetail, values });
    sendToPreview({ type: CMS_MESSAGE.ITEM_DRAFT, collection: recordDetail.collection, item: recordDetail.id, values: null });
    setIsLoadingIframe(true);
    setIframeKey(Date.now());
  };
  const handleRecordDraft = (draft) => {
    if (!recordDetail) return;
    sendToPreview({
      type: CMS_MESSAGE.ITEM_DRAFT,
      collection: recordDetail.collection,
      item: recordDetail.id,
      values: draft
    });
  };
  const stylesEnabled = config.styles?.enabled !== false;
  const isStyleTarget = stylesEnabled && Boolean(activeFieldPath) && activeSectionKey !== RECORD_SECTION;
  const [formTab, setFormTab] = (0, import_react8.useState)("content");
  const [styleSheet, setStyleSheet] = (0, import_react8.useState)(null);
  const [fieldStyle, setFieldStyleDraft] = (0, import_react8.useState)(void 0);
  const [isSavingStyle, setIsSavingStyle] = (0, import_react8.useState)(false);
  const showStyleTab = isStyleTarget && formTab === "style";
  const loadStyleSheet = (0, import_react8.useCallback)(
    async (page) => {
      const record = await adapter.getRecord(page, STYLES_KEY, { includeDrafts: true });
      const sheet = record?.content && typeof record.content === "object" ? record.content : {};
      setStyleSheet({ page, sheet });
      return sheet;
    },
    [adapter]
  );
  (0, import_react8.useEffect)(() => {
    if (!isStyleTarget || !activeFieldPath) return;
    let alive = true;
    loadStyleSheet(sectionPage).then((sheet) => {
      if (alive) setFieldStyleDraft(sheet[activeSectionKey]?.[activeFieldPath]);
    }).catch(() => import_react_hot_toast4.default.error("Could not load the styles of this page."));
    return () => {
      alive = false;
    };
  }, [isStyleTarget, sectionPage, activeSectionKey, activeFieldPath, loadStyleSheet]);
  (0, import_react8.useEffect)(() => {
    if (!activeFieldPath) {
      setFormTab("content");
      setActiveFieldKind(null);
    }
  }, [activeFieldPath]);
  const savedFieldStyle = styleSheet && styleSheet.page === sectionPage && activeFieldPath ? styleSheet.sheet[activeSectionKey]?.[activeFieldPath] : void 0;
  const handleStyleChange = (style) => {
    if (!activeFieldPath) return;
    const marked = withKind(style);
    setFieldStyleDraft(marked);
    hasUnsavedEdits.current = true;
    sendToPreview({ type: CMS_MESSAGE.STYLE_DRAFT, page: sectionPage, sectionKey: activeSectionKey, path: activeFieldPath, style: marked });
  };
  const writeFieldStyle = async (style) => {
    if (!activeFieldPath) return;
    setIsSavingStyle(true);
    try {
      const current = await loadStyleSheet(sectionPage);
      const next = setFieldStyle(current, activeSectionKey, activeFieldPath, style);
      if (Object.keys(next).length === 0) await adapter.deleteRecord(sectionPage, STYLES_KEY);
      else await adapter.saveRecord({ page: sectionPage, sectionKey: STYLES_KEY, content: next, isPublished: true });
      setStyleSheet({ page: sectionPage, sheet: next });
      setFieldStyleDraft(next[activeSectionKey]?.[activeFieldPath]);
      hasUnsavedEdits.current = false;
      sendToPreview({ type: CMS_MESSAGE.CONTENT_UPDATED });
      import_react_hot_toast4.default.success(style ? "Styles saved and published" : "Styles reset");
    } catch (err) {
      import_react_hot_toast4.default.error(err instanceof Error && err.message ? err.message : "Could not save the styles.");
    } finally {
      setIsSavingStyle(false);
    }
  };
  const fieldValue = activeFieldPath && sectionDetail ? getAtPath(sectionDetail.content, parseFieldPath(activeFieldPath)) : void 0;
  const isImageValue = activeFieldKind === "image" || activeFieldKind === null && typeof fieldValue === "string" && (/\.(png|jpe?g|webp|svg|gif|avif)(\?.*)?$/i.test(fieldValue) || /(image|img|logo|photo|avatar|picture|src|banner|cover|thumbnail)/i.test(activeFieldPath ?? ""));
  const withKind = (style) => {
    const next = { ...style };
    if (isImageValue) next.kind = "image";
    else delete next.kind;
    return next;
  };
  const handleRefreshPreview = () => {
    setIsLoadingIframe(true);
    setIframeKey(Date.now());
  };
  const activeSectionDef = availableSections.find((s) => s.key === activeSectionKey);
  const currentSectionLabel = activeSectionDef?.label || activeSectionKey.replace(/([A-Z])/g, " $1");
  if (!pageDef) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "p-8 text-center text-sm text-slate-400 bg-slate-900/60 rounded-2xl border border-purple-500/20", children: [
      "No pages configured. Add pages to the ",
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("code", { className: "text-purple-300", children: "pages" }),
      " array of your CMS config."
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "space-y-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "p-3 rounded-2xl bg-slate-900/90 border border-purple-500/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/25 border border-purple-500/40 text-purple-200 shrink-0", children: [
          import_react8.default.createElement(activePageIcon, { className: "w-3.5 h-3.5 text-purple-300" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "font-bold text-white max-w-[150px] truncate", children: activePageTitle }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "text-[10px] font-mono opacity-70 text-purple-300", children: [
            "(",
            currentRoute,
            ")"
          ] })
        ] }),
        topLevelPages(config).length > 1 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "select",
          {
            value: groupPage?.key ?? activePage,
            onChange: (e) => {
              if (e.target.value) changePage(e.target.value);
            },
            "aria-label": "Page to edit",
            className: "text-xs px-2.5 py-1.5 rounded-xl bg-slate-950 border border-purple-500/30 text-purple-200 focus:outline-none focus:border-purple-400 max-w-[200px] sm:max-w-[260px] md:max-w-[320px] truncate",
            children: [
              topLevelPages(config).filter((p) => !p.global).map((p) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("option", { value: p.key, children: [
                p.title,
                " (",
                p.collection ? p.route.replace(/\/\[[^\]]+\].*$/, "") || "/" : p.route,
                ")"
              ] }, p.key)),
              globalPage && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("option", { value: globalPage.key, children: [
                globalPage.title || "Site settings",
                " (every page)"
              ] })
            ]
          }
        ),
        groupPage && recordPages.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "select",
          {
            value: pageDef?.collection && activeItem ? `${pageDef.key}::${activeItem.id}` : "home",
            onChange: (e) => changeRecord(e.target.value),
            "aria-label": `Page of ${groupPage.title} to edit`,
            className: "text-xs px-2.5 py-1.5 rounded-xl bg-slate-950 border border-sky-500/40 text-sky-200 focus:outline-none focus:border-sky-400 max-w-[200px] sm:max-w-[260px] md:max-w-[320px] truncate",
            children: [
              !groupPage.collection && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("option", { value: "home", children: [
                groupPage.title,
                " home (",
                groupPage.route,
                ")"
              ] }),
              groupPage.collection && !activeItem && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "home", children: "Pick a record" }),
              recordPages.map((rp) => {
                const state = itemsByPage[rp.key];
                const options = !state || state.status === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("option", { disabled: true, value: `${rp.key}::loading`, children: [
                  "Loading ",
                  rp.title,
                  "..."
                ] }) : state.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("option", { disabled: true, value: `${rp.key}::error`, children: [
                  rp.title,
                  ": could not load (",
                  state.message,
                  ")"
                ] }) : state.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("option", { disabled: true, value: `${rp.key}::none`, children: [
                  rp.title,
                  ": no records yet"
                ] }) : state.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: `${rp.key}::${item.id}`, children: item.label }, item.id));
                return recordPages.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("optgroup", { label: rp.title, children: options }, rp.key) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_react8.default.Fragment, { children: options }, rp.key);
              })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-2.5 flex-wrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-xl shrink-0", children: Object.keys(DEVICE_VIEWPORTS).map((mode) => {
          const conf = DEVICE_VIEWPORTS[mode];
          const Icon = conf.icon;
          const isCurrent = device === mode;
          return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
            "button",
            {
              type: "button",
              onClick: () => setDevice(mode),
              className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isCurrent ? "bg-purple-900/80 text-purple-200 border border-purple-500/40 shadow-sm" : "text-slate-400 hover:text-white"}`,
              title: `${conf.label} (${conf.width}px)`,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: conf.label })
              ]
            },
            mode
          );
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-1.5 shrink-0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              type: "button",
              onClick: toggleEditMode,
              className: `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border shrink-0 ${isEditModeActive ? "bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-900/30" : "bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60"}`,
              title: isEditModeActive ? "Edit Mode is ON. Click to turn OFF and interact with webpage normally." : "Edit Mode is OFF. Click to turn ON and enable section edit buttons.",
              children: isEditModeActive ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.Pencil, { className: "w-3 h-3 text-purple-200 shrink-0" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "Edit Mode" })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.Eye, { className: "w-3 h-3 text-slate-400 shrink-0" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "View Mode" })
              ] })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              type: "button",
              onClick: handleRefreshPreview,
              className: "p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors",
              title: "Reload live canvas",
              children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.RotateCcw, { className: "w-3.5 h-3.5" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
            "a",
            {
              href: publicUrl(currentRoute, config.publicSiteUrl),
              target: "_blank",
              rel: "noreferrer",
              className: "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-medium transition-colors",
              title: "Open in new window",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.ExternalLink, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "hidden sm:inline", children: "Open Live" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "lg:col-span-5 xl:col-span-5 flex flex-col space-y-3 lg:sticky lg:top-2 lg:max-h-[calc(100vh-80px)] overflow-y-auto pr-1 custom-scrollbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "p-3 rounded-xl bg-slate-900/95 border border-purple-500/25 backdrop-blur-sm space-y-2.5 shadow-lg", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
            "button",
            {
              type: "button",
              onClick: () => setIsSectionListOpen((open) => !open),
              "aria-expanded": isSectionListOpen,
              "aria-controls": "cms-section-list",
              className: "w-full flex items-center justify-between gap-2 text-left rounded-lg -m-1 p-1 hover:bg-slate-800/50 transition-colors",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "min-w-0 flex items-center gap-1.5 text-xs", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "font-bold text-white shrink-0", children: "Select Section to Edit:" }),
                  !isSectionListOpen && activeSection && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "flex items-center gap-1 min-w-0 px-2 py-0.5 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-100 font-semibold", children: [
                    activeSection.icon && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(activeSection.icon, { className: "w-3 h-3 shrink-0 opacity-80" }),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "truncate", children: activeSection.label })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "flex items-center gap-2 shrink-0", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40", children: [
                    "Page: ",
                    currentRoute
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    import_lucide_react7.ChevronDown,
                    {
                      className: `w-4 h-4 text-purple-300 transition-transform ${isSectionListOpen ? "rotate-180" : ""}`
                    }
                  )
                ] })
              ]
            }
          ),
          isSectionListOpen && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: "cms-section-list", className: "flex flex-wrap gap-1.5", children: [pageSections, listedGlobalSections].map(
              (list, index) => list.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_react8.default.Fragment, { children: [
                index === 1 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "w-full flex items-center gap-1.5 pt-1.5 mt-0.5 border-t border-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-emerald-300", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.Globe, { className: "w-3 h-3" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "Site-wide: shown on every page" })
                ] }),
                list.map((sec) => {
                  const isSelected = sec.key === activeSectionKey;
                  const IconComponent = sec.icon;
                  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleSelectSection(sec.key),
                      className: `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${isSelected ? "bg-purple-600 text-white shadow-md shadow-purple-900/50 ring-1 ring-purple-400" : "bg-slate-950/70 hover:bg-slate-800/80 text-slate-300 border border-slate-800"}`,
                      children: [
                        IconComponent && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(IconComponent, { className: "w-3.5 h-3.5 opacity-80" }),
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: sec.label }),
                        isSelected && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.ChevronRight, { className: "w-3 h-3 text-purple-200" })
                      ]
                    },
                    sec.key
                  );
                })
              ] }, index)
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.MousePointerClick, { className: "w-3.5 h-3.5 text-purple-400 shrink-0" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "Selecting a section scrolls the preview on the right to it." })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "rounded-2xl bg-slate-900/80 border border-purple-500/20 p-3 sm:p-4 shadow-xl", children: activeSectionKey === RECORD_SECTION && isRecordOpen ? isLoadingRecord ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.Loader2, { className: "w-6 h-6 animate-spin text-sky-400" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "Loading record..." })
        ] }) : recordDetail && recordDetail.id === recordTarget?.id && recordDetail.collection === recordTarget?.collection ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          SectionEditorForm,
          {
            mode: "record",
            page: activePage,
            sectionKey: `${recordDetail.collection}:${recordDetail.id}`,
            sectionLabel: recordTarget?.label,
            pagePath: currentRoute,
            focusPath: activeFieldPath,
            onClearFocus: () => setActiveFieldPath(null),
            onDirtyChange: (dirty) => {
              hasUnsavedEdits.current = dirty;
            },
            initialData: recordDetail.values,
            hasCustomOverride: false,
            isPublished: true,
            updatedAt: null,
            updatedBy: null,
            onSave: handleSaveRecord,
            onReset: async () => void 0,
            onChangeDraft: handleRecordDraft
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "p-8 text-center text-xs text-slate-400", children: "This record could not be loaded." }) : isLoadingDetail ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.Loader2, { className: "w-6 h-6 animate-spin text-purple-400" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "Loading section form..." })
        ] }) : sectionDetail && sectionDetail.sectionKey === activeSectionKey && sectionDetail.page === sectionPage ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
          isStyleTarget && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { role: "tablist", "aria-label": "Field editor", className: "flex items-center gap-1 p-1 mb-3 bg-slate-950/70 border border-slate-800 rounded-xl", children: ["content", "style"].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": formTab === tab,
              onClick: () => setFormTab(tab),
              className: `flex-1 px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${formTab === tab ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`,
              children: tab
            },
            tab
          )) }),
          showStyleTab && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            StylePanel,
            {
              value: fieldStyle,
              device,
              options: config.styles,
              fonts: config.fonts,
              isImage: isImageValue,
              onChange: handleStyleChange,
              onSave: () => writeFieldStyle(fieldStyle && hasFieldStyle(fieldStyle) ? withKind(fieldStyle) : null),
              onReset: () => writeFieldStyle(null),
              isSaving: isSavingStyle,
              hasSavedStyle: hasFieldStyle(savedFieldStyle)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { hidden: showStyleTab, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            SectionEditorForm,
            {
              page: sectionPage,
              sectionKey: activeSectionKey,
              sectionLabel: activeSectionDef?.label,
              pagePath: currentRoute,
              transform: activeSectionDef?.transform,
              focusPath: activeFieldPath,
              onClearFocus: () => setActiveFieldPath(null),
              onDirtyChange: (dirty) => {
                hasUnsavedEdits.current = dirty;
              },
              initialData: sectionDetail.content,
              hasCustomOverride: sectionDetail.hasCustomOverride,
              isPublished: sectionDetail.isPublished,
              updatedAt: sectionDetail.updatedAt,
              updatedBy: sectionDetail.updatedBy,
              onSave: handleSaveSection,
              onReset: handleResetSection,
              onChangeDraft: handleDraftChange
            }
          ) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "p-8 text-center text-xs text-slate-400", children: "Select a section to begin editing." }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "lg:col-span-7 xl:col-span-7 flex flex-col space-y-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/25 flex items-center justify-between gap-2 text-xs text-purple-200 shadow-md", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-2 min-w-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "span",
              {
                className: `w-2 h-2 rounded-full shrink-0 ${isEditModeActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "truncate", children: isEditModeActive ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
              "Live Interactive Canvas: ",
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { className: "text-white", children: currentSectionLabel }),
              " is active in editor."
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
              "Normal Webpage Mode: Interacting normally without edit buttons. Toggle ",
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Edit Mode ON" }),
              " to edit."
            ] }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-1 text-[11px] text-emerald-300 shrink-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.CheckCircle2, { className: "w-3.5 h-3.5" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: isEditModeActive ? "Edit Mode ON" : "Normal View" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "div",
          {
            ref: viewportContainerRef,
            className: "relative min-h-[750px] h-[calc(100vh-160px)] bg-slate-950 rounded-2xl border border-purple-500/20 shadow-2xl p-2 sm:p-4 flex flex-col items-center justify-start overflow-hidden",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                "div",
                {
                  className: "absolute inset-0 pointer-events-none opacity-20",
                  style: {
                    backgroundImage: "radial-gradient(circle, #a855f7 1px, transparent 1px)",
                    backgroundSize: "24px 24px"
                  }
                }
              ),
              isLoadingIframe && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm gap-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react7.Loader2, { className: "w-8 h-8 text-purple-400 animate-spin" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-xs text-slate-400", children: "Loading interactive preview..." })
              ] }),
              (() => {
                const targetWidth = DEVICE_VIEWPORTS[device].width;
                const availW = Math.max(containerSize.width - 24, 320);
                const availH = Math.max(containerSize.height - 24, 400);
                const scale = availW < targetWidth ? availW / targetWidth : 1;
                const unscaledHeight = availH / scale;
                return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  "div",
                  {
                    className: "w-full h-full flex items-start justify-center overflow-hidden",
                    style: { width: `${availW}px`, height: `${availH}px` },
                    children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
                      "div",
                      {
                        style: {
                          width: `${targetWidth}px`,
                          height: `${unscaledHeight}px`,
                          transform: `scale(${scale})`,
                          transformOrigin: "top center"
                        },
                        className: `shrink-0 transition-all duration-200 overflow-hidden shadow-2xl border ${device === "mobile" ? "border-slate-700 bg-slate-900 rounded-[38px] p-2 ring-8 ring-slate-800" : device === "tablet" ? "border-slate-700 bg-slate-900 rounded-[28px] p-2 ring-4 ring-slate-800" : "border-slate-800 bg-white rounded-xl"}`,
                        children: [
                          device === "mobile" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-24 h-4 bg-slate-800 rounded-full mx-auto mb-1 flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-2 h-2 rounded-full bg-slate-900" }) }),
                          isWaitingForRecord ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-full h-full flex items-center justify-center bg-slate-900 text-xs text-slate-400 p-6 text-center", children: "Pick a record in the menu next to the page name to preview it." }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                            "iframe",
                            {
                              ref: iframeRef,
                              src: iframeSrc,
                              title: "Public Site Live Preview",
                              className: "w-full h-full bg-white block",
                              style: { border: "none" },
                              onLoad: () => setIsLoadingIframe(false)
                            }
                          )
                        ]
                      }
                    )
                  }
                );
              })()
            ]
          }
        )
      ] })
    ] })
  ] });
};

// src/admin/CmsStudio.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
function StudioContent({ config, initialPage, onPageChange }) {
  const firstPage = config.pages[0]?.key ?? "";
  const [activePage, setActivePage] = (0, import_react9.useState)(
    initialPage && findPage(config, initialPage) ? initialPage : firstPage
  );
  const [isGlobalPreviewOpen, setIsGlobalPreviewOpen] = (0, import_react9.useState)(false);
  (0, import_react9.useEffect)(() => {
    if (initialPage && findPage(config, initialPage)) setActivePage(initialPage);
  }, [initialPage, config]);
  const changePage = (page) => {
    setActivePage(page);
    if (onPageChange) onPageChange(page);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "p-4 sm:p-6 lg:p-8 space-y-6 text-white mx-auto max-w-[1920px]", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react8.Globe, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h1", { className: "text-2xl sm:text-3xl font-extrabold tracking-tight text-white", children: config.title || "Site CMS" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-xs sm:text-sm text-slate-400 mt-1", children: "Hover over any section in the live preview, or select one from the editor panel." })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => setIsGlobalPreviewOpen(true),
          className: "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react8.Eye, { className: "w-4 h-4" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "Launch Live Preview" })
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(CanvasEditor, { initialPage: activePage, onPageChange: changePage }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      LivePreviewModal,
      {
        isOpen: isGlobalPreviewOpen,
        onClose: () => setIsGlobalPreviewOpen(false),
        pagePath: findPage(config, activePage)?.route || "/"
      }
    )
  ] });
}
var CmsStudio = (props) => {
  const { config, toaster = true } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(StudioProvider, { config, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "min-h-full bg-slate-950", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(StudioContent, { ...props }) }),
    toaster && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_react_hot_toast5.Toaster, { position: "top-right" })
  ] });
};

// src/admin/CmsNavButton.tsx
var import_lucide_react9 = require("lucide-react");
var import_jsx_runtime10 = require("react/jsx-runtime");
var CmsNavButton = ({
  href,
  active = false,
  label = "CMS",
  as: Component = "a",
  className,
  ...rest
}) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
  Component,
  {
    href,
    "aria-current": active ? "page" : void 0,
    className: className ?? `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800/80"}`,
    ...rest,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react9.Globe, { className: "w-5 h-5" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: label })
    ]
  }
);

// src/admin/CmsAuth.tsx
var import_react10 = require("react");
var import_lucide_react10 = require("lucide-react");
var import_jsx_runtime11 = require("react/jsx-runtime");
function safeNext(value) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
}
var CmsLogin = ({ auth, title = "Sign in to edit your site", onSuccess, redirectTo = "/" }) => {
  const [username, setUsername] = (0, import_react10.useState)("");
  const [password, setPassword] = (0, import_react10.useState)("");
  const [error, setError] = (0, import_react10.useState)("");
  const [busy, setBusy] = (0, import_react10.useState)(false);
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const user = await auth.login(username.trim(), password);
      if (onSuccess) onSuccess(user);
      else window.location.assign(safeNext(new URLSearchParams(window.location.search).get("next")) ?? redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setPassword("");
      setBusy(false);
    }
  };
  const field = "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30";
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "flex min-h-[70vh] items-center justify-center px-4 py-10 text-white", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("form", { onSubmit: submit, className: "w-full max-w-sm space-y-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex flex-col items-center gap-3 text-center", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "rounded-xl border border-purple-500/30 bg-purple-600/20 p-3 text-purple-400", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react10.Lock, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h1", { className: "text-xl font-bold", children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "text-xs text-slate-400", children: "Use your staff username and password." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "block space-y-1.5 text-xs font-semibold text-slate-300", children: [
      "Username",
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { className: field, value: username, onChange: (e) => setUsername(e.target.value), autoComplete: "username", autoFocus: true, required: true })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "block space-y-1.5 text-xs font-semibold text-slate-300", children: [
      "Password",
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { className: field, type: "password", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password", required: true })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "alert", className: "rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300", children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
      "button",
      {
        type: "submit",
        disabled: busy,
        className: "flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-60",
        children: [
          busy && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react10.Loader2, { className: "h-4 w-4 animate-spin" }),
          busy ? "Signing in..." : "Sign in"
        ]
      }
    )
  ] }) });
};
var CmsAuthGate = ({ auth, loginPath, title, children }) => {
  const [state, setState] = (0, import_react10.useState)("checking");
  const [message, setMessage] = (0, import_react10.useState)("");
  const verify = (0, import_react10.useCallback)(async () => {
    if (loginPath && window.location.pathname === loginPath) {
      setState("login-page");
      return;
    }
    setState("checking");
    try {
      const user = await auth.check();
      if (user) return setState("in");
      if (loginPath) {
        const back = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`${loginPath}?next=${back}`);
        return;
      }
      setState("out");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not check your sign-in.");
      setState("error");
    }
  }, [auth, loginPath]);
  (0, import_react10.useEffect)(() => {
    void verify();
  }, [verify]);
  if (state === "in" || state === "login-page") return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_jsx_runtime11.Fragment, { children });
  if (state === "out") return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CmsLogin, { auth, title, onSuccess: () => void verify() });
  if (state === "error") {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center text-white", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "text-sm text-slate-300", children: message }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", onClick: () => void verify(), className: "rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold hover:bg-purple-500", children: "Try again" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "flex min-h-[40vh] items-center justify-center text-slate-400", role: "status", "aria-label": "Checking your sign-in", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react10.Loader2, { className: "h-6 w-6 animate-spin" }) });
};
var CmsLogoutButton = ({ auth, redirectTo = "/", className, children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  "button",
  {
    type: "button",
    className: className ?? "inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700",
    onClick: () => {
      auth.logout();
      window.location.assign(redirectTo);
    },
    children: children ?? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react10.LogOut, { className: "h-3.5 w-3.5" }),
      " Sign out"
    ] })
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CmsAuthGate,
  CmsLogin,
  CmsLogoutButton,
  CmsNavButton,
  CmsStudio,
  POPULAR_ICONS,
  getDynamicIcon,
  safeNext
});
