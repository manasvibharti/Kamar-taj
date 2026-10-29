/**
 * Time utility functions for meal window verification and dates
 */

/**
 * Converts "HH:MM:SS" or "HH:MM" into total minutes from midnight
 * @param {string} timeStr e.g. "07:30:00"
 * @returns {number} minutes from midnight
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 * Allows optional simulated date (for testing)
 * @param {string|null} overrideDate 
 * @returns {string} YYYY-MM-DD
 */
export function getTodayDateString(overrideDate = null) {
  if (overrideDate && /^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) {
    return overrideDate;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current local time string "HH:MM:SS"
 * Allows optional simulated time "HH:MM" or "HH:MM:SS"
 * @param {string|null} overrideTime 
 * @returns {string} HH:MM:SS
 */
export function getCurrentTimeString(overrideTime = null) {
  if (overrideTime && /^\d{1,2}:\d{2}(:\d{2})?$/.test(overrideTime)) {
    return overrideTime.length === 5 ? `${overrideTime}:00` : overrideTime;
  }
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Checks if current time is inside [startTime, endTime] window
 * @param {string} startTimeStr "07:30:00"
 * @param {string} endTimeStr "09:30:00"
 * @param {string|null} overrideTime Optional simulated time "HH:MM:SS"
 * @returns {boolean}
 */
export function isCurrentTimeInWindow(startTimeStr, endTimeStr, overrideTime = null) {
  const currentStr = getCurrentTimeString(overrideTime);
  const curMinutes = timeStringToMinutes(currentStr);
  const startMinutes = timeStringToMinutes(startTimeStr);
  const endMinutes = timeStringToMinutes(endTimeStr);

  if (startMinutes <= endMinutes) {
    // Normal window e.g. 12:30 to 14:30
    return curMinutes >= startMinutes && curMinutes <= endMinutes;
  } else {
    // Midnight spanning window e.g. 23:00 to 01:00
    return curMinutes >= startMinutes || curMinutes <= endMinutes;
  }
}

