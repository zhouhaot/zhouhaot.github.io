import { readFileSync } from 'node:fs';
import { satisfies } from 'semver';
import { describe, expect, it } from 'vitest';

const minimumNode = '22.12.0';
const supportedPlatforms = [
  { os: 'linux', cpu: 'x64' },
  { os: 'win32', cpu: 'x64' },
] as const;

type LockPackage = {
  cpu?: string[];
  engines?: { node?: string };
  optional?: boolean;
  os?: string[];
};

function matchesSelector(selectors: readonly string[] | undefined, value: string): boolean {
  if (!selectors?.length) return true;
  if (selectors.includes(`!${value}`)) return false;
  const permitted = selectors.filter((selector) => !selector.startsWith('!'));
  return !permitted.length || permitted.includes(value);
}

function appliesTo(packageMetadata: LockPackage, platform: { os: string; cpu: string }): boolean {
  return matchesSelector(packageMetadata.os, platform.os) && matchesSelector(packageMetadata.cpu, platform.cpu);
}

describe('lock engine contract', () => {
  it('keeps every locked Node engine compatible with the declared minimum on supported platforms', () => {
    const lockfile = JSON.parse(readFileSync('package-lock.json', 'utf8')) as { packages: Record<string, LockPackage> };
    const incompatible = supportedPlatforms.flatMap((platform) =>
      Object.entries(lockfile.packages).flatMap(([path, metadata]) => {
        const range = metadata.engines?.node;
        return range && appliesTo(metadata, platform) && !satisfies(minimumNode, range)
          ? [`${platform.os}-${platform.cpu} ${path || 'root'}: ${range}`]
          : [];
      }),
    );

    expect(incompatible).toEqual([]);
  });

  it('does not skip optional packages that apply to a supported platform', () => {
    expect(appliesTo({ optional: true, os: ['linux'], cpu: ['x64'] }, { os: 'linux', cpu: 'x64' })).toBe(true);
    expect(appliesTo({ optional: true, os: ['win32'], cpu: ['ia32'] }, { os: 'win32', cpu: 'x64' })).toBe(false);
  });
});
