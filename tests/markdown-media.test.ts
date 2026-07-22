// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validateMarkdownMedia } from '../src/domain/markdown-media';

const declared = ['notes/qa-note-diagram.webp'];

describe('Markdown media AST validation', () => {
  it.each([
    ['remote', '![Remote](https://cdn.example/image.png)', /remote/i],
    ['protocol-relative', '![Remote](//cdn.example/image.png)', /remote/i],
    ['data', '![Inline](data:image/png;base64,AAAA)', /remote/i],
    ['empty alt', '![](notes/qa-note-diagram.webp)', /alt/i],
    ['whitespace alt', '![   ](notes/qa-note-diagram.webp)', /alt/i],
    ['undeclared', '![Diagram](notes/qa-note-other.webp)', /declared/i],
    ['raw image', '<img src="notes/qa-note-diagram.webp" alt="Diagram">', /raw/i],
    ['raw video', '<video src="notes/qa-note-demo.webm"></video>', /raw/i],
    ['iframe', '<iframe src="https://example.com"></iframe>', /raw/i],
    ['script', '<script>alert(1)</script>', /raw/i],
  ])('rejects %s media', (_name, body, issue) => {
    expect(
      validateMarkdownMedia(body, declared, 'md')
        .map((item) => item.message)
        .join('\n'),
    ).toMatch(issue);
  });

  it('accepts declared inline and reference images with non-empty alt', () => {
    const body =
      '![Diagram](notes/qa-note-diagram.webp)\n\n![Reference][diagram]\n\n[diagram]: notes/qa-note-diagram.webp';
    expect(validateMarkdownMedia(body, declared, 'md')).toEqual([]);
  });

  it('rejects MDX media elements while retaining MDX parsing', () => {
    expect(
      validateMarkdownMedia('<img src="notes/qa-note-diagram.webp" alt="Diagram" />', declared, 'mdx')[0]?.message,
    ).toMatch(/raw/i);
  });

  it('ignores media-looking text in code and treats LF/CRLF identically', () => {
    const fenced = '```html\n<img src="https://cdn.example/image.png">\n```';
    const lf = '![Diagram][diagram]\n\n[diagram]: notes/qa-note-diagram.webp';
    expect(validateMarkdownMedia(fenced, declared, 'md')).toEqual([]);
    expect(validateMarkdownMedia(lf, declared, 'md')).toEqual([]);
    expect(validateMarkdownMedia(lf.replaceAll('\n', '\r\n'), declared, 'md')).toEqual([]);
  });
});
