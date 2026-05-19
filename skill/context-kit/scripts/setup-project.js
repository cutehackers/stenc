#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_DEPENDENCIES = {
  astro: "^6.3.3",
  typescript: "^5.9.3",
};

const DOC_TYPES = ["specs", "plans", "decisions", "agent-context"];

function usage() {
  console.log(`Usage: setup-project.js [options]

Prepare a target repository ContextKit web documentation app.

Options:
  --project-root <path>  Target repository root. Defaults to the current directory.
  --docs-dir <path>      ContextKit web app path. Defaults to docs/context-kit.
  --title <text>         Site title. Defaults to "<project-name> Docs".
  --skip-install         Write app files without running npm install.
  -h, --help             Show this help.
`);
}

function parseArgs(argv) {
  const options = {
    projectRoot: process.cwd(),
    docsDir: "docs/context-kit",
    title: null,
    skipInstall: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    }
    if (arg === "--skip-install") {
      options.skipInstall = true;
      continue;
    }
    if (arg === "--docs-source") {
      throw new Error("--docs-source was removed; ContextKit now owns a fixed web app under --docs-dir");
    }
    if (arg === "--starlight-dir") {
      throw new Error("--starlight-dir was removed; use --docs-dir for the ContextKit web app");
    }
    const valueOptions = new Set(["--project-root", "--docs-dir", "--title"]);
    if (valueOptions.has(arg)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`missing value for ${arg}`);
      index += 1;
      if (arg === "--project-root") options.projectRoot = value;
      if (arg === "--docs-dir") options.docsDir = value;
      if (arg === "--title") options.title = value;
      continue;
    }
    throw new Error(`unknown option: ${arg}`);
  }

  options.projectRoot = path.resolve(options.projectRoot);
  options.docsDir = path.resolve(options.projectRoot, options.docsDir);
  options.title =
    options.title || `${path.basename(options.projectRoot) || "Project"} Docs`;
  return options;
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, text) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, text);
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readPackageJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      name: "context-kit-docs",
      version: "0.1.0",
      private: true,
      type: "module",
    };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function contextKitPackageJson() {
  const packagePath = path.resolve(__dirname, "..", "..", "..", "package.json");
  if (!fs.existsSync(packagePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(packagePath, "utf8"));
  } catch (_error) {
    return null;
  }
}

function dependencyVersion(packageJson, section, name) {
  return packageJson?.[section]?.[name] || DEFAULT_DEPENDENCIES[name];
}

function writePackageJson(docsDir) {
  const packagePath = path.join(docsDir, "package.json");
  const packageJson = readPackageJson(packagePath);
  const contextKitPackage = contextKitPackageJson();
  if (!packageJson.name || packageJson.name === "context-kit-starlight") {
    packageJson.name = "context-kit-docs";
  }
  packageJson.private = true;
  packageJson.type = "module";
  packageJson.scripts = {
    ...packageJson.scripts,
    dev: "astro dev",
    build: "astro build",
    preview: "astro preview",
  };
  packageJson.dependencies = {
    astro: dependencyVersion(contextKitPackage, "dependencies", "astro"),
  };
  packageJson.devDependencies = {
    typescript: dependencyVersion(
      contextKitPackage,
      "devDependencies",
      "typescript",
    ),
  };
  writeJson(packagePath, packageJson);
}

function writeGitignore(docsDir) {
  writeFile(
    path.join(docsDir, ".gitignore"),
    `node_modules/
dist/
.astro/
`,
  );
}

function writeAstroConfig(docsDir) {
  writeFile(
    path.join(docsDir, "astro.config.mjs"),
    `import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
});
`,
  );
}

