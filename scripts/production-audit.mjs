import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const MARKERS = /LAB\.LOG|VOID\.DEV|\b(?:TODO|TBD|sample|coming soon|contact@example|resume|education|customer|testimonial)\b/i;
const METRICS = /(?:\b\d+(?:\.\d+)?\s*%\s*(?:views?|likes?|read[ -]?time|users?|conversion|x\b|times?\b)?|\b\d+\s+(?:views?|likes?|users?)\b)/i;
const FIXTURES = /\[QA fixture\]|qa-fixture|\/notes\//i;
const ATTRIBUTED_MEDIA = /data-portfolio-media/i;
const ATTR = /\s([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(ATTR)].map(([, name, quoted, singleQuoted, bare]) => [name.toLowerCase(), quoted ?? singleQuoted ?? bare ?? '']),
  );
}

function visibleText(html) {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function outputTarget(root, value, source) {
  const pathname = value.split(/[?#]/, 1)[0];
  if (!pathname || pathname.startsWith('#')) return undefined;
  if (pathname.startsWith('/')) {
    const target = resolve(root, `.${pathname}`);
    if (relative(root, target).startsWith('..')) throw new Error(`Unsafe reference: ${value}`);
    if (existsSync(target)) return target;
    if (existsSync(resolve(target, 'index.html'))) return resolve(target, 'index.html');
    throw new Error(`Missing local reference ${value} in ${source}`);
  }
  const target = resolve(source, '..', pathname);
  if (relative(root, target).startsWith('..') || !existsSync(target)) throw new Error(`Missing local reference ${value} in ${source}`);
  return target;
}

function assertReference(root, file, html, tag, attributesMap) {
  for (const name of ['href', 'src', 'poster']) {
    const value = attributesMap[name];
    if (!value) continue;
    if (/^(?:javascript|data|vbscript):/i.test(value)) throw new Error(`Unsafe reference ${value} in ${file}`);
    if (/^https?:\/\//i.test(value)) {
      if (name !== 'href' || /<(?:img|video|audio|source|meta)\b/i.test(tag)) {
        throw new Error(`Remote media reference ${value} in ${file}`);
      }
      continue;
    }
    if (value.startsWith('#')) {
      const identifier = value.slice(1).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (!new RegExp(`\\bid=(?:"|')${identifier}(?:"|')`, 'i').test(html)) {
        throw new Error(`Missing fragment reference ${value} in ${file}`);
      }
      continue;
    }
    outputTarget(root, value, file);
  }
}

function assertMedia(file, tag, attributesMap) {
  if (/^<img\b/i.test(tag)) {
    if (!Object.hasOwn(attributesMap, 'alt') || !attributesMap.alt.trim()) throw new Error(`Image alt is required in ${file}`);
    if (!attributesMap.width || !attributesMap.height) throw new Error(`Image dimensions are required in ${file}`);
  }
  if (/^<video\b/i.test(tag) && !attributesMap.poster) throw new Error(`Video poster is required in ${file}`);
  if (ATTRIBUTED_MEDIA.test(tag)) {
    const license = attributesMap['data-license'];
    if (!['owned', 'licensed', 'cc-by', 'public-domain'].includes(license)) {
      throw new Error(`Invalid portfolio license in ${file}`);
    }
    if (license !== 'owned' && (!attributesMap['data-credit'] || !attributesMap['data-evidence'])) {
      throw new Error(`Portfolio attribution evidence is required in ${file}`);
    }
  }
}

export function auditProductionOutput(root = resolve('dist')) {
  const output = resolve(root);
  if (output.split(sep).at(-1) !== 'dist') throw new Error('Production audit is restricted to a dist directory.');
  if (!existsSync(output) || !statSync(output).isDirectory()) throw new Error(`Missing dist directory: ${output}`);

  for (const file of walk(output)) {
    const relativePath = relative(output, file).replaceAll('\\', '/');
    if (FIXTURES.test(relativePath)) throw new Error(`Production fixture leakage: ${relativePath}`);
    if (!/\.html?$/i.test(file)) continue;
    const html = readFileSync(file, 'utf8');
    const text = visibleText(html);
    if (MARKERS.test(text)) throw new Error(`Forbidden production marker in ${relativePath}`);
    if (METRICS.test(text)) throw new Error(`Unsupported visible metric in ${relativePath}`);
    if (FIXTURES.test(html)) throw new Error(`Production fixture leakage: ${relativePath}`);

    for (const match of html.matchAll(/<(?:a|area|link|img|video|audio|source|script|iframe|meta)\b[^>]*>/gi)) {
      const tag = match[0];
      const attrs = attributes(tag);
      assertReference(output, file, html, tag, attrs);
      assertMedia(file, tag, attrs);
    }
  }
}

if (process.argv[1]?.endsWith('production-audit.mjs')) {
  auditProductionOutput(process.argv[2] ?? resolve('dist'));
  process.stdout.write('Production output audit passed.\n');
}
