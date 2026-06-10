#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const VALIDATOR = path.join(__dirname, "validate-stenc-doc.js");

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
    description: "Single Stenc spec artifact.",
    owner: "stenc",
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
          detail: "One JSON file contains one Stenc spec document.",
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
          owner: "stenc",
        },
      ],
      testingStrategy: [
        {
          command: "node skill/stenc/scripts/validate-stenc-doc.test.js",
          expected: "The single-spec validator test passes.",
        },
      ],
      validation: [
        {
          command: "node skill/stenc/scripts/validate-stenc-doc.js docs/stenc/content",
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
    description: "Single Stenc plan artifact.",
    owner: "stenc",
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
      detail: "Stenc must preserve every meaningful section from a Superpowers design spec.",
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
      command: "node skill/stenc/scripts/validate-stenc-doc.test.js",
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

function addPhase1Blocks(spec) {
  spec.body.supportingSections = [
    {
      heading: "Rich Markdown Primitive Notes",
      content: "Blocks preserve rich supporting content without Markdown parsing.",
      items: ["Core fields remain authoritative."],
      blocks: [
        {
          type: "paragraph",
          spans: [
            { type: "text", text: "Run " },
            { type: "code", text: "./scripts/validate.sh" },
            { type: "text", text: " and inspect " },
            {
              type: "link",
              text: "the spec",
              target: "docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md",
            },
            { type: "text", text: "." },
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "Do not add Markdown source",
          body: "The source stays structured JSON.",
        },
        {
          type: "quote",
          text: "Markdown is an input to conversion, not a Stenc document source.",
          source: "skill/stenc/references/authoring-protocol.md",
        },
        {
          type: "table",
          columns: ["Markdown Need", "Stenc Primitive", "Phase"],
          rows: [
            ["Inline code", "paragraph.spans[].code", "1"],
            ["Admonition", "callout", "1"],
          ],
        },
      ],
      codeBlocks: [],
    },
  ];
  return spec;
}

function addPhase2Blocks(spec) {
  addPhase1Blocks(spec);
  spec.body.supportingSections[0].blocks.push(
    {
      type: "media",
      src: "assets/stenc-flow.svg",
      alt: "Stenc JSON to rendered page flow",
      caption: "Local assets stay under the fixed Stenc content asset root.",
    },
    {
      type: "taskList",
      items: [
        { label: "Validate JSON source", checked: true },
        { label: "Render fixed page", checked: false },
      ],
    },
  );
  return spec;
}

function addPhase3Blocks(spec) {
  addPhase2Blocks(spec);
  spec.body.supportingSections[0].blocks.push({
    type: "diagram",
    language: "mermaid",
    title: "Stenc render flow",
    source: "flowchart LR\n  JSON --> Validator\n  Validator --> Renderer\n  Renderer --> HTML",
  });
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
    assessment: "This plan covers one Stenc schema extension.",
    decomposition: "No subsystem split is required.",
  };
  plan.body.fileStructure = [
    {
      action: "Modify",
      path: "skill/stenc/scripts/validate-stenc-doc.js",
      responsibility: "Validate Superpowers-compatible fields.",
    },
    {
      action: "Test",
      path: "skill/stenc/scripts/validate-stenc-doc.test.js",
      responsibility: "Lock coverage for Superpowers spec and plan content.",
    },
  ];
  plan.body.slices = [
    {
      id: "task-1",
      title: "Plan step richness",
      status: "todo",
      surfaces: ["skill/stenc/scripts/validate-stenc-doc.js"],
      files: [
        {
          action: "Modify",
          path: "skill/stenc/scripts/validate-stenc-doc.js",
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
          command: "node skill/stenc/scripts/validate-stenc-doc.test.js",
          expected: "FAIL with validation errors for the new structured fields.",
        },
        {
          id: "step-3",
          title: "Commit",
          status: "todo",
          command: "git add skill/stenc/scripts && git commit -m \"feat: cover superpowers plan content\"",
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-"));
  writeJson(path.join(dir, "runner.spec.json"), validSingleSpec());

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc validation passed/);
});

test("accepts Superpowers design spec content without flattening sections", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-superpowers-spec-"));
  writeJson(path.join(dir, "superpowers.spec.json"), validSuperpowersSpec());

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc validation passed/);
});

test("accepts extended supporting sections with bounded nested structure", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-extended-supporting-"));
  const spec = validSuperpowersSpec();
  spec.body.supportingSections = [
    {
      heading: "Migration Runbook",
      content: "Preserve legacy runbook structure without user-defined components.",
      items: ["Keep source data in JSON", "Render through fixed Stenc primitives"],
      facts: [
        {
          label: "Owner",
          value: "Platform Team",
        },
      ],
      links: [
        {
          label: "Source runbook",
          target: "https://wiki.internal/runbook",
          purpose: "Original source document",
        },
      ],
      steps: [
        {
          id: "step-1",
          title: "Back up the database",
          status: "todo",
          instruction: "Run the backup before migration.",
          command: "pg_dump app > backup.sql",
          expected: "backup.sql exists and checksum verification passes.",
          codeBlocks: [
            {
              language: "bash",
              content: "sha256sum backup.sql",
            },
          ],
        },
      ],
      codeBlocks: [],
      subSections: [
        {
          heading: "Rollback",
          content: "Rollback is represented as a nested section, not a custom component.",
          items: ["Restore DNS", "Recheck queue drain"],
          facts: [
            {
              label: "Allowed Window",
              value: "30 minutes",
            },
          ],
          links: [],
          steps: [],
          codeBlocks: [],
          subSections: [],
        },
      ],
    },
  ];
  writeJson(path.join(dir, "extended.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc validation passed/);
});

test("accepts Phase 1 rich Markdown primitives in supporting section blocks", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-phase1-"));
  const spec = addPhase1Blocks(validSuperpowersSpec());
  writeJson(path.join(dir, "rich-phase1.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc validation passed/);
});

test("accepts Phase 2 media and task list supporting blocks", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-phase2-"));
  const spec = addPhase2Blocks(validSuperpowersSpec());
  writeJson(path.join(dir, "rich-phase2.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc validation passed/);
});

test("accepts Phase 3 diagram source supporting blocks", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-phase3-"));
  const spec = addPhase3Blocks(validSuperpowersSpec());
  writeJson(path.join(dir, "rich-phase3.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc validation passed/);
});

test("accepts Superpowers implementation plan content without flattening steps", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-superpowers-plan-"));
  writeJson(path.join(dir, "superpowers.plan.json"), validSuperpowersPlan());

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Stenc validation passed/);
});

test("accepts schemaVersion 1 nested spec and plan documents for compatibility", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-v1-"));
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
  assert.match(result.stdout, /Stenc validation passed/);
});

test("rejects Superpowers plan steps without actionable content or expected command output", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-weak-steps-"));
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

test("rejects malformed extended supporting sections", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-bad-supporting-"));
  const spec = validSuperpowersSpec();
  spec.body.supportingSections = [
    {
      heading: "Broken Section",
      content: "This section has malformed optional fields.",
      items: ["Invalid optional structures"],
      facts: [{ label: "", value: "Platform Team" }],
      links: [{ label: "Runbook", target: "", purpose: "Original source" }],
      steps: [
        {
          id: "step-empty",
          title: "Missing actionable content",
          status: "todo",
          codeBlocks: [],
        },
        {
          id: "step-command",
          title: "Missing expected output",
          status: "todo",
          command: "npm test",
        },
      ],
      codeBlocks: [],
      subSections: [
        {
          heading: "",
          content: "Nested heading is invalid.",
          items: ["Nested validation should include the recursive path."],
          codeBlocks: [],
        },
      ],
    },
  ];
  writeJson(path.join(dir, "bad-supporting.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /facts\[0\]\.label must be a non-empty string/);
  assert.match(result.stderr, /links\[0\]\.target must be a non-empty string/);
  assert.match(result.stderr, /steps\[0\] must include instruction, command, or codeBlocks/);
  assert.match(result.stderr, /steps\[1\]\.expected must be a non-empty string when command is present/);
  assert.match(result.stderr, /subSections\[0\]\.heading must be a non-empty string/);
});

test("rejects unknown rich block and inline span types", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-unknown-"));
  const spec = addPhase1Blocks(validSuperpowersSpec());
  spec.body.supportingSections[0].blocks.push({ type: "accordion", title: "Hidden" });
  spec.body.supportingSections[0].blocks[0].spans.push({ type: "underline", text: "not allowed" });
  writeJson(path.join(dir, "rich-unknown.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /blocks\[4\]\.type must be one of: paragraph, callout, quote, table/);
  assert.match(result.stderr, /blocks\[0\]\.spans\[5\]\.type must be one of: text, strong, emphasis, code, link, kbd, mark/);
});

test("rejects unsupported supporting section control fields", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-supporting-control-"));
  const spec = validSuperpowersSpec();
  spec.body.supportingSections = [
    {
      heading: "Layout Controlled Section",
      content: "Supporting sections must stay data-only.",
      items: ["No user-defined component system"],
      component: "RunbookCard",
      layout: "timeline",
      variant: "warning",
      kind: "runbook",
      codeBlocks: [],
    },
  ];
  writeJson(path.join(dir, "control.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /body\.supportingSections\[0\]\.component is not supported/);
  assert.match(result.stderr, /body\.supportingSections\[0\]\.layout is not supported/);
  assert.match(result.stderr, /body\.supportingSections\[0\]\.variant is not supported/);
  assert.match(result.stderr, /body\.supportingSections\[0\]\.kind is not supported/);
});

test("rejects unknown keys in rich blocks and spans", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-keys-"));
  const spec = addPhase1Blocks(validSuperpowersSpec());
  spec.body.supportingSections[0].blocks[0].layout = "hero";
  spec.body.supportingSections[0].blocks[0].spans[1].style = "loud";
  spec.body.supportingSections[0].blocks[3].align = "center";
  writeJson(path.join(dir, "rich-keys.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /blocks\[0\]\.layout is not supported; allowed fields: type, spans/);
  assert.match(result.stderr, /blocks\[0\]\.spans\[1\]\.style is not supported; allowed fields: type, text/);
  assert.match(result.stderr, /blocks\[3\]\.align is not supported; allowed fields: type, columns, rows/);
});

test("rejects unknown keys outside rich blocks and spans", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-unknown-keys-"));
  const spec = validSuperpowersSpec();
  spec.component = "DocCard";
  spec.page.layout = "hero";
  spec.links.preview = "docs/preview.html";
  spec.body.mdx = "import Bad from './Bad.mdx'";
  spec.body.supportingSections[0].facts = [{ label: "Owner", value: "stenc", component: "FactCard" }];
  spec.body.supportingSections[0].links = [
    { label: "Source", target: "docs/spec.md", purpose: "Reference", layout: "button" },
  ];
  spec.body.supportingSections[0].steps = [
    {
      id: "step-1",
      title: "Check",
      status: "todo",
      instruction: "Check source contract.",
      html: "<div>bad</div>",
    },
  ];
  spec.body.supportingSections[0].codeBlocks = [
    { language: "bash", content: "npm test", mdx: "<Command />" },
  ];
  writeJson(path.join(dir, "unknown-keys.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /component is not supported; allowed fields: schemaVersion, docType, id, slug, status, title, description, owner, createdAt, updatedAt, links, page, body/);
  assert.match(result.stderr, /page\.layout is not supported; allowed fields: humanSummary, agentSummary, styleTemplate/);
  assert.match(result.stderr, /links\.preview is not supported/);
  assert.match(result.stderr, /body\.mdx is not supported/);
  assert.match(result.stderr, /facts\[0\]\.component is not supported; allowed fields: label, value/);
  assert.match(result.stderr, /links\[0\]\.layout is not supported; allowed fields: label, target, purpose/);
  assert.match(result.stderr, /steps\[0\]\.html is not supported; allowed fields: id, title, status, instruction, command, expected, codeBlocks/);
  assert.match(result.stderr, /codeBlocks\[0\]\.mdx is not supported; allowed fields: language, content/);
});

test("rejects unsafe rich link targets and empty rich tables", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-safety-"));
  const invalidTargets = [
    "javascript:alert(1)",
    "data:text/html,<b>bad</b>",
    "file:///tmp/secret",
    "//example.com/protocol-relative",
    "/etc/passwd",
    " docs/spec.md",
    "docs/spec.md ",
    "docs/spec.md\u0000",
    "https:example.com",
    "docs/spec with space.md",
  ];
  invalidTargets.forEach((target, index) => {
    const spec = addPhase1Blocks(validSuperpowersSpec());
    spec.slug = `rich-link-safety-${index}`;
    spec.id = `spec:rich-link-safety-${index}`;
    spec.body.supportingSections[0].blocks[0].spans.push({
      type: "link",
      text: "bad",
      target,
    });
    writeJson(path.join(dir, `rich-link-safety-${index}.spec.json`), spec);
  });
  const emptyTableSpec = addPhase1Blocks(validSuperpowersSpec());
  emptyTableSpec.slug = "rich-empty-table";
  emptyTableSpec.id = "spec:rich-empty-table";
  emptyTableSpec.body.supportingSections[0].blocks[3].rows = [];
  writeJson(path.join(dir, "rich-empty-table.spec.json"), emptyTableSpec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /target must be a safe link target/);
  assert.match(result.stderr, /blocks\[3\]\.rows must be a non-empty array/);
});

test("rejects slugs that can escape generated document routes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-slug-"));
  const spec = validSuperpowersSpec();
  spec.slug = "../../../escaped-route";
  writeJson(path.join(dir, "unsafe-slug.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /slug must contain only lowercase letters, numbers, and hyphens/);
});

test("rejects rich table rows whose cell count does not match columns", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-table-width-"));
  const spec = addPhase1Blocks(validSuperpowersSpec());
  spec.body.supportingSections[0].blocks[3].rows = [["Inline code"]];
  writeJson(path.join(dir, "rich-table-width.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /blocks\[3\]\.rows\[0\] must have 3 cells/);
});

test("rejects unsafe media paths and malformed task list items", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-phase2-invalid-"));
  const mediaSpec = addPhase2Blocks(validSuperpowersSpec());
  mediaSpec.slug = "rich-media-invalid";
  mediaSpec.id = "spec:rich-media-invalid";
  mediaSpec.body.supportingSections[0].blocks[4].src = "../secret.svg";
  mediaSpec.body.supportingSections[0].blocks[5].items[0].checked = "yes";
  mediaSpec.body.supportingSections[0].blocks[5].items[0].owner = "not allowed";
  writeJson(path.join(dir, "rich-media-invalid.spec.json"), mediaSpec);

  const placementPlan = validSuperpowersPlan();
  placementPlan.slug = "rich-task-placement";
  placementPlan.id = "plan:rich-task-placement";
  placementPlan.body.slices[0].steps = [
    { type: "taskList", items: [{ label: "Not here", checked: false }] },
  ];
  writeJson(path.join(dir, "rich-task-placement.plan.json"), placementPlan);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /blocks\[4\]\.src must be a safe media source under assets\//);
  assert.match(result.stderr, /blocks\[5\]\.items\[0\]\.checked must be a boolean/);
  assert.match(result.stderr, /blocks\[5\]\.items\[0\]\.owner is not supported; allowed fields: label, checked/);
  assert.match(result.stderr, /body\.slices\[0\]\.steps\[0\] must be a plan step, not a taskList block/);
});

test("rejects malformed diagram source blocks", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-diagram-invalid-"));
  const spec = addPhase3Blocks(validSuperpowersSpec());
  spec.body.supportingSections[0].blocks[6].language = "plantuml";
  spec.body.supportingSections[0].blocks[6].source = "";
  spec.body.supportingSections[0].blocks[6].runtime = "mermaid";
  writeJson(path.join(dir, "rich-diagram-invalid.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /blocks\[6\]\.language must be one of: mermaid, dot, plain/);
  assert.match(result.stderr, /blocks\[6\]\.source must be a non-empty string/);
  assert.match(result.stderr, /blocks\[6\]\.runtime is not supported; allowed fields: type, language, title, source/);
});

test("rejects malformed rich link targets that are outside the allowlist", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-rich-link-allowlist-"));
  ["https:example.com", "docs/spec with space.md"].forEach((target, index) => {
    const spec = addPhase1Blocks(validSuperpowersSpec());
    spec.slug = `rich-link-allowlist-${index}`;
    spec.id = `spec:rich-link-allowlist-${index}`;
    spec.body.supportingSections[0].blocks[0].spans[3].target = target;
    writeJson(path.join(dir, `rich-link-allowlist-${index}.spec.json`), spec);
  });

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /target must be a safe link target/);
});

test("rejects Superpowers plans with a drifted worker header", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-worker-header-"));
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-flat-"));
  writeJson(path.join(dir, "legacy.spec.json"), {
    slug: "legacy",
    docType: "spec",
    status: "draft",
    title: "Legacy",
    description: "Legacy flat document.",
    owner: "stenc",
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-mdx-"));
  fs.writeFileSync(path.join(dir, "legacy.mdx"), "# Legacy\n");
  fs.writeFileSync(path.join(dir, "legacy.md"), "# Legacy\n");

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsupported document source file: legacy\.mdx/);
  assert.match(result.stderr, /unsupported document source file: legacy\.md/);
});

test("rejects documents without a fixed page style template", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-style-missing-"));
  const spec = validSingleSpec();
  delete spec.page.styleTemplate;
  writeJson(path.join(dir, "runner.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /page\.styleTemplate must be a non-empty string/);
});

test("rejects unknown fixed page style templates", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-style-invalid-"));
  const spec = validSingleSpec();
  spec.page.styleTemplate = "custom";
  writeJson(path.join(dir, "runner.spec.json"), spec);

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /page\.styleTemplate must be one of/);
});

test("rejects documents whose collection path does not match docType", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stenc-validator-collection-"));
  writeJson(
    path.join(dir, "content", "specs", "runner.plan.json"),
    validSinglePlan(),
  );

  const result = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /content\/specs requires docType spec/);
  assert.match(result.stderr, /spec files must end with \.spec\.json/);
});
