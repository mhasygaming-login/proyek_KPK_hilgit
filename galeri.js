/**
 * galeri.js — Modul Interaktif Galeri Pelaku Korupsi
 * Membaca data dari data/pelaku.json via fetch(), mendukung live search,
 * multi-sorting nominal terbesar/terkecil, dan rendering kartu dinamis.
 */

(function () {
  'use strict';

  let rawPelakuData = [];
  let currentFilteredData = [];

  // Data fallback darurat jika dibuka via file:// tanpa local server
  const FALLBACK_PELAKU = [
    {
      "id": "PEL-001",
      "nama": "Surya Darmadi",
      "alias": "Apeng",
      "jabatan": "Pemilik PT Duta Palma Group",
      "instansi": "Swasta",
      "kasus": "Korupsi Penyerobotan Kawasan Hutan Lindung untuk Perkebunan Kelapa Sawit di Kab. Indragiri Hulu",
      "nominal_kerugian": 39700000000000,
      "nominal_formatted": "Rp 39,70 Triliun",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2022,
      "foto_url": "assets/images/pelaku/pelaku-001.svg"
    },
    {
      "id": "PEL-002",
      "nama": "Emirsyah Satar",
      "alias": "Emirsyah",
      "jabatan": "Direktur Utama PT Garuda Indonesia (Persero) Tbk",
      "instansi": "BUMN",
      "kasus": "Suap dan TPPU Pengadaan Mesin Pesawat Rolls-Royce dan Armada Airbus Garuda Indonesia",
      "nominal_kerugian": 9350000000000,
      "nominal_formatted": "Rp 9,35 Triliun",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2020,
      "foto_url": "assets/images/pelaku/pelaku-002.svg"
    },
    {
      "id": "PEL-003",
      "nama": "Setya Novanto",
      "alias": "Setnov",
      "jabatan": "Ketua DPR RI Periode 2014-2019",
      "instansi": "Kementerian",
      "kasus": "Korupsi Proyek Pengadaan Kartu Tanda Penduduk Elektronik (KTP-el) Nasional",
      "nominal_kerugian": 2314000000000,
      "nominal_formatted": "Rp 2,31 Triliun",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2017,
      "foto_url": "assets/images/pelaku/pelaku-003.svg"
    },
    {
      "id": "PEL-004",
      "nama": "Karen Agustiawan",
      "alias": "Karen Galaila",
      "jabatan": "Direktur Utama PT Pertamina (Persero)",
      "instansi": "BUMN",
      "kasus": "Korupsi Pengadaan Gas Alam Cair / Liquefied Natural Gas (LNG) Corpus Christi Liquefaction",
      "nominal_kerugian": 1770000000000,
      "nominal_formatted": "Rp 1,77 Triliun",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2024,
      "foto_url": "assets/images/pelaku/pelaku-004.svg"
    },
    {
      "id": "PEL-005",
      "nama": "Djoko Soegiarto Tjandra",
      "alias": "Joker",
      "jabatan": "Direktur PT Era Giat Prima",
      "instansi": "Swasta",
      "kasus": "Suap dan Pemufakatan Jahat Red Notice Serta Pengurusan Fatwa MA Kasus Cessie Bank Bali",
      "nominal_kerugian": 904000000000,
      "nominal_formatted": "Rp 904 Miliar",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2020,
      "foto_url": "assets/images/pelaku/pelaku-005.svg"
    },
    {
      "id": "PEL-006",
      "nama": "Abdul Gani Kasuba",
      "alias": "AGK",
      "jabatan": "Gubernur Maluku Utara (2014-2023)",
      "instansi": "Pemda",
      "kasus": "Suap Penerbitan Izin Usaha Pertambangan (IUP) Nikel dan Jual Beli Jabatan Pejabat Pemprov Malut",
      "nominal_kerugian": 109700000000,
      "nominal_formatted": "Rp 109,7 Miliar",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2024,
      "foto_url": "assets/images/pelaku/pelaku-006.svg"
    },
    {
      "id": "PEL-007",
      "nama": "Syahrul Yasin Limpo",
      "alias": "SYL",
      "jabatan": "Menteri Pertanian RI (2019-2023)",
      "instansi": "Kementerian",
      "kasus": "Pemerasan Pejabat Eselon I dan Penerimaan Gratifikasi di Lingkungan Kementerian Pertanian",
      "nominal_kerugian": 44500000000,
      "nominal_formatted": "Rp 44,5 Miliar",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2023,
      "foto_url": "assets/images/pelaku/pelaku-007.svg"
    },
    {
      "id": "PEL-008",
      "nama": "Rahmat Effendi",
      "alias": "Pepen",
      "jabatan": "Walikota Bekasi (2018-2022)",
      "instansi": "Pemda",
      "kasus": "Penerimaan Suap Pengadaan Barang dan Jasa, Ganti Rugi Lahan, Serta Lelang Jabatan Pemkot Bekasi",
      "nominal_kerugian": 17000000000,
      "nominal_formatted": "Rp 17,0 Miliar",
      "status_hukum": "Tersangka",
      "tahun_penindakan": 2022,
      "foto_url": "assets/images/pelaku/pelaku-008.svg"
    }
  ];

  // Helper badge status hukum (Merah untuk Terpidana, Kuning untuk Tersangka)
  function getStatusBadgeHtml(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('terpidana')) {
      return `<span class="status-badge badge-terpidana">
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>
        ${status}
      </span>`;
    } else if (s.includes('tersangka')) {
      return `<span class="status-badge badge-tersangka">
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>
        ${status}
      </span>`;
    } else {
      return `<span class="status-badge badge-terdakwa">
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>
        ${status}
      </span>`;
    }
  }

  // Helper kelas styling instansi
  function getInstansiClass(instansi) {
    const i = (instansi || '').toLowerCase();
    if (i.includes('swasta')) return 'instansi-swasta';
    if (i.includes('bumn')) return 'instansi-bumn';
    if (i.includes('kementerian')) return 'instansi-kementerian';
    if (i.includes('pemda')) return 'instansi-pemda';
    return 'instansi-bumn';
  }

  // Inisialisasi pengambilan data via fetch
  async function loadData() {
    try {
      // Coba fetch dari data/pelaku.json terlebih dahulu
      const res = await fetch('data/pelaku.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rawPelakuData = await res.json();
    } catch (err) {
      console.warn('Gagal membaca data/pelaku.json via fetch, mencoba fallback lokal.', err);
      rawPelakuData = FALLBACK_PELAKU;
    }

    currentFilteredData = [...rawPelakuData];
    setupEventListeners();
    applyFilterAndSort();
  }

  // Setup Event Listener (Pencarian & Sorting)
  function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const instansiPills = document.querySelectorAll('.instansi-filter-btn');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        applyFilterAndSort();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        applyFilterAndSort();
      });
    }

    if (instansiPills.length > 0) {
      instansiPills.forEach((pill) => {
        pill.addEventListener('click', () => {
          instansiPills.forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          applyFilterAndSort();
        });
      });
    }
  }

  // Filter & Sort Data
  function applyFilterAndSort() {
    const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const sortVal = document.getElementById('sort-select')?.value || 'nominal-desc';
    const activePill = document.querySelector('.instansi-filter-btn.active');
    const selectedInstansi = activePill ? activePill.getAttribute('data-instansi') : 'all';

    // 1. Filter Nama, Jabatan, Kasus, Instansi
    currentFilteredData = rawPelakuData.filter((item) => {
      const matchInstansi = selectedInstansi === 'all' || item.instansi.toLowerCase() === selectedInstansi.toLowerCase();
      const matchSearch =
        !searchVal ||
        item.nama.toLowerCase().includes(searchVal) ||
        (item.alias && item.alias.toLowerCase().includes(searchVal)) ||
        item.jabatan.toLowerCase().includes(searchVal) ||
        item.kasus.toLowerCase().includes(searchVal) ||
        item.instansi.toLowerCase().includes(searchVal);

      return matchInstansi && matchSearch;
    });

    // 2. Sorting Nominal Terbesar / Terkecil
    currentFilteredData.sort((a, b) => {
      if (sortVal === 'nominal-desc') {
        return b.nominal_kerugian - a.nominal_kerugian;
      } else if (sortVal === 'nominal-asc') {
        return a.nominal_kerugian - b.nominal_kerugian;
      } else if (sortVal === 'tahun-desc') {
        return b.tahun_penindakan - a.tahun_penindakan;
      }
      return 0;
    });

    renderCards(currentFilteredData);
    updateResultCount(currentFilteredData.length, rawPelakuData.length);
  }

  // Update Teks Jumlah Hasil
  function updateResultCount(shown, total) {
    const countEl = document.getElementById('result-count');
    if (countEl) {
      countEl.textContent = `Menampilkan ${shown} dari ${total} data pelaku korupsi terdaftar`;
    }
  }

  // Render Card Grid ke DOM
  function renderCards(items) {
    const gridContainer = document.getElementById('cards-grid-container');
    if (!gridContainer) return;

    if (items.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: #ffffff; border-radius: 14px; border: 1px dashed #cbd5e1;">
          <svg style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">Pelaku Tidak Ditemukan</h3>
          <p style="font-size: 0.9rem; color: #64748b;">Silakan masukkan kata kunci nama atau jabatan lain.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = items
      .map((item) => {
        const instansiClass = getInstansiClass(item.instansi);
        const statusBadge = getStatusBadgeHtml(item.status_hukum);
        const initials = item.nama
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        return `
        <article class="corruptor-card" data-id="${item.id}">
          <div class="card-top">
            <span class="instansi-tag ${instansiClass}">${item.instansi}</span>
            <span class="year-tag">Tahun ${item.tahun_penindakan}</span>
          </div>

          <div class="card-body">
            <div class="avatar-container">
              <img 
                src="${item.foto_url}" 
                alt="Foto ${item.nama}" 
                class="avatar-img"
                loading="lazy"
                onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=0f172a&color=ffffff&bold=true&size=140';"
              />
            </div>
            <div class="identity-meta">
              <h3 class="card-name">${item.nama}</h3>
              ${item.alias ? `<div class="card-alias">Alias: "${item.alias}"</div>` : ''}
              <div class="card-jabatan">${item.jabatan}</div>
            </div>
          </div>

          <div class="card-case">
            <div class="case-desc" title="${item.kasus}">
              <strong>Kasus:</strong> ${item.kasus}
            </div>
            <div class="loss-box">
              <div class="loss-label">Total Nominal Korupsi</div>
              <div class="loss-value">${item.nominal_formatted}</div>
            </div>
          </div>

          <div class="card-bottom">
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Status Penanganan:</div>
            ${statusBadge}
          </div>
        </article>
      `;
      })
      .join('');
  }

  // Inisialisasi saat DOM siap
  document.addEventListener('DOMContentLoaded', loadData);
})();
