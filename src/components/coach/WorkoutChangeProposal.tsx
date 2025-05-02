'use client';

import React, { useState, useEffect } from 'react';
import { WorkoutCoachResponse } from '@/types/workout';
import * as workoutService from '@/lib/workout-service';

interface WorkoutChangeProposalProps {
  modifications: WorkoutCoachResponse;
  onAccept: () => void;
  onReject: () => void;
}

export function WorkoutChangeProposal({
  modifications,
  onAccept,
  onReject
}: WorkoutChangeProposalProps) {
  // State to track hover on action buttons for better visual feedback
  const [acceptHover, setAcceptHover] = useState(false);
  const [rejectHover, setRejectHover] = useState(false);
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>({});
  
  // Fetch exercise names on component mount
  useEffect(() => {
    const fetchExerciseNames = async () => {
      try {
        const plan = await workoutService.getActiveWorkoutPlan();
        if (!plan) return;
        
        const nameMap: Record<string, string> = {};
        plan.days.forEach(day => {
          day.exercises.forEach(exercise => {
            nameMap[exercise.id] = exercise.name;
          });
        });
        setExerciseNames(nameMap);
      } catch (err) {
        console.error('Error fetching exercise names:', err);
      }
    };
    
    fetchExerciseNames();
  }, []);
  
  // Helper to format parameter names for display
  const formatParameter = (param: string): string => {
    switch (param) {
      case 'weight':
        return 'Weight';
      case 'sets':
        return 'Sets';
      case 'reps':
        return 'Repetitions';
      case 'tempo':
        return 'Tempo';
      default:
        return param.charAt(0).toUpperCase() + param.slice(1);
    }
  };
  
  // Helper to determine change type for styling
  const getChangeIndicator = (currentValue: any, recommendedValue: any): { 
    type: 'increase' | 'decrease' | 'same', 
    icon: string,
    color: string,
    description: string
  } => {
    // Handle array values (like rep ranges)
    if (Array.isArray(currentValue) && Array.isArray(recommendedValue)) {
      const currentAvg = currentValue.reduce((a, b) => a + b, 0) / currentValue.length;
      const recAvg = recommendedValue.reduce((a, b) => a + b, 0) / recommendedValue.length;
      
      if (recAvg > currentAvg) {
        return { 
          type: 'increase', 
          icon: '↑', 
          color: 'text-green-500',
          description: 'Increasing repetitions to challenge your muscles more'
        };
      } else if (recAvg < currentAvg) {
        return { 
          type: 'decrease', 
          icon: '↓', 
          color: 'text-amber-500',
          description: 'Reducing repetitions to focus on form and control'
        };
      }
      return { 
        type: 'same', 
        icon: '→', 
        color: 'text-blue-400',
        description: 'Keeping similar repetitions but adjusting approach'
      };
    }
    
    // Handle numeric values
    const current = Number(currentValue);
    const recommended = Number(recommendedValue);
    
    if (!isNaN(current) && !isNaN(recommended)) {
      if (recommended > current) {
        return { 
          type: 'increase', 
          icon: '↑', 
          color: 'text-green-500',
          description: 'Increasing to progress your strength'
        };
      } else if (recommended < current) {
        return { 
          type: 'decrease', 
          icon: '↓', 
          color: 'text-amber-500',
          description: 'Reducing to focus on better form'
        };
      }
    }
    
    // Handle string values or equal values
    return { 
      type: 'same', 
      icon: '→', 
      color: 'text-blue-400',
      description: 'Adjusting approach while maintaining intensity'
    };
  };
  
  // Format value for display
  const formatValue = (value: any, parameter: string): string => {
    if (Array.isArray(value)) {
      return value.join(' - ');
    }
    
    if (parameter === 'weight') {
      return `${value} lbs`;
    }
    
    return String(value);
  };
  
  return (
    <div className="flex flex-col w-full rounded-lg overflow-hidden bg-gradient-to-br from-[#2a2a2a] to-[#222222] border border-[#383838] shadow-lg mb-4">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-[#FC2B4E]/20 text-[#FC2B4E]">
            WORKOUT MODIFICATIONS
          </span>
          <h4 className="font-bold text-sm text-white">Proposed Changes</h4>
        </div>
        
        {/* Overall explanation with improved styling */}
        <div className="bg-[#383838] p-3 rounded-md mb-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-300">{modifications.explanation}</p>
        </div>
        
        <div className="space-y-4">
          {/* Exercise modifications with enhanced visualization */}
          {modifications.modifications.map((mod) => (
            <div
              key={mod.exerciseId}
              className="border border-[#4D4D4D] rounded-md p-4 bg-[#323232]"
            >
              <div className="flex flex-col items-start gap-1 mb-3 pb-2 border-b border-[#4D4D4D]">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-[#FC2B4E]/20 text-[#FC2B4E]">
                    EXERCISE
                  </span>
                  <span className="text-sm font-medium text-white">
                    {exerciseNames[mod.exerciseId] || mod.exerciseId}
                  </span>
                </div>
                {exerciseNames[mod.exerciseId] && mod.exerciseId !== exerciseNames[mod.exerciseId] && (
                  <span className="text-xs text-gray-400">ID: {mod.exerciseId}</span>
                )}
              </div>
              
              {mod.changes.map((change, index) => {
                const changeIndicator = getChangeIndicator(change.currentValue, change.recommendedValue);
                return (
                  <div key={index} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="font-medium text-white text-sm">{formatParameter(change.parameter)}</span>
                        <span className={`ml-2 ${changeIndicator.color} font-bold text-lg`}>{changeIndicator.icon}</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-opacity-20 font-medium" 
                        style={{ 
                          backgroundColor: changeIndicator.type === 'increase' ? 'rgba(34, 197, 94, 0.2)' : 
                                          changeIndicator.type === 'decrease' ? 'rgba(245, 158, 11, 0.2)' : 
                                          'rgba(59, 130, 246, 0.2)',
                          color: changeIndicator.type === 'increase' ? 'rgb(34, 197, 94)' : 
                                changeIndicator.type === 'decrease' ? 'rgb(245, 158, 11)' : 
                                'rgb(59, 130, 246)'
                        }}>
                        {changeIndicator.type.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-300 mb-3 bg-[#262626] p-2 rounded border-l-2 border-gray-500">
                      {change.reasoning}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-[#2a2a2a] rounded border border-[#4D4D4D] transition-all">
                        <span className="block text-[11px] text-gray-400 mb-1">Current Value</span>
                        <span className="text-white font-medium">
                          {formatValue(change.currentValue, change.parameter)}
                        </span>
                      </div>
                      <div className="p-3 bg-[#2a2a2a] rounded border border-l-4 border-[#FC2B4E] shadow-md transition-all">
                        <span className="block text-[11px] text-gray-400 mb-1">Proposed Change</span>
                        <span className="text-[#FC2B4E] font-medium">
                          {formatValue(change.recommendedValue, change.parameter)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Impact summary for this exercise */}
              {mod.changes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#4D4D4D] text-xs text-gray-300">
                  <div className="flex items-center gap-1 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12" y2="16"></line>
                    </svg>
                    <span className="font-medium">Expected Impact</span>
                  </div>
                  <p>These changes aim to {
                    mod.changes.some(c => getChangeIndicator(c.currentValue, c.recommendedValue).type === 'increase')
                      ? 'progressively increase your strength and performance'
                      : mod.changes.some(c => getChangeIndicator(c.currentValue, c.recommendedValue).type === 'decrease')
                        ? 'fine-tune your form and technique'
                        : 'optimize your current approach'
                  } for this exercise.</p>
                </div>
              )}
            </div>
          ))}
          
          {/* Program adjustments if any */}
          {modifications.programAdjustments && (
            <div className="border border-[#4D4D4D] rounded-md p-4 bg-[#323232]">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#4D4D4D]">
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-500">
                  PROGRAM ADJUSTMENT
                </span>
                <span className="text-sm font-medium text-white">
                  {modifications.programAdjustments.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-3 bg-[#262626] p-3 rounded border-l-2 border-amber-500">
                {modifications.programAdjustments.details}
              </p>
              <div className="flex items-center text-xs text-amber-400">
                <span className="mr-1">⏱️</span>
                <span>Duration: {modifications.programAdjustments.duration} week(s)</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons with improved styling */}
      <div className="flex border-t border-[#4D4D4D] p-4 bg-[#262626]">
        <div className="flex items-center text-xs text-gray-400 mr-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>Review these changes carefully before accepting</span>
        </div>
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 rounded-md text-sm transition-all flex items-center ${
              rejectHover 
                ? 'bg-gray-700 text-white shadow-md' 
                : 'border border-[#4D4D4D] bg-[#333333] text-gray-300 hover:bg-gray-700'
            }`}
            onClick={onReject}
            onMouseEnter={() => setRejectHover(true)}
            onMouseLeave={() => setRejectHover(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Reject Changes
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${
              acceptHover 
                ? 'bg-[#E02646] text-white shadow-lg transform scale-105' 
                : 'bg-[#FC2B4E] text-white hover:bg-[#E02646]'
            }`}
            onClick={onAccept}
            onMouseEnter={() => setAcceptHover(true)}
            onMouseLeave={() => setAcceptHover(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
} 