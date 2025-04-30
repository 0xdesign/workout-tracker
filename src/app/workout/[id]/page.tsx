'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { ExerciseList } from '@/components/ExerciseList';
import { WorkoutDay } from '@/types/workout';
import Link from 'next/link';

interface WorkoutDetailPageProps {
  params: {
    id: string;
  };
}

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get('date');
  
  const { workoutPlan, isLoading, error } = useWorkoutData();
  const [workoutDay, setWorkoutDay] = useState<WorkoutDay | null>(null);
  
  useEffect(() => {
    if (workoutPlan) {
      const day = workoutPlan.days.find(day => day.id === id);
      if (day) {
        setWorkoutDay(day);
      }
    }
  }, [workoutPlan, id]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FC2B4E]"></div>
        <p className="mt-4 text-gray-400">Loading workout details...</p>
      </div>
    );
  }
  
  if (error || !workoutDay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
        <div className="p-4 bg-[#2D2D2D] text-white rounded-lg max-w-lg">
          <h2 className="text-lg font-medium mb-2">Error Loading Workout</h2>
          <p className="text-white">{error || "Workout not found"}</p>
          <Link 
            href="/"
            className="mt-4 px-4 py-2 bg-[#FC2B4E] text-white rounded-md hover:bg-[#E02646] inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-black">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-800 mr-2"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{workoutDay.name}</h1>
          {date && (
            <p className="text-gray-400 text-sm">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>
      </div>
      
      <div className="bg-[#2D2D2D] rounded-lg p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-white">Exercises</h2>
          <div className="text-sm text-gray-400">
            {workoutDay.exercises.length} exercises
          </div>
        </div>
        
        <ExerciseList workoutDay={workoutDay} date={date || undefined} />
      </div>
      
      <div className="flex justify-between mt-6">
        <Link
          href="/"
          className="px-4 py-2 border border-[#383838] rounded-md text-white hover:bg-[#383838] transition-colors"
        >
          Back to Calendar
        </Link>
        
        {date && (
          <Link
            href={`/workout/${id}/summary?date=${date}`}
            className="px-4 py-2 bg-[#FC2B4E] text-white rounded-md hover:bg-[#E02646] transition-colors"
          >
            Complete Workout
          </Link>
        )}
      </div>
    </div>
  );
} 