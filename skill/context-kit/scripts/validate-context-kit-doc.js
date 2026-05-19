#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const VALID_TYPES = new Set(["spec", "plan", "decision", "agent-context"]);
const VALID_STATUSES = new Set([
  "draft",
  "proposed",
  "approved",
  "canonical",
  "superseded",
]);

const REQUIRED_TOP_LEVEL_FIELDS = [
  "schemaVersion",
  "docType",
  "id",
  "slug",
  "status",
  "title",
  "description",
  "owner",
  "createdAt",
  "updatedAt",
  "links",
  "page",
  "body",
];

const REQUIRED_BODY_FIELDS = {
  spec: [
    "goal",
    "problem",
    "scope",
    "architecture",
    "contracts",
    "surfaces",
    "validation",
    "agentInstructions",
    "reviewChecklist",
    "openQuestions",
  ],
  plan: [
    "goal",
    "currentState",
    "targetState",
    "scope",
    "slices",
    "executionOrder",
    "risks",
    "validation",
    "agentInstructions",
    "openQuestions",
  ],
  decision: [
    "context",
    "decision",
    "optionsConsidered",
    "consequences",
    "validation",
    "agentInstructions",
    "openQuestions",
  ],
  "agent-context": [
    "whenToUse",
    "requiredReading",
    "workingRules",
    "validation",
    "agentInstructions",
    "openQuestions",
  ],
};

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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function requireString(object, field, errors, prefix = "") {
  if (!isNonEmptyString(object?.[field])) {
    errors.push(`${prefix}${field} must be a non-empty string`);
  }
}

function requireStringArray(object, field, errors, prefix = "") {
  if (!isStringArray(object?.[field])) {
    errors.push(`${prefix}${field} must be an array of strings`);
  }
}

function validateTopLevel(doc, errors) {
  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!(field in doc)) errors.push(`missing field: ${field}`);
  }

  if (doc.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1");
  }
  if (!VALID_TYPES.has(doc.docType)) errors.push(`invalid docType: ${doc.docType}`);
  if (!VALID_STATUSES.has(doc.status)) errors.push(`invalid status: ${doc.status}`);

  for (const field of [
    "id",
    "slug",
    "title",
    "description",
    "owner",
    "createdAt",
    "updatedAt",
  ]) {
    if (field in doc && !isNonEmptyString(doc[field])) {
      errors.push(`field must be a non-empty string: ${field}`);
    }
  }

  if (isNonEmptyString(doc.id) && isNonEmptyString(doc.docType)) {
    const expectedPrefix = `${doc.docType}:`;
    if (!doc.id.startsWith(expectedPrefix)) {
      errors.push(`id must start with ${expectedPrefix}`);
    }
  }
}

function validateLinks(doc, errors) {
  if (!isPlainObject(doc.links)) {
    errors.push("links must be an object");
    return;
  }
  requireStringArray(doc.links, "sourceOfTruth", errors, "links.");

  if (doc.docType === "spec") {
    if ("relatedPlans" in doc.links && !isStringArray(doc.links.relatedPlans)) {
      errors.push("links.relatedPlans must be an array of strings");
    }
    if ("relatedDecisions" in doc.links && !isStringArray(doc.links.relatedDecisions)) {
      errors.push("links.relatedDecisions must be an array of strings");
    }
  }

  if (doc.docType === "plan" || doc.docType === "decision") {
    requireString(doc.links, "relatedSpec", errors, "links.");
  }

  if (doc.docType === "agent-context" && "requiredReading" in doc.links) {
    requireStringArray(doc.links, "requiredReading", errors, "links.");
  }
}

function validatePage(doc, errors) {
  if (!isPlainObject(doc.page)) {
    errors.push("page must be an object");
    return;
  }
  requireString(doc.page, "humanSummary", errors, "page.");
  requireString(doc.page, "agentSummary", errors, "page.");
}

function validateScope(scope, errors, prefix = "body.scope.") {
  if (!isPlainObject(scope)) {
    errors.push("body.scope must be an object");
    return;
  }
  requireStringArray(scope, "in", errors, prefix);
  requireStringArray(scope, "out", errors, prefix);
}

function validateValidationEntries(entries, errors) {
  if (!Array.isArray(entries)) {
    errors.push("body.validation must be an array");
    return;
  }
  entries.forEach((entry, index) => {
    requireString(entry, "command", errors, `body.validation[${index}].`);
    requireString(entry, "purpose", errors, `body.validation[${index}].`);
  });
}

function validateSurfaces(entries, errors) {
  if (!Array.isArray(entries)) {
    errors.push("body.surfaces must be an array");
    return;
  }
  entries.forEach((entry, index) => {
    requireString(entry, "path", errors, `body.surfaces[${index}].`);
    requireString(entry, "role", errors, `body.surfaces[${index}].`);
    requireString(entry, "owner", errors, `body.surfaces[${index}].`);
  });
}