function writeAppData(docsDir, title) {
  writeJson(path.join(docsDir, "content", "site.json"), {
    title,
    description: "Fixed-format ContextKit documentation app.",
  });

  for (const docType of DOC_TYPES) {
    ensureDirectory(path.join(docsDir, "content", docType));
  }

  const exampleSpec = path.join(docsDir, "content", "specs", "example-runtime.spec.json");
  if (!fs.existsSync(exampleSpec)) {
    writeJson(exampleSpec, {
      slug: "example-runtime",
      docType: "spec",
      status: "draft",
      title: "Example Runtime Contract",
      description: "Example fixed-format ContextKit spec.",
      owner: "context-kit",
      lastUpdated: "2026-05-19",
      humanSummary: "A person reads this as a styled web page with stable sections.",
      agentSummary: "An AI coding agent reads this JSON contract and follows exact fields.",
      sourceOfTruth: ["content/specs/example-runtime.spec.json"],
      goal: "Show the required shape for a ContextKit spec.",
      architecture: "Structured JSON stores the contract; Astro renders the fixed page.",
      scope: {
        in: ["Fixed spec fields", "Validation commands", "Agent instructions"],
        out: ["Markdown authoring", "MDX component authoring"],
      },
      nonGoals: ["Do not hide contract meaning in prose-only pages."],
      surfaces: [
        {
          surface: "content/specs/*.spec.json",
          role: "Spec source of truth",
          owner: "context-kit",
        },
      ],
      evidence: ["Generated by ContextKit setup."],
      validationCommands: ["npm run build"],
      agentInstructions: ["Read this JSON before changing the related implementation."],
      reviewChecklist: ["The contract fields are complete.", "Validation commands are current."],
      openQuestions: [],
      problem: "Free-form documents drift in structure and visual treatment.",
      vocabulary: [{ term: "Fixed-format page", meaning: "A rendered page generated from JSON fields." }],
      contract: ["Specs are JSON source files.", "Pages render with the shared ContextKit layout."],
      interfaces: {
        public: ["content/specs/*.spec.json"],
        internal: ["src/pages/specs/[slug].astro"],
      },
      invariants: ["Source JSON and rendered page represent the same document."],
    });
  }
}

function writeLayout(docsDir) {
  writeFile(
    path.join(docsDir, "src", "layouts", "ContextKitLayout.astro"),
    `---
const { site, title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title ? \`\${title} · \${site.title}\` : site.title}</title>
    <style is:global>
      :root {
        color-scheme: light;
        --bg: #f7f8fb;
        --panel: #ffffff;
        --text: #172033;
        --muted: #647084;
        --line: #dfe4ec;
        --accent: #116a67;
        --accent-soft: #e3f4f1;
        --warn: #946200;
        --radius: 8px;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.55;
      }
      a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 3px; }
      code {
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #f1f4f8;
        padding: 0.08rem 0.25rem;
      }
      .shell {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        min-height: 100vh;
      }
      .sidebar {
        border-right: 1px solid var(--line);
        background: #ffffff;
        padding: 28px 20px;
        position: sticky;
        top: 0;
        height: 100vh;
      }
      .brand {
        font-size: 1rem;
        font-weight: 700;
        margin: 0 0 28px;
      }
      .nav-group { margin: 0 0 24px; }
      .nav-title {
        color: var(--muted);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin: 0 0 8px;
      }
      .nav-link {
        display: block;
        border-radius: 6px;
        color: var(--text);
        padding: 7px 8px;
        text-decoration: none;
      }
      .nav-link:hover { background: var(--accent-soft); }
      main {
        width: min(1120px, 100%);
        padding: 40px 36px 64px;
      }
      .document-header {
        border-bottom: 1px solid var(--line);
        margin-bottom: 28px;
        padding-bottom: 24px;
      }
      .kicker {
        color: var(--accent);
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        font-size: clamp(2rem, 3vw, 3rem);
        letter-spacing: 0;
        line-height: 1.08;
        margin: 8px 0 12px;
      }
      h2 {
        border-bottom: 1px solid var(--line);
        font-size: 1.15rem;
        letter-spacing: 0;
        margin: 32px 0 14px;
        padding-bottom: 8px;
      }
      .description { color: var(--muted); max-width: 760px; }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }
      .badge {
        border: 1px solid var(--line);
        border-radius: 999px;
        background: #fff;
        color: var(--muted);
        font-size: 0.8rem;
        padding: 4px 9px;
      }
      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }
      .panel {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--panel);
        padding: 18px;
      }
      .panel h3 { margin: 0 0 10px; font-size: 1rem; }
      .list { margin: 0; padding-left: 1.15rem; }
      .table {
        border-collapse: collapse;
        width: 100%;
      }
      .table th,
      .table td {
        border-bottom: 1px solid var(--line);
        padding: 10px 8px;
        text-align: left;
        vertical-align: top;
      }
      .table th { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; }
      .command {
        display: block;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #111827;
        color: #f9fafb;
        margin: 8px 0;
        overflow-x: auto;
        padding: 10px 12px;
      }
      @media (max-width: 780px) {
        .shell { display: block; }
        .sidebar { height: auto; position: static; }
        main { padding: 28px 18px 48px; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <aside class="sidebar">
        <p class="brand">{site.title}</p>
        <nav>
          <div class="nav-group">
            <p class="nav-title">Documents</p>
            <a class="nav-link" href="/">Overview</a>
            <a class="nav-link" href="/specs/">Specs</a>
            <a class="nav-link" href="/plans/">Plans</a>
            <a class="nav-link" href="/decisions/">Decisions</a>
            <a class="nav-link" href="/agent-context/">Agent Context</a>
          </div>
        </nav>
      </aside>
      <main>
        <slot />
      </main>
    </div>
  </body>
</html>
`,
  );
}

