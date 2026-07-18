// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { buildProjects, projectSectionId, type LabProjectSource, type WorkProjectSource } from '../src/domain/projects';

const work = (overrides: Partial<WorkProjectSource> = {}): WorkProjectSource => ({
  id: 'workflow-assistant',
  collection: 'work',
  data: {
    title: 'Workflow assistant',
    summary: 'A verified workflow prototype.',
    publishedAt: new Date('2026-07-18'),
    draft: false,
    problem: 'Teams cannot find approved guidance quickly.',
    role: 'AI application developer',
    solution: 'A retrieval-assisted workflow.',
    stack: ['TypeScript', 'Astro'],
    contributions: ['Designed the retrieval flow.'],
    status: 'validated',
    featured: false,
  },
  ...overrides,
});

const lab = (overrides: Partial<LabProjectSource> = {}): LabProjectSource => ({
  id: 'routing-lab',
  collection: 'lab',
  data: {
    title: 'Routing experiment',
    summary: 'Compares routing strategies.',
    publishedAt: new Date('2026-07-19'),
    draft: false,
    hypothesis: 'Explicit routing improves repeatability.',
    workflow: ['Classify', 'Execute', 'Evaluate'],
    modelOrTools: ['TypeScript'],
    result: 'A baseline was established.',
    evaluation: 'Measured with fixed fixtures.',
    status: 'prototype',
  },
  ...overrides,
});

describe('project domain', () => {
  it('merges only published work and lab entries newest first without mutating sources', () => {
    const sources = [work(), lab(), work({ id: 'draft-work', data: { ...work().data, draft: true } })];

    const projects = buildProjects(sources, true);

    expect(projects.map((project) => project.id)).toEqual(['routing-lab', 'workflow-assistant']);
    expect(sources.map((source) => source.id)).toEqual(['workflow-assistant', 'routing-lab', 'draft-work']);
  });

  it('uses ids as a deterministic tie breaker for equal publication dates', () => {
    const sameDay = new Date('2026-07-18');

    expect(
      buildProjects(
        [
          work({ id: 'zeta', data: { ...work().data, publishedAt: sameDay } }),
          work({ id: 'alpha', data: { ...work().data, publishedAt: sameDay } }),
        ],
        true,
      ).map((project) => project.id),
    ).toEqual(['alpha', 'zeta']);
  });

  it('rejects duplicate ids case-insensitively before route generation', () => {
    expect(() => buildProjects([work({ id: 'Same-id' }), lab({ id: 'same-ID' })], true)).toThrow(/duplicate/i);
  });

  it('rejects duplicate ids using the same trimmed, case-folded route identity', () => {
    expect(() => buildProjects([work({ id: 'alpha' }), lab({ id: ' alpha ' })], true)).toThrow(/duplicate/i);
    expect(() => buildProjects([work({ id: 'ALPHA' }), lab({ id: 'alpha' })], true)).toThrow(/duplicate/i);
  });

  it('normalizes Unicode-equivalent route ids before duplicate detection and rejects unsafe ids first', () => {
    expect(() => buildProjects([work({ id: 'caf\u00e9' }), lab({ id: 'cafe\u0301' })], true)).toThrow(/duplicate/i);
    expect(() => buildProjects([work({ id: ' unsafe/id ' }), lab({ id: 'unsafe/id' })], true)).toThrow(/safe/i);
  });

  it('rejects ids that cannot create safe project routes', () => {
    expect(() => buildProjects([work({ id: 'nested/project' })], true)).toThrow(/safe/i);
  });

  it('creates truthful kind metadata and ordered work detail sections', () => {
    const [project] = buildProjects(
      [
        work({
          data: {
            ...work().data,
            constraints: ['No runtime API'],
            architecture: 'Static content and native enhancement.',
            outcomes: ['A repeatable baseline.'],
            limitations: ['Requires review.'],
            nextSteps: ['Broaden evaluation coverage.'],
          },
        }),
      ],
      true,
    );

    expect(project).toMatchObject({
      kind: 'work',
      kindLabel: '项目',
      statusLabel: '已验证',
      year: '2026',
      href: '/projects/workflow-assistant/',
      role: 'AI application developer',
      tools: ['TypeScript', 'Astro'],
    });
    expect(project?.detailSections.map((section) => section.key)).toEqual([
      'problem',
      'constraints',
      'role',
      'solution',
      'architecture',
      'contributions',
      'outcomes',
      'limitations',
      'nextSteps',
    ]);
  });

  it('labels labs as experiments and never exposes a work role or empty optional sections', () => {
    const [project] = buildProjects([lab()], true);

    expect(project?.kind).toBe('lab');
    expect(project?.kindLabel).toBe('实验');
    expect(project?.kindLabel).not.toMatch(/客户项目|正式项目/);
    expect(project).not.toHaveProperty('role');
    expect(project?.detailSections.map((section) => section.key)).toEqual([
      'hypothesis',
      'workflow',
      'tools',
      'result',
      'evaluation',
    ]);
  });

  it('preserves confirmed optional project links and creates safe detail section ids', () => {
    const [project] = buildProjects(
      [
        work({
          id: 'workflow assistant',
          data: {
            ...work().data,
            repositoryUrl: 'https://github.com/zhou/workflow-assistant',
            demoUrl: 'https://example.com/workflow-assistant',
          },
        }),
      ],
      true,
    );

    expect(project).toMatchObject({
      repositoryUrl: 'https://github.com/zhou/workflow-assistant',
      demoUrl: 'https://example.com/workflow-assistant',
    });
    expect(projectSectionId('workflow assistant', 'problem')).toBe('project-problem');
  });
});
