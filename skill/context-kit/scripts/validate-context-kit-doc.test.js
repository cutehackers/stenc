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
    schemaVersion: 2,
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
      requirements: [
        {
          id: "REQ-1",
          title: "Single source artifact",
          detail: "One JSON file contains one ContextKit spec document.",
          acceptanceCriteria: ["The validator accepts the document as a single artifact."],
        },
      ],
      approaches: [
        {
          name: "Structured JSON",
          tradeoffs: ["More explicit than prose", "Directly readable by agents"],
          recommendation: "Use structured JSON as the source of truth.",
        },
      ],
      components: [
        {
          name: "Validator",
          responsibility: "Validate one JSON document artifact.",
          interfaces: ["validateFile(filePath)"],
          dependencies: ["Node.js"],
        },
      ],
      dataFlow: ["Author JSON", "Validate JSON", "Render page"],
      errorHandling: [
        {
          case: "Invalid source document",
          behavior: "Fail validation with a concrete field error.",
        },
      ],
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
      testingStrategy: [
        {
          command: "node skill/context-kit/scripts/validate-context-kit-doc.test.js",
          expected: "The single-spec validator test passes.",
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
      selfReviewChecks: [
        {
          name: "Completeness",
          purpose: "Confirm the document has no missing source-truth fields.",
        },
      ],
      implementationHandoff: {
        planLocation: "docs/superpowers/plans/YYYY-MM-DD-feature.md",
        requiredSkill: "superpowers:writing-plans",
        notes: ["Create an implementation plan only after the spec is reviewed."],
      },
      supportingSections: [
        {
          heading: "Notes",
          content: "Use supporting sections for extra source material that does not fit primary fields.",
          items: ["No collection data inside the document."],
          codeBlocks: [],
        },
      ],
      openQuestions: [],
    },
  };
}

