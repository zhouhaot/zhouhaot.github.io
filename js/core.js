/**
 * Core Framework — VOID.DEV
 * ============================================
 * Data layer + Theme engine + Renderer
 *
 * Data flow:
 *   1. Load from localStorage (admin overrides)
 *   2. Fall back to JSON files
 *   3. Theme engine picks CSS + template based on config.theme
 *   4. Template renders HTML into page
 *
 * Theme contract — each theme provides:
 *   themes/<name>/theme.css   — all styles
 *   themes/<name>/template.js — exports window.THEME.render(cfg, posts, projects)
 */

const Core = (() => {
  'use strict';

  /* ============================
     Storage Keys
     ============================ */
  const KEYS = {
    CONFIG: 'void_config',
    POSTS: 'void_posts',
    PROJECTS: 'void_projects',
  };

  /* ============================
     Data Layer
     ============================ */

  /** Load JSON file, return null on failure */
  async function fetchJSON(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /** Get data: localStorage first, then JSON file */
  async function getData(key, filePath) {
    // Check localStorage
    const cached = localStorage.getItem(key);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* fall through */ }
    }
    // Fetch from file
    const data = await fetchJSON(filePath);
    if (data) {
      // Cache for next time
      localStorage.setItem(key, JSON.stringify(data));
    }
    return data;
  }

  /** Save data to localStorage */
  function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /** Reset a specific key to file defaults */
  async function resetData(key, filePath) {
    localStorage.removeItem(key);
    return await fetchJSON(filePath);
  }

  /** Export all data as downloadable JSON files */
  function exportData() {
    const config = localStorage.getItem(KEYS.CONFIG);
    const posts = localStorage.getItem(KEYS.POSTS);
    const projects = localStorage.getItem(KEYS.PROJECTS);
    return {
      config: config ? JSON.parse(config) : null,
      posts: posts ? JSON.parse(posts) : null,
      projects: projects ? JSON.parse(projects) : null,
    };
  }

  /** Import data from JSON objects */
  function importData({ config, posts, projects }) {
    if (config) saveData(KEYS.CONFIG, config);
    if (posts) saveData(KEYS.POSTS, posts);
    if (projects) saveData(KEYS.PROJECTS, projects);
  }

  /* ============================
     Theme Engine
     ============================ */

  let currentThemeLink = null;
  let currentTheme = null;

  /** Available themes registry */
  const THEMES = {
    cyberpunk: {
      name: '赛博朋克',
      description: '暗色系 + 毛玻璃 + 弥散光 + 粒子特效',
      preview: '🌌',
      css: 'themes/cyberpunk/theme.css',
      js: 'themes/cyberpunk/template.js',
    },
    minimal: {
      name: '极简白',
      description: '亮色系 + 纯净排版 + 微动效',
      preview: '☁️',
      css: 'themes/minimal/theme.css',
      js: 'themes/minimal/template.js',
    },
  };

  /** Load and activate a theme */
  async function loadTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) {
      console.warn(`Theme "${themeId}" not found, falling back to cyberpunk`);
      return loadTheme('cyberpunk');
    }

    // Remove old theme CSS
    if (currentThemeLink) {
      currentThemeLink.remove();
    }

    // Load new theme CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = theme.css;
    document.head.appendChild(link);
    currentThemeLink = link;

    // Load theme template JS (if not already loaded)
    if (!window.THEMES || !window.THEMES[themeId]) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = theme.js;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    currentTheme = themeId;
    return themeId;
  }

  /** Render the page using current theme's template */
  function render(config, posts, projects) {
    if (!window.THEMES || !window.THEMES[currentTheme]) {
      console.error('Theme template not loaded');
      return;
    }
    window.THEMES[currentTheme].render(config, posts, projects);
  }

  /** Get list of available themes */
  function getThemes() {
    return Object.entries(THEMES).map(([id, theme]) => ({
      id,
      ...theme,
    }));
  }

  /* ============================
     Markdown Parser (shared)
     ============================ */

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function parseMarkdown(md) {
    return md
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre><code class="language-${lang}">${escapeHTML(code.trim())}</code></pre>`)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '');
  }

  /** Format date for display */
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* ============================
     Public API
     ============================ */

  return {
    KEYS,
    getData,
    saveData,
    resetData,
    exportData,
    importData,
    loadTheme,
    render,
    getThemes,
    parseMarkdown,
    formatDate,
  };
})();
