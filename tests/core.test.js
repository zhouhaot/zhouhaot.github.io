import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import createDOMPurify from 'dompurify';

// Set up JSDOM for DOMPurify (it needs a real window/document)
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const window = dom.window;

// Make marked and DOMPurify available globally for Core.parseMarkdown
globalThis.marked = marked;
globalThis.DOMPurify = createDOMPurify(window);

// Mock browser globals that core.js expects
globalThis.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.document = {
  createElement: () => ({ rel: '', href: '', onload: null, onerror: null, src: '' }),
  head: { appendChild: () => {} },
  querySelector: () => null,
};
globalThis.window = globalThis;

// Load core.js and expose Core on globalThis
const coreSrc = readFileSync(resolve(__dirname, '../js/core.js'), 'utf-8');
const setupCode = coreSrc.replace(
  'const Core = (() => {',
  'globalThis.Core = (() => {',
);
eval(setupCode);

const Core = globalThis.Core;

describe('Core.escapeText', () => {
  it('escapes ampersand', () => {
    expect(Core.escapeText('a&b')).toBe('a&amp;b');
  });

  it('escapes angle brackets', () => {
    expect(Core.escapeText('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(Core.escapeText('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(Core.escapeText("'hello'")).toBe('&#39;hello&#39;');
  });

  it('returns empty string for null/undefined', () => {
    expect(Core.escapeText(null)).toBe('');
    expect(Core.escapeText(undefined)).toBe('');
  });

  it('converts number to string', () => {
    expect(Core.escapeText(42)).toBe('42');
  });

  it('handles mixed special characters', () => {
    expect(Core.escapeText('<a href="x">y</a>')).toBe('&lt;a href=&quot;x&quot;&gt;y&lt;/a&gt;');
  });
});

describe('Core.escapeHTML (legacy alias)', () => {
  it('works the same as escapeText', () => {
    expect(Core.escapeHTML('<b>test</b>')).toBe('&lt;b&gt;test&lt;/b&gt;');
  });
});

describe('Core.parseMarkdown — security', () => {
  it('sanitizes script tags', () => {
    const result = Core.parseMarkdown('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
  });

  it('sanitizes img onerror', () => {
    const result = Core.parseMarkdown('<img src=x onerror="alert(1)">');
    expect(result).not.toContain('onerror');
  });

  it('sanitizes javascript: links', () => {
    const result = Core.parseMarkdown('[click](javascript:alert(1))');
    expect(result).not.toContain('javascript:');
  });

  it('sanitizes inline event handlers', () => {
    const result = Core.parseMarkdown('<div onclick="alert(1)">test</div>');
    expect(result).not.toContain('onclick');
  });

  it('returns empty string for empty input', () => {
    expect(Core.parseMarkdown('')).toBe('');
    expect(Core.parseMarkdown(null)).toBe('');
    expect(Core.parseMarkdown(undefined)).toBe('');
  });
});

describe('Core.parseMarkdown — rendering', () => {
  it('renders headings', () => {
    const result = Core.parseMarkdown('## Hello');
    expect(result).toContain('<h2');
    expect(result).toContain('Hello');
  });

  it('renders bold text', () => {
    const result = Core.parseMarkdown('**bold**');
    expect(result).toContain('<strong');
    expect(result).toContain('bold');
  });

  it('renders italic text', () => {
    const result = Core.parseMarkdown('*italic*');
    expect(result).toContain('<em');
    expect(result).toContain('italic');
  });

  it('renders inline code', () => {
    const result = Core.parseMarkdown('`code`');
    expect(result).toContain('<code');
    expect(result).toContain('code');
  });

  it('renders fenced code blocks', () => {
    const result = Core.parseMarkdown('```js\nconsole.log("hi")\n```');
    expect(result).toContain('<pre>');
    expect(result).toContain('<code');
    expect(result).toContain('console.log');
  });

  it('renders links', () => {
    const result = Core.parseMarkdown('[link](https://example.com)');
    expect(result).toContain('<a');
    expect(result).toContain('https://example.com');
  });

  it('renders unordered lists', () => {
    const result = Core.parseMarkdown('- item 1\n- item 2');
    expect(result).toContain('<li');
    expect(result).toContain('item 1');
    expect(result).toContain('item 2');
  });

  it('renders blockquotes', () => {
    const result = Core.parseMarkdown('> quote');
    expect(result).toContain('<blockquote');
    expect(result).toContain('quote');
  });
});
