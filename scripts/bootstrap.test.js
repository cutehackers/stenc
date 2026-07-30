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
  assert.equal(
    fs.existsSync(
      path.join(
        skillsRoot,
        "stenc",
        "templates",
        "assets",
        "architecture-overview.svg",
      ),
    ),
    true,
  );
  assert.equal(fs.existsSync(path.join(projectRoot, "docs", "stenc", "index.html")), true);
  assert.equal(
    fs.existsSync(
      path.join(
        projectRoot,
        "docs",
        "stenc",
        "content",
        "assets",
        "architecture-overview.svg",
      ),
    ),
    true,
  );
  assert.equal(fs.existsSync(path.join(binRoot, "stenc")), true);

  const planTemplate = JSON.parse(
    fs.readFileSync(path.join(skillsRoot, "stenc", "templates", "plan.json"), "utf8"),
  );
  const planPath = path.join(
    projectRoot,
    "docs",
    "stenc",
    "content",
    "plans",
    "yyyy-mm-dd-topic.plan.json",
  );
  fs.mkdirSync(path.dirname(planPath), { recursive: true });
  fs.writeFileSync(planPath, `${JSON.stringify(planTemplate, null, 2)}\n`);
  const templateValidationCommand = planTemplate.body.slices[0].steps.find(
    (step) => step.command,
  ).command;
  const templateValidationResult = run("bash", ["-c", templateValidationCommand], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      CODEX_SKILLS_DIR: skillsRoot,
    },
  });
  assert.equal(
    templateValidationResult.status,
    0,
    templateValidationResult.stderr || templateValidationResult.stdout,
  );
  assert.match(templateValidationResult.stdout, /Stenc validation passed/u);

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
