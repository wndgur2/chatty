import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { resolveAssetsDir } from '../../common/utils/assets-path.util';

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  private assetsDir(): string {
    return resolveAssetsDir(this.configService.get<string>('ASSETS_DIR'));
  }

  async saveProfileImage(
    file: Express.Multer.File,
    baseUrl: string,
  ): Promise<string> {
    const assetsDir = this.assetsDir();
    if (!fs.existsSync(assetsDir)) {
      await fs.promises.mkdir(assetsDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(assetsDir, fileName);
    await fs.promises.writeFile(filePath, file.buffer);
    return `${baseUrl}/assets/${fileName}`;
  }
}
