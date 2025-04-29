'use client';

import { useState, useEffect } from 'react';
import { Conversation, ChatContext } from '@/types/coach';
import { EquipmentProfile as EquipmentProfileType } from '@/types/workout';
import * as coachService from '@/lib/coach-service';
import CoachChat from '@/components/coach/CoachChat';
import EquipmentProfile from '@/components/coach/EquipmentProfile';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { formatDate, truncateString } from '@/lib/utils';

export default function CoachPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEquipmentProfile, setShowEquipmentProfile] = useState(false);
  const [selectedEquipmentProfile, setSelectedEquipmentProfile] = useState<EquipmentProfileType | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext>({});
  
  const { recentWorkouts } = useWorkoutData();
  
  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);
  
  // Update chat context when equipment profile or recent workouts change
  useEffect(() => {
    setChatContext(prevContext => ({
      ...prevContext,
      recentWorkouts: recentWorkouts?.slice(0, 5) || [],
      equipmentProfile: selectedEquipmentProfile || undefined
    }));
  }, [recentWorkouts, selectedEquipmentProfile]);
  
  // Load all conversations
  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const loadedConversations = await coachService.getConversations();
      setConversations(loadedConversations);
      
      // Set active conversation to the most recent one if any
      if (loadedConversations.length > 0) {
        const sortedConversations = [...loadedConversations].sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
        setActiveConversationId(sortedConversations[0].id);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start a new conversation
  const handleNewConversation = async () => {
    try {
      const newConversation = await coachService.createConversation(
        undefined,
        chatContext
      );
      setConversations([newConversation, ...conversations]);
      setActiveConversationId(newConversation.id);
    } catch (err) {
      console.error('Error creating new conversation:', err);
    }
  };
  
  // Delete a conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await coachService.deleteConversation(id);
      
      // Update local state
      const updatedConversations = conversations.filter(c => c.id !== id);
      setConversations(updatedConversations);
      
      // If the active conversation was deleted, set a new active conversation
      if (activeConversationId === id) {
        if (updatedConversations.length > 0) {
          setActiveConversationId(updatedConversations[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };
  
  // Handle equipment profile selection
  const handleProfileSelected = (profile: EquipmentProfileType) => {
    setSelectedEquipmentProfile(profile);
    
    // If there's an active conversation, update its context
    if (activeConversationId) {
      coachService.updateContext(activeConversationId, { equipmentProfile: profile });
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col p-4 md:p-6">
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI Coach</h1>
          <p className="text-gray-600 mt-1">Get personalized workout advice and program modifications</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar with conversations list and equipment profiles */}
          <div className="md:col-span-1 space-y-6">
            {/* Conversations list */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Conversations</h2>
                <button
                  onClick={handleNewConversation}
                  className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
                >
                  New Chat
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start a new chat to get workout advice</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {conversations
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map(conversation => (
                      <li key={conversation.id}>
                        <button
                          onClick={() => setActiveConversationId(conversation.id)}
                          className={`w-full text-left p-3 rounded-md ${
                            activeConversationId === conversation.id
                              ? 'bg-indigo-50 border border-indigo-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div className="font-medium truncate">
                            {truncateString(conversation.title, 25)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex justify-between">
                            <span>{formatDate(new Date(conversation.updatedAt), 'date')}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conversation.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            
            {/* Equipment profile toggle button */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Equipment</h2>
                <button
                  onClick={() => setShowEquipmentProfile(!showEquipmentProfile)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {showEquipmentProfile ? 'Hide' : 'Show'}
                </button>
              </div>
              {selectedEquipmentProfile && !showEquipmentProfile && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">{selectedEquipmentProfile.name}</p>
                  <p className="text-xs text-gray-500">{selectedEquipmentProfile.location}</p>
                </div>
              )}
            </div>
            
            {/* Equipment profile component (conditionally shown) */}
            {showEquipmentProfile && (
              <EquipmentProfile onProfileSelected={handleProfileSelected} />
            )}
          </div>
          
          {/* Chat area */}
          <div className="md:col-span-3">
            {activeConversationId ? (
              <CoachChat 
                conversationId={activeConversationId} 
                initialContext={chatContext}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h2 className="text-xl font-medium text-gray-800 mb-2">Welcome to AI Coach</h2>
                <p className="text-gray-600 mb-6">Start a new conversation to get personalized workout advice</p>
                <button
                  onClick={handleNewConversation}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Start New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 