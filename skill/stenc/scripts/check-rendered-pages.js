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
