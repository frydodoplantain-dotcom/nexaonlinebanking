const API = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),

  auth: {
    register: (data) => {
      if (data instanceof FormData) {
        return fetch(`${API}/auth/register`, { method: 'POST', credentials: 'include', body: data }).then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || 'Registration failed');
          return d;
        });
      }
      return request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    },
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
    changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
    changePin: (data) => request('/auth/change-pin', { method: 'POST', body: JSON.stringify(data) }),
  },

  customer: {
    dashboard: () => request('/customer/dashboard'),
    accounts: () => request('/customer/accounts'),
    transactions: (params) => request(`/customer/transactions?${new URLSearchParams(params)}`),
    countries: () => request('/customer/countries'),
    updateProfile: (data) => request('/customer/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    uploadPhoto: (file) => {
      const fd = new FormData();
      fd.append('photo', file);
      return fetch(`${API}/customer/profile/photo`, { method: 'POST', credentials: 'include', body: fd }).then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Upload failed');
        return d;
      });
    },
    uploadKyc: (formData) =>
      fetch(`${API}/customer/kyc`, { method: 'POST', credentials: 'include', body: formData }).then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'KYC Upload failed');
        return d;
      }),
    transferSavings: (data) => request('/customer/accounts/transfer-savings', { method: 'POST', body: JSON.stringify(data) }),
    bookFixedDeposit: (data) => request('/customer/fixed-deposits', { method: 'POST', body: JSON.stringify(data) }),
    notifications: () => request('/customer/notifications'),
    markAllRead: () => request('/customer/notifications/read-all', { method: 'PATCH' }),
    deleteNotification: (id) => request(`/customer/notifications/${id}`, { method: 'DELETE' }),
  },

  transfers: {
    lookup: (q) => request(`/transfers/lookup?q=${encodeURIComponent(q)}`),
    internal: (data) => request('/transfers/internal', { method: 'POST', body: JSON.stringify(data) }),
    external: (data) => request('/transfers/external', { method: 'POST', body: JSON.stringify(data) }),
    receipt: (id) => request(`/transfers/${id}/receipt`),
  },

  loans: {
    settings: () => request('/loans/settings'),
    list: () => request('/loans'),
    apply: (data) => {
      if (data instanceof FormData) {
        return fetch(`${API}/loans/apply`, { method: 'POST', credentials: 'include', body: data }).then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || 'Loan application failed');
          return d;
        });
      }
      return request('/loans/apply', { method: 'POST', body: JSON.stringify(data) });
    },
  },

  cards: {
    fees: () => request('/cards/fees'),
    list: () => request('/cards'),
    request: (data) => request('/cards/request', { method: 'POST', body: JSON.stringify(data) }),
    freeze: (id) => request(`/cards/${id}/freeze`, { method: 'PATCH' }),
  },

  support: {
    list: () => request('/support'),
    create: (data) => request('/support', { method: 'POST', body: JSON.stringify(data) }),
    reply: (id, message) => request(`/support/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),
  },

  crypto: {
    market: () => request('/crypto/market'),
  },

  admin: {
    overview: () => request('/admin/overview'),
    applications: (params) => request(`/admin/applications?${new URLSearchParams(params)}`),
    approveApplication: (id) => request(`/admin/applications/${id}/approve`, { method: 'POST' }),
    rejectApplication: (id, reason) => request(`/admin/applications/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    users: (params) => request(`/admin/users?${new URLSearchParams(params)}`),
    user: (id) => request(`/admin/users/${id}`),
    customerDetail: (id) => request(`/admin/customers/${id}/detail`),
    createUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    suspendUser: (id) => request(`/admin/users/${id}/suspend`, { method: 'POST' }),
    activateUser: (id) => request(`/admin/users/${id}/activate`, { method: 'POST' }),
    resetPassword: (id, password) => request(`/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
    resetPin: (id, pin) => request(`/admin/users/${id}/pin/reset`, { method: 'POST', body: JSON.stringify({ pin }) }),
    pinState: (id, data) => request(`/admin/users/${id}/pin/state`, { method: 'PATCH', body: JSON.stringify(data) }),
    addFunds: (accountId, data) => request(`/admin/accounts/${accountId}/add-funds`, { method: 'POST', body: JSON.stringify(data) }),
    removeFunds: (accountId, data) => request(`/admin/accounts/${accountId}/remove-funds`, { method: 'POST', body: JSON.stringify(data) }),
    fundSavings: (accountId, data) => request(`/admin/accounts/${accountId}/fund-savings`, { method: 'POST', body: JSON.stringify(data) }),
    fundFixedDeposit: (accountId, data) => request(`/admin/accounts/${accountId}/fund-fixed-deposit`, { method: 'POST', body: JSON.stringify(data) }),
    transactions: (params) => request(`/admin/transactions?${new URLSearchParams(params)}`),
    createTransaction: (data) => request('/admin/transactions', { method: 'POST', body: JSON.stringify(data) }),
    createArbitraryTransaction: (data) => request('/admin/transactions/create', { method: 'POST', body: JSON.stringify(data) }),
    transfers: (params) => request(`/admin/transfers?${new URLSearchParams(params)}`),
    updateTransferStatus: (id, data) => request(`/admin/transfers/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    incomingFunds: (data) => request('/admin/transfers/incoming', { method: 'POST', body: JSON.stringify(data) }),
    loanApplications: () => request('/admin/loans/applications'),
    approveLoan: (id) => request(`/admin/loans/applications/${id}/approve`, { method: 'POST' }),
    rejectLoan: (id, reason) => request(`/admin/loans/applications/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    loanRepayment: (id, data) => request(`/admin/loans/${id}/repayment`, { method: 'POST', body: JSON.stringify(data) }),
    cardRequests: () => request('/admin/cards/requests'),
    issueCard: (id) => request(`/admin/cards/requests/${id}/issue`, { method: 'POST' }),
    rejectCard: (id, reason) => request(`/admin/cards/requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    updateCardStatus: (id, status) => request(`/admin/cards/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    kycPending: () => request('/admin/kyc/pending'),
    verifyKyc: (userId, data) => request(`/admin/kyc/${userId}/verify`, { method: 'POST', body: JSON.stringify(data) }),
    auditLogs: (params) => request(`/admin/audit-logs?${new URLSearchParams(params)}`),
    reports: (params) => request(`/admin/reports?${new URLSearchParams(params)}`),
    settings: () => request('/admin/settings'),
    updateSettings: (data) => request('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),
    support: () => request('/admin/support'),
    supportReply: (id, message) => request(`/admin/support/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),
    supportStatus: (id, status) => request(`/admin/support/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    notifications: () => request('/admin/notifications'),
  },
};
