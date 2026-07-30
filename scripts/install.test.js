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
  const templateValidationResult = spawnSync(
    "bash",
    ["-c", templateValidationCommand],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CODEX_SKILLS_DIR: skillsRoot,
      },
    },
  );
  assert.equal(
    templateValidationResult.status,
    0,
    templateValidationResult.stderr || templateValidationResult.stdout,
  );
  assert.match(templateValidationResult.stdout, /Stenc validation passed/u);
  assert.equal(
    fs.existsSync(
      path.join(projectRoot, "docs", "stenc", "index.html"),
    ),
    true,
  );
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
});
