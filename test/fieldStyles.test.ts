import { describe, expect, it } from 'vitest';
import { defineCms } from '../src/core/defineCms';
import { memoryAdapter } from '../src/adapters/memory';
import {
  STYLES_KEY,
  fieldStyleToCss,
  hasFieldStyle,
  resolveFieldPage,
  sanitizeStyleProps,
  setFieldStyle,
  styleId,
} from '../src/core/styles';
import type { PageDef } from '../src/core/types';

const SEL = '[data-cms-style="home:hero:title"][data-cms-style="home:hero:title"]';

const pages: PageDef[] = [
  { key: 'home', title: 'Home', route: '/', sections: [{ key: 'hero', label: 'Hero' }, { key: 'cta', label: 'CTA' }], defaults: {} },
  { key: 'about', title: 'About', route: '/about', sections: [{ key: 'hero', label: 'Hero' }], defaults: {} },
  { key: 'post', title: 'Post', route: '/blog/[slug]', collection: 'blog', sections: [{ key: 'extras', label: 'Extras' }], defaults: {} },
  { key: 'site', title: 'Site', route: '/', global: true, sections: [{ key: 'header', label: 'Header' }], defaults: {} },
];

describe('style model', () => {
  it('builds ids and the reserved key', () => {
    expect(STYLES_KEY).toBe('_styles');
    expect(styleId('home', 'hero', 'items.0.title')).toBe('home:hero:items.0.title');
  });

  it('writes desktop rules and only the media blocks that have values', () => {
    const css = fieldStyleToCss('home:hero:title', { desktop: { color: 'red', marginTop: '8px' }, phone: { fontSize: '2rem' } });
    expect(css).toContain(`${SEL}{color:red;margin-top:8px;}`);
    expect(css).toContain(`@media (max-width:767.98px){${SEL}{font-size:2rem;}}`);
    expect(css).not.toContain('1023.98px');
  });

  it('puts a phone-only value inside the phone media query only', () => {
    const css = fieldStyleToCss('home:hero:title', { phone: { color: 'blue' } });
    expect(css).toBe(`@media (max-width:767.98px){${SEL}{color:blue;}}`);
  });

  it('uses custom breakpoints', () => {
    const css = fieldStyleToCss('home:hero:title', { tablet: { color: 'red' } }, { breakpoints: { tablet: 900 } });
    expect(css).toContain('@media (max-width:899.98px)');
  });

  it('drops values that could break out of the stylesheet, and unknown properties', () => {
    expect(sanitizeStyleProps({ color: 'red;} body{display:none', fontSize: '2rem', position: 'fixed', width: '</style>' })).toEqual({ fontSize: '2rem' });
    expect(fieldStyleToCss('home:hero:title', { desktop: { color: 'red;}' } })).toBe('');
  });

  it('adds border-style with a border width, and inline-block for a styled wrapper', () => {
    expect(fieldStyleToCss('home:hero:title', { desktop: { borderWidth: '2px' } })).toContain('border-width:2px;border-style:solid;');
    expect(fieldStyleToCss('home:hero:title', { desktop: { width: '50%' } }, { wrapper: true })).toContain('display:inline-block;');
    expect(fieldStyleToCss('home:hero:title', { desktop: { color: 'red' } }, { wrapper: true })).not.toContain('inline-block');
  });

  it('escapes quotes in the id', () => {
    expect(fieldStyleToCss('a:b:c"d', { desktop: { color: 'red' } })).toContain('[data-cms-style="a:b:c\\"d"]');
  });

  it('tells whether a field has any style', () => {
    expect(hasFieldStyle(undefined)).toBe(false);
    expect(hasFieldStyle({ desktop: {} })).toBe(false);
    expect(hasFieldStyle({ phone: { color: 'red' } })).toBe(true);
  });

  it('sets one field and keeps the others', () => {
    let sheet = setFieldStyle(undefined, 'hero', 'title', { desktop: { color: 'red' } });
    sheet = setFieldStyle(sheet, 'hero', 'subtitle', { desktop: { color: 'blue' } });
    sheet = setFieldStyle(sheet, 'cta', 'label', { phone: { fontSize: '1rem' } });
    expect(Object.keys(sheet.hero)).toEqual(['title', 'subtitle']);
    sheet = setFieldStyle(sheet, 'cta', 'label', null);
    expect(sheet.cta).toBeUndefined();
    expect(sheet.hero.title.desktop?.color).toBe('red');
  });
});

