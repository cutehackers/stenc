#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const CHECKER = path.join(__dirname, "check-rendered-pages.js");
const SETUP_PROJECT = path.join(__dirname, "setup-project.js");
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function copyExampleSpec(docsRoot) {
  fs.mkdirSync(path.join(docsRoot, "content", "specs"), { recursive: true });
  fs.copyFileSync(
    path.join(REPO_ROOT, "examples", "artifact-identity.spec.json"),
    path.join(docsRoot, "content", "specs", "artifact-identity.spec.json"),
  );
  fs.mkdirSync(path.join(docsRoot, "content", "assets"), { recursive: true });
  fs.copyFileSync(
    path.join(REPO_ROOT, "examples-app", "content", "assets", "stenc-flow.svg"),
    path.join(docsRoot, "content", "assets", "stenc-flow.svg"),
  );
}

function mediaSpec() {
  const source = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "examples", "artifact-identity.spec.json"), "utf8"),
  );
  source.id = "spec:media-check";
  source.slug = "media-check";
  source.title = "Media Check";
  source.body.supportingSections = [
    {
      heading: "Media",
      content: "Rendered page checks verify local assets.",
      items: [],
      blocks: [
        {
          type: "media",
          src: "assets/stenc-flow.svg",
          alt: "Stenc flow",
        },
      ],
      codeBlocks: [],
      subSections: [
        {
          heading: "Nested Media",
          content: "Nested media must also be checked.",
          items: [],
          blocks: [
            {
              type: "media",
              src: "assets/nested-flow.svg",
              alt: "Nested Stenc flow",
            },
          ],
          codeBlocks: [],
          subSections: [],
        },
      ],
    },
  ];
  return source;
}

test("fails when a JSON document has no rendered styled web page", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-render-check-missing-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  const setup = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(setup.status, 0, setup.stderr || setup.stdout);

  copyExampleSpec(docsRoot);

  const result = spawnSync(process.execPath, [CHECKER, docsRoot], {
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing rendered page/);
  assert.match(result.stderr, /specs\/artifact-identity\/index\.html/);
});

test("passes after the docs app is regenerated from JSON documents", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-render-check-present-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  copyExampleSpec(docsRoot);

  result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = spawnSync(process.execPath, [CHECKER, docsRoot], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc rendered page check passed/);
});

test("fails when a rendered document references a missing media asset", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-render-check-missing-media-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "specs", "media-check.spec.json"), mediaSpec());
  fs.mkdirSync(path.join(docsRoot, "content", "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(docsRoot, "content", "assets", "stenc-flow.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
  );

  result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = spawnSync(process.execPath, [CHECKER, docsRoot], {
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing media asset: content\/assets\/nested-flow\.svg/);
});

test("fails when media source changes are not regenerated into the rendered page", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-render-check-stale-media-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const source = mediaSpec();
  source.body.supportingSections = [];
  writeJson(path.join(docsRoot, "content", "specs", "media-check.spec.json"), source);

  result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "specs", "media-check.spec.json"), mediaSpec());
  fs.mkdirSync(path.join(docsRoot, "content", "assets"), { recursive: true });
  fs.mkdirSync(path.join(docsRoot, "assets"), { recursive: true });
  for (const fileName of ["stenc-flow.svg", "nested-flow.svg"]) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>';
    fs.writeFileSync(path.join(docsRoot, "content", "assets", fileName), svg);
    fs.writeFileSync(path.join(docsRoot, "assets", fileName), svg);
  }

  result = spawnSync(process.execPath, [CHECKER, docsRoot], {
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /rendered page does not include media source \.\.\/\.\.\/assets\/stenc-flow\.svg/);
});

test("passes when rendered documents reference present media assets", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-render-check-present-media-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");

  let result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeJson(path.join(docsRoot, "content", "specs", "media-check.spec.json"), mediaSpec());
  fs.mkdirSync(path.join(docsRoot, "content", "assets"), { recursive: true });
  for (const fileName of ["stenc-flow.svg", "nested-flow.svg"]) {
    fs.writeFileSync(
      path.join(docsRoot, "content", "assets", fileName),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
    );
  }

  result = spawnSync(
    process.execPath,
    [SETUP_PROJECT, "--project-root", projectRoot, "--skip-open-docs-script"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = spawnSync(process.execPath, [CHECKER, docsRoot], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc rendered page check passed/);
});
