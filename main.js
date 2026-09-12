/**
 * ==========================================================================
 * main.js — Mesin Animasi Slow-Motion, Parallax 3D & Scroll-Spy Navigation
 * Portal Transparansi Data Korupsi KPK
 * ==========================================================================
 * Fitur:
 * 1. Background Floating Particles (Canvas API — Ambient Floating Drift 60 FPS)
 * 2. Interactive 3D Tilt Parallax dengan redaman halus
 * 3. Sticky Navbar Scroll-Spy dengan deteksi offset akurat
 * 4. Smooth Anchor Scroll dengan penyesuaian tinggi sticky header
 * 5. GSAP Scroll Reveal & Stagger Animation
 * 6. Python REST API Integration: GSAP 3.5s Number Tick-Up & Progress Bars
 * ==========================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Background Floating Particles (Ambient Canvas 60 FPS)
     ========================================================================== */
  const canvas = document.getElementById('ambient-canvas');
  let ctx = null;
  let particles = [];
  const PARTICLE_COUNT = 50;
  let canvasW = 0;
  let canvasH = 0;

  class AmbientDustParticle {
    constructor() {
      this.init(true);
    }

    init(randomizeY = false) {
      this.x = Math.random() * (canvasW || window.innerWidth);
      this.y = randomizeY ? Math.random() * (canvasH || window.innerHeight) : (canvasH || window.innerHeight) + 12;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = -(Math.random() * 0.35 + 0.1); // Drift perlahan ke atas
      this.radius = Math.random() * 2.2 + 0.8;
      this.alpha = Math.random() * 0.45 + 0.15;

      // Warna: Merah KPK (#dc2626) dan Electric Cyan (#06b6d4)
      this.rgb = Math.random() > 0.5 ? '220, 38, 38' : '6, 182, 212';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      this.alpha += Math.sin(Date.now() * 0.0015) * 0.0025;
      if (this.alpha < 0.1) this.alpha = 0.1;
      if (this.alpha > 0.6) this.alpha = 0.6;

      if (this.y < -20 || this.x < -20 || this.x > canvasW + 20) {
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
     2. 3D Parallax Tilt with Damping (Card Micro-interactions)
     ========================================================================== */
  function setupParallaxTilt() {
    const tiltElements = document.querySelectorAll('.tilt-card, .corruptor-card, .kpi-card');
    if (tiltElements.length === 0) return;

    window.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      tiltElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Cek jika elemen berada di dalam viewport
        if (rect.top > window.innerHeight || rect.bottom < 0) return;

        const cardX = rect.left + rect.width / 2;
        const cardY = rect.top + rect.height / 2;
        const diffX = (mouseX - cardX) / (rect.width / 2);
        const diffY = (mouseY - cardY) / (rect.height / 2);

        if (Math.abs(diffX) < 1.6 && Math.abs(diffY) < 1.6) {
          const rotX = -diffY * 4.5;
          const rotY = diffX * 4.5;

          if (window.gsap) {
            gsap.to(el, {
              rotationX: rotX,
              rotationY: rotY,
              transformPerspective: 900,
              duration: 0.8,
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
          gsap.to(el, { rotationX: 0, rotationY: 0, duration: 1.0, ease: 'power2.out' });
        }
      });
    });
  }

  /* ==========================================================================
     3. Scroll-Spy Navigation & Smooth Anchor Scrolling
     ========================================================================== */
  function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');

    if (sections.length === 0 || navLinks.length === 0) return;

    // Deteksi jika tautan adalah hash internal pada halaman ini
    const hasHashLinks = Array.from(navLinks).some(link => {
      const href = link.getAttribute('href');
      return href && href.startsWith('#');
    });

    if (!hasHashLinks) return;

    function onScroll() {
      let currentSectionId = '';
      const scrollY = window.pageYOffset + 140; // Offset navbar

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
          if (href === `#${currentSectionId}` || href.endsWith(`#${currentSectionId}`)) {
            navLinks.forEach((l) => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Smooth scroll klik dengan offset navbar
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        link.addEventListener('click', (e) => {
          const targetSec = document.querySelector(href);
          if (targetSec) {
            e.preventDefault();
            const topPos = targetSec.getBoundingClientRect().top + window.pageYOffset - 90;
            window.scrollTo({
              top: topPos,
              behavior: 'smooth'
            });

            // Tutup menu mobile jika terbuka
            const navMenu = document.getElementById('nav-links');
            if (navMenu && navMenu.classList.contains('show')) {
              navMenu.classList.remove('show');
            }
          }
        });
      }
    });
  }

  /* ==========================================================================
     4. GSAP Scroll Reveal & Entrance Animations
     ========================================================================== */
  function setupScrollReveals() {
    if (!window.gsap) return;

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.from('.navbar', {
      y: -40,
      opacity: 0,
      duration: 1.0
    });

    tl.from('.badge-tag', {
      scale: 0.92,
      opacity: 0,
      duration: 0.7
    }, '-=0.5');

    tl.from('.page-title', {
      y: 30,
      opacity: 0,
      duration: 0.9
    }, '-=0.4');

    tl.from('.page-desc', {
      y: 20,
      opacity: 0,
      duration: 0.8
    }, '-=0.6');

    tl.from('.kpi-card', {
      y: 40,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power2.out'
    }, '-=0.3');

    tl.from('.terminal-panel, .filter-card, .wbs-card', {
      y: 35,
      opacity: 0,
      duration: 0.9,
      stagger: 0.15
    }, '-=0.2');
  }

  /* ==========================================================================
     5. Integrasi Python REST API & Animasi Angka GSAP (3.5 Detik)
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
      console.info('Menggunakan angka default (server REST offline/lokal):', e);
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

    // Interpolasi halus 3.5 detik dengan easing 'sine.inOut'
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
    }, 200);
  }

  /* ==========================================================================
     Inisialisasi Utama
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
        if (window.KPKCharts) {
          window.KPKCharts.refresh();
        }
      });
    }
  });
})();