function writeLib(docsDir) {
  writeFile(
    path.join(docsDir, "src", "lib", "documents.js"),
    `export const DOC_TYPE_LABELS = {
  specs: 'Spec',
  plans: 'Plan',
  decisions: 'Decision',
  'agent-context': 'Agent Context',
};

export function sortDocuments(documents) {
  return [...documents].sort((a, b) => {
    const left = a.lastUpdated || '';
    const right = b.lastUpdated || '';
    if (left !== right) return right.localeCompare(left);
    return a.title.localeCompare(b.title);
  });
}

export function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
`,
  );
}

function writeDocumentComponent(docsDir) {
  writeFile(
    path.join(docsDir, "src", "components", "DocumentPage.astro"),
    `---
import { DOC_TYPE_LABELS, normalizeList } from '../lib/documents.js';
const { doc, collection } = Astro.props;
const typeLabel = DOC_TYPE_LABELS[collection] || doc.docType;
const scope = doc.scope || {};
const interfaces = doc.interfaces || {};
---
<article>
  <header class="document-header">
    <div class="kicker">{typeLabel}</div>
    <h1>{doc.title}</h1>
    <p class="description">{doc.description}</p>
    <div class="meta">
      <span class="badge">Status: {doc.status}</span>
      <span class="badge">Owner: {doc.owner}</span>
      <span class="badge">Updated: {doc.lastUpdated}</span>
    </div>
  </header>

  <section class="grid">
    <div class="panel">
      <h3>Human Summary</h3>
      <p>{doc.humanSummary}</p>
    </div>
    <div class="panel">
      <h3>Agent Summary</h3>
      <p>{doc.agentSummary}</p>
    </div>
  </section>

  <h2>Source Of Truth</h2>
  <ul class="list">{normalizeList(doc.sourceOfTruth).map((item) => <li><code>{item}</code></li>)}</ul>

  <h2>Goal</h2>
  <p>{doc.goal}</p>

  <h2>Architecture</h2>
  <p>{doc.architecture}</p>

  <h2>Scope</h2>
  <div class="grid">
    <div class="panel">
      <h3>In</h3>
      <ul class="list">{normalizeList(scope.in).map((item) => <li>{item}</li>)}</ul>
    </div>
    <div class="panel">
      <h3>Out</h3>
      <ul class="list">{normalizeList(scope.out).map((item) => <li>{item}</li>)}</ul>
    </div>
  </div>

  {doc.problem && <><h2>Problem</h2><p>{doc.problem}</p></>}
  {doc.currentState && <><h2>Current State</h2><p>{doc.currentState}</p></>}
  {doc.targetState && <><h2>Target State</h2><p>{doc.targetState}</p></>}
  {doc.decision && <><h2>Decision</h2><p>{doc.decision}</p></>}

  {normalizeList(doc.contract).length > 0 && (
    <>
      <h2>Contract</h2>
      <ul class="list">{normalizeList(doc.contract).map((item) => <li>{item}</li>)}</ul>
    </>
  )}

  {normalizeList(doc.surfaces).length > 0 && (
    <>
      <h2>File Or Surface Map</h2>
      <table class="table">
        <thead><tr><th>Surface</th><th>Role</th><th>Owner</th></tr></thead>
        <tbody>{doc.surfaces.map((row) => <tr><td><code>{row.surface}</code></td><td>{row.role}</td><td>{row.owner}</td></tr>)}</tbody>
      </table>
    </>
  )}

  {normalizeList(doc.validationCommands).length > 0 && (
    <>
      <h2>Validation</h2>
      {doc.validationCommands.map((command) => <code class="command">{command}</code>)}
    </>
  )}

  <h2>Agent Instructions</h2>
  <ul class="list">{normalizeList(doc.agentInstructions).map((item) => <li>{item}</li>)}</ul>

  <h2>Review Checklist</h2>
  <ul class="list">{normalizeList(doc.reviewChecklist).map((item) => <li>{item}</li>)}</ul>

  <h2>Open Questions</h2>
  {normalizeList(doc.openQuestions).length > 0 ? (
    <ul class="list">{normalizeList(doc.openQuestions).map((item) => <li>{item}</li>)}</ul>
  ) : (
    <p>No open questions.</p>
  )}
</article>
`,
  );
}

