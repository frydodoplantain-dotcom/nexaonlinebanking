import { storage, STORAGE } from './storage';

export const loadTransactions = () => storage.get(STORAGE.TRANSACTIONS, []);
export const saveTransactions = (txns) => storage.set(STORAGE.TRANSACTIONS, txns);

export const loadBeneficiaries = () => storage.get(STORAGE.BENEFICIARIES, []);
export const saveBeneficiaries = (bens) => storage.set(STORAGE.BENEFICIARIES, bens);

export const loadLoans = () => storage.get(STORAGE.LOANS, []);
export const saveLoans = (loans) => storage.set(STORAGE.LOANS, loans);

export const loadLoanPayments = () => storage.get(STORAGE.LOAN_PAYMENTS, []);
export const saveLoanPayments = (pays) => storage.set(STORAGE.LOAN_PAYMENTS, pays);

export const loadCards = () => storage.get(STORAGE.CARDS, []);
export const saveCards = (cards) => storage.set(STORAGE.CARDS, cards);

export const loadNotifications = () => storage.get(STORAGE.NOTIFICATIONS, []);
export const saveNotifications = (notifs) => storage.set(STORAGE.NOTIFICATIONS, notifs);

export const loadAuditLog = () => storage.get(STORAGE.AUDIT_LOG, []);
export const saveAuditLog = (log) => storage.set(STORAGE.AUDIT_LOG, log);

export const loadSupportTickets = () => storage.get(STORAGE.SUPPORT_TICKETS, []);
export const saveSupportTickets = (tickets) => storage.set(STORAGE.SUPPORT_TICKETS, tickets);

export const loadSettings = () => storage.get(STORAGE.SETTINGS, {});
export const saveSettings = (settings) => storage.set(STORAGE.SETTINGS, settings);
