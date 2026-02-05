const state = {
    version: '3.0.0', // Updated for major refactor
    userName: 'Juan',
    darkMode: false,
    incognitoMode: false,
    totalIncome: 0,
    totalSpent: 0,
    transactions: [],
    fixedExpenses: [],
    colchon: { goal: 1000, current: 0 },
    currentType: 'expense'
};

/**
 * State Management & Dispatcher
 */
function dispatch(action, payload) {
    console.log(`[Dispatch] ${action}`, payload);

    switch (action) {
        case 'SET_USER_NAME':
            state.userName = payload || 'Amigo';
            break;
        case 'TOGGLE_DARK_MODE':
            state.darkMode = payload;
            applyDarkMode();
            break;
        case 'TOGGLE_INCOGNITO':
            state.incognitoMode = !state.incognitoMode;
            document.body.classList.toggle('incognito-active', state.incognitoMode);
            updateIncognitoUI();
            break;
        case 'ADD_TRANSACTION':
            if (payload.amount <= 0 || isNaN(payload.amount)) {
                showToast('Monto inválido ⚠️');
                return;
            }
            state.transactions.unshift({
                id: Date.now(),
                ...payload,
                date: new Date().toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            });
            recalculateTotals();
            break;
        case 'DELETE_TRANSACTION':
            state.transactions = state.transactions.filter(t => t.id !== payload);
            recalculateTotals();
            break;
        case 'UPDATE_COLCHON':
            state.colchon = { ...state.colchon, ...payload };
            break;
        case 'ADD_FIXED':
            state.fixedExpenses.push({ id: Date.now(), ...payload });
            break;
        case 'DELETE_FIXED':
            state.fixedExpenses = state.fixedExpenses.filter(fe => fe.id !== payload);
            break;
        case 'CLEAR_DATA':
            state.transactions = [];
            recalculateTotals();
            break;
        default:
            console.warn(`Acción desconocida: ${action}`);
    }

    saveToStorage();
    renderAll();
}

/**
 * Core Logic
 */
function recalculateTotals() {
    state.totalIncome = 0;
    state.totalSpent = 0;
    state.transactions.forEach(t => {
        if (t.type === 'income') state.totalIncome += t.amount;
        else state.totalSpent += t.amount;
    });
}

const phrases = [
    "No estás gastando más, solo estás siendo más consciente. ✨",
    "Cada peso que anotas es un paso hacia tu tranquilidad. 🌊",
    "Hoy es un buen día para cuidar tu futuro. 🏹",
    "Tu 'yo' del próximo mes te dará las gracias. 🤝",
    "La calma no es no tener gastos, es saber dónde están. 🧘‍♂️",
    "Un presupuesto no es una jaula, es un mapa hacia tu libertad. 🗺️",
    "Respira. Todo tiene solución si lo tienes anotado. 💎",
    "Pequeños ahorros hoy, grandes sueños mañana. ☁️",
    "Tú controlas el dinero, no al revés. 👑",
    "Incluso los días difíciles son mejores con orden. 🌈"
];

const defaultData = {
    userName: 'Amigo',
    darkMode: false,
    transactions: [
        { id: 1, type: 'expense', name: 'Supermercado', amount: 85000, date: 'Hoy, 14:20' },
        { id: 2, type: 'income', name: 'Venta Diseño', amount: 450000, date: 'Ayer, 18:00' }
    ],
    fixedExpenses: [
        { id: 1, name: 'Arriendo', amount: 500000 },
        { id: 2, name: 'Internet', amount: 30000 }
    ],
    colchon: { goal: 1500000, current: 450000 }
};

// DOM Elements
const elements = {
    dashboard: document.getElementById('dashboard'),
    analysisView: document.getElementById('analysis'),
    settingsView: document.getElementById('settings-view'),
    inputAmount: document.getElementById('input-amount'),
    transactionsList: document.getElementById('transactions-list'),
    remainingDisplay: document.getElementById('remaining-amount'),
    totalIncomeDisplay: document.getElementById('total-income'),
    totalSpentDisplay: document.getElementById('total-spent'),
    userNameDisplay: document.getElementById('user-name-display'),
    userNameInput: document.getElementById('user-name-input'),
    fixedExpensesList: document.getElementById('fixed-expenses-list'),
    pendingSabuesosList: document.getElementById('pending-sabuesos-list'),
    colchonProgress: document.getElementById('colchon-progress'),
    colchonPercent: document.getElementById('colchon-percent'),
    colchonText: document.getElementById('colchon-text'),
    motivationalDisplay: document.getElementById('motivational-message'),
    navHome: document.getElementById('nav-home'),
    navAnalysis: document.getElementById('nav-analysis')
};

/**
 * Rendering
 */
function renderAll() {
    renderDashboard();
    renderAnalysis();
    renderFixedExpensesSettings();
    renderColchon();
    updateMotivationalMessage();
}

