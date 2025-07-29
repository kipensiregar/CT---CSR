// DOM Elements
const itemForm = document.getElementById('item-form');
const nameInput = document.getElementById('item-name');
const priceInput = document.getElementById('item-price');
const qtyInput = document.getElementById('item-qty');
const tableBody = document.getElementById('item-table-body');
const totalDisplay = document.getElementById('grand-total');
const resetBtn = document.getElementById('reset-all-btn');
const buyerTbody = document.getElementById('buyer-table-body');
const tambahKeKeranjangBtn = document.getElementById('tambah-ke-keranjang');
const simpanTransaksiBtn = document.getElementById('simpan-transaksi');
const keranjangList = document.getElementById('keranjang-items');
const tanggalTransaksiInput = document.getElementById('tanggal-transaksi');
const filterTanggal = document.getElementById('filter-tanggal');
const filterTransfer = document.getElementById('filter-transfer');
const filterKirim = document.getElementById('filter-kirim');
const menuSummaryBody = document.getElementById('menu-summary-body');

// Initialize default date
if (tanggalTransaksiInput) {
  tanggalTransaksiInput.valueAsDate = new Date();
}

// Data
let itemList = JSON.parse(localStorage.getItem('kasirItemList')) || [];
let buyerList = JSON.parse(localStorage.getItem('kasirBuyerList')) || [];
let keranjangSementara = [];

// Sorting state
let sortAscending = true;
let sortBy = 'nama'; // 'nama' atau 'tanggal'

// Migrate old data to ensure all have dates
buyerList = buyerList.map(buyer => ({
  ...buyer,
  tanggal: buyer.tanggal || new Date(buyer.id).toISOString().split('T')[0]
}));

// Show Section Function
function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => {
    sec.style.display = 'none';
  });
  
  const targetSection = document.getElementById(id);
  if (targetSection) targetSection.style.display = 'block';

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkText = link.textContent.toLowerCase();
    link.classList.toggle('active', 
      linkText.includes(id) || 
      (id === 'riwayat' && linkText.includes('riwayat'))
    );
  });
}

// ==================== ITEM MANAGEMENT ====================
function renderItemTable() {
  if (!tableBody) return;

  tableBody.innerHTML = '';
  let total = 0;

  itemList.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>Rp ${item.price.toLocaleString()}</td>
      <td>${item.qty}</td>
      <td>Rp ${(item.price * item.qty).toLocaleString()}</td>
      <td>
      <button onclick="deleteItem(${item.id})">Hapus</button>
      <button onclick="showRestockForm(${item.id})" class="restock-btn">Restock</button>     
      </td>
      
    `;
    tableBody.appendChild(row);
    total += item.price * item.qty;
  });

  if (totalDisplay) {
    totalDisplay.textContent = `Rp ${total.toLocaleString()}`;
  }

  localStorage.setItem('kasirItemList', JSON.stringify(itemList));
  renderBarangOptions();
}

function showRestockForm(id) {
  const item = itemList.find(item => item.id === id);
  if (!item) return;

  const restockAmount = prompt(`Restock ${item.name}\nStok saat ini: ${item.qty}\nMasukkan jumlah tambahan:`, '0');
  const amount = parseInt(restockAmount);

  if (!isNaN(amount) && amount > 0) {
    item.qty += amount;
    renderItemTable();
    alert(`Berhasil menambahkan ${amount} ${item.name}\nStok baru: ${item.qty}`);
  } else if (restockAmount !== null) {
    alert('Masukkan jumlah yang valid (angka lebih dari 0)');
  }
}


function deleteItem(id) {
  itemList = itemList.filter(item => item.id !== id);
  renderItemTable();
}

if (itemForm) {
  itemForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const qty = parseInt(qtyInput.value);

    if (!name || isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0) {
      alert('Lengkapi data dan pastikan harga/jumlah lebih dari 0');
      return;
    }

    itemList.push({ id: Date.now(), name, price, qty });
    renderItemTable();
    itemForm.reset();
  });
}


if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (confirm('Yakin reset semua data barang?')) {
      itemList = [];
      localStorage.removeItem('kasirItemList');
      renderItemTable();
    }
  });
}

function renderBarangOptions() {
  const select = document.getElementById('select-barang');
  if (!select) return;

  select.innerHTML = '<option value="">Pilih Barang</option>';

  itemList.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.name;
    opt.textContent = `${item.name} - Rp ${item.price.toLocaleString()}`;
    opt.dataset.harga = item.price;
    opt.dataset.stok = item.qty;
    select.appendChild(opt);
  });
}

// ==================== BUYER MANAGEMENT ====================
function tambahKeKeranjang() {
  const nama = document.getElementById('nama-pembeli')?.value || '';
  const barangSelect = document.getElementById('select-barang');
  const jumlah = parseInt(document.getElementById('jumlah-barang')?.value || 0);

  const barang = barangSelect?.value || '';
  const harga = parseFloat(barangSelect?.options[barangSelect.selectedIndex]?.dataset.harga || 0);

  if (!nama) {
    alert('Nama pembeli harus diisi');
    return;
  }

  if (!barang || isNaN(jumlah) || jumlah <= 0) {
    alert('Barang dan jumlah harus valid');
    return;
  }

  const item = itemList.find(i => i.name === barang);
  if (!item || item.qty < jumlah) {
    alert(`Stok tidak cukup! Stok tersedia: ${item ? item.qty : 0}`);
    return;
  }

  keranjangSementara.push({
    namaBarang: barang,
    hargaBarang: harga,
    jumlahBarang: jumlah
  });

  renderKeranjangSementara();
  document.getElementById('jumlah-barang').value = '1';
}

function renderKeranjangSementara() {
  if (!keranjangList) return;

  keranjangList.innerHTML = '';

  keranjangSementara.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.namaBarang} (${item.jumlahBarang})
      <button onclick="hapusDariKeranjang(${index})">×</button>
    `;
    keranjangList.appendChild(li);
  });
}

