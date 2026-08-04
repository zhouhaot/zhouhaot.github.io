import { PUBLIC_ROUTES, type PublicRoute } from '@/domain/routes';

const navigation = [
  { label: '首页', href: PUBLIC_ROUTES.home },
  { label: '作品', href: PUBLIC_ROUTES.works },
  { label: '博客', href: PUBLIC_ROUTES.blog },
  { label: '简历', href: PUBLIC_ROUTES.resume },
] as const satisfies readonly { label: string; href: PublicRoute }[];

export const SITE = {
  name: 'zhou',
  title: 'zhou — AI 应用开发者',
  description: '探索技术边界，让 AI 真正进入业务。',
  url: 'https://zhouhaot.github.io',
  navigation,
} as const;
