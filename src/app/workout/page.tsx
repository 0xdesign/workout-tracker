'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { WorkoutDay } from '@/types/workout';

export default function WorkoutsPage() {
  const { workoutPlan, workoutDaysByDate, workoutCompletionStatus, isLoading, error } = useWorkoutData();
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<{ date: string; workout: WorkoutDay }[]>([]);
  
  useEffect(() => {
    if (!isLoading && workoutDaysByDate) {
      // Get upcoming workouts (next 2 weeks)
      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 14);
      
      const upcoming: { date: string; workout: WorkoutDay }[] = [];
      
      for (let d = new Date(today); d <= twoWeeksLater; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (workoutDaysByDate[dateStr]) {
          upcoming.push({
            date: dateStr,
            workout: workoutDaysByDate[dateStr]
          });
        }
      }
      
      setUpcomingWorkouts(upcoming);
    }
  }, [isLoading, workoutDaysByDate]);
  
  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short', 
      day: 'numeric'
    }).format(date);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#1F1F1F] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FC2B4E]"></div>
        <p className="mt-4 text-gray-300">Loading workouts...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#1F1F1F] text-white">
        <div className="p-4 bg-[#2D2D2D] text-white rounded-lg max-w-lg border border-[#FC2B4E]">
          <h2 className="text-lg font-bold mb-2">Error Loading Workouts</h2>
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
        <section className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Workouts</h1>
          
          {/* Workout Program Overview */}
          <div className="bg-[#2D2D2D] rounded-lg p-4 md:p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-white">Program Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {workoutPlan?.days.map((day) => (
                <div key={day.id} className="bg-[#383838] rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2">{day.name}</h3>
                  <p className="text-sm text-gray-300">{day.exercises.length} exercises</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Upcoming Workouts */}
          <div className="bg-[#2D2D2D] rounded-lg p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Upcoming Workouts</h2>
            {upcomingWorkouts.length > 0 ? (
              <div className="space-y-4">
                {upcomingWorkouts.map(({ date, workout }) => (
                  <div 
                    key={date} 
                    className="bg-[#383838] rounded-lg p-4 hover:bg-[#424242] transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white">{workout.name}</h3>
                        <p className="text-sm text-gray-300">{formatDate(date)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {workout.exercises.length} exercises
                        </p>
                      </div>
                      <Link 
                        href={`/workout/${workout.id}?date=${date}`}
                        className="px-4 py-2 bg-[#FC2B4E] text-white rounded-lg hover:bg-[#E02646] transition-colors text-sm font-bold"
                      >
                        {workoutCompletionStatus[date] ? 'View Details' : 'Start Workout'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-300 text-center py-8">No upcoming workouts found</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
} 