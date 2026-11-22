import React from 'react';
import { C as CmsConfig } from './types-DTr7JArh.mjs';

interface CmsStudioProps {
    config: CmsConfig;
    /** Page key opened first. Defaults to the first configured page. */
    initialPage?: string;
    /** Called when the editor switches page (e.g. to sync a ?page= query string). */
    onPageChange?: (page: string) => void;
    /** Render the toast container. Set to false if your app already renders react-hot-toast's <Toaster />. */
    toaster?: boolean;
}
/**
 * The complete CMS admin screen: page switcher, live preview canvas with
 * hover-to-edit, and the section form editor. Render it on a protected admin route.
 */
declare const CmsStudio: React.FC<CmsStudioProps>;

interface CmsNavButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Route where <CmsStudio /> is rendered, e.g. "/admin/cms". */
    href: string;
    /** Highlight the button (e.g. when the current path is the studio). */
    active?: boolean;
    label?: string;
    /**
     * Link component to render with, e.g. Next.js `Link` or React Router's `Link`,
     * so navigation stays client-side. Defaults to a plain <a>.
     */
    as?: React.ElementType;
}
/** Ready-made "CMS" menu entry for an admin sidebar or navbar. */
declare const CmsNavButton: React.FC<CmsNavButtonProps>;

/**
 * Universal dynamic Lucide icon resolver
 * Safely resolves any icon name string to a Lucide React component with fallback.
 */
declare function getDynamicIcon(iconName?: string, fallback?: React.ComponentType<{
    className?: string;
}>): React.ComponentType<{
    className?: string;
}>;
/**
 * Popular icons catalog for the visual icon picker
 */
declare const POPULAR_ICONS: {
    name: string;
    category: string;
}[];

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

/** Only same-site paths ("/admin"), never "//evil.com" or "https://evil.com". */
declare function safeNext(value: string | null | undefined): string | null;
interface CmsLoginProps {
    auth: CmsAuth;
    title?: string;
    /** Called after a successful sign-in. Default: go to ?next=... or `redirectTo`. */
    onSuccess?: (user: CmsUser) => void;
    /** Where to go after signing in when there is no ?next=. Default: "/". */
    redirectTo?: string;
}
/** Username + password form that signs the editor in with `cmsAuth`. */
declare const CmsLogin: React.FC<CmsLoginProps>;
interface CmsAuthGateProps {
    auth: CmsAuth;
    /**
     * Send signed-out visitors to this page (for example "/admin/login") and back afterwards.
     * Without it the sign-in form is shown in place. The gate never hides the login page itself.
     */
    loginPath?: string;
    title?: string;
    children: React.ReactNode;
}
/**
 * Shows its children only to a signed-in editor. Wrap the CMS screen, or a whole admin
 * layout. This guards the screen, not your own API: protect those endpoints on the server.
 */
declare const CmsAuthGate: React.FC<CmsAuthGateProps>;
interface CmsLogoutButtonProps {
    auth: CmsAuth;
    /** Where to go after signing out. Default: "/". */
    redirectTo?: string;
    className?: string;
    children?: React.ReactNode;
}
/** Signs the editor out (forgets the token) and leaves the admin. */
declare const CmsLogoutButton: React.FC<CmsLogoutButtonProps>;

export { CmsAuthGate, type CmsAuthGateProps, CmsLogin, type CmsLoginProps, CmsLogoutButton, type CmsLogoutButtonProps, CmsNavButton, type CmsNavButtonProps, CmsStudio, type CmsStudioProps, POPULAR_ICONS, getDynamicIcon, safeNext };
