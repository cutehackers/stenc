#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STARLIGHT_DIR="${REPO_ROOT}/starlight"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to prepare the Starlight workspace." >&2
  exit 1
fi

mkdir -p \
  "${STARLIGHT_DIR}/src/content/docs/specs" \
  "${STARLIGHT_DIR}/src/content/docs/plans"

if [[ ! -f "${STARLIGHT_DIR}/package.json" ]]; then
  cat > "${STARLIGHT_DIR}/package.json" <<'EOF'
{
  "name": "context-kit-starlight",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/starlight": "latest",
    "astro": "latest"
  },
  "devDependencies": {
    "typescript": "latest"
  }
}
EOF
fi

if [[ ! -f "${STARLIGHT_DIR}/astro.config.mjs" ]]; then
  cat > "${STARLIGHT_DIR}/astro.config.mjs" <<'EOF'
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'ContextKit',
      sidebar: [
        {
          label: 'Start Here',
          items: [{ label: 'Overview', slug: 'index' }],
        },
        {
          label: 'Specs',
          items: [{ autogenerate: { directory: 'specs' } }],
        },
        {
          label: 'Plans',
          items: [{ autogenerate: { directory: 'plans' } }],
        },
      ],
    }),
  ],
});
EOF
fi

if [[ ! -f "${STARLIGHT_DIR}/src/content.config.ts" ]]; then
  cat > "${STARLIGHT_DIR}/src/content.config.ts" <<'EOF'
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
EOF
fi

if [[ ! -f "${STARLIGHT_DIR}/src/content/docs/index.mdx" ]]; then
  cat > "${STARLIGHT_DIR}/src/content/docs/index.mdx" <<'EOF'
---
title: ContextKit
description: Agent-readable, human-friendly documentation templates.
---

# ContextKit

ContextKit documents keep meaning in frontmatter, headings, tables, validation
commands, and agent instructions so humans and AI coding agents can read the
same source.
EOF
fi

cp "${REPO_ROOT}/examples/artifact-identity.spec.mdx" \
  "${STARLIGHT_DIR}/src/content/docs/specs/artifact-identity.mdx"
cp "${REPO_ROOT}/examples/context-kit-adoption.plan.mdx" \
  "${STARLIGHT_DIR}/src/content/docs/plans/context-kit-adoption.mdx"

(
  cd "${STARLIGHT_DIR}"
  npm install
)

echo "Prepared Starlight workspace at ${STARLIGHT_DIR}"
echo "Run: cd ${STARLIGHT_DIR} && npm run dev"
