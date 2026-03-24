import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';

const MAX_DEPTH = 10;

function getDepth(node: any, depth = 0): number {
  if (!node.selectionSet) return depth;
  return Math.max(
    ...node.selectionSet.selections.map((sel: any) => getDepth(sel, depth + 1)),
  );
}

export const depthLimitPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    return {
      async didResolveOperation(ctx) {
        const { document } = ctx;
        for (const def of document.definitions) {
          if (def.kind === 'OperationDefinition') {
            const depth = getDepth(def);
            if (depth > MAX_DEPTH) {
              throw new GraphQLError(
                `Query depth ${depth} exceeds maximum allowed depth of ${MAX_DEPTH}`,
                { extensions: { code: 'QUERY_TOO_DEEP' } },
              );
            }
          }
        }
      },
    };
  },
};
