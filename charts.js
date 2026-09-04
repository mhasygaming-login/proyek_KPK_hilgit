/**
 * charts.js — Dashboard Analisis Kerugian Negara (Chart.js)
 * Visualisasi:
 * 1. Bar Chart: 10 Kasus Korupsi dengan Nominal Terbesar
 * 2. Doughnut/Pie Chart: Persentase Korupsi Berdasarkan Sektor (BUMN, Pemda, Kementerian, Swasta)
 * Dilengkapi filter tombol tahun interaktif dan responsif di HP/Laptop.
 */

(function () {
  'use strict';

  let rawData = [];
  let barChartInstance = null;
  let pieChartInstance = null;
  let activeYearFilter = 'all';

  // Fallback dataset jika dibuka tanpa HTTP server
  const FALLBACK_DATA = [
    { nama: "Surya Darmadi", instansi: "Swasta", nominal_kerugian: 39700000000000, tahun_penindakan: 2022 },
    { nama: "Emirsyah Satar", instansi: "BUMN", nominal_kerugian: 9350000000000, tahun_penindakan: 2020 },
    { nama: "Setya Novanto", instansi: "Kementerian", nominal_kerugian: 2314000000000, tahun_penindakan: 2017 },
    { nama: "Karen Agustiawan", instansi: "BUMN", nominal_kerugian: 1770000000000, tahun_penindakan: 2024 },
    { nama: "Djoko Tjandra", instansi: "Swasta", nominal_kerugian: 904000000000, tahun_penindakan: 2020 },
    { nama: "Abdul G. Kasuba", instansi: "Pemda", nominal_kerugian: 109700000000, tahun_penindakan: 2024 },
    { nama: "Syahrul Y. Limpo", instansi: "Kementerian", nominal_kerugian: 44500000000, tahun_penindakan: 2023 },
    { nama: "Rahmat Effendi", instansi: "Pemda", nominal_kerugian: 17000000000, tahun_penindakan: 2022 }
  ];

  // Formatter Rupiah
  function formatCurrency(val) {
    if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(2)} T`;
    if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(1)} M`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  }

  // Ambil data dari data/pelaku.json
  async function initData() {
    try {
      const res = await fetch('data/pelaku.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rawData = await res.json();
    } catch (e) {
      console.warn('Menggunakan fallback data untuk chart:', e);
      rawData = FALLBACK_DATA;
    }

    setupYearFilters();
    renderCharts();
  }

  // Setup tombol filter pilihan tahun ("Semua Tahun", "2024", "2023", "2022", "2020-2017")
  function setupYearFilters() {
    const filterButtons = document.querySelectorAll('.year-btn');
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeYearFilter = btn.getAttribute('data-year');
        renderCharts();
      });
    });
  }

  // Filter dataset berdasarkan tahun yang dipilih
  function getFilteredDataset() {
    if (activeYearFilter === 'all') {
      return rawData;
    } else if (activeYearFilter.includes('-')) {
      const [start, end] = activeYearFilter.split('-').map(Number);
      return rawData.filter((d) => d.tahun_penindakan >= start && d.tahun_penindakan <= end);
    } else {
      const targetYear = Number(activeYearFilter);
      return rawData.filter((d) => d.tahun_penindakan === targetYear);
    }
  }

  // Render / Update kedua grafik
  function renderCharts() {
    const dataset = getFilteredDataset();
    updateSummaryStats(dataset);
    renderBarChart(dataset);
    renderPieChart(dataset);
  }

  // Update kartu ringkasan di atas grafik
  function updateSummaryStats(data) {
    const totalKerugian = data.reduce((acc, curr) => acc + (curr.nominal_kerugian || 0), 0);
    const totalEl = document.getElementById('stat-total-kerugian');
    const kasusEl = document.getElementById('stat-total-kasus');

    if (totalEl) totalEl.textContent = formatCurrency(totalKerugian);
    if (kasusEl) kasusEl.textContent = `${data.length} Kasus`;
  }

  // 1. Chart 1 (Bar Chart): "10 Kasus Korupsi dengan Nominal Terbesar"
  function renderBarChart(data) {
    const ctx = document.getElementById('barChartNominal');
    if (!ctx) return;

    // Urutkan dari terbesar ke terkecil, ambil 10 teratas
    const sorted = [...data]
      .sort((a, b) => b.nominal_kerugian - a.nominal_kerugian)
      .slice(0, 10);

    const labels = sorted.map((d) => (d.nama.length > 16 ? d.nama.substring(0, 16) + '...' : d.nama));
    const values = sorted.map((d) => d.nominal_kerugian);

    // Palet warna resmi: Merah KPK (#dc2626) untuk puncak, Dark Slate (#0f172a) untuk berikutnya
    const bgColors = sorted.map((_, idx) => (idx === 0 ? '#dc2626' : idx < 3 ? '#ef4444' : '#0f172a'));

    if (barChartInstance) {
      barChartInstance.destroy();
    }

    barChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Nominal Kerugian (Rp)',
            data: values,
            backgroundColor: bgColors,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            maxBarThickness: 44
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' },
            bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                return `${sorted[idx].nama} (${sorted[idx].instansi})`;
              },
              label: (context) => `Kerugian: ${formatCurrency(context.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
              color: '#334155'
            }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'Plus Jakarta Sans', size: 11 },
              color: '#64748b',
              callback: (val) => formatCurrency(val)
            }
          }
        }
      }
    });
  }

  // 2. Chart 2 (Pie/Doughnut Chart): "Persentase Korupsi Berdasarkan Sektor"
  function renderPieChart(data) {
    const ctx = document.getElementById('pieChartSektor');
    if (!ctx) return;

    // Hitung akumulasi per instansi / sektor (BUMN, Pemda, Kementerian, Swasta)
    const sectors = { Swasta: 0, BUMN: 0, Kementerian: 0, Pemda: 0 };
    data.forEach((d) => {
      const instansi = d.instansi || 'Swasta';
      if (sectors.hasOwnProperty(instansi)) {
        sectors[instansi] += d.nominal_kerugian;
      } else {
        sectors['Swasta'] += d.nominal_kerugian;
      }
    });

    const labels = Object.keys(sectors);
    const values = Object.values(sectors);

    // Palet warna resmi pemerintah
    const colors = [
      '#dc2626', // Swasta (Merah)
      '#c79a3c', // BUMN (Gold)
      '#0f172a', // Kementerian (Dark Slate)
      '#10b981'  // Pemda (Emerald)
    ];

    if (pieChartInstance) {
      pieChartInstance.destroy();
    }

    pieChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
              color: '#1e293b',
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${formatCurrency(val)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Load saat DOM siap
  document.addEventListener('DOMContentLoaded', initData);
})();
