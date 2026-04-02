/**
 * Timezone utility for frontend - Convert UTC to KST
 * KST = UTC+9
 */

/**
 * Convert UTC datetime string to KST Date object
 * @param {string} utcString - UTC datetime string from DB (e.g., "2026-04-01 07:30:00")
 * @returns {Date} Date object in KST
 */
function convertUTCToKST(utcString) {
  if (!utcString) return new Date();
  
  // Parse UTC string
  const utcDate = new Date(utcString + 'Z'); // Add Z to indicate UTC
  
  // Add 9 hours for KST
  const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  return new Date(utcDate.getTime() + kstOffset);
}

/**
 * Format datetime in Korean format (KST)
 * @param {string} utcString - UTC datetime string from DB
 * @returns {string} Formatted string (e.g., "2026년 4월 1일 16:30")
 */
function formatKSTKorean(utcString) {
  if (!utcString) return '-';
  
  const kstDate = convertUTCToKST(utcString);
  
  const year = kstDate.getFullYear();
  const month = kstDate.getMonth() + 1;
  const day = kstDate.getDate();
  const hours = kstDate.getHours();
  const minutes = kstDate.getMinutes();
  
  return `${year}년 ${month}월 ${day}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format date only in Korean format (KST)
 * @param {string} utcString - UTC datetime string from DB
 * @returns {string} Formatted string (e.g., "2026. 4. 1.")
 */
function formatKSTDateOnly(utcString) {
  if (!utcString) return '-';
  
  const kstDate = convertUTCToKST(utcString);
  
  return kstDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}

/**
 * Format datetime in international format (KST)
 * @param {string} utcString - UTC datetime string from DB
 * @returns {string} Formatted string (e.g., "Apr 1, 2026 4:30 PM")
 */
function formatKSTInternational(utcString) {
  if (!utcString) return '-';
  
  const kstDate = convertUTCToKST(utcString);
  
  return kstDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get relative time string (e.g., "3일 전", "2시간 전")
 * @param {string} utcString - UTC datetime string from DB
 * @returns {string} Relative time string
 */
function getRelativeTime(utcString) {
  if (!utcString) return '-';
  
  const kstDate = convertUTCToKST(utcString);
  const now = new Date();
  const diffMs = now - kstDate;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 30) return `${diffDay}일 전`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}개월 전`;
  return `${Math.floor(diffDay / 365)}년 전`;
}

/**
 * Check if date is today (KST)
 * @param {string} utcString - UTC datetime string from DB
 * @returns {boolean} true if date is today in KST
 */
function isToday(utcString) {
  if (!utcString) return false;
  
  const kstDate = convertUTCToKST(utcString);
  const now = new Date();
  
  return kstDate.getFullYear() === now.getFullYear() &&
         kstDate.getMonth() === now.getMonth() &&
         kstDate.getDate() === now.getDate();
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.timezoneUtils = {
    convertUTCToKST,
    formatKSTKorean,
    formatKSTDateOnly,
    formatKSTInternational,
    getRelativeTime,
    isToday
  };
}
