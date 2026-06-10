# Decisions

This file exists to surface important product, architecture, design, or planning
problems that need a user-visible decision before implementation can continue
safely. It is not a parking lot for unresolved notes.

Each entry should describe the concrete problem, record the accepted direction,
and point to the spec, plan, implementation, or validation surface that must be
updated because of that decision. When a decision is accepted, the related
design or plan documents should be corrected immediately so the repo's active
contract no longer depends on chat context or a pending status line.

Keep entries concise so the log remains usable over time.

## Format

```text
D-YYYY-MM-DD-NNN Title
Status: proposed | accepted | rejected | superseded
Question: user-facing or architecture choice
Decision: accepted answer when status is accepted
Recommendation: current recommended answer
Impact: what changes if accepted
Evidence: source files or validation gates
```

## Accepted Decisions

### D-2026-06-10-001 Table and callout nesting

Status: accepted

Question: Should Phase 1 keep table cells and callout bodies as plain escaped text, or allow nested inline spans immediately?

Decision: Keep Phase 1 table cells and callout bodies as plain escaped text. Do not add nested inline spans to table cells or callout bodies in this source-contract expansion.

Recommendation: Treat nested table/callout spans as a separate follow-up spec only if real documents need them after the baseline primitive rollout.

Impact: Phase 1 stays small and easier to verify. Richer nested content becomes a follow-up spec instead of hidden scope expansion.

Evidence: `docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md`, `skill/stenc/scripts/validate-stenc-doc.test.js`

### D-2026-06-10-002 Diagram rendering posture

Status: accepted

Question: Should Phase 3 stay as escaped diagram source panels, or should Stenc later render Mermaid or other diagram languages visually?

Decision: Phase 3 ships escaped diagram source panels only. Do not add Mermaid rendering, client-side script execution, CDN loading, or runtime diagram dependencies in this rollout.

Recommendation: Consider rendered diagrams only through a separate future decision that proves offline behavior, deterministic output, and dependency policy.

Impact: Phase 3 preserves diagram information without adding client runtime, CDN, or script execution risk.

Evidence: `docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md`

### D-2026-06-10-003 Media asset root

Status: accepted

Question: Should Stenc standardize media source assets under `docs/stenc/content/assets/`, or allow target repositories to configure another source-owned asset root later?

Decision: Phase 2 media source assets live under `docs/stenc/content/assets/`. `media.src` is written relative to the docs app `content/` directory and must start with `assets/`.

Recommendation: Revisit configurable source-owned asset roots only if real target repositories need a different root after the fixed-root implementation is proven.

Impact: Phase 2 validation, asset copying, generated URLs, and rendered-page checks stay deterministic and simple.

Evidence: `docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md`, `skill/stenc/scripts/check-rendered-pages.js`
