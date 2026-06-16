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

  /* ---- Blog Card Clicks ---- */
  function initBlogCardClicks() {
    document.querySelectorAll('.blog-card').forEach((card) => {
      const handler = () => {
        const postId = card.dataset.postId;
        window.location.hash = '/post/' + postId;
      };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    });
  }

  /* ---- Project Filters ---- */
  function initProjectFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        cards.forEach((card) => {
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
    initScrollReveal();
    initSkillBars();
    init3DTilt();
    initProjectFilters();
    initBlogCardClicks();
    initMobileNav();
  }

  /* ---- Render Article ---- */
  function renderArticle(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) { renderHome(); return; }

    const theme = window.THEMES[themeId];
    if (theme && theme.renderArticle) {
      theme.renderArticle(post);
    }
  }

  /* ---- Router ---- */
  const router = new Router();
  router
    .on('/', () => renderHome())
    .on('/post/:id', ({ id }) => renderArticle(id))
    .init();

  /* ---- Global Modules ---- */
  new ParticleSystem('particle-canvas');
  new CursorGlow();
  initNavBehavior();
  initSmoothScroll();
  initLoader();
})();
