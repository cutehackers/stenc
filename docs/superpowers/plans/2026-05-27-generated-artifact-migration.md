# Generated Artifact Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Stenc 0.2.0 with `stenc migrate`, generated artifact ignore policy, title preservation, and open-docs regeneration.

**Architecture:** Keep responsibilities separated: `setup-project.js` prepares and renders the docs app, `open-docs.sh` regenerates before serving, and `bin/stenc.js` owns the only Git index mutation path through `stenc migrate`. Use fail-first Node tests for each behavior before implementation.

**Tech Stack:** Node.js 20+, node:test, Bash, Git CLI, dependency-free Stenc renderer.

---

## Scope Check

This is one migration feature with three implementation surfaces: setup/rendering, CLI migration, and docs serving. It should remain one plan because all surfaces enforce the same contract: JSON is source, HTML/CSS is generated, and Git index cleanup is explicit.

## Root Cause

The issue is not only a missing ignore pattern. The generated artifact boundary is not a shared implementation contract. Setup, migration, docs opening, and validation can each grow separate generated path lists, which would recreate noisy Git state or stale rendered pages later.

The implementation therefore needs one dependency-light generated artifact helper used by both setup and migration. Git index mutation remains isolated to `stenc migrate`; setup and open-docs may write or regenerate files but must not run Git mutation commands.

## File Structure

- Modify: `package.json`
  - Set Stenc release version to `0.2.0`.
- Modify: `package-lock.json`
  - Keep package metadata version aligned with `package.json`.
- Create: `skill/stenc/scripts/generated-artifacts.js`
  - Own generated artifact route names, generated root files, `.gitignore` text, and generated artifact path helpers.
- Modify: `bin/stenc.js`
  - Add `stenc migrate`, `--docs-dir`, and `--dry-run`.
- Modify: `bin/stenc.test.js`
  - Add fail-first tests for migration behavior.
- Modify: `skill/stenc/scripts/setup-project.js`
  - Preserve existing site title, write generated artifact `.gitignore`, and emit regeneration-aware `open-docs.sh`.
- Modify: `skill/stenc/scripts/setup-project.test.js`
  - Add fail-first tests for title preservation and `.gitignore`.
- Modify: `scripts/open-docs.sh`
  - Regenerate pages before serving in the repository wrapper.
- Modify: `scripts/open-docs.test.js`
  - Add tests for read-only dry-run and regeneration preflight.
- Modify: `skill/stenc/SKILL.md`
  - Document `stenc migrate` and open-docs regeneration behavior.
- Modify: `README.md`
  - Document concise migration instructions for existing users.

### Task 1: Setup Behavior Tests

**Files:**

- Modify: `skill/stenc/scripts/setup-project.test.js`

- [ ] **Step 1: Add failing title preservation test**

Add this test to `skill/stenc/scripts/setup-project.test.js`:

```javascript
test("preserves an existing site title when --title is omitted", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-project-preserve-title-"));

  let result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--title", "Project Docs", "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = spawnSync(
    process.execPath,
    [SCRIPT_PATH, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const siteJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "docs", "stenc", "content", "site.json"), "utf8"),
  );
  assert.equal(siteJson.title, "Project Docs");
});
```

- [ ] **Step 2: Run setup tests and verify failure**

Run:

```bash
node skill/stenc/scripts/setup-project.test.js
```

Expected: FAIL because current setup rewrites the title to `Docs` when `--title` is omitted.

- [ ] **Step 3: Add failing generated artifact gitignore assertions**

Update the existing setup test that reads `docsRoot/.gitignore`:

```javascript
const gitignore = fs.readFileSync(path.join(docsRoot, ".gitignore"), "utf8");
assert.match(gitignore, /Stenc generated static pages/);
assert.match(gitignore, /\/index\.html/);
assert.match(gitignore, /\/styles\.css/);
assert.match(gitignore, /\/specs\//);
assert.match(gitignore, /\/plans\//);
assert.match(gitignore, /\/decisions\//);
assert.match(gitignore, /\/agent-context\//);
assert.doesNotMatch(gitignore, /\/content\//);
```

- [ ] **Step 4: Run setup tests and verify failure**

Run:

```bash
node skill/stenc/scripts/setup-project.test.js
```

Expected: FAIL because current `.gitignore` only ignores logs.

### Task 2: Setup Implementation

**Files:**

