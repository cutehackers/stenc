#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const VALID_TYPES = new Set(["spec", "plan", "decision", "agent-context"]);
const VALID_STYLE_TEMPLATES = new Set([
  "task-first",
  "operator-console",
  "evidence-led",
]);
const VALID_STATUSES = new Set([
  "draft",
  "proposed",
  "approved",
  "canonical",
  "superseded",
]);
const VALID_SCHEMA_VERSIONS = new Set([1, 2]);
const SUPPORTING_SECTION_FIELDS = new Set([
  "heading",
  "content",
  "items",
  "facts",
  "links",
  "steps",
  "blocks",
  "codeBlocks",
  "subSections",
]);
const RICH_BLOCK_TYPES = new Set(["paragraph", "callout", "quote", "table"]);
const INLINE_SPAN_TYPES = new Set(["text", "strong", "emphasis", "code", "link", "kbd", "mark"]);
const CALLOUT_TONES = new Set(["neutral", "info", "success", "warning", "danger"]);

const RICH_BLOCK_FIELDS = {
  paragraph: new Set(["type", "spans"]),
  callout: new Set(["type", "tone", "title", "body"]),
  quote: new Set(["type", "text", "source"]),
  table: new Set(["type", "columns", "rows"]),
};

const INLINE_SPAN_FIELDS = {
  text: new Set(["type", "text"]),
  strong: new Set(["type", "text"]),
  emphasis: new Set(["type", "text"]),
  code: new Set(["type", "text"]),
  link: new Set(["type", "text", "target"]),
  kbd: new Set(["type", "text"]),
  mark: new Set(["type", "text"]),
};

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
const TOP_LEVEL_FIELDS = new Set(REQUIRED_TOP_LEVEL_FIELDS);
const PAGE_FIELDS = new Set(["humanSummary", "agentSummary", "styleTemplate"]);
const LINK_FIELDS = {
  spec: new Set(["sourceOfTruth", "relatedPlans", "relatedDecisions"]),
  plan: new Set(["sourceOfTruth", "relatedSpec"]),
  decision: new Set(["sourceOfTruth", "relatedSpec"]),
  "agent-context": new Set(["sourceOfTruth", "requiredReading"]),
};

