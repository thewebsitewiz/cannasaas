import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  DispensaryPaymentProcessor,
  DispensaryProcessorName,
  SELECTABLE_DISPENSARY_PROCESSORS,
} from './entities/dispensary-payment-processor.entity';

export interface SetEnabledInput {
  readonly dispensaryId: string;
  readonly processorName: DispensaryProcessorName;
  readonly isEnabled: boolean;
  readonly isSandbox?: boolean;
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

@Injectable()
export class DispensaryProcessorConfigService {
  private readonly logger = new Logger(DispensaryProcessorConfigService.name);

  constructor(
    @InjectRepository(DispensaryPaymentProcessor)
    private readonly repo: Repository<DispensaryPaymentProcessor>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  list(dispensaryId: string): Promise<DispensaryPaymentProcessor[]> {
    return this.repo.find({
      where: { dispensaryId },
      order: { processorName: 'ASC' },
    });
  }

  async getEnabled(
    dispensaryId: string,
  ): Promise<DispensaryPaymentProcessor[]> {
    return this.repo.find({
      where: { dispensaryId, isEnabled: true },
      order: { processorName: 'ASC' },
    });
  }

  async getActiveProcessor(
    dispensaryId: string,
  ): Promise<DispensaryProcessorName | null> {
    const rows = await rawQuery<{ active_payment_processor: string | null }>(
      this.dataSource,
      `SELECT active_payment_processor FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Dispensary not found');
    return (row.active_payment_processor as DispensaryProcessorName) ?? null;
  }

  async setEnabled(
    input: SetEnabledInput,
  ): Promise<DispensaryPaymentProcessor> {
    if (!SELECTABLE_DISPENSARY_PROCESSORS.includes(input.processorName)) {
      throw new BadRequestException(
        `Processor "${input.processorName}" is not user-selectable`,
      );
    }

    const existing = await this.repo.findOne({
      where: {
        dispensaryId: input.dispensaryId,
        processorName: input.processorName,
      },
    });

    if (existing) {
      existing.isEnabled = input.isEnabled;
      if (input.isSandbox !== undefined) existing.isSandbox = input.isSandbox;
      const saved = await this.repo.save(existing);
      this.logger.log(
        `Updated processor config: dispensary=${input.dispensaryId} processor=${input.processorName} enabled=${input.isEnabled}`,
      );
      return saved;
    }

    const created = this.repo.create({
      dispensaryId: input.dispensaryId,
      processorName: input.processorName,
      isEnabled: input.isEnabled,
      isSandbox: input.isSandbox ?? true,
    });
    const saved = await this.repo.save(created);
    this.logger.log(
      `Created processor config: dispensary=${input.dispensaryId} processor=${input.processorName} enabled=${input.isEnabled}`,
    );

    // If a processor is being disabled, clear it from active if currently active.
    if (!input.isEnabled) {
      const active = await this.getActiveProcessor(input.dispensaryId);
      if (active === input.processorName) {
        await this.setActiveProcessor({
          dispensaryId: input.dispensaryId,
          processorName: null,
        });
      }
    }

    return saved;
  }

  async setActiveProcessor(input: {
    readonly dispensaryId: string;
    readonly processorName: DispensaryProcessorName | null;
  }): Promise<DispensaryProcessorName | null> {
    if (input.processorName !== null) {
      if (!SELECTABLE_DISPENSARY_PROCESSORS.includes(input.processorName)) {
        throw new BadRequestException(
          `Processor "${input.processorName}" is not user-selectable`,
        );
      }
      const row = await this.repo.findOne({
        where: {
          dispensaryId: input.dispensaryId,
          processorName: input.processorName,
        },
      });
      if (!row || !row.isEnabled) {
        throw new BadRequestException(
          `Processor "${input.processorName}" must be enabled before it can be set active`,
        );
      }
    }

    const result = await rawQuery<{ active_payment_processor: string | null }>(
      this.dataSource,
      `UPDATE dispensaries
       SET active_payment_processor = $1, updated_at = NOW()
       WHERE entity_id = $2
       RETURNING active_payment_processor`,
      [input.processorName, input.dispensaryId],
    );

    if (result.length === 0)
      throw new NotFoundException('Dispensary not found');
    this.logger.log(
      `Set active processor: dispensary=${input.dispensaryId} processor=${input.processorName ?? '(none)'}`,
    );
    return input.processorName;
  }
}
