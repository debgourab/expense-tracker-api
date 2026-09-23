const authPanel = document.querySelector('#authPanel');
const appPanel = document.querySelector('#appPanel');
const signupForm = document.querySelector('#signupForm');
const loginForm = document.querySelector('#loginForm');
const expenseForm = document.querySelector('#expenseForm');
const expenseList = document.querySelector('#expenseList');
const dashboardList = document.querySelector('#dashboardList');
const message = document.querySelector('#message');
const logoutButton = document.querySelector('#logoutButton');
const refreshButton = document.querySelector('#refreshButton');
const cancelEditButton = document.querySelector('#cancelEditButton');
const formTitle = document.querySelector('#formTitle');
const saveExpenseButton = document.querySelector('#saveExpenseButton');

let token = localStorage.getItem('expenseTrackerToken');
let expenses = [];

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? '#c2410c' : '#667085';
}

function setAuthenticatedView(isAuthenticated) {
  authPanel.classList.toggle('hidden', isAuthenticated);
  appPanel.classList.toggle('hidden', !isAuthenticated);
  logoutButton.classList.toggle('hidden', !isAuthenticated);
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function formatAmount(amount) {
  return Number(amount).toFixed(2);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resetExpenseForm() {
  expenseForm.reset();
  document.querySelector('#expenseId').value = '';
  formTitle.textContent = 'Add expense';
  saveExpenseButton.textContent = 'Save expense';
  cancelEditButton.classList.add('hidden');
}

function renderExpenses() {
  if (expenses.length === 0) {
    expenseList.innerHTML = '<p class="expense-meta">No expenses added yet.</p>';
    return;
  }

  expenseList.innerHTML = expenses
    .map(
      (expense) => `
        <article class="expense-item">
          <div class="expense-main">
            <div>
              <h3>${escapeHtml(expense.title)}</h3>
              <p class="expense-meta">${escapeHtml(expense.category)} · ${formatDate(expense.date)}</p>
            </div>
            <p class="amount">${formatAmount(expense.amount)}</p>
          </div>
          <div class="expense-actions">
            <button class="secondary" type="button" data-action="edit" data-id="${expense._id}">Edit</button>
            <button class="danger" type="button" data-action="delete" data-id="${expense._id}">Delete</button>
          </div>
        </article>
      `
    )
    .join('');
}

function renderDashboard(totals) {
  if (totals.length === 0) {
    dashboardList.innerHTML = '<p class="expense-meta">Category totals will appear here.</p>';
    return;
  }

  dashboardList.innerHTML = totals
    .map(
      (item) => `
        <div class="dashboard-item">
          <div>
            <strong>${escapeHtml(item.category)}</strong>
            <p class="expense-meta">${item.count} transaction${item.count === 1 ? '' : 's'}</p>
          </div>
          <span class="amount">${formatAmount(item.totalAmount)}</span>
        </div>
      `
    )
    .join('');
}

async function loadExpenses() {
  expenses = await apiFetch('/expenses');
  renderExpenses();
}

async function loadDashboard() {
  const totals = await apiFetch('/expenses/dashboard/category-totals');
  renderDashboard(totals);
}

async function loadAppData() {
  if (!token) {
    setAuthenticatedView(false);
    return;
  }

  setAuthenticatedView(true);

  try {
    await Promise.all([loadExpenses(), loadDashboard()]);
    showMessage('Ready');
  } catch (error) {
    showMessage(error.message, true);
  }
}

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body: {
        name: document.querySelector('#signupName').value,
        email: document.querySelector('#signupEmail').value,
        password: document.querySelector('#signupPassword').value,
      },
    });

    token = data.token;
    localStorage.setItem('expenseTrackerToken', token);
    signupForm.reset();
    await loadAppData();
    showMessage('Account created successfully');
  } catch (error) {
    showMessage(error.message, true);
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: {
        email: document.querySelector('#loginEmail').value,
        password: document.querySelector('#loginPassword').value,
      },
    });

    token = data.token;
    localStorage.setItem('expenseTrackerToken', token);
    loginForm.reset();
    await loadAppData();
    showMessage('Logged in successfully');
  } catch (error) {
    showMessage(error.message, true);
  }
});

expenseForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const expenseId = document.querySelector('#expenseId').value;
  const payload = {
    title: document.querySelector('#expenseTitle').value,
    amount: document.querySelector('#expenseAmount').value,
    category: document.querySelector('#expenseCategory').value,
    date: document.querySelector('#expenseDate').value,
  };

  try {
    if (expenseId) {
      await apiFetch(`/expenses/${expenseId}`, { method: 'PUT', body: payload });
      showMessage('Expense updated');
    } else {
      await apiFetch('/expenses', { method: 'POST', body: payload });
      showMessage('Expense added');
    }

    resetExpenseForm();
    await Promise.all([loadExpenses(), loadDashboard()]);
  } catch (error) {
    showMessage(error.message, true);
  }
});

expenseList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');

  if (!button) {
    return;
  }

  const expense = expenses.find((item) => item._id === button.dataset.id);

  if (!expense) {
    return;
  }

  if (button.dataset.action === 'edit') {
    document.querySelector('#expenseId').value = expense._id;
    document.querySelector('#expenseTitle').value = expense.title;
    document.querySelector('#expenseAmount').value = expense.amount;
    document.querySelector('#expenseCategory').value = expense.category;
    document.querySelector('#expenseDate').value = expense.date.slice(0, 10);
    formTitle.textContent = 'Edit expense';
    saveExpenseButton.textContent = 'Update expense';
    cancelEditButton.classList.remove('hidden');
  }

  if (button.dataset.action === 'delete') {
    try {
      await apiFetch(`/expenses/${expense._id}`, { method: 'DELETE' });
      await Promise.all([loadExpenses(), loadDashboard()]);
      showMessage('Expense deleted');
    } catch (error) {
      showMessage(error.message, true);
    }
  }
});

refreshButton.addEventListener('click', async () => {
  try {
    await Promise.all([loadExpenses(), loadDashboard()]);
    showMessage('Data refreshed');
  } catch (error) {
    showMessage(error.message, true);
  }
});

cancelEditButton.addEventListener('click', resetExpenseForm);

logoutButton.addEventListener('click', () => {
  token = null;
  expenses = [];
  localStorage.removeItem('expenseTrackerToken');
  setAuthenticatedView(false);
  resetExpenseForm();
  showMessage('Logged out');
});

loadAppData();