const REQUIRED_BODY_FIELDS = {
  1: {
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
  },
  2: {
  spec: [
    "goal",
    "problem",
    "scope",
    "architecture",
    "requirements",
    "approaches",
    "components",
    "dataFlow",
    "errorHandling",
    "contracts",
    "surfaces",
    "testingStrategy",
    "validation",
    "agentInstructions",
    "reviewChecklist",
    "selfReviewChecks",
    "implementationHandoff",
    "supportingSections",
    "openQuestions",
  ],
  plan: [
    "goal",
    "architecture",
    "techStack",
    "workerInstructions",
    "scopeCheck",
    "currentState",
    "targetState",
    "scope",
    "fileStructure",
    "slices",
    "executionOrder",
    "risks",
    "validation",
    "agentInstructions",
    "selfReviewChecks",
    "executionHandoff",
    "supportingSections",
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
  },
};
const BODY_FIELDS = Object.fromEntries(
  Object.entries(REQUIRED_BODY_FIELDS[2]).map(([docType, fields]) => [docType, new Set(fields)]),
);

const CODE_BLOCK_FIELDS = new Set(["language", "content"]);
const FACT_FIELDS = new Set(["label", "value"]);
const SUPPORTING_LINK_FIELDS = new Set(["label", "target", "purpose"]);
const SUPPORTING_STEP_FIELDS = new Set([
  "id",
  "title",
  "status",
  "instruction",
  "command",
  "expected",
  "codeBlocks",
]);
const SCOPE_FIELDS = new Set(["in", "out"]);
const VALIDATION_ENTRY_FIELDS = new Set(["command", "purpose"]);
const TESTING_STRATEGY_FIELDS = new Set(["command", "expected"]);
const SURFACE_FIELDS = new Set(["path", "role", "owner"]);
const REQUIREMENT_FIELDS = new Set(["id", "title", "detail", "acceptanceCriteria"]);
const APPROACH_FIELDS = new Set(["name", "tradeoffs", "recommendation"]);
const COMPONENT_FIELDS = new Set(["name", "responsibility", "interfaces", "dependencies"]);
const ERROR_HANDLING_FIELDS = new Set(["case", "behavior"]);
const CONTRACT_FIELDS = new Set(["name", "rules"]);
const NAMED_PURPOSE_FIELDS = new Set(["name", "purpose"]);
const IMPLEMENTATION_HANDOFF_FIELDS = new Set(["planLocation", "requiredSkill", "notes"]);
const WORKER_INSTRUCTIONS_FIELDS = new Set(["requiredSubSkills", "trackingSyntax", "note"]);
const SCOPE_CHECK_FIELDS = new Set(["assessment", "decomposition"]);
const FILE_STRUCTURE_FIELDS = new Set(["action", "path", "responsibility"]);
const SLICE_FIELDS = new Set(["id", "title", "status", "surfaces", "files", "steps", "doneWhen"]);
const SLICE_FILE_FIELDS = new Set(["action", "path", "role", "lines"]);
const PLAN_STEP_FIELDS = SUPPORTING_STEP_FIELDS;
const RISK_FIELDS = new Set(["risk", "mitigation"]);
const EXECUTION_HANDOFF_FIELDS = new Set(["defaultPath", "options"]);
const EXECUTION_HANDOFF_OPTION_FIELDS = new Set(["label", "description", "requiredSkill"]);
const DECISION_OPTION_FIELDS = new Set(["option", "outcome"]);

const COLLECTION_CONTRACTS = {
  specs: { docType: "spec", suffix: ".spec.json" },
  plans: { docType: "plan", suffix: ".plan.json" },
  decisions: { docType: "decision", suffix: ".decision.json" },
  "agent-context": { docType: "agent-context", suffix: ".agent-context.json" },
};

function listFiles(inputPath) {
  const stat = fs.statSync(inputPath);
  if (stat.isFile()) return [inputPath];
  return fs.readdirSync(inputPath, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(inputPath, entry.name);
    if (entry.isDirectory()) return listFiles(child);
    return [child];
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

function isSafeSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
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

function validateCodeBlocks(entries, errors, prefix) {
  if (entries === undefined) return;
  if (!Array.isArray(entries)) {
    errors.push(`${prefix}codeBlocks must be an array`);
    return;
  }
  entries.forEach((block, index) => {
    validateAllowedFields(block, CODE_BLOCK_FIELDS, errors, `${prefix}codeBlocks[${index}].`);
    requireString(block, "language", errors, `${prefix}codeBlocks[${index}].`);
    requireString(block, "content", errors, `${prefix}codeBlocks[${index}].`);
  });
}

function validateFacts(entries, errors, prefix) {
  if (entries === undefined) return;
  if (!Array.isArray(entries)) {
    errors.push(`${prefix}facts must be an array`);
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, FACT_FIELDS, errors, `${prefix}facts[${index}].`);
    requireString(entry, "label", errors, `${prefix}facts[${index}].`);
    requireString(entry, "value", errors, `${prefix}facts[${index}].`);
  });
}

function validateSupportingLinks(entries, errors, prefix) {
  if (entries === undefined) return;
  if (!Array.isArray(entries)) {
    errors.push(`${prefix}links must be an array`);
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, SUPPORTING_LINK_FIELDS, errors, `${prefix}links[${index}].`);
    requireString(entry, "label", errors, `${prefix}links[${index}].`);
    requireString(entry, "target", errors, `${prefix}links[${index}].`);
    requireString(entry, "purpose", errors, `${prefix}links[${index}].`);
  });
}

