#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.join(__dirname, "setup-project.js");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("prepares a fixed ContextKit web app backed by JSON documents", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-project-"));

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

  const docsRoot = path.join(projectRoot, "docs", "context-kit");
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
  assert.match(gitignore, /generated static pages/);
});

test("uses Docs as the default site title", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-project-title-"));

  const result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install"],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const siteJson = JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "docs", "context-kit", "content", "site.json"),
      "utf8",
    ),
  );
  assert.equal(siteJson.title, "Docs");
});

test("can skip writing the target project open-docs script", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-project-no-open-"));

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
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-project-render-plan-"));
  const docsRoot = path.join(projectRoot, "docs", "context-kit");

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
    owner: "context-kit",
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
          path: "skill/context-kit/scripts/setup-project.js",
          responsibility: "Render plan fields.",
        },
      ],
      slices: [
        {
          id: "task-1",
          title: "Render steps",
          status: "todo",
          surfaces: ["skill/context-kit/scripts/setup-project.js"],
          files: [
            {
              action: "Modify",
              path: "skill/context-kit/scripts/setup-project.js",
              role: "Renderer",
            },
          ],
          steps: [
            {
              id: "step-1",
              title: "Run renderer test",
              status: "todo",
              command: "node skill/context-kit/scripts/setup-project.test.js",
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
          command: "node skill/context-kit/scripts/setup-project.test.js",
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
  assert.match(html, /node skill\/context-kit\/scripts\/setup-project\.test\.js/);
  assert.match(html, /Expected/);
  assert.match(html, /assert\.match\(html, \/Worker Instructions\/\);/);
  assert.match(html, /Execution Handoff/);
  assert.match(html, /No Placeholders/);
});

test("renders schemaVersion 1 plan string steps for compatibility", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-project-render-v1-plan-"));
  const docsRoot = path.join(projectRoot, "docs", "context-kit");

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
    owner: "context-kit",
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
          command: "node skill/context-kit/scripts/setup-project.test.js",
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
