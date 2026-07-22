import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import matter from 'gray-matter';
import { labSchema, noteSchema, portfolioSchema, siteProfileSchema, workSchema } from './content-schema';
import { auditContentAssets, inspectSourceAsset } from './content-assets';
import { assertMarkdownMedia } from './markdown-media';
import type { ContentAsset } from './media';
import { mediaReferencesFor } from './media';
import { assertEntrySlug, assertPublishable } from './publication';
import {
  assertReferenceSafe,
  buildContentReferenceGraph,
  reportOrphanAssets,
  type ContentRecord,
} from './content-references';

export type ContentAuditOptions = {
  root: string;
  now?: Date;
  inspectAsset?: (file: string, source: string) => Promise<ContentAsset>;
  deletedAssetSources?: readonly string[];
};
export type ContentAuditReport = {
  entryCounts: Record<'work' | 'lab' | 'notes' | 'portfolio', number>;
  assetCount: number;
  orphanAssets: readonly string[];
};
export type GitMediaChange =
  | { status: 'A' | 'M' | 'D'; path: string }
  | { status: 'R' | 'C'; similarity: number; oldPath: string; newPath: string };
export type GitMediaDelta = { addedPaths: readonly string[]; deletedPaths: readonly string[]; addedBytes: number };

const folderSchemas = {
  work: workSchema,
  lab: labSchema,
  notes: noteSchema,
  portfolio: portfolioSchema,
} as const;
type FolderCollection = keyof typeof folderSchemas;
const FOLDER_COLLECTIONS: readonly FolderCollection[] = ['work', 'lab', 'notes', 'portfolio'];

async function loadFolderEntries(
  collection: FolderCollection,
  collectionDir: string,
  options: ContentAuditOptions,
): Promise<ContentRecord[]> {
  const schema = folderSchemas[collection];
  let filenames: string[];
  try {
    filenames = await readdir(collectionDir);
  } catch {
    return [];
  }
  const records: ContentRecord[] = [];
  for (const filename of filenames) {
    if (filename === '.gitkeep') continue;
    const ext = extname(filename);
    if (ext !== '.md' && ext !== '.mdx') continue;
    const id = filename.slice(0, -ext.length);
    const file = join(collectionDir, filename);
    const raw = await readFile(file, 'utf8');
    const { data, content: body } = matter(raw);
    const parsed = schema.parse(data);
    assertEntrySlug(collection, id, (parsed as { slug: string }).slug);
    assertPublishable(parsed as Parameters<typeof assertPublishable>[0], options.now);
    const mediaData = parsed as { media?: unknown; items?: unknown; slug?: string };
    const media = mediaReferencesFor(collection, mediaData.slug ?? id, mediaData as Parameters<typeof mediaReferencesFor>[2]);
    if (collection === 'notes') {
      assertMarkdownMedia(
        body,
        media.map((item) => item.source),
        ext === '.mdx' ? 'mdx' : 'md',
      );
    }
    records.push({
      collection,
      slug: (parsed as { slug: string }).slug,
      media,
      relatedProject: collection === 'portfolio' ? (parsed as { relatedProject?: string }).relatedProject : undefined,
    });
  }
  return records;
}

