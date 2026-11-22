import { C as CmsStorageAdapter, S as SectionRecord } from './types-C5pvdvMZ.mjs';
import 'react';

interface RestAdapterOptions {
    /** Base URL of the CMS API, e.g. "/api/cms" or "https://api.example.com/cms". */
    baseUrl: string;
    /** Extra request headers (for example an Authorization header), or a function returning them. */
    headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
    /** Fetch credentials mode. Defaults to "same-origin" so session cookies are sent. */
    credentials?: RequestCredentials;
    /** Set to false when the server does not implement the /media endpoints. */
    media?: boolean;
    /** Custom fetch implementation (tests, polyfills). */
    fetch?: typeof fetch;
}
/** Error thrown for non-2xx responses; carries the HTTP status. */
declare class CmsRequestError extends Error {
    readonly status: number;
    constructor(message: string, status: number);
}
/**
 * Adapter that talks to a CMS HTTP API. The contract (implemented by
 * `createCmsRouteHandler` and documented in the README):
 *
 *   GET    {base}/records?page=&drafts=1     -> SectionRecord[]
 *   GET    {base}/records/:page/:section     -> SectionRecord, or null when never edited
 *   PUT    {base}/records/:page/:section     body { content, isPublished } -> SectionRecord
 *   DELETE {base}/records/:page/:section     -> 204
 *   GET    {base}/media                      -> MediaItem[]
 *   POST   {base}/media                      multipart "files" -> { items: MediaItem[] }
 *   GET    {base}/collections/:c/items       -> CollectionItemSummary[]
 *   GET    {base}/collections/:c/items/:id   -> the record's editable values (404 when missing)
 *   PUT    {base}/collections/:c/items/:id   body { values } -> the record's values after saving
 */
declare function restAdapter(options: RestAdapterOptions): CmsStorageAdapter;

interface DjangoAdapterOptions extends Omit<RestAdapterOptions, 'headers'> {
    /** Extra headers, e.g. an Authorization header if your AUTHORIZE check uses tokens. */
    headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
}
/**
 * Adapter for the `django-storio-elements-editor` package. Same API as `restAdapter`, plus
 * Django's CSRF handling: it fetches a token from `{baseUrl}/csrf`, sends it as
 * `X-CSRFToken` on writes, and refreshes it once if Django rejects it.
 *
 * Cookies are sent with every request (`credentials: "include"` by default) so
 * Django's session login identifies the editor, even on another domain.
 */
declare function djangoAdapter(options: DjangoAdapterOptions): CmsStorageAdapter;

/**
 * Token login for the django-storio-elements-editor API: lets editors sign in from your own React admin
 * (username + password) instead of Django's login page.
 *
 *   export const cmsLogin = cmsAuth({ baseUrl: 'https://api.example.com/api/cms' });
 *   djangoAdapter({ baseUrl, headers: cmsLogin.headers })
 *
 * The token is kept in localStorage (or the `storage` you pass) and sent as
 * `Authorization: Bearer <token>`. It expires on the server; `logout()` forgets it.
 */
interface CmsUser {
    username: string;
    name: string;
}
interface CmsAuthOptions {
    /** Base URL of the django-storio-elements-editor API, the same as the one given to djangoAdapter. */
    baseUrl: string;
    /** Key under which the token is stored. Default: "visual-cms-token". */
    storageKey?: string;
    /**
     * Where to keep the token:
     * - "local" (default): stays until it expires or the editor signs out, even after the browser closes
     * - "session": forgotten when the tab or browser closes (the editor signs in again next time)
     * - "memory" (or `null`): forgotten on every page reload
     * or your own object with getItem/setItem/removeItem.
     */
    storage?: 'local' | 'session' | 'memory' | Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
    fetch?: typeof fetch;
}
interface CmsAuth {
    /** Sign in. Stores the token. Throws CmsAuthError (wrong password, locked out, not an editor...). */
    login(username: string, password: string): Promise<CmsUser>;
    /** Forget the token. */
    logout(): void;
    /** The stored token, or null when there is none or it has expired. */
    getToken(): string | null;
    /**
     * Ask the server whether the stored token may edit. Returns the user, or null when there is
     * no token or the server rejects it (a rejected token is forgotten). A Django session cookie
     * never counts here: editors must sign in through the form. Throws when the server cannot be reached.
     */
    check(): Promise<CmsUser | null>;
    /** Headers to send with every CMS request: pass this to djangoAdapter({ headers }). */
    headers(): Record<string, string>;
}
declare class CmsAuthError extends Error {
    status: number;
    constructor(message: string, status: number);
}
declare function cmsAuth(options: CmsAuthOptions): CmsAuth;

/**
 * Keeps records in memory. Useful for demos, tests and as a reference for
 * writing your own adapter. Content is lost when the process or tab reloads.
 */
declare function memoryAdapter(initial?: SectionRecord[]): CmsStorageAdapter & {
    dump(): SectionRecord[];
};

export { type CmsAuth, CmsAuthError, type CmsAuthOptions, CmsRequestError, type CmsUser, type DjangoAdapterOptions, type RestAdapterOptions, cmsAuth, djangoAdapter, memoryAdapter, restAdapter };
