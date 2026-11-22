#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/cli/index.ts
var cli_exports = {};
__export(cli_exports, {
  main: () => main
});
module.exports = __toCommonJS(cli_exports);
var import_node_fs6 = __toESM(require("fs"));
var import_node_path8 = __toESM(require("path"));
var import_promises = __toESM(require("readline/promises"));

// src/cli/init.ts
var import_node_fs2 = __toESM(require("fs"));
var import_node_path3 = __toESM(require("path"));
var import_node_child_process2 = require("child_process");

// src/cli/edit.ts
var import_node_path = __toESM(require("path"));
var eolOf = (text) => text.includes("\r\n") ? "\r\n" : "\n";
function addImportLine(source, line) {
  const eol = eolOf(source);
  const lines = source.split(/\r?\n/);
  let inImport = false;
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!inImport && /^import\b/.test(lines[i])) inImport = true;
    if (inImport && /['"][^'"\n]+['"]\s*;?\s*(\/\/.*)?$/.test(lines[i])) {
      lastImportLine = i;
      inImport = false;
    }
  }
  if (lastImportLine >= 0) {
    lines.splice(lastImportLine + 1, 0, line);
  } else {
    let at = 0;
    while (at < lines.length && /^\s*(['"]use [a-z ]+['"];?|\/\/.*|)\s*$/.test(lines[at]) && lines[at].trim() !== "") at++;
    lines.splice(at, 0, line, "");
  }
  return lines.join(eol);
}
function wrapLayoutWithProviders(source, importSpecifier2) {
  if (/\bCmsProviders\b/.test(source)) return { source, status: "already" };
  const bodyIndex = source.search(/<body[\s>]/);
  if (bodyIndex === -1) {
    return { source, status: "manual", reason: "no <body> element found in the layout" };
  }
  const childrenPattern = /\{\s*children\s*\}/g;
  childrenPattern.lastIndex = bodyIndex;
  const match = childrenPattern.exec(source);
  if (!match) {
    return { source, status: "manual", reason: "no {children} found inside <body>" };
  }
  const wrapped = source.slice(0, match.index) + "<CmsProviders>{children}</CmsProviders>" + source.slice(match.index + match[0].length);
  return {
    source: addImportLine(wrapped, `import { CmsProviders } from '${importSpecifier2}';`),
    status: "changed"
  };
}
function addTailwindSource(css, relativeDistPath) {
  if (/storio-elements-editor\/dist/.test(css)) return { source: css, status: "already" };
  const importMatch = css.match(/@import\s+(["'])tailwindcss\1[^;\n]*;/);
  if (!importMatch || importMatch.index === void 0) {
    const reason = /@tailwind\s+base/.test(css) ? "this looks like Tailwind CSS v3; the library needs Tailwind v4" : 'no `@import "tailwindcss";` found in this file';
    return { source: css, status: "manual", reason };
  }
  const eol = eolOf(css);
  const end = importMatch.index + importMatch[0].length;
  return {
    source: `${css.slice(0, end)}${eol}@source "${relativeDistPath}";${css.slice(end)}`,
    status: "changed"
  };
}
function addGitignoreEntries(text, entries) {
  const present = new Set(text.split(/\r?\n/).map((l) => l.trim().replace(/^\//, "").replace(/\/$/, "")));
  const added = entries.filter((e) => !present.has(e.replace(/\/$/, "")));
  if (added.length === 0) return { source: text, added };
  const eol = eolOf(text);
  const prefix = text.length === 0 || text.endsWith("\n") ? "" : eol;
  return {
    source: `${text}${prefix}${eol}# storio-editor content and uploads${eol}${added.join(eol)}${eol}`,
    added
  };
}
function detectAlias(tsconfigText, projectRoot) {
  const match = tsconfigText.match(/"@\/\*"\s*:\s*\[\s*"([^"]+)"/);
  if (!match) return null;
  const baseUrl = tsconfigText.match(/"baseUrl"\s*:\s*"([^"]+)"/)?.[1];
  const base = baseUrl ? import_node_path.default.resolve(projectRoot, baseUrl) : projectRoot;
  return { root: import_node_path.default.resolve(base, match[1].replace(/\/?\*$/, "")) };
}
var toPosix = (p) => p.split(import_node_path.default.sep).join("/");
function importSpecifier(from, target, alias) {
  const withoutExt = /\.(ts|tsx)$/.test(target) ? target.replace(/\.(ts|tsx)$/, "") : target;
  if (alias) {
    const inside = import_node_path.default.relative(alias.root, withoutExt);
    if (inside && !inside.startsWith("..") && !import_node_path.default.isAbsolute(inside)) return `@/${toPosix(inside)}`;
  }
  const relative = toPosix(import_node_path.default.relative(import_node_path.default.dirname(from), withoutExt));
  return relative.startsWith(".") ? relative : `./${relative}`;
}

// src/cli/django.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path2 = __toESM(require("path"));
var import_node_child_process = require("child_process");
var SKIP = /* @__PURE__ */ new Set(["venv", ".venv", "env", "node_modules", ".git", "__pycache__", "site-packages", "build", "dist", ".next"]);
function findDjangoProject(start) {
  const root = import_node_path2.default.resolve(start);
  if (import_node_fs.default.existsSync(import_node_path2.default.join(root, "manage.py"))) return { dir: root };
  const found = [];
  const walk2 = (dir, depth) => {
    if (depth > 2) return;
    let entries;
    try {
      entries = import_node_fs.default.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP.has(entry.name) || entry.name.startsWith(".")) continue;
      const child = import_node_path2.default.join(dir, entry.name);
      if (import_node_fs.default.existsSync(import_node_path2.default.join(child, "manage.py"))) found.push(child);
      else walk2(child, depth + 1);
    }
  };
  walk2(root, 1);
  return found.length === 1 ? { dir: found[0] } : null;
}
function findPython(djangoDir) {
  const bin = process.platform === "win32" ? import_node_path2.default.join("Scripts", "python.exe") : import_node_path2.default.join("bin", "python");
  for (const base of [djangoDir, import_node_path2.default.dirname(djangoDir)]) {
    for (const name of ["venv", ".venv", "env"]) {
      const candidate = import_node_path2.default.join(base, name, bin);
      if (import_node_fs.default.existsSync(candidate)) return { command: candidate, venv: true };
    }
  }
  return { command: process.platform === "win32" ? "python" : "python3", venv: false };
}
function djangoPackageDir() {
  for (const rel of [["..", "django-storio-elements-editor"], ["..", "..", "django-storio-elements-editor"]]) {
    const candidate = import_node_path2.default.resolve(__dirname, ...rel);
    if (import_node_fs.default.existsSync(import_node_path2.default.join(candidate, "pyproject.toml"))) return candidate;
  }
  return null;
}
function runDjangoSetup(opts) {
  const { command, venv } = findPython(opts.djangoDir);
  const pkgDir = djangoPackageDir();
  if (!pkgDir) {
    return { ok: false, python: command, venv, problem: "The django-storio-elements-editor folder was not found inside the installed library." };
  }
  const run = (args2, env2 = process.env) => (0, import_node_child_process.spawnSync)(command, args2, { cwd: opts.djangoDir, stdio: "inherit", env: env2, shell: false });
  const probe = (0, import_node_child_process.spawnSync)(command, ["--version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) {
    return { ok: false, python: command, venv, problem: `Could not run Python (${command}). Activate your virtual environment or install Python.` };
  }
  let env = process.env;
  if (opts.dryRun) {
    env = { ...process.env, PYTHONPATH: [pkgDir, process.env.PYTHONPATH].filter(Boolean).join(import_node_path2.default.delimiter) };
  } else {
    const install = run(["-m", "pip", "install", "--quiet", "--disable-pip-version-check", pkgDir]);
    if (install.status !== 0) {
      return { ok: false, python: command, venv, problem: `pip could not install django-storio-elements-editor from ${pkgDir}.` };
    }
  }
  const args = ["-m", "storio_elements_editor", "setup", "--project", opts.djangoDir, "--frontend-origin", opts.frontendOrigin];
  if (opts.dryRun) args.push("--dry-run");
  const setup = run(args, env);
  if (setup.status !== 0) {
    return { ok: false, python: command, venv, problem: "The Django setup step reported an error (see the message above)." };
  }
  return { ok: true, python: command, venv };
}

// src/cli/templates.ts
function cmsConfig(opts) {
  const token = opts.backend === "django" && (opts.auth ?? "token") === "token";
  const adapterImport = opts.backend === "django" ? token ? "import { cmsAuth, djangoAdapter } from '@brainicon/storio-elements-editor/adapters';" : "import { djangoAdapter } from '@brainicon/storio-elements-editor/adapters';" : "import { restAdapter } from '@brainicon/storio-elements-editor/adapters';";
  const adapter = opts.backend === "django" ? token ? "djangoAdapter({ baseUrl: API_URL, headers: cmsLogin.headers })," : "djangoAdapter({ baseUrl: API_URL })," : "restAdapter({ baseUrl: '/api/cms' }),";
  const apiSetup = opts.backend !== "django" ? "" : `
// Set NEXT_PUBLIC_CMS_API_URL in production, e.g. https://api.example.com/api/cms
const API_URL = process.env.NEXT_PUBLIC_CMS_API_URL ?? '${opts.apiUrl}';
${token ? `
// Editors sign in with their Django staff username and password (<CmsAuthGate> shows the form).
export const cmsLogin = cmsAuth({ baseUrl: API_URL });
` : ""}`;
  const examplePage2 = `    {
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
${opts.example ? `import example from '${opts.exampleJsonImport}';
` : ""}${apiSetup}
export const cms = defineCms({
  title: 'Site CMS',
  adapter: ${adapter}
  pages: [
${opts.example ? examplePage2 : noPages}
${globalPageHint}
  ],
});
`;
}
var exampleContentJson = `{
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
function filesStorage() {
  return `import { fileStorage } from '@brainicon/storio-elements-editor/next';

// Edits are saved to .cms/content.json and uploads to public/cms-uploads.
// Fine for local development and a single server. On read-only or multi-instance
// hosts (for example Vercel) use a database-backed storage adapter instead.
export const storage = fileStorage();
`;
}
function djangoStorage(cmsConfigImport) {
  return `import { cms } from '${cmsConfigImport}';

// Server-side reads of published content go straight to Django through the same adapter.
export const storage = cms.adapter;
`;
}
function apiRoute(opts) {
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
function providersV1(configImport) {
  return `'use client';

import { CmsProvider } from '@brainicon/storio-elements-editor/site';
import { cms } from '${configImport}';

export function CmsProviders({ children }: { children: React.ReactNode }) {
  return <CmsProvider config={cms}>{children}</CmsProvider>;
}
`;
}
function providers(opts) {
  const imports = {
    cache: "import { cacheLife } from 'next/cache';",
    connection: "import { connection } from 'next/server';",
    nostore: "import { unstable_noStore as noStore } from 'next/cache';"
  }[opts.mode];
  const loader = opts.mode === "cache" ? `// cacheComponents is on: cache the content briefly instead of rendering every request.
// Visitors' browsers still fetch the latest content right after the page loads.
async function loadContent() {
  'use cache';
  cacheLife('minutes');
  return getAllPageContent(cms, { storage });
}

export async function CmsProviders({ children }: { children: React.ReactNode }) {
  const initialContent = await loadContent();
  return <CmsClientProviders initialContent={initialContent}>{children}</CmsClientProviders>;
}` : `export async function CmsProviders({ children }: { children: React.ReactNode }) {
  // Content can change at any moment from the CMS, so read it on every request.
  ${opts.mode === "connection" ? "await connection();" : "noStore();"}
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
function clientProviders(configImport) {
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
function adminPage(configImport, auth) {
  if (auth && auth.backend === "django" && auth.mode === "token") {
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
function adminLayout(opts) {
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
function examplePage(opts) {
  return `import { CmsExampleView } from '${opts.viewImport}';

// The published content is loaded on the server by <CmsProviders> in the root layout,
// so this page needs no data fetching of its own.
export default function CmsExamplePage() {
  return <CmsExampleView />;
}
`;
}
function exampleView(jsonImport) {
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

// src/cli/init.ts
var CliError = class extends Error {
};
var LIB = "@brainicon/storio-elements-editor";
var PEERS = ["lucide-react", "react-hot-toast"];
var exists = (p) => import_node_fs2.default.existsSync(p);
var read = (p) => import_node_fs2.default.readFileSync(p, "utf8");
function firstExisting(base, names) {
  for (const name of names) {
    const candidate = import_node_path3.default.join(base, name);
    if (exists(candidate)) return candidate;
  }
  return null;
}
function detectPackageManager(root) {
  if (exists(import_node_path3.default.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (exists(import_node_path3.default.join(root, "yarn.lock"))) return "yarn";
  if (exists(import_node_path3.default.join(root, "bun.lockb")) || exists(import_node_path3.default.join(root, "bun.lock"))) return "bun";
  if (exists(import_node_path3.default.join(root, "package-lock.json"))) return "npm";
  const agent = process.env.npm_config_user_agent ?? "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  if (agent.startsWith("bun")) return "bun";
  return "npm";
}
function installArgs(pm, packages) {
  return pm === "npm" ? ["install", ...packages] : ["add", ...packages];
}
function findLibraryDir(root) {
  let dir = root;
  for (; ; ) {
    const candidate = import_node_path3.default.join(dir, "node_modules", "@brainicon", "storio-elements-editor");
    if (exists(candidate)) return candidate;
    const parent = import_node_path3.default.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
function runInit(options) {
  const root = import_node_path3.default.resolve(options.cwd);
  const actions = [];
  const warnings = [];
  const manual = [];
  const rel = (p) => import_node_path3.default.relative(root, p).split(import_node_path3.default.sep).join("/");
  const pkgPath = import_node_path3.default.join(root, "package.json");
  if (!exists(pkgPath)) {
    throw new CliError(`No package.json in ${root}. Run this command from the root of your Next.js project.`);
  }
  const pkg = JSON.parse(read(pkgPath));
  const deps = { ...pkg.devDependencies, ...pkg.dependencies };
  if (!deps.next) {
    throw new CliError('This does not look like a Next.js project (no "next" in package.json).');
  }
  const srcApp = import_node_path3.default.join(root, "src", "app");
  const plainApp = import_node_path3.default.join(root, "app");
  const appDir = exists(srcApp) ? srcApp : exists(plainApp) ? plainApp : null;
  if (!appDir) {
    throw new CliError(
      exists(import_node_path3.default.join(root, "pages")) || exists(import_node_path3.default.join(root, "src", "pages")) ? "Found the Pages Router only. The init command needs the App Router (an app/ folder)." : "Could not find an app/ or src/app/ folder. The init command needs the Next.js App Router."
    );
  }
  const base = appDir === srcApp ? import_node_path3.default.join(root, "src") : root;
  const tsconfigPath = import_node_path3.default.join(root, "tsconfig.json");
  if (!exists(tsconfigPath)) {
    throw new CliError("No tsconfig.json found. The init command generates TypeScript files, so it needs a TypeScript project.");
  }
  const tsconfigText = read(tsconfigPath);
  const alias = detectAlias(tsconfigText, root);
  if (!/"resolveJsonModule"\s*:\s*true/.test(tsconfigText)) {
    warnings.push('tsconfig.json does not enable "resolveJsonModule"; importing content/*.json may fail to type-check.');
  }
  const twVersion = deps.tailwindcss?.match(/\d+/)?.[0];
  if (!twVersion) warnings.push("Tailwind CSS is not installed. The CMS screens are styled with Tailwind v4.");
  else if (Number(twVersion) < 4) warnings.push(`Tailwind CSS v${twVersion} found. The CMS screens need Tailwind v4.`);
  let djangoDir = null;
  if (options.djangoDir) {
    if (options.backend !== "django") throw new CliError("--django-dir only makes sense with --backend django.");
    const project = findDjangoProject(import_node_path3.default.resolve(root, options.djangoDir));
    if (!project) {
      throw new CliError(
        `No Django project found at "${options.djangoDir}". Point --django-dir at the folder that contains manage.py (or the folder above it).`
      );
    }
    djangoDir = project.dir;
  }
  const nextMajor = Number(deps.next.match(/\d+/)?.[0] ?? 0);
  if (nextMajor && nextMajor < 14) warnings.push(`Next.js ${deps.next} found. The library supports Next.js 14 and newer.`);
  const adminSegments = options.adminPath.split("/").filter(Boolean);
  const adminUrlSegments = adminSegments.filter((segment) => !/^\(.+\)$/.test(segment));
  if (adminUrlSegments.length === 0) {
    throw new CliError(`The admin path "${options.adminPath}" has no URL part. Add a normal folder, for example "${options.adminPath}/cms".`);
  }
  const adminUrl = `/${adminUrlSegments.join("/")}`;
  const adminRoot = import_node_path3.default.join(appDir, adminSegments[0]);
  const adminRootExisted = exists(adminRoot);
  const files = {
    config: import_node_path3.default.join(base, "cms.config.ts"),
    storage: import_node_path3.default.join(base, "lib", "cms-storage.ts"),
    providers: import_node_path3.default.join(base, "components", "CmsProviders.tsx"),
    clientProviders: import_node_path3.default.join(base, "components", "CmsClientProviders.tsx"),
    exampleJson: import_node_path3.default.join(base, "content", "cms-example.json"),
    exampleView: import_node_path3.default.join(base, "components", "CmsExampleView.tsx"),
    apiRoute: import_node_path3.default.join(appDir, "api", "cms", "[...path]", "route.ts"),
    adminPage: import_node_path3.default.join(appDir, ...adminSegments, "page.tsx"),
    adminLayout: import_node_path3.default.join(adminRoot, "layout.tsx"),
    examplePage: import_node_path3.default.join(appDir, "cms-example", "page.tsx")
  };
  const imp = (from, target) => importSpecifier(from, target, alias);
  const writeNew = (file, content, note) => {
    if (exists(file)) {
      if (read(file) === content) {
        actions.push({ kind: "unchanged", file: rel(file) });
        return;
      }
      if (!options.force) {
        actions.push({ kind: "skipped", file: rel(file), note: note ?? "already exists (use --force to overwrite)" });
        return;
      }
      if (!options.dryRun) import_node_fs2.default.writeFileSync(file, content);
      actions.push({ kind: "overwritten", file: rel(file) });
      return;
    }
    if (!options.dryRun) {
      import_node_fs2.default.mkdirSync(import_node_path3.default.dirname(file), { recursive: true });
      import_node_fs2.default.writeFileSync(file, content);
    }
    actions.push({ kind: "created", file: rel(file) });
  };
  const modify = (file, content, note) => {
    if (!options.dryRun) import_node_fs2.default.writeFileSync(file, content);
    actions.push({ kind: "modified", file: rel(file), note });
  };
  const jsonSpec = (from) => imp(from, files.exampleJson);
  writeNew(
    files.config,
    cmsConfig({
      backend: options.backend,
      apiUrl: options.apiUrl,
      example: options.example,
      exampleJsonImport: jsonSpec(files.config),
      auth: options.auth
    }),
    "already exists. Make sure it lists your pages and uses the adapter you want."
  );
  if (options.backend === "files") {
    writeNew(files.storage, filesStorage());
    writeNew(files.apiRoute, apiRoute({ storageImport: imp(files.apiRoute, files.storage), configImport: imp(files.apiRoute, files.config) }));
  } else {
    writeNew(files.storage, djangoStorage(imp(files.storage, files.config)));
  }
  const nextConfigFile = firstExisting(root, ["next.config.ts", "next.config.mjs", "next.config.js", "next.config.cjs"]);
  const cacheComponents = nextConfigFile ? /cacheComponents\s*:\s*true/.test(read(nextConfigFile)) : false;
  const renderMode = cacheComponents ? "cache" : nextMajor >= 15 || !nextMajor ? "connection" : "nostore";
  writeNew(files.clientProviders, clientProviders(imp(files.clientProviders, files.config)));
  const providersSource = providers({
    configImport: imp(files.providers, files.config),
    storageImport: imp(files.providers, files.storage),
    clientImport: imp(files.providers, files.clientProviders),
    mode: renderMode
  });
  if (exists(files.providers) && read(files.providers) === providersV1(imp(files.providers, files.config)) && read(files.providers) !== providersSource) {
    if (!options.dryRun) import_node_fs2.default.writeFileSync(files.providers, providersSource);
    actions.push({ kind: "overwritten", file: rel(files.providers), note: "upgraded: content is now loaded on the server (SEO)" });
  } else {
    writeNew(files.providers, providersSource);
  }
  writeNew(files.adminPage, adminPage(imp(files.adminPage, files.config), { mode: options.auth ?? "token", backend: options.backend }));
  const adminLayoutSource = adminLayout({ href: adminUrl });
  const adminLayoutIsOurs = exists(files.adminLayout) && read(files.adminLayout) === adminLayoutSource;
  if (!adminRootExisted || adminLayoutIsOurs) {
    writeNew(files.adminLayout, adminLayoutSource);
  }
  if (options.example) {
    writeNew(files.exampleJson, exampleContentJson);
    writeNew(files.exampleView, exampleView(jsonSpec(files.exampleView)));
    writeNew(
      files.examplePage,
      examplePage({ viewImport: imp(files.examplePage, files.exampleView) })
    );
  }
  const layoutFile = firstExisting(appDir, ["layout.tsx", "layout.jsx", "layout.js"]);
  if (!layoutFile) {
    manual.push(`Wrap your root layout's {children} with <CmsProviders> (from ${imp(import_node_path3.default.join(appDir, "layout.tsx"), files.providers)}).`);
  } else {
    const result = wrapLayoutWithProviders(read(layoutFile), imp(layoutFile, files.providers));
    if (result.status === "changed") modify(layoutFile, result.source, "wrapped {children} with <CmsProviders>");
    else if (result.status === "already") actions.push({ kind: "unchanged", file: rel(layoutFile), note: "already wrapped" });
    else {
      actions.push({ kind: "skipped", file: rel(layoutFile), note: result.reason });
      manual.push(
        `In ${rel(layoutFile)}: import { CmsProviders } from '${imp(layoutFile, files.providers)}' and wrap {children} inside <body> with <CmsProviders>.`
      );
    }
  }
  const cssFile = findGlobalCss(appDir, layoutFile, alias);
  const libDir = findLibraryDir(root) ?? import_node_path3.default.join(root, "node_modules", "@brainicon", "storio-elements-editor");
  if (!cssFile) {
    manual.push(
      `Add this line to your global CSS, below @import "tailwindcss";   @source "<path to node_modules>/${LIB}/dist";`
    );
  } else {
    const relDist = import_node_path3.default.relative(import_node_path3.default.dirname(cssFile), import_node_path3.default.join(libDir, "dist")).split(import_node_path3.default.sep).join("/");
    const result = addTailwindSource(read(cssFile), relDist.startsWith(".") ? relDist : `./${relDist}`);
    if (result.status === "changed") modify(cssFile, result.source, "added Tailwind @source line");
    else if (result.status === "already") actions.push({ kind: "unchanged", file: rel(cssFile), note: "@source already present" });
    else {
      actions.push({ kind: "skipped", file: rel(cssFile), note: result.reason });
      manual.push(`In ${rel(cssFile)}: add   @source "${relDist}";   (Tailwind needs it to style the CMS screens; ${result.reason}).`);
    }
  }
  const gitignore = import_node_path3.default.join(root, ".gitignore");
  if (options.backend === "files" && exists(gitignore)) {
    const result = addGitignoreEntries(read(gitignore), [".cms", "public/cms-uploads"]);
    if (result.added.length > 0) modify(gitignore, result.source, `ignored ${result.added.join(", ")}`);
    else actions.push({ kind: "unchanged", file: ".gitignore" });
  }
  const middleware = firstExisting(base, ["middleware.ts", "middleware.js"]) ?? firstExisting(root, ["middleware.ts", "middleware.js"]);
  if (middleware) {
    manual.push(
      `${rel(middleware)} exists. If it redirects visitors (login wall, locale), let the CMS preview through: import { isCmsPreviewRequest } from '${LIB}/next' and skip the redirect when isCmsPreviewRequest(request, { studioPath: '${adminUrl}' }).`
    );
  }
  const missing = [...deps[LIB] ? [] : [LIB], ...PEERS.filter((p) => !deps[p])];
  const packageManager = detectPackageManager(root);
  const installed = [];
  let installCommand = null;
  if (missing.length > 0) {
    installCommand = `${packageManager} ${installArgs(packageManager, missing).join(" ")}`;
    if (options.install && !options.dryRun) {
      const result = (0, import_node_child_process2.spawnSync)(packageManager, installArgs(packageManager, missing), {
        cwd: root,
        stdio: "inherit",
        shell: process.platform === "win32"
      });
      if (result.status === 0) installed.push(...missing);
      else warnings.push(`Installing dependencies failed. Run it yourself:  ${installCommand}`);
    } else if (!options.dryRun) {
      manual.push(`Install the missing dependencies:  ${installCommand}`);
    }
  }
  if (options.backend === "files") {
    warnings.push(
      `${rel(files.apiRoute)} only allows editing while running \`next dev\`. Replace its authorize() with a check of your own login before deploying.`
    );
  }
  if (options.backend === "django") {
    manual.push(
      'Before deploying: set NEXT_PUBLIC_CMS_API_URL to your production API (for example https://api.example.com/api/cms), then run  npx storio-editor doctor --production --api-url <that URL> --frontend-origin <your site URL>  (see the README, "Deploying to production").'
    );
  }
  if (options.backend === "files") {
  } else if (djangoDir) {
    console.log(`
Setting up Django in ${djangoDir} ...`);
    const result = runDjangoSetup({ djangoDir, frontendOrigin: options.frontendOrigin ?? "http://localhost:3000", dryRun: options.dryRun });
    if (!result.ok) {
      warnings.push(`Django setup did not finish: ${result.problem} Do it by hand: see the steps below.`);
      manual.push(...djangoSteps());
    } else if (!result.venv && !options.dryRun) {
      warnings.push(`No virtual environment found next to the Django project, so "${result.python}" from your PATH was used. Check that this is the Python your Django project runs on.`);
    }
  } else {
    manual.push(...djangoSteps());
  }
  if (adminRootExisted && !adminLayoutIsOurs) {
    manual.push(
      `Add the CMS button to your admin menu:  <CmsNavButton href="${adminUrl}" />  (from '${LIB}/admin'; pass as={Link} for client-side navigation), or any plain link.`
    );
  }
  if (!options.example) {
    manual.push('Add your pages to cms.config.ts, then make each page editable with usePageContent() and <CmsSection>. See the README, "Make your pages editable".');
  }
  return {
    actions,
    warnings,
    manual,
    installed,
    installCommand,
    adminUrl,
    exampleUrl: options.example ? "/cms-example" : null,
    packageManager,
    backend: options.backend
  };
}
function findGlobalCss(appDir, layoutFile, alias) {
  if (layoutFile) {
    const spec = read(layoutFile).match(/import\s+['"]([^'"]+\.css)['"]/)?.[1];
    if (spec) {
      const resolved = spec.startsWith("@/") && alias ? import_node_path3.default.join(alias.root, spec.slice(2)) : import_node_path3.default.resolve(import_node_path3.default.dirname(layoutFile), spec);
      if (exists(resolved)) return resolved;
    }
  }
  return firstExisting(appDir, ["globals.css", "global.css"]);
}
function djangoSteps() {
  return [
    'Set up the Django side: run   npx storio-editor init --backend django --django-dir <folder with manage.py>   again, or by hand (see django-storio-elements-editor/README.md): pip install django-storio-elements-editor, add "storio_elements_editor" to INSTALLED_APPS, add path("api/cms/", include("storio_elements_editor.urls")) to urls.py, then run python manage.py migrate.',
    "If the site and Django run on different domains, configure django-cors-headers and CSRF_TRUSTED_ORIGINS (see django-storio-elements-editor/README.md)."
  ];
}

// src/cli/prompts.ts
var import_node_path4 = __toESM(require("path"));
async function askMissingOptions(options, given, ask) {
  const next = { ...options };
  if (!given.has("backend")) {
    const answer = (await ask("Where should content be stored?\n  1) In this Next.js app (JSON file)\n  2) A Django API (django-storio-elements-editor)\n> [1] ")).trim().toLowerCase();
    next.backend = answer === "2" || answer === "django" ? "django" : "files";
  }
  if (next.backend === "django" && !given.has("api-url")) {
    const answer = (await ask(`Django API URL [${next.apiUrl}] `)).trim();
    if (answer) next.apiUrl = answer;
  }
  if (next.backend === "django" && !given.has("django-dir")) {
    const detected = findDjangoProject(import_node_path4.default.dirname(import_node_path4.default.resolve(next.cwd)))?.dir ?? null;
    const hint = detected ? `[${detected}]` : "[skip]";
    const answer = (await ask(`Django project folder (has manage.py). The CMS can set Django up for you ${hint} `)).trim();
    if (answer && !["skip", "n", "no"].includes(answer.toLowerCase())) next.djangoDir = answer;
    else if (!answer && detected) next.djangoDir = detected;
  }
  if (!given.has("admin-path")) {
    const answer = (await ask(`Route for the CMS screen [${next.adminPath}] `)).trim();
    if (answer) next.adminPath = answer;
  }
  if (!given.has("no-example")) {
    const answer = (await ask("Create an example page at /cms-example? [Y/n] ")).trim().toLowerCase();
    next.example = answer !== "n" && answer !== "no";
  }
  return next;
}

// src/cli/addPage.ts
var import_node_fs3 = __toESM(require("fs"));
var import_node_path5 = __toESM(require("path"));
var exists2 = (p) => import_node_fs3.default.existsSync(p);
var read2 = (p) => import_node_fs3.default.readFileSync(p, "utf8");
var KEY = /^[a-z][a-z0-9_-]*$/;
var RESERVED = /* @__PURE__ */ new Set(["default", "class", "new", "function", "var", "const", "let", "content", "initialData"]);
var pascal = (key) => key.split(/[-_]/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join("");
var titleCase = (key) => pascal(key).replace(/([a-z0-9])([A-Z])/g, "$1 $2");
function camel(key) {
  const p = pascal(key);
  const c = p[0].toLowerCase() + p.slice(1);
  return RESERVED.has(c) ? `${c}Data` : c;
}
function closingBracket(source, open) {
  let depth = 0;
  let quote = null;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
    } else if (ch === "/" && source[i + 1] === "/") {
      const nl = source.indexOf("\n", i);
      if (nl === -1) return -1;
      i = nl;
    } else if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      if (end === -1) return -1;
      i = end + 1;
    } else if (ch === "'" || ch === '"' || ch === "`") quote = ch;
    else if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
function addPageEntry(source, entry, key) {
  if (new RegExp(`key:\\s*['"]${key}['"]`).test(source)) return { source, status: "already" };
  const match = /\bpages\s*:\s*\[/.exec(source);
  if (!match) return { source, status: "manual", reason: 'no "pages: [" list found' };
  const open = match.index + match[0].length - 1;
  const close = closingBracket(source, open);
  if (close === -1) return { source, status: "manual", reason: "could not find the end of the pages list" };
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const before = source.slice(0, close).replace(/\s+$/, "");
  const inner = before.slice(open + 1);
  const hasItems = inner.split(/\r?\n/).some((l) => l.trim() && !l.trim().startsWith("//"));
  const comma = hasItems && !before.endsWith(",") ? "," : "";
  const indented = entry.split("\n").map((l) => `    ${l}`).join(eol);
  return { source: `${before}${comma}${eol}${indented},${eol}  ${source.slice(close)}`, status: "changed" };
}
function runAddPage(options) {
  const root = import_node_path5.default.resolve(options.cwd);
  const actions = [];
  const warnings = [];
  const rel = (p) => import_node_path5.default.relative(root, p).split(import_node_path5.default.sep).join("/");
  if (!KEY.test(options.key)) {
    throw new CliError(`Invalid page key "${options.key}". Use lowercase letters, digits, "-" or "_", starting with a letter (for example "about" or "pricing-plans").`);
  }
  const route = (options.route ?? `/${options.key}`).replace(/\/+$/, "") || "/";
  if (!/^\/([A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*)?$/.test(route)) {
    throw new CliError(`Invalid route "${options.route}". Use plain path segments, for example /about or /company/team.`);
  }
  const sections = options.sections?.length ? options.sections : ["hero", "content"];
  for (const s of sections) {
    if (!KEY.test(s)) throw new CliError(`Invalid section key "${s}". Use lowercase letters, digits, "-" or "_", starting with a letter.`);
  }
  if (new Set(sections).size !== sections.length) throw new CliError("Section keys must be unique.");
  const srcApp = import_node_path5.default.join(root, "src", "app");
  const appDir = exists2(srcApp) ? srcApp : exists2(import_node_path5.default.join(root, "app")) ? import_node_path5.default.join(root, "app") : null;
  if (!appDir) throw new CliError("No app/ folder found. Run this from the root of your Next.js App Router project.");
  const base = appDir === srcApp ? import_node_path5.default.join(root, "src") : root;
  const configFile = [import_node_path5.default.join(base, "cms.config.ts"), import_node_path5.default.join(root, "cms.config.ts")].find(exists2);
  if (!configFile) throw new CliError("cms.config.ts not found. Run `npx storio-editor init` first.");
  const tsconfig = import_node_path5.default.join(root, "tsconfig.json");
  const alias = exists2(tsconfig) ? detectAlias(read2(tsconfig), root) : null;
  const name = pascal(options.key);
  const pageTitle = options.title ?? titleCase(options.key);
  const jsonFile = import_node_path5.default.join(base, "content", `${options.key}.json`);
  const viewFile = import_node_path5.default.join(base, "components", `${name}View.tsx`);
  const pageFile = import_node_path5.default.join(appDir, ...route.split("/").filter(Boolean), "page.tsx");
  const conflicts = [jsonFile, viewFile, pageFile].filter(exists2);
  if (conflicts.length > 0) {
    throw new CliError(
      `Not creating the page: ${conflicts.map(rel).join(", ")} already exist${conflicts.length === 1 ? "s" : ""}. Pick another key or route, or make that page editable by hand (see the README, "Make your pages editable").`
    );
  }
  const imp = (from, target) => importSpecifier(from, target, alias);
  const write = (file, content) => {
    if (!options.dryRun) {
      import_node_fs3.default.mkdirSync(import_node_path5.default.dirname(file), { recursive: true });
      import_node_fs3.default.writeFileSync(file, content);
    }
    actions.push({ kind: "created", file: rel(file) });
  };
  const json = {};
  for (const s of sections) json[s] = { title: `${titleCase(s)} title`, text: "Edit this text in the CMS, or in this file." };
  write(jsonFile, JSON.stringify(json, null, 2) + "\n");
  const blocks = sections.map(
    (s) => `      <CmsSection sectionKey="${s}" title="${titleCase(s)}">
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-3xl font-bold"><CmsField path="title" label="Title">{${camel(s)}.title}</CmsField></h2>
          <p className="mt-3 text-gray-600"><CmsField path="text" label="Text">{${camel(s)}.text}</CmsField></p>
        </section>
      </CmsSection>`
  ).join("\n\n");
  write(
    viewFile,
    `'use client';

import { CmsField, CmsSection, usePageContent } from '@brainicon/storio-elements-editor/site';
import type pageDefaults from '${imp(viewFile, jsonFile)}';

type Content = typeof pageDefaults;

export function ${name}View() {
  const { ${sections.map((s) => camel(s) === s ? s : `'${s}': ${camel(s)}`).join(", ")} } = usePageContent<Content>('${options.key}');

  return (
    <main>
${blocks}
    </main>
  );
}
`
  );
  write(
    pageFile,
    `import { ${name}View } from '${imp(pageFile, viewFile)}';

export default function ${name}Page() {
  return <${name}View />;
}
`
  );
  const defaultsName = `${camel(options.key)}Defaults`;
  const entry = `{
  key: '${options.key}',
  title: '${pageTitle.replace(/'/g, "\\'")}',
  route: '${route}',
  defaults: ${defaultsName},
  sections: [
${sections.map((s) => `    { key: '${s}', label: '${titleCase(s)}' },`).join("\n")}
  ],
}`;
  const importLine = `import ${defaultsName} from '${imp(configFile, jsonFile)}';`;
  const edited = addPageEntry(read2(configFile), entry, options.key);
  if (edited.status === "changed") {
    if (!options.dryRun) import_node_fs3.default.writeFileSync(configFile, addImportLine(edited.source, importLine));
    actions.push({ kind: "modified", file: rel(configFile), note: `registered page "${options.key}"` });
  } else if (edited.status === "already") {
    actions.push({ kind: "unchanged", file: rel(configFile), note: `page "${options.key}" already registered` });
  } else {
    actions.push({ kind: "skipped", file: rel(configFile), note: edited.reason });
    warnings.push(`Add the page to ${rel(configFile)} by hand. Import:  ${importLine}  and add to pages:  ${entry.replace(/\s+/g, " ")}`);
  }
  return { actions, warnings, route, key: options.key };
}

// src/cli/doctor.ts
var import_node_fs4 = __toESM(require("fs"));
var import_node_path6 = __toESM(require("path"));
var exists3 = (p) => import_node_fs4.default.existsSync(p);
var read3 = (p) => import_node_fs4.default.readFileSync(p, "utf8");
var LIB2 = "@brainicon/storio-elements-editor";
function walk(dir, match, out = [], depth = 0) {
  if (depth > 6) return out;
  let entries;
  try {
    entries = import_node_fs4.default.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = import_node_path6.default.join(dir, e.name);
    if (e.isDirectory()) walk(p, match, out, depth + 1);
    else if (match(p)) out.push(p);
  }
  return out;
}
function checkProject(root) {
  const checks = [];
  const add = (level, title, fix) => checks.push({ level, title, fix });
  const pkgPath = import_node_path6.default.join(root, "package.json");
  if (!exists3(pkgPath)) {
    add("fail", "No package.json here", "Run this from the root of your Next.js project (or pass --cwd).");
    return { checks, djangoBaseUrl: null };
  }
  const pkg = JSON.parse(read3(pkgPath));
  const deps = { ...pkg.devDependencies, ...pkg.dependencies };
  add(deps.next ? "ok" : "fail", deps.next ? `Next.js ${deps.next}` : "Next.js is not installed", deps.next ? void 0 : "This library needs a Next.js (App Router) project.");
  for (const dep of [LIB2, "react-hot-toast", "lucide-react"]) {
    add(deps[dep] ? "ok" : "fail", deps[dep] ? `${dep} installed` : `${dep} is missing`, deps[dep] ? void 0 : `Run:  npm install ${dep === LIB2 ? "<path to the .tgz>" : dep}`);
  }
  const tw = deps.tailwindcss?.match(/\d+/)?.[0];
  if (!tw) add("fail", "Tailwind CSS is not installed", "The CMS screens are styled with Tailwind v4:  npm install tailwindcss @tailwindcss/postcss");
  else if (Number(tw) < 4) add("fail", `Tailwind CSS v${tw} found`, "The CMS screens need Tailwind v4.");
  else add("ok", `Tailwind CSS v${tw}`);
  const srcApp = import_node_path6.default.join(root, "src", "app");
  const appDir = exists3(srcApp) ? srcApp : exists3(import_node_path6.default.join(root, "app")) ? import_node_path6.default.join(root, "app") : null;
  if (!appDir) {
    add("fail", "No app/ folder (App Router) found", "The init command and the CMS helpers need the Next.js App Router.");
    return { checks, djangoBaseUrl: null };
  }
  const base = appDir === srcApp ? import_node_path6.default.join(root, "src") : root;
  const css = walk(appDir, (f) => f.endsWith(".css")).concat(walk(base, (f) => /globals?\.css$/.test(f)));
  const withSource = css.find((f) => /@source[^;\n]*storio-elements-editor/.test(read3(f)));
  add(
    withSource ? "ok" : "fail",
    withSource ? "Tailwind scans the library (@source line)" : "Tailwind does not scan the library",
    withSource ? void 0 : 'Add to your global CSS, below @import "tailwindcss":   @source "../node_modules/@brainicon/storio-elements-editor/dist";   (the path is relative to that CSS file)'
  );
  const config = [import_node_path6.default.join(base, "cms.config.ts"), import_node_path6.default.join(root, "cms.config.ts")].find(exists3);
  let djangoBaseUrl = null;
  if (!config) add("fail", "cms.config.ts not found", "Run:  npx storio-editor init");
  else {
    add("ok", `Config found (${import_node_path6.default.relative(root, config).split(import_node_path6.default.sep).join("/")})`);
    const text = read3(config);
    djangoBaseUrl = /djangoAdapter\(/.test(text) ? text.match(/(?:baseUrl:|\bAPI_URL\s*=)\s*(?:process\.env\.\w+\s*\?\?\s*)?['"`]([^'"`]+)['"`]/)?.[1] ?? null : null;
    if (/\bcmsAuth\(/.test(text)) add("ok", "Editors sign in with the token login (cmsAuth)");
    if (!/\bkey:\s*['"]/.test(text)) add("warn", "No pages are listed in cms.config.ts yet", "Add one with:  npx storio-editor add-page <name>");
  }
  const sources = walk(appDir, (f) => /\.(tsx|jsx|ts|js)$/.test(f)).concat(walk(import_node_path6.default.join(base, "components"), (f) => /\.(tsx|jsx)$/.test(f)));
  const has = (re) => sources.find((f) => re.test(read3(f)));
  add(has(/<CmsProvider\b/) ? "ok" : "fail", has(/<CmsProvider\b/) ? "CmsProvider wraps the app" : "CmsProvider is not used", has(/<CmsProvider\b/) ? void 0 : "Wrap {children} in your root layout with <CmsProviders> (init creates components/CmsProviders.tsx).");
  const studio = has(/<CmsStudio\b/);
  add(studio ? "ok" : "fail", studio ? `CMS screen found (${import_node_path6.default.relative(root, studio).split(import_node_path6.default.sep).join("/")})` : "No CMS screen found", studio ? void 0 : "Create a page that renders <CmsStudio config={cms} /> (init creates app/admin/cms/page.tsx).");
  if (!has(/<CmsSection\b/)) add("warn", "No page uses <CmsSection> yet, so nothing shows a pencil button", 'Wrap an editable block:  <CmsSection sectionKey="hero" title="Hero">\u2026</CmsSection>');
  return { checks, djangoBaseUrl };
}
function siteOf(url) {
  const host = new URL(url).hostname;
  if (/^[\d.]+$/.test(host) || host === "localhost") return host;
  return host.split(".").slice(-2).join(".");
}
function usesTokenAuth(root) {
  const srcApp = import_node_path6.default.join(root, "src", "app");
  const base = exists3(srcApp) ? import_node_path6.default.join(root, "src") : root;
  const config = [import_node_path6.default.join(base, "cms.config.ts"), import_node_path6.default.join(root, "cms.config.ts")].find(exists3);
  return config ? /cmsAuth\(/.test(read3(config)) : false;
}
function checkProductionFiles(root) {
  const checks = [];
  const add = (level, title, fix) => checks.push({ level, title, fix });
  const srcApp = import_node_path6.default.join(root, "src", "app");
  const base = exists3(srcApp) ? import_node_path6.default.join(root, "src") : root;
  const appDir = exists3(srcApp) ? srcApp : import_node_path6.default.join(root, "app");
  const config = [import_node_path6.default.join(base, "cms.config.ts"), import_node_path6.default.join(root, "cms.config.ts")].find(exists3);
  const configText = config ? read3(config) : "";
  if (/djangoAdapter\(/.test(configText)) {
    const expression = configText.match(/\bAPI_URL\s*=\s*[^\n]+/)?.[0] ?? configText.match(/baseUrl:[^\n]+/)?.[0] ?? "";
    const literal = expression.match(/['"`]([^'"`]+)['"`]/)?.[1] ?? "";
    if (/process\.env\./.test(expression)) add("ok", "The API URL comes from an environment variable");
    else if (/localhost|127\.0\.0\.1/.test(literal)) add("fail", `The API URL is hardcoded to ${literal}`, "Use baseUrl: process.env.NEXT_PUBLIC_CMS_API_URL ?? '<dev URL>' in cms.config.ts and set the variable in production.");
    else add("ok", `The API URL is ${literal}`);
  }
  const storage = import_node_path6.default.join(base, "lib", "cms-storage.ts");
  if (exists3(storage) && /fileStorage\(/.test(read3(storage))) {
    add("warn", "Content is stored in a JSON file (file backend)", "Fine on one server with a persistent disk. On serverless or several servers (Vercel, Netlify, autoscaling) edits get lost: use Django or a database adapter.");
  }
  const route = import_node_path6.default.join(appDir, "api", "cms", "[...path]", "route.ts");
  if (exists3(route) && /NODE_ENV\s*===\s*['"]development['"]/.test(read3(route))) {
    add("fail", "Saving is only allowed under `next dev` (generated authorize())", `Replace authorize() in ${import_node_path6.default.relative(root, route).split(import_node_path6.default.sep).join("/")} with your real login check, or editors cannot save in production.`);
  }
  const providers2 = [import_node_path6.default.join(base, "components", "CmsProviders.tsx")].find(exists3);
  if (providers2 && /getAllPageContent/.test(read3(providers2))) add("ok", "Content is rendered on the server (search engines see the edited text)");
  else add("warn", "Content is only loaded in the browser, so search engines index the default text", "Run  npx storio-editor init  again: it upgrades components/CmsProviders.tsx to load content on the server.");
  return checks;
}
async function checkProductionApi(apiUrl, siteOrigin, fetchFn = fetch, options = {}) {
  const checks = [];
  const add = (level, title, fix) => checks.push({ level, title, fix });
  const url = apiUrl.replace(/\/+$/, "");
  let api;
  try {
    api = new URL(url);
    new URL(siteOrigin);
  } catch {
    add("fail", "The API URL or the site origin is not a valid URL", "Pass full URLs, for example --api-url https://api.example.com/api/cms --frontend-origin https://example.com");
    return checks;
  }
  add(api.protocol === "https:" ? "ok" : "fail", api.protocol === "https:" ? "The API uses HTTPS" : "The API does not use HTTPS", api.protocol === "https:" ? void 0 : "Serve Django over HTTPS; browsers do not send secure login cookies over plain HTTP.");
  if (!siteOrigin.startsWith("https://")) add("fail", "The site does not use HTTPS", "Serve the site over HTTPS.");
  if (/localhost|127\.0\.0\.1/.test(url + siteOrigin)) add("warn", "A localhost URL was given", "Pass the real production URLs.");
  const sameSite = siteOf(url) === siteOf(siteOrigin);
  if (sameSite) add("ok", `The site and the API are on the same site (${siteOf(siteOrigin)}), so the login cookie works with the default settings`);
  else if (options.tokenAuth) add("ok", `The site (${siteOf(siteOrigin)}) and the API (${siteOf(url)}) are different sites, which is fine: editors sign in with a token, not a cookie`);
  else
    add(
      "fail",
      `The site (${siteOf(siteOrigin)}) and the API (${siteOf(url)}) are different sites`,
      "The editor login cookie becomes a third-party cookie, which Safari and other browsers block: saving fails even after logging in. Put the API on a subdomain of the site (api.example.com) or behind the same domain (example.com/api/ through a reverse proxy)."
    );
  let res;
  try {
    res = await fetchFn(`${url}/csrf`, { headers: { Origin: siteOrigin } });
  } catch {
    add("fail", `Cannot reach the API at ${url}`, "Check the URL, DNS, and that Django is running.");
    return checks;
  }
  if (res.status !== 200) {
    add("fail", `${url}/csrf returned ${res.status}`, res.status === 404 ? 'Add path("api/cms/", include("storio_elements_editor.urls")) to the production urls.py.' : "Check ALLOWED_HOSTS and the Django logs.");
    return checks;
  }
  add("ok", "The production API is reachable");
  if (api.origin !== new URL(siteOrigin).origin) {
    const allow = res.headers.get("access-control-allow-origin");
    if (allow !== siteOrigin && allow !== "*") add("fail", `Django does not allow ${siteOrigin} (CORS)`, `Add "${siteOrigin}" to CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS.`);
    else if (res.headers.get("access-control-allow-credentials") !== "true") add("fail", "CORS does not allow credentials", "Set CORS_ALLOW_CREDENTIALS = True.");
    else add("ok", `CORS allows ${siteOrigin} with credentials`);
  }
  const cookie = (res.headers.get("set-cookie") ?? "").split(/,(?=\s*\w+=)/).find((c) => /^\s*csrftoken=/.test(c)) ?? "";
  if (cookie) {
    if (/;\s*secure/i.test(cookie)) add("ok", "Cookies are marked Secure");
    else add("fail", "Cookies are not marked Secure", "Set CSRF_COOKIE_SECURE = True and SESSION_COOKIE_SECURE = True.");
    if (!sameSite && !options.tokenAuth && !/samesite=none/i.test(cookie)) add("fail", "Cookies use SameSite=Lax across different sites", 'If you cannot share a domain: CSRF_COOKIE_SAMESITE = "None" and SESSION_COOKIE_SAMESITE = "None" (with Secure). Some browsers still block it.');
  }
  try {
    const probe = await fetchFn(`${api.origin}/storio-editor-doctor-missing-page/`);
    const body = probe.text ? await probe.text() : "";
    if (/DEBUG\s*=\s*True/.test(body)) add("fail", "Django runs with DEBUG = True", "Set DEBUG = False in production (it shows settings and code to anyone).");
    else add("ok", "Django does not show debug pages");
  } catch {
  }
  return checks;
}
async function checkDjango(baseUrl, frontendOrigin, fetchFn = fetch, options = {}) {
  const checks = [];
  const add = (level, title, fix) => checks.push({ level, title, fix });
  const url = baseUrl.replace(/\/+$/, "");
  let res;
  try {
    res = await fetchFn(`${url}/csrf`, { headers: { Origin: frontendOrigin } });
  } catch {
    add("fail", `Cannot reach Django at ${url}`, "Start Django (python manage.py runserver) and check the baseUrl in cms.config.ts.");
    return checks;
  }
  if (res.status === 404) {
    add("fail", `${url}/csrf returned 404`, 'Django does not serve the CMS API. Add path("api/cms/", include("storio_elements_editor.urls")) to urls.py (or run init with --django-dir).');
    return checks;
  }
  if (res.status !== 200) {
    add("fail", `${url}/csrf returned ${res.status}`, "Check the Django server log for the error.");
    return checks;
  }
  add("ok", "Django API reachable");
  const allow = res.headers.get("access-control-allow-origin");
  if (!allow) {
    add("fail", `Django does not allow the origin ${frontendOrigin} (CORS)`, `Install django-cors-headers and set CORS_ALLOWED_ORIGINS = ["${frontendOrigin}"] and CORS_ALLOW_CREDENTIALS = True.`);
  } else if (res.headers.get("access-control-allow-credentials") !== "true") {
    add("fail", "CORS is on but does not allow credentials", "Set CORS_ALLOW_CREDENTIALS = True, or editors can never log in through the CMS.");
  } else add("ok", `CORS allows ${frontendOrigin} with credentials`);
  try {
    const pre = await fetchFn(`${url}/records/home/hero`, {
      method: "OPTIONS",
      headers: {
        Origin: frontendOrigin,
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": options.tokenAuth ? "content-type,x-csrftoken,authorization" : "content-type,x-csrftoken"
      }
    });
    const methods = pre.headers.get("access-control-allow-methods") ?? "";
    const headers = (pre.headers.get("access-control-allow-headers") ?? "").toLowerCase();
    if (pre.status < 300 && /PUT/i.test(methods) && headers.includes("x-csrftoken") && options.tokenAuth && !headers.includes("authorization")) {
      add("fail", "CORS does not allow the Authorization header, so the token login cannot save", 'Add "authorization" to CORS_ALLOW_HEADERS (django-cors-headers allows it by default: remove any custom CORS_ALLOW_HEADERS that leaves it out).');
    } else if (pre.status < 300 && /PUT/i.test(methods) && headers.includes("x-csrftoken")) add("ok", options.tokenAuth ? "Saving is allowed by CORS (PUT + X-CSRFToken + Authorization)" : "Saving is allowed by CORS (PUT + X-CSRFToken)");
    else if (allow) add("warn", "CORS preflight for saving was not approved", 'Make sure corsheaders is the first MIDDLEWARE entry and CORS_ALLOW_HEADERS includes "x-csrftoken" (the default does).');
  } catch {
  }
  if (options.tokenAuth) {
    try {
      const me = await fetchFn(`${url}/auth/me`, { headers: { Origin: frontendOrigin } });
      if (me.status === 401) add("ok", "Token login is available on the server");
      else if (me.status === 404) add("fail", "The server has no token login (django-storio-elements-editor is too old, or TOKEN_LOGIN is False)", 'Upgrade the package: pip install -U "git+https://github.com/MostofaSeum/storio-elements-editor.git#subdirectory=django-storio-elements-editor" (or run init with --django-dir), and make sure STORIO_EDITOR["TOKEN_LOGIN"] is not False.');
      else add("warn", `${url}/auth/me returned ${me.status}`, "Expected 401 for a visitor who is not signed in.");
    } catch {
    }
  }
  return checks;
}
function summarize(checks) {
  return {
    ok: checks.filter((c) => c.level === "ok").length,
    warn: checks.filter((c) => c.level === "warn").length,
    fail: checks.filter((c) => c.level === "fail").length
  };
}

// src/cli/scan.ts
var import_node_fs5 = __toESM(require("fs"));
var import_node_path7 = __toESM(require("path"));
var SECTION_TAGS = /* @__PURE__ */ new Set(["section", "header", "footer", "nav", "aside", "main", "article"]);
var CONTAINER_TAGS = /* @__PURE__ */ new Set(["main", "article"]);
var SKIP_TAGS = /* @__PURE__ */ new Set(["code", "pre", "script", "style", "svg", "kbd", "samp", "textarea", "select", "option"]);
var TEXT_ATTRS = /* @__PURE__ */ new Set(["placeholder", "alt"]);
var INLINE_TAGS = /* @__PURE__ */ new Set(["span", "strong", "em", "b", "i", "small", "mark", "sup", "sub", "u"]);
var KEY2 = /^[a-z][a-z0-9_-]*$/;
var ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\xA0",
  bull: "\u2022",
  copy: "\xA9",
  reg: "\xAE",
  trade: "\u2122",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
  laquo: "\xAB",
  raquo: "\xBB",
  rarr: "\u2192",
  larr: "\u2190",
  middot: "\xB7",
  times: "\xD7",
  deg: "\xB0",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D"
};
function jsxTextValue(raw) {
  const lines = raw.split(/\r?\n/);
  const parts = [];
  lines.forEach((line, i) => {
    let l = line.replace(/\t/g, " ");
    if (i > 0) l = l.replace(/^ +/, "");
    if (i < lines.length - 1) l = l.replace(/ +$/, "");
    if (l) parts.push(l);
  });
  let text = lines.length > 1 ? parts.join(" ") : raw;
  let unknown = false;
  text = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, name) => {
    if (name[0] === "#") return String.fromCodePoint(name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10));
    const found = ENTITIES[name.toLowerCase()];
    if (found === void 0) unknown = true;
    return found ?? m;
  });
  return unknown ? null : text.trim();
}
var words = (s) => s.replace(/['’]/g, "").split(/[^A-Za-z0-9]+/).filter(Boolean);
function toKey(s, fallback) {
  const w = words(s).slice(0, 3).map((x) => x.toLowerCase());
  const key = w.map((x, i) => i === 0 ? x : x[0].toUpperCase() + x.slice(1)).join("");
  return /^[a-z][A-Za-z0-9]*$/.test(key) && key.length <= 32 ? key : fallback;
}
var titleCase2 = (key) => key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
function loadTypeScript(root) {
  try {
    return require(require.resolve("typescript", { paths: [root] }));
  } catch {
    throw new CliError("TypeScript is not installed in this project (npm install -D typescript). The scan command uses it to read your code safely.");
  }
}
var PLAIN_TEXT_TAGS = /* @__PURE__ */ new Set(["title"]);
function runScan(options) {
  const root = import_node_path7.default.resolve(options.cwd);
  const ts = loadTypeScript(root);
  const rel = (p) => import_node_path7.default.relative(root, p).split(import_node_path7.default.sep).join("/");
  const file = import_node_path7.default.resolve(root, options.file);
  if (!import_node_fs5.default.existsSync(file)) throw new CliError(`File not found: ${options.file}`);
  if (!/\.(tsx|jsx)$/.test(file)) throw new CliError("scan works on .tsx and .jsx files.");
  const original = import_node_fs5.default.readFileSync(file, "utf8");
  if (/usePageContent\s*[<(]/.test(original)) {
    throw new CliError(`${rel(file)} already uses usePageContent, so it looks converted already. Edit it by hand, or restore the original first.`);
  }
  const srcApp = import_node_path7.default.join(root, "src", "app");
  const appDir = import_node_fs5.default.existsSync(srcApp) ? srcApp : import_node_fs5.default.existsSync(import_node_path7.default.join(root, "app")) ? import_node_path7.default.join(root, "app") : null;
  if (!appDir) throw new CliError("No app/ folder found. Run this from the root of your Next.js App Router project.");
  const base = appDir === srcApp ? import_node_path7.default.join(root, "src") : root;
  const configFile = [import_node_path7.default.join(base, "cms.config.ts"), import_node_path7.default.join(root, "cms.config.ts")].find((p) => import_node_fs5.default.existsSync(p));
  if (!configFile) throw new CliError("cms.config.ts not found. Run `npx storio-editor init` first.");
  const tsconfig = import_node_path7.default.join(root, "tsconfig.json");
  const alias = import_node_fs5.default.existsSync(tsconfig) ? detectAlias(import_node_fs5.default.readFileSync(tsconfig, "utf8"), root) : null;
  const route = options.route ?? routeFromFile(appDir, file);
  if (!route) throw new CliError(`${rel(file)} is not a page under app/. Pass --route (the URL that shows it) and --page (a key such as "home").`);
  const isRecordPage = /\[[^\]]+\]/.test(route);
  if (isRecordPage && !options.collection) {
    throw new CliError(
      `${route} shows one record at a time (a blog post, a product...). Pass --collection <key> (the collection your CMS API serves, e.g. blog) and --parent <page key> when it belongs to a list page. See the README, "Pages with [slug] or [id]".`
    );
  }
  if (options.collection && !KEY2.test(options.collection)) throw new CliError(`Invalid --collection "${options.collection}". Use lowercase letters, digits, "-" or "_".`);
  if (options.collection && !isRecordPage) throw new CliError(`--collection is for routes with [slug] or [id]; ${route} has none.`);
  if (options.parent && (!KEY2.test(options.parent) || !options.collection)) {
    throw new CliError('--parent needs a page key (lowercase letters, digits, "-" or "_") and goes together with --collection.');
  }
  const pageKey = options.page ?? (route === "/" ? "home" : route.slice(1).replace(/\[(?:\.\.\.)?([^\]]+)\]/g, "$1").replace(/\//g, "-").toLowerCase());
  if (!KEY2.test(pageKey)) throw new CliError(`Invalid page key "${pageKey}". Pass --page with lowercase letters, digits, "-" or "_".`);
  const jsonFile = import_node_path7.default.join(base, "content", `${pageKey}.json`);
  if (import_node_fs5.default.existsSync(jsonFile)) throw new CliError(`${rel(jsonFile)} already exists. Pass another --page, or delete that file first.`);
  const configText = import_node_fs5.default.readFileSync(configFile, "utf8");
  if (options.parent && !new RegExp(`key:\\s*['"]${options.parent}['"]`).test(configText)) {
    throw new CliError(`--parent "${options.parent}" is not a page in ${rel(configFile)}. Scan the list page first, or leave --parent out.`);
  }
  if (new RegExp(`key:\\s*['"]${pageKey}['"]`).test(configText)) {
    throw new CliError(`A page with key "${pageKey}" is already in ${rel(configFile)}. Pass another --page.`);
  }
  const sf = ts.createSourceFile(file, original, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX);
  const warnings = [];
  const hasUseClient = sf.statements.some(
    (s, i) => i < 3 && ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression) && s.expression.text === "use client"
  );
  if (!hasUseClient && !options.addUseClient) {
    throw new CliError(
      `${rel(file)} is a Server Component (no "use client"). The CMS reads content with a React hook, so either move the page's markup into a client component and scan that file (with --page and --route), or pass --add-use-client if this page uses no server-only code (no async component, no metadata export, no database or fs access).`
    );
  }
  const fn = findComponent(ts, sf, options.component);
  if (!fn) throw new CliError(options.component ? `Component "${options.component}" not found in ${rel(file)}.` : `No default-exported component found in ${rel(file)}. Pass --component <Name>.`);
  if (!hasUseClient) {
    const isAsync = fn.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
    const exportsMetadata = /export\s+(const\s+metadata|(async\s+)?function\s+generateMetadata)/.test(original);
    if (isAsync || exportsMetadata) throw new CliError(`${rel(file)} is async or exports metadata, so it must stay a Server Component. Move its markup into a client component and scan that file.`);
  }
  const rootJsx = findReturnedJsx(ts, fn);
  if (!rootJsx) throw new CliError(`Could not find the JSX that ${rel(file)} returns.`);
  const used = /* @__PURE__ */ new Set();
  const collect = (n) => {
    if (ts.isIdentifier(n)) used.add(n.text);
    ts.forEachChild(n, collect);
  };
  collect(sf);
  const freeName = (wanted) => wanted.find((w) => !used.has(w)) ?? `${wanted[0]}${Date.now() % 1e3}`;
  const contentVar = freeName(["cmsText", "cmsContent", "pageCmsText"]);
  const typeName = freeName(["CmsPageText", "CmsPageContent"]);
  const defaultsName = freeName(["cmsPageDefaults", "cmsDefaults"]);
  const tagName = (el) => {
    const t = ts.isJsxElement(el) ? el.openingElement.tagName : el.tagName;
    return t.getText(sf);
  };
  const attrsOf = (el) => ts.isJsxElement(el) ? el.openingElement.attributes : el.attributes;
  const attr = (el, name) => {
    for (const p of attrsOf(el).properties) {
      if (ts.isJsxAttribute(p) && p.name.getText(sf) === name && p.initializer && ts.isStringLiteral(p.initializer)) return p.initializer.text;
    }
    return null;
  };
  const isElement = (n) => ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n);
  const hasSectionInside = (n) => {
    let found = false;
    const walk2 = (c) => {
      if (found) return;
      if (isElement(c) && SECTION_TAGS.has(tagName(c))) found = true;
      else ts.forEachChild(c, walk2);
    };
    ts.forEachChild(n, walk2);
    return found;
  };
  const containsTag = (n, wanted) => {
    let found = false;
    const walk2 = (c) => {
      if (found) return;
      if (isElement(c) && tagName(c) === wanted) found = true;
      else ts.forEachChild(c, walk2);
    };
    walk2(n);
    return found;
  };
  const sections = [];
  const findSections = (n) => {
    if (isElement(n)) {
      const tag = tagName(n);
      if (SECTION_TAGS.has(tag) && !(CONTAINER_TAGS.has(tag) && hasSectionInside(n))) {
        sections.push(n);
        return;
      }
    }
    if (ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isCallExpression(n)) return;
    ts.forEachChild(n, findSections);
  };
  findSections(rootJsx);
  if (sections.length === 0) {
    const kids = ts.isJsxElement(rootJsx) || ts.isJsxFragment(rootJsx) ? rootJsx.children.filter(isElement) : [];
    if (kids.length > 0) sections.push(...kids);
    else if (isElement(rootJsx)) sections.push(rootJsx);
  }
  if (sections.length === 0) throw new CliError(`No sections found in ${rel(file)}.`);
  const edits = [];
  const content = {};
  const fields = [];
  const sectionInfo = [];
  const sectionKeys = /* @__PURE__ */ new Set();
  const fieldBase = (tag) => {
    if (tag === "h1") return "title";
    if (tag === "h2") return "heading";
    if (/^h[3-6]$/.test(tag)) return "subheading";
    if (tag === "p") return "text";
    if (tag === "button") return "button";
    if (tag === "a" || tag === "Link") return "link";
    if (tag === "label") return "label";
    if (tag === "li") return "item";
    return "text";
  };
  sections.forEach((section, index) => {
    const tag = tagName(section);
    let heading = null;
    const findHeading = (n) => {
      if (heading) return;
      if (isElement(n) && /^h[1-6]$/.test(tagName(n)) && ts.isJsxElement(n)) {
        const t = n.children.filter(ts.isJsxText).map((c) => jsxTextValue(c.getText(sf)) ?? "").join(" ").trim();
        if (t) heading = t;
      }
      ts.forEachChild(n, findHeading);
    };
    findHeading(section);
    const id = attr(section, "id");
    let key = id && toKey(id, "") || (["header", "footer", "nav"].includes(tag) ? tag : "") || (tag === "section" && !sectionKeys.has("hero") && containsTag(section, "h1") ? "hero" : "") || (heading ? toKey(heading, "") : "") || `section${index + 1}`;
    while (sectionKeys.has(key)) key = `${key}${index + 1}`;
    sectionKeys.add(key);
    const values = {};
    const fieldNames = /* @__PURE__ */ new Set();
    const nextField = (b) => {
      let name = b;
      for (let i = 2; fieldNames.has(name); i++) name = `${b}${i}`;
      fieldNames.add(name);
      return name;
    };
    const ref = (field) => `${contentVar}.${key}.${field}`;
    const walk2 = (n, skip, parentTag) => {
      if (isElement(n)) {
        const t = tagName(n);
        const ignored = skip || SKIP_TAGS.has(t) || attrsOf(n).properties.some((p) => ts.isJsxAttribute(p) && p.name.getText(sf) === "data-cms-ignore");
        if (!ignored) {
          for (const p of attrsOf(n).properties) {
            if (!ts.isJsxAttribute(p) || !p.initializer || !ts.isStringLiteral(p.initializer)) continue;
            const name = p.name.getText(sf);
            const value = p.initializer.text;
            if (!TEXT_ATTRS.has(name) || !new RegExp("\\p{L}", "u").test(value)) continue;
            const field = nextField(name);
            values[field] = value;
            edits.push({ start: p.initializer.getStart(sf), end: p.initializer.end, text: `{${ref(field)}}`, order: 0 });
          }
        }
        const inline = INLINE_TAGS.has(t) && parentTag !== tag;
        ts.forEachChild(n, (c) => walk2(c, ignored, inline ? parentTag : t));
        return;
      }
      if (ts.isJsxText(n) && !skip) {
        const raw = sf.text.slice(n.pos, n.end);
        const value = jsxTextValue(raw);
        if (value && new RegExp("\\p{L}", "u").test(value)) {
          const lead = raw.match(/^\s*/)[0];
          const trail = raw.slice(lead.length).match(/\s*$/)[0];
          const field = nextField(fieldBase(parentTag));
          values[field] = value;
          const parent = n.parent;
          const plainOnly = ts.isJsxElement(parent) && PLAIN_TEXT_TAGS.has(tagName(parent));
          const fieldLabel = titleCase2(field).replace(/"/g, "");
          const replacement = plainOnly ? `{${ref(field)}}` : `<CmsField path="${field}" label="${fieldLabel}">{${ref(field)}}</CmsField>`;
          edits.push({ start: n.pos, end: n.end, text: `${lead}${replacement}${trail}`, order: 0 });
        }
        return;
      }
      ts.forEachChild(n, (c) => walk2(c, skip, parentTag));
    };
    walk2(section, false, tag);
    const count = Object.keys(values).length;
    if (count === 0) return;
    content[key] = values;
    const title = heading ? heading.slice(0, 40) : titleCase2(key);
    sectionInfo.push({ key, title, fields: count });
    for (const [field, value] of Object.entries(values)) fields.push({ section: key, field, value });
    const placement = tag === "header" || tag === "nav" ? ' buttonPlacement="fixed"' : "";
    const label = titleCase2(key).replace(/"/g, "");
    edits.push({ start: section.getStart(sf), end: section.getStart(sf), text: `<CmsSection sectionKey="${key}" title="${label}"${placement}>`, order: 2 });
    edits.push({ start: section.end, end: section.end, text: `</CmsSection>`, order: 1 });
  });
  if (sectionInfo.length === 0) throw new CliError(`No static text found in ${rel(file)}. Nothing to convert.`);
  const hook = `const ${contentVar} = usePageContent<${typeName}>('${pageKey}');`;
  const body = fn.body;
  if (ts.isBlock(body)) {
    const firstLine = body.statements[0];
    const indent = firstLine ? sf.text.slice(sf.text.lastIndexOf("\n", firstLine.getStart(sf)) + 1, firstLine.getStart(sf)) : "  ";
    const at = firstLine ? firstLine.getStart(sf) : body.getStart(sf) + 1;
    edits.push({ start: at, end: at, text: firstLine ? `${hook}
${indent}` : `
  ${hook}
`, order: 3 });
  } else {
    edits.push({ start: body.getStart(sf), end: body.getStart(sf), text: `{
  ${hook}
  return `, order: 3 });
    edits.push({ start: body.end, end: body.end, text: `;
}`, order: 0 });
  }
  edits.sort((a, b) => a.start - b.start || b.order - a.order);
  let out = "";
  let cursor = 0;
  for (const e of edits) {
    if (e.start < cursor) throw new CliError("Internal error: overlapping edits. Nothing was changed.");
    out += sf.text.slice(cursor, e.start) + e.text;
    cursor = e.end;
  }
  out += sf.text.slice(cursor);
  const jsonSpec = importSpecifier(file, jsonFile, alias);
  out = addImportLine(out, `import { CmsField, CmsSection, usePageContent } from '@brainicon/storio-elements-editor/site';`);
  out = addImportLine(out, `import type ${defaultsName} from '${jsonSpec}';`);
  out = out.replace(`import type ${defaultsName} from '${jsonSpec}';`, `import type ${defaultsName} from '${jsonSpec}';

type ${typeName} = typeof ${defaultsName};`);
  if (!hasUseClient) out = `'use client';

${out}`;
  const check = ts.transpileModule(out, { reportDiagnostics: true, fileName: import_node_path7.default.basename(file), compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.Latest } });
  const errors = (check.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (errors.length > 0) {
    const msg = ts.flattenDiagnosticMessageText(errors[0].messageText, "\n");
    throw new CliError(`The converted file would not compile (${msg}). Nothing was changed. Please report this file shape.`);
  }
  const actions = [];
  const entry = `{
  key: '${pageKey}',
  title: '${(options.title ?? (pageKey === "home" ? "Home" : titleCase2(pageKey.replace(/[-_](.)/g, (_, c) => c.toUpperCase())))).replace(/'/g, "\\'")}',
  route: '${route}',${options.collection ? `
  collection: '${options.collection}',` : ""}${options.parent ? `
  parent: '${options.parent}',` : ""}
  defaults: ${defaultsName},
  sections: [
${sectionInfo.map((s, i) => `    { key: '${s.key}', label: '${`${i + 1}. ${titleCase2(s.key)}`.replace(/'/g, "\\'")}' },`).join("\n")}
  ],
}`;
  const configEdit = addPageEntry(configText, entry, pageKey);
  if (configEdit.status !== "changed") throw new CliError(`Could not register the page in ${rel(configFile)} (${configEdit.reason ?? configEdit.status}). Nothing was changed.`);
  const newConfig = addImportLine(configEdit.source, `import ${defaultsName} from '${importSpecifier(configFile, jsonFile, alias)}';`);
  let backup = null;
  if (!options.dryRun) {
    backup = `${file}.storio-editor.bak`;
    if (!import_node_fs5.default.existsSync(backup)) import_node_fs5.default.writeFileSync(backup, original);
    import_node_fs5.default.mkdirSync(import_node_path7.default.dirname(jsonFile), { recursive: true });
    import_node_fs5.default.writeFileSync(jsonFile, JSON.stringify(content, null, 2) + "\n");
    import_node_fs5.default.writeFileSync(file, out);
    import_node_fs5.default.writeFileSync(configFile, newConfig);
  }
  actions.push({ kind: "created", file: rel(jsonFile), note: `${fields.length} texts in ${sectionInfo.length} sections` });
  actions.push({ kind: "modified", file: rel(file), note: "texts now come from the CMS; sections wrapped in <CmsSection>, texts in <CmsField>" });
  actions.push({ kind: "modified", file: rel(configFile), note: `registered page "${pageKey}" (${route})` });
  if (!hasUseClient) warnings.push(`Added "use client" to ${rel(file)}.`);
  return { actions, warnings, page: pageKey, route, sections: sectionInfo, fields, backup: backup ? rel(backup) : null };
}
function routeFromFile(appDir, file) {
  const relative = import_node_path7.default.relative(appDir, file);
  if (relative.startsWith("..") || !/(^|[\\/])page\.(tsx|jsx)$/.test(relative)) return null;
  const segments = relative.split(/[\\/]/).slice(0, -1).filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith("@"));
  if (segments.some((s) => s.startsWith("[["))) return null;
  return `/${segments.join("/")}`;
}
function findComponent(ts, sf, name) {
  const fromDeclaration = (id) => {
    for (const s of sf.statements) {
      if (ts.isFunctionDeclaration(s) && s.name?.text === id && s.body) return s;
      if (ts.isVariableStatement(s)) {
        for (const d of s.declarationList.declarations) {
          if (ts.isIdentifier(d.name) && d.name.text === id && d.initializer) {
            let init = d.initializer;
            while (ts.isCallExpression(init) && init.arguments[0]) init = init.arguments[0];
            if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return init;
          }
        }
      }
    }
    return null;
  };
  if (name) return fromDeclaration(name);
  for (const s of sf.statements) {
    if (ts.isFunctionDeclaration(s) && s.body && s.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) return s;
    if (ts.isExportAssignment(s)) {
      if (ts.isIdentifier(s.expression)) return fromDeclaration(s.expression.text);
      if (ts.isArrowFunction(s.expression) || ts.isFunctionExpression(s.expression)) return s.expression;
    }
  }
  return null;
}
function findReturnedJsx(ts, fn) {
  const unwrap = (e) => ts.isParenthesizedExpression(e) ? unwrap(e.expression) : e;
  const isJsx = (e) => ts.isJsxElement(e) || ts.isJsxSelfClosingElement(e) || ts.isJsxFragment(e);
  const body = fn.body;
  if (!ts.isBlock(body)) {
    const e = unwrap(body);
    return isJsx(e) ? e : null;
  }
  let found = null;
  for (const s of body.statements) {
    if (ts.isReturnStatement(s) && s.expression && isJsx(unwrap(s.expression))) found = unwrap(s.expression);
  }
  return found;
}

// src/cli/index.ts
var HELP = `storio-editor: set up @brainicon/storio-elements-editor in a Next.js project

Usage
  storio-editor init [options]           Set up the library in this project
  storio-editor add-page <key> [options] Create a new editable page (content, view, route, config entry)
  storio-editor scan <file> [options]    Make an existing page editable: moves its texts to content/<page>.json,
                                      wraps sections in <CmsSection> and texts in <CmsField>, registers it (backs up the file)
  storio-editor doctor [options]         Check the setup and say what to fix

scan options
  --page <key>              Page key (default: from the route; "/" is "home")
  --route <path>            Public URL (default: from the file's place under app/)
  --title <text>            Page name shown in the CMS
  --component <Name>        Component to convert (default: the default export)
  --add-use-client          Add "use client" to a page that has no server-only code
  --collection <key>        For a [slug] or [id] page: the collection whose records it shows
  --parent <page key>       For a [slug] or [id] page: the list page it belongs to (e.g. blog)
  --dry-run                 Show the texts it would move, change nothing

add-page options
  --title <text>            Page title shown in the CMS (default: made from the key)
  --route <path>            Public route (default: /<key>)
  --sections <a,b,c>        Section keys (default: hero,content)
  --dry-run                 Show what would be created, change nothing

doctor options
  --api-url <url>           Check this Django API instead of the one in cms.config.ts
  --frontend-origin <url>   Origin to test CORS with (default: http://localhost:3000)
  --production              Check a production setup: HTTPS, Secure cookies, same-site domains, CORS,
                            DEBUG off, env-based API URL, server rendering. Needs --frontend-origin
                            (your public site URL) and --api-url (or NEXT_PUBLIC_CMS_API_URL)

init options
  --backend <files|django>  Where content is stored (default: files)
                              files   a JSON file inside this Next.js app
                              django  a Django API running django-storio-elements-editor
  --api-url <url>           Django API base URL (default: http://localhost:8000/api/cms)
  --django-dir <path>       Folder of your Django project (has manage.py). Also sets up Django:
                            installs django-storio-elements-editor, edits settings.py and urls.py (with
                            backups), and runs the migration. Implies --backend django
  --frontend-origin <url>   Where this Next.js site runs, allowed by Django (default: http://localhost:3000)
  --auth <token|session>    How editors sign in (django backend, default: token)
                              token    a sign-in form in your React admin; works across domains
                              session  Django's own login page (same domain only)
  --admin-path <path>       Folder of the CMS screen under app/ (default: admin/cms)
                              route groups are allowed: "(admin)/dashboard/cms"
  --no-example              Do not create the example page at /cms-example
  --no-install              Do not install missing dependencies
  --dry-run                 Show what would happen without changing anything
  --force                   Overwrite existing files that differ
  -y, --yes                 Accept defaults, ask nothing
  --cwd <dir>               Project folder (default: current folder)
  -h, --help                Show this help
  -v, --version             Show the version
`;
function parseArgs(argv) {
  const flags = /* @__PURE__ */ new Map();
  let command = null;
  const positionals = [];
  const valueFlags = /* @__PURE__ */ new Set(["backend", "api-url", "admin-path", "cwd", "django-dir", "frontend-origin", "title", "route", "sections", "page", "component", "auth", "collection", "parent"]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-y") flags.set("yes", true);
    else if (arg === "-h") flags.set("help", true);
    else if (arg === "-v") flags.set("version", true);
    else if (arg.startsWith("--")) {
      const [name, inline] = arg.slice(2).split("=", 2);
      if (valueFlags.has(name)) {
        const value = inline ?? argv[++i];
        if (value === void 0 || value.startsWith("--")) throw new CliError(`Option --${name} needs a value.`);
        flags.set(name, value);
      } else {
        flags.set(name, true);
      }
    } else if (!command) {
      command = arg;
    } else {
      positionals.push(arg);
    }
  }
  return { command, positionals, flags };
}
var useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
var paint = (code) => (text) => useColor ? `\x1B[${code}m${text}\x1B[0m` : text;
var green = paint(32);
var yellow = paint(33);
var dim = paint(2);
var bold = paint(1);
var red = paint(31);
var SYMBOL = {
  created: (s) => green(s),
  modified: (s) => green(s),
  overwritten: (s) => yellow(s),
  unchanged: (s) => dim(s),
  skipped: (s) => yellow(s)
};
var LABEL = {
  created: "+ created    ",
  modified: "~ modified   ",
  overwritten: "! overwritten",
  unchanged: "= unchanged  ",
  skipped: "- skipped    "
};
async function runDoctor(cwd, flags) {
  const production = flags.has("production");
  const tokenAuth = usesTokenAuth(import_node_path8.default.resolve(cwd));
  const givenOrigin = flags.get("frontend-origin");
  const origin = givenOrigin ?? "http://localhost:3000";
  const local = checkProject(import_node_path8.default.resolve(cwd));
  const checks = [...local.checks];
  if (production) {
    checks.push(...checkProductionFiles(import_node_path8.default.resolve(cwd)));
    const apiUrl = flags.get("api-url") ?? process.env.NEXT_PUBLIC_CMS_API_URL ?? null;
    if (!givenOrigin) checks.push({ level: "fail", title: "No site URL given", fix: "Pass --frontend-origin https://your-site.com (the public URL of the site)." });
    if (local.djangoBaseUrl !== null || apiUrl) {
      if (!apiUrl) checks.push({ level: "fail", title: "No production API URL given", fix: "Pass --api-url https://api.your-site.com/api/cms, or set NEXT_PUBLIC_CMS_API_URL." });
      else if (givenOrigin) checks.push(...await checkProductionApi(apiUrl, givenOrigin, void 0, { tokenAuth }));
    }
  } else {
    const apiUrl = flags.get("api-url") ?? local.djangoBaseUrl;
    if (apiUrl) checks.push(...await checkDjango(apiUrl, origin, void 0, { tokenAuth }));
  }
  const icon = { ok: green("  ok  "), warn: yellow(" warn "), fail: red(" FAIL ") };
  console.log("");
  for (const c of checks) {
    console.log(`${icon[c.level]} ${c.title}`);
    if (c.fix) console.log(dim(`        -> ${c.fix}`));
  }
  const { ok, warn, fail } = summarize(checks);
  console.log("");
  console.log(`${ok} ok, ${warn} warning${warn === 1 ? "" : "s"}, ${fail} problem${fail === 1 ? "" : "s"}.`);
  if (local.djangoBaseUrl) {
    console.log(
      dim(
        tokenAuth ? 'Not checked: your username and password. If the sign-in form says "Invalid username or password", use a Django staff account (python manage.py createsuperuser).' : 'Not checked: whether you are logged in to Django as a staff user. If saving fails with "Failed to save", log in at your Django admin first.'
      )
    );
  }
  console.log("");
  return fail > 0 ? 1 : 0;
}
function printReport(report, dryRun, showTry = true) {
  console.log("");
  console.log(bold(dryRun ? "Dry run: nothing was changed. This is what would happen:" : "Done."));
  console.log("");
  for (const action of report.actions) {
    const note = action.note ? dim(`  (${action.note})`) : "";
    console.log(`  ${SYMBOL[action.kind](LABEL[action.kind])} ${action.file}${note}`);
  }
  if (report.installed.length > 0) console.log(`  ${green("+ installed   ")} ${report.installed.join(", ")}`);
  else if (report.installCommand && dryRun) console.log(`  ${yellow("~ would run  ")} ${report.installCommand}`);
  if (report.warnings.length > 0) {
    console.log("");
    console.log(yellow("Warnings"));
    for (const w of report.warnings) console.log(`  ! ${w}`);
  }
  if (report.manual.length > 0) {
    console.log("");
    console.log(bold("Still to do by hand"));
    report.manual.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
  }
  if (!showTry) {
    console.log("");
    return;
  }
  const run = report.packageManager === "npm" ? "npm run dev" : `${report.packageManager} dev`;
  console.log("");
  console.log(bold("Try it"));
  console.log(`  1. ${run}`);
  console.log(`  2. Open http://localhost:3000${report.adminUrl}`);
  if (report.exampleUrl) {
    console.log(`  3. The "Example page" (${report.exampleUrl}) shows the pencil buttons. Hover a section and click Edit.`);
    console.log("     Copy its pattern to make your own pages editable.");
  }
  console.log("");
}
async function promptUser(options, given) {
  const rl = import_promises.default.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await askMissingOptions(options, given, (question) => rl.question(question));
  } finally {
    rl.close();
  }
}
function version() {
  try {
    const pkgPath = import_node_path8.default.join(__dirname, "..", "package.json");
    return JSON.parse(import_node_fs6.default.readFileSync(pkgPath, "utf8")).version;
  } catch {
    return "unknown";
  }
}
function normalizeAdminPath(value) {
  const cleaned = value.replace(/\\/g, "/").split("/").filter(Boolean).join("/");
  const segments = cleaned.split("/");
  const valid = segments.every((s) => /^[A-Za-z0-9_-]+$/.test(s) || /^\([A-Za-z0-9_-]+\)$/.test(s));
  if (!cleaned || !valid) {
    throw new CliError(
      `Invalid --admin-path "${value}". Use folder names (letters, digits, "-", "_") or route groups like "(admin)", separated by "/" (for example admin/cms or "(admin)/dashboard/cms").`
    );
  }
  return cleaned;
}
async function main(argv) {
  try {
    const { command, positionals, flags } = parseArgs(argv);
    if (flags.has("help") || command === "help" || !command && flags.size === 0) {
      console.log(HELP);
      return 0;
    }
    if (flags.has("version")) {
      console.log(version());
      return 0;
    }
    const cwd = typeof flags.get("cwd") === "string" ? flags.get("cwd") : process.cwd();
    if (command === "add-page") {
      if (positionals.length !== 1) throw new CliError("Usage: storio-editor add-page <key>   (for example: storio-editor add-page about)");
      const report = runAddPage({
        cwd,
        key: positionals[0],
        title: flags.get("title"),
        route: flags.get("route"),
        sections: flags.get("sections")?.split(",").map((x) => x.trim()).filter(Boolean),
        dryRun: flags.has("dry-run")
      });
      printReport(
        { actions: report.actions, warnings: report.warnings, manual: [], installed: [], installCommand: null, adminUrl: "", exampleUrl: null, packageManager: "npm", backend: "files" },
        flags.has("dry-run"),
        false
      );
      console.log(bold("Next"));
      console.log(`  1. Open ${report.route} to see the page, or the CMS screen to edit it.`);
      console.log(`  2. Replace the placeholder markup in components/*View.tsx with your own, keeping the <CmsSection> wrappers.`);
      console.log(`  3. Edit content/${report.key}.json to set the default text.
`);
      return 0;
    }
    if (command === "scan") {
      if (positionals.length !== 1) throw new CliError("Usage: storio-editor scan <file>   (for example: storio-editor scan src/app/page.tsx)");
      const dryRun = flags.has("dry-run");
      const report = runScan({
        cwd,
        file: positionals[0],
        page: flags.get("page"),
        route: flags.get("route"),
        title: flags.get("title"),
        component: flags.get("component"),
        addUseClient: flags.has("add-use-client"),
        collection: flags.get("collection"),
        parent: flags.get("parent"),
        dryRun
      });
      console.log("");
      console.log(bold(`Page "${report.page}" (${report.route}): ${report.fields.length} texts in ${report.sections.length} sections`));
      for (const s of report.sections) {
        console.log(`  ${green(s.key)} ${dim(`(${s.fields} fields)`)}`);
        for (const f of report.fields.filter((x) => x.section === s.key)) {
          const v = f.value.length > 70 ? `${f.value.slice(0, 67)}...` : f.value;
          console.log(dim(`      ${f.field}: `) + v);
        }
      }
      printReport(
        { actions: report.actions, warnings: report.warnings, manual: [], installed: [], installCommand: null, adminUrl: "", exampleUrl: null, packageManager: "npm", backend: "files" },
        dryRun,
        false
      );
      if (!dryRun) {
        console.log(bold("Next"));
        console.log(`  1. Review the change:  git diff   (original saved as ${report.backup})`);
        console.log("  2. Run your type check or build, then open the CMS and edit the page.");
        console.log("  3. Lists that were written out by hand (for example 4 copied cards) became separate fields; turn them into an array + .map() by hand if you want editors to add or remove items.\n");
      }
      return 0;
    }
    if (command === "doctor") return await runDoctor(cwd, flags);
    if (command !== "init") throw new CliError(`Unknown command "${command}". Run with --help.`);
    if (positionals.length > 0) throw new CliError(`Unexpected argument "${positionals[0]}". Run with --help.`);
    const backendFlag = flags.get("backend");
    if (backendFlag !== void 0 && backendFlag !== "files" && backendFlag !== "django") {
      throw new CliError('--backend must be "files" or "django".');
    }
    const authFlag = flags.get("auth");
    if (authFlag !== void 0 && authFlag !== "token" && authFlag !== "session") {
      throw new CliError('--auth must be "token" or "session".');
    }
    const given = new Set(flags.keys());
    let options = {
      cwd: typeof flags.get("cwd") === "string" ? flags.get("cwd") : process.cwd(),
      backend: backendFlag ?? "files",
      apiUrl: flags.get("api-url") ?? "http://localhost:8000/api/cms",
      adminPath: normalizeAdminPath(flags.get("admin-path") ?? "admin/cms"),
      example: !flags.has("no-example"),
      install: !flags.has("no-install"),
      dryRun: flags.has("dry-run"),
      force: flags.has("force"),
      djangoDir: flags.get("django-dir") ?? null,
      frontendOrigin: flags.get("frontend-origin") ?? "http://localhost:3000",
      auth: authFlag ?? "token"
    };
    if (options.djangoDir && backendFlag === void 0) options.backend = "django";
    const interactive = Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY) && !flags.has("yes");
    if (interactive) {
      options = await promptUser(options, given);
      options.adminPath = normalizeAdminPath(options.adminPath);
    }
    printReport(runInit(options), options.dryRun);
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      console.error(red(`Error: ${error.message}`));
      return 1;
    }
    throw error;
  }
}
main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
