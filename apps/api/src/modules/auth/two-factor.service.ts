import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  constructor(@InjectDataSource() private ds: DataSource) {}

  /** Generate a TOTP secret for a user */
  async generateSecret(userId: string): Promise<{ secret: string; otpauthUrl: string; qrCodeUrl: string }> {
    const secret = crypto.randomBytes(20).toString('hex').slice(0, 20);
    const base32Secret = this.toBase32(secret);

    // Save secret to user record
    await this.ds.query(
      `UPDATE users SET two_factor_secret = $1, two_factor_enabled = false WHERE user_id = $2`,
      [base32Secret, userId],
    );

    const [user] = await this.ds.query(`SELECT email FROM users WHERE user_id = $1`, [userId]);
    const otpauthUrl = `otpauth://totp/CannaSaas:${user.email}?secret=${base32Secret}&issuer=CannaSaas&digits=6&period=30`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    return { secret: base32Secret, otpauthUrl, qrCodeUrl };
  }

  /** Verify a TOTP code and enable 2FA */
  async verifyAndEnable(userId: string, code: string): Promise<boolean> {
    const [user] = await this.ds.query(
      `SELECT two_factor_secret FROM users WHERE user_id = $1`, [userId],
    );
    if (!user?.two_factor_secret) throw new BadRequestException('2FA not set up');

    const valid = this.verifyTotp(user.two_factor_secret, code);
    if (!valid) throw new BadRequestException('Invalid code');

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    await this.ds.query(
      `UPDATE users SET two_factor_enabled = true, two_factor_backup_codes = $1 WHERE user_id = $2`,
      [JSON.stringify(backupCodes), userId],
    );

    return true;
  }

  /** Verify a TOTP code during login */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const [user] = await this.ds.query(
      `SELECT two_factor_secret, two_factor_backup_codes FROM users WHERE user_id = $1`, [userId],
    );
    if (!user?.two_factor_secret) return false;

    // Try TOTP first
    if (this.verifyTotp(user.two_factor_secret, code)) return true;

    // Try backup codes
    const backups: string[] = JSON.parse(user.two_factor_backup_codes || '[]');
    const idx = backups.indexOf(code);
    if (idx >= 0) {
      backups.splice(idx, 1);
      await this.ds.query(
        `UPDATE users SET two_factor_backup_codes = $1 WHERE user_id = $2`,
        [JSON.stringify(backups), userId],
      );
      return true;
    }

    return false;
  }

  /** Check if user has 2FA enabled */
  async isEnabled(userId: string): Promise<boolean> {
    const [user] = await this.ds.query(
      `SELECT two_factor_enabled FROM users WHERE user_id = $1`, [userId],
    );
    return user?.two_factor_enabled === true;
  }

  /** Disable 2FA */
  async disable(userId: string, code: string): Promise<boolean> {
    const valid = await this.verifyCode(userId, code);
    if (!valid) throw new BadRequestException('Invalid code');
    await this.ds.query(
      `UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE user_id = $1`,
      [userId],
    );
    return true;
  }

  private verifyTotp(secret: string, code: string): boolean {
    // Check current and +/-1 time windows (30-second windows)
    const now = Math.floor(Date.now() / 1000);
    for (const offset of [-1, 0, 1]) {
      const counter = Math.floor((now + offset * 30) / 30);
      const generated = this.generateTotpCode(secret, counter);
      if (generated === code) return true;
    }
    return false;
  }

  private generateTotpCode(secret: string, counter: number): string {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));
    const hmac = crypto.createHmac('sha1', Buffer.from(this.fromBase32(secret)));
    hmac.update(buffer);
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0x0f;
    const code = ((hash[offset] & 0x7f) << 24 | hash[offset + 1] << 16 | hash[offset + 2] << 8 | hash[offset + 3]) % 1000000;
    return code.toString().padStart(6, '0');
  }

  private toBase32(hex: string): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = Buffer.from(hex, 'hex');
    let bits = '';
    for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
    let result = '';
    for (let i = 0; i < bits.length; i += 5) {
      result += alphabet[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
    }
    return result;
  }

  private fromBase32(base32: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const char of base32.toUpperCase()) {
      const val = alphabet.indexOf(char);
      if (val >= 0) bits += val.toString(2).padStart(5, '0');
    }
    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      if (i + 8 <= bits.length) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return Buffer.from(bytes);
  }
}
