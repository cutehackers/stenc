#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const CLI_PATH = path.join(__dirname, "stenc.js");

function runGit(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function prepareTrackedDocsRepo(docsDir = path.join("docs", "stenc")) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-migrate-"));
  const docsRoot = path.join(projectRoot, docsDir);
  fs.mkdirSync(path.join(docsRoot, "content", "specs"), { recursive: true });
  fs.mkdirSync(path.join(docsRoot, "specs", "example"), { recursive: true });
  fs.writeFileSync(path.join(docsRoot, "content", "site.json"), "{\"title\":\"Docs\"}\n");
  fs.writeFileSync(path.join(docsRoot, "content", "specs", "example.spec.json"), "{}\n");
  fs.writeFileSync(path.join(docsRoot, "index.html"), "<!doctype html>\n");
  fs.writeFileSync(path.join(docsRoot, "styles.css"), "body{}\n");
  fs.writeFileSync(path.join(docsRoot, "specs", "index.html"), "<!doctype html>\n");
  fs.writeFileSync(path.join(docsRoot, "specs", "example", "index.html"), "<!doctype html>\n");
  runGit(projectRoot, ["init"]);
  runGit(projectRoot, ["config", "user.name", "Stenc Test"]);
  runGit(projectRoot, ["config", "user.email", "stenc@example.invalid"]);
  runGit(projectRoot, ["add", "."]);
  runGit(projectRoot, ["commit", "-m", "seed stenc docs"]);
  return { projectRoot, docsRoot, docsDir };
}

test("install defaults to the current target project", () => {
  const skillsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-skills-"));
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-cli-project-"));

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
    fs.existsSync(path.join(skillsRoot, "stenc", "SKILL.md")),
    true,
  );

  const siteJson = JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "docs", "stenc", "content", "site.json"),
      "utf8",
    ),
  );
  assert.equal(siteJson.title, "Target Docs");
});

test("install still accepts an explicit project root", () => {
  const skillsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-skills-"));
  const commandRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-command-"));
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-explicit-project-"));

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

test("migrate removes generated artifacts from the Git index without deleting local files", () => {
  const { projectRoot, docsRoot } = prepareTrackedDocsRepo();

  const result = spawnSync(process.execPath, [CLI_PATH, "migrate"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const status = spawnSync("git", ["status", "--short"], {
    cwd: projectRoot,
    encoding: "utf8",
  }).stdout;
  assert.match(status, /D  docs\/stenc\/index\.html/);
  assert.match(status, /D  docs\/stenc\/styles\.css/);
  assert.match(status, /D  docs\/stenc\/specs\/index\.html/);
  assert.equal(status.includes("docs/stenc/content/site.json"), false);
  assert.equal(status.includes("docs/stenc/content/specs/example.spec.json"), false);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), true);
  assert.equal(fs.existsSync(path.join(docsRoot, "styles.css")), true);

  const gitignore = fs.readFileSync(path.join(docsRoot, ".gitignore"), "utf8");
  assert.match(gitignore, /Stenc generated static pages/);
  assert.match(gitignore, /\/index\.html/);
  assert.match(gitignore, /\/styles\.css/);
  assert.match(gitignore, /\/specs\//);
  assert.doesNotMatch(gitignore, /\/content\//);
});

test("migrate supports a custom docs directory", () => {
  const { projectRoot, docsRoot } = prepareTrackedDocsRepo("stenc");

  const result = spawnSync(process.execPath, [CLI_PATH, "migrate", "--docs-dir", "stenc"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const status = spawnSync("git", ["status", "--short"], {
    cwd: projectRoot,
    encoding: "utf8",
  }).stdout;
  assert.match(status, /D  stenc\/index\.html/);
  assert.match(status, /D  stenc\/styles\.css/);
  assert.equal(status.includes("stenc/content/site.json"), false);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), true);
  assert.match(fs.readFileSync(path.join(docsRoot, ".gitignore"), "utf8"), /\/specs\//);
});

test("migrate dry-run leaves Git state and files untouched", () => {
  const { projectRoot, docsRoot } = prepareTrackedDocsRepo();

  const result = spawnSync(process.execPath, [CLI_PATH, "migrate", "--dry-run"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /docsDir=docs\/stenc/);
  assert.match(result.stdout, /docs\/stenc\/index\.html/);
  assert.match(result.stdout, /docs\/stenc\/styles\.css/);

  const status = spawnSync("git", ["status", "--short"], {
    cwd: projectRoot,
    encoding: "utf8",
  }).stdout;
  assert.equal(status, "");
  assert.equal(fs.existsSync(path.join(docsRoot, ".gitignore")), false);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), true);
});

test("migrate rejects docs directories outside the project without writing files", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-migrate-project-"));
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-migrate-outside-"));
  const outsideDocsRoot = path.join(outsideRoot, "docs");
  fs.mkdirSync(path.join(outsideDocsRoot, "content"), { recursive: true });
  runGit(projectRoot, ["init"]);

  const result = spawnSync(
    process.execPath,
    [CLI_PATH, "migrate", "--project-root", projectRoot, "--docs-dir", outsideDocsRoot],
    {
      cwd: projectRoot,
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /inside the project root/);
  assert.equal(fs.existsSync(path.join(outsideDocsRoot, ".gitignore")), false);
});

test("migrate is idempotent after generated artifacts are already untracked", () => {
  const { projectRoot } = prepareTrackedDocsRepo();

  let result = spawnSync(process.execPath, [CLI_PATH, "migrate"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = spawnSync(process.execPath, [CLI_PATH, "migrate"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("migrate refreshes gitignore outside a Git repository and skips index cleanup", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-migrate-non-git-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(path.join(docsRoot, "content"), { recursive: true });

  const result = spawnSync(process.execPath, [CLI_PATH, "migrate"], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Git repository not found|skipped Git index cleanup/);
  assert.match(fs.readFileSync(path.join(docsRoot, ".gitignore"), "utf8"), /Stenc generated static pages/);
});
