#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const COLLECTIONS = [
  { dir: "specs", label: "Specs", docType: "spec", suffix: ".spec.json" },
  { dir: "plans", label: "Plans", docType: "plan", suffix: ".plan.json" },
  { dir: "decisions", label: "Decisions", docType: "decision", suffix: ".decision.json" },
  {
    dir: "agent-context",
    label: "Agent Context",
    docType: "agent-context",
    suffix: ".agent-context.json",
  },
];
const STYLE_TEMPLATES = new Set(["task-first", "operator-console", "evidence-led"]);

function usage() {
  console.log(`Usage: setup-project.js [options]

Prepare a target repository ContextKit static documentation app.

Options:
  --project-root <path>  Target repository root. Defaults to the current directory.
  --docs-dir <path>      ContextKit static docs path. Defaults to docs/context-kit.
  --title <text>         Site title. Defaults to "Docs".
  --skip-install         Deprecated no-op kept for installer compatibility.
  --skip-open-docs-script
                        Do not write ./open-docs.sh in the target project root.
  -h, --help             Show this help.
`);
}

function parseArgs(argv) {
  const options = {
    projectRoot: process.cwd(),
    docsDir: "docs/context-kit",
    title: null,
    skipOpenDocsScript: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    }
    if (arg === "--skip-install") continue;
    if (arg === "--skip-open-docs-script") {
      options.skipOpenDocsScript = true;
      continue;
    }
    if (arg === "--docs-source") {
      throw new Error(`${arg} was removed; use --docs-dir for the ContextKit static docs app`);
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
  options.title = options.title || "Docs";
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

function shellSingleQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function readJsonIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return null;
  }
}

function hasCurrentDocumentShape(doc) {
  return Boolean(
    doc &&
      doc.schemaVersion === 1 &&
      doc.id &&
      doc.createdAt &&
      doc.updatedAt &&
      doc.links &&
      doc.page &&
      STYLE_TEMPLATES.has(doc.page.styleTemplate) &&
      doc.body,
  );
}

function exampleRuntimeSpec() {
  return {
    schemaVersion: 1,
    slug: "example-runtime",
    docType: "spec",
    id: "spec:example-runtime",
    status: "draft",
    title: "Example Runtime Contract",
    description: "Example fixed-format ContextKit spec.",
    owner: "context-kit",
    createdAt: "2026-05-19",
    updatedAt: "2026-05-19",
    links: {
      sourceOfTruth: ["content/specs/example-runtime.spec.json"],
      relatedPlans: [],
      relatedDecisions: [],
    },
    page: {
      humanSummary: "A person reads this single spec as a styled web page with stable sections.",
      agentSummary: "An AI coding agent reads this JSON artifact directly and follows exact fields.",
      styleTemplate: "task-first",
    },
    body: {
      goal: "Show the required shape for one ContextKit spec document.",
      problem: "Free-form documents drift in structure and visual treatment.",
      scope: {
        in: ["Single spec fields", "Validation commands", "Agent instructions"],
        out: ["Markdown authoring", "MDX component authoring", "Collection data inside one document"],
      },
      architecture: {
        summary: "Structured JSON stores the document contract; the fixed ContextKit page derives indexes and renders a selected style template.",
        flow: ["Author one JSON file", "Validate the artifact", "Render one web page"],
      },
      contracts: [
        {
          name: "Single document source",
          rules: ["Specs are JSON source files.", "Pages render with the shared ContextKit layout."],
        },
      ],
      surfaces: [
        {
          path: "content/specs/*.spec.json",
          role: "Spec source artifact",
          owner: "context-kit",
        },
      ],
      validation: [
        {
          command: "node skill/context-kit/scripts/validate-context-kit-doc.js docs/context-kit/content",
          purpose: "Generated docs content validates.",
        },
      ],
      agentInstructions: ["Read this JSON before changing the related implementation."],
      reviewChecklist: ["The document describes exactly one spec.", "Validation commands are current."],
      openQuestions: [],
    },
  };
}

function removeFrameworkArtifacts(docsDir) {
  for (const target of [
    `${"a"}stro.config.mjs`,
    "package.json",
    "package-lock.json",
    "node_modules",
    "src",
    "dist",
    `.${"a"}stro`,
  ]) {
    fs.rmSync(path.join(docsDir, target), { recursive: true, force: true });
  }
}

