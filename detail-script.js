// GANTI SELURUH ISI FILE detail-script.js DENGAN KODE INI

// !!! PENTING: Ganti URL di bawah dengan URL Web App Anda !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby_4XcSdK0FddjZxi1sSI4wdHmTfZfkU22tFu3DtlN3XqfadNiEngJYCu4qaEJakr7l/exec';
// !!! ----------------------------------------------- !!!

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-body');
    const loadingDiv = document.getElementById('loading');
    const searchBox = document.getElementById('search-box');
    const detailTitle = document.getElementById('detail-title');
    const modal = document.getElementById('detail-modal');
    const closeModalBtn = document.querySelector('.close-btn');

    const urlParams = new URLSearchParams(window.location.search);
    const filterStatus = urlParams.get('status');
    const filterKategori = urlParams.get('kategori'); // Menambahkan ini untuk membaca parameter kategori
    
    let pageData = []; // Menyimpan data asli untuk kategori/status ini
    let currentlyDisplayedData = []; // Menyimpan data yang tampil di tabel (bisa data asli atau hasil filter search)

    // Memperbarui judul detail.html berdasarkan filter
    if (filterStatus) {
        detailTitle.textContent = `Daftar Kerjasama: "${filterStatus}"`;
    } else if (filterKategori) {
        detailTitle.textContent = `Daftar Kerjasama Kategori: "${filterKategori}"`;
    } else {
        detailTitle.textContent = 'Semua Kerjasama';
    }

    function showModal(itemData) {
        const fields = ['mitra1', 'mitra2', 'judul-kerjasama', 'dsm1', 'dsm2', 'dsrs', 'tgl-mulai', 'tgl-selesai', 'reminder', 'keterangan'];
        fields.forEach(f => {
            const element = document.getElementById(`modal-${f}`);
            if (element) element.textContent = 'Memuat...';
        });
        modal.style.display = 'block';

        const detailUrl = `${WEB_APP_URL}?action=getDetail&sheet=${encodeURIComponent(itemData.sumberSheet)}&row=${itemData.rowIndex}`;

        fetch(detailUrl)
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success' && result.data) {
                    const detail = result.data;
                    const formatDate = (dateStr) => {
                        if (!dateStr) return '-';
                        // Try to parse as date string first
                        let date = new Date(dateStr);
                        // If parsing as string fails, try to parse as number (Unix timestamp)
                        if (isNaN(date.getTime()) && !isNaN(Number(dateStr))) {
                            date = new Date(Number(dateStr) * 1000); // Convert seconds to milliseconds for Unix timestamp
                        }
                        if (isNaN(date.getTime())) return '-'; // If still invalid, return '-'
                        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
                    };
                    
                    document.getElementById('modal-mitra1').textContent = detail.namaMitra1 || detail.mitra || '-';
                    document.getElementById('modal-mitra2').textContent = detail.namaMitra2 || '-';
                    document.getElementById('modal-judul-kerjasama').textContent = detail.judulKerjasama || '-';
                    document.getElementById('modal-dsm1').textContent = detail.dasarHukumMitra1 || detail.dasarHukum || '-';
                    document.getElementById('modal-dsm2').textContent = detail.dasarHukumMitra2 || '-';
                    document.getElementById('modal-dsrs').textContent = detail.dasarHukumRs || '-';
                    document.getElementById('modal-tgl-mulai').textContent = formatDate(detail.tanggalMulai);
                    document.getElementById('modal-tgl-selesai').textContent = formatDate(detail.tanggalSelesai);
                    document.getElementById('modal-reminder').textContent = formatDate(detail.reminder3Bulan);
                    document.getElementById('modal-keterangan').textContent = detail.keteranganKerjasama || '-';

                } else {
                    document.getElementById('modal-judul-kerjasama').textContent = result.message || 'Gagal memuat detail.';
                }
            })
            .catch(error => {
                document.getElementById('modal-judul-kerjasama').textContent = `Error Jaringan: ${error.message}`;
            });
    }

    closeModalBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = 'none'; } };

    function renderTable(dataToRender) {
        tableBody.innerHTML = '';
        if (dataToRender.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Tidak ada data untuk ditampilkan.</td></tr>';
            return;
        }
        dataToRender.forEach((item, index) => {
            const row = document.createElement('tr');
            const tglSelesai = item.tanggalSelesai ? new Date(item.tanggalSelesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';
            const statusClass = `status-${(item.status || 'default').toLowerCase().replace(/ /g, '-')}`;
            row.innerHTML = `
                <td>${item.mitra}</td>
                <td>${item.judul}</td>
                <td>${tglSelesai}</td>
                <td><span class="status-pill ${statusClass}">${item.status || 'N/A'}</span></td>
                <td>${item.sumberSheet}</td>
                <td><button class="detail-btn" data-index="${index}">Detail</button></td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('detail-btn')) {
            const index = event.target.dataset.index;
            showModal(currentlyDisplayedData[index]);
        }
    });

    fetch(WEB_APP_URL)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                let allData = result.data;
                
                // Logika filtering baru untuk status ATAU kategori
                if (filterStatus) {
                    pageData = allData.filter(item => item.status === filterStatus);
                } else if (filterKategori) {
                    // Filter berdasarkan kategori dari sumberSheet
                    pageData = allData.filter(item => item.sumberSheet && item.sumberSheet.toLowerCase().includes(filterKategori.toLowerCase()));
                } else {
                    pageData = allData;
                }

                pageData.sort((a, b) => new Date(a.tanggalSelesai) - new Date(b.tanggalSelesai));
                
                currentlyDisplayedData = pageData;
                renderTable(currentlyDisplayedData);
            } else {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;"><b>Error:</b> ${result.message}</td></tr>`;
            }
        })
        .catch(error => { tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Gagal memuat data: ${error.message}</td></tr>`; })
        .finally(() => { loadingDiv.style.display = 'none'; });

    searchBox.addEventListener('keyup', () => {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredResult = pageData.filter(item => 
            item.mitra.toLowerCase().includes(searchTerm) ||
            item.judul.toLowerCase().includes(searchTerm)
        );
        currentlyDisplayedData = filteredResult;
        renderTable(currentlyDisplayedData);
    });
});