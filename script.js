/**
 * AEGIS Sentinel — Creative Frontend & Heavy Animation Engine
 * Technologies: HTML5 Canvas API (Physics Drift Web), GSAP 3 (Reveals, Counters & Parallax), Fetch API
 */

(function () {
  'use strict';

  // State Kontrol Animasi & Kecepatan
  const state = {
    canvasSpeedMultiplier: 0.4, // Default: Slow-Motion Cinematic Drift
    enableLines: true,
    repelMouse: true,
    mouse: { x: -1000, y: -1000, radius: 180 },
    isHoveringInteractive: false
  };

  /* ==========================================================================
     1. HTML5 Canvas: Slow-Motion Floating Ambient Particles / Neural Drift
     ========================================================================== */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 65; // Density ideal untuk 60 FPS tanpa beban GPU berat
  const MAX_CONNECT_DISTANCE = 160;

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * (width || window.innerWidth);
      this.y = initial ? Math.random() * (height || window.innerHeight) : (Math.random() > 0.5 ? -10 : height + 10);
      // Soft physics drift (kecepatan dasar sangat halus)
      this.baseVx = (Math.random() - 0.5) * 0.45;
      this.baseVy = (Math.random() - 0.5) * 0.45;
      this.vx = this.baseVx;
      this.vy = this.baseVy;
      this.radius = Math.random() * 2.2 + 1.2;
      this.baseAlpha = Math.random() * 0.5 + 0.3;
      this.alpha = this.baseAlpha;
      
      // Variasi warna: Cyan (#00f2fe), Purple (#9333ea), Crimson (#dc2626)
      const colorRoll = Math.random();
      if (colorRoll < 0.55) {
        this.color = { r: 0, g: 242, b: 254 }; // Cyan
      } else if (colorRoll < 0.85) {
        this.color = { r: 147, g: 51, b: 234 }; // Purple
      } else {
        this.color = { r: 220, g: 38, b: 38 }; // Crimson
      }
    }

    update() {
      // Terapkan multiplier kecepatan slow-motion
      this.x += this.vx * state.canvasSpeedMultiplier;
      this.y += this.vy * state.canvasSpeedMultiplier;

      // Mouse interactive physics (soft repel drift)
      if (state.repelMouse) {
        const dx = this.x - state.mouse.x;
        const dy = this.y - state.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < state.mouse.radius && dist > 0) {
          const force = (state.mouse.radius - dist) / state.mouse.radius;
          const angle = Math.atan2(dy, dx);
          // Dorongan perlahan dengan redaman lembut
          this.vx += Math.cos(angle) * force * 0.35;
          this.vy += Math.sin(angle) * force * 0.35;
        }
      }

      // Kembalikan perlahan ke kecepatan dasar (friction damping)
      this.vx += (this.baseVx - this.vx) * 0.02;
      this.vy += (this.baseVy - this.vy) * 0.02;

      // Wrap around tepi layar
      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20;
      if (this.y > height + 20) this.y = -20;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.5)`;
      ctx.fill();
      ctx.shadowBlur = 0; // Reset
    }
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  }

  // Animation Loop (60 FPS GPU-accelerated)
  function renderCanvas() {
    ctx.clearRect(0, 0, width, height);

    // 1. Gambar koneksi antar-node jika diaktifkan
    if (state.enableLines) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_CONNECT_DISTANCE) {
            const alpha = (1 - dist / MAX_CONNECT_DISTANCE) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            // Warna garis membaur antara Cyan dan Purple
            ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    // 2. Update dan gambar tiap partikel
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    requestAnimationFrame(renderCanvas);
  }

  /* ==========================================================================
     2. 3D Parallax Mouse-Follow & Card Tilt Effect
     ========================================================================== */
  function initParallaxTilt() {
    const tiltCards = document.querySelectorAll('[data-tilt]');

    window.addEventListener('mousemove', (e) => {
      // Update koordinat mouse untuk partikel canvas
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = (e.clientX - centerX) / centerX;
      const deltaY = (e.clientY - centerY) / centerY;

      tiltCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        // Hitung jarak cursor dari pusat kartu
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const distFromMouseX = (e.clientX - cardCenterX) / (rect.width / 2);
        const distFromMouseY = (e.clientY - cardCenterY) / (rect.height / 2);

        // Hanya gerakkan jika dekat dengan area pandang kartu
        if (Math.abs(distFromMouseX) < 2.5 && Math.abs(distFromMouseY) < 2.5) {
          const tiltX = -distFromMouseY * 9; // Maks 9 derajat
          const tiltY = distFromMouseX * 9;

          if (window.gsap) {
            gsap.to(card, {
              rotationX: tiltX,
              rotationY: tiltY,
              transformPerspective: 1000,
              ease: 'power2.out',
              duration: 0.7
            });
          }
        } else {
          if (window.gsap) {
            gsap.to(card, {
              rotationX: 0,
              rotationY: 0,
              ease: 'power2.out',
              duration: 0.8
            });
          }
        }
      });
    });

    window.addEventListener('mouseleave', () => {
      state.mouse.x = -1000;
      state.mouse.y = -1000;
      tiltCards.forEach((card) => {
        if (window.gsap) {
          gsap.to(card, { rotationX: 0, rotationY: 0, duration: 1, ease: 'power2.out' });
        }
      });
    });
  }

  /* ==========================================================================
     3. GSAP Entrance Reveal Animations (Staggered Slow Motion)
     ========================================================================== */
  function runGSAPEntrance() {
    if (!window.gsap) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Navbar entrance
    tl.from('.glass-nav', {
      y: -50,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out'
    });

    // Hero Badge & Title
    tl.from('.hero-badge', {
      scale: 0.85,
      opacity: 0,
      duration: 0.9
    }, '-=0.6');

    tl.from('.hero-title', {
      y: 40,
      opacity: 0,
      duration: 1.3
    }, '-=0.5');

    tl.from('.hero-desc', {
      y: 25,
      opacity: 0,
      duration: 1
    }, '-=0.8');

    tl.from('.hero-actions .btn-cyber-primary, .hero-actions .btn-cyber-secondary', {
      y: 20,
      opacity: 0,
      stagger: 0.2,
      duration: 0.9
    }, '-=0.6');

    // Metric Cards Staggered Slide-Up
    tl.from('.metric-card', {
      y: 50,
      opacity: 0,
      stagger: 0.15,
      duration: 1.2,
      ease: 'power2.out'
    }, '-=0.4');

    // Sector & Telemetry Panels
    tl.from('.glass-panel', {
      y: 40,
      opacity: 0,
      stagger: 0.2,
      duration: 1.1
    }, '-=0.5');
  }

  /* ==========================================================================
     4. Dynamic Fetch API & GSAP Number Tick-Up Animation
     ========================================================================== */
  const FALLBACK_METRICS = {
    total_kerugian_nominal: 54.89, // Dalam Triliun
    total_terpidana: 16,
    aset_disita_nominal: 4.12,    // Dalam Triliun
    tingkat_recovery_persen: 78.4,
    indeks_transparansi: 94.2
  };

  const FALLBACK_SECTORS = [
    { sektor: "Swasta", nominal_formatted: "Rp 40,80 T", persentase: 74.3, color: "#dc2626" },
    { sektor: "BUMN", nominal_formatted: "Rp 11,12 T", persentase: 20.3, color: "#c79a3c" },
    { sektor: "Lembaga Negara", nominal_formatted: "Rp 2,32 T", persentase: 4.2, color: "#9333ea" },
    { sektor: "Kementerian", nominal_formatted: "Rp 481,0 M", persentase: 0.9, color: "#00f2fe" },
    { sektor: "Pemda", nominal_formatted: "Rp 172,7 M", persentase: 0.3, color: "#10b981" }
  ];

  async function fetchMetricsFromAPI() {
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = "SINKRONISASI API...";

    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      animateMetrics(data);
      if (statusText) statusText.textContent = `ONLINE // ${data.timestamp ? data.timestamp.split(' ')[1] : '60 FPS'}`;
    } catch (e) {
      console.info('Menggunakan metrik internal (API server belum aktif):', e.message);
      animateMetrics(FALLBACK_METRICS, true);
      if (statusText) statusText.textContent = "STANDALONE MODE // 60 FPS";
    }
  }

  async function fetchSectorsFromAPI() {
    try {
      const res = await fetch('/api/sectors');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      renderSectors(json.data || FALLBACK_SECTORS);
    } catch (e) {
      renderSectors(FALLBACK_SECTORS);
    }
  }

  async function fetchTelemetryFromAPI() {
    const feed = document.getElementById('telemetryFeed');
    if (!feed) return;

    try {
      const res = await fetch('/api/telemetry');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      renderTelemetry(json.telemetry || []);
    } catch (e) {
      renderTelemetry([
        { timestamp: "09:40:12", code: "NODE_SYNC", type: "VERIFIED", message: "Sinkronisasi putusan kasasi MA Surya Darmadi (Inkracht)." },
        { timestamp: "09:41:05", code: "ASSET_RECOVERY", type: "ACTION", message: "Pemulihan aset tanah perkebunan dan uang pengganti." },
        { timestamp: "09:42:30", code: "VERDICT_AUDIT", type: "SYSTEM", message: "Integritas data putusan Tipikor terverifikasi 100%." },
        { timestamp: "09:43:18", code: "MONITOR_RUN", type: "NETWORK", message: "Monitoring alur pengaduan KPK 198 aktif." }
      ]);
    }
  }

  // Smooth GSAP Number Tick-Up
  function animateMetrics(data, isFallback = false) {
    if (!window.gsap) return;

    const elKerugian = document.getElementById('valTotalKerugian');
    const elAset = document.getElementById('valAsetDisita');
    const elRecovery = document.getElementById('valRecoveryPct');
    const elPelaku = document.getElementById('valTotalPelaku');
    const elTransparansi = document.getElementById('valTransparansi');

    // Target values
    const targetKerugian = isFallback ? data.total_kerugian_nominal : (data.total_kerugian_nominal / 1e12);
    const targetAset = isFallback ? data.aset_disita_nominal : (data.aset_disita_nominal / 1e12);
    const targetRecovery = data.tingkat_recovery_persen || 78.4;
    const targetPelaku = data.total_terpidana || 16;
    const targetTrans = data.indeks_transparansi || 94.2;

    const counterObj = { kerugian: 0, aset: 0, recovery: 0, pelaku: 0, trans: 0 };

    gsap.to(counterObj, {
      kerugian: targetKerugian,
      aset: targetAset,
      recovery: targetRecovery,
      pelaku: targetPelaku,
      trans: targetTrans,
      duration: 2.4,
      ease: 'power2.out',
      onUpdate: () => {
        if (elKerugian) elKerugian.textContent = `Rp ${counterObj.kerugian.toFixed(2)} T`;
        if (elAset) elAset.textContent = `Rp ${counterObj.aset.toFixed(2)} T`;
        if (elRecovery) elRecovery.textContent = `${counterObj.recovery.toFixed(1)}%`;
        if (elPelaku) elPelaku.textContent = `${Math.floor(counterObj.pelaku)} Node`;
        if (elTransparansi) elTransparansi.textContent = counterObj.trans.toFixed(1);
      }
    });
  }

  function renderSectors(sectors) {
    const list = document.getElementById('sectorList');
    if (!list) return;

    list.innerHTML = sectors.map((item) => `
      <div class="progress-item">
        <div class="progress-meta">
          <span class="progress-label">${item.sektor}</span>
          <span class="progress-val">${item.nominal_formatted} (${item.persentase}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="background: linear-gradient(90deg, ${item.color || '#00f2fe'}, #9333ea);" data-width="${item.persentase}%"></div>
        </div>
      </div>
    `).join('');

    // Trigger slow-motion progress bar width expansion
    setTimeout(() => {
      document.querySelectorAll('.progress-fill').forEach((el) => {
        el.style.width = el.getAttribute('data-width');
      });
    }, 200);
  }

  function renderTelemetry(logs) {
    const feed = document.getElementById('telemetryFeed');
    if (!feed) return;

    feed.innerHTML = logs.map(l => `
      <div class="telemetry-row">
        <span class="tel-time">[${l.timestamp}]</span>
        <span class="tel-tag ${l.type}">${l.code}</span>
        <span class="tel-msg">${l.message}</span>
      </div>
    `).join('');
  }

  /* ==========================================================================
     5. Event Listeners & Interactive Animation Controls
     ========================================================================== */
  function setupControls() {
    // Speed Controls
    const btnSlow = document.getElementById('btnSpeedSlow');
    const btnNormal = document.getElementById('btnSpeedNormal');

    if (btnSlow && btnNormal) {
      btnSlow.addEventListener('click', () => {
        state.canvasSpeedMultiplier = 0.4;
        btnSlow.classList.add('active');
        btnNormal.classList.remove('active');
      });

      btnNormal.addEventListener('click', () => {
        state.canvasSpeedMultiplier = 1.0;
        btnNormal.classList.add('active');
        btnSlow.classList.remove('active');
      });
    }

    // Toggle Particle Lines
    const btnLines = document.getElementById('btnToggleLines');
    if (btnLines) {
      btnLines.addEventListener('click', () => {
        state.enableLines = !state.enableLines;
        btnLines.textContent = state.enableLines ? 'Jaring Partikel (ON)' : 'Jaring Partikel (OFF)';
        btnLines.classList.toggle('active', state.enableLines);
      });
    }

    // Toggle Repel Cursor Mode
    const btnRepel = document.getElementById('btnRepelMode');
    if (btnRepel) {
      btnRepel.addEventListener('click', () => {
        state.repelMouse = !state.repelMouse;
        btnRepel.textContent = state.repelMouse ? 'Interaksi Cursor (Repel)' : 'Interaksi Cursor (Bebas)';
        btnRepel.classList.toggle('active', state.repelMouse);
      });
    }

    // Sync API Button
    const btnSync = document.getElementById('btnSyncApi');
    if (btnSync) {
      btnSync.addEventListener('click', () => {
        btnSync.style.transform = 'scale(0.96)';
        setTimeout(() => { btnSync.style.transform = ''; }, 200);
        fetchMetricsFromAPI();
        fetchSectorsFromAPI();
        fetchTelemetryFromAPI();
      });
    }

    // Clear Logs Button
    const btnClearLogs = document.getElementById('btnClearLogs');
    if (btnClearLogs) {
      btnClearLogs.addEventListener('click', () => {
        const feed = document.getElementById('telemetryFeed');
        if (feed) feed.innerHTML = `<div style="color: var(--text-muted); font-size: 0.78rem;">Log dibersihkan. Menunggu stream aktivitas baru...</div>`;
      });
    }
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  window.addEventListener('resize', resizeCanvas);

  document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    initParticles();
    renderCanvas();
    initParallaxTilt();
    setupControls();
    runGSAPEntrance();

    // Fetch initial API data
    fetchMetricsFromAPI();
    fetchSectorsFromAPI();
    fetchTelemetryFromAPI();

    // Auto-refresh telemetry feed every 8 seconds
    setInterval(fetchTelemetryFromAPI, 8000);
  });

})();
