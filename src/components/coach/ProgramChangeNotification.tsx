'use client';

import React from 'react';

interface ProgramChangeDetails {
  title: string;
  description: string;
  timestamp?: string;
  changeType: 'add' | 'remove' | 'modify' | 'program';
}

interface ProgramChangeNotificationProps {
  changes: ProgramChangeDetails;
  onDismiss?: () => void;
}

export function ProgramChangeNotification({
  changes,
  onDismiss
}: ProgramChangeNotificationProps) {
  return (
    <div className="w-full bg-[#2D2D2D] border border-[#4D4D4D] rounded-lg overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon based on change type */}
          <div 
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#FC2B4E]/30 bg-[#FC2B4E]/10"
            aria-hidden="true"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="text-[#FC2B4E]" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {changes.changeType === 'add' ? (
                <path d="M5 12h14M12 5v14" />
              ) : changes.changeType === 'remove' ? (
                <path d="M5 12h14" />
              ) : changes.changeType === 'program' ? (
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  <path d="M14 8V2" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </>
              ) : (
                <>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                </>
              )}
            </svg>
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white mb-1">{changes.title}</h4>
            <p className="text-sm text-gray-300 mb-2">{changes.description}</p>
            {changes.timestamp && (
              <p className="text-xs text-gray-400">{changes.timestamp}</p>
            )}
          </div>
          
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 