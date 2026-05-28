#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  generatedArtifactPaths,
  generatedGitignoreText,
} = require("../skill/stenc/scripts/generated-artifacts");

const REPO_ROOT = path.resolve(__dirname, "..");
const INSTALL_SCRIPT = path.join(REPO_ROOT, "scripts", "install.sh");

function usage() {
  console.log(`Usage: stenc <command> [options]

Install the Stenc Codex skill and prepare the current repository's docs app.

Run this from the target project root. The generated app defaults to
docs/stenc.

Commands:
  install                  Install the Stenc skill and prepare docs.
  migrate                  Stop tracking generated static docs artifacts.

Options:
  --project-root <path>       Target project root. Defaults to the current directory.
  --docs-dir <path>           Docs app path inside the target project. Defaults to docs/stenc.
  --title <text>              Target docs app title. Defaults to "Docs".
  --dry-run                   For migrate, print planned paths without changing files or Git.
  --skip-project-install      Deprecated compatibility flag.
  -h, --help                  Show this help.
`);
}

function parseInstallArgs(argv) {
  const options = {
    command: "install",
    projectRoot: process.cwd(),
    passthrough: [],
  };

  let args = [...argv];
  if (args[0] === "install") {
    args = args.slice(1);
  }

  if (args.length === 0) {
    return options;
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    }

    if (arg === "--skip-project-install") {
      options.passthrough.push(arg);
      continue;
    }

    const valueOptions = new Set(["--project-root", "--docs-dir", "--title"]);
    if (valueOptions.has(arg)) {
      const value = args[index + 1];
      if (!value) throw new Error(`missing value for ${arg}`);
      index += 1;
      if (arg === "--project-root") {
        options.projectRoot = path.resolve(value);
      } else {
        options.passthrough.push(arg, value);
      }
      continue;
    }

    throw new Error(`unknown option: ${arg}`);
  }

  return options;
}

function parseMigrateArgs(args) {
  const options = {
    command: "migrate",
    projectRoot: process.cwd(),
    docsDir: "docs/stenc",
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    const valueOptions = new Set(["--project-root", "--docs-dir"]);
    if (valueOptions.has(arg)) {
      const value = args[index + 1];
      if (!value) throw new Error(`missing value for ${arg}`);
      index += 1;
      if (arg === "--project-root") options.projectRoot = path.resolve(value);
      if (arg === "--docs-dir") options.docsDir = value;
      continue;
    }
    throw new Error(`unknown option: ${arg}`);
  }

  return options;
}

function parseArgs(argv) {
  if (argv[0] === "migrate") return parseMigrateArgs(argv.slice(1));
  return parseInstallArgs(argv);
}

function refreshGeneratedGitignore(docsPath) {
  fs.mkdirSync(docsPath, { recursive: true });
  fs.writeFileSync(path.join(docsPath, ".gitignore"), generatedGitignoreText());
}

function toGitPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function assertDocsPathInsideProject(projectRoot, docsPath) {
  const projectRealPath = fs.realpathSync(projectRoot);
  const docsRealPath = fs.realpathSync(docsPath);
  const relative = path.relative(projectRealPath, docsRealPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Stenc docs directory must be inside the project root: ${docsPath}`);
  }
}

function runGit(projectRoot, args) {
  return spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
  });
}

function migrate(options) {
  const projectRoot = path.resolve(options.projectRoot);
  const docsPath = path.resolve(projectRoot, options.docsDir);

  if (!fs.existsSync(docsPath)) {
    console.error(`Stenc docs directory not found: ${docsPath}`);
    console.error(`Run setup first, for example: stenc install --docs-dir ${options.docsDir}`);
    process.exit(1);
  }

  try {
    assertDocsPathInsideProject(projectRoot, docsPath);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  const docsDirForGit = toGitPath(path.relative(projectRoot, docsPath) || ".");
  const generatedPaths = generatedArtifactPaths(docsDirForGit).map(toGitPath);

  if (options.dryRun) {
    console.log(`projectRoot=${projectRoot}`);
    console.log(`docsDir=${docsDirForGit}`);
    console.log("generatedArtifacts:");
    for (const artifactPath of generatedPaths) {
      console.log(`  ${artifactPath}`);
    }
    return;
  }

  refreshGeneratedGitignore(docsPath);

  const gitRoot = runGit(projectRoot, ["rev-parse", "--show-toplevel"]);
  if (gitRoot.status !== 0) {
    console.log("Git repository not found; refreshed .gitignore and skipped Git index cleanup.");
    return;
  }

  const listResult = runGit(projectRoot, ["ls-files", "--", ...generatedPaths]);
  if (listResult.status !== 0) {
    if (listResult.stderr) process.stderr.write(listResult.stderr);
    process.exit(listResult.status ?? 1);
  }

  const trackedGeneratedPaths = listResult.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (trackedGeneratedPaths.length === 0) {
    console.log("No tracked Stenc generated artifacts found.");
    return;
  }

  const removeResult = runGit(projectRoot, [
    "rm",
    "--cached",
    "-r",
    "--",
    ...trackedGeneratedPaths,
  ]);
  if (removeResult.stdout) process.stdout.write(removeResult.stdout);
  if (removeResult.stderr) process.stderr.write(removeResult.stderr);
  if (removeResult.status !== 0) process.exit(removeResult.status ?? 1);
}

function install(options) {
  const installArgs = [
    INSTALL_SCRIPT,
    "--project-root",
    options.projectRoot,
    ...options.passthrough,
  ];

  const result = spawnSync("bash", installArgs, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: process.env,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error("");
    usage();
    process.exit(2);
  }

  if (options.command === "migrate") {
    migrate(options);
    return;
  }

  install(options);
}

main();