function validateSupportingStep(step, errors, prefix) {
  if (!isPlainObject(step)) {
    errors.push(`${prefix.slice(0, -1)} must be an object`);
    return;
  }
  validateAllowedFields(step, SUPPORTING_STEP_FIELDS, errors, prefix);
  requireString(step, "id", errors, prefix);
  requireString(step, "title", errors, prefix);
  requireString(step, "status", errors, prefix);
  const hasInstruction = isNonEmptyString(step.instruction);
  const hasCommand = isNonEmptyString(step.command);
  const hasExpected = isNonEmptyString(step.expected);
  if ("instruction" in step) requireString(step, "instruction", errors, prefix);
  if ("command" in step) requireString(step, "command", errors, prefix);
  if ("expected" in step) requireString(step, "expected", errors, prefix);
  validateCodeBlocks(step.codeBlocks, errors, prefix);
  const hasCodeBlocks = Array.isArray(step.codeBlocks) && step.codeBlocks.length > 0;
  if (hasCommand && !hasExpected) {
    errors.push(`${prefix}expected must be a non-empty string when command is present`);
  }
  if (hasExpected && !hasCommand) {
    errors.push(`${prefix}command must be a non-empty string when expected is present`);
  }
  if (!hasInstruction && !hasCommand && !hasCodeBlocks) {
    errors.push(`${prefix.slice(0, -1)} must include instruction, command, or codeBlocks`);
  }
}

function validateAllowedFields(entry, allowedFields, errors, prefix) {
  if (!isPlainObject(entry)) return;
  for (const field of Object.keys(entry)) {
    if (!allowedFields.has(field)) {
      errors.push(
        `${prefix}${field} is not supported; allowed fields: ${Array.from(allowedFields).join(", ")}`,
      );
    }
  }
}

function isSafeLinkTarget(target) {
  if (!isNonEmptyString(target)) return false;
  if (/[\u0000-\u001f\u007f]/u.test(target)) return false;
  const trimmed = target.trim();
  if (trimmed !== target) return false;
  if (trimmed.startsWith("//")) return false;
  if (trimmed.startsWith("/")) return false;
  if (/^(javascript|data|file):/iu.test(trimmed)) return false;
  if (/^(https?:\/\/|mailto:|#|\.\/|\.\.\/)/iu.test(trimmed)) return true;
  if (trimmed.includes(":")) return false;
  return /^[A-Za-z0-9._~!$&'()*+,;=:@/-]+(?:#[A-Za-z0-9._~!$&'()*+,;=:@/-]+)?$/u.test(trimmed);
}

function validateInlineSpans(spans, errors, prefix) {
  if (!Array.isArray(spans) || spans.length === 0) {
    errors.push(`${prefix}spans must be a non-empty array`);
    return;
  }

  spans.forEach((span, index) => {
    const spanPrefix = `${prefix}spans[${index}].`;
    if (!isPlainObject(span)) {
      errors.push(`${spanPrefix.slice(0, -1)} must be an object`);
      return;
    }
    if (!INLINE_SPAN_TYPES.has(span.type)) {
      errors.push(`${spanPrefix}type must be one of: ${Array.from(INLINE_SPAN_TYPES).join(", ")}`);
      return;
    }

    validateAllowedFields(span, INLINE_SPAN_FIELDS[span.type], errors, spanPrefix);
    requireString(span, "text", errors, spanPrefix);
    if (span.type === "link") {
      requireString(span, "target", errors, spanPrefix);
      if ("target" in span && !isSafeLinkTarget(span.target)) {
        errors.push(`${spanPrefix}target must be a safe link target`);
      }
    }
  });
}

function validateRichTable(block, errors, prefix) {
  requireStringArray(block, "columns", errors, prefix);
  if (!Array.isArray(block.rows) || block.rows.length === 0) {
    errors.push(`${prefix}rows must be a non-empty array`);
    return;
  }

  block.rows.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) {
      errors.push(`${prefix}rows[${rowIndex}] must be an array`);
      return;
    }
    if (Array.isArray(block.columns) && row.length !== block.columns.length) {
      errors.push(`${prefix}rows[${rowIndex}] must have ${block.columns.length} cells`);
    }
    row.forEach((cell, cellIndex) => {
      if (!isNonEmptyString(cell)) {
        errors.push(`${prefix}rows[${rowIndex}][${cellIndex}] must be a non-empty string`);
      }
    });
  });
}