- Create: `skill/stenc/scripts/generated-artifacts.js`
- Modify: `skill/stenc/scripts/setup-project.js`
- Test: `skill/stenc/scripts/setup-project.test.js`

- [ ] **Step 1: Create generated artifact helper**

Create `skill/stenc/scripts/generated-artifacts.js`:

```javascript
const path = require("node:path");

const GENERATED_ROOT_FILES = ["index.html", "styles.css"];
const GENERATED_COLLECTION_DIRS = ["specs", "plans", "decisions", "agent-context"];

function generatedGitignoreText() {
  return `# Stenc generated static pages
${GENERATED_ROOT_FILES.map((name) => `/${name}`).join("\n")}
${GENERATED_COLLECTION_DIRS.map((name) => `/${name}/`).join("\n")}
*.log
`;
}

function generatedArtifactPaths(docsDir) {
  return [
    ...GENERATED_ROOT_FILES.map((name) => path.join(docsDir, name)),
    ...GENERATED_COLLECTION_DIRS.map((name) => path.join(docsDir, name)),
  ];
}

module.exports = {
  GENERATED_ROOT_FILES,
  GENERATED_COLLECTION_DIRS,
  generatedGitignoreText,
  generatedArtifactPaths,
};
```

- [ ] **Step 2: Track explicit title argument**

In `parseArgs`, add `hasTitle`:

```javascript
const options = {
  projectRoot: process.cwd(),
  docsDir: "docs/stenc",
  title: null,
  hasTitle: false,
  skipOpenDocsScript: false,
};
```

When parsing `--title`, set it:

```javascript
if (arg === "--title") {
  options.title = value;
  options.hasTitle = true;
}
```

- [ ] **Step 3: Preserve existing title**

Add this helper near `readJsonIfPresent`:

```javascript
function resolveSiteTitle(docsDir, options) {
  if (options.hasTitle) return options.title;
  const existing = readJsonIfPresent(path.join(docsDir, "content", "site.json"));
  if (existing && typeof existing.title === "string" && existing.title.trim()) {
    return existing.title;
  }
  return "Docs";
}
```

Change `writeAppData` to accept the resolved title:

```javascript
function writeAppData(docsDir, title) {
  writeJson(path.join(docsDir, "content", "site.json"), {
    title,
    description: "Fixed-format Stenc documentation app.",
  });
```

In `main`, resolve once and use it for app data and static pages:

```javascript
const siteTitle = resolveSiteTitle(options.docsDir, options);
writeAppData(options.docsDir, siteTitle);
writeGitignore(options.docsDir);
writeStaticPages(options.docsDir, siteTitle);
```

- [ ] **Step 4: Write generated artifact gitignore from the shared helper**

Import the helper:

```javascript
const { generatedGitignoreText } = require("./generated-artifacts");
```

Replace `writeGitignore` with:

```javascript
function writeGitignore(docsDir) {
  writeFile(path.join(docsDir, ".gitignore"), generatedGitignoreText());
}
```

- [ ] **Step 5: Run setup tests**

Run:

```bash
node skill/stenc/scripts/setup-project.test.js
```

Expected: PASS.

### Task 3: Migration CLI Tests

**Files:**

- Modify: `bin/stenc.test.js`

- [ ] **Step 1: Add test helpers for temporary Git repos**

Add helpers to create a Git repo with tracked generated artifacts:

```javascript
function runGit(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function prepareTrackedDocsRepo() {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-migrate-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
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
  return { projectRoot, docsRoot };
}
```

- [ ] **Step 2: Add default migrate test**

Add:

```javascript
test("migrate removes generated artifacts from the Git index without deleting local files", () => {
  const { projectRoot, docsRoot } = prepareTrackedDocsRepo();

  const result = spawnSync(process.execPath, [BIN_PATH, "migrate"], {
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
```

- [ ] **Step 3: Add custom docs dir and dry-run tests**

Add tests that run:

```bash
node bin/stenc.js migrate --docs-dir stenc
node bin/stenc.js migrate --dry-run
```

Expected custom docs dir: generated artifacts under `stenc/` are removed from Git index only.

Expected dry-run: output lists generated paths, `git status --short` remains unchanged, and local files remain.

- [ ] **Step 4: Add idempotency and non-Git tests**

Add an idempotency test that runs `stenc migrate` twice:

