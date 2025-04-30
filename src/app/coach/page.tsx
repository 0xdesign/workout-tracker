'use client';

import { useState, useEffect } from 'react';
import { ChatContext } from '@/types/coach';
import { EquipmentProfile as EquipmentProfileType } from '@/types/workout';
import * as coachService from '@/lib/coach-service';
import CoachChat from '@/components/coach/CoachChat';
import EquipmentProfile from '@/components/coach/EquipmentProfile';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { Loader2, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

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
  
  // Toggle equipment profile visibility
  const toggleEquipmentProfile = () => {
    setShowEquipmentProfile(!showEquipmentProfile);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-[#1F1F1F] text-white">
      {/* Header */}
      <header className="px-4 py-6 border-b border-[#2D2D2D]">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-2xl md:text-3xl font-bold">AI Coach</h1>
          <p className="text-zinc-400 mt-1">Get personalized workout advice and program modifications</p>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {/* Equipment Profile Section */}
          <div className="bg-[#2D2D2D] border border-[#383838] shadow-md rounded-lg overflow-hidden">
            <button 
              onClick={toggleEquipmentProfile}
              className="w-full px-4 py-3 flex justify-between items-center hover:bg-[#383838] transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium">Equipment Profile</span>
                {selectedEquipmentProfile && (
                  <span className="text-sm text-zinc-400">
                    {selectedEquipmentProfile.name} ({selectedEquipmentProfile.location})
                  </span>
                )}
              </div>
              {showEquipmentProfile ? 
                <ChevronUp className="h-5 w-5 text-zinc-400" /> : 
                <ChevronDown className="h-5 w-5 text-zinc-400" />
              }
            </button>
            
            {/* Equipment profile (conditionally shown) */}
            {showEquipmentProfile && (
              <div className="p-4 border-t border-[#383838]">
                <EquipmentProfile onProfileSelected={handleProfileSelected} />
              </div>
            )}
          </div>
          
          {/* Chat area */}
          <div className="bg-[#2D2D2D] border border-[#383838] shadow-md rounded-lg overflow-hidden h-[600px]">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#FC2B4E]" />
                  <p className="mt-4 text-zinc-400">Initializing your coach...</p>
                </div>
              </div>
            ) : conversationId ? (
              <CoachChat 
                conversationId={conversationId} 
                initialContext={chatContext}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="text-center p-4">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 rounded-full bg-[#2D2D2D] border border-[#383838]">
                      <MessageSquare className="h-8 w-8 text-[#FC2B4E]" />
                    </div>
                  </div>
                  <p className="text-zinc-400 mb-4">Unable to start coaching session</p>
                  <button
                    onClick={initializeConversation}
                    className="px-4 py-2 bg-[#FC2B4E] hover:bg-[#E02646] text-white rounded-md transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 