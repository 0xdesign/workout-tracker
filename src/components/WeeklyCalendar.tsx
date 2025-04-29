'use client';

import { useState, useEffect } from 'react';
import { useWeekNavigation } from '@/hooks/use-week-navigation';
import { WorkoutDay } from '@/types/workout';
import Link from 'next/link';

interface WeeklyCalendarProps {
  workoutDaysByDate?: Record<string, WorkoutDay>;
  workoutCompletionStatus?: Record<string, boolean>;
  onSelectDate?: (date: string) => void;
}

export function WeeklyCalendar({
  workoutDaysByDate = {},
  workoutCompletionStatus = {},
  onSelectDate
}: WeeklyCalendarProps) {
  const { weekDays, nextWeek, prevWeek, goToToday, weekRange } = useWeekNavigation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Initialize with today's date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    onSelectDate?.(today);
  }, [onSelectDate]);
  
  const handleDateClick = (isoDate: string) => {
    setSelectedDate(isoDate);
    onSelectDate?.(isoDate);
  };
  
  return (
    <div className="w-full">
      {/* Header with week range and navigation */}
      <div className="flex justify-between items-center mb-4 px-4">
        <button 
          onClick={prevWeek}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Previous week"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-500">
            {weekRange().startFormatted} - {weekRange().endFormatted}
          </span>
          <button 
            onClick={goToToday} 
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1"
          >
            Today
          </button>
        </div>
        
        <button 
          onClick={nextWeek}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Next week"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Days of the week */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays().map((day) => {
          const hasWorkout = !!workoutDaysByDate[day.isoDate];
          const isCompleted = workoutCompletionStatus[day.isoDate];
          const isSelected = day.isoDate === selectedDate;
          const isToday = day.isToday;
          
          return (
            <button
              key={day.isoDate}
              onClick={() => handleDateClick(day.isoDate)}
              className={`
                p-2 flex flex-col items-center justify-center rounded-lg transition-colors
                ${isSelected ? 'bg-indigo-100 border-indigo-500' : 'hover:bg-gray-50'}
                ${isToday ? 'font-bold' : ''}
              `}
            >
              <span className="text-xs font-medium uppercase">{day.dayName}</span>
              <div className={`
                w-8 h-8 flex items-center justify-center rounded-full my-1
                ${isToday ? 'bg-indigo-600 text-white' : ''}
              `}>
                {day.dayNumber}
              </div>
              <div className="h-2 w-2 rounded-full">
                {hasWorkout && (
                  <div className={`
                    h-2 w-2 rounded-full mx-auto
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Current day quick info */}
      {selectedDate && workoutDaysByDate[selectedDate] && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg">{workoutDaysByDate[selectedDate].name}</h3>
            
            <Link 
              href={`/workout/${workoutDaysByDate[selectedDate].id}?date=${selectedDate}`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              {workoutCompletionStatus[selectedDate] ? 'View Workout' : 'Start Workout'}
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {workoutDaysByDate[selectedDate].exercises.length} exercises
          </p>
        </div>
      )}
      
      {/* Rest day or no workout message */}
      {selectedDate && !workoutDaysByDate[selectedDate] && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-lg">Rest Day</h3>
          <p className="text-sm text-gray-500 mt-1">
            No workout scheduled for this day
          </p>
        </div>
      )}
    </div>
  );
} 