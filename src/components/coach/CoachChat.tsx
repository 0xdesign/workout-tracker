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
  const [showingModifications, setShowingModifications] = useState(false);
  
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
  
  // Send a message to the AI coach
  const sendMessage = async (content: string) => {
    if (!content.trim() || !conversation) return;
    setIsLoading(true);
    setError(null);
    
    try {
      // Add user message to conversation
      const userMessage = await coachService.addMessage(
        conversation.id,
        'user',
        content
      );
      
      // Update local state
      setConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, userMessage]
        };
      });
      
      // Clear input
      setInputMessage('');
      
      // Get response from AI
      const aiResponse = await openaiService.sendCoachMessage(
        [...(conversation.messages || []), userMessage],
        conversation.context
      );
      
      if (aiResponse) {
        // Add AI response to conversation
        const assistantMessage = await coachService.addMessage(
          conversation.id,
          'assistant',
          aiResponse
        );
        
        // Update local state
        setConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, assistantMessage]
          };
        });
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
        setWorkoutModifications(modifications);
        setShowingModifications(true);
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
    setShowingModifications(false);
    
    // Add a message indicating the modifications were applied
    if (conversation && workoutModifications) {
      await coachService.addMessage(
        conversation.id,
        'assistant',
        'I\'ve applied your selected modifications to the workout. The changes will be reflected the next time you perform this workout.'
      );
      
      // Update local state
      setConversation(prev => {
        if (!prev) return null;
        
        const newMessage: Message = {
          id: 'temp-' + Date.now(),
          role: 'assistant',
          content: 'I\'ve applied your selected modifications to the workout. The changes will be reflected the next time you perform this workout.',
          timestamp: Date.now()
        };
        
        return {
          ...prev,
          messages: [...prev.messages, newMessage]
        };
      });
      
      // Refresh workout data
      refreshData();
    }
    
    // Reset modifications state
    setWorkoutModifications(null);
    setSelectedWorkout(null);
  };
  
  // Handle canceling workout modifications
  const handleCancelModifications = () => {
    setShowingModifications(false);
    setWorkoutModifications(null);
    setSelectedWorkout(null);
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
    <div className="flex flex-col h-full max-h-[600px] bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">AI Coach</h2>
        <p className="text-sm text-gray-500">Get personalized workout advice</p>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {showingModifications && workoutModifications && selectedWorkout ? (
          <WorkoutModifications
            modifications={workoutModifications}
            workout={selectedWorkout}
            onApply={handleApplyModifications}
            onCancel={handleCancelModifications}
          />
        ) : (
          <>
            {conversation?.messages && conversation.messages.length > 0 ? (
              conversation.messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="text-center text-gray-500">
                  <p className="mb-2">How can I help with your workout today?</p>
                  <p className="text-sm">Ask about exercise modifications, form tips, or program adjustments.</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">
                {error}
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick prompts */}
      <div className="px-4">
        <QuickPrompts prompts={quickPrompts} onSelectPrompt={handleQuickPromptSelect} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Type your message..."
            className="flex-1 rounded-l-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-indigo-600 text-white rounded-r-md px-4 py-2 disabled:bg-indigo-400"
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