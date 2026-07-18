import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const MARKERS =
  /LAB\.LOG|VOID\.DEV|\b(?:TODO|TBD|sample|coming soon|contact@example|resume|education|customer|testimonial)\b/i;
const METRICS =
  /(?:\b\d+(?:\.\d+)?\s*%\s*(?:views?|likes?|read[ -]?time|users?|conversion)?|\b\d+(?:\.\d+)?\s*[x×](?!\w)|\b\d+\s+(?:views?|likes?|users?)\b|\b(?:\d+\s*(?:min(?:ute)?s?\s*)?)?read[ -]?time\b)/i;
const FIXTURES = /\[QA fixture\]|qa-fixture|\/notes\//i;
const ATTR = /\s([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
const MEDIA_META = /^(?:og|twitter):image(?::(?:url|secure_url))?$/i;
const MEDIA_JSON_KEYS = /"(?:image|thumbnailUrl|contentUrl|logo|video|embedUrl)"\s*:\s*"([^"]+)"/gi;

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(ATTR)].map(([, name, quoted, singleQuoted, bare]) => [
      name.toLowerCase(),
      quoted ?? singleQuoted ?? bare ?? '',
    ]),
  );
}

function visibleText(html) {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function isOutside(root, target) {
  const path = relative(root, target);
  return path === '..' || path.startsWith(`..${sep}`) || path.startsWith('../');
}

function splitReference(value) {
  const hash = value.indexOf('#');
  const beforeFragment = hash < 0 ? value : value.slice(0, hash);
  return { pathname: beforeFragment.split('?', 1)[0], fragment: hash < 0 ? '' : value.slice(hash + 1) };
}

function outputTarget(root, value, source) {
  const { pathname } = splitReference(value);
  if (!pathname) return source;
  const target = pathname.startsWith('/') ? resolve(root, `.${pathname}`) : resolve(source, '..', pathname);
  if (isOutside(root, target)) throw new Error(`Unsafe reference: ${value}`);

  const candidate = existsSync(target) && statSync(target).isDirectory() ? resolve(target, 'index.html') : target;
  if (!existsSync(candidate) || statSync(candidate).isDirectory())
    throw new Error(`Missing local reference ${value} in ${source}`);
  return candidate;
}

function assertFragment(target, fragment, value) {
  if (!fragment) return;
  const identifier = fragment.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  if (
    !/\.html?$/i.test(target) ||
    !new RegExp(`\\bid=(?:"|')${identifier}(?:"|')`, 'i').test(readFileSync(target, 'utf8'))
  ) {
    throw new Error(`Missing fragment reference ${value} in ${target}`);
  }
}

function assertMediaValue(root, file, value) {
  if (/^(?:javascript|data|vbscript):/i.test(value)) throw new Error(`Unsafe reference ${value} in ${file}`);
  if (/^https?:\/\//i.test(value)) throw new Error(`Remote media reference ${value} in ${file}`);
  return outputTarget(root, value, file);
}

function assertReference(root, file, tag, attrs) {
  for (const name of ['href', 'src', 'poster']) {
    const value = attrs[name];
    if (!value) continue;
    if (/^(?:javascript|data|vbscript):/i.test(value)) throw new Error(`Unsafe reference ${value} in ${file}`);
    if (/^https?:\/\//i.test(value)) {
      if (name !== 'href' || /<(?:img|video|audio|source|meta)\b/i.test(tag)) {
        throw new Error(`Remote media reference ${value} in ${file}`);
      }
      continue;
    }
    const target = outputTarget(root, value, file);
    assertFragment(target, splitReference(value).fragment, value);
  }

  if (/^<meta\b/i.test(tag) && MEDIA_META.test(attrs.property ?? attrs.name ?? '') && attrs.content) {
    assertMediaValue(root, file, attrs.content);
  }
  if (attrs.srcset) {
    for (const candidate of attrs.srcset.split(',').map((part) => part.trim().split(/\s+/, 1)[0])) {
      if (candidate) assertMediaValue(root, file, candidate);
    }
  }
}

function assertMedia(file, tag, attrs) {
  if (/^<img\b/i.test(tag)) {
    if (!Object.hasOwn(attrs, 'alt') || !attrs.alt.trim()) throw new Error(`Image alt is required in ${file}`);
    if (!attrs.width || !attrs.height) throw new Error(`Image dimensions are required in ${file}`);
  }
  if (/^<video\b/i.test(tag) && !attrs.poster) throw new Error(`Video poster is required in ${file}`);
  if (Object.hasOwn(attrs, 'data-portfolio-media')) {
    const license = attrs['data-license'];
    if (!['owned', 'licensed', 'cc-by', 'public-domain'].includes(license)) {
      throw new Error(`Invalid portfolio license in ${file}`);
    }
    if (license !== 'owned' && (!attrs['data-credit'] || !attrs['data-license-url'] || !attrs['data-evidence-url'])) {
      throw new Error(`Portfolio attribution evidence is required in ${file}`);
    }
  }
}

function assertCssUrls(root, file, css) {
  for (const [, doubleQuoted, singleQuoted, bare] of css.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/gi)) {
    const url = doubleQuoted ?? singleQuoted ?? bare;
    if (url) assertMediaValue(root, file, url);
  }
}

function assertStructuredMedia(root, file, content) {
  for (const [, value] of content.matchAll(MEDIA_JSON_KEYS)) assertMediaValue(root, file, value);
  for (const match of content.matchAll(/<(?:image|enclosure|media:content)\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    for (const name of ['url', 'href', 'src']) if (attrs[name]) assertMediaValue(root, file, attrs[name]);
  }
  for (const [, value] of content.matchAll(/<image\b[^>]*>[\s\S]*?<url>([^<]+)<\/url>[\s\S]*?<\/image>/gi)) {
    assertMediaValue(root, file, value.trim());
  }
}

export function auditProductionOutput(root = resolve('dist')) {
  const output = resolve(root);
  if (output.split(sep).at(-1) !== 'dist') throw new Error('Production audit is restricted to a dist directory.');
  if (!existsSync(output) || !statSync(output).isDirectory()) throw new Error(`Missing dist directory: ${output}`);

  for (const file of walk(output)) {
    const relativePath = relative(output, file).replaceAll('\\', '/');
    const content = readFileSync(file, 'utf8');
    if (FIXTURES.test(relativePath) || FIXTURES.test(content))
      throw new Error(`Production fixture leakage: ${relativePath}`);
    if (MARKERS.test(content)) throw new Error(`Forbidden production marker in ${relativePath}`);
    if (/\.css$/i.test(file)) assertCssUrls(output, file, content);
    if (/\.(?:json|xml)$/i.test(file)) assertStructuredMedia(output, file, content);
    if (!/\.html?$/i.test(file)) continue;

    if (METRICS.test(visibleText(content))) throw new Error(`Unsupported visible metric in ${relativePath}`);
    for (const match of content.matchAll(/<(?:a|area|link|img|video|audio|source|script|iframe|meta)\b[^>]*>/gi)) {
      const tag = match[0];
      const attrs = attributes(tag);
      assertReference(output, file, tag, attrs);
      assertMedia(file, tag, attrs);
    }
    assertStructuredMedia(output, file, content);
  }
}

if (process.argv[1]?.endsWith('production-audit.mjs')) {
  auditProductionOutput(process.argv[2] ?? resolve('dist'));
  process.stdout.write('Production output audit passed.\n');
}