```javascript
test("migrate is idempotent after generated artifacts are already untracked", () => {
  const { projectRoot } = prepareTrackedDocsRepo();

  let result = spawnSync(process.execPath, [BIN_PATH, "migrate"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = spawnSync(process.execPath, [BIN_PATH, "migrate"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
```

Add a non-Git test that verifies `.gitignore` is still refreshed and Git cleanup is skipped with a clear message:

```javascript
test("migrate refreshes gitignore outside a Git repository and skips index cleanup", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-migrate-non-git-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(path.join(docsRoot, "content"), { recursive: true });

  const result = spawnSync(process.execPath, [BIN_PATH, "migrate"], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Git repository not found|skipped Git index cleanup/);
  assert.match(fs.readFileSync(path.join(docsRoot, ".gitignore"), "utf8"), /Stenc generated static pages/);
});
```

- [ ] **Step 5: Run CLI tests and verify failure**

Run:

```bash
node bin/stenc.test.js
```

Expected: FAIL because `migrate` is not implemented.

### Task 4: Migration CLI Implementation

**Files:**

- Modify: `bin/stenc.js`
- Modify: `skill/stenc/scripts/generated-artifacts.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `bin/stenc.test.js`

- [ ] **Step 1: Route `stenc migrate`**

Update argument parsing so the first positional argument `migrate` returns a migrate command object:

```javascript
if (args[0] === "migrate") {
  return parseMigrateArgs(args.slice(1));
}
```

The migrate parser should support:

```javascript
{
  command: "migrate",
  projectRoot: process.cwd(),
  docsDir: "docs/stenc",
  dryRun: false,
}
```

- [ ] **Step 2: Import the shared generated artifact helper**

Use the shared helper instead of hardcoding route names in the CLI:

```javascript
const {
  generatedArtifactPaths,
  generatedGitignoreText,
} = require("../skill/stenc/scripts/generated-artifacts");
```

- [ ] **Step 3: Refresh `.gitignore` during normal migration**

In normal mode, write the generated artifact `.gitignore` before Git cleanup:

```javascript
function refreshGeneratedGitignore(docsPath) {
  fs.mkdirSync(docsPath, { recursive: true });
  fs.writeFileSync(path.join(docsPath, ".gitignore"), generatedGitignoreText());
}
```

Do not call this function in `--dry-run`.

- [ ] **Step 4: Implement scoped `git rm --cached`**

Use `git ls-files -- <paths>` to find tracked generated artifacts. If any are tracked, run:

```javascript
spawnSync("git", ["rm", "--cached", "-r", "--", ...trackedGeneratedPaths], {
  cwd: projectRoot,
  encoding: "utf8",
});
```

Do not include `content`, `content/site.json`, `.gitignore`, or `open-docs.sh`.

- [ ] **Step 5: Keep dry-run read-only**

For `--dry-run`, print the docs dir and generated artifact paths that would be checked. Do not write `.gitignore` and do not run `git rm`.

- [ ] **Step 6: Handle Git repository absence**

Detect whether the project root is inside a Git worktree before calling `git ls-files`:

```javascript
const gitRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: projectRoot,
  encoding: "utf8",
});
if (gitRoot.status !== 0) {
  console.log("Git repository not found; refreshed .gitignore and skipped Git index cleanup.");
  return;
}
```

Expected behavior: non-Git projects still receive `.gitignore`, and migration exits successfully.

- [ ] **Step 7: Bump version**

Update `package.json` and `package-lock.json` version fields to:

```json
"version": "0.2.0"
```

- [ ] **Step 8: Run CLI tests**

Run:

```bash
node bin/stenc.test.js
```

Expected: PASS.

### Task 5: Open Docs Regeneration

**Files:**

- Modify: `scripts/open-docs.sh`
- Modify: `scripts/open-docs.test.js`
- Modify: `skill/stenc/scripts/setup-project.js`
- Test: `scripts/open-docs.test.js`

- [ ] **Step 1: Add failing dry-run read-only test**

In `scripts/open-docs.test.js`, assert that `--dry-run` does not create missing `index.html`:

```javascript
test("open-docs dry-run does not regenerate docs", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-dry-run-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(path.join(docsRoot, "content"), { recursive: true });

  const result = spawnSync("bash", [SCRIPT_PATH, "--dry-run"], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), false);
});
```

- [ ] **Step 2: Add failing normal regeneration test**

Add a non-interactive test hook so the script can run regeneration without starting the static server. Use an environment variable such as `STENC_OPEN_DOCS_PRECHECK_ONLY=1`.

```javascript
test("open-docs regenerates missing static pages before serving", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-regen-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(path.join(docsRoot, "content", "specs"), { recursive: true });
  fs.writeFileSync(path.join(docsRoot, "content", "site.json"), "{\"title\":\"Docs\"}\n");

  const result = spawnSync("bash", [SCRIPT_PATH], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      STENC_SETUP_PROJECT_JS: path.join(REPO_ROOT, "skill", "stenc", "scripts", "setup-project.js"),
      STENC_OPEN_DOCS_PRECHECK_ONLY: "1",
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), true);
  assert.equal(fs.existsSync(path.join(docsRoot, "styles.css")), true);
});
```

- [ ] **Step 3: Add failing missing renderer test**

Add:

```javascript
test("open-docs fails clearly when the renderer is missing", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-missing-renderer-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(path.join(docsRoot, "content"), { recursive: true });

  const result = spawnSync("bash", [SCRIPT_PATH], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      STENC_SETUP_PROJECT_JS: path.join(projectRoot, "missing-setup-project.js"),
      STENC_OPEN_DOCS_PRECHECK_ONLY: "1",
    },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Stenc renderer not found/);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), false);
});
```

- [ ] **Step 4: Add regeneration preflight**

Before checking for `index.html`, add:

```bash
STENC_SETUP_PROJECT_JS="${STENC_SETUP_PROJECT_JS:-${HOME}/.codex/skills/stenc/scripts/setup-project.js}"
if [[ ! -f "${STENC_SETUP_PROJECT_JS}" ]]; then
  echo "Stenc renderer not found: ${STENC_SETUP_PROJECT_JS}" >&2
  echo "Install Stenc first: stenc install --docs-dir ${DOCS_DIR}" >&2
  exit 1
