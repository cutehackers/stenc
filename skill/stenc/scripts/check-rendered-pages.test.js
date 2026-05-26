#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const CHECKER = path.join(__dirname, "check-rendered-pages.js");
const SETUP_PROJECT = path.join(__dirname, "setup-project.js");
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

function copyExampleSpec(docsRoot) {
  fs.mkdirSync(path.join(docsRoot, "content", "specs"), { recursive: true });
  fs.copyFileSync(
    path.join(REPO_ROOT, "examples", "artifact-identity.spec.json"),
    path.join(docsRoot, "content", "specs", "artifact-identity.spec.json"),
  );
}

test("fails when a JSON document has no rendered styled web page", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-render-check-missing-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  const setup = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(setup.status, 0, setup.stderr || setup.stdout);

  copyExampleSpec(docsRoot);

  const result = spawnSync(process.execPath, [CHECKER, docsRoot], {
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing rendered page/);
  assert.match(result.stderr, /specs\/artifact-identity\/index\.html/);
});

test("passes after the docs app is regenerated from JSON documents", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-render-check-present-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  copyExampleSpec(docsRoot);

  result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = spawnSync(process.execPath, [CHECKER, docsRoot], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc rendered page check passed/);
});
