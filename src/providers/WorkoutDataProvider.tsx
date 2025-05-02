'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WorkoutPlan, WorkoutDay, WorkoutPerformance } from '@/types/workout';
import * as workoutService from '@/lib/workout-service';
import { parseWorkoutPlan } from '@/utils/workout-parser';

interface WorkoutDataContextType {
  isLoading: boolean;
  error: string | null;
  workoutPlan: WorkoutPlan | null;
  workoutDaysByDate: Record<string, WorkoutDay>;
  workoutCompletionStatus: Record<string, boolean>;
  recentWorkouts: WorkoutPerformance[] | null;
  getWorkoutDayForDate: (date: Date) => Promise<WorkoutDay | undefined>;
  getWorkoutPerformance: (workoutDayId: string, date: string) => Promise<WorkoutPerformance | undefined>;
  refreshData: () => Promise<void>;
  getAllWorkoutDays: () => WorkoutDay[] | null;
}

const WorkoutDataContext = createContext<WorkoutDataContextType | undefined>(undefined);

interface WorkoutDataProviderProps {
  children: ReactNode;
}

// Fallback workout plan markdown content if API fails
const FALLBACK_WORKOUT_PLAN = `# 4-DAY WORKOUT PLAN

## DAY 1: UPPER BODY A

### Mobility/Warm-up
- **M1**: Bird Dogs with 5sec Hold @ top (5 each side, 1 set, Controlled tempo)
  - *Reach opposite arm and leg - think long not high - keep spine neutral*
- **M2**: Stick Dislocates (10 reps, 1 set, Controlled tempo)
  - *Go as wide as needed to keep arms straight and movement smooth*
- **M3**: Lock Banded or Cable Lat Pull (10 each side, 1 set, Controlled tempo)
  - *Pull elbow toward hip to activate back, particularly lats*

### Main Workout
- **A1**: 30° Incline DB Press - Rotating grip (10-12 reps, 3 sets, Tempo: 3020, Rest: 90s)
  - *Keep it smooth - squeeze it up - 3s down and 2s up - no bouncing off chest*
  - *Recommended weight: 45 lbs*

- **A2**: Chin Ups - Mid Pronated Grip - Machine assisted (10-12 reps, 3 sets, Tempo: 3020, Rest: 90s)
  - *2s up and 3s down*
  - *Keep good posture - Don't let shoulders roll forward*
  - *Recommended assistance: 140 lbs on machine*`;

