// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  buildProjects,
  projectSectionId,
  projectStaticPaths,
  type LabProjectSource,
  type WorkProjectSource,
} from '../src/domain/projects';

const publication = (slug: string) => ({
  slug,
  draft: false,
  attestation: {
    authenticityConfirmed: true,
    rightsConfirmed: true,
    reviewedAt: new Date('2026-07-19'),
    evidenceUrls: [],
  },
});

function work(overrides: Record<string, unknown> = {}): WorkProjectSource {
  const id = (overrides.id as string) ?? 'workflow-assistant';
  const data = overrides.data as Record<string, unknown> | undefined;
  return {
    id,
    collection: 'work',
    data: {
      ...publication(id),
      title: 'Workflow assistant',
      summary: 'A verified workflow prototype.',
      publishedAt: new Date('2026-07-18'),
      problem: 'Teams cannot find approved guidance quickly.',
      role: 'AI application developer',
      solution: 'A retrieval-assisted workflow.',
      stack: ['TypeScript', 'Astro'],
      contributions: ['Designed the retrieval flow.'],
      status: 'validated',
      featured: false,
      ...data,
    },
  } as WorkProjectSource;
}

function lab(overrides: Record<string, unknown> = {}): LabProjectSource {
  const id = (overrides.id as string) ?? 'routing-lab';
  const data = overrides.data as Record<string, unknown> | undefined;
  return {
    id,
    collection: 'lab',
    data: {
      ...publication(id),
      title: 'Routing experiment',
      summary: 'Compares routing strategies.',
      publishedAt: new Date('2026-07-19'),
      hypothesis: 'Explicit routing improves repeatability.',
      workflow: ['Classify', 'Execute', 'Evaluate'],
      modelOrTools: ['TypeScript'],
      result: 'A baseline was established.',
      evaluation: 'Measured with fixed fixtures.',
      status: 'prototype',
      ...data,
    },
  } as LabProjectSource;
}

describe('project domain', () => {
  it('merges only published work and lab entries newest first without mutating sources', () => {
    const sources = [work(), lab(), work({ id: 'draft-work', data: { draft: true } })];

    const projects = buildProjects(sources, true);

    expect(projects.map((project) => project.id)).toEqual(['routing-lab', 'workflow-assistant']);
    expect(sources.map((source) => source.id)).toEqual(['workflow-assistant', 'routing-lab', 'draft-work']);
  });

  it('uses ids as a deterministic tie breaker for equal publication dates', () => {
    const sameDay = new Date('2026-07-18');

    expect(
      buildProjects(
        [
          work({ id: 'zeta', data: { publishedAt: sameDay } }),
          work({ id: 'alpha', data: { publishedAt: sameDay } }),
        ],
        true,
      ).map((project) => project.id),
    ).toEqual(['alpha', 'zeta']);
  });

  it('rejects duplicate ids case-insensitively before route generation', () => {
    expect(() => buildProjects([work({ id: 'same-id' }), lab({ id: 'same-id' })], true)).toThrow(/duplicate/i);
  });

  it('rejects non-canonical whitespace ids and case-folded duplicates', () => {
    expect(() => buildProjects([work({ id: 'alpha' }), lab({ id: ' alpha ' })], true)).toThrow(/slug/i);
    expect(() => buildProjects([work({ id: 'alpha' }), lab({ id: 'alpha' })], true)).toThrow(/duplicate/i);
  });

  it('rejects non-NFC ids and rejects unsafe ids first', () => {
    expect(() => buildProjects([work({ id: 'café' }), lab({ id: 'café' })], true)).toThrow(/slug/i);
    expect(() => buildProjects([work({ id: ' unsafe/id ' }), lab({ id: 'unsafe/id' })], true)).toThrow(/slug/i);
  });

  it('rejects non-canonical ids before static params can diverge from project hrefs', () => {
    expect(() => buildProjects([work({ id: ' alpha ' })], true)).toThrow(/slug/i);

    const [project] = buildProjects([work({ id: 'alpha' })], true);
    const [path] = projectStaticPaths(project ? [project] : []);
    expect(path?.params.id).toBe(project?.id);
    expect(path?.props.project.href).toBe('/projects/alpha/');
  });

  it('rejects ids that cannot create safe project routes', () => {
    expect(() => buildProjects([work({ id: 'nested/project' })], true)).toThrow(/slug/i);
  });

  it('creates truthful kind metadata and ordered work detail sections', () => {
    const [project] = buildProjects(
      [
        work({
          data: {
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
          id: 'workflow-assistant',
          data: {
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
    expect(projectSectionId('workflow-assistant', 'problem')).toBe('project-problem');
  });
});