function hapusDariKeranjang(index) {
  keranjangSementara.splice(index, 1);
  renderKeranjangSementara();
}

function simpanTransaksi() {
  const nama = document.getElementById('nama-pembeli')?.value || '';
  const catatan = document.getElementById('catatan-pembeli')?.value.trim() || '';
  const tanggal = tanggalTransaksiInput?.value || new Date().toISOString().split('T')[0];

  if (!nama) {
    alert('Nama pembeli harus diisi');
    return;
  }

  if (keranjangSementara.length === 0) {
    alert('Keranjang belanja kosong');
    return;
  }

  // Update stock
  keranjangSementara.forEach(itemKeranjang => {
    const item = itemList.find(i => i.name === itemKeranjang.namaBarang);
    if (item) {
      item.qty -= itemKeranjang.jumlahBarang;
    }
  });

  buyerList.push({
    id: Date.now(),
    namaPembeli: nama,
    items: [...keranjangSementara],
    catatan,
    tanggal,
    sudahTransfer: false,
    sudahDikirim: false
  });

  localStorage.setItem('kasirItemList', JSON.stringify(itemList));
  localStorage.setItem('kasirBuyerList', JSON.stringify(buyerList));

  keranjangSementara = [];
  renderKeranjangSementara();
  renderItemTable();
  renderBuyerTable();

  // Reset form
  document.getElementById('nama-pembeli').value = '';
  document.getElementById('catatan-pembeli').value = '';
  if (tanggalTransaksiInput) tanggalTransaksiInput.valueAsDate = new Date();
  
  // Show success notification
  showNotification('Transaksi berhasil disimpan!', 'success');
}

