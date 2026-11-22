"use client";
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/site/index.ts
var site_exports = {};
__export(site_exports, {
  CmsField: () => CmsField,
  CmsIcon: () => CmsIcon,
  CmsProvider: () => CmsProvider,
  CmsSection: () => CmsSection,
  CmsThemeStyle: () => CmsThemeStyle,
  isCmsPreview: () => isCmsPreview,
  useCmsConfig: () => useCmsConfig,
  useCmsEditMode: () => useCmsEditMode,
  useCollectionItem: () => useCollectionItem,
  usePageContent: () => usePageContent,
  useSiteContent: () => useSiteContent
});
module.exports = __toCommonJS(site_exports);

// src/site/CmsProvider.tsx
var import_react2 = require("react");

// src/core/defineCms.ts
function findGlobalPage(config) {
  return config.pages.find((p) => p.global);
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

// src/site/preview.ts
var import_react = require("react");
function hasParam(name) {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has(name);
}
function isCmsPreview() {
  return hasParam(PREVIEW_PARAM) || hasParam(EDIT_MODE_PARAM);
}
function useCmsEditMode(origins) {
  const [isEditMode, setIsEditMode] = (0, import_react.useState)(false);
  const originsKey = origins.join("|");
  (0, import_react.useEffect)(() => {
    setIsEditMode(hasParam(EDIT_MODE_PARAM));
    if (typeof window === "undefined" || window.parent === window) return;
    return listenForCmsMessages(
      (message) => {
        if (message.type === CMS_MESSAGE.SET_EDIT_MODE) setIsEditMode(Boolean(message.enabled));
      },
      { origins, source: () => window.parent }
    );
  }, [originsKey]);
  return isEditMode;
}

// src/site/CmsProvider.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var CmsContext = (0, import_react2.createContext)(null);
var CmsProvider = ({ config, initialContent, children }) => {
  const [origins, setOrigins] = (0, import_react2.useState)([]);
  (0, import_react2.useEffect)(() => {
    setOrigins(trustedOrigins(config.allowedOrigins ?? []));
  }, [config.allowedOrigins]);
  const value = (0, import_react2.useMemo)(
    () => ({ config, initialContent: initialContent ?? {}, origins }),
    [config, initialContent, origins]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CmsContext.Provider, { value, children });
};
function useCmsContext() {
  const ctx = (0, import_react2.useContext)(CmsContext);
  if (!ctx) {
    throw new Error("[storio-editor] Wrap your site in <CmsProvider config={...}> before using CMS hooks.");
  }
  return ctx;
}
function useCmsConfig() {
  return useCmsContext().config;
}
function usePageContent(pageKey, options = {}) {
  const { config, initialContent, origins } = useCmsContext();
  const page = findPage(config, pageKey);
  if (!page) {
    throw new Error(`[storio-editor] Unknown page "${pageKey}". Add it to the "pages" array of your CMS config.`);
  }
  const [content, setContent] = (0, import_react2.useState)(
    () => options.initialData ?? initialContent[pageKey] ?? mergePageContent(page, [])
  );
  const originsKey = origins.join("|");
  (0, import_react2.useEffect)(() => {
    let isMounted = true;
    const includeDrafts = isCmsPreview();
    const fetchPage = async () => {
      try {
        const records = await config.adapter.listRecords(pageKey, { includeDrafts });
        if (isMounted) setContent(mergePageContent(page, records, { includeDrafts }));
      } catch {
      }
    };
    fetchPage();
    if (typeof window === "undefined" || window.parent === window || origins.length === 0) {
      return () => {
        isMounted = false;
      };
    }
    const unsubscribe = listenForCmsMessages(
      (message) => {
        if (message.type === CMS_MESSAGE.CONTENT_UPDATED) {
          fetchPage();
        } else if (message.type === CMS_MESSAGE.DRAFT_PREVIEW && message.page === pageKey) {
          setContent((prev) => ({
            ...prev,
            [message.sectionKey]: message.draftContent
          }));
        }
      },
      { origins, source: () => window.parent }
    );
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [pageKey, config.adapter, originsKey]);
  return content;
}
function useSiteContent(options = {}) {
  const { config } = useCmsContext();
  const globalPage = findGlobalPage(config);
  if (!globalPage) {
    throw new Error('[storio-editor] useSiteContent needs a page with global: true in the "pages" array of your CMS config.');
  }
  return usePageContent(globalPage.key, options);
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

// src/site/CmsThemeStyle.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var CmsThemeStyle = ({ section = "theme", prefix, selector }) => {
  const site = useSiteContent();
  const css = themeToCss(site[section], { prefix, selector });
  if (!css) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { "data-cms-theme": section, dangerouslySetInnerHTML: { __html: css } });
};

// src/site/CmsSection.tsx
var import_react4 = require("react");
var import_react_dom = require("react-dom");
var import_lucide_react = require("lucide-react");

// src/site/sectionContext.ts
var import_react3 = require("react");
var CmsSectionContext = (0, import_react3.createContext)(null);
var EDIT_BUTTON_Z_INDEX = 2147483e3;
var activeField = null;
var fieldHoverListeners = /* @__PURE__ */ new Set();
function notifyFieldHover() {
  fieldHoverListeners.forEach((listener) => listener());
}
function claimFieldHover(hide) {
  if (activeField === hide) return;
  const previous = activeField;
  activeField = hide;
  previous?.();
  notifyFieldHover();
}
function releaseFieldHover(hide) {
  if (activeField !== hide) return;
  activeField = null;
  notifyFieldHover();
}
function isFieldHoverActive() {
  return activeField !== null;
}
function subscribeToFieldHover(listener) {
  fieldHoverListeners.add(listener);
  return () => {
    fieldHoverListeners.delete(listener);
  };
}

// src/site/CmsSection.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var BUTTON_TOP = {
  inside: 24,
  "inside-low": 112,
  fixed: 96
};
var BUTTON_RIGHT = 32;
var WINDOW_MARGIN = 8;
var BUTTON_HEIGHT = 56;
var CmsSection = ({
  sectionKey,
  title,
  page,
  activeOnPath,
  buttonPlacement = "inside",
  children
}) => {
  const { origins } = useCmsContext();
  const isEditMode = useCmsEditMode(origins);
  const [pathname, setPathname] = (0, import_react4.useState)(null);
  const [isTargeted, setIsTargeted] = (0, import_react4.useState)(false);
  const [isHovered, setIsHovered] = (0, import_react4.useState)(false);
  const [buttonPosition, setButtonPosition] = (0, import_react4.useState)(null);
  const sectionRef = (0, import_react4.useRef)(null);
  const buttonRef = (0, import_react4.useRef)(null);
  const originsKey = origins.join("|");
  (0, import_react4.useEffect)(() => {
    setPathname(window.location.pathname);
  }, []);
  const isFieldActive = (0, import_react4.useSyncExternalStore)(subscribeToFieldHover, isFieldHoverActive, () => false);
  const isSectionHovered = isHovered && !isFieldActive;
  const isValidPath = !activeOnPath || pathname === activeOnPath;
  const showButton = isEditMode && isValidPath && (isSectionHovered || isTargeted);
  const sectionContext = (0, import_react4.useMemo)(
    () => ({ sectionKey, page, isEditMode: isEditMode && isValidPath, origins }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionKey, page, isEditMode, isValidPath, originsKey]
  );
  (0, import_react4.useEffect)(() => {
    if (!isEditMode) return;
    let timer;
    const unsubscribe = listenForCmsMessages(
      (message) => {
        if (message.type === CMS_MESSAGE.SCROLL_TO_SECTION && message.sectionKey === sectionKey) {
          if (sectionRef.current) {
            sectionRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
            setIsTargeted(true);
            clearTimeout(timer);
            timer = setTimeout(() => setIsTargeted(false), 2400);
          }
        }
      },
      { origins, source: () => window.parent }
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [isEditMode, sectionKey, originsKey]);
  (0, import_react4.useEffect)(() => {
    if (!showButton) {
      setButtonPosition(null);
      return;
    }
    const update = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const isFixed = buttonPlacement === "fixed" || rect.width === 0;
      const right = isFixed ? BUTTON_RIGHT : Math.max(WINDOW_MARGIN, document.documentElement.clientWidth - rect.right + BUTTON_RIGHT);
      const wanted = isFixed ? BUTTON_TOP[buttonPlacement] : rect.top + BUTTON_TOP[buttonPlacement];
      const lowest = Math.max(WINDOW_MARGIN, window.innerHeight - BUTTON_HEIGHT - WINDOW_MARGIN);
      const top = Math.min(Math.max(WINDOW_MARGIN, wanted), lowest);
      setButtonPosition((prev) => prev && prev.top === top && prev.right === right ? prev : { top, right });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [showButton, buttonPlacement]);
  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      postCmsMessage(
        window.parent,
        {
          type: CMS_MESSAGE.EDIT_SECTION,
          sectionKey,
          ...page ? { page } : {},
          title
        },
        origins
      );
    }
  };
  const handleMouseOver = (e) => {
    const target = e.target;
    if (buttonRef.current?.contains(target)) return;
    setIsHovered(!target.closest("[data-cms-field]") && target.closest("[data-cms-section]") === sectionRef.current);
  };
  if (!isEditMode || !isValidPath) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CmsSectionContext.Provider, { value: sectionContext, children });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      ref: sectionRef,
      "data-cms-section": sectionKey,
      onClick: handleEditClick,
      onMouseOver: handleMouseOver,
      onMouseLeave: () => setIsHovered(false),
      className: `relative transition-all duration-300 cursor-pointer rounded-2xl ${isTargeted ? "ring-4 ring-purple-500 ring-offset-4 ring-offset-slate-950 shadow-[0_0_60px_rgba(168,85,247,0.5)]" : isSectionHovered ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900" : ""}`,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CmsSectionContext.Provider, { value: sectionContext, children }),
        showButton && buttonPosition && (0, import_react_dom.createPortal)(
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "div",
            {
              ref: buttonRef,
              "data-cms-edit-button": sectionKey,
              style: { position: "fixed", top: buttonPosition.top, right: buttonPosition.right, zIndex: EDIT_BUTTON_Z_INDEX },
              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: handleEditClick,
                  className: "flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-2xl shadow-purple-950/80 border-2 border-purple-300/80 backdrop-blur-xl cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap",
                  title: `Edit ${title} in the editor panel`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react.Pencil, { className: "w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] text-purple-100" }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "drop-shadow-sm", children: [
                      "Edit ",
                      title
                    ] })
                  ]
                }
              )
            }
          ),
          document.body
        )
      ]
    }
  );
};

