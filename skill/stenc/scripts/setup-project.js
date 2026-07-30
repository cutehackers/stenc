#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  generatedArtifactPaths,
  generatedGitignoreText,
} = require("./generated-artifacts");
const { renderStructuredDiagram } = require("./render-structured-diagram");
const { buildUnifiedStyles } = require("./unified-styles");

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
const DEFAULT_SITE_DESCRIPTION = "Fixed-format Stenc documentation app.";

function usage() {
  console.log(`Usage: setup-project.js [options]

Prepare a target repository Stenc static documentation app.

Options:
  --project-root <path>  Target repository root. Defaults to the current directory.
  --docs-dir <path>      Stenc static docs path. Defaults to docs/stenc.
  --title <text>         Site title. Defaults to "Docs".
  --skip-install         Deprecated no-op kept for installer compatibility.
  --skip-open-docs-script
                        Do not write ./open-docs.sh in the target project root.
  --render-only         Regenerate generated static pages without rewriting source data.
  -h, --help             Show this help.
`);
}

function parseArgs(argv) {
  const options = {
    projectRoot: process.cwd(),
    docsDir: "docs/stenc",
    title: null,
    hasTitle: false,
    renderOnly: false,
    skipOpenDocsScript: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    }
    if (arg === "--skip-install") continue;
    if (arg === "--render-only") {
      options.renderOnly = true;
      continue;
    }
    if (arg === "--skip-open-docs-script") {
      options.skipOpenDocsScript = true;
      continue;
    }
    if (arg === "--docs-source") {
      throw new Error(`${arg} was removed; use --docs-dir for the Stenc static docs app`);
    }
    const valueOptions = new Set(["--project-root", "--docs-dir", "--title"]);
    if (valueOptions.has(arg)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`missing value for ${arg}`);
      index += 1;
      if (arg === "--project-root") options.projectRoot = value;
      if (arg === "--docs-dir") options.docsDir = value;
      if (arg === "--title") {
        options.title = value;
        options.hasTitle = true;
      }
      continue;
    }
    throw new Error(`unknown option: ${arg}`);
  }

  options.projectRoot = path.resolve(options.projectRoot);
  options.docsDir = path.resolve(options.projectRoot, options.docsDir);
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

function isSafeSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isSafeLinkTarget(target) {
  if (typeof target !== "string" || target.trim().length === 0) return false;
  if (/[\u0000-\u001f\u007f]/u.test(target)) return false;
  const trimmed = target.trim();
  if (trimmed !== target) return false;
  if (trimmed.startsWith("//")) return false;
  if (trimmed.startsWith("/")) return false;
  if (/^(javascript|data|file):/iu.test(trimmed)) return false;
  if (/^(https?:\/\/|mailto:|#|\.\/|\.\.\/)/iu.test(trimmed)) return true;
  if (trimmed.includes(":")) return false;
  return /^[A-Za-z0-9._~!$&'()*+,;=:@/-]+(?:#[A-Za-z0-9._~!$&'()*+,;=:@/-]+)?$/u.test(trimmed);
}

function documentHref(collectionDir, slug) {
  if (!isSafeSlug(slug)) throw new Error(`unsafe document slug: ${slug}`);
  return `/${collectionDir}/${slug}/`;
}

function documentPagePath(docsDir, collectionDir, slug) {
  if (!isSafeSlug(slug)) throw new Error(`unsafe document slug: ${slug}`);
  const routeRoot = path.resolve(docsDir, collectionDir);
  const pagePath = path.resolve(routeRoot, slug, "index.html");
  if (!pagePath.startsWith(`${routeRoot}${path.sep}`)) {
    throw new Error(`unsafe document slug: ${slug}`);
  }
  return pagePath;
}

function readJsonIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return null;
  }
}

function resolveSiteTitle(docsDir, options) {
  if (options.hasTitle) return options.title;
  const existing = readJsonIfPresent(path.join(docsDir, "content", "site.json"));
  if (existing && typeof existing.title === "string" && existing.title.trim()) {
    return existing.title;
  }
  return "Docs";
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
  writeFile(path.join(docsDir, ".gitignore"), generatedGitignoreText());
}

function removeGeneratedArtifacts(docsDir) {
  for (const artifactPath of generatedArtifactPaths(docsDir)) {
    fs.rmSync(artifactPath, { recursive: true, force: true });
  }
}

