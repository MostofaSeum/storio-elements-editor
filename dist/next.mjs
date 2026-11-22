import {
  EDIT_MODE_PARAM,
  PREVIEW_PARAM,
  findGlobalPage,
  findPage,
  isValidKey,
  mergePageContent
} from "./chunk-MZUPSDIN.mjs";

// src/next/createCmsRouteHandler.ts
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
var error = (status, detail) => json({ detail }, status);
var RESOURCES = /* @__PURE__ */ new Set(["records", "media", "collections"]);
function parseRoute(request) {
  let segments;
  try {
    segments = new URL(request.url).pathname.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return { resource: null, rest: [] };
  }
  const index = segments.findIndex((s) => RESOURCES.has(s));
  if (index === -1) return { resource: null, rest: [] };
  return { resource: segments[index], rest: segments.slice(index + 1) };
}
var kindOf = (value) => value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
function pickEditableValues(current, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return { error: "Field 'values' must be an object." };
  const values = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) return { error: `'${key}' cannot be edited.` };
    const was = kindOf(current[key]);
    const now = kindOf(value);
    const nullable = was === "null" && now === "string" || was === "string" && now === "null";
    if (was !== now && !nullable) return { error: `'${key}' must stay a ${was}.` };
    values[key] = value;
  }
  return { values };
}
function createCmsRouteHandler(options) {
  const { storage, authorize } = options;
  if (typeof authorize !== "function") {
    throw new Error('[storio-editor] createCmsRouteHandler needs an "authorize" function.');
  }
  const allowedPages = options.allowedPages ? new Set(options.allowedPages) : null;
  const maxBodyBytes = options.maxBodyBytes ?? 1024 * 1024;
  const checkKeys = (page, sectionKey) => {
    if (!isValidKey(page) || sectionKey !== void 0 && !isValidKey(sectionKey)) {
      return error(400, "Invalid page or section key.");
    }
    if (allowedPages && !allowedPages.has(page)) return error(404, `Unknown page '${page}'.`);
    return null;
  };
  const collections = options.collections ?? {};
  const findCollection = (rest) => {
    if (rest.length !== 2 && rest.length !== 3 || rest[1] !== "items") return { response: error(404, "Not found.") };
    const [key] = rest;
    const handler = isValidKey(key) && Object.prototype.hasOwnProperty.call(collections, key) ? collections[key] : void 0;
    if (!handler) return { response: error(404, `Unknown collection '${key}'. Add it to "collections" of createCmsRouteHandler.`) };
    if (rest.length === 3 && (rest[2].length === 0 || rest[2].length > 200)) return { response: error(400, "Invalid record id.") };
    return { handler };
  };
  const collectionFailure = (err) => {
    console.error("[storio-editor] collection handler failed", err);
    return error(500, "The record could not be loaded or saved. See the server log.");
  };
  const readJson = async (request) => {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > maxBodyBytes) return { response: error(413, "Content too large.") };
    try {
      const text = await request.text();
      if (text.length > maxBodyBytes) return { response: error(413, "Content too large.") };
      const body = JSON.parse(text);
      return { body: body && typeof body === "object" ? body : {} };
    } catch {
      return { response: error(400, "Body must be JSON.") };
    }
  };
  const isAuthorized = async (request) => {
    try {
      return Boolean(await authorize(request));
    } catch {
      return false;
    }
  };
  const GET = async (request) => {
    const { resource, rest } = parseRoute(request);
    const url = new URL(request.url);
    if (resource === "media") {
      if (!await isAuthorized(request)) return error(401, "Not authorised.");
      if (!storage.listMedia) return json([]);
      return json(await storage.listMedia());
    }
    if (resource === "collections") {
      if (!await isAuthorized(request)) return error(401, "Not authorised.");
      const found = findCollection(rest);
      if ("response" in found) return found.response;
      try {
        if (rest.length === 2) return json(await found.handler.list(request));
        const item = await found.handler.get(rest[2], request);
        return item ? json(item) : error(404, "Record not found.");
      } catch (err) {
        return collectionFailure(err);
      }
    }
    if (resource !== "records") return error(404, "Not found.");
    const includeDrafts = url.searchParams.get("drafts") === "1" && await isAuthorized(request);
    if (rest.length === 0) {
      const page = url.searchParams.get("page") ?? void 0;
      if (page) {
        const bad = checkKeys(page);
        if (bad) return bad;
      }
      const records = await storage.listRecords(page, { includeDrafts });
      return json(allowedPages ? records.filter((r) => allowedPages.has(r.page)) : records);
    }
    if (rest.length === 2) {
      const [page, sectionKey] = rest;
      const bad = checkKeys(page, sectionKey);
      if (bad) return bad;
      const record = await storage.getRecord(page, sectionKey, { includeDrafts });
      return json(record ?? null);
    }
    return error(404, "Not found.");
  };
  const PUT = async (request) => {
    const { resource, rest } = parseRoute(request);
    if (resource === "collections") {
      if (!await isAuthorized(request)) return error(401, "Not authorised.");
      if (rest.length !== 3) return error(404, "Not found.");
      const found = findCollection(rest);
      if ("response" in found) return found.response;
      const read = await readJson(request);
      if ("response" in read) return read.response;
      const id = rest[2];
      try {
        const current = await found.handler.get(id, request);
        if (!current) return error(404, "Record not found.");
        const picked = pickEditableValues(current, read.body.values);
        if ("error" in picked) return error(400, picked.error);
        const saved = await found.handler.save(id, picked.values, request);
        return json(saved ?? await found.handler.get(id, request) ?? { ...current, ...picked.values });
      } catch (err) {
        return collectionFailure(err);
      }
    }
    if (resource !== "records" || rest.length !== 2) return error(404, "Not found.");
    if (!await isAuthorized(request)) return error(401, "Not authorised.");
    const [page, sectionKey] = rest;
    const bad = checkKeys(page, sectionKey);
    if (bad) return bad;
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > maxBodyBytes) return error(413, "Content too large.");
    let body;
    try {
      const text = await request.text();
      if (text.length > maxBodyBytes) return error(413, "Content too large.");
      body = JSON.parse(text);
    } catch {
      return error(400, "Body must be JSON.");
    }
    if (body.content === void 0 || body.content === null) {
      return error(400, "Field 'content' is required.");
    }
    const record = await storage.saveRecord({
      page,
      sectionKey,
      content: body.content,
      isPublished: body.isPublished !== false,
      updatedBy: options.getUserName ? await options.getUserName(request) : null
    });
    return json(record);
  };
  const DELETE = async (request) => {
    const { resource, rest } = parseRoute(request);
    if (resource !== "records" || rest.length !== 2) return error(404, "Not found.");
    if (!await isAuthorized(request)) return error(401, "Not authorised.");
    const [page, sectionKey] = rest;
    const bad = checkKeys(page, sectionKey);
    if (bad) return bad;
    await storage.deleteRecord(page, sectionKey);
    return new Response(null, { status: 204 });
  };
  const POST = async (request) => {
    const { resource } = parseRoute(request);
    if (resource !== "media") return error(404, "Not found.");
    if (!await isAuthorized(request)) return error(401, "Not authorised.");
    if (!storage.uploadMedia) return error(501, "Uploads are not enabled for this storage.");
    let form;
    try {
      form = await request.formData();
    } catch {
      return error(400, "Body must be multipart/form-data.");
    }
    const files = [...form.getAll("files"), ...form.getAll("file")].filter(
      (value) => typeof value === "object" && value !== null && "arrayBuffer" in value
    );
    if (files.length === 0) return error(400, "No files uploaded.");
    const items = await storage.uploadMedia(files);
    if (items.length === 0) {
      return error(400, "No valid images. Upload JPG, PNG, WebP, SVG, GIF or AVIF files within the size limit.");
    }
    return json({ items }, 201);
  };
  return { GET, PUT, DELETE, POST };
}

