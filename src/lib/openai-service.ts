import { ExercisePerformance, WorkoutCoachResponse, WorkoutPerformance, EquipmentProfile, EquipmentConstraint } from '@/types/workout';
import { Message, ChatContext } from '@/types/coach';

// Cache for OpenAI responses to reduce API calls
interface CacheEntry {
  timestamp: number;
  response: WorkoutCoachResponse;
}

// Cache OpenAI responses for 24 hours to stay within rate limits
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const responseCache = new Map<string, CacheEntry>();

/**
 * Configuration options for OpenAI API requests
 */
const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 1000;

/**
 * Creates a system prompt for the AI model
 * @returns System prompt instructing the AI how to act as a workout coach
 */
function createSystemPrompt(): string {
  return `You are an expert strength coach and personal trainer with deep knowledge of weight training, 
  progressive overload, and exercise form. Your role is to analyze workout data and provide specific, 
  evidence-based recommendations for the user's next workout.

  You should suggest appropriate weight, rep, and set adjustments based on the user's prior performance. 
  Always prioritize:
  
  1. Safety: Never recommend unsafe progression jumps (keep weight increases to 5-10% maximum)
  2. Form over weight: If the user reported poor form, focus on technique at the same or lower weight
  3. Progressive overload: Look for appropriate opportunities to increase difficulty through weight, reps, or sets
  4. Recovery: Consider reported difficulty and RPE when making suggestions
  
  Always provide a clear explanation for your recommendations so the user understands the reasoning.
  Format your response as valid JSON matching the expected structure.`;
}

/**
 * Creates a system prompt for the AI coach chat interface
 * @param context Additional context about the user's workouts and equipment
 * @returns System prompt for the coach chat interface
 */
function createCoachSystemPrompt(context?: ChatContext): string {
  let contextString = '';
  
  if (context) {
    if (context.recentWorkouts && context.recentWorkouts.length > 0) {
      contextString += '\nRecent workout data:\n';
      context.recentWorkouts.forEach(workout => {
        contextString += `Date: ${workout.date}, Workout: ${workout.workoutDayId}\n`;
        contextString += `Overall rating: ${workout.overallRating || 'Not provided'}\n`;
        contextString += `Feedback: ${workout.overallFeedback || 'None'}\n`;
      });
    }
    
    if (context.equipmentProfile) {
      contextString += '\nEquipment constraints:\n';
      contextString += `Location: ${context.equipmentProfile.location}\n`;
      
      if (context.equipmentProfile.constraints.length > 0) {
        contextString += 'Specific constraints:\n';
        context.equipmentProfile.constraints.forEach(constraint => {
          contextString += constraint.exerciseId 
            ? `Exercise ${constraint.exerciseId}: `
            : 'General: ';
          
          contextString += `Min weight: ${constraint.minWeight || 'N/A'}, `;
          contextString += `Max weight: ${constraint.maxWeight || 'N/A'}, `;
          contextString += `Increment: ${constraint.incrementSize || 'N/A'}\n`;
        });
      }
    }
    
    if (context.userIssue) {
      contextString += `\nUser reported issue: ${context.userIssue}\n`;
    }
  }

  return `You are an expert strength coach and personal trainer with deep knowledge of weight training, 
  progressive overload, and exercise form. Your role is to provide personalized workout advice based on 
  the user's data, questions, and concerns.

  You should be:
  1. Practical - Give actionable, specific advice
  2. Evidence-based - Use proven training principles
  3. Responsive - Address the user's specific question or concern
  4. Safety-focused - Never recommend anything that could lead to injury
  5. Adaptable - Work with the user's available equipment and constraints

  When suggesting modifications to a workout:
  - Be specific about exercise changes (sets, reps, weight, etc.)
  - Explain the reasoning behind your recommendations
  - Consider the user's reported feedback and performance
  - Structure your suggestions in a way that can be easily implemented

  ${contextString}

  Respond conversationally and directly to the user's questions. If you need additional information 
  to provide good advice, ask clarifying questions.`;
}