export async function auditContentRepository(options: ContentAuditOptions): Promise<ContentAuditReport> {
  const { root } = options;

  // Validate site singleton
  const siteDir = join(root, 'src/content/site');
  let siteFiles: string[];
  try {
    siteFiles = (await readdir(siteDir)).filter((f) => f !== '.gitkeep');
  } catch {
    siteFiles = [];
  }
  if (siteFiles.length !== 1 || siteFiles[0] !== 'profile.md') {
    throw new Error(`Site must contain exactly profile.md; found: ${siteFiles.join(', ') || '(none)'}`);
  }
  const profileRaw = await readFile(join(siteDir, 'profile.md'), 'utf8');
  siteProfileSchema.parse(matter(profileRaw).data);

  // Load all folder collections
  const allRecords: ContentRecord[] = [];
  const entryCounts: Record<FolderCollection, number> = { work: 0, lab: 0, notes: 0, portfolio: 0 };
  for (const collection of FOLDER_COLLECTIONS) {
    const records = await loadFolderEntries(collection, join(root, 'src/content', collection), options);
    entryCounts[collection] = records.length;
    allRecords.push(...records);
  }

  // Build asset registry
  const assetsRoot = join(root, 'src/assets/content');
  const assetInspect = options.inspectAsset ?? inspectSourceAsset;
  const assetRegistry = await auditContentAssets(assetsRoot, assetInspect);

  // Validate media dimensions against registry
  for (const record of allRecords) {
    for (const media of record.media) {
      const asset = assetRegistry.get(media.source);
      if (!asset) throw new Error(`Declared media asset is missing from registry: ${media.source}`);
      if (media.type === 'image' && asset.width !== undefined && asset.height !== undefined) {
        if (asset.width !== media.width || asset.height !== media.height) {
          throw new Error(`Media dimensions do not match asset: ${media.source} declared ${media.width}x${media.height} but asset is ${asset.width}x${asset.height}`);
        }
      }
      if (media.type === 'video') {
        const poster = assetRegistry.get(media.poster);
        if (!poster) throw new Error(`Declared video poster is missing from registry: ${media.poster}`);
      }
    }
  }

  // Build reference graph
  const graph = buildContentReferenceGraph(allRecords, [...assetRegistry.keys()]);

  // Check deleted asset sources are not referenced
  for (const deleted of options.deletedAssetSources ?? []) {
    if (graph.referencedAssets.has(deleted)) {
      throw new Error(`Cannot delete referenced asset: ${deleted}`);
    }
  }

  assertReferenceSafe(graph);
  const orphanAssets = reportOrphanAssets(graph);

  return { entryCounts, assetCount: assetRegistry.size, orphanAssets };
}

const PR_MEDIA_LIMIT = 50 * 1024 * 1024;

export function parseGitMediaChanges(output: string): readonly GitMediaChange[] {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [rawStatus, firstPath, secondPath] = line.split('\t');
      const rename = /^([RC])(\d{1,3})$/.exec(rawStatus ?? '');
      if (rename) {
        if (!firstPath || !secondPath) throw new Error(`Malformed Git media rename/copy row: ${line}`);
        return {
          status: rename[1] as 'R' | 'C',
          similarity: Number(rename[2]),
          oldPath: firstPath,
          newPath: secondPath,
        };
      }
      if (!/^[AMD]$/.test(rawStatus ?? '') || !firstPath || secondPath)
        throw new Error(`Malformed Git media change row: ${line}`);
      return { status: rawStatus as 'A' | 'M' | 'D', path: firstPath };
    });
}

export function auditMediaGitChanges(
  changes: readonly GitMediaChange[],
  currentSizes: ReadonlyMap<string, number>,
): GitMediaDelta {
  const overwrite = changes.find((change) => change.status === 'M' || change.status === 'C');
  if (overwrite) throw new Error('Content media overwrite/copy is forbidden; create a collision-safe new name.');
  const addedPaths = changes.flatMap((change) =>
    change.status === 'A' ? [change.path] : change.status === 'R' ? [change.newPath] : [],
  );
  const deletedPaths = changes.flatMap((change) =>
    change.status === 'D' ? [change.path] : change.status === 'R' ? [change.oldPath] : [],
  );
  let addedBytes = 0;
  for (const path of addedPaths) {
    const size = currentSizes.get(path);
    if (size === undefined) throw new Error(`Current stat/size is required for added content media: ${path}`);
    addedBytes += size;
  }
  if (addedBytes > PR_MEDIA_LIMIT) throw new Error(`Content media increase exceeds 50 MiB: ${addedBytes} bytes.`);
  return { addedPaths, deletedPaths, addedBytes };
}
