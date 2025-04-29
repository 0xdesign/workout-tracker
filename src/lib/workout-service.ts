import { v4 as uuidv4 } from 'uuid';
import { WorkoutPlan, WorkoutDay, ExerciseType, WorkoutPerformance, ExercisePerformance } from '@/types/workout';
import * as db from '@/lib/db';
import { parseWorkoutPlan } from '@/utils/workout-parser';

/**
 * Load workout plan from markdown content and store it in the database
 * @param markdownContent The content of the workout plan markdown file
 * @returns The parsed and stored workout plan
 */
export async function loadWorkoutPlanFromMarkdown(markdownContent: string): Promise<WorkoutPlan> {
  try {
    // Parse the markdown content into a structured workout plan
    const workoutPlan = parseWorkoutPlan(markdownContent);
    
    // Store in the database
    await db.put('workout-plans', workoutPlan);
    
    return workoutPlan;
  } catch (error) {
    console.error('Error loading workout plan:', error);
    throw new Error('Failed to load workout plan');
  }
}

/**
 * Save a workout plan to the database
 * @param plan The workout plan to save
 * @returns The ID of the saved plan
 */
export async function savePlan(plan: WorkoutPlan): Promise<string> {
  return db.put('workout-plans', plan);
}

/**
 * Get all workout plans from the database
 * @returns Array of workout plans
 */
export async function getAllWorkoutPlans(): Promise<WorkoutPlan[]> {
  return db.getAll('workout-plans');
}

/**
 * Get a workout plan by ID
 * @param id The workout plan ID
 * @returns The workout plan, or undefined if not found
 */
export async function getWorkoutPlan(id: string): Promise<WorkoutPlan | undefined> {
  return db.get('workout-plans', id);
}

/**
 * Get the active workout plan (currently just returns the first one)
 * @returns The active workout plan, or undefined if none exists
 */
export async function getActiveWorkoutPlan(): Promise<WorkoutPlan | undefined> {
  const plans = await getAllWorkoutPlans();
  return plans.length > 0 ? plans[0] : undefined;
}

/**
 * Find a workout day for a specific calendar date
 * @param date The date to find the workout for
 * @returns The workout day for that date, or undefined if it's a rest day or no plan exists
 */
export async function getWorkoutDayForDate(date: Date): Promise<WorkoutDay | undefined> {
  const plan = await getActiveWorkoutPlan();
  if (!plan) return undefined;
  
  // Get the day of the week (0-6, where 0 is Sunday)
  let dayOfWeek = date.getDay();
  
  // Convert to 1-7 where 1 is Monday
  dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  
  // Find the workout day that matches this day of the week
  return plan.days.find(day => day.day === dayOfWeek);
}

/**
 * Record a workout performance
 * @param performance The workout performance data to record
 * @returns The ID of the saved performance
 */
export async function recordWorkoutPerformance(performance: WorkoutPerformance): Promise<string> {
  if (!performance.id) {
    performance.id = uuidv4();
  }
  
  if (!performance.date) {
    performance.date = new Date().toISOString().split('T')[0];
  }
  
  performance.timestamp = Date.now();
  
  return db.put('workout-performances', performance);
}

/**
 * Get workout performances for a date range
 * @param startDate Start date (inclusive, YYYY-MM-DD format)
 * @param endDate End date (inclusive, YYYY-MM-DD format)
 * @returns Array of workout performances
 */
export async function getWorkoutPerformancesByDateRange(
  startDate: string,
  endDate: string
): Promise<WorkoutPerformance[]> {
  return db.getWorkoutPerformancesByDate(startDate, endDate);
}

/**
 * Get all workout performances for a specific workout day
 * @param workoutDayId The workout day ID
 * @returns Array of workout performances
 */
export async function getWorkoutPerformancesForDay(
  workoutDayId: string
): Promise<WorkoutPerformance[]> {
  return db.getWorkoutPerformancesByWorkoutDayId(workoutDayId);
}

