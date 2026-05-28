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