export function WorkoutDataProvider({ children }: WorkoutDataProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [workoutDaysByDate, setWorkoutDaysByDate] = useState<Record<string, WorkoutDay>>({});
  const [workoutCompletionStatus, setWorkoutCompletionStatus] = useState<Record<string, boolean>>({});
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutPerformance[] | null>(null);
  
  const loadWorkoutData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to load workout plan from the database first
      let plan = await workoutService.getActiveWorkoutPlan();
      
      // If no plan exists in the database, fetch from API
      if (!plan) {
        try {
          const response = await fetch('/api/workout-plan');
          const data = await response.json();
          
          if (!data.success || !data.workoutPlan) {
            throw new Error(data.error || 'Failed to load workout plan');
          }
          
          plan = data.workoutPlan;
        } catch (apiError) {
          console.error('API error, using fallback plan:', apiError);
          
          // Use fallback workout plan if API fails
          plan = parseWorkoutPlan(FALLBACK_WORKOUT_PLAN);
          console.log('Using fallback workout plan');
        }
        
        // Save the plan to IndexedDB
        try {
          if (plan) {
            await workoutService.savePlan(plan);
            console.log('Workout plan saved to IndexedDB');
          }
        } catch (dbError) {
          console.warn('Failed to save workout plan to IndexedDB:', dbError);
          // Continue anyway since we have the plan in memory
        }
      }
      
      // Now plan is definitely defined
      if (plan) {
        setWorkoutPlan(plan);
        
        // Generate workoutDaysByDate mapping for an extended date range (3 months back, 3 months forward)
        const today = new Date();
        
        // Create a date range spanning 3 months back and 3 months forward
        const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1); // 2 months back
        const endDate = new Date(today.getFullYear(), today.getMonth() + 4, 0);   // 3 months forward (end of 3rd month)
        
        const daysByDate: Record<string, WorkoutDay> = {};
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay() || 7; // Convert Sunday (0) to 7 for consistency
          const matchingDay = plan.days.find(day => day.day === dayOfWeek);
          
          if (matchingDay) {
            const dateStr = d.toISOString().split('T')[0];
            daysByDate[dateStr] = matchingDay;
          }
        }
        
        setWorkoutDaysByDate(daysByDate);
        
        // Load workout completion status for the extended date range
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        await loadWorkoutCompletionStatus(daysByDate, startDateStr, endDateStr);
        
        // Load recent workouts for use in the coach component
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const recentStartDateStr = twoWeeksAgo.toISOString().split('T')[0];
        const todayDateStr = new Date().toISOString().split('T')[0];
        
        const recent = await workoutService.getWorkoutPerformancesByDateRange(recentStartDateStr, todayDateStr);
        setRecentWorkouts(recent.filter(wp => wp.exercises.some(ex => ex.completedSets > 0)));
      } else {
        setError('No workout plan available. Please create one first.');
      }
    } catch (err) {
      console.error('Error loading workout data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadWorkoutCompletionStatus = async (
    daysByDate: Record<string, WorkoutDay>,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      // If dates are not provided, use the current month
      if (!startDate || !endDate) {
        const today = new Date();
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      }
      
      const performances = await workoutService.getWorkoutPerformancesByDateRange(startDate, endDate);
      
      const completionStatus: Record<string, boolean> = {};
      
      // Mark days with completed workouts
      for (const perf of performances) {
        if (perf.exercises.some(ex => ex.completedSets > 0)) {
          completionStatus[perf.date] = true;
        }
      }
      
      setWorkoutCompletionStatus(completionStatus);
    } catch (err) {
      console.error('Error loading workout completion status:', err);
    }
  };
  
  const getWorkoutDayForDate = useCallback(async (date: Date): Promise<WorkoutDay | undefined> => {
    const dateStr = date.toISOString().split('T')[0];
    return workoutDaysByDate[dateStr];
  }, [workoutDaysByDate]);
  
  const getWorkoutPerformance = useCallback(async (
    workoutDayId: string,
    date: string
  ): Promise<WorkoutPerformance | undefined> => {
    try {
      // Get all performances for this workout day
      const performances = await workoutService.getWorkoutPerformancesForDay(workoutDayId);
      
      // Find the one for the specified date
      const performance = performances.find(p => p.date === date);
      
      if (performance) {
        return performance;
      }
      
      // If no performance exists, create a template
      return workoutService.createWorkoutPerformanceTemplate(workoutDayId);
    } catch (err) {
      console.error('Error getting workout performance:', err);
      return undefined;
    }
  }, []);
  
  const refreshData = useCallback(async () => {
    await loadWorkoutData();
  }, [loadWorkoutData]);
  
  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]);
  
  const value = {
    isLoading,
    error,
    workoutPlan,
    workoutDaysByDate,
    workoutCompletionStatus,
    recentWorkouts,
    getWorkoutDayForDate,
    getWorkoutPerformance,
    refreshData,
    getAllWorkoutDays: () => Object.values(workoutDaysByDate)
  };
  
  return (
    <WorkoutDataContext.Provider value={value}>
      {children}
    </WorkoutDataContext.Provider>
  );
}

export function useWorkoutData() {
  const context = useContext(WorkoutDataContext);
  
  if (context === undefined) {
    throw new Error('useWorkoutData must be used within a WorkoutDataProvider');
  }
  
  return context;
} 