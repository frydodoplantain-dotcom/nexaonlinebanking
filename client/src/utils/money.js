export const money = (n, c = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: c,
    maximumFractionDigits: c === 'JPY' ? 0 : 2,
  }).format(n ?? 0);

export const formatName = (profile) =>
  profile ? `${profile.firstName}${profile.middleName ? ' ' + profile.middleName : ''} ${profile.lastName}` : '';

export const accountLast4 = (num) => num ? num.slice(-4) : '0000';

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};
