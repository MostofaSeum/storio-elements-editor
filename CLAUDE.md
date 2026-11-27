# Storio Elements Editor

Visual editor for Next.js sites (`@brainicon/storio-elements-editor`) plus a Django backend (`django-storio-elements-editor`). Formerly `@brainicon/visual-cms`, renamed in v1.0.0. Repo: github.com/MostofaSeum/storio-elements-editor. The README is the user guide and holds the AI-agent setup prompt; keep it in step with every feature.

## Layout
- `src/core` config, types, messages, paths, collections. `src/site` public-site parts (`CmsSection`, `CmsField`, `CmsIcon`). `src/admin` studio UI. `src/next` API route handler and file storage. `src/adapters` browser storage adapters. `src/cli` the `storio-editor` command (init, scan, add-page, doctor).
- `django-storio-elements-editor/storio_elements_editor` Django app. Its AppConfig label stays `visual_cms` on purpose, so old tables and migrations still work. The old `VISUAL_CMS` setting is still read.
- `dist/` is committed, because installing from GitHub has no build step.

## Commands
- `npm run lint`, `npm run typecheck`, `npm test` (smoke tests are in `test/smoke.test.ts`)
- `cd django-storio-elements-editor && python -m pytest` (needs `pip install -e . pytest pytest-django`; `python -m django test --settings=tests.settings` also works)
- CI (`.github/workflows/ci.yml`) runs all of these on push and pull requests to `main`: Node 20 and 22, Python 3.11 and 3.12.

## Release
1. Set the version in `package.json`, `package-lock.json`, `django-storio-elements-editor/pyproject.toml`, `storio_elements_editor/__init__.py`, both READMEs (the `#vX.Y.Z` install lines) and `examples/next-demo/package.json`.
2. `npm run build`. Confirm exit 0 and that every file in `exports` exists. Stage with `git add -A`, and check that no `.d.ts` file is deleted by mistake (v0.5.1 shipped broken this way).
3. Commit, tag `vX.Y.Z`, push `main` and the tag.
4. Install the tag from GitHub into an empty folder (npm and pip) and check `npx storio-editor --version`.

## How it works
- A page has sections, and a section is one JSON object. Saved edits are overrides per page and section. `CmsField` only points into that object by dot path (`items.0.title`), so the JSON format is unchanged.
- The studio shows the real site in an iframe and talks to it with `postMessage` (`CMS_EDIT_SECTION`, `CMS_DRAFT_PREVIEW`, `CMS_CONTENT_UPDATED`, `CMS_ITEM_DRAFT`).
- `[slug]` and `[id]` pages: a page with `collection` and a bracket route gets a second menu. Records are loaded and saved through `collections` of `createCmsRouteHandler`, or `COLLECTIONS` in Django. They go to the site's own database, not to section JSON. The slug is the record id and is not editable.
- `icons` in `defineCms`: the icon picker offers exactly these, so a picked icon always renders on the site.
- Site-wide content: one page with `global: true` (usually key `site`) holds the header, footer, contact, SEO defaults and theme. It is stored like any other page. The studio adds its sections to every page under "Site-wide" and picks the right page for save and preview (`resolveSectionPage`). Section keys may not appear on both a normal page and the global page. The site reads it with `useSiteContent`, `<CmsThemeStyle>` and `getSiteMetadata`.
- Field styles: the Style tab of a single field. Saved per page as the record `_styles` (`{ section: { path: { desktop, tablet, phone } } }`), published at once. `<CmsField>` marks its element with `data-cms-style` and writes its own `<style>` (src/core/styles.ts writes the CSS; src/site/fieldStyles.ts holds published and draft styles). `CMS_STYLE_DRAFT` carries unsaved styles to the preview.

## Not yet verified
Firefox and Safari. The Django `COLLECTIONS` flow against a real model in a browser (unit tests only). The full AI-prompt flow on a real Django project.
