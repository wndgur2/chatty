import { isAbsolute, join } from 'path';

const DEFAULT_ASSETS_DIR = join('src', 'assets');

export function resolveAssetsDir(assetsDir?: string): string {
  if (!assetsDir) {
    return join(process.cwd(), DEFAULT_ASSETS_DIR);
  }
  return isAbsolute(assetsDir) ? assetsDir : join(process.cwd(), assetsDir);
}
