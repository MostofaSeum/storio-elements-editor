import { d as CollectionItemSummary, C as CmsStorageAdapter, a as CmsConfig } from './types-C5pvdvMZ.mjs';
import { Metadata } from 'next';
import 'react';

/**
 * Loads and saves the records of one collection (blog posts, products...) with your own code,
 * for pages with a [slug] or [id] route. Every call is made only for authorised editors.
 */
interface CmsCollectionHandler {
    /** Every record the studio may open: id, a name for the menu, and route params if needed. */
    list(request: Request): CollectionItemSummary[] | Promise<CollectionItemSummary[]>;
    /**
     * The editable values of one record, e.g. { title, summary, cover }, or null when it does not
     * exist. Only the keys returned here can be saved, and each keeps its type.
     */
    get(id: string, request: Request): Record<string, unknown> | null | undefined | Promise<Record<string, unknown> | null | undefined>;
    /**
     * Save the changed values (a subset of what `get` returned). Refresh any cache your pages use
     * here, e.g. revalidateTag("blog"). Return the saved values, or nothing to have `get` called again.
     */
    save(id: string, values: Record<string, unknown>, request: Request): void | Record<string, unknown> | Promise<void | Record<string, unknown>>;
}
interface CmsRouteHandlerOptions {
    /** Server-side storage, e.g. `fileStorage()` or your own database adapter. */
    storage: CmsStorageAdapter;
    /**
     * Return true when the request comes from a CMS editor (check your session or
     * token here). Required: writes, drafts and the media library are refused otherwise.
     */
    authorize: (request: Request) => boolean | Promise<boolean>;
    /** Name stored as "updated by" on saved records. */
    getUserName?: (request: Request) => string | null | Promise<string | null>;
    /** Restrict storage to these page keys (recommended: your config's page keys). */
    allowedPages?: string[];
    /** Largest accepted JSON body in bytes. Defaults to 1 MB. */
    maxBodyBytes?: number;
    /** Collections whose records the studio can edit, by the key used in a page's `collection`. */
    collections?: Record<string, CmsCollectionHandler>;
}
type Handler = (request: Request) => Promise<Response>;
/**
 * Next.js App Router handler implementing the CMS REST contract used by
 * `restAdapter`. Mount it on a catch-all route:
 *
 *   // app/api/cms/[...path]/route.ts
 *   export const { GET, PUT, DELETE, POST } = createCmsRouteHandler({ storage, authorize });
 *
 * It only uses the standard Request/Response API, so it also works in any
 * framework that speaks Fetch (Remix, Hono, Bun, Deno).
 */
declare function createCmsRouteHandler(options: CmsRouteHandlerOptions): {
    GET: Handler;
    PUT: Handler;
    DELETE: Handler;
    POST: Handler;
};

interface FileStorageOptions {
    /** Folder for the content file. Defaults to ".cms" in the working directory. */
    dir?: string;
    /** Folder uploads are written to. Defaults to "public/cms-uploads" so Next.js serves them. */
    mediaDir?: string;
    /** Public URL prefix of `mediaDir`. Defaults to "/cms-uploads". */
    mediaUrlPrefix?: string;
    /** Largest accepted upload in bytes. Defaults to 5 MB. */
    maxUploadBytes?: number;
}
/**
 * Stores content in a JSON file and uploads in a public folder. Good for local
 * development and single-server (VPS/Docker) deployments. It does not work on
 * read-only or multi-instance hosts such as Vercel: use a database adapter there.
 */
declare function fileStorage(options?: FileStorageOptions): CmsStorageAdapter;

/** Shape of the optional "seo" section a page can define in its defaults. */
interface PageSeoConfig {
    title?: string;
    description?: string;
    keywords?: string | string[];
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: 'summary' | 'summary_large_image';
    /** e.g. "index, follow" or "noindex, nofollow". */
    robots?: string;
}
/** Shape of the optional "seo" section of the global page: site-wide defaults. */
interface SiteSeoConfig extends PageSeoConfig {
    /** Site name, e.g. "Brainicon". Used for og:site_name and as the title when a page has none. */
    siteName?: string;
    /** Title of every page, with %s for the page title, e.g. "%s | Brainicon". */
    titleTemplate?: string;
    /** Favicon URL, e.g. "/favicon.ico". */
    favicon?: string;
}
/**
 * Load a page's published content on the server (Server Components,
 * generateMetadata, getServerSideProps). Falls back to the page defaults when
 * storage is unreachable, so a storage outage never breaks rendering.
 */
declare function getPageContent<T = Record<string, unknown>>(config: Pick<CmsConfig, 'pages'>, pageKey: string, options: {
    storage: CmsStorageAdapter;
    includeDrafts?: boolean;
}): Promise<T>;
/**
 * Load the published content of every page in the config, keyed by page key, ready
 * for `<CmsProvider initialContent={...}>`. With it, the server-rendered HTML already
 * contains the edited text (good for SEO, no flash of default content). Pages whose
 * storage cannot be reached fall back to their defaults.
 */
declare function getAllPageContent(config: Pick<CmsConfig, 'pages'>, options: {
    storage: CmsStorageAdapter;
}): Promise<Record<string, Record<string, unknown>>>;
/** Build Next.js metadata from a page's editable "seo" section, on top of a fallback. */
declare function buildPageMetadata(content: {
    seo?: PageSeoConfig;
} | Record<string, unknown>, fallback?: Metadata): Metadata;
/**
 * Build the site-wide metadata for the root layout from the global page's "seo" section:
 * a title template, the default description and share image, og:site_name and the favicon.
 */
declare function buildSiteMetadata(seo: SiteSeoConfig | undefined, fallback?: Metadata): Metadata;
/**
 * For `generateMetadata` in the root layout: the site-wide metadata from the global page
 * (the page with `global: true`). Without a global page it returns `fallback`.
 */
declare function getSiteMetadata(config: Pick<CmsConfig, 'pages'>, options: {
    storage: CmsStorageAdapter;
    fallback?: Metadata;
    section?: string;
}): Promise<Metadata>;
/**
 * Convenience for `generateMetadata`: load the page and build its metadata. When the config has
 * a global page, its "seo" section fills what the page leaves empty (description, share image),
 * so a page without SEO of its own still gets the site defaults. Pass `site: false` to skip that.
 */
declare function getPageMetadata(config: Pick<CmsConfig, 'pages'>, pageKey: string, options: {
    storage: CmsStorageAdapter;
    fallback?: Metadata;
    site?: boolean;
}): Promise<Metadata>;

/**
 * True when a request is the studio's preview iframe loading a public page.
 * Use it in middleware so redirects (login walls, admin-host redirects, locale
 * redirects) let the preview through:
 *
 *   if (!isCmsPreviewRequest(request, { studioPath: '/admin/cms' })) { ...redirect... }
 *
 * This only decides whether to skip a redirect; it grants no access, since the
 * page shown is the same public page any visitor can load.
 */
declare function isCmsPreviewRequest(request: {
    url: string;
    headers: Headers;
}, options?: {
    studioPath?: string;
}): boolean;

export { type CmsCollectionHandler, type CmsRouteHandlerOptions, type FileStorageOptions, type PageSeoConfig, type SiteSeoConfig, buildPageMetadata, buildSiteMetadata, createCmsRouteHandler, fileStorage, getAllPageContent, getPageContent, getPageMetadata, getSiteMetadata, isCmsPreviewRequest };
