import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Conversation, ChatContext, QuickPrompt } from '@/types/coach';
import { WorkoutCoachResponse, WorkoutPerformance } from '@/types/workout';
import { quickPrompts } from '@/lib/coach-service';
import * as coachService from '@/lib/coach-service';
import * as openaiService from '@/lib/openai-service';
import * as workoutService from '@/lib/workout-service';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import MessageBubble from './MessageBubble';
import QuickPrompts from './QuickPrompts';
import WorkoutModifications from './WorkoutModifications';
import { WorkoutChangeProposal } from './WorkoutChangeProposal';
import { ProgramChangeNotification } from './ProgramChangeNotification';

interface CoachChatProps {
  initialContext?: ChatContext;
  conversationId?: string;
}

export default function CoachChat({ initialContext = {}, conversationId }: CoachChatProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // New state for workout modifications
  const [workoutModifications, setWorkoutModifications] = useState<WorkoutCoachResponse | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPerformance | null>(null);
  const [programChanges, setProgramChanges] = useState<{
    title: string;
    description: string;
    timestamp: string;
    changeType: 'add' | 'remove' | 'modify' | 'program';
  } | null>(null);
  
  const { refreshData } = useWorkoutData();
  
  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Create a new conversation
  const createNewConversation = async () => {
    try {
      const newConversation = await coachService.createConversation(
        undefined,
        initialContext
      );
      setConversation(newConversation);
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
    }
  };
  
  // Load an existing conversation
  const loadConversation = async (id: string) => {
    try {
      const loadedConversation = await coachService.getConversation(id);
      if (loadedConversation) {
        setConversation(loadedConversation);
      } else {
        setError('Conversation not found');
        createNewConversation();
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
      createNewConversation();
    }
  };
  
  // Load conversation if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      createNewConversation();
    }
    // ESLint is disabled here because these functions are defined in the component
    // and don't need to be dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);
  
  // Add a message to the conversation
  const addMessageToConversation = async (role: 'user' | 'assistant', content: string) => {
    if (!conversation) return null;
    
    try {
      // Add message to conversation
      const message = await coachService.addMessage(
        conversation.id,
        role,
        content
      );
      
      // Update local state
      setConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, message]
        };
      });
      
      return message;
    } catch (err) {
      console.error('Error adding message:', err);
      return null;
    }
  };
  
  // Send a message to the AI coach
  const sendMessage = async (content: string) => {
    if (!content.trim() || !conversation) return;
    setIsLoading(true);
    setError(null);
    
    // Debug logging
    console.log('Sending message:', content);
    console.log('Current conversation:', conversation);
    
    try {
      // Add user message to conversation
      console.log('Adding user message to conversation...');
      const userMessage = await addMessageToConversation('user', content);
      if (!userMessage) {
        console.error('Failed to add user message to conversation');
        throw new Error('Failed to add user message');
      }
      console.log('User message added successfully:', userMessage);
      
      // Clear input
      setInputMessage('');
      
      // Get response from AI
      console.log('Requesting AI response...');
      console.log('Sending messages:', [...(conversation.messages || []), userMessage]);
      console.log('With context:', conversation.context);
      
      const aiResponse = await openaiService.sendCoachMessage(
        [...(conversation.messages || []), userMessage],
        conversation.context
      );
      
      console.log('AI response received:', aiResponse);
      
      if (aiResponse) {
        // Add AI response to conversation
        console.log('Adding AI response to conversation...');
        await addMessageToConversation('assistant', aiResponse);
        console.log('AI response added to conversation');
      } else {
        console.error('AI response was null or empty');
        setError('No response received from AI. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle quick prompt selection
  const handleQuickPromptSelect = (prompt: QuickPrompt) => {
    if (prompt.context && conversation) {
      // Update conversation context with the prompt context
      coachService.updateContext(conversation.id, prompt.context);
      
      // Update local state
      setConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          context: {
            ...prev.context,
            ...prompt.context
          }
        };
      });
    }
    
    // Send the prompt text as a message
    sendMessage(prompt.text);
  };
  
  // Request workout modifications
  const requestWorkoutModifications = async (workoutId: string, feedback: string) => {
    if (!conversation) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the workout performance details
      const workouts = await workoutService.getWorkoutPerformancesForDay(workoutId);
      const workout = workouts[0]; // For simplicity, use the first one
      
      if (!workout) {
        throw new Error('Workout not found');
      }
      
      setSelectedWorkout(workout);
      
      // Get modifications from AI
      const modifications = await openaiService.createWorkoutModifications(
        workout,
        feedback,
        conversation.context.equipmentProfile
      );
      
      if (modifications) {
        // Instead of showing in an overlay, include it in the conversation flow
        setWorkoutModifications(modifications);
        
        // Add a message from the assistant introducing the changes
        await addMessageToConversation(
          'assistant',
          'I\'ve analyzed your workout and have some suggested modifications. Please review them below:'
        );
      } else {
        throw new Error('Failed to generate modifications');
      }
    } catch (err) {
      console.error('Error generating workout modifications:', err);
      setError('Failed to generate workout modifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle applying workout modifications
  const handleApplyModifications = async () => {
    if (!conversation || !workoutModifications || !selectedWorkout) return;
    
    setIsLoading(true);
    
    try {
      // Create a copy of the workout to modify
      const modifiedWorkout = JSON.parse(JSON.stringify(selectedWorkout)) as WorkoutPerformance;
      
      // Apply all selected changes
      workoutModifications.modifications.forEach(mod => {
        const exerciseIndex = modifiedWorkout.exercises.findIndex(ex => ex.exerciseId === mod.exerciseId);
        
        if (exerciseIndex !== -1) {
          mod.changes.forEach(change => {
            switch (change.parameter) {
              case 'weight':
                modifiedWorkout.exercises[exerciseIndex].weight = Number(change.recommendedValue);
                break;
              case 'sets':
                modifiedWorkout.exercises[exerciseIndex].targetSets = Number(change.recommendedValue);
                break;
              case 'reps':
                if (Array.isArray(change.recommendedValue)) {
                  modifiedWorkout.exercises[exerciseIndex].targetReps = change.recommendedValue;
                } else {
                  const currentLength = modifiedWorkout.exercises[exerciseIndex].targetReps.length;
                  modifiedWorkout.exercises[exerciseIndex].targetReps = Array(currentLength).fill(Number(change.recommendedValue));
                }
                break;
            }
          });
        }
      });
      
      // Save the modified workout
      await workoutService.recordWorkoutPerformance(modifiedWorkout);
      
      // Add a confirmation message
      await addMessageToConversation(
        'assistant',
        'I\'ve applied your selected modifications to the workout. The changes will be reflected the next time you perform this workout.'
      );
      
      // Show program change notification
      setProgramChanges({
        title: 'Workout Changes Applied',
        description: 'Your workout has been updated with the approved changes.',
        timestamp: new Date().toLocaleTimeString(),
        changeType: 'modify'
      });
      
      // Refresh workout data
      refreshData();
      
      // Reset modifications state
      setWorkoutModifications(null);
      setSelectedWorkout(null);
    } catch (err) {
      console.error('Error applying modifications:', err);
      setError('Failed to apply modifications. Please try again.');
      
      // Add an error message
      await addMessageToConversation(
        'assistant',
        'Sorry, there was an error applying the modifications. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle rejecting workout modifications
  const handleRejectModifications = async () => {
    // Add a message indicating the rejection
    await addMessageToConversation(
      'assistant',
      'No problem. Let me know if you want different modifications or have other questions about your workout.'
    );
    
    // Reset modifications state
    setWorkoutModifications(null);
    setSelectedWorkout(null);
  };
  
  // Handle dismissing program change notification
  const handleDismissProgramChange = () => {
    setProgramChanges(null);
  };
  
  // Parse message content for workout modification requests
  const parseMessageForModificationRequest = (content: string) => {
    // Simple pattern matching for workout modification requests
    const workoutIdMatch = content.match(/workout\s+(?:id|ID)?\s*[:#]?\s*([a-zA-Z0-9_-]+)/i);
    const hasFeedbackIndicators = 
      content.includes('modify') || 
      content.includes('adjust') || 
      content.includes('change') || 
      content.includes('update') ||
      content.includes('different');
    
    if (workoutIdMatch && hasFeedbackIndicators) {
      const workoutId = workoutIdMatch[1];
      requestWorkoutModifications(workoutId, content);
      return true;
    }
    
    return false;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if the message appears to be a workout modification request
    if (parseMessageForModificationRequest(inputMessage)) {
      // If it is, we'll handle it differently and not send a regular message
      setInputMessage('');
      return;
    }
    
    sendMessage(inputMessage);
  };
  
  return (
    <div className="flex flex-col h-full max-h-[600px] bg-[#1F1F1F] border border-[#383838] rounded-lg shadow-sm">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversation?.messages && conversation.messages.length > 0 ? (
          <div className="space-y-4">
            {conversation.messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {/* Workout modification proposal */}
            {workoutModifications && (
              <WorkoutChangeProposal
                modifications={workoutModifications}
                onAccept={handleApplyModifications}
                onReject={handleRejectModifications}
              />
            )}
            
            {/* Program change notification */}
            {programChanges && (
              <ProgramChangeNotification
                changes={programChanges}
                onDismiss={handleDismissProgramChange}
              />
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-400">
              <p className="mb-2">How can I help with your workout today?</p>
              <p className="text-sm">Ask about exercise modifications, form tips, or program adjustments.</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/30 text-red-400 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick prompts */}
      <div className="px-4">
        <QuickPrompts prompts={quickPrompts} onSelectPrompt={handleQuickPromptSelect} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-[#383838] p-4">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Type your message..."
            className="flex-1 rounded-l-md border border-[#383838] bg-[#2D2D2D] p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FC2B4E] focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-[#FC2B4E] text-white rounded-r-md px-4 py-2 disabled:bg-[#FC2B4E]/40"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending
              </span>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 