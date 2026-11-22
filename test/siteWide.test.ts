import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { defineCms, findGlobalPage, resolveSectionPage } from '../src/core/defineCms';
import { isColorField, isFontField, themeToCss, themeToCssVariables } from '../src/core/theme';
import { memoryAdapter } from '../src/adapters/memory';
import { buildSiteMetadata, getPageMetadata, getSiteMetadata } from '../src/next/getPageContent';
import { CmsProvider, useSiteContent } from '../src/site/CmsProvider';
import { CmsThemeStyle } from '../src/site/CmsThemeStyle';
import { CmsStudio } from '../src/admin/CmsStudio';
import type { PageDef } from '../src/core/types';

const sitePage: PageDef = {
  key: 'site',
  title: 'Site settings',
  route: '/',
  global: true,
  sections: [
    { key: 'header', label: 'Header' },
    { key: 'seo', label: 'SEO defaults' },
    { key: 'theme', label: 'Theme' },
  ],
  defaults: {
    header: { logoText: 'Acme', links: [{ label: 'Home', href: '/' }] },
    seo: { siteName: 'Acme', titleTemplate: '%s | Acme', description: 'Acme makes things', ogImage: '/og.png', favicon: '/favicon.ico' },
    theme: { primaryColor: '#7c3aed', headingFont: 'Inter' },
  },
};

const pages: PageDef[] = [
  { key: 'home', title: 'Home', route: '/', sections: [{ key: 'hero', label: 'Hero' }], defaults: { hero: { title: 'Hi' } } },
  { key: 'about', title: 'About', route: '/about', sections: [{ key: 'seo', label: 'SEO' }], defaults: { seo: { title: 'About us' } } },
];

describe('global page validation', () => {
  it('accepts one global page and finds it', () => {
    const config = defineCms({ adapter: memoryAdapter(), pages: [...pages.slice(0, 1), sitePage] });
    expect(findGlobalPage(config)?.key).toBe('site');
  });

  it('rejects two global pages', () => {
    expect(() =>
      defineCms({ adapter: memoryAdapter(), pages: [sitePage, { ...sitePage, key: 'site2', sections: [], defaults: {} }] })
    ).toThrow(/Only one page may have global: true/);
  });

  it('rejects a global page with a collection', () => {
    expect(() => defineCms({ adapter: memoryAdapter(), pages: [{ ...sitePage, collection: 'posts' }] })).toThrow(/cannot have a collection/);
  });

  it('allows listOnEveryPage only on the global page', () => {
    expect(() => defineCms({ adapter: memoryAdapter(), pages: [{ ...sitePage, listOnEveryPage: false }] })).not.toThrow();
    expect(() => defineCms({ adapter: memoryAdapter(), pages: [{ ...pages[0], listOnEveryPage: false }] })).toThrow(
      /only applies to the page with global: true/
    );
  });

  it('rejects a page section key that is also a global section key', () => {
    expect(() => defineCms({ adapter: memoryAdapter(), pages: [...pages, sitePage] })).toThrow(/Section "seo" is on page "about"/);
  });
});

describe('resolveSectionPage', () => {
  const config = defineCms({ adapter: memoryAdapter(), pages: [pages[0], sitePage] });
  it('prefers the open page, then the global page', () => {
    expect(resolveSectionPage(config, 'home', 'hero')).toBe('home');
    expect(resolveSectionPage(config, 'home', 'header')).toBe('site');
    expect(resolveSectionPage(config, 'home', 'nope')).toBeUndefined();
  });
  it('honours the page named by the click', () => {
    expect(resolveSectionPage(config, 'home', 'header', 'site')).toBe('site');
    expect(resolveSectionPage(config, 'home', 'hero', 'site')).toBeUndefined();
  });
});

