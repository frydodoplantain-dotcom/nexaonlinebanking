export const countries = {
  US: { name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', phone: '+1', fields: ['Routing number', 'Account number'] },
  GB: { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', phone: '+44', fields: ['Sort code', 'Account number', 'IBAN-style ID'] },
  NG: { name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', symbol: '₦', phone: '+234', fields: ['Bank name', 'Account number'] },
  CA: { name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'CA$', phone: '+1', fields: ['Transit number', 'Account number'] },
  AU: { name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', phone: '+61', fields: ['BSB', 'Account number'] },
  DE: { name: 'Germany', flag: '🇩🇪', currency: 'EUR', symbol: '€', phone: '+49', fields: ['IBAN-style ID', 'BIC-style ID'] },
  IN: { name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', phone: '+91', fields: ['IFSC', 'Account number'] },
  JP: { name: 'Japan', flag: '🇯🇵', currency: 'JPY', symbol: '¥', phone: '+81', fields: ['Bank code', 'Account number'] },
  CN: { name: 'China', flag: '🇨🇳', currency: 'CNY', symbol: '¥', phone: '+86', fields: ['Bank code', 'Account number'] },
  FR: { name: 'France', flag: '🇫🇷', currency: 'EUR', symbol: '€', phone: '+33', fields: ['IBAN-style ID', 'BIC-style ID'] },
  BR: { name: 'Brazil', flag: '🇧🇷', currency: 'BRL', symbol: 'R$', phone: '+55', fields: ['Bank code', 'Account number', 'Branch'] },
  ZA: { name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R', phone: '+27', fields: ['Branch code', 'Account number'] },
  KE: { name: 'Kenya', flag: '🇰🇪', currency: 'KES', symbol: 'KSh', phone: '+254', fields: ['Bank code', 'Account number'] },
  GH: { name: 'Ghana', flag: '🇬🇭', currency: 'GHS', symbol: 'GH₵', phone: '+233', fields: ['Bank code', 'Account number'] },
};

export const cryptos = [
  ['₿', 'Bitcoin', 'BTC', '66,432.50', '+2.35%'],
  ['♦', 'Ethereum', 'ETH', '3,274.25', '+1.85%'],
  ['₮', 'Tether', 'USDT', '1.00', '+0.01%'],
  ['◆', 'BNB', 'BNB', '586.75', '-1.25%'],
  ['≋', 'Solana', 'SOL', '164.85', '+2.15%'],
  ['✕', 'XRP', 'XRP', '0.52', '+0.73%'],
  ['₳', 'Cardano', 'ADA', '0.45', '+1.12%'],
  ['Ð', 'Dogecoin', 'DOGE', '0.12', '+3.45%'],
  ['S', 'USD Coin', 'USDC', '1.00', '+0.01%'],
  ['◎', 'Polkadot', 'DOT', '7.20', '-0.88%'],
];

export const nav = [
  ['Dashboard', 'LayoutDashboard'],
  ['Accounts', 'WalletCards'],
  ['Transfers', 'ArrowLeftRight'],
  ['Beneficiaries', 'UsersRound'],
  ['Transactions', 'ReceiptText'],
  ['Cards', 'CreditCard'],
  ['Loans', 'Landmark'],
  ['Savings', 'PiggyBank'],
  ['Crypto', 'Bitcoin'],
  ['Bills', 'FileText'],
  ['Notifications', 'Bell'],
  ['Support', 'HelpCircle'],
  ['Settings', 'Settings'],
];

export const generateAccountNumbers = (country) => {
  const rand = (len) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
  const base = {
    US: { routing: `${rand(9)}`, account: `${rand(12)}` },
    GB: { sort: `${rand(6)}`, account: `${rand(8)}`, iban: `GB${rand(2)}${rand(4)}${rand(4)}${rand(4)}${rand(3)}${rand(7)}` },
    NG: { account: `${rand(10)}` },
    CA: { transit: `${rand(5)}`, account: `${rand(7)}` },
    AU: { bsb: `${rand(3)}-${rand(3)}`, account: `${rand(8)}` },
    DE: { iban: `DE${rand(2)}${rand(18)}`, bic: `DEUT${rand(3)}XXX` },
    IN: { ifsc: `NEXA${rand(4)}00${rand(3)}`, account: `${rand(12)}` },
    JP: { bankCode: `${rand(4)}`, account: `${rand(7)}` },
    CN: { bankCode: `${rand(12)}`, account: `${rand(16)}` },
    FR: { iban: `FR${rand(2)}${rand(10)}${rand(11)}${rand(2)}`, bic: `NEXA${rand(4)}XXX` },
    BR: { bank: `${rand(3)}`, branch: `${rand(4)}`, account: `${rand(8)}` },
    ZA: { branch: `${rand(6)}`, account: `${rand(11)}` },
    KE: { bank: `${rand(3)}`, account: `${rand(10)}` },
    GH: { bank: `${rand(3)}`, account: `${rand(10)}` },
  };
  return base[country] || { account: `${rand(12)}` };
};

export const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