function validateRichBlock(block, errors, prefix) {
  if (!isPlainObject(block)) {
    errors.push(`${prefix.slice(0, -1)} must be an object`);
    return;
  }
  if (!RICH_BLOCK_TYPES.has(block.type)) {
    errors.push(`${prefix}type must be one of: ${Array.from(RICH_BLOCK_TYPES).join(", ")}`);
    return;
  }

  validateAllowedFields(block, RICH_BLOCK_FIELDS[block.type], errors, prefix);
  if (block.type === "paragraph") {
    validateInlineSpans(block.spans, errors, prefix);
  }
  if (block.type === "callout") {
    requireString(block, "tone", errors, prefix);
    if (isNonEmptyString(block.tone) && !CALLOUT_TONES.has(block.tone)) {
      errors.push(`${prefix}tone must be one of: ${Array.from(CALLOUT_TONES).join(", ")}`);
    }
    requireString(block, "title", errors, prefix);
    requireString(block, "body", errors, prefix);
  }
  if (block.type === "quote") {
    requireString(block, "text", errors, prefix);
    if ("source" in block) requireString(block, "source", errors, prefix);
  }
  if (block.type === "table") {
    validateRichTable(block, errors, prefix);
  }
}

function validateSupportingBlocks(blocks, errors, prefix) {
  if (blocks === undefined) return;
  if (!Array.isArray(blocks)) {
    errors.push(`${prefix}blocks must be an array`);
    return;
  }
  blocks.forEach((block, index) => {
    validateRichBlock(block, errors, `${prefix}blocks[${index}].`);
  });
}

function validateSupportingSteps(entries, errors, prefix) {
  if (entries === undefined) return;
  if (!Array.isArray(entries)) {
    errors.push(`${prefix}steps must be an array`);
    return;
  }
  entries.forEach((step, index) => {
    validateSupportingStep(step, errors, `${prefix}steps[${index}].`);
  });
}

function validateSupportingSectionFields(entry, errors, prefix) {
  if (!isPlainObject(entry)) return;
  for (const field of Object.keys(entry)) {
    if (!SUPPORTING_SECTION_FIELDS.has(field)) {
      errors.push(
        `${prefix}${field} is not supported; allowed fields: ${Array.from(SUPPORTING_SECTION_FIELDS).join(", ")}`,
      );
    }
  }
}

function validateNamedPurposeEntries(entries, errors, field) {
  if (!Array.isArray(entries)) {
    errors.push(`body.${field} must be an array`);
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, NAMED_PURPOSE_FIELDS, errors, `body.${field}[${index}].`);
    requireString(entry, "name", errors, `body.${field}[${index}].`);
    requireString(entry, "purpose", errors, `body.${field}[${index}].`);
  });
}

function validateTopLevel(doc, errors) {
  validateAllowedFields(doc, TOP_LEVEL_FIELDS, errors, "");
  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!(field in doc)) errors.push(`missing field: ${field}`);
  }

  if (!VALID_SCHEMA_VERSIONS.has(doc.schemaVersion)) {
    errors.push("schemaVersion must be 1 or 2");
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
  if ("slug" in doc && !isSafeSlug(doc.slug)) {
    errors.push("slug must contain only lowercase letters, numbers, and hyphens");
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
  if (LINK_FIELDS[doc.docType]) {
    validateAllowedFields(doc.links, LINK_FIELDS[doc.docType], errors, "links.");
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
  validateAllowedFields(doc.page, PAGE_FIELDS, errors, "page.");
  requireString(doc.page, "humanSummary", errors, "page.");
  requireString(doc.page, "agentSummary", errors, "page.");
  requireString(doc.page, "styleTemplate", errors, "page.");
  if (
    isNonEmptyString(doc.page.styleTemplate) &&
    !VALID_STYLE_TEMPLATES.has(doc.page.styleTemplate)
  ) {
    errors.push(
      "page.styleTemplate must be one of: task-first, operator-console, evidence-led",
    );
  }
}

function validateScope(scope, errors, prefix = "body.scope.") {
  if (!isPlainObject(scope)) {
    errors.push("body.scope must be an object");
    return;
  }
  validateAllowedFields(scope, SCOPE_FIELDS, errors, prefix);
  requireStringArray(scope, "in", errors, prefix);
  requireStringArray(scope, "out", errors, prefix);
}

function validateValidationEntries(entries, errors) {
  if (!Array.isArray(entries)) {
    errors.push("body.validation must be an array");
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, VALIDATION_ENTRY_FIELDS, errors, `body.validation[${index}].`);
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
    validateAllowedFields(entry, SURFACE_FIELDS, errors, `body.surfaces[${index}].`);
    requireString(entry, "path", errors, `body.surfaces[${index}].`);
    requireString(entry, "role", errors, `body.surfaces[${index}].`);
    requireString(entry, "owner", errors, `body.surfaces[${index}].`);
  });
}

