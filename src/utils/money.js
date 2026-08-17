export const money = (n, c = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: c,
    maximumFractionDigits: c === 'JPY' ? 0 : 2,
  }).format(n);
