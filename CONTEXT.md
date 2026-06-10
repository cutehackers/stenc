# Stenc Context

This file defines product language for Stenc. It is a glossary, not an
implementation spec.

## Glossary

Stenc document
: One structured JSON source artifact for a spec, plan, decision, or
agent-context page.

Source of truth
: The structured JSON document. Generated HTML is a reproducible view, not a
place where document meaning is authored.

Fixed renderer
: The Stenc-owned renderer that maps approved JSON fields to consistent web
pages. Authors do not choose per-document components, layouts, or styles.

Core field
: A native Stenc body field that owns canonical meaning for a document type,
such as requirements, validation, surfaces, plan slices, or agent instructions.

Supporting section
: A bounded area for legacy outline material or supporting context that has no
dedicated core field.

Block
: A proposed ordered primitive entry inside `supportingSections[].blocks`.
Blocks are validated JSON data and rendered by the fixed renderer.

Primitive
: A validator-known JSON shape that the fixed renderer can display without
Markdown parsing or source-authored visual control.

Rich Markdown primitive
: A primitive that preserves a useful Markdown-era expression, such as inline
code, callouts, tables, images, checklists, or diagram source, while keeping the
document source as typed JSON.

Rendered page
: A generated human-readable web page derived from a Stenc document.

## Product Values

- Keep document meaning agent-readable through explicit JSON fields.
- Keep pages human-friendly through consistent fixed rendering.
- Keep generation deterministic and reproducible from source.
- Keep authoring dependency-light and installable across target repositories.
- Grow expression by adding bounded primitives, not by adding Markdown, MDX,
  raw HTML, or per-document component systems.
