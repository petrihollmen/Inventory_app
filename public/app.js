/* =====================================================
   Inventory Manager – Frontend Application
   ===================================================== */

const API = '/api';

// ── State ──────────────────────────────────────────────
let allProducts = [];
let editingId = null;
let deleteTargetId = null;

// ── DOM refs ───────────────────────────────────────────
const tableBody        = document.getElementById('tableBody');
const emptyState       = document.getElementById('emptyState');
const searchInput      = document.getElementById('searchInput');
const categoryFilter   = document.getElementById('categoryFilter');
const categoryList     = document.getElementById('categoryList');
const productModal     = document.getElementById('productModal');
const deleteModal      = document.getElementById('deleteModal');
const modalTitle       = document.getElementById('modalTitle');
const productForm      = document.getElementById('productForm');
const productId        = document.getElementById('productId');
const fieldName        = document.getElementById('fieldName');
const fieldSku         = document.getElementById('fieldSku');
const fieldCategory    = document.getElementById('fieldCategory');
const fieldPrice       = document.getElementById('fieldPrice');
const fieldQuantity    = document.getElementById('fieldQuantity');
const fieldDescription = document.getElementById('fieldDescription');
const deleteProductName = document.getElementById('deleteProductName');

const statTotal    = document.getElementById('statTotal');
const statItems    = document.getElementById('statItems');
const statLowStock = document.getElementById('statLowStock');
const statValue    = document.getElementById('statValue');

const toast = document.getElementById('toast');

// ── Toast ──────────────────────────────────────────────
let toastTimer;
function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast ${type} visible`;
  toastTimer = setTimeout(() => { toast.classList.remove('visible'); }, 3000);
}

// ── API helpers ────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Fetch & render products ────────────────────────────
async function loadProducts() {
  const search   = searchInput.value.trim();
  const category = categoryFilter.value;

  const params = new URLSearchParams();
  if (search)   params.set('search', search);
  if (category) params.set('category', category);

  try {
    allProducts = await apiFetch(`${API}/products?${params}`);
    renderTable(allProducts);
    updateStats(allProducts);
  } catch (err) {
    showToast('Failed to load products', 'error');
  }
}

function updateStats(products) {
  const totalItems  = products.reduce((s, p) => s + p.quantity, 0);
  const lowStock    = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
  const totalValue  = products.reduce((s, p) => s + p.price * p.quantity, 0);

  statTotal.textContent    = products.length;
  statItems.textContent    = totalItems.toLocaleString();
  statLowStock.textContent = lowStock;
  statValue.textContent    = '$' + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderTable(products) {
  if (products.length === 0) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  tableBody.innerHTML = products.map(p => renderRow(p)).join('');
}

function qtyClass(q) {
  if (q === 0)   return 'out-of-stock';
  if (q <= 10)   return 'low-stock';
  return '';
}

function renderRow(p) {
  return `
    <tr data-id="${p.id}">
      <td>
        <div class="product-name">${escHtml(p.name)}</div>
        ${p.description ? `<div class="product-desc" title="${escHtml(p.description)}">${escHtml(p.description)}</div>` : ''}
      </td>
      <td><span class="sku-badge">${escHtml(p.sku)}</span></td>
      <td><span class="category-badge">${escHtml(p.category)}</span></td>
      <td class="price-cell">$${Number(p.price).toFixed(2)}</td>
      <td>
        <div class="qty-control">
          <button class="qty-btn" data-action="dec" data-id="${p.id}" aria-label="Decrease quantity">−</button>
          <span class="qty-value ${qtyClass(p.quantity)}">${p.quantity}</span>
          <button class="qty-btn" data-action="inc" data-id="${p.id}" aria-label="Increase quantity">+</button>
        </div>
      </td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon edit" data-action="edit" data-id="${p.id}" title="Edit product" aria-label="Edit ${escHtml(p.name)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon delete" data-action="delete" data-id="${p.id}" data-name="${escHtml(p.name)}" title="Delete product" aria-label="Delete ${escHtml(p.name)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Categories ─────────────────────────────────────────
async function loadCategories() {
  try {
    const cats = await apiFetch(`${API}/categories`);
    // Populate filter dropdown (keep "All Categories")
    const current = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      if (c === current) opt.selected = true;
      categoryFilter.appendChild(opt);
    });
    // Populate datalist for form
    categoryList.innerHTML = '';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      categoryList.appendChild(opt);
    });
  } catch (_) { /* non-critical */ }
}

