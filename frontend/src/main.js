// API Configuration
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

let currentUser = null;
let allBooks = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const hostLabel = document.getElementById('apiHostLabel');
  if (hostLabel) {
    try {
      const parsedUrl = new URL(API_BASE_URL);
      hostLabel.innerText = `Backend: ${parsedUrl.host}`;
    } catch {
      hostLabel.innerText = `Backend: ${API_BASE_URL}`;
    }
  }

  // Setup form listeners
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  // Check auth state
  checkAuth();
});

// Expose globals for inline onclick handlers
window.quickLogin = quickLogin;
window.handleLogout = handleLogout;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.handleSaveBook = handleSaveBook;
window.deleteBook = deleteBook;
window.handleSearch = handleSearch;
window.handleSort = handleSort;
window.loadBooks = loadBooks;
window.runTestCaseA = runTestCaseA;
window.runTestCaseB = runTestCaseB;
window.runTestCaseC = runTestCaseC;

function getToken() {
  return localStorage.getItem('token') || '';
}

function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

function showAlert(message, type = 'success') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;
  alertBox.className = `alert-box alert-${type}`;
  alertBox.innerText = message;
  alertBox.style.display = 'block';
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 4000);
}

// Authentication Check
async function checkAuth() {
  const token = getToken();
  if (!token) {
    renderUnauthenticated();
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      currentUser = await res.json();
      renderAuthenticated();
      loadBooks();
    } else {
      setToken('');
      renderUnauthenticated();
    }
  } catch (err) {
    console.error('Profile fetch error:', err);
    // If token exists but network failed, try to parse token payload
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        currentUser = {
          id: payload.id,
          name: payload.name || payload.email,
          email: payload.email,
          role: payload.role || 'viewer'
        };
        renderAuthenticated();
        loadBooks();
        return;
      }
    } catch {}
    setToken('');
    renderUnauthenticated();
  }
}

function renderUnauthenticated() {
  currentUser = null;
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('dashboardSection').style.display = 'none';
  document.getElementById('authNav').innerHTML = `
    <span class="user-role-tag role-viewer">Guest (ยังไม่ได้เข้าสู่ระบบ)</span>
  `;
}

function renderAuthenticated() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';

  const role = (currentUser?.role || 'viewer').toLowerCase();

  // Auth Nav
  document.getElementById('authNav').innerHTML = `
    <div class="user-profile-badge">
      <div class="user-info-text">
        <div class="user-name">${currentUser.name || currentUser.email}</div>
        <span class="user-role-tag role-${role}">${role.toUpperCase()}</span>
      </div>
      <button class="btn btn-outline btn-sm" onclick="handleLogout()">ออกจากระบบ</button>
    </div>
  `;

  // Role Banner
  const roleBanner = document.getElementById('roleBanner');
  const roleIcon = document.getElementById('roleIcon');
  const roleTitle = document.getElementById('roleBannerTitle');
  const roleDesc = document.getElementById('roleBannerDesc');
  const addBookBtn = document.getElementById('addBookBtn');

  if (role === 'admin') {
    roleIcon.innerText = '👑';
    roleTitle.innerText = 'บทบาทของคุณ: Admin (ผู้ดูแลระบบสูงสุด)';
    roleDesc.innerText = 'คุณมีสิทธิ์เต็มทุกประการ: สามารถดู, เพิ่ม, แก้ไข, และลบ (DELETE) ข้อมูลหนังสือในระบบ';
    addBookBtn.style.display = 'inline-flex';
  } else if (role === 'editor') {
    roleIcon.innerText = '✏️';
    roleTitle.innerText = 'บทบาทของคุณ: Editor (ผู้แก้ไขข้อมูล)';
    roleDesc.innerText = 'คุณสามารถดู, เพิ่ม และแก้ไขข้อมูลหนังสือได้ (ไม่มีสิทธิ์ลบหนังสือ)';
    addBookBtn.style.display = 'inline-flex';
  } else if (role === 'manager') {
    roleIcon.innerText = '👔';
    roleTitle.innerText = 'บทบาทของคุณ: Manager (ผู้จัดการคลัง)';
    roleDesc.innerText = 'คุณสามารถดู, เพิ่ม และแก้ไขข้อมูลหนังสือได้';
    addBookBtn.style.display = 'inline-flex';
  } else {
    roleIcon.innerText = '👁️';
    roleTitle.innerText = 'บทบาทของคุณ: Viewer (ผู้อ่าน)';
    roleDesc.innerText = 'คุณสามารถดูรายการหนังสือได้เท่านั้น ไม่สามารถเพิ่ม แก้ไข หรือลบหนังสือได้';
    addBookBtn.style.display = 'none';
  }
}

