import { describe, expect, it } from 'vitest';
import { PUBLIC_PROFILE } from '../src/domain/public-profile';

describe('anonymous public profile', () => {
  it('provides only approved professional copy and reusable capability, method, and status data', () => {
    expect(PUBLIC_PROFILE.positioning).toContain('zhou');
    expect(PUBLIC_PROFILE.capabilities).toHaveLength(4);
    expect(PUBLIC_PROFILE.method).toHaveLength(5);
    expect(PUBLIC_PROFILE.currentStatus).toContain('AI 应用');
    expect(PUBLIC_PROFILE.trustBoundary).toContain('GitHub');
  });

  it('does not expose identity, contact, education, customer proof, or result fields', () => {
    for (const marker of [
      'name',
      'avatar',
      'age',
      'gender',
      'location',
      'school',
      'degree',
      'employer',
      'resume',
      'email',
      'phone',
      'client',
      'testimonial',
      'metric',
    ]) {
      expect(PUBLIC_PROFILE).not.toHaveProperty(marker);
    }
    expect(JSON.stringify(PUBLIC_PROFILE)).not.toMatch(/@|mailto:|tel:|\d+%|客户|学历|简历/);
  });
});
