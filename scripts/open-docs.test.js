#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const net = require("node:net");
const test = require("node:test");

const REPO_ROOT = path.resolve(__dirname, "..");
const SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "open-docs.sh");

test("open-docs server uses resolved path containment and image MIME types", () => {
  const script = fs.readFileSync(SCRIPT_PATH, "utf8");

  assert.match(script, /path\.resolve\(root,'\.'\+pathname\)/);
  assert.match(script, /path\.relative\(root,file\)/);
  assert.match(script, /root=fs\.realpathSync\(process\.cwd\(\)\)/);
  assert.match(script, /fs\.realpathSync\(file\)/);
  assert.match(script, /image\/svg\+xml/);
  assert.match(script, /image\/png/);
  assert.doesNotMatch(script, /path\.join\(root,decodeURIComponent/);
});

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function waitForOutput(child, pattern) {
  return new Promise((resolve, reject) => {
    let output = "";
    let errorOutput = "";
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${pattern}: ${output}\n${errorOutput}`));
    }, 15000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (pattern.test(output)) {
        clearTimeout(timeout);
        resolve({ output, errorOutput });
      }
    });
    child.stderr.on("data", (chunk) => {
      errorOutput += chunk;
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited ${code}: ${output}\n${errorOutput}`));
    });
  });
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.stdin.write("\n");
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      resolve();
    }, 5000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function assertServerContainsSymlinks(scriptPath, projectRoot, { generated = false } = {}) {
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-server-outside-"));
  const sentinel = "TOP-SECRET-SYMLINK-SENTINEL";
  const sentinelPath = path.join(outsideRoot, "sentinel.txt");
  const port = await reservePort();
  fs.writeFileSync(sentinelPath, sentinel);
  fs.symlinkSync(sentinelPath, path.join(docsRoot, "escape.txt"));

  const child = spawn(
    "bash",
    [
      scriptPath,
      ...(generated ? [] : ["--project-root", projectRoot]),
      "--docs-dir",
      "docs/stenc",
      "--port",
      String(port),
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        STENC_OPEN_BROWSER: "0",
        STENC_SETUP_PROJECT_JS: path.join(
          REPO_ROOT,
          "skill",
          "stenc",
          "scripts",
          "setup-project.js",
        ),
      },
      stdio: ["pipe", "pipe", "pipe"],
    },
  );

  try {
    await waitForOutput(child, /Stenc docs running at/u);
    const baseUrl = `http://127.0.0.1:${port}`;
    const [index, styles, image, escaped, missing] = await Promise.all([
      fetch(`${baseUrl}/`),
      fetch(`${baseUrl}/styles.css`),
      fetch(`${baseUrl}/assets/normal.svg`),
      fetch(`${baseUrl}/escape.txt`),
      fetch(`${baseUrl}/missing.txt`),
    ]);
    assert.equal(index.status, 200);
    assert.equal(styles.status, 200);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get("content-type"), "image/svg+xml");
    assert.equal(escaped.status, 403);
    assert.equal((await escaped.text()).includes(sentinel), false);
    assert.equal(missing.status, 404);
  } finally {
    await stopServer(child);
    fs.rmSync(outsideRoot, { recursive: true, force: true });
  }
}

function prepareServerFixture() {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-server-project-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(path.join(docsRoot, "content", "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(docsRoot, "content", "site.json"),
    '{"title":"Server Test","description":"Static server fixture."}\n',
  );
  fs.writeFileSync(
    path.join(docsRoot, "content", "assets", "normal.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>\n',
  );
  return projectRoot;
}

test("repository static server rejects symlink escapes without reading external bytes", async (t) => {
  const projectRoot = prepareServerFixture();
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));

  await assertServerContainsSymlinks(SCRIPT_PATH, projectRoot);
});

test("generated static server rejects symlink escapes without reading external bytes", async (t) => {
  const projectRoot = prepareServerFixture();
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));
  const setup = spawnSync(
    process.execPath,
    [
      path.join(REPO_ROOT, "skill", "stenc", "scripts", "setup-project.js"),
      "--project-root",
      projectRoot,
      "--docs-dir",
      "docs/stenc",
    ],
    { encoding: "utf8" },
  );
  assert.equal(setup.status, 0, setup.stderr || setup.stdout);

  await assertServerContainsSymlinks(
    path.join(projectRoot, "open-docs.sh"),
    projectRoot,
    { generated: true },
  );
});

test("open-docs defaults to the current project and docs/stenc", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  fs.mkdirSync(docsRoot, { recursive: true });
  fs.writeFileSync(path.join(docsRoot, "index.html"), "<!doctype html>\n");

  const result = spawnSync("bash", [SCRIPT_PATH, "--dry-run"], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.includes(`projectRoot=${fs.realpathSync(projectRoot)}`), true);
  assert.equal(result.stdout.includes(`docsPath=${fs.realpathSync(docsRoot)}`), true);
});

test("open-docs can run from a target project root script path", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-script-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  const projectScript = path.join(projectRoot, "open-docs.sh");
  fs.mkdirSync(docsRoot, { recursive: true });
  fs.writeFileSync(path.join(docsRoot, "index.html"), "<!doctype html>\n");
  fs.copyFileSync(SCRIPT_PATH, projectScript);
  fs.chmodSync(projectScript, 0o755);

  const result = spawnSync("bash", [projectScript, "--dry-run"], {
    cwd: os.tmpdir(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.includes(`projectRoot=${path.resolve(projectRoot)}`), true);
  assert.equal(result.stdout.includes(`docsPath=${path.resolve(docsRoot)}`), true);
});

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

test("open-docs preserves site JSON source metadata while regenerating", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-open-docs-preserve-site-"));
  const docsRoot = path.join(projectRoot, "docs", "stenc");
  const sitePath = path.join(docsRoot, "content", "site.json");
  const siteJson = {
    title: "Docs",
    description: "Custom project documentation.",
    extra: { owner: "docs-team" },
  };
  fs.mkdirSync(path.dirname(sitePath), { recursive: true });
  fs.writeFileSync(sitePath, `${JSON.stringify(siteJson, null, 2)}\n`);

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
  assert.deepEqual(JSON.parse(fs.readFileSync(sitePath, "utf8")), siteJson);
  assert.equal(fs.existsSync(path.join(docsRoot, "index.html")), true);
});

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
