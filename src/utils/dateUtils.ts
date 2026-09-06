/**
 * Date utilities for Buddhist Era (พุทธศักราช) and ID generation
 */

export const getTodayBEDate = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const beYear = now.getFullYear() + 543;
  return `${day}/${month}/${beYear}`;
};

export const convertIsoToBEDate = (isoStr: string): string => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const [y, m, d] = parts;
  const beYear = parseInt(y, 10) + 543;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${beYear}`;
};

export const convertBEDateToIso = (beStr: string): string => {
  if (!beStr) return '';
  const parts = beStr.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  const ceYear = parseInt(y, 10) - 543;
  return `${ceYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

export const parseBEDateToTimestamp = (beStr: string): number => {
  if (!beStr) return 0;
  const parts = beStr.split('/');
  if (parts.length !== 3) return 0;
  const [d, m, y] = parts.map(p => parseInt(p, 10));
  const ceYear = y - 543;
  return new Date(ceYear, m - 1, d).getTime();
};

export const isDateInRange = (dateStr: string, startDateStr?: string, endDateStr?: string): boolean => {
  if (!dateStr) return false;
  const targetTime = parseBEDateToTimestamp(dateStr);
  if (!targetTime) return false;

  if (startDateStr) {
    const startTime = parseBEDateToTimestamp(startDateStr);
    if (startTime && targetTime < startTime) return false;
  }
  if (endDateStr) {
    const endTime = parseBEDateToTimestamp(endDateStr);
    // Include the entire end date day (23:59:59)
    if (endTime && targetTime > endTime + 86400000 - 1) return false;
  }
  return true;
};

export const generateIdOper = (): string => {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
};

export const generateIdDrugServ = (): string => {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `d-${y}${m}${d}${h}${min}${s}`;
};

export const generateIdDis = (): string => {
  return `dis-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
};
