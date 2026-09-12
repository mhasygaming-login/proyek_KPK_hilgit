/**
 * ==========================================================================
 * charts.js — Terminal Analitik Finansial / Trading Style (Chart.js Engine)
 * Portal Transparansi Data Korupsi KPK
 * ==========================================================================
 * Fitur:
 * 1. Line/Area Chart dengan Glow Gradient: "Total Kerugian Negara vs Aset yang Diberantas"
 * 2. Bar / Candlestick Style Chart: "Nominal Kerugian per Sektor" & "Fluktuasi Bulanan"
 * 3. Timeframe Filter: [1 Bulan] [6 Bulan] [1 Tahun] [Semua Waktu]
 * 4. Mode Tampilan Switcher (Area Glow / Sektor / Fluktuasi)
 * 5. Pengisian & Pencarian Ledger / Orderbook Audit Transaksi Perkara
 * 6. Ticker Bar Telemetry Sync
 * ==========================================================================
 */

(function () {
  'use strict';

  let tradingChartInstance = null;
  let rawPelakuData = [];
  let currentMode = 'area'; // 'area', 'sector', 'monthly'
  let currentTimeframe = 'all'; // '1m', '6m', '1y', 'all'

  // Dataset kronologis pergerakan kerugian negara vs aset disita (dalam Triliun IDR)
  const TIMEFRAME_DATA = {
    '1m': {
      labels: ['Mgg 1 (Agus)', 'Mgg 2 (Agus)', 'Mgg 3 (Sep)', 'Mgg 4 (Sep)'],
      kerugian: [48.2, 50.1, 52.4, 54.89],
      pemulihan: [36.5, 38.0, 39.8, 41.2],
      fluktuasi_kasus: [2, 4, 3, 5],
      monthly_loss: [1.9, 2.3, 2.5, 3.1],
      monthly_recovered: [1.2, 1.8, 1.9, 2.6]
    },
    '6m': {
      labels: ['Apr 2025', 'Mei 2025', 'Jun 2025', 'Jul 2025', 'Agu 2025', 'Sep 2025'],
      kerugian: [22.4, 28.6, 35.1, 41.8, 48.2, 54.89],
      pemulihan: [16.8, 21.4, 26.2, 31.5, 36.5, 41.2],
      fluktuasi_kasus: [6, 9, 8, 14, 11, 16],
      monthly_loss: [6.2, 7.5, 6.7, 8.4, 9.1, 10.2],
      monthly_recovered: [4.6, 5.8, 5.2, 6.7, 7.2, 8.1]
    },
    '1y': {
      labels: ['Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025'],
      kerugian: [16.4, 28.5, 39.7, 54.89],
      pemulihan: [11.2, 19.8, 28.4, 41.2],
      fluktuasi_kasus: [14, 22, 29, 38],
      monthly_loss: [12.1, 14.8, 16.2, 18.9],
      monthly_recovered: [8.9, 11.2, 12.6, 15.1]
    },
    'all': {
      labels: ['2017', '2019', '2020', '2021', '2022', '2023', '2024', '2025/2026'],
      kerugian: [2.31, 2.45, 10.25, 12.10, 39.70, 44.50, 52.10, 54.89],
      pemulihan: [1.15, 1.30, 6.20, 7.40, 26.40, 31.90, 38.60, 41.20],
      fluktuasi_kasus: [8, 12, 24, 28, 52, 44, 61, 78],
      monthly_loss: [2.31, 2.45, 10.25, 12.1, 39.7, 44.5, 52.1, 54.89],
      monthly_recovered: [1.15, 1.3, 6.2, 7.4, 26.4, 31.9, 38.6, 41.2]
    }
  };

  // Fallback Data Pelaku jika fetch lokal diblokir browser
  const FALLBACK_DATA = [
    { id: "PEL-001", nama: "Surya Darmadi", instansi: "Swasta", nominal_kerugian: 39700000000000, tahun_penindakan: 2022, status_hukum: "Terpidana", nominal_formatted: "Rp 39,70 Triliun", kasus: "Korupsi Lahan Hutan Lindung Indragiri Hulu" },
    { id: "PEL-002", nama: "Emirsyah Satar", instansi: "BUMN", nominal_kerugian: 9350000000000, tahun_penindakan: 2020, status_hukum: "Terpidana", nominal_formatted: "Rp 9,35 Triliun", kasus: "Suap & TPPU Pengadaan Mesin Pesawat Rolls-Royce" },
    { id: "PEL-003", nama: "Setya Novanto", instansi: "Kementerian", nominal_kerugian: 2314000000000, tahun_penindakan: 2017, status_hukum: "Terpidana", nominal_formatted: "Rp 2,31 Triliun", kasus: "Korupsi KTP Elektronik (KTP-el) Nasional" },
    { id: "PEL-004", nama: "Karen Agustiawan", instansi: "BUMN", nominal_kerugian: 1770000000000, tahun_penindakan: 2024, status_hukum: "Terpidana", nominal_formatted: "Rp 1,77 Triliun", kasus: "Korupsi LNG Corpus Christi Liquefaction" },
    { id: "PEL-005", nama: "Djoko Tjandra", instansi: "Swasta", nominal_kerugian: 904000000000, tahun_penindakan: 2020, status_hukum: "Terpidana", nominal_formatted: "Rp 904 Miliar", kasus: "Suap Red Notice & Fatwa MA Cessie Bank Bali" },
    { id: "PEL-006", nama: "Abdul Gani Kasuba", instansi: "Pemda", nominal_kerugian: 109700000000, tahun_penindakan: 2024, status_hukum: "Terpidana", nominal_formatted: "Rp 109,7 Miliar", kasus: "Suap Izin Usaha Pertambangan Nikel Malut" },
    { id: "PEL-007", nama: "Syahrul Yasin Limpo", instansi: "Kementerian", nominal_kerugian: 44500000000, tahun_penindakan: 2023, status_hukum: "Terpidana", nominal_formatted: "Rp 44,5 Miliar", kasus: "Pemerasan & Gratifikasi Pejabat Kementan" },
    { id: "PEL-008", nama: "Rahmat Effendi", instansi: "Pemda", nominal_kerugian: 17000000000, tahun_penindakan: 2022, status_hukum: "Tersangka", nominal_formatted: "Rp 17,0 Miliar", kasus: "Suap Pengadaan Lahan & Lelang Jabatan Bekasi" }
  ];

  // Inisialisasi Trading Analytics
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
    setupLedgerSearch();
  }

  // Setup Listener untuk Tombol Timeframe & Mode
  function setupChartControls() {
    // Tombol Timeframe [1m, 6m, 1y, all]
    const tfButtons = document.querySelectorAll('.tf-btn[data-tf]');
    tfButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        tfButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTimeframe = btn.getAttribute('data-tf');
        renderTradingChart();
      });
    });

    // Tombol Mode Tampilan (Area Glow / Bar Sektor / Fluktuasi)
    const modeButtons = document.querySelectorAll('.mode-btn[data-mode]');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.getAttribute('data-mode');
        renderTradingChart();
      });
    });
  }

  // Render Grafik Utama Trading Terminal
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
      // 1. Line/Area Chart Dual Glow Gradient: Kerugian vs Pemulihan
      const gradientRed = ctx.createLinearGradient(0, 0, 0, 360);
      gradientRed.addColorStop(0, 'rgba(220, 38, 38, 0.48)');
      gradientRed.addColorStop(0.7, 'rgba(220, 38, 38, 0.12)');
      gradientRed.addColorStop(1, 'rgba(220, 38, 38, 0.0)');

      const gradientCyan = ctx.createLinearGradient(0, 0, 0, 360);
      gradientCyan.addColorStop(0, 'rgba(6, 182, 212, 0.48)');
      gradientCyan.addColorStop(0.7, 'rgba(6, 182, 212, 0.12)');
      gradientCyan.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      chartConfig = {
        type: 'line',
        data: {
          labels: tfData.labels,
          datasets: [
            {
              label: 'Total Kerugian Negara',
              data: tfData.kerugian,
              borderColor: '#dc2626',
              backgroundColor: gradientRed,
              borderWidth: 2.8,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: '#dc2626',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 8,
              pointHoverBackgroundColor: '#ffffff',
              pointHoverBorderColor: '#dc2626'
            },
            {
              label: 'Aset yang Diberantas & Disita',
              data: tfData.pemulihan,
              borderColor: '#06b6d4',
              backgroundColor: gradientCyan,
              borderWidth: 2.8,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: '#06b6d4',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 8,
              pointHoverBackgroundColor: '#ffffff',
              pointHoverBorderColor: '#06b6d4'
            }
          ]
        },
        options: getTradingOptions('Triliun IDR', false)
      };
    } else if (currentMode === 'sector') {
      // 2. Bar Chart: Nominal Kerugian per Sektor
      const sectorTotals = { 'Swasta': 0, 'BUMN': 0, 'Kementerian': 0, 'Pemda': 0 };
      rawPelakuData.forEach(d => {
        const instansi = d.instansi || 'Swasta';
        const lossInTrillion = (d.nominal_kerugian || 0) / 1e12;
        if (sectorTotals.hasOwnProperty(instansi)) {
          sectorTotals[instansi] += lossInTrillion;
        } else {
          sectorTotals['Swasta'] += lossInTrillion;
        }
      });

      const sectorLabels = Object.keys(sectorTotals);
      const sectorValues = Object.values(sectorTotals).map(v => parseFloat(v.toFixed(2)));

      chartConfig = {
        type: 'bar',
        data: {
          labels: sectorLabels,
          datasets: [{
            label: 'Kerugian Negara per Sektor',
            data: sectorValues,
            backgroundColor: [
              'rgba(220, 38, 38, 0.85)',
              'rgba(199, 154, 60, 0.85)',
              'rgba(6, 182, 212, 0.85)',
              'rgba(16, 185, 129, 0.85)'
            ],
            borderColor: ['#dc2626', '#c79a3c', '#06b6d4', '#10b981'],
            borderWidth: 1.5,
            borderRadius: 8,
            maxBarThickness: 56
          }]
        },
        options: getTradingOptions('Triliun IDR', true)
      };
    } else {
      // 3. Fluktuasi Bulanan: Perbandingan Kerugian Bulanan vs Pemulihan Bulanan
      chartConfig = {
        type: 'bar',
        data: {
          labels: tfData.labels,
          datasets: [
            {
              label: 'Kerugian Negara Terungkap',
              data: tfData.monthly_loss,
              backgroundColor: 'rgba(220, 38, 38, 0.8)',
              borderColor: '#dc2626',
              borderWidth: 1.5,
              borderRadius: 6,
              maxBarThickness: 28
            },
            {
              label: 'Aset Pulih / Sitaan',
              data: tfData.monthly_recovered,
              backgroundColor: 'rgba(6, 182, 212, 0.8)',
              borderColor: '#06b6d4',
              borderWidth: 1.5,
              borderRadius: 6,
              maxBarThickness: 28
            }
          ]
        },
        options: getTradingOptions('Triliun IDR', true)
      };
    }

    tradingChartInstance = new Chart(ctx, chartConfig);
  }

  // Opsi Format Bloomberg / TradingView Theme
  function getTradingOptions(unit, isBar) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: 'easeOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
            color: '#94a3b8',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10, 15, 29, 0.95)',
          titleColor: '#ffffff',
          titleFont: { family: 'JetBrains Mono', size: 13, weight: 'bold' },
          bodyColor: '#cbd5e1',
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          borderColor: 'rgba(6, 182, 212, 0.35)',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 10,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
          callbacks: {
            label: (ctx) => `  ${ctx.dataset.label}: Rp ${ctx.raw} ${unit}`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            font: { family: 'JetBrains Mono', size: 11, weight: '600' },
            color: '#64748b',
            padding: 8
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            font: { family: 'JetBrains Mono', size: 11 },
            color: '#64748b',
            padding: 8,
            callback: (val) => `${val} T`
          }
        }
      }
    };
  }

  // Isi Tabel Ledger / Orderbook Finansial
  function populateLedgerTable(filterKeyword = '') {
    const tableBody = document.getElementById('ledgerTableBody');
    if (!tableBody) return;

    let items = rawPelakuData;
    if (filterKeyword) {
      const q = filterKeyword.toLowerCase().trim();
      items = items.filter(d => 
        (d.nama && d.nama.toLowerCase().includes(q)) ||
        (d.instansi && d.instansi.toLowerCase().includes(q)) ||
        (d.kasus && d.kasus.toLowerCase().includes(q))
      );
    }

    if (items.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: #64748b; padding: 2rem;">
            Tidak ada transaksi audit perkara yang cocok.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = items.map((item, idx) => {
      const lossVal = item.nominal_kerugian || 0;
      const estRecovery = lossVal * 0.15; // Estimasi sitaan aset rata-rata
      const recoveryFormatted = (estRecovery >= 1e12 
        ? `Rp ${(estRecovery / 1e12).toFixed(2)} T` 
        : `Rp ${(estRecovery / 1e9).toFixed(1)} M`);

      const statusClass = (item.status_hukum === 'Terpidana') ? 'badge-terpidana' : 'badge-tersangka';

      return `
        <tr>
          <td><span style="font-family: var(--font-mono); color: #94a3b8;">#${String(idx + 1).padStart(2, '0')}</span></td>
          <td>
            <div style="font-weight: 700; color: #ffffff;">${item.nama}</div>
            <div style="font-size: 0.72rem; color: #64748b;">${item.jabatan || item.instansi} • <span style="color: var(--color-cyan);">${item.instansi}</span></div>
          </td>
          <td class="ledger-loss">${item.nominal_formatted}</td>
          <td class="ledger-recovery">${recoveryFormatted}</td>
          <td>
            <span class="status-badge ${statusClass}">
              ${item.status_hukum}
            </span>
          </td>
          <td style="font-family: var(--font-mono); color: #94a3b8;">${item.tahun_penindakan}</td>
        </tr>
      `;
    }).join('');
  }

  // Setup Ledger Live Filter / Search bila ada elemen input
  function setupLedgerSearch() {
    const searchInput = document.getElementById('ledger-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        populateLedgerTable(e.target.value);
      });
    }
  }

  // Ekspor API Global
  window.KPKCharts = {
    setTimeframe: function (tf) {
      currentTimeframe = tf;
      renderTradingChart();
    },
    setMode: function (mode) {
      currentMode = mode;
      renderTradingChart();
    },
    refresh: function () {
      renderTradingChart();
      populateLedgerTable();
    }
  };

  document.addEventListener('DOMContentLoaded', initTradingAnalytics);
})();