// src/next/fileStorage.ts
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
var ALLOWED_EXTENSIONS = /* @__PURE__ */ new Set([".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif"]);
function fileStorage(options = {}) {
  const dir = path.resolve(options.dir ?? ".cms");
  const file = path.join(dir, "content.json");
  const mediaDir = path.resolve(options.mediaDir ?? path.join("public", "cms-uploads"));
  const mediaUrlPrefix = (options.mediaUrlPrefix ?? "/cms-uploads").replace(/\/+$/, "");
  const maxUploadBytes = options.maxUploadBytes ?? 5 * 1024 * 1024;
  let queue = Promise.resolve();
  const exclusive = (task) => {
    const run = queue.then(task, task);
    queue = run.catch(() => void 0);
    return run;
  };
  async function read() {
    try {
      const raw = await fs.readFile(file, "utf8");
      const data = JSON.parse(raw);
      return { records: Array.isArray(data.records) ? data.records : [] };
    } catch (err) {
      if (err.code === "ENOENT") return { records: [] };
      throw err;
    }
  }
  async function write(data) {
    await fs.mkdir(dir, { recursive: true });
    const tmp = `${file}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, file);
  }
  const visible = (record, opts) => opts?.includeDrafts || record.isPublished;
  return {
    async listRecords(page, opts) {
      const { records } = await read();
      return records.filter((r) => (!page || r.page === page) && visible(r, opts));
    },
    async getRecord(page, sectionKey, opts) {
      const { records } = await read();
      const record = records.find((r) => r.page === page && r.sectionKey === sectionKey);
      return record && visible(record, opts) ? record : null;
    },
    saveRecord(input) {
      return exclusive(async () => {
        const data = await read();
        const record = {
          page: input.page,
          sectionKey: input.sectionKey,
          content: input.content,
          isPublished: input.isPublished,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedBy: input.updatedBy ?? null
        };
        const index = data.records.findIndex((r) => r.page === input.page && r.sectionKey === input.sectionKey);
        if (index >= 0) data.records[index] = record;
        else data.records.push(record);
        await write(data);
        return record;
      });
    },
    deleteRecord(page, sectionKey) {
      return exclusive(async () => {
        const data = await read();
        const remaining = data.records.filter((r) => !(r.page === page && r.sectionKey === sectionKey));
        if (remaining.length !== data.records.length) await write({ records: remaining });
      });
    },
    async uploadMedia(files) {
      await fs.mkdir(mediaDir, { recursive: true });
      const saved = [];
      for (const fileItem of files) {
        const ext = path.extname(fileItem.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) continue;
        if (fileItem.size > maxUploadBytes) continue;
        const base = path.basename(fileItem.name, ext).replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 60) || "image";
        const name = `${randomUUID().slice(0, 8)}_${base}${ext}`;
        await fs.writeFile(path.join(mediaDir, name), Buffer.from(await fileItem.arrayBuffer()));
        saved.push({ url: `${mediaUrlPrefix}/${name}`, name: fileItem.name, size: fileItem.size });
      }
      return saved;
    },
    async listMedia() {
      try {
        const entries = await fs.readdir(mediaDir, { withFileTypes: true });
        return entries.filter((e) => e.isFile() && ALLOWED_EXTENSIONS.has(path.extname(e.name).toLowerCase())).map((e) => ({ url: `${mediaUrlPrefix}/${e.name}`, name: e.name }));
      } catch (err) {
        if (err.code === "ENOENT") return [];
        throw err;
      }
    }
  };
}

// src/next/getPageContent.ts
async function getPageContent(config, pageKey, options) {
  const page = findPage(config, pageKey);
  if (!page) throw new Error(`[storio-editor] Unknown page "${pageKey}".`);
  try {
    const records = await options.storage.listRecords(pageKey, { includeDrafts: options.includeDrafts });
    return mergePageContent(page, records, { includeDrafts: options.includeDrafts });
  } catch {
    return mergePageContent(page, []);
  }
}
async function getAllPageContent(config, options) {
  const entries = await Promise.all(
    config.pages.map(async (page) => [page.key, await getPageContent(config, page.key, options)])
  );
  return Object.fromEntries(entries);
}
function buildPageMetadata(content, fallback = {}) {
  const seo = content.seo;
  if (!seo || typeof seo !== "object") return fallback;
  const keywords = Array.isArray(seo.keywords) ? seo.keywords : typeof seo.keywords === "string" ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean) : fallback.keywords;
  const robots = (seo.robots ?? "").toLowerCase();
  const index = !/\bnoindex\b/.test(robots);
  const follow = !/\bnofollow\b/.test(robots);
  const fallbackTitle = typeof fallback.title === "string" ? fallback.title : void 0;
  return {
    ...fallback,
    title: seo.title || fallback.title,
    description: seo.description || fallback.description,
    keywords,
    alternates: seo.canonical ? { ...fallback.alternates, canonical: seo.canonical } : fallback.alternates,
    openGraph: {
      ...fallback.openGraph,
      title: seo.ogTitle || seo.title || fallbackTitle,
      description: seo.ogDescription || seo.description || fallback.description || void 0,
      url: seo.canonical || fallback.openGraph?.url,
      images: seo.ogImage ? [{ url: seo.ogImage }] : fallback.openGraph?.images
    },
    twitter: {
      ...fallback.twitter,
      card: seo.twitterCard || "summary_large_image",
      title: seo.ogTitle || seo.title || fallbackTitle,
      description: seo.ogDescription || seo.description || fallback.description || void 0,
      images: seo.ogImage ? [seo.ogImage] : fallback.twitter?.images
    },
    robots: seo.robots ? { index, follow } : fallback.robots
  };
}
function buildSiteMetadata(seo, fallback = {}) {
  if (!seo || typeof seo !== "object") return fallback;
  const page = buildPageMetadata({ seo }, fallback);
  const defaultTitle = seo.title || seo.siteName || (typeof fallback.title === "string" ? fallback.title : void 0);
  const template = seo.titleTemplate && seo.titleTemplate.includes("%s") ? seo.titleTemplate : void 0;
  return {
    ...page,
    title: template && defaultTitle ? { default: defaultTitle, template } : defaultTitle ?? fallback.title,
    openGraph: {
      ...page.openGraph,
      title: seo.ogTitle || defaultTitle,
      siteName: seo.siteName || fallback.openGraph?.siteName
    },
    twitter: { ...page.twitter, title: seo.ogTitle || defaultTitle },
    icons: seo.favicon ? { icon: seo.favicon } : fallback.icons
  };
}
async function getSiteMetadata(config, options) {
  const globalPage = findGlobalPage(config);
  if (!globalPage) return options.fallback ?? {};
  const content = await getPageContent(config, globalPage.key, { storage: options.storage });
  return buildSiteMetadata(content[options.section ?? "seo"], options.fallback);
}
async function getPageMetadata(config, pageKey, options) {
  const content = await getPageContent(config, pageKey, { storage: options.storage });
  let fallback = options.fallback ?? {};
  const globalPage = options.site === false ? void 0 : findGlobalPage(config);
  if (globalPage && globalPage.key !== pageKey) {
    const site = await getPageContent(config, globalPage.key, { storage: options.storage });
    fallback = mergeSiteFallback(site.seo, fallback);
  }
  return buildPageMetadata(content, fallback);
}
function mergeSiteFallback(seo, fallback) {
  if (!seo || typeof seo !== "object") return fallback;
  const { title: _title, ogTitle: _ogTitle, canonical: _canonical, ...rest } = seo;
  const site = buildSiteMetadata({ ...rest, title: void 0 }, {});
  return {
    ...site,
    title: void 0,
    ...fallback,
    openGraph: { ...site.openGraph, title: void 0, url: void 0, ...fallback.openGraph },
    twitter: { ...site.twitter, title: void 0, ...fallback.twitter }
  };
}

// src/next/isCmsPreviewRequest.ts
function isCmsPreviewRequest(request, options = {}) {
  const url = new URL(request.url);
  if (url.searchParams.has(PREVIEW_PARAM) || url.searchParams.has(EDIT_MODE_PARAM)) return true;
  if (request.headers.get("sec-fetch-dest") === "iframe") return true;
  const referer = request.headers.get("referer");
  if (options.studioPath && referer) {
    try {
      return new URL(referer).pathname.startsWith(options.studioPath);
    } catch {
      return false;
    }
  }
  return false;
}
export {
  buildPageMetadata,
  buildSiteMetadata,
  createCmsRouteHandler,
  fileStorage,
  getAllPageContent,
  getPageContent,
  getPageMetadata,
  getSiteMetadata,
  isCmsPreviewRequest
};
