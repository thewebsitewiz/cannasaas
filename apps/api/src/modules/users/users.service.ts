import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../auth/enums/role.enum';

export interface InviteStaffInput {
  readonly email: string;
  readonly dispensaryId: string;
  readonly role: Role;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly organizationId?: string;
}

export interface InviteStaffResult {
  readonly user: User;
  /** The dev-mode temporary password. Logged for prod (replace with email send). */
  readonly temporaryPassword: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email: email.toLowerCase() });
  }

  findByDispensary(dispensaryId: string): Promise<User[]> {
    return this.repo.find({
      where: { dispensaryId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');
    const user = this.repo.create({ email: email.toLowerCase(), passwordHash });
    return this.repo.save(user);
  }

  async updateRole(id: string, role: Role): Promise<User> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    return this.repo.save(user);
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = false;
    await this.repo.save(user);
  }

  /**
   * Invite a new staff member to a dispensary. Generates a temporary
   * 16-char password, hashes it with bcrypt cost 12 (matches the seed
   * + auth flow), persists the user, and returns both the user and
   * the plaintext password so the admin UI can hand it off (or a
   * future email-send hook can deliver it).
   *
   * Caller-level guards (role / tenant / escalation) live in the
   * resolver — this method is the persistence-only seam.
   */
  async invite(input: InviteStaffInput): Promise<InviteStaffResult> {
    const existing = await this.findByEmail(input.email);
    if (existing) throw new ConflictException('Email already registered');
    const temporaryPassword = randomBytes(12)
      .toString('base64url')
      .slice(0, 16);
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const user = this.repo.create({
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      dispensaryId: input.dispensaryId,
      organizationId: input.organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      isActive: true,
      emailVerified: false,
    });
    const saved = await this.repo.save(user);
    this.logger.log(
      `Invited staff ${saved.email} (role=${saved.role}) into dispensary=${saved.dispensaryId} — temp password issued`,
    );
    return { user: saved, temporaryPassword };
  }
}
