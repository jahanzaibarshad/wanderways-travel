export const money = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
export const departureDate = (value) =>
  new Intl.DateTimeFormat('en-PK', { dateStyle: 'long', timeZone: 'Asia/Karachi' }).format(
    new Date(value),
  );
