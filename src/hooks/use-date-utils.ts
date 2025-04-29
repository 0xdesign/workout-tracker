import { useMemo } from 'react';

export type WeekDay = {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  formattedDate: string;
  isoDate: string;
};

/**
 * Hook that provides date utility functions
 */
export function useDateUtils() {
  /**
   * Get an array of date objects for a week
   * @param weekOffset Number of weeks from current week (0 = current week, 1 = next week, -1 = last week)
   * @returns Array of date objects for the week
   */
  const getWeekDays = (weekOffset = 0): WeekDay[] => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    
    // Calculate the date of the first day of the week (Monday)
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1) + (weekOffset * 7));
    
    // Generate an array of dates for the week
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      
      const isToday = isSameDay(date, today);
      
      return {
        date,
        dayName: getDayName(date, 'short'),
        dayNumber: date.getDate(),
        isToday,
        formattedDate: formatDate(date, 'long'),
        isoDate: formatDate(date, 'iso')
      };
    });
  };
  
  /**
   * Check if two dates are the same day
   * @param date1 First date
   * @param date2 Second date
   * @returns True if the dates are the same day
   */
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };
  
  /**
   * Get the name of a day of the week
   * @param date Date to get day name for
   * @param format Format of the day name ('short' or 'long')
   * @returns Day name
   */
  const getDayName = (date: Date, format: 'short' | 'long' = 'long'): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: format };
    return date.toLocaleDateString('en-US', options);
  };
  
  /**
   * Format a date
   * @param date Date to format
   * @param format Format of the date ('short', 'long', or 'iso')
   * @returns Formatted date string
   */
  const formatDate = (date: Date, format: 'short' | 'long' | 'iso' = 'short'): string => {
    if (format === 'iso') {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'long' ? 'long' : 'short',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', options);
  };
  
  /**
   * Calculate the week range (start and end dates)
   * @param weekOffset Number of weeks from current week
   * @returns Object with start and end dates of the week
   */
  const getWeekRange = (weekOffset = 0) => {
    const days = getWeekDays(weekOffset);
    return {
      start: days[0].date,
      end: days[6].date,
      startFormatted: formatDate(days[0].date, 'short'),
      endFormatted: formatDate(days[6].date, 'short')
    };
  };
  
  return {
    getWeekDays,
    isSameDay,
    getDayName,
    formatDate,
    getWeekRange
  };
} 