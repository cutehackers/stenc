"use strict";

function buildUnifiedStyles() {
  return `:root {
  color-scheme: light;
  --color-page: #f2f4f6;
  --color-surface: #ffffff;
  --color-surface-soft: #f8fafc;
  --color-surface-overlay: rgba(255, 255, 255, 0.94);
  --color-text: #191f28;
  --color-on-accent: #ffffff;
  --color-muted: #4e5968;
  --color-subtle: #6b7684;
  --color-code-border: #2f3a4a;
  --color-code-surface: #18212f;
  --color-code-text: #f8fafc;
  --color-highlight: #fff0a8;
  --color-line: #d8dee6;
  --color-line-strong: #b8c2cf;
  --color-control-border: #7b8794;
  --color-info: #1769c2;
  --color-info-tint: #eef6ff;
  --color-info-line: #bfd9f5;
  --color-success: #087f5b;
  --color-success-tint: #edf9f4;
  --color-success-line: #a8dccb;
  --color-warning: #9a5b00;
  --color-warning-tint: #fff7e8;
  --color-warning-line: #e9c783;
  --color-danger: #c5293d;
  --color-danger-tint: #fff1f3;
  --color-relation: #6c58e6;
  --color-relation-tint: #f4f1ff;
  --color-relation-line: #d3caf8;
  --color-diagram-consumer: var(--color-info);
  --color-diagram-surface: #2878d0;
  --color-diagram-surface-tint: #edf5ff;
  --color-diagram-session: var(--color-relation);
  --color-diagram-engine: var(--color-warning);
  --color-diagram-boundary: var(--color-danger);
  --color-diagram-value: var(--color-success);
  --color-diagram-neutral: var(--color-muted);
  --font-body: 17px;
  --line-body: 1.6;
  --font-lead: 18px;
  --font-h1: clamp(34px, 5vw, 48px);
  --font-h2: 24px;
  --font-h3: 17px;
  --font-table: 15px;
  --font-nav: 15px;
  --font-metadata: 13px;
  --font-code: 14px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --radius-component: 14px;
  --radius-control: 8px;
  --radius-pill: 999px;
  --shadow-component: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-raised: 0 8px 24px rgba(25, 31, 40, 0.08);
  --content-measure: 76ch;
  --content-width: 1120px;
  --sidebar-width: 260px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--color-page);
  color: var(--color-text);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: var(--font-body);
  line-height: var(--line-body);
  overflow-x: clip;
}

.skip-link {
  border: 2px solid var(--color-info);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 750;
  left: var(--space-4);
  padding: var(--space-2) var(--space-3);
  position: fixed;
  top: var(--space-3);
  transform: translateY(calc(-100% - var(--space-6)));
  z-index: 100;
}

.skip-link:focus-visible {
  transform: translateY(0);
}

img,
svg {
  max-width: 100%;
}

a {
  color: var(--color-info);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

a:hover {
  text-decoration-thickness: 2px;
}

:focus-visible {
  outline: 3px solid var(--color-info);
  outline-offset: 3px;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: var(--color-text);
  line-height: 1.25;
}

h1,
h2,
h3,
h4,
h5,
h6,
section[id] {
  scroll-margin-top: var(--space-6);
}

h1 {
  font-size: var(--font-h1);
  letter-spacing: -0.035em;
  line-height: 1.08;
  margin: var(--space-2) 0 var(--space-4);
  max-width: 22ch;
}

h2 {
  border-bottom: 1px solid var(--color-line);
  font-size: var(--font-h2);
  letter-spacing: -0.018em;
  margin: var(--space-7) 0 var(--space-4);
  padding-bottom: var(--space-2);
}

h3 {
  font-size: var(--font-h3);
  margin: 0 0 var(--space-2);
}

h4,
h5,
h6 {
  font-size: var(--font-h3);
  margin: var(--space-4) 0 var(--space-2);
}

p,
ul,
ol,
dl,
figure,
blockquote {
  margin-top: 0;
}

p,
li,
dd {
  overflow-wrap: anywhere;
}

code,
kbd,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: var(--font-code);
}

code {
  border: 1px solid var(--color-line);
  border-radius: 6px;
  background: var(--color-surface-soft);
  padding: 0.08rem 0.28rem;
}

pre,
.command {
  border: 1px solid var(--color-code-border);
  border-radius: var(--radius-control);
  background: var(--color-code-surface);
  color: var(--color-code-text);
  display: block;
  margin: var(--space-2) 0;
  max-width: 100%;
  overflow-x: auto;
  padding: var(--space-3) var(--space-4);
}

pre code {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  white-space: pre;
}

kbd {
  border: 1px solid var(--color-line-strong);
  border-bottom-width: 2px;
  border-radius: 6px;
  background: var(--color-surface);
  padding: 0.08rem 0.32rem;
}

mark {
  border-radius: 4px;
  background: var(--color-highlight);
  color: inherit;
  padding: 0.05rem 0.2rem;
}

.shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
  min-width: 0;
  width: 100%;
}

.sidebar {
  border-right: 1px solid var(--color-line);
  background: var(--color-surface);
  height: 100vh;
  overflow-y: auto;
  padding: var(--space-6) var(--space-5);
  position: sticky;
  top: 0;
}

.brand {
  color: var(--color-text);
  display: block;
  font-weight: 800;
  margin-bottom: var(--space-5);
  text-decoration: none;
}

.sidebar nav {
  display: grid;
  gap: var(--space-1);
}

.nav-link {
  border-radius: var(--radius-control);
  color: var(--color-text);
  display: block;
  font-size: var(--font-nav);
  font-weight: 600;
  padding: var(--space-2) var(--space-3);
  text-decoration: none;
}

.nav-link:hover,
.nav-link[aria-current] {
  background: var(--color-info-tint);
  color: var(--color-info);
  font-weight: 800;
}

main {
  min-width: 0;
  padding: var(--space-7) var(--space-6) 64px;
  width: min(var(--content-width), 100%);
}

.document-header,
.contract-header {
  border-bottom: 1px solid var(--color-line);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-5);
}

.kicker,
.eyebrow {
  color: var(--color-info);
  font-size: var(--font-metadata);
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.description,
.lead,
.hero p {
  color: var(--color-muted);
  font-size: var(--font-lead);
  max-width: var(--content-measure);
}

.meta,
.badge-row,
.status-stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.badge,
.pill,
.version-pill,
.timeline-badge,
.method,
.diagram-role-label {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-muted);
  display: inline-block;
  font-size: var(--font-metadata);
  font-weight: 700;
  line-height: 1.4;
  padding: var(--space-1) var(--space-2);
}

.status-approved,
.status-canonical,
.pill.ok {
  border-color: var(--color-success-line);
  background: var(--color-success-tint);
  color: var(--color-success);
}

.status-draft,
.status-proposed,
.pill.warn {
  border-color: var(--color-warning-line);
  background: var(--color-warning-tint);
  color: var(--color-warning);
}

.status-superseded {
  border-color: var(--color-line);
  background: var(--color-surface-soft);
  color: var(--color-muted);
}

.grid,
.stack,
.step-list,
.rich-blocks,
.code-stack,
.decision-list,
.packet-grid,
.proof-rail,
.contract-body,
.api-reference {
  display: grid;
  gap: var(--space-4);
}

.grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.panel,
.step,
.recommendation,
.sample-card,
.fact-rail,
.content-block,
.proof-card,
.notice,
.record-card,
.component-inventory,
.scope-grid > div,
.stenc-header,
.agent-banner,
.endpoint-card,
.metric-grid > div,
.api-strip,
.task-slice-grid > article,
.guide-main,
.rich-structured-diagram,
.requirement,
.approach,
.component,
.contract,
.risk,
.plan-slice,
.plan-step,
.supporting-section,
.worker-instructions,
.scope-check,
.execution-handoff,
.implementation-handoff {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-component);
  background: var(--color-surface);
  box-shadow: var(--shadow-component);
  padding: var(--space-5);
}

.panel {
  color: inherit;
  text-decoration: none;
}

a.panel,
button.panel {
  border-color: var(--color-control-border);
}

a.panel h3 {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

a.panel:hover,
button.panel:hover {
  border-color: var(--color-info);
  box-shadow: var(--shadow-raised);
}

.operator-console .document-header {
  border-top: 4px solid var(--color-warning);
}

.evidence-led .document-header {
  border-top: 4px solid var(--color-relation);
}

.scope-grid,
.document-summary,
.summary-grid,
.split,
.decision-summary,
.callout-row,
.task-slice-grid,
.console-grid,
.plan-header-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.document-summary > *,
.human-summary,
.agent-summary {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-component);
  background: var(--color-surface);
  box-shadow: var(--shadow-component);
  padding: var(--space-5);
}

.agent-summary,
.agent-banner {
  border-color: var(--color-info-line);
  background: var(--color-info-tint);
}

.document-metadata {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  font-size: var(--font-metadata);
  gap: var(--space-2);
}

.requirements,
.approaches,
.components,
.contracts,
.risks,
.plan-slices,
.slice-steps,
.slice-files,
.file-structure,
.surfaces,
.testing-strategy,
.validation,
.review-checklist,
.self-review-checks,
.agent-instructions,
.supporting-sections,
.open-questions,
.architecture-flow,
.data-flow,
.execution-order {
  display: grid;
  gap: var(--space-4);
}

.file-structure-entry,
.plan-file,
.surface {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-component);
  background: var(--color-surface-soft);
  padding: var(--space-4);
}

.step-instruction,
.step-code-blocks,
.step-command,
.step-expected,
.done-when,
.slice-surfaces {
  border-top: 1px solid var(--color-line);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
}

.list,
.check-list,
.mini-list,
.compact-list {
  margin: 0;
  padding-left: 1.2rem;
}

.nested-sections {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.supporting-section .supporting-section {
  background: var(--color-surface-soft);
  box-shadow: none;
}

.table,
table {
  border-collapse: collapse;
  font-size: var(--font-table);
  width: 100%;
}

.table-scroll-region {
  max-width: 100%;
  overflow-x: auto;
}

.table-scroll-region:focus-visible {
  outline-offset: 2px;
}

.table th,
.table td,
th,
td {
  border-bottom: 1px solid var(--color-line);
  padding: var(--space-3);
  text-align: left;
  vertical-align: top;
}

.table th,
th {
  color: var(--color-muted);
  font-size: var(--font-table);
  font-weight: 750;
}

caption {
  color: var(--color-muted);
  font-size: var(--font-metadata);
  padding: 0 0 var(--space-2);
  text-align: left;
}

.rich-blocks {
  margin-top: var(--space-4);
}

.rich-block,
.rich-paragraph {
  margin: 0;
}

.rich-paragraph {
  line-height: var(--line-body);
}

.rich-callout,
.mini-callout,
.missing-media,
.validation-error,
.empty-state {
  border: 1px solid var(--color-line);
  border-left: 4px solid var(--color-muted);
  border-radius: var(--radius-component);
  background: var(--color-surface-soft);
  padding: var(--space-4);
}

.rich-callout .rich-block-title {
  color: var(--color-text);
  margin-top: 0;
}

.callout-tone-label,
.task-state {
  color: var(--color-muted);
  font-size: var(--font-metadata);
  font-weight: 800;
}

.callout-tone-label {
  display: block;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-1);
  text-transform: uppercase;
}

.tone-info {
  border-left-color: var(--color-info);
  background: var(--color-info-tint);
}

.tone-success {
  border-left-color: var(--color-success);
  background: var(--color-success-tint);
}

.tone-warning {
  border-left-color: var(--color-warning);
  background: var(--color-warning-tint);
}

.tone-danger,
.missing-media,
.validation-error {
  border-left-color: var(--color-danger);
  background: var(--color-danger-tint);
}

.missing-media > strong,
.validation-error strong {
  color: var(--color-danger);
}

.missing-media,
.validation-error {
  border-style: dashed;
}

.rich-quote {
  border-left: 4px solid var(--color-relation);
  color: var(--color-muted);
  padding-left: var(--space-4);
}

.rich-quote blockquote {
  margin: 0;
}

.rich-quote figcaption,
.rich-media figcaption {
  color: var(--color-muted);
  font-size: var(--font-metadata);
  margin-top: var(--space-2);
}

.rich-media,
.rich-diagram {
  display: grid;
  gap: var(--space-2);
}

.rich-diagram figcaption {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.rich-media img,
.rich-diagram pre {
  border-radius: var(--radius-component);
}

.rich-task-list,
.task-list {
  display: grid;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.rich-task-list li,
.task-list li {
  align-items: start;
  display: grid;
  gap: var(--space-2);
  grid-template-columns: 20px minmax(0, 1fr);
}

.task-list li > span:first-child {
  align-items: center;
  border: 2px solid var(--color-success);
  border-radius: 5px;
  display: inline-flex;
  height: 20px;
  justify-content: center;
  margin-top: 3px;
  width: 20px;
}

.task-check {
  accent-color: var(--color-success);
  height: 20px;
  margin: 3px 0 0;
  width: 20px;
}

.rich-structured-diagram {
  display: grid;
  gap: var(--space-4);
  margin: var(--space-5) 0;
}

.rich-structured-diagram > figcaption {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.diagram-summary,
.diagram-node-detail {
  color: var(--color-muted);
}

.diagram-summary {
  margin-bottom: 0;
}

.diagram-mobile-linear,
.diagram-layer-stack,
.diagram-node-grid,
.diagram-connection-sequence {
  display: grid;
  gap: var(--space-3);
}

.diagram-layer,
.diagram-node-card,
.diagram-directed-connection {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-component);
  background: var(--color-surface-soft);
}

.diagram-layer {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  overflow: hidden;
}

.diagram-role-rail {
  align-items: center;
  background: var(--diagram-tint, var(--color-surface-soft));
  border-right: 1px solid var(--diagram-color, var(--color-line));
  display: flex;
  justify-content: center;
  padding: var(--space-4);
}

.diagram-layer-content {
  padding: var(--space-4);
}

.diagram-layer-nodes,
.diagram-node-grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.diagram-node-card {
  border-left: 4px solid var(--diagram-color, var(--color-muted));
  padding: var(--space-4);
}

.diagram-node-label {
  display: block;
}

.diagram-node-detail {
  font-size: var(--font-table);
  margin: var(--space-1) 0 0;
}

.diagram-layer-transition {
  color: var(--color-muted);
  font-size: var(--font-metadata);
  padding-left: var(--space-4);
}

.diagram-directed-connection {
  align-items: center;
  border-left: 4px solid var(--color-relation);
  display: grid;
  gap: var(--space-2);
  grid-template-columns: minmax(100px, 1fr) minmax(120px, 1fr) auto minmax(100px, 1fr);
  padding: var(--space-3) var(--space-4);
}

.diagram-directed-label {
  color: var(--color-relation);
  font-size: var(--font-table);
  font-weight: 700;
}

.diagram-direction {
  color: var(--color-relation);
}

.diagram-fallback {
  border-top: 1px solid var(--color-line);
  padding-top: var(--space-4);
}

.diagram-fallback summary {
  color: var(--color-info);
  cursor: pointer;
  font-size: var(--font-nav);
  font-weight: 700;
}

.diagram-fallback-node-list {
  display: grid;
  gap: var(--space-2);
  padding-left: 1.25rem;
}

.visually-hidden {
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

.diagram-role-consumer {
  --diagram-color: var(--color-diagram-consumer);
  --diagram-tint: var(--color-info-tint);
}

.diagram-role-surface {
  --diagram-color: var(--color-diagram-surface);
  --diagram-tint: var(--color-diagram-surface-tint);
}

.diagram-role-session {
  --diagram-color: var(--color-diagram-session);
  --diagram-tint: var(--color-relation-tint);
}

.diagram-role-engine {
  --diagram-color: var(--color-diagram-engine);
  --diagram-tint: var(--color-warning-tint);
}

.diagram-role-boundary {
  --diagram-color: var(--color-diagram-boundary);
  --diagram-tint: var(--color-danger-tint);
}

.diagram-role-value {
  --diagram-color: var(--color-diagram-value);
  --diagram-tint: var(--color-success-tint);
}

.diagram-role-neutral {
  --diagram-color: var(--color-diagram-neutral);
  --diagram-tint: var(--color-surface-soft);
}

.sorting-controls {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  font-size: var(--font-nav);
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.sorting-label {
  color: var(--color-muted);
  font-weight: 700;
}

.sort-btn,
.button {
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-nav);
  font-weight: 700;
  padding: var(--space-2) var(--space-3);
}

.sort-btn:hover,
.sort-btn.active,
.button {
  border-color: var(--color-info);
  background: var(--color-info);
  color: var(--color-on-accent);
}

.timeline-section {
  border-top: 1px solid var(--color-line);
  margin-top: var(--space-7);
  padding-top: var(--space-6);
}

.timeline {
  display: grid;
  gap: var(--space-4);
  list-style: none;
  margin: var(--space-5) 0 0;
  padding: 0;
}

.timeline-item,
.timeline li {
  position: relative;
}

.timeline-marker {
  border: 3px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-line-strong);
  box-shadow: 0 0 0 2px var(--color-line);
  height: 16px;
  width: 16px;
}

.timeline-content {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-component);
  background: var(--color-surface);
  box-shadow: var(--shadow-component);
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
}

.timeline-header,
.timeline-meta,
.endpoint-line,
.section-heading {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: space-between;
}

.timeline-title {
  font-size: var(--font-h3);
  margin: 0;
}

.timeline-date,
.timeline-desc {
  color: var(--color-muted);
  font-size: var(--font-metadata);
  margin: 0;
}

.timeline-badge.spec {
  border-color: var(--color-info-line);
  background: var(--color-info-tint);
  color: var(--color-info);
}

.timeline-badge.plan {
  border-color: var(--color-relation-line);
  background: var(--color-relation-tint);
  color: var(--color-relation);
}

.timeline-badge.decision {
  border-color: var(--color-warning-line);
  background: var(--color-warning-tint);
  color: var(--color-warning);
}

.timeline-badge.agent-context {
  border-color: var(--color-success-line);
  background: var(--color-success-tint);
  color: var(--color-success);
}

.site-header {
  align-items: center;
  border-bottom: 1px solid var(--color-line);
  background: var(--color-surface-overlay);
  display: flex;
  gap: var(--space-5);
  justify-content: space-between;
  min-height: 64px;
  padding: 0 var(--space-6);
  position: sticky;
  top: 0;
  z-index: 10;
}

.site-header .brand {
  margin: 0;
}

.site-header nav {
  display: flex;
  flex-wrap: wrap;
  font-size: var(--font-nav);
  gap: var(--space-2);
}

.home,
.document,
.console-page,
.evidence-page {
  margin: 0 auto;
  width: min(1180px, calc(100% - 40px));
}

.hero {
  border-bottom: 1px solid var(--color-line);
  padding: 64px 0 var(--space-7);
}

.recommendation {
  align-items: center;
  display: flex;
  gap: var(--space-5);
  justify-content: space-between;
  margin: var(--space-6) 0;
}

.sample-grid,
.inventory-grid,
.metric-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: var(--space-6) 0;
}

.sample-card.recommended {
  border-color: var(--color-info);
}

.sources,
.agent-note {
  border-top: 1px solid var(--color-line);
  margin-top: var(--space-5);
  padding-top: var(--space-5);
}

.guide-layout,
.evidence-page {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: minmax(0, 1fr) minmax(230px, 300px);
  padding: var(--space-7) 0;
}

.evidence-page {
  grid-template-columns: 210px minmax(0, 1fr) 270px;
}

.fact-rail,
.outline,
.proof-rail {
  align-self: start;
  position: sticky;
  top: 84px;
}

.outline nav {
  display: grid;
  font-size: var(--font-nav);
  gap: var(--space-1);
}

.console-page {
  padding: var(--space-6) 0 64px;
}

.console-hero {
  border: 1px solid var(--color-line);
  border-top: 4px solid var(--color-warning);
  border-radius: var(--radius-component);
  background: var(--color-surface);
  box-shadow: var(--shadow-component);
  padding: var(--space-6);
}

.api-strip {
  grid-template-columns: minmax(260px, 1.2fr) repeat(3, minmax(120px, 0.6fr));
}

.api-grid,
.response-card {
  display: grid;
  gap: var(--space-4);
}

.response-card > div,
.packet-grid > div {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-control);
  background: var(--color-surface-soft);
  padding: var(--space-3);
}

.panel.full {
  grid-column: 1 / -1;
}

.compact-table th {
  width: 90px;
}

.param-table {
  margin-top: var(--space-4);
}

.method.get {
  border-color: var(--color-info);
  background: var(--color-info-tint);
  color: var(--color-info);
}

.method.post {
  border-color: var(--color-success);
  background: var(--color-success-tint);
  color: var(--color-success);
}

.record-card dl,
.term-grid,
.stenc-header dl {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}

.record-card div,
.term-grid div {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: 150px minmax(0, 1fr);
}

.record-card dt,
.term-grid dt,
.stenc-header dt,
.plan-header-grid span,
.metric-grid span,
.api-strip span,
.packet-grid span,
.mini-callout span,
.proof-card span {
  color: var(--color-muted);
  font-size: var(--font-metadata);
  font-weight: 750;
}

.empty-state {
  border-left-style: dashed;
}

@media (max-width: 780px) {
  .shell {
    display: block;
  }

  .sidebar {
    border-bottom: 1px solid var(--color-line);
    border-right: 0;
    height: auto;
    overflow: visible;
    padding: var(--space-4);
    position: static;
  }

  .sidebar nav {
    display: flex;
    flex-wrap: wrap;
  }

  .brand {
    margin-bottom: var(--space-3);
  }

  main {
    padding: var(--space-6) var(--space-4) var(--space-7);
  }

  .grid,
  .scope-grid,
  .document-summary,
  .summary-grid,
  .split,
  .decision-summary,
  .callout-row,
  .task-slice-grid,
  .console-grid,
  .plan-header-grid,
  .sample-grid,
  .inventory-grid,
  .metric-grid,
  .guide-layout,
  .evidence-page,
  .api-strip {
    grid-template-columns: 1fr;
  }

  .diagram-relation-spine,
  .diagram-mobile-linear,
  .table-scroll-region {
    max-width: 100%;
    min-width: 0;
  }

  .fact-rail,
  .outline,
  .proof-rail {
    position: static;
  }

  .diagram-layer {
    grid-template-columns: 1fr;
  }

  .diagram-role-rail {
    border-bottom: 1px solid var(--diagram-color, var(--color-line));
    border-right: 0;
    justify-content: flex-start;
  }

  .diagram-layer-nodes,
  .diagram-node-grid,
  .diagram-directed-connection {
    grid-template-columns: 1fr;
  }

  .diagram-direction {
    transform: rotate(90deg);
  }

  .site-header {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    position: static;
  }

  .home,
  .document,
  .console-page,
  .evidence-page {
    width: min(100% - 28px, 1180px);
  }

  .recommendation {
    align-items: stretch;
    flex-direction: column;
  }

  .button {
    text-align: center;
    width: 100%;
  }

  .record-card div,
  .term-grid div {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
}

@media (prefers-contrast: more) {
  :root {
    --color-line: var(--color-control-border);
    --color-muted: var(--color-text);
  }

  .badge,
  .panel,
  .rich-callout,
  .missing-media,
  .validation-error,
  .empty-state {
    border-width: 2px;
  }
}

@media (forced-colors: active) {
  :focus-visible {
    outline-color: Highlight;
  }

  .skip-link,
  .badge,
  .panel,
  .rich-callout,
  .missing-media,
  .validation-error,
  .empty-state,
  .diagram-node-card,
  .diagram-directed-connection {
    border-color: CanvasText;
    forced-color-adjust: auto;
  }

  .nav-link[aria-current] {
    outline: 2px solid LinkText;
  }
}
`;
}

module.exports = { buildUnifiedStyles };
