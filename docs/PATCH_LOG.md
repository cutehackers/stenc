# Patch Log

This file records concise corrections and documentation updates that future
contributors may need to understand. Keep entries short and evidence-oriented.

## Format

```text
YYYY-MM-DD | Area | Change | Reason | Evidence
```

## Entries

2026-06-10 | Core values | Added `CONTEXT.md` product glossary and values, and linked the same expansion posture from the Stenc skill entrypoint | grill-with-docs validation needed stable product language before implementation planning | `CONTEXT.md`, `skill/stenc/SKILL.md`

2026-06-10 | Rich primitives spec | Expanded the Phase 1/2/3 spec with design process, value alignment, scale-up posture, phase gates, handoff contract, and grill review checks | the previous spec described primitives but left decision flow and implementation-plan transfer too implicit | `docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md`

2026-06-10 | Decisions | Added pending decision records for richer table/callout content, rendered diagrams, and asset-root policy | implementation planning needs user-visible decision points before widening the source contract | `docs/DECISIONS.md`

2026-06-10 | Subagent review | Tightened link target safety, media asset mechanics, table row visibility, block allowlists, taskList placement, and glossary coverage after parallel review | reviewers found ambiguity that would weaken implementation-plan transfer and fixed-renderer safety | `docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md`, `CONTEXT.md`

2026-06-10 | Rich primitives implementation plan | Added a phase-gated implementation plan for validator, renderer, references, templates, examples, media checks, and release validation | the rich Markdown primitives design needed concrete release-ready execution steps | `docs/superpowers/plans/2026-06-10-stenc-rich-markdown-primitives-implementation.md`

2026-06-10 | Implementation plan review | Revised the plan after subagent review to enforce Phase 1/2/3 boundaries, accepted-only media gate, route-relative media URLs, recursive asset checks, generated asset cleanup, checker path policy, and richer safety tests | review found phase leakage and test gaps that would weaken release readiness | `docs/superpowers/plans/2026-06-10-stenc-rich-markdown-primitives-implementation.md`

2026-06-10 | Rich primitives Phase 1 | Implemented validator and renderer support for paragraph spans, callouts, quotes, and tables in `supportingSections[].blocks`; updated templates, references, examples, and generated example pages | Phase 1 can safely widen Markdown-era expression without Markdown, MDX, raw HTML, or per-document components | `./scripts/validate.sh`

2026-06-10 | Phase 2 gate | Stopped before media and task-list implementation because `D-2026-06-10-003 Media asset root` remains `proposed` | the implementation plan requires an accepted media asset-root decision before Phase 2 source-contract, asset-copy, or example work | `docs/DECISIONS.md`, `docs/superpowers/plans/2026-06-10-stenc-rich-markdown-primitives-implementation.md`

2026-06-10 | Review-driven hardening | Tightened slug validation, table row width checks, rich link allowlists, renderer-side unsafe-link failures, generated-route containment, and unknown-key rejection outside rich blocks | subagent review found Phase 1 could otherwise pass unsafe routes, malformed links, uneven tables, and source-contract backdoors | `skill/stenc/scripts/validate-stenc-doc.test.js`, `skill/stenc/scripts/setup-project.test.js`
