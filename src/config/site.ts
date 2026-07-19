import { PUBLIC_ROUTES, type PublicRoute } from '@/domain/routes';

const navigation = [
  { label: '首页', href: PUBLIC_ROUTES.home },
  { label: '项目', href: PUBLIC_ROUTES.projects },
  { label: '文章', href: PUBLIC_ROUTES.articles },
  { label: '作品', href: PUBLIC_ROUTES.portfolio },
  { label: '关于', href: PUBLIC_ROUTES.about },
] as const satisfies readonly { label: string; href: PublicRoute }[];

export const SITE = {
  name: 'zhou',
  title: 'zhou — AI 应用开发者',
  description: '探索技术边界，让 AI 真正进入业务。',
  url: 'https://zhouhaot.github.io',
  navigation,
} as const;