/**
 * Checks if the OpenAI API key is configured
 * @returns Boolean indicating if the API key is available
 */
function isApiConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_OPENAI_API_KEY || !!process.env.OPENAI_API_KEY;
}

/**
 * Gets the OpenAI API key from environment variables
 * @returns The API key or an empty string if not found
 */
function getApiKey(): string {
  // First try environment variables
  const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (envKey) {
    // Clean up any malformed key (remove line breaks and trailing special characters)
    return envKey.replace(/\n|\r|%$/g, '');
  }
  
  // For development/testing only
  console.warn('OpenAI API key is not properly configured. Please set up in environment variables.');
  return ''; // Do not hardcode API keys in source code
}

/**
 * Create a cache key for a performance suggestion request
 * @param exerciseId The exercise ID
 * @param performanceHistory The exercise performance history
 * @returns A string cache key
 */
function createCacheKey(exerciseId: string, performanceHistory: ExercisePerformance[]): string {
  const historyString = performanceHistory.map(p => 
    `${p.exerciseId}-${p.weight}-${p.completedSets}-${p.completedReps.join(',')}-${p.rpe || 0}-${p.formQuality || ''}-${p.difficulty || ''}`
  ).join('|');
  
  return `exercise-${exerciseId}-${historyString}`;
}

/**
 * Check if a cached response is valid (not expired)
 * @param cacheEntry The cache entry to check
 * @returns Boolean indicating if the cache is still valid
 */
function isCacheValid(cacheEntry: CacheEntry): boolean {
  const now = Date.now();
  return (now - cacheEntry.timestamp) < CACHE_DURATION;
}

/**
 * Creates the message content for the OpenAI API request
 * @param exerciseId The exercise ID
 * @param performanceHistory The exercise performance history
 * @returns A string with the formatted message
 */
function createPromptContent(exerciseId: string, performanceHistory: ExercisePerformance[]): string {
  // Sort performance history from oldest to newest
  const sortedHistory = [...performanceHistory].sort((a, b) => 
    new Date(a.workoutDate || '').getTime() - new Date(b.workoutDate || '').getTime()
  );
  
  const historyText = sortedHistory.map(perf => {
    return `Date: ${perf.workoutDate || 'Unknown'}
    Weight: ${perf.weight} ${perf.weightUnit}
    Sets completed: ${perf.completedSets}/${perf.targetSets}
    Reps completed: ${perf.completedReps.join(', ')}
    RPE: ${perf.rpe || 'Not recorded'}
    Form quality: ${perf.formQuality || 'Not recorded'}
    Difficulty: ${perf.difficulty || 'Not recorded'}
    Notes: ${perf.notes || 'None'}
    Issues: ${perf.issues?.join(', ') || 'None'}`;
  }).join('\n\n');
  
  return `Please analyze the following workout performance history for exercise ID: ${exerciseId} 
  and provide recommendations for the next workout.
  
  Performance History (from oldest to newest):
  ${historyText}
  
  Based on this data, please suggest appropriate weight, reps, and sets for the next workout. 
  Explain your reasoning and consider form quality, RPE, difficulty level, and any reported issues.
  
  Return your response in the following JSON format:
  {
    "explanation": "Clear explanation of your recommendation and reasoning",
    "modifications": [
      {
        "exerciseId": "${exerciseId}",
        "changes": [
          {
            "parameter": "weight|sets|reps",
            "currentValue": "current value from most recent workout",
            "recommendedValue": "your recommendation",
            "reasoning": "specific reasoning for this change"
          }
        ]
      }
    ]
  }`;
}

/**
 * Generates AI performance suggestions for an exercise
 * @param exerciseId The exercise ID
 * @param performanceHistory The exercise performance history
 * @returns A promise resolving to the AI suggestions
 */
