#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..");
const BOOTSTRAP_SCRIPT = path.join(REPO_ROOT, "scripts", "bootstrap.sh");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
}

function copyRepoFixture(targetRoot) {
  fs.cpSync(REPO_ROOT, targetRoot, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(REPO_ROOT, source);
      if (!relative) return true;
      return !relative.split(path.sep).some((part) => part === ".git" || part === "node_modules");
    },
  });
  assert.equal(run("git", ["init"], { cwd: targetRoot }).status, 0);
  assert.equal(run("git", ["branch", "-M", "main"], { cwd: targetRoot }).status, 0);
  assert.equal(run("git", ["add", "."], { cwd: targetRoot }).status, 0);
  assert.equal(
    run(
      "git",
      [
        "-c",
        "user.email=stenc@example.test",
        "-c",
        "user.name=Stenc Test",
        "commit",
        "-m",
        "fixture",
      ],
      { cwd: targetRoot },
    ).status,
    0,
  );
}

test("bootstrap installs into the current project without a local repo path", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-bootstrap-"));
  const sourceRepo = path.join(tempRoot, "source");
  const cacheRoot = path.join(tempRoot, "cache");
  const skillsRoot = path.join(tempRoot, "skills");
  const binRoot = path.join(tempRoot, "bin");
  const projectRoot = path.join(tempRoot, "target-project");
  fs.mkdirSync(binRoot);
  fs.mkdirSync(projectRoot);
  copyRepoFixture(sourceRepo);

  const result = run("bash", [BOOTSTRAP_SCRIPT, "install", "--title", "Bootstrap Docs"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PATH: `${binRoot}${path.delimiter}${process.env.PATH}`,
      CODEX_SKILLS_DIR: skillsRoot,
      STENC_BIN_DIR: binRoot,
      STENC_CACHE_DIR: cacheRoot,
      STENC_REPO: sourceRepo,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(skillsRoot, "stenc", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(projectRoot, "docs", "stenc", "index.html")), true);
  assert.equal(fs.existsSync(path.join(binRoot, "stenc")), true);

  const commandResult = run("stenc", ["--help"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PATH: `${binRoot}${path.delimiter}${process.env.PATH}`,
      CODEX_SKILLS_DIR: skillsRoot,
    },
  });
  assert.equal(commandResult.status, 0, commandResult.stderr || commandResult.stdout);
  assert.match(commandResult.stdout, /Usage: stenc/);

  const siteJson = JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "docs", "stenc", "content", "site.json"),
      "utf8",
    ),
  );
  assert.equal(siteJson.title, "Bootstrap Docs");
});

test("bootstrap forwards install options without requiring the install subcommand", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-bootstrap-"));
  const sourceRepo = path.join(tempRoot, "source");
  const cacheRoot = path.join(tempRoot, "cache");
  const skillsRoot = path.join(tempRoot, "skills");
  const projectRoot = path.join(tempRoot, "target-project");
  fs.mkdirSync(projectRoot);
  copyRepoFixture(sourceRepo);

  const result = run("bash", [BOOTSTRAP_SCRIPT, "--docs-dir", "docs/internal/stenc"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      CODEX_SKILLS_DIR: skillsRoot,
      STENC_CACHE_DIR: cacheRoot,
      STENC_REPO: sourceRepo,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    fs.existsSync(path.join(projectRoot, "docs", "internal", "stenc", "index.html")),
    true,
  );
});