function renderDashboard() {
    if (!elements.remainingDisplay) return;

    const pendingSabuesos = state.fixedExpenses.filter(fe => {
        return !state.transactions.some(t => t.name === fe.name && t.type === 'expense');
    });

    const totalPendingSabuesos = pendingSabuesos.reduce((sum, fe) => sum + fe.amount, 0);
    const remaining = state.totalIncome - state.totalSpent - totalPendingSabuesos;

    elements.remainingDisplay.textContent = formatCurrency(remaining);
    if (elements.totalIncomeDisplay) elements.totalIncomeDisplay.textContent = formatCurrency(state.totalIncome);
    if (elements.totalSpentDisplay) elements.totalSpentDisplay.textContent = formatCurrency(state.totalSpent);

    if (elements.userNameDisplay) elements.userNameDisplay.textContent = `Hola, ${state.userName}`;

    renderPendingSabuesos(pendingSabuesos);
    renderTransactions();
}

function renderTransactions() {
    if (!elements.transactionsList) return;
    elements.transactionsList.innerHTML = '';
    state.transactions.forEach(t => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.innerHTML = `
            <div class="item-info">
                <h4>${t.name}</h4>
                <p>${t.date}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="item-amount ${t.type}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                </div>
                <button class="delete-btn" onclick="dispatch('DELETE_TRANSACTION', ${t.id})">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        elements.transactionsList.appendChild(item);
    });
}

function renderPendingSabuesos(pending) {
    if (!elements.pendingSabuesosList) return;
    elements.pendingSabuesosList.innerHTML = '';

    if (pending.length === 0) {
        elements.pendingSabuesosList.innerHTML = '<p class="action-desc">¡Todos los sabuesos están alimentados! 🦴</p>';
        return;
    }

    pending.forEach(fe => {
        const item = document.createElement('div');
        item.className = 'sabueso-item';
        item.onclick = () => dispatch('ADD_TRANSACTION', { amount: fe.amount, name: fe.name, type: 'expense' });
        item.innerHTML = `
            <div class="sabueso-info">
                <h4>${fe.name}</h4>
                <p>Pendiente este mes</p>
            </div>
            <div class="sabueso-amount">${formatCurrency(fe.amount)}</div>
        `;
        elements.pendingSabuesosList.appendChild(item);
    });
}

function renderColchon() {
    if (!elements.colchonProgress) return;
    const percent = Math.min(Math.round((state.colchon.current / state.colchon.goal) * 100), 100);
    elements.colchonProgress.style.width = `${percent}%`;
    if (elements.colchonPercent) elements.colchonPercent.textContent = `${percent}%`;

    const remainingGoal = state.colchon.goal - state.colchon.current;
    if (elements.colchonText) {
        elements.colchonText.textContent = remainingGoal <= 0
            ? "¡Meta alcanzada! Tu colchón está listo. 🎉"
            : `Te faltan ${formatCurrency(remainingGoal)} para tu meta. ¡Tú puedes!`;
    }
}

function renderFixedExpensesSettings() {
    if (!elements.fixedExpensesList) return;
    elements.fixedExpensesList.innerHTML = '';
    state.fixedExpenses.forEach(fe => {
        const row = document.createElement('div');
        row.className = 'fixed-row';
        row.innerHTML = `
            <span>${fe.name} (${formatCurrency(fe.amount)})</span>
            <button class="delete-btn" onclick="dispatch('DELETE_FIXED', ${fe.id})">&times;</button>
        `;
        elements.fixedExpensesList.appendChild(row);
    });
}

function renderAnalysis() {
    const chartTotal = document.getElementById('chart-total');
    if (!chartTotal) return;

    const expenses = state.transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    chartTotal.textContent = formatCurrency(totalExpenses);

    const categories = {};
    expenses.forEach(t => {
        categories[t.name] = (categories[t.name] || 0) + t.amount;
    });

    const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const chart = document.getElementById('category-chart');

    if (chart) {
        let currentPercentage = 0;
        const colors = ['#5DB7B7', '#F4A261', '#E76F51', '#264653', '#2A9D8F'];
        const gradientParts = sortedCats.map((cat, i) => {
            const percentage = (cat[1] / totalExpenses) * 100;
            const color = colors[i % colors.length];
            const part = `${color} ${currentPercentage}% ${currentPercentage + percentage}%`;
            currentPercentage += percentage;
            return part;
        });
        chart.style.background = totalExpenses > 0 ? `conic-gradient(${gradientParts.join(', ')})` : '#e2e8f0';
    }

    const catList = document.getElementById('analysis-categories');
    if (catList) {
        catList.innerHTML = '';
        sortedCats.forEach((cat, i) => {
            const colors = ['#5DB7B7', '#F4A261', '#E76F51', '#264653', '#2A9D8F'];
            catList.innerHTML += `
                <div class="cat-item">
                    <div class="cat-info">
                        <div class="cat-dot" style="background: ${colors[i % colors.length]}"></div>
                        <span class="cat-name">${cat[0]}</span>
                    </div>
                    <span class="cat-value">${formatCurrency(cat[1])}</span>
                </div>
            `;
        });
    }
}

/**
 * Storage & Initialization
 */
function loadFromStorage() {
    const saved = localStorage.getItem('calma_data');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state, parsed);
        recalculateTotals();
        applyDarkMode();
    } else {
        Object.assign(state, defaultData);
        recalculateTotals();
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem('calma_data', JSON.stringify({
        transactions: state.transactions,
        userName: state.userName,
        darkMode: state.darkMode,
        fixedExpenses: state.fixedExpenses,
        colchon: state.colchon,
        incognitoMode: state.incognitoMode
    }));
}

function applyDarkMode() {
    document.body.classList.toggle('dark-mode', state.darkMode);
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.checked = state.darkMode;
}

/**
 * Event Listeners
 */
function setupEventListeners() {
    // Navigation
    elements.navHome?.addEventListener('click', () => switchView('dashboard'));
    elements.navAnalysis?.addEventListener('click', () => {
        switchView('analysis');
        renderAnalysis();
    });

    // Settings
    document.getElementById('settings-trigger')?.addEventListener('click', () => elements.settingsView?.classList.add('active'));
    document.getElementById('close-settings')?.addEventListener('click', () => elements.settingsView?.classList.remove('active'));

    elements.userNameInput?.addEventListener('input', (e) => dispatch('SET_USER_NAME', e.target.value));
    document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => dispatch('TOGGLE_DARK_MODE', e.target.checked));

    const incognitoToggle = document.getElementById('incognito-toggle');
    if (incognitoToggle) {
        incognitoToggle.checked = state.incognitoMode;
        incognitoToggle.addEventListener('change', () => dispatch('TOGGLE_INCOGNITO'));
    }

    document.getElementById('incognito-trigger')?.addEventListener('click', () => dispatch('TOGGLE_INCOGNITO'));

    // Sincronizar UI inicial
    updateIncognitoUI();

    // Transactions
    document.getElementById('save-transaction')?.addEventListener('click', () => {
        const amount = parseFloat(elements.inputAmount.value);
        if (amount > 0) {
            dispatch('ADD_TRANSACTION', { amount, type: state.currentType, name: state.currentType === 'income' ? 'Ingreso extra' : 'Gasto variado' });
            elements.inputAmount.value = '';
            showToast(state.currentType === 'income' ? '¡Genial! 💸' : 'Gasto anotado. 📉');
        }
    });

    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentType = btn.dataset.type;
        });
    });

    // Colchon Goals
    document.getElementById('colchon-goal-input')?.addEventListener('input', (e) => dispatch('UPDATE_COLCHON', { goal: parseFloat(e.target.value) || 0 }));
    document.getElementById('colchon-current-input')?.addEventListener('input', (e) => dispatch('UPDATE_COLCHON', { current: parseFloat(e.target.value) || 0 }));

    // Fixed Expenses
    document.getElementById('add-fixed-btn')?.addEventListener('click', () => {
        const name = document.getElementById('new-fixed-name').value;
        const amount = parseFloat(document.getElementById('new-fixed-amount').value);
        if (name && amount > 0) {
            dispatch('ADD_FIXED', { name, amount });
            document.getElementById('new-fixed-name').value = '';
            document.getElementById('new-fixed-amount').value = '';
        }
    });

    // Data Management
    document.getElementById('export-data')?.addEventListener('click', exportToCSV);
    document.getElementById('clear-data')?.addEventListener('click', () => {
        if (confirm('¿Borrar todo? Esta acción no se puede deshacer.')) {
            dispatch('CLEAR_DATA');
            showToast('Datos borrados.');
        }
    });
}

function switchView(viewId) {
    elements.dashboard.style.display = viewId === 'dashboard' ? 'block' : 'none';
    elements.analysisView.style.display = viewId === 'analysis' ? 'block' : 'none';

    // Update nav icons
    elements.navHome.classList.toggle('active', viewId === 'dashboard');
    elements.navAnalysis.classList.toggle('active', viewId === 'analysis');
}

/**
 * Helpers
 */
function formatCurrency(val) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val).replace('CLP', '$');
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.getElementById('app-container').appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function updateMotivationalMessage() {
    if (!elements.motivationalDisplay) return;
    elements.motivationalDisplay.textContent = `"${phrases[Math.floor(Math.random() * phrases.length)]}"`;
}

function exportToCSV() {
    if (state.transactions.length === 0) return;
    const headers = ['Fecha', 'Tipo', 'Nombre', 'Monto'];
    const rows = state.transactions.map(t => [t.date, t.type, t.name, t.amount]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `calma_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Start
function updateIncognitoUI() {
    const trigger = document.getElementById('incognito-trigger');
    const toggle = document.getElementById('incognito-toggle');

    if (trigger) {
        trigger.classList.toggle('active', state.incognitoMode);
        const eyeOpen = trigger.querySelectorAll('.eye-open');
        const eyeClosed = trigger.querySelector('.eye-closed');

        if (state.incognitoMode) {
            eyeOpen.forEach(el => el.style.display = 'none');
            eyeClosed.style.display = 'block';
        } else {
            eyeOpen.forEach(el => el.style.display = 'block');
            eyeClosed.style.display = 'none';
        }
    }

    if (toggle) toggle.checked = state.incognitoMode;
    document.body.classList.toggle('incognito-active', state.incognitoMode);
}

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    setupEventListeners();
    renderAll();
    console.log("Calma v3.0.0 cargada. ✨");
});