export async function getPerformanceSuggestions(
  exerciseId: string,
  performanceHistory: ExercisePerformance[]
): Promise<WorkoutCoachResponse | null> {
  // Check for empty history
  if (!performanceHistory || performanceHistory.length === 0) {
    console.warn('Cannot generate suggestions without performance history');
    return null;
  }
  
  // Check if API is configured
  if (!isApiConfigured()) {
    console.error('OpenAI API key is not configured');
    return null;
  }
  
  // Create cache key and check cache
  const cacheKey = createCacheKey(exerciseId, performanceHistory);
  const cachedResponse = responseCache.get(cacheKey);
  
  if (cachedResponse && isCacheValid(cachedResponse)) {
    console.log('Using cached AI suggestion');
    return cachedResponse.response;
  }
  
  try {
    // Prepare the API request
    const systemPrompt = createSystemPrompt();
    const userPrompt = createPromptContent(exerciseId, performanceHistory);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const contentStr = data.choices[0]?.message?.content;
    
    if (!contentStr) {
      throw new Error('Empty response from OpenAI API');
    }
    
    // Parse the JSON response
    try {
      const suggestions: WorkoutCoachResponse = JSON.parse(contentStr);
      
      // Cache the response
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        response: suggestions
      });
      
      return suggestions;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid response format from OpenAI API');
    }
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    // Return fallback suggestions if the API call fails
    return generateFallbackSuggestions(exerciseId, performanceHistory);
  }
}

/**
 * Generates fallback suggestions when the OpenAI API is unavailable
 * @param exerciseId The exercise ID
 * @param performanceHistory The exercise performance history
 * @returns Fallback suggestions based on simple rules
 */
function generateFallbackSuggestions(
  exerciseId: string,
  performanceHistory: ExercisePerformance[]
): WorkoutCoachResponse {
  // Use the most recent performance as the baseline
  const latestPerformance = performanceHistory[performanceHistory.length - 1];
  
  // Simple rule-based suggestions
  const currentWeight = latestPerformance.weight;
  const weightUnit = latestPerformance.weightUnit;
  
  let recommendedWeight = currentWeight;
  let recommendedReps = [...latestPerformance.completedReps];
  let explanation = '';
  
  // Check if all sets were completed successfully
  const allSetsCompleted = latestPerformance.completedSets >= latestPerformance.targetSets;
  const allRepsCompleted = latestPerformance.completedReps.every((reps, i) => 
    reps >= (latestPerformance.targetReps[i] || 0)
  );
  
  // Check form quality
  const hadGoodForm = latestPerformance.formQuality === 'good' || 
                      latestPerformance.formQuality === 'excellent';
  
  // Check difficulty
  const wasTooEasy = latestPerformance.difficulty === 'too_easy';
  
  // Determine recommendations based on performance
  if (allSetsCompleted && allRepsCompleted && hadGoodForm) {
    if (wasTooEasy) {
      // Increase weight by 5-10% if the exercise was too easy
      const increment = weightUnit === 'lb' ? 5 : 2.5; // 5 pounds or 2.5 kg
      recommendedWeight = currentWeight + increment;
      explanation = `You completed all sets and reps with good form and found it too easy. Increasing weight by ${increment} ${weightUnit}.`;
    } else {
      // Keep the same weight but try to increase reps slightly
      recommendedReps = recommendedReps.map(rep => rep + 1);
      explanation = 'You completed your target with good form. Try to increase your reps by 1 on each set.';
    }
  } else if (!hadGoodForm) {
    // Prioritize form improvement
    const reducedWeight = Math.max(currentWeight * 0.9, currentWeight - (weightUnit === 'lb' ? 5 : 2.5));
    recommendedWeight = reducedWeight;
    explanation = 'Focus on improving your form by slightly reducing weight and maintaining strict technique.';
  } else {
    // Maintain current parameters
    explanation = 'Continue with the same weight and reps, focusing on completing all sets and reps with good form.';
  }
  
  return {
    explanation,
    modifications: [
      {
        exerciseId,
        changes: [
          {
            parameter: 'weight',
            currentValue: currentWeight,
            recommendedValue: recommendedWeight,
            reasoning: 'Based on your recent performance pattern'
          }
        ]
      }
    ]
  };
}

