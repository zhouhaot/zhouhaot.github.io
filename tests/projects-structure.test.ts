// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('projects route structure', () => {
  it('keeps server-rendered cards within the filter enhancement boundary', () => {
    const page = readFileSync(resolve('src/pages/projects/index.astro'), 'utf8');
    const filters = readFileSync(resolve('src/components/projects/ProjectFilters.astro'), 'utf8');

    expect(filters).toContain('<slot />');
    expect(page).toMatch(
      /<ProjectFilters projects=\{projects\}>[\s\S]*<div class="projects-grid">[\s\S]*<\/ProjectFilters>/,
    );
  });

  it('uses an id helper and only renders confirmed detail links', () => {
    const detail = readFileSync(resolve('src/components/projects/ProjectDetail.astro'), 'utf8');

    expect(detail).toContain('projectSectionId');
    expect(detail).toMatch(/project\.repositoryUrl\s*&&/);
    expect(detail).toMatch(/project\.demoUrl\s*&&/);
  });
});
