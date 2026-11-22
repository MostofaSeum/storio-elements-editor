import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TagInput, addTags, isTagListField, splitTags } from '../src/admin/TagInput';

describe('tag input', () => {
  it('is used for lists of texts named like keywords or tags only', () => {
    expect(isTagListField('keywords', ['a', 'b'])).toBe(true);
    expect(isTagListField('metaKeywords', [])).toBe(true);
    expect(isTagListField('tags', ['x'])).toBe(true);
    expect(isTagListField('focusKeyphrases', ['x'])).toBe(true);
    expect(isTagListField('titleLines', ['Innovative', 'Technology'])).toBe(false);
    expect(isTagListField('keywords', [{ label: 'x' }])).toBe(false);
    expect(isTagListField('keywords', 'a, b')).toBe(false);
  });

  it('splits typed or pasted text on commas and line breaks', () => {
    expect(splitTags(' web design, IT company ,\nsoftware\r\n,, ')).toEqual(['web design', 'IT company', 'software']);
  });

  it('adds new tags, skips duplicates in any letter case, and respects a maximum', () => {
    expect(addTags(['SEO'], ['seo', 'web', 'Web', 'apps'])).toEqual(['SEO', 'web', 'apps']);
    expect(addTags(['a', 'b'], ['c', 'd'], 3)).toEqual(['a', 'b', 'c']);
  });

  it('renders one chip per tag with a remove button, plus the count', () => {
    const html = renderToStaticMarkup(
      React.createElement(TagInput, { label: 'Keywords', fieldId: 'seo.keywords', value: ['web design', 'IT company'], onChange: () => undefined })
    );
    expect(html).toContain('aria-label="Remove web design"');
    expect(html).toContain('aria-label="Remove IT company"');
    expect(html).toContain('>2<');
    expect(html).toContain('Add…');
  });
});
