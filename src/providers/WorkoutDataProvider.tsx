'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WorkoutPlan, WorkoutDay, WorkoutPerformance } from '@/types/workout';
import * as workoutService from '@/lib/workout-service';

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
}

const WorkoutDataContext = createContext<WorkoutDataContextType | undefined>(undefined);

interface WorkoutDataProviderProps {
  children: ReactNode;
}

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
        const response = await fetch('/api/workout-plan');
        const data = await response.json();
        
        if (!data.success || !data.workoutPlan) {
          throw new Error(data.error || 'Failed to load workout plan');
        }
        
        plan = data.workoutPlan;
        
        // Save the plan to IndexedDB
        try {
          await workoutService.savePlan(plan);
          console.log('Workout plan saved to IndexedDB');
        } catch (dbError) {
          console.warn('Failed to save workout plan to IndexedDB:', dbError);
          // Continue anyway since we have the plan in memory
        }
      }
      
      // Now plan is definitely defined
      if (plan) {
        setWorkoutPlan(plan);
        
        // Generate workoutDaysByDate mapping for the current month
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
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
        
        // Load workout completion status
        await loadWorkoutCompletionStatus(daysByDate);
        
        // Load recent workouts for use in the coach component
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const startDateStr = twoWeeksAgo.toISOString().split('T')[0];
        const endDateStr = new Date().toISOString().split('T')[0];
        
        const recent = await workoutService.getWorkoutPerformancesByDateRange(startDateStr, endDateStr);
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
  
  const loadWorkoutCompletionStatus = async (daysByDate: Record<string, WorkoutDay>) => {
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      
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
    refreshData
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