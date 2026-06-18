/**
 * Theme: Cyberpunk — HTML Templates
 * Dark glassmorphism + neon accents + particles
 */

window.THEMES = window.THEMES || {};
window.THEMES.cyberpunk = {
  render(config, posts, projects) {
    const { site, hero, about, social, nav, footer } = config;
    const main = document.getElementById('main-content');
    const article = document.getElementById('article-view');

    // Render nav
    const navEl = document.querySelector('.nav');
    if (navEl) {
      navEl.innerHTML = `
        <a href="#/" class="nav__logo">${site.logo || '⚡'} ${site.title}</a>
        <ul class="nav__links">
          ${nav.map(n => `<li><a href="${n.href}" class="nav__link">${n.label}</a></li>`).join('')}
        </ul>
        <button class="nav__toggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>
      `;
    }

    // Show main, hide article
    main.style.display = '';
    article.style.display = 'none';
    article.innerHTML = '';

    // Dynamic categories from data
    const postCategories = [...new Set(posts.map(p => p.category).filter(Boolean))];
    const projectCategories = [...new Set(projects.map(p => p.category).filter(Boolean))];

    // Category label map
    const catLabels = { tech: '技术', design: '设计', life: '生活', frontend: '前端', other: '其他' };

    main.innerHTML = `
      <!-- Hero -->
      <section id="hero" class="hero">
        <p class="hero__greeting">${hero.greeting}</p>
        <h1 class="hero__name">${hero.name}</h1>
        <p class="hero__tagline">${hero.tagline}</p>
        <p class="hero__description">${hero.description}</p>
        <div class="hero__actions">
          <a href="#about" class="btn btn--primary">${hero.cta}</a>
          <a href="#blog" class="btn btn--ghost">${hero.cta2}</a>
        </div>
        <div class="hero__scroll-hint"><span>SCROLL</span><div class="scroll-line"></div></div>
      </section>

      <!-- About -->
      <section id="about" class="section">
        <div class="section__inner">
          <div class="section__header reveal">
            <p class="section__label">// ABOUT</p>
            <h2 class="section__title">关于我</h2>
          </div>
          <div class="about__grid">
            <div class="about__bio reveal">
              ${about.bio.map(p => `<p>${p}</p>`).join('')}
              <div class="timeline" style="margin-top:var(--space-xl)">
                ${about.experience.map(e => `
                  <div class="timeline__item">
                    <p class="timeline__year">${e.year}</p>
                    <p class="timeline__role">${e.role}</p>
                    <p class="timeline__company">${e.company}</p>
                    <p class="timeline__desc">${e.desc}</p>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="about__skills reveal">
              ${about.skills.map(s => `
                <div class="skill-bar">
                  <div class="skill-bar__header">
                    <span class="skill-bar__name">${s.name}</span>
                    <span class="skill-bar__value">${s.level}%</span>
                  </div>
                  <div class="skill-bar__track"><div class="skill-bar__fill" data-level="${s.level}"></div></div>
                  <div class="skill-bar__items">${s.items.map(i => `<span class="skill-bar__item">${i}</span>`).join('')}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- Blog -->
      <section id="blog" class="section">
        <div class="section__inner">
          <div class="section__header reveal">
            <p class="section__label">// BLOG</p>
            <h2 class="section__title">最新文章</h2>
            <p class="section__subtitle">关于技术、设计与生活的思考</p>
          </div>
          <div class="filter-bar reveal" data-filter-target="posts">
            <button class="filter-btn active" data-filter="all">全部</button>
            ${postCategories.map(c => `<button class="filter-btn" data-filter="${c}">${catLabels[c] || c}</button>`).join('')}
          </div>
          <div class="blog-grid reveal-stagger" data-filterable="posts">
            ${posts.map(p => `
              <article class="blog-card" data-post-id="${p.id}" data-category="${p.category || ''}" role="article" tabindex="0">
                <div class="blog-card__cover"></div>
                <div class="blog-card__body">
                  <div class="blog-card__tags">${(p.tags || []).map(t => `<span class="blog-card__tag">${t}</span>`).join('')}</div>
                  <time class="blog-card__date" datetime="${p.date}">${Core.formatDate(p.date)}</time>
                  <h3 class="blog-card__title">${p.title}</h3>
                  <p class="blog-card__excerpt">${p.excerpt}</p>
                  <div class="blog-card__meta"><span class="blog-card__read-time">${p.readTime || ''} 阅读</span></div>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Projects -->
      <section id="projects" class="section">
        <div class="section__inner">
          <div class="section__header reveal">
            <p class="section__label">// PROJECTS</p>
            <h2 class="section__title">项目作品</h2>
            <p class="section__subtitle">用代码与设计探索可能性</p>
          </div>
          <div class="filter-bar reveal" data-filter-target="projects">
            <button class="filter-btn active" data-filter="all">全部</button>
            ${projectCategories.map(c => `<button class="filter-btn" data-filter="${c}">${catLabels[c] || c}</button>`).join('')}
          </div>
          <div class="projects-grid reveal-stagger" data-filterable="projects">
            ${projects.map(p => `
              <article class="project-card" data-project-id="${p.id}" data-category="${p.category || ''}" role="article" tabindex="0">
                <span class="project-card__year">${p.year}</span>
                ${p.status ? `<span class="project-card__status">${p.status}</span>` : ''}
                <h3 class="project-card__title">${p.title}</h3>
                <p class="project-card__desc">${p.description}</p>
                <div class="project-card__tech">${(p.tech || []).map(t => `<span class="project-card__tech-tag">${t}</span>`).join('')}</div>
                <div class="project-card__links">
                  ${p.link ? `<a href="${p.link}" class="project-card__link" target="_blank" rel="noopener">GitHub →</a>` : ''}
                  ${p.demo ? `<a href="${p.demo}" class="project-card__link" target="_blank" rel="noopener">Demo →</a>` : ''}
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section id="contact" class="section contact">
        <div class="section__inner">
          <div class="section__header reveal">
            <p class="section__label">// CONTACT</p>
            <h2 class="section__title">找到我</h2>
            <p class="section__subtitle">随时欢迎交流与合作</p>
          </div>
          <div class="contact__socials reveal">
            ${social.map(s => `<a href="${s.url}" class="social-link" target="_blank" rel="noopener" aria-label="${s.name}"><span>${s.name}</span></a>`).join('')}
          </div>
        </div>
      </section>

      <footer class="footer"><p>© ${new Date().getFullYear()} ${site.author}. ${footer || ''}</p></footer>
    `;
  },

  /** Render article detail page */
  renderArticle(post) {
    const main = document.getElementById('main-content');
    const article = document.getElementById('article-view');
    main.style.display = 'none';
    article.style.display = '';

    article.innerHTML = `
      <article class="article">
        <a href="#/" class="article__back">← 返回文章列表</a>
        <header class="article__header">
          <div class="article__tags">${(post.tags || []).map(t => `<span class="blog-card__tag">${t}</span>`).join('')}</div>
          <h1 class="article__title">${post.title}</h1>
          <div class="article__meta">
            <time datetime="${post.date}">${Core.formatDate(post.date)}</time>
            <span>${post.readTime || ''} 阅读</span>
          </div>
        </header>
        <div class="article__content">${Core.parseMarkdown(post.content || '')}</div>
      </article>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /** Render project detail page */
  renderProject(project) {
    const main = document.getElementById('main-content');
    const article = document.getElementById('article-view');
    main.style.display = 'none';
    article.style.display = '';

    const highlights = project.highlights || [];
    const gallery = project.gallery || [];

    article.innerHTML = `
      <article class="project-detail">
        <a href="#/" class="article__back">← 返回项目列表</a>

        ${project.cover ? `<div class="project-detail__cover"><img src="${project.cover}" alt="${project.title}"></div>` : ''}

        <header class="project-detail__header">
          <div class="project-detail__meta">
            <span class="project-detail__year">${project.year}</span>
            ${project.status ? `<span class="project-detail__status">${project.status}</span>` : ''}
          </div>
          <h1 class="project-detail__title">${project.title}</h1>
          <p class="project-detail__desc">${project.description}</p>
        </header>

        <div class="project-detail__tech">
          ${(project.tech || []).map(t => `<span class="project-card__tech-tag">${t}</span>`).join('')}
        </div>

        ${highlights.length ? `
          <div class="project-detail__highlights">
            <h3>项目亮点</h3>
            <ul>${highlights.map(h => `<li>${h}</li>`).join('')}</ul>
          </div>
        ` : ''}

        ${gallery.length ? `
          <div class="project-detail__gallery">
            <h3>截图</h3>
            <div class="gallery-grid">
              ${gallery.map(img => `<div class="gallery-item"><img src="${img}" alt="screenshot" loading="lazy"></div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${project.content ? `
          <div class="project-detail__content article__content">
            ${Core.parseMarkdown(project.content)}
          </div>
        ` : ''}

        <div class="project-detail__links">
          ${project.link ? `<a href="${project.link}" class="btn btn--primary" target="_blank" rel="noopener">GitHub →</a>` : ''}
          ${project.demo ? `<a href="${project.demo}" class="btn btn--ghost" target="_blank" rel="noopener">Live Demo →</a>` : ''}
        </div>

        ${project.updatedAt ? `<p class="project-detail__updated">最后更新：${project.updatedAt}</p>` : ''}
      </article>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /** Render 404 page */
  render404(message) {
    const main = document.getElementById('main-content');
    const article = document.getElementById('article-view');
    main.style.display = 'none';
    article.style.display = '';

    article.innerHTML = `
      <div class="project-detail" style="text-align:center;padding-top:var(--space-2xl)">
        <h1 style="font-size:var(--text-3xl);margin-bottom:var(--space-md)">404</h1>
        <p style="color:var(--color-text-secondary);margin-bottom:var(--space-xl)">${message || '页面不存在'}</p>
        <a href="#/" class="btn btn--primary">返回首页</a>
      </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};
