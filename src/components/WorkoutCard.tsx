'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WorkoutDay } from '@/types/workout';

interface WorkoutCardProps {
  workout: WorkoutDay;
  date: string;
  isCompleted?: boolean;
  workoutType?: 'strength' | 'cardio' | 'flexibility' | 'mixed';
}

export function WorkoutCard({ 
  workout, 
  date, 
  isCompleted = false,
  workoutType = 'strength'
}: WorkoutCardProps) {

  const gradients = {
    strength: 'from-[#FC2B4E] to-[#FF6B45]',   // Red to Orange gradient
    cardio: 'from-[#35C759] to-[#2FB6BC]',     // Green to Teal gradient
    flexibility: 'from-[#5E5CE6] to-[#996CE9]', // Purple to Lavender gradient
    mixed: 'from-[#FDBC40] to-[#FF9F0A]'       // Yellow to Amber gradient
  };
  
  const icons = {
    strength: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707L15.828 5a1 1 0 11-1.414 1.414L13 5l-.707.707a1 1 0 01-1.414-1.414l.707-.707L10.172 2a1 1 0 011.414 0zM15 11a1 1 0 01.707.293l.707.707L17.828 13a1 1 0 11-1.414 1.414L15 13l-.707.707a1 1 0 01-1.414-1.414l.707-.707L12.172 10a1 1 0 111.414 0z" clipRule="evenodd" />
      </svg>
    ),
    cardio: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    flexibility: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    ),
    mixed: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
        <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
      </svg>
    )
  };

  const gradient = gradients[workoutType];
  const icon = icons[workoutType];
  
  return (
    <div className={`rounded-xl overflow-hidden shadow-md bg-gradient-to-br ${gradient} hover:shadow-lg transition-shadow`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{workout.name}</h3>
            <p className="text-white/80 text-sm mb-3">
              {workout.exercises.length} exercises
            </p>
          </div>
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            {icon}
          </div>
        </div>
        
        <div className="flex items-center mt-4 justify-between">
          <div className="flex items-center">
            {isCompleted ? (
              <div className="bg-white/20 rounded-full p-1 mr-2">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="bg-white/20 rounded-full p-1 mr-2">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="text-white text-sm font-medium">
              {isCompleted ? 'Completed' : 'Scheduled'}
            </span>
          </div>
          
          <Link 
            href={`/workout/${workout.id}?date=${date}`}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-lg text-white text-sm font-bold transition-colors"
          >
            {isCompleted ? 'View Details' : 'Start Workout'}
          </Link>
        </div>
      </div>
    </div>
  );
} 