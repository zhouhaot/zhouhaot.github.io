/**
 * Animations — VOID.DEV
 * Scroll reveal, skill bar fills, 3D card tilt, nav hide/show
 * All animations use CSS transitions where possible for GPU acceleration
 */

/* ---- Scroll Reveal ---- */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal, .reveal-stagger');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve after reveal — one-shot animation
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ---- Skill Bar Animation ---- */
function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar__fill');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const value = entry.target.dataset.level;
          entry.target.style.width = value + '%';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  bars.forEach((bar) => observer.observe(bar));
}

/* ---- 3D Card Tilt (Blog Cards) ---- */
function init3DTilt() {
  const cards = document.querySelectorAll('.blog-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

/* ---- Nav Hide/Show on Scroll ---- */
function initNavBehavior() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let lastScrollY = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        // Add scrolled class for bg opacity
        nav.classList.toggle('scrolled', currentY > 50);

        // Hide nav on scroll down, show on scroll up
        if (currentY > lastScrollY && currentY > 200) {
          nav.classList.add('hidden');
        } else {
          nav.classList.remove('hidden');
        }

        // Update active nav link
        updateActiveNavLink();

        lastScrollY = currentY;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ---- Active Nav Link ---- */
function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  let current = '';
  sections.forEach((section) => {
    const top = section.offsetTop - 150;
    if (window.scrollY >= top) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
}

/* ---- Mobile Nav Toggle ---- */
function initMobileNav() {
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
  });

  // Close on link click
  links.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      links.classList.remove('open');
    });
  });
}

/* ---- Smooth Scroll for Anchor Links ---- */
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ---- Loading Screen ---- */
function initLoader() {
  const loader = document.querySelector('.loader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('done');
    }, 600);
  });
}
