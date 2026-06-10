#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..");
const SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "open-docs.sh");

test("open-docs server uses resolved path containment and image MIME types", () => {
  const script = fs.readFileSync(SCRIPT_PATH, "utf8");

  assert.match(script, /path\.resolve\(root,'\.'\+pathname\)/);
  assert.match(script, /path\.relative\(root,file\)/);
  assert.match(script, /image\/svg\+xml/);
  assert.match(script, /image\/png/);
  assert.doesNotMatch(script, /path\.join\(root,decodeURIComponent/);
});

test("open-docs defaults to the current project and docs/stenc", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(docsRoot, { recursive: true });
  fs.writeFileSync(path.join(docsRoot, "index.html"), "<!doctype html>\n");

  const result = spawnSync("bash", [SCRIPT_PATH, "--dry-run"], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.includes(`projectRoot=${fs.realpathSync(projectRoot)}`), true);
  assert.equal(result.stdout.includes(`docsPath=${fs.realpathSync(docsRoot)}`), true);
});

test("open-docs can run from a target project root script path", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-script-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  const projectScript = path.join(projectRoot, "open-docs.sh");
  fs.mkdirSync(docsRoot, { recursive: true });
  fs.writeFileSync(path.join(docsRoot, "index.html"), "<!doctype html>\n");
  fs.copyFileSync(SCRIPT_PATH, projectScript);
  fs.chmodSync(projectScript, 0o755);

  const result = spawnSync("bash", [projectScript, "--dry-run"], {
    cwd: os.tmpdir(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.includes(`projectRoot=${path.resolve(projectRoot)}`), true);
  assert.equal(result.stdout.includes(`docsPath=${path.resolve(docsRoot)}`), true);
});

test("open-docs dry-run does not regenerate docs", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-dry-run-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(path.join(docsRoot, "content"), { recursive: true });

  const result = spawnSync("bash", [SCRIPT_PATH, "--dry-run"], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), false);
});

test("open-docs regenerates missing static pages before serving", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-regen-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(path.join(docsRoot, "content", "specs"), { recursive: true });
  fs.writeFileSync(path.join(docsRoot, "content", "site.json"), "{\"title\":\"Docs\"}\n");

  const result = spawnSync("bash", [SCRIPT_PATH], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      STENC_SETUP_PROJECT_JS: path.join(REPO_ROOT, "skill", "stenc", "scripts", "setup-project.js"),
      STENC_OPEN_DOCS_PRECHECK_ONLY: "1",
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), true);
  assert.equal(fs.existsSync(path.join(docsRoot, "styles.css")), true);
});

test("open-docs preserves site JSON source metadata while regenerating", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-preserve-site-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  const sitePath = path.join(docsRoot, "content", "site.json");
  const siteJson = {
    title: "Docs",
    description: "Custom project documentation.",
    extra: { owner: "docs-team" },
  };
  fs.mkdirSync(path.dirname(sitePath), { recursive: true });
  fs.writeFileSync(sitePath, `${JSON.stringify(siteJson, null, 2)}\n`);

  const result = spawnSync("bash", [SCRIPT_PATH], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      STENC_SETUP_PROJECT_JS: path.join(REPO_ROOT, "skill", "stenc", "scripts", "setup-project.js"),
      STENC_OPEN_DOCS_PRECHECK_ONLY: "1",
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(fs.readFileSync(sitePath, "utf8")), siteJson);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), true);
});

test("open-docs fails clearly when the renderer is missing", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-missing-renderer-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(path.join(docsRoot, "content"), { recursive: true });

  const result = spawnSync("bash", [SCRIPT_PATH], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      STENC_SETUP_PROJECT_JS: path.join(projectRoot, "missing-setup-project.js"),
      STENC_OPEN_DOCS_PRECHECK_ONLY: "1",
    },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Stenc renderer not found/);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), false);
});
