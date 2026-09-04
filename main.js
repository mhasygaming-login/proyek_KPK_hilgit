/**
 * ==========================================================================
 * main.js — Mesin Animasi Slow-Motion, Parallax 3D & Scroll-Spy Navigation
 * ==========================================================================
 * 1. Movement Easing: 'power2.out', 'sine.inOut', and custom cubic-bezier(0.16, 1, 0.3, 1)
 * 2. Background Floating Particles: Canvas JS partikel debu cahaya ambient berkecepatan mikro
 * 3. Interactive 3D Tilt Parallax: Rotasi kartu mengikuti posisi kursor dengan redaman lerp
 * 4. Scroll-Spy Navigation: Indikator menu navbar aktif otomatis saat halaman di-scroll
 * 5. Python REST API Integration: GSAP 3-4s slow number tick-up tersinkronisasi progress bar
 * ==========================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Background Floating Particles (Canvas API — Ambient Floating Drift)
     ========================================================================== */
  const canvas = document.getElementById('ambient-canvas');
  let ctx = null;
  let particles = [];
  const PARTICLE_COUNT = 45;
  let canvasW = 0;
  let canvasH = 0;

  class AmbientDustParticle {
    constructor() {
      this.init(true);
    }

    init(randomizeY = false) {
      this.x = Math.random() * (canvasW || window.innerWidth);
      this.y = randomizeY ? Math.random() * (canvasH || window.innerHeight) : canvasH + 10;
      this.vx = (Math.random() - 0.5) * 0.22;
      this.vy = -(Math.random() * 0.32 + 0.08); // Drift pelan ke atas
      this.radius = Math.random() * 2.2 + 0.8;
      this.alpha = Math.random() * 0.4 + 0.15;

      // Warna: Merah KPK (#dc2626) dan Cyan (#06b6d4)
      const roll = Math.random();
      if (roll > 0.5) {
        this.rgb = '220, 38, 38'; // Crimson
      } else {
        this.rgb = '6, 182, 212'; // Electric Cyan
      }
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      this.alpha += Math.sin(Date.now() * 0.0015) * 0.002;
      if (this.alpha < 0.1) this.alpha = 0.1;
      if (this.alpha > 0.55) this.alpha = 0.55;

      if (this.y < -15 || this.x < -15 || this.x > canvasW + 15) {
        this.init(false);
      }
    }

    draw() {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.rgb}, ${this.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${this.rgb}, 0.5)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function setupCanvas() {
    if (!canvas) return;
    ctx = canvas.getContext('2d', { alpha: true });

    function resize() {
      canvasW = window.innerWidth;
      canvasH = window.innerHeight;
      canvas.width = canvasW * window.devicePixelRatio;
      canvas.height = canvasH * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    window.addEventListener('resize', resize);
    resize();

    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new AmbientDustParticle());
    }

    function loop() {
      ctx.clearRect(0, 0, canvasW, canvasH);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  /* ==========================================================================
     2. 3D Parallax Tilt with Damping Delay (Card Micro-interactions)
     ========================================================================== */
  function setupParallaxTilt() {
    const tiltElements = document.querySelectorAll('.tilt-card, .corruptor-card, .kpi-card, .terminal-panel');
    if (tiltElements.length === 0) return;

    window.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      tiltElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cardX = rect.left + rect.width / 2;
        const cardY = rect.top + rect.height / 2;
        const diffX = (mouseX - cardX) / (rect.width / 2);
        const diffY = (mouseY - cardY) / (rect.height / 2);

        if (Math.abs(diffX) < 1.8 && Math.abs(diffY) < 1.8) {
          const rotX = -diffY * 5; // Rotasi halus 5 derajat
          const rotY = diffX * 5;

          if (window.gsap) {
            gsap.to(el, {
              rotationX: rotX,
              rotationY: rotY,
              transformPerspective: 1000,
              duration: 0.85,
              ease: 'power2.out'
            });
          }
        } else {
          if (window.gsap) {
            gsap.to(el, {
              rotationX: 0,
              rotationY: 0,
              duration: 1.0,
              ease: 'power2.out'
            });
          }
        }
      });
    });

    window.addEventListener('mouseleave', () => {
      tiltElements.forEach((el) => {
        if (window.gsap) {
          gsap.to(el, { rotationX: 0, rotationY: 0, duration: 1.1, ease: 'power2.out' });
        }
      });
    });
  }

  /* ==========================================================================
     3. Scroll-Spy Navigation (Deteksi Posisi Scroll & Active Menu)
     ========================================================================== */
  function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');

    if (sections.length === 0 || navLinks.length === 0) return;

    window.addEventListener('scroll', () => {
      let currentSectionId = '';
      const scrollY = window.pageYOffset + 120; // Offset navbar

      sections.forEach((sec) => {
        const secTop = sec.offsetTop;
        const secHeight = sec.offsetHeight;
        if (scrollY >= secTop && scrollY < secTop + secHeight) {
          currentSectionId = sec.getAttribute('id');
        }
      });

      if (currentSectionId) {
        navLinks.forEach((link) => {
          const href = link.getAttribute('href');
          if (href && href.includes(`#${currentSectionId}`)) {
            navLinks.forEach((l) => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      }
    });
  }

  /* ==========================================================================
     4. GSAP Scroll Reveal & Entrance Stagger
     ========================================================================== */
  function setupScrollReveals() {
    if (!window.gsap) return;

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.from('.navbar', {
      y: -40,
      opacity: 0,
      duration: 1.2
    });

    tl.from('.badge-tag', {
      scale: 0.9,
      opacity: 0,
      duration: 0.8
    }, '-=0.6');

    tl.from('.page-title', {
      y: 35,
      opacity: 0,
      duration: 1.1
    }, '-=0.5');

    tl.from('.page-desc', {
      y: 20,
      opacity: 0,
      duration: 0.9
    }, '-=0.7');

    tl.from('.kpi-card', {
      y: 45,
      opacity: 0,
      duration: 1.0,
      stagger: 0.12,
      ease: 'power2.out'
    }, '-=0.4');

    tl.from('.terminal-panel, .filter-card', {
      y: 35,
      opacity: 0,
      duration: 1.0,
      stagger: 0.15
    }, '-=0.3');
  }

  /* ==========================================================================
     5. Integrasi Python REST API & Animasi Angka GSAP (3-4 Detik)
     ========================================================================== */
  const DEFAULT_STATS = {
    total_kerugian_triliun: 54.89,
    total_kasus: 8,
    aset_disita_triliun: 4.12,
    recovery_rate_pct: 78.4
  };

  async function fetchAndAnimateMetrics() {
    let metrics = DEFAULT_STATS;

    try {
      const response = await fetch('/api/metrics');
      if (response.ok) {
        const json = await response.json();
        metrics = {
          total_kerugian_triliun: (json.total_kerugian_nominal || 54890000000000) / 1e12,
          total_kasus: json.total_terpidana || 8,
          aset_disita_triliun: (json.aset_disita_nominal || 4120000000000) / 1e12,
          recovery_rate_pct: json.tingkat_recovery_persen || 78.4
        };
      }
    } catch (e) {
      console.info('Menggunakan angka default (server Python belum aktif).', e);
    }

    runNumberTickUp(metrics);
  }

  function runNumberTickUp(stats) {
    if (!window.gsap) return;

    const kerugianEl = document.getElementById('metric-kerugian');
    const kasusEl = document.getElementById('metric-kasus');
    const asetEl = document.getElementById('metric-aset');
    const recoveryEl = document.getElementById('metric-recovery');

    const counters = {
      kerugian: 0,
      kasus: 0,
      aset: 0,
      recovery: 0
    };

    // Interpolasi lambat dan halus selama 3.5 detik dengan easing 'sine.inOut'
    gsap.to(counters, {
      kerugian: stats.total_kerugian_triliun,
      kasus: stats.total_kasus,
      aset: stats.aset_disita_triliun,
      recovery: stats.recovery_rate_pct,
      duration: 3.5,
      ease: 'sine.inOut',
      onUpdate: function () {
        if (kerugianEl) kerugianEl.textContent = `Rp ${counters.kerugian.toFixed(2)} T`;
        if (kasusEl) kasusEl.textContent = `${Math.floor(counters.kasus)} Tokoh`;
        if (asetEl) asetEl.textContent = `Rp ${counters.aset.toFixed(2)} T`;
        if (recoveryEl) recoveryEl.textContent = `${counters.recovery.toFixed(1)}%`;
      }
    });

    // Animasikan pengisian progress bar CSS secara perlahan
    const progressFills = document.querySelectorAll('.kpi-progress-fill');
    setTimeout(() => {
      progressFills.forEach((fill) => {
        const targetWidth = fill.getAttribute('data-target-width') || '100%';
        fill.style.width = targetWidth;
      });
    }, 150);
  }

  /* ==========================================================================
     Inisialisasi
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    setupCanvas();
    setupParallaxTilt();
    setupScrollSpy();
    setupScrollReveals();
    fetchAndAnimateMetrics();

    const syncBtn = document.getElementById('btn-sync-realtime');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        fetchAndAnimateMetrics();
      });
    }
  });
})();
