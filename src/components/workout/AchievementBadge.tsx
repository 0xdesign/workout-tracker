'use client';

import React, { useState, useEffect } from 'react';

export type AchievementType = 
  | 'personal_record'
  | 'streak'
  | 'volume'
  | 'weight'
  | 'completion'
  | 'consistency';

interface AchievementBadgeProps {
  type: AchievementType;
  title: string;
  description: string;
  date: Date | string;
  isNew?: boolean;
  onAnimationComplete?: () => void;
}

export function AchievementBadge({
  type,
  title,
  description,
  date,
  isNew = false,
  onAnimationComplete
}: AchievementBadgeProps) {
  const [showConfetti, setShowConfetti] = useState(isNew);
  const [animating, setAnimating] = useState(isNew);
  
  useEffect(() => {
    if (isNew) {
      // Show confetti for 3 seconds
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
      // Animation will last slightly longer
      const animationTimer = setTimeout(() => {
        setAnimating(false);
        if (onAnimationComplete) onAnimationComplete();
      }, 3500);
      
      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(animationTimer);
      };
    }
  }, [isNew, onAnimationComplete]);
  
  // Map achievement types to icons and colors
  const getAchievementDetails = () => {
    switch (type) {
      case 'personal_record':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          ),
          color: '#FC2B4E',
          bgColor: 'rgba(252, 43, 78, 0.1)'
        };
      case 'streak':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          color: '#FC2B4E',
          bgColor: 'rgba(252, 43, 78, 0.1)'
        };
      case 'volume':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ),
          color: '#35C759',
          bgColor: 'rgba(53, 199, 89, 0.1)'
        };
      case 'weight':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.24 12.24a6 6 0 0 1-8.49 8.49L5 14l-1-1 1-1 6.37-6.37a6 6 0 0 1 8.49 8.49z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.13 9.13l2.3 2.3" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 18.88l-2.3-2.3" />
            </svg>
          ),
          color: '#35C759',
          bgColor: 'rgba(53, 199, 89, 0.1)'
        };
      case 'completion':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: '#35C759',
          bgColor: 'rgba(53, 199, 89, 0.1)'
        };
      case 'consistency':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          color: '#FC2B4E',
          bgColor: 'rgba(252, 43, 78, 0.1)'
        };
      default:
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: '#FC2B4E',
          bgColor: 'rgba(252, 43, 78, 0.1)'
        };
    }
  };
  
  const { icon, color, bgColor } = getAchievementDetails();
  
  // Format date
  const formattedDate = typeof date === 'string' 
    ? new Date(date).toLocaleDateString()
    : date.toLocaleDateString();
  
  return (
    <div 
      className={`
        relative overflow-hidden
        p-4 rounded-xl border border-[#383838] 
        ${animating ? 'scale-105 transition-transform duration-500' : ''}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {/* Confetti animation (simplified) */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                backgroundColor: i % 2 === 0 ? '#FC2B4E' : '#35C759',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-full"
          style={{ backgroundColor: bgColor, color: color }}
        >
          {icon}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-400 mb-1">{description}</p>
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formattedDate}
          </div>
        </div>
        
        <div>
          {isNew && (
            <span className="px-2 py-1 text-xs font-medium bg-[#FC2B4E] text-white rounded-full">
              NEW
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 