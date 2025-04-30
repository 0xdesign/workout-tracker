'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WorkoutPerformance, ExerciseType } from '@/types/workout';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import * as workoutService from '@/lib/workout-service';

export function RecentWorkouts() {
  const { workoutPlan } = useWorkoutData();
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseTypes, setExerciseTypes] = useState<Record<string, ExerciseType>>({});
  
  useEffect(() => {
    const loadRecentWorkouts = async () => {
      try {
        const performances = await workoutService.getRecentWorkoutPerformances(3);
        setRecentWorkouts(performances);
        
        // Create a map of exercise types for quick lookup
        if (workoutPlan) {
          const exerciseMap: Record<string, ExerciseType> = {};
          workoutPlan.days.forEach(day => {
            day.exercises.forEach(exercise => {
              exerciseMap[exercise.id] = exercise;
            });
          });
          setExerciseTypes(exerciseMap);
        }
      } catch (error) {
        console.error('Error loading recent workouts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecentWorkouts();
  }, [workoutPlan]);
  
  const calculateTotalVolume = (performance: WorkoutPerformance): number => {
    return performance.exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.weight * 
        exercise.completedReps.reduce((acc, reps) => acc + reps, 0);
      return total + exerciseVolume;
    }, 0);
  };
  
  const getWorkoutName = (workoutDayId: string): string => {
    if (!workoutPlan) return 'Workout';
    
    const workoutDay = workoutPlan.days.find(day => day.id === workoutDayId);
    return workoutDay ? workoutDay.name : 'Workout';
  };
  
  const getCompletionPercentage = (performance: WorkoutPerformance): number => {
    const totalExercises = performance.exercises.length;
    if (totalExercises === 0) return 0;
    
    const completedExercises = performance.exercises.filter(ex => 
      ex.completedSets === ex.targetSets
    ).length;
    
    return Math.round((completedExercises / totalExercises) * 100);
  };
  
  if (loading) {
    return (
      <div className="animate-pulse bg-[#2D2D2D] rounded-lg p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-gray-400">Loading recent workouts...</p>
      </div>
    );
  }
  
  if (recentWorkouts.length === 0) {
    return (
      <div className="bg-[#2D2D2D] rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-white mb-2">No Workouts Completed Yet</h3>
        <p className="text-gray-400 mb-4">Complete your first workout to see statistics here</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Recent Workouts</h2>
      
      <div className="grid gap-4">
        {recentWorkouts.map((workout, index) => {
          const totalVolume = calculateTotalVolume(workout);
          const completionPercentage = getCompletionPercentage(workout);
          const workoutName = getWorkoutName(workout.workoutDayId);
          const formattedDate = new Date(workout.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          
          // Count exercises by muscle group
          const muscleGroups: Record<string, number> = {};
          workout.exercises.forEach(exercise => {
            const exerciseType = exerciseTypes[exercise.exerciseId];
            if (exerciseType && exerciseType.group) {
              // Use the first character as the group (A, B, C, etc.)
              const group = exerciseType.group.charAt(0);
              muscleGroups[group] = (muscleGroups[group] || 0) + 1;
            }
          });
          
          return (
            <Link 
              key={workout.id} 
              href={`/workout/${workout.workoutDayId}/summary?date=${workout.date}`}
              className="block"
            >
              <div 
                className="bg-[#383838] rounded-lg p-4 hover:bg-[#3D3D3D] transition-all duration-200 border border-[#3D3D3D] transform hover:scale-[1.01]"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease forwards' 
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white text-lg">{workoutName}</h3>
                    <p className="text-gray-400 text-sm">{formattedDate}</p>
                  </div>
                  <div className="bg-[#2D2D2D] px-2 py-1 rounded-md">
                    <span className="text-sm font-medium text-[#35C759]">{completionPercentage}% Complete</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-[#2D2D2D] p-2 rounded-md">
                    <p className="text-xs text-gray-400">Volume</p>
                    <p className="text-white font-bold">{Math.round(totalVolume).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#2D2D2D] p-2 rounded-md">
                    <p className="text-xs text-gray-400">Exercises</p>
                    <p className="text-white font-bold">{workout.exercises.length}</p>
                  </div>
                  <div className="bg-[#2D2D2D] p-2 rounded-md">
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="text-white font-bold">{workout.duration || '—'} min</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex">
                    {Object.keys(muscleGroups).map(group => (
                      <div 
                        key={group} 
                        className="w-6 h-6 rounded-full flex items-center justify-center mr-1 text-xs font-bold"
                        style={{ 
                          backgroundColor: group === 'A' ? '#FC2B4E' : 
                                         group === 'B' ? '#35C759' : 
                                         group === 'C' ? '#FDBC40' : '#5E5CE6'
                        }}
                      >
                        {group}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center text-[#FC2B4E] text-xs">
                    <span className="mr-1">View Summary</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 