function validateRequirements(entries, errors) {
  if (!Array.isArray(entries)) {
    errors.push("body.requirements must be an array");
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, REQUIREMENT_FIELDS, errors, `body.requirements[${index}].`);
    requireString(entry, "id", errors, `body.requirements[${index}].`);
    requireString(entry, "title", errors, `body.requirements[${index}].`);
    requireString(entry, "detail", errors, `body.requirements[${index}].`);
    requireStringArray(entry, "acceptanceCriteria", errors, `body.requirements[${index}].`);
  });
}

function validateApproaches(entries, errors) {
  if (!Array.isArray(entries)) {
    errors.push("body.approaches must be an array");
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, APPROACH_FIELDS, errors, `body.approaches[${index}].`);
    requireString(entry, "name", errors, `body.approaches[${index}].`);
    requireStringArray(entry, "tradeoffs", errors, `body.approaches[${index}].`);
    requireString(entry, "recommendation", errors, `body.approaches[${index}].`);
  });
}

function validateComponents(entries, errors) {
  if (!Array.isArray(entries)) {
    errors.push("body.components must be an array");
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, COMPONENT_FIELDS, errors, `body.components[${index}].`);
    requireString(entry, "name", errors, `body.components[${index}].`);
    requireString(entry, "responsibility", errors, `body.components[${index}].`);
    requireStringArray(entry, "interfaces", errors, `body.components[${index}].`);
    requireStringArray(entry, "dependencies", errors, `body.components[${index}].`);
  });
}

function validateErrorHandling(entries, errors) {
  if (!Array.isArray(entries)) {
    errors.push("body.errorHandling must be an array");
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, ERROR_HANDLING_FIELDS, errors, `body.errorHandling[${index}].`);
    requireString(entry, "case", errors, `body.errorHandling[${index}].`);
    requireString(entry, "behavior", errors, `body.errorHandling[${index}].`);
  });
}

function validateTestingStrategy(entries, errors) {
  if (!Array.isArray(entries)) {
    errors.push("body.testingStrategy must be an array");
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, TESTING_STRATEGY_FIELDS, errors, `body.testingStrategy[${index}].`);
    requireString(entry, "command", errors, `body.testingStrategy[${index}].`);
    requireString(entry, "expected", errors, `body.testingStrategy[${index}].`);
  });
}

function validateImplementationHandoff(handoff, errors, prefix = "body.implementationHandoff.") {
  if (!isPlainObject(handoff)) {
    errors.push(`${prefix.slice(0, -1)} must be an object`);
    return;
  }
  validateAllowedFields(handoff, IMPLEMENTATION_HANDOFF_FIELDS, errors, prefix);
  requireString(handoff, "planLocation", errors, prefix);
  requireString(handoff, "requiredSkill", errors, prefix);
  requireStringArray(handoff, "notes", errors, prefix);
}

function validateSupportingSections(entries, errors, prefix = "body.supportingSections.") {
  if (!Array.isArray(entries)) {
    errors.push(`${prefix.slice(0, -1)} must be an array`);
    return;
  }
  entries.forEach((entry, index) => {
    const entryPrefix = `${prefix.slice(0, -1)}[${index}].`;
    validateSupportingSectionFields(entry, errors, entryPrefix);
    requireString(entry, "heading", errors, entryPrefix);
    requireString(entry, "content", errors, entryPrefix);
    requireStringArray(entry, "items", errors, entryPrefix);
    validateFacts(entry.facts, errors, entryPrefix);
    validateSupportingLinks(entry.links, errors, entryPrefix);
    validateSupportingSteps(entry.steps, errors, entryPrefix);
    validateSupportingBlocks(entry.blocks, errors, entryPrefix);
    validateCodeBlocks(entry.codeBlocks, errors, entryPrefix);
    if (entry?.subSections !== undefined) {
      validateSupportingSections(entry.subSections, errors, `${entryPrefix}subSections.`);
    }
  });
}

