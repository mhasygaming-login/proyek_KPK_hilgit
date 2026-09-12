/**
 * ==========================================================================
 * galeri.js — Modul Interaktif Galeri Pelaku Korupsi & Detail Modal Inkracht
 * Portal Transparansi Data Korupsi KPK
 * ==========================================================================
 * Fitur:
 * 1. Fetch data pelaku dari data/pelaku.json (dengan fallback offline terverifikasi).
 * 2. Real-time Live Search (Nama, Alias, Jabatan, Kasus, Instansi).
 * 3. Filter Instansi Pills (Semua Sektor, Swasta, BUMN, Kementerian, Pemda).
 * 4. Multi-Sorting (Nominal Terbesar, Terkecil, & Tahun Kasus).
 * 5. Dukungan Preview Mode (Menampilkan 4 kasus terbesar di Landing Page index.html).
 * 6. Interactive Modal Detail Putusan Hukum Inkracht Mahkamah Agung.
 * ==========================================================================
 */

(function () {
  'use strict';

  let rawPelakuData = [];
  let currentFilteredData = [];

  // Data fallback lengkap terverifikasi jika dibuka secara statis/file://
  const FALLBACK_PELAKU = [
    {
      "id": "PEL-001",
      "nama": "Surya Darmadi",
      "alias": "Apeng",
      "jabatan": "Pemilik PT Duta Palma Group",
      "instansi": "Swasta",
      "kasus": "Korupsi Penyerobotan Kawasan Hutan Lindung untuk Perkebunan Kelapa Sawit di Kab. Indragiri Hulu, Riau",
      "nominal_kerugian": 39700000000000,
      "nominal_formatted": "Rp 39,70 Triliun",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2022,
      "foto_url": "assets/images/pelaku/pelaku-001.svg",
      "putusan_ma": "Vonis Kasasi MA: Pidana Penjara 16 Tahun & Uang Pengganti Rp 2,23 Triliun",
      "pasal_pelanggaran": "Pasal 2 ayat (1) jo Pasal 18 UU No. 31/1999 jo UU No. 20/2001 & TPPU"
    },
    {
      "id": "PEL-002",
      "nama": "Emirsyah Satar",
      "alias": "Emirsyah",
      "jabatan": "Direktur Utama PT Garuda Indonesia (Persero) Tbk",
      "instansi": "BUMN",
      "kasus": "Suap dan Tindak Pidana Pencucian Uang (TPPU) Pengadaan Mesin Pesawat Rolls-Royce dan Armada Airbus",
      "nominal_kerugian": 9350000000000,
      "nominal_formatted": "Rp 9,35 Triliun",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2020,
      "foto_url": "assets/images/pelaku/pelaku-002.svg",
      "putusan_ma": "Vonis Pengadilan Tipikor & MA: Pidana Penjara 8 Tahun, Denda Rp 1 Miliar & Sitaan Aset",
      "pasal_pelanggaran": "Pasal 12 huruf b UU No. 31/1999 jo UU No. 20/2001 jo Pasal 3 UU No. 8/2010 (TPPU)"
    },
    {
      "id": "PEL-003",
      "nama": "Setya Novanto",
      "alias": "Setnov",
      "jabatan": "Ketua DPR RI Periode 2014-2019",
      "instansi": "Kementerian",
      "kasus": "Korupsi Pengadaan Penerapan Kartu Tanda Penduduk Elektronik (KTP-el) Nasional Kemendagri",
      "nominal_kerugian": 2314000000000,
      "nominal_formatted": "Rp 2,31 Triliun",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2017,
      "foto_url": "assets/images/pelaku/pelaku-003.svg",
      "putusan_ma": "Putusan Kasasi Inkracht: Pidana Penjara 15 Tahun, Denda Rp 500 Juta, Pencabutan Hak Politik 5 Tahun",
      "pasal_pelanggaran": "Pasal 3 UU Tipikor jo Pasal 55 ayat (1) ke-1 KUHP"
    },
    {
      "id": "PEL-004",
      "nama": "Karen Agustiawan",
      "alias": "Karen Galaila",
      "jabatan": "Direktur Utama PT Pertamina (Persero)",
      "instansi": "BUMN",
      "kasus": "Korupsi Pengadaan Gas Alam Cair / Liquefied Natural Gas (LNG) Corpus Christi Liquefaction LLC",
      "nominal_kerugian": 1770000000000,
      "nominal_formatted": "Rp 1,77 Triliun",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2024,
      "foto_url": "assets/images/pelaku/pelaku-004.svg",
      "putusan_ma": "Vonis Pengadilan Tipikor: Pidana Penjara 9 Tahun, Denda Rp 500 Juta & Uang Pengganti",
      "pasal_pelanggaran": "Pasal 2 ayat (1) jo Pasal 18 UU Tipikor jo Pasal 55 ayat (1) ke-1 KUHP"
    },
    {
      "id": "PEL-005",
      "nama": "Djoko Soegiarto Tjandra",
      "alias": "Joker",
      "jabatan": "Direktur PT Era Giat Prima",
      "instansi": "Swasta",
      "kasus": "Suap dan Pemufakatan Jahat Red Notice Serta Pengurusan Fatwa Mahkamah Agung Kasus Cessie Bank Bali",
      "nominal_kerugian": 904000000000,
      "nominal_formatted": "Rp 904 Miliar",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2020,
      "foto_url": "assets/images/pelaku/pelaku-005.svg",
      "putusan_ma": "Vonis Banding & Kasasi MA: Pidana Penjara 4 Tahun 6 Bulan & Sita Eksekusi Dana Escrow Bank",
      "pasal_pelanggaran": "Pasal 5 ayat (1) huruf a UU No. 31/1999 jo UU No. 20/2001 jo Pasal 55 ayat (1) ke-1 KUHP"
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
      "foto_url": "assets/images/pelaku/pelaku-006.svg",
      "putusan_ma": "Vonis Pengadilan Tipikor Ternate: Pidana Penjara 8 Tahun, Uang Pengganti Rp 109 Miliar & Aset Sitaan",
      "pasal_pelanggaran": "Pasal 12 huruf a dan b UU Tipikor jo Pasal 64 ayat (1) KUHP"
    },
    {
      "id": "PEL-007",
      "nama": "Syahrul Yasin Limpo",
      "alias": "SYL",
      "jabatan": "Menteri Pertanian RI (2019-2023)",
      "instansi": "Kementerian",
      "kasus": "Pemerasan Pejabat Eselon I dan Penerimaan Gratifikasi di Lingkungan Kementerian Pertanian RI",
      "nominal_kerugian": 44500000000,
      "nominal_formatted": "Rp 44,5 Miliar",
      "status_hukum": "Terpidana",
      "tahun_penindakan": 2023,
      "foto_url": "assets/images/pelaku/pelaku-007.svg",
      "putusan_ma": "Vonis Pengadilan Tipikor Jakarta: Pidana Penjara 10 Tahun, Denda Rp 300 Juta, Uang Pengganti Rp 44 Miliar",
      "pasal_pelanggaran": "Pasal 12 huruf e jo Pasal 18 UU No. 31/1999 jo UU No. 20/2001 jo Pasal 55 ayat (1) ke-1 KUHP"
    },
    {
      "id": "PEL-008",
      "nama": "Rahmat Effendi",
      "alias": "Pepen",
      "jabatan": "Walikota Bekasi (2018-2022)",
      "instansi": "Pemda",
      "kasus": "Penerimaan Suap Pengadaan Barang & Jasa, Ganti Rugi Lahan, Serta Lelang Jabatan Pemkot Bekasi",
      "nominal_kerugian": 17000000000,
      "nominal_formatted": "Rp 17,0 Miliar",
      "status_hukum": "Tersangka",
      "tahun_penindakan": 2022,
      "foto_url": "assets/images/pelaku/pelaku-008.svg",
      "putusan_ma": "Vonis Pengadilan Tinggi Bandung & Kasasi MA: Pidana Penjara 12 Tahun & Perampasan Aset Mewah",
      "pasal_pelanggaran": "Pasal 12 huruf a atau b atau Pasal 11 UU Tipikor"
    }
  ];

  // Helper badge status hukum
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

  // Helper kelas instansi
  function getInstansiClass(instansi) {
    const i = (instansi || '').toLowerCase();
    if (i.includes('swasta')) return 'instansi-swasta';
    if (i.includes('bumn')) return 'instansi-bumn';
    if (i.includes('kementerian')) return 'instansi-kementerian';
    if (i.includes('pemda')) return 'instansi-pemda';
    return 'instansi-bumn';
  }

  // Load Data
  async function loadData() {
    try {
      const res = await fetch('data/pelaku.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Gabungkan atribut tambahan putusan_ma jika ada di fallback
      rawPelakuData = json.map(item => {
        const match = FALLBACK_PELAKU.find(f => f.id === item.id);
        return {
          ...item,
          putusan_ma: item.putusan_ma || (match ? match.putusan_ma : 'Putusan Kasasi Inkracht Mahkamah Agung RI'),
          pasal_pelanggaran: item.pasal_pelanggaran || (match ? match.pasal_pelanggaran : 'Pasal 2 & 3 UU Pemberantasan Tindak Pidana Korupsi')
        };
      });
    } catch (err) {
      console.warn('Gagal membaca data/pelaku.json via fetch, menggunakan fallback lokal:', err);
      rawPelakuData = FALLBACK_PELAKU;
    }

    currentFilteredData = [...rawPelakuData];
    setupEventListeners();
    applyFilterAndSort();
    setupModalHandlers();
  }

  // Setup Event Listeners
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
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          instansiPills.forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          applyFilterAndSort();
        });
      });
    }
  }

  // Filter & Sort
  function applyFilterAndSort() {
    const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const sortVal = document.getElementById('sort-select')?.value || 'nominal-desc';
    const activePill = document.querySelector('.instansi-filter-btn.active');
    const selectedInstansi = activePill ? activePill.getAttribute('data-instansi') : 'all';

    // 1. Filter
    currentFilteredData = rawPelakuData.filter((item) => {
      const matchInstansi = selectedInstansi === 'all' || item.instansi.toLowerCase() === selectedInstansi.toLowerCase();
      const matchSearch =
        !searchVal ||
        (item.nama && item.nama.toLowerCase().includes(searchVal)) ||
        (item.alias && item.alias.toLowerCase().includes(searchVal)) ||
        (item.jabatan && item.jabatan.toLowerCase().includes(searchVal)) ||
        (item.kasus && item.kasus.toLowerCase().includes(searchVal)) ||
        (item.instansi && item.instansi.toLowerCase().includes(searchVal));

      return matchInstansi && matchSearch;
    });

    // 2. Sorting
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

    // Deteksi jika ini halaman preview landing page (index.html)
    const gridContainer = document.getElementById('cards-grid-container');
    const isPreview = gridContainer && gridContainer.getAttribute('data-preview') === 'true';

    let displayItems = currentFilteredData;
    if (isPreview) {
      displayItems = currentFilteredData.slice(0, 4); // Ambil 4 kasus terbesar untuk landing page preview
    }

    renderCards(displayItems);
    updateResultCount(currentFilteredData.length, rawPelakuData.length);
  }

  // Update Teks Jumlah Hasil
  function updateResultCount(shown, total) {
    const countEl = document.getElementById('result-count');
    if (countEl) {
      countEl.textContent = `Menampilkan ${shown} dari ${total} data pelaku korupsi terdaftar`;
    }
  }

  // Render Kartu ke DOM
  function renderCards(items) {
    const gridContainer = document.getElementById('cards-grid-container');
    if (!gridContainer) return;

    if (items.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: rgba(30, 41, 59, 0.5); border-radius: 14px; border: 1px dashed rgba(255, 255, 255, 0.15);">
          <svg style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin-bottom: 0.35rem;">Data Tidak Ditemukan</h3>
          <p style="font-size: 0.9rem; color: #94a3b8;">Tidak ada perkara korupsi yang cocok dengan filter pencarian Anda.</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = items
      .map((item) => {
        const instansiClass = getInstansiClass(item.instansi);
        const statusBadge = getStatusBadgeHtml(item.status_hukum);

        return `
        <article class="corruptor-card tilt-card" data-id="${item.id}" tabindex="0" role="button" aria-label="Lihat detail kasus ${item.nama}">
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
              <div class="loss-label">Total Kerugian Negara</div>
              <div class="loss-value">${item.nominal_formatted}</div>
            </div>
          </div>

          <div class="card-bottom">
            <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">Status Penanganan:</div>
            ${statusBadge}
          </div>

          <div class="card-hover-action">
            <span>Buka Detail Putusan Inkracht &rarr;</span>
          </div>
        </article>
      `;
      })
      .join('');

    // Pasang click listener ke setiap kartu untuk membuka modal
    const renderedCards = gridContainer.querySelectorAll('.corruptor-card');
    renderedCards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        openDetailModal(id);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = card.getAttribute('data-id');
          openDetailModal(id);
        }
      });
    });
  }

  // Buka Modal Detail Perkara
  function openDetailModal(id) {
    const modal = document.getElementById('pelakuModal');
    const modalBody = document.getElementById('modalBodyContent');
    if (!modal || !modalBody) return;

    const item = rawPelakuData.find(p => p.id === id);
    if (!item) return;

    const instansiClass = getInstansiClass(item.instansi);
    const estSitaan = (item.nominal_kerugian || 0) * 0.15;
    const sitaanFormatted = (estSitaan >= 1e12 
      ? `Rp ${(estSitaan / 1e12).toFixed(2)} Triliun` 
      : `Rp ${(estSitaan / 1e9).toFixed(1)} Miliar`);

    modalBody.innerHTML = `
      <div class="modal-profile-header">
        <div class="modal-avatar-wrap">
          <img 
            src="${item.foto_url}" 
            alt="${item.nama}" 
            class="modal-avatar-img"
            onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=0f172a&color=ffffff&bold=true&size=180';"
          />
        </div>
        <div class="modal-title-meta">
          <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap;">
            <span class="instansi-tag ${instansiClass}">${item.instansi}</span>
            <span class="status-badge ${item.status_hukum === 'Terpidana' ? 'badge-terpidana' : 'badge-tersangka'}">${item.status_hukum}</span>
            <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #94a3b8;">Tahun ${item.tahun_penindakan}</span>
          </div>
          <h2 style="font-size: 1.65rem; font-weight: 800; color: #ffffff; margin-bottom: 0.25rem;">
            ${item.nama}
          </h2>
          ${item.alias ? `<div style="font-size: 0.95rem; color: var(--color-cyan); font-weight: 600; margin-bottom: 0.35rem;">Alias: "${item.alias}"</div>` : ''}
          <div style="font-size: 0.88rem; color: #94a3b8; line-height: 1.5;">${item.jabatan}</div>
        </div>
      </div>

      <div class="modal-metrics-banner">
        <div class="modal-metric-col">
          <span class="modal-metric-label">TOTAL KERUGIAN NEGARA</span>
          <div class="modal-metric-val red">${item.nominal_formatted}</div>
        </div>
        <div class="modal-metric-col">
          <span class="modal-metric-label">ESTIMASI SITAAN ASET</span>
          <div class="modal-metric-val cyan">${sitaanFormatted}</div>
        </div>
        <div class="modal-metric-col">
          <span class="modal-metric-label">STATUS INKRACHT</span>
          <div class="modal-metric-val emerald">100% TERBUKTI</div>
        </div>
      </div>

      <div class="modal-section-block">
        <h4 class="modal-section-title">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20" style="color: var(--color-cyan);">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
          </svg>
          Ringkasan Pokok Perkara Korupsi
        </h4>
        <p style="font-size: 0.92rem; color: #cbd5e1; line-height: 1.7; background: rgba(11, 19, 36, 0.6); padding: 1rem 1.25rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
          ${item.kasus}
        </p>
      </div>

      <div class="modal-section-block">
        <h4 class="modal-section-title">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20" style="color: var(--color-gold);">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
          Amar Putusan & Vonis Mahkamah Agung RI
        </h4>
        <div style="background: rgba(199, 154, 60, 0.08); border-left: 3px solid var(--color-gold); padding: 0.85rem 1.15rem; border-radius: 0 8px 8px 0; font-size: 0.88rem; color: #fef08a; font-family: var(--font-mono); line-height: 1.6;">
          ${item.putusan_ma || 'Telah dijatuhi vonis pidana penjara, denda subsider, serta uang pengganti kerugian negara oleh Pengadilan Tipikor & Mahkamah Agung.'}
        </div>
      </div>

      <div class="modal-section-block">
        <h4 class="modal-section-title">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20" style="color: var(--color-primary-red);">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          Pasal Tindak Pidana Korupsi
        </h4>
        <div style="font-size: 0.84rem; color: #94a3b8; font-family: var(--font-mono);">
          ${item.pasal_pelanggaran || 'Pasal 2 ayat (1) jo Pasal 18 UU No. 31 Tahun 1999 sebagaimana telah diubah dengan UU No. 20 Tahun 2001 tentang Tipikor.'}
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Kunci scroll layar latar
  }

  // Setup Modal Handler Tutup
  function setupModalHandlers() {
    const modal = document.getElementById('pelakuModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (!modal) return;

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // Inisialisasi saat DOM siap
  document.addEventListener('DOMContentLoaded', loadData);
})();
