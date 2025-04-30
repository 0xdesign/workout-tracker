'use client';

import { useState, useEffect, useRef } from 'react';
import { useWeekNavigation } from '@/hooks/use-week-navigation';
import { WorkoutDay } from '@/types/workout';
import Link from 'next/link';

interface CalendarStripProps {
  workoutDaysByDate?: Record<string, WorkoutDay>;
  workoutCompletionStatus?: Record<string, boolean>;
  onSelectDate?: (date: string) => void;
  selectedDate?: string | null;
}

export function CalendarStrip({
  workoutDaysByDate = {},
  workoutCompletionStatus = {},
  onSelectDate,
  selectedDate: externalSelectedDate = null
}: CalendarStripProps) {
  const { weekDays, nextWeek, prevWeek, goToToday, weekRange } = useWeekNavigation();
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  // Use the external selectedDate if provided, otherwise use internal state
  const selectedDate = externalSelectedDate !== null ? externalSelectedDate : internalSelectedDate;
  
  // Initialize with today's date if no external selectedDate is provided
  useEffect(() => {
    if (externalSelectedDate === null) {
      const today = new Date().toISOString().split('T')[0];
      setInternalSelectedDate(today);
      onSelectDate?.(today);
    }
    
    // Scroll to today on initial render
    scrollToCurrentDay();
  }, [externalSelectedDate, onSelectDate]);
  
  // Scroll to the currently selected day when week changes
  useEffect(() => {
    scrollToCurrentDay();
  }, [weekDays]);
  
  const scrollToCurrentDay = () => {
    if (!scrollContainerRef.current) return;
    
    // First try to scroll to selected date
    if (selectedDate) {
      const selectedElement = scrollContainerRef.current.querySelector(`[data-date="${selectedDate}"]`);
      if (selectedElement) {
        const scrollPosition = selectedElement.getBoundingClientRect().left - 
          scrollContainerRef.current.getBoundingClientRect().left - 
          (scrollContainerRef.current.offsetWidth / 2) + 
          (selectedElement as HTMLElement).offsetWidth / 2;
        
        scrollContainerRef.current.scrollTo({
          left: scrollContainerRef.current.scrollLeft + scrollPosition,
          behavior: 'smooth'
        });
        return;
      }
    }
    
    // Fallback to scrolling to today
    const todayElement = scrollContainerRef.current.querySelector('[data-today="true"]');
    if (todayElement) {
      const scrollPosition = todayElement.getBoundingClientRect().left - 
        scrollContainerRef.current.getBoundingClientRect().left - 
        (scrollContainerRef.current.offsetWidth / 2) + 
        (todayElement as HTMLElement).offsetWidth / 2;
      
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollLeft + scrollPosition,
        behavior: 'smooth'
      });
    }
  };
  
  const handleDateClick = (isoDate: string) => {
    console.log(`CalendarStrip: Date clicked: ${isoDate}`);
    if (externalSelectedDate === null) {
      setInternalSelectedDate(isoDate);
    }
    onSelectDate?.(isoDate);
  };
  
  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // Swipe threshold (50px)
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left - next week
        nextWeek();
      } else {
        // Swipe right - previous week
        prevWeek();
      }
    }
    
    setTouchStartX(null);
  };
  
  return (
    <div className="w-full max-w-full bg-[#1F1F1F] rounded-lg p-3 text-white">
      {/* Scrollable days strip - Previous header with month and navigation removed */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto no-scrollbar py-1 -mx-1 px-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {weekDays().map((day) => {
          const hasWorkout = !!workoutDaysByDate[day.isoDate];
          const isCompleted = workoutCompletionStatus[day.isoDate];
          const isSelected = day.isoDate === selectedDate;
          const isToday = day.isToday;
          
          return (
            <button
              key={day.isoDate}
              data-today={isToday}
              data-date={day.isoDate}
              onClick={() => handleDateClick(day.isoDate)}
              className={`
                flex-shrink-0 w-16 h-16 mx-1 flex flex-col items-center justify-center rounded-xl transition-all
                ${isSelected 
                  ? isToday 
                    ? 'bg-[#FC2B4E] text-white' 
                    : 'bg-[#2D2D2D] border border-[#FC2B4E] text-white' 
                  : isToday 
                    ? 'bg-[#2D2D2D] text-white' 
                    : 'bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white'}
              `}
            >
              <span className="text-xs font-bold uppercase mb-1">{day.dayName}</span>
              <span className="text-lg font-bold">{day.dayNumber}</span>
              
              {/* Status indicator dot */}
              <div className="h-1.5 mt-1">
                {hasWorkout && (
                  <div className={`
                    h-1.5 w-1.5 rounded-full 
                    ${isCompleted ? 'bg-[#35C759]' : 'bg-white'}
                  `} />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Selected day info */}
      {selectedDate && workoutDaysByDate[selectedDate] && (
        <div className="mt-3 p-3 bg-[#2D2D2D] rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">
              {workoutDaysByDate[selectedDate].name}
            </h3>
            
            <Link 
              href={`/workout/${workoutDaysByDate[selectedDate].id}?date=${selectedDate}`}
              className="px-4 py-1.5 bg-[#FC2B4E] text-white rounded-lg hover:bg-[#E02646] transition-colors text-sm font-bold"
            >
              {workoutCompletionStatus[selectedDate] ? 'View Workout' : 'Start Workout'}
            </Link>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            {workoutDaysByDate[selectedDate].exercises.length} exercises
          </p>
        </div>
      )}
      
      {/* Rest day message */}
      {selectedDate && !workoutDaysByDate[selectedDate] && (
        <div className="mt-3 p-3 bg-[#2D2D2D] rounded-lg">
          <h3 className="font-bold text-lg text-white">Rest Day</h3>
          <p className="text-sm text-gray-300 mt-1">
            No workout scheduled for this day
          </p>
        </div>
      )}
      
      {/* Custom CSS for hiding scrollbar but keeping functionality */}
      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
} 