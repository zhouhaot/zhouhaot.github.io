import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { siteProfileSchema } from '../src/domain/content-schema';
import { buildSiteProfile } from '../src/domain/public-profile';

const profile = buildSiteProfile([
  {
    id: 'profile',
    data: siteProfileSchema.parse({
      heroEyebrow: 'AI 应用开发',
      heroTitle: '探索技术边界，让 AI 真正进入业务。',
      role: 'AI 应用开发者',
      heroSummary: '将 AI 工作流、Agent、知识系统与自动化能力，沉淀为可验证、可运行的应用。',
      positioning: 'zhou 是一个个人技术符号，专注于 Agent、知识系统、工作流自动化、评估与工程交付的 AI 应用开发。',
      capabilities: ['Agent 与工具调用', 'RAG 与知识系统', '工作流自动化', '评估与工程交付'],
      method: ['发现真实问题', '验证应用场景', '制作可运行原型', '集成现有流程', '评估并持续迭代'],
      principles: ['真实问题优先', '以可运行原型验证', '明确实验、项目与已交付状态', '重视评估与复盘'],
      currentStatus: '目前接受范围明确的 AI 应用合作讨论，也在寻找 AI 应用开发相关机会。',
      trustBoundary:
        '区分真实状态；只发布经验证的代码、过程与结果；不发布未经确认的身份、第三方、媒体或结果数据；GitHub 是唯一公开联系入口。',
      contacts: [{ label: '访问 GitHub', kind: 'github', href: 'https://github.com/zhouhaot' }],
    }),
  },
]);

describe('anonymous public profile', () => {
  it('provides only approved professional copy and reusable capability, method, and status data', () => {
    expect(profile.positioning).toContain('zhou');
    expect(profile.capabilities).toHaveLength(4);
    expect(profile.method).toHaveLength(5);
    expect(profile.currentStatus).toContain('AI 应用');
    expect(profile.trustBoundary).toContain('GitHub');
  });

  it('does not expose identity, contact, education, customer proof, or result fields', () => {
    for (const marker of [
      'name',
      'avatar',
      'age',
      'gender',
      'location',
      'school',
      'degree',
      'employer',
      'resume',
      'email',
      'phone',
      'client',
      'testimonial',
      'metric',
    ]) {
      expect(profile).not.toHaveProperty(marker);
    }
    expect(JSON.stringify(profile)).not.toMatch(/@|mailto:|tel:|\d+%|客户|学历|简历/);
  });

  it('keeps server loading out of every leaf component and gives them typed props', () => {
    for (const file of [
      'src/components/home/Hero.astro',
      'src/components/home/CapabilityMap.astro',
      'src/components/home/DeliveryMethod.astro',
      'src/components/home/CurrentStatus.astro',
      'src/components/SiteHeader.astro',
      'src/components/MobileDrawer.astro',
    ]) {
      const source = readFileSync(resolve(file), 'utf8');
      expect(source).not.toMatch(/public-profile\.server|astro:content|decap|cms/i);
      expect(source).toMatch(/interface Props/);
    }

    const baseLayout = readFileSync(resolve('src/layouts/BaseLayout.astro'), 'utf8');
    expect(baseLayout).toMatch(/getSiteProfile/);
    expect(baseLayout).toMatch(/<SiteHeader\s+primaryContact=\{primaryContact\}/);
  });
});
