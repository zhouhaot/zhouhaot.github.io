import matter from 'gray-matter';
import {
  labSchema,
  noteSchema,
  portfolioSchema,
  siteProfileSchema,
  workSchema,
} from './content-schema';
import { MEDIA_LICENSES } from './media';

export type ContractCollection = 'site' | 'work' | 'lab' | 'notes' | 'portfolio';
export type ContractField = {
  path: string;
  type: 'string' | 'text' | 'date' | 'boolean' | 'number' | 'string-list' | 'object-list' | 'media-list';
  required: 'always' | 'publish' | 'optional';
  default?: unknown;
  enum?: readonly string[];
};
type CollectionContract = {
  kind: 'singleton' | 'folder';
  source: string;
  extension: 'md';
  create: boolean;
  fields: readonly ContractField[];
};

const field = (
  path: string,
  type: ContractField['type'],
  required: ContractField['required'],
  options: Pick<ContractField, 'default' | 'enum'> = {},
): ContractField => ({ path, type, required, ...options });

const sharedFields: readonly ContractField[] = [
  field('slug', 'string', 'always'),
  field('title', 'string', 'always'),
  field('summary', 'text', 'always'),
  field('publishedAt', 'date', 'always'),
  field('updatedAt', 'date', 'optional'),
  field('draft', 'boolean', 'optional', { default: true }),
  field('attestation.authenticityConfirmed', 'boolean', 'always', { default: false }),
  field('attestation.rightsConfirmed', 'boolean', 'always', { default: false }),
  field('attestation.reviewedAt', 'date', 'publish'),
  field('attestation.evidenceUrls', 'string-list', 'optional', { default: [] }),
];

const mediaFields = (prefix: string): readonly ContractField[] => [
  field(`${prefix}.type`, 'string', 'always', { enum: ['image', 'video'] }),
  field(`${prefix}.source`, 'string', 'always'),
  field(`${prefix}.alt`, 'string', 'always'),
  field(`${prefix}.caption`, 'string', 'always'),
  field(`${prefix}.width`, 'number', 'always'),
  field(`${prefix}.height`, 'number', 'always'),
  field(`${prefix}.license`, 'string', 'always', { enum: [...MEDIA_LICENSES] }),
  field(`${prefix}.poster`, 'string', 'publish'),
  field(`${prefix}.credit`, 'string', 'publish'),
  field(`${prefix}.licenseUrl`, 'string', 'publish'),
  field(`${prefix}.evidenceUrl`, 'string', 'publish'),
];

const siteFields: readonly ContractField[] = [
  field('heroEyebrow', 'string', 'always'),
  field('heroTitle', 'string', 'always'),
  field('role', 'string', 'always'),
  field('heroSummary', 'text', 'always'),
  field('positioning', 'text', 'always'),
  field('capabilities', 'string-list', 'always'),
  field('method', 'string-list', 'always'),
  field('principles', 'string-list', 'always'),
  field('currentStatus', 'text', 'always'),
  field('trustBoundary', 'text', 'always'),
  field('contacts[].label', 'string', 'always'),
  field('contacts[].kind', 'string', 'always', { enum: ['github', 'email', 'website'] }),
  field('contacts[].href', 'string', 'always'),
];

const workFields: readonly ContractField[] = [
  field('problem', 'text', 'always'),
  field('role', 'string', 'always'),
  field('solution', 'text', 'always'),
  field('stack', 'string-list', 'always'),
  field('contributions', 'string-list', 'always'),
  field('status', 'string', 'always', { enum: ['prototype', 'validated', 'shipped', 'archived'] }),
  field('featured', 'boolean', 'optional', { default: false }),
  field('repositoryUrl', 'string', 'optional'),
  field('demoUrl', 'string', 'optional'),
  field('architecture', 'text', 'optional'),
  field('constraints', 'string-list', 'optional'),
  field('media', 'media-list', 'optional', { default: [] }),
  field('outcomes', 'string-list', 'optional', { default: [] }),
  field('limitations', 'string-list', 'optional', { default: [] }),
  field('nextSteps', 'string-list', 'optional', { default: [] }),
];

const labFields: readonly ContractField[] = [
  field('hypothesis', 'text', 'always'),
  field('workflow', 'string-list', 'always'),
  field('modelOrTools', 'string-list', 'always'),
  field('status', 'string', 'always', { enum: ['prototype', 'validated', 'archived'] }),
  field('result', 'text', 'publish', { default: '' }),
  field('evaluation', 'text', 'publish', { default: '' }),
  field('repositoryUrl', 'string', 'optional'),
  field('demoUrl', 'string', 'optional'),
  field('media', 'media-list', 'optional', { default: [] }),
];

const portfolioFields: readonly ContractField[] = [
  field('order', 'number', 'always'),
  field('status', 'string', 'always', { enum: ['published', 'archived'] }),
  field('relatedProject', 'string', 'optional'),
  field('items', 'media-list', 'always'),
];

export const CONTENT_CONTRACT = {
  site: {
    kind: 'singleton',
    source: 'src/content/site/profile.md',
    extension: 'md',
    create: false,
    fields: siteFields,
  },
  work: {
    kind: 'folder',
    source: 'src/content/work',
    extension: 'md',
    create: true,
    fields: [...sharedFields, ...workFields, ...mediaFields('media[]')],
  },
  lab: {
    kind: 'folder',
    source: 'src/content/lab',
    extension: 'md',
    create: true,
    fields: [...sharedFields, ...labFields, ...mediaFields('media[]')],
  },
  notes: {
    kind: 'folder',
    source: 'src/content/notes',
    extension: 'md',
    create: true,
    fields: [
      ...sharedFields,
      field('tags', 'string-list', 'always'),
      field('media', 'media-list', 'optional', { default: [] }),
      ...mediaFields('media[]'),
    ],
  },
  portfolio: {
    kind: 'folder',
    source: 'src/content/portfolio',
    extension: 'md',
    create: true,
    fields: [...sharedFields, ...portfolioFields, ...mediaFields('items[]')],
  },
} as const satisfies Record<ContractCollection, CollectionContract>;

const schemas = {
  site: siteProfileSchema,
  work: workSchema,
  lab: labSchema,
  notes: noteSchema,
  portfolio: portfolioSchema,
} as const;

export function schemaForContractCollection(name: ContractCollection) {
  return schemas[name];
}

export function parseContractFixture(name: ContractCollection, source: string): unknown {
  return schemas[name].parse(matter(source).data);
}
