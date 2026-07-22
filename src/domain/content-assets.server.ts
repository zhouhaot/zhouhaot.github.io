import { createContentAssetRegistry } from './media';

const images = import.meta.glob('/src/assets/content/**/*.{avif,jpeg,jpg,png,webp}', {
  eager: true,
  import: 'default',
});
const videos = import.meta.glob('/src/assets/content/**/*.{mp4,webm}', {
  eager: true,
  import: 'default',
  query: '?url',
});

export const contentAssetRegistry = createContentAssetRegistry([...Object.entries(images), ...Object.entries(videos)]);
