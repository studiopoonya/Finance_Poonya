import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Attach token from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login  = (username, password) => api.post('/auth/login',  { username, password }).then(r => r.data);
export const logout = () => api.post('/auth/logout').then(r => r.data);
export const getMe  = () => api.get('/auth/me').then(r => r.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardSummary = () => api.get('/dashboard/summary').then(r => r.data);
export const getLedgers           = () => api.get('/dashboard/ledgers').then(r => r.data);

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactions   = (params) => api.get('/transactions', { params }).then(r => r.data);
export const createTransaction = (data)   => api.post('/transactions', data).then(r => r.data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data).then(r => r.data);
export const deleteTransaction = (id)    => api.delete(`/transactions/${id}`).then(r => r.data);

// ── OCR ───────────────────────────────────────────────────────────────────────
export const scanReceipt = (formData) =>
  api.post('/ocr/scan', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

// ── Chart of Accounts ─────────────────────────────────────────────────────────
export const getChartOfAccounts    = ()            => api.get('/chart-of-accounts').then(r => r.data);
export const createChartOfAccount  = (data)        => api.post('/chart-of-accounts', data).then(r => r.data);
export const updateChartOfAccount  = (code, data)  => api.put(`/chart-of-accounts/${code}`, data).then(r => r.data);
export const deleteChartOfAccount  = (code)        => api.delete(`/chart-of-accounts/${code}`).then(r => r.data);

// ── Investors ─────────────────────────────────────────────────────────────────
export const getInvestors    = ()          => api.get('/investors').then(r => r.data);
export const createInvestor  = (data)      => api.post('/investors', data).then(r => r.data);
export const updateInvestor  = (id, data)  => api.put(`/investors/${id}`, data).then(r => r.data);
export const deleteInvestor  = (id)        => api.delete(`/investors/${id}`).then(r => r.data);

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings      = ()         => api.get('/settings').then(r => r.data);
export const updateSettings   = (settings) => api.put('/settings', { settings }).then(r => r.data);
export const testAiConnection = ()         => api.post('/settings/test-ai').then(r => r.data);

// ── Budgets ───────────────────────────────────────────────────────────────────
export const getBudgets      = (params)      => api.get('/budgets', { params }).then(r => r.data);
export const createBudget    = (data)        => api.post('/budgets', data).then(r => r.data);
export const updateBudget    = (id, data)    => api.put(`/budgets/${id}`, data).then(r => r.data);
export const deleteBudget    = (id)          => api.delete(`/budgets/${id}`).then(r => r.data);
export const getCashRunway   = ()            => api.get('/budgets/cash-runway').then(r => r.data);

// ── Invoices ──────────────────────────────────────────────────────────────────
export const getInvoices     = (params)      => api.get('/invoices', { params }).then(r => r.data);
export const createInvoice   = (data)        => api.post('/invoices', data).then(r => r.data);
export const getInvoice      = (id)          => api.get(`/invoices/${id}`).then(r => r.data);
export const updateInvoice   = (id, data)    => api.put(`/invoices/${id}`, data).then(r => r.data);
export const deleteInvoice   = (id)          => api.delete(`/invoices/${id}`).then(r => r.data);

// ── Assets ────────────────────────────────────────────────────────────────────
export const getAssets       = (params)      => api.get('/assets', { params }).then(r => r.data);
export const createAsset     = (data)        => api.post('/assets', data).then(r => r.data);
export const updateAsset     = (id, data)    => api.put(`/assets/${id}`, data).then(r => r.data);
export const deleteAsset     = (id)          => api.delete(`/assets/${id}`).then(r => r.data);

// ── Tax Records ───────────────────────────────────────────────────────────────
export const getTaxRecords   = (params)      => api.get('/tax-records', { params }).then(r => r.data);
export const createTaxRecord = (data)        => api.post('/tax-records', data).then(r => r.data);
export const updateTaxRecord = (id, data)    => api.put(`/tax-records/${id}`, data).then(r => r.data);
export const deleteTaxRecord = (id)          => api.delete(`/tax-records/${id}`).then(r => r.data);

// ── Reports ───────────────────────────────────────────────────────────────────
export const getProfitLoss    = (params)     => api.get('/reports/profit-loss',    { params }).then(r => r.data);
export const getBalanceSheet  = (params)     => api.get('/reports/balance-sheet',  { params }).then(r => r.data);
export const getCashFlow      = (params)     => api.get('/reports/cash-flow',      { params }).then(r => r.data);
export const getUnitEconomics = (params)     => api.get('/reports/unit-economics', { params }).then(r => r.data);

// ── Monthly Opening (Neraca Saldo Awal) ───────────────────────────────────────
export const getMonthlyBalances    = (params) => api.get('/monthly-opening/balances', { params }).then(r => r.data);
export const saveMonthlyBalances   = (data)   => api.post('/monthly-opening/balances', data).then(r => r.data);
export const copyMonthlyBalances   = (data)   => api.post('/monthly-opening/balances/copy', data).then(r => r.data);
export const getBalancePeriods     = ()       => api.get('/monthly-opening/balances/periods').then(r => r.data);

export const getBankAccounts       = (params) => api.get('/monthly-opening/bank-accounts', { params }).then(r => r.data);
export const createBankAccount     = (data)   => api.post('/monthly-opening/bank-accounts', data).then(r => r.data);
export const updateBankAccount     = (id, d)  => api.put(`/monthly-opening/bank-accounts/${id}`, d).then(r => r.data);
export const deleteBankAccount     = (id)     => api.delete(`/monthly-opening/bank-accounts/${id}`).then(r => r.data);

export const getReconciliation     = (params) => api.get('/monthly-opening/reconciliation', { params }).then(r => r.data);
export const saveReconciliation    = (data)   => api.post('/monthly-opening/reconciliation', data).then(r => r.data);
export const copyReconciliation    = (data)   => api.post('/monthly-opening/reconciliation/copy', data).then(r => r.data);

export default api;
