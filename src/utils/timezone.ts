/**
 * Timezone utility for converting between UTC and KST (Korea Standard Time)
 * KST = UTC+9
 */

/**
 * Get current date/time in KST as ISO string
 * @returns ISO string in KST timezone (e.g., "2026-04-01T16:30:00+09:00")
 */
export function getKSTNow(): string {
  const now = new Date();
  // Convert to KST (UTC+9)
  const kstOffset = 9 * 60; // 9 hours in minutes
  const utcOffset = now.getTimezoneOffset(); // minutes
  const kstTime = new Date(now.getTime() + (kstOffset + utcOffset) * 60 * 1000);
  
  // Format as ISO string with KST timezone
  return kstTime.toISOString().replace('Z', '+09:00');
}

/**
 * Get current date/time in KST for SQLite storage
 * SQLite format: YYYY-MM-DD HH:MM:SS
 * @returns Date string in KST (e.g., "2026-04-01 16:30:00")
 */
export function getKSTNowForDB(): string {
  const now = new Date();
  // Convert to KST (UTC+9)
  const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  const kstTime = new Date(now.getTime() + kstOffset);
  
  // Format as SQLite datetime
  return kstTime.toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '');
}

/**
 * Convert UTC datetime string to KST
 * @param utcString UTC datetime string (e.g., "2026-04-01 07:30:00" or ISO format)
 * @returns KST datetime string (e.g., "2026-04-01 16:30:00")
 */
export function convertUTCToKST(utcString: string): string {
  const utcDate = new Date(utcString);
  const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  const kstTime = new Date(utcDate.getTime() + kstOffset);
  
  return kstTime.toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '');
}

/**
 * Get SQLite function to get current KST time
 * Use this in SQL queries: datetime('now', '+9 hours')
 * @returns SQL expression string
 */
export function getSQLiteKSTNow(): string {
  return "datetime('now', '+9 hours')";
}

/**
 * Format KST datetime for display in Korean format
 * @param kstString KST datetime string
 * @returns Formatted string (e.g., "2026년 4월 1일 16:30")
 */
export function formatKSTForDisplay(kstString: string): string {
  const date = new Date(kstString);
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  return `${year}년 ${month}월 ${day}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format KST datetime for display in English format
 * @param kstString KST datetime string
 * @returns Formatted string (e.g., "Apr 1, 2026 4:30 PM")
 */
export function formatKSTForDisplayEN(kstString: string): string {
  const date = new Date(kstString);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleString('en-US', options);
}

/**
 * Get KST date only (YYYY-MM-DD)
 * @returns Date string in KST (e.g., "2026-04-01")
 */
export function getKSTDateOnly(): string {
  return getKSTNowForDB().split(' ')[0];
}

/**
 * Check if a date is today in KST
 * @param dateString Date string to check
 * @returns true if date is today in KST
 */
export function isToday(dateString: string): boolean {
  const today = getKSTDateOnly();
  const checkDate = dateString.split(' ')[0];
  return today === checkDate;
}
