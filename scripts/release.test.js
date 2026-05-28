#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
}

function runGit(cwd, args) {
  const result = run("git", args, { cwd });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function copyRepoFixture(version = "0.3.0") {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-release-"));
  const fixtureRoot = path.join(tempRoot, "repo");
  fs.cpSync(REPO_ROOT, fixtureRoot, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(REPO_ROOT, source);
      if (!relative) return true;
      return !relative.split(path.sep).some((part) => part === ".git" || part === "node_modules");
    },
  });

  fs.mkdirSync(path.join(fixtureRoot, "docs", "releases"), { recursive: true });
  fs.writeFileSync(
    path.join(fixtureRoot, "docs", "releases", `v${version}.md`),
    `# Stenc v${version}\n\n## Migration\n\nRun stenc migrate when needed.\n`,
  );
  fs.writeFileSync(
    path.join(fixtureRoot, "CHANGELOG.md"),
    `# Changelog\n\n## v${version}\n\n- Add release tooling test fixture.\n`,
  );

  runGit(fixtureRoot, ["init"]);
  runGit(fixtureRoot, ["branch", "-M", "main"]);
  runGit(fixtureRoot, ["config", "user.name", "Stenc Test"]);
  runGit(fixtureRoot, ["config", "user.email", "stenc@example.invalid"]);
  runGit(fixtureRoot, ["add", "."]);
  runGit(fixtureRoot, ["commit", "-m", "fixture"]);
  return fixtureRoot;
}

function releaseEnv() {
  return {
    ...process.env,
    STENC_RELEASE_VALIDATE_COMMAND: "true",
    STENC_RELEASE_TEST_COMMAND: "true",
  };
}

test("release dry-run reports planned version without changing files or tags", () => {
  const fixtureRoot = copyRepoFixture("0.3.0");

  const result = run("bash", ["scripts/release.sh", "0.3.0", "--dry-run"], {
    cwd: fixtureRoot,
    env: releaseEnv(),
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /version=0\.3\.0/);
  assert.match(result.stdout, /tag=v0\.3\.0/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(fixtureRoot, "package.json"), "utf8")).version, "0.2.0");
  assert.equal(run("git", ["tag", "--list", "v0.3.0"], { cwd: fixtureRoot }).stdout, "");
  assert.equal(run("git", ["status", "--short"], { cwd: fixtureRoot }).stdout, "");
});

test("release syncs package versions, commits, and creates an annotated tag", () => {
  const fixtureRoot = copyRepoFixture("0.3.0");

  const result = run("bash", ["scripts/release.sh", "0.3.0"], {
    cwd: fixtureRoot,
    env: releaseEnv(),
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(fs.readFileSync(path.join(fixtureRoot, "package.json"), "utf8")).version, "0.3.0");
  const lockJson = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "package-lock.json"), "utf8"));
  assert.equal(lockJson.version, "0.3.0");
  assert.equal(lockJson.packages[""].version, "0.3.0");
  assert.match(run("git", ["log", "-1", "--pretty=%s"], { cwd: fixtureRoot }).stdout, /chore\(release\): v0\.3\.0/);
  assert.match(run("git", ["tag", "--list", "v0.3.0"], { cwd: fixtureRoot }).stdout, /v0\.3\.0/);
  assert.equal(run("git", ["status", "--short"], { cwd: fixtureRoot }).stdout, "");
});

test("release refuses to run from a dirty working tree", () => {
  const fixtureRoot = copyRepoFixture("0.3.0");
  fs.appendFileSync(path.join(fixtureRoot, "README.md"), "\nDirty change.\n");

  const result = run("bash", ["scripts/release.sh", "0.3.0"], {
    cwd: fixtureRoot,
    env: releaseEnv(),
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /working tree must be clean/);
  assert.equal(run("git", ["tag", "--list", "v0.3.0"], { cwd: fixtureRoot }).stdout, "");
});

test("release requires a matching changelog and release note", () => {
  const fixtureRoot = copyRepoFixture("0.3.0");
  fs.rmSync(path.join(fixtureRoot, "docs", "releases", "v0.3.0.md"));
  runGit(fixtureRoot, ["add", "."]);
  runGit(fixtureRoot, ["commit", "-m", "remove release note"]);

  const result = run("bash", ["scripts/release.sh", "0.3.0"], {
    cwd: fixtureRoot,
    env: releaseEnv(),
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release note not found/);
});
