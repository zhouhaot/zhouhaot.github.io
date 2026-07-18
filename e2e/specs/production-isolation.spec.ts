import { expect, test } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function builtFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory() ? builtFiles(join(directory, entry.name)) : [join(directory, entry.name)],
    ),
  );
  return nested.flat();
}

test('normal production dist contains no fixture route, marker, or local test media', async () => {
  const files = await builtFiles('dist');
  const output = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  expect(output).not.toContain('[QA fixture]');
  expect(output).not.toContain('qa-fixture.svg');
  expect(output).not.toContain('e2e/fixtures');
});
