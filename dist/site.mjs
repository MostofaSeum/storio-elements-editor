"use client";
import {
  CMS_MESSAGE,
  EDIT_MODE_PARAM,
  PREVIEW_PARAM,
  findGlobalPage,
  findPage,
  getAtPath,
  listenForCmsMessages,
  mergePageContent,
  parseFieldPath,
  postCmsMessage,
  themeToCss,
  trustedOrigins
} from "./chunk-YQGKZECL.mjs";

// src/site/CmsProvider.tsx
import { createContext, useContext, useEffect as useEffect2, useMemo, useState as useState2 } from "react";

// src/site/preview.ts
import { useEffect, useState } from "react";
function hasParam(name) {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has(name);
}
function isCmsPreview() {
  return hasParam(PREVIEW_PARAM) || hasParam(EDIT_MODE_PARAM);
}
function useCmsEditMode(origins) {
  const [isEditMode, setIsEditMode] = useState(false);
  const originsKey = origins.join("|");
  useEffect(() => {
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
import { jsx } from "react/jsx-runtime";
var CmsContext = createContext(null);
var CmsProvider = ({ config, initialContent, children }) => {
  const [origins, setOrigins] = useState2([]);
  useEffect2(() => {
    setOrigins(trustedOrigins(config.allowedOrigins ?? []));
  }, [config.allowedOrigins]);
  const value = useMemo(
    () => ({ config, initialContent: initialContent ?? {}, origins }),
    [config, initialContent, origins]
  );
  return /* @__PURE__ */ jsx(CmsContext.Provider, { value, children });
};
function useCmsContext() {
  const ctx = useContext(CmsContext);
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
  const [content, setContent] = useState2(
    () => options.initialData ?? initialContent[pageKey] ?? mergePageContent(page, [])
  );
  const originsKey = origins.join("|");
  useEffect2(() => {
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

// src/site/CmsThemeStyle.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var CmsThemeStyle = ({ section = "theme", prefix, selector }) => {
  const site = useSiteContent();
  const css = themeToCss(site[section], { prefix, selector });
  if (!css) return null;
  return /* @__PURE__ */ jsx2("style", { "data-cms-theme": section, dangerouslySetInnerHTML: { __html: css } });
};

// src/site/CmsSection.tsx
import { useState as useState3, useEffect as useEffect3, useMemo as useMemo2, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";

// src/site/sectionContext.ts
import { createContext as createContext2 } from "react";
var CmsSectionContext = createContext2(null);
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
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
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
  const [pathname, setPathname] = useState3(null);
  const [isTargeted, setIsTargeted] = useState3(false);
  const [isHovered, setIsHovered] = useState3(false);
  const [buttonPosition, setButtonPosition] = useState3(null);
  const sectionRef = useRef(null);
  const buttonRef = useRef(null);
  const originsKey = origins.join("|");
  useEffect3(() => {
    setPathname(window.location.pathname);
  }, []);
  const isFieldActive = useSyncExternalStore(subscribeToFieldHover, isFieldHoverActive, () => false);
  const isSectionHovered = isHovered && !isFieldActive;
  const isValidPath = !activeOnPath || pathname === activeOnPath;
  const showButton = isEditMode && isValidPath && (isSectionHovered || isTargeted);
  const sectionContext = useMemo2(
    () => ({ sectionKey, page, isEditMode: isEditMode && isValidPath, origins }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionKey, page, isEditMode, isValidPath, originsKey]
  );
  useEffect3(() => {
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
  useEffect3(() => {
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
    return /* @__PURE__ */ jsx3(CmsSectionContext.Provider, { value: sectionContext, children });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: sectionRef,
      "data-cms-section": sectionKey,
      onClick: handleEditClick,
      onMouseOver: handleMouseOver,
      onMouseLeave: () => setIsHovered(false),
      className: `relative transition-all duration-300 cursor-pointer rounded-2xl ${isTargeted ? "ring-4 ring-purple-500 ring-offset-4 ring-offset-slate-950 shadow-[0_0_60px_rgba(168,85,247,0.5)]" : isSectionHovered ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900" : ""}`,
      children: [
        /* @__PURE__ */ jsx3(CmsSectionContext.Provider, { value: sectionContext, children }),
        showButton && buttonPosition && createPortal(
          /* @__PURE__ */ jsx3(
            "div",
            {
              ref: buttonRef,
              "data-cms-edit-button": sectionKey,
              style: { position: "fixed", top: buttonPosition.top, right: buttonPosition.right, zIndex: EDIT_BUTTON_Z_INDEX },
              children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: handleEditClick,
                  className: "flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-2xl shadow-purple-950/80 border-2 border-purple-300/80 backdrop-blur-xl cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap",
                  title: `Edit ${title} in the editor panel`,
                  children: [
                    /* @__PURE__ */ jsx3(Pencil, { className: "w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] text-purple-100" }),
                    /* @__PURE__ */ jsxs("span", { className: "drop-shadow-sm", children: [
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
import { useCallback, useContext as useContext2, useEffect as useEffect5, useRef as useRef2, useState as useState4 } from "react";
import { createPortal as createPortal2 } from "react-dom";
import { Pencil as Pencil2 } from "lucide-react";

// src/site/itemDrafts.ts
import { useEffect as useEffect4, useSyncExternalStore as useSyncExternalStore2 } from "react";
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
  useEffect4(() => {
    ensureListening(origins);
  }, [originsKey]);
  return useSyncExternalStore2(
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
import { Fragment, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var PENCIL_SIZE = 30;
var WINDOW_MARGIN2 = 4;
var HIDE_DELAY_MS = 400;
function labelFromPath(path) {
  const name = path.split(".").filter((part) => !/^\d+$/.test(part)).pop() ?? path;
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
var FieldFrame = ({ path, name, isEditMode, onOpen, children }) => {
  const wrapperRef = useRef2(null);
  const pencilRef = useRef2(null);
  const [isHovered, setIsHovered] = useState4(false);
  const [box, setBox] = useState4(null);
  const showControls = isEditMode && isHovered;
  const hideTimer = useRef2(void 0);
  const hideNow = useCallback(() => {
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
  useEffect5(
    () => () => {
      clearTimeout(hideTimer.current);
      releaseFieldHover(hideNow);
    },
    [hideNow]
  );
  useEffect5(() => {
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
  if (!isEditMode) return /* @__PURE__ */ jsx4(Fragment, { children });
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
  return /* @__PURE__ */ jsxs2(
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
        showControls && box && createPortal2(
          /* @__PURE__ */ jsxs2(Fragment, { children: [
            /* @__PURE__ */ jsx4(
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
            /* @__PURE__ */ jsx4(
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
                children: /* @__PURE__ */ jsx4(Pencil2, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" })
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
  const surrounding = useContext2(CmsSectionContext);
  const name = label ?? labelFromPath(path);
  useEffect5(() => {
    if (!surrounding && !sectionProp && new URLSearchParams(window.location.search).has(EDIT_MODE_PARAM)) {
      console.warn(`[storio-editor] <CmsField path="${path}"> must be placed inside a <CmsSection>, or given collection and item.`);
    }
  }, [surrounding, sectionProp, path]);
  if (sectionProp) {
    return /* @__PURE__ */ jsx4(OtherSectionField, { path, name, sectionKey: sectionProp, page, children });
  }
  if (!surrounding) return /* @__PURE__ */ jsx4(Fragment, { children });
  const targetPage = page ?? surrounding.page;
  return /* @__PURE__ */ jsx4(
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
  return /* @__PURE__ */ jsx4(
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
  return /* @__PURE__ */ jsx4(
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
    return /* @__PURE__ */ jsx4(RecordField, { ...props, collection, item: String(item) });
  }
  return /* @__PURE__ */ jsx4(SectionField, { ...props });
};

// src/site/CmsIcon.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx5(Component, { "aria-hidden": "true", ...props });
};
export {
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
};
