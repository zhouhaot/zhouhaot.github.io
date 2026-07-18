import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'jsdom',
    fileParallelism: false,
    include: ['tests/**/*.test.{js,ts}'],
  },
});
