import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

const rootSource = fileURLToPath(new URL('../../src/', import.meta.url));

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  cacheDir: './.astro',
  trailingSlash: 'always',
  vite: { resolve: { alias: { '@': rootSource } } },
});
