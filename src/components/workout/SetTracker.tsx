'use client';

import React, { useState } from 'react';
import { ExercisePerformance } from '@/types/workout';

interface SetTrackerProps {
  exercise: {
    id: string;
    name: string;
    sets: number;
    targetReps: number | number[] | string;
  };
  previousPerformance?: ExercisePerformance | null;
  currentPerformance: ExercisePerformance;
  onUpdate: (updatedPerformance: ExercisePerformance) => void;
  onCompleteSet: (setIndex: number) => void;
}

// Hexagon Set Indicator Component
interface HexagonSetIndicatorProps {
  number: number;
  isCompleted: boolean;
  isActive: boolean;
  onClick: () => void;
}

const HexagonSetIndicator: React.FC<HexagonSetIndicatorProps> = ({
  number,
  isCompleted,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative h-12 w-12 flex items-center justify-center transition-all duration-200
        ${isCompleted ? 'scale-105' : 'scale-100'}
      `}
    >
      <svg
        viewBox="0 0 100 100"
        className={`
          absolute inset-0 w-full h-full transition-colors duration-300
          ${isCompleted ? 'text-[#35C759]' : isActive ? 'text-[#FC2B4E]' : 'text-[#383838]'}
        `}
      >
        <polygon
          points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"
          fill="currentColor"
          stroke={isActive && !isCompleted ? 'white' : 'transparent'}
          strokeWidth="3"
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        {isCompleted ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-white font-bold">{number}</span>
        )}
      </div>
    </button>
  );
};

export function SetTracker({
  exercise,
  previousPerformance,
  currentPerformance,
  onUpdate,
  onCompleteSet
}: SetTrackerProps) {
  const [activeSet, setActiveSet] = useState<number>(
    Math.min(currentPerformance.completedSets, exercise.sets - 1)
  );
  
  // Convert target reps to array for consistency
  const targetRepsArray = Array.isArray(exercise.targetReps) 
    ? exercise.targetReps 
    : Array(exercise.sets).fill(
        typeof exercise.targetReps === 'number' 
          ? exercise.targetReps 
          : parseInt(exercise.targetReps) || 10
      );
    
  // Handle weight change
  const handleWeightChange = (value: number) => {
    onUpdate({
      ...currentPerformance,
      weight: Math.max(0, value)
    });
  };
  
  // Handle reps change for a specific set
  const handleRepsChange = (setIndex: number, value: number) => {
    const newCompletedReps = [...(currentPerformance.completedReps || [])];
    // Ensure array is at least as long as the current index + 1
    while (newCompletedReps.length < setIndex + 1) {
      newCompletedReps.push(0);
    }
    newCompletedReps[setIndex] = Math.max(0, value);
    
    onUpdate({
      ...currentPerformance,
      completedReps: newCompletedReps
    });
  };
  
  // Mark a set as complete and move to next set
  const handleSetComplete = (setIndex: number) => {
    onCompleteSet(setIndex);
    
    // Move to next set if available
    if (setIndex < exercise.sets - 1) {
      setActiveSet(setIndex + 1);
    }
  };
  
  // Calculate if there's an increase/decrease from previous performance
  const getWeightDifference = () => {
    if (!previousPerformance) return null;
    
    const diff = currentPerformance.weight - previousPerformance.weight;
    return {
      value: Math.abs(diff),
      direction: diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'same',
      percentage: previousPerformance.weight > 0 
        ? Math.round((diff / previousPerformance.weight) * 100) 
        : 0
    };
  };
  
  const weightDiff = getWeightDifference();
  
  return (
    <div className="bg-[#2D2D2D] rounded-xl p-4">
      {/* Weight Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-sm font-bold">WEIGHT</span>
          {weightDiff && weightDiff.direction !== 'same' && (
            <span className={`text-xs font-medium ${weightDiff.direction === 'increase' ? 'text-[#35C759]' : 'text-[#FC2B4E]'}`}>
              {weightDiff.direction === 'increase' ? '+' : '-'}{weightDiff.value} {currentPerformance.weightUnit} 
              ({weightDiff.direction === 'increase' ? '+' : '-'}{weightDiff.percentage}%)
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleWeightChange(currentPerformance.weight - 5)}
            className="w-12 h-12 bg-[#383838] rounded-xl flex items-center justify-center text-white font-bold text-2xl"
            aria-label="Decrease weight"
          >
            -
          </button>
          
          <div className="flex items-center">
            <span className="text-white text-4xl font-bold">{currentPerformance.weight}</span>
            <span className="text-white text-xl ml-1">{currentPerformance.weightUnit}</span>
          </div>
          
          <button
            onClick={() => handleWeightChange(currentPerformance.weight + 5)}
            className="w-12 h-12 bg-[#383838] rounded-xl flex items-center justify-center text-white font-bold text-2xl"
            aria-label="Increase weight"
          >
            +
          </button>
        </div>
        
        {previousPerformance && (
          <div className="text-gray-400 text-xs text-center mt-2">
            Previous: {previousPerformance.weight} {previousPerformance.weightUnit}
          </div>
        )}
      </div>
      
      {/* Sets Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-sm font-bold">SETS</span>
          <span className="text-gray-400 text-xs">
            {currentPerformance.completedSets}/{exercise.sets} completed
          </span>
        </div>
        
        <div className="flex justify-center space-x-3 pb-2">
          {Array.from({length: exercise.sets}).map((_, index) => {
            const isCompleted = index < currentPerformance.completedSets;
            const isActive = activeSet === index;
            
            return (
              <HexagonSetIndicator
                key={index}
                number={index + 1}
                isCompleted={isCompleted}
                isActive={isActive}
                onClick={() => setActiveSet(index)}
              />
            );
          })}
        </div>
      </div>
      
      {/* Active Set */}
      <div className="bg-[#383838] rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-sm font-bold">SET {activeSet + 1}</span>
          <span className="text-gray-400 text-xs">
            Target: {targetRepsArray[activeSet]} reps
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => handleRepsChange(activeSet, (currentPerformance.completedReps[activeSet] || 0) - 1)}
            className="w-12 h-12 bg-[#2D2D2D] rounded-xl flex items-center justify-center text-white font-bold text-2xl"
            aria-label="Decrease reps"
          >
            -
          </button>
          
          <div className="text-white text-4xl font-bold">
            {currentPerformance.completedReps[activeSet] || 0}
          </div>
          
          <button
            onClick={() => handleRepsChange(activeSet, (currentPerformance.completedReps[activeSet] || 0) + 1)}
            className="w-12 h-12 bg-[#2D2D2D] rounded-xl flex items-center justify-center text-white font-bold text-2xl"
            aria-label="Increase reps"
          >
            +
          </button>
        </div>
        
        <button
          onClick={() => handleSetComplete(activeSet)}
          className={`
            w-full py-3 rounded-xl text-white font-bold
            ${activeSet < currentPerformance.completedSets 
              ? 'bg-gray-600' 
              : 'bg-[#FC2B4E]'}
          `}
          disabled={activeSet < currentPerformance.completedSets}
        >
          {activeSet < currentPerformance.completedSets ? 'COMPLETED' : 'COMPLETE SET'}
        </button>
      </div>
      
      {/* Previous Performance Reference */}
      {previousPerformance && (
        <div className="bg-[#383838] rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm font-bold">PREVIOUS</span>
            <span className="text-gray-400 text-xs">
              {previousPerformance.workoutDate 
                ? new Date(previousPerformance.workoutDate).toLocaleDateString() 
                : new Date(previousPerformance.timestamp).toLocaleDateString()}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#2D2D2D] p-2 rounded-lg">
              <div className="text-gray-400 text-xs">Weight</div>
              <div className="text-white font-bold">
                {previousPerformance.weight} {previousPerformance.weightUnit}
              </div>
            </div>
            
            <div className="bg-[#2D2D2D] p-2 rounded-lg">
              <div className="text-gray-400 text-xs">Reps (Set {activeSet + 1})</div>
              <div className="text-white font-bold">
                {previousPerformance.completedReps[activeSet] || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 