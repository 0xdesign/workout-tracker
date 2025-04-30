'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { WorkoutPerformance, ExerciseType, ExercisePerformance } from '@/types/workout';
import * as workoutService from '@/lib/workout-service';
import { WorkoutSummary } from '@/components/workout/WorkoutSummary';
import { AchievementBadge, AchievementType } from '@/components/workout/AchievementBadge';

interface Achievement {
  type: AchievementType;
  title: string;
  description: string;
  date: string;
  isNew: boolean;
}

export default function WorkoutSummaryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get('date');
  
  const { workoutPlan, isLoading, error } = useWorkoutData();
  const [workoutPerformance, setWorkoutPerformance] = useState<WorkoutPerformance | null>(null);
  const [previousPerformances, setPreviousPerformances] = useState<WorkoutPerformance[]>([]);
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingState, setLoadingState] = useState<'loading' | 'error' | 'success'>('loading');
  
  useEffect(() => {
    const loadData = async () => {
      if (!id || !date) {
        setLoadingState('error');
        return;
      }
      
      try {
        // Get current workout performance
        const performance = await workoutService.getWorkoutPerformance(id, date);
        if (!performance) {
          setLoadingState('error');
          return;
        }
        setWorkoutPerformance(performance);
        
        // Get previous performances for comparison
        const previousPerfs = await workoutService.getWorkoutPerformancesForDay(id);
        // Filter out current performance if it exists in history
        const filteredPerfs = previousPerfs.filter(perf => perf.id !== performance.id);
        setPreviousPerformances(filteredPerfs);
        
        // Collect exercise types
        if (workoutPlan) {
          const allExercises: ExerciseType[] = [];
          workoutPlan.days.forEach(day => {
            day.exercises.forEach(ex => {
              allExercises.push(ex);
            });
          });
          setExerciseTypes(allExercises);
        }
        
        // Detect achievements
        const newAchievements: Achievement[] = [];
        
        // 1. Personal records
        performance.exercises.forEach(ex => {
          const prevExercises = filteredPerfs.flatMap(perf => 
            perf.exercises.filter(e => e.exerciseId === ex.exerciseId)
          );
          
          if (prevExercises.length > 0) {
            const maxPrevWeight = Math.max(...prevExercises.map(e => e.weight));
            if (ex.weight > maxPrevWeight) {
              const exerciseType = workoutPlan?.days
                .flatMap(day => day.exercises)
                .find(e => e.id === ex.exerciseId);
                
              newAchievements.push({
                type: 'personal_record',
                title: 'New Weight Record!',
                description: `You lifted ${ex.weight}${ex.weightUnit} on ${exerciseType?.name || 'an exercise'}, beating your previous record of ${maxPrevWeight}${ex.weightUnit}.`,
                date: new Date().toISOString(),
                isNew: true
              });
            }
          }
        });
        
        // 2. Completion achievement
        if (performance.exercises.every(ex => ex.completedSets === ex.targetSets)) {
          newAchievements.push({
            type: 'completion',
            title: 'Workout Completed!',
            description: 'You completed all exercises in this workout.',
            date: new Date().toISOString(),
            isNew: true
          });
        }
        
        // 3. Volume achievement
        const totalVolume = performance.exercises.reduce((acc: number, ex: ExercisePerformance) => {
          return acc + (ex.weight * ex.completedReps.reduce((sum: number, reps: number) => sum + reps, 0));
        }, 0);
        
        const previousMaxVolume = filteredPerfs.length > 0 
          ? Math.max(...filteredPerfs.map(perf => 
              perf.exercises.reduce((acc: number, ex: ExercisePerformance) => 
                acc + (ex.weight * ex.completedReps.reduce((sum: number, reps: number) => sum + reps, 0)), 0)
            ))
          : 0;
          
        if (totalVolume > previousMaxVolume && previousMaxVolume > 0) {
          newAchievements.push({
            type: 'volume',
            title: 'Volume Record!',
            description: `You moved a total of ${Math.round(totalVolume)} weight units, your new personal best.`,
            date: new Date().toISOString(),
            isNew: true
          });
        }
        
        setAchievements(newAchievements);
        setLoadingState('success');
      } catch (err) {
        console.error('Error loading data:', err);
        setLoadingState('error');
      }
    };
    
    loadData();
  }, [id, date, workoutPlan]);
  
  if (loadingState === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FC2B4E]"></div>
        <p className="mt-4 text-gray-400">Loading workout summary...</p>
      </div>
    );
  }
  
  if (loadingState === 'error' || error || !workoutPerformance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
        <div className="p-4 bg-[#2D2D2D] text-white rounded-lg max-w-lg">
          <h2 className="text-lg font-medium mb-2">Error Loading Workout Summary</h2>
          <p className="text-gray-400">{error || "Workout data not found"}</p>
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
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-2xl font-bold">Workout Summary</h1>
        </div>
        
        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Achievements</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {achievements.map((achievement, index) => (
                <AchievementBadge
                  key={index}
                  type={achievement.type}
                  title={achievement.title}
                  description={achievement.description}
                  date={achievement.date}
                  isNew={achievement.isNew}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Workout Summary */}
        <WorkoutSummary
          workoutPerformance={workoutPerformance}
          exerciseTypes={exerciseTypes}
          previousPerformances={previousPerformances}
          onViewWorkoutDetails={() => router.push(`/workout/${id}?date=${date}`)}
        />
        
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[#FC2B4E] text-white rounded-md hover:bg-[#E02646] inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 