import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  ExternalLink,
  Layers,
  Loader2,
  CheckCircle2,
  MousePointerClick,
  ChevronRight,
  ChevronDown,
  Pencil,
  Eye,
  Database,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { CollectionItemSummary, FieldStyle, PageDef, SectionDef, SectionDetail, StyleSheetData } from '../core/types';
import { findGlobalPage, findPage, resolveSectionPage } from '../core/defineCms';
import { fillRoute, groupPageOf, isDynamicRoute, recordPagesOf, topLevelPages } from '../core/collections';
import { getSectionDetail } from '../core/merge';
import { CMS_MESSAGE, listenForCmsMessages, postCmsMessage } from '../core/messages';
import { buildPreviewUrl, getAtPath, parseFieldPath, publicUrl } from '../core/paths';
import { STYLES_KEY, hasFieldStyle, setFieldStyle } from '../core/styles';
import { SectionEditorForm } from './SectionEditorForm';
import { StylePanel } from './StylePanel';
import { useStudio } from './StudioContext';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

/** Section-list key of the "fields of this record" entry. Not a valid section key, so it never collides. */
const RECORD_SECTION = ':record';

type ItemsState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; items: CollectionItemSummary[] };

interface RecordDetail {
  collection: string;
  id: string;
  values: Record<string, unknown>;
}

/** The record whose fields the form edits. It can differ from the page in the preview (a post title on the blog list). */
interface RecordTarget {
  collection: string;
  id: string;
  label: string;
}

// Responsive viewport scale configurations.
// Desktop renders at a full 1280px inside the preview iframe and is scaled down with a
// CSS transform, so desktop breakpoints (md:, lg:) stay active in a narrow panel.
const DEVICE_VIEWPORTS: Record<
  DeviceMode,
  { label: string; width: number; icon: React.ComponentType<{ className?: string }> }
> = {
  desktop: { label: 'Desktop', width: 1280, icon: Monitor },
  tablet: { label: 'Tablet', width: 768, icon: Tablet },
  mobile: { label: 'Mobile', width: 390, icon: Smartphone },
};

