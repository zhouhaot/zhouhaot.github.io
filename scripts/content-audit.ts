import { execFile as execFileCb } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { promisify } from 'node:util';
import { auditContentRepository, auditMediaGitChanges, parseGitMediaChanges } from '../src/domain/content-audit';

const execFile = promisify(execFileCb);

const args = process.argv.slice(2);
const baseRefIndex = args.indexOf('--base-ref');
const baseRef = baseRefIndex !== -1 ? args[baseRefIndex + 1] : undefined;

const root = process.cwd();

async function main(): Promise<void> {
  let deletedAssetSources: string[] | undefined;

  if (baseRef) {
    const { stdout } = await execFile('git', [
      'diff',
      '--name-status',
      '--find-renames',
      `${baseRef}...HEAD`,
      '--',
      'src/assets/content',
    ]);
    const changes = parseGitMediaChanges(stdout);
    const currentSizes = new Map<string, number>();
    for (const change of changes) {
      const paths =
        change.status === 'A'
          ? [change.path]
          : change.status === 'R'
            ? [change.newPath]
            : [];
      for (const path of paths) {
        const absPath = join(root, path);
        try {
          const stat = statSync(absPath);
          currentSizes.set(path, stat.size);
        } catch {
          // fail closed handled in auditMediaGitChanges
        }
      }
    }
    const delta = auditMediaGitChanges(changes, currentSizes);
    deletedAssetSources = delta.deletedPaths.map((p) =>
      relative(join(root, 'src/assets/content'), join(root, p)).split('\\').join('/'),
    );
  }

  const auditOptions = deletedAssetSources
    ? { root: resolve('.'), deletedAssetSources }
    : { root: resolve('.') };
  const report = await auditContentRepository(auditOptions);

  const { works, notes } = report.entryCounts;
  console.log(
    `Content audit passed: works=${works} notes=${notes} assets=${report.assetCount} orphans=${report.orphanAssets.length}`,
  );
  for (const orphan of report.orphanAssets) {
    console.log(`Orphan content asset: ${orphan}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Content audit failed: ${message}`);
  process.exitCode = 1;
});
