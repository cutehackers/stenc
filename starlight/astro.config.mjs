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
