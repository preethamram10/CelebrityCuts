/**
 * Utility functions for Indian Standard Time (IST - Asia/Kolkata)
 */

export const getISTDateString = (dateInput?: Date | string | number): string => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return String(dateInput).split('T')[0];
  
  // 'en-CA' outputs YYYY-MM-DD format strictly in Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(d);
};

export const getISTTimeString = (dateInput?: Date | string | number): string => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const getISTYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getISTDateString(d);
};
