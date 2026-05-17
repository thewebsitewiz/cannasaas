import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';

const MAX_DEPTH = 10;

interface SelectionLike {
  selectionSet?: { selections: readonly SelectionLike[] };
}

function getDepth(node: SelectionLike, depth = 0): number {
  if (!node.selectionSet) return depth;
  return Math.max(
    ...node.selectionSet.selections.map((sel) => getDepth(sel, depth + 1)),
  );
}

export const depthLimitPlugin: ApolloServerPlugin = {
  // eslint-disable-next-line @typescript-eslint/require-await
  async requestDidStart() {
    return {
      // eslint-disable-next-line @typescript-eslint/require-await
      async didResolveOperation(ctx) {
        const { document } = ctx;
        for (const def of document.definitions) {
          if (String(def.kind) === 'OperationDefinition') {
            const depth = getDepth(def as unknown as SelectionLike);
            if (depth > MAX_DEPTH) {
              throw new GraphQLError(
                `Query depth ${String(depth)} exceeds maximum allowed depth of ${String(MAX_DEPTH)}`,
                { extensions: { code: 'QUERY_TOO_DEEP' } },
              );
            }
          }
        }
      },
    };
  },
};
