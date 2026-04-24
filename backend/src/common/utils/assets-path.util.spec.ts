import { join, resolve } from 'path';
import { resolveAssetsDir } from './assets-path.util';

describe('resolveAssetsDir', () => {
  const cwd = process.cwd();

  it('defaults to src/assets under cwd when unset', () => {
    expect(resolveAssetsDir()).toBe(join(cwd, 'src', 'assets'));
  });

  it('joins relative path to cwd', () => {
    expect(resolveAssetsDir('var/uploads')).toBe(join(cwd, 'var/uploads'));
  });

  it('returns absolute path unchanged', () => {
    const abs = resolve('/tmp/chatty-assets');
    expect(resolveAssetsDir(abs)).toBe(abs);
  });
});
