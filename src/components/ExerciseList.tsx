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
  
  const renderExerciseCard = (exercise: ExerciseType) => {
    const href = date 
      ? `/exercise/${exercise.id}?date=${date}&workoutId=${workoutDay.id}`
      : `/exercise/${exercise.id}?workoutId=${workoutDay.id}`;
    
    return (
      <Link
        href={href}
        key={exercise.id}
        className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{exercise.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {exercise.sets} sets × {formatReps(exercise.reps)} reps
              {exercise.weight && ` • ${exercise.weight} ${exercise.weightUnit || 'lb'}`}
            </p>
            {exercise.tempo && (
              <p className="text-xs text-gray-500 mt-1">
                Tempo: {formatTempo(exercise.tempo)}
              </p>
            )}
          </div>
          <div className="text-sm rounded-full px-2 py-1 bg-gray-100 text-gray-700">
            {exercise.group}
          </div>
        </div>
        {exercise.notes && (
          <p className="text-xs text-gray-500 mt-2 italic">
            {exercise.notes}
          </p>
        )}
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
      <div key={groupPrefix} className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Group {groupPrefix}
          {exercises[0].rest && ` • Rest: ${exercises[0].rest}s between supersets`}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {sortedExercises.map(renderExerciseCard)}
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