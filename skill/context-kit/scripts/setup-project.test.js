#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.join(__dirname, "setup-project.js");

test("prepares a fixed ContextKit web app backed by JSON documents", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-project-"));

  const result = spawnSync(
    process.execPath,
    [
      SCRIPT_PATH,
      "--project-root",
      projectRoot,
      "--title",
      "Rail: Docs",
      "--skip-install",
    ],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const docsRoot = path.join(projectRoot, "docs", "context-kit");
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(docsRoot, "package.json"), "utf8"),
  );
  assert.equal(packageJson.dependencies.astro, "^6.3.3");
  assert.equal(packageJson.devDependencies.typescript, "^5.9.3");
  assert.equal(packageJson.dependencies["@astrojs/starlight"], undefined);

  const siteJson = JSON.parse(
    fs.readFileSync(path.join(docsRoot, "content", "site.json"), "utf8"),
  );
  assert.equal(siteJson.title, "Rail: Docs");

  const specPath = path.join(
    docsRoot,
    "content",
    "specs",
    "example-runtime.spec.json",
  );
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  assert.equal(spec.docType, "spec");
  assert.equal(spec.slug, "example-runtime");
  assert.equal(Array.isArray(spec.contract), true);

  assert.equal(
    fs.existsSync(path.join(docsRoot, "src", "pages", "specs", "[slug].astro")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(docsRoot, "src", "layouts", "ContextKitLayout.astro")),
    true,
  );

  const gitignore = fs.readFileSync(path.join(docsRoot, ".gitignore"), "utf8");
  assert.match(gitignore, /node_modules/);
  assert.match(gitignore, /dist/);
});
