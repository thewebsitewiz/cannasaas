import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Register sessions (sc-221) — per-shift cash-drawer accounting.
 *
 * One row per opened shift; closed by a closeRegisterSession mutation
 * (records closing cash + closed_at). Partial unique index ensures one
 * open session per (dispensary, user) at a time — closing flips status
 * to 'closed' so a new session can be opened.
 */
export class CreateRegisterSessions1779192400000 implements MigrationInterface {
  name = 'CreateRegisterSessions1779192400000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE register_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dispensary_id UUID NOT NULL REFERENCES dispensaries(entity_id) ON DELETE CASCADE,
        opened_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        opening_cash_cents INTEGER NOT NULL,
        closing_cash_cents INTEGER,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
        opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await qr.query(
      `CREATE INDEX idx_register_sessions_disp_status ON register_sessions (dispensary_id, status)`,
    );
    await qr.query(
      `CREATE INDEX idx_register_sessions_user_status ON register_sessions (opened_by_user_id, status)`,
    );
    await qr.query(`
      CREATE UNIQUE INDEX idx_register_sessions_one_open_per_user
      ON register_sessions (dispensary_id, opened_by_user_id)
      WHERE status = 'open'
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(
      `DROP INDEX IF EXISTS idx_register_sessions_one_open_per_user`,
    );
    await qr.query(`DROP INDEX IF EXISTS idx_register_sessions_user_status`);
    await qr.query(`DROP INDEX IF EXISTS idx_register_sessions_disp_status`);
    await qr.query(`DROP TABLE IF EXISTS register_sessions`);
  }
}
