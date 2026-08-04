import matter from 'gray-matter';
import { noteSchema, siteProfileSchema, worksSchema } from './content-schema';
import { MEDIA_LICENSES } from './media';

export type ContractCollection = 'site' | 'works' | 'notes';
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
  field('experience[].company', 'string', 'optional'),
  field('experience[].role', 'string', 'optional'),
  field('experience[].period', 'string', 'optional'),
  field('experience[].description', 'text', 'optional'),
  field('skills[].group', 'string', 'optional'),
  field('skills[].items', 'string-list', 'optional'),
];

const worksFields: readonly ContractField[] = [
  field('kind', 'string', 'always', { enum: ['project', 'experiment'] }),
  field('tags', 'string-list', 'always'),
  field('status', 'string', 'always', { enum: ['prototype', 'validated', 'shipped', 'archived'] }),
  field('featured', 'boolean', 'optional', { default: false }),
  field('demoUrl', 'string', 'optional'),
  field('repositoryUrl', 'string', 'optional'),
  field('media', 'media-list', 'optional', { default: [] }),
];

export const CONTENT_CONTRACT = {
  site: {
    kind: 'singleton',
    source: 'src/content/site/profile.md',
    extension: 'md',
    create: false,
    fields: siteFields,
  },
  works: {
    kind: 'folder',
    source: 'src/content/works',
    extension: 'md',
    create: true,
    fields: [...sharedFields, ...worksFields, ...mediaFields('media[]')],
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
} as const satisfies Record<ContractCollection, CollectionContract>;

const schemas = {
  site: siteProfileSchema,
  works: worksSchema,
  notes: noteSchema,
} as const;

export function schemaForContractCollection(name: ContractCollection) {
  return schemas[name];
}

export function parseContractFixture(name: ContractCollection, source: string): unknown {
  return schemas[name].parse(matter(source).data);
}