function validSinglePlan() {
  return {
    schemaVersion: 2,
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
      architecture: "Use small execution slices with explicit files, steps, commands, and expected output.",
      techStack: ["Node.js"],
      workerInstructions: {
        requiredSubSkills: [
          "superpowers:subagent-driven-development",
          "superpowers:executing-plans",
        ],
        trackingSyntax: "- [ ]",
        note: "Implement this plan task-by-task using checkbox steps for tracking.",
      },
      scopeCheck: {
        assessment: "This plan covers one runtime subsystem.",
        decomposition: "No subsystem split is required.",
      },
      currentState: "The runtime contract is not implemented.",
      targetState: "The runtime contract is implemented and verified.",
      scope: {
        in: ["Runtime implementation"],
        out: ["Unrelated docs"],
      },
      fileStructure: [
        {
          action: "Modify",
          path: "src/runtime.js",
          responsibility: "Runtime implementation.",
        },
        {
          action: "Test",
          path: "tests/runtime.test.js",
          responsibility: "Runtime behavior tests.",
        },
      ],
      slices: [
        {
          id: "S1",
          title: "Runtime contract",
          status: "pending",
          surfaces: ["src/runtime.js"],
          files: [
            {
              action: "Modify",
              path: "src/runtime.js",
              role: "Runtime implementation.",
            },
          ],
          steps: [
            {
              id: "S1.1",
              title: "Implement the contract",
              status: "todo",
              instruction: "Add the minimal runtime behavior required by the spec.",
            },
          ],
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
      selfReviewChecks: [
        {
          name: "Spec coverage",
          purpose: "Every spec requirement maps to at least one slice.",
        },
      ],
      executionHandoff: {
        defaultPath: "docs/superpowers/plans/YYYY-MM-DD-feature.md",
        options: [
          {
            label: "Subagent-Driven",
            description: "Dispatch a fresh subagent per task.",
            requiredSkill: "superpowers:subagent-driven-development",
          },
          {
            label: "Inline Execution",
            description: "Execute the plan in this session.",
            requiredSkill: "superpowers:executing-plans",
          },
        ],
      },
      supportingSections: [
        {
          heading: "No Placeholders",
          content: "Every step must contain the actual content an engineer needs.",
          items: ["No TBD values", "No vague error handling instructions"],
          codeBlocks: [],
        },
      ],
      openQuestions: [],
    },
  };
}

function validSuperpowersSpec() {
  const spec = validSingleSpec();
  spec.id = "spec:2026-05-19-superpowers-coverage";
  spec.slug = "2026-05-19-superpowers-coverage";
  spec.title = "Superpowers Coverage Spec";
  spec.body.requirements = [
    {
      id: "REQ-1",
      title: "Preserve source format",
      detail: "ContextKit must preserve every meaningful section from a Superpowers design spec.",
      acceptanceCriteria: ["No architecture, component, data-flow, error-handling, or testing section is lost."],
    },
  ];
  spec.body.approaches = [
    {
      name: "Structured extension",
      tradeoffs: ["More fields to author", "No content is hidden in rendered-only UI"],
      recommendation: "Use this approach for agent-readable conversion.",
    },
  ];
  spec.body.components = [
    {
      name: "Validator",
      responsibility: "Reject malformed source JSON before rendering.",
      interfaces: ["validateFile(filePath)"],
      dependencies: ["Node.js fs and path modules"],
    },
  ];
  spec.body.dataFlow = ["Author source JSON", "Validate source JSON", "Render static page"];
  spec.body.errorHandling = [
    {
      case: "Invalid JSON",
      behavior: "Report the parser error and fail validation.",
    },
  ];
  spec.body.testingStrategy = [
    {
      command: "node skill/context-kit/scripts/validate-context-kit-doc.test.js",
      expected: "Spec and plan coverage tests pass.",
    },
  ];
  spec.body.selfReviewChecks = [
    {
      name: "Placeholder scan",
      purpose: "Ensure no TBD or TODO remains unless listed in openQuestions.",
    },
    {
      name: "Scope check",
      purpose: "Ensure the spec is focused enough for one implementation plan.",
    },
  ];
  spec.body.implementationHandoff = {
    planLocation: "docs/superpowers/plans/YYYY-MM-DD-feature.md",
    requiredSkill: "superpowers:writing-plans",
    notes: ["Do not start planning until the spec review gate is complete."],
  };
  spec.body.supportingSections = [
    {
      heading: "Reviewer Calibration",
      content: "Only flag issues that would cause implementation planning problems.",
      items: ["Completeness", "Consistency", "Clarity", "Scope", "YAGNI"],
      codeBlocks: [
        {
          language: "text",
          content: "Status: Approved | Issues Found",
        },
      ],
    },
  ];
  return spec;
}

function validSuperpowersPlan() {
  const plan = validSinglePlan();
  plan.id = "plan:2026-05-19-superpowers-coverage";
  plan.slug = "2026-05-19-superpowers-coverage";
  plan.title = "Superpowers Coverage Plan";
  plan.body.architecture = "Keep source JSON canonical and render a deterministic static page.";
  plan.body.techStack = ["Node.js", "Dependency-free validator", "Static HTML renderer"];
  plan.body.workerInstructions = {
    requiredSubSkills: [
      "superpowers:subagent-driven-development",
      "superpowers:executing-plans",
    ],
    trackingSyntax: "- [ ]",
    note: "Steps use checkbox syntax for task-by-task execution tracking.",
  };
  plan.body.scopeCheck = {
    assessment: "This plan covers one ContextKit schema extension.",
    decomposition: "No subsystem split is required.",
  };
  plan.body.fileStructure = [
    {
      action: "Modify",
      path: "skill/context-kit/scripts/validate-context-kit-doc.js",
      responsibility: "Validate Superpowers-compatible fields.",
    },
    {
      action: "Test",
      path: "skill/context-kit/scripts/validate-context-kit-doc.test.js",
      responsibility: "Lock coverage for Superpowers spec and plan content.",
    },
  ];
  plan.body.slices = [
    {
      id: "task-1",
      title: "Plan step richness",
      status: "todo",
      surfaces: ["skill/context-kit/scripts/validate-context-kit-doc.js"],
      files: [
        {
          action: "Modify",
          path: "skill/context-kit/scripts/validate-context-kit-doc.js",
          lines: "240-320",
          role: "Plan validator",
        },
      ],
      steps: [
        {
          id: "step-1",
          title: "Write the failing test",
          status: "todo",
          instruction: "Add a test that exercises code blocks, commands, expected output, and commit steps.",
          codeBlocks: [
            {
              language: "javascript",
              content: "test('accepts Superpowers plan step content', () => {});",
            },
          ],
        },
        {
          id: "step-2",
          title: "Run test to verify it fails",
          status: "todo",
          command: "node skill/context-kit/scripts/validate-context-kit-doc.test.js",
          expected: "FAIL with validation errors for the new structured fields.",
        },
        {
          id: "step-3",
          title: "Commit",
          status: "todo",
          command: "git add skill/context-kit/scripts && git commit -m \"feat: cover superpowers plan content\"",
          expected: "Commit records the validator and test changes.",
        },
      ],
      doneWhen: ["Structured plan step content validates and renders."],
    },
  ];
  plan.body.selfReviewChecks = [
    {
      name: "Spec coverage",
      purpose: "Every spec requirement points to a task.",
    },
    {
      name: "Type consistency",
      purpose: "Function names used in later tasks match earlier definitions.",
    },
  ];
  plan.body.executionHandoff = {
    defaultPath: "docs/superpowers/plans/YYYY-MM-DD-feature.md",
    options: [
      {
        label: "Subagent-Driven",
        description: "Dispatch a fresh subagent per task, then review between tasks.",
        requiredSkill: "superpowers:subagent-driven-development",
      },
      {
        label: "Inline Execution",
        description: "Execute tasks in this session using checkpointed plan execution.",
        requiredSkill: "superpowers:executing-plans",
      },
    ],
  };
  plan.body.supportingSections = [
    {
      heading: "No Placeholders",
      content: "Every task step must include concrete content, code, commands, or expected output.",
      items: ["No TBD values", "No similar-to references", "No command without expected output"],
      codeBlocks: [],
    },
  ];
  return plan;
}

test("accepts one self-contained spec document artifact", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-"));
  writeJson(path.join(dir, "runner.spec.json"), validSingleSpec());

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ContextKit validation passed/);
});