function writeGitignore(docsDir) {
  writeFile(
    path.join(docsDir, ".gitignore"),
    `# generated static pages
*.log
`,
  );
}

function writeOpenDocsScript(projectRoot, docsDir) {
  const relativeDocsDir = path.relative(projectRoot, docsDir) || ".";
  const docsDirDefault = relativeDocsDir.startsWith("..") ? docsDir : relativeDocsDir;
  const scriptPath = path.join(projectRoot, "open-docs.sh");

  writeFile(
    scriptPath,
    `#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR=${shellSingleQuote(docsDirDefault)}
PORT=""
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage: ./open-docs.sh [options]

Open this project's ContextKit static docs and stop it with Enter.

Options:
  --docs-dir <path>      Docs path inside this project. Defaults to the installed docs path.
  --port <number>        Preferred local port. Defaults to the first free port from 4321.
  --dry-run              Print resolved paths without starting the static server.
  -h, --help             Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --docs-dir)
      DOCS_DIR="\${2:-}"
      if [[ -z "\${DOCS_DIR}" ]]; then
        echo "Missing value for --docs-dir" >&2
        exit 2
      fi
      shift 2
      ;;
    --port)
      PORT="\${2:-}"
      if [[ -z "\${PORT}" ]]; then
        echo "Missing value for --port" >&2
        exit 2
      fi
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

if [[ "\${DOCS_DIR}" = /* ]]; then
  DOCS_PATH="\${DOCS_DIR}"
else
  DOCS_PATH="\${PROJECT_ROOT}/\${DOCS_DIR}"
fi

if [[ "\${DRY_RUN}" -eq 1 ]]; then
  echo "projectRoot=\${PROJECT_ROOT}"
  echo "docsPath=\${DOCS_PATH}"
  exit 0
fi

if [[ ! -f "\${DOCS_PATH}/index.html" ]]; then
  echo "ContextKit static docs not found: \${DOCS_PATH}" >&2
  echo "Run setup first, for example:" >&2
  echo "  context-kit install --docs-dir \${DOCS_DIR}" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to open the ContextKit static docs." >&2
  exit 1
fi

if [[ -z "\${PORT}" ]]; then
  PORT="$(node - <<'NODE'
const net = require("node:net");

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

(async () => {
  for (let port = 4321; port < 4400; port += 1) {
    if (await canListen(port)) {
      console.log(port);
      return;
    }
  }
  process.exit(1);
})();
NODE
)"
fi

URL="http://127.0.0.1:\${PORT}/"
(
  cd "\${DOCS_PATH}"
  node -e "const http=require('node:http'),fs=require('node:fs'),path=require('node:path');const root=process.cwd();const port=Number(process.argv[1]);const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};http.createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');let file=path.join(root,decodeURIComponent(url.pathname));if(!file.startsWith(root)){res.writeHead(403);res.end('Forbidden');return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);}).listen(port,'127.0.0.1');" "\${PORT}"
) &
SERVER_PID=$!

cleanup() {
  if kill -0 "\${SERVER_PID}" >/dev/null 2>&1; then
    kill "\${SERVER_PID}" >/dev/null 2>&1 || true
    wait "\${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 80); do
  if ! kill -0 "\${SERVER_PID}" >/dev/null 2>&1; then
    echo "ContextKit static server failed to start." >&2
    exit 1
  fi
  if curl -fsS "\${URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if command -v open >/dev/null 2>&1; then
  open "\${URL}"
fi

echo "ContextKit docs running at \${URL}"
echo "Press Enter to stop."
IFS= read -r _
`,
  );
  fs.chmodSync(scriptPath, 0o755);
}

function writeAppData(docsDir, title) {
  writeJson(path.join(docsDir, "content", "site.json"), {
    title,
    description: "Fixed-format ContextKit documentation app.",
  });

  for (const collection of COLLECTIONS) {
    ensureDirectory(path.join(docsDir, "content", collection.dir));
  }

  const exampleSpec = path.join(docsDir, "content", "specs", "example-runtime.spec.json");
  const existingExample = readJsonIfPresent(exampleSpec);
  if (!hasCurrentDocumentShape(existingExample)) {
    writeJson(exampleSpec, exampleRuntimeSpec());
  }
}