function copyDirectoryContents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return;
  ensureDirectory(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryContents(sourcePath, targetPath);
    } else if (entry.isFile()) {
      ensureDirectory(path.dirname(targetPath));
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function copyContentAssets(docsDir) {
  copyDirectoryContents(path.join(docsDir, "content", "assets"), path.join(docsDir, "assets"));
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

Open this project's Stenc static docs and stop it with Enter.

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

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to open the Stenc static docs." >&2
  exit 1
fi

STENC_SKILLS_ROOT="\${CODEX_SKILLS_DIR:-\${HOME}/.codex/skills}"
STENC_SETUP_PROJECT_JS="\${STENC_SETUP_PROJECT_JS:-\${STENC_SKILLS_ROOT}/stenc/scripts/setup-project.js}"
if [[ ! -f "\${STENC_SETUP_PROJECT_JS}" ]]; then
  echo "Stenc renderer not found: \${STENC_SETUP_PROJECT_JS}" >&2
  echo "Install Stenc first: stenc install --docs-dir \${DOCS_DIR}" >&2
  exit 1
fi

node "\${STENC_SETUP_PROJECT_JS}" \
  --project-root "\${PROJECT_ROOT}" \
  --docs-dir "\${DOCS_DIR}" \
  --render-only \
  --skip-open-docs-script

if [[ "\${STENC_OPEN_DOCS_PRECHECK_ONLY:-0}" -eq 1 ]]; then
  echo "Stenc docs regenerated at \${DOCS_PATH}"
  exit 0
fi

if [[ ! -f "\${DOCS_PATH}/index.html" ]]; then
  echo "Stenc static docs not found: \${DOCS_PATH}" >&2
  echo "Run setup first, for example:" >&2
  echo "  stenc install --docs-dir \${DOCS_DIR}" >&2
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
  node -e "const http=require('node:http'),fs=require('node:fs'),path=require('node:path');const root=process.cwd();const port=Number(process.argv[1]);const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp'};http.createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');let pathname;try{pathname=decodeURIComponent(url.pathname);}catch(_error){res.writeHead(400);res.end('Bad request');return;}let file=path.resolve(root,'.'+pathname);const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);res.end('Forbidden');return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);}).listen(port,'127.0.0.1');" "\${PORT}"
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
    echo "Stenc static server failed to start." >&2
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

echo "Stenc docs running at \${URL}"
echo "Press Enter to stop."
IFS= read -r _
`,
  );
  fs.chmodSync(scriptPath, 0o755);
}

function writeAppData(docsDir, title) {
  const sitePath = path.join(docsDir, "content", "site.json");
  const existing = readJsonIfPresent(sitePath);
  const site = existing && typeof existing === "object" && !Array.isArray(existing)
    ? { ...existing }
    : {};
  site.title = title;
  if (typeof site.description !== "string" || !site.description.trim()) {
    site.description = DEFAULT_SITE_DESCRIPTION;
  }
  writeJson(sitePath, site);

  for (const collection of COLLECTIONS) {
    ensureDirectory(path.join(docsDir, "content", collection.dir));
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

function renderLayout(site, title, body, options = {}) {
  const pageTitle = title ? `${title} · ${site.title}` : site.title;
  const navigationItems = toList(options.navigation).length > 0
    ? options.navigation
    : COLLECTIONS.map((collection) => ({
      href: `/${collection.dir}/`,
      label: collection.label,
      ariaCurrent: options.collectionDir === collection.dir
        ? options.collectionAriaCurrent
        : null,
    }));
  const nav = navigationItems
    .map((item) => `<a class="nav-link" href="${escapeHtml(item.href)}"${item.ariaCurrent ? ` aria-current="${escapeHtml(item.ariaCurrent)}"` : ""}>${escapeHtml(item.label)}</a>`)
    .join("");
  const documentNavigation = toList(options.sections).length > 0
    ? `<nav class="document-navigation" aria-label="On this page">
          <p class="eyebrow">On this page</p>
          ${options.sections
            .map((section) => `<a class="nav-link" href="#${escapeHtml(section.id)}">${escapeHtml(section.label)}</a>`)
            .join("")}
        </nav>`
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle)}</title>
    <link rel="stylesheet" href="${escapeHtml(options.stylesheetHref || "/styles.css")}" />
  </head>
  <body>
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="${escapeHtml(options.brandHref || "/")}">${escapeHtml(options.brandLabel || site.title)}</a>
        <nav class="collection-navigation" aria-label="${escapeHtml(options.navigationLabel || "Document collections")}">${nav}</nav>
${documentNavigation ? `        ${documentNavigation}\n` : ""}      </aside>
      <main id="main-content">${body}</main>
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

function codeBlocks(blocks) {
  const values = toList(blocks);
  if (values.length === 0) return "";
  return `<div class="code-stack">${values
    .map((block) => `<pre><code class="language-${escapeHtml(block.language)}">${escapeHtml(block.content)}</code></pre>`)
    .join("")}</div>`;
}

function renderTable(headers, rows) {
  if (rows.length === 0) return "";
  return `<table class="table"><thead><tr>${headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function renderInlineSpans(spans) {
  return toList(spans).map((span) => {
    const text = escapeHtml(span.text);
    if (span.type === "strong") return `<strong>${text}</strong>`;
    if (span.type === "emphasis") return `<em>${text}</em>`;
    if (span.type === "code") return `<code>${text}</code>`;
    if (span.type === "kbd") return `<kbd>${text}</kbd>`;
    if (span.type === "mark") return `<mark>${text}</mark>`;
    if (span.type === "link") {
      if (!isSafeLinkTarget(span.target)) {
        throw new Error(`unsafe rich link target: ${span.target}`);
      }
      return `<a href="${escapeHtml(span.target)}">${text}</a>`;
    }
    return text;
  }).join("");
}

function renderRichTable(block) {
  return renderTable(
    toList(block.columns),
    toList(block.rows).map((row) =>
      `<tr>${toList(row).map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    ),
  );
}

function mediaGeneratedSrc(src, context = {}) {
  return `${context.mediaSrcPrefix || "../../"}${escapeHtml(src)}`;
}

function mediaSourceExists(block, context) {
  if (!context?.docsDir) return false;
  return fs.existsSync(path.join(context.docsDir, "content", block.src));
}

function renderMediaBlock(block, context) {
  if (!mediaSourceExists(block, context)) {
    return `<figure class="rich-block rich-media missing-media"><strong>Missing media asset</strong><code>content/${escapeHtml(block.src)}</code>${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
  }
  return `<figure class="rich-block rich-media"><img src="${mediaGeneratedSrc(block.src, context)}" alt="${escapeHtml(block.alt)}" loading="lazy" />${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
}

function renderTaskListBlock(block) {
  return `<ul class="rich-block rich-task-list">${toList(block.items)
    .map((item) => `<li><input class="task-check" type="checkbox" disabled aria-label="${escapeHtml(item.label)}"${item.checked ? " checked" : ""} /><span>${escapeHtml(item.label)}</span></li>`)
    .join("")}</ul>`;
}

function renderDiagramBlock(block) {
  return `<figure class="rich-block rich-diagram"><figcaption><span class="badge">${escapeHtml(block.language)}</span><strong>${escapeHtml(block.title)}</strong></figcaption><pre><code>${escapeHtml(block.source)}</code></pre></figure>`;
}

function renderSupportingBlock(block, context = {}) {
  const richHeadingLevel = (context.headingLevel || 3) + 1;
  if (block.type === "paragraph") {
    return `<p class="rich-block rich-paragraph">${renderInlineSpans(block.spans)}</p>`;
  }
  if (block.type === "callout") {
    return `<div class="rich-block rich-callout tone-${escapeHtml(block.tone)}" role="note" aria-label="${escapeHtml(block.title)}">${renderHeadingOrLabel(block.title, richHeadingLevel, "rich-block-title")}<p>${escapeHtml(block.body)}</p></div>`;
  }
  if (block.type === "quote") {
    return `<figure class="rich-block rich-quote"><blockquote>${escapeHtml(block.text)}</blockquote>${block.source ? `<figcaption>${escapeHtml(block.source)}</figcaption>` : ""}</figure>`;
  }
  if (block.type === "table") return renderRichTable(block);
  if (block.type === "media") return renderMediaBlock(block, context);
  if (block.type === "taskList") return renderTaskListBlock(block);
  if (block.type === "diagram") return renderDiagramBlock(block);
  if (
    block.type === "layerDiagram"
    || block.type === "flowDiagram"
    || block.type === "relationDiagram"
  ) {
    return renderStructuredDiagram(block, escapeHtml, {
      headingLevel: richHeadingLevel + 1,
    });
  }
  return "";
}

function renderSupportingBlocks(blocks, context = {}) {
  const values = toList(blocks);
  if (values.length === 0) return "";
  return `<div class="rich-blocks">${values.map((block) => renderSupportingBlock(block, context)).join("")}</div>`;
}

function renderPlanStep(step, index) {
  if (typeof step === "string") {
    return `<section class="plan-step step"><div class="meta"><span class="badge">step-${index + 1}</span></div><div class="step-instruction"><p>${escapeHtml(step)}</p></div></section>`;
  }
  return `<section class="plan-step step"><div class="meta"><span class="badge">${escapeHtml(step.id)}</span><span class="badge">${escapeHtml(step.status)}</span></div><h5>${escapeHtml(step.title)}</h5>${step.instruction ? `<div class="step-instruction"><p>${escapeHtml(step.instruction)}</p></div>` : ""}${toList(step.codeBlocks).length > 0 ? `<div class="step-code-blocks">${codeBlocks(step.codeBlocks)}</div>` : ""}${step.command ? `<div class="step-command"><h6>Run</h6><code class="command">${escapeHtml(step.command)}</code></div>` : ""}${step.expected ? `<div class="step-expected"><h6>Expected</h6><p>${escapeHtml(step.expected)}</p></div>` : ""}</section>`;
}

function renderFacts(facts, context = {}) {
  const values = toList(facts);
  if (values.length === 0) return "";
  const emphasisClass = context.template === "evidence-led"
    ? " template-emphasis emphasis-evidence"
    : "";
  return `<div class="facts${emphasisClass}">${renderTable(
    ["Label", "Value"],
    values.map((fact) => `<tr><td>${escapeHtml(fact.label)}</td><td>${escapeHtml(fact.value)}</td></tr>`),
  )}</div>`;
}

function renderSupportingLinks(links) {
  const values = toList(links);
  if (values.length === 0) return "";
  return renderTable(
    ["Label", "Target", "Purpose"],
    values.map(
      (link) =>
        `<tr><td>${escapeHtml(link.label)}</td><td><code>${escapeHtml(link.target)}</code></td><td>${escapeHtml(link.purpose)}</td></tr>`,
    ),
  );
}

function renderHeadingOrLabel(text, level, className) {
  const escapedText = escapeHtml(text);
  if (level <= 6) {
    return `<h${level} class="${className}">${escapedText}</h${level}>`;
  }
  return `<p class="${className} semantic-label"><strong>${escapedText}</strong></p>`;
}

function renderSupportingStep(step, index, headingLevel) {
  const detailLevel = headingLevel + 1;
  return `<section class="step"><div class="meta"><span class="badge">${escapeHtml(step.id || `step-${index + 1}`)}</span>${step.status ? `<span class="badge">${escapeHtml(step.status)}</span>` : ""}</div>${renderHeadingOrLabel(step.title, headingLevel, "step-title")}${step.instruction ? `<p>${escapeHtml(step.instruction)}</p>` : ""}${step.command ? `${renderHeadingOrLabel("Run", detailLevel, "step-detail-label")}<code class="command">${escapeHtml(step.command)}</code>` : ""}${step.expected ? `${renderHeadingOrLabel("Expected", detailLevel, "step-detail-label")}<p>${escapeHtml(step.expected)}</p>` : ""}${codeBlocks(step.codeBlocks)}</section>`;
}

function renderSupportingSection(section, depth = 0, context = {}) {
  const headingLevel = 3 + depth;
  const groupHeadingLevel = headingLevel + 1;
  const stepHeadingLevel = groupHeadingLevel + 1;
  const childSections = toList(section.subSections)
    .map((subSection) => renderSupportingSection(subSection, depth + 1, context))
    .join("");
  return `<section class="panel supporting-section depth-${depth}">${renderHeadingOrLabel(section.heading, headingLevel, "supporting-section-title")}<p>${escapeHtml(section.content)}</p>${listItems(section.items)}${toList(section.facts).length > 0 ? `${renderHeadingOrLabel("Facts", groupHeadingLevel, "supporting-label")}${renderFacts(section.facts, context)}` : ""}${toList(section.links).length > 0 ? `${renderHeadingOrLabel("Links", groupHeadingLevel, "supporting-label")}${renderSupportingLinks(section.links)}` : ""}${toList(section.steps).length > 0 ? `${renderHeadingOrLabel("Steps", groupHeadingLevel, "supporting-label")}<div class="step-list">${toList(section.steps).map((step, index) => renderSupportingStep(step, index, stepHeadingLevel)).join("")}</div>` : ""}${codeBlocks(section.codeBlocks)}${renderSupportingBlocks(section.blocks, { ...context, headingLevel })}${childSections ? `<div class="stack nested-sections">${childSections}</div>` : ""}</section>`;
}

function sectionClass(baseClass, template, emphasis) {
  const emphasized =
    (template === "task-first" && emphasis === "task")
    || (template === "operator-console" && emphasis === "operator")
    || (template === "evidence-led" && emphasis === "evidence");
  return [baseClass, emphasized ? `template-emphasis emphasis-${emphasis}` : ""]
    .filter(Boolean)
    .join(" ");
}

function renderSection(id, label, className, content) {
  return {
    id,
    label,
    html: `<section id="${id}" class="${className}"><h2>${label}</h2>${content}</section>`,
  };
}

function renderDocument(doc, context = {}) {
  const links = doc.links || {};
  const page = doc.page || {};
  const body = doc.body || {};
  const scope = body.scope || {};
  const architecture = body.architecture || {};
  const template = STYLE_TEMPLATES.has(page.styleTemplate) ? page.styleTemplate : "task-first";
  const parts = [];
  const sections = [];
  const addSection = (section) => {
    sections.push({ id: section.id, label: section.label });
    parts.push(section.html);
  };

  parts.push(`<article class="document ${template}">
    <header class="document-header">
      <p class="kicker">${escapeHtml(doc.docType === "agent-context" ? "Agent Context" : `${doc.docType.charAt(0).toUpperCase()}${doc.docType.slice(1)}`)}</p>
      <h1>${escapeHtml(doc.title)}</h1>
      <p class="description">${escapeHtml(doc.description)}</p>
      <dl class="document-metadata">
        <div><dt>Status</dt><dd><span class="badge status-${escapeHtml(doc.status)}${template === "operator-console" ? " template-emphasis emphasis-status" : ""}">${escapeHtml(doc.status)}</span></dd></div>
        <div><dt>Owner</dt><dd>${escapeHtml(doc.owner)}</dd></div>
        <div><dt>Updated</dt><dd>${escapeHtml(doc.updatedAt)}</dd></div>
        <div><dt>Schema</dt><dd>${escapeHtml(doc.schemaVersion)}</dd></div>
        <div><dt>Template</dt><dd>${escapeHtml(template)}</dd></div>
      </dl>
    </header>
    <div class="summary-grid">
      <section class="document-summary human-summary" aria-labelledby="human-summary-title"><h2 id="human-summary-title">Human Summary</h2><p>${escapeHtml(page.humanSummary)}</p></section>
      <section class="document-summary agent-summary" aria-labelledby="agent-summary-title"><h2 id="agent-summary-title">Agent Summary</h2><p>${escapeHtml(page.agentSummary)}</p></section>
    </div>`);

  if (toList(links.sourceOfTruth).length > 0) {
    addSection(renderSection("source-of-truth", "Source Of Truth", "source-of-truth", listItems(links.sourceOfTruth, true)));
  }
  if (links.relatedSpec) {
    addSection(renderSection("related-spec", "Related Spec", "related-spec", `<p><code>${escapeHtml(links.relatedSpec)}</code></p>`));
  }
  if (toList(links.relatedPlans).length > 0) {
    addSection(renderSection("related-plans", "Related Plans", "related-plans", listItems(links.relatedPlans, true)));
  }
  if (toList(links.relatedDecisions).length > 0) {
    addSection(renderSection("related-decisions", "Related Decisions", "related-decisions", listItems(links.relatedDecisions, true)));
  }
  if (body.goal) addSection(renderSection("goal", "Goal", "goal", `<p>${escapeHtml(body.goal)}</p>`));

  if (doc.docType === "plan" && body.workerInstructions) {
    addSection(renderSection("worker-instructions", "Worker Instructions", "worker-instructions", `<p>${escapeHtml(body.workerInstructions.note)}</p><p><strong>Tracking syntax:</strong> <code>${escapeHtml(body.workerInstructions.trackingSyntax)}</code></p><h3>Required Sub-Skills</h3>${listItems(body.workerInstructions.requiredSubSkills, true)}`));
  }
  if (doc.docType === "plan" && body.scopeCheck) {
    addSection(renderSection("scope-check", "Scope Check", "scope-check", `<div class="grid"><section class="panel"><h3>Assessment</h3><p>${escapeHtml(body.scopeCheck.assessment)}</p></section><section class="panel"><h3>Decomposition</h3><p>${escapeHtml(body.scopeCheck.decomposition)}</p></section></div>`));
  }

  if (body.problem) addSection(renderSection("problem", "Problem", "problem", `<p>${escapeHtml(body.problem)}</p>`));
  if (doc.docType !== "plan" && (scope.in || scope.out)) {
    addSection(renderSection("scope", "Scope", "scope", `<div class="scope-grid"><section class="scope-in"><h3>In</h3>${listItems(scope.in)}</section><section class="scope-out"><h3>Out</h3>${listItems(scope.out)}</section></div>`));
  }
  if (typeof body.architecture === "string" && body.architecture) {
    addSection(renderSection("architecture", "Architecture", "architecture", `<p>${escapeHtml(body.architecture)}</p>`));
  } else if (architecture.summary) {
    addSection(renderSection("architecture", "Architecture", "architecture", `<p>${escapeHtml(architecture.summary)}</p>${toList(architecture.flow).length > 0 ? `<div class="architecture-flow"><h3>Flow</h3>${listItems(architecture.flow)}</div>` : ""}`));
  }
  if (toList(body.techStack).length > 0) {
    addSection(renderSection("tech-stack", "Tech Stack", "tech-stack", listItems(body.techStack, true)));
  }
  if (body.currentState) addSection(renderSection("current-state", "Current State", "current-state", `<p>${escapeHtml(body.currentState)}</p>`));
  if (body.targetState) addSection(renderSection("target-state", "Target State", "target-state", `<p>${escapeHtml(body.targetState)}</p>`));
  if (doc.docType === "plan" && (scope.in || scope.out)) {
    addSection(renderSection("scope", "Scope", "scope", `<div class="scope-grid"><section class="scope-in"><h3>In</h3>${listItems(scope.in)}</section><section class="scope-out"><h3>Out</h3>${listItems(scope.out)}</section></div>`));
  }
  if (toList(body.requirements).length > 0) {
    addSection(renderSection("requirements", "Requirements", sectionClass("requirements", template, "task"), body.requirements
      .map((requirement) => `<section class="requirement"><div class="meta"><span class="badge">${escapeHtml(requirement.id)}</span></div><h3>${escapeHtml(requirement.title)}</h3><p>${escapeHtml(requirement.detail)}</p><h4>Acceptance Criteria</h4>${listItems(requirement.acceptanceCriteria)}</section>`)
      .join("")));
  }
  if (toList(body.approaches).length > 0) {
    addSection(renderSection("approaches", "Approaches", "approaches", body.approaches
      .map((approach) => `<section class="approach"><h3>${escapeHtml(approach.name)}</h3><h4>Tradeoffs</h4>${listItems(approach.tradeoffs)}<h4>Recommendation</h4><p>${escapeHtml(approach.recommendation)}</p></section>`)
      .join("")));
  }
  if (toList(body.components).length > 0) {
    addSection(renderSection("components", "Components", "components", body.components
      .map((component) => `<section class="component"><h3>${escapeHtml(component.name)}</h3><p>${escapeHtml(component.responsibility)}</p><h4>Interfaces</h4>${listItems(component.interfaces, true)}<h4>Dependencies</h4>${listItems(component.dependencies)}</section>`)
      .join("")));
  }
  if (toList(body.dataFlow).length > 0) addSection(renderSection("data-flow", "Data Flow", "data-flow", listItems(body.dataFlow)));
  if (toList(body.errorHandling).length > 0) {
    addSection(renderSection("error-handling", "Error Handling", "error-handling", renderTable(["Case", "Behavior"], body.errorHandling.map((row) => `<tr><td>${escapeHtml(row.case)}</td><td>${escapeHtml(row.behavior)}</td></tr>`))));
  }
  if (toList(body.contracts).length > 0) {
    addSection(renderSection("contracts", "Contracts", "contracts", body.contracts
      .map((contract) => `<section class="contract"><h3>${escapeHtml(contract.name)}</h3>${listItems(contract.rules)}</section>`)
      .join("")));
  }
  if (toList(body.fileStructure).length > 0) {
    addSection(renderSection("file-structure", "File Structure", "file-structure", renderTable(["Action", "Path", "Responsibility"], body.fileStructure.map((row) => `<tr class="file-structure-entry"><td>${escapeHtml(row.action)}</td><td><code>${escapeHtml(row.path)}</code></td><td>${escapeHtml(row.responsibility)}</td></tr>`))));
  }
  if (toList(body.slices).length > 0) {
    addSection(renderSection("plan-slices", "Implementation Slices", sectionClass("plan-slices", template, "operator"), body.slices
      .map((slice) => `<section class="plan-slice"><div class="meta"><span class="badge">${escapeHtml(slice.id)}</span><span class="badge">${escapeHtml(slice.status)}</span></div><h3>${escapeHtml(slice.title)}</h3><div class="slice-surfaces"><h4>Surfaces</h4>${listItems(slice.surfaces, true)}</div>${toList(slice.files).length > 0 ? `<div class="slice-files"><h4>Files</h4>${renderTable(["Action", "Path", "Role"], slice.files.map((row) => `<tr class="plan-file"><td>${escapeHtml(row.action)}</td><td><code>${escapeHtml(row.path)}${row.lines ? `:${escapeHtml(row.lines)}` : ""}</code></td><td>${escapeHtml(row.role)}</td></tr>`))}</div>` : ""}<div class="slice-steps"><h4>Steps</h4><div class="step-list">${toList(slice.steps).map(renderPlanStep).join("")}</div></div><div class="done-when"><h4>Done When</h4>${listItems(slice.doneWhen)}</div></section>`)
      .join("")));
  }
  if (toList(body.executionOrder).length > 0) addSection(renderSection("execution-order", "Execution Order", "execution-order", listItems(body.executionOrder)));
  if (toList(body.risks).length > 0) {
    addSection(renderSection("risks", "Risks", "risks", body.risks.map((row) => `<article class="risk"><h3>Risk</h3><p>${escapeHtml(row.risk)}</p><h4>Mitigation</h4><p>${escapeHtml(row.mitigation)}</p></article>`).join("")));
  }
  if (body.context) addSection(renderSection("context", "Context", "context", `<p>${escapeHtml(body.context)}</p>`));
  if (body.decision) addSection(renderSection("decision", "Decision", "decision", `<p>${escapeHtml(body.decision)}</p>`));
  if (toList(body.optionsConsidered).length > 0) {
    addSection(renderSection("options-considered", "Options Considered", "options-considered", renderTable(["Option", "Outcome"], body.optionsConsidered.map((row) => `<tr><td>${escapeHtml(row.option)}</td><td>${escapeHtml(row.outcome)}</td></tr>`))));
  }
  if (toList(body.consequences).length > 0) addSection(renderSection("consequences", "Consequences", "consequences", listItems(body.consequences)));
  if (toList(body.whenToUse).length > 0) addSection(renderSection("when-to-use", "When To Use", "when-to-use", listItems(body.whenToUse)));
  if (toList(body.requiredReading).length > 0) addSection(renderSection("required-reading", "Required Reading", "required-reading", listItems(body.requiredReading, true)));
  if (toList(body.workingRules).length > 0) addSection(renderSection("working-rules", "Working Rules", "working-rules", listItems(body.workingRules)));
  if (toList(body.surfaces).length > 0) {
    addSection(renderSection("surfaces", "File Or Surface Map", "surfaces", renderTable(["Path", "Role", "Owner"], body.surfaces.map((row) => `<tr class="surface"><td><code>${escapeHtml(row.path)}</code></td><td>${escapeHtml(row.role)}</td><td>${escapeHtml(row.owner)}</td></tr>`))));
  }
  if (toList(body.testingStrategy).length > 0) {
    addSection(renderSection("testing-strategy", "Testing Strategy", "testing-strategy", renderTable(["Command", "Expected"], body.testingStrategy.map((row) => `<tr><td><code class="command">${escapeHtml(row.command)}</code></td><td>${escapeHtml(row.expected)}</td></tr>`))));
  }
  if (toList(body.validation).length > 0) {
    addSection(renderSection("validation", "Validation", sectionClass("validation", template, template === "evidence-led" ? "evidence" : "task"), renderTable(["Command", "Purpose"], body.validation.map((row) => `<tr><td><code class="command">${escapeHtml(row.command)}</code></td><td>${escapeHtml(row.purpose)}</td></tr>`))));
  }
  if (toList(body.agentInstructions).length > 0) addSection(renderSection("agent-instructions", "Agent Instructions", "agent-instructions", listItems(body.agentInstructions)));
  if (toList(body.reviewChecklist).length > 0) addSection(renderSection("review-checklist", "Review Checklist", "review-checklist", listItems(body.reviewChecklist)));
  if (toList(body.selfReviewChecks).length > 0) {
    addSection(renderSection("self-review-checks", "Self Review Checks", "self-review-checks", renderTable(["Name", "Purpose"], body.selfReviewChecks.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.purpose)}</td></tr>`))));
  }
  if (body.implementationHandoff) {
    addSection(renderSection("implementation-handoff", "Implementation Handoff", "implementation-handoff", `<p><strong>Plan location:</strong> <code>${escapeHtml(body.implementationHandoff.planLocation)}</code></p><p><strong>Required skill:</strong> <code>${escapeHtml(body.implementationHandoff.requiredSkill)}</code></p>${listItems(body.implementationHandoff.notes)}`));
  }
  if (body.executionHandoff) {
    addSection(renderSection("execution-handoff", "Execution Handoff", "execution-handoff", `<p><strong>Default path:</strong> <code>${escapeHtml(body.executionHandoff.defaultPath)}</code></p>${renderTable(["Option", "Description", "Required Skill"], toList(body.executionHandoff.options).map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.description)}</td><td><code>${escapeHtml(row.requiredSkill)}</code></td></tr>`))}`));
  }
  if (toList(body.supportingSections).length > 0) {
    addSection(renderSection("supporting-sections", "Supporting Sections", "supporting-sections", body.supportingSections
      .map((section) => renderSupportingSection(section, 0, { ...context, template }))
      .join("")));
  }
  addSection(renderSection(
    "open-questions",
    "Open Questions",
    "open-questions",
    toList(body.openQuestions).length > 0
      ? listItems(body.openQuestions)
      : "<p>No open questions.</p>",
  ));
  parts.push("</article>");
  return {
    html: parts.join("\n"),
    sections,
  };
}

function writeStyles(docsDir) {
  writeFile(path.join(docsDir, "styles.css"), buildUnifiedStyles());
}

function writeStaticPages(docsDir, title) {
  const site = readJsonIfPresent(path.join(docsDir, "content", "site.json")) || {
    title,
    description: DEFAULT_SITE_DESCRIPTION,
  };
  writeStyles(docsDir);
  copyContentAssets(docsDir);

  const collectionDocs = new Map(
    COLLECTIONS.map((collection) => [collection.dir, readCollection(docsDir, collection)]),
  );

  const allDocs = [];
  for (const collection of COLLECTIONS) {
    const docs = collectionDocs.get(collection.dir) || [];
    for (const doc of docs) {
      allDocs.push({
        ...doc,
        collectionLabel: collection.label,
        collectionDir: collection.dir,
        collectionDocType: collection.docType,
      });
    }
  }

  // Sort allDocs by updatedAt descending, then title ascending
  allDocs.sort((left, right) => {
    const dateOrder = String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""));
    return dateOrder || String(left.title || "").localeCompare(String(right.title || ""));
  });

  const recentDocs = allDocs.slice(0, 10);
  let timelineHtml = "";
  if (recentDocs.length > 0) {
    const timelineItems = recentDocs
      .map((doc) => {
        return `<div class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h4 class="timeline-title">
                <a href="${documentHref(doc.collectionDir, doc.slug)}">${escapeHtml(doc.title)}</a>
              </h4>
              <div class="timeline-meta">
                <span class="timeline-badge ${escapeHtml(doc.collectionDocType)}">${escapeHtml(doc.collectionLabel)}</span>
                <span class="badge status-${escapeHtml(doc.status)}">${escapeHtml(doc.status)}</span>
                <span class="timeline-date">${escapeHtml(doc.updatedAt)}</span>
              </div>
            </div>
            <p class="timeline-desc">${escapeHtml(doc.description)}</p>
          </div>
        </div>`;
      })
      .join("\n");

    timelineHtml = `<section class="timeline-section">
      <h2>Recent Updates</h2>
      <div class="timeline">
        ${timelineItems}
      </div>
    </section>`;
  }

  const indexCards = COLLECTIONS.map((collection) => {
    const docs = collectionDocs.get(collection.dir) || [];
    return `<a class="panel" href="/${collection.dir}/"><h3>${collection.label}</h3><p>${docs.length} document(s)</p></a>`;
  }).join("");
  writeFile(
    path.join(docsDir, "index.html"),
    renderLayout(
      site,
      null,
      `<header class="document-header"><div class="kicker">Stenc</div><h1>${escapeHtml(site.title)}</h1><p class="description">${escapeHtml(site.description)}</p></header><section class="grid">${indexCards}</section>${timelineHtml}`,
    ),
  );

  for (const collection of COLLECTIONS) {
    const docs = collectionDocs.get(collection.dir) || [];
    const cards = docs
      .map((doc) => `<a class="panel" href="${documentHref(collection.dir, doc.slug)}" data-title="${escapeHtml(doc.title)}" data-updated="${escapeHtml(doc.updatedAt)}" data-created="${escapeHtml(doc.createdAt || doc.updatedAt)}"><h3>${escapeHtml(doc.title)}</h3><p>${escapeHtml(doc.description)}</p><div class="meta"><span class="badge status-${escapeHtml(doc.status)}">${escapeHtml(doc.status)}</span><span class="badge">Owner: ${escapeHtml(doc.owner)}</span><span class="badge date-badge">Updated: ${escapeHtml(doc.updatedAt)}</span></div></a>`)
      .join("");

    const sortingControls = `<div class="sorting-controls">
      <span class="sorting-label">Sort by:</span>
      <button class="sort-btn active" data-sort="updated" data-order="desc">Last Updated</button>
      <button class="sort-btn" data-sort="created" data-order="desc">Date Created</button>
      <button class="sort-btn" data-sort="title" data-order="asc">Title</button>
    </div>`;

    const sortingScript = `<script>
      document.addEventListener('DOMContentLoaded', () => {
        const grid = document.querySelector('.grid');
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll('.panel[data-updated]'));
        const buttons = document.querySelectorAll('.sort-btn');
        
        buttons.forEach(btn => {
          btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const sortBy = btn.getAttribute('data-sort');
            const order = btn.getAttribute('data-order');
            
            cards.sort((a, b) => {
              const valA = a.getAttribute('data-' + sortBy) || '';
              const valB = b.getAttribute('data-' + sortBy) || '';
              
              const cmp = valA.localeCompare(valB);
              return order === 'desc' ? -cmp : cmp;
            });
            
            cards.forEach(card => grid.appendChild(card));
          });
        });
      });
    </script>`;

    writeFile(
      path.join(docsDir, collection.dir, "index.html"),
      renderLayout(
        site,
        collection.label,
        `<header class="document-header"><div class="kicker">Stenc</div><h1>${collection.label}</h1><p class="description">Fixed-format documents rendered from structured JSON.</p></header>${sortingControls}<section class="grid">${cards || "<p>No documents yet.</p>"}</section>${sortingScript}`,
        {
          collectionDir: collection.dir,
          collectionAriaCurrent: "page",
        },
      ),
    );
    for (const doc of docs) {
      const renderedDocument = renderDocument(doc, { docsDir });
      writeFile(
        documentPagePath(docsDir, collection.dir, doc.slug),
        renderLayout(
          site,
          doc.title,
          renderedDocument.html,
          {
            collectionDir: collection.dir,
            collectionAriaCurrent: "location",
            sections: renderedDocument.sections,
          },
        ),
      );
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDirectory(options.docsDir);
  const siteTitle = resolveSiteTitle(options.docsDir, options);
  if (!options.renderOnly) {
    removeFrameworkArtifacts(options.docsDir);
    if (!options.skipOpenDocsScript) {
      writeOpenDocsScript(options.projectRoot, options.docsDir);
    }
    writeAppData(options.docsDir, siteTitle);
    writeGitignore(options.docsDir);
  }
  removeGeneratedArtifacts(options.docsDir);
  writeStaticPages(options.docsDir, siteTitle);

  console.log(`Prepared Stenc static docs at ${options.docsDir}`);
  console.log(`Run: cd ${options.projectRoot} && ./open-docs.sh`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  renderDocument,
  renderLayout,
};
