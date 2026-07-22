import type { Definition, Image, ImageReference, Root } from 'mdast';
import type { Node } from 'unist';
import { unified } from 'unified';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

export type MarkdownMediaIssue = { code: 'remote' | 'raw' | 'alt' | 'undeclared' | 'reference'; message: string };

function isRemote(value: string): boolean {
  return /^(?:https?:)?\/\//i.test(value) || /^data:/i.test(value);
}

export function validateMarkdownMedia(
  body: string,
  declaredSources: readonly string[],
  format: 'md' | 'mdx',
): readonly MarkdownMediaIssue[] {
  const pipeline = unified().use(remarkParse);
  if (format === 'mdx') pipeline.use(remarkMdx);
  const tree = pipeline.parse(body) as Root;
  const declared = new Set(declaredSources);
  const definitions = new Map<string, Definition>();
  const issues: MarkdownMediaIssue[] = [];

  visit(tree, (node: Node) => {
    if (node.type === 'definition') {
      const def = node as Definition;
      definitions.set(def.identifier.toLowerCase(), def);
    }
  });

  const check = (alt: string | null | undefined, url: string): void => {
    if (!alt?.trim()) issues.push({ code: 'alt', message: `Markdown image alt text is required: ${url}` });
    if (isRemote(url)) issues.push({ code: 'remote', message: `Remote/data Markdown media is forbidden: ${url}` });
    else if (!declared.has(url))
      issues.push({ code: 'undeclared', message: `Markdown media must be declared by the entry: ${url}` });
  };

  visit(tree, (node: Node) => {
    if (node.type === 'image') {
      const img = node as Image;
      check(img.alt, img.url);
    } else if (node.type === 'imageReference') {
      const ref = node as ImageReference;
      const definition = definitions.get(ref.identifier.toLowerCase());
      if (!definition)
        issues.push({ code: 'reference', message: `Markdown image reference does not resolve: ${ref.identifier}` });
      else check(ref.alt, definition.url);
    } else if (node.type === 'html') {
      const html = node as { type: string; value: string };
      if (/<\/?(?:img|picture|source|video|audio|iframe|script)\b/i.test(html.value))
        issues.push({ code: 'raw', message: 'Raw HTML media, iframe, and script elements are forbidden.' });
    } else if (/^mdxJsx/.test(node.type)) {
      const jsx = node as { type: string; name?: string | null };
      if (/^(?:img|picture|source|video|audio|iframe|script)$/i.test(jsx.name ?? '')) {
        issues.push({ code: 'raw', message: 'Raw MDX media, iframe, and script elements are forbidden.' });
      }
    }
  });

  return issues;
}

export function assertMarkdownMedia(body: string, declaredSources: readonly string[], format: 'md' | 'mdx'): void {
  const issues = validateMarkdownMedia(body, declaredSources, format);
  if (issues.length) throw new Error(issues.map((issue) => issue.message).join('\n'));
}
