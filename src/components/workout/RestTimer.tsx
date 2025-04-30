'use client';

import React, { useState, useRef, useEffect } from 'react';

interface RestTimerProps {
  initialTime?: number;
  onComplete?: () => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

// Custom hook for interval
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
};

export function RestTimer({
  initialTime = 60,
  onComplete,
  onCancel,
  isOpen = false
}: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState(initialTime);

  // Reset timer when opened
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(adjustmentValue);
      setIsPaused(false);
    }
  }, [isOpen, adjustmentValue]);

  // Timer logic
  useInterval(
    () => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      } else {
        onComplete?.();
      }
    },
    isOpen && !isPaused ? 1000 : null
  );

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const handleAdjustTime = (amount: number) => {
    const newValue = Math.max(5, adjustmentValue + amount);
    setAdjustmentValue(newValue);
    if (isPaused || timeLeft === 0) {
      setTimeLeft(newValue);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentComplete = ((adjustmentValue - timeLeft) / adjustmentValue) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-[#2D2D2D] rounded-xl p-6 w-4/5 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <svg className="h-5 w-5 text-[#FC2B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-white">Rest Timer</h2>
        </div>

        {/* Timer Display */}
        <div className="relative flex flex-col items-center justify-center mb-8">
          <div className="relative w-48 h-48">
            {/* Background circle */}
            <div className="absolute inset-0 rounded-full border-8 border-[#383838]" />
            
            {/* Progress circle */}
            <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#FC2B4E"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - percentComplete / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            className="h-12 w-12 rounded-full bg-[#383838] flex items-center justify-center"
            onClick={handlePauseResume}
          >
            {isPaused ? (
              <svg className="h-5 w-5 text-[#35C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-[#FC2B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <button
            className="h-12 w-12 rounded-full bg-[#383838] flex items-center justify-center"
            onClick={handleCancel}
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Time Adjustment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Adjust Rest Time</span>
            <span className="text-sm font-medium text-white">{formatTime(adjustmentValue)}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              className="h-10 w-10 rounded-full bg-[#383838] flex items-center justify-center"
              onClick={() => handleAdjustTime(-5)}
            >
              <svg className="h-4 w-4 text-[#FC2B4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <input
              type="range"
              min="5"
              max="300"
              step="5"
              value={adjustmentValue}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setAdjustmentValue(value);
                if (isPaused || timeLeft === 0) {
                  setTimeLeft(value);
                }
              }}
              className="w-full accent-[#FC2B4E]"
            />
            
            <button
              className="h-10 w-10 rounded-full bg-[#383838] flex items-center justify-center"
              onClick={() => handleAdjustTime(5)}
            >
              <svg className="h-4 w-4 text-[#35C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RestTimer; 