// Login
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  await performLogin(email, password);
}

async function quickLogin(email) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = '123456';
  await performLogin(email, '123456');
}

async function performLogin(email, password) {
  const submitBtn = document.getElementById('loginSubmitBtn');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE_URL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok && data.token) {
      setToken(data.token);
      currentUser = data.user || { email, role: 'viewer' };
      showAlert(`เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ${currentUser.name || currentUser.email}`, 'success');
      renderAuthenticated();
      loadBooks();
    } else {
      showAlert(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
  } catch (err) {
    showAlert(`เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: ${err.message}`, 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function handleLogout() {
  setToken('');
  currentUser = null;
  renderUnauthenticated();
  showAlert('ออกจากระบบเรียบร้อยแล้ว');
}

// Book CRUD Operations
async function loadBooks() {
  const tbody = document.getElementById('booksTableBody');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">กำลังโหลดข้อมูลหนังสือ...</td></tr>';

  const token = getToken();
  try {
    const res = await fetch(`${API_BASE_URL}/api/books/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      allBooks = await res.json();
      renderBooksTable();
    } else if (res.status === 401) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4" style="color:red;">401 Unauthorized: กรุณาเข้าสู่ระบบก่อน</td></tr>';
    } else {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4" style="color:red;">เกิดข้อผิดพลาด (HTTP ${res.status})</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4" style="color:red;">ไม่สามารถเชื่อมต่อ API ได้: ${err.message}</td></tr>`;
  }
}

function renderBooksTable() {
  const tbody = document.getElementById('booksTableBody');
  const role = (currentUser?.role || 'viewer').toLowerCase();
  const query = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
  const sort = document.getElementById('sortSelect')?.value || '-id';

  let filtered = allBooks.slice();

  if (query) {
    filtered = filtered.filter(b =>
      String(b.id || '').includes(query) ||
      (b.title && b.title.toLowerCase().includes(query)) ||
      (b.author && b.author.toLowerCase().includes(query)) ||
      (b.category && b.category.toLowerCase().includes(query))
    );
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sort === '-id') return (b.id || 0) - (a.id || 0);
    if (sort === 'id') return (a.id || 0) - (b.id || 0);
    if (sort === 'price') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    if (sort === '-price') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    if (sort === 'stock') return (b.stock || 0) - (a.stock || 0);
    if (sort === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
    return 0;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">ไม่พบรายการหนังสือ</td></tr>';
    return;
  }

  const canEdit = ['editor', 'admin', 'manager'].includes(role);
  const canDelete = role === 'admin';

  tbody.innerHTML = filtered.map(b => {
    let actionButtons = '';
    if (canEdit) {
      actionButtons += `<button class="btn btn-secondary btn-sm" onclick="openEditModal(${b.id})">✏️ แก้ไข</button>`;
    }
    if (canDelete) {
      actionButtons += `<button class="btn btn-danger btn-sm" onclick="deleteBook(${b.id})">🗑️ ลบ</button>`;
    }
    if (!canEdit && !canDelete) {
      actionButtons = `<span style="font-size:0.8rem; color:#94a3b8;">👁️ ดูได้อย่างเดียว</span>`;
    }

    const stockClass = (b.stock || 0) > 3 ? 'stock-high' : 'stock-low';
    const priceStr = parseFloat(b.price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
    const updatedStr = b.updated_at ? new Date(b.updated_at).toLocaleDateString('th-TH') : '-';

    return `
      <tr>
        <td><strong>#${b.id}</strong></td>
        <td><strong>${escapeHtml(b.title)}</strong></td>
        <td>${escapeHtml(b.author || '-')}</td>
        <td><span class="category-tag">${escapeHtml(b.category || 'ทั่วไป')}</span></td>
        <td class="price-text">฿${priceStr}</td>
        <td><span class="stock-badge ${stockClass}">${b.stock ?? 0}</span></td>
        <td><small style="color:#64748b;">${updatedStr}</small></td>
        <td><div class="action-cell">${actionButtons}</div></td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function handleSearch() {
  renderBooksTable();
}

function handleSort() {
  renderBooksTable();
}

// Modal Handlers
function openAddModal() {
  document.getElementById('modalTitle').innerText = 'เพิ่มหนังสือใหม่';
  document.getElementById('modalBookId').value = '';
  document.getElementById('modalBookTitle').value = '';
  document.getElementById('modalBookAuthor').value = '';
  document.getElementById('modalBookPrice').value = '';
  document.getElementById('modalBookStock').value = '10';
  document.getElementById('modalBookCategory').value = '';
  document.getElementById('bookModal').style.display = 'flex';
}

function openEditModal(id) {
  const book = allBooks.find(b => b.id === id);
  if (!book) return;

  document.getElementById('modalTitle').innerText = `แก้ไขหนังสือ #${id}`;
  document.getElementById('modalBookId').value = book.id;
  document.getElementById('modalBookTitle').value = book.title || '';
  document.getElementById('modalBookAuthor').value = book.author || '';
  document.getElementById('modalBookPrice').value = book.price || '';
  document.getElementById('modalBookStock').value = book.stock || 0;
  document.getElementById('modalBookCategory').value = book.category || '';
  document.getElementById('bookModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('bookModal').style.display = 'none';
}

async function handleSaveBook(e) {
  e.preventDefault();
  const id = document.getElementById('modalBookId').value;
  const title = document.getElementById('modalBookTitle').value.trim();
  const author = document.getElementById('modalBookAuthor').value.trim();
  const price = parseFloat(document.getElementById('modalBookPrice').value);
  const stock = parseInt(document.getElementById('modalBookStock').value, 10);
  const category = document.getElementById('modalBookCategory').value.trim();

  const token = getToken();
  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_BASE_URL}/api/books/${id}/` : `${API_BASE_URL}/api/books/`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, author, price, stock, category })
    });

    if (res.ok) {
      showAlert(id ? 'บันทึกการแก้ไขหนังสือสำเร็จ!' : 'เพิ่มหนังสือเล่มใหม่สำเร็จ!', 'success');
      closeModal();
      loadBooks();
    } else {
      const err = await res.json().catch(() => ({}));
      showAlert(err.detail || err.message || `บันทึกไม่สำเร็จ (HTTP ${res.status})`, 'error');
    }
  } catch (err) {
    showAlert(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
  }
}

async function deleteBook(id) {
  if (!confirm(`คุณต้องการลบหนังสือ #${id} ใช่หรือไม่?`)) return;

  const token = getToken();
  try {
    const res = await fetch(`${API_BASE_URL}/api/books/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 204 || res.ok) {
      showAlert(`ลบหนังสือ #${id} สำเร็จ! (HTTP 204 No Content)`, 'success');
      loadBooks();
    } else {
      const err = await res.json().catch(() => ({}));
      showAlert(err.detail || `ลบไม่สำเร็จ (HTTP ${res.status})`, 'error');
    }
  } catch (err) {
    showAlert(`เกิดข้อผิดพลาดในการลบ: ${err.message}`, 'error');
  }
}

// Production API Verification Suite (Section 6)
function showConsoleOutput(content) {
  const consoleBox = document.getElementById('testResultConsole');
  const contentEl = document.getElementById('testResultContent');
  consoleBox.style.display = 'block';
  contentEl.innerText = content;
}

// Case A: Request without Token -> Expect 401 Unauthorized
async function runTestCaseA() {
  showConsoleOutput('🔄 Running Case A: Requesting GET /api/books/ WITHOUT Authorization Token...');
  try {
    const startTime = performance.now();
    const res = await fetch(`${API_BASE_URL}/api/books/`, {
      method: 'GET'
      // No Authorization header sent!
    });
    const endTime = performance.now();
    const body = await res.text();

    const output = [
      `=== [TEST CASE A: NO TOKEN] ===`,
      `Target URL: GET ${API_BASE_URL}/api/books/`,
      `Authorization: (none)`,
      `HTTP Status: ${res.status} ${res.statusText}`,
      `Response Time: ${(endTime - startTime).toFixed(1)} ms`,
      `Result: ${res.status === 401 ? '✅ PASSED (HTTP 401 Unauthorized)' : '❌ FAILED (Expected 401)'}`,
      `Response Headers:`,
      `  WWW-Authenticate: ${res.headers.get('www-authenticate') || '-'}`,
      `  Content-Type: ${res.headers.get('content-type') || '-'}`,
      `Response Body:`,
      body
    ].join('\n');

    showConsoleOutput(output);
  } catch (err) {
    showConsoleOutput(`❌ Case A Request Error: ${err.message}`);
  }
}

// Case B: Viewer tries DELETE -> Expect 403 Forbidden
async function runTestCaseB() {
  showConsoleOutput('🔄 Running Case B: Logging in as Viewer (usera@test.com) & sending DELETE /api/books/1/...');
  try {
    // 1. Login as viewer
    const loginRes = await fetch(`${API_BASE_URL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'usera@test.com', password: '123456' })
    });
    const loginData = await loginRes.json();
    const viewerToken = loginData.token;

    if (!viewerToken) {
      showConsoleOutput('❌ Case B Error: Cannot get viewer token from login');
      return;
    }

    // 2. Viewer attempts DELETE
    const targetBookId = allBooks[0]?.id || 1;
    const startTime = performance.now();
    const res = await fetch(`${API_BASE_URL}/api/books/${targetBookId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${viewerToken}`
      }
    });
    const endTime = performance.now();
    const body = await res.text();

    const output = [
      `=== [TEST CASE B: VIEWER DELETE ATTEMPT] ===`,
      `User: usera@test.com (Role: viewer)`,
      `Target URL: DELETE ${API_BASE_URL}/api/books/${targetBookId}/`,
      `Authorization: Bearer [Viewer Token]`,
      `HTTP Status: ${res.status} ${res.statusText}`,
      `Response Time: ${(endTime - startTime).toFixed(1)} ms`,
      `Result: ${res.status === 403 ? '✅ PASSED (HTTP 403 Forbidden - Role RBAC Enforced)' : '❌ FAILED (Expected 403)'}`,
      `Response Body:`,
      body
    ].join('\n');

    showConsoleOutput(output);
  } catch (err) {
    showConsoleOutput(`❌ Case B Request Error: ${err.message}`);
  }
}

// Case C: Admin deletes -> Expect 204 No Content
async function runTestCaseC() {
  showConsoleOutput('🔄 Running Case C: Logging in as Admin (userc@test.com), creating a temp book & sending DELETE...');
  try {
    // 1. Login as admin
    const loginRes = await fetch(`${API_BASE_URL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'userc@test.com', password: '123456' })
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.token;

    if (!adminToken) {
      showConsoleOutput('❌ Case C Error: Cannot get admin token from login');
      return;
    }

    // 2. Create a temporary book to safely delete
    const createRes = await fetch(`${API_BASE_URL}/api/books/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: `Temp Verification Book ${Date.now()}`,
        author: 'System Test',
        price: 99.00,
        stock: 1,
        category: 'Test'
      })
    });
    const createdBook = await createRes.json();
    const tempBookId = createdBook.id;

    // 3. Admin sends DELETE
    const startTime = performance.now();
    const res = await fetch(`${API_BASE_URL}/api/books/${tempBookId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const endTime = performance.now();

    const output = [
      `=== [TEST CASE C: ADMIN DELETE] ===`,
      `User: userc@test.com (Role: admin)`,
      `Created Temp Book ID: #${tempBookId}`,
      `Target URL: DELETE ${API_BASE_URL}/api/books/${tempBookId}/`,
      `Authorization: Bearer [Admin Token]`,
      `HTTP Status: ${res.status} ${res.statusText}`,
      `Response Time: ${(endTime - startTime).toFixed(1)} ms`,
      `Result: ${res.status === 204 ? '✅ PASSED (HTTP 204 No Content - Deletion Succeeded)' : '❌ FAILED (Expected 204)'}`,
      `Note: Status 204 has no body content as per HTTP standard.`
    ].join('\n');

    showConsoleOutput(output);
    loadBooks();
  } catch (err) {
    showConsoleOutput(`❌ Case C Request Error: ${err.message}`);
  }
}