describe('resolveFieldPage', () => {
  const config = defineCms({ adapter: memoryAdapter(), pages });
  it('prefers the explicit page', () => {
    expect(resolveFieldPage(config, 'hero', 'about')).toBe('about');
  });
  it('uses the only page that has the section, global page included', () => {
    expect(resolveFieldPage(config, 'cta')).toBe('home');
    expect(resolveFieldPage(config, 'header')).toBe('site');
  });
  it('matches the URL when the key repeats, including bracket routes', () => {
    expect(resolveFieldPage(config, 'hero', undefined, '/about')).toBe('about');
    expect(resolveFieldPage(config, 'hero', undefined, '/')).toBe('home');
    expect(resolveFieldPage(config, 'hero')).toBeUndefined();
    expect(resolveFieldPage(config, 'extras', undefined, '/blog/school')).toBe('post');
  });
});

describe('reserved key', () => {
  it('defineCms rejects a section named _styles', () => {
    expect(() =>
      defineCms({ adapter: memoryAdapter(), pages: [{ key: 'home', title: 'H', route: '/', sections: [{ key: '_styles', label: 'x' }], defaults: {} }] })
    ).toThrow(/reserved/);
  });
});

describe('site rendering of field styles', async () => {
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { CmsProvider } = await import('../src/site/CmsProvider');
  const { CmsSection } = await import('../src/site/CmsSection');
  const { CmsField } = await import('../src/site/CmsField');
  const config = defineCms({ adapter: memoryAdapter(), pages, styles: { breakpoints: { phone: 600 } } });
  const styled = { home: { _styles: { hero: { title: { desktop: { color: 'red' } }, logo: { desktop: { width: '40px' } } } } } };
  const Logo = () => React.createElement('b', null, 'logo');
  const render = (child: React.ReactNode, path = 'title', initialContent: Record<string, Record<string, unknown>> = styled, page: string | null = 'home') =>
    renderToStaticMarkup(
      React.createElement(CmsProvider, { config, initialContent },
        React.createElement(CmsSection, { sectionKey: 'hero', title: 'Hero', page: page ?? undefined }, React.createElement(CmsField, { path }, child)))
    );

  it('marks a plain element and writes its rule before it', () => {
    const html = render(React.createElement('h1', null, 'Hi'));
    expect(html).toContain('<h1 data-cms-style="home:hero:title">Hi</h1>');
    expect(html).toMatch(/<style data-cms-style-for="home:hero:title">\[data-cms-style="home:hero:title"\]\[data-cms-style="home:hero:title"\]\{color:red;\}<\/style><h1/);
  });

  it('wraps text in a span', () => {
    expect(render('Hi')).toContain('<span data-cms-style="home:hero:title">Hi</span>');
  });

  it('wraps a custom component, with inline-block for a box value', () => {
    const html = render(React.createElement(Logo), 'logo');
    expect(html).toContain('<span data-cms-style="home:hero:logo"><b>logo</b></span>');
    expect(html).toContain('width:40px;display:inline-block;');
  });

  it('leaves the markup untouched without a style', () => {
    expect(render(React.createElement('h1', null, 'Hi'), 'title', { home: {} })).toBe('<h1>Hi</h1>');
  });

  it('does not leak one page styles to another page with the same section key', () => {
    expect(render(React.createElement('h1', null, 'Hi'), 'title', styled, 'about')).toBe('<h1>Hi</h1>');
  });

  it('cannot tell the page on the server when the key repeats and no page is given', () => {
    expect(render(React.createElement('h1', null, 'Hi'), 'title', styled, null)).toBe('<h1>Hi</h1>');
  });
});

describe('StylePanel', async () => {
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { StylePanel } = await import('../src/admin/StylePanel');
  const base = {
    device: 'desktop' as const, onChange: () => undefined,
    onSave: async () => undefined, onReset: async () => undefined, isSaving: false, hasSavedStyle: false,
  };

  it('shows colour presets and custom inputs, without its own device switch', () => {
    const html = renderToStaticMarkup(
      React.createElement(StylePanel, { ...base, value: undefined, isImage: false, options: { colors: { Brand: 'var(--brand)' }, fontSizes: { L: '2rem' } } })
    );
    expect(html).toContain('Brand');
    expect(html).toContain('type="color"');
    expect(html).toContain('>L<');
    expect(html).toContain('Editing <strong class="text-white">Desktop</strong> styles.');
    expect(html).not.toContain('aria-pressed');
    expect(html).not.toContain('>Image<');
  });

  it('shows the image group for images, and inherited values on phone', () => {
    const html = renderToStaticMarkup(
      React.createElement(StylePanel, { ...base, device: 'mobile', value: { desktop: { fontSize: '3rem' } }, isImage: true })
    );
    expect(html).toContain('>Image<');
    expect(html).toContain('inherited: 3rem');
    expect(html).toContain('Editing <strong class="text-white">Phone</strong> styles.');
  });
});
