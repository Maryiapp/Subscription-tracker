const API_BASE = '/api/v1';
let isRegisterMode = false;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (token) {
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('appSection').classList.remove('hidden');
        document.getElementById('userEmailBadge').innerText = localStorage.getItem('user_email') || 'My Account';
        loadCategories();
        loadDashboard();
    } else {
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('appSection').classList.add('hidden');
    }
}

function setupEventListeners() {
    document.getElementById('tabLogin').addEventListener('click', () => setAuthMode(false));
    document.getElementById('tabRegister').addEventListener('click', () => setAuthMode(true));
    document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    document.getElementById('openAddModalBtn').addEventListener('click', () => openModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
    document.getElementById('subForm').addEventListener('submit', handleSubSubmit);
}

function setAuthMode(register) {
    isRegisterMode = register;
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (register) {
        tabRegister.className = 'flex-1 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white transition';
        tabLogin.className = 'flex-1 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-white transition';
        submitBtn.innerText = 'Sign Up';
    } else {
        tabLogin.className = 'flex-1 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white transition';
        tabRegister.className = 'flex-1 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-white transition';
        submitBtn.innerText = 'Log In';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const errorDiv = document.getElementById('authError');
    errorDiv.classList.add('hidden');

    try {
        if (isRegisterMode) {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
            alert('Registration successful! Please log in.');
            setAuthMode(false);
        } else {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            formData.append('grant_type', 'password');

            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login failed');

            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_email', email);
            checkAuth();
        }
    } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.clear();
    checkAuth();
}

async function loadDashboard() {
    await Promise.all([loadStats(), loadSubscriptions()]);
}

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/subscriptions/stats/summary`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const stats = await res.json();

        document.getElementById('statMonthly').innerText = `$${stats.total_monthly.toFixed(2)}`;
        document.getElementById('statYearly').innerText = `$${stats.total_yearly.toFixed(2)}`;
        document.getElementById('statActiveCount').innerText = stats.active_count;
        
        if (stats.most_expensive) {
            document.getElementById('statMostExpensive').innerText = `${stats.most_expensive.title} ($${stats.most_expensive.price})`;
        } else {
            document.getElementById('statMostExpensive').innerText = '—';
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadSubscriptions() {
    try {
        const res = await fetch(`${API_BASE}/subscriptions/`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const subs = await res.json();

        const grid = document.getElementById('subscriptionsGrid');
        const emptyState = document.getElementById('emptyState');
        document.getElementById('subsCountBadge').innerText = subs.length;

        grid.innerHTML = '';
        if (subs.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        subs.forEach(sub => {
            const card = document.createElement('div');
            card.className = `glass-card glass-card-hover p-5 rounded-3xl flex flex-col justify-between ${!sub.is_active ? 'opacity-50' : ''}`;
            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs px-2.5 py-1 rounded-full border ${sub.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}">
                            ${sub.is_active ? 'Active' : 'Paused'}
                        </span>
                        <div class="flex items-center gap-2">
                            <button onclick="deleteSubscription(${sub.id})" class="text-slate-500 hover:text-rose-400 transition text-sm">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-1">${sub.title}</h3>
                    <p class="text-xs text-slate-400 mb-4">${sub.billing_cycle === 'yearly' ? 'Yearly billing' : 'Monthly billing'}</p>
                </div>
                <div class="flex items-baseline justify-between pt-4 border-t border-white/5">
                    <span class="text-2xl font-extrabold text-white">${sub.currency === 'USD' ? '$' : sub.currency === 'EUR' ? '€' : sub.currency === 'GBP' ? '£' : '₽'}${sub.price}</span>
                    <span class="text-xs text-slate-400">/ ${sub.billing_cycle === 'yearly' ? 'yr' : 'mo'}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error(e);
    }
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE}/categories/`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const categories = await res.json();
        const select = document.getElementById('subCategory');
        select.innerHTML = '<option value="">No Category</option>';
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    } catch (e) {
        console.error(e);
    }
}

function openModal() {
    document.getElementById('subForm').reset();
    document.getElementById('subId').value = '';
    document.getElementById('subModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('subModal').classList.add('hidden');
}

async function handleSubSubmit(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById('subTitle').value,
        price: parseFloat(document.getElementById('subPrice').value),
        currency: document.getElementById('subCurrency').value,
        billing_cycle: document.getElementById('subBillingCycle').value,
        is_active: document.getElementById('subIsActive').checked,
        category_id: document.getElementById('subCategory').value ? parseInt(document.getElementById('subCategory').value) : null
    };

    try {
        const res = await fetch(`${API_BASE}/subscriptions/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to save subscription');
        closeModal();
        loadDashboard();
    } catch (err) {
        alert(err.message);
    }
}

async function deleteSubscription(id) {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    try {
        const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete subscription');
        loadDashboard();
    } catch (e) {
        alert(e.message);
    }
}