function validateSpecBody(body, errors) {
  requireString(body, "goal", errors, "body.");
  requireString(body, "problem", errors, "body.");
  validateScope(body.scope, errors);

  if (!isPlainObject(body.architecture)) {
    errors.push("body.architecture must be an object");
  } else {
    requireString(body.architecture, "summary", errors, "body.architecture.");
    if ("flow" in body.architecture) {
      requireStringArray(body.architecture, "flow", errors, "body.architecture.");
    }
  }

  if (!Array.isArray(body.contracts)) {
    errors.push("body.contracts must be an array");
  } else {
    body.contracts.forEach((contract, index) => {
      requireString(contract, "name", errors, `body.contracts[${index}].`);
      requireStringArray(contract, "rules", errors, `body.contracts[${index}].`);
    });
  }

  validateSurfaces(body.surfaces, errors);
  validateValidationEntries(body.validation, errors);
  requireStringArray(body, "agentInstructions", errors, "body.");
  requireStringArray(body, "reviewChecklist", errors, "body.");
  requireStringArray(body, "openQuestions", errors, "body.");
}

function validatePlanBody(body, errors) {
  for (const field of ["goal", "currentState", "targetState"]) {
    requireString(body, field, errors, "body.");
  }
  validateScope(body.scope, errors);

  if (!Array.isArray(body.slices)) {
    errors.push("body.slices must be an array");
  } else {
    body.slices.forEach((slice, index) => {
      requireString(slice, "id", errors, `body.slices[${index}].`);
      requireString(slice, "title", errors, `body.slices[${index}].`);
      requireString(slice, "status", errors, `body.slices[${index}].`);
      requireStringArray(slice, "surfaces", errors, `body.slices[${index}].`);
      requireStringArray(slice, "steps", errors, `body.slices[${index}].`);
      requireStringArray(slice, "doneWhen", errors, `body.slices[${index}].`);
    });
  }

  requireStringArray(body, "executionOrder", errors, "body.");
  if (!Array.isArray(body.risks)) {
    errors.push("body.risks must be an array");
  } else {
    body.risks.forEach((risk, index) => {
      requireString(risk, "risk", errors, `body.risks[${index}].`);
      requireString(risk, "mitigation", errors, `body.risks[${index}].`);
    });
  }
  validateValidationEntries(body.validation, errors);
  requireStringArray(body, "agentInstructions", errors, "body.");
  requireStringArray(body, "openQuestions", errors, "body.");
}

function validateDecisionBody(body, errors) {
  requireString(body, "context", errors, "body.");
  requireString(body, "decision", errors, "body.");
  if (!Array.isArray(body.optionsConsidered)) {
    errors.push("body.optionsConsidered must be an array");
  } else {
    body.optionsConsidered.forEach((option, index) => {
      requireString(option, "option", errors, `body.optionsConsidered[${index}].`);
      requireString(option, "outcome", errors, `body.optionsConsidered[${index}].`);
    });
  }
  requireStringArray(body, "consequences", errors, "body.");
  validateValidationEntries(body.validation, errors);
  requireStringArray(body, "agentInstructions", errors, "body.");
  requireStringArray(body, "openQuestions", errors, "body.");
}

function validateAgentContextBody(body, errors) {
  requireStringArray(body, "whenToUse", errors, "body.");
  requireStringArray(body, "requiredReading", errors, "body.");
  requireStringArray(body, "workingRules", errors, "body.");
  validateValidationEntries(body.validation, errors);
  requireStringArray(body, "agentInstructions", errors, "body.");
  requireStringArray(body, "openQuestions", errors, "body.");
}

function validateBody(doc, errors) {
  if (!isPlainObject(doc.body)) {
    errors.push("body must be an object");
    return;
  }

  const required = REQUIRED_BODY_FIELDS[doc.docType] || [];
  for (const field of required) {
    if (!(field in doc.body)) errors.push(`missing ${doc.docType} body field: ${field}`);
  }

  if (doc.docType === "spec") validateSpecBody(doc.body, errors);
  if (doc.docType === "plan") validatePlanBody(doc.body, errors);
  if (doc.docType === "decision") validateDecisionBody(doc.body, errors);
  if (doc.docType === "agent-context") validateAgentContextBody(doc.body, errors);
}

function validateFile(filePath) {
  const errors = [];
  const doc = readJson(filePath);
  if (doc.__parseError) return [`invalid JSON: ${doc.__parseError}`];
  if (path.basename(filePath) === "site.json") return [];
  validateTopLevel(doc, errors);
  validateLinks(doc, errors);
  validatePage(doc, errors);
  validateBody(doc, errors);
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
