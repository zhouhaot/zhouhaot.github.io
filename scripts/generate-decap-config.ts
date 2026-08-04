/**
 * Generates cms-admin/config.yml from CONTENT_CONTRACT.
 * This is the only place that knows the mapping between contract field types
 * and Decap widget names. Do not duplicate field names, enums, or defaults by hand.
 *
 * Usage:
 *   npm run generate:decap
 *   ADMIN_URL=https://your-admin.pages.dev npm run generate:decap
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { CONTENT_CONTRACT, type ContractCollection } from '../src/domain/content-contract';
import type { ContractField } from '../src/domain/content-contract';

// ─── Labels ──────────────────────────────────────────────────────────────────

const LABEL: Record<string, string> = {
  slug: 'Slug',
  title: '标题',
  summary: '摘要',
  publishedAt: '发布日期',
  updatedAt: '更新日期',
  draft: '草稿模式',
  attestation: '发布声明',
  authenticityConfirmed: '已确认真实性',
  rightsConfirmed: '已确认版权',
  reviewedAt: '审核日期',
  evidenceUrls: '证据链接',
  problem: '问题描述',
  role: '角色',
  solution: '解决方案',
  stack: '技术栈',
  contributions: '贡献',
  status: '状态',
  featured: '精选',
  repositoryUrl: '仓库地址',
  demoUrl: '演示地址',
  architecture: '架构说明',
  constraints: '约束条件',
  outcomes: '成果',
  limitations: '局限性',
  nextSteps: '后续步骤',
  media: '媒体',
  type: '类型',
  source: '文件路径',
  alt: '替代文本',
  caption: '说明文字',
  width: '宽度',
  height: '高度',
  license: '许可证',
  poster: '封面图',
  credit: '版权归属',
  licenseUrl: '许可证链接',
  evidenceUrl: '证据链接',
  tags: '标签',
  kind: '种类',
  href: '链接',
  label: '标签',
  experience: '工作经历',
  company: '公司',
  period: '时间段',
  description: '描述',
  skills: '技能',
  group: '分组',
  items: '子项目',
};

const COLLECTION_LABEL: Record<ContractCollection, [string, string]> = {
  site:  ['站点信息', '站点信息'],
  works: ['作品', '作品'],
  notes: ['博客文章', '博客文章'],
};

function fieldLabel(name: string): string {
  return LABEL[name] ?? name;
}

// ─── Field node types ─────────────────────────────────────────────────────────

type ScalarNode = {
  kind: 'scalar';
  name: string;
  field: ContractField;
};
type ObjectNode = {
  kind: 'object';
  name: string;
  required: 'always' | 'publish' | 'optional';
  children: FieldNode[];
};
type ListNode = {
  kind: 'list';
  name: string;
  field: ContractField; // the list container field
  itemChildren: FieldNode[];
};
type FieldNode = ScalarNode | ObjectNode | ListNode;

// ─── Path parsing ─────────────────────────────────────────────────────────────

function parseFirstSegment(path: string): { name: string; rest: string | null; isList: boolean } {
  // e.g. "attestation.reviewedAt" → { name: 'attestation', rest: 'reviewedAt', isList: false }
  // e.g. "media[].type" → { name: 'media', rest: 'type', isList: true }
  // e.g. "slug" → { name: 'slug', rest: null, isList: false }
  const listMatch = /^([^[.]+)\[\]\.?(.*)$/.exec(path);
  if (listMatch) return { name: listMatch[1]!, rest: listMatch[2] || null, isList: true };
  const dotMatch = /^([^.]+)\.(.+)$/.exec(path);
  if (dotMatch) return { name: dotMatch[1]!, rest: dotMatch[2]!, isList: false };
  return { name: path, rest: null, isList: false };
}

// ─── Build field tree ─────────────────────────────────────────────────────────

function buildFieldTree(fields: readonly ContractField[]): FieldNode[] {
  const nodes: FieldNode[] = [];
  const seenObjects = new Map<string, ObjectNode>();
  const seenLists = new Map<string, ListNode>();

  for (const field of fields) {
    const { name, rest, isList } = parseFirstSegment(field.path);

    if (rest === null) {
      if (field.type === 'media-list' || field.type === 'object-list' || field.type === 'string-list') {
        // List container field — create or update the single ListNode for this name
        const existing = seenLists.get(name);
        if (!existing) {
          const listNode: ListNode = { kind: 'list', name, field, itemChildren: [] };
          seenLists.set(name, listNode);
          nodes.push(listNode);
        } else {
          existing.field = field; // update placeholder with real contract field
        }
      } else {
        // Top-level scalar
        nodes.push({ kind: 'scalar', name, field });
      }
      continue;
    }

    if (isList) {
      // List item child
      let listNode = seenLists.get(name);
      if (!listNode) {
        const containerField: ContractField = {
          path: name,
          type: 'media-list',
          required: 'optional',
          default: [],
        };
        listNode = { kind: 'list', name, field: containerField, itemChildren: [] };
        seenLists.set(name, listNode);
        nodes.push(listNode);
      }
      if (rest) {
        const childField: ContractField = { ...field, path: rest };
        listNode.itemChildren.push(...buildFieldTree([childField]));
      }
    } else {
      // Object child
      let objNode = seenObjects.get(name);
      if (!objNode) {
        objNode = { kind: 'object', name, required: field.required, children: [] };
        seenObjects.set(name, objNode);
        nodes.push(objNode);
      }
      const childField: ContractField = { ...field, path: rest };
      objNode.children.push(...buildFieldTree([childField]));
    }
  }

  return nodes;
}

// ─── Serialize to YAML object ──────────────────────────────────────────────────

type YamlField = Record<string, unknown>;

function serializeHint(field: ContractField): string | undefined {
  if (field.required === 'publish') return '发布前必填';
  return undefined;
}

function nodeToYaml(node: FieldNode): YamlField {
  if (node.kind === 'scalar') {
    const { field } = node;
    const entry: YamlField = {
      name: node.name,
      label: fieldLabel(node.name),
      widget: widgetForType(field),
      required: field.required === 'always',
    };
    if (field.default !== undefined) entry['default'] = field.default;
    if (field.enum) entry['options'] = [...field.enum];
    if (field.type === 'date') {
      entry['widget'] = 'datetime';
      entry['date_format'] = 'YYYY-MM-DD';
      entry['time_format'] = false;
    }
    if (field.type === 'number') {
      entry['value_type'] = 'int';
    }
    if (field.type === 'string-list') {
      entry['widget'] = 'list';
      entry['field'] = { name: 'item', label: '项目', widget: 'string' };
    }
    const hint = serializeHint(field);
    if (hint) entry['hint'] = hint;
    return entry;
  }

  if (node.kind === 'object') {
    return {
      name: node.name,
      label: fieldLabel(node.name),
      widget: 'object',
      required: node.required === 'always',
      fields: node.children.map(nodeToYaml),
    };
  }

  // list node
  const listEntry: YamlField = {
    name: node.name,
    label: fieldLabel(node.name),
    widget: 'list',
    required: node.field.required === 'always',
  };
  if (node.field.default !== undefined) listEntry['default'] = node.field.default;
  if (node.itemChildren.length > 0) {
    listEntry['fields'] = node.itemChildren.map(nodeToYaml);
  } else {
    listEntry['field'] = { name: 'item', label: '项目', widget: 'string' };
  }
  return listEntry;
}

function widgetForType(field: ContractField): string {
  switch (field.type) {
    case 'string': return field.enum ? 'select' : 'string';
    case 'text': return 'text';
    case 'date': return 'datetime';
    case 'boolean': return 'boolean';
    case 'number': return 'number';
    case 'string-list': return 'list';
    case 'object-list': return 'list';
    case 'media-list': return 'list';
  }
}

// ─── Build collections ────────────────────────────────────────────────────────

function buildCollection(name: ContractCollection): YamlField {
  const contract = CONTENT_CONTRACT[name];
  const [label] = COLLECTION_LABEL[name];
  const nodes = buildFieldTree(contract.fields);
  const fields = nodes.map(nodeToYaml);

  if (contract.kind === 'singleton') {
    return {
      name,
      label,
      files: [
        {
          name: 'profile',
          label: label,
          file: contract.source,
          fields,
        },
      ],
    };
  }

  return {
    name,
    label,
    label_singular: COLLECTION_LABEL[name][1],
    folder: contract.source,
    create: contract.create,
    extension: contract.extension,
    format: 'frontmatter',
    slug: '{{slug}}',
    identifier_field: 'slug',
    fields,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const adminUrl = process.env['ADMIN_URL'] ?? 'https://cms-admin.pages.dev';
const siteUrl = process.env['SITE_URL'] ?? 'https://zhouhaot.github.io';
const repo = process.env['GITHUB_REPO'] ?? 'zhouhaot/zhouhaot.github.io';

const config = {
  backend: {
    name: 'github',
    repo,
    branch: 'main',
    base_url: adminUrl,
    auth_endpoint: '/oauth',
  },
  publish_mode: 'editorial_workflow',
  media_folder: 'src/assets/content',
  public_folder: '/src/assets/content',
  site_url: siteUrl,
  display_url: siteUrl,
  collections: (
    ['site', 'works', 'notes'] as ContractCollection[]
  ).map(buildCollection),
};

// Serialize using js-yaml for clean, consistent output
import jsYaml from 'js-yaml';
const yamlStr = `# AUTO-GENERATED — do not edit by hand.\n# Source: src/domain/content-contract.ts + scripts/generate-decap-config.ts\n# Regenerate: npm run generate:decap\n\n${jsYaml.dump(config, { lineWidth: 120, noRefs: true })}`;

const outFile = resolve('cms-admin/config.yml');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, yamlStr, 'utf8');
console.log(`Generated: ${outFile}`);
