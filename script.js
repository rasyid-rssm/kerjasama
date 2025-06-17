// =========================================================================
// !!! PENTING: Ganti URL di bawah dengan URL Web App Anda dari Langkah 3.1 !!!
// =========================================================================
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby_4XcSdK0FddjZxi1sSI4wdHmTfZfkU22tFu3DtlN3XqfadNiEngJYCu4qaEJakr7l/exec'; 
// =========================================================================


document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-body');
    const loadingDiv = document.getElementById('loading');
    const searchBox = document.getElementById('search-box');
    
    let allData = [];

    function renderTable(dataToRender) {
        tableBody.innerHTML = '';
        if (dataToRender.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tidak ada data yang cocok.</td></tr>';
            return;
        }

        dataToRender.forEach(item => {
            const row = document.createElement('tr');
            
            const tglSelesai = new Date(item.tanggalSelesai).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            const statusClass = `status-${item.status.toLowerCase().replace(/ /g, '-')}`;
            
            row.innerHTML = `
                <td>${item.mitra}</td>
                <td>${item.judul}</td>
                <td>${tglSelesai}</td>
                <td><span class="status-pill ${statusClass}">${item.status || 'N/A'}</span></td>
                <td>${item.sumberSheet}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function updateSummaryStats(data) {
        document.getElementById('total-kerjasama').textContent = data.length;
        document.getElementById('perlu-perpanjangan').textContent = data.filter(d => d.status === 'Perlu Proses Perpanjangan').length;
        document.getElementById('status-berjalan').textContent = data.filter(d => d.status === 'Berjalan').length;
    }

    fetch(WEB_APP_URL)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                allData = result.data;
                // Sortir data agar yang perlu perpanjangan ada di atas
                allData.sort((a, b) => {
                    if (a.status === 'Perlu Proses Perpanjangan' && b.status !== 'Perlu Proses Perpanjangan') return -1;
                    if (a.status !== 'Perlu Proses Perpanjangan' && b.status === 'Perlu Proses Perpanjangan') return 1;
                    return new Date(a.tanggalSelesai) - new Date(b.tanggalSelesai);
                });

                renderTable(allData);
                updateSummaryStats(allData);
            } else {
                throw new Error(result.message);
            }
        })
        .catch(error => {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Gagal memuat data: ${error.message}</td></tr>`;
        })
        .finally(() => {
            loadingDiv.style.display = 'none';
        });

    searchBox.addEventListener('keyup', () => {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredData = allData.filter(item => 
            item.mitra.toLowerCase().includes(searchTerm) ||
            item.judul.toLowerCase().includes(searchTerm)
        );
        renderTable(filteredData);
    });
});