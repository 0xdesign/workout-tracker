import { useState, useCallback } from 'react';
import { useDateUtils, WeekDay } from './use-date-utils';

/**
 * Hook that manages week-based navigation
 */
export function useWeekNavigation() {
  const [weekOffset, setWeekOffset] = useState(0);
  const dateUtils = useDateUtils();
  
  /**
   * Get all days for the current week
   * @returns Array of date objects for the week
   */
  const weekDays = useCallback((): WeekDay[] => {
    return dateUtils.getWeekDays(weekOffset);
  }, [weekOffset, dateUtils]);
  
  /**
   * Go to the next week
   */
  const nextWeek = useCallback(() => {
    setWeekOffset(prev => prev + 1);
  }, []);
  
  /**
   * Go to the previous week
   */
  const prevWeek = useCallback(() => {
    setWeekOffset(prev => prev - 1);
  }, []);
  
  /**
   * Go to the current week
   */
  const goToToday = useCallback(() => {
    setWeekOffset(0);
  }, []);
  
  /**
   * Get the week range (start and end dates)
   */
  const weekRange = useCallback(() => {
    return dateUtils.getWeekRange(weekOffset);
  }, [weekOffset, dateUtils]);
  
  return {
    weekDays,
    nextWeek,
    prevWeek,
    goToToday,
    weekRange,
    weekOffset
  };
} 