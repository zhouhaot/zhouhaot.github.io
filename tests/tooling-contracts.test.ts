import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('tooling contracts', () => {
  it('formats and lints production scripts including ESM files', () => {
    const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts.format).toContain('scripts/**/*.{js,mjs}');
    expect(packageJson.scripts['format:check']).toContain('scripts/**/*.{js,mjs}');
    expect(packageJson.scripts.lint).toMatch(/\bscripts\//);
  });
});
