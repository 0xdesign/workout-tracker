'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { ExerciseType, ExercisePerformance, WorkoutPerformance } from '@/types/workout';
import { formatTempo } from '@/utils/workout-parser';
import Link from 'next/link';
import * as workoutService from '@/lib/workout-service';
import AISuggestions from '@/components/AISuggestions';
import { SetTracker } from '@/components/workout/SetTracker';
import RestTimer from '@/components/workout/RestTimer';

interface ExerciseDetailPageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function ExerciseDetailPage({ params }: ExerciseDetailPageProps) {
  // Extract id directly to avoid Next.js warning about synchronous params usage
  const exerciseId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get('date');
  const workoutId = searchParams.get('workoutId');
  
  const { workoutPlan, isLoading, error } = useWorkoutData();
  const [exercise, setExercise] = useState<ExerciseType | null>(null);
  const [performance, setPerformance] = useState<ExercisePerformance | null>(null);
  const [workoutPerformance, setWorkoutPerformance] = useState<WorkoutPerformance | null>(null);
  const [previousPerformance, setPreviousPerformance] = useState<ExercisePerformance | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<ExercisePerformance[]>([]);
  const [showRestTimer, setShowRestTimer] = useState(false);
  
  // Load exercise data
  useEffect(() => {
    if (workoutPlan) {
      // Find the exercise in any of the workout days
      for (const day of workoutPlan.days) {
        const foundExercise = day.exercises.find(ex => ex.id === exerciseId);
        if (foundExercise) {
          setExercise(foundExercise);
          break;
        }
      }
    }
  }, [workoutPlan, exerciseId]);
  
  // Load performance data for this exercise
  useEffect(() => {
    if (!exercise || !workoutId || !date) return;
    
    const loadPerformanceData = async () => {
      try {
        // Get or create workout performance template
        const perf = await workoutService.getWorkoutPerformance(workoutId, date);
        
        if (perf) {
          setWorkoutPerformance(perf);
          
          // Find this specific exercise's performance
          const exercisePerf = perf.exercises.find((ex: ExercisePerformance) => ex.exerciseId === exerciseId);
          if (exercisePerf) {
            setPerformance(exercisePerf);
          }
        }
        
        // Get previous performance for comparison and AI suggestions
        const history = await workoutService.getExercisePerformanceHistory(exerciseId, 5); // Get last 5 performances
        if (history.length > 0) {
          setPreviousPerformance(history[0]);
          setPerformanceHistory(history);
        }
      } catch (err) {
        console.error('Error loading performance data:', err);
      }
    };
    
    loadPerformanceData();
  }, [exercise, workoutId, date, exerciseId]);
  
  const formatReps = (reps: number | number[] | string): string => {
    if (Array.isArray(reps)) {
      return `${reps[0]}-${reps[reps.length - 1]}`;
    }
    return String(reps);
  };
  
  const handleWeightChange = (value: number) => {
    if (!performance) return;
    
    setPerformance({
      ...performance,
      weight: Math.max(0, value)
    });
  };
  
  const handleWeightUnitChange = (unit: 'lb' | 'kg') => {
    if (!performance) return;
    
    setPerformance({
      ...performance,
      weightUnit: unit
    });
  };
  
  const handleRepsChange = (setIndex: number, value: number) => {
    if (!performance) return;
    
    const newCompletedReps = [...performance.completedReps];
    newCompletedReps[setIndex] = Math.max(0, value);
    
    setPerformance({
      ...performance,
      completedReps: newCompletedReps,
      completedSets: newCompletedReps.filter(reps => reps > 0).length
    });
  };
  
  const handleUpdatePerformance = (updatedPerformance: ExercisePerformance) => {
    setPerformance(updatedPerformance);
  };
  
  const handleCompleteSet = (setIndex: number) => {
    if (!performance || !exercise) return;
    
    // Update completed sets
    let newCompletedSets = setIndex + 1;
    if (newCompletedSets <= performance.completedSets) {
      // Don't reduce completed sets if already completed
      return;
    }
    
    // Update performance
    setPerformance({
      ...performance,
      completedSets: newCompletedSets
    });
    
    // Show rest timer if we have more sets and rest is defined
    if (newCompletedSets < exercise.sets && exercise.rest) {
      setShowRestTimer(true);
    }
  };
  
  const handleRPEChange = (value: number) => {
    if (!performance) return;
    
    setPerformance({
      ...performance,
      rpe: value
    });
  };
  
  const handleFormQualityChange = (quality: 'poor' | 'good' | 'excellent') => {
    if (!performance) return;
    
    setPerformance({
      ...performance,
      formQuality: quality
    });
  };
  
