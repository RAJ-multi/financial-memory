import { store } from './store.js';
import { FIXED_CATEGORIES } from './config.js';
import {
  getTodayDateString,
  getRemainingDailyBudget,
  formatCurrency,
  round2
} from './calculations.js';
import {
  renderDashboard,
  renderMonthlyHistory,
  renderSavings,
  renderSettings,
  escapeHtml
} from './ui.js';
import { answerFinancialQuery, SUPPORTED_QUESTIONS } from './query-engine.js';

let currentView = 'dashboard';
let editingExpenseId = null;
let editingSavingId = null;
let confirmCallback = null;

// Initialize App
export function initApp() {
  applyAppearance(store.getSettings());
  setupNavigation();
  setupModals();
  setupAskFinancialMemory();
  setupFirstVisitPrompt();

  // Reactive subscription
  store.subscribe(data => {
    applyAppearance(data.settings);
    renderCurrentView();
  });

  renderCurrentView();
}

function applyAppearance(settings) {
  const root = document.documentElement;
  root.setAttribute('data-theme', settings.theme || 'system');
  root.setAttribute('data-preset', settings.backgroundPreset || 'default');
}

function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-button');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-view');
      navigateTo(target);
      sidebar.classList.remove('mobile-open');
    });
  });

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }
}

export function navigateTo(viewName) {
  currentView = viewName;
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });
  renderCurrentView();
  window.scrollTo(0, 0);
}

function renderCurrentView() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const data = store.getData();

  switch (currentView) {
    case 'dashboard':
      container.innerHTML = renderDashboard(data, navigateTo);
      bindDashboardEvents();
      break;
    case 'monthly-history':
      container.innerHTML = renderMonthlyHistory(data);
      bindMonthlyHistoryEvents();
      break;
    case 'savings':
      container.innerHTML = renderSavings(data);
      bindSavingsEvents();
      break;
    case 'settings':
      container.innerHTML = renderSettings(data);
      bindSettingsEvents();
      break;
    default:
      container.innerHTML = renderDashboard(data, navigateTo);
      bindDashboardEvents();
  }
}

function bindDashboardEvents() {
  const btnAdd = document.getElementById('btn-open-add-expense');
  if (btnAdd) btnAdd.addEventListener('click', () => openExpenseModal());

  const btnHistory = document.getElementById('btn-view-month-history');
  if (btnHistory) btnHistory.addEventListener('click', () => navigateTo('monthly-history'));

  const btnQuickBudget = document.getElementById('btn-quick-set-budget');
  if (btnQuickBudget) btnQuickBudget.addEventListener('click', () => navigateTo('settings'));
}

function bindMonthlyHistoryEvents() {
  const btnAdd = document.getElementById('btn-open-add-expense');
  if (btnAdd) btnAdd.addEventListener('click', () => openExpenseModal());

  const btnFirst = document.getElementById('btn-add-first-expense');
  if (btnFirst) btnFirst.addEventListener('click', () => openExpenseModal());

  document.querySelectorAll('.btn-edit-exp').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const exp = store.getExpenses().find(e => e.id === id);
      if (exp) openExpenseModal(exp);
    });
  });

  document.querySelectorAll('.btn-del-exp').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const exp = store.getExpenses().find(e => e.id === id);
      if (exp) {
        showConfirmation(
          'Delete Expense',
          `Are you sure you want to delete this $${exp.amount.toFixed(2)} (${exp.category}) expense?`,
          () => {
            store.deleteExpense(id);
            showToast('Expense deleted and totals recalculated.');
          }
        );
      }
    });
  });
}

function bindSavingsEvents() {
  const btnAdd = document.getElementById('btn-open-add-saving');
  if (btnAdd) btnAdd.addEventListener('click', () => openSavingModal());

  const btnFirst = document.getElementById('btn-add-first-saving');
  if (btnFirst) btnFirst.addEventListener('click', () => openSavingModal());

  document.querySelectorAll('.btn-edit-sav').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const sav = store.getSavings().find(s => s.id === id);
      if (sav) openSavingModal(sav);
    });
  });

  document.querySelectorAll('.btn-del-sav').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const sav = store.getSavings().find(s => s.id === id);
      if (sav) {
        showConfirmation(
          'Delete Saving Contribution',
          `Are you sure you want to delete this $${sav.amount.toFixed(2)} saving contribution?`,
          () => {
            store.deleteSaving(id);
            showToast('Saving contribution deleted and all-time total recalculated.');
          }
        );
      }
    });
  });
}

