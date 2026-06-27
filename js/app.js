/**
 * App — VOID.DEV (Refactored)
 * Uses Core framework for data + theme management
 */

(async function () {
  'use strict';

  /* ---- Load Data (localStorage → JSON fallback) ---- */
  const [config, posts, projects] = await Promise.all([
    Core.getData(Core.KEYS.CONFIG, 'data/config.json'),
    Core.getData(Core.KEYS.POSTS, 'data/posts.json'),
    Core.getData(Core.KEYS.PROJECTS, 'data/projects.json'),
  ]);

  if (!config || !posts || !projects) {
    document.body.innerHTML = '<p style="color:white;text-align:center;padding:4rem">加载失败，请刷新页面</p>';
    return;
  }

  /* ---- Load Theme ---- */
  const themeId = config.theme || 'cyberpunk';
  await Core.loadTheme(themeId);

  /* ---- Get theme helper ---- */
  function getTheme() {
    return window.THEMES && window.THEMES[themeId];
  }

  /* ---- Blog Card Clicks (event delegation) ---- */
  function initBlogCardClicks() {
    const grid = document.querySelector('[data-filterable="posts"]');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.blog-card');
      if (!card) return;
      window.location.hash = '/post/' + card.dataset.postId;
    });
    grid.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.blog-card');
      if (!card) return;
      e.preventDefault();
      window.location.hash = '/post/' + card.dataset.postId;
    });
  }

  /* ---- Project Card Clicks (event delegation) ---- */
  function initProjectCardClicks() {
    const grid = document.querySelector('[data-filterable="projects"]');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
      // Don't hijack link clicks
      if (e.target.closest('a')) return;
      const card = e.target.closest('.project-card');
      if (!card) return;
      window.location.hash = '/project/' + card.dataset.projectId;
    });
    grid.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.project-card');
      if (!card) return;
      e.preventDefault();
      window.location.hash = '/project/' + card.dataset.projectId;
    });
  }

  /* ---- Dynamic Filter (works for both posts and projects) ---- */
  function initFilters() {
    document.querySelectorAll('.filter-bar').forEach(bar => {
      const target = bar.dataset.filterTarget;
      const grid = document.querySelector(`[data-filterable="${target}"]`);
      if (!grid) return;

      bar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        const filter = btn.dataset.filter;

        // Update active button
        bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter cards
        grid.querySelectorAll('[data-category]').forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.classList.remove('hidden');
            card.style.animation = 'fadeInUp 0.4s var(--ease-out-expo) forwards';
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  /* ---- Render Home ---- */
  function renderHome() {
    Core.render(config, posts, projects);
    Core.updateSEO({
      title: config.site?.title || 'VOID.DEV',
      description: config.site?.description || '一个关于前端工程、创意交互与数字美学的个人博客',
      url: '/',
      type: 'website',
    });
    initScrollReveal();
    initSkillBars();
    init3DTilt();
    initFilters();
    initBlogCardClicks();
    initProjectCardClicks();
    initMobileNav();
  }

  /* ---- Render Article ---- */
  function renderArticle(postId) {
    const post = posts.find(p => p.id === postId);
    const theme = getTheme();
    if (!post) {
      if (theme && theme.render404) theme.render404('文章不存在');
      return;
    }
    if (theme && theme.renderArticle) {
      theme.renderArticle(post);
      Core.updateSEO({
        title: post.title,
        description: post.excerpt || '',
        url: '/post/' + postId,
        type: 'article',
      });
    }
  }

  /* ---- Render Project Detail ---- */
  function renderProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    const theme = getTheme();
    if (!project) {
      if (theme && theme.render404) theme.render404('项目不存在');
      return;
    }
    if (theme && theme.renderProject) {
      theme.renderProject(project);
      Core.updateSEO({
        title: project.title,
        description: project.description || '',
        url: '/project/' + projectId,
        type: 'article',
      });
    }
  }

  /* ---- Router ---- */
  const router = new Router();
  router
    .on('/', () => renderHome())
    .on('/post/:id', ({ id }) => renderArticle(id))
    .on('/project/:id', ({ id }) => renderProject(id))
    .init();

  /* ---- Global Modules ---- */
  new ParticleSystem('particle-canvas');
  new CursorGlow();
  initNavBehavior();
  initSmoothScroll();
  initLoader();
})();
