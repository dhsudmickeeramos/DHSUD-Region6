// =====================================================
// DHSUD REGION VI - BACKEND API URL
// =====================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbyXu6iWw1Bp4TqR9toiWbCjGRhwKAkMrzSqBB0x6diHP36lz4Imk0LLRx77nbWstIZ6jw/exec';

// ---- State ----
let employees = [];
let filteredEmployees = [];

// ---- DOM refs ----
const form = document.getElementById('employeeForm');
const tableBody = document.getElementById('tableBody');
const employeeCountSpan = document.getElementById('employeeCount');
const tableCountBadge = document.getElementById('tableCountBadge');
const statusIndicator = document.getElementById('statusIndicator');
const submitBtn = document.getElementById('submitBtn');
const refreshBtn = document.getElementById('refreshBtn');
const searchBox = document.getElementById('searchBox');
const toastEl = document.getElementById('toast');
const loadingOverlay = document.getElementById('loadingOverlay');

// =====================================================
// UI HELPERS
// =====================================================
function showToast(message, type = 'info') {
    toastEl.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toastEl.innerHTML = `<i class="fas ${icon}"></i> ${escapeHtml(message)}`;
    toastEl.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove('show'), 3500);
}

function setLoading(active) {
    loadingOverlay.classList.toggle('active', active);
}

function setStatus(state, text) {
    statusIndicator.className = `status-indicator status-${state}`;
    const icon = state === 'online' ? 'fa-check-circle' :
                 state === 'offline' ? 'fa-times-circle' : 'fa-circle-notch fa-spin';
    statusIndicator.innerHTML = `<i class="fas ${icon}"></i> ${escapeHtml(text)}`;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function formatSalary(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateCounts() {
    const total = employees.length;
    const shown = filteredEmployees.length;
    employeeCountSpan.textContent = total;
    tableCountBadge.textContent = shown === total
        ? `${total} ${total === 1 ? 'record' : 'records'}`
        : `${shown} of ${total}`;
}

// =====================================================
// API CALLS
// =====================================================
async function apiGetList() {
    const res = await fetch(`${API_URL}?action=list&_=${Date.now()}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}

async function apiPost(action, params) {
    const body = new URLSearchParams({ action, ...params });
    const res = await fetch(API_URL, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}

// =====================================================
// LOAD EMPLOYEES
// =====================================================
async function fetchEmployees(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
        const json = await apiGetList();
        if (json.success) {
            employees = json.data || [];
            filteredEmployees = [...employees];
            renderTable();
            setStatus('online', 'Connected');
            if (showLoader) showToast(`Loaded ${employees.length} employee(s)`, 'success');
        } else {
            setStatus('offline', 'Error');
            showToast('Failed to load: ' + (json.message || 'unknown error'), 'error');
        }
    } catch (err) {
        setStatus('offline', 'Offline');
        showToast('Cannot reach backend: ' + err.message, 'error');
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="19">
                    <i class="fas fa-exclamation-triangle" style="color:#c24a4a;"></i>
                    Failed to connect to DHSUD backend. Please check your internet or deployment URL.
                </td>
            </tr>`;
        updateCounts();
    } finally {
        setLoading(false);
    }
}

// =====================================================
// RENDER TABLE
// =====================================================
function renderTable() {
    if (filteredEmployees.length === 0) {
        const msg = employees.length === 0
            ? 'No employees yet. Add your first DHSUD Region VI employee above.'
            : 'No employees match your search.';
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="19">
                    <i class="fas fa-user-slash" style="margin-right: 0.6rem;"></i>
                    ${msg}
                </td>
            </tr>`;
        updateCounts();
        return;
    }

    tableBody.innerHTML = filteredEmployees.map(emp => `
        <tr>
            <td><strong>${escapeHtml(emp.fullName)}</strong></td>
            <td>${escapeHtml(emp.address)}</td>
            <td>${escapeHtml(emp.birthday)}</td>
            <td>${escapeHtml(emp.bloodType)}</td>
            <td>${escapeHtml(emp.contactNo)}</td>
            <td>${escapeHtml(emp.emergencyPerson)}</td>
            <td>${escapeHtml(emp.emergencyNo)}</td>
            <td>${escapeHtml(emp.position)}</td>
            <td>${escapeHtml(emp.salaryGrade)}</td>
            <td>₱ ${formatSalary(emp.salary)}</td>
            <td>${escapeHtml(emp.division)}</td>
            <td>${escapeHtml(emp.employmentStatus)}</td>
            <td>${escapeHtml(emp.startDate)}</td>
            <td>${escapeHtml(emp.gisisNo)}</td>
            <td>${escapeHtml(emp.sssNo)}</td>
            <td>${escapeHtml(emp.tinNo)}</td>
            <td>${escapeHtml(emp.pagibigNo)}</td>
            <td>${escapeHtml(emp.philhealthNo)}</td>
            <td>
                <button class="btn-delete" data-id="${escapeHtml(emp.id)}">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => handleDelete(btn.dataset.id, btn));
    });
    updateCounts();
}

