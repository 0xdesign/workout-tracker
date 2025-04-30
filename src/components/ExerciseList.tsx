'use client';

import React from 'react';
import Link from 'next/link';
import { ExerciseType, WorkoutDay } from '@/types/workout';
import { formatTempo } from '@/utils/workout-parser';

interface ExerciseListProps {
  workoutDay: WorkoutDay;
  date?: string;
}

export function ExerciseList({ workoutDay, date }: ExerciseListProps) {
  // Group exercises by their group prefix (A1, A2, B1, etc.)
  const exercisesByGroup: Record<string, ExerciseType[]> = {};
  
  workoutDay.exercises.forEach(exercise => {
    if (!exercise.group) return;
    
    // Get the group prefix (A, B, C, etc. without the number)
    const groupPrefix = exercise.group.charAt(0);
    
    if (!exercisesByGroup[groupPrefix]) {
      exercisesByGroup[groupPrefix] = [];
    }
    
    exercisesByGroup[groupPrefix].push(exercise);
  });
  
  const formatReps = (reps: number | number[] | string): string => {
    if (Array.isArray(reps)) {
      return `${reps[0]}-${reps[reps.length - 1]}`;
    }
    return String(reps);
  };
  
  const renderExerciseCard = (exercise: ExerciseType, index: number) => {
    const href = date 
      ? `/exercise/${exercise.id}?date=${date}&workoutId=${workoutDay.id}`
      : `/exercise/${exercise.id}?workoutId=${workoutDay.id}`;
    
    return (
      <Link
        href={href}
        key={exercise.id}
        className="block bg-[#383838] rounded-lg p-4 hover:bg-[#3D3D3D] transition-all duration-200 transform hover:scale-[1.02] border border-[#3D3D3D]"
        style={{ 
          animationDelay: `${index * 50}ms`,
          animation: 'fadeInUp 0.5s ease forwards'
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-white">{exercise.name}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {exercise.sets} sets × {formatReps(exercise.reps)} reps
              {exercise.weight && ` • ${exercise.weight} ${exercise.weightUnit || 'lb'}`}
            </p>
            {exercise.tempo && (
              <p className="text-xs text-gray-500 mt-1">
                Tempo: {formatTempo(exercise.tempo)}
              </p>
            )}
          </div>
          <div className="text-sm rounded-full px-2 py-1 bg-[#FC2B4E] text-white">
            {exercise.group}
          </div>
        </div>
        {exercise.notes && (
          <p className="text-xs text-gray-500 mt-2 italic">
            {exercise.notes}
          </p>
        )}
        <div className="mt-2 flex justify-end">
          <div className="flex items-center text-[#35C759] text-xs">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            View Details
          </div>
        </div>
      </Link>
    );
  };
  
  const renderExerciseGroup = (groupPrefix: string, exercises: ExerciseType[]) => {
    // Sort exercises by their group number
    const sortedExercises = [...exercises].sort((a, b) => {
      if (!a.group || !b.group) return 0;
      const aNum = parseInt(a.group.substring(1));
      const bNum = parseInt(b.group.substring(1));
      return aNum - bNum;
    });
    
    return (
      <div key={groupPrefix} className="mb-6 animate-fadeIn" style={{ animationDelay: '100ms' }}>
        <h3 className="text-sm font-medium text-gray-400 mb-2">
          Group {groupPrefix}
          {exercises[0].rest && (
            <span className="ml-2 text-[#FC2B4E]">
              {exercises[0].rest}s rest
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {sortedExercises.map((exercise, index) => renderExerciseCard(exercise, index))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {Object.keys(exercisesByGroup).sort().map(groupPrefix => 
        renderExerciseGroup(groupPrefix, exercisesByGroup[groupPrefix])
      )}
    </div>
  );
} 