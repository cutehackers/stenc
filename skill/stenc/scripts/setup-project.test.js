#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT_PATH = path.join(__dirname, "setup-project.js");
const COMPONENT_CATALOG_SPEC = path.join(
  REPO_ROOT,
  "examples-app",
  "content",
  "specs",
  "component-catalog.spec.json",
);
const COMPONENT_CATALOG_PLAN = path.join(
  REPO_ROOT,
  "examples-app",
  "content",
  "plans",
  "component-catalog.plan.json",
);
const COMPONENT_CATALOG_SPEC_MIRROR = path.join(
  REPO_ROOT,
  "examples",
  "component-catalog.spec.json",
);
const COMPONENT_CATALOG_PLAN_MIRROR = path.join(
  REPO_ROOT,
  "examples",
  "component-catalog.plan.json",
);

const RICH_BLOCK_CLASS_TOKENS = [
  "rich-blocks",
  "rich-block",
  "rich-paragraph",
  "rich-callout",
  "rich-quote",
  "table",
  "rich-media",
  "rich-task-list",
  "task-check",
  "rich-diagram",
  "code-stack",
  "nested-sections",
  "supporting-section",
  "step-list",
  "step",
  "command",
];

const SPEC_COMPONENT_CLASS_TOKENS = [
  "document",
  "task-first",
  "document-header",
  "description",
  "document-metadata",
  "document-summary",
  "human-summary",
  "agent-summary",
  "source-of-truth",
  "related-plans",
  "related-decisions",
  "goal",
  "architecture",
  "architecture-flow",
  "scope",
  "scope-in",
  "scope-out",
  "problem",
  "requirements",
  "requirement",
  "approaches",
  "approach",
  "components",
  "component",
  "data-flow",
  "error-handling",
  "contracts",
  "contract",
  "surfaces",
  "surface",
  "testing-strategy",
  "validation",
  "agent-instructions",
  "review-checklist",
  "self-review-checks",
  "implementation-handoff",
  "supporting-sections",
  "open-questions",
  ...RICH_BLOCK_CLASS_TOKENS,
  "tone-neutral",
  "tone-info",
  "tone-success",
  "tone-warning",
  "tone-danger",
  "language-shell",
  "language-json",
  "language-text",
];

const PLAN_COMPONENT_CLASS_TOKENS = [
  "document",
  "operator-console",
  "document-header",
  "description",
  "document-metadata",
  "document-summary",
  "human-summary",
  "agent-summary",
  "source-of-truth",
  "related-spec",
  "goal",
  "architecture",
  "tech-stack",
  "worker-instructions",
  "scope-check",
  "current-state",
  "target-state",
  "scope",
  "scope-in",
  "scope-out",
  "file-structure",
  "file-structure-entry",
  "plan-slices",
  "plan-slice",
  "slice-surfaces",
  "slice-files",
  "plan-file",
  "slice-steps",
  "plan-step",
  "step-instruction",
  "step-code-blocks",
  "step-command",
  "step-expected",
  "done-when",
  "execution-order",
  "risks",
  "risk",
  "validation",
  "agent-instructions",
  "self-review-checks",
  "execution-handoff",
  "supporting-sections",
  "open-questions",
  ...RICH_BLOCK_CLASS_TOKENS,
  "tone-info",
  "tone-success",
  "language-shell",
  "language-javascript",
  "language-json",
  "language-text",
];

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function extractClassTokens(html) {
  const tokens = new Set();
  for (const match of html.matchAll(/class="([^"]*)"/gu)) {
    for (const token of match[1].split(/\s+/u)) {
      if (token) tokens.add(token);
    }
  }
  return tokens;
}

function assertClassTokenInventory(inventories) {
  const missingGroups = inventories
    .map(({ label, html, expected }) => {
      const actual = extractClassTokens(html);
      return {
        label,
        missing: expected.filter((token) => !actual.has(token)),
      };
    })
    .filter(({ missing }) => missing.length > 0);

  if (missingGroups.length > 0) {
    const detail = missingGroups
      .map(({ label, missing }) => `${label}=[${missing.join(", ")}]`)
      .join("; ");
    assert.fail(`Missing semantic class tokens: ${detail}`);
  }
}

function assertByteIdentical(sourcePath, mirrorPath) {
  assert.equal(
    Buffer.compare(fs.readFileSync(sourcePath), fs.readFileSync(mirrorPath)),
    0,
    `Fixture mirror differs: ${path.relative(REPO_ROOT, mirrorPath)}`,
  );
}

function snapshotFiles(rootPath) {
  const snapshot = {};

  function visit(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile()) {
        snapshot[path.relative(rootPath, entryPath)] =
          fs.readFileSync(entryPath).toString("base64");
      }
    }
  }

  visit(rootPath);
  return snapshot;
}

function cssDeclarations(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = css.match(new RegExp(`(?:^|\\n)${escapedSelector}\\s*\\{([^}]*)\\}`, "u"));
  assert.ok(match, `Missing CSS selector: ${selector}`);

  return Object.fromEntries(
    match[1]
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(":");
        assert.notEqual(separator, -1, `Invalid CSS declaration in ${selector}: ${declaration}`);
        return [
          declaration.slice(0, separator).trim(),
          declaration.slice(separator + 1).trim(),
        ];
      }),
  );
}

