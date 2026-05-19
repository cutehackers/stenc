#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const CLI_PATH = path.join(__dirname, "context-kit.js");

test("install defaults to the current target project", () => {
  const skillsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-skills-"));
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-cli-project-"));

  const result = spawnSync(
    process.execPath,
    [
      CLI_PATH,
      "install",
      "--title",
      "Target Docs",
      "--skip-project-install",
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: { ...process.env, CODEX_SKILLS_DIR: skillsRoot },
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    fs.existsSync(path.join(skillsRoot, "context-kit", "SKILL.md")),
    true,
  );

  const siteJson = JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "docs", "context-kit", "content", "site.json"),
      "utf8",
    ),
  );
  assert.equal(siteJson.title, "Target Docs");
});

test("install still accepts an explicit project root", () => {
  const skillsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-skills-"));
  const commandRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-command-"));
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-explicit-project-"));

  const result = spawnSync(
    process.execPath,
    [
      CLI_PATH,
      "install",
      "--project-root",
      projectRoot,
      "--docs-dir",
      "docs/ck",
      "--skip-project-install",
    ],
    {
      cwd: commandRoot,
      encoding: "utf8",
      env: { ...process.env, CODEX_SKILLS_DIR: skillsRoot },
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(
    fs.existsSync(path.join(projectRoot, "docs", "ck", "content", "site.json")),
    true,
  );
});
