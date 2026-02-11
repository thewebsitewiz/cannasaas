import { Test, TestingModule } from '@nestjs/testing';
import { DispensariesService } from './dispensaries.service';

describe('DispensariesService', () => {
  let service: DispensariesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DispensariesService],
    }).compile();

    service = module.get<DispensariesService>(DispensariesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
