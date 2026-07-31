"use strict";

const fs = require("node:fs");
const path = require("node:path");

function isContainedPath(rootPath, candidatePath) {
  const relative = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function inspectPathWithin(rootPath, candidatePath, expectedType) {
  const absoluteRoot = path.resolve(rootPath);
  const absoluteCandidate = path.resolve(candidatePath);
  if (!isContainedPath(absoluteRoot, absoluteCandidate)) {
    return { ok: false, exists: false, reason: "outside root" };
  }

  let rootStat;
  try {
    rootStat = fs.lstatSync(absoluteRoot);
  } catch (error) {
    if (error.code === "ENOENT") return { ok: false, exists: false, reason: "missing root" };
    throw error;
  }
  if (rootStat.isSymbolicLink()) {
    return { ok: false, exists: true, reason: "root is a symlink" };
  }
  if (!rootStat.isDirectory()) {
    return { ok: false, exists: true, reason: "root is not a directory" };
  }

  const relative = path.relative(absoluteRoot, absoluteCandidate);
  const parts = relative === "" ? [] : relative.split(path.sep);
  let current = absoluteRoot;
  for (let index = 0; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT") return { ok: false, exists: false, reason: "missing" };
      throw error;
    }
    if (stat.isSymbolicLink()) {
      return { ok: false, exists: true, reason: "path contains a symlink" };
    }
    if (index < parts.length - 1 && !stat.isDirectory()) {
      return { ok: false, exists: true, reason: "parent is not a directory" };
    }
    if (index === parts.length - 1) {
      const typeMatches = expectedType === "file" ? stat.isFile() : stat.isDirectory();
      if (!typeMatches) {
        return {
          ok: false,
          exists: true,
          reason: `path is not a regular ${expectedType}`,
        };
      }
    }
  }

  const canonicalRoot = fs.realpathSync(absoluteRoot);
  const canonicalCandidate = fs.realpathSync(absoluteCandidate);
  if (!isContainedPath(canonicalRoot, canonicalCandidate)) {
    return { ok: false, exists: true, reason: "canonical path escapes root" };
  }
  return { ok: true, exists: true, reason: null };
}

function inspectRegularFileWithin(rootPath, candidatePath) {
  return inspectPathWithin(rootPath, candidatePath, "file");
}

function inspectDirectoryWithin(rootPath, candidatePath) {
  return inspectPathWithin(rootPath, candidatePath, "directory");
}

function ensureDirectoryWithin(rootPath, directoryPath) {
  const absoluteRoot = path.resolve(rootPath);
  const absoluteDirectory = path.resolve(directoryPath);
  if (!isContainedPath(absoluteRoot, absoluteDirectory)) {
    throw new Error(`directory escapes root: ${absoluteDirectory}`);
  }

  const rootInspection = inspectDirectoryWithin(absoluteRoot, absoluteRoot);
  if (!rootInspection.ok) {
    throw new Error(`unsafe directory root ${absoluteRoot}: ${rootInspection.reason}`);
  }

  const relative = path.relative(absoluteRoot, absoluteDirectory);
  let current = absoluteRoot;
  for (const part of relative === "" ? [] : relative.split(path.sep)) {
    current = path.join(current, part);
    try {
      fs.mkdirSync(current);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    const inspection = inspectDirectoryWithin(absoluteRoot, current);
    if (!inspection.ok) {
      throw new Error(`unsafe directory ${current}: ${inspection.reason}`);
    }
  }
}

function prepareContainedDirectory(rootPath, requestedPath, label = "directory") {
  const absoluteRoot = path.resolve(rootPath);
  let rootStat;
  try {
    rootStat = fs.lstatSync(absoluteRoot);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`project root does not exist: ${absoluteRoot}`);
    }
    throw error;
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error(`project root must be a real directory without symlinks: ${absoluteRoot}`);
  }

  const absoluteDirectory = path.isAbsolute(requestedPath)
    ? path.resolve(requestedPath)
    : path.resolve(absoluteRoot, requestedPath);
  const relative = path.relative(absoluteRoot, absoluteDirectory);
  if (
    relative === ""
    || relative === ".."
    || relative.startsWith(`..${path.sep}`)
    || path.isAbsolute(relative)
  ) {
    throw new Error(`${label} must be inside the project root: ${absoluteDirectory}`);
  }

  const canonicalRoot = fs.realpathSync(absoluteRoot);
  const parts = relative.split(path.sep);
  let current = absoluteRoot;
  let firstMissingIndex = parts.length;
  for (let index = 0; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT") {
        firstMissingIndex = index;
        break;
      }
      throw error;
    }
    if (stat.isSymbolicLink()) {
      throw new Error(`${label} contains a symlink: ${current}`);
    }
    if (!stat.isDirectory()) {
      throw new Error(`${label} ancestor is not a directory: ${current}`);
    }
    const canonicalCurrent = fs.realpathSync(current);
    if (!isContainedPath(canonicalRoot, canonicalCurrent)) {
      throw new Error(`${label} canonical path escapes the project root: ${current}`);
    }
  }

  current = firstMissingIndex === 0
    ? absoluteRoot
    : path.join(absoluteRoot, ...parts.slice(0, firstMissingIndex));
  for (let index = firstMissingIndex; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    try {
      fs.mkdirSync(current);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    const inspection = inspectDirectoryWithin(absoluteRoot, current);
    if (!inspection.ok) {
      throw new Error(`${label} is unsafe: ${current} (${inspection.reason})`);
    }
  }

  return absoluteDirectory;
}

module.exports = {
  ensureDirectoryWithin,
  inspectDirectoryWithin,
  inspectRegularFileWithin,
  isContainedPath,
  prepareContainedDirectory,
};
