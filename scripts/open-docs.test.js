#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..");
const SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "open-docs.sh");

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
