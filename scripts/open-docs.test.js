#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..");
const SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "open-docs.sh");

test("open-docs defaults to the current project and docs/context-kit", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-open-docs-"));
  const docsRoot = path.join(projectRoot, "docs", "context-kit");
  fs.mkdirSync(docsRoot, { recursive: true });
  fs.writeFileSync(path.join(docsRoot, "package.json"), "{}\n");

  const result = spawnSync("bash", [SCRIPT_PATH, "--dry-run"], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.includes(`projectRoot=${fs.realpathSync(projectRoot)}`), true);
  assert.equal(result.stdout.includes(`docsPath=${fs.realpathSync(docsRoot)}`), true);
});
