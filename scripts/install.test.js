#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..");
const INSTALL_SCRIPT = path.join(REPO_ROOT, "scripts", "install.sh");
const PACKAGE_VERSION = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")).version;

test("install can prepare the target project's Stenc docs app once", () => {
  const skillsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-skills-"));
  const binRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-bin-"));
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-install-project-"));

  const result = spawnSync(
    "bash",
    [
      INSTALL_SCRIPT,
      "--project-root",
      projectRoot,
      "--title",
      "Rail Docs",
      "--skip-project-install",
    ],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${binRoot}${path.delimiter}${process.env.PATH}`,
        CODEX_SKILLS_DIR: skillsRoot,
        STENC_BIN_DIR: binRoot,
      },
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    fs.existsSync(path.join(skillsRoot, "stenc", "SKILL.md")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(binRoot, "stenc")),
    true,
  );
  assert.equal(
    fs.existsSync(
      path.join(
        projectRoot,
        "docs",
        "stenc",
        "content",
        "specs",
        "example-runtime.spec.json",
      ),
    ),
    false,
  );
});

test("install can prepare a target project with default project install", () => {
  const skillsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-skills-"));
  const binRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-bin-"));
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-install-default-"));

  const result = spawnSync(
    "bash",
    [
      INSTALL_SCRIPT,
      "--project-root",
      projectRoot,
    ],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${binRoot}${path.delimiter}${process.env.PATH}`,
        CODEX_SKILLS_DIR: skillsRoot,
        STENC_BIN_DIR: binRoot,
      },
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const commandResult = spawnSync("stenc", ["--help"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${binRoot}${path.delimiter}${process.env.PATH}`,
      CODEX_SKILLS_DIR: skillsRoot,
    },
  });
  assert.equal(commandResult.status, 0, commandResult.stderr || commandResult.stdout);
  assert.match(commandResult.stdout, /Usage: stenc/);
  for (const versionArg of ["--version", "-v", "version"]) {
    const versionResult = spawnSync("stenc", [versionArg], {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${binRoot}${path.delimiter}${process.env.PATH}`,
        CODEX_SKILLS_DIR: skillsRoot,
      },
    });
    assert.equal(versionResult.status, 0, versionResult.stderr || versionResult.stdout);
    assert.equal(versionResult.stdout.trim(), PACKAGE_VERSION);
  }
  assert.equal(
    fs.existsSync(
      path.join(projectRoot, "docs", "stenc", "index.html"),
    ),
    true,
  );
});
