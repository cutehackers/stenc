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

function copyRepoFixture(version = "0.3.0", options = {}) {
  const { createReleaseDocs = true, createChangelog = true } = options;
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
  const fixtureReleaseNote = path.join(fixtureRoot, "docs", "releases", `v${version}.md`);
  const fixtureChangelog = path.join(fixtureRoot, "CHANGELOG.md");

  if (createReleaseDocs) {
    fs.writeFileSync(
      fixtureReleaseNote,
      `# Stenc v${version}\n\n## Migration\n\nRun stenc migrate when needed.\n`,
    );
  } else if (fs.existsSync(fixtureReleaseNote)) {
    fs.rmSync(fixtureReleaseNote);
  }
  if (createChangelog) {
    fs.writeFileSync(
      fixtureChangelog,
      `# Changelog\n\n## v${version}\n\n- Add release tooling test fixture.\n`,
    );
  } else if (fs.existsSync(fixtureChangelog)) {
    fs.rmSync(fixtureChangelog);
  }

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
  assert.match(result.stdout, /releaseNoteAction=exists/);
  assert.match(result.stdout, /changelogAction=exists/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(fixtureRoot, "package.json"), "utf8")).version, "0.2.0");
  assert.equal(run("git", ["tag", "--list", "v0.3.0"], { cwd: fixtureRoot }).stdout, "");
  assert.equal(run("git", ["status", "--short"], { cwd: fixtureRoot }).stdout, "");
});

test("release dry-run reports generated docs without writing them", () => {
  const fixtureRoot = copyRepoFixture("0.3.0", {
    createReleaseDocs: false,
    createChangelog: false,
  });

  const result = run("bash", ["scripts/release.sh", "0.3.0", "--dry-run"], {
    cwd: fixtureRoot,
    env: releaseEnv(),
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /releaseNoteAction=create/);
  assert.match(result.stdout, /changelogAction=create/);
  assert.equal(fs.existsSync(path.join(fixtureRoot, "docs", "releases", "v0.3.0.md")), false);
  assert.equal(fs.existsSync(path.join(fixtureRoot, "CHANGELOG.md")), false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(fixtureRoot, "package.json"), "utf8")).version, "0.2.0");
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

test("release creates changelog and release note when missing", () => {
  const fixtureRoot = copyRepoFixture("0.3.0", {
    createReleaseDocs: false,
    createChangelog: false,
  });

  const result = run("bash", ["scripts/release.sh", "0.3.0"], {
    cwd: fixtureRoot,
    env: releaseEnv(),
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /releaseNoteAction=create/);
  assert.match(result.stdout, /changelogAction=create/);
  assert.match(
    fs.readFileSync(path.join(fixtureRoot, "docs", "releases", "v0.3.0.md"), "utf8"),
    /# Stenc v0\.3\.0/,
  );
  assert.match(fs.readFileSync(path.join(fixtureRoot, "CHANGELOG.md"), "utf8"), /## v0\.3\.0/);
  const committedFiles = run("git", ["show", "--pretty=", "--name-only", "HEAD"], { cwd: fixtureRoot }).stdout;
  assert.match(committedFiles, /CHANGELOG\.md/);
  assert.match(committedFiles, /docs\/releases\/v0\.3\.0\.md/);
  assert.equal(run("git", ["status", "--short"], { cwd: fixtureRoot }).stdout, "");
});

test("release inserts a missing changelog section and preserves an existing release note", () => {
  const fixtureRoot = copyRepoFixture("0.3.0", {
    createChangelog: false,
  });
  fs.writeFileSync(path.join(fixtureRoot, "CHANGELOG.md"), "# Changelog\n\n## v0.2.0\n\n- Older release.\n");
  runGit(fixtureRoot, ["add", "."]);
  runGit(fixtureRoot, ["commit", "-m", "add older changelog"]);

  const result = run("bash", ["scripts/release.sh", "0.3.0"], {
    cwd: fixtureRoot,
    env: releaseEnv(),
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /releaseNoteAction=exists/);
  assert.match(result.stdout, /changelogAction=insert-section/);
  assert.match(fs.readFileSync(path.join(fixtureRoot, "CHANGELOG.md"), "utf8"), /## v0\.3\.0[\s\S]+## v0\.2\.0/);
  assert.match(
    fs.readFileSync(path.join(fixtureRoot, "docs", "releases", "v0.3.0.md"), "utf8"),
    /Run stenc migrate when needed\./,
  );
});
