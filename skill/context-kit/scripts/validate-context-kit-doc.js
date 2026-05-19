#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const REQUIRED_FIELDS = [
  "slug",
  "docType",
  "status",
  "title",
  "description",
  "owner",
  "lastUpdated",
  "humanSummary",
  "agentSummary",
  "sourceOfTruth",
  "goal",
  "architecture",
  "scope",
  "nonGoals",
  "surfaces",
  "evidence",
  "validationCommands",
  "agentInstructions",
  "reviewChecklist",
  "openQuestions",
];

const TYPE_FIELDS = {
  spec: ["problem", "vocabulary", "contract", "interfaces", "invariants"],
  plan: [
    "relatedSpec",
    "currentState",
    "targetState",
    "implementationSlices",
    "executionOrder",
    "risks",
  ],
  decision: ["relatedSpec", "context", "decision", "optionsConsidered", "consequences"],
  "agent-context": ["whenToUse", "requiredReading", "workingRules"],
};

const VALID_TYPES = new Set(Object.keys(TYPE_FIELDS));
const VALID_STATUSES = new Set(["draft", "proposed", "approved", "canonical", "superseded"]);

function listFiles(inputPath) {
  const stat = fs.statSync(inputPath);
  if (stat.isFile()) return /\.json$/.test(inputPath) ? [inputPath] : [];
  return fs.readdirSync(inputPath, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(inputPath, entry.name);
    if (entry.isDirectory()) return listFiles(child);
    return /\.json$/.test(entry.name) ? [child] : [];
  });
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return { __parseError: error.message };
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function validateCommonShape(doc, errors) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in doc)) errors.push(`missing field: ${field}`);
  }

  if (!VALID_TYPES.has(doc.docType)) errors.push(`invalid docType: ${doc.docType}`);
  if (!VALID_STATUSES.has(doc.status)) errors.push(`invalid status: ${doc.status}`);
  for (const field of [
    "slug",
    "title",
    "description",
    "owner",
    "lastUpdated",
    "humanSummary",
    "agentSummary",
    "goal",
    "architecture",
  ]) {
    if (field in doc && !isNonEmptyString(doc[field])) {
      errors.push(`field must be a non-empty string: ${field}`);
    }
  }

  for (const field of [
    "sourceOfTruth",
    "nonGoals",
    "evidence",
    "validationCommands",
    "agentInstructions",
    "reviewChecklist",
    "openQuestions",
  ]) {
    if (field in doc && !isStringArray(doc[field])) {
      errors.push(`field must be an array of strings: ${field}`);
    }
  }

  if (doc.scope) {
    if (!isStringArray(doc.scope.in)) errors.push("scope.in must be an array of strings");
    if (!isStringArray(doc.scope.out)) errors.push("scope.out must be an array of strings");
  }

  if (doc.surfaces) {
    if (!Array.isArray(doc.surfaces)) {
      errors.push("surfaces must be an array");
    } else {
      for (const [index, surface] of doc.surfaces.entries()) {
        for (const field of ["surface", "role", "owner"]) {
          if (!isNonEmptyString(surface[field])) {
            errors.push(`surfaces[${index}].${field} must be a non-empty string`);
          }
        }
      }
    }
  }
}

function validateTypeShape(doc, errors) {
  if (!VALID_TYPES.has(doc.docType)) return;
  for (const field of TYPE_FIELDS[doc.docType]) {
    if (!(field in doc)) errors.push(`missing ${doc.docType} field: ${field}`);
  }

  if (doc.docType === "spec") {
    if (!isStringArray(doc.contract)) errors.push("contract must be an array of strings");
    if (!isStringArray(doc.invariants)) errors.push("invariants must be an array of strings");
    if (!Array.isArray(doc.vocabulary)) errors.push("vocabulary must be an array");
  }

  if (doc.docType === "plan") {
    if (!Array.isArray(doc.implementationSlices)) {
      errors.push("implementationSlices must be an array");
    }
    if (!isStringArray(doc.executionOrder)) errors.push("executionOrder must be an array of strings");
    if (!Array.isArray(doc.risks)) errors.push("risks must be an array");
  }

  if (doc.docType === "decision") {
    if (!Array.isArray(doc.optionsConsidered)) errors.push("optionsConsidered must be an array");
    if (!isStringArray(doc.consequences)) errors.push("consequences must be an array of strings");
  }

  if (doc.docType === "agent-context") {
    if (!isStringArray(doc.whenToUse)) errors.push("whenToUse must be an array of strings");
    if (!isStringArray(doc.requiredReading)) errors.push("requiredReading must be an array of strings");
    if (!isStringArray(doc.workingRules)) errors.push("workingRules must be an array of strings");
  }
}

function validateFile(filePath) {
  const errors = [];
  const doc = readJson(filePath);
  if (doc.__parseError) return [`invalid JSON: ${doc.__parseError}`];
  if (path.basename(filePath) === "site.json") return [];
  validateCommonShape(doc, errors);
  validateTypeShape(doc, errors);
  return errors;
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("Usage: validate-context-kit-doc.js <json-file-or-directory> [...]");
  process.exit(2);
}

let failureCount = 0;
for (const target of targets) {
  for (const filePath of listFiles(path.resolve(target))) {
    const errors = validateFile(filePath);
    if (errors.length > 0) {
      failureCount += 1;
      console.error(`\n${filePath}`);
      for (const error of errors) console.error(`  - ${error}`);
    }
  }
}

if (failureCount > 0) {
  console.error(`\nContextKit validation failed for ${failureCount} file(s).`);
  process.exit(1);
}

console.log("ContextKit validation passed.");