function validateWorkerInstructions(instructions, errors) {
  if (!isPlainObject(instructions)) {
    errors.push("body.workerInstructions must be an object");
    return;
  }
  validateAllowedFields(instructions, WORKER_INSTRUCTIONS_FIELDS, errors, "body.workerInstructions.");
  requireStringArray(instructions, "requiredSubSkills", errors, "body.workerInstructions.");
  requireString(instructions, "trackingSyntax", errors, "body.workerInstructions.");
  requireString(instructions, "note", errors, "body.workerInstructions.");
  if (
    Array.isArray(instructions.requiredSubSkills) &&
    !instructions.requiredSubSkills.includes("superpowers:subagent-driven-development")
  ) {
    errors.push("body.workerInstructions.requiredSubSkills must include superpowers:subagent-driven-development");
  }
  if (
    Array.isArray(instructions.requiredSubSkills) &&
    !instructions.requiredSubSkills.includes("superpowers:executing-plans")
  ) {
    errors.push("body.workerInstructions.requiredSubSkills must include superpowers:executing-plans");
  }
  if (instructions.trackingSyntax !== "- [ ]") {
    errors.push("body.workerInstructions.trackingSyntax must be - [ ]");
  }
}

function validateScopeCheck(scopeCheck, errors) {
  if (!isPlainObject(scopeCheck)) {
    errors.push("body.scopeCheck must be an object");
    return;
  }
  validateAllowedFields(scopeCheck, SCOPE_CHECK_FIELDS, errors, "body.scopeCheck.");
  requireString(scopeCheck, "assessment", errors, "body.scopeCheck.");
  requireString(scopeCheck, "decomposition", errors, "body.scopeCheck.");
}

function validateFileStructure(entries, errors, fieldPath = "body.fileStructure") {
  if (!Array.isArray(entries)) {
    errors.push(`${fieldPath} must be an array`);
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, FILE_STRUCTURE_FIELDS, errors, `${fieldPath}[${index}].`);
    requireString(entry, "action", errors, `${fieldPath}[${index}].`);
    requireString(entry, "path", errors, `${fieldPath}[${index}].`);
    requireString(entry, "responsibility", errors, `${fieldPath}[${index}].`);
  });
}

function validateSliceFiles(entries, errors, fieldPath) {
  if (!Array.isArray(entries)) {
    errors.push(`${fieldPath} must be an array`);
    return;
  }
  entries.forEach((entry, index) => {
    validateAllowedFields(entry, SLICE_FILE_FIELDS, errors, `${fieldPath}[${index}].`);
    requireString(entry, "action", errors, `${fieldPath}[${index}].`);
    requireString(entry, "path", errors, `${fieldPath}[${index}].`);
    requireString(entry, "role", errors, `${fieldPath}[${index}].`);
    if ("lines" in entry) requireString(entry, "lines", errors, `${fieldPath}[${index}].`);
  });
}

function validatePlanStep(step, errors, prefix) {
  if (!isPlainObject(step)) {
    errors.push(`${prefix.slice(0, -1)} must be an object`);
    return;
  }
  validateAllowedFields(step, PLAN_STEP_FIELDS, errors, prefix);
  requireString(step, "id", errors, prefix);
  requireString(step, "title", errors, prefix);
  requireString(step, "status", errors, prefix);
  const hasInstruction = isNonEmptyString(step.instruction);
  const hasCommand = isNonEmptyString(step.command);
  const hasExpected = isNonEmptyString(step.expected);
  if ("instruction" in step) requireString(step, "instruction", errors, prefix);
  if ("command" in step) requireString(step, "command", errors, prefix);
  if ("expected" in step) requireString(step, "expected", errors, prefix);
  validateCodeBlocks(step.codeBlocks, errors, prefix);
  const hasCodeBlocks = Array.isArray(step.codeBlocks) && step.codeBlocks.length > 0;
  if (hasCommand && !hasExpected) {
    errors.push(`${prefix}expected must be a non-empty string when command is present`);
  }
  if (hasExpected && !hasCommand) {
    errors.push(`${prefix}command must be a non-empty string when expected is present`);
  }
  if (!hasInstruction && !hasCommand && !hasCodeBlocks) {
    errors.push(`${prefix.slice(0, -1)} must include instruction, command, or codeBlocks`);
  }
}

