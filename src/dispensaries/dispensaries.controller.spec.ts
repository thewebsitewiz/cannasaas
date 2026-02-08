import { Test, TestingModule } from '@nestjs/testing';
import { DispensariesController } from './dispensaries.controller';

describe('DispensariesController', () => {
  let controller: DispensariesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispensariesController],
    }).compile();

    controller = module.get<DispensariesController>(DispensariesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
