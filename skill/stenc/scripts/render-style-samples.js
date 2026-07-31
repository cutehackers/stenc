#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { renderDocument, renderLayout } = require("./setup-project");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const EXAMPLES_ROOT = path.join(REPO_ROOT, "examples");
const DEFAULT_OUTPUT_DIR = path.join(REPO_ROOT, "samples", "stenc-doc-styles");
const SITE = { title: "Stenc Style Examples" };

const SAMPLE_DEFINITIONS = [
  {
    fileName: "task-first.html",
    title: "Task-first",
    sourcePath: path.join(REPO_ROOT, "examples", "component-catalog.spec.json"),
    styleTemplate: "task-first",
  },
  {
    fileName: "operator-console.html",
    title: "Operator console",
    sourcePath: path.join(REPO_ROOT, "examples", "component-catalog.plan.json"),
    styleTemplate: "operator-console",
  },
  {
    fileName: "evidence-led.html",
    title: "Evidence-led",
    sourcePath: path.join(REPO_ROOT, "examples", "component-catalog.spec.json"),
    styleTemplate: "evidence-led",
  },
];

function parseOutputDir(args) {
  if (args.length === 0) return DEFAULT_OUTPUT_DIR;
  if (args.length === 2 && args[0] === "--output-dir") {
    return path.resolve(args[1]);
  }
  throw new Error("Usage: render-style-samples.js [--output-dir <path>]");
}

function sampleNavigation(currentFileName) {
  return SAMPLE_DEFINITIONS.map((sample) => ({
    href: `./${sample.fileName}`,
    label: sample.title,
    ariaCurrent: sample.fileName === currentFileName ? "page" : null,
  }));
}

function renderSample(sample) {
  const source = JSON.parse(fs.readFileSync(sample.sourcePath, "utf8"));
  const document = {
    ...source,
    page: {
      ...source.page,
      styleTemplate: sample.styleTemplate,
    },
  };
  const renderedDocument = renderDocument(document, {
    docsDir: EXAMPLES_ROOT,
    mediaSrcPrefix: "../../examples/content/",
  });
  return renderLayout(SITE, sample.title, renderedDocument.html, {
    brandHref: "./index.html",
    brandLabel: "Stenc",
    navigation: sampleNavigation(sample.fileName),
    navigationLabel: "Style examples",
    sections: renderedDocument.sections,
    stylesheetHref: "./styles.css",
  });
}

function main() {
  const outputDir = parseOutputDir(process.argv.slice(2));
  fs.mkdirSync(outputDir, { recursive: true });
  for (const sample of SAMPLE_DEFINITIONS) {
    fs.writeFileSync(path.join(outputDir, sample.fileName), renderSample(sample));
  }
  console.log(`Rendered Stenc style samples at ${outputDir}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