function bindSettingsEvents() {
  const budgetForm = document.getElementById('form-settings-budget');
  const budgetInput = document.getElementById('settings-budget-input');
  const budgetError = document.getElementById('settings-budget-error');
  const btnRemove = document.getElementById('btn-remove-budget');

  if (budgetForm) {
    budgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = parseFloat(budgetInput.value);
      if (isNaN(val) || val <= 0) {
        budgetError.style.display = 'block';
        return;
      }
      budgetError.style.display = 'none';
      store.setDailyBudget(val);
      showToast(`Daily budget set to ${formatCurrency(val)}`);
    });
  }

  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      store.setDailyBudget(null);
      showToast('Daily budget target removed.');
    });
  }

  const themeSelect = document.getElementById('settings-theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      store.setTheme(themeSelect.value);
      showToast(`Theme updated to ${themeSelect.value}`);
    });
  }

  const presetSelect = document.getElementById('settings-preset-select');
  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      store.setBackgroundPreset(presetSelect.value);
      showToast(`Background preset updated to ${presetSelect.value}`);
    });
  }

  const btnDeleteAll = document.getElementById('btn-trigger-delete-all');
  if (btnDeleteAll) {
    btnDeleteAll.addEventListener('click', () => {
      showConfirmation(
        'Delete All Local Data',
        'Permanently delete all locally stored expenses, saving contributions, and daily budget targets? This cannot be undone.',
        () => {
          store.deleteAllLocalData();
          showToast('All local data cleared. Preferences preserved.');
          navigateTo('dashboard');
        }
      );
    });
  }
}

// Modal Handlers
function setupModals() {
  // Populate category options in expense modal
  const catSelect = document.getElementById('expense-category');
  if (catSelect) {
    catSelect.innerHTML = FIXED_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // Expense Form Submit
  const expenseForm = document.getElementById('form-expense');
  if (expenseForm) {
    expenseForm.addEventListener('submit', handleExpenseSubmit);
  }

  // Saving Form Submit
  const savingForm = document.getElementById('form-saving');
  if (savingForm) {
    savingForm.addEventListener('submit', handleSavingSubmit);
  }

  // Close buttons
  document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // Confirmation Modal
  const confirmOk = document.getElementById('btn-confirm-ok');
  if (confirmOk) {
    confirmOk.addEventListener('click', () => {
      if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
      }
      closeAllModals();
    });
  }
}

function openExpenseModal(existing = null) {
  editingExpenseId = existing ? existing.id : null;
  const title = document.getElementById('modal-expense-title');
  const amountInput = document.getElementById('expense-amount');
  const catSelect = document.getElementById('expense-category');
  const dateInput = document.getElementById('expense-date');
  const descInput = document.getElementById('expense-desc');
  const errDiv = document.getElementById('expense-form-error');

  errDiv.style.display = 'none';

  if (existing) {
    title.textContent = 'Edit Expense';
    amountInput.value = existing.amount;
    catSelect.value = existing.category;
    dateInput.value = existing.date;
    descInput.value = existing.description || '';
  } else {
    title.textContent = 'Add Expense';
    amountInput.value = '';
    catSelect.value = FIXED_CATEGORIES[0];
    dateInput.value = getTodayDateString();
    descInput.value = '';
  }

  document.getElementById('modal-expense').classList.add('active');
  amountInput.focus();
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value;
  const description = document.getElementById('expense-desc').value;
  const errDiv = document.getElementById('expense-form-error');

  if (isNaN(amount) || amount <= 0 || !category || !date) {
    errDiv.textContent = 'Please enter a valid positive amount, category, and date.';
    errDiv.style.display = 'block';
    return;
  }

  try {
    if (editingExpenseId) {
      store.updateExpense(editingExpenseId, { amount, category, date, description });
      showToast('Expense updated successfully.');
    } else {
      store.addExpense({ amount, category, date, description });
      
      // Daily Budget Impact Reminder Toast
      const budgetStatus = getRemainingDailyBudget(store.getExpenses(), store.getSettings().dailyBudget);
      let budgetMsg = '';
      if (budgetStatus.configured) {
        if (budgetStatus.status === 'under') {
          budgetMsg = ` — Remaining daily budget: ${formatCurrency(budgetStatus.remaining)}`;
        } else {
          budgetMsg = ` — Over daily budget by ${formatCurrency(budgetStatus.over)}`;
        }
      }
      showToast(`Expense of ${formatCurrency(amount)} saved${budgetMsg}`);
    }
    closeAllModals();
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.style.display = 'block';
  }
}

