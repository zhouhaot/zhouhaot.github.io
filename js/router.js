/**
 * Simple Hash Router — VOID.DEV
 * Handles article detail views via hash-based routing
 * e.g., #/post/shader-art-with-webgl
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;

    this._onHashChange = this._onHashChange.bind(this);
    window.addEventListener('hashchange', this._onHashChange);
  }

  /** Register a route handler */
  on(pattern, handler) {
    this.routes.set(pattern, handler);
    return this;
  }

  /** Navigate to a route */
  navigate(path) {
    window.location.hash = path;
  }

  /** Handle hash changes */
  _onHashChange() {
    const hash = window.location.hash.slice(1) || '/';

    for (const [pattern, handler] of this.routes) {
      const match = this._match(pattern, hash);
      if (match) {
        this.currentRoute = pattern;
        handler(match.params);
        return;
      }
    }

    // Default: show home
    if (this.routes.has('/')) {
      this.routes.get('/')({});
    }
  }

  /** Match a route pattern against a path, extracting params */
  _match(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return { params };
  }

  /** Initialize — trigger initial route */
  init() {
    this._onHashChange();
    return this;
  }
}
