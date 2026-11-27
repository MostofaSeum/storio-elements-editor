/**
 * Smoke tests: the package entry points load, the `storio-editor` command runs end to end
 * against a throwaway Next.js project, and the storage adapters round-trip JSON.
 * Deeper behaviour is covered by the other test files.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { memoryAdapter, restAdapter } from '../src/adapters';
import { fileStorage } from '../src/next';

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
  version: string;
  bin: Record<string, string>;
  exports: Record<string, string | Record<string, string>>;
};

describe('package exports', () => {
  const entries = ['index', 'site', 'admin', 'adapters', 'next', 'icons'];

  it.each(entries)('source entry %s loads and exports something', async (name) => {
    const file = name === 'index' ? '../src/index' : `../src/${name}/index`;
    const mod = (await import(file)) as Record<string, unknown>;
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });

  it('every file named in package.json "exports" and "bin" exists', () => {
    const targets: string[] = [];
    for (const value of Object.values(pkg.exports)) {
      if (typeof value === 'string') targets.push(value);
      else targets.push(...Object.values(value));
    }
    targets.push(...Object.values(pkg.bin));
    const missing = targets.filter((t) => !fs.existsSync(path.join(ROOT, t)));
    expect(missing).toEqual([]);
  });

  it.each(entries)('built CommonJS entry dist/%s.js loads', (name) => {
    const req = createRequire(path.join(ROOT, 'package.json'));
    const mod = req(path.join(ROOT, 'dist', `${name}.js`)) as Record<string, unknown>;
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});

const LAYOUT = `import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

const PAGE = `export default function Home() {
  return (
    <main>
      <section className="hero">
        <h1>Build faster websites</h1>
        <p>Edit every word of this page in the browser.</p>
      </section>
      <section className="features">
        <h2>Why teams pick us</h2>
        <p>Fast, simple and friendly.</p>
      </section>
    </main>
  );
}
`;

describe('storio-editor CLI against a fixture project', () => {
  let tmp: string;
  let project: string;
  let cli: string;

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storio-smoke-'));

    // Bundle the CLI from source the way tsup does, next to a copy of package.json
    // (the CLI reads its version from ../package.json).
    cli = path.join(tmp, 'pkg', 'dist', 'cli.js');
    await build({
      entryPoints: [path.join(ROOT, 'src/cli/index.ts')],
      outfile: cli,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      logLevel: 'silent',
    });
    fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(tmp, 'pkg', 'package.json'));

    // A minimal Next.js App Router project.
    project = path.join(tmp, 'site');
    fs.mkdirSync(path.join(project, 'app'), { recursive: true });
    fs.writeFileSync(
      path.join(project, 'package.json'),
      JSON.stringify({ name: 'fixture', private: true, dependencies: { next: '15.1.7', react: '19.0.0', 'react-dom': '19.0.0' } }, null, 2)
    );
    fs.writeFileSync(path.join(project, 'tsconfig.json'), '{ "compilerOptions": { "resolveJsonModule": true, "jsx": "preserve", "paths": { "@/*": ["./*"] } } }');
    fs.writeFileSync(path.join(project, 'app', 'layout.tsx'), LAYOUT);
    fs.writeFileSync(path.join(project, 'app', 'globals.css'), 'body { margin: 0; }\n');
    fs.writeFileSync(path.join(project, 'app', 'page.tsx'), PAGE);
    // `scan` loads TypeScript from the project, as it would in a real app.
    fs.mkdirSync(path.join(project, 'node_modules'));
    fs.symlinkSync(path.join(ROOT, 'node_modules', 'typescript'), path.join(project, 'node_modules', 'typescript'), 'junction');
  }, 60_000);

  afterAll(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  const run = (...args: string[]) => {
    const result = spawnSync(process.execPath, [cli, ...args, '--cwd', project], {
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
      input: '',
      timeout: 60_000,
    });
    // A crash prints a Node stack trace; a handled problem prints a plain message.
    expect(result.stderr).not.toMatch(/^\s+at .+:\d+:\d+\)?$/m);
    return result;
  };

  it('--version prints the package version', () => {
    const result = run('--version');
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(pkg.version);
  });

  it('init sets up the project', () => {
    const result = run('init', '--yes', '--no-install', '--no-example');
    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(path.join(project, 'cms.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(project, 'app', 'admin', 'cms', 'page.tsx'))).toBe(true);
  });

  it('add-page creates a page', () => {
    const result = run('add-page', 'about', '--sections', 'hero,team');
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(fs.readFileSync(path.join(project, 'content', 'about.json'), 'utf8'))).toHaveProperty('team');
    expect(fs.readFileSync(path.join(project, 'cms.config.ts'), 'utf8')).toContain("'about'");
  });

  it('scan makes an existing page editable', () => {
    const result = run('scan', 'app/page.tsx', '--page', 'landing', '--add-use-client');
    expect(result.status, result.stderr).toBe(0);
    const content = fs.readFileSync(path.join(project, 'content', 'landing.json'), 'utf8');
    expect(content).toContain('Build faster websites');
    expect(fs.readFileSync(path.join(project, 'app', 'page.tsx'), 'utf8')).toContain('CmsField');
  });

  it('doctor checks the project and reports', () => {
    const result = run('doctor');
    expect([0, 1]).toContain(result.status);
    expect(result.stdout).toMatch(/\d+ ok, \d+ warnings?, \d+ problems?\./);
  });
});

describe('storage adapters read and write JSON', () => {
  const record = {
    page: 'home',
    sectionKey: 'hero',
    content: { title: 'Hello', items: [{ label: 'A', count: 1 }], nested: { on: true, nothing: null } },
    isPublished: true,
  };

  it('fileStorage writes a JSON file and reads it back', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'storio-file-'));
    try {
      const storage = fileStorage({ dir: path.join(dir, '.cms'), mediaDir: path.join(dir, 'uploads') });
      expect(await storage.listRecords()).toEqual([]);

      await storage.saveRecord(record);
      await storage.saveRecord({ page: 'home', sectionKey: 'draft', content: { x: 1 }, isPublished: false });

      const onDisk = JSON.parse(fs.readFileSync(path.join(dir, '.cms', 'content.json'), 'utf8')) as { records: unknown[] };
      expect(onDisk.records).toHaveLength(2);

      // A fresh instance reads what the first one wrote.
      const again = fileStorage({ dir: path.join(dir, '.cms') });
      expect((await again.getRecord('home', 'hero'))?.content).toEqual(record.content);
      expect(await again.getRecord('home', 'draft')).toBeNull();
      expect(await again.getRecord('home', 'draft', { includeDrafts: true })).not.toBeNull();

      await again.deleteRecord('home', 'hero');
      expect(await again.listRecords('home', { includeDrafts: true })).toHaveLength(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('memoryAdapter stores copies, not references', async () => {
    const storage = memoryAdapter();
    const saved = await storage.saveRecord(record);
    (saved.content as { title: string }).title = 'changed';
    expect((await storage.getRecord('home', 'hero'))?.content).toEqual(record.content);
    await storage.deleteRecord('home', 'hero');
    expect(storage.dump()).toEqual([]);
  });

  it('restAdapter sends and parses JSON', async () => {
    const calls: { url: string; method: string; body: unknown; contentType: string | null }[] = [];
    const fakeFetch = (async (url: string, init: RequestInit = {}) => {
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
      calls.push({ url, method: init.method ?? 'GET', body, contentType: new Headers(init.headers).get('Content-Type') });
      const reply = { page: 'home', sectionKey: 'hero', content: body?.content ?? record.content, isPublished: true, updatedAt: '2026-01-01T00:00:00Z', updatedBy: null };
      return new Response(JSON.stringify(init.method === 'PUT' ? reply : [reply]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;

    const storage = restAdapter({ baseUrl: 'https://api.example.test/cms/', fetch: fakeFetch });
    const saved = await storage.saveRecord(record);
    expect(saved.content).toEqual(record.content);
    expect(calls[0]).toMatchObject({
      url: 'https://api.example.test/cms/records/home/hero',
      method: 'PUT',
      body: { content: record.content, isPublished: true },
      contentType: 'application/json',
    });

    const listed = await storage.listRecords('home');
    expect(listed[0].content).toEqual(record.content);
    expect(calls[1].url).toBe('https://api.example.test/cms/records?page=home');
  });
});
