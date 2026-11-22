# Storio Elements Editor

`@brainicon/storio-elements-editor` (formerly `@brainicon/visual-cms`, see [Upgrading](#upgrading-from-brainiconvisual-cms)) is a visual editor for Next.js sites (with an optional Django backend). Add one page to your admin panel and your editors get:

- a list of every page of the site,
- a **live preview** of the real page, at desktop, tablet or mobile size,
- a **pencil "Edit" button** that appears when they hover any section of the preview,
- an optional **small pencil for each title, subtitle, image or icon**, which opens only that one field,
- **database pages** such as blog posts or products (`[slug]` or `[id]` routes): a second menu lists the records, and their title, summary or image is saved straight to your own database,
- a **form editor** for that section or field, built automatically from the content,
- changes shown in the preview **as they type**, then saved, published, or reset to the default.

Content is stored through a small adapter, so it works with a JSON file, Django, a database, or your own API. Editors never see JSON: they use forms.

## Let your AI agent do it

Click the **copy** button at the top right of the box below, paste it into your AI coding agent (Claude Code, Cursor, Copilot, Codex…) inside your project, and it will install the library, connect it to your admin panel, and make your pages editable, step by step, without breaking your code.

```text
Install and set up the Storio Elements Editor library @brainicon/storio-elements-editor in this project, then make the website's pages editable from the admin panel.

Library: https://github.com/MostofaSeum/storio-elements-editor
Full instructions: read the README in that repository (after installing it is also at node_modules/@brainicon/storio-elements-editor/README.md), especially section "3. Install with an AI agent". Follow it exactly.

Safety rules (most important):
1. Before changing anything run `git status`. If there are uncommitted changes, ask me whether to commit them first. Then create a new branch named "storio-editor-setup" and do all work there.
2. Never delete, rename or rewrite code you were not asked to change. Visitors must see exactly the same website after the setup as before.
3. Run every storio-editor command with --dry-run first, read what it will change, then run it for real.
4. After every step run the project's type check (npx tsc --noEmit) or build. If it fails, fix the cause or undo that step (git checkout -- <file>, or restore the *.storio-editor.bak copy) before continuing.
5. Do not edit anything inside node_modules. Do not commit .cms/ or public/cms-uploads/.
6. Ask me only for things you cannot find out yourself.

Steps:
1. Check the project: Next.js App Router (app/ or src/app/), TypeScript, Tailwind CSS v4, Node 18.18+. Find the admin panel (folders like admin, dashboard, or a route group like (admin)), and find out whether there is a Django backend (a folder with manage.py). Then list every page file under app/ or src/app/ (page.tsx, page.jsx or page.js) that visitors open, leaving out the admin area, api/, login and other auth pages, the CMS screen, and error or not-found pages. Write the list down with each page's URL: every page on it must be made editable in step 5. If package.json already lists @brainicon/visual-cms (the old name of this library), follow the README section "Upgrading from @brainicon/visual-cms" instead of steps 2 and 3, then continue with step 4.
2. Install: npm install github:MostofaSeum/storio-elements-editor#v1.3.0   then check: npx storio-editor --version
3. Set it up with `npx storio-editor init --yes --no-example` (--no-example: this is a real project, so do not create the demo page at /cms-example):
   - with Django: add --django-dir <folder with manage.py> (and --api-url / --frontend-origin if the ports are not 8000 / 3000). This also sets up Django: package, settings, urls, CORS, migration.
   - if the admin panel lives under app/, add --admin-path "<admin folder>/cms" so the CMS screen sits behind the admin login.
   Do every task listed under "Warnings" and "Still to do by hand" in its output.
4. Add a link to the CMS screen in the admin panel's menu, in the same style as the other menu items.
5. Make every page on the list from step 1 editable, not only the homepage. Convert them one at a time, homepage first. Do not stop or ask whether to continue after a page; keep going until every page on the list is done. For each page:
   - npx storio-editor scan <page file> --dry-run   then review the list of texts it will move, then run it without --dry-run.
   - If scan says the file is a Server Component: if the page has no server-only code (not async, no metadata export, no database/fs/server imports) re-run with --add-use-client; otherwise move the page's JSX into a new client component file (components/<Name>View.tsx with 'use client'), render it from the page, and scan that file with --page <key> --route <url>.
   - Dynamic routes ([slug], [id]) show one database record at a time (a blog post, a product). Follow the README section "Pages with [slug] or [id]": add a collection for that data to the CMS API route (list, get and save, written with the project's own data functions, refreshing the page's cache after a save; with Django add it to STORIO_EDITOR["COLLECTIONS"] instead), scan the template with --route <the route with brackets> --collection <key> --page <key> (add --parent <list page key> when a list page exists), and wrap each visible record field in <CmsField collection="<key>" item={<record id>} path="<field>">, also on the list page (for example each post title). Fixed text of the template (headings, labels, buttons) stays page content.
   - Review the change with git diff and run the type check. The page must render exactly as before.
   - Required: every small item gets its own pencil. Go through the page from top to bottom. Every visible title, subtitle, paragraph, button or link label, image, logo, icon, and every field of a repeated card or list item must be wrapped in its own <CmsField>. Scan already does this for static text. For everything it did not move (images, icons, text kept in constants or arrays), add the current value to that section in content/<page>.json, read it with usePageContent, and wrap the element in <CmsField path="<key inside that section>" label="<short name>"> inside its <CmsSection>. Use dots and the list position for repeated items (items.0.title, or items.${index}.title inside .map()). For an icon, store its name in the JSON and list every icon the site may show in `icons: { ... }` of defineCms in cms.config.ts (reuse the site's own icon list or registry if it has one), so the icon picker offers exactly the icons the site can draw; draw it with the site's own icon component or <CmsIcon name={...} />. Put <CmsField> inside <li> and <td>, never around them. Keep the output identical.
   - Leave these without their own pencil: data that cannot be saved back (a third-party API, computed values); alt and placeholder values; and text inside <title>, <option> or <textarea>. Keep every item you skip for the final report, with the reason.
5b. Make the site-wide parts editable too: the navbar/header, the footer, contact details and social links that repeat on several pages, the default SEO (site name, title template, description, share image, favicon) and the brand colours. Follow the README section "Site-wide content": add one page with global: true (key "site") to cms.config.ts with the sections header, footer, contact, seo and theme, put the current values in content/site.json, read them with useSiteContent() in the shared components, wrap the navbar in <CmsSection sectionKey="header" title="Header" page="site"> and the footer the same way, give every link, label and logo its own <CmsField>, and use getSiteMetadata in the root layout. Keep the output identical.
   - Optional: where scan turned hand-written repeated cards into separate fields, you may turn them into an array in the JSON plus a .map() in the code, so editors can add and remove items. Keep the output identical.
6. Run npx storio-editor doctor and fix every FAIL.
7. Start the dev server and open the CMS screen. With Django the screen shows a sign-in form: sign in with a Django staff account (python manage.py createsuperuser makes one). Hover a title, an image, an icon and a list item in turn, and confirm each shows its own small pencil and opens a form with only that field. Pick an icon the page did not use before and confirm the preview shows exactly that icon. For a page with records, pick a record in the second menu and confirm its fields open as a database record. Change the title, Save & Publish, and check the public page shows it. Then reset it. Also hover an empty part of the section and confirm the larger section pencil opens the full form. Then pick every other page in the CMS page list and confirm its preview loads with pencils.
8. Production: make sure the API URL comes from NEXT_PUBLIC_CMS_API_URL (init generates this), and tell me to run  npx storio-editor doctor --production --frontend-origin <site URL> --api-url <API URL>  before deploying (README section 5, "Deploying to production").
9. Report to me: what was installed, every file created or edited, the CMS URL, a table of every page from the step 1 list with its URL and whether it is editable (and why not), every visible item left without its own pencil and why, and anything I still have to do (for example the real login check for saving, a staff user, or production settings).
```

## Contents

1. [Install](#1-install)
2. [Connect it to your admin panel](#2-connect-it-to-your-admin-panel)
3. [Install with an AI agent](#3-install-with-an-ai-agent)
4. [Make your own pages editable](#4-make-your-own-pages-editable)
5. [Before you go live](#5-before-you-go-live)
6. [Backends: files, Django, your own](#6-backends-files-django-your-own)
7. [Troubleshooting](#7-troubleshooting)
8. [Reference](#8-reference)
9. [Updating](#9-updating)

---

## 1. Install

**Your project needs:** Next.js (App Router, version 14 or newer; tested on 15 and 16), TypeScript, Tailwind CSS v4, Node.js 18.18 or newer, and `git` (npm uses it to download the library from GitHub). For anything else, see [Other setups](#other-setups-manual).

### Step 1. Install the library from GitHub

In your Next.js project:

```bash
npm install github:MostofaSeum/storio-elements-editor#v1.3.0
```

`#v1.3.0` pins a released version (see the repository's tags). You import it as `@brainicon/storio-elements-editor`. Check that it worked:

```bash
npx storio-editor --version     # prints 1.3.0
```

### Step 2. Run the setup command

```bash
npx storio-editor init
```

It asks up to five questions (where content is stored, the Django URL and folder if you choose Django, the route of the CMS screen, and whether to create an example page). To skip the questions and accept the defaults: `npx storio-editor init --yes`. To see what it would do without changing anything: add `--dry-run`.

What it does for you:

| It creates | Purpose |
|---|---|
| `cms.config.ts` | the list of editable pages |
| `lib/cms-storage.ts` and `app/api/cms/[...path]/route.ts` | where edits are saved, and the API the CMS uses (file backend) |
| `components/CmsProviders.tsx` | the provider the CMS needs |
| `app/admin/cms/page.tsx` | the CMS screen |
| `app/admin/layout.tsx` | a small admin shell with the CMS button, **only if you have no admin area yet** |
| `app/cms-example/page.tsx`, `components/CmsExampleView.tsx`, `content/cms-example.json` | a demo page that shows how a page becomes editable. In a real project skip it with `--no-example` |

| It edits (small changes you can review in `git diff`) | Change |
|---|---|
| `app/layout.tsx` | wraps `{children}` with `<CmsProviders>` |
| the global CSS file | adds one Tailwind `@source` line so the CMS screens are styled |
| `.gitignore` | ignores `.cms` and `public/cms-uploads` (file backend) |

It also installs `lucide-react` and `react-hot-toast` if they are missing, using your package manager (npm, pnpm, yarn or bun, detected from your lockfile).

It is safe to run again. It never overwrites a file you already have (use `--force` to replace), and a second run changes nothing. Under `src/`, files go under `src/`.

> **Content is rendered on the server.** `components/CmsProviders.tsx` (used by your root layout) loads the published content of every CMS page on the server, so the HTML that visitors and search engines receive already contains the edited text. It adapts to your setup: on Next.js 15+ it reads on every request; with Next.js 16 `cacheComponents: true` it caches for about a minute (`'use cache'` + `cacheLife('minutes')`), and visitors' browsers still fetch the newest content right after the page loads.

**Using Django as the backend?** One command sets up both sides. Point it at the folder that contains `manage.py`:

```bash
npx storio-editor init --django-dir ../backend --frontend-origin http://localhost:3000
```

Besides the Next.js files above, this installs `django-storio-elements-editor` (shipped inside the package) into your Django project's virtual environment (found as `venv`, `.venv` or `env` next to or inside that folder, otherwise the `python` on your PATH), then edits `settings.py` and `urls.py`, sets up CORS and runs the migration. Details are in [section 6](#using-django). Add `--dry-run` first to see everything it would change.

### Step 3. Make your pages editable

Convert an existing page in one command. It moves the page's texts into `content/<page>.json`, wraps each section in `<CmsSection>` and each moved text in `<CmsField>`, and registers the page. The page looks exactly the same afterwards:

```bash
npx storio-editor scan src/app/page.tsx --dry-run     # see which texts it would move
npx storio-editor scan src/app/page.tsx               # do it (the original is saved as page.tsx.storio-editor.bak)
```

Or create a brand-new editable page, and check your setup at any time:

```bash
npx storio-editor add-page about          # content/about.json, a view, app/about/page.tsx, and the config entry
npx storio-editor doctor                  # checks Tailwind, the config, the provider, and the Django API (CORS included)
```

Run `scan` on every page file of your site, not only the homepage: each one becomes its own page in the CMS page list. A dynamic route such as `app/blog/[slug]/page.tsx` shows records from your database: see [Pages with [slug] or [id]](#pages-with-slug-or-id) to make both its fixed text and each record's own fields editable.

Details: [section 4](#4-make-your-own-pages-editable).

### Step 4. Open the CMS

```bash
npm run dev
```

Open `http://localhost:3000/admin/cms`. Hover a text in the preview, click its small pencil, change the text, and watch the preview update. Hover an empty part of a section to get the pencil that opens the whole section. **Save & Publish** puts it on the site. The reset button (circular arrow) goes back to the default. With Django, the CMS screen first shows a sign-in form: use a Django staff username and password (`python manage.py createsuperuser` makes one).

### Step 5. Connect your admin panel

If you already have an admin panel, continue with [section 2](#2-connect-it-to-your-admin-panel). It takes two small edits.

### Try the demo app first (optional)

The repository includes a complete working app:

```bash
git clone https://github.com/MostofaSeum/storio-elements-editor.git
cd storio-elements-editor/examples/next-demo
npm install
npm run dev          # open http://localhost:3000/admin/cms
```

---

## 2. Connect it to your admin panel

The CMS is an ordinary page (`/admin/cms` by default) that renders `<CmsStudio />`. Connecting it to your admin panel means three things:

1. **The page lives inside your admin area**, so your login already protects it.
2. **Your admin menu links to it.**
3. **The API checks your login.**

| Your admin panel is… | Go to |
|---|---|
| none yet | [Case A](#case-a-no-admin-panel-yet) |
| part of this Next.js app | [Case B](#case-b-your-admin-panel-is-part-of-this-nextjs-app) |
| a different app or site (React, Vue, Laravel, Django templates, WordPress…) | [Case C](#case-c-your-admin-panel-is-a-different-app) |

### Case A: no admin panel yet

Nothing to do. `init` already created `app/admin/layout.tsx` with a sidebar that has the CMS button, and the page at `/admin/cms`. When you build your real admin panel later, delete that layout and add the button to your own menu (Case B, step 3).

You still must protect it before going live: [Before you go live](#5-before-you-go-live).

### Case B: your admin panel is part of this Next.js app

**Step 1. Find your admin area's folder under `app/`.** Examples: `app/admin`, `app/dashboard`, `app/(dashboard)/dashboard`. It usually has a `layout.tsx` that checks the login, or a `middleware.ts` guards it.

**Step 2. Create the CMS page inside that folder.** Run `init` with the folder plus `/cms`:

```bash
npx storio-editor init --admin-path admin/cms
npx storio-editor init --admin-path dashboard/cms
npx storio-editor init --admin-path "(dashboard)/dashboard/cms"     # quotes are required for parentheses
```

A folder in parentheses is a Next.js *route group*: it is part of the path on disk but not of the URL. `init` handles this, so the last example creates `app/(dashboard)/dashboard/cms/page.tsx` and the URL is `/dashboard/cms`. Because your existing admin folder is there, `init` leaves your layout alone, and the new page automatically gets your layout and your login guard.

> If you already ran `init` with the default path, delete the files it created for the wrong location (`app/admin/cms/` and, if `init` made it, `app/admin/layout.tsx`) before running it again with the right path. Run `init --dry-run` first if unsure.

**Step 3. Add the CMS link to your admin menu.** Find the file that renders the menu (search your admin folder for the labels of your existing menu items).

If the menu is JSX links, add the ready-made button. Pass your menu's own `className` so it matches:

```tsx
'use client';
import Link from 'next/link';
import { CmsNavButton } from '@brainicon/storio-elements-editor/admin';

<CmsNavButton href="/admin/cms" as={Link} className="your-menu-item-classes" />
```

If the menu is a list of objects, just add an item. A plain link is enough:

```tsx
{ label: 'CMS', href: '/admin/cms', icon: Globe }
```

If your menu file is a Server Component, leave out `as={Link}` (a normal link works) or add `'use client'` at the top of the file. Use the URL `init` printed, not the folder path (for the route-group example it is `/dashboard/cms`).

**Step 4. Give the API your login check.** The API route is outside your admin folder, so it needs its own check. Open `app/api/cms/[...path]/route.ts` and replace the generated `authorize` (it only allows editing under `next dev`):

```ts
authorize: async () => {
  const user = await getCurrentUser();   // use the same function your admin pages use
  return user?.role === 'admin';         // use the same rule your admin pages use
},
```

`authorize` receives the request (`(request: Request) => boolean | Promise<boolean>`) if your auth needs headers. After this change, editing in `next dev` requires being logged in too.

**Step 5.** If you have a `middleware.ts` that redirects visitors, see [Redirects and the preview iframe](#redirects-and-the-preview-iframe).

### Case C: your admin panel is a different app

**Recommended: keep the CMS screen in this Next.js site and link to it from your admin panel.** It works with any admin technology.

1. Run `npx storio-editor init` in the Next.js site (Case A).
2. In your other admin panel's menu, add a link that opens the CMS page, for example `https://your-site.com/admin/cms`. Editors can open it in a new tab.
3. Make sure editors are signed in on the site: replace `authorize` as in Case B step 4, using whatever login the site understands (a shared cookie, a token, or a separate login).

**Advanced (not tested end to end): the screen inside a React admin app on another domain.** You would render `<CmsStudio config={cms} />` in that app with `publicSiteUrl` set to the site's URL, add the admin's origin to `allowedOrigins` in the site's config, enable CORS on the site's API, send your auth with `restAdapter({ headers })`, and make sure the site may be shown in an iframe by the admin's origin (no `X-Frame-Options: DENY`, no restrictive `frame-ancestors`). The link approach above avoids all of this.

---

## 3. Install with an AI agent

Copy the prompt from [the top of this README](#let-your-ai-agent-do-it) into your AI coding agent. The rest of this section is the detailed procedure the agent follows. After the library is installed, this README is also at `node_modules/@brainicon/storio-elements-editor/README.md`.

### Instructions for the agent

**Rules**

1. Work on a new git branch. If the working tree has uncommitted changes, ask the developer before continuing.
2. Use the commands (`init`, `scan`, `add-page`, `doctor`). Do not hand-write the files they generate.
3. Always pass `--yes` to `init` (no interactive questions), and run every command with `--dry-run` once first.
4. Visitors must see the same website as before. After every step run `npx tsc --noEmit` (or the build). If it fails, fix it or undo that step before continuing.
5. Do not edit anything inside `node_modules`.
6. Never leave editing open to everyone. With the file backend the generated `authorize()` only allows editing under `next dev`: replace it with the project's real login check. If you cannot work out the project's login, leave the generated check as it is and tell the developer. With Django, Django's staff login decides.
7. Do not commit `.cms/` or `public/cms-uploads/` (init already adds them to `.gitignore`).
8. Check the result of every step before the next one. If a check fails, use [Troubleshooting](#7-troubleshooting) and `npx storio-editor doctor`. Do not guess.
9. Ask the developer only for inputs you cannot find yourself.

**Inputs**

| Name | Meaning | How to get it |
|---|---|---|
| `PROJECT` | the website's root folder | the folder with the `package.json` that lists `next` |
| `BACKEND` | `files` (default) or `django` | `django` when the repository has a Django project (a folder with `manage.py`) that should hold the content; otherwise `files` |
| `DJANGO_DIR` | the folder with `manage.py`, `django` only | search the repository |
| `API_URL` / `FRONTEND_ORIGIN` | where Django and the site run, `django` only | defaults `http://localhost:8000/api/cms` and `http://localhost:3000`; check the project's config and scripts |
| `ADMIN_AREA` | the admin folder under `app/`, route groups included, e.g. `dashboard` or `(dashboard)/dashboard` | Step 2 |
| `ADMIN_URL` | the URL of the CMS screen `init` will create, e.g. `/dashboard/cms` (the admin folder without route groups, plus `/cms`) | Step 2 |
| `MENU_FILE` | file that renders the admin menu | Step 2 |
| `AUTH_FN` | what the admin pages use to decide who may enter | Step 2 |

**Step 1. Check the project.** Run these in `PROJECT`:

| Check | Pass when | If it fails |
|---|---|---|
| `node -v` | 18.18 or newer | tell the developer to upgrade Node |
| `node -e "const p=require('./package.json');const d={...p.dependencies,...p.devDependencies};console.log(d.next,d.tailwindcss)"` | prints a Next.js version and a Tailwind version starting with 4 (`^4`, `4.1.0`…) | not Next.js: use [Other setups](#other-setups-manual) or stop. Tailwind below 4 or missing: tell the developer, since the CMS screens need v4 |
| `app/` or `src/app/` exists | yes | Pages Router only: not supported by `init`; tell the developer |
| `tsconfig.json` exists | yes | JavaScript-only: not supported by `init`; tell the developer |
| `git status` | clean, or the developer agreed | create the branch `storio-editor-setup` |
| `package.json` has no `@brainicon/visual-cms` | yes | the old name of this library is installed: follow [Upgrading from @brainicon/visual-cms](#upgrading-from-brainiconvisual-cms) instead of a fresh setup, then continue from Step 6 for pages that are not editable yet |

**Step 2. Find the admin panel.** Decide which case applies:

- List the folders under `app/` (or `src/app/`) and look for `admin`, `dashboard`, `manage`, `backoffice`, or a route group like `(admin)`. Open its `layout.tsx` and any `middleware.ts`. Note the login check they use: that is `AUTH_FN`.
- Search that folder for the file that renders the menu: grep for the labels of existing menu items ("Dashboard", "Users", "Settings") or for components named `Sidebar`, `Nav`, `Menu`. That is `MENU_FILE`.
- Result: **NO_ADMIN** (nothing found: [Case A](#case-a-no-admin-panel-yet)), **NEXT_ADMIN** (found in this app: [Case B](#case-b-your-admin-panel-is-part-of-this-nextjs-app)), or **EXTERNAL_ADMIN** (the admin is another app: [Case C](#case-c-your-admin-panel-is-a-different-app)).
- If you are unsure which case applies, ask the developer one question: "Where is your admin panel?"

**Step 3. Install the library.**

```bash
npm install github:MostofaSeum/storio-elements-editor#v1.3.0
npx storio-editor --version
```

Pass when the last command prints a version.

**Step 4. Run `init`.** Build the command from the inputs, run it with `--dry-run` first, read the plan, then run it for real:

| Situation | Command |
|---|---|
| NO_ADMIN or EXTERNAL_ADMIN, files backend | `npx storio-editor init --yes --no-example` |
| NEXT_ADMIN | add `--admin-path "<ADMIN_AREA>/cms"` |
| Django backend | add `--django-dir <DJANGO_DIR>`, plus `--api-url <API_URL> --frontend-origin <FRONTEND_ORIGIN>` when they differ from the defaults |
| The developer explicitly asks for the demo page at `/cms-example` | leave out `--no-example` |
| Package install must be skipped | add `--no-install` and install `lucide-react react-hot-toast` yourself |

Pass when the command exits with code 0 and lists created and modified files. **Every line under "Warnings" and "Still to do by hand" in its output is a task for you:** do it, or report it to the developer. Then run `npx tsc --noEmit`.

**Step 5. Connect the admin panel.**

- **NO_ADMIN:** nothing to do.
- **NEXT_ADMIN:** do [Case B](#case-b-your-admin-panel-is-part-of-this-nextjs-app) steps 3 and 4: add the link to `MENU_FILE` in the menu's own style, and (file backend) replace `authorize` using `AUTH_FN`.
- **EXTERNAL_ADMIN:** do [Case C](#case-c-your-admin-panel-is-a-different-app): add a link to the CMS page in the other admin, and (file backend) replace `authorize` with a check the site can perform.

**Step 6. Make every page editable.** First list every page file under `app/` or `src/app/` (`page.tsx`, `page.jsx` or `page.js`) that visitors open, leaving out the admin area, `api/`, login and other auth pages, the CMS screen, and error or not-found pages. Write the list down with each page's URL. Every page on it must be converted, not only the homepage: go through them one at a time, homepage first, and do not stop or ask whether to continue until the list is done. For each page:

1. `npx storio-editor scan <page file> --dry-run`. Read the list of texts. It moves only static text and `placeholder`/`alt` attributes; code, state and API data stay as they are.
2. If it reports a Server Component: when the page has no server-only code (not `async`, no `metadata`/`generateMetadata` export, no database, `fs` or server-only imports), re-run with `--add-use-client`. Otherwise create `components/<Name>View.tsx` with `'use client'`, move the page's JSX into it (keep the server code in the page and pass data as props), render `<NameView />` from the page, and scan the new file with `--page <key> --route <url>`.
3. Run it without `--dry-run`, then `git diff` and `npx tsc --noEmit`. The page must render the same as before. If anything is wrong, restore the file from `<file>.storio-editor.bak`, remove the page entry from `cms.config.ts` and delete `content/<key>.json`.
4. Required: give every small item its own pencil. Every visible title, subtitle, paragraph, button or link label, image, logo, icon, and every field of a repeated card or list item must be inside its own `<CmsField>`. `scan` does this for static text. For images, icons and text kept in constants or arrays, add the current value to that section in `content/<page>.json`, read it with `usePageContent`, and wrap the element in `<CmsField path="..." label="...">` ([Edit single fields](#edit-single-fields)). For an icon, store its name and list every icon the site may show in `icons` of `defineCms` (reuse the site's own icon registry if it has one), so the picker only offers icons the site can draw; draw it with the site's own icon component or `<CmsIcon name={...} />` ([Icons](#icons)). The page must render the same as before.
   Leave these without their own pencil: data that cannot be saved back (a third-party API, computed values); `alt` and `placeholder` values; and text inside `<title>`, `<option>` or `<textarea>`. Note each skipped item and the reason for the report in Step 8.
   Shared components (navbar, footer, anything in the root layout) are not skipped: they belong to the global page. See step 7 below.
5. Dynamic routes (`[slug]`, `[id]`) show one database record at a time. Do [Pages with [slug] or [id]](#pages-with-slug-or-id): add a collection to the CMS API route using the project's own data functions (Django: `STORIO_EDITOR["COLLECTIONS"]`), scan the template with `--route <route with brackets> --collection <key> --page <key>` (plus `--parent <list page key>` when there is a list page), and wrap each visible record field, on the record page and on the list page, in `<CmsField collection item path>`. If the data cannot be saved back (for example it comes from a third-party API), make only the fixed text editable and note why for Step 8.
6. Optional: blocks written out by hand several times (for example four copied cards) became separate fields. You may turn them into an array in the JSON plus a `.map()` in the code, so editors can add and remove items. Keep the output identical.
7. Site-wide parts, once for the whole site: do [Site-wide content](#site-wide-content-header-footer-seo-theme). Add a page with `global: true` (key `site`) with the sections `header`, `footer`, `contact`, `seo` and `theme`, move the current values of the navbar, the footer, repeated contact details and social links into `content/site.json`, read them with `useSiteContent()`, wrap the navbar and footer in `<CmsSection ... page="site">` with a `<CmsField>` for every link, label and logo, and replace the root layout's static `metadata` with `generateMetadata` calling `getSiteMetadata` (keep the old values as `fallback`). Only add a `theme` section when the site's colours are already CSS variables, or can become variables without changing how it looks.

**Step 7. Verify.** Pass only when all of these hold (the dev server uses port 3000 unless the project says otherwise):

```bash
npx tsc --noEmit                      # exit code 0 (or: npm run build)
npx storio-editor doctor                 # no FAIL lines
npm run dev                           # start it in the background, wait until it is ready
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000<ADMIN_URL>"   # 200, or a redirect to the login page when the admin is protected. Not 404.
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/"             # 200
```

If you have a browser tool: open the CMS URL (with Django, sign in with a staff account on the form it shows), confirm the preview loads, hover a text, an image, an icon and a list item in turn, confirm each small pencil opens a form with only that field, change the text, **Save & Publish**, check the public page, then reset it. Then pick every other page in the CMS page list and confirm its preview loads with pencils. Without a browser tool, `curl` each converted page's URL and expect 200. Stop the dev server you started.

**Step 8. Report to the developer.** Say what was created and edited, the CMS URL, where the menu link was added, a table of every page from the Step 6 list with its URL and whether it is editable (and why not), every visible item left without its own pencil and why, and what is still theirs to do: the real login check for the file backend if you could not add it, a staff user for Django, and a database-backed storage before deploying to a serverless host ([Before you go live](#5-before-you-go-live)).

**Common mistakes to avoid**

- Running `init` without `--yes` (it can wait for input that never comes).
- Running `init` with the default `--admin-path` when the real admin is elsewhere, which puts the CMS page outside the login guard.
- Forgetting that `--admin-path` must be quoted when it contains parentheses.
- Removing `authorize` or making it always return `true`.
- Adding `'use client'` to a page that is `async`, exports `metadata`, or reads a database.
- Wrapping a section in `<CmsSection sectionKey="x">` without adding `x` to that page's `sections` in `cms.config.ts` (`scan` and `add-page` do this for you).
- With `--auth session` only: logging in to Django at `127.0.0.1` while the site calls `localhost` (the login cookie is not shared, so saving fails with 401). The default token login has no such problem.

---

## 4. Make your own pages editable

`init` sets up the CMS. Then make each page editable.

**The quick way: `scan`.** For an existing page:

```bash
npx storio-editor scan src/app/page.tsx --dry-run
npx storio-editor scan src/app/page.tsx
```

It reads the file with your project's TypeScript compiler, finds its sections (`<header>`, `<section>`, `<footer>`, `<nav>`…, or the top-level blocks when there are none), and:

- moves every static text, and every `placeholder` and `alt` attribute, into `content/<page>.json` (one object per section),
- replaces each of them with the matching value from `usePageContent()`,
- wraps each section in `<CmsSection>` and each moved page text in `<CmsField>` (no wrapper is rendered for visitors),
- registers the page and its sections in `cms.config.ts`.

It leaves code alone: state, props, API data, string literals inside expressions, `<code>`/`<pre>` blocks and anything inside an element marked `data-cms-ignore`. The page renders the same HTML as before (this is what the tests check). The original file is saved as `<file>.storio-editor.bak`, and the rewritten file is checked for syntax errors before anything is written.

Things to know:

- Each moved page text gets its own pencil through `<CmsField>` ([Edit single fields](#edit-single-fields)). `placeholder` and `alt` values and text inside `<title>` cannot be wrapped, so editors change those with the section pencil.
- The page must be a client component, because the content is read with a hook. For a Server Component it stops and explains: pass `--add-use-client` when the page has no server-only code, or move the JSX into a client component and scan that file with `--page` and `--route`.
- The page key and route come from the file's place under `app/` (`app/page.tsx` is `home` at `/`). Pass `--page` and `--route` for files elsewhere.
- Blocks written out several times by hand (four copied cards) become separate fields. Turn them into an array plus `.map()` by hand if editors should add or remove items.
- Image `src` values, icons and texts built in code are not moved. To make one editable, add it to the JSON and wrap it in `<CmsField>` ([Edit single fields](#edit-single-fields)).

**By hand.** Three steps, using the generated example as the pattern.

**1. Put the page's text and images in a content object.** One top-level key per editable block:

```json
// content/home.json
{
  "hero": { "title": "Welcome", "subtitle": "…", "image": "/hero.jpg" },
  "features": { "title": "Why us", "items": [ { "id": "f1", "title": "Fast", "text": "…" } ] }
}
```

**2. Register the page in `cms.config.ts`:**

```ts
import home from './content/home.json';

pages: [
  {
    key: 'home',            // unique id used in storage
    title: 'Home',          // shown in the CMS
    route: '/',             // the public URL shown in the preview
    defaults: home,         // what the page shows until someone edits a section
    sections: [
      { key: 'hero', label: 'Hero' },        // key = a top-level key of the content
      { key: 'features', label: 'Features' },
    ],
  },
],
```

**3. Read the content and wrap each block.** In a client component. The published content is already loaded on the server by `<CmsProviders>` in your root layout, so the HTML contains the edited text and the page needs no data fetching of its own:

```tsx
// components/HomeView.tsx  (client), rendered by app/page.tsx: export default function Page() { return <HomeView />; }
'use client';
import { CmsSection, usePageContent } from '@brainicon/storio-elements-editor/site';
import type home from '@/content/home.json';

export function HomeView() {
  const { hero, features } = usePageContent<typeof home>('home');
  return (
    <main>
      <CmsSection sectionKey="hero" title="Hero">
        <h1>{hero.title}</h1>
      </CmsSection>
      <CmsSection sectionKey="features" title="Features">
        {features.items.map((item) => <p key={item.id}>{item.title}</p>)}
      </CmsSection>
    </main>
  );
}
```

Tips:

- `CmsSection` adds nothing for visitors. The outline and pencil only appear inside the CMS preview.
- Each `sectionKey` must match a `key` in that page's `sections`.
- Give list items an `id`. Name image fields like `image`, `logo`, `avatar` or `src` to get the image picker, and icon fields like `icon` to get the icon picker. List the icons your site can draw in `icons` of `defineCms`, so the picker never offers one the page cannot show ([Icons](#icons)).
- For sticky headers or banners, use `<CmsSection buttonPlacement="fixed">` so the pencil is not hidden.
- To let editors control the page's SEO, add a `seo` section (`title`, `description`, `keywords`, `canonical`, `ogTitle`, `ogDescription`, `ogImage`, `twitterCard`, `robots`) and use `getPageMetadata(cms, 'home', { storage })` in `generateMetadata`.
- With the Django backend, use `import { storage } from '@/lib/cms-storage'` the same way; `init` already generates it for Django.

### Edit single fields

By default a pencil opens the whole section. To give one value its own pencil, wrap it in `<CmsField>` inside the `<CmsSection>`. The editor hovers that title, image or icon, clicks its small pencil, and sees a form with only that field:

```tsx
import { CmsField, CmsSection, usePageContent } from '@brainicon/storio-elements-editor/site';

<CmsSection sectionKey="hero" title="Hero">
  <h1><CmsField path="title" label="Title">{hero.title}</CmsField></h1>
  <p><CmsField path="subtitle" label="Subtitle">{hero.subtitle}</CmsField></p>
  <CmsField path="image" label="Image"><img src={hero.image} alt="" /></CmsField>
  <CmsField path="icon" label="Icon"><HeroIcon name={hero.icon} /></CmsField>

  {hero.items.map((item, index) => (
    <h3 key={item.id}>
      <CmsField path={`items.${index}.title`} label="Card title">{item.title}</CmsField>
    </h3>
  ))}
</CmsSection>
```

- `path` is where the value lives inside that section's content. Use dots for nested values and list positions. It can also point to a whole card (`items.0`) to edit it as a group.
- Visitors get no extra HTML, and in the CMS preview the wrapper does not change the page layout.
- The section pencil still works on the section's empty areas, and **Show all fields in this section** opens the full form.
- Put `<CmsField>` inside list and table elements (`<li>`, `<td>`), not around them. `<option>`, `<title>` and `<textarea>` only allow plain text, so edit those with the section pencil.
- Saving a field saves its section, so no storage or API change is needed.
- Moving to another field of the same section keeps unsaved edits. Leaving the section or page with unsaved edits asks for confirmation first.

### Icons

The icon picker must offer only icons your site can draw, or an editor can pick one that never shows up. List them once in `cms.config.ts`, by the name stored in the content:

```ts
import { Rocket, Sparkles, Terminal, Zap } from 'lucide-react';

export const cms = defineCms({
  icons: { Rocket, Sparkles, Terminal, Zap },   // or your site's own icon registry
  // ...
});
```

Draw the chosen icon with your own icon component (if it uses the same registry) or with `<CmsIcon>`:

```tsx
import { CmsField, CmsIcon } from '@brainicon/storio-elements-editor/site';

<CmsField path="icon" label="Icon"><CmsIcon name={hero.icon} className="size-6" /></CmsField>
```

Without `icons` the picker offers a built-in list of popular lucide icons, which your page must then be able to draw (for example with `getDynamicIcon(name)` from `/icons`, which adds the whole lucide set to your bundle).

### Site-wide content (header, footer, SEO, theme)

Some content is the same on every page: the navbar, the footer, the phone number and social links, the site name and default share image, the brand colours. It lives in the root layout or in shared components, not in one page. Put it in one page with `global: true`:

```ts
// cms.config.ts
import siteContent from './content/site.json';

export const cms = defineCms({
  fonts: ['Inter', 'Lora'],          // optional: font names your site already loads
  pages: [
    // ...your pages
    {
      key: 'site',
      title: 'Site settings',
      route: '/',                    // page shown while "Site settings" is open
      global: true,
      defaults: siteContent,
      sections: [
        { key: 'header', label: 'Header' },
        { key: 'footer', label: 'Footer' },
        { key: 'contact', label: 'Contact & social' },
        { key: 'seo', label: 'SEO defaults' },
        { key: 'theme', label: 'Theme' },
      ],
    },
  ],
});
```

```json
// content/site.json
{
  "header": { "logo": "/logo.svg", "links": [{ "label": "About", "href": "/about" }], "ctaLabel": "Contact us" },
  "footer": { "copyright": "© 2026 Acme" },
  "contact": { "email": "hello@acme.com", "phone": "+1 555 0100", "socials": [{ "label": "LinkedIn", "href": "https://linkedin.com/company/acme" }] },
  "seo": { "siteName": "Acme", "titleTemplate": "%s | Acme", "description": "We build things.", "ogImage": "/og.png", "favicon": "/favicon.ico" },
  "theme": { "primaryColor": "#7c3aed", "accentColor": "#22d3ee", "headingFont": "Inter" }
}
```

In the studio, every page then lists these sections under **Site-wide** after its own sections, and clicking the navbar in any preview opens it. The page menu also has **Site settings (every page)**. A change shows on every page at once.

To keep each page's list short, add `listOnEveryPage: false` to the global page. Its sections are then listed only under **Site settings**. Clicking the navbar or footer in any preview still opens them.

**Header and footer.** Read the content with `useSiteContent()` and add `page="site"` to the section. The component must be inside `<CmsProviders>` in the root layout:

```tsx
'use client';
import { CmsField, CmsSection, useSiteContent } from '@brainicon/storio-elements-editor/site';

export function Navbar() {
  const { header } = useSiteContent();
  return (
    <CmsSection sectionKey="header" title="Header" page="site" buttonPlacement="fixed">
      <nav>
        <CmsField path="logo" label="Logo"><img src={header.logo} alt="" /></CmsField>
        {header.links.map((link, i) => (
          <a key={link.href} href={link.href}><CmsField path={`links.${i}.label`}>{link.label}</CmsField></a>
        ))}
      </nav>
    </CmsSection>
  );
}
```

Remove `activeOnPath` from these sections: it limited them to one page, and a site-wide section is editable everywhere.

**Contact details used in several places.** Read them from `useSiteContent().contact`. Where a value shows outside its own section (the phone number in the body of the contact page), name the section on the field: `<CmsField page="site" section="contact" path="phone">{contact.phone}</CmsField>`.

**SEO defaults.** In the root layout, build the metadata from the `seo` section. `titleTemplate` needs `%s`, which Next.js replaces with each page's title:

```tsx
// app/layout.tsx
import { getSiteMetadata } from '@brainicon/storio-elements-editor/next';

export async function generateMetadata() {
  return getSiteMetadata(cms, { storage, fallback: { title: 'Acme' } });
}
```

`getPageMetadata` then fills in what a page leaves empty (description, share image) from the site SEO. Pass `site: false` to turn that off.

**Theme colours and fonts.** A value like `#7c3aed`, or a key ending in `color`/`colour`, gets a colour picker. A key ending in `font` gets a list of the `fonts` from `defineCms`; load those fonts yourself (for example with `next/font`). Put `<CmsThemeStyle />` once inside `<CmsProviders>` in the root layout: it writes the `theme` section as CSS variables (`primaryColor` becomes `--primary-color`), and the preview follows the colour picker. Use the variables in your CSS:

```css
.btn-primary { background: var(--primary-color); }
h1, h2 { font-family: var(--heading-font), sans-serif; }
```

With Tailwind v4 you can point theme colours at them: `@theme inline { --color-brand: var(--primary-color); }`. A value containing `;`, `{`, `}`, `<`, `>` or `\` is ignored, so an editor cannot break the page's CSS.

With Django and `ALLOWED_PAGES` set, add `"site"` to it.

### Field styles (colour, size, spacing)

When a field is opened with its own pencil, the form has two tabs: **Content** and **Style**. The Style tab changes the look of that one element: colour, font size, weight, line height, letter spacing, alignment, font, margin, padding, width, max width, height, background, corner radius, border, and for images fit and opacity. The preview changes as the editor works.

Every value can be picked from a preset or typed in (any CSS value: `#7c3aed`, `2rem`, `24px`, `50%`, `var(--color-brand-600)`). A **Desktop / Tablet / Phone** switch at the top sets values per screen size. Tablet and phone use the wider value until they get their own. The switch also resizes the preview.

Offer your site's own colours and sizes as presets in `cms.config.ts`. Point them at your CSS variables, so a later change of a variable also changes every element that uses that preset:

```ts
export const cms = defineCms({
  styles: {
    colors:    { Brand: 'var(--color-brand-600)', Accent: 'var(--color-accent-500)', Ink: 'var(--color-ink)' },
    fontSizes: { S: '1rem', M: '1.5rem', L: '2.5rem', XL: '4rem' },
    spacing:   { None: '0', Small: '0.5rem', Medium: '1rem', Large: '2rem' },
    radii:     { None: '0', Small: '0.5rem', Round: '9999px' },
    breakpoints: { tablet: 1024, phone: 768 },   // the defaults
  },
  fonts: ['Inter', 'Lora'],                       // optional: the Font row
  // ...
});
```

Without presets the tab offers only the inputs. `styles: { enabled: false }` hides the tab.

How it works:

- A page's styles are saved as one record, `{ page, sectionKey: "_styles" }`, through the same storage adapter as the content. `_styles` is therefore a reserved section key. If you wrote your own storage adapter that only accepts known sections, let it accept `_styles` too.
- Styles are published at once (Save & Publish). They have no drafts. **Reset styles** removes the field's style.
- On the site, `<CmsField>` puts `data-cms-style="<page>:<section>:<path>"` on its element and writes the rules in a `<style>` just before it, with `@media` blocks for tablet and phone. The rules beat a single utility class (such as Tailwind's) without `!important`. A field without styles renders exactly as before.
- When the field's child is a plain HTML element (`<h1>`, `<img>`, `<a>`), that element is styled. Text and custom components are wrapped in a `<span>`, only once they have a style. A wrapper that gets a size, vertical spacing or background becomes `inline-block`.
- The styles come with the page content loaded on the server (`getAllPageContent`), so visitors see no flash.
- When the same section key is on several pages, add `page="<page key>"` to that `<CmsSection>`. Without it, the field finds its page from the URL after the page has loaded, and the styles appear a moment later.

### Pages with [slug] or [id]

A page like `app/blog/[slug]/page.tsx` shows one record of your database at a time: one file, many pages (`/blog/school`, `/blog/college`). The CMS can edit both parts of it:

| What | Example | Where it is saved | One edit changes |
|---|---|---|---|
| the record's own fields | a post's title, summary, cover | your database row, through your own code | that one post |
| fixed text of the template | the "Related posts" heading | CMS content, like any page | every post |

In the CMS, picking **Blog** in the page menu shows a second menu: **Blog home** (the list page) and every post. Picking a post previews it, and its fields open as a **database record** with one **Save** button (it goes live at once). Post titles shown on the list page can be edited from Blog home too.

**1. Serve the records from the CMS API route.** Write `list`, `get` and `save` with your own data functions. Only signed-in editors (your `authorize`) can call them, and only the fields `get` returns can be saved, each keeping its type:

```ts
// app/api/cms/[...path]/route.ts
import { revalidateTag } from 'next/cache';
import { listAllPosts, getPostBySlug, updatePostFields } from '@/server/blog/repository';

export const { GET, PUT, DELETE, POST } = createCmsRouteHandler({
  storage,
  authorize,
  collections: {
    blog: {
      list: async () => (await listAllPosts()).map((p) => ({ id: p.slug, label: p.title })),
      get: async (slug) => {
        const post = await getPostBySlug(slug);
        return post ? { title: post.title, summary: post.summary, cover: post.cover ?? '' } : null;
      },
      save: async (slug, values) => {
        await updatePostFields(slug, values);  // values only holds keys returned by get
        revalidateTag('blog');                  // refresh the cached public pages
      },
    },
  },
});
```

With **Django**, no code is needed: list the model in settings ([details](django-storio-elements-editor/README.md#pages-with-slug-or-id)):

```python
STORIO_EDITOR = {
    "COLLECTIONS": {
        "blog": {"model": "blog.Post", "lookup": "slug", "label": "title", "fields": ["title", "summary"]},
    },
}
```

**2. Register the page** with its route in brackets, the collection, and (when it has a list page) its parent. `scan` does this for you: `npx storio-editor scan app/blog/[slug]/page.tsx --page blog-post --collection blog --parent blog` (for a Server Component, move the JSX into a client view first and scan that file with `--route /blog/[slug]`). By hand:

```ts
{ key: 'blog-post', title: 'Blog post', route: '/blog/[slug]', collection: 'blog', parent: 'blog',
  defaults: blogPostDefaults, sections: [{ key: 'extras', label: 'Extras' }] },
```

`[slug]` is filled with the record id. When the URL needs other values, return them from `list` as `params`, e.g. `{ id: '7', label: 'Shoes', params: { category: 'shop' } }` for `/[category]/[id]`.

**3. Wrap the record's fields** wherever they appear, with the record's id. This works in Server Components too, and visitors get no extra HTML:

```tsx
// app/blog/[slug]/page.tsx
<h1><CmsField collection="blog" item={post.slug} path="title">{post.title}</CmsField></h1>
<p><CmsField collection="blog" item={post.slug} path="summary">{post.summary}</CmsField></p>

// app/blog/page.tsx (the list): each post title opens that post's record
<CmsField collection="blog" item={post.slug} path="title">{post.title}</CmsField>
```

Plain text follows the editor's typing in the preview; images and other content update when the record is saved. In a client component, `useCollectionItem('blog', post.slug, post)` returns the post with the unsaved edits applied, for live previews of anything.

---

## 5. Before you go live

### Deploying to production

Everything you tested on `localhost` works the same in production once these settings point at the real URLs. Check them with one command:

```bash
npx storio-editor doctor --production --frontend-origin https://example.com --api-url https://api.example.com/api/cms
```

It checks HTTPS, Secure cookies, that the site and the API share a site, CORS with credentials, `DEBUG = False`, that the API URL comes from an environment variable, that content is rendered on the server, and the file-backend pitfalls below. It exits with an error code when something is wrong, so you can run it in CI.

**1. Choose the domains.** With the default **token login** (`--auth token`), editors sign in on the CMS screen and the browser sends a token, not a cookie, so any domains work as long as CORS allows the site. With `--auth session` the CMS sends Django's login cookie with every save, which limits the domains:

| Setup | Works? |
|---|---|
| `example.com` + `api.example.com` | yes, with the default cookie settings |
| `example.com` with Django behind `example.com/api/` (reverse proxy) | yes, nothing extra |
| `mysite.vercel.app` + `myapi.herokuapp.com` (two different sites) | token login: yes. Session login: **avoid**, the cookie becomes a third-party cookie, which Safari and other browsers block, so saving fails even after logging in |

**2. Next.js environment.** `init` generates `baseUrl: process.env.NEXT_PUBLIC_CMS_API_URL ?? 'http://localhost:8000/api/cms'`. Set the variable on your host (Vercel, Docker, …) before building:

```bash
NEXT_PUBLIC_CMS_API_URL=https://api.example.com/api/cms
```

**3. Django settings** (production values):

```python
DEBUG = False
ALLOWED_HOSTS = ["api.example.com"]
CSRF_TRUSTED_ORIGINS = ["https://example.com"]
CORS_ALLOWED_ORIGINS = ["https://example.com"]      # not needed behind the same domain
CORS_ALLOW_CREDENTIALS = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

Use any database Django supports (PostgreSQL, MySQL…): the CMS is a normal model, so `python manage.py migrate` on the production database is all it needs.

**4. Uploaded images.** With `DEBUG = False` Django does not serve `/media/`. Configure a storage backend such as `django-storages` with S3 (uploads use Django's default storage), or serve `MEDIA_ROOT` with your web server.

**5. Editors.** Create staff users on the production Django (`python manage.py createsuperuser`). Editors sign in on the CMS screen with that username and password (with `--auth session`: at the Django admin first).

**6. Caching.** Content is rendered on the server by `<CmsProviders>`: on every request (Next.js 15+), or cached for about a minute with Next.js 16 `cacheComponents`. If you put a CDN in front of the site, do not cache HTML for longer than you want edits to take to appear.

### Checklist

- [ ] `npx storio-editor doctor --production …` reports no FAIL.
- [ ] **File backend only: replace the dev-only `authorize()`** in `app/api/cms/[...path]/route.ts` with your real login check. Until then, editing works only under `next dev`, so a deployed site cannot be edited at all.
- [ ] **Protect the CMS page.** Keep it inside your admin area, behind the same guard as your other admin pages.
- [ ] **Check where content is stored.** `fileStorage()` writes `.cms/content.json` and `public/cms-uploads/`. That needs a disk that is writable and persistent: a VPS, or Docker with a volume. On Vercel or other serverless/read-only hosts the edits are lost, so use Django or a database-backed adapter.
- [ ] **Back up** your database (Django) or `.cms/` and `public/cms-uploads/` (file storage, they are in `.gitignore`).
- [ ] **Middleware.** If it redirects visitors, let the preview through ([below](#redirects-and-the-preview-iframe)).

---

## 6. Backends: files, Django, your own

Storage keeps only **overrides**: a section nobody edited is not stored and shows its default. "Reset" deletes the override.

### Files (default)

`init` sets this up. Edits go to `.cms/content.json`, uploads to `public/cms-uploads/`. Fine for development and a single server.

### Using Django

Django keeps the content in its database and uses your Django logins.

#### The one-command way (recommended)

```bash
npx storio-editor init --django-dir <folder with manage.py> --frontend-origin http://localhost:3000
```

Use `--api-url` if Django is not at `http://localhost:8000/api/cms`. For the Django side the command does exactly this, and prints each step:

| Step | File |
|---|---|
| installs `django-storio-elements-editor` (from the copy inside the library package) and `django-cors-headers` | your Django virtual environment |
| adds `"storio_elements_editor"` and `"corsheaders"` to `INSTALLED_APPS` | `settings.py` |
| adds `"corsheaders.middleware.CorsMiddleware"` as the first `MIDDLEWARE` entry | `settings.py` |
| adds your frontend origin to `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS`, sets `CORS_ALLOW_CREDENTIALS = True` | `settings.py` |
| adds `path("api/cms/", include("storio_elements_editor.urls"))` (and imports `include`) | root `urls.py` |
| sets `MEDIA_URL` and `MEDIA_ROOT` when missing, and serves uploaded images while `DEBUG = True` | `settings.py`, root `urls.py` |
| runs `python manage.py migrate visual_cms` | database |

A copy of each edited file is saved next to it as `*.storio-editor.bak`. Running the command again changes nothing. If a file has an unusual shape (for example `INSTALLED_APPS` built by code), that step is skipped and the exact lines to add are printed under "Still to do by hand". `django-cors-headers` is needed because the Next.js site and Django run on different ports; if the frontend reaches Django through the same origin (a reverse proxy or a Next.js rewrite), pass `--no-cors` to the Django helper (see below) to skip it.

You can also run the Django part on its own, without the Next.js part:

```bash
pip install "git+https://github.com/MostofaSeum/storio-elements-editor.git@v1.3.0#subdirectory=django-storio-elements-editor"
python -m storio_elements_editor setup --project <folder with manage.py> --frontend-origin http://localhost:3000 [--dry-run] [--no-cors] [--no-migrate]
```

Then create an editor: any Django user with **staff** status can edit (`python manage.py createsuperuser` makes one).

#### How editors sign in

Editors never need Django's login page. `init` sets up a **sign-in form on the CMS screen**: the editor types a Django staff username and password, Django returns a signed token that expires after 12 hours, and the CMS sends it with every request. A request with a valid token needs no CSRF token (it uses no cookie), which is also why this works when the site and the API are on different domains.

```ts
// cms.config.ts (generated)
export const cmsLogin = cmsAuth({ baseUrl: API_URL });
adapter: djangoAdapter({ baseUrl: API_URL, headers: cmsLogin.headers }),
```

```tsx
// app/admin/cms/page.tsx (generated): the form shows until the editor is signed in
<CmsAuthGate auth={cmsLogin}>
  <CmsStudio config={cms} />
</CmsAuthGate>
```

**Who counts as signed in.** Only a token from the sign-in form. A leftover Django admin login in the same browser does **not** let anyone past `<CmsAuthGate>`: the gate does not send cookies. After a successful sign-in the token is kept in `localStorage` for 12 hours, so reloading or reopening the browser does not ask again until it expires or the editor signs out. The generated CMS screen has no sign-out button, so add `<CmsLogoutButton auth={cmsLogin} />` where you want one. To ask every time the browser closes, use `cmsAuth({ baseUrl, storage: 'session' })`; to shorten the period, set `TOKEN_MAX_AGE` in Django.

**Your own React admin with a sign-in page.** Put the same gate around your whole admin area and give it a login page, so signed-out visitors are sent to the form and back afterwards:

```tsx
// app/admin/layout.tsx
'use client';
import { CmsAuthGate } from '@brainicon/storio-elements-editor/admin';
import { cmsLogin } from '@/cms.config';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <CmsAuthGate auth={cmsLogin} loginPath="/admin/login">{children}</CmsAuthGate>;
}

// app/admin/login/page.tsx
'use client';
import { CmsLogin } from '@brainicon/storio-elements-editor/admin';
import { cmsLogin } from '@/cms.config';

export default function LoginPage() {
  return <CmsLogin auth={cmsLogin} title="Admin sign in" redirectTo="/admin" />;
}
```

Add `<CmsLogoutButton auth={cmsLogin} redirectTo="/admin/login" />` to your admin header. The gate only hides the *screens*: protect your own admin API on the server too (a guard in the browser cannot protect an endpoint).

**Settings** (`STORIO_EDITOR` in Django `settings.py`, all optional):

| Setting | Default | Meaning |
|---|---|---|
| `TOKEN_LOGIN` | `True` | `False` removes the sign-in endpoint (use Django sessions only) |
| `TOKEN_MAX_AGE` | `43200` | seconds a sign-in lasts |
| `LOGIN_MAX_ATTEMPTS` | `5` | wrong passwords per username and address before a lockout |
| `LOGIN_LOCKOUT_SECONDS` | `300` | how long the lockout lasts |
| `AUTHORIZE` | staff users | dotted path of your own `can_edit(request) -> bool`; it also decides who gets a token |

**Other ways to sign in.**

- **Django's own login page** (same domain only): run `init` with `--auth session`, or remove `cmsAuth` from the config. Editors then log in at the Django admin first and the CMS uses that session.
- **Your own login system (JWT, SSO…)**: write `can_edit(request)` for Django, set it as `STORIO_EDITOR["AUTHORIZE"]`, and send your token with `djangoAdapter({ baseUrl, headers: () => ({ Authorization: \`Bearer ${yourToken()}\` }) })`. A request that carries the library's own token is recognised first; anything else reaches your function with the normal `request`.

**Existing project?** Update the package and the npm library ([section 9](#9-updating)), then in `cms.config.ts` add `import { cmsAuth } from '@brainicon/storio-elements-editor/adapters'`, `export const cmsLogin = cmsAuth({ baseUrl: <your API URL> })` and `headers: cmsLogin.headers` in `djangoAdapter(...)`, and wrap the CMS screen in `<CmsAuthGate auth={cmsLogin}>`. `npx storio-editor doctor` checks the result.

#### By hand

Install the package (`pip install "git+https://github.com/MostofaSeum/storio-elements-editor.git@v1.3.0#subdirectory=django-storio-elements-editor"`), add `"storio_elements_editor"` to `INSTALLED_APPS`, add `path("api/cms/", include("storio_elements_editor.urls"))` to the root `urls.py`, run `python manage.py migrate`, and configure CORS and `CSRF_TRUSTED_ORIGINS` as described in [django-storio-elements-editor/README.md](django-storio-elements-editor/README.md). On the frontend run `npx storio-editor init --backend django --api-url https://api.example.com/api/cms`. This generates `cms.config.ts` with `djangoAdapter`, which sends the editor's token (or Django session cookie) and handles Django's CSRF token. No Next.js API route or `fileStorage` is created.

### Your own backend

Any server that implements these endpoints works with `restAdapter({ baseUrl })`:

| Method | Path | Body / result |
|---|---|---|
| GET | `/records?page=&drafts=1` | `SectionRecord[]` |
| GET | `/records/:page/:section?drafts=1` | `SectionRecord`, or `null` if never edited |
| PUT | `/records/:page/:section` | body `{ content, isPublished }` → `SectionRecord` |
| DELETE | `/records/:page/:section` | `204` |
| GET | `/media` | `MediaItem[]` |
| POST | `/media` | multipart `files` → `{ items: MediaItem[] }` |
| GET | `/collections/:key/items` | `[{ id, label, params? }]` (editors only) |
| GET | `/collections/:key/items/:id` | the record's editable values, `404` if missing (editors only) |
| PUT | `/collections/:key/items/:id` | body `{ values }` → the record's values after saving (editors only) |

```ts
type SectionRecord = { page: string; sectionKey: string; content: unknown;
  isPublished: boolean; updatedAt: string | null; updatedBy?: string | null };
type MediaItem = { url: string; name: string; size?: number };
```

Return drafts (`drafts=1`) only to authorised editors, and refuse writes from anyone else. To keep content in your own database from Next.js, implement `CmsStorageAdapter` and pass it as `storage` to `createCmsRouteHandler`:

```ts
interface CmsStorageAdapter {
  listRecords(page?: string, options?: { includeDrafts?: boolean }): Promise<SectionRecord[]>;
  getRecord(page: string, sectionKey: string, options?: { includeDrafts?: boolean }): Promise<SectionRecord | null>;
  saveRecord(input: { page; sectionKey; content; isPublished; updatedBy? }): Promise<SectionRecord>;
  deleteRecord(page: string, sectionKey: string): Promise<void>;
  uploadMedia?(files: File[]): Promise<MediaItem[]>;   // optional: enables uploads
  listMedia?(): Promise<MediaItem[]>;                  // optional: enables the media library
}
```

`memoryAdapter()` (in `@brainicon/storio-elements-editor/adapters`) is a short reference implementation.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| anything does not work | many possible causes | run `npx storio-editor doctor`: it checks the common ones and says what to fix |
| Django: "Failed to save section changes" | your sign-in expired (tokens last 12 hours), or you are not a **staff** user (401), or with `--auth session` the CSRF origin is missing (403) | reload the CMS screen and sign in again; with `--auth session` log in at the Django admin (same host name as the site, `localhost` not `127.0.0.1`) and check `CSRF_TRUSTED_ORIGINS` |
| the sign-in form says "Invalid username or password" | wrong credentials, or the account is not active | use a Django **staff** account; `python manage.py createsuperuser` makes one |
| the sign-in form says "This account is not allowed to edit the site" | the account is not staff (or your `AUTHORIZE` function says no) | set `is_staff` on the user in the Django admin |
| the sign-in form says "Too many failed attempts" | 5 wrong passwords for that username from this address | wait 5 minutes (`LOGIN_LOCKOUT_SECONDS`) |
| the sign-in form says "Token login is not available on this server" | `django-storio-elements-editor` is older than 0.4 or `TOKEN_LOGIN` is `False` | upgrade the package ([section 9](#9-updating)); `npx storio-editor doctor` says which |
| `npx storio-editor` tries to download something, or says not found | the library is not installed in this project, or you are in the wrong folder | run `npm install github:MostofaSeum/storio-elements-editor#v1.3.0` in the project root, then retry |
| "Invalid hook call", or `Cannot read properties of null (reading 'useState')` | two copies of React, usually from linking a local clone of the library (`npm link`, `file:` path) | install from GitHub instead: remove `node_modules/@brainicon`, then `npm install github:MostofaSeum/storio-elements-editor#v1.3.0` |
| the CMS screen has no styling | the Tailwind `@source` line is missing or points to the wrong place, or Tailwind is v3 | open the CSS file your root layout imports; it must contain `@source "…/node_modules/@brainicon/storio-elements-editor/dist";` below `@import "tailwindcss";` |
| the preview shows "Loading…" forever, or is blank | the page's `route` in `cms.config.ts` is wrong, the page throws an error, a redirect catches the preview, or the site blocks being framed | open the route in a normal tab; check `middleware.ts` ([below](#redirects-and-the-preview-iframe)); remove `X-Frame-Options: DENY` |
| hovering shows no pencil | the block is not wrapped in `<CmsSection>`, `CmsProviders` is missing from the root layout, or Edit Mode is off | wrap the block; check `app/layout.tsx`; turn Edit Mode on in the toolbar |
| hovering a title or image shows only the section pencil | the value is not wrapped in `<CmsField>`, or the `<CmsField>` is outside its `<CmsSection>` (the browser console warns about this) | wrap the value inside its section ([Edit single fields](#edit-single-fields)) |
| a small pencil opens the whole section and says "This field could not be found" | the `path` does not match that section's content, or the list item was deleted | use the key from `content/<page>.json`, for example `title` or `items.0.title` |
| an icon picked in the CMS shows as a different icon on the page | the page draws icons from its own list, and the picker offered one that is not in it | add `icons` with that list to `defineCms` ([Icons](#icons)) |
| the second menu says "could not load" or "no records yet" for a [slug] page | the API route has no collection with that key, `list` threw, or the editor is not signed in | add it to `collections` of `createCmsRouteHandler` (Django: `COLLECTIONS`), and check the server log |
| saving a record fails with "'…' cannot be edited" | the form sent a field that `get` does not return | return every field you want editable from `get` |
| clicking the pencil says "Section '…' is not configured for this page" | the `sectionKey` is not in that page's `sections` | add `{ key: '…', label: '…' }` to the page in `cms.config.ts` |
| saving fails with 401 | `authorize()` returned false. The generated one allows editing only under `next dev` | implement your login check ([Case B step 4](#case-b-your-admin-panel-is-part-of-this-nextjs-app)); log in |
| saving fails with 404 "Unknown page" | the page key is not in `cms.config.ts` `pages` | register the page |
| saved edits do not show on the site | it was saved as a draft, the page or a CDN caches the HTML, or (with `cacheComponents`) the one-minute cache has not refreshed yet | use **Save & Publish**; check your CDN; wait a minute. Run `npx storio-editor init` again if `components/CmsProviders.tsx` does not use `getAllPageContent` (older installs) |
| an uploaded image is broken on the page, and its `/_next/image` request answers `"url" parameter is not allowed` | the page shows it with `next/image`, and Next.js only loads images from hosts you allow | add the Django host to `next.config`: `images: { remotePatterns: [{ protocol: 'https', hostname: 'api.example.com', pathname: '/media/**' }] }`, then rebuild |
| edits vanish after a deploy | file storage on a host with a temporary disk | use Django or a database adapter ([section 5](#5-before-you-go-live)) |
| TypeScript error importing a `.json` file | `resolveJsonModule` is off | set `"resolveJsonModule": true` in `tsconfig.json` |
| `Module not found: @brainicon/storio-elements-editor/...` | the library is not installed, or the install is stale | reinstall it ([section 9](#9-updating)), delete `.next`, restart |
| `init` says "not a Next.js project", "Pages Router only" or "needs a TypeScript project" | unsupported project type | follow [Other setups](#other-setups-manual) |
| Django: 403 on save | missing or stale CSRF token | use `djangoAdapter` (not `restAdapter`) and see the CORS/CSRF settings in the Django README |
| `npm install github:...` fails | `git` is not installed, or no access to github.com | install git and check the network; the repository is public |

---

## 8. Reference

### `storio-editor init` options

| Option | Meaning |
|---|---|
| `--backend files\|django` | where content is stored (default `files`) |
| `--api-url <url>` | Django API base URL (default `http://localhost:8000/api/cms`) |
| `--django-dir <path>` | your Django project (folder with `manage.py`, or the folder above it). Also sets up Django: package, settings, urls, CORS, migration. Implies `--backend django` |
| `--frontend-origin <url>` | where this Next.js site runs, allowed by Django (default `http://localhost:3000`) |
| `--auth token\|session` | how editors sign in with Django (default `token`): a sign-in form on the CMS screen that works across domains, or Django's own login page (same domain only) |
| `--admin-path <path>` | folder of the CMS screen under `app/` (default `admin/cms`). Route groups are allowed: `"(admin)/dashboard/cms"` |
| `--no-example` | skip the example page |
| `--no-install` | do not install dependencies |
| `--dry-run` | show what would happen, change nothing |
| `--force` | overwrite existing files that differ |
| `-y, --yes` | accept defaults, ask nothing |
| `--cwd <dir>` | project folder (default: current folder) |
| `-h, --help`, `-v, --version` | help, version |

### `storio-editor scan <file>`

Makes an existing page editable ([section 4](#4-make-your-own-pages-editable)). Options: `--page <key>`, `--route <path>`, `--title <text>`, `--component <Name>` (default: the default export), `--add-use-client`, `--collection <key>` and `--parent <page key>` (for [slug] or [id] pages, see [Pages with [slug] or [id]](#pages-with-slug-or-id)), `--dry-run`. It refuses files that already use `usePageContent`, [slug] or [id] routes without `--collection`, and page keys or content files that already exist.

### `storio-editor add-page <key>`

Creates an editable page in one step: `content/<key>.json` (default text, one object per section), `components/<Name>View.tsx` (with a `<CmsSection>` per section and a `<CmsField>` per text), `app/<route>/page.tsx` (renders that view; the root layout already loads the saved content), and registers the page in `cms.config.ts`. It refuses to overwrite existing files.

| Option | Meaning |
|---|---|
| `--title <text>` | name shown in the CMS (default: made from the key) |
| `--route <path>` | public URL (default `/<key>`; nested routes like `/company/team` work) |
| `--sections <a,b,c>` | section keys (default `hero,content`) |
| `--dry-run` | show what would be created |

Afterwards, replace the placeholder markup in the generated view with your own design (keep the `<CmsSection>` and `<CmsField>` wrappers), and put real default text in the JSON file.

### `storio-editor doctor`

Checks the setup and says exactly what to fix: Next.js and the packages, Tailwind v4 and the `@source` line, `cms.config.ts`, the provider, the CMS screen, and (for Django) whether the API answers, whether Django allows your origin with cookies (CORS), and whether saving is allowed by the preflight. It exits with an error code when something is wrong, so it also works in CI. Options: `--api-url <url>` (check another Django URL), `--frontend-origin <url>`, and `--production` for the deployment checks in [section 5](#deploying-to-production). With the token login it also checks that CORS allows the `Authorization` header and that the server has the sign-in endpoint. It cannot check your username and password: if the sign-in form refuses you, use a Django staff account.

`init` supports the Next.js App Router with TypeScript and Tailwind v4. It stops with a clear message for the Pages Router and JavaScript-only projects, and leaves a manual step for Tailwind v3. It was tested with npm; pnpm, yarn and bun are detected from the lockfile but were not tested.

### Other setups (manual)

For a project `init` does not support, or if you prefer to do it by hand. This is what `init` generates.

**1.** Install the library ([Step 1](#step-1-install-the-library-from-github)) and `npm install lucide-react react-hot-toast`. In your global CSS, below `@import "tailwindcss";`, add `@source "../node_modules/@brainicon/storio-elements-editor/dist";` (the path is relative to the CSS file).

**2.** `cms.config.ts`:

```ts
import { defineCms } from '@brainicon/storio-elements-editor';
import { restAdapter } from '@brainicon/storio-elements-editor/adapters';
import home from './content/home.json';

export const cms = defineCms({
  title: 'Site CMS',
  adapter: restAdapter({ baseUrl: '/api/cms' }),
  pages: [{ key: 'home', title: 'Home', route: '/', defaults: home,
            sections: [{ key: 'hero', label: 'Hero' }] }],
});
```

**3.** `lib/cms-storage.ts` and `app/api/cms/[...path]/route.ts`:

```ts
// lib/cms-storage.ts
import { fileStorage } from '@brainicon/storio-elements-editor/next';
export const storage = fileStorage();
```

```ts
// app/api/cms/[...path]/route.ts
import { createCmsRouteHandler } from '@brainicon/storio-elements-editor/next';
import { storage } from '@/lib/cms-storage';
import { cms } from '@/cms.config';

export const { GET, PUT, DELETE, POST } = createCmsRouteHandler({
  storage,
  allowedPages: cms.pages.map((p) => p.key),
  authorize: async (req) => /* your login check */ false,
});
```

**4.** The provider, wrapped around `{children}` in `app/layout.tsx`:

```tsx
// components/CmsProviders.tsx
'use client';
import { CmsProvider } from '@brainicon/storio-elements-editor/site';
import { cms } from '@/cms.config';

export function CmsProviders({ children }: { children: React.ReactNode }) {
  return <CmsProvider config={cms}>{children}</CmsProvider>;
}
```

**5.** The CMS screen, and a link to it in your admin menu:

```tsx
// app/admin/cms/page.tsx
'use client';
import { CmsStudio } from '@brainicon/storio-elements-editor/admin';
import { cms } from '@/cms.config';

export default function CmsPage() {
  return <CmsStudio config={cms} />;
}
```

### How the form is built

There is no schema to write. The editor reads the section's content and picks a field for each value:

| Value | Field |
|---|---|
| string | text input (textarea when long or multi-line) |
| key named like `image`, `logo`, `avatar`, `src`… or an image URL | image picker (gallery, upload, URL) |
| key named like `icon`, `iconName`… | Lucide icon picker |
| `#rrggbb` value, or key ending in `color`/`colour` | colour picker plus hex input |
| key ending in `font`, when `fonts` is set in `defineCms` | list of those fonts |
| number / boolean | number input / checkbox |
| key `id` | shown read-only |
| array | list with add, delete and reorder |
| object | nested group |
| `{ html, css, js }` | your code editor, if you pass `widgets.code`; otherwise text areas |

### Configuration (`defineCms`)

| Option | Purpose |
|---|---|
| `pages` | pages, routes, sections and defaults. A [slug] page adds `collection` (and `parent`, the key of its list page) |
| `icons` | the icons your site can draw, by name; the icon picker offers exactly these ([Icons](#icons)) |
| `pages[].global` | one page of site-wide content (header, footer, SEO, theme), editable from every page ([Site-wide content](#site-wide-content-header-footer-seo-theme)) |
| `pages[].listOnEveryPage` | global page only: `false` lists its sections only under Site settings, not on every page |
| `fonts` | font names your site loads; fields ending in `font` offer exactly these |
| `styles` | presets and breakpoints of the Style tab: `colors`, `fontSizes`, `spacing`, `radii`, `breakpoints`, `enabled` ([Field styles](#field-styles-colour-size-spacing)) |
| `adapter` | where content is read from and saved to |
| `title` | heading of the CMS screen |
| `publicSiteUrl` | site base URL when the CMS runs on another origin |
| `allowedOrigins` | extra origins allowed to exchange preview messages |
| `collectionLimits` | maximum items per list, e.g. `{ 'home.features.items': { max: 6, label: 'Feature cards' } }` |
| `imagePresets`, `imagePresetCategories` | ready-made images in the image picker |
| `widgets.code` | component for editing `{ html, css, js }` values |
| `sections[].transform` | normalise a section's data before it reaches the form |

### Components and functions

| Name | From | Use |
|---|---|---|
| `<CmsStudio config initialPage? onPageChange? toaster? />` | `/admin` | the CMS screen |
| `<CmsNavButton href active? label? as? className? />` | `/admin` | menu button for the CMS |
| `<CmsAuthGate auth loginPath? title?>` | `/admin` | show its children only to a signed-in editor; otherwise a sign-in form (or redirect to `loginPath`) |
| `<CmsLogin auth title? onSuccess? redirectTo?>` | `/admin` | the sign-in form (username + password) |
| `<CmsLogoutButton auth redirectTo? className?>` | `/admin` | sign out |
| `<CmsProvider config>` | `/site` | wrap the site once (root layout) |
| `usePageContent(pageKey, { initialData? })` | `/site` | read a page's content, with live preview in the CMS |
| `<CmsSection sectionKey title page? activeOnPath? buttonPlacement?>` | `/site` | make a block editable; `page="site"` for a site-wide block such as the navbar |
| `<CmsField path label?>` | `/site` | give one value inside a `<CmsSection>` its own pencil, with a Content and a Style tab |
| `<CmsField page? section path label?>` | `/site` | a value of another section, also outside any `<CmsSection>` (the site phone number in a page body) |
| `useSiteContent({ initialData? })` | `/site` | read the global page's content on any page, with live preview |
| `<CmsThemeStyle section? prefix? selector?>` | `/site` | write the global page's `theme` section as CSS variables |
| `<CmsField collection item path label?>` | `/site` | give one field of a database record its own pencil ([Pages with [slug] or [id]](#pages-with-slug-or-id)) |
| `useCollectionItem(collection, id, values)` | `/site` | a record's values with the editor's unsaved changes applied, in the preview |
| `<CmsIcon name fallback? …props>` | `/site` | draw an icon from `icons` of your config ([Icons](#icons)) |
| `getDynamicIcon(name)` | `/icons` | draw any lucide icon by name (adds the whole lucide icon set to your bundle) |
| `getPageContent(config, pageKey, { storage })` | `/next` | load a page's content on the server |
| `getAllPageContent(config, { storage })` | `/next` | load every page's content on the server, for `<CmsProvider initialContent>` (used by the generated `CmsProviders`) |
| `getPageMetadata(config, pageKey, { storage, fallback?, site? })` | `/next` | build Next.js metadata from the `seo` section, with the site SEO as defaults |
| `getSiteMetadata(config, { storage, fallback?, section? })` | `/next` | root-layout metadata from the global page: title template, site name, share image, favicon |
| `themeToCss(theme, { prefix?, selector? })` | `@brainicon/storio-elements-editor` | the same CSS variables as `<CmsThemeStyle>`, as text, for server code |
| `createCmsRouteHandler({ storage, authorize, collections?, … })` | `/next` | the API route; `collections` serves records of [slug] pages |
| `fileStorage()` | `/next` | JSON-file storage |
| `isCmsPreviewRequest(request, { studioPath? })` | `/next` | let the preview through middleware |
| `restAdapter`, `djangoAdapter`, `memoryAdapter` | `/adapters` | storage adapters for the browser |
| `cmsAuth({ baseUrl, storageKey?, storage? })` | `/adapters` | token sign-in for the Django backend: `login`, `logout`, `check`, `getToken`, `headers`. `storage`: `'local'` (default), `'session'` (forgotten when the browser closes), `'memory'` |
| `defineCms`, types, merge helpers | `@brainicon/storio-elements-editor` | configuration and types |

All imports are `@brainicon/storio-elements-editor` plus the path shown (for example `@brainicon/storio-elements-editor/admin`).

### Security

- Who may edit is decided on the server: `authorize` on the API route (files backend) or Django's staff check / your `AUTHORIZE` function (Django backend). `<CmsAuthGate>` only guards the screen, so protect any other API of yours on the server too.
- The token login is rate limited (5 wrong passwords per username and address, then a 5 minute lockout), tokens expire (12 hours), and they stop working when the user's password changes or the account is deactivated. The token is kept in the browser's `localStorage`, so serve the site over HTTPS and keep it free of third-party scripts you do not trust.
- Visitors only ever receive published content. Drafts are returned only when `authorize` passes.
- Page and section keys are validated (`A–Z a–z 0–9 _ -`). Uploads are limited to image types (no SVG by default) and a size cap, and are saved under random names.
- Preview messages are sent only to the configured origins and are ignored from any other origin or window.

### Redirects and the preview iframe

The CMS shows your real pages in an iframe. If your `middleware.ts` redirects some requests (to a login page, an admin host, or by locale), let the preview through:

```ts
import { isCmsPreviewRequest } from '@brainicon/storio-elements-editor/next';

if (!isCmsPreviewRequest(request, { studioPath: '/admin/cms' })) {
  // ...your redirect
}
```

---

## 9. Updating

Install a newer release by its tag, then restart the dev server:

```bash
npm install github:MostofaSeum/storio-elements-editor#v1.3.0     # use the new tag
rm -rf .next                                               # PowerShell: Remove-Item -Recurse -Force .next
```

With Django, update the Python package too: run `npx storio-editor init --django-dir <folder>` again (it reinstalls the copy shipped in the package and changes nothing else), or `pip install "git+https://github.com/MostofaSeum/storio-elements-editor.git@v1.3.0#subdirectory=django-storio-elements-editor"`.

### Upgrading from `@brainicon/visual-cms`

Version 1.0.0 renamed the library from Visual CMS to **Storio Elements Editor**. Components, the config file, saved content and the database stay the same; only the names below changed.

| Before | Now |
| --- | --- |
| `@brainicon/visual-cms` (npm package and imports) | `@brainicon/storio-elements-editor` |
| `npx visual-cms ...` | `npx storio-editor ...` |
| `django-visual-cms` (pip package) | `django-storio-elements-editor` |
| `"visual_cms"` in `INSTALLED_APPS` | `"storio_elements_editor"` |
| `include("visual_cms.urls")` | `include("storio_elements_editor.urls")` |
| `VISUAL_CMS = {...}` in settings | `STORIO_EDITOR = {...}` (the old name still works) |

1. `npm uninstall @brainicon/visual-cms`, then install the new tag as shown above.
2. Replace `@brainicon/visual-cms` with `@brainicon/storio-elements-editor` in every import and in the `@source` line of your global CSS.
3. With Django: `pip uninstall django-visual-cms`, then run `npx storio-editor init --django-dir <folder>`. It installs the new package and updates `INSTALLED_APPS` and `urls.py` for you. No migration is needed: the existing table and records are kept.
4. Delete `.next` and restart the dev server.

### Development

```bash
git clone https://github.com/MostofaSeum/storio-elements-editor.git
cd storio-elements-editor
npm install
npm run typecheck
npm test
npm run build
```

`dist/` is committed, because installing from GitHub uses it directly (there is no build step on the user's machine). **Run `npm run build` and commit `dist/` together with every source change.** To release: update the version in `package.json`, `package-lock.json`, `django-storio-elements-editor/pyproject.toml`, `django-storio-elements-editor/storio_elements_editor/__init__.py`, both READMEs and `examples/next-demo/package.json`. Run `npm run build`, confirm it exits with code 0 and that every file listed under `exports` exists, stage the build with `git add -A dist`, commit, then tag and push: `git tag vX.Y.Z && git push origin main vX.Y.Z`.

The Django package has its own tests: `cd django-storio-elements-editor && python -m django test tests --settings=tests.settings` (set `PYTHONPATH=.` first).

## License

MIT