/**
 * Get the latest workout performance for a specific workout day
 * @param workoutDayId The workout day ID
 * @returns The latest workout performance, or undefined if none exists
 */
export async function getLatestWorkoutPerformanceForDay(
  workoutDayId: string
): Promise<WorkoutPerformance | undefined> {
  return db.getLatestWorkoutPerformance(workoutDayId);
}

/**
 * Get a specific workout performance by workout ID and date
 * @param workoutDayId The workout day ID
 * @param date The date string (YYYY-MM-DD format)
 * @returns The workout performance for that day, or a new template if none exists
 */
export async function getWorkoutPerformance(
  workoutDayId: string,
  date: string
): Promise<WorkoutPerformance | undefined> {
  try {
    // Get all performances for this workout day
    const performances = await getWorkoutPerformancesForDay(workoutDayId);
    
    // Find the one for the specified date
    const performance = performances.find(p => p.date === date);
    
    if (performance) {
      return performance;
    }
    
    // If no performance exists, create a template
    return createWorkoutPerformanceTemplate(workoutDayId);
  } catch (err) {
    console.error('Error getting workout performance:', err);
    return undefined;
  }
}

/**
 * Get performance history for a specific exercise
 * @param exerciseId The exercise ID
 * @param limit Maximum number of performances to return
 * @returns Array of exercise performances, ordered by date (newest first)
 */
export async function getExercisePerformanceHistory(
  exerciseId: string,
  limit = 10
): Promise<ExercisePerformance[]> {
  // Get all workout performances
  const performances = await db.getAll('workout-performances');
  
  // Extract exercise performances for the target exercise
  const exercisePerformances = performances
    .flatMap(perf => 
      perf.exercises
        .filter(ex => ex.exerciseId === exerciseId)
        .map(ex => ({
          ...ex,
          workoutDate: perf.date,
          workoutId: perf.id
        }))
    )
    .sort((a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime())
    .slice(0, limit);
  
  return exercisePerformances;
}

/**
 * Create a default template for recording a workout performance
 * @param workoutDayId The workout day ID
 * @returns A pre-populated workout performance object
 */
export async function createWorkoutPerformanceTemplate(
  workoutDayId: string
): Promise<WorkoutPerformance> {
  const plan = await getActiveWorkoutPlan();
  if (!plan) throw new Error('No active workout plan found');
  
  const workoutDay = plan.days.find(day => day.id === workoutDayId);
  if (!workoutDay) throw new Error(`Workout day with ID ${workoutDayId} not found`);
  
  // Get latest performance for this workout day to pre-fill values
  const latestPerformance = await getLatestWorkoutPerformanceForDay(workoutDayId);
  
  const exercises: ExercisePerformance[] = workoutDay.exercises.map(exercise => {
    // Find this exercise in the latest performance, if available
    const previousPerformance = latestPerformance?.exercises.find(
      e => e.exerciseId === exercise.id
    );
    
    // Calculate target reps based on exercise definition
    let targetReps: number[] = [];
    if (Array.isArray(exercise.reps)) {
      targetReps = exercise.reps;
    } else if (typeof exercise.reps === 'number') {
      targetReps = Array(exercise.sets).fill(exercise.reps);
    } else if (typeof exercise.reps === 'string' && exercise.reps.includes('-')) {
      const [min, max] = exercise.reps.split('-').map(Number);
      targetReps = Array(exercise.sets).fill((min + max) / 2);
    } else {
      targetReps = Array(exercise.sets).fill(10);
    }
    
    return {
      exerciseId: exercise.id,
      weight: previousPerformance?.weight || exercise.weight || 0,
      weightUnit: previousPerformance?.weightUnit || exercise.weightUnit || 'lb',
      targetSets: exercise.sets,
      completedSets: 0,
      targetReps,
      completedReps: Array(targetReps.length).fill(0),
      timestamp: Date.now()
    };
  });
  
  return {
    id: uuidv4(),
    workoutDayId,
    date: new Date().toISOString().split('T')[0],
    exercises
  };
} 