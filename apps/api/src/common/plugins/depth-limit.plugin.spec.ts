import { parse } from 'graphql';
import { GraphQLError } from 'graphql';

import { depthLimitPlugin } from './depth-limit.plugin';

/**
 * Exercises the depth + complexity guards (sc-610) against synthetic
 * queries crafted to land at, just above, and well above the
 * configured limits. The plugins parse the GraphQL AST and reject
 * during `didResolveOperation`, before the request reaches resolvers
 * — so the unit-test surface is just `parse(query) → plugin → expect`.
 */

async function runDepthPlugin(query: string): Promise<void> {
  const document = parse(query);
  const handlers = await depthLimitPlugin.requestDidStart!({
    request: { query },
    document,
  } as never);
  await handlers!.didResolveOperation!({
    document,
  } as never);
}

function nestedQuery(levels: number): string {
  // Builds `query { a { a { a { ... ok }... } } }` to `levels` deep.
  // The depth check counts selection-set nesting, so depth = `levels`.
  let body = 'ok';
  for (let i = 0; i < levels - 1; i++) body = `a { ${body} }`;
  return `query { ${body} }`;
}

describe('depthLimitPlugin (sc-610)', () => {
  it('accepts a query at exactly the depth limit (10)', async () => {
    await expect(runDepthPlugin(nestedQuery(10))).resolves.toBeUndefined();
  });

  it('rejects a query one above the limit (11)', async () => {
    await expect(runDepthPlugin(nestedQuery(11))).rejects.toBeInstanceOf(
      GraphQLError,
    );
  });

  it('rejects a deeply pathological query (50)', async () => {
    await expect(runDepthPlugin(nestedQuery(50))).rejects.toThrow(
      /Query depth .* exceeds/,
    );
  });

  it('emits the QUERY_TOO_DEEP extension code on rejection', async () => {
    try {
      await runDepthPlugin(nestedQuery(20));
      throw new Error('expected rejection');
    } catch (err) {
      if (!(err instanceof GraphQLError)) throw err;
      expect(err.extensions['code']).toBe('QUERY_TOO_DEEP');
    }
  });
});
