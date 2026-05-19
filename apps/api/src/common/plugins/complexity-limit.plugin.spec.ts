import { parse } from 'graphql';
import { GraphQLError } from 'graphql';

import { complexityLimitPlugin } from './complexity-limit.plugin';

/** Run the complexity plugin against a parsed query. Resolves on accept. */
async function runComplexity(query: string): Promise<void> {
  const document = parse(query);
  const handlers = await complexityLimitPlugin.requestDidStart!({
    request: { query },
    document,
  } as never);
  await handlers!.didResolveOperation!({
    document,
  } as never);
}

/**
 * Generates a flat query with `count` sibling fields. The complexity
 * plugin counts every Field selection, so complexity = count.
 *
 * `query { f0 f1 f2 ... f<count-1> }`
 */
function flatQuery(count: number): string {
  const fields: string[] = [];
  for (let i = 0; i < count; i++) fields.push(`f${i}`);
  return `query { ${fields.join(' ')} }`;
}

describe('complexityLimitPlugin (sc-610)', () => {
  it('accepts a query at exactly 1000 fields (the limit)', async () => {
    await expect(runComplexity(flatQuery(1000))).resolves.toBeUndefined();
  });

  it('rejects a query at 1001 fields (just over)', async () => {
    await expect(runComplexity(flatQuery(1001))).rejects.toBeInstanceOf(
      GraphQLError,
    );
  });

  it('rejects a deeply nested query that fans out aggressively', async () => {
    // 50 top-level fields, each with 25 children = 50 + 50*25 = 1300 fields
    const children = Array.from({ length: 25 }, (_, i) => `c${i}`).join(' ');
    const fields = Array.from(
      { length: 50 },
      (_, i) => `f${i} { ${children} }`,
    );
    const query = `query { ${fields.join(' ')} }`;
    await expect(runComplexity(query)).rejects.toThrow(
      /Query complexity .* exceeds/,
    );
  });

  it('emits the QUERY_TOO_COMPLEX extension code on rejection', async () => {
    try {
      await runComplexity(flatQuery(2000));
      throw new Error('expected rejection');
    } catch (err) {
      if (!(err instanceof GraphQLError)) throw err;
      expect(err.extensions['code']).toBe('QUERY_TOO_COMPLEX');
    }
  });
});
