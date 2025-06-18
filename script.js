// GANTI SELURUH ISI FILE script.js DENGAN KODE INI

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby_4XcSdK0FddjZxi1sSI4wdHmTfZfkU22tFu3DtlN3XqfadNiEngJYCu4qaEJakr7l/exec';

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-body');
    const loadingDiv = document.getElementById('loading');
    const searchBox = document.getElementById('search-box');
    const modal = document.getElementById('detail-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const showingEntriesDiv = document.getElementById('showing-entries');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageNumbersDiv = document.getElementById('page-numbers');
    const tableHeaders = document.querySelectorAll('#kerjasama-table th[data-sort]');

    let allData = []; // Stores all fetched data
    let currentlyDisplayedData = []; // Stores data after search filter, before pagination
    let currentPage = 1;
    const rowsPerPage = 20; // Diubah menjadi 20 baris per halaman
    let currentSortColumn = null;
    let currentSortDirection = 'asc'; // 'asc' or 'desc'

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
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Tidak ada data yang cocok.</td></tr>';
            showingEntriesDiv.textContent = 'Showing 0 to 0 of 0 entries';
            pageNumbersDiv.innerHTML = '';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, dataToRender.length);
        const paginatedData = dataToRender.slice(startIndex, endIndex);

        paginatedData.forEach((item, index) => {
            const row = document.createElement('tr');
            const tglSelesai = item.tanggalSelesai ? new Date(item.tanggalSelesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';
            const statusClass = `status-${(item.status || 'default').toLowerCase().replace(/ /g, '-')}`;
            row.innerHTML = `
                <td><div class="truncate" title="${item.mitra}">${item.mitra}</div></td>
                <td><div class="truncate" title="${item.judul}">${item.judul}</div></td>
                <td>${tglSelesai}</td>
                <td><span class="status-pill ${statusClass}">${item.status || 'N/A'}</span></td>
                <td>${item.sumberSheet}</td>
                <td><button class="detail-btn" data-index="${startIndex + index}">Detail</button></td>
            `;
            tableBody.appendChild(row);
        });

        updatePaginationControls(dataToRender.length);
        updateShowingEntries(startIndex, endIndex, dataToRender.length);
    }

    function updatePaginationControls(totalItems) {
        const totalPages = Math.ceil(totalItems / rowsPerPage);
        pageNumbersDiv.innerHTML = '';

        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            const span = document.createElement('span');
            span.textContent = '...';
            pageNumbersDiv.appendChild(span);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageLink = document.createElement('span');
            pageLink.classList.add('page-number');
            if (i === currentPage) {
                pageLink.classList.add('active');
            }
            pageLink.textContent = i;
            pageLink.addEventListener('click', () => {
                currentPage = i;
                renderTable(currentlyDisplayedData);
            });
            pageNumbersDiv.appendChild(pageLink);
        }

        if (endPage < totalPages) {
            const span = document.createElement('span');
            span.textContent = '...';
            pageNumbersDiv.appendChild(span);
        }

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages || totalItems === 0;
    }

    function updateShowingEntries(startIndex, endIndex, totalItems) {
        if (totalItems === 0) {
            showingEntriesDiv.textContent = 'Showing 0 to 0 of 0 entries';
        } else {
            showingEntriesDiv.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} entries`;
        }
    }

    function updateSummaryStats(data) {
        document.getElementById('total-kerjasama').textContent = data.length;
        document.getElementById('perlu-perpanjangan').textContent = data.filter(d => d.status === 'Perlu Proses Perpanjangan').length;
        document.getElementById('status-berjalan').textContent = data.filter(d => d.status === 'Berjalan').length;
        document.getElementById('proses-tu').textContent = data.filter(d => d.status === 'Proses Oleh TU').length;
        document.getElementById('proses-mitra').textContent = data.filter(d => d.status === 'Proses Mitra').length;
        document.getElementById('tidak-diperpanjang').textContent = data.filter(d => d.status === 'Tidak Diperpanjang').length;
        
        // --- START NEW CODE FOR KLINIS & MANAJEMEN ---
        // Asumsi: 'sumberSheet' mengandung kata 'Klinis' atau 'Manajemen'
        const totalKlinis = data.filter(d => d.sumberSheet && d.sumberSheet.toLowerCase().includes('klinis')).length;
        const totalManajemen = data.filter(d => d.sumberSheet && d.sumberSheet.toLowerCase().includes('manajemen')).length;

        document.getElementById('total-klinis').textContent = totalKlinis;
        document.getElementById('total-manajemen').textContent = totalManajemen;
        // --- END NEW CODE FOR KLINIS & MANAJEMEN ---
    }

    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('detail-btn')) {
            const index = event.target.dataset.index;
            showModal(currentlyDisplayedData[index]);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable(currentlyDisplayedData);
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(currentlyDisplayedData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable(currentlyDisplayedData);
        }
    });

    // Sorting Logic
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortColumn = header.dataset.sort;
            if (!sortColumn) return;

            // Determine sort direction
            if (currentSortColumn === sortColumn) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortColumn;
                currentSortDirection = 'asc';
            }

            // Clear all sort icons
            document.querySelectorAll('.sort-icon').forEach(icon => {
                icon.classList.remove('asc', 'desc');
            });

            // Add class to current sorted column
            const currentSortIcon = header.querySelector('.sort-icon');
            if (currentSortIcon) {
                currentSortIcon.classList.add(currentSortDirection);
            }

            // Sort the currentlyDisplayedData (which is already filtered by search if any)
            currentlyDisplayedData.sort((a, b) => {
                let valA = a[sortColumn];
                let valB = b[sortColumn];

                // Handle date sorting
                if (sortColumn.includes('tanggalSelesai') || sortColumn.includes('reminder')) {
                    valA = valA ? new Date(valA).getTime() : 0;
                    valB = valB ? new Date(valB).getTime() : 0;
                } else if (typeof valA === 'string' && typeof valB === 'string') {
                    // Case-insensitive string comparison
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                if (valA < valB) {
                    return currentSortDirection === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return currentSortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });

            currentPage = 1; // Reset to first page after sorting
            renderTable(currentlyDisplayedData);
        });
    });

    fetch(WEB_APP_URL)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                allData = result.data;
                // Initial sort by tanggalSelesai (descending - nearest expiration first)
                allData.sort((a, b) => new Date(a.tanggalSelesai) - new Date(b.tanggalSelesai));
                currentlyDisplayedData = allData;
                renderTable(currentlyDisplayedData);
                updateSummaryStats(allData);
            } else {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;"><b>Error:</b> ${result.message}</td></tr>`;
            }
        })
        .catch(error => {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Gagal memuat data. Periksa koneksi atau URL Web App. Error: ${error.message}</td></tr>`;
        })
        .finally(() => {
            loadingDiv.style.display = 'none';
        });

    searchBox.addEventListener('keyup', () => {
        const searchTerm = searchBox.value.toLowerCase();
        currentlyDisplayedData = allData.filter(item =>
            item.mitra.toLowerCase().includes(searchTerm) ||
            item.judul.toLowerCase().includes(searchTerm)
        );
        currentPage = 1; // Reset to first page on new search
        renderTable(currentlyDisplayedData);
    });
});