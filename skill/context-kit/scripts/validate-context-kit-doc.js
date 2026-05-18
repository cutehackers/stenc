#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const REQUIRED_FIELDS = [
  "title",
  "description",
  "docType",
  "status",
  "owner",
  "appliesTo",
  "agentEntryPoints",
  "validationCommands",
  "lastUpdated",
];

const BASE_HEADINGS = [
  "Human Summary",
  "Agent Summary",
  "Source Of Truth",
  "Goal",
  "Architecture",
  "Scope",
  "Non-Goals",
  "File Or Surface Map",
  "Evidence",
  "Validation",
  "Agent Instructions",
  "Review Checklist",
  "Open Questions",
];

const REQUIRED_HEADINGS = {
  base: BASE_HEADINGS,
  spec: [
    ...BASE_HEADINGS,
    "Problem",
    "Vocabulary",
    "Contract",
    "Interfaces",
  ],
  plan: [
    ...BASE_HEADINGS,
    "Current State",
    "Target State",
    "Implementation Slices",
    "Execution Order",
    "Risks",
  ],
  decision: [
    ...BASE_HEADINGS,
    "Context",
    "Decision",
    "Options Considered",
    "Consequences",
  ],
  "agent-context": [
    ...BASE_HEADINGS,
    "When To Use",
    "Required Reading",
    "Working Rules",
  ],
};

const STARLIGHT_COMPONENT_IMPORT =
  /import\s+\{([^}]+)\}\s+from\s+['"]@astrojs\/starlight\/components['"]/g;

const ALLOWED_STARLIGHT_COMPONENTS = new Set([
  "Aside",
  "Badge",
  "Card",
  "CardGrid",
  "Code",
  "FileTree",
  "Icon",
  "LinkButton",
  "LinkCard",
  "Steps",
  "TabItem",
  "Tabs",
]);

function listFiles(inputPath) {
  const stat = fs.statSync(inputPath);
  if (stat.isFile()) return [inputPath];
  return fs.readdirSync(inputPath, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(inputPath, entry.name);
    if (entry.isDirectory()) return listFiles(child);
    if (/\.(md|mdx)$/.test(entry.name)) return [child];
    return [];
  });
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  return match[1];
}

function hasFrontmatterField(frontmatter, field) {
  return new RegExp(`^${field}:`, "m").test(frontmatter);
}

function frontmatterValue(frontmatter, field) {
  const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

function bodyHeadings(text) {
  return new Set(
    text
      .split("\n")
      .map((line) => line.match(/^##\s+(.+?)\s*$/))
      .filter(Boolean)
      .map((match) => match[1].trim()),
  );
}

function validateStarlightComponentImports(text) {
  const errors = [];
  for (const match of text.matchAll(STARLIGHT_COMPONENT_IMPORT)) {
    const names = match[1]
      .split(",")
      .map((name) => name.trim().replace(/\s+as\s+.+$/, ""))
      .filter(Boolean);

    for (const name of names) {
      if (!ALLOWED_STARLIGHT_COMPONENTS.has(name)) {
        errors.push(`unsupported Starlight component import: ${name}`);
      }
    }
  }
  return errors;
}

function validateFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const errors = [];
  const frontmatter = parseFrontmatter(text);

  errors.push(...validateStarlightComponentImports(text));

  if (!frontmatter) {
    errors.push("missing YAML frontmatter");
    return errors;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!hasFrontmatterField(frontmatter, field)) {
      errors.push(`missing frontmatter field: ${field}`);
    }
  }

  const docType = frontmatterValue(frontmatter, "docType");
  if (!docType || !REQUIRED_HEADINGS[docType]) {
    errors.push(`invalid docType: ${docType || "<missing>"}`);
    return errors;
  }

  const normalizedPath = filePath.split(path.sep).join("/");
  if (docType === "base" && !normalizedPath.endsWith("/templates/base-template.mdx")) {
    errors.push("docType base is reserved for templates/base-template.mdx");
  }

  const headings = bodyHeadings(text);
  for (const heading of REQUIRED_HEADINGS[docType]) {
    if (!headings.has(heading)) {
      errors.push(`missing required heading: ${heading}`);
    }
  }

  return errors;
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("Usage: validate-context-kit-doc.js <file-or-directory> [...]");
  process.exit(2);
}

let failureCount = 0;
for (const target of targets) {
  for (const filePath of listFiles(path.resolve(target))) {
    const errors = validateFile(filePath);
    if (errors.length > 0) {
      failureCount += 1;
      console.error(`\n${filePath}`);
      for (const error of errors) console.error(`  - ${error}`);
    }
  }
}

if (failureCount > 0) {
  console.error(`\nContextKit validation failed for ${failureCount} file(s).`);
  process.exit(1);
}

console.log("ContextKit validation passed.");
