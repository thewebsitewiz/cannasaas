import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const DRIZZLE = Symbol.for('DRIZZLE');
type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DB) {}

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user ?? null;
  }

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()));
    return user ?? null;
  }

  async findByDispensary(dispensaryId: string) {
    return this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.dispensaryId, dispensaryId))
      .orderBy(desc(schema.users.createdAt));
  }

  async create(email: string, passwordHash: string) {
    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');
    const [user] = await this.db
      .insert(schema.users)
      .values({ email: email.toLowerCase(), passwordHash })
      .returning();
    return user;
  }

  async updateRole(id: string, role: string) {
    const [user] = await this.db
      .update(schema.users)
      .set({ role })
      .where(eq(schema.users.id, id))
      .returning();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deactivate(id: string): Promise<void> {
    const [user] = await this.db
      .update(schema.users)
      .set({ isActive: false })
      .where(eq(schema.users.id, id))
      .returning();
    if (!user) throw new NotFoundException('User not found');
  }
}
