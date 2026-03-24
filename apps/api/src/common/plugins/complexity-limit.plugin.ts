import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';

const MAX_COMPLEXITY = 1000;

/**
 * Estimates query complexity by counting every field selection
 * (including nested ones). Each field counts as 1 point of complexity.
 */
function countFields(node: any): number {
  if (!node.selectionSet) return 0;
  let count = 0;
  for (const sel of node.selectionSet.selections) {
    if (sel.kind === 'Field') {
      count += 1; // the field itself
      count += countFields(sel); // nested selections
    } else if (sel.kind === 'InlineFragment' || sel.kind === 'FragmentSpread') {
      count += countFields(sel);
    }
  }
  return count;
}

export const complexityLimitPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    return {
      async didResolveOperation(ctx) {
        const { document } = ctx;
        let totalComplexity = 0;

        for (const def of document.definitions) {
          if (def.kind === 'OperationDefinition') {
            totalComplexity += countFields(def);
          }
        }

        if (totalComplexity > MAX_COMPLEXITY) {
          throw new GraphQLError(
            `Query complexity ${totalComplexity} exceeds maximum allowed complexity of ${MAX_COMPLEXITY}`,
            { extensions: { code: 'QUERY_TOO_COMPLEX' } },
          );
        }
      },
    };
  },
};
