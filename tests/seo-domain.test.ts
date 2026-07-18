import { describe, expect, it } from 'vitest';
import { canonicalUrl } from '../src/domain/seo';

describe('canonical URL boundary', () => {
  it('rejects percent-encoded dot traversal segments before URL normalization', () => {
    for (const path of ['/%2e%2e/private/', '/articles/%2E%2E/notes/']) {
      expect(() => canonicalUrl(path)).toThrow(/safe absolute path/i);
    }
  });
});
