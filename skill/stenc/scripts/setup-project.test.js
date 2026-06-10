#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT_PATH = path.join(__dirname, "setup-project.js");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
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
