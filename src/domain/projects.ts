import { getCollection } from 'astro:content';
import { isPublicEntry } from './content';
import { projectRoute } from './routes';

type ProjectStatus = 'prototype' | 'validated' | 'shipped' | 'archived';

type SharedProjectData = {
  title: string;
  summary: string;
  publishedAt: Date;
  draft?: boolean | undefined;
  status: ProjectStatus;
  repositoryUrl?: string | undefined;
  demoUrl?: string | undefined;
};

export type WorkProjectData = SharedProjectData & {
  problem: string;
  constraints?: string[] | undefined;
  role: string;
  solution: string;
  architecture?: string | undefined;
  stack: string[];
  contributions: string[];
  outcomes?: string[] | undefined;
  limitations?: string[] | undefined;
  nextSteps?: string[] | undefined;
  featured?: boolean | undefined;
};

export type LabProjectData = SharedProjectData & {
  hypothesis: string;
  workflow: string[];
  modelOrTools: string[];
  result: string;
  evaluation: string;
};

export type WorkProjectSource = { id: string; collection: 'work'; data: WorkProjectData };
export type LabProjectSource = { id: string; collection: 'lab'; data: LabProjectData };
export type ProjectSource = WorkProjectSource | LabProjectSource;

export type ProjectDetailSection = {
  key:
    | 'problem'
    | 'constraints'
    | 'role'
    | 'solution'
    | 'architecture'
    | 'contributions'
    | 'outcomes'
    | 'limitations'
    | 'nextSteps'
    | 'hypothesis'
    | 'workflow'
    | 'tools'
    | 'result'
    | 'evaluation';
  title: string;
  content: string | string[];
};

type ProjectBase = {
  id: string;
  title: string;
  summary: string;
  publishedAt: Date;
  year: string;
  status: ProjectStatus;
  statusLabel: string;
  href: string;
  repositoryUrl?: string | undefined;
  demoUrl?: string | undefined;
  detailSections: ProjectDetailSection[];
};

export type PublicProject =
  | (ProjectBase & { kind: 'work'; kindLabel: '项目'; tools: string[]; role: string })
  | (ProjectBase & { kind: 'lab'; kindLabel: '实验'; tools: string[] });

const statusLabels: Record<ProjectStatus, string> = {
  prototype: '原型',
  validated: '已验证',
  shipped: '已交付',
  archived: '已归档',
};

function section(key: ProjectDetailSection['key'], title: string, content: string | string[]): ProjectDetailSection {
  return { key, title, content };
}

function workSections(data: WorkProjectData): ProjectDetailSection[] {
  const sections = [section('problem', '问题', data.problem)];

  if (data.constraints?.length) sections.push(section('constraints', '约束', data.constraints));
  sections.push(section('role', '职责', data.role), section('solution', '方案', data.solution));
  if (data.architecture) sections.push(section('architecture', '架构', data.architecture));
  sections.push(section('contributions', '关键实现', data.contributions));
  if (data.outcomes?.length) sections.push(section('outcomes', '结果', data.outcomes));
  if (data.limitations?.length) sections.push(section('limitations', '局限', data.limitations));
  if (data.nextSteps?.length) sections.push(section('nextSteps', '下一步', data.nextSteps));

  return sections;
}

function labSections(data: LabProjectData): ProjectDetailSection[] {
  return [
    section('hypothesis', '假设', data.hypothesis),
    section('workflow', '流程', data.workflow),
    section('tools', '工具', data.modelOrTools),
    section('result', '结果', data.result),
    section('evaluation', '评估', data.evaluation),
  ];
}

function assertUniqueSafeIds(entries: readonly ProjectSource[]): void {
  const seen = new Set<string>();

  for (const entry of entries) {
    projectRoute(entry.id);
    const normalized = entry.id.normalize('NFC').trim().toLowerCase();
    if (seen.has(normalized)) throw new Error(`Duplicate project id: ${entry.id}`);
    seen.add(normalized);
  }
}

function newestFirst(left: ProjectSource, right: ProjectSource): number {
  const dateDifference = right.data.publishedAt.valueOf() - left.data.publishedAt.valueOf();
  return dateDifference || left.id.localeCompare(right.id, 'en');
}

function toPublicProject(source: ProjectSource): PublicProject {
  const base: ProjectBase = {
    id: source.id,
    title: source.data.title,
    summary: source.data.summary,
    publishedAt: source.data.publishedAt,
    year: String(source.data.publishedAt.getFullYear()),
    status: source.data.status,
    statusLabel: statusLabels[source.data.status],
    href: projectRoute(source.id),
    repositoryUrl: source.data.repositoryUrl,
    demoUrl: source.data.demoUrl,
    detailSections: source.collection === 'work' ? workSections(source.data) : labSections(source.data),
  };

  return source.collection === 'work'
    ? { ...base, kind: 'work', kindLabel: '项目', role: source.data.role, tools: source.data.stack }
    : { ...base, kind: 'lab', kindLabel: '实验', tools: source.data.modelOrTools };
}

export function projectSectionId(_projectId: string, sectionKey: ProjectDetailSection['key']): string {
  return `project-${sectionKey}`;
}

export function buildProjects(entries: readonly ProjectSource[], production = import.meta.env.PROD): PublicProject[] {
  const published = entries.filter((entry) => isPublicEntry(entry.data, production));
  assertUniqueSafeIds(published);
  return [...published].sort(newestFirst).map(toPublicProject);
}

export async function getPublishedProjects(): Promise<PublicProject[]> {
  const [work, lab] = await Promise.all([
    getCollection('work', ({ data }) => isPublicEntry(data)),
    getCollection('lab', ({ data }) => isPublicEntry(data)),
  ]);

  return buildProjects(
    [
      ...work.map((entry) => ({ id: entry.id, collection: 'work' as const, data: entry.data })),
      ...lab.map((entry) => ({ id: entry.id, collection: 'lab' as const, data: entry.data })),
    ] as ProjectSource[],
    true,
  );
}
