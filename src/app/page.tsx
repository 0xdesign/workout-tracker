'use client';

import { useState, useEffect } from 'react';
import { CalendarStrip } from '@/components/CalendarStrip';
import { WorkoutCard } from '@/components/WorkoutCard';
import { RecentWorkouts } from '@/components/RecentWorkouts';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';

export default function Home() {
  const { workoutDaysByDate, workoutCompletionStatus, isLoading, error } = useWorkoutData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<any | null>(null);
  const [todayDate, setTodayDate] = useState<string>('');
  
  // Set today's date and workout on initial load
  useEffect(() => {
    if (!isLoading && workoutDaysByDate) {
      const today = new Date().toISOString().split('T')[0];
      setTodayDate(today);
      setTodayWorkout(workoutDaysByDate[today] || null);
    }
  }, [isLoading, workoutDaysByDate]);
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    console.log(`Date selected: ${date}`);
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
        <header className="mb-6 animate-fadeIn">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Workout Tracker</h1>
          <p className="text-gray-300 mt-1">Track your progress and stay on plan</p>
        </header>
        
        {/* Today's Workout (Hero Section) */}
        {todayWorkout && (
          <section className="mb-6 animate-fadeIn" style={{ animationDelay: '100ms' }}>
            <h2 className="text-lg font-bold mb-3 text-white">Today's Workout</h2>
            <WorkoutCard 
              workout={todayWorkout} 
              date={todayDate}
              isCompleted={workoutCompletionStatus[todayDate]}
              workoutType={getWorkoutType(todayWorkout.name)}
            />
          </section>
        )}
        
        {/* Calendar Strip */}
        <section className="mb-6 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-bold mb-3 text-white">Weekly Schedule</h2>
          <CalendarStrip 
            workoutDaysByDate={workoutDaysByDate}
            workoutCompletionStatus={workoutCompletionStatus}
            onSelectDate={handleDateSelect}
          />
        </section>
        
        {/* Recent Workouts */}
        <section className="mb-6 animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <RecentWorkouts />
        </section>
        
        {/* Stats and AI Coach */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn" style={{ animationDelay: '400ms' }}>
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
