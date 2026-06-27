/**
 * Admin Panel — VOID.DEV
 * Full CRUD for config, posts, projects, themes
 * Data stored in localStorage, can export/import JSON
 */

(async function () {
  'use strict';

  /* ============================
     Auth Manager
     NOTE: 纯前端登录仅防误触，不能防止有意绕过
     （用户可直接修改 localStorage）。如需真正安全，
     请结合后端认证服务。
     默认密码: admin123
     ============================ */
  const AuthManager = {
    // admin123 的 SHA-256 哈希
    DEFAULT_HASH: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    AUTH_KEY: 'void_auth',
    HASH_KEY: 'void_auth_hash',

    async _hash(password) {
      const data = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    getStoredHash() {
      return localStorage.getItem(this.HASH_KEY) || this.DEFAULT_HASH;
    },

    async check(password) {
      const hash = await this._hash(password);
      return hash === this.getStoredHash();
    },

    isLoggedIn() {
      return sessionStorage.getItem(this.AUTH_KEY) === '1' || localStorage.getItem(this.AUTH_KEY) === '1';
    },

    login(remember) {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(this.AUTH_KEY, '1');
    },

    logout() {
      sessionStorage.removeItem(this.AUTH_KEY);
      localStorage.removeItem(this.AUTH_KEY);
    },

    async changePassword(oldPwd, newPwd) {
      const valid = await this.check(oldPwd);
      if (!valid) return false;
      const newHash = await this._hash(newPwd);
      localStorage.setItem(this.HASH_KEY, newHash);
      return true;
    },

    init() {
      const loginScreen = document.querySelector('.login-screen');
      const adminPanel = document.querySelector('.admin');
      if (this.isLoggedIn()) {
        loginScreen.style.display = 'none';
        adminPanel.style.display = '';
      } else {
        loginScreen.style.display = '';
        adminPanel.style.display = 'none';
      }
    },
  };

  /* ============================
     Login Form Handler
     ============================ */
  let loginFailCount = 0;
  let loginLockUntil = 0;
  const LOGIN_MAX_FAILS = 5;
  const LOGIN_LOCK_MS = 30000;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('login-error');

    // Check lockout
    if (Date.now() < loginLockUntil) {
      const secs = Math.ceil((loginLockUntil - Date.now()) / 1000);
      errorEl.textContent = `尝试次数过多，请等待 ${secs} 秒`;
      errorEl.style.display = 'block';
      return;
    }

    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember').checked;

    const valid = await AuthManager.check(password);
    if (valid) {
      loginFailCount = 0;
      errorEl.style.display = 'none';
      AuthManager.login(remember);
      document.querySelector('.login-screen').style.display = 'none';
      document.querySelector('.admin').style.display = '';
    } else {
      loginFailCount++;
      if (loginFailCount >= LOGIN_MAX_FAILS) {
        loginLockUntil = Date.now() + LOGIN_LOCK_MS;
        loginFailCount = 0;
        errorEl.textContent = `尝试次数过多，请等待 ${LOGIN_LOCK_MS / 1000} 秒`;
      } else {
        errorEl.textContent = '密码错误，请重试';
      }
      errorEl.style.display = 'block';
      const card = document.querySelector('.login-card');
      card.classList.remove('login-shake');
      void card.offsetWidth;
      card.classList.add('login-shake');
    }
  });

  // Check login state — show login screen or admin panel
  AuthManager.init();

  /* ============================
     Constants
     ============================ */
  const KEYS = { CONFIG: 'void_config', POSTS: 'void_posts', PROJECTS: 'void_projects' };

  const THEMES = [
    { id: 'cyberpunk', name: '赛博朋克', icon: '🌌', desc: '暗色系 + 毛玻璃 + 弥散光 + 粒子特效' },
    { id: 'minimal', name: '极简白', icon: '☁️', desc: '亮色系 + 纯净排版 + 微动效' },
  ];

  /* ============================
     Data Helpers
     ============================ */
  async function loadJSON(path) {
    const res = await fetch(path);
    return res.ok ? res.json() : null;
  }

  function getLocal(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  function setLocal(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async function getConfig() { return getLocal(KEYS.CONFIG) || await loadJSON('../data/config.json'); }
  async function getPosts() { return getLocal(KEYS.POSTS) || await loadJSON('../data/posts.json'); }
  async function getProjects() { return getLocal(KEYS.PROJECTS) || await loadJSON('../data/projects.json'); }

  /* ============================
     State
     ============================ */
  let config = await getConfig();
  let posts = await getPosts();
  let projects = await getProjects();

  /* ============================
     Toast
     ============================ */
  function toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast ' + type;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2500);
  }

  /* ============================
     Tab Navigation
     ============================ */
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.sidebar__link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      link.classList.add('active');
      document.getElementById('tab-' + link.dataset.tab).classList.add('active');
      // Scroll to top on tab switch (important for mobile)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ============================
     Deep Get/Set
     ============================ */
  function deepGet(obj, path) {
    return path.split('.').reduce((o, k) => o && o[k], obj);
  }
  function deepSet(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  /* ============================
     Event Delegation Helper
     Attach ONE listener per container, use data-action + data-index
     ============================ */
  function delegate(container, actions) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const index = parseInt(btn.dataset.index, 10);
      if (actions[action]) {
        e.preventDefault();
        actions[action](index, btn);
      }
    });
  }

  // Global action delegation on admin-main (catches all data-action clicks)
  const adminMain = document.querySelector('.admin-main');
  delegate(adminMain, {
    'add-nav-item': () => { config.nav = config.nav || []; config.nav.push({ label: '新项', href: '#' }); renderNavEditor(); },
    'add-social': () => { config.social = config.social || []; config.social.push({ name: 'New', url: '', icon: '' }); renderSocialEditor(); },
    'add-bio': () => { config.about.bio.push(''); renderBioEditor(); },
    'add-skill': () => { config.about.skills.push({ name: 'New', level: 50, items: [] }); renderSkillsEditor(); },
    'add-experience': () => { config.about.experience.push({ year: '', role: '', company: '', desc: '' }); renderExperienceEditor(); },
    'show-post-editor': () => showPostEditor(),
    'hide-post-editor': () => hidePostEditor(),
    'show-project-editor': () => showProjectEditor(),
    'hide-project-editor': () => hideProjectEditor(),
    'save-theme': () => { config.theme = selectedTheme; setLocal(KEYS.CONFIG, config); const name = [...THEMES, ...customThemes].find(t => t.id === selectedTheme)?.name || selectedTheme; toast('主题已切换为 ' + name, 'success'); },
    'export-all': () => { downloadJSON({ config, posts, projects }, 'void-blog-data.json'); toast('全部数据已导出', 'success'); },
    'export-config': () => { downloadJSON(config, 'config.json'); toast('站点配置已导出', 'success'); },
    'export-posts': () => { downloadJSON(posts, 'posts.json'); toast('文章数据已导出', 'success'); },
    'export-projects': () => { downloadJSON(projects, 'projects.json'); toast('项目数据已导出', 'success'); },
    'import-data': () => document.getElementById('import-file').click(),
    'generate-files': () => { downloadJSON(config, 'config.json'); downloadJSON(posts, 'posts.json'); downloadJSON(projects, 'projects.json'); toast('JSON 文件已下载，请替换 data/ 目录', 'success'); },
    'reset-all': () => {
      if (!confirm('确定重置所有数据？')) return;
      localStorage.removeItem(KEYS.CONFIG);
      localStorage.removeItem(KEYS.POSTS);
      localStorage.removeItem(KEYS.PROJECTS);
      localStorage.removeItem('void_custom_themes');
      location.reload();
    },
    'logout': () => {
      if (!confirm('确定退出登录？')) return;
      AuthManager.logout();
      document.querySelector('.admin').style.display = 'none';
      document.querySelector('.login-screen').style.display = '';
      document.getElementById('login-password').value = '';
    },
    'change-password': async () => {
      const oldPwd = document.getElementById('old-password').value;
      const newPwd = document.getElementById('new-password').value;
      const confirmPwd = document.getElementById('confirm-password').value;

      if (!oldPwd || !newPwd) { toast('请填写所有密码字段', 'error'); return; }
      if (newPwd !== confirmPwd) { toast('两次输入的新密码不一致', 'error'); return; }
      if (newPwd.length < 6) { toast('新密码至少 6 位', 'error'); return; }

      const ok = await AuthManager.changePassword(oldPwd, newPwd);
      if (ok) {
        toast('密码已修改，请重新登录', 'success');
        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        // Auto logout after password change
        setTimeout(() => {
          AuthManager.logout();
          document.querySelector('.admin').style.display = 'none';
          document.querySelector('.login-screen').style.display = '';
          document.getElementById('login-password').value = '';
        }, 1200);
      } else {
        toast('当前密码错误', 'error');
      }
    },
  });

  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      let data;
      try { data = JSON.parse(ev.target.result); } catch (err) { toast('JSON 解析失败：' + err.message, 'error'); return; }
      if (typeof data !== 'object' || data === null || Array.isArray(data)) { toast('格式错误：需要 JSON 对象', 'error'); return; }
      if (!data.config && !data.posts && !data.projects) { toast('格式错误：需包含 config / posts / projects 至少一项', 'error'); return; }
      const imported = [];
      if (data.config) { if (typeof data.config !== 'object') { toast('config 格式错误', 'error'); return; } config = data.config; setLocal(KEYS.CONFIG, config); imported.push('站点配置'); }
      if (data.posts) { if (!Array.isArray(data.posts)) { toast('posts 格式错误', 'error'); return; } posts = data.posts; setLocal(KEYS.POSTS, posts); imported.push('文章'); }
      if (data.projects) { if (!Array.isArray(data.projects)) { toast('projects 格式错误', 'error'); return; } projects = data.projects; setLocal(KEYS.PROJECTS, projects); imported.push('项目'); }
      renderAll();
      toast('已导入：' + imported.join('、'), 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('theme-import-form').addEventListener('submit', (e) => {
    e.preventDefault();
    importTheme();
  });

  /* ============================
     Settings Form
     ============================ */
  function renderSettingsForm() {
    const form = document.getElementById('settings-form');
    form.querySelectorAll('input[name], textarea[name], select[name]').forEach(el => {
      const val = deepGet(config, el.name);
      if (val !== undefined && val !== null) el.value = val;
    });
    renderNavEditor();
    renderSocialEditor();
  }

  function renderNavEditor() {
    const container = document.getElementById('nav-editor');
    container.innerHTML = (config.nav || []).map((item, i) => `
      <div class="editor-row">
        <input type="text" value="${item.label}" placeholder="标签" data-nav-field="label" data-nav-index="${i}">
        <input type="text" value="${item.href}" placeholder="#href" data-nav-field="href" data-nav-index="${i}">
        <button class="btn btn--xs btn--danger" data-action="delete-nav" data-index="${i}">删除</button>
      </div>
    `).join('');
  }

  delegate(document.getElementById('nav-editor'), {
    'delete-nav': (i) => { config.nav.splice(i, 1); renderNavEditor(); },
  });

  document.getElementById('nav-editor').addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.navField) {
      config.nav[parseInt(el.dataset.navIndex)][el.dataset.navField] = el.value;
    }
  });

  // addNavItem handled by global delegation

  function renderSocialEditor() {
    const container = document.getElementById('social-editor');
    container.innerHTML = (config.social || []).map((item, i) => `
      <div class="editor-row">
        <input type="text" value="${item.name}" placeholder="名称" data-social-field="name" data-social-index="${i}" style="width:80px">
        <input type="text" value="${item.url}" placeholder="URL" data-social-field="url" data-social-index="${i}">
        <button class="btn btn--xs btn--danger" data-action="delete-social" data-index="${i}">删除</button>
      </div>
    `).join('');
  }

  delegate(document.getElementById('social-editor'), {
    'delete-social': (i) => { config.social.splice(i, 1); renderSocialEditor(); },
  });

  document.getElementById('social-editor').addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.socialField) {
      config.social[parseInt(el.dataset.socialIndex)][el.dataset.socialField] = el.value;
    }
  });

  // addSocial handled by global delegation

  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    form.querySelectorAll('input[name], textarea[name], select[name]').forEach(el => {
      if (el.closest('.editor-row')) return;
      deepSet(config, el.name, el.value);
    });
    setLocal(KEYS.CONFIG, config);
    toast('设置已保存', 'success');
  });

  /* ============================
     Profile Form
     ============================ */
  function renderProfileForm() {
    renderBioEditor();
    renderSkillsEditor();
    renderExperienceEditor();
  }

  function renderBioEditor() {
    const container = document.getElementById('bio-editor');
    container.innerHTML = (config.about?.bio || []).map((text, i) => `
      <div class="editor-row">
        <textarea rows="2" data-bio-index="${i}">${text}</textarea>
        <button class="btn btn--xs btn--danger" data-action="delete-bio" data-index="${i}">删除</button>
      </div>
    `).join('');
  }

  delegate(document.getElementById('bio-editor'), {
    'delete-bio': (i) => { config.about.bio.splice(i, 1); renderBioEditor(); },
  });

  document.getElementById('bio-editor').addEventListener('change', (e) => {
    if (e.target.dataset.bioIndex !== undefined) {
      config.about.bio[parseInt(e.target.dataset.bioIndex)] = e.target.value;
    }
  });

  // addBio handled by global delegation

  function renderSkillsEditor() {
    const container = document.getElementById('skills-editor');
    container.innerHTML = (config.about?.skills || []).map((skill, i) => `
      <div class="editor-row" style="flex-wrap:wrap">
        <input type="text" value="${skill.name}" placeholder="技能名" data-skill-field="name" data-skill-index="${i}" style="width:100px">
        <input type="number" value="${skill.level}" placeholder="%" min="0" max="100" data-skill-field="level" data-skill-index="${i}" style="width:60px">
        <input type="text" value="${skill.items.join(', ')}" placeholder="子项（逗号分隔）" data-skill-field="items" data-skill-index="${i}" style="flex:1">
        <button class="btn btn--xs btn--danger" data-action="delete-skill" data-index="${i}">删除</button>
      </div>
    `).join('');
  }

  delegate(document.getElementById('skills-editor'), {
    'delete-skill': (i) => { config.about.skills.splice(i, 1); renderSkillsEditor(); },
  });

  document.getElementById('skills-editor').addEventListener('change', (e) => {
    const el = e.target;
    const i = parseInt(el.dataset.skillIndex);
    if (isNaN(i)) return;
    if (el.dataset.skillField === 'name') config.about.skills[i].name = el.value;
    if (el.dataset.skillField === 'level') config.about.skills[i].level = +el.value;
    if (el.dataset.skillField === 'items') config.about.skills[i].items = el.value.split(',').map(s => s.trim());
  });

  // addSkill handled by global delegation

  function renderExperienceEditor() {
    const container = document.getElementById('experience-editor');
    container.innerHTML = (config.about?.experience || []).map((exp, i) => `
      <div class="editor-row" style="flex-wrap:wrap">
        <input type="text" value="${exp.year}" placeholder="年份" data-exp-field="year" data-exp-index="${i}" style="width:100px">
        <input type="text" value="${exp.role}" placeholder="职位" data-exp-field="role" data-exp-index="${i}">
        <input type="text" value="${exp.company}" placeholder="公司" data-exp-field="company" data-exp-index="${i}" style="width:120px">
        <input type="text" value="${exp.desc}" placeholder="描述" data-exp-field="desc" data-exp-index="${i}" style="flex:1;min-width:200px">
        <button class="btn btn--xs btn--danger" data-action="delete-exp" data-index="${i}">删除</button>
      </div>
    `).join('');
  }

  delegate(document.getElementById('experience-editor'), {
    'delete-exp': (i) => { config.about.experience.splice(i, 1); renderExperienceEditor(); },
  });

  document.getElementById('experience-editor').addEventListener('change', (e) => {
    const el = e.target;
    const i = parseInt(el.dataset.expIndex);
    if (isNaN(i) || !el.dataset.expField) return;
    config.about.experience[i][el.dataset.expField] = el.value;
  });

  // addExperience handled by global delegation

  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    setLocal(KEYS.CONFIG, config);
    toast('个人信息已保存', 'success');
  });

  /* ============================
     Posts CRUD — Event Delegation
     ============================ */
  function renderPostsList() {
    const container = document.getElementById('posts-list');
    if (!posts.length) {
      container.innerHTML = '<p style="color:var(--admin-text-dim)">暂无文章</p>';
      return;
    }
    container.innerHTML = posts.map((p, i) => `
      <div class="item-row">
        <div class="item-row__info">
          <div class="item-row__title">${escapeHTML(p.title)}</div>
          <div class="item-row__meta">${p.date} · ${p.readTime || ''} · ${(p.tags || []).join(', ')}</div>
        </div>
        <div class="item-row__actions">
          <button class="btn btn--xs" data-action="edit-post" data-index="${i}">编辑</button>
          <button class="btn btn--xs btn--danger" data-action="delete-post" data-index="${i}">删除</button>
        </div>
      </div>
    `).join('');
  }

  delegate(document.getElementById('posts-list'), {
    'edit-post': (i) => showPostEditor(i),
    'delete-post': (i) => {
      if (!confirm('确定删除文章「' + posts[i].title + '」？')) return;
      posts.splice(i, 1);
      setLocal(KEYS.POSTS, posts);
      renderPostsList();
      toast('文章已删除', 'success');
    },
  });

  function showPostEditor(index) {
    const modal = document.getElementById('post-editor');
    const form = document.getElementById('post-form');
    form.reset();

    if (index !== undefined && posts[index]) {
      const p = posts[index];
      document.getElementById('post-editor-title').textContent = '编辑文章';
      form.querySelector('[name="id"]').value = p.id;
      form.querySelector('[name="id"]').readOnly = true;
      form.querySelector('[name="title"]').value = p.title;
      form.querySelector('[name="date"]').value = p.date;
      form.querySelector('[name="readTime"]').value = p.readTime || '';
      form.querySelector('[name="tags"]').value = (p.tags || []).join(', ');
      form.querySelector('[name="category"]').value = p.category || 'tech';
      form.querySelector('[name="excerpt"]').value = p.excerpt || '';
      form.querySelector('[name="content"]').value = p.content || '';
      form.dataset.editIndex = index;
    } else {
      document.getElementById('post-editor-title').textContent = '新建文章';
      form.querySelector('[name="id"]').readOnly = false;
      form.querySelector('[name="date"]').value = new Date().toISOString().slice(0, 10);
      delete form.dataset.editIndex;
    }
    modal.style.display = 'flex';
  };

  function hidePostEditor() { document.getElementById('post-editor').style.display = 'none'; }

  document.getElementById('post-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      id: form.querySelector('[name="id"]').value.trim(),
      title: form.querySelector('[name="title"]').value.trim(),
      date: form.querySelector('[name="date"]').value,
      readTime: form.querySelector('[name="readTime"]').value.trim(),
      tags: form.querySelector('[name="tags"]').value.split(',').map(s => s.trim()).filter(Boolean),
      category: form.querySelector('[name="category"]').value,
      excerpt: form.querySelector('[name="excerpt"]').value.trim(),
      content: form.querySelector('[name="content"]').value,
    };

    if (form.dataset.editIndex !== undefined) {
      posts[parseInt(form.dataset.editIndex)] = data;
    } else {
      if (posts.find(p => p.id === data.id)) { toast('ID 已存在', 'error'); return; }
      posts.unshift(data);
    }
    setLocal(KEYS.POSTS, posts);
    renderPostsList();
    hidePostEditor();
    toast('文章已保存', 'success');
  });

  /* ============================
     Projects CRUD — Event Delegation
     ============================ */
  function renderProjectsList() {
    const container = document.getElementById('projects-list');
    if (!projects.length) {
      container.innerHTML = '<p style="color:var(--admin-text-dim)">暂无项目</p>';
      return;
    }
    container.innerHTML = projects.map((p, i) => `
      <div class="item-row">
        <div class="item-row__info">
          <div class="item-row__title">${escapeHTML(p.title)}</div>
          <div class="item-row__meta">${p.year} · ${(p.tech || []).join(', ')}</div>
        </div>
        <div class="item-row__actions">
          <button class="btn btn--xs" data-action="edit-project" data-index="${i}">编辑</button>
          <button class="btn btn--xs btn--danger" data-action="delete-project" data-index="${i}">删除</button>
        </div>
      </div>
    `).join('');
  }

  delegate(document.getElementById('projects-list'), {
    'edit-project': (i) => showProjectEditor(i),
    'delete-project': (i) => {
      if (!confirm('确定删除项目「' + projects[i].title + '」？')) return;
      projects.splice(i, 1);
      setLocal(KEYS.PROJECTS, projects);
      renderProjectsList();
      toast('项目已删除', 'success');
    },
  });

  function showProjectEditor(index) {
    const modal = document.getElementById('project-editor');
    const form = document.getElementById('project-form');
    form.reset();

    if (index !== undefined && projects[index]) {
      const p = projects[index];
      document.getElementById('project-editor-title').textContent = '编辑项目';
      form.querySelector('[name="id"]').value = p.id;
      form.querySelector('[name="id"]').readOnly = true;
      form.querySelector('[name="title"]').value = p.title;
      form.querySelector('[name="description"]').value = p.description || '';
      form.querySelector('[name="year"]').value = p.year || '';
      form.querySelector('[name="status"]').value = p.status || '已完成';
      form.querySelector('[name="category"]').value = p.category || 'frontend';
      form.querySelector('[name="cover"]').value = p.cover || '';
      form.querySelector('[name="tech"]').value = (p.tech || []).join(', ');
      form.querySelector('[name="tags"]').value = (p.tags || []).join(', ');
      form.querySelector('[name="highlights"]').value = (p.highlights || []).join('\n');
      form.querySelector('[name="gallery"]').value = (p.gallery || []).join('\n');
      form.querySelector('[name="content"]').value = p.content || '';
      form.querySelector('[name="link"]').value = p.link || '';
      form.querySelector('[name="demo"]').value = p.demo || '';
      form.querySelector('[name="updatedAt"]').value = p.updatedAt || '';
      form.dataset.editIndex = index;
    } else {
      document.getElementById('project-editor-title').textContent = '新建项目';
      form.querySelector('[name="id"]').readOnly = false;
      form.querySelector('[name="year"]').value = new Date().getFullYear();
      form.querySelector('[name="updatedAt"]').value = new Date().toISOString().slice(0, 10);
      delete form.dataset.editIndex;
    }
    modal.style.display = 'flex';
  };

  function hideProjectEditor() { document.getElementById('project-editor').style.display = 'none'; }

  document.getElementById('project-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      id: form.querySelector('[name="id"]').value.trim(),
      title: form.querySelector('[name="title"]').value.trim(),
      description: form.querySelector('[name="description"]').value.trim(),
      year: form.querySelector('[name="year"]').value.trim(),
      status: form.querySelector('[name="status"]').value,
      category: form.querySelector('[name="category"]').value,
      cover: form.querySelector('[name="cover"]').value.trim(),
      tech: form.querySelector('[name="tech"]').value.split(',').map(s => s.trim()).filter(Boolean),
      tags: form.querySelector('[name="tags"]').value.split(',').map(s => s.trim()).filter(Boolean),
      highlights: form.querySelector('[name="highlights"]').value.split('\n').map(s => s.trim()).filter(Boolean),
      gallery: form.querySelector('[name="gallery"]').value.split('\n').map(s => s.trim()).filter(Boolean),
      content: form.querySelector('[name="content"]').value,
      link: form.querySelector('[name="link"]').value.trim(),
      demo: form.querySelector('[name="demo"]').value.trim(),
      updatedAt: form.querySelector('[name="updatedAt"]').value || new Date().toISOString().slice(0, 10),
    };

    if (form.dataset.editIndex !== undefined) {
      projects[parseInt(form.dataset.editIndex)] = data;
    } else {
      if (projects.find(p => p.id === data.id)) { toast('ID 已存在', 'error'); return; }
      projects.unshift(data);
    }
    setLocal(KEYS.PROJECTS, projects);
    renderProjectsList();
    hideProjectEditor();
    toast('项目已保存', 'success');
  });

  /* ============================
     Theme Selection
     ============================ */
  let selectedTheme = config.theme || 'cyberpunk';
  let customThemes = getLocal('void_custom_themes') || [];

  function renderThemeGrid() {
    const container = document.getElementById('theme-list');
    const all = [...THEMES, ...customThemes];
    container.innerHTML = all.map(t => `
      <div class="theme-card ${t.id === selectedTheme ? 'selected' : ''}" data-theme="${t.id}">
        <div class="theme-card__icon">${t.icon || '🎨'}</div>
        <div class="theme-card__name">${t.name}</div>
        <div class="theme-card__desc">${t.desc}</div>
        ${t.custom ? `<button class="btn btn--xs btn--danger" data-action="delete-theme" data-theme-id="${t.id}" style="margin-top:8px">删除</button>` : ''}
      </div>
    `).join('');

    // Click to select
    container.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action]')) return; // skip button clicks
        selectedTheme = card.dataset.theme;
        renderThemeGrid();
      });
    });
  }

  // Delete custom theme
  delegate(document.getElementById('theme-list'), {
    'delete-theme': (i, btn) => {
      const themeId = btn.dataset.themeId;
      if (!confirm('删除主题「' + themeId + '」？')) return;
      customThemes = customThemes.filter(t => t.id !== themeId);
      setLocal('void_custom_themes', customThemes);
      // Also remove from core registry
      if (window.THEMES) delete window.THEMES[themeId];
      // Remove CSS link
      const link = document.querySelector('link[href*="themes/' + themeId + '"]');
      if (link) link.remove();
      if (selectedTheme === themeId) selectedTheme = 'cyberpunk';
      renderThemeGrid();
      toast('主题已删除', 'success');
    },
  });

  // saveTheme handled by global delegation

  /* ============================
     Theme Import
     ============================ */
  function importTheme() {
    const nameInput = document.getElementById('theme-import-name');
    const descInput = document.getElementById('theme-import-desc');
    const iconInput = document.getElementById('theme-import-icon');
    const cssFile = document.getElementById('theme-import-css').files[0];
    const jsFile = document.getElementById('theme-import-js').files[0];

    if (!cssFile || !jsFile) {
      toast('请上传 CSS 和 JS 文件', 'error');
      return;
    }

    const themeId = nameInput.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'custom-' + Date.now();
    const themeName = nameInput.value.trim() || themeId;
    const themeDesc = descInput.value.trim() || '自定义主题';
    const themeIcon = iconInput.value.trim() || '🎨';

    // Read both files
    const cssReader = new FileReader();
    const jsReader = new FileReader();

    let cssContent = '';
    let jsContent = '';

    cssReader.onload = (e) => {
      cssContent = e.target.result;
      jsReader.readAsText(jsFile);
    };

    jsReader.onload = (e) => {
      jsContent = e.target.result;

      // Inject CSS
      const style = document.createElement('style');
      style.id = 'theme-' + themeId;
      style.textContent = cssContent;
      document.head.appendChild(style);

      // Inject JS
      const script = document.createElement('script');
      script.textContent = jsContent;
      document.head.appendChild(script);

      // Register as custom theme
      const themeEntry = {
        id: themeId,
        name: themeName,
        icon: themeIcon,
        desc: themeDesc,
        custom: true,
        cssContent: cssContent,
        jsContent: jsContent,
      };

      customThemes.push(themeEntry);
      setLocal('void_custom_themes', customThemes);

      renderThemeGrid();
      toast('主题「' + themeName + '」已导入', 'success');

      // Clear form
      nameInput.value = '';
      descInput.value = '';
      iconInput.value = '';
      document.getElementById('theme-import-css').value = '';
      document.getElementById('theme-import-js').value = '';
    };

    cssReader.readAsText(cssFile);
  };

  // Load saved custom themes on init
  function loadCustomThemes() {
    customThemes.forEach(t => {
      if (!t.cssContent || !t.jsContent) return;
      const style = document.createElement('style');
      style.id = 'theme-' + t.id;
      style.textContent = t.cssContent;
      document.head.appendChild(style);

      const script = document.createElement('script');
      script.textContent = t.jsContent;
      document.head.appendChild(script);
    });
  }
  loadCustomThemes();

  /* Data management handled by global delegation */

  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ============================
     Initialize
     ============================ */
  function renderAll() {
    renderSettingsForm();
    renderProfileForm();
    renderPostsList();
    renderProjectsList();
    renderThemeGrid();
  }

  renderAll();
})();
