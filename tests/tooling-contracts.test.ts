import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('tooling contracts', () => {
  it('formats and lints production scripts including ESM and TypeScript files', () => {
    const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts.format).toContain('scripts/**/*.{js,mjs,ts}');
    expect(packageJson.scripts['format:check']).toContain('scripts/**/*.{js,mjs,ts}');
    expect(packageJson.scripts.lint).toMatch(/\bscripts\//);
    expect(packageJson.scripts['audit:content']).toBe('tsx scripts/content-audit.ts');
  });

  it('requires audit:content before tests and dual npm audit in both CI workflows', () => {
    const ci = readFileSync(resolve('.github/workflows/ci.yml'), 'utf8');
    const deploy = readFileSync(resolve('.github/workflows/deploy.yml'), 'utf8');
    for (const workflow of [ci, deploy]) {
      expect(workflow).toMatch(
        /npm run check[\s\S]*npm run audit:content[\s\S]*npm test[\s\S]*npm run build[\s\S]*npm run audit:production/,
      );
      expect(workflow).toMatch(/npm audit --omit=dev --audit-level=high[\s\S]*npm audit --audit-level=high/);
    }
  });
});

