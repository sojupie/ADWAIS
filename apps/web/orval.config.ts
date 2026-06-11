import { defineConfig } from 'orval';

export default defineConfig({
  adwais: {
    input: '../../docs/openapi/v1.json',
    output: {
      mode: 'split',
      target: './src/api/generated/endpoints.ts',
      schemas: '../../packages/types/generated',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/apiClient.ts',
          name: 'customClient',
        },
      },
    },
  },
});