export interface CanvasEditorProps {
  initialPage?: string;
  onPageChange?: (page: string) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ initialPage, onPageChange }) => {
  const { config, origins } = useStudio();
  const adapter = config.adapter;
  const [activePage, setActivePage] = useState<string>(initialPage || config.pages[0]?.key || '');

  // Sync state if initialPage changes from outside
  useEffect(() => {
    if (initialPage) setActivePage(initialPage);
  }, [initialPage]);

  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [isEditModeActive, setIsEditModeActive] = useState<boolean>(true);
  // Starts at 0 so server and client render the same iframe src; bumped on refresh.
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoadingIframe, setIsLoadingIframe] = useState(true);

  // Active section currently open in the left editor
  const pageDef: PageDef | undefined = findPage(config, activePage);
  const groupPage = pageDef ? groupPageOf(config, pageDef) : undefined;
  const recordPages = groupPage ? recordPagesOf(config, groupPage) : [];
  // The record (blog post, product...) open on a [slug] or [id] page.
  const [activeItem, setActiveItem] = useState<CollectionItemSummary | null>(null);
  const [itemsByPage, setItemsByPage] = useState<Record<string, ItemsState>>({});
  const [recordDetail, setRecordDetail] = useState<RecordDetail | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [recordTarget, setRecordTarget] = useState<RecordTarget | null>(null);
  const isRecordOpen = Boolean(recordTarget);
  // Site-wide sections (header, footer, theme...) are offered on every page, after the page's own.
  const globalPage = findGlobalPage(config);
  const globalSections: SectionDef[] = React.useMemo(
    () => (globalPage && globalPage.key !== activePage ? globalPage.sections : []),
    [globalPage, activePage]
  );
  const availableSections: SectionDef[] = React.useMemo(() => {
    const sections = [...(pageDef?.sections ?? []), ...globalSections];
    if (!recordTarget) return sections;
    const owner = config.pages.find((p) => p.collection === recordTarget.collection);
    return [{ key: RECORD_SECTION, label: `${owner?.title ?? recordTarget.collection}: ${recordTarget.label}`, icon: Database }, ...sections];
  }, [pageDef, globalSections, recordTarget, config.pages]);
  const pageSections = availableSections.filter((s) => !globalSections.includes(s));
  const [activeSectionKey, setActiveSectionKey] = useState<string>(availableSections[0]?.key ?? '');
  // The single field opened with its own pencil. Null shows the whole section.
  const [activeFieldPath, setActiveFieldPath] = useState<string | null>(null);
  const hasUnsavedEdits = useRef(false);
  const activeSectionRef = useRef(activeSectionKey);
  activeSectionRef.current = activeSectionKey;
  const recordTargetRef = useRef(recordTarget);
  recordTargetRef.current = recordTarget;
  const itemsRef = useRef(itemsByPage);
  itemsRef.current = itemsByPage;
  const [sectionDetail, setSectionDetail] = useState<SectionDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  // The section list starts folded so the form gets the room; the header opens it.
  const [isSectionListOpen, setIsSectionListOpen] = useState(false);
  const activeSection = availableSections.find((s) => s.key === activeSectionKey);
  // The page that stores the open section: the open page, or the global page for a site-wide section.
  const sectionPageDef: PageDef | undefined =
    globalPage && globalSections.some((s) => s.key === activeSectionKey) ? globalPage : pageDef;
  const sectionPage = sectionPageDef?.key ?? activePage;
  // With listOnEveryPage: false the site-wide sections stay out of other pages' lists; one opened
  // from a click in the preview is shown while it is open.
  const listedGlobalSections =
    globalPage?.listOnEveryPage === false ? globalSections.filter((s) => s.key === activeSectionKey) : globalSections;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 800,
  });

  // Measure container dimensions to compute the transform scale
  useEffect(() => {
    if (!viewportContainerRef.current) return;
    const updateSize = () => {
      if (viewportContainerRef.current) {
        setContainerSize({
          width: viewportContainerRef.current.clientWidth,
          height: viewportContainerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewportContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // The iframe can finish loading before React attaches onLoad (it starts loading
  // from the server-rendered HTML), so also check its state directly.
  useEffect(() => {
    if (!isLoadingIframe) return;
    const check = () => {
      try {
        const doc = iframeRef.current?.contentDocument;
        // A fresh iframe briefly reports "complete" for about:blank; wait for the real page.
        if (doc && doc.readyState === 'complete' && doc.location.href !== 'about:blank') {
          setIsLoadingIframe(false);
        }
      } catch {
        // Cross-origin preview: rely on onLoad and the timeout below.
      }
    };
    check();
    const interval = setInterval(check, 300);
    const timeout = setTimeout(() => setIsLoadingIframe(false), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoadingIframe, iframeKey]);

  const currentRoute = pageDef ? (pageDef.collection && activeItem ? fillRoute(pageDef.route, activeItem) : pageDef.route) : '/';
  // A [slug] page cannot be shown until a record is picked.
  const isWaitingForRecord = isDynamicRoute(currentRoute);
  const activePageTitle = groupPage?.title || activePage;
  const activePageIcon = groupPage?.icon || Layers;

  const iframeSrc = buildPreviewUrl(currentRoute, {
    publicSiteUrl: config.publicSiteUrl,
    editMode: isEditModeActive,
    cacheBust: iframeKey,
  });

  const sendToPreview = useCallback(
    (message: Parameters<typeof postCmsMessage>[1]) => {
      postCmsMessage(iframeRef.current?.contentWindow, message, origins);
    },
    [origins]
  );

  /** Asks before unsaved edits are lost, and removes them from the preview when the editor agrees. */
  const confirmLeavingSection = useCallback(() => {
    if (!hasUnsavedEdits.current) return true;
    if (!window.confirm('You have unsaved changes in this section. Leave without saving them?')) return false;
    hasUnsavedEdits.current = false;
    sendToPreview({ type: CMS_MESSAGE.CONTENT_UPDATED });
    return true;
  }, [sendToPreview]);

  const changePage = (pageKey: string) => {
    if (!confirmLeavingSection()) return;
    setActiveFieldPath(null);
    setActiveItem(null);
    setRecordTarget(null);
    setRecordDetail(null);
    setActivePage(pageKey);
    // Start on the new page's own first section, so a site-wide section opened on the previous
    // page does not stay selected.
    const nextSections = findPage(config, pageKey)?.sections ?? [];
    if (nextSections[0]) setActiveSectionKey(nextSections[0].key);
    setIsLoadingIframe(true);
    setIframeKey(Date.now());
    if (onPageChange) onPageChange(pageKey);
  };

  /** Open one record (value "<pageKey>::<id>"), or the group page itself (value "home"). */
  const changeRecord = (value: string) => {
    if (!groupPage || !confirmLeavingSection()) return;
    setActiveFieldPath(null);
    setRecordDetail(null);
    if (value === 'home') {
      setActiveItem(null);
      setRecordTarget(null);
      setActivePage(groupPage.key);
    } else {
      const separator = value.indexOf('::');
      const pageKey = value.slice(0, separator);
      const id = value.slice(separator + 2);
      const state = itemsByPage[pageKey];
      const item = state?.status === 'ready' ? state.items.find((i) => i.id === id) : undefined;
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

  // Load the records of every [slug] page listed under the current page.
  const recordPagesKey = recordPages.map((p) => `${p.key}:${p.collection}`).join('|');
  useEffect(() => {
    for (const page of recordPages) {
      const collection = page.collection as string;
      if (!adapter.listItems) {
        setItemsByPage((prev) => ({
          ...prev,
          [page.key]: { status: 'error', message: 'The storage adapter cannot list records (it has no listItems).' },
        }));
        continue;
      }
      setItemsByPage((prev) => (prev[page.key]?.status === 'ready' ? prev : { ...prev, [page.key]: { status: 'loading' } }));
      adapter
        .listItems(collection)
        .then((items) => setItemsByPage((prev) => ({ ...prev, [page.key]: { status: 'ready', items } })))
        .catch((err: unknown) =>
          setItemsByPage((prev) => ({
            ...prev,
            [page.key]: {
              status: 'error',
              message: err instanceof Error && err.message ? err.message : `Could not load the records of "${collection}".`,
            },
          }))
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordPagesKey, adapter]);

  // A page that only shows records opens its first record.
  useEffect(() => {
    if (!pageDef?.collection || activeItem) return;
    const state = itemsByPage[pageDef.key];
    if (state?.status === 'ready' && state.items.length > 0) {
      setActiveItem(state.items[0]);
      setRecordTarget({ collection: pageDef.collection, id: state.items[0].id, label: state.items[0].label });
      setActiveSectionKey(RECORD_SECTION);
      setIsLoadingIframe(true);
      setIframeKey(Date.now());
    }
  }, [pageDef, activeItem, itemsByPage]);

  // Load the open record's values for the form.
  const loadRecord = useCallback(
    async (collection: string, id: string) => {
      if (!adapter.getItem) {
        toast.error('The storage adapter cannot load records (it has no getItem).');
        return;
      }
      setIsLoadingRecord(true);
      try {
        const values = await adapter.getItem(collection, id);
        if (!values) throw new Error('This record was not found.');
        setRecordDetail({ collection, id, values });
      } catch (err) {
        setRecordDetail(null);
        toast.error(err instanceof Error && err.message ? err.message : 'Could not load this record.');
      } finally {
        setIsLoadingRecord(false);
      }
    },
    [adapter]
  );

  useEffect(() => {
    if (!recordTarget) return;
    loadRecord(recordTarget.collection, recordTarget.id);
  }, [recordTarget, loadRecord]);

  const toggleEditMode = () => {
    const next = !isEditModeActive;
    setIsEditModeActive(next);
    sendToPreview({ type: CMS_MESSAGE.SET_EDIT_MODE, enabled: next });
    toast.success(
      next
        ? 'Edit Mode Active: Hover & click sections to edit'
        : 'Normal Browsing Mode: Edit options hidden',
      { duration: 2500 }
    );
  };

  // Default to the first section when the active page changes.
  useEffect(() => {
    if (
      availableSections.length > 0 &&
      !availableSections.some((section) => section.key === activeSectionKey)
    ) {
      setActiveSectionKey(availableSections[0].key);
    }
  }, [activePage, activeSectionKey, availableSections]);

  // Load section detail
  const loadSectionData = useCallback(
    async (page: PageDef, sectionKey: string) => {
      setIsLoadingDetail(true);
      try {
        const record = await adapter.getRecord(page.key, sectionKey, { includeDrafts: true });
        setSectionDetail(getSectionDetail(page, sectionKey, record));
      } catch {
        toast.error(`Failed to load data for section '${sectionKey}'`);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [adapter]
  );

  useEffect(() => {
    if (!sectionPageDef) return;
    const isSectionValid = availableSections.some((section) => section.key === activeSectionKey);
    if (activeSectionKey && isSectionValid && activeSectionKey !== RECORD_SECTION) {
      loadSectionData(sectionPageDef, activeSectionKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, sectionPage, activeSectionKey, loadSectionData]);

  // Two-way interaction: select a section on the left -> scroll the preview to it
  const handleSelectSection = (sectionKey: string) => {
    if (sectionKey !== activeSectionKey && !confirmLeavingSection()) return;
    setActiveFieldPath(null);
    setActiveSectionKey(sectionKey);
    setIsSectionListOpen(false);
    if (sectionKey !== RECORD_SECTION) sendToPreview({ type: CMS_MESSAGE.SCROLL_TO_SECTION, sectionKey });
  };

  // Listen for CMS_EDIT_SECTION when a section's edit button is clicked in the preview
  useEffect(() => {
    if (origins.length === 0) return;
    return listenForCmsMessages(
      (message) => {
        if (message.type !== CMS_MESSAGE.EDIT_SECTION) return;
        if (message.collection) {
          const id = String(message.item ?? '');
          if (!id || !config.pages.some((p) => p.collection === message.collection)) {
            toast.error(`No page in the CMS config shows the collection "${message.collection}".`);
            return;
          }
          const current = recordTargetRef.current;
          const isSameRecord = current?.collection === message.collection && current.id === id;
          if (!(isSameRecord && activeSectionRef.current === RECORD_SECTION) && !confirmLeavingSection()) return;
          if (!isSameRecord) {
            const listed = Object.values(itemsRef.current)
              .flatMap((state) => (state.status === 'ready' ? state.items : []))
              .find((item) => item.id === id);
            setRecordTarget({ collection: message.collection, id, label: listed?.label ?? message.title ?? id });
          }
          setActiveFieldPath(message.fieldPath ?? null);
          setActiveSectionKey(RECORD_SECTION);
          return;
        }
        if (!message.sectionKey) return;
        const ownerPage = resolveSectionPage(config, activePage, message.sectionKey, message.page);
        if (!ownerPage || !availableSections.some((s) => s.key === message.sectionKey)) {
          toast.error(
            message.page && message.page !== activePage
              ? `Section '${message.sectionKey}' belongs to the page '${message.page}'. Open that page to edit it.`
              : `Section '${message.sectionKey}' is not configured for this page`
          );
          return;
        }
        if (message.sectionKey !== activeSectionRef.current && !confirmLeavingSection()) return;
        setActiveFieldPath(message.fieldPath ?? null);
        setActiveSectionKey(message.sectionKey);
        toast.success(`Selected: ${message.title || message.sectionKey} in Editor`, {
          duration: 2000,
        });
      },
      { origins, source: () => iframeRef.current?.contentWindow }
    );
  }, [origins, availableSections, confirmLeavingSection, config, activePage]);

  // Save handler for the left editor panel.
  // Errors are re-thrown so SectionEditorForm shows a single toast.
  const handleSaveSection = async (content: unknown, isPublished: boolean) => {
    if (!sectionPageDef) return;
    await adapter.saveRecord({ page: sectionPage, sectionKey: activeSectionKey, content, isPublished });

    // Update the preview immediately, then have it refetch from storage
    sendToPreview({
      type: CMS_MESSAGE.DRAFT_PREVIEW,
      page: sectionPage,
      sectionKey: activeSectionKey,
      draftContent: content,
    });
    sendToPreview({ type: CMS_MESSAGE.CONTENT_UPDATED });

    const record = await adapter.getRecord(sectionPage, activeSectionKey, { includeDrafts: true });
    setSectionDetail(getSectionDetail(sectionPageDef, activeSectionKey, record));
  };

  // Reset handler for the left editor panel.
  const handleResetSection = async () => {
    if (!sectionPageDef) return;
    await adapter.deleteRecord(sectionPage, activeSectionKey);
    sendToPreview({ type: CMS_MESSAGE.CONTENT_UPDATED });
    setSectionDetail(getSectionDetail(sectionPageDef, activeSectionKey, null));
  };

  // Real-time draft preview: sends live form edits into the preview without saving
  const handleDraftChange = (draftContent: unknown) => {
    sendToPreview({
      type: CMS_MESSAGE.DRAFT_PREVIEW,
      page: sectionPage,
      sectionKey: activeSectionKey,
      draftContent,
    });
  };

  const handleSaveRecord = async (content: unknown) => {
    if (!recordDetail || !adapter.saveItem) throw new Error('The storage adapter cannot save records (it has no saveItem).');
    const values = await adapter.saveItem(recordDetail.collection, recordDetail.id, content as Record<string, unknown>);
    setRecordDetail({ ...recordDetail, values });
    sendToPreview({ type: CMS_MESSAGE.ITEM_DRAFT, collection: recordDetail.collection, item: recordDetail.id, values: null });
    // The page reads records on the server, so load it again to show the saved values.
    setIsLoadingIframe(true);
    setIframeKey(Date.now());
  };

  const handleRecordDraft = (draft: unknown) => {
    if (!recordDetail) return;
    sendToPreview({
      type: CMS_MESSAGE.ITEM_DRAFT,
      collection: recordDetail.collection,
      item: recordDetail.id,
      values: draft as Record<string, unknown>,
    });
  };

  // ---- Style tab of a single field -------------------------------------------------------------
  const stylesEnabled = config.styles?.enabled !== false;
  const isStyleTarget = stylesEnabled && Boolean(activeFieldPath) && activeSectionKey !== RECORD_SECTION;
  const [formTab, setFormTab] = useState<'content' | 'style'>('content');
  const [styleSheet, setStyleSheet] = useState<{ page: string; sheet: StyleSheetData } | null>(null);
  const [fieldStyle, setFieldStyleDraft] = useState<FieldStyle | undefined>(undefined);
  const [isSavingStyle, setIsSavingStyle] = useState(false);
  const showStyleTab = isStyleTarget && formTab === 'style';

  const loadStyleSheet = useCallback(
    async (page: string): Promise<StyleSheetData> => {
      const record = await adapter.getRecord(page, STYLES_KEY, { includeDrafts: true });
      const sheet = record?.content && typeof record.content === 'object' ? (record.content as StyleSheetData) : {};
      setStyleSheet({ page, sheet });
      return sheet;
    },
    [adapter]
  );

  // Load the page's styles when a field opens, and show that field's saved style.
  useEffect(() => {
    if (!isStyleTarget || !activeFieldPath) return;
    let alive = true;
    loadStyleSheet(sectionPage)
      .then((sheet) => {
        if (alive) setFieldStyleDraft(sheet[activeSectionKey]?.[activeFieldPath]);
      })
      .catch(() => toast.error('Could not load the styles of this page.'));
    return () => {
      alive = false;
    };
  }, [isStyleTarget, sectionPage, activeSectionKey, activeFieldPath, loadStyleSheet]);

  useEffect(() => {
    if (!activeFieldPath) setFormTab('content');
  }, [activeFieldPath]);

  const savedFieldStyle =
    styleSheet && styleSheet.page === sectionPage && activeFieldPath ? styleSheet.sheet[activeSectionKey]?.[activeFieldPath] : undefined;

  const handleStyleChange = (style: FieldStyle) => {
    if (!activeFieldPath) return;
    setFieldStyleDraft(style);
    hasUnsavedEdits.current = true;
    sendToPreview({ type: CMS_MESSAGE.STYLE_DRAFT, page: sectionPage, sectionKey: activeSectionKey, path: activeFieldPath, style });
  };

  /** Write this field's style (or remove it with null) into the page's "_styles" record. */
  const writeFieldStyle = async (style: FieldStyle | null) => {
    if (!activeFieldPath) return;
    setIsSavingStyle(true);
    try {
      // Start from the stored record, so styles saved meanwhile for other fields are kept.
      const current = await loadStyleSheet(sectionPage);
      const next = setFieldStyle(current, activeSectionKey, activeFieldPath, style);
      if (Object.keys(next).length === 0) await adapter.deleteRecord(sectionPage, STYLES_KEY);
      else await adapter.saveRecord({ page: sectionPage, sectionKey: STYLES_KEY, content: next, isPublished: true });
      setStyleSheet({ page: sectionPage, sheet: next });
      setFieldStyleDraft(next[activeSectionKey]?.[activeFieldPath]);
      hasUnsavedEdits.current = false;
      sendToPreview({ type: CMS_MESSAGE.CONTENT_UPDATED });
      toast.success(style ? 'Styles saved and published' : 'Styles reset');
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Could not save the styles.');
    } finally {
      setIsSavingStyle(false);
    }
  };

  const fieldValue =
    activeFieldPath && sectionDetail ? getAtPath(sectionDetail.content, parseFieldPath(activeFieldPath)) : undefined;
  const isImageValue =
    typeof fieldValue === 'string' &&
    (/\.(png|jpe?g|webp|svg|gif|avif)(\?.*)?$/i.test(fieldValue) ||
      /(image|img|logo|photo|avatar|picture|src|banner|cover|thumbnail)/i.test(activeFieldPath ?? ''));

  const handleRefreshPreview = () => {
    setIsLoadingIframe(true);
    setIframeKey(Date.now());
  };

  const activeSectionDef = availableSections.find((s) => s.key === activeSectionKey);
  const currentSectionLabel = activeSectionDef?.label || activeSectionKey.replace(/([A-Z])/g, ' $1');

  if (!pageDef) {
    return (
      <div className="p-8 text-center text-sm text-slate-400 bg-slate-900/60 rounded-2xl border border-purple-500/20">
        No pages configured. Add pages to the <code className="text-purple-300">pages</code> array of your CMS config.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top control header: page, device and canvas controls */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Left: page info and page selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/25 border border-purple-500/40 text-purple-200 shrink-0">
            {React.createElement(activePageIcon, { className: 'w-3.5 h-3.5 text-purple-300' })}
            <span className="font-bold text-white max-w-[150px] truncate">{activePageTitle}</span>
            <span className="text-[10px] font-mono opacity-70 text-purple-300">({currentRoute})</span>
          </div>

          {topLevelPages(config).length > 1 && (
            <select
              value={groupPage?.key ?? activePage}
              onChange={(e) => {
                if (e.target.value) changePage(e.target.value);
              }}
              aria-label="Page to edit"
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-950 border border-purple-500/30 text-purple-200 focus:outline-none focus:border-purple-400 max-w-[200px] sm:max-w-[260px] md:max-w-[320px] truncate"
            >
              {topLevelPages(config)
                .filter((p) => !p.global)
                .map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.title} ({p.collection ? p.route.replace(/\/\[[^\]]+\].*$/, '') || '/' : p.route})
                  </option>
                ))}
              {globalPage && <option value={globalPage.key}>{globalPage.title || 'Site settings'} (every page)</option>}
            </select>
          )}

          {groupPage && recordPages.length > 0 && (
            <select
              value={pageDef?.collection && activeItem ? `${pageDef.key}::${activeItem.id}` : 'home'}
              onChange={(e) => changeRecord(e.target.value)}
              aria-label={`Page of ${groupPage.title} to edit`}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-950 border border-sky-500/40 text-sky-200 focus:outline-none focus:border-sky-400 max-w-[200px] sm:max-w-[260px] md:max-w-[320px] truncate"
            >
              {!groupPage.collection && <option value="home">{groupPage.title} home ({groupPage.route})</option>}
              {groupPage.collection && !activeItem && <option value="home">Pick a record</option>}
              {recordPages.map((rp) => {
                const state = itemsByPage[rp.key];
                const options =
                  !state || state.status === 'loading' ? (
                    <option disabled value={`${rp.key}::loading`}>Loading {rp.title}...</option>
                  ) : state.status === 'error' ? (
                    <option disabled value={`${rp.key}::error`}>{rp.title}: could not load ({state.message})</option>
                  ) : state.items.length === 0 ? (
                    <option disabled value={`${rp.key}::none`}>{rp.title}: no records yet</option>
                  ) : (
                    state.items.map((item) => (
                      <option key={item.id} value={`${rp.key}::${item.id}`}>
                        {item.label}
                      </option>
                    ))
                  );
                return recordPages.length > 1 ? (
                  <optgroup key={rp.key} label={rp.title}>
                    {options}
                  </optgroup>
                ) : (
                  <React.Fragment key={rp.key}>{options}</React.Fragment>
                );
              })}
            </select>
          )}
        </div>

        {/* Right: viewport controls + edit mode + preview actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Device viewport switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-xl shrink-0">
            {(Object.keys(DEVICE_VIEWPORTS) as DeviceMode[]).map((mode) => {
              const conf = DEVICE_VIEWPORTS[mode];
              const Icon = conf.icon;
              const isCurrent = device === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDevice(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`${conf.label} (${conf.width}px)`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{conf.label}</span>
                </button>
              );
            })}
          </div>

          {/* Edit mode toggle + reload + open live */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleEditMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border shrink-0 ${
                isEditModeActive
                  ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-900/30'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60'
              }`}
              title={
                isEditModeActive
                  ? 'Edit Mode is ON. Click to turn OFF and interact with webpage normally.'
                  : 'Edit Mode is OFF. Click to turn ON and enable section edit buttons.'
              }
            >
              {isEditModeActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0" />
                  <Pencil className="w-3 h-3 text-purple-200 shrink-0" />
                  <span>Edit Mode</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                  <Eye className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>View Mode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRefreshPreview}
              className="p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Reload live canvas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <a
              href={publicUrl(currentRoute, config.publicSiteUrl)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Live</span>
            </a>
          </div>
        </div>
      </div>

      {/* Split screen: left editor + right preview canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: section navigator + live form editor */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col space-y-3 lg:sticky lg:top-2 lg:max-h-[calc(100vh-80px)] overflow-y-auto pr-1 custom-scrollbar">
          {/* Section selection bar */}
          <div className="p-3 rounded-xl bg-slate-900/95 border border-purple-500/25 backdrop-blur-sm space-y-2.5 shadow-lg">
            <button
              type="button"
              onClick={() => setIsSectionListOpen((open) => !open)}
              aria-expanded={isSectionListOpen}
              aria-controls="cms-section-list"
              className="w-full flex items-center justify-between gap-2 text-left rounded-lg -m-1 p-1 hover:bg-slate-800/50 transition-colors"
            >
              <span className="min-w-0 flex items-center gap-1.5 text-xs">
                <span className="font-bold text-white shrink-0">Select Section to Edit:</span>
                {!isSectionListOpen && activeSection && (
                  <span className="flex items-center gap-1 min-w-0 px-2 py-0.5 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-100 font-semibold">
                    {activeSection.icon && <activeSection.icon className="w-3 h-3 shrink-0 opacity-80" />}
                    <span className="truncate">{activeSection.label}</span>
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40">
                  Page: {currentRoute}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-purple-300 transition-transform ${isSectionListOpen ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            {isSectionListOpen && (
            <>
            {/* Section switcher pills */}
            <div id="cms-section-list" className="flex flex-wrap gap-1.5">
              {[pageSections, listedGlobalSections].map((list, index) =>
                list.length === 0 ? null : (
                  <React.Fragment key={index}>
                    {index === 1 && (
                      <div className="w-full flex items-center gap-1.5 pt-1.5 mt-0.5 border-t border-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        <Globe className="w-3 h-3" />
                        <span>Site-wide: shown on every page</span>
                      </div>
                    )}
                    {list.map((sec) => {
                      const isSelected = sec.key === activeSectionKey;
                      const IconComponent = sec.icon;
                      return (
                        <button
                          key={sec.key}
                          type="button"
                          onClick={() => handleSelectSection(sec.key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50 ring-1 ring-purple-400'
                              : 'bg-slate-950/70 hover:bg-slate-800/80 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {IconComponent && <IconComponent className="w-3.5 h-3.5 opacity-80" />}
                          <span>{sec.label}</span>
                          {isSelected && <ChevronRight className="w-3 h-3 text-purple-200" />}
                        </button>
                      );
                    })}
                  </React.Fragment>
                )
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <MousePointerClick className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Selecting a section scrolls the preview on the right to it.</span>
            </div>
            </>
            )}
          </div>

          {/* Form area for the active section */}
          <div className="rounded-2xl bg-slate-900/80 border border-purple-500/20 p-3 sm:p-4 shadow-xl">
            {activeSectionKey === RECORD_SECTION && isRecordOpen ? (
              isLoadingRecord ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                  <span>Loading record...</span>
                </div>
              ) : recordDetail && recordDetail.id === recordTarget?.id && recordDetail.collection === recordTarget?.collection ? (
                <SectionEditorForm
                  mode="record"
                  page={activePage}
                  sectionKey={`${recordDetail.collection}:${recordDetail.id}`}
                  sectionLabel={recordTarget?.label}
                  pagePath={currentRoute}
                  focusPath={activeFieldPath}
                  onClearFocus={() => setActiveFieldPath(null)}
                  onDirtyChange={(dirty) => {
                    hasUnsavedEdits.current = dirty;
                  }}
                  initialData={recordDetail.values}
                  hasCustomOverride={false}
                  isPublished
                  updatedAt={null}
                  updatedBy={null}
                  onSave={handleSaveRecord}
                  onReset={async () => undefined}
                  onChangeDraft={handleRecordDraft}
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">This record could not be loaded.</div>
              )
            ) : isLoadingDetail ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                <span>Loading section form...</span>
              </div>
            ) : sectionDetail && sectionDetail.sectionKey === activeSectionKey && sectionDetail.page === sectionPage ? (
              <>
              {isStyleTarget && (
                <div role="tablist" aria-label="Field editor" className="flex items-center gap-1 p-1 mb-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  {(['content', 'style'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={formTab === tab}
                      onClick={() => setFormTab(tab)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                        formTab === tab ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
              {showStyleTab && (
                <StylePanel
                  value={fieldStyle}
                  device={device}
                  onDeviceChange={setDevice}
                  options={config.styles}
                  fonts={config.fonts}
                  isImage={isImageValue}
                  onChange={handleStyleChange}
                  onSave={() => writeFieldStyle(fieldStyle && hasFieldStyle(fieldStyle) ? fieldStyle : null)}
                  onReset={() => writeFieldStyle(null)}
                  isSaving={isSavingStyle}
                  hasSavedStyle={hasFieldStyle(savedFieldStyle)}
                />
              )}
              {/* Kept mounted while the Style tab is open, so unsaved content edits survive. */}
              <div hidden={showStyleTab}>
              <SectionEditorForm
                page={sectionPage}
                sectionKey={activeSectionKey}
                sectionLabel={activeSectionDef?.label}
                pagePath={currentRoute}
                transform={activeSectionDef?.transform}
                focusPath={activeFieldPath}
                onClearFocus={() => setActiveFieldPath(null)}
                onDirtyChange={(dirty) => {
                  hasUnsavedEdits.current = dirty;
                }}
                initialData={sectionDetail.content}
                hasCustomOverride={sectionDetail.hasCustomOverride}
                isPublished={sectionDetail.isPublished}
                updatedAt={sectionDetail.updatedAt}
                updatedBy={sectionDetail.updatedBy}
                onSave={handleSaveSection}
                onReset={handleResetSection}
                onChangeDraft={handleDraftChange}
              />
              </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Select a section to begin editing.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: live interactive preview canvas */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col space-y-3">
          {/* Canvas status banner */}
          <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/25 flex items-center justify-between gap-2 text-xs text-purple-200 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isEditModeActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="truncate">
                {isEditModeActive ? (
                  <>
                    Live Interactive Canvas: <strong className="text-white">{currentSectionLabel}</strong> is active in editor.
                  </>
                ) : (
                  <>
                    Normal Webpage Mode: Interacting normally without edit buttons. Toggle <strong>Edit Mode ON</strong> to edit.
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-300 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isEditModeActive ? 'Edit Mode ON' : 'Normal View'}</span>
            </div>
          </div>

          {/* Canvas viewport frame */}
          <div
            ref={viewportContainerRef}
            className="relative min-h-[750px] h-[calc(100vh-160px)] bg-slate-950 rounded-2xl border border-purple-500/20 shadow-2xl p-2 sm:p-4 flex flex-col items-center justify-start overflow-hidden"
          >
            {/* Dot grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Loading indicator */}
            {isLoadingIframe && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm gap-2">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <span className="text-xs text-slate-400">Loading interactive preview...</span>
              </div>
            )}

            {/* Responsive viewport wrapper */}
            {(() => {
              const targetWidth = DEVICE_VIEWPORTS[device].width;
              const availW = Math.max(containerSize.width - 24, 320);
              const availH = Math.max(containerSize.height - 24, 400);

              // Scale so the target width fits inside the available container width
              const scale = availW < targetWidth ? availW / targetWidth : 1;
              const unscaledHeight = availH / scale;

              return (
                <div
                  className="w-full h-full flex items-start justify-center overflow-hidden"
                  style={{ width: `${availW}px`, height: `${availH}px` }}
                >
                  <div
                    style={{
                      width: `${targetWidth}px`,
                      height: `${unscaledHeight}px`,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                    }}
                    className={`shrink-0 transition-all duration-200 overflow-hidden shadow-2xl border ${
                      device === 'mobile'
                        ? 'border-slate-700 bg-slate-900 rounded-[38px] p-2 ring-8 ring-slate-800'
                        : device === 'tablet'
                        ? 'border-slate-700 bg-slate-900 rounded-[28px] p-2 ring-4 ring-slate-800'
                        : 'border-slate-800 bg-white rounded-xl'
                    }`}
                  >
                    {/* Mobile notch simulation */}
                    {device === 'mobile' && (
                      <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-1 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-slate-900" />
                      </div>
                    )}

                    {isWaitingForRecord ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-xs text-slate-400 p-6 text-center">
                        Pick a record in the menu next to the page name to preview it.
                      </div>
                    ) : (
                    <iframe
                      ref={iframeRef}
                      src={iframeSrc}
                      title="Public Site Live Preview"
                      className="w-full h-full bg-white block"
                      style={{ border: 'none' }}
                      onLoad={() => setIsLoadingIframe(false)}
                    />
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
