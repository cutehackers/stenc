#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const COLLECTIONS = [
  { dir: "specs", suffix: ".spec.json" },
  { dir: "plans", suffix: ".plan.json" },
  { dir: "decisions", suffix: ".decision.json" },
  { dir: "agent-context", suffix: ".agent-context.json" },
];

function usage() {
  console.log(`Usage: check-rendered-pages.js [docs-dir]

Verify that every Stenc JSON document has a generated styled web page.

Arguments:
  docs-dir   Stenc static docs app path. Defaults to docs/stenc.
`);
}

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${path.relative(process.cwd(), filePath)}: invalid JSON: ${error.message}`);
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSafeMediaSrc(src) {
  if (typeof src !== "string" || src.trim().length === 0) return false;
  if (/[\u0000-\u001f\u007f]/u.test(src)) return false;
  const trimmed = src.trim();
  if (trimmed !== src) return false;
  if (!trimmed.startsWith("assets/")) return false;
  if (trimmed.includes("\\") || trimmed.includes("://")) return false;
  if (/^(javascript|data|file):/iu.test(trimmed)) return false;
  if (trimmed.split("/").some((part) => part === "" || part === "." || part === "..")) return false;
  return /^[A-Za-z0-9._~!$&'()*+,;=:@/-]+$/u.test(trimmed);
}

function collectMediaSourcesFromSections(sections, sources = []) {
  if (!Array.isArray(sections)) return sources;
  for (const section of sections) {
    if (!section || typeof section !== "object" || Array.isArray(section)) continue;
    if (Array.isArray(section.blocks)) {
      for (const block of section.blocks) {
        if (block && typeof block === "object" && !Array.isArray(block) && block.type === "media") {
          sources.push(block.src);
        }
      }
    }
    collectMediaSourcesFromSections(section.subSections, sources);
  }
  return sources;
}

function checkMediaAssets(absoluteDocsDir, jsonPath, doc, html, pageRelativePath, errors) {
  const jsonRelativePath = path.relative(absoluteDocsDir, jsonPath);
  const sources = collectMediaSourcesFromSections(doc.body?.supportingSections);
  for (const src of sources) {
    if (!isSafeMediaSrc(src)) {
      errors.push(`${jsonRelativePath}: invalid media source: ${String(src)}`);
      continue;
    }
    const sourceAssetPath = path.join(absoluteDocsDir, "content", src);
    if (!fs.existsSync(sourceAssetPath)) {
      errors.push(`${jsonRelativePath}: missing media asset: content/${src}`);
    }
    const generatedAssetPath = path.join(absoluteDocsDir, src);
    if (!fs.existsSync(generatedAssetPath)) {
      errors.push(`${jsonRelativePath}: missing generated media asset: ${src}`);
    }
    const expectedRenderedSrc = escapeHtml(`../../${src}`);
    if (!html.includes(`src="${expectedRenderedSrc}"`)) {
      errors.push(`${jsonRelativePath}: rendered page does not include media source ${expectedRenderedSrc}: ${pageRelativePath}`);
    }
  }
}

function checkRenderedPages(docsDir) {
  const errors = [];
  const absoluteDocsDir = path.resolve(docsDir);

  if (!fs.existsSync(absoluteDocsDir)) {
    return [`docs directory not found: ${absoluteDocsDir}`];
  }

  const stylesPath = path.join(absoluteDocsDir, "styles.css");
  if (!fs.existsSync(stylesPath)) {
    errors.push(`missing stylesheet: ${path.relative(absoluteDocsDir, stylesPath)}`);
  }

  for (const collection of COLLECTIONS) {
    const contentDir = path.join(absoluteDocsDir, "content", collection.dir);
    if (!fs.existsSync(contentDir)) continue;

    const documentFiles = fs
      .readdirSync(contentDir)
      .filter((name) => name.endsWith(collection.suffix))
      .sort();

    for (const fileName of documentFiles) {
      const jsonPath = path.join(contentDir, fileName);
      const doc = readJson(jsonPath, errors);
      if (!doc) continue;

      if (typeof doc.slug !== "string" || doc.slug.trim().length === 0) {
        errors.push(`${path.relative(absoluteDocsDir, jsonPath)}: missing slug`);
        continue;
      }

      const pagePath = path.join(absoluteDocsDir, collection.dir, doc.slug, "index.html");
      const pageRelativePath = path.relative(absoluteDocsDir, pagePath);
      const jsonRelativePath = path.relative(absoluteDocsDir, jsonPath);

      if (!fs.existsSync(pagePath)) {
        errors.push(`missing rendered page: ${pageRelativePath} for ${jsonRelativePath}`);
        continue;
      }

      const html = fs.readFileSync(pagePath, "utf8");
      if (!html.includes('<link rel="stylesheet" href="/styles.css"')) {
        errors.push(`rendered page is not styled: ${pageRelativePath}`);
      }
      if (!html.includes('class="document')) {
        errors.push(`rendered page is not a Stenc document page: ${pageRelativePath}`);
      }
      if (doc.title && !html.includes(escapeHtml(doc.title))) {
        errors.push(`rendered page does not include document title: ${pageRelativePath}`);
      }
      checkMediaAssets(absoluteDocsDir, jsonPath, doc, html, pageRelativePath, errors);
    }
  }

  return errors;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    usage();
    process.exit(0);
  }
  if (args.length > 1) {
    console.error("expected at most one docs-dir argument");
    usage();
    process.exit(2);
  }

  const docsDir = args[0] || "docs/stenc";
  const errors = checkRenderedPages(docsDir);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }

  console.log(`Stenc rendered page check passed: ${path.resolve(docsDir)}`);
}

if (require.main === module) {
  main();
}

module.exports = { checkRenderedPages };
