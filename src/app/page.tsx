'use client';

import { useState, useEffect } from 'react';
import { CalendarStrip } from '@/components/CalendarStrip';
import { WorkoutCard } from '@/components/WorkoutCard';
import { RecentWorkouts } from '@/components/RecentWorkouts';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';

export default function Home() {
  const { workoutDaysByDate, workoutCompletionStatus, isLoading, error } = useWorkoutData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);
  const [todayDate, setTodayDate] = useState<string>('');
  
  // Set today's date and workout on initial load
  useEffect(() => {
    if (!isLoading && workoutDaysByDate) {
      const today = new Date().toISOString().split('T')[0];
      console.log(`Initial load - Today: ${today}, Available dates:`, Object.keys(workoutDaysByDate).length);
      setTodayDate(today);
      setSelectedDate(today);
      setSelectedWorkout(workoutDaysByDate[today] || null);
    }
  }, [isLoading, workoutDaysByDate]);
  
  const handleDateSelect = (date: string) => {
    console.log(`Date selected: ${date}`);
    console.log(`Workout available for selected date: ${!!workoutDaysByDate[date]}`);
    if (workoutDaysByDate[date]) {
      console.log(`Workout name: ${workoutDaysByDate[date].name}`);
    }
    
    setSelectedDate(date);
    // Update the selected workout based on the selected date
    const workout = workoutDaysByDate[date] || null;
    console.log('Setting selected workout:', workout);
    setSelectedWorkout(workout);
  };
  
  // Helper function to determine workout type based on name
  const getWorkoutType = (workoutName: string): 'strength' | 'cardio' | 'flexibility' | 'mixed' => {
    const name = workoutName.toLowerCase();
    if (name.includes('cardio') || name.includes('run') || name.includes('bike')) {
      return 'cardio';
    } else if (name.includes('yoga') || name.includes('stretch') || name.includes('mobility')) {
      return 'flexibility';
    } else if (name.includes('full') || name.includes('circuit')) {
      return 'mixed';
    }
    return 'strength'; // default
  };
  
  // Debug effect to track selected workout changes
  useEffect(() => {
    console.log('Selected workout updated:', selectedWorkout?.name || 'None');
  }, [selectedWorkout]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#1F1F1F] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FC2B4E]"></div>
        <p className="mt-4 text-gray-300">Loading your workout plan...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#1F1F1F] text-white">
        <div className="p-4 bg-[#2D2D2D] text-white rounded-lg max-w-lg border border-[#FC2B4E]">
          <h2 className="text-lg font-bold mb-2">Error Loading Workout Plan</h2>
          <p className="text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#FC2B4E] text-white rounded-lg hover:bg-[#E02646] transition-colors font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col p-4 md:p-6 bg-[#1F1F1F] text-white">
      <div className="max-w-3xl mx-auto w-full">
        {/* Calendar Strip moved to the top */}
        <section className="mb-6 animate-fadeIn">
          <CalendarStrip 
            workoutDaysByDate={workoutDaysByDate}
            workoutCompletionStatus={workoutCompletionStatus}
            onSelectDate={handleDateSelect}
            selectedDate={selectedDate}
          />
        </section>
        
        {/* Selected Day Workout (if any) */}
        {selectedDate && selectedWorkout && (
          <section className="mb-6 animate-fadeIn">
            <div className="bg-[#2D2D2D] rounded-lg p-4">
              <h2 className="text-xl font-bold mb-3 text-white">{selectedWorkout.name}</h2>
              <p className="text-gray-300 mb-3">
                {selectedWorkout.exercises.length} exercises
              </p>
              <a 
                href={`/workout/${selectedWorkout.id}?date=${selectedDate}`}
                className="px-4 py-2 bg-[#FC2B4E] text-white rounded-lg hover:bg-[#E02646] transition-colors inline-block text-sm font-bold"
              >
                {workoutCompletionStatus[selectedDate] ? 'View Workout' : 'Start Workout'}
              </a>
            </div>
          </section>
        )}
        
        {/* Rest Day Message */}
        {selectedDate && !selectedWorkout && (
          <section className="mb-6 animate-fadeIn">
            <div className="bg-[#2D2D2D] rounded-lg p-4">
              <h2 className="text-xl font-bold mb-3 text-white">Rest Day</h2>
              <p className="text-gray-300">
                No workout scheduled for this day. Take time to recover and prepare for your next session.
              </p>
            </div>
          </section>
        )}
        
        {/* Recent Workouts */}
        <section className="mb-6 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <RecentWorkouts />
        </section>
        
        {/* Stats and AI Coach */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <div className="bg-[#2D2D2D] rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow transform hover:scale-[1.01] duration-200">
            <h2 className="text-xl font-bold mb-4 text-white">Progress Overview</h2>
            <div className="flex items-center justify-center h-32 rounded-lg bg-[#383838] text-center p-4">
              <p className="text-gray-300">Coming soon: Charts and stats to track your performance</p>
            </div>
          </div>
          
          <div className="bg-[#2D2D2D] rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow transform hover:scale-[1.01] duration-200">
            <h2 className="text-xl font-bold mb-4 text-white">AI Coach</h2>
            <p className="text-gray-300 mb-4">Ask for workout adjustments, form tips, or progression advice</p>
            <a 
              href="/coach" 
              className="px-4 py-3 bg-[#FC2B4E] text-white rounded-lg hover:bg-[#E02646] transition-colors w-full md:w-auto inline-block text-center font-bold"
            >
              Talk to Coach
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