/**
 * Clears the suggestion cache
 * This can be used when the user has made significant changes to their workout plan
 */
export function clearSuggestionCache(): void {
  responseCache.clear();
}

/**
 * Sends a message to the AI coach and gets a response
 * @param messages The conversation history
 * @param context Additional context about the user's workouts and equipment
 * @returns A promise resolving to the AI response
 */
export async function sendCoachMessage(
  messages: Message[],
  context?: ChatContext
): Promise<string | null> {
  // Check if API is configured
  if (!isApiConfigured()) {
    console.error('OpenAI API key is not configured');
    return 'Error: OpenAI API key is not configured. Please check your environment variables.';
  }
  
  // Format messages for the API
  const apiMessages = messages.map(message => ({
    role: message.role,
    content: message.content
  }));
  
  // Add system message at the beginning
  apiMessages.unshift({
    role: 'system',
    content: createCoachSystemPrompt(context)
  });
  
  try {
    console.log('Sending request to OpenAI API with model:', DEFAULT_MODEL);
    console.log('API Key configured:', !!getApiKey());
    
    const requestBody = JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.5, // Slightly higher temperature for more natural conversation
      max_tokens: 2000, // More tokens for detailed responses
      messages: apiMessages
    });
    
    console.log('Request payload size:', requestBody.length, 'bytes');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`
      },
      body: requestBody
    });
    
    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error details:', JSON.stringify(errorData));
      
      // Return a user-friendly error message based on status
      if (response.status === 401) {
        return 'Error: API key is invalid. Please contact support.';
      } else if (response.status === 429) {
        return 'Error: Rate limit exceeded. Please try again later.';
      } else if (response.status === 400) {
        return `Error: Bad request - ${errorData.error?.message || 'Unknown error'}`;
      } else {
        return `Error: OpenAI API error (${response.status}). Please try again later.`;
      }
    }
    
    const data = await response.json();
    console.log('Response received:', !!data);
    
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error('Empty response content from OpenAI API');
      return 'Error: Received an empty response from the AI. Please try again.';
    }
    
    return content;
  } catch (error) {
    console.error('Error details:', error);
    return 'I apologize, but I\'m unable to provide coaching advice right now. Please try again later.';
  }
}

/**
 * Creates workout modification suggestions based on user feedback
 * @param workout The workout to modify
 * @param feedback User feedback about the workout
 * @returns A promise resolving to the coach response
 */
export async function createWorkoutModifications(
  workout: WorkoutPerformance,
  feedback: string,
  equipmentProfile?: EquipmentProfile
): Promise<WorkoutCoachResponse | null> {
  // Check if API is configured
  if (!isApiConfigured()) {
    console.error('OpenAI API key is not configured');
    return null;
  }
  
  const systemPrompt = `You are an expert strength coach and personal trainer with deep knowledge of weight training, 
  progressive overload, and exercise form. Your task is to analyze a workout performance and user feedback 
  to suggest appropriate modifications to the program.
  
  Provide your response as a JSON object with:
  1. A clear explanation of your overall assessment
  2. Specific modifications to individual exercises
  3. Any program adjustments if needed (e.g., deload, volume changes)
  
  Always consider safety first, and ensure your recommendations match the user's available equipment.`;
  
  let equipmentString = '';
  if (equipmentProfile) {
    equipmentString = `\nEquipment constraints:\n`;
    equipmentString += `Location: ${equipmentProfile.location}\n`;
    
    if (equipmentProfile.constraints.length > 0) {
      equipmentString += 'Specific constraints:\n';
      equipmentProfile.constraints.forEach((constraint: EquipmentConstraint) => {
        equipmentString += constraint.exerciseId 
          ? `Exercise ${constraint.exerciseId}: `
          : 'General: ';
        
        equipmentString += `Min weight: ${constraint.minWeight || 'N/A'}, `;
        equipmentString += `Max weight: ${constraint.maxWeight || 'N/A'}, `;
        equipmentString += `Increment: ${constraint.incrementSize || 'N/A'}\n`;
      });
    }
  }
  
  const userPrompt = `Please analyze the following workout performance and suggest appropriate modifications:
  
  Workout ID: ${workout.workoutDayId}
  Date: ${workout.date}
  Overall Rating: ${workout.overallRating || 'Not provided'}
  Duration: ${workout.duration || 'Not recorded'} minutes
  
  Exercise performance:
  ${workout.exercises.map(ex => `
    Exercise ID: ${ex.exerciseId}
    Weight: ${ex.weight} ${ex.weightUnit}
    Sets: ${ex.completedSets}/${ex.targetSets}
    Reps: ${ex.completedReps.join(', ')}
    RPE: ${ex.rpe || 'Not recorded'}
    Form: ${ex.formQuality || 'Not recorded'}
    Difficulty: ${ex.difficulty || 'Not recorded'}
    Issues: ${ex.issues?.join(', ') || 'None'}
    Notes: ${ex.notes || 'None'}
  `).join('\n')}
  
  User feedback:
  ${feedback}
  
  ${equipmentString}
  
  Please provide your recommendations in the following JSON format:
  {
    "explanation": "Overall assessment and general advice",
    "modifications": [
      {
        "exerciseId": "exercise_id",
        "changes": [
          {
            "parameter": "weight|sets|reps|tempo",
            "currentValue": "current value",
            "recommendedValue": "recommended value",
            "reasoning": "specific reasoning for this change"
          }
        ]
      }
    ],
    "programAdjustments": {
      "type": "deload|volume_increase|intensity_focus",
      "duration": 1,
      "details": "Detailed explanation of the program adjustment"
    }
  }`;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const contentStr = data.choices[0]?.message?.content;
    
    if (!contentStr) {
      throw new Error('Empty response from OpenAI API');
    }
    
    // Parse the JSON response
    try {
      const modifications: WorkoutCoachResponse = JSON.parse(contentStr);
      return modifications;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid response format from OpenAI API');
    }
  } catch (error) {
    console.error('Error generating workout modifications:', error);
    return null;
  }
}

