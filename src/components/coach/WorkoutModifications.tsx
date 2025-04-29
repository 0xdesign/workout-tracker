import React, { useState } from 'react';
import { WorkoutCoachResponse, WorkoutPerformance } from '@/types/workout';
import * as workoutService from '@/lib/workout-service';

interface WorkoutModificationsProps {
  modifications: WorkoutCoachResponse;
  workout: WorkoutPerformance;
  onApply: () => void;
  onCancel: () => void;
}

export default function WorkoutModifications({ 
  modifications, 
  workout, 
  onApply, 
  onCancel 
}: WorkoutModificationsProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChanges, setSelectedChanges] = useState<Record<string, Record<string, boolean>>>({});
  
  // Initialize selected changes state
  useState(() => {
    const initialSelections: Record<string, Record<string, boolean>> = {};
    
    modifications.modifications.forEach(mod => {
      initialSelections[mod.exerciseId] = {};
      mod.changes.forEach(change => {
        initialSelections[mod.exerciseId][change.parameter] = true;
      });
    });
    
    setSelectedChanges(initialSelections);
  });
  
  // Toggle selection for a specific change
  const toggleSelection = (exerciseId: string, parameter: string) => {
    setSelectedChanges(prev => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || {}),
        [parameter]: !prev[exerciseId]?.[parameter]
      }
    }));
  };
  
  // Apply selected modifications to the workout
  const handleApplyModifications = async () => {
    setIsApplying(true);
    setError(null);
    
    try {
      // Create a copy of the workout to modify
      const modifiedWorkout = JSON.parse(JSON.stringify(workout)) as WorkoutPerformance;
      
      // Find and apply each selected change
      modifications.modifications.forEach(mod => {
        const exerciseIndex = modifiedWorkout.exercises.findIndex(ex => ex.exerciseId === mod.exerciseId);
        
        if (exerciseIndex !== -1) {
          mod.changes.forEach(change => {
            // Only apply if selected
            if (selectedChanges[mod.exerciseId]?.[change.parameter]) {
              switch (change.parameter) {
                case 'weight':
                  modifiedWorkout.exercises[exerciseIndex].weight = Number(change.recommendedValue);
                  break;
                case 'sets':
                  modifiedWorkout.exercises[exerciseIndex].targetSets = Number(change.recommendedValue);
                  break;
                case 'reps':
                  if (Array.isArray(change.recommendedValue)) {
                    modifiedWorkout.exercises[exerciseIndex].targetReps = change.recommendedValue;
                  } else {
                    // Convert single value to array of same length as current targetReps
                    const currentLength = modifiedWorkout.exercises[exerciseIndex].targetReps.length;
                    modifiedWorkout.exercises[exerciseIndex].targetReps = Array(currentLength).fill(Number(change.recommendedValue));
                  }
                  break;
                case 'tempo':
                  // Tempo might be stored elsewhere, handle accordingly
                  break;
              }
            }
          });
        }
      });
      
      // Apply program adjustments if any and selected
      if (modifications.programAdjustments) {
        // Store program adjustments in a separate system
        // This is a placeholder for future implementation
        console.log('Program adjustments to apply:', modifications.programAdjustments);
      }
      
      // Save the modified workout
      await workoutService.recordWorkoutPerformance(modifiedWorkout);
      
      // Notify parent component
      onApply();
    } catch (err) {
      console.error('Error applying modifications:', err);
      setError('Failed to apply modifications. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };
  
  // Get the exercise name from the workout
  const getExerciseName = (exerciseId: string): string => {
    // In our data model, we don't directly store the name in the performance data
    // We could fetch this from the workout plan, but for simplicity we'll just show the ID
    return `Exercise ${exerciseId}`;
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Coach Suggested Modifications</h2>
      
      {/* Overall explanation */}
      <div className="bg-indigo-50 p-3 rounded-md mb-4">
        <p className="text-indigo-800 text-sm">{modifications.explanation}</p>
      </div>
      
      {/* Program adjustments */}
      {modifications.programAdjustments && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">Program Adjustments</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex justify-between mb-2">
              <div className="font-medium text-amber-800">
                {modifications.programAdjustments.type.replace('_', ' ')}
              </div>
              <div className="text-sm text-amber-700">
                Duration: {modifications.programAdjustments.duration} week(s)
              </div>
            </div>
            <p className="text-sm text-amber-700">{modifications.programAdjustments.details}</p>
          </div>
        </div>
      )}
      
      {/* Exercise modifications */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-800 mb-2">Exercise Modifications</h3>
        
        {modifications.modifications.length === 0 ? (
          <p className="text-gray-500 text-sm">No specific exercise modifications suggested.</p>
        ) : (
          <div className="space-y-4">
            {modifications.modifications.map(mod => (
              <div key={mod.exerciseId} className="border border-gray-200 rounded-md p-3">
                <h4 className="font-medium text-gray-800 mb-2">{getExerciseName(mod.exerciseId)}</h4>
                
                {mod.changes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No changes suggested.</p>
                ) : (
                  <div className="space-y-2">
                    {mod.changes.map(change => (
                      <div key={`${mod.exerciseId}-${change.parameter}`} className="flex items-start">
                        <input
                          type="checkbox"
                          id={`${mod.exerciseId}-${change.parameter}`}
                          checked={selectedChanges[mod.exerciseId]?.[change.parameter] || false}
                          onChange={() => toggleSelection(mod.exerciseId, change.parameter)}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <label htmlFor={`${mod.exerciseId}-${change.parameter}`} className="text-sm font-medium text-gray-700 flex justify-between">
                            <span className="capitalize">{change.parameter}</span>
                            <span>
                              {change.currentValue} → <span className="font-medium text-indigo-700">{change.recommendedValue}</span>
                            </span>
                          </label>
                          <p className="text-xs text-gray-500 mt-1">{change.reasoning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          disabled={isApplying}
        >
          Cancel
        </button>
        <button
          onClick={handleApplyModifications}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          disabled={isApplying}
        >
          {isApplying ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Applying Changes
            </span>
          ) : (
            'Apply Selected Changes'
          )}
        </button>
      </div>
    </div>
  );
} 