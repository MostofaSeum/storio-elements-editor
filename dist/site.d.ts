import React from 'react';
import { C as CmsConfig, I as IconComponent } from './types-DLNWxJXK.js';

interface CmsProviderProps {
    config: CmsConfig;
    /**
     * Content already loaded on the server (e.g. with `getPageContent` from
     * "@brainicon/storio-elements-editor/next"), keyed by page key. Avoids a flash of default content.
     */
    initialContent?: Record<string, Record<string, unknown>>;
    children: React.ReactNode;
}
/** Makes the CMS configuration available to `usePageContent` and `CmsSection`. */
declare const CmsProvider: React.FC<CmsProviderProps>;
/** The CMS configuration passed to the nearest CmsProvider. */
declare function useCmsConfig(): CmsConfig;
/**
 * Live content for a page: defaults overlaid by published overrides. Inside the
 * studio preview it also applies unsaved edits as you type and refetches after a save.
 */
declare function usePageContent<T = Record<string, any>>(pageKey: string, options?: {
    /** Content loaded on the server for this page (e.g. with `getPageContent`). */
    initialData?: T;
}): T;
/**
 * Live content of the global page (the one with `global: true`): header, footer, contact details,
 * SEO defaults, theme. Works on every page, and follows the editor's typing in the studio preview.
 */
declare function useSiteContent<T = Record<string, any>>(options?: {
    initialData?: T;
}): T;

interface CmsThemeStyleProps {
    /** Section of the global page that holds the theme. Default: "theme". */
    section?: string;
    /** Start of every variable name. Default: "--", so primaryColor becomes --primary-color. */
    prefix?: string;
    /** Where the variables apply. Default: ":root". */
    selector?: string;
}
/**
 * Writes the theme section of the global page as CSS variables, for example
 * `:root{--primary-color:#7c3aed;--heading-font:Inter;}`. Put it once in the root layout, inside
 * <CmsProvider>, and use the variables in your CSS. Colour changes show in the studio preview as
 * the editor picks them.
 */
declare const CmsThemeStyle: React.FC<CmsThemeStyleProps>;

interface CmsSectionProps {
    sectionKey: string;
    title: string;
    /**
     * Page this section's content belongs to. Set it to the key of your global page for
     * site-wide parts such as the navbar or footer, so they can be edited from every page.
     * Default: the page open in the studio (a global section is still found without it).
     */
    page?: string;
    /**
     * Optional pathname (for example "/") that this section belongs to.
     * Shared components such as a navbar render on every page, so without this
     * guard their edit button would appear on pages that do not own the section.
     */
    activeOnPath?: string;
    /**
     * Where the floating edit button sits. Use "fixed" for sticky headers and
     * banners whose own box is too small to hold the button.
     */
    buttonPlacement?: 'inside' | 'inside-low' | 'fixed';
    children: React.ReactNode;
}
/**
 * CmsSection
 *
 * In normal visitor mode: renders children directly with zero overhead.
 * In CMS edit mode (?cms_edit_mode=1 inside the studio preview):
 *  - Adds an outline and a floating edit button on hover.
 *  - Listens for SCROLL_TO_SECTION from the studio to centre and pulse the section.
 *  - Clicking anywhere on the section tells the studio to open this section's form.
 *
 * The button is rendered on document.body and only while its section is the innermost one
 * under the mouse, so sticky headers, nested sections and overlapping page content can
 * neither cover it nor catch its clicks.
 */
declare const CmsSection: React.FC<CmsSectionProps>;

interface CmsFieldProps {
    /**
     * Where the value lives, in dot form: "title", "image", "items.0.title". Inside a section it is
     * a path in the section's content; with `collection` it is a field of the record. It can also
     * point to a whole object or list ("items.0").
     */
    path: string;
    /** Name shown on the pencil button. Default: made from the path. */
    label?: string;
    /**
     * Edit a field of a collection record (a blog post, a product...) instead of section content.
     * Use the collection key of the page, e.g. "blog", together with `item`.
     */
    collection?: string;
    /** The record's id, the same id your collection handler's `get` and `save` receive. */
    item?: string | number;
    /**
     * Edit a value of another section than the surrounding one, or a value shown outside any
     * <CmsSection>: for example the site phone number from the global page inside the contact page.
     * Use with `page` (the global page's key) when the section is not on the open page.
     */
    section?: string;
    /** Page of `section`. Default: the surrounding section's page, else the open page. */
    page?: string;
    children: React.ReactNode;
}
/**
 * CmsField
 *
 * Gives one value its own pencil, so an editor can change just the title, the image or the icon.
 * Place it inside a <CmsSection> for page content, or give it `collection` and `item` to edit a
 * field of a database record (a blog post, a product) on a [slug] or [id] page.
 *
 * Visitors get the children only, with no extra element. In the studio preview the wrapper uses
 * `display: contents`, so it does not affect the page layout.
 */
declare const CmsField: React.FC<CmsFieldProps>;

interface CmsIconProps {
    /** Icon name saved in the content, a key of `icons` in your CMS config. */
    name: string | undefined;
    /** Drawn when the name is not in `icons`. Default: nothing. */
    fallback?: IconComponent;
    className?: string;
    [prop: string]: unknown;
}
/**
 * Draws an editable icon by name from the `icons` map of your CMS config, the same list
 * the icon picker offers, so an icon picked in the editor always shows on the site.
 */
declare const CmsIcon: React.FC<CmsIconProps>;

/**
 * A collection record as the page should show it: the values you loaded (from your database
 * or API), with the editor's unsaved changes laid over them while the studio preview is open.
 * Visitors always get `values` unchanged.
 *
 *   const post = useCollectionItem('blog', props.post.slug, props.post);
 */
declare function useCollectionItem<T extends Record<string, unknown>>(collection: string, item: string | number, values: T): T;

/** True when the current page is rendered inside the studio's preview iframe. */
declare function isCmsPreview(): boolean;
/**
 * Whether hover-to-edit is on. Starts from the `cms_edit_mode` URL flag and then
 * follows the studio's Edit/View toggle (SET_CMS_EDIT_MODE messages).
 */
declare function useCmsEditMode(origins: string[]): boolean;

export { CmsField, type CmsFieldProps, CmsIcon, type CmsIconProps, CmsProvider, type CmsProviderProps, CmsSection, type CmsSectionProps, CmsThemeStyle, type CmsThemeStyleProps, isCmsPreview, useCmsConfig, useCmsEditMode, useCollectionItem, usePageContent, useSiteContent };