fi

node "${STENC_SETUP_PROJECT_JS}" \
  --project-root "${PROJECT_ROOT}" \
  --docs-dir "${DOCS_DIR}" \
  --skip-open-docs-script

if [[ "${STENC_OPEN_DOCS_PRECHECK_ONLY:-0}" -eq 1 ]]; then
  echo "Stenc docs regenerated at ${DOCS_PATH}"
  exit 0
fi
```

Keep this after the `--dry-run` block and before the `index.html` existence check.

- [ ] **Step 5: Update generated target wrapper**

Apply the same regeneration block inside `writeOpenDocsScript` in `skill/stenc/scripts/setup-project.js`.

- [ ] **Step 6: Run open-docs tests**

Run:

```bash
node scripts/open-docs.test.js
```

Expected: PASS.

### Task 6: Documentation and Full Validation

**Files:**

- Modify: `README.md`
- Modify: `skill/stenc/SKILL.md`

- [ ] **Step 1: Document migration command**

Add concise existing-user guidance:

```bash
stenc migrate
./open-docs.sh
```

For custom docs dir:

```bash
stenc migrate --docs-dir stenc
```

- [ ] **Step 2: Document regeneration behavior**

State that `./open-docs.sh` regenerates static pages from JSON before serving and that generated HTML/CSS are not source of truth.

- [ ] **Step 3: Run focused tests**

Run:

```bash
node skill/stenc/scripts/setup-project.test.js
node bin/stenc.test.js
node scripts/open-docs.test.js
```

Expected: all focused tests pass.

- [ ] **Step 4: Run full validation**

Run:

```bash
./scripts/validate.sh
```

Expected: `Stenc validation passed.` and rendered page check passes for `examples-app`.

- [ ] **Step 5: Review Git status**

Run:

```bash
git status --short
```

Expected: only intended implementation, test, docs, and generated example changes are present.

## Self-Review

- Spec coverage: Requirements R1-R7 map to Tasks 1-6.
- Placeholder scan: No placeholder task remains; every code-changing task has concrete commands and expected output.
- Safety boundary: Only Task 4 implements Git index mutation, and only through `stenc migrate`.
- Root-cause coverage: The generated artifact path list is centralized in `generated-artifacts.js`, so setup and migration cannot drift independently.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-27-generated-artifact-migration.md`. Two execution options:

1. Subagent-Driven (recommended): dispatch a fresh subagent per task and review between tasks.
2. Inline Execution: execute tasks in this session with checkpointed validation.

Choose an execution mode before implementation begins.
