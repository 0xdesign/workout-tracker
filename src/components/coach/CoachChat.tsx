import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Conversation, ChatContext, QuickPrompt } from '@/types/coach';
import { WorkoutCoachResponse, WorkoutPerformance, WorkoutDay, WorkoutPlan } from '@/types/workout';
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

// Calculate Levenshtein distance for fuzzy matching
const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
};

// Find best matching workout based on ID or name
const findBestWorkoutMatch = (
  inputId: string, 
  workoutDays: WorkoutDay[]
): WorkoutDay | null => {
  if (!workoutDays || workoutDays.length === 0) return null;
  
  // Normalize input
  const normalizedInput = inputId.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = workoutDays.find(day => 
    day.id.toLowerCase() === normalizedInput || 
    day.name.toLowerCase() === normalizedInput
  );
  
  if (exactMatch) return exactMatch;
  
  // If no exact match, try fuzzy matching
  let bestMatch: WorkoutDay | null = null;
  let bestScore = Infinity;
  
  for (const day of workoutDays) {
    const nameDistance = levenshteinDistance(normalizedInput, day.name.toLowerCase());
    const idDistance = levenshteinDistance(normalizedInput, day.id.toLowerCase());
    const minDistance = Math.min(nameDistance, idDistance);
    
    // Normalize score by length to handle shorter strings better
    const normalizedScore = minDistance / Math.max(normalizedInput.length, day.name.length);
    
    if (normalizedScore < bestScore) {
      bestScore = normalizedScore;
      bestMatch = day;
    }
  }
  
  // Only return if score is below threshold (0.4 means 60% similarity)
  return bestScore < 0.4 ? bestMatch : null;
};

interface CoachChatProps {
  initialContext?: ChatContext;
  conversationId?: string;
}