// ── Quantity controls ──────────────────────────────────
async function updateQuantity(id, delta) {
  const product = allProducts.find(p => p.id === Number(id));
  if (!product) return;
  const newQty = Math.max(0, product.quantity + delta);
  try {
    const updated = await apiFetch(`${API}/products/${id}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: newQty })
    });
    // Update in memory
    const idx = allProducts.findIndex(p => p.id === Number(id));
    if (idx !== -1) allProducts[idx] = updated;
    // Re-render just this row
    const row = tableBody.querySelector(`tr[data-id="${id}"]`);
    if (row) row.outerHTML = renderRow(updated);
    updateStats(allProducts);
  } catch (err) {
    showToast('Failed to update quantity', 'error');
  }
}

// ── Add / Edit modal ───────────────────────────────────
function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Add Product';
  document.getElementById('saveBtn').textContent = 'Add Product';
  productId.value = '';
  productForm.reset();
  clearFormErrors();
  productModal.style.display = 'flex';
  fieldName.focus();
}

function openEditModal(id) {
  const product = allProducts.find(p => p.id === Number(id));
  if (!product) return;
  editingId = id;
  modalTitle.textContent = 'Edit Product';
  document.getElementById('saveBtn').textContent = 'Save Changes';
  productId.value = product.id;
  fieldName.value        = product.name;
  fieldSku.value         = product.sku;
  fieldCategory.value    = product.category;
  fieldPrice.value       = product.price;
  fieldQuantity.value    = product.quantity;
  fieldDescription.value = product.description || '';
  clearFormErrors();
  productModal.style.display = 'flex';
  fieldName.focus();
}

function closeProductModal() {
  productModal.style.display = 'none';
  editingId = null;
}

// ── Form validation ────────────────────────────────────
function clearFormErrors() {
  ['Name', 'Sku', 'Category', 'Price', 'Quantity'].forEach(f => {
    const el = document.getElementById(`field${f}`);
    const err = document.getElementById(`err${f}`);
    if (el) el.classList.remove('error');
    if (err) err.textContent = '';
  });
}

function setFieldError(field, message) {
  const el = document.getElementById(`field${field}`);
  const err = document.getElementById(`err${field}`);
  if (el) el.classList.add('error');
  if (err) err.textContent = message;
}

function validateForm() {
  clearFormErrors();
  let valid = true;

  if (!fieldName.value.trim()) {
    setFieldError('Name', 'Product name is required');
    valid = false;
  }
  if (!fieldSku.value.trim()) {
    setFieldError('Sku', 'SKU is required');
    valid = false;
  }
  if (!fieldCategory.value.trim()) {
    setFieldError('Category', 'Category is required');
    valid = false;
  }
  const price = parseFloat(fieldPrice.value);
  if (isNaN(price) || price < 0) {
    setFieldError('Price', 'Enter a valid price');
    valid = false;
  }
  const qty = parseInt(fieldQuantity.value, 10);
  if (isNaN(qty) || qty < 0) {
    setFieldError('Quantity', 'Enter a valid quantity');
    valid = false;
  }
  return valid;
}

// ── Save product (add/edit) ────────────────────────────
async function saveProduct(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;

  const payload = {
    name:        fieldName.value.trim(),
    sku:         fieldSku.value.trim(),
    category:    fieldCategory.value.trim(),
    price:       parseFloat(fieldPrice.value),
    quantity:    parseInt(fieldQuantity.value, 10),
    description: fieldDescription.value.trim()
  };

  try {
    if (editingId) {
      await apiFetch(`${API}/products/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Product updated successfully');
    } else {
      await apiFetch(`${API}/products`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Product added successfully');
    }
    closeProductModal();
    await loadCategories();
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

// ── Delete modal ───────────────────────────────────────
function openDeleteModal(id, name) {
  deleteTargetId = id;
  deleteProductName.textContent = name;
  deleteModal.style.display = 'flex';
}

function closeDeleteModal() {
  deleteModal.style.display = 'none';
  deleteTargetId = null;
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  try {
    await apiFetch(`${API}/products/${deleteTargetId}`, { method: 'DELETE' });
    showToast('Product deleted');
    closeDeleteModal();
    await loadCategories();
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ── Event delegation for table actions ─────────────────
tableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id, name } = btn.dataset;
  if (action === 'edit')   openEditModal(id);
  if (action === 'delete') openDeleteModal(id, name);
  if (action === 'inc')    updateQuantity(id, 1);
  if (action === 'dec')    updateQuantity(id, -1);
});

// ── Search & filter ────────────────────────────────────
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadProducts, 300);
});

categoryFilter.addEventListener('change', loadProducts);

// ── Modal events ───────────────────────────────────────
document.getElementById('addProductBtn').addEventListener('click', openAddModal);
document.getElementById('modalClose').addEventListener('click', closeProductModal);
document.getElementById('cancelBtn').addEventListener('click', closeProductModal);
document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
productForm.addEventListener('submit', saveProduct);

// Close modals when clicking overlay
productModal.addEventListener('click', (e) => { if (e.target === productModal) closeProductModal(); });
deleteModal.addEventListener('click',  (e) => { if (e.target === deleteModal)  closeDeleteModal(); });

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (productModal.style.display !== 'none') closeProductModal();
    if (deleteModal.style.display  !== 'none') closeDeleteModal();
  }
});

// ── Init ───────────────────────────────────────────────
(async function init() {
  await loadCategories();
  await loadProducts();
})();
