// App State
const state = {
    version: '2.2.0',
    userName: 'Juan',
    darkMode: false,
    totalIncome: 0,
    totalSpent: 0,
    transactions: [],
    fixedExpenses: [], // "Los Sabuesos"
    currentType: 'expense'
};

// Default data for first-time users
const defaultData = {
    userName: 'Amigo',
    darkMode: false,
    totalIncome: 3500.00,
    totalSpent: 2260.00,
    transactions: [
        { id: 1, type: 'expense', name: 'Supermercado', amount: 85.50, date: 'Hoy, 14:20' },
        { id: 2, type: 'income', name: 'Venta Diseño', amount: 450.00, date: 'Ayer, 18:00' },
        { id: 3, type: 'expense', name: 'Internet', amount: 45.00, date: '2 Feb, 10:00' }
    ],
    fixedExpenses: [
        { id: 1, name: 'Arriendo', amount: 500 },
        { id: 2, name: 'Internet', amount: 30 }
    ]
};

// DOM Elements
const dashboard = document.getElementById('dashboard');
const analysisView = document.getElementById('analysis');
const quickAdd = document.getElementById('quick-add');
const addTrigger = document.getElementById('add-trigger');
const closeAdd = document.getElementById('close-add');
const saveBtn = document.getElementById('save-transaction');
const inputAmount = document.getElementById('input-amount');
const typeBtns = document.querySelectorAll('.type-btn');
const transactionsList = document.getElementById('transactions-list');
const remainingDisplay = document.getElementById('remaining-amount');
const totalIncomeDisplay = document.getElementById('total-income');
const totalSpentDisplay = document.getElementById('total-spent');
const estimateTag = document.getElementById('estimate-tag');
const userNameDisplay = document.getElementById('user-name-display');

// Settings Elements
const settingsView = document.getElementById('settings-view');
const settingsTrigger = document.getElementById('settings-trigger');
const closeSettings = document.getElementById('close-settings');
const clearDataBtn = document.getElementById('clear-data');
const exportDataBtn = document.getElementById('export-data');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const userNameInput = document.getElementById('user-name-input');
const fixedExpensesList = document.getElementById('fixed-expenses-list');
const pendingSabuesosList = document.getElementById('pending-sabuesos-list');
const newFixedName = document.getElementById('new-fixed-name');
const newFixedAmount = document.getElementById('new-fixed-amount');
const addFixedBtn = document.getElementById('add-fixed-btn');

// Nav Elements
const navHome = document.getElementById('nav-home');
const navAnalysis = document.getElementById('nav-analysis');

// Initialize
function init() {
    loadFromStorage();
    renderDashboard();
    renderAnalysis();
    renderFixedExpensesSettings();
    setupEventListeners();
}

function loadFromStorage() {
    const saved = localStorage.getItem('calma_data');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.transactions = parsed.transactions || [];
        state.userName = parsed.userName || 'Amigo';
        state.darkMode = parsed.darkMode || false;
        state.fixedExpenses = parsed.fixedExpenses || [];
        recalculateTotals();
        applyDarkMode();
    } else {
        // First time? Use default data
        state.transactions = [...defaultData.transactions];
        state.userName = defaultData.userName;
        state.darkMode = defaultData.darkMode;
        state.fixedExpenses = [...defaultData.fixedExpenses];
        recalculateTotals();
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem('calma_data', JSON.stringify({
        transactions: state.transactions,
        userName: state.userName,
        darkMode: state.darkMode,
        fixedExpenses: state.fixedExpenses
    }));
}

function applyDarkMode() {
    document.body.classList.toggle('dark-mode', state.darkMode);
    if (darkModeToggle) darkModeToggle.checked = state.darkMode;
}

function recalculateTotals() {
    state.totalIncome = 0;
    state.totalSpent = 0;
    state.transactions.forEach(t => {
        if (t.type === 'income') state.totalIncome += t.amount;
        else state.totalSpent += t.amount;
    });
}

