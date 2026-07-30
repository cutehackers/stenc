#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..");
const GENERATED_EXAMPLES_PATHS = [
  "examples-app/index.html",
  "examples-app/styles.css",
  "examples-app/specs",
  "examples-app/plans",
  "examples-app/decisions",
  "examples-app/agent-context",
  "examples-app/assets",
];

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || REPO_ROOT,
    encoding: "utf8",
    ...options,
  });
}

function trackedFiles() {
  const result = run("git", ["ls-files", "-z"]);
  if (result.status === 0) {
    return result.stdout.split("\0").filter(Boolean);
  }

  assert.equal(
    fs.existsSync(path.join(REPO_ROOT, ".git")),
    false,
    result.stderr || result.stdout,
  );

  const files = [];
  function visit(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(REPO_ROOT, entryPath);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else {
        files.push(relativePath);
      }
    }
  }
  visit(REPO_ROOT);
  return files.sort();
}

function isGeneratedExamplesPath(filePath) {
  return GENERATED_EXAMPLES_PATHS.some(
    (generatedPath) =>
      filePath === generatedPath || filePath.startsWith(`${generatedPath}/`),
  );
}

function copyTrackedFixture(targetRoot, files) {
  for (const relativePath of files) {
    const sourcePath = path.join(REPO_ROOT, relativePath);
    const targetPath = path.join(targetRoot, relativePath);
    const stat = fs.lstatSync(sourcePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (stat.isSymbolicLink()) {
      fs.symlinkSync(fs.readlinkSync(sourcePath), targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, stat.mode);
    }
  }
}

function snapshotTree(rootPath) {
  const snapshot = {};
  function visit(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, entryPath);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else {
        snapshot[relativePath] = fs.readFileSync(entryPath).toString("base64");
      }
    }
  }
  visit(rootPath);
  return snapshot;
}

test("clean tracked-index fixture regenerates deterministic examples output from source only", (t) => {
  const files = trackedFiles();
  assert.deepEqual(
    files.filter(isGeneratedExamplesPath),
    [],
    "examples-app generated output must not be tracked",
  );

  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-clean-index-"));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  copyTrackedFixture(fixtureRoot, files);

  const appRoot = path.join(fixtureRoot, "examples-app");
  for (const generatedPath of GENERATED_EXAMPLES_PATHS) {
    assert.equal(
      fs.existsSync(path.join(fixtureRoot, generatedPath)),
      false,
      `${generatedPath} must be absent before regeneration`,
    );
  }

  const firstSetup = run("bash", ["scripts/setup-examples-app.sh"], { cwd: fixtureRoot });
  assert.equal(firstSetup.status, 0, firstSetup.stderr || firstSetup.stdout);
  for (const requiredPath of [
    "specs/component-catalog/index.html",
    "plans/component-catalog/index.html",
    "assets/stenc-flow.svg",
  ]) {
    assert.equal(fs.existsSync(path.join(appRoot, requiredPath)), true, requiredPath);
  }
  const firstCheck = run(
    process.execPath,
    ["skill/stenc/scripts/check-rendered-pages.js", "examples-app"],
    { cwd: fixtureRoot },
  );
  assert.equal(firstCheck.status, 0, firstCheck.stderr || firstCheck.stdout);
  const firstSnapshot = snapshotTree(appRoot);

  const secondSetup = run("bash", ["scripts/setup-examples-app.sh"], { cwd: fixtureRoot });
  assert.equal(secondSetup.status, 0, secondSetup.stderr || secondSetup.stdout);
  const secondCheck = run(
    process.execPath,
    ["skill/stenc/scripts/check-rendered-pages.js", "examples-app"],
    { cwd: fixtureRoot },
  );
  assert.equal(secondCheck.status, 0, secondCheck.stderr || secondCheck.stdout);
  assert.deepEqual(snapshotTree(appRoot), firstSnapshot);
});