export default function CoachChat({ initialContext = {}, conversationId }: CoachChatProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'advice' | 'modification'>('advice');
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [showWorkoutSelector, setShowWorkoutSelector] = useState(false);
  
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
  
  const { refreshData, workoutPlan: dataProviderWorkoutPlan } = useWorkoutData();

  // Load workout plan from provider
  useEffect(() => {
    if (dataProviderWorkoutPlan) {
      setWorkoutPlan(dataProviderWorkoutPlan);
    }
  }, [dataProviderWorkoutPlan]);
  
  // Load chat mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('chatMode');
    if (savedMode === 'advice' || savedMode === 'modification') {
      setChatMode(savedMode as 'advice' | 'modification');
    }
  }, []);
  
  // Save chat mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('chatMode', chatMode);
  }, [chatMode]);

  // Function to toggle between advice and modification modes
  const toggleChatMode = () => {
    const newMode = chatMode === 'advice' ? 'modification' : 'advice';
    setChatMode(newMode);
    
    // Inform the user about the mode change
    const modeChangeMessage = newMode === 'advice' 
      ? "I'm now in advice mode. I'll provide workout guidance without making any changes to your program."
      : "I'm now in modification mode. I can help you make changes to your workout program. Type 'list workouts' to see available workouts.";
      
    addMessageToConversation('assistant', modeChangeMessage);
  };

  // Get available workout list
  const listAvailableWorkouts = async (): Promise<string> => {
    const plan = await workoutService.getActiveWorkoutPlan();
    if (!plan) return "No workout plan is currently active.";
    
    let message = "**Available workouts:**\n\n";
    plan.days.forEach(day => {
      message += `- **${day.name}** (ID: ${day.id})\n`;
    });
    
    message += "\nYou can modify a workout by saying: 'modify [workout name]' or by clicking on one from the list I'll show you.";
    return message;
  };

  // Handle the "list workouts" command
  const handleListWorkouts = async () => {
    setIsLoading(true);
    
    try {
      // Add user message to conversation
      await addMessageToConversation('user', 'list workouts');
      
      // Generate workout list
      const workoutList = await listAvailableWorkouts();
      
      // Add assistant response
      await addMessageToConversation('assistant', workoutList);
      
      // Also show clickable workout list interface
      setShowWorkoutSelector(true);
    } catch (err) {
      console.error('Error listing workouts:', err);
      setError('Failed to list workouts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle workout selection from the list
  const handleWorkoutSelect = async (workout: WorkoutDay) => {
    setShowWorkoutSelector(false);
    
    // Prompt for feedback
    await addMessageToConversation(
      'assistant', 
      `What would you like to modify about the **${workout.name}** workout? Please provide details about what you want to change.`
    );
    
    // Store the selection so the next message is processed as feedback
    localStorage.setItem('pendingWorkoutModification', workout.id);
  };
  
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
  
  // Parse message content for workout modification requests
  const parseMessageForModificationRequest = (content: string) => {
    // List workouts command
    if (content.toLowerCase().match(/list\s+workouts?/i)) {
      handleListWorkouts();
      return true;
    }
    
    // Check for a pending workout modification from selection
    const pendingWorkoutId = localStorage.getItem('pendingWorkoutModification');
    if (pendingWorkoutId) {
      localStorage.removeItem('pendingWorkoutModification');
      requestWorkoutModifications(pendingWorkoutId, content);
      return true;
    }
    
    // Enhanced pattern matching for workout modification requests
    // 1. Updated regex pattern to handle spaces in workout IDs
    const workoutIdMatch = content.match(/workout\s+(?:id|ID)?\s*[:#]?\s*([a-zA-Z0-9_\s-]+)/i);
    
    // 2. Additional patterns to catch more natural language requests
    const alternativePatterns = [
      /(?:modify|change|adjust|update)\s+(?:my|the)?\s*([a-zA-Z0-9_\s-]+)\s+workout/i,
      /(?:modify|change|adjust|update)\s+(?:my|the)?\s*workout\s+(?:called|named)?\s*([a-zA-Z0-9_\s-]+)/i,
      /(?:make|do)\s+changes\s+to\s+(?:my|the)?\s*([a-zA-Z0-9_\s-]+)\s+workout/i
    ];
    
    // Check for modification intent indicators
    const hasFeedbackIndicators = 
      content.toLowerCase().includes('modify') || 
      content.toLowerCase().includes('adjust') || 
      content.toLowerCase().includes('change') || 
      content.toLowerCase().includes('update') ||
      content.toLowerCase().includes('different');
    
    // Extract workout ID from main pattern or alternatives
    let workoutId = null;
    if (workoutIdMatch && hasFeedbackIndicators) {
      workoutId = workoutIdMatch[1].trim();
    } else {
      // Try alternative patterns
      for (const pattern of alternativePatterns) {
        const match = content.match(pattern);
        if (match) {
          workoutId = match[1].trim();
          break;
        }
      }
    }
    
    if (workoutId) {
      requestWorkoutModifications(workoutId, content);
      return true;
    }
    
    return false;
  };
  
  // Request workout modifications
  const requestWorkoutModifications = async (workoutId: string, feedback: string) => {
    if (!conversation) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the active workout plan
      const plan = await workoutService.getActiveWorkoutPlan();
      
      // Get the workout performance details
      const workouts = await workoutService.getWorkoutPerformancesForDay(workoutId);
      const workout = workouts[0]; // For simplicity, use the first one
      
      if (!workout) {
        // Try fuzzy matching to find the workout
        const bestMatch = plan ? findBestWorkoutMatch(workoutId, plan.days) : null;
        
        let errorMessage = `I couldn't find a workout with ID "${workoutId}".`;
        
        if (bestMatch) {
          // We found a likely match
          errorMessage = `I couldn't find a workout with ID "${workoutId}". Did you mean "${bestMatch.name}"? I'll try to use that instead.`;
          
          // Try again with the matched workout ID
          await addMessageToConversation('assistant', errorMessage);
          setIsLoading(false);
          
          // Continue with the matched workout ID
          requestWorkoutModifications(bestMatch.id, feedback);
          return;
        } else {
          // No match found, show available workouts
          const availableWorkouts = plan?.days.map(day => day.name) || [];
          
          if (availableWorkouts.length > 0) {
            errorMessage += ` Available workouts are: ${availableWorkouts.join(', ')}. You can also type "list workouts" to see all available options.`;
          } else {
            errorMessage += " I couldn't find any workouts in your plan.";
          }
          
          await addMessageToConversation('assistant', errorMessage);
          // Suggest listing workouts
          setShowWorkoutSelector(true);
          await addMessageToConversation(
            'assistant',
            "Here are the workouts in your plan. Click on one to modify it:"
          );
          setIsLoading(false);
          return;
        }
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
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skip empty messages
    if (!inputMessage.trim()) return;
    
    // Only process modification requests in modification mode
    if (chatMode === 'modification') {
      // Special command for listing workouts
      if (inputMessage.toLowerCase().match(/list\s+workouts?/i)) {
        handleListWorkouts();
        setInputMessage('');
        return;
      }
      
      // Check if the message appears to be a workout modification request
      if (parseMessageForModificationRequest(inputMessage)) {
        // If it is, we'll handle it differently and not send a regular message
        setInputMessage('');
        return;
      }
    }
    
    sendMessage(inputMessage);
  };
  
  // Render the workout selector UI
  const renderWorkoutSelector = () => {
    if (!workoutPlan || !showWorkoutSelector) return null;
    
    return (
      <div className="mb-4 mt-2">
        <div className="space-y-2">
          {workoutPlan.days.map(day => (
            <button
              key={day.id}
              onClick={() => handleWorkoutSelect(day)}
              className="w-full p-3 bg-[#383838] hover:bg-[#4D4D4D] rounded-md text-left flex justify-between items-center transition-colors"
            >
              <div>
                <div className="font-medium text-white">{day.name}</div>
                <div className="text-xs text-gray-400">{day.exercises.length} exercises</div>
              </div>
              <span className="text-[#FC2B4E]">Select</span>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Mode toggle UI component
  const ModeToggle = () => (
    <div className="w-full flex items-center justify-between p-3 mb-3 bg-[#2D2D2D] border border-[#383838] rounded-lg">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">Mode: {chatMode === 'advice' ? 'Advice' : 'Modification'}</span>
        <span className="text-xs text-gray-400">
          {chatMode === 'advice' 
            ? 'Get workout advice without making changes' 
            : 'Make changes to your workout program'}
        </span>
      </div>
      <button
        onClick={toggleChatMode}
        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
          chatMode === 'advice'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-[#FC2B4E] text-white hover:bg-[#E02646]'
        }`}
      >
        Switch to {chatMode === 'advice' ? 'Modification' : 'Advice'} Mode
      </button>
    </div>
  );
  
  return (
    <div className={`flex flex-col h-full max-h-[600px] bg-[#1F1F1F] border ${
      chatMode === 'advice' 
        ? 'border-[#383838]' 
        : 'border-[#FC2B4E]'
    } rounded-lg shadow-sm`}>
      {/* Mode Toggle */}
      <div className="px-4 pt-4">
        <ModeToggle />
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4">
        {conversation?.messages && conversation.messages.length > 0 ? (
          <div className="space-y-4">
            {conversation.messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {/* Workout selector (appears after list workouts command) */}
            {renderWorkoutSelector()}
            
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
              <p className="text-sm">
                {chatMode === 'advice' 
                  ? 'Ask about exercise techniques, form tips, or program suggestions.' 
                  : 'Ask me to modify your workouts or type "list workouts" to see available options.'}
              </p>
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
            placeholder={chatMode === 'advice' 
              ? "Ask for workout advice..." 
              : 'Type "list workouts" or make a modification request...'}
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