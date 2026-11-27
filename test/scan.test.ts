import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { jsxTextValue, routeFromFile, runScan, toKey } from '../src/cli/scan';

/** Compile a TSX module and render its default export, with the CMS hook returning `content`. */
function render(source: string, content: unknown): string {
  const js = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod: { exports: Record<string, unknown> } = { exports: {} };
  const fakeRequire = (id: string) => {
    if (id === 'react') return React;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    if (id === 'react/jsx-runtime') return require('react/jsx-runtime');
    if (id === 'next/link') return { __esModule: true, default: (p: { href: string; children: React.ReactNode }) => React.createElement('a', { href: p.href }, p.children) };
    if (id === '@brainicon/storio-elements-editor/site') return { CmsSection: (p: { children: React.ReactNode }) => p.children, CmsField: (p: { children: React.ReactNode }) => p.children, usePageContent: () => content };
    if (id.endsWith('.json')) return {};
    throw new Error(`unexpected import ${id}`);
  };
  new Function('module', 'exports', 'require', js)(mod, mod.exports, fakeRequire);
  const Component = (mod.exports.default ?? Object.values(mod.exports).find((v) => typeof v === 'function')) as React.FC;
  return renderToStaticMarkup(React.createElement(Component));
}

const PAGE = `"use client";

import { useState } from "react";
import Link from "next/link";

const items = [{ id: 1, name: "A" }, { id: 2, name: "B" }];

export default function Home() {
  const [count, setCount] = useState(0);
  const [loading] = useState(false);
  return (
    <div className="page">
      <header className="sticky top-0">
        <span className="brand">NovaPulse</span>
        <nav>
          <a href="#features">Features</a>
          <Link href="/admin">⚙️ Admin Panel</Link>
        </nav>
      </header>

      <section className="hero">
        <h1>
          The Next Frontier of{" "}
          <span className="grad">Intelligent Computing</span>
        </h1>
        <p>
          Django&apos;s robust ORM, combined with
          Next.js &amp; Tailwind &bull; fast.
        </p>
        <button onClick={() => setCount(count + 1)}>{loading ? "Loading..." : "Roll Quote 🎲"} {count}</button>
        <p>Testing state with <code>useState</code> hooks.</p>
      </section>

      <section id="features">
        <h2>Engine Capabilities</h2>
        {items.map((item) => (
          <div key={item.id}>
            <h3>{item.name}</h3>
            <span>Inspect →</span>
          </div>
        ))}
        <input placeholder="developer@domain.com" />
        <img src="/x.png" alt="Team photo" />
        <div data-cms-ignore>Do not touch</div>
        <p>—</p>
      </section>

      <footer>
        <p>© 2026 NovaPulse Systems.</p>
      </footer>
    </div>
  );
}
`;

function makeProject(dir: string, page = PAGE, pagePath = ['app', 'page.tsx']) {
  fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{ "compilerOptions": { "resolveJsonModule": true, "paths": { "@/*": ["./*"] } } }');
  fs.writeFileSync(
    path.join(dir, 'cms.config.ts'),
    "import { defineCms } from '@brainicon/storio-elements-editor';\n\nexport const cms = defineCms({\n  adapter: x,\n  pages: [\n    // none yet\n  ],\n});\n"
  );
  // The scan resolves typescript from the project: point it at ours.
  fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true });
  fs.symlinkSync(path.dirname(require.resolve('typescript/package.json')), path.join(dir, 'node_modules', 'typescript'), 'junction');
  const file = path.join(dir, ...pagePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page);
  return file;
}