// src/site/CmsField.tsx
var import_react6 = require("react");
var import_react_dom2 = require("react-dom");
var import_lucide_react2 = require("lucide-react");

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

// src/site/itemDrafts.ts
var import_react5 = require("react");
var drafts = /* @__PURE__ */ new Map();
var listeners = /* @__PURE__ */ new Set();
var stopListening = null;
var listeningFor = "";
var keyOf = (collection, item) => `${collection}\0${item}`;
function notify() {
  listeners.forEach((listener) => listener());
}
function ensureListening(origins) {
  if (typeof window === "undefined" || window.parent === window || origins.length === 0) return;
  const key = origins.join("|");
  if (key === listeningFor) return;
  stopListening?.();
  listeningFor = key;
  stopListening = listenForCmsMessages(
    (message) => {
      if (message.type !== CMS_MESSAGE.ITEM_DRAFT) return;
      const draftKey = keyOf(message.collection, String(message.item));
      if (message.values) drafts.set(draftKey, message.values);
      else drafts.delete(draftKey);
      notify();
    },
    { origins, source: () => window.parent }
  );
}
function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function useItemDraft(collection, item) {
  const { origins } = useCmsContext();
  const originsKey = origins.join("|");
  (0, import_react5.useEffect)(() => {
    ensureListening(origins);
  }, [originsKey]);
  return (0, import_react5.useSyncExternalStore)(
    subscribe,
    () => drafts.get(keyOf(collection, item)),
    () => void 0
  );
}
function useCollectionItem(collection, item, values) {
  const draft = useItemDraft(collection, String(item));
  return draft ? { ...values, ...draft } : values;
}

