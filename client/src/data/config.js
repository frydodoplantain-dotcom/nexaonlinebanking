export const countries = {
  US: { name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', phone: '+1', fields: ['Routing number', 'Account number'] },
  GB: { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', phone: '+44', fields: ['Sort code', 'Account number', 'IBAN'] },
  NG: { name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', symbol: '₦', phone: '+234', fields: ['Bank name', 'Account number'] },
  CA: { name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'CA$', phone: '+1', fields: ['Transit number', 'Account number'] },
  AU: { name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', phone: '+61', fields: ['BSB', 'Account number'] },
  DE: { name: 'Germany', flag: '🇩🇪', currency: 'EUR', symbol: '€', phone: '+49', fields: ['IBAN', 'BIC'] },
  IN: { name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', phone: '+91', fields: ['IFSC', 'Account number'] },
  JP: { name: 'Japan', flag: '🇯🇵', currency: 'JPY', symbol: '¥', phone: '+81', fields: ['Bank code', 'Account number'] },
  CN: { name: 'China', flag: '🇨🇳', currency: 'CNY', symbol: '¥', phone: '+86', fields: ['Bank code', 'Account number'] },
  FR: { name: 'France', flag: '🇫🇷', currency: 'EUR', symbol: '€', phone: '+33', fields: ['IBAN', 'BIC'] },
  BR: { name: 'Brazil', flag: '🇧🇷', currency: 'BRL', symbol: 'R$', phone: '+55', fields: ['Bank code', 'Account number', 'Branch'] },
  ZA: { name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R', phone: '+27', fields: ['Branch code', 'Account number'] },
  KE: { name: 'Kenya', flag: '🇰🇪', currency: 'KES', symbol: 'KSh', phone: '+254', fields: ['Bank code', 'Account number'] },
  GH: { name: 'Ghana', flag: '🇬🇭', currency: 'GHS', symbol: 'GH₵', phone: '+233', fields: ['Bank code', 'Account number'] },
};

export const nav = [
  ['Dashboard', 'LayoutDashboard'],
  ['Accounts', 'WalletCards'],
  ['Transfers', 'ArrowLeftRight'],
  ['Transactions', 'ReceiptText'],
  ['Cards', 'CreditCard'],
  ['Loans', 'Landmark'],
  ['Crypto', 'Bitcoin'],
  ['Notifications', 'Bell'],
  ['Support', 'HelpCircle'],
  ['Settings', 'Settings'],
];

export const accountTypeLabels = {
  CHECKING: 'Nexa Checking',
  SAVINGS: 'Nexa Savings',
  FIXED_DEPOSIT: 'Fixed Deposit',
};