// =====================================================
// ADD EMPLOYEE
// =====================================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        fullName: document.getElementById('fullName').value.trim(),
        address: document.getElementById('address').value.trim(),
        birthday: document.getElementById('birthday').value,
        bloodType: document.getElementById('bloodType').value,
        contactNo: document.getElementById('contactNo').value.trim(),
        emergencyPerson: document.getElementById('emergencyPerson').value.trim(),
        emergencyNo: document.getElementById('emergencyNo').value.trim(),
        position: document.getElementById('position').value.trim(),
        salaryGrade: document.getElementById('salaryGrade').value.trim(),
        salary: document.getElementById('salary').value,
        division: document.getElementById('division').value.trim(),
        employmentStatus: document.getElementById('employmentStatus').value,
        startDate: document.getElementById('startDate').value,
        gisisNo: document.getElementById('gisisNo').value.trim(),
        sssNo: document.getElementById('sssNo').value.trim(),
        tinNo: document.getElementById('tinNo').value.trim(),
        pagibigNo: document.getElementById('pagibigNo').value.trim(),
        philhealthNo: document.getElementById('philhealthNo').value.trim()
    };

    submitBtn.disabled = true;
    setLoading(true);
    try {
        const json = await apiPost('add', payload);
        if (json.success) {
            showToast('Employee added successfully!', 'success');
            form.reset();
            document.getElementById('bloodType').value = '';
            document.getElementById('employmentStatus').value = '';
            await fetchEmployees(false);
        } else {
            showToast('Add failed: ' + (json.message || 'unknown error'), 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        setLoading(false);
    }
});

// =====================================================
// DELETE EMPLOYEE
// =====================================================
async function handleDelete(id, btnEl) {
    if (!confirm('Delete this employee record? This cannot be undone.')) return;
    btnEl.disabled = true;
    setLoading(true);
    try {
        const json = await apiPost('delete', { id });
        if (json.success) {
            showToast('Employee deleted', 'success');
            await fetchEmployees(false);
        } else {
            showToast('Delete failed: ' + (json.message || 'unknown error'), 'error');
            btnEl.disabled = false;
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
        btnEl.disabled = false;
    } finally {
        setLoading(false);
    }
}

// =====================================================
// SEARCH
// =====================================================
searchBox.addEventListener('input', () => {
    const q = searchBox.value.trim().toLowerCase();
    if (!q) {
        filteredEmployees = [...employees];
    } else {
        filteredEmployees = employees.filter(emp =>
            Object.values(emp).some(v => String(v).toLowerCase().includes(q))
        );
    }
    renderTable();
});

// =====================================================
// REFRESH
// =====================================================
refreshBtn.addEventListener('click', () => fetchEmployees(true));

// =====================================================
// INITIAL LOAD
// =====================================================
document.addEventListener('DOMContentLoaded', () => fetchEmployees(true));