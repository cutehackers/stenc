#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.join(__dirname, "setup-project.js");

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

  const specPath = path.join(
    docsRoot,
    "content",
    "specs",
    "example-runtime.spec.json",
  );
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  assert.equal(spec.docType, "spec");
  assert.equal(spec.slug, "example-runtime");
  assert.equal(spec.id, "spec:example-runtime");
  assert.equal(Array.isArray(spec.body.contracts), true);
  assert.equal(Array.isArray(spec.links.sourceOfTruth), true);
  assert.equal(typeof spec.page.humanSummary, "string");
  assert.equal(spec.page.styleTemplate, "task-first");

  assert.equal(
    fs.existsSync(path.join(docsRoot, "index.html")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(docsRoot, "specs", "example-runtime", "index.html")),
    true,
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

test("replaces the old generated example spec shape during setup", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-project-"));
  const staleSpecPath = path.join(
    projectRoot,
    "docs",
    "context-kit",
    "content",
    "specs",
    "example-runtime.spec.json",
  );
  fs.mkdirSync(path.dirname(staleSpecPath), { recursive: true });
  fs.writeFileSync(
    staleSpecPath,
    `${JSON.stringify(
      {
        slug: "example-runtime",
        docType: "spec",
        status: "draft",
        title: "Example Runtime Contract",
        description: "Old generated shape.",
        owner: "context-kit",
        lastUpdated: "2026-05-19",
        humanSummary: "Old shape.",
        agentSummary: "Old shape.",
        sourceOfTruth: ["content/specs/example-runtime.spec.json"],
        goal: "Old shape.",
      },
      null,
      2,
    )}\n`,
  );

  const result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-install"],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const spec = JSON.parse(fs.readFileSync(staleSpecPath, "utf8"));
  assert.equal(spec.schemaVersion, 1);
  assert.equal(spec.id, "spec:example-runtime");
  assert.equal(typeof spec.page.humanSummary, "string");
  assert.equal(spec.page.styleTemplate, "task-first");
  assert.equal(Array.isArray(spec.body.contracts), true);
  assert.equal(spec.lastUpdated, undefined);
});
