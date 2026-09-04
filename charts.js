/**
 * charts.js — Terminal Analitik Finansial / Trading Style (Chart.js Engine)
 * Fitur:
 * 1. Line/Area Chart dengan Glow Gradient: "Total Kerugian Negara vs Aset Dipulihkan"
 * 2. Bar Chart / Candlestick Style: "Nominal Kerugian per Sektor" & "Fluktuasi Bulanan"
 * 3. Timeframe Filter: [1 Bulan] [6 Bulan] [1 Tahun] [Semua Waktu]
 * 4. Mode Tampilan Switcher (Area Glow / Sektor / Fluktuasi)
 * 5. Pengisian data Ledger / Orderbook Transaksi Perkara Korupsi
 */

(function () {
  'use strict';

  let tradingChartInstance = null;
  let rawPelakuData = [];
  let currentMode = 'area'; // 'area', 'sector', 'monthly'
  let currentTimeframe = 'all'; // '1m', '6m', '1y', 'all'

  // Dataset kronologis bulanan / semesteran untuk mode trading
  const TIMEFRAME_DATA = {
    '1m': {
      labels: ['Mgg 1', 'Mgg 2', 'Mgg 3', 'Mgg 4'],
      kerugian: [1.2, 2.4, 1.8, 3.1], // Dalam Triliun
      pemulihan: [0.8, 1.9, 1.4, 2.5],
      volatilitas: [4, 7, 5, 9]
    },
    '6m': {
      labels: ['Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep'],
      kerugian: [8.5, 14.2, 11.0, 22.4, 18.9, 39.7],
      pemulihan: [4.2, 8.1, 7.5, 14.8, 12.0, 19.8],
      volatilitas: [12, 18, 15, 26, 21, 34]
    },
    '1y': {
      labels: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'],
      kerugian: [16.4, 28.5, 39.7, 54.89],
      pemulihan: [8.1, 15.2, 24.8, 41.2],
      volatilitas: [22, 35, 42, 58]
    },
    'all': {
      labels: ['2017', '2019', '2020', '2021', '2022', '2023', '2024'],
      kerugian: [2.31, 2.45, 10.25, 10.35, 39.7, 44.5, 54.89],
      pemulihan: [1.15, 1.30, 6.20, 6.80, 22.4, 28.9, 41.20],
      volatilitas: [15, 18, 38, 42, 78, 65, 94]
    }
  };

  // Fallback Data Pelaku
  const FALLBACK_DATA = [
    { nama: "Surya Darmadi", instansi: "Swasta", nominal_kerugian: 39700000000000, tahun_penindakan: 2022, status_hukum: "Terpidana", nominal_formatted: "Rp 39,70 Triliun" },
    { nama: "Emirsyah Satar", instansi: "BUMN", nominal_kerugian: 9350000000000, tahun_penindakan: 2020, status_hukum: "Terpidana", nominal_formatted: "Rp 9,35 Triliun" },
    { nama: "Setya Novanto", instansi: "Kementerian", nominal_kerugian: 2314000000000, tahun_penindakan: 2017, status_hukum: "Terpidana", nominal_formatted: "Rp 2,31 Triliun" },
    { nama: "Karen Agustiawan", instansi: "BUMN", nominal_kerugian: 1770000000000, tahun_penindakan: 2024, status_hukum: "Terpidana", nominal_formatted: "Rp 1,77 Triliun" },
    { nama: "Djoko Tjandra", instansi: "Swasta", nominal_kerugian: 904000000000, tahun_penindakan: 2020, status_hukum: "Terpidana", nominal_formatted: "Rp 904 Miliar" },
    { nama: "Abdul Gani Kasuba", instansi: "Pemda", nominal_kerugian: 109700000000, tahun_penindakan: 2024, status_hukum: "Terpidana", nominal_formatted: "Rp 109,7 Miliar" },
    { nama: "Syahrul Yasin Limpo", instansi: "Kementerian", nominal_kerugian: 44500000000, tahun_penindakan: 2023, status_hukum: "Terpidana", nominal_formatted: "Rp 44,5 Miliar" },
    { nama: "Rahmat Effendi", instansi: "Pemda", nominal_kerugian: 17000000000, tahun_penindakan: 2022, status_hukum: "Tersangka", nominal_formatted: "Rp 17,0 Miliar" }
  ];

  // Inisialisasi Data
  async function initTradingAnalytics() {
    try {
      const res = await fetch('data/pelaku.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rawPelakuData = await res.json();
    } catch (e) {
      console.warn('Menggunakan fallback data untuk trading terminal:', e);
      rawPelakuData = FALLBACK_DATA;
    }

    setupChartControls();
    renderTradingChart();
    populateLedgerTable();
  }

  // Setup Tombol Timeframe & Mode
  function setupChartControls() {
    // Timeframe Buttons
    const tfButtons = document.querySelectorAll('.tf-btn[data-tf]');
    tfButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tfButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTimeframe = btn.getAttribute('data-tf');
        renderTradingChart();
      });
    });

    // Chart Mode Buttons (Area Glow vs Sektor vs Fluktuasi)
    const modeButtons = document.querySelectorAll('.mode-btn[data-mode]');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.getAttribute('data-mode');
        renderTradingChart();
      });
    });
  }

  // Render Grafik Gaya TradingView
  function renderTradingChart() {
    const canvas = document.getElementById('tradingMainChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const tfData = TIMEFRAME_DATA[currentTimeframe] || TIMEFRAME_DATA['all'];

    if (tradingChartInstance) {
      tradingChartInstance.destroy();
    }

    let chartConfig = null;

    if (currentMode === 'area') {
      // 1. Line / Area Chart with Glow Gradients: Kerugian vs Pemulihan
      const gradientRed = ctx.createLinearGradient(0, 0, 0, 380);
      gradientRed.addColorStop(0, 'rgba(220, 38, 38, 0.45)');
      gradientRed.addColorStop(1, 'rgba(220, 38, 38, 0.0)');

      const gradientCyan = ctx.createLinearGradient(0, 0, 0, 380);
      gradientCyan.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      gradientCyan.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      chartConfig = {
        type: 'line',
        data: {
          labels: tfData.labels,
          datasets: [
            {
              label: 'Total Kerugian Negara (Triliun IDR)',
              data: tfData.kerugian,
              borderColor: '#dc2626',
              backgroundColor: gradientRed,
              borderWidth: 2.5,
              tension: 0.38,
              fill: true,
              pointBackgroundColor: '#dc2626',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 8
            },
            {
              label: 'Aset Recovery & Denda Dipulihkan (Triliun IDR)',
              data: tfData.pemulihan,
              borderColor: '#06b6d4',
              backgroundColor: gradientCyan,
              borderWidth: 2.5,
              tension: 0.38,
              fill: true,
              pointBackgroundColor: '#06b6d4',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 8
            }
          ]
        },
        options: getTradingOptions('Triliun IDR')
      };
    } else if (currentMode === 'sector') {
      // 2. Bar Chart Gaya Candlestick: Nominal per Sektor
      const sectorTotals = { 'Swasta': 0, 'BUMN': 0, 'Kementerian': 0, 'Pemda': 0 };
      rawPelakuData.forEach(d => {
        const instansi = d.instansi || 'Swasta';
        if (sectorTotals.hasOwnProperty(instansi)) {
          sectorTotals[instansi] += (d.nominal_kerugian / 1e12);
        } else {
          sectorTotals['Swasta'] += (d.nominal_kerugian / 1e12);
        }
      });

      const sectorLabels = Object.keys(sectorTotals);
      const sectorValues = Object.values(sectorTotals);

      chartConfig = {
        type: 'bar',
        data: {
          labels: sectorLabels,
          datasets: [{
            label: 'Kerugian Negara per Sektor (Triliun IDR)',
            data: sectorValues,
            backgroundColor: [
              'rgba(220, 38, 38, 0.85)',
              'rgba(199, 154, 60, 0.85)',
              'rgba(6, 182, 212, 0.85)',
              'rgba(16, 185, 129, 0.85)'
            ],
            borderColor: ['#dc2626', '#c79a3c', '#06b6d4', '#10b981'],
            borderWidth: 1.5,
            borderRadius: 6,
            maxBarThickness: 54
          }]
        },
        options: getTradingOptions('Triliun IDR')
      };
    } else {
      // 3. Fluktuasi Kasus & Indeks Volatilitas
      chartConfig = {
        type: 'bar',
        data: {
          labels: tfData.labels,
          datasets: [{
            label: 'Indeks Intensitas Penindakan KPK',
            data: tfData.volatilitas,
            backgroundColor: 'rgba(6, 182, 212, 0.65)',
            borderColor: '#06b6d4',
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: getTradingOptions('Poin Indeks')
      };
    }

    tradingChartInstance = new Chart(ctx, chartConfig);
  }

  // Opsi Format TradingView Dark
  function getTradingOptions(unit) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
            color: '#94a3b8',
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(11, 19, 36, 0.95)',
          titleFont: { family: 'JetBrains Mono', size: 13, weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          borderColor: 'rgba(6, 182, 212, 0.3)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} ${unit}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            font: { family: 'JetBrains Mono', size: 11, weight: '600' },
            color: '#64748b'
          }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            font: { family: 'JetBrains Mono', size: 11 },
            color: '#64748b',
            callback: (val) => `${val} T`
          }
        }
      }
    };
  }

  // Isi Tabel Ledger / Orderbook Finansial
  function populateLedgerTable() {
    const tableBody = document.getElementById('ledgerTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = rawPelakuData.map((item, idx) => {
      const isRecoveryHigh = (item.nominal_kerugian > 1e12);
      const estRecovery = (item.nominal_kerugian * 0.15); // Estimasi sitaan

      return `
        <tr>
          <td><span style="color: #94a3b8;">#${String(idx + 1).padStart(2, '0')}</span></td>
          <td><strong style="color: #ffffff;">${item.nama}</strong> <span style="font-size: 0.72rem; color: #64748b;">(${item.instansi})</span></td>
          <td class="ledger-loss">${item.nominal_formatted}</td>
          <td class="ledger-recovery">${(estRecovery >= 1e12 ? `Rp ${(estRecovery / 1e12).toFixed(2)} T` : `Rp ${(estRecovery / 1e9).toFixed(1)} M`)}</td>
          <td>
            <span class="status-badge ${item.status_hukum === 'Terpidana' ? 'badge-terpidana' : 'badge-tersangka'}">
              ${item.status_hukum}
            </span>
          </td>
          <td style="color: #94a3b8;">${item.tahun_penindakan}</td>
        </tr>
      `;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', initTradingAnalytics);
})();