export async function getCoachResponse(
  conversationHistory: { role: string; content: string }[],
  userContext: any
): Promise<any> {
  // Check if API is configured
  if (!isApiConfigured()) {
    console.error('OpenAI API key is not configured');
    throw new Error('OpenAI API key is not configured');
  }
  
  try {
    // Format messages for the API
    const apiMessages = conversationHistory.map(message => ({
      role: message.role,
      content: message.content
    }));
    
    // Create context object
    const context: ChatContext = {
      recentWorkouts: userContext.workoutHistory?.map((workout: any) => ({
        date: workout.date,
        workoutDayId: workout.id || '',
        overallRating: workout.rating || undefined,
        overallFeedback: workout.feedback || undefined
      })) || [],
      selectedWorkoutId: userContext.currentWorkout?.id,
      selectedExerciseId: userContext.currentWorkout?.exercises?.[0]?.id,
      equipmentProfile: userContext.equipmentProfile
      // userIssue is omitted as it must match the specific enum values
    };
    
    // Add system message at the beginning
    apiMessages.unshift({
      role: 'system',
      content: createCoachSystemPrompt(context)
    });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.5,
        max_tokens: 2000,
        messages: apiMessages
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const contentStr = data.choices[0]?.message?.content;
    
    if (!contentStr) {
      throw new Error('Empty response from OpenAI API');
    }
    
    // Parse the JSON response
    try {
      const coachResponse = JSON.parse(contentStr);
      return coachResponse;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid response format from OpenAI API');
    }
  } catch (error) {
    console.error('Error getting coach response:', error);
    throw error; // Re-throw to match test expectations
  }
} 