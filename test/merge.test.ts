import { describe, expect, it } from 'vitest';
import { defineCms, getSectionDetail, listManagedSections, mergePageContent } from '../src/index';
import type { PageDef, SectionRecord } from '../src/index';
import { memoryAdapter } from '../src/adapters';

const home: PageDef = {
  key: 'home',
  title: 'Home',
  route: '/',
  sections: [
    { key: 'hero', label: 'Hero' },
    { key: 'faq', label: 'FAQ' },
    { key: 'extra', label: 'Declared only' },
  ],
  defaults: {
    hero: { title: 'Default title', items: ['a'] },
    faq: { items: [] },
  },
};

const record = (overrides: Partial<SectionRecord>): SectionRecord => ({
  page: 'home',
  sectionKey: 'hero',
  content: { title: 'Saved title' },
  isPublished: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('mergePageContent', () => {
  it('returns defaults when nothing is saved', () => {
    expect(mergePageContent(home, [])).toEqual(home.defaults);
  });

  it('replaces a whole section with its published override', () => {
    const merged = mergePageContent<Record<string, unknown>>(home, [record({})]);
    expect(merged.hero).toEqual({ title: 'Saved title' });
    expect(merged.faq).toEqual({ items: [] });
  });

  it('ignores drafts unless includeDrafts is set', () => {
    const records = [record({ isPublished: false })];
    expect(mergePageContent<Record<string, unknown>>(home, records).hero).toEqual(home.defaults.hero);
    expect(mergePageContent<Record<string, unknown>>(home, records, { includeDrafts: true }).hero).toEqual({
      title: 'Saved title',
    });
  });

  it('ignores records of other pages and never mutates defaults', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const merged = mergePageContent<Record<string, any>>(home, [record({ page: 'other' })]);
    merged.hero.items.push('mutated');
    expect(home.defaults.hero).toEqual({ title: 'Default title', items: ['a'] });
  });
});

describe('listManagedSections / getSectionDetail', () => {
  it('lists default keys plus declared-only sections with override status', () => {
    const list = listManagedSections([home], [record({ sectionKey: 'faq', isPublished: false })]);
    expect(list.map((s) => s.sectionKey)).toEqual(['hero', 'faq', 'extra']);
    expect(list.find((s) => s.sectionKey === 'faq')).toMatchObject({ hasCustomOverride: true, isPublished: false });
    expect(list.find((s) => s.sectionKey === 'hero')).toMatchObject({ hasCustomOverride: false, isPublished: true });
  });

  it('falls back to the default after a reset and returns null for unknown sections', () => {
    expect(getSectionDetail(home, 'hero', null)?.content).toEqual(home.defaults.hero);
    expect(getSectionDetail(home, 'hero', record({}))?.hasCustomOverride).toBe(true);
    expect(getSectionDetail(home, 'missing', null)).toBeNull();
  });
});

describe('defineCms', () => {
  const base = { adapter: memoryAdapter() };

  it('rejects duplicate or malformed keys and bad routes', () => {
    expect(() => defineCms({ ...base, pages: [home, home] })).toThrow(/Duplicate page key/);
    expect(() => defineCms({ ...base, pages: [{ ...home, key: 'bad key' }] })).toThrow(/Invalid page key/);
    expect(() => defineCms({ ...base, pages: [{ ...home, route: 'no-slash' }] })).toThrow(/must start with/);
  });

  it('accepts a valid config', () => {
    expect(defineCms({ ...base, pages: [home] }).pages).toHaveLength(1);
  });
});
