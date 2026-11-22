# Field styles: an Elementor-like Style panel for single fields

Date: 2026-11-22. Status: approved in conversation; target release v1.3.0 (with `listOnEveryPage`).

## Intent

Non-technical admins should be able to tweak the design of one element (colour, size, spacing,
background, border, image fit) without a developer. When an editor opens a field with its pencil,
the left panel gets a **Style** tab next to the content form. Every change shows in the preview at
once and is saved, so visitors see it too.

The editor offers **presets** (the site's own colours, sizes and spacing, like WordPress' block
editor) and **custom values** (any colour or length, like Elementor), each with a
Desktop / Tablet / Phone switch.

## Goals

- Style tab for any field opened with its own pencil (`<CmsField path>` in a section).
- Presets defined once by the developer in `defineCms`, stored as `var(--token)` references when
  the developer gives them that way, so later token changes flow through.
- Custom values next to every preset row.
- Per-device values: Desktop is the base, Tablet and Phone inherit until changed.
- Live preview while editing, server-rendered CSS for visitors (no flash), no extra markup on
  pages that have no styles.
- Works on any site however it reads content, because styles are separate records.

## Non-goals (v1)

- Styling a whole section (only single fields).
- Styling fields of collection records (`<CmsField collection item>`).
- Hover states, shadows, animations, custom CSS, layout (flex/grid), position.
- Drag and drop or changing the HTML structure.
- Draft styles: styles have **Save & Publish** and **Reset** only (see Storage for why).

## Anti-goals

- Visitors must never get broken CSS from editor input: every value is checked before it is
  written into a stylesheet.
- A site that never uses styles must render exactly as before.

## Approaches considered

1. **Inline `style` on the element.** Simplest, but inline styles cannot change by screen size,
   so no device switch. Rejected.
2. **`_styles` inside each section's JSON.** Sites that map section content themselves (the
   Brainicon site keeps only known keys) would drop it. Rejected.
3. **Separate style records + generated CSS (chosen).** One record per page, saved through the
   same storage adapter; rules target a data attribute on the field's element, with `@media`
   blocks for Tablet and Phone.

## Design

### Storage

- One record per page: `{ page: <pageKey>, sectionKey: "_styles", content: StyleSheetData }`.
  The global page's sections keep their styles in the global page's record, so shared content has
  shared styles.
- `StyleSheetData = { [sectionKey]: { [fieldPath]: FieldStyle } }`.
- `FieldStyle = { desktop?: StyleProps; tablet?: StyleProps; phone?: StyleProps }`.
- `"_styles"` becomes a reserved section key: `defineCms` rejects a section with that key.
- The record merges into page content like any other (`mergePageContent` copies every record), so
  `getAllPageContent` / `<CmsProvider initialContent>` and `usePageContent` already deliver it as
  `content._styles`. No adapter, route handler or Django change.
- Saving a field's style rewrites the page's whole `_styles` record (read, change, write). One
  record per page also means one publish flag, so a "draft" would hide every published style of
  the page; that is why v1 has no draft styles.

### Style properties (`StyleProps`)

All values are strings.

