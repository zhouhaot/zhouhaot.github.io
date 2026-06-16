/**
 * Cursor Glow — VOID.DEV
 * Smooth-following radial gradient that tracks the mouse
 * Uses requestAnimationFrame for buttery 60fps motion
 */

class CursorGlow {
  constructor() {
    this.el = document.querySelector('.cursor-glow');
    if (!this.el || window.innerWidth < 768) return;

    this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.speed = 0.08; // Lower = smoother/laggier follow
    this.running = true;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._animate = this._animate.bind(this);

    window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    this._animate();
  }

  _onMouseMove(e) {
    this.target.x = e.clientX;
    this.target.y = e.clientY;
    this.el.classList.remove('hidden');
  }

  _animate() {
    if (!this.running) return;

    // Lerp for smooth follow
    this.pos.x += (this.target.x - this.pos.x) * this.speed;
    this.pos.y += (this.target.y - this.pos.y) * this.speed;

    this.el.style.transform = `translate(${this.pos.x - 250}px, ${this.pos.y - 250}px)`;

    requestAnimationFrame(this._animate);
  }

  destroy() {
    this.running = false;
    window.removeEventListener('mousemove', this._onMouseMove);
  }
}
