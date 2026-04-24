import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { StorageService } from './storage.service';

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: jest.fn(),
    promises: {
      ...actual.promises,
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    },
  };
});

const mockedFs = fs as jest.Mocked<typeof import('fs')> & {
  existsSync: jest.Mock;
  promises: typeof fs.promises & {
    mkdir: jest.Mock;
    writeFile: jest.Mock;
  };
};

describe('StorageService', () => {
  let service: StorageService;
  const mockConfig = { get: jest.fn() };

  beforeEach(async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.promises.mkdir.mockClear();
    mockedFs.promises.writeFile.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates assets dir when missing then writes file and returns URL', async () => {
    mockConfig.get.mockReturnValue(undefined);
    mockedFs.existsSync.mockReturnValue(false);

    const url = await service.saveProfileImage(
      {
        originalname: 'pic.png',
        buffer: Buffer.from('x'),
      } as Express.Multer.File,
      'http://localhost:3000',
    );

    expect(mockedFs.promises.mkdir).toHaveBeenCalled();
    expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    const writeCalls = mockedFs.promises.writeFile.mock
      .calls as unknown as Array<[string, Buffer]>;
    const writePath = writeCalls[0][0];
    expect(writePath).toMatch(/pic\.png$/);
    expect(url).toMatch(/^http:\/\/localhost:3000\/assets\/\d+-pic\.png$/);
  });

  it('skips mkdir when assets dir already exists', async () => {
    mockConfig.get.mockReturnValue(undefined);
    mockedFs.existsSync.mockReturnValue(true);

    await service.saveProfileImage(
      {
        originalname: 'a.jpg',
        buffer: Buffer.from(''),
      } as Express.Multer.File,
      'https://api.example.com',
    );

    expect(mockedFs.promises.mkdir).not.toHaveBeenCalled();
    expect(mockedFs.promises.writeFile).toHaveBeenCalled();
  });
});
