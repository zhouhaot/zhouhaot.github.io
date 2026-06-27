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
     Security Helpers
     ============================ */

  /** Escape HTML entities in text content (for template interpolation) */
  function escapeText(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Escape HTML (legacy, for admin use) */
  function escapeHTML(str) {
    return escapeText(str);
  }

  /* ============================
     Markdown Parser (shared)
     ============================ */

  function parseMarkdown(md) {
    if (!md) return '';
    // marked + DOMPurify (loaded from vendor/)
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      const rawHtml = marked.parse(md, {
        gfm: true,
        breaks: false,
        headerIds: false,
        mangle: false,
      });
      return DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true },
      });
    }
    // Fallback: basic escape (if vendor libs not loaded)
    return escapeText(md).replace(/\n/g, '<br>');
  }

  /** Format date for display */
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* ============================
     SEO Updates (dynamic meta)
     ============================ */

  const SITE_URL = 'https://zhouhaot.github.io';

  function updateMeta(property, content) {
    if (!content) return;
    let el = document.querySelector(`meta[property="${property}"]`)
      || document.querySelector(`meta[name="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      if (property.startsWith('og:') || property.startsWith('twitter:')) {
        el.setAttribute('property', property);
      } else {
        el.setAttribute('name', property);
      }
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function updateSEO({ title, description, url, type, image }) {
    if (title) {
      document.title = title + ' — VOID.DEV';
      updateMeta('og:title', title);
      updateMeta('twitter:title', title);
    }
    if (description) {
      updateMeta('og:description', description);
      updateMeta('twitter:description', description);
    }
    if (url) {
      updateMeta('og:url', SITE_URL + url);
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.href = SITE_URL + url;
    }
    if (type) updateMeta('og:type', type);
    if (image) updateMeta('og:image', image);

    // Update JSON-LD
    const ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) {
      try {
        const data = JSON.parse(ld.textContent);
        if (title) data.name = title;
        if (description) data.description = description;
        if (url) data.url = SITE_URL + url;
        ld.textContent = JSON.stringify(data);
      } catch { /* ignore parse errors */ }
    }
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
    escapeText,
    escapeHTML,
    updateSEO,
  };
})();