function writePages(docsDir) {
  writeFile(
    path.join(docsDir, "src", "pages", "index.astro"),
    `---
import Layout from '../layouts/ContextKitLayout.astro';
import site from '../../content/site.json';
---
<Layout site={site}>
  <header class="document-header">
    <div class="kicker">ContextKit</div>
    <h1>{site.title}</h1>
    <p class="description">{site.description}</p>
  </header>
  <section class="grid">
    <a class="panel" href="/specs/"><h3>Specs</h3><p>Canonical behavior and runtime contracts.</p></a>
    <a class="panel" href="/plans/"><h3>Plans</h3><p>Execution order, migration slices, and validation flow.</p></a>
    <a class="panel" href="/decisions/"><h3>Decisions</h3><p>ADR-style rationale and consequences.</p></a>
    <a class="panel" href="/agent-context/"><h3>Agent Context</h3><p>Scoped working rules for AI coding agents.</p></a>
  </section>
</Layout>
`,
  );

  for (const collection of DOC_TYPES) {
    writeFile(
      path.join(docsDir, "src", "pages", collection, "index.astro"),
      `---
import Layout from '../../layouts/ContextKitLayout.astro';
import { DOC_TYPE_LABELS, sortDocuments } from '../../lib/documents.js';
import site from '../../../content/site.json';
const modules = import.meta.glob('../../../content/${collection}/*.json', { eager: true });
const documents = sortDocuments(Object.values(modules).map((module) => module.default));
---
<Layout site={site} title={DOC_TYPE_LABELS['${collection}']}>
  <header class="document-header">
    <div class="kicker">ContextKit</div>
    <h1>{DOC_TYPE_LABELS['${collection}']}</h1>
    <p class="description">Fixed-format documents rendered from structured JSON.</p>
  </header>
  <section class="grid">
    {documents.map((doc) => (
      <a class="panel" href={\`/${collection}/\${doc.slug}/\`}>
        <h3>{doc.title}</h3>
        <p>{doc.description}</p>
        <div class="meta">
          <span class="badge">{doc.status}</span>
          <span class="badge">{doc.owner}</span>
        </div>
      </a>
    ))}
  </section>
</Layout>
`,
    );

    writeFile(
      path.join(docsDir, "src", "pages", collection, "[slug].astro"),
      `---
import Layout from '../../layouts/ContextKitLayout.astro';
import DocumentPage from '../../components/DocumentPage.astro';
import site from '../../../content/site.json';
export function getStaticPaths() {
  const modules = import.meta.glob('../../../content/${collection}/*.json', { eager: true });
  const documents = Object.values(modules).map((module) => module.default);
  return documents.map((doc) => ({ params: { slug: doc.slug }, props: { doc } }));
}
const { doc } = Astro.props;
---
<Layout site={site} title={doc.title}>
  <DocumentPage doc={doc} collection="${collection}" />
</Layout>
`,
    );
  }
}

function runNpmInstall(docsDir) {
  const npmCheck = spawnSync("npm", ["--version"], { encoding: "utf8" });
  if (npmCheck.status !== 0) {
    throw new Error("npm is required to install the ContextKit docs app");
  }

  const install = spawnSync("npm", ["install"], {
    cwd: docsDir,
    stdio: "inherit",
  });
  if (install.status !== 0) {
    throw new Error("npm install failed for the ContextKit docs app");
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDirectory(options.docsDir);
  writePackageJson(options.docsDir);
  writeGitignore(options.docsDir);
  writeAstroConfig(options.docsDir);
  fs.rmSync(path.join(options.docsDir, "src"), { recursive: true, force: true });
  writeAppData(options.docsDir, options.title);
  writeLayout(options.docsDir);
  writeLib(options.docsDir);
  writeDocumentComponent(options.docsDir);
  writePages(options.docsDir);

  if (!options.skipInstall) {
    runNpmInstall(options.docsDir);
  }

  console.log(`Prepared ContextKit docs app at ${options.docsDir}`);
  console.log(`Run: cd ${options.docsDir} && npm run dev`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
