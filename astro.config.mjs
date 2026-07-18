import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://zhouhaot.github.io',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [
    mdx(),
    sitemap({
      filter(page) {
        const path = new URL(page).pathname;
        return !['/404', '/rss.xml'].includes(path) && !/^\/(?:admin|notes)(?:\/|$)/.test(path);
      },
    }),
  ],
});