describe('theme', () => {
  it('turns a theme section into CSS variables', () => {
    expect(themeToCssVariables({ primaryColor: '#7c3aed', colors: { brand_accent: '#fff' }, radius: 8 })).toEqual({
      '--primary-color': '#7c3aed',
      '--colors-brand-accent': '#fff',
      '--radius': '8',
    });
    expect(themeToCss({ primaryColor: '#000' })).toBe(':root{--primary-color:#000;}');
    expect(themeToCss({}, {})).toBe('');
  });

  it('skips values that could break out of the style block', () => {
    expect(themeToCss({ a: 'red;} body{display:none', b: '</style><script>', c: 'blue' })).toBe(':root{--c:blue;}');
  });

  it('detects colour and font fields', () => {
    expect(isColorField('primaryColor', '#7c3aed')).toBe(true);
    expect(isColorField('background', '#abc')).toBe(true);
    expect(isColorField('accentColour', '')).toBe(true);
    expect(isColorField('title', 'Hello #1')).toBe(false);
    expect(isColorField('textColor', 'red')).toBe(false);
    expect(isFontField('headingFont', 'Inter', ['Inter', 'Lora'])).toBe(true);
    expect(isFontField('headingFont', 'Inter', undefined)).toBe(false);
  });
});

describe('site metadata', () => {
  it('builds a title template, site name, share image and favicon', () => {
    const meta = buildSiteMetadata(sitePage.defaults.seo as never);
    expect(meta.title).toEqual({ default: 'Acme', template: '%s | Acme' });
    expect(meta.description).toBe('Acme makes things');
    expect(meta.openGraph).toMatchObject({ siteName: 'Acme', images: [{ url: '/og.png' }] });
    expect(meta.icons).toEqual({ icon: '/favicon.ico' });
  });

  it('getSiteMetadata reads saved site SEO', async () => {
    const storage = memoryAdapter();
    const config = defineCms({ adapter: storage, pages: [pages[0], sitePage] });
    await storage.saveRecord({ page: 'site', sectionKey: 'seo', content: { siteName: 'Beta', titleTemplate: '%s - Beta' }, isPublished: true });
    const meta = await getSiteMetadata(config, { storage });
    expect(meta.title).toEqual({ default: 'Beta', template: '%s - Beta' });
  });

  it('a page without SEO inherits the site description and image, but not its title', async () => {
    const storage = memoryAdapter();
    const pageWithSeo: PageDef = { ...pages[1], sections: [{ key: 'pageSeo', label: 'SEO' }], defaults: {} };
    const config = defineCms({ adapter: storage, pages: [pages[0], pageWithSeo, sitePage] });
    const meta = await getPageMetadata(config, 'home', { storage });
    expect(meta.title).toBeUndefined();
    expect(meta.description).toBe('Acme makes things');
    expect(meta.openGraph).toMatchObject({ images: [{ url: '/og.png' }] });
    const own = await getPageMetadata(config, 'home', { storage, site: false });
    expect(own.description).toBeUndefined();
  });
});

describe('site components', () => {
  const config = defineCms({ adapter: memoryAdapter(), pages: [pages[0], sitePage], fonts: ['Inter'] });

  it('useSiteContent and CmsThemeStyle render site defaults on the server', () => {
    const Header = () => React.createElement('span', null, useSiteContent<{ header: { logoText: string } }>().header.logoText);
    const html = renderToStaticMarkup(
      React.createElement(CmsProvider, { config }, React.createElement(CmsThemeStyle), React.createElement(Header))
    );
    expect(html).toContain('--primary-color:#7c3aed;');
    expect(html).toContain('--heading-font:Inter;');
    expect(html).toContain('Acme');
  });

  it('useSiteContent explains a missing global page', () => {
    const noGlobal = defineCms({ adapter: memoryAdapter(), pages: [pages[0]] });
    const Bad = () => React.createElement('span', null, String(useSiteContent()));
    expect(() => renderToStaticMarkup(React.createElement(CmsProvider, { config: noGlobal }, React.createElement(Bad)))).toThrow(
      /global: true/
    );
  });

  it('the studio lists the global page as site settings', () => {
    const html = renderToStaticMarkup(React.createElement(CmsStudio, { config, toaster: false }));
    expect(html).toContain('Site settings (every page)');
  });
});
