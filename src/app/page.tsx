'use client';

import { useState } from 'react';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';

export default function Home() {
  const { workoutDaysByDate, workoutCompletionStatus, isLoading, error } = useWorkoutData();
  
  const handleDateSelect = (date: string) => {
    // Handle date selection here if needed in the future
    console.log(`Date selected: ${date}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600">Loading your workout plan...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-4 bg-red-50 text-red-800 rounded-lg max-w-lg">
          <h2 className="text-lg font-medium mb-2">Error Loading Workout Plan</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col p-4 md:p-6">
      <div className="max-w-3xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Workout Tracker</h1>
          <p className="text-gray-600 mt-1">Track your progress and stay on plan</p>
        </header>
        
        <section className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">Weekly Schedule</h2>
          <WeeklyCalendar 
            workoutDaysByDate={workoutDaysByDate}
            workoutCompletionStatus={workoutCompletionStatus}
            onSelectDate={handleDateSelect}
          />
        </section>
        
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-xl font-medium mb-4">Progress Overview</h2>
            <p className="text-gray-600">Coming soon: Charts and stats to track your performance</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-xl font-medium mb-4">AI Coach</h2>
            <p className="text-gray-600 mb-4">Ask for workout adjustments, form tips, or progression advice</p>
            <a href="/coach" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full md:w-auto inline-block text-center">
              Talk to Coach
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
