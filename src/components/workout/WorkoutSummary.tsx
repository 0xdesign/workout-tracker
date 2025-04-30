'use client';

import React, { useMemo } from 'react';
import { WorkoutPerformance, ExercisePerformance, ExerciseType } from '@/types/workout';

interface WorkoutSummaryProps {
  workoutPerformance: WorkoutPerformance;
  exerciseTypes: ExerciseType[];
  previousPerformances?: WorkoutPerformance[];
  onViewWorkoutDetails?: () => void;
}

interface MuscleGroup {
  name: string;
  percentage: number;
}

export function WorkoutSummary({
  workoutPerformance,
  exerciseTypes,
  previousPerformances = [],
  onViewWorkoutDetails
}: WorkoutSummaryProps) {
  // Calculate workout stats
  const stats = useMemo(() => {
    // Calculate completion percentage
    const totalExercises = workoutPerformance.exercises.length;
    const completedExercises = workoutPerformance.exercises.filter(ex => 
      ex.completedSets === ex.targetSets
    ).length;
    const completionPercentage = Math.round((completedExercises / totalExercises) * 100);
    
    // Calculate total volume (weight × reps × sets)
    let totalVolume = 0;
    workoutPerformance.exercises.forEach(ex => {
      const volume = ex.weight * 
        ex.completedReps.reduce((acc, reps) => acc + reps, 0);
      totalVolume += volume;
    });
    
    // Identify personal records
    const personalRecords = workoutPerformance.exercises.filter(current => {
      if (previousPerformances.length === 0) return false;
      
      // Find the same exercise in previous performances
      const previousExercises = previousPerformances.flatMap(perf => 
        perf.exercises.filter(ex => ex.exerciseId === current.exerciseId)
      );
      
      if (previousExercises.length === 0) return false;
      
      // Check if current weight is greater than any previous weight
      const maxPreviousWeight = Math.max(...previousExercises.map(ex => ex.weight));
      if (current.weight > maxPreviousWeight) return true;
      
      // Check if current volume is greater than any previous volume
      const currentVolume = current.weight * 
        current.completedReps.reduce((acc, reps) => acc + reps, 0);
      const maxPreviousVolume = Math.max(
        ...previousExercises.map(ex => 
          ex.weight * ex.completedReps.reduce((acc, reps) => acc + reps, 0)
        )
      );
      
      return currentVolume > maxPreviousVolume;
    });
    
    return {
      completionPercentage,
      totalVolume: Math.round(totalVolume),
      personalRecords: personalRecords.length,
      duration: workoutPerformance.duration || 0
    };
  }, [workoutPerformance, previousPerformances]);
  
  // Calculate muscle groups targeted
  const muscleGroups = useMemo(() => {
    // Create a map to count exercises per muscle group
    const groupMap: Record<string, number> = {};
    let totalCount = 0;
    
    workoutPerformance.exercises.forEach(ex => {
      const exerciseType = exerciseTypes.find(type => type.id === ex.exerciseId);
      if (exerciseType && exerciseType.group) {
        const group = exerciseType.group;
        groupMap[group] = (groupMap[group] || 0) + 1;
        totalCount++;
      }
    });
    
    // Convert to percentage
    return Object.entries(groupMap).map(([name, count]) => ({
      name,
      percentage: Math.round((count / totalCount) * 100)
    })).sort((a, b) => b.percentage - a.percentage);
  }, [workoutPerformance.exercises, exerciseTypes]);
  
  // Formatted date
  const formattedDate = new Date(workoutPerformance.date).toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Find workout name
  const workoutName = useMemo(() => {
    // Try to find the workout day name
    const exerciseType = exerciseTypes.find(type => type.id === workoutPerformance.exercises[0]?.exerciseId);
    if (exerciseType) {
      return `${workoutPerformance.workoutDayId} Workout`;
    }
    return "Workout Session";
  }, [workoutPerformance, exerciseTypes]);
  
  return (
    <div className="bg-[#2D2D2D] rounded-xl p-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-full bg-[#383838]">
          <svg className="w-5 h-5 text-[#FC2B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.24 12.24a6 6 0 0 1-8.49 8.49L5 14l-1-1 1-1 6.37-6.37a6 6 0 0 1 8.49 8.49z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.13 9.13l2.3 2.3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 18.88l-2.3-2.3" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            {workoutName}
          </h3>
          <p className="text-sm text-gray-400">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col justify-between p-4 border border-[#383838] rounded-md">
          <svg className="w-4 h-4 mb-3 text-[#FC2B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h2 className="text-2xl font-medium text-white">
            {stats.totalVolume.toLocaleString()}
          </h2>
          <p className="text-xs text-gray-400">
            Total Volume
          </p>
        </div>
        <div className="flex flex-col justify-between p-4 border border-[#383838] rounded-md">
          <svg className="w-4 h-4 mb-3 text-[#35C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-medium text-white">
            {stats.duration}
          </h2>
          <p className="text-xs text-gray-400">
            Duration (min)
          </p>
        </div>
        <div className="flex flex-col justify-between p-4 border border-[#383838] rounded-md">
          <svg className="w-4 h-4 mb-3 text-[#FC2B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h2 className="text-2xl font-medium text-white">
            {stats.personalRecords}
          </h2>
          <p className="text-xs text-gray-400">
            Personal Records
          </p>
        </div>
      </div>

      {/* Muscle Groups */}
      {muscleGroups.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="flex items-center gap-2 text-sm font-medium text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Muscle Groups Targeted
            </h4>
          </div>
          <div className="space-y-3">
            {muscleGroups.map((group) => (
              <div key={group.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{group.name}</span>
                  <span className="text-gray-400">{group.percentage}%</span>
                </div>
                <div className="h-2 bg-[#383838] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${group.percentage}%`, 
                      backgroundColor: group.name.match(/chest|back|shoulders/i) 
                        ? '#FC2B4E' 
                        : '#35C759' 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="my-4 h-px bg-[#383838]" />

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-medium text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Exercises
          </h4>
          <span className="px-2 py-1 text-xs font-medium bg-[#35C759] text-white rounded-full">
            {stats.completionPercentage}% Complete
          </span>
        </div>

        <div className="space-y-2">
          {workoutPerformance.exercises.map((exercise) => {
            const exerciseType = exerciseTypes.find(type => type.id === exercise.exerciseId);
            const isCompleted = exercise.completedSets === exercise.targetSets;
            
            // Check if this is a personal record
            const isPersonalRecord = previousPerformances.length > 0 && 
              previousPerformances.every(prev => {
                const prevExercise = prev.exercises.find(ex => ex.exerciseId === exercise.exerciseId);
                return !prevExercise || exercise.weight > prevExercise.weight;
              });
            
            // Calculate volume for this exercise
            const volume = exercise.weight * 
              exercise.completedReps.reduce((acc, reps) => acc + reps, 0);
            
            return (
              <div
                key={exercise.exerciseId}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#383838] border border-[#3D3D3D]"
              >
                <div className="w-5 h-5">
                  {isCompleted ? (
                    <svg className="w-5 h-5 text-[#35C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className={`text-sm ${isCompleted ? 'text-white' : 'text-gray-300'}`}>
                      {exerciseType?.name || 'Unknown Exercise'}
                    </span>
                    {isPersonalRecord && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-[#FC2B4E] text-white rounded-sm">
                        PR
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {exercise.completedSets}/{exercise.targetSets} sets × {exercise.completedReps.join(', ')} reps × {exercise.weight}{exercise.weightUnit}
                  </span>
                </div>
                <span className="text-sm font-medium text-[#FC2B4E]">
                  {Math.round(volume).toLocaleString()}{exercise.weightUnit}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {onViewWorkoutDetails && (
        <div className="pt-4 mt-4 border-t border-[#383838]">
          <button
            onClick={onViewWorkoutDetails}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
          >
            View Workout Details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 