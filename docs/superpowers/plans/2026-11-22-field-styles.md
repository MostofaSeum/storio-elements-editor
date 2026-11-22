# Field Styles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Style tab for single fields (presets + custom values, per device) with live preview and server-rendered CSS.

**Architecture:** Styles are one `_styles` record per page saved through the existing adapter; they merge into page content as `content._styles`. `<CmsField>` marks its element with `data-cms-style` and renders its own `<style>` with media queries. The studio adds a Style tab that edits the record and streams drafts to the preview.

**Tech Stack:** TypeScript, React 18/19, Vitest, tsup.

**Spec:** `docs/superpowers/specs/2026-11-22-field-styles-design.md`

## Global Constraints

- Library repo only. No change outside `d:\Brainicon Technology\Public-Site-CMS`.
- Reserved section key: `_styles`. Record: `{ page, sectionKey: "_styles", content: StyleSheetData }`.
- Breakpoints default: tablet 1024, phone 768; media queries `max-width: <bp - 0.02>px`.
- Selector: `[data-cms-style="<page>:<section>:<path>"][data-cms-style="<page>:<section>:<path>"]`.
- Values with `; { } < > \` or a line break are dropped; unknown properties are dropped.
- No styles on a field: output identical to today (no `<style>`, no wrapper).
- Files use LF in `src/`; write scripts to files, not long heredocs.

## Review Focus

- A field whose child is a custom component (`<BrandLogo/>`): attribute must not be lost; expect a wrapper span.
- A section key used on two pages with no `page` prop: styles of one page must not leak to the other.
- A value like `red;} body{display:none` typed by an editor: dropped, page CSS intact.
- Phone value set, desktop empty: phone rule only inside the phone media query.
- Saving one field's style must keep the other fields' styles on that page.

---

### Task 1: Core style model and CSS writer

**Files:**
- Create: `src/core/styles.ts`
- Modify: `src/core/types.ts`, `src/core/defineCms.ts`, `src/core/messages.ts`, `src/index.ts`
- Test: `test/fieldStyles.test.ts`

**Interfaces:**
- Produces:
  - types `StyleProps` (string props listed in spec table), `FieldStyle = { desktop?, tablet?, phone? }`, `StyleSheetData = Record<string, Record<string, FieldStyle>>`, `CmsStyleOptions` (spec `styles` option), `CmsConfig.styles?: CmsStyleOptions`.
  - `STYLES_KEY = '_styles'`
  - `styleId(page: string, section: string, path: string): string` → `"page:section:path"`
  - `sanitizeStyleProps(props: unknown): StyleProps`
  - `fieldStyleToCss(id: string, style: FieldStyle | undefined, options?: { breakpoints?: { tablet?: number; phone?: number }; wrapper?: boolean }): string`
  - `hasFieldStyle(style: FieldStyle | undefined): boolean`
  - `setFieldStyle(sheet: StyleSheetData | undefined, section: string, path: string, style: FieldStyle | null): StyleSheetData` (null removes; empty section removed)
  - `resolveFieldPage(config: Pick<CmsConfig,'pages'>, section: string, explicitPage?: string, pathname?: string): string | undefined`
  - message `CMS_STYLE_DRAFT: 'CMS_STYLE_DRAFT'` with `{ page, sectionKey, path, style: FieldStyle | null }`.

- [ ] **Step 1: Write failing tests** — `fieldStyleToCss('home:hero:title', { desktop: { color: 'red', marginTop: '8px' }, phone: { fontSize: '2rem' } })` contains `[data-cms-style="home:hero:title"][data-cms-style="home:hero:title"]{color:red;margin-top:8px;}` and `@media (max-width:767.98px){...font-size:2rem;}`; no tablet block; injection value dropped; unknown prop dropped; `borderWidth` adds `border-style:solid`; `wrapper: true` with `width` adds `display:inline-block`; `setFieldStyle` keeps sibling paths and removes empty; `resolveFieldPage` prefers explicit, then unique owner, then route match (`/about` → `about`), else undefined; `defineCms` rejects section key `_styles`.
- [ ] **Step 2: Run** `npx vitest run test/fieldStyles.test.ts` — FAIL (module missing).
- [ ] **Step 3: Implement** in `src/core/styles.ts`; camelCase → kebab; selector built with `JSON.stringify`-safe escaping of `"` and `\`; add reserved-key check to `defineCms`; add message type; export from `src/index.ts`.
- [ ] **Step 4: Run** tests — PASS; `npx tsc --noEmit` clean.

### Task 2: Site rendering and live drafts

**Files:**
- Modify: `src/site/CmsField.tsx`, `src/site/CmsProvider.tsx`
- Test: `test/fieldStyles.test.ts`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces: `useFieldStyle(page: string | undefined, section: string, path: string): FieldStyle | undefined` in `CmsProvider.tsx` (published from `initialContent[page]._styles` + client refetch + `CMS_STYLE_DRAFT`; `CMS_CONTENT_UPDATED` clears drafts and refetches `_styles` via `adapter.getRecord(page, '_styles')`).

- [ ] **Step 1: Failing tests (SSR)** — with `initialContent.home._styles.hero.title = { desktop: { color: 'red' } }`: `<CmsSection sectionKey="hero" page="home"><CmsField path="title"><h1>Hi</h1></CmsField></CmsSection>` renders `<style>` with the rule and `<h1 data-cms-style="home:hero:title">`; text child renders `<span data-cms-style=...>Hi</span>`; custom component child gets the wrapper span; without styles the markup equals `<h1>Hi</h1>`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** `useFieldStyle` and the CmsField changes (SectionField + OtherSectionField; page resolved with `resolveFieldPage`, pathname from `window.location` after mount only). Clone only when the child is a single element whose `type` is a string; otherwise wrap.
- [ ] **Step 4: Run** — PASS; full `npx vitest run` green.

### Task 3: Studio Style tab

**Files:**
- Create: `src/admin/StylePanel.tsx`
- Modify: `src/admin/CanvasEditor.tsx`
- Test: `test/fieldStyles.test.ts` (SSR render of `StylePanel`)

**Interfaces:**
- Consumes: Task 1 types/helpers, existing `device`/`setDevice` in CanvasEditor.
- Produces: `StylePanel` props `{ value: FieldStyle | undefined; device: 'desktop'|'tablet'|'mobile'; onDeviceChange(d); options?: CmsStyleOptions; fonts?: string[]; isImage: boolean; onChange(style: FieldStyle): void; onSave(): Promise<void>; onReset(): Promise<void>; isSaving: boolean }`. Studio device `mobile` maps to style key `phone`.

- [ ] **Step 1: Failing test** — StylePanel renders preset buttons for `options.colors` keys, a custom colour input, Device buttons, and "Image" group only when `isImage`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** StylePanel (groups per spec; inherited values shown greyed with "inherited"); in CanvasEditor show tabs Content | Style when `activeFieldPath` is set and the open section is not the record section and `config.styles?.enabled !== false`; load `_styles` of `sectionPage` with drafts; `onChange` → local state + `CMS_STYLE_DRAFT`; Save → `setFieldStyle` on freshly loaded record, `saveRecord({ isPublished: true })`, send `CMS_CONTENT_UPDATED`; Reset → `setFieldStyle(..., null)`.
- [ ] **Step 4: Run** tests + `npx tsc --noEmit`.

### Task 4: Docs, build, browser check

**Files:**
- Modify: `README.md`, `CLAUDE.md`
- Test: browser script in `D:\visual-cms-landing-test\tools` on the fresh project (scratch, outside library; test harness only)

- [ ] **Step 1:** README: "Field styles" section (presets config, devices, `page` hint, storage note for custom adapters), config table `styles`, components table note.
- [ ] **Step 2:** `npm run build`; exports exist.
- [ ] **Step 3:** Browser: open a field, Style tab, pick a colour preset → preview changes; Phone → set font size → preview at 390px changes; Save → visitor HTML has the `<style>` rule; Reset → rule gone.