function renderDashboard() {
    if (!remainingDisplay) return;

    // Calculate pending sabuesos
    const currentMonth = new Date().getMonth();
    const pendingSabuesos = state.fixedExpenses.filter(fe => {
        // Check if there's a transaction this month with the same name
        return !state.transactions.some(t => t.name === fe.name && t.type === 'expense');
    });

    const totalPendingSabuesos = pendingSabuesos.reduce((sum, fe) => sum + fe.amount, 0);
    const remaining = state.totalIncome - state.totalSpent - totalPendingSabuesos;

    remainingDisplay.textContent = formatCurrency(remaining);
    totalIncomeDisplay.textContent = formatCurrency(state.totalIncome);
    totalSpentDisplay.textContent = formatCurrency(state.totalSpent);

    if (userNameDisplay) userNameDisplay.textContent = `Hola, ${state.userName}`;
    if (userNameInput) userNameInput.value = state.userName;

    renderPendingSabuesos(pendingSabuesos);

    // Smart Estimation Check
    if (state.transactions.length < 5) {
        estimateTag.style.display = 'inline-block';
        estimateTag.textContent = 'Basado en tu promedio 💡';
    } else {
        estimateTag.textContent = 'Datos reales al día ✨';
    }

    transactionsList.innerHTML = '';
    state.transactions.forEach(t => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.innerHTML = `
            <div class="item-info">
                <h4>${t.name}</h4>
                <p>${t.date}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="item-amount" style="color: ${t.type === 'income' ? 'var(--income-text)' : 'var(--spent-text)'}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                </div>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--text-muted)" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        transactionsList.appendChild(item);
    });
}

function renderPendingSabuesos(pending) {
    if (!pendingSabuesosList) return;
    pendingSabuesosList.innerHTML = '';

    if (pending.length === 0) {
        pendingSabuesosList.innerHTML = '<p class="action-desc">¡Todos los sabuesos están alimentados! 🦴</p>';
        return;
    }

    pending.forEach(fe => {
        const item = document.createElement('div');
        item.className = 'sabueso-item';
        item.onclick = () => paySabueso(fe);
        item.innerHTML = `
            <div class="sabueso-info">
                <h4>${fe.name}</h4>
                <p>Pendiente este mes</p>
            </div>
            <div class="sabueso-amount">${formatCurrency(fe.amount)}</div>
        `;
        pendingSabuesosList.appendChild(item);
    });
}

function renderFixedExpensesSettings() {
    if (!fixedExpensesList) return;
    fixedExpensesList.innerHTML = '';

    state.fixedExpenses.forEach(fe => {
        const row = document.createElement('div');
        row.className = 'fixed-row';
        row.innerHTML = `
            <span>${fe.name} (${formatCurrency(fe.amount)})</span>
            <button class="delete-btn" onclick="deleteFixedExpense(${fe.id})">&times;</button>
        `;
        fixedExpensesList.appendChild(row);
    });
}

function addFixedExpense() {
    const name = newFixedName.value.trim();
    const amount = parseFloat(newFixedAmount.value);

    if (!name || isNaN(amount)) return;

    state.fixedExpenses.push({
        id: Date.now(),
        name,
        amount
    });

    newFixedName.value = '';
    newFixedAmount.value = '';

    saveToStorage();
    renderFixedExpensesSettings();
    renderDashboard();
    showToast('Sabueso guardado. 🐕');
}

function deleteFixedExpense(id) {
    state.fixedExpenses = state.fixedExpenses.filter(fe => fe.id !== id);
    saveToStorage();
    renderFixedExpensesSettings();
    renderDashboard();
    showToast('Sabueso eliminado.');
}

function paySabueso(fe) {
    state.currentType = 'expense';
    addTransaction(fe.amount, fe.name);
}

function renderAnalysis() {
    const categories = {};
    let totalExpenses = 0;

    state.transactions.filter(t => t.type === 'expense').forEach(t => {
        categories[t.name] = (categories[t.name] || 0) + t.amount;
        totalExpenses += t.amount;
    });

    // Sort categories by amount
    const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);

    // Update Chart Total
    document.getElementById('chart-total').textContent = formatCurrency(totalExpenses);

    // Update Chart Visual (Conic Gradient)
    const chart = document.getElementById('category-chart');
    let currentPercentage = 0;
    const colors = ['#5DB7B7', '#F4A261', '#E76F51', '#264653', '#2A9D8F'];

    const gradientParts = sortedCats.map((cat, i) => {
        const percentage = (cat[1] / totalExpenses) * 100;
        const color = colors[i % colors.length];
        const res = `${color} ${currentPercentage}% ${currentPercentage + percentage}%`;
        currentPercentage += percentage;
        return res;
    });

    if (totalExpenses > 0) {
        chart.style.background = `conic-gradient(${gradientParts.join(', ')})`;
    } else {
        chart.style.background = '#e2e8f0';
    }

    // Render category list
    const catList = document.getElementById('analysis-categories');
    catList.innerHTML = '';
    sortedCats.forEach((cat, i) => {
        const item = document.createElement('div');
        item.className = 'cat-item';
        item.innerHTML = `
            <div class="cat-info">
                <div class="cat-dot" style="background: ${colors[i % colors.length]}"></div>
                <span class="cat-name">${cat[0]}</span>
            </div>
            <span class="cat-value">${formatCurrency(cat[1])}</span>
        `;
        catList.appendChild(item);
    });
}

function setupEventListeners() {
    // Navigation
    if (navHome) {
        navHome.addEventListener('click', () => {
            switchView('dashboard');
            navHome.classList.add('active');
            if (navAnalysis) navAnalysis.classList.remove('active');
            if (settingsView) settingsView.classList.remove('active');
        });
    }

    if (navAnalysis) {
        navAnalysis.addEventListener('click', () => {
            switchView('analysis');
            navAnalysis.classList.add('active');
            if (navHome) navHome.classList.remove('active');
            if (settingsView) settingsView.classList.remove('active');
            renderAnalysis();
        });
    }

    // Settings
    if (settingsTrigger) {
        settingsTrigger.addEventListener('click', () => {
            if (settingsView) settingsView.classList.add('active');
        });
    }

    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            if (settingsView) settingsView.classList.remove('active');
        });
    }

    if (userNameInput) {
        userNameInput.addEventListener('input', (e) => {
            state.userName = e.target.value || 'Amigo';
            if (userNameDisplay) userNameDisplay.textContent = `Hola, ${state.userName}`;
            saveToStorage();
        });
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            state.darkMode = e.target.checked;
            applyDarkMode();
            saveToStorage();
        });
    }

    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            exportToCSV();
        });
    }

    if (addFixedBtn) {
        addFixedBtn.addEventListener('click', () => {
            addFixedExpense();
        });
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres borrar TODOS los datos? Esta acción no se puede deshacer.')) {
                state.transactions = [];
                recalculateTotals();
                saveToStorage();
                renderDashboard();
                renderAnalysis();
                if (settingsView) settingsView.classList.remove('active');
                showToast('Todos los datos han sido borrados.');
            }
        });
    }

    // Quick Add
    if (addTrigger) {
        addTrigger.addEventListener('click', () => {
            if (quickAdd) {
                quickAdd.classList.add('active');
                if (inputAmount) inputAmount.focus();
            }
        });
    }

    if (closeAdd) {
        closeAdd.addEventListener('click', () => {
            if (quickAdd) quickAdd.classList.remove('active');
            if (inputAmount) inputAmount.value = '';
        });
    }

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentType = btn.dataset.type;
        });
    });

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const amount = parseFloat(inputAmount.value);
            if (!amount || isNaN(amount)) return;
            addTransaction(amount);
            if (quickAdd) quickAdd.classList.remove('active');
            if (inputAmount) inputAmount.value = '';
        });
    }

    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const amount = parseFloat(inputAmount.value);
            if (!amount) return;
            addTransaction(amount, tag.textContent);
            if (quickAdd) quickAdd.classList.remove('active');
            if (inputAmount) inputAmount.value = '';
        });
    });
}

function switchView(viewId) {
    dashboard.style.display = viewId === 'dashboard' ? 'block' : 'none';
    analysisView.style.display = viewId === 'analysis' ? 'block' : 'none';
}

function addTransaction(amount, name = null) {
    const newTx = {
        id: Date.now(),
        type: state.currentType,
        name: name || (state.currentType === 'income' ? 'Ingreso extra' : 'Gasto variado'),
        amount: amount,
        date: 'Recién'
    };

    state.transactions.unshift(newTx);
    recalculateTotals();
    saveToStorage();
    renderDashboard();
    renderAnalysis();

    showToast(`${state.currentType === 'income' ? '¡Genial! Ingreso guardado.' : 'Gasto anotado. No pasa nada.'}`);
}

function deleteTransaction(id) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    recalculateTotals();
    saveToStorage();
    renderDashboard();
    renderAnalysis();
    showToast('Transacción eliminada.');
}

function exportToCSV() {
    if (state.transactions.length === 0) {
        showToast('No hay datos para exportar.');
        return;
    }

    const headers = ['Fecha', 'Tipo', 'Nombre', 'Monto'];
    const rows = state.transactions.map(t => [
        t.date,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.name,
        t.amount
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `calma_datos_${state.userName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Archivo listo. ✨');
}

function formatCurrency(val) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(val).replace('CLP', '$');
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.position = 'absolute';
    toast.style.bottom = '100px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#334155';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '30px';
    toast.style.fontSize = '14px';
    toast.style.zIndex = '1000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';

    toast.textContent = message;
    document.getElementById('app-container').appendChild(toast);

    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Start the app
init();
