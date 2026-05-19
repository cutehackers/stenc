#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const VALIDATOR = path.join(__dirname, "validate-context-kit-doc.js");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function validSingleSpec() {
  return {
    schemaVersion: 1,
    docType: "spec",
    id: "spec:2026-05-19-runner-runtime",
    slug: "2026-05-19-runner-runtime",
    status: "draft",
    title: "Runner Runtime",
    description: "Single ContextKit spec artifact.",
    owner: "context-kit",
    createdAt: "2026-05-19",
    updatedAt: "2026-05-19",
    links: {
      sourceOfTruth: ["docs/SPEC.md"],
      relatedPlans: ["plan:2026-05-19-runner-runtime"],
      relatedDecisions: [],
    },
    page: {
      humanSummary: "Humans read the rendered web page.",
      agentSummary: "Agents read this JSON artifact directly.",
      styleTemplate: "task-first",
    },
    body: {
      goal: "Define one spec in one JSON document.",
      problem: "Wide flat documents make each generated artifact feel like a full site model.",
      scope: {
        in: ["Single-file spec authoring"],
        out: ["Markdown authoring"],
      },
      architecture: {
        summary: "JSON stores the contract and the web app renders fixed sections.",
        flow: ["Author JSON", "Validate JSON", "Render page"],
      },
      contracts: [
        {
          name: "Single document contract",
          rules: ["One file is one document.", "Indexes are renderer-derived."],
        },
      ],
      surfaces: [
        {
          path: "content/specs/*.spec.json",
          role: "Spec source artifact",
          owner: "context-kit",
        },
      ],
      validation: [
        {
          command: "node skill/context-kit/scripts/validate-context-kit-doc.js docs/context-kit/content",
          purpose: "Generated content validates.",
        },
      ],
      agentInstructions: ["Read the JSON artifact before editing related code."],
      reviewChecklist: ["The document has no embedded collection data."],
      openQuestions: [],
    },
  };
}

function validSinglePlan() {
  return {
    schemaVersion: 1,
    docType: "plan",
    id: "plan:2026-05-19-runner-runtime",
    slug: "2026-05-19-runner-runtime",
    status: "draft",
    title: "Runner Runtime Plan",
    description: "Single ContextKit plan artifact.",
    owner: "context-kit",
    createdAt: "2026-05-19",
    updatedAt: "2026-05-19",
    links: {
      sourceOfTruth: ["docs/PLAN.md"],
      relatedSpec: "spec:2026-05-19-runner-runtime",
    },
    page: {
      humanSummary: "Humans read the rendered plan page.",
      agentSummary: "Agents follow the execution slices in this JSON artifact.",
      styleTemplate: "operator-console",
    },
    body: {
      goal: "Implement the runner runtime spec.",
      currentState: "The runtime contract is not implemented.",
      targetState: "The runtime contract is implemented and verified.",
      scope: {
        in: ["Runtime implementation"],
        out: ["Unrelated docs"],
      },
      slices: [
        {
          id: "S1",
          title: "Runtime contract",
          status: "pending",
          surfaces: ["src/runtime.js"],
          steps: ["Implement the contract"],
          doneWhen: ["Validation passes"],
        },
      ],
      executionOrder: ["S1"],
      risks: [
        {
          risk: "Contract drift",
          mitigation: "Run the validator before build.",
        },
      ],
      validation: [
        {
          command: "npm test",
          purpose: "Runtime tests pass.",
        },
      ],
      agentInstructions: ["Follow slices in order."],
      openQuestions: [],
    },
  };
}

test("accepts one self-contained spec document artifact", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-"));
  writeJson(path.join(dir, "runner.spec.json"), validSingleSpec());

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ContextKit validation passed/);
});

test("rejects legacy flat spec documents", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-flat-"));
  writeJson(path.join(dir, "legacy.spec.json"), {
    slug: "legacy",
    docType: "spec",
    status: "draft",
    title: "Legacy",
    description: "Legacy flat document.",
    owner: "context-kit",
    lastUpdated: "2026-05-19",
    humanSummary: "Old shape.",
    agentSummary: "Old shape.",
    sourceOfTruth: ["docs/SPEC.md"],
    goal: "Old shape.",
    architecture: "Old shape.",
    scope: { in: ["old"], out: ["old"] },
    nonGoals: [],
    surfaces: [],
    evidence: [],
    validationCommands: [],
    agentInstructions: [],
    reviewChecklist: [],
    openQuestions: [],
    problem: "Old shape.",
    vocabulary: [],
    contract: [],
    interfaces: { public: [], internal: [] },
    invariants: [],
  });

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing field: schemaVersion/);
  assert.match(result.stderr, /missing field: body/);
});

test("rejects markdown and mdx files as document sources", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-mdx-"));
  fs.writeFileSync(path.join(dir, "legacy.mdx"), "# Legacy\n");
  fs.writeFileSync(path.join(dir, "legacy.md"), "# Legacy\n");

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsupported document source file: legacy\.mdx/);
  assert.match(result.stderr, /unsupported document source file: legacy\.md/);
});

test("rejects documents without a fixed page style template", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-style-missing-"));
  const spec = validSingleSpec();
  delete spec.page.styleTemplate;
  writeJson(path.join(dir, "runner.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /page\.styleTemplate must be a non-empty string/);
});

test("rejects unknown fixed page style templates", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-style-invalid-"));
  const spec = validSingleSpec();
  spec.page.styleTemplate = "custom";
  writeJson(path.join(dir, "runner.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /page\.styleTemplate must be one of/);
});

test("rejects documents whose collection path does not match docType", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-collection-"));
  writeJson(
    path.join(dir, "content", "specs", "runner.plan.json"),
    validSinglePlan(),
  );

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /content\/specs requires docType spec/);
  assert.match(result.stderr, /spec files must end with \.spec\.json/);
});