test("accepts Superpowers design spec content without flattening sections", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-superpowers-spec-"));
  writeJson(path.join(dir, "superpowers.spec.json"), validSuperpowersSpec());

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ContextKit validation passed/);
});

test("accepts Superpowers implementation plan content without flattening steps", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-superpowers-plan-"));
  writeJson(path.join(dir, "superpowers.plan.json"), validSuperpowersPlan());

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ContextKit validation passed/);
});

test("accepts schemaVersion 1 nested spec and plan documents for compatibility", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-v1-"));
  const spec = validSingleSpec();
  spec.schemaVersion = 1;
  for (const field of [
    "requirements",
    "approaches",
    "components",
    "dataFlow",
    "errorHandling",
    "testingStrategy",
    "selfReviewChecks",
    "implementationHandoff",
    "supportingSections",
  ]) {
    delete spec.body[field];
  }

  const plan = validSinglePlan();
  plan.schemaVersion = 1;
  for (const field of [
    "architecture",
    "techStack",
    "workerInstructions",
    "scopeCheck",
    "fileStructure",
    "selfReviewChecks",
    "executionHandoff",
    "supportingSections",
  ]) {
    delete plan.body[field];
  }
  plan.body.slices = plan.body.slices.map((slice) => ({
    id: slice.id,
    title: slice.title,
    status: slice.status,
    surfaces: slice.surfaces,
    steps: ["Implement the contract"],
    doneWhen: slice.doneWhen,
  }));

  writeJson(path.join(dir, "runner.spec.json"), spec);
  writeJson(path.join(dir, "runner.plan.json"), plan);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ContextKit validation passed/);
});

test("rejects Superpowers plan steps without actionable content or expected command output", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-weak-steps-"));
  const plan = validSuperpowersPlan();
  plan.body.slices[0].steps = [
    {
      id: "step-empty",
      title: "Empty code block step",
      status: "todo",
      codeBlocks: [],
    },
    {
      id: "step-command",
      title: "Command without expected output",
      status: "todo",
      command: "npm test",
    },
  ];
  writeJson(path.join(dir, "weak.plan.json"), plan);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must include instruction, command, or codeBlocks/);
  assert.match(result.stderr, /expected must be a non-empty string when command is present/);
});

test("rejects Superpowers plans with a drifted worker header", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "context-kit-validator-worker-header-"));
  const plan = validSuperpowersPlan();
  plan.body.workerInstructions.requiredSubSkills = ["superpowers:executing-plans"];
  plan.body.workerInstructions.trackingSyntax = "*";
  plan.body.executionHandoff.options = [
    {
      label: "Inline Execution",
      description: "Execute tasks in this session.",
      requiredSkill: "superpowers:executing-plans",
    },
  ];
  writeJson(path.join(dir, "worker.plan.json"), plan);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requiredSubSkills must include superpowers:subagent-driven-development/);
  assert.match(result.stderr, /trackingSyntax must be - \[ \]/);
  assert.match(result.stderr, /executionHandoff.options must include Subagent-Driven/);
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
