/**
 * Simple test for timezone utility functions
 * Run this manually in browser console to verify functionality
 */

import { 
  calculateExpiryDate, 
  formatDateTimeLocalInTimezone, 
  parseDateTimeLocalFromTimezone,
  getEffectiveTimezone,
  getBrowserTimezone 
} from './timezone.js';

// Test function to run in browser console
window.testTimezone = () => {
  console.log('🧪 Testing Timezone Utilities');
  
  const testTimezone = 'America/New_York';
  const durationMinutes = 1440; // 24 hours
  
  console.log('1. Browser timezone:', getBrowserTimezone());
  console.log('2. Effective timezone (auto):', getEffectiveTimezone('auto'));
  console.log('3. Effective timezone (EST):', getEffectiveTimezone(testTimezone));
  
  // Test expiry calculation
  const expiryDate = calculateExpiryDate(durationMinutes, testTimezone);
  console.log('4. Calculated expiry date (UTC):', expiryDate.toISOString());
  console.log('5. Expiry in EST:', expiryDate.toLocaleString('en-US', { timeZone: testTimezone }));
  
  // Test datetime-local formatting
  const localFormat = formatDateTimeLocalInTimezone(expiryDate, testTimezone);
  console.log('6. Datetime-local format:', localFormat);
  
  // Test parsing back to UTC
  const parsedUTC = parseDateTimeLocalFromTimezone(localFormat, testTimezone);
  console.log('7. Parsed back to UTC:', parsedUTC.toISOString());
  
  // Test if round-trip works
  const isRoundTripValid = Math.abs(expiryDate.getTime() - parsedUTC.getTime()) < 60000; // Within 1 minute
  console.log('8. Round-trip valid:', isRoundTripValid);
  
  if (isRoundTripValid) {
    console.log('✅ Timezone utilities test PASSED');
  } else {
    console.log('❌ Timezone utilities test FAILED');
    console.log('   Original:', expiryDate.toISOString());
    console.log('   After round-trip:', parsedUTC.toISOString());
  }
};

console.log('💡 Run window.testTimezone() in browser console to test timezone functions');
