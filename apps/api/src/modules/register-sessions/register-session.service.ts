import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterSession } from './entities/register-session.entity';

export interface OpenRegisterSessionInput {
  readonly dispensaryId: string;
  readonly userId: string;
  readonly openingCashCents: number;
}

export interface CloseRegisterSessionInput {
  readonly sessionId: string;
  readonly userId: string;
  readonly closingCashCents: number;
}

@Injectable()
export class RegisterSessionService {
  private readonly logger = new Logger(RegisterSessionService.name);

  constructor(
    @InjectRepository(RegisterSession)
    private readonly repo: Repository<RegisterSession>,
  ) {}

  myCurrent(
    dispensaryId: string,
    userId: string,
  ): Promise<RegisterSession | null> {
    return this.repo.findOne({
      where: { dispensaryId, openedByUserId: userId, status: 'open' },
    });
  }

  async open(input: OpenRegisterSessionInput): Promise<RegisterSession> {
    if (input.openingCashCents < 0) {
      throw new BadRequestException('openingCashCents cannot be negative');
    }

    const existing = await this.myCurrent(input.dispensaryId, input.userId);
    if (existing) {
      throw new ConflictException(
        'A register session is already open for this user',
      );
    }

    const created = this.repo.create({
      dispensaryId: input.dispensaryId,
      openedByUserId: input.userId,
      openingCashCents: input.openingCashCents,
      status: 'open',
    });
    const saved = await this.repo.save(created);
    this.logger.log(
      `Opened register session: id=${saved.id} dispensary=${saved.dispensaryId} user=${saved.openedByUserId} opening=$${(saved.openingCashCents / 100).toFixed(2)}`,
    );
    return saved;
  }

  async close(input: CloseRegisterSessionInput): Promise<RegisterSession> {
    if (input.closingCashCents < 0) {
      throw new BadRequestException('closingCashCents cannot be negative');
    }

    const session = await this.repo.findOne({
      where: { id: input.sessionId },
    });
    if (!session) {
      throw new NotFoundException('Register session not found');
    }
    if (session.openedByUserId !== input.userId) {
      throw new BadRequestException(
        'A register session can only be closed by the user who opened it',
      );
    }
    if (session.status === 'closed') {
      throw new ConflictException('Register session is already closed');
    }

    session.status = 'closed';
    session.closingCashCents = input.closingCashCents;
    session.closedAt = new Date();
    const saved = await this.repo.save(session);

    const variance =
      saved.closingCashCents != null
        ? saved.closingCashCents - saved.openingCashCents
        : 0;
    this.logger.log(
      `Closed register session: id=${saved.id} closing=$${(saved.closingCashCents! / 100).toFixed(2)} variance=$${(variance / 100).toFixed(2)}`,
    );
    return saved;
  }
}
