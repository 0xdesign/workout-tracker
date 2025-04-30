'use client';

import React from 'react';
import { WorkoutCoachResponse } from '@/types/workout';

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
  return (
    <div className="flex flex-col w-full rounded-lg overflow-hidden bg-[#2D2D2D] mb-4">
      <div className="p-4">
        <h4 className="font-bold text-sm mb-2 text-white">Workout Change Proposal</h4>
        
        {/* Overall explanation */}
        <div className="bg-[#383838] p-3 rounded-md mb-4">
          <p className="text-sm text-gray-300">{modifications.explanation}</p>
        </div>
        
        <div className="space-y-3">
          {/* Exercise modifications */}
          {modifications.modifications.map((mod) => (
            <div
              key={mod.exerciseId}
              className="border border-[#4D4D4D] rounded-md p-3 bg-[#383838]"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-[#FC2B4E]/20 text-[#FC2B4E]">
                  MODIFY
                </span>
                <span className="text-sm font-medium text-white">Exercise ID: {mod.exerciseId}</span>
              </div>
              
              {mod.changes.map((change, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <div className="text-xs text-gray-300 mb-1">
                    {change.reasoning}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-[#2D2D2D] rounded border border-[#4D4D4D]">
                      <span className="block text-[10px] text-gray-400">Current</span>
                      <span className="text-white">{change.currentValue}</span>
                    </div>
                    <div className="p-2 bg-[#2D2D2D] rounded border border-[#4D4D4D]">
                      <span className="block text-[10px] text-gray-400">Proposed</span>
                      <span className="text-[#FC2B4E]">{change.recommendedValue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          {/* Program adjustments if any */}
          {modifications.programAdjustments && (
            <div className="border border-[#4D4D4D] rounded-md p-3 bg-[#383838]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-500">
                  PROGRAM
                </span>
                <span className="text-sm font-medium text-white">
                  {modifications.programAdjustments.type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                {modifications.programAdjustments.details}
              </p>
              <div className="text-xs text-gray-400">
                Duration: {modifications.programAdjustments.duration} week(s)
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex border-t border-[#4D4D4D] p-3">
        <div className="flex gap-2 ml-auto">
          <button
            className="px-3 py-1.5 border border-[#4D4D4D] bg-[#383838] hover:bg-[#444444] text-white rounded-md text-sm transition-colors"
            onClick={onReject}
          >
            Reject
          </button>
          <button
            className="px-3 py-1.5 bg-[#FC2B4E] hover:bg-[#E02646] text-white rounded-md text-sm transition-colors"
            onClick={onAccept}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
} 