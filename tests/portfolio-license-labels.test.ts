import { readFileSync } from 'node:fs';
import { portfolioLicenseLabel } from '../src/domain/portfolio';
import { describe, expect, it } from 'vitest';

describe('portfolio license labels', () => {
  it.each([
    ['owned', '自有'],
    ['licensed', '已获授权'],
    ['cc-by', '知识共享署名'],
    ['public-domain', '公共领域'],
  ] as const)('maps %s to a Chinese public label', (license, label) => {
    expect(portfolioLicenseLabel(license)).toBe(label);
  });

  it('keeps raw license enums in audit attributes while rendering the Chinese label in cards', () => {
    const gallery = readFileSync('src/components/portfolio/PortfolioGallery.astro', 'utf8');
    expect(gallery).toContain('data-license={item.license}');
    expect(gallery).toContain('portfolioLicenseLabel(item.license)');
  });
});
