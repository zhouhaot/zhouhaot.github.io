/**
 * Theme Template — VOID.DEV
 * ============================================
 * 开发新主题时，复制此文件并实现 render() 和 renderArticle() 方法。
 *
 * 契约：
 * - 必须注册到 window.THEMES 对象
 * - render(config, posts, projects) — 渲染首页
 * - renderArticle(post) — 渲染文章详情页
 *
 * config 结构：
 * {
 *   site:    { title, subtitle, description, url, author, logo },
 *   hero:    { greeting, name, tagline, description, cta, cta2 },
 *   about:   { bio: string[], skills: [{name, level, items}], experience: [{year, role, company, desc}] },
 *   social:  [{ name, url, icon }],
 *   nav:     [{ label, href }],
 *   footer:  string
 * }
 *
 * posts 结构：
 * [{ id, title, date, tags: string[], category, excerpt, readTime, content }]
 *
 * projects 结构：
 * [{ id, title, description, tags: string[], category, tech: string[], link, demo, year }]
 *
 * 可用的全局工具函数：
 * - Core.formatDate(dateStr) — 格式化日期
 * - Core.parseMarkdown(md) — 解析 Markdown 为 HTML
 * ============================================
 */

window.THEMES = window.THEMES || {};

// 将 'mytheme' 替换为你的主题 ID
window.THEMES.mytheme = {

  /**
   * 渲染首页
   * @param {Object} config - 站点配置
   * @param {Array} posts - 文章列表
   * @param {Array} projects - 项目列表
   */
  render(config, posts, projects) {
    const { site, hero, about, social, nav, footer } = config;
    const main = document.getElementById('main-content');
    const article = document.getElementById('article-view');

    // 1. 渲染导航栏
    const navEl = document.querySelector('.nav');
    if (navEl) {
      navEl.innerHTML = `
        <a href="#/" class="nav__logo">${site.logo || ''} ${site.title}</a>
        <ul class="nav__links">
          ${nav.map(n => `<li><a href="${n.href}" class="nav__link">${n.label}</a></li>`).join('')}
        </ul>
        <button class="nav__toggle" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      `;
    }

    // 2. 显示主内容，隐藏文章视图
    main.style.display = '';
    article.style.display = 'none';
    article.innerHTML = '';

    // 3. 渲染各区块
    main.innerHTML = `
      <!-- Hero 区 -->
      <section id="hero" class="hero">
        <p class="hero__greeting">${hero.greeting}</p>
        <h1 class="hero__name">${hero.name}</h1>
        <p class="hero__tagline">${hero.tagline}</p>
        <p class="hero__description">${hero.description}</p>
        <div class="hero__actions">
          <a href="#about" class="btn btn--primary">${hero.cta}</a>
          <a href="#blog" class="btn btn--ghost">${hero.cta2}</a>
        </div>
      </section>

      <!-- 关于我 -->
      <section id="about" class="section">
        <div class="section__inner">
          <div class="section__header reveal">
            <h2 class="section__title">关于我</h2>
          </div>
          <div class="about__bio reveal">
            ${about.bio.map(p => `<p>${p}</p>`).join('')}
          </div>
        </div>
      </section>

      <!-- 博客 -->
      <section id="blog" class="section">
        <div class="section__inner">
          <div class="section__header reveal">
            <h2 class="section__title">最新文章</h2>
          </div>
          <div class="blog-grid reveal-stagger">
            ${posts.map(p => `
              <article class="blog-card" data-post-id="${p.id}" tabindex="0">
                <div class="blog-card__body">
                  <div class="blog-card__tags">
                    ${p.tags.map(t => `<span class="blog-card__tag">${t}</span>`).join('')}
                  </div>
                  <time class="blog-card__date">${Core.formatDate(p.date)}</time>
                  <h3 class="blog-card__title">${p.title}</h3>
                  <p class="blog-card__excerpt">${p.excerpt}</p>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 项目 -->
      <section id="projects" class="section">
        <div class="section__inner">
          <div class="section__header reveal">
            <h2 class="section__title">项目作品</h2>
          </div>
          <div class="projects-grid reveal-stagger">
            ${projects.map(p => `
              <article class="project-card" data-category="${p.category}">
                <h3 class="project-card__title">${p.title}</h3>
                <p class="project-card__desc">${p.description}</p>
                <div class="project-card__tech">
                  ${p.tech.map(t => `<span class="project-card__tech-tag">${t}</span>`).join('')}
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 联系方式 -->
      <section id="contact" class="section contact">
        <div class="section__inner">
          <div class="section__header reveal">
            <h2 class="section__title">找到我</h2>
          </div>
          <div class="contact__socials reveal">
            ${social.map(s => `<a href="${s.url}" class="social-link" target="_blank">${s.name}</a>`).join('')}
          </div>
        </div>
      </section>

      <footer class="footer">
        <p>© ${new Date().getFullYear()} ${site.author}. ${footer || ''}</p>
      </footer>
    `;
  },

  /**
   * 渲染文章详情页
   * @param {Object} post - 文章对象
   */
  renderArticle(post) {
    const main = document.getElementById('main-content');
    const article = document.getElementById('article-view');
    main.style.display = 'none';
    article.style.display = '';

    article.innerHTML = `
      <article class="article">
        <a href="#/" class="article__back">← 返回</a>
        <header class="article__header">
          <div class="article__tags">
            ${post.tags.map(t => `<span class="blog-card__tag">${t}</span>`).join('')}
          </div>
          <h1 class="article__title">${post.title}</h1>
          <div class="article__meta">
            <time>${Core.formatDate(post.date)}</time>
            <span>${post.readTime}</span>
          </div>
        </header>
        <div class="article__content">
          ${Core.parseMarkdown(post.content)}
        </div>
      </article>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};
