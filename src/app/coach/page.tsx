'use client';

import { useState, useEffect } from 'react';
import { ChatContext } from '@/types/coach';
import { EquipmentProfile as EquipmentProfileType } from '@/types/workout';
import * as coachService from '@/lib/coach-service';
import CoachChat from '@/components/coach/CoachChat';
import EquipmentProfile from '@/components/coach/EquipmentProfile';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';

export default function CoachPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEquipmentProfile, setShowEquipmentProfile] = useState(false);
  const [selectedEquipmentProfile, setSelectedEquipmentProfile] = useState<EquipmentProfileType | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext>({});
  
  const { recentWorkouts } = useWorkoutData();
  
  // Create or load a single conversation on mount
  useEffect(() => {
    initializeConversation();
  }, []);
  
  // Update chat context when equipment profile or recent workouts change
  useEffect(() => {
    setChatContext(prevContext => ({
      ...prevContext,
      recentWorkouts: recentWorkouts?.slice(0, 5) || [],
      equipmentProfile: selectedEquipmentProfile || undefined
    }));
    
    // If we have an active conversation, update its context
    if (conversationId) {
      coachService.updateContext(conversationId, {
        recentWorkouts: recentWorkouts?.slice(0, 5) || [],
        equipmentProfile: selectedEquipmentProfile || undefined
      });
    }
  }, [recentWorkouts, selectedEquipmentProfile, conversationId]);
  
  // Initialize or load the main conversation
  const initializeConversation = async () => {
    setIsLoading(true);
    try {
      // Try to load the most recent conversation
      const conversations = await coachService.getConversations();
      
      if (conversations.length > 0) {
        // If conversations exist, use the most recent one
        const mostRecent = conversations.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setConversationId(mostRecent.id);
      } else {
        // If no conversations exist, create a new one
        const newConversation = await coachService.createConversation(
          'Workout Coaching Session',
          chatContext
        );
        setConversationId(newConversation.id);
      }
    } catch (err) {
      console.error('Error initializing conversation:', err);
      // If there's an error, try to create a new conversation
      try {
        const newConversation = await coachService.createConversation(
          'Workout Coaching Session',
          chatContext
        );
        setConversationId(newConversation.id);
      } catch (fallbackErr) {
        console.error('Failed to create fallback conversation:', fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle equipment profile selection
  const handleProfileSelected = (profile: EquipmentProfileType) => {
    setSelectedEquipmentProfile(profile);
    setShowEquipmentProfile(false);
  };
  
  return (
    <main className="flex min-h-screen flex-col p-4 md:p-6">
      <div className="max-w-4xl mx-auto w-full">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI Coach</h1>
          <p className="text-gray-600 mt-1">Get personalized workout advice and program modifications</p>
        </header>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Equipment toggle - simplified UI */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <h2 className="font-medium">Equipment Profile</h2>
                {selectedEquipmentProfile && (
                  <span className="text-sm text-gray-500">
                    {selectedEquipmentProfile.name} ({selectedEquipmentProfile.location})
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowEquipmentProfile(!showEquipmentProfile)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showEquipmentProfile ? 'Hide' : 'Configure'}
              </button>
            </div>
          </div>
          
          {/* Equipment profile (conditionally shown) */}
          {showEquipmentProfile && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <EquipmentProfile onProfileSelected={handleProfileSelected} />
            </div>
          )}
          
          {/* Chat area */}
          <div className="h-[600px]">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : conversationId ? (
              <CoachChat 
                conversationId={conversationId} 
                initialContext={chatContext}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="text-center p-4">
                  <p className="text-gray-500">Unable to start coaching session</p>
                  <button
                    onClick={initializeConversation}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 