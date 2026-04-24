import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let $connectSpy: jest.SpiedFunction<PrismaService['$connect']>;
  let $disconnectSpy: jest.SpiedFunction<PrismaService['$disconnect']>;

  beforeEach(async () => {
    $connectSpy = jest
      .spyOn(PrismaService.prototype, '$connect')
      .mockResolvedValue(undefined);
    $disconnectSpy = jest
      .spyOn(PrismaService.prototype, '$disconnect')
      .mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit connects to the database', async () => {
    await service.onModuleInit();
    expect($connectSpy).toHaveBeenCalled();
  });

  it('onModuleDestroy disconnects from the database', async () => {
    await service.onModuleDestroy();
    expect($disconnectSpy).toHaveBeenCalled();
  });
});
