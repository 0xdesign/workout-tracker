'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkoutData } from '@/providers/WorkoutDataProvider';
import { ExerciseType, ExercisePerformance, WorkoutPerformance } from '@/types/workout';
import { formatTempo } from '@/utils/workout-parser';
import Link from 'next/link';
import * as workoutService from '@/lib/workout-service';
import AISuggestions from '@/components/AISuggestions';

interface ExerciseDetailPageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function ExerciseDetailPage({ params }: ExerciseDetailPageProps) {
  const { id } = params;
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
  
  // Load exercise data
  useEffect(() => {
    if (workoutPlan) {
      // Find the exercise in any of the workout days
      for (const day of workoutPlan.days) {
        const foundExercise = day.exercises.find(ex => ex.id === id);
        if (foundExercise) {
          setExercise(foundExercise);
          break;
        }
      }
    }
  }, [workoutPlan, id]);
  
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
          const exercisePerf = perf.exercises.find((ex: ExercisePerformance) => ex.exerciseId === id);
          if (exercisePerf) {
            setPerformance(exercisePerf);
          }
        }
        
        // Get previous performance for comparison and AI suggestions
        const history = await workoutService.getExercisePerformanceHistory(id, 5); // Get last 5 performances
        if (history.length > 0) {
          setPreviousPerformance(history[0]);
          setPerformanceHistory(history);
        }
      } catch (err) {
        console.error('Error loading performance data:', err);
      }
    };
    
    loadPerformanceData();
  }, [exercise, workoutId, date, id]);
  
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
        ex.exerciseId === id ? performance : ex
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600">Loading exercise details...</p>
      </div>
    );
  }
  
  if (error || !exercise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-4 bg-red-50 text-red-800 rounded-lg max-w-lg">
          <h2 className="text-lg font-medium mb-2">Error Loading Exercise</h2>
          <p>{error || "Exercise not found"}</p>
          <Link 
            href="/"
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 mr-2"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">{exercise.name}</h1>
            <span className="ml-2 text-sm rounded-full px-2 py-1 bg-gray-100 text-gray-700">
              {exercise.group}
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            {exercise.sets} sets × {formatReps(exercise.reps)} reps
            {exercise.weight && ` • ${exercise.weight} ${exercise.weightUnit || 'lb'}`}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">Exercise Information</h2>
        
        {exercise.notes && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">Instructions</h3>
            <p className="text-sm text-yellow-700">{exercise.notes}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-md p-3">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Sets & Reps</h3>
            <p className="text-lg font-medium">{exercise.sets} sets × {formatReps(exercise.reps)} reps</p>
          </div>
          
          {exercise.tempo && (
            <div className="border border-gray-200 rounded-md p-3">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tempo</h3>
              <p className="text-lg font-medium">{exercise.tempo}</p>
              <p className="text-xs text-gray-500">{formatTempo(exercise.tempo)}</p>
            </div>
          )}
          
          {exercise.rest && (
            <div className="border border-gray-200 rounded-md p-3">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Rest Period</h3>
              <p className="text-lg font-medium">{exercise.rest} seconds</p>
            </div>
          )}
          
          {exercise.weight && (
            <div className="border border-gray-200 rounded-md p-3">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Recommended Weight</h3>
              <p className="text-lg font-medium">{exercise.weight} {exercise.weightUnit || 'lb'}</p>
            </div>
          )}
        </div>
        
        {previousPerformance && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Previous Performance</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">
                  {new Date(previousPerformance.workoutDate || '').toLocaleDateString()}
                </span>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-1">
                    {previousPerformance.weight} {previousPerformance.weightUnit}
                  </span>
                  {getWeightTrend() === 'up' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                  {getWeightTrend() === 'down' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {previousPerformance.completedSets} sets × 
                {previousPerformance.completedReps.join(', ')} reps
              </div>
              {previousPerformance.rpe && (
                <div className="text-sm text-gray-600 mt-1">
                  RPE: {previousPerformance.rpe}/10
                </div>
              )}
              {previousPerformance.formQuality && (
                <div className="text-sm text-gray-600 mt-1">
                  Form quality: {previousPerformance.formQuality}
                </div>
              )}
              {previousPerformance.difficulty && (
                <div className="text-sm text-gray-600 mt-1">
                  Difficulty: {previousPerformance.difficulty.replace('_', ' ')}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* AI Suggestions Component */}
        {performance && performanceHistory.length > 0 && (
          <AISuggestions
            exerciseId={id}
            performanceHistory={performanceHistory}
            onApplySuggestion={handleApplySuggestion}
          />
        )}
        
        {performance && (
          <div>
            <h3 className="text-lg font-medium mb-4">Track Your Performance</h3>
            
            {/* Weight Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
              <div className="flex items-center">
                <button 
                  onClick={() => handleWeightChange(performance.weight - 5)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-l-md"
                  aria-label="Decrease weight"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={performance.weight}
                  onChange={(e) => handleWeightChange(Number(e.target.value))}
                  className="w-20 h-10 text-center border-t border-b border-gray-300"
                  min="0"
                  step="5"
                />
                <button 
                  onClick={() => handleWeightChange(performance.weight + 5)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-r-md"
                  aria-label="Increase weight"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <div className="ml-3">
                  <select
                    value={performance.weightUnit}
                    onChange={(e) => handleWeightUnitChange(e.target.value as 'lb' | 'kg')}
                    className="h-10 border border-gray-300 rounded-md px-2"
                  >
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Sets and Reps Inputs */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sets Completed: {performance.completedSets} / {performance.targetSets}
              </label>
              
              <div className="space-y-3">
                {performance.targetReps.map((targetRep, index) => (
                  <div key={index} className="flex items-center border border-gray-200 rounded-md p-2">
                    <span className="text-sm font-medium mr-3 min-w-10">Set {index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <button 
                          onClick={() => handleRepsChange(index, Math.max(0, (performance.completedReps[index] || 0) - 1))}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-l-md"
                          aria-label="Decrease reps"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <input
                          type="number"
                          value={performance.completedReps[index] || 0}
                          onChange={(e) => handleRepsChange(index, Number(e.target.value))}
                          className="w-14 h-8 text-center border-t border-b border-gray-300"
                          min="0"
                        />
                        <button 
                          onClick={() => handleRepsChange(index, (performance.completedReps[index] || 0) + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-r-md"
                          aria-label="Increase reps"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">Target: {targetRep}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* RPE Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RPE (Rate of Perceived Exertion) - How hard was this exercise?
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRPEChange(value)}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center 
                      ${performance.rpe === value ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-indigo-100'}
                    `}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Easy</span>
                <span>Moderate</span>
                <span>Maximum Effort</span>
              </div>
            </div>
            
            {/* Form Quality Assessment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Quality
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'poor', label: 'Poor', color: 'bg-red-100 text-red-800 border-red-200' },
                  { value: 'good', label: 'Good', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                  { value: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-800 border-green-200' }
                ].map((quality) => (
                  <button
                    key={quality.value}
                    onClick={() => handleFormQualityChange(quality.value as any)}
                    className={`
                      flex-1 py-2 px-3 rounded-md border 
                      ${performance.formQuality === quality.value 
                        ? `${quality.color} border-2` 
                        : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'}
                    `}
                  >
                    {quality.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Difficulty Assessment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'too_easy', label: 'Too Easy', color: 'bg-green-100 text-green-800 border-green-200' },
                  { value: 'appropriate', label: 'Just Right', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { value: 'too_hard', label: 'Too Hard', color: 'bg-red-100 text-red-800 border-red-200' }
                ].map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => handleDifficultyChange(difficulty.value as any)}
                    className={`
                      flex-1 py-2 px-3 rounded-md border 
                      ${performance.difficulty === difficulty.value 
                        ? `${difficulty.color} border-2` 
                        : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'}
                    `}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Common Issues */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        ? 'bg-gray-800 text-white border-gray-800' 
                        : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={performance.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 resize-none"
                placeholder="Any comments about your performance..."
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSavePerformance}
                disabled={isSubmitting}
                className={`
                  px-4 py-2 bg-green-600 text-white rounded-md 
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}
                `}
              >
                {isSubmitting ? 'Saving...' : 'Complete Exercise'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 