// src/site/CmsField.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var PENCIL_SIZE = 30;
var WINDOW_MARGIN2 = 4;
var HIDE_DELAY_MS = 400;
function labelFromPath(path) {
  const name = path.split(".").filter((part) => !/^\d+$/.test(part)).pop() ?? path;
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
var FieldFrame = ({ path, name, isEditMode, onOpen, children }) => {
  const wrapperRef = (0, import_react6.useRef)(null);
  const pencilRef = (0, import_react6.useRef)(null);
  const [isHovered, setIsHovered] = (0, import_react6.useState)(false);
  const [box, setBox] = (0, import_react6.useState)(null);
  const showControls = isEditMode && isHovered;
  const hideTimer = (0, import_react6.useRef)(void 0);
  const hideNow = (0, import_react6.useCallback)(() => {
    clearTimeout(hideTimer.current);
    setIsHovered(false);
    releaseFieldHover(hideNow);
  }, []);
  const show = () => {
    clearTimeout(hideTimer.current);
    claimFieldHover(hideNow);
    setIsHovered(true);
  };
  const hideSoon = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hideNow, HIDE_DELAY_MS);
  };
  (0, import_react6.useEffect)(
    () => () => {
      clearTimeout(hideTimer.current);
      releaseFieldHover(hideNow);
    },
    [hideNow]
  );
  (0, import_react6.useEffect)(() => {
    if (!showControls) {
      setBox(null);
      return;
    }
    let frame = 0;
    const range = document.createRange();
    const measure = () => {
      const wrapper = wrapperRef.current;
      if (wrapper && !pencilRef.current?.matches(":hover")) {
        range.selectNodeContents(wrapper);
        const rect = range.getBoundingClientRect();
        setBox(
          (prev) => prev && prev.top === rect.top && prev.left === rect.left && prev.width === rect.width && prev.height === rect.height ? prev : { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        );
      }
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [showControls]);
  if (!isEditMode) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children });
  const open = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.parent === window) return;
    onOpen();
  };
  const handleMouseOver = (e) => {
    const target = e.target;
    if (pencilRef.current?.contains(target) || target.closest("[data-cms-field]") === wrapperRef.current) show();
    else hideNow();
  };
  const pencilTop = box ? Math.min(Math.max(WINDOW_MARGIN2, box.top - PENCIL_SIZE / 2), window.innerHeight - PENCIL_SIZE - WINDOW_MARGIN2) : 0;
  const pencilLeft = box ? Math.min(
    Math.max(WINDOW_MARGIN2, box.left + box.width - PENCIL_SIZE / 2),
    document.documentElement.clientWidth - PENCIL_SIZE - WINDOW_MARGIN2
  ) : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "span",
    {
      ref: wrapperRef,
      "data-cms-field": path,
      style: { display: "contents" },
      onClick: open,
      onMouseOver: handleMouseOver,
      onMouseLeave: hideSoon,
      children: [
        children,
        showControls && box && (0, import_react_dom2.createPortal)(
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "div",
              {
                "aria-hidden": "true",
                style: {
                  position: "fixed",
                  top: box.top - 3,
                  left: box.left - 3,
                  width: box.width + 6,
                  height: box.height + 6,
                  border: "2px solid #a855f7",
                  borderRadius: 6,
                  pointerEvents: "none",
                  boxSizing: "border-box",
                  zIndex: EDIT_BUTTON_Z_INDEX
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "button",
              {
                ref: pencilRef,
                type: "button",
                "data-cms-field-button": path,
                onClick: open,
                title: `Edit ${name}`,
                "aria-label": `Edit ${name}`,
                style: {
                  position: "fixed",
                  top: pencilTop,
                  left: pencilLeft,
                  width: PENCIL_SIZE,
                  height: PENCIL_SIZE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  color: "#ffffff",
                  background: "#9333ea",
                  border: "2px solid #e9d5ff",
                  borderRadius: 9999,
                  boxShadow: "0 4px 14px rgba(59, 7, 100, 0.55)",
                  cursor: "pointer",
                  zIndex: EDIT_BUTTON_Z_INDEX + 1
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react2.Pencil, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" })
              }
            )
          ] }),
          document.body
        )
      ]
    }
  );
};
var SectionField = ({ path, label, section: sectionProp, page, children }) => {
  const surrounding = (0, import_react6.useContext)(CmsSectionContext);
  const name = label ?? labelFromPath(path);
  (0, import_react6.useEffect)(() => {
    if (!surrounding && !sectionProp && new URLSearchParams(window.location.search).has(EDIT_MODE_PARAM)) {
      console.warn(`[storio-editor] <CmsField path="${path}"> must be placed inside a <CmsSection>, or given collection and item.`);
    }
  }, [surrounding, sectionProp, path]);
  if (sectionProp) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(OtherSectionField, { path, name, sectionKey: sectionProp, page, children });
  }
  if (!surrounding) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children });
  const targetPage = page ?? surrounding.page;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    FieldFrame,
    {
      path,
      name,
      isEditMode: surrounding.isEditMode,
      onOpen: () => postCmsMessage(
        window.parent,
        {
          type: CMS_MESSAGE.EDIT_SECTION,
          sectionKey: surrounding.sectionKey,
          ...targetPage ? { page: targetPage } : {},
          title: name,
          fieldPath: path
        },
        surrounding.origins
      ),
      children
    }
  );
};
var OtherSectionField = ({
  path,
  name,
  sectionKey,
  page,
  children
}) => {
  const { origins } = useCmsContext();
  const isEditMode = useCmsEditMode(origins);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    FieldFrame,
    {
      path,
      name,
      isEditMode,
      onOpen: () => postCmsMessage(
        window.parent,
        { type: CMS_MESSAGE.EDIT_SECTION, sectionKey, ...page ? { page } : {}, title: name, fieldPath: path },
        origins
      ),
      children
    }
  );
};
var RecordField = ({
  path,
  label,
  collection,
  item,
  children
}) => {
  const { origins } = useCmsContext();
  const isEditMode = useCmsEditMode(origins);
  const draft = useItemDraft(collection, item);
  const name = label ?? labelFromPath(path);
  let content = children;
  if (draft && (typeof children === "string" || typeof children === "number")) {
    const value = getAtPath(draft, parseFieldPath(path));
    if (typeof value === "string" || typeof value === "number") content = value;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    FieldFrame,
    {
      path,
      name,
      isEditMode,
      onOpen: () => postCmsMessage(
        window.parent,
        { type: CMS_MESSAGE.EDIT_SECTION, sectionKey: "", title: name, fieldPath: path, collection, item },
        origins
      ),
      children: content
    }
  );
};
var CmsField = ({ collection, item, ...props }) => {
  if (collection && item !== void 0 && item !== null && item !== "") {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RecordField, { ...props, collection, item: String(item) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(SectionField, { ...props });
};

// src/site/CmsIcon.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var warned = /* @__PURE__ */ new Set();
var CmsIcon = ({ name, fallback, ...props }) => {
  const icons = useCmsConfig().icons;
  const Icon = name && icons?.[name] || fallback;
  if (!Icon) {
    if (name && !warned.has(name)) {
      warned.add(name);
      console.warn(
        icons ? `[storio-editor] <CmsIcon name="${name}">: "${name}" is not in the icons of your CMS config.` : "[storio-editor] <CmsIcon> needs an `icons` map in defineCms({ ... })."
      );
    }
    return null;
  }
  const Component = Icon;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Component, { "aria-hidden": "true", ...props });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CmsField,
  CmsIcon,
  CmsProvider,
  CmsSection,
  CmsThemeStyle,
  isCmsPreview,
  useCmsConfig,
  useCmsEditMode,
  useCollectionItem,
  usePageContent,
  useSiteContent
});