function relativeLuminance(hexColor) {
  assert.match(hexColor, /^#[0-9a-f]{6}$/iu);
  const channels = hexColor
    .slice(1)
    .match(/.{2}/gu)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

test("semantic small-text color pairs meet WCAG AA contrast", () => {
  const { buildUnifiedStyles } = require("./unified-styles");
  const root = cssDeclarations(buildUnifiedStyles(), ":root");
  const semanticPairs = [
    ["info", "--color-info", "--color-info-tint"],
    ["success", "--color-success", "--color-success-tint"],
    ["warning", "--color-warning", "--color-warning-tint"],
    ["danger", "--color-danger", "--color-danger-tint"],
    ["relation", "--color-relation", "--color-relation-tint"],
  ];

  for (const [name, foregroundToken, backgroundToken] of semanticPairs) {
    const foreground = root[foregroundToken];
    const background = root[backgroundToken];
    const ratio = contrastRatio(foreground, background);
    assert.ok(
      ratio >= 4.5,
      `${name} small-text contrast is ${ratio.toFixed(3)}:1 for ${foreground} on ${background}`,
    );
  }
});

test("interactive control boundaries meet non-text contrast", () => {
  const { buildUnifiedStyles } = require("./unified-styles");
  const root = cssDeclarations(buildUnifiedStyles(), ":root");
  const controlPairs = [
    ["control on page", "--color-control-border", "--color-page"],
    ["control on surface", "--color-control-border", "--color-surface"],
    ["control on soft surface", "--color-control-border", "--color-surface-soft"],
    ["filled info control on surface", "--color-info", "--color-surface"],
  ];

  for (const [name, boundaryToken, backgroundToken] of controlPairs) {
    const boundary = root[boundaryToken];
    const background = root[backgroundToken];
    assert.equal(typeof boundary, "string", `Missing ${boundaryToken}`);
    assert.equal(typeof background, "string", `Missing ${backgroundToken}`);
    const ratio = contrastRatio(boundary, background);
    assert.ok(
      ratio >= 3,
      `${name} contrast is ${ratio.toFixed(3)}:1 for ${boundary} on ${background}`,
    );
  }
});

test("interactive cards have scoped hover and a non-color anchor affordance", () => {
  const { buildUnifiedStyles } = require("./unified-styles");
  const css = buildUnifiedStyles();

  assert.deepEqual(cssDeclarations(css, "a.panel,\nbutton.panel"), {
    "border-color": "var(--color-control-border)",
  });
  assert.deepEqual(cssDeclarations(css, "a.panel h3"), {
    "text-decoration": "underline",
    "text-decoration-thickness": "1px",
    "text-underline-offset": "4px",
  });
  assert.deepEqual(cssDeclarations(css, "a.panel:hover,\nbutton.panel:hover"), {
    "border-color": "var(--color-info)",
    "box-shadow": "var(--shadow-raised)",
  });
  assert.doesNotMatch(
    css,
    /(?:^|\n)\.panel:hover\s*\{/u,
    "static panels must not expose an interactive hover cue",
  );
  assert.equal(
    cssDeclarations(css, ".sort-btn,\n.button").border,
    "1px solid var(--color-control-border)",
  );
});

test("canonical styles do not expose unused legacy aliases", () => {
  const { buildUnifiedStyles } = require("./unified-styles");
  const root = cssDeclarations(buildUnifiedStyles(), ":root");
  const legacyAliases = [
    "--bg",
    "--paper",
    "--paper-soft",
    "--panel",
    "--ink",
    "--muted",
    "--line",
    "--line-strong",
    "--soft",
    "--accent",
    "--accent-2",
    "--amber",
    "--danger",
    "--radius",
    "--shadow-sm",
    "--shadow-md",
  ];

  assert.deepEqual(
    legacyAliases.filter((token) => Object.hasOwn(root, token)),
    [],
  );
});

test("unified B style tokens", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-unified-styles-"));
  const result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const css = fs.readFileSync(
    path.join(projectRoot, "docs", "stenc", "styles.css"),
    "utf8",
  );
  const root = cssDeclarations(css, ":root");
  assert.deepEqual(
    Object.fromEntries(
      [
        "--color-page",
        "--color-surface",
        "--color-text",
        "--color-muted",
        "--color-subtle",
        "--color-line",
        "--color-control-border",
        "--color-info",
        "--color-success",
        "--color-warning",
        "--color-danger",
        "--color-relation",
      ].map((name) => [name, root[name]]),
    ),
    {
      "--color-page": "#f2f4f6",
      "--color-surface": "#ffffff",
      "--color-text": "#191f28",
      "--color-muted": "#4e5968",
      "--color-subtle": "#6b7684",
      "--color-line": "#d8dee6",
      "--color-control-border": "#7b8794",
      "--color-info": "#1769c2",
      "--color-success": "#087f5b",
      "--color-warning": "#9a5b00",
      "--color-danger": "#c5293d",
      "--color-relation": "#6c58e6",
    },
  );
  assert.deepEqual(
    Object.fromEntries(
      [
        "--color-diagram-consumer",
        "--color-diagram-surface",
        "--color-diagram-session",
        "--color-diagram-engine",
        "--color-diagram-boundary",
        "--color-diagram-value",
        "--color-diagram-neutral",
      ].map((name) => [name, root[name]]),
    ),
    {
      "--color-diagram-consumer": "var(--color-info)",
      "--color-diagram-surface": "#2878d0",
      "--color-diagram-session": "var(--color-relation)",
      "--color-diagram-engine": "var(--color-warning)",
      "--color-diagram-boundary": "var(--color-danger)",
      "--color-diagram-value": "var(--color-success)",
      "--color-diagram-neutral": "var(--color-muted)",
    },
  );
  assert.deepEqual(
    Object.fromEntries(
      [
        "--font-body",
        "--line-body",
        "--font-lead",
        "--font-h1",
        "--font-h2",
        "--font-h3",
        "--font-table",
        "--font-nav",
        "--font-metadata",
        "--font-code",
        "--space-1",
        "--space-2",
        "--space-3",
        "--space-4",
        "--space-5",
        "--space-6",
        "--radius-component",
        "--shadow-component",
      ].map((name) => [name, root[name]]),
    ),
    {
      "--font-body": "17px",
      "--line-body": "1.6",
      "--font-lead": "18px",
      "--font-h1": "clamp(34px, 5vw, 48px)",
      "--font-h2": "24px",
      "--font-h3": "17px",
      "--font-table": "15px",
      "--font-nav": "15px",
      "--font-metadata": "13px",
      "--font-code": "14px",
      "--space-1": "4px",
      "--space-2": "8px",
      "--space-3": "12px",
      "--space-4": "16px",
      "--space-5": "24px",
      "--space-6": "32px",
      "--radius-component": "14px",
      "--shadow-component": "0 2px 8px rgba(0, 0, 0, 0.05)",
    },
  );

  assert.deepEqual(cssDeclarations(css, "body"), {
    margin: "0",
    background: "var(--color-page)",
    color: "var(--color-text)",
    "font-family":
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    "font-size": "var(--font-body)",
    "line-height": "var(--line-body)",
  });
  assert.equal(
    cssDeclarations(css, ".table,\ntable")["font-size"],
    "var(--font-table)",
  );
  assert.equal(cssDeclarations(css, ".nav-link")["font-size"], "var(--font-nav)");
  assert.equal(
    cssDeclarations(
      css,
      ".badge,\n.pill,\n.version-pill,\n.timeline-badge,\n.method,\n.diagram-role-label",
    )["font-size"],
    "var(--font-metadata)",
  );
  assert.deepEqual(cssDeclarations(css, ":focus-visible"), {
    outline: "3px solid var(--color-info)",
    "outline-offset": "3px",
  });
  assert.deepEqual(
    cssDeclarations(css, "@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before,\n  *::after"),
    {
      "scroll-behavior": "auto !important",
      "transition-duration": "0.001ms !important",
      "animation-duration": "0.001ms !important",
      "animation-iteration-count": "1 !important",
    },
  );
  assert.match(css, /@media \(max-width: 780px\) \{/u);
});

test("canonical unified styles stay byte-identical across generated and sample CSS", () => {
  const { buildUnifiedStyles } = require("./unified-styles");
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-style-parity-"));
  const result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const canonical = Buffer.from(buildUnifiedStyles());
  const generated = fs.readFileSync(
    path.join(projectRoot, "docs", "stenc", "styles.css"),
  );
  const sample = fs.readFileSync(
    path.join(REPO_ROOT, "samples", "stenc-doc-styles", "styles.css"),
  );
  const committedExample = fs.readFileSync(
    path.join(REPO_ROOT, "examples-app", "styles.css"),
  );

  assert.equal(Buffer.compare(generated, canonical), 0, "generated CSS differs");
  assert.equal(Buffer.compare(sample, canonical), 0, "sample CSS differs");
  assert.equal(
    Buffer.compare(committedExample, canonical),
    0,
    "committed examples-app CSS differs",
  );

  const setupSource = fs.readFileSync(SCRIPT_PATH, "utf8");
  assert.equal(
    (setupSource.match(/buildUnifiedStyles\(\)/gu) || []).length,
    1,
    "setup-project must write the canonical stylesheet exactly once",
  );
  assert.doesNotMatch(
    setupSource,
    /`?:root\s*\{/u,
    "setup-project must not retain a second inline stylesheet",
  );
});

test("examples setup is byte-idempotent across repeated runs", () => {
  const temporaryRepo = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-examples-sync-"));
  fs.cpSync(path.join(REPO_ROOT, "skill"), path.join(temporaryRepo, "skill"), {
    recursive: true,
  });
  fs.cpSync(path.join(REPO_ROOT, "examples"), path.join(temporaryRepo, "examples"), {
    recursive: true,
  });
  fs.cpSync(
    path.join(REPO_ROOT, "samples"),
    path.join(temporaryRepo, "samples"),
    { recursive: true },
  );
  fs.mkdirSync(path.join(temporaryRepo, "scripts"), { recursive: true });
  fs.copyFileSync(
    path.join(REPO_ROOT, "scripts", "setup-examples-app.sh"),
    path.join(temporaryRepo, "scripts", "setup-examples-app.sh"),
  );

  const setupScript = path.join(temporaryRepo, "scripts", "setup-examples-app.sh");
  let result = spawnSync("bash", [setupScript], {
    cwd: temporaryRepo,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const firstSnapshot = {
    examplesApp: snapshotFiles(path.join(temporaryRepo, "examples-app")),
    sampleStyles: fs.readFileSync(
      path.join(temporaryRepo, "samples", "stenc-doc-styles", "styles.css"),
      "base64",
    ),
  };

  result = spawnSync("bash", [setupScript], {
    cwd: temporaryRepo,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const secondSnapshot = {
    examplesApp: snapshotFiles(path.join(temporaryRepo, "examples-app")),
    sampleStyles: fs.readFileSync(
      path.join(temporaryRepo, "samples", "stenc-doc-styles", "styles.css"),
      "base64",
    ),
  };

  assert.deepEqual(secondSnapshot, firstSnapshot);
});

function assertAppearsInOrder(text, values, label) {
  let previousIndex = -1;
  for (const value of values) {
    const index = text.indexOf(value, previousIndex + 1);
    assert.notEqual(index, -1, `${label}: missing ${value}`);
    assert.ok(index > previousIndex, `${label}: ${value} is out of source order`);
    previousIndex = index;
  }
}

function contentBetween(text, startMarker, endMarker, label) {
  const startIndex = text.indexOf(startMarker);
  assert.notEqual(startIndex, -1, `${label}: missing start marker`);
  const contentStart = startIndex + startMarker.length;
  const endIndex = text.indexOf(endMarker, contentStart);
  assert.notEqual(endIndex, -1, `${label}: missing end marker`);
  return text.slice(contentStart, endIndex);
}

function stripTagsAndDecodeText(html) {
  return html
    .replace(/<[^>]*>/gu, "")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&quot;/gu, '"')
    .replace(/&amp;/gu, "&")
    .replace(/\s+/gu, " ")
    .trim();
}

function minimalSpec(overrides = {}) {
  return {
    schemaVersion: 2,
    docType: "spec",
    id: "spec:minimal",
    slug: "minimal",
    status: "draft",
    title: "Minimal Spec",
    description: "Minimal spec for renderer tests.",
    owner: "stenc",
    createdAt: "2026-06-10",
    updatedAt: "2026-06-10",
    links: {
      sourceOfTruth: ["docs/SPEC.md"],
      relatedPlans: [],
      relatedDecisions: [],
    },
    page: {
      humanSummary: "Minimal.",
      agentSummary: "Minimal.",
      styleTemplate: "task-first",
    },
    body: {
      goal: "Render a minimal spec.",
      problem: "Renderer safety needs regression coverage.",
      scope: { in: ["Rendering"], out: ["Markdown"] },
      architecture: { summary: "Render JSON.", flow: ["Read JSON", "Write HTML"] },
      requirements: [],
      approaches: [],
      components: [],
      dataFlow: [],
      errorHandling: [],
      contracts: [],
      surfaces: [],
      testingStrategy: [],
      validation: [],
      agentInstructions: ["Render safely."],
      reviewChecklist: [],
      selfReviewChecks: [],
      implementationHandoff: {
        planLocation: "docs/superpowers/plans/YYYY-MM-DD-topic.md",
        requiredSkill: "superpowers:writing-plans",
        notes: ["Keep renderer fail-closed."],
      },
      supportingSections: [],
      openQuestions: [],
    },
    ...overrides,
  };
}

test("class inventory matches exact tokens and reports compact missing tokens", () => {
  assert.throws(
    () => assertClassTokenInventory([
      {
        label: "spec",
        html: '<section class="scope-in-extra rich-block"></section>',
        expected: ["scope-in", "scope-out", "rich-block"],
      },
      {
        label: "plan",
        html: '<section class="plan-slice"></section>',
        expected: ["plan-slice", "plan-step"],
      },
    ]),
    (error) => {
      assert.equal(
        error.message,
        "Missing semantic class tokens: spec=[scope-in, scope-out]; plan=[plan-step]",
      );
      assert.doesNotMatch(error.message, /<section/);
      return true;
    },
  );
});

test("keeps component catalog fixture mirrors byte-identical", () => {
  assertByteIdentical(COMPONENT_CATALOG_SPEC, COMPONENT_CATALOG_SPEC_MIRROR);
  assertByteIdentical(COMPONENT_CATALOG_PLAN, COMPONENT_CATALOG_PLAN_MIRROR);
});

test("renders comprehensive spec and plan component catalogs", (t) => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-component-catalog-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));

  fs.mkdirSync(path.join(docsRoot, "content", "specs"), { recursive: true });
  fs.mkdirSync(path.join(docsRoot, "content", "plans"), { recursive: true });
  fs.mkdirSync(path.join(docsRoot, "content", "assets"), { recursive: true });
  fs.copyFileSync(
    COMPONENT_CATALOG_SPEC,
    path.join(docsRoot, "content", "specs", "component-catalog.spec.json"),
  );
  fs.copyFileSync(
    COMPONENT_CATALOG_PLAN,
    path.join(docsRoot, "content", "plans", "component-catalog.plan.json"),
  );
  fs.copyFileSync(
    path.join(REPO_ROOT, "examples-app", "content", "assets", "stenc-flow.svg"),
    path.join(docsRoot, "content", "assets", "stenc-flow.svg"),
  );

  const result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const specHtml = fs.readFileSync(
    path.join(docsRoot, "specs", "component-catalog", "index.html"),
    "utf8",
  );
  const planHtml = fs.readFileSync(
    path.join(docsRoot, "plans", "component-catalog", "index.html"),
    "utf8",
  );

  assertClassTokenInventory([
    {
      label: "spec",
      html: specHtml,
      expected: SPEC_COMPONENT_CLASS_TOKENS,
    },
    {
      label: "plan",
      html: planHtml,
      expected: PLAN_COMPONENT_CLASS_TOKENS,
    },
  ]);
});

test("prepares a fixed Stenc web app backed by JSON documents", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-"));

  const result = spawnSync(
    process.execPath,
    [
      SCRIPT_PATH,
      "--project-root",
      projectRoot,
      "--title",
      "Rail: Docs",
      "--skip-install",
    ],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const docsRoot = path.join(projectRoot, "docs", "stenc");
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(docsRoot, "content", "site.json"), "utf8"),
  );
  assert.equal(packageJson.title, "Rail: Docs");

  const siteJson = JSON.parse(
    fs.readFileSync(path.join(docsRoot, "content", "site.json"), "utf8"),
  );
  assert.equal(siteJson.title, "Rail: Docs");

  assert.equal(
    fs.existsSync(path.join(docsRoot, "index.html")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(docsRoot, "content", "specs", "example-runtime.spec.json")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(projectRoot, "open-docs.sh")),
    true,
  );

  const openDocsResult = spawnSync(
    "bash",
    [path.join(projectRoot, "open-docs.sh"), "--dry-run"],
    {
      cwd: os.tmpdir(),
      encoding: "utf8",
    },
  );
  assert.equal(openDocsResult.status, 0, openDocsResult.stderr || openDocsResult.stdout);
  assert.equal(
    openDocsResult.stdout.includes(`projectRoot=${path.resolve(projectRoot)}`),
    true,
  );
  assert.equal(
    openDocsResult.stdout.includes(`docsPath=${path.resolve(docsRoot)}`),
    true,
  );

  const gitignore = fs.readFileSync(path.join(docsRoot, ".gitignore"), "utf8");
  assert.match(gitignore, /Stenc generated static pages/);
  assert.match(gitignore, /\/index\.html/);
  assert.match(gitignore, /\/styles\.css/);
  assert.match(gitignore, /\/specs\//);
  assert.match(gitignore, /\/plans\//);
  assert.match(gitignore, /\/decisions\//);
  assert.match(gitignore, /\/agent-context\//);
  assert.match(gitignore, /\/assets\//);
  assert.doesNotMatch(gitignore, /\/content\//);
  const openDocsScript = fs.readFileSync(path.join(projectRoot, "open-docs.sh"), "utf8");
  assert.match(openDocsScript, /image\/svg\+xml/);
  assert.match(openDocsScript, /image\/png/);
  assert.match(openDocsScript, /path\.resolve\(root,'\.'\+pathname\)/);
  assert.match(openDocsScript, /path\.relative\(root,file\)/);
  assert.doesNotMatch(openDocsScript, /path\.join\(root,decodeURIComponent/);
});

test("generated open-docs uses CODEX_SKILLS_DIR to find the renderer", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-open-docs-codex-dir-"));
  const skillsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-skills-"));
  const homeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-home-"));
  fs.cpSync(path.join(REPO_ROOT, "skill", "stenc"), path.join(skillsRoot, "stenc"), {
    recursive: true,
  });

  const result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--title", "Project Docs"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.rmSync(path.join(docsRoot, "index.html"), { force: true });
  fs.rmSync(path.join(docsRoot, "styles.css"), { force: true });

  const openDocsResult = spawnSync("bash", [path.join(projectRoot, "open-docs.sh")], {
    cwd: os.tmpdir(),
    encoding: "utf8",
    env: {
      ...process.env,
      CODEX_SKILLS_DIR: skillsRoot,
      HOME: homeRoot,
      STENC_OPEN_DOCS_PRECHECK_ONLY: "1",
    },
  });

  assert.equal(openDocsResult.status, 0, openDocsResult.stderr || openDocsResult.stdout);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), true);
  assert.equal(fs.existsSync(path.join(docsRoot, "styles.css")), true);
});

test("uses Docs as the default site title", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-title-"));

  const result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install"],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const siteJson = JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "docs", "stenc", "content", "site.json"),
      "utf8",
    ),
  );
  assert.equal(siteJson.title, "Docs");
});

test("preserves an existing site title when --title is omitted", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-preserve-title-"));

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--title", "Project Docs", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const siteJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "docs", "stenc", "content", "site.json"), "utf8"),
  );
  assert.equal(siteJson.title, "Project Docs");
});

test("removes stale generated document routes when source JSON is deleted", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-stale-route-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  const specPath = path.join(docsRoot, "content", "specs", "old.spec.json");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(specPath, {
    schemaVersion: 2,
    docType: "spec",
    id: "spec:old",
    slug: "old",
    status: "draft",
    title: "Old Spec",
    description: "Spec that will be removed.",
    owner: "stenc",
    createdAt: "2026-05-28",
    updatedAt: "2026-05-28",
    links: { sourceOfTruth: ["docs/stenc/content/specs/old.spec.json"] },
    page: {
      humanSummary: "Old rendered page.",
      agentSummary: "Old rendered page.",
      styleTemplate: "task-first",
    },
    body: {
      goal: "Render old page.",
      problem: "Old page exists.",
      scope: { in: ["Render"], out: [] },
      requirements: [],
      approaches: [],
      components: [],
      dataFlow: [],
      errorHandling: [],
      testingStrategy: [],
      validation: [],
      agentInstructions: ["Render."],
      openQuestions: [],
    },
  });

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(docsRoot, "specs", "old", "index.html")), true);

  fs.rmSync(specPath);
  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(docsRoot, "specs", "old", "index.html")), false);
  assert.equal(fs.existsSync(path.join(docsRoot, "specs", "index.html")), true);
});

test("removes stale generated assets without deleting source assets", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-stale-assets-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  fs.mkdirSync(path.join(docsRoot, "content", "assets"), { recursive: true });
  fs.mkdirSync(path.join(docsRoot, "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(docsRoot, "content", "assets", "source.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg"/>',
  );
  fs.writeFileSync(
    path.join(docsRoot, "assets", "stale.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg"/>',
  );

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  assert.equal(fs.existsSync(path.join(docsRoot, "content", "assets", "source.svg")), true);
  assert.equal(fs.existsSync(path.join(docsRoot, "assets", "source.svg")), true);
  assert.equal(fs.existsSync(path.join(docsRoot, "assets", "stale.svg")), false);
});

test("can skip writing the target project open-docs script", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-no-open-"));

  const result = spawnSync(
    process.execPath,
    [
      SCRIPT_PATH,
      "--project-root",
      projectRoot,
      "--skip-install",
      "--skip-open-docs-script",
    ],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(projectRoot, "open-docs.sh")), false);
});

test("renders Superpowers plan fields from structured JSON", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-render-plan-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "plans", "superpowers.plan.json"), {
    schemaVersion: 2,
    docType: "plan",
    id: "plan:superpowers",
    slug: "superpowers",
    status: "draft",
    title: "Superpowers Plan",
    description: "Plan with official Superpowers sections.",
    owner: "stenc",
    createdAt: "2026-05-19",
    updatedAt: "2026-05-19",
    links: {
      sourceOfTruth: ["docs/superpowers/plans/example.md"],
      relatedSpec: "spec:superpowers",
    },
    page: {
      humanSummary: "Humans inspect rendered plan sections.",
      agentSummary: "Agents execute structured plan steps.",
      styleTemplate: "operator-console",
    },
    body: {
      goal: "Render Superpowers plan content.",
      architecture: "Render structured JSON without Markdown source.",
      techStack: ["Node.js"],
      workerInstructions: {
        requiredSubSkills: [
          "superpowers:subagent-driven-development",
          "superpowers:executing-plans",
        ],
        trackingSyntax: "- [ ]",
        note: "Steps use checkbox syntax for tracking.",
      },
      scopeCheck: {
        assessment: "One renderer behavior.",
        decomposition: "No split required.",
      },
      currentState: "Renderer has a plan page.",
      targetState: "Renderer shows Superpowers sections.",
      scope: {
        in: ["Plan rendering"],
        out: ["Markdown authoring"],
      },
      fileStructure: [
        {
          action: "Modify",
          path: "skill/stenc/scripts/setup-project.js",
          responsibility: "Render plan fields.",
        },
      ],
      slices: [
        {
          id: "task-1",
          title: "Render steps",
          status: "todo",
          surfaces: ["skill/stenc/scripts/setup-project.js"],
          files: [
            {
              action: "Modify",
              path: "skill/stenc/scripts/setup-project.js",
              role: "Renderer",
            },
          ],
          steps: [
            {
              id: "step-1",
              title: "Run renderer test",
              status: "todo",
              command: "node skill/stenc/scripts/setup-project.test.js",
              expected: "PASS",
              codeBlocks: [
                {
                  language: "javascript",
                  content: "assert.match(html, /Worker Instructions/);",
                },
              ],
            },
          ],
          doneWhen: ["Plan page includes commands, expected output, and code blocks."],
        },
      ],
      executionOrder: ["task-1"],
      risks: [
        {
          risk: "Renderer drift",
          mitigation: "Assert rendered section labels.",
        },
      ],
      validation: [
        {
          command: "node skill/stenc/scripts/setup-project.test.js",
          purpose: "Renderer regression test.",
        },
      ],
      agentInstructions: ["Read structured plan fields."],
      selfReviewChecks: [
        {
          name: "Spec coverage",
          purpose: "Confirm all source sections render.",
        },
      ],
      executionHandoff: {
        defaultPath: "docs/superpowers/plans/example.md",
        options: [
          {
            label: "Subagent-Driven",
            description: "Dispatch a fresh subagent per task.",
            requiredSkill: "superpowers:subagent-driven-development",
          },
          {
            label: "Inline Execution",
            description: "Execute tasks in this session.",
            requiredSkill: "superpowers:executing-plans",
          },
        ],
      },
      supportingSections: [
        {
          heading: "No Placeholders",
          content: "Every step has concrete content.",
          items: ["No TBD values"],
          codeBlocks: [],
        },
      ],
      openQuestions: [],
    },
  });

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = fs.readFileSync(path.join(docsRoot, "plans", "superpowers", "index.html"), "utf8");
  assert.match(html, /Worker Instructions/);
  assert.match(html, /Scope Check/);
  assert.match(html, /File Structure/);
  assert.match(html, /Run renderer test/);
  assert.match(html, /node skill\/stenc\/scripts\/setup-project\.test\.js/);
  assert.match(html, /Expected/);
  assert.match(html, /assert\.match\(html, \/Worker Instructions\/\);/);
  assert.match(html, /Execution Handoff/);
  assert.match(html, /No Placeholders/);
});

test("renders extended supporting section fields recursively", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-render-supporting-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "specs", "supporting.spec.json"), {
    schemaVersion: 2,
    docType: "spec",
    id: "spec:supporting",
    slug: "supporting",
    status: "draft",
    title: "Supporting Sections",
    description: "Spec with extended supporting sections.",
    owner: "stenc",
    createdAt: "2026-05-27",
    updatedAt: "2026-05-27",
    links: {
      sourceOfTruth: ["docs/superpowers/specs/2026-05-27-supporting-sections-extension-design.md"],
      relatedPlans: [],
      relatedDecisions: [],
    },
    page: {
      humanSummary: "Humans inspect extended supporting section content.",
      agentSummary: "Agents read facts, links, steps, and nested sections from JSON.",
      styleTemplate: "task-first",
    },
    body: {
      goal: "Render bounded supporting section extensions.",
      problem: "Legacy document outlines need facts, links, steps, and nested sections.",
      scope: { in: ["Supporting section rendering"], out: ["Custom components"] },
      architecture: { summary: "Static renderer uses fixed primitives.", flow: ["Read JSON", "Render sections"] },
      requirements: [
        {
          id: "REQ-1",
          title: "Render extension fields",
          detail: "The renderer must show the bounded extension fields.",
          acceptanceCriteria: ["Facts, links, steps, and nested subsections are visible."],
        },
      ],
      approaches: [
        {
          name: "Bounded outline",
          tradeoffs: ["More structure", "No custom visual components"],
          recommendation: "Use fixed renderer primitives.",
        },
      ],
      components: [
        {
          name: "Renderer",
          responsibility: "Render supporting section extensions.",
          interfaces: ["renderDocument(doc, collection)"],
          dependencies: ["Node.js"],
        },
      ],
      dataFlow: ["JSON document", "Static renderer", "Styled HTML"],
      errorHandling: [{ case: "Unsafe text", behavior: "Escape HTML before rendering." }],
      contracts: [{ name: "Section contract", rules: ["Only facts, links, steps, and subSections are added."] }],
      surfaces: [{ path: "skill/stenc/scripts/setup-project.js", role: "Renderer", owner: "stenc" }],
      testingStrategy: [{ command: "node skill/stenc/scripts/setup-project.test.js", expected: "PASS" }],
      validation: [{ command: "node skill/stenc/scripts/setup-project.test.js", purpose: "Renderer regression coverage." }],
      agentInstructions: ["Read JSON source before editing renderer behavior."],
      reviewChecklist: ["No user-defined component system is introduced."],
      selfReviewChecks: [{ name: "Scope", purpose: "Confirm only four fields are rendered." }],
      implementationHandoff: {
        planLocation: "docs/superpowers/plans/2026-05-27-supporting-sections-extension.md",
        requiredSkill: "superpowers:writing-plans",
        notes: ["Keep renderer deterministic."],
      },
      supportingSections: [
        {
          heading: "Migration Runbook",
          content: "Render the runbook outline.",
          items: ["Use fixed Stenc primitives."],
          facts: [{ label: "Owner <img src=x onerror=alert(1)>", value: "Platform <strong>Team</strong>" }],
          links: [
            {
              label: "Source <runbook>",
              target: "https://wiki.internal/runbook?<unsafe>",
              purpose: "Original <source> document",
            },
          ],
          steps: [
            {
              id: "step-1",
              title: "Back <up> database",
              status: "todo",
              command: "pg_dump app > backup.sql && echo <done>",
              expected: "backup.sql exists & checksum <passes>.",
            },
          ],
          codeBlocks: [],
          subSections: [
            {
              heading: "Rollback <path>",
              content: "Restore the <previous> deployment.",
              items: ["Restore <DNS>"],
              facts: [],
              links: [],
              steps: [],
              codeBlocks: [],
              subSections: [],
            },
          ],
        },
      ],
      openQuestions: [],
    },
  });

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = fs.readFileSync(path.join(docsRoot, "specs", "supporting", "index.html"), "utf8");
  assert.match(html, /Migration Runbook/);
  assert.match(html, /Owner &lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /Platform &lt;strong&gt;Team&lt;\/strong&gt;/);
  assert.match(html, /Source &lt;runbook&gt;/);
  assert.match(html, /https:\/\/wiki\.internal\/runbook\?&lt;unsafe&gt;/);
  assert.match(html, /Back &lt;up&gt; database/);
  assert.match(html, /pg_dump app &gt; backup\.sql &amp;&amp; echo &lt;done&gt;/);
  assert.match(html, /backup\.sql exists &amp; checksum &lt;passes&gt;\./);
  assert.match(html, /Rollback &lt;path&gt;/);
  assert.match(html, /Restore the &lt;previous&gt; deployment\./);
  assert.match(html, /Restore &lt;DNS&gt;/);
  assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/);
  assert.doesNotMatch(html, /<strong>Team<\/strong>/);
});

test("renders Phase 1 rich supporting blocks with escaped fixed output", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-render-rich-phase1-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "specs", "rich-phase1.spec.json"), {
    schemaVersion: 2,
    docType: "spec",
    id: "spec:rich-phase1",
    slug: "rich-phase1",
    status: "draft",
    title: "Rich Phase 1",
    description: "Spec with rich Phase 1 blocks.",
    owner: "stenc",
    createdAt: "2026-06-10",
    updatedAt: "2026-06-10",
    links: {
      sourceOfTruth: ["docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md"],
      relatedPlans: [],
      relatedDecisions: [],
    },
    page: {
      humanSummary: "Humans inspect rich blocks.",
      agentSummary: "Agents read typed rich blocks.",
      styleTemplate: "task-first",
    },
    body: {
      goal: "Render rich Phase 1 blocks.",
      problem: "Markdown-era content needs typed JSON primitives.",
      scope: { in: ["Phase 1 blocks"], out: ["Markdown parsing"] },
      architecture: {
        summary: "Fixed renderer maps typed JSON to HTML.",
        flow: ["Read JSON", "Render blocks"],
      },
      requirements: [],
      approaches: [],
      components: [],
      dataFlow: [],
      errorHandling: [],
      contracts: [],
      surfaces: [],
      testingStrategy: [],
      validation: [],
      agentInstructions: ["Read JSON."],
      reviewChecklist: [],
      selfReviewChecks: [],
      implementationHandoff: {
        planLocation: "docs/superpowers/plans/2026-06-10-stenc-rich-markdown-primitives-implementation.md",
        requiredSkill: "superpowers:writing-plans",
        notes: ["Keep output escaped."],
      },
      supportingSections: [
        {
          heading: "Blocks",
          content: "Render after content and items.",
          items: ["Before nested sections"],
          blocks: [
            {
              type: "paragraph",
              spans: [
                { type: "text", text: "Use <json>" },
                { type: "strong", text: " source" },
                { type: "emphasis", text: " only" },
                { type: "code", text: "./scripts/validate.sh && echo <done>" },
                { type: "kbd", text: "Cmd+K" },
                { type: "mark", text: "fixed renderer" },
                { type: "link", text: "spec <link>", target: "docs/spec.md" },
              ],
            },
            {
              type: "callout",
              tone: "danger",
              title: "Unsafe <title>",
              body: "Escape <script>alert(1)</script>.",
            },
            { type: "quote", text: "Quote <body>", source: "Source <file>" },
            { type: "table", columns: ["Need <one>", "Phase"], rows: [["Inline <code>", "1"]] },
          ],
          codeBlocks: [],
        },
      ],
      openQuestions: [],
    },
  });

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = fs.readFileSync(path.join(docsRoot, "specs", "rich-phase1", "index.html"), "utf8");
  assert.match(html, /rich-block rich-paragraph/);
  assert.match(html, /Use &lt;json&gt;/);
  assert.match(html, /<strong> source<\/strong>/);
  assert.match(html, /<em> only<\/em>/);
  assert.match(html, /\.\/scripts\/validate\.sh &amp;&amp; echo &lt;done&gt;/);
  assert.match(html, /<kbd>Cmd\+K<\/kbd>/);
  assert.match(html, /<mark>fixed renderer<\/mark>/);
  assert.match(html, /href="docs\/spec\.md"/);
  assert.match(html, /spec &lt;link&gt;/);
  assert.match(html, /rich-callout tone-danger/);
  assert.match(html, /Unsafe &lt;title&gt;/);
  assert.match(html, /Escape &lt;script&gt;alert\(1\)&lt;\/script&gt;\./);
  assert.match(html, /rich-quote/);
  assert.match(html, /Quote &lt;body&gt;/);
  assert.match(html, /Source &lt;file&gt;/);
  assert.match(html, /Need &lt;one&gt;/);
  assert.match(html, /Inline &lt;code&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});

test("renders Phase 2 media and task lists with copied local assets", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-render-rich-phase2-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  fs.mkdirSync(path.join(docsRoot, "content", "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(docsRoot, "content", "assets", "stenc-flow.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
  );

  writeJson(path.join(docsRoot, "content", "specs", "rich-phase2.spec.json"), minimalSpec({
    id: "spec:rich-phase2",
    slug: "rich-phase2",
    title: "Rich Phase 2",
    body: {
      ...minimalSpec().body,
      supportingSections: [
        {
          heading: "Assets",
          content: "Media and task lists are fixed renderer primitives.",
          items: [],
          blocks: [
            {
              type: "media",
              src: "assets/stenc-flow.svg",
              alt: "Flow <diagram>",
              caption: "Copy <local> asset.",
            },
            {
              type: "taskList",
              items: [
                { label: "Validate <source>", checked: true },
                { label: "Render page", checked: false },
              ],
            },
          ],
          codeBlocks: [],
        },
      ],
    },
  }));

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = fs.readFileSync(path.join(docsRoot, "specs", "rich-phase2", "index.html"), "utf8");
  assert.match(html, /rich-media/);
  assert.match(html, /src="\.\.\/\.\.\/assets\/stenc-flow\.svg"/);
  assert.match(html, /alt="Flow &lt;diagram&gt;"/);
  assert.match(html, /Copy &lt;local&gt; asset\./);
  assert.match(html, /rich-task-list/);
  assert.match(html, /task-check/);
  assert.match(html, /Validate &lt;source&gt;/);
  assert.match(html, /Render page/);
  assert.equal(fs.existsSync(path.join(docsRoot, "assets", "stenc-flow.svg")), true);
  assert.doesNotMatch(html, /<local>/);
  assert.doesNotMatch(html, /<input/);
});

test("renders structured diagrams with escaped deterministic visuals and fallbacks", (t) => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-structured-diagrams-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "specs", "structured-diagrams.spec.json"), minimalSpec({
    id: "spec:structured-diagrams",
    slug: "structured-diagrams",
    title: "Structured Diagrams",
    body: {
      ...minimalSpec().body,
      supportingSections: [
        {
          heading: "Structured diagrams",
          content: "Render each validator-known diagram type.",
          items: [],
          blocks: [
            {
              type: "layerDiagram",
              title: "Boundary <script>layer()</script>",
              summary: "Dependencies move through <strong>owned layers</strong>.",
              layers: [
                {
                  id: "feature",
                  label: "Feature <UI>",
                  role: "consumer",
                  summary: "Consumes the <public> surface.",
                  nodes: [
                    {
                      id: "home-page",
                      label: "Home<Page>",
                      detail: "Declares <img src=x onerror=alert(1)>.",
                    },
                    {
                      id: "detail-page",
                      label: "Detail<Page>",
                      detail: "Reads the public contract.",
                    },
                  ],
                  transition: "Places <WorldSurface> next.",
                },
                {
                  id: "surface",
                  label: "Surface",
                  role: "surface",
                  summary: "Owns the public API.",
                  nodes: [
                    {
                      id: "world-surface",
                      label: "World<Surface>",
                      detail: "Creates the session.",
                    },
                  ],
                },
              ],
            },
            {
              type: "flowDiagram",
              title: "Validation <flow>",
              summary: "The flow preserves a permitted <cycle>.",
              nodes: [
                {
                  id: "ingest",
                  label: "Ingest <JSON>",
                  detail: "Reads author input.",
                  role: "consumer",
                },
                {
                  id: "validate",
                  label: "Validate",
                  detail: "Checks the bounded contract.",
                  role: "boundary",
                },
                {
                  id: "render",
                  label: "Render",
                  detail: "Writes escaped HTML.",
                  role: "engine",
                },
              ],
              edges: [
                { from: "ingest", to: "validate", label: "submits <source>" },
                { from: "validate", to: "render", label: "passes" },
                { from: "render", to: "ingest", label: "reports cycle" },
              ],
            },
            {
              type: "relationDiagram",
              title: "Runtime <ownership>",
              summary: "Ownership and borrowing stay explicit.",
              nodes: [
                {
                  id: "stage",
                  label: "World<Stage>",
                  detail: "Immutable feature input.",
                  role: "value",
                },
                {
                  id: "layout",
                  label: "WorldLayout",
                  detail: "Session-owned runtime handle.",
                  role: "session",
                },
                {
                  id: "scene",
                  label: "M3SpatialScene",
                  detail: "Engine-owned resource.",
                  role: "boundary",
                },
              ],
              relations: [
                { from: "stage", to: "layout", label: "creates <handle>" },
                { from: "layout", to: "scene", label: "borrows" },
                { from: "scene", to: "stage", label: "returns cycle" },
              ],
            },
          ],
          codeBlocks: [],
        },
      ],
    },
  }));

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = fs.readFileSync(
    path.join(docsRoot, "specs", "structured-diagrams", "index.html"),
    "utf8",
  );
  const classes = extractClassTokens(html);

  assert.equal((html.match(/<figure class="rich-block rich-structured-diagram/gu) || []).length, 3);
  assert.equal((html.match(/<figcaption>/gu) || []).length, 3);
  assert.equal((html.match(/class="diagram-summary"/gu) || []).length, 3);
  assert.equal((html.match(/class="diagram-visual[^"]*" aria-hidden="true"/gu) || []).length, 3);
  assert.equal((html.match(/class="diagram-mobile-linear"/gu) || []).length, 3);

  for (const className of [
    "layer-diagram",
    "flow-diagram",
    "relation-diagram",
    "diagram-layer",
    "diagram-role-rail",
    "diagram-node-card",
    "diagram-layer-transition",
    "diagram-flow-grid",
    "diagram-relation-spine",
    "diagram-directed-connection",
    "diagram-fallback",
    "diagram-layer-fallback",
    "diagram-relation-fallback",
    "diagram-fallback-table",
    "visually-hidden",
    "diagram-role-consumer",
    "diagram-role-surface",
    "diagram-role-boundary",
    "diagram-role-engine",
    "diagram-role-value",
    "diagram-role-session",
  ]) {
    assert.ok(classes.has(className), `missing structured diagram class: ${className}`);
  }

  for (const nodeId of [
    "home-page",
    "detail-page",
    "world-surface",
    "ingest",
    "validate",
    "render",
    "stage",
    "layout",
    "scene",
  ]) {
    assert.match(html, new RegExp(`data-node-id="${nodeId}"`, "u"));
  }
  assert.match(html, /data-layer-id="feature"/);
  assert.match(html, /data-layer-id="surface"/);
  assert.match(html, /data-from="render" data-to="ingest"/);
  assert.match(html, /data-from="scene" data-to="stage"/);

  assert.match(html, /submits &lt;source&gt;/);
  assert.match(html, /creates &lt;handle&gt;/);
  assert.match(html, /Boundary &lt;script&gt;layer\(\)&lt;\/script&gt;/);
  assert.match(html, /Dependencies move through &lt;strong&gt;owned layers&lt;\/strong&gt;\./);
  assert.match(html, /Feature &lt;UI&gt;/);
  assert.match(html, /Home&lt;Page&gt;/);
  assert.match(html, /Declares &lt;img src=x onerror=alert\(1\)&gt;\./);
  assert.match(html, /Places &lt;WorldSurface&gt; next\./);
  assert.match(html, /World&lt;Stage&gt;/);
  assert.doesNotMatch(html, /<script>layer\(\)<\/script>/);
  assert.doesNotMatch(html, /<strong>owned layers<\/strong>/);
  assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/);

  assert.match(
    html,
    /<thead><tr><th scope="col">From<\/th> <th scope="col">Relation<\/th> <th scope="col">To<\/th><\/tr><\/thead>/,
  );
  assert.equal((html.match(/<table class="table diagram-fallback-table">/gu) || []).length, 2);
  assert.equal((html.match(/<details class="diagram-fallback diagram-relation-fallback">/gu) || []).length, 2);
  assert.doesNotMatch(html, /<h5>Nodes<\/h5>/);
  assert.equal((html.match(/<p class="diagram-fallback-label"><strong>Nodes<\/strong>\.<\/p>/gu) || []).length, 2);

  const layerVisual = contentBetween(
    html,
    '<div class="diagram-visual diagram-layer-stack" aria-hidden="true">',
    '<ol class="diagram-fallback diagram-layer-fallback visually-hidden">',
    "layer visual",
  );
  const layerFallback = contentBetween(
    html,
    '<ol class="diagram-fallback diagram-layer-fallback visually-hidden">',
    "</ol></figure>",
    "layer fallback",
  );
  assertAppearsInOrder(
    layerVisual,
    ['data-layer-id="feature"', 'data-node-id="home-page"', 'data-node-id="detail-page"', 'data-layer-id="surface"', 'data-node-id="world-surface"'],
    "layer visual",
  );
  assertAppearsInOrder(
    layerFallback,
    [
      '<li data-layer-id="feature"><strong>Feature &lt;UI&gt;</strong> <code>(feature)</code>',
      '<li data-node-id="home-page"><strong>Home&lt;Page&gt;</strong> <code>(home-page)</code>',
      '<li data-node-id="detail-page"><strong>Detail&lt;Page&gt;</strong> <code>(detail-page)</code>',
      '<p class="diagram-fallback-transition"><strong>Transition:</strong> Places &lt;WorldSurface&gt; next.</p>',
      '<li data-layer-id="surface"><strong>Surface</strong> <code>(surface)</code>',
      '<li data-node-id="world-surface"><strong>World&lt;Surface&gt;</strong> <code>(world-surface)</code>',
    ],
    "layer fallback",
  );
  assert.equal(
    stripTagsAndDecodeText(
      contentBetween(
        html,
        '<figure class="rich-block rich-structured-diagram layer-diagram"><figcaption>',
        "</figcaption>",
        "layer caption",
      ),
    ),
    "Layer diagram Boundary <script>layer()</script>",
  );
  assert.match(
    stripTagsAndDecodeText(layerFallback),
    /Feature <UI> \(feature\) — Role: consumer\. Consumes the <public> surface\. Home<Page> \(home-page\): Declares <img src=x onerror=alert\(1\)>\. Detail<Page> \(detail-page\): Reads the public contract\. Transition: Places <WorldSurface> next\. Surface \(surface\) — Role: surface\./,
  );

  const flowFigure = contentBetween(
    html,
    '<figure class="rich-block rich-structured-diagram flow-diagram">',
    "</figure>",
    "flow figure",
  );
  const flowVisual = contentBetween(
    flowFigure,
    '<div class="diagram-visual diagram-flow-grid" aria-hidden="true">',
    '<details class="diagram-fallback diagram-relation-fallback">',
    "flow visual",
  );
  const flowFallback = contentBetween(
    flowFigure,
    '<details class="diagram-fallback diagram-relation-fallback">',
    "</details>",
    "flow fallback",
  );
  assert.match(
    flowFallback,
    /^<summary>View Validation &lt;flow&gt; text and relation table\.<\/summary>/,
  );
  assertAppearsInOrder(
    flowVisual,
    ['data-node-id="ingest"', 'data-node-id="validate"', 'data-node-id="render"', 'data-from="ingest" data-to="validate"', 'data-from="validate" data-to="render"', 'data-from="render" data-to="ingest"'],
    "flow visual",
  );
  assertAppearsInOrder(
    flowFallback,
    ["Ingest &lt;JSON&gt;", "Validate", "Render", "submits &lt;source&gt;", "passes", "reports cycle"],
    "flow fallback",
  );
  const flowTbody = contentBetween(flowFallback, "<tbody>", "</tbody>", "flow fallback rows");
  assert.equal(
    flowTbody,
    [
      '<tr data-from="ingest" data-to="validate"><td><strong>Ingest &lt;JSON&gt;</strong> <code>(ingest)</code></td> <td>submits &lt;source&gt;</td> <td><strong>Validate</strong> <code>(validate)</code></td></tr>',
      '<tr data-from="validate" data-to="render"><td><strong>Validate</strong> <code>(validate)</code></td> <td>passes</td> <td><strong>Render</strong> <code>(render)</code></td></tr>',
      '<tr data-from="render" data-to="ingest"><td><strong>Render</strong> <code>(render)</code></td> <td>reports cycle</td> <td><strong>Ingest &lt;JSON&gt;</strong> <code>(ingest)</code></td></tr>',
    ].join("\n"),
  );
  assert.match(
    stripTagsAndDecodeText(flowFallback),
    /View Validation <flow> text and relation table\. Nodes\. Ingest <JSON> \(ingest\) — Role: consumer\. Reads author input\./,
  );

  const relationFigure = contentBetween(
    html,
    '<figure class="rich-block rich-structured-diagram relation-diagram">',
    "</figure>",
    "relation figure",
  );
  const relationVisual = contentBetween(
    relationFigure,
    '<div class="diagram-visual diagram-relation-spine" aria-hidden="true">',
    '<details class="diagram-fallback diagram-relation-fallback">',
    "relation visual",
  );
  const relationFallback = contentBetween(
    relationFigure,
    '<details class="diagram-fallback diagram-relation-fallback">',
    "</details>",
    "relation fallback",
  );
  assert.match(
    relationFallback,
    /^<summary>View Runtime &lt;ownership&gt; text and relation table\.<\/summary>/,
  );
  assertAppearsInOrder(
    relationVisual,
    ['data-node-id="stage"', 'data-node-id="layout"', 'data-node-id="scene"', 'data-from="stage" data-to="layout"', 'data-from="layout" data-to="scene"', 'data-from="scene" data-to="stage"'],
    "relation visual",
  );
  assertAppearsInOrder(
    relationFallback,
    ["World&lt;Stage&gt;", "WorldLayout", "M3SpatialScene", "creates &lt;handle&gt;", "borrows", "returns cycle"],
    "relation fallback",
  );
  const relationTbody = contentBetween(
    relationFallback,
    "<tbody>",
    "</tbody>",
    "relation fallback rows",
  );
  assert.equal(
    relationTbody,
    [
      '<tr data-from="stage" data-to="layout"><td><strong>World&lt;Stage&gt;</strong> <code>(stage)</code></td> <td>creates &lt;handle&gt;</td> <td><strong>WorldLayout</strong> <code>(layout)</code></td></tr>',
      '<tr data-from="layout" data-to="scene"><td><strong>WorldLayout</strong> <code>(layout)</code></td> <td>borrows</td> <td><strong>M3SpatialScene</strong> <code>(scene)</code></td></tr>',
      '<tr data-from="scene" data-to="stage"><td><strong>M3SpatialScene</strong> <code>(scene)</code></td> <td>returns cycle</td> <td><strong>World&lt;Stage&gt;</strong> <code>(stage)</code></td></tr>',
    ].join("\n"),
  );
  assert.match(
    stripTagsAndDecodeText(relationFallback),
    /View Runtime <ownership> text and relation table\. Nodes\. World<Stage> \(stage\) — Role: value\. Immutable feature input\./,
  );
});

test("renders Phase 3 diagram source panels without runtime execution", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-render-rich-phase3-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "specs", "rich-phase3.spec.json"), minimalSpec({
    id: "spec:rich-phase3",
    slug: "rich-phase3",
    title: "Rich Phase 3",
    body: {
      ...minimalSpec().body,
      supportingSections: [
        {
          heading: "Diagram",
          content: "Diagram fences become source panels.",
          items: [],
          blocks: [
            {
              type: "diagram",
              language: "mermaid",
              title: "Unsafe <diagram>",
              source: "flowchart LR\n  JSON --> Renderer\n  Renderer --> HTML<script>alert(1)</script>",
            },
          ],
          codeBlocks: [],
        },
      ],
    },
  }));

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = fs.readFileSync(path.join(docsRoot, "specs", "rich-phase3", "index.html"), "utf8");
  assert.match(html, /rich-diagram/);
  assert.match(html, /Unsafe &lt;diagram&gt;/);
  assert.match(html, /HTML&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /mermaid\.initialize/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});

test("refuses to render rich links with unsafe targets", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-unsafe-rich-link-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "specs", "unsafe-link.spec.json"), minimalSpec({
    id: "spec:unsafe-link",
    slug: "unsafe-link",
    body: {
      ...minimalSpec().body,
      supportingSections: [
        {
          heading: "Unsafe Link",
          content: "Renderer must fail closed.",
          items: ["Unsafe href"],
          blocks: [
            {
              type: "paragraph",
              spans: [{ type: "link", text: "bad", target: "javascript:alert(1)" }],
            },
          ],
          codeBlocks: [],
        },
      ],
    },
  }));

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsafe rich link target/);
});

test("refuses document slugs that would write outside the generated route directory", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-unsafe-slug-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "specs", "unsafe-slug.spec.json"), minimalSpec({
    id: "spec:unsafe-slug",
    slug: "../../../escaped-route",
  }));

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsafe document slug/);
  assert.equal(fs.existsSync(path.join(projectRoot, "escaped-route", "index.html")), false);
});

test("renders schemaVersion 1 plan string steps for compatibility", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-render-v1-plan-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "plans", "v1.plan.json"), {
    schemaVersion: 1,
    docType: "plan",
    id: "plan:v1",
    slug: "v1",
    status: "draft",
    title: "Version 1 Plan",
    description: "Plan using the original string-step shape.",
    owner: "stenc",
    createdAt: "2026-05-19",
    updatedAt: "2026-05-19",
    links: {
      sourceOfTruth: ["docs/PLAN.md"],
      relatedSpec: "spec:v1",
    },
    page: {
      humanSummary: "Version 1 plan source.",
      agentSummary: "Render string steps safely.",
      styleTemplate: "operator-console",
    },
    body: {
      goal: "Render v1 plan steps.",
      currentState: "String steps exist.",
      targetState: "String steps render visibly.",
      scope: {
        in: ["Compatibility"],
        out: ["Schema migration"],
      },
      slices: [
        {
          id: "S1",
          title: "Compatibility",
          status: "todo",
          surfaces: ["docs/PLAN.md"],
          steps: ["Implement the contract"],
          doneWhen: ["Step is visible"],
        },
      ],
      executionOrder: ["S1"],
      risks: [
        {
          risk: "Hidden step",
          mitigation: "Render string steps.",
        },
      ],
      validation: [
        {
          command: "node skill/stenc/scripts/setup-project.test.js",
          purpose: "Renderer regression test.",
        },
      ],
      agentInstructions: ["Preserve visible steps."],
      openQuestions: [],
    },
  });

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = fs.readFileSync(path.join(docsRoot, "plans", "v1", "index.html"), "utf8");
  assert.match(html, /step-1/);
  assert.match(html, /Implement the contract/);
});
