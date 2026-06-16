/**
 * Particle System — VOID.DEV
 * Canvas-based floating particles with connections
 * Performance-optimized: uses requestAnimationFrame, limits draw calls
 */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000 };
    this.particleCount = 60;
    this.connectionDistance = 150;
    this.mouseRadius = 200;
    this.animationId = null;
    this.running = false;

    this._resize = this._resize.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._animate = this._animate.bind(this);

    this._init();
  }

  _init() {
    this._resize();
    this._createParticles();
    this._bindEvents();
    this.running = true;
    this._animate();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(dpr, dpr);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  _createParticles() {
    // Reduce count on mobile
    const count = window.innerWidth < 768 ? 30 : this.particleCount;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      this._resize();
      this._createParticles();
    });
    window.addEventListener('mousemove', this._onMouseMove, { passive: true });
  }

  _onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  _animate() {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update & draw particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      // Mouse repulsion
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouseRadius) {
        const force = (this.mouseRadius - dist) / this.mouseRadius * 0.02;
        p.vx += dx * force;
        p.vy += dy * force;
      }

      // Damping
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(120, 220, 255, ${p.opacity})`;
      this.ctx.fill();
    }

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.connectionDistance) {
          const opacity = (1 - dist / this.connectionDistance) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = `rgba(120, 220, 255, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    this.animationId = requestAnimationFrame(this._animate);
  }

  destroy() {
    this.running = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this._resize);
    window.removeEventListener('mousemove', this._onMouseMove);
  }
}
