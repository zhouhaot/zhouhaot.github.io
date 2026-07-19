import { describe, expect, it } from 'vitest';
import { siteProfileSchema } from '../src/domain/content-schema';
import { buildSiteProfile, type SiteProfileSource } from '../src/domain/public-profile';

const approved = {
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
} as const;

describe('site profile singleton', () => {
  it('accepts the approved public profile and contact protocol', () => {
    expect(siteProfileSchema.parse(approved)).toEqual(approved);
  });

  it('rejects private fields and a phone contact', () => {
    expect(() => siteProfileSchema.parse({ ...approved, phone: '+860000000000' })).toThrow();
    expect(() =>
      siteProfileSchema.parse({ ...approved, contacts: [{ label: 'Call', kind: 'email', href: 'tel:+860000000000' }] }),
    ).toThrow();
  });

  it('requires exactly the profile entry', () => {
    const source: SiteProfileSource = { id: 'profile', data: siteProfileSchema.parse(approved) };
    expect(buildSiteProfile([source])).toEqual(source.data);
    expect(() => buildSiteProfile([])).toThrow(/exactly one/i);
    expect(() => buildSiteProfile([source, source])).toThrow(/exactly one/i);
    expect(() => buildSiteProfile([{ ...source, id: 'other' }])).toThrow(/profile/i);
  });
});
