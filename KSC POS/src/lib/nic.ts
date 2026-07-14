/**
 * Extracts birth date and gender from Sri Lankan National Identity Card (NIC) numbers.
 * Supports both old (9-digit + letter) and new (12-digit) formats.
 */
export function extractBirthdayFromNIC(nic: string): { birthday: string; gender: 'Male' | 'Female' } | null {
  const cleanNic = nic.trim().toUpperCase();
  let year = 0;
  let dayOfYear = 0;
  let gender: 'Male' | 'Female' = 'Male';

  if (/^\d{9}[VXX]$/.test(cleanNic)) {
    // Old NIC (e.g. 942341234V)
    year = 1900 + parseInt(cleanNic.substring(0, 2));
    dayOfYear = parseInt(cleanNic.substring(2, 5));
  } else if (/^\d{12}$/.test(cleanNic)) {
    // New NIC (e.g. 199423401234)
    year = parseInt(cleanNic.substring(0, 4));
    dayOfYear = parseInt(cleanNic.substring(4, 7));
  } else {
    return null;
  }

  if (dayOfYear > 500) {
    gender = 'Female';
    dayOfYear -= 500;
  } else {
    gender = 'Male';
  }

  // Validate day range (1 to 366)
  if (dayOfYear < 1 || dayOfYear > 366) {
    return null;
  }

  // Sri Lankan NIC uses standard Leap Year day calculation (Feb has 29 days)
  const monthDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthNames = [
    '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12'
  ];

  let accum = 0;
  let month = '';
  let day = 0;

  for (let i = 0; i < 12; i++) {
    if (dayOfYear <= accum + monthDays[i]) {
      month = monthNames[i];
      day = dayOfYear - accum;
      break;
    }
    accum += monthDays[i];
  }

  const paddedDay = day < 10 ? `0${day}` : `${day}`;
  
  // Format as YYYY-MM-DD
  return {
    birthday: `${year}-${month}-${paddedDay}`,
    gender
  };
}
