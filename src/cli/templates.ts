/** Source text of the files `storio-editor init` creates. */

export type Backend = 'files' | 'django';

/** How editors sign in with the Django backend. */
export type AuthMode = 'token' | 'session';

export function cmsConfig(opts: { backend: Backend; apiUrl: string; example: boolean; exampleJsonImport: string; auth?: AuthMode }): string {
  const token = opts.backend === 'django' && (opts.auth ?? 'token') === 'token';
  const adapterImport =
    opts.backend === 'django'
      ? token
        ? "import { cmsAuth, djangoAdapter } from '@brainicon/storio-elements-editor/adapters';"
        : "import { djangoAdapter } from '@brainicon/storio-elements-editor/adapters';"
      : "import { restAdapter } from '@brainicon/storio-elements-editor/adapters';";
  const adapter =
    opts.backend === 'django'
      ? token
        ? 'djangoAdapter({ baseUrl: API_URL, headers: cmsLogin.headers }),'
        : 'djangoAdapter({ baseUrl: API_URL }),'
      : "restAdapter({ baseUrl: '/api/cms' }),";
  const apiSetup =
    opts.backend !== 'django'
      ? ''
      : `
// Set NEXT_PUBLIC_CMS_API_URL in production, e.g. https://api.example.com/api/cms
const API_URL = process.env.NEXT_PUBLIC_CMS_API_URL ?? '${opts.apiUrl}';
${
  token
    ? `
// Editors sign in with their Django staff username and password (<CmsAuthGate> shows the form).
export const cmsLogin = cmsAuth({ baseUrl: API_URL });
`
    : ''
}`;

  const examplePage = `    {
      key: 'example',
      title: 'Example page',
      route: '/cms-example',
      defaults: example,
      sections: [
        { key: 'hero', label: '1. Hero' },
        { key: 'features', label: '2. Features' },
      ],
    },`;

  const noPages = `    // Add your pages here. For each page: a key, its public route, its sections,
    // and "defaults" (the content shown until someone edits a section).
    //
    // {
    //   key: 'home',
    //   title: 'Home',
    //   route: '/',
    //   defaults: homeContent,
    //   sections: [{ key: 'hero', label: 'Hero' }],
    // },`;

  const globalPageHint = `    // Site-wide content (navbar, footer, contact details, SEO defaults, theme colours):
    // one page with global: true. Its sections can be edited from every page in the studio.
    // Read it with useSiteContent(), and wrap the navbar in <CmsSection sectionKey="header" page="site">.
    //
    // {
    //   key: 'site',
    //   title: 'Site settings',
    //   route: '/',
    //   global: true,
    //   defaults: siteContent,
    //   sections: [
    //     { key: 'header', label: 'Header' },
    //     { key: 'footer', label: 'Footer' },
    //     { key: 'contact', label: 'Contact & social' },
    //     { key: 'seo', label: 'SEO defaults' },
    //     { key: 'theme', label: 'Theme' },
    //   ],
    // },`;

  return `import { defineCms } from '@brainicon/storio-elements-editor';
${adapterImport}
${opts.example ? `import example from '${opts.exampleJsonImport}';\n` : ''}${apiSetup}
export const cms = defineCms({
  title: 'Site CMS',
  adapter: ${adapter}
  pages: [
${opts.example ? examplePage : noPages}
${globalPageHint}
  ],
});
`;
}

export const exampleContentJson = `{
  "hero": {
    "title": "Edit me from the CMS",
    "subtitle": "This example page shows how a page becomes editable.",
    "image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200"
  },
  "features": {
    "title": "What you can change",
    "items": [
      { "id": "f1", "title": "Text", "text": "Edit any heading or paragraph." },
      { "id": "f2", "title": "Images", "text": "Pick or upload an image." },
      { "id": "f3", "title": "Lists", "text": "Add, remove and reorder items." }
    ]
  }
}
`;

export function filesStorage(): string {
  return `import { fileStorage } from '@brainicon/storio-elements-editor/next';

// Edits are saved to .cms/content.json and uploads to public/cms-uploads.
// Fine for local development and a single server. On read-only or multi-instance
// hosts (for example Vercel) use a database-backed storage adapter instead.
export const storage = fileStorage();
`;
}

export function djangoStorage(cmsConfigImport: string): string {
  return `import { cms } from '${cmsConfigImport}';

// Server-side reads of published content go straight to Django through the same adapter.
export const storage = cms.adapter;
`;
}

export function apiRoute(opts: { storageImport: string; configImport: string }): string {
  return `import { createCmsRouteHandler } from '@brainicon/storio-elements-editor/next';
import { storage } from '${opts.storageImport}';
import { cms } from '${opts.configImport}';

export const { GET, PUT, DELETE, POST } = createCmsRouteHandler({
  storage,
  allowedPages: cms.pages.map((p) => p.key),
  // TODO before deploying: replace this with a real check of your own login or session, e.g.
  //   authorize: async (req) => (await getSession(req))?.role === 'admin',
  // Until then, editing only works while running \`next dev\`.
  authorize: () => process.env.NODE_ENV === 'development',
});
`;
}

/** The client provider generated by versions before 0.3 (used to recognise and upgrade it). */
export function providersV1(configImport: string): string {
  return `'use client';

import { CmsProvider } from '@brainicon/storio-elements-editor/site';
import { cms } from '${configImport}';

export function CmsProviders({ children }: { children: React.ReactNode }) {
  return <CmsProvider config={cms}>{children}</CmsProvider>;
}
`;
}

/** How the server loads published content, depending on the Next.js setup. */
export type RenderMode = 'cache' | 'connection' | 'nostore';