// ==================== TRANSACTION HISTORY ====================
function renderBuyerTable() {
  if (!buyerTbody) return;

  // Dapatkan nilai semua filter
  const tanggalValue = filterTanggal?.value || '';
  const namaValue = document.getElementById('filter-nama')?.value.toLowerCase() || '';
  const barangValue = document.getElementById('filter-barang')?.value.toLowerCase() || '';
  const transferValue = filterTransfer?.value || '';
  const kirimValue = filterKirim?.value || '';

  buyerTbody.innerHTML = '';

  buyerList
    .filter(buyer => {
      // Filter tanggal
      if (tanggalValue) {
        const transaksiDate = new Date(buyer.tanggal).toDateString();
        const filterDate = new Date(tanggalValue).toDateString();
        if (transaksiDate !== filterDate) return false;
      }
      
      // Filter nama pembeli
      if (namaValue && !buyer.namaPembeli.toLowerCase().includes(namaValue)) {
        return false;
      }
      
      // Filter nama barang
      if (barangValue) {
        const hasItem = buyer.items.some(item => 
          item.namaBarang.toLowerCase().includes(barangValue)
        );
        if (!hasItem) return false;
      }
      
      // Filter status
      return (!transferValue || buyer.sudahTransfer.toString() === transferValue) &&
             (!kirimValue || buyer.sudahDikirim.toString() === kirimValue);
    })
    .sort((a, b) => {
      // Urutkan berdasarkan pengaturan sorting
      if (sortBy === 'tanggal') {
        return sortAscending 
          ? new Date(a.tanggal) - new Date(b.tanggal)
          : new Date(b.tanggal) - new Date(a.tanggal);
      } else {
        // Default sorting by name
        const nameA = a.namaPembeli.toLowerCase();
        const nameB = b.namaPembeli.toLowerCase();
        return sortAscending 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
    })
    .forEach((buyer, index) => {
      const totalTransaksi = buyer.items.reduce((sum, item) => {
        return sum + (item.hargaBarang * item.jumlahBarang);
      }, 0);

      // Format barang: "nama(jumlah), nama(jumlah)"
      const formattedItems = buyer.items.map(item => 
        `${item.namaBarang}(${item.jumlahBarang})`
      ).join(', ');

      const row = document.createElement('tr');
      row.dataset.id = buyer.id; // Tambahkan data-id untuk referensi
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${formatTanggal(buyer.tanggal)}</td>
        <td>${buyer.namaPembeli}</td>
        <td>${formattedItems}</td>
        <td>${buyer.catatan || '-'}</td>
        <td>Rp ${totalTransaksi.toLocaleString()}</td>
        <td>
          <button onclick="toggleTransfer(${buyer.id})" class="status-transfer ${buyer.sudahTransfer ? 'sudah' : 'belum'}">
            ${buyer.sudahTransfer ? '✅ Transfer' : '❌ Transfer'}
          </button>
        </td>
        <td>
          <button onclick="toggleKirim(${buyer.id})" class="status-kirim ${buyer.sudahDikirim ? 'sudah' : 'belum'}">
            ${buyer.sudahDikirim ? '🚚 Kirim' : '❌ Kirim'}
          </button>
        </td>
        <td>
          <button onclick="cetakStrukCanvas(${buyer.id})" class="struk-btn">
            🧾 Struk
          </button>
        </td>
      `;

      // Setup double click/tap handler
      setupDoubleClickHandler(row, buyer);

      buyerTbody.appendChild(row);
    });

  updateRekapPenjualan();
  renderMenuSummary();
}

// Fungsi untuk menangani double click/tap
function setupDoubleClickHandler(row, buyer) {
  let lastTapTime = 0;
  const doubleTapDelay = 300; // ms

  const handleInteraction = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    
    if (tapLength < doubleTapDelay && tapLength > 0) {
      // Double tap terdeteksi
      e.preventDefault();
      showDeleteConfirmation(row, buyer);
      return;
    }
    
    lastTapTime = currentTime;
  };

  // Hapus event listener sebelumnya jika ada
  row._previousClickHandler?.remove();
  row._previousDblClickHandler?.remove();

  // Tambahkan event listener baru
  row.addEventListener('click', handleInteraction);
  row.addEventListener('dblclick', (e) => {
    e.preventDefault();
    showDeleteConfirmation(row, buyer);
  });

  // Simpan referensi untuk bisa dihapus nanti
  row._previousClickHandler = handleInteraction;
}

function formatTanggal(dateString) {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

function toggleTransfer(id) {
  const buyer = buyerList.find(b => b.id === id);
  if (buyer) {
    buyer.sudahTransfer = !buyer.sudahTransfer;
    localStorage.setItem('kasirBuyerList', JSON.stringify(buyerList));
    renderBuyerTable();
  }
}

function toggleKirim(id) {
  const buyer = buyerList.find(b => b.id === id);
  if (buyer) {
    buyer.sudahDikirim = !buyer.sudahDikirim;
    localStorage.setItem('kasirBuyerList', JSON.stringify(buyerList));
    renderBuyerTable();
  }
}

// ==================== RECEIPT GENERATION ====================
function cetakStrukCanvas(id) {
  const buyer = buyerList.find(b => b.id === id);
  if (!buyer) return;

  const canvas = document.getElementById('struk-canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size with scaling
  const scale = 2; // 2x resolution for better print quality
  const width = 220;
  const height = calculateReceiptHeight(buyer);
  
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  ctx.scale(scale, scale);
  ctx.font = '12px Arial';

  // Colors
  const colors = {
    primary: '#000',
    secondary: '#333',
    accent: '#555',
    background: '#FFFFFF'
  };

  // Background putih
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw receipt
  let y = 20;
  const margin = 15;
  
  // Header
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 18px Arial';
  centerText(ctx, "CT CATERING", width, y);
  y += 25;
  
  ctx.fillStyle = colors.secondary;
  ctx.font = '10px Arial';
  centerText(ctx, "Lorong MGS H Utih No 1480 A1", width, y);
  y += 15;
  centerText(ctx, "Sukabangun 2, Palembang. 30151", width, y);
  y += 15;
  centerText(ctx, "Telp: 0813-6099-6295", width, y);
  y += 20;
  
  // Divider
  y = drawDivider(ctx, y, width, margin);
  
  // Transaction Info
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`TRANSAKSI #${buyer.id}`, margin, y);
  y += 18;
  
  ctx.fillStyle = colors.secondary;
  ctx.font = '10px Arial';
  ctx.fillText(`Tanggal: ${formatTanggal(buyer.tanggal)} ${new Date().toLocaleTimeString().substring(0,5)}`, margin, y);
  y += 15;
  ctx.fillText(`Nama Pembeli: ${buyer.namaPembeli}`, margin, y);
  y += 15;
  
  // Notes with wrapping
  if (buyer.catatan) {
    y = drawWrappedText(ctx, `Catatan: ${buyer.catatan}`, margin, y, width - margin*2, 12);
    y += 10;
  }
  
  // Divider
  y = drawDivider(ctx, y, width, margin);
  
  // Items header
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 11px Arial';
  ctx.fillText("ITEM", margin, y);
  ctx.textAlign = 'right';
  ctx.fillText("QTY", width - margin - 60, y);
  ctx.fillText("SUBTOTAL", width - margin, y);
  ctx.textAlign = 'left';
  y += 15;
  
  // Items
  ctx.fillStyle = colors.secondary;
  ctx.font = '10px Arial';
  
  buyer.items.forEach(item => {
    // Item name with wrapping
    const nameY = drawWrappedText(ctx, item.namaBarang, margin, y, width - margin*2 - 70, 12);
    
    // Qty and subtotal
    ctx.textAlign = 'right';
    ctx.fillText(item.jumlahBarang.toString(), width - margin - 60, y);
    ctx.fillText(`Rp${(item.hargaBarang * item.jumlahBarang).toLocaleString()}`, width - margin, y);
    ctx.textAlign = 'left';
    
    y = Math.max(nameY, y + 15);
  });
  
  // Divider
  y = drawDivider(ctx, y + 5, width, margin);
  
  // Total
  const total = buyer.items.reduce((sum, item) => sum + (item.hargaBarang * item.jumlahBarang), 0);
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 12px Arial';
  ctx.fillText("TOTAL BAYAR:", margin, y);
  ctx.textAlign = 'right';
  ctx.fillText(`Rp${total.toLocaleString()}`, width - margin, y);
  ctx.textAlign = 'left';
  y += 20;
  
  // Payment info
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 11px Arial';
  ctx.fillText("PEMBAYARAN", margin, y);
  y += 15;
  
  ctx.fillStyle = colors.secondary;
  ctx.font = '10px Arial';
  ctx.fillText("CINDY ANJELINA BARIN", margin + 5, y);
  y += 12;
  ctx.fillText("Bank Mandiri", margin + 5, y);
  y += 12;
  ctx.fillText("1570009775306", margin + 5, y);
  y += 12;
  ctx.fillText("Bantu bukti TF biar kita list ya", margin + 5, y);
  y += 20;
  
  // Footer
  ctx.fillStyle = colors.primary;
  ctx.font = 'italic 10px Arial';
  centerText(ctx, "Terima kasih 🙏", width, y);
  y += 15;
  centerText(ctx, "~ CT Catering ~", width, y);
  
  // Download receipt
  downloadReceipt(canvas, buyer.namaPembeli || 'customer');
}

// Helper functions for receipt
function calculateReceiptHeight(buyer) {
  const baseHeight = 400;
  const itemHeight = buyer.items.length * 20;
  const noteHeight = buyer.catatan ? Math.ceil(buyer.catatan.length / 30) * 12 : 0;
  return baseHeight + itemHeight + noteHeight;
}

function centerText(ctx, text, width, y) {
  ctx.textAlign = 'center';
  ctx.fillText(text, width / 2, y);
  ctx.textAlign = 'left';
}

function drawDivider(ctx, y, width, margin) {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();
  return y + 15;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';

  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);

    if ((metrics.width > maxWidth && n > 0) || words[n].length > 20) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

function downloadReceipt(canvas, customerName) {
  const image = canvas.toDataURL("image/png");
  const link = document.createElement('a');
  link.download = `struk-${customerName}.png`;
  link.href = image;
  link.click();
}

// ==================== REPORTS ====================
function updateRekapPenjualan() {
  const totalPembeli = buyerList.length;
  
  const totalBarang = buyerList.reduce((sum, buyer) => {
    return sum + buyer.items.reduce((subSum, item) => {
      return subSum + item.jumlahBarang;
    }, 0);
  }, 0);

  const totalUang = buyerList.reduce((sum, buyer) => {
    if (!buyer.sudahTransfer) return sum;
    return sum + buyer.items.reduce((subSum, item) => {
      return subSum + (item.hargaBarang * item.jumlahBarang);
    }, 0);
  }, 0);

  const totalKirim = buyerList.filter(b => b.sudahDikirim).length;

  document.getElementById('rekap-total-pembeli').textContent = totalPembeli;
  document.getElementById('rekap-total-barang').textContent = totalBarang;
  document.getElementById('rekap-total-uang').textContent = `Rp ${totalUang.toLocaleString()}`;
  document.getElementById('rekap-total-kirim').textContent = totalKirim;
}

function renderMenuSummary() {
  if (!menuSummaryBody) return;

  const menuSummary = {};

  buyerList.forEach(transaction => {
    transaction.items.forEach(item => {
      if (!menuSummary[item.namaBarang]) {
        menuSummary[item.namaBarang] = 0;
      }
      menuSummary[item.namaBarang] += item.jumlahBarang;
    });
  });

  menuSummaryBody.innerHTML = '';

  Object.entries(menuSummary)
    .sort((a, b) => b[1] - a[1])
    .forEach(([menuName, totalQty]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${menuName}</td>
        <td>${totalQty} porsi</td>
      `;
      menuSummaryBody.appendChild(row);
    });
}

// ==================== UTILITIES ====================
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">×</button>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function showDeleteConfirmation(row, buyer) {
  // Highlight row
  row.classList.add('confirm-delete');
  
  // Deteksi apakah perangkat mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Gunakan modal custom untuk mobile
    showMobileConfirm(
      `Hapus transaksi ${buyer.namaPembeli}?`, 
      () => {
        buyerList = buyerList.filter(b => b.id !== buyer.id);
        localStorage.setItem('kasirBuyerList', JSON.stringify(buyerList));
        renderBuyerTable();
        showNotification('Transaksi berhasil dihapus', 'success');
      },
      () => {
        row.classList.remove('confirm-delete');
      }
    );
  } else {
    // Gunakan confirm biasa untuk desktop
    if (confirm(`Hapus transaksi ${buyer.namaPembeli}?`)) {
      buyerList = buyerList.filter(b => b.id !== buyer.id);
      localStorage.setItem('kasirBuyerList', JSON.stringify(buyerList));
      renderBuyerTable();
      showNotification('Transaksi berhasil dihapus', 'success');
    } else {
      row.classList.remove('confirm-delete');
    }
  }
}

function showMobileConfirm(message, confirmCallback, cancelCallback) {
  const modal = document.createElement('div');
  modal.className = 'mobile-confirm-modal';
  modal.innerHTML = `
    <div class="confirm-content">
      <p>${message}</p>
      <div class="confirm-buttons">
        <button class="confirm-cancel">Batal</button>
        <button class="confirm-ok">Hapus</button>
      </div>
    </div>
  `;
  
  modal.querySelector('.confirm-cancel').addEventListener('click', () => {
    document.body.removeChild(modal);
    cancelCallback();
  });
  
  modal.querySelector('.confirm-ok').addEventListener('click', () => {
    document.body.removeChild(modal);
    confirmCallback();
  });
  
  document.body.appendChild(modal);
}

// ==================== EXPORT EXCEL ====================
function exportToExcel() {
  try {
    // 1. Dapatkan data yang sedang ditampilkan di tabel
    const { sortedData } = getCurrentViewData();
    
    // 2. Format data untuk Excel
    const excelData = formatDataForExcel(sortedData);
    
    // 3. Buat worksheet dengan styling
    const ws = createStyledWorksheet(excelData);
    
    // 4. Export ke file Excel
    exportExcelFile(ws);
    
    showNotification('Data berhasil diekspor ke Excel', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showNotification('Gagal mengekspor data', 'error');
  }
}

function getCurrentViewData() {
  // 1. Filter data berdasarkan input pengguna
  const filteredData = buyerList.filter(buyer => {
    const tanggalValue = document.getElementById('filter-tanggal')?.value || '';
    const namaValue = document.getElementById('filter-nama')?.value.toLowerCase() || '';
    const barangValue = document.getElementById('filter-barang')?.value.toLowerCase() || '';
    const transferValue = filterTransfer?.value || '';
    const kirimValue = filterKirim?.value || '';
    
    // Filter tanggal
    if (tanggalValue) {
      const transaksiDate = new Date(buyer.tanggal).toDateString();
      const filterDate = new Date(tanggalValue).toDateString();
      if (transaksiDate !== filterDate) return false;
    }
    
    // Filter nama
    if (namaValue && !buyer.namaPembeli.toLowerCase().includes(namaValue)) {
      return false;
    }
    
    // Filter barang
    if (barangValue) {
      const hasItem = buyer.items.some(item => 
        item.namaBarang.toLowerCase().includes(barangValue)
      );
      if (!hasItem) return false;
    }
    
    // Filter status
    return (!transferValue || buyer.sudahTransfer.toString() === transferValue) &&
           (!kirimValue || buyer.sudahDikirim.toString() === kirimValue);
  });
  
  // 2. Urutkan data sesuai pengaturan sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'tanggal') {
      return sortAscending 
        ? new Date(a.tanggal) - new Date(b.tanggal)
        : new Date(b.tanggal) - new Date(a.tanggal);
    } else {
      // Default sorting by name
      const nameA = a.namaPembeli.toLowerCase();
      const nameB = b.namaPembeli.toLowerCase();
      return sortAscending 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }
  });
  
  return { filteredData, sortedData };
}

function formatDataForExcel(data) {
  return data.map((buyer, index) => {
    const itemsText = buyer.items.map(item => 
      `${item.namaBarang} (${item.jumlahBarang})`
    ).join(', ');
    
    const total = buyer.items.reduce((sum, item) => 
      sum + (item.hargaBarang * item.jumlahBarang), 0);
    
    return {
      'No': index + 1,
      'Tanggal': formatExcelDate(buyer.tanggal),
      'Nama Pembeli': buyer.namaPembeli,
      'Barang': itemsText,
      'Catatan': buyer.catatan || '-',
      'Total': total,
      'Transfer': buyer.sudahTransfer ? 'Sudah' : 'Belum',
      'Pengiriman': buyer.sudahDikirim ? 'Sudah' : 'Belum'
    };
  });
}

function formatExcelDate(dateString) {
  const options = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleString('id-ID', options);
}

function createStyledWorksheet(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 5 },    // No
    { wch: 20 },   // Tanggal
    { wch: 25 },   // Nama Pembeli
    { wch: 40 },   // Barang
    { wch: 30 },   // Catatan
    { wch: 15 },   // Total
    { wch: 12 },   // Transfer
    { wch: 12 }    // Pengiriman
  ];
  
  // Style untuk header
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };
  
  // Terapkan style ke header
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[cell]) ws[cell] = {};
    if (!ws[cell].s) ws[cell].s = {};
    Object.assign(ws[cell].s, headerStyle);
  }
  
  // Format angka untuk kolom Total
  const totalColIndex = 5; // Kolom Total (0-based)
  for (let R = 1; R <= range.e.r; ++R) {
    const cell = XLSX.utils.encode_cell({ r: R, c: totalColIndex });
    if (ws[cell]) {
      if (!ws[cell].s) ws[cell].s = {};
      ws[cell].s.numFmt = '"Rp"#,##0;[Red]"Rp"-#,##0';
    }
  }
  
  // Tambahkan footer dengan grand total
  const grandTotal = data.reduce((sum, row) => sum + row.Total, 0);
  XLSX.utils.sheet_add_aoa(ws, [
    ["", "", "", "", "Grand Total:", grandTotal, "", ""]
  ], { origin: -1 });
  
  // Style footer
  const footerCell = XLSX.utils.encode_cell({ r: range.e.r + 1, c: totalColIndex });
  if (!ws[footerCell].s) ws[footerCell].s = {};
  Object.assign(ws[footerCell].s, {
    font: { bold: true },
    numFmt: '"Rp"#,##0;[Red]"Rp"-#,##0'
  });
  
  return ws;
}

function exportExcelFile(ws) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Riwayat Transaksi");
  
  // Set properti dokumen
  wb.Props = {
    Title: "Riwayat Transaksi CT Catering",
    Subject: "Data Transaksi",
    Author: "CT Catering",
    CreatedDate: new Date()
  };
  
  // Nama file dengan timestamp
  const date = new Date();
  const dateString = date.toISOString().split('T')[0];
  const timeString = date.getHours() + '-' + date.getMinutes();
  XLSX.writeFile(wb, `Riwayat_Transaksi_${dateString}_${timeString}.xlsx`);
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  renderItemTable();
  renderBuyerTable();
  showSection('barang'); // Default section
  
  // Event listeners
  tambahKeKeranjangBtn?.addEventListener('click', tambahKeKeranjang);
  simpanTransaksiBtn?.addEventListener('click', simpanTransaksi);
  filterTanggal?.addEventListener('change', renderBuyerTable);
  filterTransfer?.addEventListener('change', renderBuyerTable);
  filterKirim?.addEventListener('change', renderBuyerTable);
  document.getElementById('filter-nama')?.addEventListener('input', renderBuyerTable);
  document.getElementById('filter-barang')?.addEventListener('input', renderBuyerTable);
  document.getElementById('sort-toggle')?.addEventListener('click', toggleSort);
  document.getElementById('export-excel')?.addEventListener('click', exportToExcel);
  
  document.getElementById('reset-buyer-btn')?.addEventListener('click', () => {
    if (confirm('Yakin reset semua transaksi pembeli?')) {
      buyerList = [];
      localStorage.removeItem('kasirBuyerList');
      renderBuyerTable();
    }
  });

  // Deteksi perangkat mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Tambahkan style khusus untuk mobile
    const style = document.createElement('style');
    style.textContent = `
      #buyer-table-body tr {
        padding: 12px 8px;
      }
      #buyer-table-body td {
        padding: 10px 5px;
      }
    `;
    document.head.appendChild(style);
  }
});

// Fungsi untuk toggle sortir
function toggleSort() {
  sortAscending = !sortAscending;
  updateSortButton();
  renderBuyerTable();
}

function updateSortButton() {
  const button = document.getElementById('sort-toggle');
  if (button) {
    button.textContent = sortAscending ? '🔽 Urutkan A-Z' : '🔼 Urutkan Z-A';
  }
}