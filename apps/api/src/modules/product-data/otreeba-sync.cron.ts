import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OtreebaService } from './otreeba.service';

@Injectable()
export class OtreebaSyncCron {
  private readonly logger = new Logger(OtreebaSyncCron.name);

  constructor(private readonly otreeba: OtreebaService) {}

  // Weekly Sundays at 4AM — refresh strain data
  @Cron('0 4 * * 0')
  async weeklyStrainSync(): Promise<void> {
    this.logger.log('Starting weekly Otreeba strain sync...');

    let totalImported = 0;
    let totalSkipped = 0;

    // Import multiple pages
    for (let page = 0; page < 10; page++) {
      const result = await this.otreeba.bulkImportStrains({ page, count: 50 });
      totalImported += result.imported;
      totalSkipped += result.skipped;

      if (result.total < 50) break; // Last page
    }

    this.logger.log(`Weekly sync complete: ${totalImported} imported, ${totalSkipped} skipped`);
  }
}