  const handleDifficultyChange = (difficulty: 'too_easy' | 'appropriate' | 'too_hard') => {
    if (!performance) return;
    
    setPerformance({
      ...performance,
      difficulty: difficulty
    });
  };
  
  const handleNotesChange = (notes: string) => {
    if (!performance) return;
    
    setPerformance({
      ...performance,
      notes: notes
    });
  };
  
  const handleIssuesChange = (issue: 'soreness' | 'time_constraint' | 'equipment' | 'energy' | 'other') => {
    if (!performance) return;
    
    const issues = performance.issues || [];
    const newIssues = issues.includes(issue)
      ? issues.filter(i => i !== issue)
      : [...issues, issue];
    
    setPerformance({
      ...performance,
      issues: newIssues
    });
  };
  
  const handleApplySuggestion = (parameter: string, value: any) => {
    if (!performance) return;
    
    if (parameter === 'weight') {
      handleWeightChange(value);
    } else if (parameter === 'reps') {
      // Apply suggested reps to all sets
      const newCompletedReps = performance.completedReps.map(() => value);
      setPerformance({
        ...performance,
        completedReps: newCompletedReps,
        completedSets: performance.targetSets
      });
    } else if (parameter === 'sets') {
      setPerformance({
        ...performance,
        completedSets: value
      });
    }
  };
  
