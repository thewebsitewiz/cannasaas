import { Inject } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const DRIZZLE = Symbol.for('DRIZZLE');
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;
export const InjectDrizzle = () => Inject(DRIZZLE);