function readCollection(docsDir, collection) {
  const dir = path.join(docsDir, "content", collection.dir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => readJsonIfPresent(path.join(dir, name)))
    .filter(Boolean)
    .sort((left, right) => {
      const dateOrder = String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""));
      return dateOrder || String(left.title || "").localeCompare(String(right.title || ""));
    });
}

function renderLayout(site, title, body) {
  const pageTitle = title ? `${title} · ${site.title}` : site.title;
  const nav = COLLECTIONS.map(
    (collection) => `<a class="nav-link" href="/${collection.dir}/">${collection.label}</a>`,
  ).join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle)}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="/">${escapeHtml(site.title)}</a>
        <nav aria-label="Document collections">${nav}</nav>
      </aside>
      <main>${body}</main>
    </div>
  </body>
</html>
`;
}

function listItems(items, code = false) {
  const values = toList(items);
  if (values.length === 0) return "";
  return `<ul class="list">${values
    .map((item) => `<li>${code ? `<code>${escapeHtml(item)}</code>` : escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function renderTable(headers, rows) {
  if (rows.length === 0) return "";
  return `<table class="table"><thead><tr>${headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function renderDocument(doc, collection) {
  const links = doc.links || {};
  const page = doc.page || {};
  const body = doc.body || {};
  const scope = body.scope || {};
  const architecture = body.architecture || {};
  const template = STYLE_TEMPLATES.has(page.styleTemplate) ? page.styleTemplate : "task-first";
  const parts = [];

  parts.push(`<article class="document ${template}">
    <header class="document-header">
      <div class="kicker">${escapeHtml(collection.label)} · ${escapeHtml(template)}</div>
      <h1>${escapeHtml(doc.title)}</h1>
      <p class="description">${escapeHtml(doc.description)}</p>
      <div class="meta">
        <span class="badge">Status: ${escapeHtml(doc.status)}</span>
        <span class="badge">Owner: ${escapeHtml(doc.owner)}</span>
        <span class="badge">Updated: ${escapeHtml(doc.updatedAt)}</span>
      </div>
    </header>
    <section class="grid">
      <div class="panel"><h3>Human Summary</h3><p>${escapeHtml(page.humanSummary)}</p></div>
      <div class="panel"><h3>Agent Summary</h3><p>${escapeHtml(page.agentSummary)}</p></div>
    </section>`);

  parts.push(`<h2>Source Of Truth</h2>${listItems(links.sourceOfTruth, true)}`);
  if (links.relatedSpec) parts.push(`<h2>Related Spec</h2><p><code>${escapeHtml(links.relatedSpec)}</code></p>`);
  if (toList(links.relatedPlans).length > 0) parts.push(`<h2>Related Plans</h2>${listItems(links.relatedPlans, true)}`);
  if (body.goal) parts.push(`<h2>Goal</h2><p>${escapeHtml(body.goal)}</p>`);
  if (architecture.summary) {
    parts.push(`<h2>Architecture</h2><p>${escapeHtml(architecture.summary)}</p>${listItems(architecture.flow)}`);
  }
  if (scope.in) {
    parts.push(`<h2>Scope</h2><div class="grid"><div class="panel"><h3>In</h3>${listItems(scope.in)}</div><div class="panel"><h3>Out</h3>${listItems(scope.out)}</div></div>`);
  }
  for (const [label, value] of [
    ["Problem", body.problem],
    ["Current State", body.currentState],
    ["Target State", body.targetState],
    ["Context", body.context],
    ["Decision", body.decision],
  ]) {
    if (value) parts.push(`<h2>${label}</h2><p>${escapeHtml(value)}</p>`);
  }
  if (toList(body.contracts).length > 0) {
    parts.push(`<h2>Contracts</h2><div class="stack">${body.contracts
      .map((contract) => `<section class="panel"><h3>${escapeHtml(contract.name)}</h3>${listItems(contract.rules)}</section>`)
      .join("")}</div>`);
  }
  if (toList(body.slices).length > 0) {
    parts.push(`<h2>Implementation Slices</h2><div class="stack">${body.slices
      .map((slice) => `<section class="panel"><div class="meta"><span class="badge">${escapeHtml(slice.id)}</span><span class="badge">${escapeHtml(slice.status)}</span></div><h3>${escapeHtml(slice.title)}</h3><h4>Surfaces</h4>${listItems(slice.surfaces, true)}<h4>Steps</h4>${listItems(slice.steps)}<h4>Done When</h4>${listItems(slice.doneWhen)}</section>`)
      .join("")}</div>`);
  }
  if (toList(body.executionOrder).length > 0) parts.push(`<h2>Execution Order</h2>${listItems(body.executionOrder)}`);
  if (toList(body.risks).length > 0) {
    parts.push(`<h2>Risks</h2>${renderTable(["Risk", "Mitigation"], body.risks.map((row) => `<tr><td>${escapeHtml(row.risk)}</td><td>${escapeHtml(row.mitigation)}</td></tr>`))}`);
  }
  if (toList(body.optionsConsidered).length > 0) {
    parts.push(`<h2>Options Considered</h2>${renderTable(["Option", "Outcome"], body.optionsConsidered.map((row) => `<tr><td>${escapeHtml(row.option)}</td><td>${escapeHtml(row.outcome)}</td></tr>`))}`);
  }
  if (toList(body.consequences).length > 0) parts.push(`<h2>Consequences</h2>${listItems(body.consequences)}`);
  if (toList(body.whenToUse).length > 0) parts.push(`<h2>When To Use</h2>${listItems(body.whenToUse)}`);
  if (toList(body.requiredReading).length > 0) parts.push(`<h2>Required Reading</h2>${listItems(body.requiredReading, true)}`);
  if (toList(body.workingRules).length > 0) parts.push(`<h2>Working Rules</h2>${listItems(body.workingRules)}`);
  if (toList(body.surfaces).length > 0) {
    parts.push(`<h2>File Or Surface Map</h2>${renderTable(["Path", "Role", "Owner"], body.surfaces.map((row) => `<tr><td><code>${escapeHtml(row.path)}</code></td><td>${escapeHtml(row.role)}</td><td>${escapeHtml(row.owner)}</td></tr>`))}`);
  }
  if (toList(body.validation).length > 0) {
    parts.push(`<h2>Validation</h2>${renderTable(["Command", "Purpose"], body.validation.map((row) => `<tr><td><code class="command">${escapeHtml(row.command)}</code></td><td>${escapeHtml(row.purpose)}</td></tr>`))}`);
  }
  parts.push(`<h2>Agent Instructions</h2>${listItems(body.agentInstructions)}`);
  if (toList(body.reviewChecklist).length > 0) parts.push(`<h2>Review Checklist</h2>${listItems(body.reviewChecklist)}`);
  parts.push(`<h2>Open Questions</h2>${toList(body.openQuestions).length > 0 ? listItems(body.openQuestions) : "<p>No open questions.</p>"}</article>`);
  return parts.join("\n");
}

function writeStyles(docsDir) {
  writeFile(
    path.join(docsDir, "styles.css"),
    `:root {
  color-scheme: light;
  --bg: #f3f5f7;
  --panel: #ffffff;
  --text: #172033;
  --muted: #647084;
  --line: #dfe4ec;
  --accent: #11645d;
  --accent-2: #314a8a;
  --radius: 8px;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
a { color: var(--accent); text-underline-offset: 3px; }
code { border: 1px solid var(--line); border-radius: 6px; background: #f5f7fa; padding: 0.08rem 0.25rem; }
.shell { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100vh; }
.sidebar { border-right: 1px solid var(--line); background: #fff; height: 100vh; padding: 28px 20px; position: sticky; top: 0; }
.brand { color: var(--text); display: block; font-weight: 800; margin-bottom: 28px; text-decoration: none; }
.nav-link { border-radius: 6px; color: var(--text); display: block; padding: 7px 8px; text-decoration: none; }
.nav-link:hover { background: #e6f3f0; }
main { width: min(1120px, 100%); padding: 40px 36px 64px; }
.document-header { border-bottom: 1px solid var(--line); margin-bottom: 28px; padding-bottom: 24px; }
.kicker { color: var(--accent); font-size: 0.78rem; font-weight: 850; letter-spacing: 0; text-transform: uppercase; }
h1 { font-size: clamp(2rem, 3vw, 3rem); letter-spacing: 0; line-height: 1.08; margin: 8px 0 12px; }
h2 { border-bottom: 1px solid var(--line); font-size: 1.15rem; letter-spacing: 0; margin: 32px 0 14px; padding-bottom: 8px; }
h3 { font-size: 1rem; margin: 0 0 10px; }
h4 { color: var(--muted); font-size: 0.82rem; letter-spacing: 0; margin: 16px 0 6px; text-transform: uppercase; }
.description { color: var(--muted); max-width: 760px; }
.meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.badge { border: 1px solid var(--line); border-radius: 999px; background: #fff; color: var(--muted); font-size: 0.8rem; padding: 4px 9px; }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.panel { border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); padding: 18px; }
.stack { display: grid; gap: 14px; }
.list { margin: 0; padding-left: 1.15rem; }
.table { border-collapse: collapse; width: 100%; }
.table th, .table td { border-bottom: 1px solid var(--line); padding: 10px 8px; text-align: left; vertical-align: top; }
.table th { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; }
.command { display: block; border: 1px solid #222d3f; border-radius: 6px; background: #111827; color: #f9fafb; margin: 8px 0; overflow-x: auto; padding: 10px 12px; }
.operator-console .document-header { background: #202938; border-radius: var(--radius); color: #fff; padding: 24px; }
.operator-console .description, .operator-console .badge { color: #d7dee9; }
.operator-console .badge { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.25); }
.evidence-led .panel { border-left: 4px solid var(--accent-2); }
@media (max-width: 780px) {
  .shell { display: block; }
  .sidebar { height: auto; position: static; }
  main { padding: 28px 18px 48px; }
}
`,
  );
}

function writeStaticPages(docsDir, title) {
  const site = readJsonIfPresent(path.join(docsDir, "content", "site.json")) || {
    title,
    description: "Fixed-format ContextKit documentation app.",
  };
  writeStyles(docsDir);

  const collectionDocs = new Map(
    COLLECTIONS.map((collection) => [collection.dir, readCollection(docsDir, collection)]),
  );

  const indexCards = COLLECTIONS.map((collection) => {
    const docs = collectionDocs.get(collection.dir) || [];
    return `<a class="panel" href="/${collection.dir}/"><h3>${collection.label}</h3><p>${docs.length} document(s)</p></a>`;
  }).join("");
  writeFile(
    path.join(docsDir, "index.html"),
    renderLayout(
      site,
      null,
      `<header class="document-header"><div class="kicker">ContextKit</div><h1>${escapeHtml(site.title)}</h1><p class="description">${escapeHtml(site.description)}</p></header><section class="grid">${indexCards}</section>`,
    ),
  );

  for (const collection of COLLECTIONS) {
    const docs = collectionDocs.get(collection.dir) || [];
    const cards = docs
      .map((doc) => `<a class="panel" href="/${collection.dir}/${doc.slug}/"><h3>${escapeHtml(doc.title)}</h3><p>${escapeHtml(doc.description)}</p><div class="meta"><span class="badge">${escapeHtml(doc.status)}</span><span class="badge">${escapeHtml(doc.owner)}</span></div></a>`)
      .join("");
    writeFile(
      path.join(docsDir, collection.dir, "index.html"),
      renderLayout(
        site,
        collection.label,
        `<header class="document-header"><div class="kicker">ContextKit</div><h1>${collection.label}</h1><p class="description">Fixed-format documents rendered from structured JSON.</p></header><section class="grid">${cards || "<p>No documents yet.</p>"}</section>`,
      ),
    );
    for (const doc of docs) {
      writeFile(
        path.join(docsDir, collection.dir, doc.slug, "index.html"),
        renderLayout(site, doc.title, renderDocument(doc, collection)),
      );
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDirectory(options.docsDir);
  removeFrameworkArtifacts(options.docsDir);
  if (!options.skipOpenDocsScript) {
    writeOpenDocsScript(options.projectRoot, options.docsDir);
  }
  writeAppData(options.docsDir, options.title);
  writeGitignore(options.docsDir);
  writeStaticPages(options.docsDir, options.title);

  console.log(`Prepared ContextKit static docs at ${options.docsDir}`);
  console.log(`Run: cd ${options.projectRoot} && ./open-docs.sh`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
