// Time calculation utilities for booking system

export interface TimeBlock {
  start: number; // minutes from 9 AM
  end: number; // minutes from 9 AM
  label?: string;
}

const WORK_START = 9 * 60; // 9 AM in minutes from midnight
const WORK_END = 19 * 60; // 7 PM in minutes from midnight

/**
 * Convert Arabic/English time string to minutes from 9 AM
 * Examples: "09:00 ص", "02:00 م", "9:00 AM", "2:00 PM"
 */
export const parseTimeToMinutes = (timeString: string): number => {
  // Remove extra spaces
  const cleaned = timeString.trim();
  
  // Extract hour and minute
  const match = cleaned.match(/(\d+):(\d+)/);
  if (!match) return 0;
  
  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  
  // Check for PM indicator (م or PM)
  const isPM = cleaned.includes('م') || cleaned.includes('PM') || cleaned.includes('pm');
  const isAM = cleaned.includes('ص') || cleaned.includes('AM') || cleaned.includes('am');
  
  // Convert to 24-hour format
  if (isPM && hour !== 12) {
    hour += 12;
  } else if (isAM && hour === 12) {
    hour = 0;
  }
  
  // Convert to minutes from midnight
  const totalMinutes = hour * 60 + minute;
  
  // Return minutes from 9 AM (work start)
  return totalMinutes - WORK_START;
};

/**
 * Convert duration string to minutes
 * Examples: "30 mins", "1 hr", "1.5 hr"
 */
export const parseDuration = (durationString: string): number => {
  if (durationString.includes('mins')) {
    return parseInt(durationString);
  }
  
  const hours = parseFloat(durationString);
  return hours * 60;
};

/**
 * Convert minutes from 9 AM to display time string
 */
export const minutesToTime = (minutes: number, use24Hour: boolean = false): string => {
  const totalMinutes = WORK_START + minutes;
  let hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  
  if (use24Hour) {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  
  const isPM = hour >= 12;
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  
  const period = isPM ? 'م' : 'ص';
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
};

/**
 * Calculate occupied time blocks from bookings
 */
export const calculateTimeBlocks = (
  bookings: Array<{ booking_time: string; booking_duration: string }>
): TimeBlock[] => {
  return bookings.map(booking => {
    const start = parseTimeToMinutes(booking.booking_time);
    const duration = parseDuration(booking.booking_duration);
    
    return {
      start,
      end: start + duration,
      label: `${booking.booking_time} (${booking.booking_duration})`
    };
  });
};

/**
 * Check if a time slot is available
 */
export const isTimeSlotAvailable = (
  startMinutes: number,
  durationMinutes: number,
  bookedBlocks: TimeBlock[]
): boolean => {
  const endMinutes = startMinutes + durationMinutes;
  
  // Check if it fits within working hours (0 to 600 minutes = 9 AM to 7 PM)
  if (startMinutes < 0 || endMinutes > 600) {
    return false;
  }
  
  // Check for overlaps with booked blocks
  for (const block of bookedBlocks) {
    // Check if there's any overlap
    if (
      (startMinutes >= block.start && startMinutes < block.end) ||
      (endMinutes > block.start && endMinutes <= block.end) ||
      (startMinutes <= block.start && endMinutes >= block.end)
    ) {
      return false;
    }
  }
  
  return true;
};

/**
 * Generate time intervals (every 15 or 30 minutes)
 */
export const generateTimeIntervals = (intervalMinutes: number = 30): string[] => {
  const intervals: string[] = [];
  
  // From 9 AM (0 minutes) to 7 PM (600 minutes)
  for (let minutes = 0; minutes <= 600; minutes += intervalMinutes) {
    intervals.push(minutesToTime(minutes));
  }
  
  return intervals;
};

/**
 * Find the next available slot that can fit the duration
 */
export const findNextAvailableSlot = (
  durationMinutes: number,
  bookedBlocks: TimeBlock[],
  intervalMinutes: number = 30
): string | null => {
  for (let minutes = 0; minutes <= 600 - durationMinutes; minutes += intervalMinutes) {
    if (isTimeSlotAvailable(minutes, durationMinutes, bookedBlocks)) {
      return minutesToTime(minutes);
    }
  }
  
  return null;
};

/**
 * Get available slots count
 */
export const getAvailableSlotsCount = (
  durationMinutes: number,
  bookedBlocks: TimeBlock[],
  intervalMinutes: number = 30
): number => {
  let count = 0;
  
  for (let minutes = 0; minutes <= 600 - durationMinutes; minutes += intervalMinutes) {
    if (isTimeSlotAvailable(minutes, durationMinutes, bookedBlocks)) {
      count++;
    }
  }
  
  return count;
};
