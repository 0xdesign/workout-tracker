import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AISuggestions from '@/components/AISuggestions';
import { ExercisePerformance, WorkoutCoachResponse } from '@/types/workout';
import * as openaiService from '@/lib/openai-service';

// Mock the OpenAI service
jest.mock('@/lib/openai-service', () => ({
  getPerformanceSuggestions: jest.fn(),
}));

// Suppress console.error in tests
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('AISuggestions', () => {
  const mockExerciseId = 'exercise-123';
  
  const mockPerformanceHistory: ExercisePerformance[] = [
    {
      exerciseId: mockExerciseId,
      weight: 135,
      weightUnit: 'lb',
      targetSets: 3,
      completedSets: 3,
      targetReps: [10, 10, 10],
      completedReps: [10, 8, 6],
      rpe: 8,
      formQuality: 'good',
      timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
      workoutDate: '2025-04-22',
    },
    {
      exerciseId: mockExerciseId,
      weight: 140,
      weightUnit: 'lb',
      targetSets: 3,
      completedSets: 3,
      targetReps: [10, 10, 10],
      completedReps: [8, 7, 6],
      rpe: 9,
      formQuality: 'good',
      timestamp: Date.now(),
      workoutDate: '2025-04-29',
    },
  ];
  
  const mockResponse: WorkoutCoachResponse = {
    explanation: 'Based on your recent performance, I recommend making the following adjustment:',
    modifications: [
      {
        exerciseId: mockExerciseId,
        changes: [
          {
            parameter: 'weight',
            currentValue: 140,
            recommendedValue: 135,
            reasoning: 'You struggled with reps at 140lb. Let\'s reduce the weight slightly to focus on form and build strength.',
          },
          {
            parameter: 'reps',
            currentValue: [10, 10, 10],
            recommendedValue: [12, 10, 8],
            reasoning: 'A descending rep scheme would better match your fatigue pattern.',
          },
        ],
      },
    ],
  };
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state while fetching suggestions', () => {
    // Mock the API call to delay resolution
    (openaiService.getPerformanceSuggestions as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
    );
    
    render(
      <AISuggestions
        exerciseId={mockExerciseId}
        performanceHistory={mockPerformanceHistory}
        onApplySuggestion={jest.fn()}
      />
    );
    
    expect(screen.getByText('Analyzing your performance data...')).toBeInTheDocument();
  });

  it('displays an error message when the API call fails', async () => {
    // Mock the API call to reject with an error
    (openaiService.getPerformanceSuggestions as jest.Mock).mockRejectedValue(
      new Error('API error')
    );
    
    render(
      <AISuggestions
        exerciseId={mockExerciseId}
        performanceHistory={mockPerformanceHistory}
        onApplySuggestion={jest.fn()}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load AI suggestions. Please try again later.')).toBeInTheDocument();
    });
  });

  it('renders suggestions correctly when data is loaded', async () => {
    // Mock successful API response
    (openaiService.getPerformanceSuggestions as jest.Mock).mockResolvedValue(mockResponse);
    
    render(
      <AISuggestions
        exerciseId={mockExerciseId}
        performanceHistory={mockPerformanceHistory}
        onApplySuggestion={jest.fn()}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Based on your recent performance, I recommend making the following adjustment:')).toBeInTheDocument();
    });
    
    // Check for AI Coach Suggestions header
    expect(screen.getByText('AI Coach Suggestions')).toBeInTheDocument();
    
    // Check for explanations and reasoning
    expect(screen.getByText(/you struggled with reps at 140lb/i)).toBeInTheDocument();
    expect(screen.getByText(/a descending rep scheme/i)).toBeInTheDocument();
    
    // Verify that Apply Suggestion buttons are present
    expect(screen.getAllByText('Apply Suggestion').length).toBe(2);
  });

  it('calls onApplySuggestion when Apply Suggestion button is clicked', async () => {
    // Mock successful API response
    (openaiService.getPerformanceSuggestions as jest.Mock).mockResolvedValue(mockResponse);
    
    const onApplySuggestionMock = jest.fn();
    
    render(
      <AISuggestions
        exerciseId={mockExerciseId}
        performanceHistory={mockPerformanceHistory}
        onApplySuggestion={onApplySuggestionMock}
      />
    );
    
    // Wait for rendering to complete
    await waitFor(() => {
      expect(screen.getAllByText('Apply Suggestion')[0]).toBeInTheDocument();
    });
    
    // Click the Apply Suggestion button for weight
    const applyButtons = screen.getAllByText('Apply Suggestion');
    fireEvent.click(applyButtons[0]);
    
    // Verify onApplySuggestion was called with correct parameters
    expect(onApplySuggestionMock).toHaveBeenCalledWith('weight', 135);
  });

  it('does not render anything when there is no performance history', () => {
    render(
      <AISuggestions
        exerciseId={mockExerciseId}
        performanceHistory={[]}
        onApplySuggestion={jest.fn()}
      />
    );
    
    // The component should not render anything
    expect(screen.queryByText('AI Coach Suggestions')).not.toBeInTheDocument();
  });
}); 