const STORAGE_KEYS = {
  USER: 'nexa-user',
  USERS: 'nexa-users',
  TRANSACTIONS: 'nexa-transactions',
  BENEFICIARIES: 'nexa-beneficiaries',
  LOANS: 'nexa-loans',
  LOAN_PAYMENTS: 'nexa-loan-payments',
  CARDS: 'nexa-cards',
  NOTIFICATIONS: 'nexa-notifications',
  AUDIT_LOG: 'nexa-audit-log',
  SUPPORT_TICKETS: 'nexa-support-tickets',
  SETTINGS: 'nexa-settings',
};

export const storage = {
  get: (key, fallback = []) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
};

export const STORAGE = STORAGE_KEYS;