describe('scan', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'storio-editor-scan-'));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('registers a [slug] page with its collection and parent, and asks for them', () => {
    const post = `'use client';
export default function Post() {
  return (
    <main>
      <section>
        <h2>Related posts</h2>
      </section>
    </main>
  );
}
`;
    makeProject(dir, post, ['app', 'blog', '[slug]', 'page.tsx']);
    expect(() => runScan({ cwd: dir, file: 'app/blog/[slug]/page.tsx', dryRun: true })).toThrow(/--collection/);
    expect(() => runScan({ cwd: dir, file: 'app/blog/[slug]/page.tsx', collection: 'blog', parent: 'blog', dryRun: true })).toThrow(
      /is not a page/
    );
    const report = runScan({ cwd: dir, file: 'app/blog/[slug]/page.tsx', page: 'blog-post', collection: 'blog', dryRun: false });
    expect(report.route).toBe('/blog/[slug]');
    const config = fs.readFileSync(path.join(dir, 'cms.config.ts'), 'utf8');
    expect(config).toMatch(/route: '\/blog\/\[slug\]',\r?\n\s*collection: 'blog',/);
    expect(config).toContain("key: 'blog-post'");
  });

  it('moves static texts into JSON and renders exactly the same HTML', () => {
    const file = makeProject(dir);
    const report = runScan({ cwd: dir, file: 'app/page.tsx', dryRun: false });
    const json = JSON.parse(fs.readFileSync(path.join(dir, 'content', 'home.json'), 'utf8'));
    const converted = fs.readFileSync(file, 'utf8');

    expect(report.page).toBe('home');
    expect(report.route).toBe('/');
    expect(report.sections.map((s) => s.key)).toEqual(['header', 'hero', 'features', 'footer']);
    expect(json.hero.title).toBe('The Next Frontier of');
    expect(json.hero.title2).toBe('Intelligent Computing');
    expect(json.header.text).toBe('NovaPulse');
    expect(json.hero.text).toBe("Django's robust ORM, combined with Next.js & Tailwind • fast.");
    expect(json.features.placeholder).toBe('developer@domain.com');
    expect(json.features.alt).toBe('Team photo');
    expect(JSON.stringify(json)).not.toContain('Do not touch');
    expect(JSON.stringify(json)).not.toContain('useState');
    expect(JSON.stringify(json)).not.toContain('Loading...'); // string literals in code stay code

    // Visitors see exactly the same page.
    expect(render(converted, json)).toBe(render(PAGE, {}));
    // ...and an edit shows up.
    expect(render(converted, { ...json, hero: { ...json.hero, title: 'Edited' } })).toContain('Edited');

    expect(converted).toContain('<CmsSection sectionKey="header" title="Header" buttonPlacement="fixed">');
    expect(converted).toContain("const cmsText = usePageContent<CmsPageText>('home');");
    expect(converted).toContain('<CmsField path="title" label="Title">{cmsText.hero.title}</CmsField>');
    expect(converted).toContain("import { CmsField, CmsSection, usePageContent } from '@brainicon/storio-elements-editor/site';");
    const config = fs.readFileSync(path.join(dir, 'cms.config.ts'), 'utf8');
    expect(config).toContain("import cmsPageDefaults from '@/content/home.json';");
    expect(config).toContain("key: 'home'");
    expect(config).toContain("{ key: 'features', label: '3. Features' }");
    expect(fs.readFileSync(`${file}.storio-editor.bak`, 'utf8')).toBe(PAGE);
  });

  it('keeps plain text in elements that cannot hold a field wrapper', () => {
    const select = '"use client";\nexport default function P() {\n  return <section><h1>Choose</h1><title>Page name</title></section>;\n}\n';
    const file = makeProject(dir, select);
    runScan({ cwd: dir, file: 'app/page.tsx', dryRun: false });
    const out = fs.readFileSync(file, 'utf8');
    expect(out).toMatch(/<title>\{cmsText\.[a-zA-Z]+\.[a-zA-Z0-9]+\}<\/title>/);
    expect(out).toContain('<h1><CmsField path="title" label="Title">');
  });

  it('writes nothing in dry-run and refuses to run twice', () => {
    const file = makeProject(dir);
    runScan({ cwd: dir, file: 'app/page.tsx', dryRun: true });
    expect(fs.readFileSync(file, 'utf8')).toBe(PAGE);
    expect(fs.existsSync(path.join(dir, 'content', 'home.json'))).toBe(false);
    runScan({ cwd: dir, file: 'app/page.tsx', dryRun: false });
    expect(() => runScan({ cwd: dir, file: 'app/page.tsx', dryRun: false })).toThrow(/already/);
  });

  it('refuses Server Components unless told, and never converts async or metadata pages', () => {
    const server = PAGE.replace('"use client";\n', '').replace('import { useState } from "react";', 'import { useState } from "react";');
    makeProject(dir, server);
    expect(() => runScan({ cwd: dir, file: 'app/page.tsx', dryRun: false })).toThrow(/Server Component/);
    const asyncPage = 'export const metadata = { title: "x" };\nexport default async function P() { return <section><h1>Hi there</h1></section>; }\n';
    fs.writeFileSync(path.join(dir, 'app', 'page.tsx'), asyncPage);
    expect(() => runScan({ cwd: dir, file: 'app/page.tsx', addUseClient: true, dryRun: false })).toThrow(/Server Component/);
  });

  it('adds "use client" when asked, for a page without server-only code', () => {
    const plain = 'export default function About() {\n  return (\n    <main>\n      <section><h1>About us</h1><p>We build things.</p></section>\n    </main>\n  );\n}\n';
    const file = makeProject(dir, plain, ['app', '(site)', 'about', 'page.tsx']);
    const report = runScan({ cwd: dir, file: 'app/(site)/about/page.tsx', addUseClient: true, dryRun: false });
    expect(report.route).toBe('/about');
    expect(report.page).toBe('about');
    const out = fs.readFileSync(file, 'utf8');
    expect(out.startsWith("'use client';")).toBe(true);
    const json = JSON.parse(fs.readFileSync(path.join(dir, 'content', 'about.json'), 'utf8'));
    expect(render(out, json)).toBe(render(plain, {}));
  });

  it('handles an arrow component with an expression body and no semantic tags', () => {
    const arrow = '"use client";\nconst Card = () => (\n  <div>\n    <div><h2>Plans</h2><p>Pick one.</p></div>\n    <div><h2>Support</h2></div>\n  </div>\n);\nexport default Card;\n';
    const file = makeProject(dir, arrow, ['components', 'Card.tsx']);
    expect(() => runScan({ cwd: dir, file: 'components/Card.tsx', dryRun: false })).toThrow(/--route/);
    const report = runScan({ cwd: dir, file: 'components/Card.tsx', route: '/pricing', page: 'pricing', dryRun: false });
    expect(report.sections.map((s) => s.key)).toEqual(['plans', 'support']);
    const out = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(fs.readFileSync(path.join(dir, 'content', 'pricing.json'), 'utf8'));
    expect(render(out, json)).toBe(render(arrow, {}));
  });

  it('never reuses a name the file already has', () => {
    const clash = PAGE.replace('const [count, setCount] = useState(0);', 'const [count, setCount] = useState(0);\n  const cmsText = "mine";');
    const file = makeProject(dir, clash);
    runScan({ cwd: dir, file: 'app/page.tsx', dryRun: false });
    const out = fs.readFileSync(file, 'utf8');
    expect(out).toContain("const cmsContent = usePageContent<CmsPageText>('home');");
    expect(out).toContain('const cmsText = "mine";');
  });

  it('asks dynamic routes for their collection, and rejects existing content files and taken page keys', () => {
    makeProject(dir, PAGE, ['app', 'blog', '[slug]', 'page.tsx']);
    expect(() => runScan({ cwd: dir, file: 'app/blog/[slug]/page.tsx', dryRun: false })).toThrow(/--collection/);
    fs.mkdirSync(path.join(dir, 'content'));
    fs.writeFileSync(path.join(dir, 'content', 'blog.json'), '{}');
    expect(() => runScan({ cwd: dir, file: 'app/blog/[slug]/page.tsx', route: '/blog', dryRun: false })).toThrow(/already exists/);
  });
});

describe('scan helpers', () => {
  it('reads JSX text the way React renders it', () => {
    expect(jsxTextValue('\n   Hello\n   world  \n')).toBe('Hello world');
    expect(jsxTextValue('Tom &amp; Jerry &#169; &#x2192;')).toBe('Tom & Jerry © →');
    expect(jsxTextValue('&weird;')).toBeNull();
  });

  it('builds keys and routes', () => {
    expect(toKey('Engine Capabilities', 'x')).toBe('engineCapabilities');
    expect(toKey('123', 'fallback')).toBe('fallback');
    expect(routeFromFile('/p/app', '/p/app/page.tsx'.replace(/\//g, path.sep))).toBe('/');
    expect(routeFromFile('/p/app', '/p/app/(m)/a/b/page.tsx'.replace(/\//g, path.sep))).toBe('/a/b');
    expect(routeFromFile('/p/app', '/p/app/a/layout.tsx'.replace(/\//g, path.sep))).toBeNull();
  });
});