/**
 * Server component for the root layout: loads every page's published content on the
 * server, so the HTML already contains the edited text (SEO), then hands it to the
 * client provider.
 */
export function providers(opts: { configImport: string; storageImport: string; clientImport: string; mode: RenderMode }): string {
  const imports = {
    cache: "import { cacheLife } from 'next/cache';",
    connection: "import { connection } from 'next/server';",
    nostore: "import { unstable_noStore as noStore } from 'next/cache';",
  }[opts.mode];

  const loader =
    opts.mode === 'cache'
      ? `// cacheComponents is on: cache the content briefly instead of rendering every request.
// Visitors' browsers still fetch the latest content right after the page loads.
async function loadContent() {
  'use cache';
  cacheLife('minutes');
  return getAllPageContent(cms, { storage });
}

export async function CmsProviders({ children }: { children: React.ReactNode }) {
  const initialContent = await loadContent();
  return <CmsClientProviders initialContent={initialContent}>{children}</CmsClientProviders>;
}`
      : `export async function CmsProviders({ children }: { children: React.ReactNode }) {
  // Content can change at any moment from the CMS, so read it on every request.
  ${opts.mode === 'connection' ? 'await connection();' : 'noStore();'}
  const initialContent = await getAllPageContent(cms, { storage });
  return <CmsClientProviders initialContent={initialContent}>{children}</CmsClientProviders>;
}`;

  return `${imports}
import { getAllPageContent } from '@brainicon/storio-elements-editor/next';
import { cms } from '${opts.configImport}';
import { storage } from '${opts.storageImport}';
import { CmsClientProviders } from '${opts.clientImport}';

// Published content of every CMS page is loaded on the server and passed down, so the
// HTML already contains the edited text (good for SEO, no flash of default content).
${loader}
`;
}

export function clientProviders(configImport: string): string {
  return `'use client';

import { CmsProvider } from '@brainicon/storio-elements-editor/site';
import { cms } from '${configImport}';

export function CmsClientProviders({
  initialContent,
  children,
}: {
  initialContent?: Record<string, Record<string, unknown>>;
  children: React.ReactNode;
}) {
  return (
    <CmsProvider config={cms} initialContent={initialContent}>
      {children}
    </CmsProvider>
  );
}
`;
}

export function adminPage(configImport: string, auth?: { mode: AuthMode; backend: Backend }): string {
  if (auth && auth.backend === 'django' && auth.mode === 'token') {
    return `'use client';

import { CmsAuthGate, CmsStudio } from '@brainicon/storio-elements-editor/admin';
import { cms, cmsLogin } from '${configImport}';

// Editors must sign in (Django staff username and password) before the CMS screen shows.
export default function CmsPage() {
  return (
    <CmsAuthGate auth={cmsLogin}>
      <CmsStudio config={cms} />
    </CmsAuthGate>
  );
}
`;
  }
  return `'use client';

import { CmsStudio } from '@brainicon/storio-elements-editor/admin';
import { cms } from '${configImport}';

export default function CmsPage() {
  return <CmsStudio config={cms} />;
}
`;
}

export function adminLayout(opts: { href: string }): string {
  return `'use client';

import Link from 'next/link';
import { CmsNavButton } from '@brainicon/storio-elements-editor/admin';

// A minimal admin shell. If you already have an admin layout, delete this file and
// put the <CmsNavButton> line into your own menu instead.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-56 shrink-0 border-r border-slate-800 p-4">
        <div className="px-4 pb-4 font-bold text-white">Admin</div>
        <CmsNavButton href="${opts.href}" as={Link} active />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
`;
}

export function examplePage(opts: { viewImport: string }): string {
  return `import { CmsExampleView } from '${opts.viewImport}';

// The published content is loaded on the server by <CmsProviders> in the root layout,
// so this page needs no data fetching of its own.
export default function CmsExamplePage() {
  return <CmsExampleView />;
}
`;
}

export function exampleView(jsonImport: string): string {
  return `'use client';

import { CmsField, CmsSection, usePageContent } from '@brainicon/storio-elements-editor/site';
import type example from '${jsonImport}';

type ExampleContent = typeof example;

/**
 * How a page becomes editable:
 *   1. its text lives in a content object (content/cms-example.json),
 *   2. usePageContent('<page key>') reads it,
 *   3. each editable block is wrapped in <CmsSection sectionKey="..." title="...">,
 *   4. each value that needs its own pencil is wrapped in <CmsField path="...">.
 */
export function CmsExampleView() {
  const { hero, features } = usePageContent<ExampleContent>('example');

  return (
    <main>
      <CmsSection sectionKey="hero" title="Hero">
        <section className="mx-auto grid max-w-5xl items-center gap-8 px-6 py-20 md:grid-cols-2">
          <div>
            <h1 className="text-5xl font-bold"><CmsField path="title" label="Title">{hero.title}</CmsField></h1>
            <p className="mt-4 text-lg text-gray-600"><CmsField path="subtitle" label="Subtitle">{hero.subtitle}</CmsField></p>
          </div>
          <CmsField path="image" label="Image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero.image} alt="" className="rounded-2xl" />
          </CmsField>
        </section>
      </CmsSection>

      <CmsSection sectionKey="features" title="Features">
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-6 text-3xl font-bold"><CmsField path="title" label="Title">{features.title}</CmsField></h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.items.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-gray-200 p-6">
                <h3 className="mb-1 font-semibold"><CmsField path={\`items.\${index}.title\`} label="Card title">{item.title}</CmsField></h3>
                <p className="text-sm text-gray-600"><CmsField path={\`items.\${index}.text\`} label="Card text">{item.text}</CmsField></p>
              </div>
            ))}
          </div>
        </section>
      </CmsSection>
    </main>
  );
}
`;
}
