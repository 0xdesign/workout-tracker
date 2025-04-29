import { useState, useEffect } from 'react';
import { ExercisePerformance, WorkoutCoachResponse } from '@/types/workout';
import * as openaiService from '@/lib/openai-service';

interface AISuggestionsProps {
  exerciseId: string;
  performanceHistory: ExercisePerformance[];
  onApplySuggestion: (parameter: string, value: any) => void;
}

export default function AISuggestions({ 
  exerciseId, 
  performanceHistory, 
  onApplySuggestion 
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<WorkoutCoachResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch suggestions when the component mounts or when the performance history changes
  useEffect(() => {
    // Only fetch suggestions if there's performance history
    if (!performanceHistory || performanceHistory.length === 0) {
      return;
    }
    
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await openaiService.getPerformanceSuggestions(
          exerciseId,
          performanceHistory
        );
        
        setSuggestions(response);
      } catch (err) {
        console.error('Error fetching performance suggestions:', err);
        setError('Failed to load AI suggestions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [exerciseId, performanceHistory]);
  
  // If there's no performance history, don't render anything
  if (!performanceHistory || performanceHistory.length === 0) {
    return null;
  }
  
  // Display a loading state
  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-md p-4 mb-6 bg-gray-50">
        <h3 className="text-md font-medium mb-2 flex items-center text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Coach Suggestions
        </h3>
        <div className="flex items-center justify-center py-3">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
          <p className="text-gray-500 text-sm">Analyzing your performance data...</p>
        </div>
      </div>
    );
  }
  
  // Display any error messages
  if (error) {
    return (
      <div className="border border-red-200 rounded-md p-4 mb-6 bg-red-50">
        <h3 className="text-md font-medium mb-2 flex items-center text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          AI Coach Suggestions
        </h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }
  
  // If there are no suggestions, don't render anything
  if (!suggestions || !suggestions.modifications || suggestions.modifications.length === 0) {
    return null;
  }
  
  const exerciseModification = suggestions.modifications.find(m => m.exerciseId === exerciseId);
  
  if (!exerciseModification || !exerciseModification.changes || exerciseModification.changes.length === 0) {
    return null;
  }
  
  return (
    <div className="border border-indigo-200 rounded-md p-4 mb-6 bg-indigo-50">
      <h3 className="text-md font-medium mb-2 flex items-center text-indigo-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        AI Coach Suggestions
      </h3>
      
      <div className="text-sm text-indigo-700 mb-3">
        {suggestions.explanation}
      </div>
      
      <div className="space-y-3">
        {exerciseModification.changes.map((change, index) => (
          <div key={index} className="bg-white border border-indigo-100 rounded-md p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium capitalize">{change.parameter}:</span>
              <button
                onClick={() => onApplySuggestion(change.parameter, change.recommendedValue)}
                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
              >
                Apply Suggestion
              </button>
            </div>
            <div className="flex text-sm mb-2">
              <div className="mr-2">
                <span className="text-gray-500">Current:</span> {change.currentValue}
              </div>
              <div className="font-medium">
                <span className="text-gray-500">→</span> {change.recommendedValue}
              </div>
            </div>
            <p className="text-xs text-gray-600">
              {change.reasoning}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 