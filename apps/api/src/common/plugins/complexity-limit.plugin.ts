import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';

const MAX_COMPLEXITY = 1000;

interface SelectionLike {
  kind?: string;
  selectionSet?: { selections: readonly SelectionLike[] };
}

/**
 * Estimates query complexity by counting every field selection
 * (including nested ones). Each field counts as 1 point of complexity.
 */
function countFields(node: SelectionLike): number {
  if (!node.selectionSet) return 0;
  let count = 0;
  for (const sel of node.selectionSet.selections) {
    if (sel.kind === 'Field') {
      count += 1;
      count += countFields(sel);
    } else if (sel.kind === 'InlineFragment' || sel.kind === 'FragmentSpread') {
      count += countFields(sel);
    }
  }
  return count;
}

export const complexityLimitPlugin: ApolloServerPlugin = {
  // eslint-disable-next-line @typescript-eslint/require-await
  async requestDidStart() {
    return {
      // eslint-disable-next-line @typescript-eslint/require-await
      async didResolveOperation(ctx) {
        const { document } = ctx;
        let totalComplexity = 0;

        for (const def of document.definitions) {
          if (String(def.kind) === 'OperationDefinition') {
            totalComplexity += countFields(def as unknown as SelectionLike);
          }
        }

        if (totalComplexity > MAX_COMPLEXITY) {
          throw new GraphQLError(
            `Query complexity ${String(totalComplexity)} exceeds maximum allowed complexity of ${String(MAX_COMPLEXITY)}`,
            { extensions: { code: 'QUERY_TOO_COMPLEX' } },
          );
        }
      },
    };
  },
};
