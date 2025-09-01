/**
 * Timezone Utility Functions
 * Handles timezone detection, conversion, and formatting
 */

// Get browser's detected timezone
export const getBrowserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Get timezone from settings (auto means browser timezone)
export const getEffectiveTimezone = (timezoneSettings = 'auto') => {
  return timezoneSettings === 'auto' ? getBrowserTimezone() : timezoneSettings;
};

// Get available timezone options for the UI
export const getTimezoneOptions = () => {
  const browserTz = getBrowserTimezone();
  return [
    { value: 'auto', label: `Auto-detect (${browserTz})` },
    { value: 'America/New_York', label: 'Eastern Time (America/New_York)' },
    { value: 'America/Chicago', label: 'Central Time (America/Chicago)' },
    { value: 'America/Denver', label: 'Mountain Time (America/Denver)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (America/Los_Angeles)' },
    { value: 'Europe/London', label: 'London (Europe/London)' },
    { value: 'Europe/Paris', label: 'Central Europe (Europe/Paris)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (Asia/Tokyo)' },
    { value: 'Australia/Sydney', label: 'Sydney (Australia/Sydney)' },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
  ];
};

// Create a date in the specified timezone
export const createDateInTimezone = (dateInput, timezone) => {
  const effectiveTimezone = getEffectiveTimezone(timezone);
  
  if (dateInput instanceof Date) {
    return new Date(dateInput.toLocaleString("en-US", { timeZone: effectiveTimezone }));
  }
  
  if (typeof dateInput === 'string') {
    return new Date(new Date(dateInput).toLocaleString("en-US", { timeZone: effectiveTimezone }));
  }
  
  return new Date();
};

// Convert a date to a specific timezone and return ISO string for storage
export const convertToTimezoneAndISO = (date, timezone) => {
  const effectiveTimezone = getEffectiveTimezone(timezone);
  
  // Create date in the specified timezone
  const localDate = new Date(date.toLocaleString("en-US", { timeZone: effectiveTimezone }));
  
  // Return as ISO string for consistent storage
  return localDate.toISOString();
};

// Format a date in the user's timezone
export const formatDateInTimezone = (date, timezone, options = {}) => {
  const effectiveTimezone = getEffectiveTimezone(timezone);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: effectiveTimezone
  };
  
  return new Date(date).toLocaleString('en-US', { ...defaultOptions, ...options });
};

// Calculate expiry date based on duration and timezone
export const calculateExpiryDate = (durationMinutes, timezone) => {
  // Simple approach: just add the duration to the current UTC time
  // This ensures consistency with backend calculations
  const now = new Date();
  return new Date(now.getTime() + durationMinutes * 60 * 1000);
};

// Format datetime-local input value in timezone
export const formatDateTimeLocalInTimezone = (date, timezone) => {
  const effectiveTimezone = getEffectiveTimezone(timezone);
  
  // Convert to timezone
  const localDate = new Date(date.toLocaleString("en-US", { timeZone: effectiveTimezone }));
  
  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Parse datetime-local input value from timezone to UTC
export const parseDateTimeLocalFromTimezone = (dateTimeLocal, timezone) => {
  // For manual input, assume the user entered the time in their local timezone
  // and convert it to UTC properly
  
  // Parse the datetime-local string as if it's in the user's browser timezone
  const localDate = new Date(dateTimeLocal);
  
  // Since datetime-local doesn't include timezone info, the browser treats it as local time
  // We just return the Date object as-is since it represents the correct UTC time
  return localDate;
};

// Get timezone info for display
export const getTimezoneInfo = (timezone) => {
  const effectiveTimezone = getEffectiveTimezone(timezone);
  const now = new Date();
  
  return {
    timezone: effectiveTimezone,
    currentTime: formatDateInTimezone(now, timezone),
    offset: now.toLocaleString('en-US', { 
      timeZone: effectiveTimezone, 
      timeZoneName: 'short' 
    }).split(' ').pop()
  };
};

// Calculate time remaining until expiry
export const getTimeRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { expired: true, text: 'Expired' };
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return { expired: false, text: `${days}d ${hours}h ${minutes}m` };
  } else if (hours > 0) {
    return { expired: false, text: `${hours}h ${minutes}m` };
  } else {
    return { expired: false, text: `${minutes}m` };
  }
};

// Check if expiry is approaching (within warning threshold)
export const isExpiryApproaching = (expiryDate, warningMinutes = 30) => {
  if (!expiryDate) return false;
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  
  return diffMinutes > 0 && diffMinutes <= warningMinutes;
};
