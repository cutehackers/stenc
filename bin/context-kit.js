#!/usr/bin/env node

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const INSTALL_SCRIPT = path.join(REPO_ROOT, "scripts", "install.sh");

function usage() {
  console.log(`Usage: context-kit [install] [options]

Install the ContextKit Codex skill and prepare the current repository's docs app.

Run this from the target project root. The generated app defaults to
docs/context-kit.

Options:
  --project-root <path>       Target project root. Defaults to the current directory.
  --docs-dir <path>           Docs app path inside the target project. Defaults to docs/context-kit.
  --title <text>              Target docs app title. Defaults to "Docs".
  --skip-project-install      Deprecated compatibility flag.
  -h, --help                  Show this help.
`);
}

function parseArgs(argv) {
  const options = {
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

main();