| Group | Properties |
|---|---|
| Typography | `color`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textAlign`, `fontFamily` |
| Spacing | `marginTop/Right/Bottom/Left`, `paddingTop/Right/Bottom/Left` |
| Size | `width`, `maxWidth`, `height` |
| Background and border | `backgroundColor`, `borderRadius`, `borderWidth`, `borderColor` (a border width implies `border-style: solid`) |
| Image | `objectFit`, `opacity` |

Values containing `;`, `{`, `}`, `<`, `>`, `\` or a line break are dropped (same rule as
`themeToCss`). Unknown property names are dropped.

### Presets (`defineCms`)

```ts
styles?: {
  colors?: Record<string, string>;      // { Brand: 'var(--color-brand-600)' }
  fontSizes?: Record<string, string>;   // { S: '1rem', M: '1.5rem', L: '2.5rem', XL: '4rem' }
  spacing?: Record<string, string>;     // { None: '0', Small: '0.5rem', ... }
  radii?: Record<string, string>;       // { None: '0', Round: '9999px' }
  breakpoints?: { tablet?: number; phone?: number }; // default 1024 and 768
  enabled?: boolean;                    // false hides the Style tab; default true
}
```

Font families come from the existing `fonts` option. A group without presets shows only its
custom input.

### Which element gets the style

- Each styled field gets the attribute `data-cms-style="<page>:<section>:<path>"`.
- A field whose child is one plain HTML element (`<img>`, `<span>`, `<a>`...) gets the attribute
  on that element (cloneElement). Anything else (text, a custom component, several children) is
  wrapped in a `<span data-cms-style>`, **only when the field has a style**. A wrapper span that
  gets a size, vertical spacing or background becomes `display: inline-block` so those apply.
- Rules use the attribute twice (`[data-cms-style="x"][data-cms-style="x"]`) for specificity
  (0,2,0), so they win over single utility classes such as Tailwind's, without `!important`.

### Knowing the page of a field

Resolution order: `page` on `<CmsField>`; `page` on the surrounding `<CmsSection>`; the only page
in the config that has this section key (global page included). When several pages share the key
and neither prop is set, the field matches the current URL against page routes after mount (styles
then appear after hydration) and logs a console hint to add `page`. Documented: add `page` to
`<CmsSection>` when section keys repeat across pages.

### Rendering for visitors

- `<CmsField>` reads its style from the provider (`initialContent[page]._styles`, kept live by the
  same fetch and preview messages as content) and, when it has one, renders a `<style>` element
  just before the element with its rules:
  desktop rules, then `@media (max-width: <tablet - 0.02>px)` and `@media (max-width: <phone - 0.02>px)`.
- No style, no `<style>` and no wrapper: the output is identical to today.

### Live preview (studio to iframe)

- New message `CMS_STYLE_DRAFT { page, sectionKey, path, style }`. The field shows the draft style
  at once; `CMS_CONTENT_UPDATED` (sent after save or reset) clears drafts and refetches.
- The device switch in the Style tab is the studio's existing device switch, so choosing Phone
  also resizes the preview to 390px and shows the phone rules.

### Studio

- When a field is open with its pencil (section field, not a record field), the form area shows
  tabs **Content | Style**. Style tab content, by group: preset buttons, then a custom input.
  Colour custom input is the existing colour picker plus hex. Lengths accept any CSS length
  (`px`, `rem`, `%`, `em`, `vw`, `auto`).
- Values shown for Tablet/Phone fall back to the wider device's value, marked "inherited".
  A small reset per property clears that device's value.
- Buttons: **Save & Publish** (writes the page's `_styles` record) and **Reset styles** (removes
  this field's style from it).
- The Style tab is hidden when `styles.enabled === false`.

## Files (library only)

- `src/core/types.ts` (types, `styles` option), `src/core/defineCms.ts` (reserved key, option
  checks), new `src/core/styles.ts` (sanitising, CSS writer, page resolution helpers),
  `src/core/messages.ts` (`CMS_STYLE_DRAFT`).
- `src/site/CmsField.tsx` (attribute, wrapper, `<style>`), `src/site/CmsProvider.tsx` (style drafts),
  `src/site/sectionContext.ts`.
- New `src/admin/StylePanel.tsx`; `src/admin/CanvasEditor.tsx` (tabs, load/save, device link).
- Tests, README (new "Field styles" section, config and components tables), CLAUDE.md.
- Nothing outside this repository changes. The Brainicon site gets it later (its storage adapter
  must allow the `_styles` record; its client config must pass page routes or `page` props).

## Builder's calls

- Exact control layout and wording in the Style tab.
- How the inherited value is shown.
- Unit handling details for custom inputs.