function validateExecutionHandoff(handoff, errors) {
  if (!isPlainObject(handoff)) {
    errors.push("body.executionHandoff must be an object");
    return;
  }
  validateAllowedFields(handoff, EXECUTION_HANDOFF_FIELDS, errors, "body.executionHandoff.");
  requireString(handoff, "defaultPath", errors, "body.executionHandoff.");
  if (!Array.isArray(handoff.options)) {
    errors.push("body.executionHandoff.options must be an array");
    return;
  }
  handoff.options.forEach((option, index) => {
    validateAllowedFields(option, EXECUTION_HANDOFF_OPTION_FIELDS, errors, `body.executionHandoff.options[${index}].`);
    requireString(option, "label", errors, `body.executionHandoff.options[${index}].`);
    requireString(option, "description", errors, `body.executionHandoff.options[${index}].`);
    requireString(option, "requiredSkill", errors, `body.executionHandoff.options[${index}].`);
  });
  const subagentOption = handoff.options.find((option) => option.label === "Subagent-Driven");
  if (!subagentOption) {
    errors.push("body.executionHandoff.options must include Subagent-Driven");
  } else if (subagentOption.requiredSkill !== "superpowers:subagent-driven-development") {
    errors.push("body.executionHandoff.options Subagent-Driven must require superpowers:subagent-driven-development");
  }
}

function validateSpecBody(body, errors, schemaVersion) {
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

  if (schemaVersion >= 2) {
    validateRequirements(body.requirements, errors);
    validateApproaches(body.approaches, errors);
    validateComponents(body.components, errors);
    requireStringArray(body, "dataFlow", errors, "body.");
    validateErrorHandling(body.errorHandling, errors);
  }
  if (!Array.isArray(body.contracts)) {
    errors.push("body.contracts must be an array");
  } else {
    body.contracts.forEach((contract, index) => {
      validateAllowedFields(contract, CONTRACT_FIELDS, errors, `body.contracts[${index}].`);
      requireString(contract, "name", errors, `body.contracts[${index}].`);
      requireStringArray(contract, "rules", errors, `body.contracts[${index}].`);
    });
  }

  validateSurfaces(body.surfaces, errors);
  if (schemaVersion >= 2) validateTestingStrategy(body.testingStrategy, errors);
  validateValidationEntries(body.validation, errors);
  requireStringArray(body, "agentInstructions", errors, "body.");
  requireStringArray(body, "reviewChecklist", errors, "body.");
  if (schemaVersion >= 2) {
    validateNamedPurposeEntries(body.selfReviewChecks, errors, "selfReviewChecks");
    validateImplementationHandoff(body.implementationHandoff, errors);
    validateSupportingSections(body.supportingSections, errors);
  }
  requireStringArray(body, "openQuestions", errors, "body.");
}