  // Save performance data
  const handleSavePerformance = async () => {
    if (!performance || !workoutPerformance) return;
    
    try {
      setIsSubmitting(true);
      
      // Update the exercise performance in the workout performance
      const updatedExercises = workoutPerformance.exercises.map(ex => 
        ex.exerciseId === exerciseId ? performance : ex
      );
      
      const updatedWorkoutPerformance = {
        ...workoutPerformance,
        exercises: updatedExercises
      };
      
      // Save to database
      await workoutService.recordWorkoutPerformance(updatedWorkoutPerformance);
      
      // Navigate back to the workout page
      if (workoutId && date) {
        router.push(`/workout/${workoutId}?date=${date}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Error saving performance:', err);
      alert('Failed to save your performance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWeightTrend = () => {
    if (!previousPerformance || !performance) return null;
    
    const diff = performance.weight - previousPerformance.weight;
    if (diff > 0) return 'up';
    if (diff < 0) return 'down';
    return 'same';
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FC2B4E]"></div>
        <p className="mt-4 text-gray-400">Loading exercise details...</p>
      </div>
    );
  }
  
  if (error || !exercise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
        <div className="p-4 bg-[#2D2D2D] text-white rounded-lg max-w-lg">
          <h2 className="text-lg font-medium mb-2">Error Loading Exercise</h2>
          <p className="text-white">{error || "Exercise not found"}</p>
          <Link 
            href="/"
            className="mt-4 px-4 py-2 bg-[#FC2B4E] text-white rounded-md hover:bg-[#E02646] inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-black text-white">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-800 mr-2"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">{exercise.name}</h1>
            <span className="ml-2 text-sm rounded-full px-2 py-1 bg-[#383838] text-white">
              {exercise.group}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            {exercise.sets} sets × {formatReps(exercise.reps)} reps
            {exercise.weight && ` • ${exercise.weight} ${exercise.weightUnit || 'lb'}`}
          </p>
        </div>
      </div>
      
      {performance && (
        <div className="mb-6">
          <SetTracker
            exercise={{
              id: exercise.id,
              name: exercise.name,
              sets: exercise.sets,
              targetReps: exercise.reps
            }}
            previousPerformance={previousPerformance}
            currentPerformance={performance}
            onUpdate={handleUpdatePerformance}
            onCompleteSet={handleCompleteSet}
          />
        </div>
      )}
      
      <div className="bg-[#2D2D2D] rounded-lg p-4 md:p-6 mb-6">
        <h2 className="text-xl font-medium mb-4 text-white">Exercise Information</h2>
        
        {exercise.notes && (
          <div className="mb-4 p-3 bg-[#383838] rounded-md">
            <h3 className="text-sm font-medium text-[#FC2B4E] mb-1">Instructions</h3>
            <p className="text-sm text-white">{exercise.notes}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-[#383838] rounded-md p-3">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Sets & Reps</h3>
            <p className="text-lg font-medium text-white">{exercise.sets} sets × {formatReps(exercise.reps)} reps</p>
          </div>
          
          {exercise.tempo && (
            <div className="border border-[#383838] rounded-md p-3">
              <h3 className="text-sm font-medium text-gray-400 mb-1">Tempo</h3>
              <p className="text-lg font-medium text-white">{exercise.tempo}</p>
              <p className="text-xs text-gray-400">{formatTempo(exercise.tempo)}</p>
            </div>
          )}
          
          {exercise.rest && (
            <div className="border border-[#383838] rounded-md p-3">
              <h3 className="text-sm font-medium text-gray-400 mb-1">Rest Period</h3>
              <p className="text-lg font-medium text-white">{exercise.rest} seconds</p>
            </div>
          )}
          
          {exercise.weight && (
            <div className="border border-[#383838] rounded-md p-3">
              <h3 className="text-sm font-medium text-gray-400 mb-1">Recommended Weight</h3>
              <p className="text-lg font-medium text-white">{exercise.weight} {exercise.weightUnit || 'lb'}</p>
            </div>
          )}
        </div>
        
        {/* AI Suggestions Component */}
        {performance && performanceHistory.length > 0 && (
          <AISuggestions
            exerciseId={exerciseId}
            performanceHistory={performanceHistory}
            onApplySuggestion={handleApplySuggestion}
          />
        )}
        
        {performance && (
          <div>
            <h3 className="text-lg font-medium mb-4 text-white">Additional Feedback</h3>
            
            {/* RPE Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                RPE (Rate of Perceived Exertion) - How hard was this exercise?
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRPEChange(value)}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center 
                      ${performance.rpe === value ? 'bg-[#FC2B4E] text-white' : 'bg-[#383838] text-white hover:bg-[#FC2B4E]/30'}
                    `}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Very Easy</span>
                <span>Moderate</span>
                <span>Maximum Effort</span>
              </div>
            </div>
            
            {/* Form Quality Assessment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Form Quality
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'poor', label: 'Poor', color: 'bg-[#FC2B4E] text-white border-[#FC2B4E]' },
                  { value: 'good', label: 'Good', color: 'bg-[#FC8B4E] text-white border-[#FC8B4E]' },
                  { value: 'excellent', label: 'Excellent', color: 'bg-[#35C759] text-white border-[#35C759]' }
                ].map((quality) => (
                  <button
                    key={quality.value}
                    onClick={() => handleFormQualityChange(quality.value as any)}
                    className={`
                      flex-1 py-2 px-3 rounded-md border 
                      ${performance.formQuality === quality.value 
                        ? `${quality.color} border-2` 
                        : 'bg-[#383838] text-white border-[#383838] hover:bg-[#2D2D2D]'}
                    `}
                  >
                    {quality.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Difficulty Assessment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Difficulty Level
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'too_easy', label: 'Too Easy', color: 'bg-[#35C759] text-white border-[#35C759]' },
                  { value: 'appropriate', label: 'Just Right', color: 'bg-[#4E85FC] text-white border-[#4E85FC]' },
                  { value: 'too_hard', label: 'Too Hard', color: 'bg-[#FC2B4E] text-white border-[#FC2B4E]' }
                ].map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => handleDifficultyChange(difficulty.value as any)}
                    className={`
                      flex-1 py-2 px-3 rounded-md border 
                      ${performance.difficulty === difficulty.value 
                        ? `${difficulty.color} border-2` 
                        : 'bg-[#383838] text-white border-[#383838] hover:bg-[#2D2D2D]'}
                    `}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Common Issues */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Did you experience any issues? (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'soreness', label: 'Soreness' },
                  { value: 'time_constraint', label: 'Time Constraint' },
                  { value: 'equipment', label: 'Equipment' },
                  { value: 'energy', label: 'Low Energy' },
                  { value: 'other', label: 'Other' }
                ].map((issue) => (
                  <button
                    key={issue.value}
                    onClick={() => handleIssuesChange(issue.value as any)}
                    className={`
                      py-1 px-3 rounded-full border 
                      ${performance.issues?.includes(issue.value as any)
                        ? 'bg-[#FC2B4E] text-white border-[#FC2B4E]' 
                        : 'bg-[#383838] text-white border-[#383838] hover:bg-[#2D2D2D]'}
                      text-sm
                    `}
                  >
                    {issue.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Notes Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={performance.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="w-full bg-[#383838] border border-[#383838] rounded-md px-3 py-2 h-24 resize-none text-white"
                placeholder="Any comments about your performance..."
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSavePerformance}
                disabled={isSubmitting}
                className={`
                  px-4 py-2 bg-[#35C759] text-white rounded-md 
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#35C759]/90'}
                `}
              >
                {isSubmitting ? 'Saving...' : 'Complete Exercise'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Rest Timer Modal */}
      {exercise.rest && (
        <RestTimer
          initialTime={exercise.rest}
          isOpen={showRestTimer}
          onComplete={() => setShowRestTimer(false)}
          onCancel={() => setShowRestTimer(false)}
        />
      )}
    </div>
  );
} 