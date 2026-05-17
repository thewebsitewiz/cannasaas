import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../apps/api/schema.gql',
  documents: ['projects/ui/src/lib/graphql/operations/**/*.graphql', 'projects/**/*.graphql'],
  generates: {
    'projects/ui/src/lib/graphql/generated.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */\n// AUTO-GENERATED — do not edit by hand\n',
          },
        },
        'typescript',
        'typescript-operations',
        'typescript-apollo-angular',
      ],
      config: {
        namingConvention: { enumValues: 'keep' },
        scalars: {
          DateTime: 'string',
          UUID: 'string',
          JSON: 'Record<string, unknown>',
        },
        addExplicitOverride: true,
        useExplicitTyping: true,
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