function validatePlanBody(body, errors, schemaVersion) {
  for (const field of ["goal", "architecture", "currentState", "targetState"]) {
    if (schemaVersion >= 2 || field !== "architecture") {
      requireString(body, field, errors, "body.");
    }
  }
  if (schemaVersion >= 2) {
    requireStringArray(body, "techStack", errors, "body.");
    validateWorkerInstructions(body.workerInstructions, errors);
    validateScopeCheck(body.scopeCheck, errors);
  }
  validateScope(body.scope, errors);
  if (schemaVersion >= 2) validateFileStructure(body.fileStructure, errors);

  if (!Array.isArray(body.slices)) {
    errors.push("body.slices must be an array");
  } else {
    body.slices.forEach((slice, index) => {
      validateAllowedFields(slice, SLICE_FIELDS, errors, `body.slices[${index}].`);
      requireString(slice, "id", errors, `body.slices[${index}].`);
      requireString(slice, "title", errors, `body.slices[${index}].`);
      requireString(slice, "status", errors, `body.slices[${index}].`);
      requireStringArray(slice, "surfaces", errors, `body.slices[${index}].`);
      if (schemaVersion >= 2) validateSliceFiles(slice.files, errors, `body.slices[${index}].files`);
      if (!Array.isArray(slice.steps)) {
        errors.push(`body.slices[${index}].steps must be an array`);
      } else if (schemaVersion >= 2) {
        slice.steps.forEach((step, stepIndex) => {
          validatePlanStep(step, errors, `body.slices[${index}].steps[${stepIndex}].`);
        });
      } else if (!slice.steps.every(isNonEmptyString)) {
        errors.push(`body.slices[${index}].steps must be an array of strings`);
      }
      requireStringArray(slice, "doneWhen", errors, `body.slices[${index}].`);
    });
  }

  requireStringArray(body, "executionOrder", errors, "body.");
  if (!Array.isArray(body.risks)) {
    errors.push("body.risks must be an array");
  } else {
    body.risks.forEach((risk, index) => {
      validateAllowedFields(risk, RISK_FIELDS, errors, `body.risks[${index}].`);
      requireString(risk, "risk", errors, `body.risks[${index}].`);
      requireString(risk, "mitigation", errors, `body.risks[${index}].`);
    });
  }
  validateValidationEntries(body.validation, errors);
  requireStringArray(body, "agentInstructions", errors, "body.");
  if (schemaVersion >= 2) {
    validateNamedPurposeEntries(body.selfReviewChecks, errors, "selfReviewChecks");
    validateExecutionHandoff(body.executionHandoff, errors);
    validateSupportingSections(body.supportingSections, errors);
  }
  requireStringArray(body, "openQuestions", errors, "body.");
}

function validateDecisionBody(body, errors) {
  requireString(body, "context", errors, "body.");
  requireString(body, "decision", errors, "body.");
  if (!Array.isArray(body.optionsConsidered)) {
    errors.push("body.optionsConsidered must be an array");
  } else {
    body.optionsConsidered.forEach((option, index) => {
      validateAllowedFields(option, DECISION_OPTION_FIELDS, errors, `body.optionsConsidered[${index}].`);
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
  if (BODY_FIELDS[doc.docType]) {
    validateAllowedFields(doc.body, BODY_FIELDS[doc.docType], errors, "body.");
  }

  const required = REQUIRED_BODY_FIELDS[doc.schemaVersion]?.[doc.docType] || [];
  for (const field of required) {
    if (!(field in doc.body)) errors.push(`missing ${doc.docType} body field: ${field}`);
  }

  if (doc.docType === "spec") validateSpecBody(doc.body, errors, doc.schemaVersion);
  if (doc.docType === "plan") validatePlanBody(doc.body, errors, doc.schemaVersion);
  if (doc.docType === "decision") validateDecisionBody(doc.body, errors);
  if (doc.docType === "agent-context") validateAgentContextBody(doc.body, errors);
}

function collectionContractFor(filePath) {
  const segments = filePath.split(path.sep);
  for (const [collection, contract] of Object.entries(COLLECTION_CONTRACTS)) {
    if (segments.includes(collection)) return { collection, ...contract };
  }
  return null;
}

function validateCollectionContract(filePath, doc, errors) {
  const contract = collectionContractFor(filePath);
  if (!contract || path.basename(filePath) === "site.json") return;

  if (doc.docType !== contract.docType) {
    errors.push(`content/${contract.collection} requires docType ${contract.docType}`);
  }
  if (!filePath.endsWith(contract.suffix)) {
    errors.push(`${contract.docType} files must end with ${contract.suffix}`);
  }
}

function validateFile(filePath) {
  const errors = [];
  if (!/\.json$/.test(filePath)) {
    if (/\.(md|mdx)$/.test(filePath)) {
      return [`unsupported document source file: ${path.basename(filePath)}`];
    }
    return [];
  }

  const doc = readJson(filePath);
  if (doc.__parseError) return [`invalid JSON: ${doc.__parseError}`];
  if (path.basename(filePath) === "site.json") return [];
  validateTopLevel(doc, errors);
  validateLinks(doc, errors);
  validatePage(doc, errors);
  validateBody(doc, errors);
  validateCollectionContract(filePath, doc, errors);
  return errors;
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("Usage: validate-stenc-doc.js <json-file-or-directory> [...]");
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
  console.error(`\nStenc validation failed for ${failureCount} file(s).`);
  process.exit(1);
}

console.log("Stenc validation passed.");
