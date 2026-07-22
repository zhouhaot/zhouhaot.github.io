import { execFile } from 'node:child_process';
import type { Stats } from 'node:fs';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, sep } from 'node:path';
import { promisify } from 'node:util';
import { fileTypeFromBuffer } from 'file-type';
import { path as ffprobePath } from 'ffprobe-static';
import sharp from 'sharp';
import {
  assertCanonicalContentMediaPath,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  type ContentAssetRegistry,
  type ContentAsset,
} from './media';

const execFileAsync = promisify(execFile);
const IMAGE_LIMIT = 5 * 1024 * 1024;
const VIDEO_LIMIT = 25 * 1024 * 1024;
const expectedMime = new Map([
  ['avif', 'image/avif'],
  ['jpeg', 'image/jpeg'],
  ['jpg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
  ['mp4', 'video/mp4'],
  ['webm', 'video/webm'],
]);

export type VideoProbe = (file: string) => Promise<{ width: number; height: number }>;
export const probeVideoDimensions: VideoProbe = async (file) => {
  const { stdout } = await execFileAsync(
    ffprobePath,
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', file],
    { windowsHide: true },
  );
  const stream = (JSON.parse(stdout) as { streams?: { width?: number; height?: number }[] }).streams?.[0];
  if (!stream?.width || !stream.height) throw new Error(`Video dimensions are unavailable: ${file}`);
  return { width: stream.width, height: stream.height };
};

export async function inspectSourceAsset(
  file: string,
  source: string,
  probeVideo: VideoProbe = probeVideoDimensions,
): Promise<ContentAsset> {
  const bytes = await readFile(file);
  const extension = extname(source).slice(1);
  const detected = await fileTypeFromBuffer(bytes);
  const mime = expectedMime.get(extension);
  if (!mime || detected?.mime !== mime) throw new Error(`Media MIME/type mismatch: ${source}`);
  const image = IMAGE_EXTENSIONS.includes(extension as never);
  const video = VIDEO_EXTENSIONS.includes(extension as never);
  const limit = image ? IMAGE_LIMIT : video ? VIDEO_LIMIT : 0;
  if (!limit || bytes.byteLength > limit) throw new Error(`Media size/type is not allowed: ${source}`);
  const dimensions = image ? await sharp(bytes).metadata() : await probeVideo(file);
  if (!dimensions.width || !dimensions.height) throw new Error(`Media dimensions are unavailable: ${source}`);
  return { source, src: file, bytes: bytes.byteLength, mime, width: dimensions.width, height: dimensions.height };
}

export function assertRealPathInside(rootRealPath: string, candidateRealPath: string): void {
  const path = relative(rootRealPath, candidateRealPath);
  if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) {
    throw new Error(`Resolved content asset path is outside its root: ${candidateRealPath}`);
  }
}

export function assertRegularAssetEntry(stat: Pick<Stats, 'isSymbolicLink' | 'isFile'>, source: string): void {
  if (stat.isSymbolicLink()) throw new Error(`Content assets must not be symbolic links: ${source}`);
  if (!stat.isFile()) throw new Error(`Content assets must be regular files: ${source}`);
}

async function walk(rootRealPath: string, directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const file = join(directory, entry.name);
    const stat = await lstat(file);
    if (stat.isSymbolicLink()) throw new Error(`Content assets must not be symbolic links: ${file}`);
    const resolved = await realpath(file);
    assertRealPathInside(rootRealPath, resolved);
    if (stat.isDirectory()) files.push(...(await walk(rootRealPath, file)));
    else {
      assertRegularAssetEntry(stat, file);
      files.push(file);
    }
  }
  return files;
}

export async function discoverContentAssetFiles(root: string): Promise<string[]> {
  const rootStat = await lstat(root);
  if (rootStat.isSymbolicLink()) throw new Error(`Content asset root must not be a symbolic link: ${root}`);
  const rootRealPath = await realpath(root);
  return walk(rootRealPath, root);
}

export async function auditContentAssets(
  root: string,
  inspect: (file: string, source: string) => Promise<ContentAsset> = inspectSourceAsset,
): Promise<ContentAssetRegistry> {
  const registry = new Map<string, ContentAsset>();
  const rootRealPath = await realpath(root);
  for (const file of await discoverContentAssetFiles(root)) {
    assertRealPathInside(rootRealPath, await realpath(file));
    const source = relative(root, file).split(sep).join('/');
    if (source.endsWith('/.gitkeep')) continue;
    assertCanonicalContentMediaPath(source);
    const asset = await inspect(file, source);
    if (registry.has(source)) throw new Error(`Duplicate content asset: ${source}`);
    registry.set(source, asset);
  }
  return registry;
}
