# Decisions

This file tracks product or architecture decisions that need stable visibility.
Keep entries concise so the log remains usable over time.

## Format

```text
D-YYYY-MM-DD-NNN Title
Status: proposed | accepted | rejected | superseded
Decision needed: user-facing or architecture choice
Recommendation: current recommended answer
Impact: what changes if accepted
Evidence: source files or validation gates
```

## Pending Decisions

### D-2026-06-10-001 Table and callout nesting

Status: proposed

Decision needed: Should Phase 1 keep table cells and callout bodies as plain escaped text, or allow nested inline spans immediately?

Recommendation: Keep Phase 1 plain text. Add table cell spans or callout spans only after the baseline block renderer and escaping tests are stable.

Impact: Phase 1 stays small and easier to verify. Richer nested content becomes a follow-up spec instead of hidden scope expansion.

Evidence: `docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md`

### D-2026-06-10-002 Diagram rendering posture

Status: proposed

Decision needed: Should Phase 3 stay as escaped diagram source panels, or should Stenc later render Mermaid or other diagram languages visually?

Recommendation: Ship source panels first. Consider rendered diagrams only through a separate decision that proves offline behavior, deterministic output, and dependency policy.

Impact: Phase 3 preserves diagram information without adding client runtime, CDN, or script execution risk.

Evidence: `docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md`

### D-2026-06-10-003 Media asset root

Status: proposed

Decision needed: Should Stenc standardize media source assets under `docs/stenc/content/assets/`, or allow target repositories to configure another source-owned asset root later?

Recommendation: Use `docs/stenc/content/assets/` for Phase 2. Revisit configurability only if real target repos need a different source-owned root.

Impact: Phase 2 validation and rendered-page checks stay deterministic and simple.

Evidence: `docs/superpowers/specs/2026-06-10-stenc-rich-markdown-primitives-design.md`, `skill/stenc/scripts/check-rendered-pages.js`
