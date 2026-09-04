/**
 * ==========================================================================
 * main.js — Mesin Animasi Slow-Motion, Parallax 3D & Integrasi API Realtime
 * ==========================================================================
 * Teknik Animasi:
 * 1. Easing Kustom: 'power2.out' & 'sine.inOut' via GSAP 3 untuk gerakan lambat dan mewah
 * 2. Background Floating Particles: Canvas API dengan partikel cahaya ambient berkecepatan mikro
 * 3. 3D Parallax Tilt: Rotasi kartu mengikuti posisi kursor dengan redaman lerp/damping delay
 * 4. Slow Pulsing Glow: Pendaran neon lembut pada kartu dan tombol
 * 5. Integrasi Python REST API: Mengambil data metrik dan menganimasikan angka dari 0 ke nilai target
 *    selama 3-4 detik dengan GSAP, disinkronkan dengan pengisian CSS progress bar.
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
  const PARTICLE_COUNT = 45; // Kerapatan partikel ambient yang anggun dan ringan
  let canvasW = 0;
  let canvasH = 0;

  // Objek Partikel Ambient
  class AmbientDustParticle {
    constructor() {
      this.init(true);
    }

    init(randomizeY = false) {
      this.x = Math.random() * (canvasW || window.innerWidth);
      this.y = randomizeY ? Math.random() * (canvasH || window.innerHeight) : canvasH + 10;
      // Kecepatan sangat lambat (slow-motion drift)
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = -(Math.random() * 0.35 + 0.1); // Melayang perlahan ke atas
      this.radius = Math.random() * 2.2 + 0.8;
      this.alpha = Math.random() * 0.45 + 0.2;
      this.alphaDecay = Math.random() * 0.003 + 0.001;

      // Warna debu cahaya: Merah KPK (#dc2626) dan Emas (#c79a3c)
      const isRed = Math.random() > 0.4;
      this.rgb = isRed ? '220, 38, 38' : '199, 154, 60';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Pulsasi opasitas perlahan
      this.alpha += Math.sin(Date.now() * 0.0015) * 0.002;
      if (this.alpha < 0.1) this.alpha = 0.1;
      if (this.alpha > 0.6) this.alpha = 0.6;

      // Reset jika melewati batas layar
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
      ctx.shadowColor = `rgba(${this.rgb}, 0.55)`;
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

    // Buat kumpulan partikel
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new AmbientDustParticle());
    }

    // Loop animasi 60 FPS
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
     2. Interactive 3D Parallax Tilt with Damping Delay
     ========================================================================== */
  function setupParallaxTilt() {
    const tiltElements = document.querySelectorAll('.tilt-card, .corruptor-card, .kpi-card');
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

        // Hanya aktif bila kursor berada dekat kartu
        if (Math.abs(diffX) < 2.0 && Math.abs(diffY) < 2.0) {
          const rotX = -diffY * 6; // Maks rotasi 6 derajat agar elegan
          const rotY = diffX * 6;

          if (window.gsap) {
            gsap.to(el, {
              rotationX: rotX,
              rotationY: rotY,
              transformPerspective: 1000,
              duration: 0.9,
              ease: 'power2.out'
            });
          }
        } else {
          if (window.gsap) {
            gsap.to(el, {
              rotationX: 0,
              rotationY: 0,
              duration: 1.1,
              ease: 'power2.out'
            });
          }
        }
      });
    });

    window.addEventListener('mouseleave', () => {
      tiltElements.forEach((el) => {
        if (window.gsap) {
          gsap.to(el, { rotationX: 0, rotationY: 0, duration: 1.2, ease: 'power2.out' });
        }
      });
    });
  }

  /* ==========================================================================
     3. GSAP Slow Entrance & Scroll Reveal Animations
     ========================================================================== */
  function setupScrollReveals() {
    if (!window.gsap) return;

    // Timeline entrance awal
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.from('.navbar', {
      y: -40,
      opacity: 0,
      duration: 1.2
    });

    tl.from('.hero-badge, .badge-tag', {
      scale: 0.9,
      opacity: 0,
      duration: 0.9
    }, '-=0.6');

    tl.from('.page-title, .hero-title', {
      y: 35,
      opacity: 0,
      duration: 1.2
    }, '-=0.5');

    tl.from('.page-desc, .hero-desc', {
      y: 20,
      opacity: 0,
      duration: 1
    }, '-=0.7');

    tl.from('.kpi-card, .corruptor-card, .filter-card', {
      y: 45,
      opacity: 0,
      duration: 1.1,
      stagger: 0.12,
      ease: 'power2.out'
    }, '-=0.4');
  }

  /* ==========================================================================
     4. Integrasi Python REST API & Animasi Angka Lambat GSAP (3-4 Detik)
     ========================================================================== */
  // Data cadangan jika API Python tidak sedang dijalankan
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
      console.info('Menggunakan angka statistik default (server Python belum aktif).', e);
    }

    runNumberTickUpAnimation(metrics);
  }

  function runNumberTickUpAnimation(stats) {
    if (!window.gsap) return;

    // Elemen Target
    const kerugianEl = document.getElementById('metric-kerugian');
    const kasusEl = document.getElementById('metric-kasus');
    const asetEl = document.getElementById('metric-aset');
    const recoveryEl = document.getElementById('metric-recovery');

    // Objek sementara untuk interpolasi GSAP
    const counters = {
      kerugian: 0,
      kasus: 0,
      aset: 0,
      recovery: 0
    };

    // Animasi perubahan angka dari 0 ke nilai target selama 3.5 detik dengan soft easing
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
      },
      onComplete: function () {
        // Efek pulse lembut setelah selesai
        const cards = document.querySelectorAll('.kpi-card');
        cards.forEach((c) => c.classList.add('slow-pulse'));
      }
    });

    // Animasikan CSS Progress Bars secara perlahan seiring berjalannya angka
    const progressFills = document.querySelectorAll('.kpi-progress-fill');
    setTimeout(() => {
      progressFills.forEach((fill) => {
        const targetWidth = fill.getAttribute('data-target-width') || '100%';
        fill.style.width = targetWidth;
      });
    }, 150);
  }

  /* ==========================================================================
     Inisialisasi Sistem Animasi
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    setupCanvas();
    setupParallaxTilt();
    setupScrollReveals();
    fetchAndAnimateMetrics();

    // Trigger tombol sync bila tersedia
    const syncBtn = document.getElementById('btn-sync-realtime');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        fetchAndAnimateMetrics();
      });
    }
  });
})();
