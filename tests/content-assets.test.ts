// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { path as ffprobePath } from 'ffprobe-static';
import { afterEach, describe, expect, it } from 'vitest';
import { createContentAssetRegistry } from '../src/domain/media';
import {
  auditContentAssets,
  assertRealPathInside,
  assertRegularAssetEntry,
  inspectSourceAsset,
  probeVideoDimensions,
} from '../src/domain/content-assets';

const roots: string[] = [];
afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const mp4Header = Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex');
const sized = (header: Buffer, bytes: number) => Buffer.concat([header, Buffer.alloc(bytes - header.byteLength)]);

describe('content asset registry', () => {
  it('normalizes Vite module paths under the one content root', () => {
    const registry = createContentAssetRegistry([
      ['/src/assets/content/work/qa-work-overview.webp', { src: '/_astro/overview.hash.webp', width: 2, height: 1 }],
      ['/src/assets/content/lab/qa-lab-demo.webm', '/_astro/demo.hash.webm'],
    ]);
    expect(registry.get('work/qa-work-overview.webp')?.src).toBe('/_astro/overview.hash.webp');
    expect(registry.get('lab/qa-lab-demo.webm')?.src).toBe('/_astro/demo.hash.webm');
  });

  it('detects a renamed executable before trusting its extension', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zhou-content-assets-'));
    roots.push(root);
    const file = join(root, 'work', 'qa-work-image.png');
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, Buffer.from('MZ executable fixture'));
    await expect(inspectSourceAsset(file, 'work/qa-work-image.png')).rejects.toThrow(/MIME|type/i);
  });

  it('parses injected video dimensions and ships an executable ffprobe on both CI hosts', async () => {
    expect(existsSync(ffprobePath)).toBe(true);
    expect(execFileSync(ffprobePath, ['-version'], { encoding: 'utf8' })).toMatch(/ffprobe version/i);
    const spacedRoot = mkdtempSync(join(tmpdir(), 'zhou content assets-'));
    roots.push(spacedRoot);
    const spacedMissingVideo = join(spacedRoot, 'folder with spaces', 'missing.webm');
    await expect(probeVideoDimensions(spacedMissingVideo)).rejects.toThrow();
    const probe = async () => ({ width: 1920, height: 1080 });
    await expect(probe()).resolves.toEqual({ width: 1920, height: 1080 });
  });

  it('enforces the exact image and video byte ceilings', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zhou content assets-'));
    roots.push(root);
    const image = join(root, 'work', 'qa-work-image.png');
    const video = join(root, 'work', 'qa-work-video.mp4');
    mkdirSync(join(root, 'work'), { recursive: true });
    writeFileSync(image, sized(onePixelPng, 5 * 1024 * 1024));
    writeFileSync(video, sized(mp4Header, 25 * 1024 * 1024));
    await expect(inspectSourceAsset(image, 'work/qa-work-image.png')).resolves.toMatchObject({ width: 1, height: 1 });
    await expect(
      inspectSourceAsset(video, 'work/qa-work-video.mp4', async () => ({ width: 2, height: 1 })),
    ).resolves.toMatchObject({ width: 2, height: 1 });
    writeFileSync(image, sized(onePixelPng, 5 * 1024 * 1024 + 1));
    writeFileSync(video, sized(mp4Header, 25 * 1024 * 1024 + 1));
    await expect(inspectSourceAsset(image, 'work/qa-work-image.png')).rejects.toThrow(/size/i);
    await expect(
      inspectSourceAsset(video, 'work/qa-work-video.mp4', async () => ({ width: 2, height: 1 })),
    ).rejects.toThrow(/size/i);
    await expect(inspectSourceAsset(image, 'work/qa-work-image.PNG')).rejects.toThrow(/type/i);
    await expect(inspectSourceAsset(image, 'work/qa-work-image.png.exe')).rejects.toThrow(/type/i);
  });

  it('rejects canonical-looking content with a hidden double extension', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zhou content assets-'));
    roots.push(root);
    const file = join(root, 'work', 'qa-work-foo.exe.png');
    mkdirSync(join(root, 'work'), { recursive: true });
    writeFileSync(file, onePixelPng);
    await expect(auditContentAssets(root)).rejects.toThrow(/canonical/i);
  });

  it('rejects symlinks, non-regular entries, and resolved paths outside the asset root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zhou content assets-'));
    roots.push(root);
    const outside = mkdtempSync(join(tmpdir(), 'zhou outside assets-'));
    roots.push(outside);
    mkdirSync(join(root, 'work'), { recursive: true });
    symlinkSync(outside, join(root, 'work', 'qa-work-link'), process.platform === 'win32' ? 'junction' : 'dir');
    await expect(auditContentAssets(root)).rejects.toThrow(/symbolic link/i);
    expect(() => assertRealPathInside(root, outside)).toThrow(/outside/i);
    expect(() =>
      assertRegularAssetEntry({ isSymbolicLink: () => false, isFile: () => false }, 'work/qa-work-device.png'),
    ).toThrow(/regular file/i);
  });
});