function openSavingModal(existing = null) {
  editingSavingId = existing ? existing.id : null;
  const title = document.getElementById('modal-saving-title');
  const amountInput = document.getElementById('saving-amount');
  const dateInput = document.getElementById('saving-date');
  const descInput = document.getElementById('saving-desc');
  const errDiv = document.getElementById('saving-form-error');

  errDiv.style.display = 'none';

  if (existing) {
    title.textContent = 'Edit Saving Contribution';
    amountInput.value = existing.amount;
    dateInput.value = existing.date;
    descInput.value = existing.description || '';
  } else {
    title.textContent = 'Add Saving Contribution';
    amountInput.value = '';
    dateInput.value = getTodayDateString();
    descInput.value = '';
  }

  document.getElementById('modal-saving').classList.add('active');
  amountInput.focus();
}

function handleSavingSubmit(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('saving-amount').value);
  const date = document.getElementById('saving-date').value;
  const description = document.getElementById('saving-desc').value;
  const errDiv = document.getElementById('saving-form-error');

  if (isNaN(amount) || amount <= 0 || !date) {
    errDiv.textContent = 'Please enter a valid positive amount and date.';
    errDiv.style.display = 'block';
    return;
  }

  try {
    if (editingSavingId) {
      store.updateSaving(editingSavingId, { amount, date, description });
      showToast('Saving contribution updated.');
    } else {
      store.addSaving({ amount, date, description });
      showToast(`Saving contribution of ${formatCurrency(amount)} recorded.`);
    }
    closeAllModals();
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.style.display = 'block';
  }
}

function showConfirmation(title, message, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  confirmCallback = callback;
  document.getElementById('modal-confirm').classList.add('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  editingExpenseId = null;
  editingSavingId = null;
  confirmCallback = null;
}

// Ask Financial Memory Query Surface
function setupAskFinancialMemory() {
  const fab = document.getElementById('fab-ask');
  const modal = document.getElementById('modal-ask');
  const input = document.getElementById('ask-input');
  const btnSubmit = document.getElementById('btn-ask-submit');
  const resultDiv = document.getElementById('ask-result-container');
  const suggestionsDiv = document.getElementById('ask-suggestions');

  if (!fab || !modal) return;

  fab.addEventListener('click', () => {
    modal.classList.add('active');
    input.value = '';
    resultDiv.innerHTML = '';
    input.focus();
  });

  // Render clickable suggested questions
  if (suggestionsDiv) {
    suggestionsDiv.innerHTML = SUPPORTED_QUESTIONS.map(q => `
      <button type="button" class="btn btn-secondary btn-sm btn-chip" style="font-size: 0.8rem; text-align: left; margin: 0.2rem;">
        ${escapeHtml(q)}
      </button>
    `).join('');

    suggestionsDiv.querySelectorAll('.btn-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.textContent.trim();
        executeAskQuery();
      });
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', executeAskQuery);
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeAskQuery();
      }
    });
  }

  function executeAskQuery() {
    const q = input.value.trim();
    if (!q) return;

    const answer = answerFinancialQuery(q, store.getExpenses());
    renderAskResult(answer);
  }

  function renderAskResult(ans) {
    let verifyBtnHtml = '';
    if (ans.canVerify) {
      verifyBtnHtml = `
        <div style="margin-top: 1rem;">
          <button class="btn btn-primary btn-sm" id="btn-verify-answer">
            View Monthly History to Verify
          </button>
        </div>
      `;
    }

    resultDiv.innerHTML = `
      <div style="background-color: var(--bg-surface-hover); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-top: 1rem;">
        <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.5rem; color: var(--text-primary);">
          ${escapeHtml(ans.directAnswer)}
        </div>
        ${ans.evidence ? `<div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${escapeHtml(ans.evidence)}</div>` : ''}
        ${ans.explanation ? `<div style="font-size: 0.9rem; color: var(--text-muted);">${escapeHtml(ans.explanation)}</div>` : ''}
        ${verifyBtnHtml}
      </div>
    `;

    const verifyBtn = document.getElementById('btn-verify-answer');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', () => {
        closeAllModals();
        navigateTo('monthly-history');
      });
    }
  }
}

// Optional First Visit Prompt
function setupFirstVisitPrompt() {
  const hasPrompted = localStorage.getItem('financial_memory_prompted_first_run');
  if (hasPrompted) return;

  const currentBudget = store.getSettings().dailyBudget;
  if (currentBudget === null) {
    localStorage.setItem('financial_memory_prompted_first_run', 'true');
    const modal = document.getElementById('modal-first-run');
    if (modal) {
      modal.classList.add('active');

      const form = document.getElementById('form-first-run');
      const skipBtn = document.getElementById('btn-first-run-skip');

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const val = parseFloat(document.getElementById('first-run-budget-input').value);
          if (!isNaN(val) && val > 0) {
            store.setDailyBudget(val);
            showToast(`Daily budget target set to ${formatCurrency(val)}`);
          }
          modal.classList.remove('active');
        });
      }

      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          modal.classList.remove('active');
        });
      }
    }
  }
}

// Toast Notifications
export function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}
