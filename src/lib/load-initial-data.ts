import { loadWorkoutPlanFromMarkdown } from './workout-service';
import { v4 as uuidv4 } from 'uuid';
import { EquipmentProfile } from '@/types/workout';
import * as db from './db';

/**
 * Load the initial workout plan from the markdown file and initialize the database
 */
export async function loadInitialData(workoutPlanMarkdown: string): Promise<void> {
  try {
    // Check if we already have data
    const existingPlans = await db.getAll('workout-plans');
    
    if (existingPlans.length === 0) {
      // Parse and load the workout plan
      await loadWorkoutPlanFromMarkdown(workoutPlanMarkdown);
      
      // Create default equipment profile
      const defaultProfile: EquipmentProfile = {
        id: uuidv4(),
        name: 'Default Equipment',
        location: 'Home',
        constraints: [
          {
            minWeight: 5,
            maxWeight: 100,
            incrementSize: 5,
            notes: 'Standard dumbbells (5lb increments)'
          }
        ],
        isDefault: true
      };
      
      await db.put('equipment-profiles', defaultProfile);
      
      console.log('Initial data loaded successfully');
    } else {
      console.log('Database already contains workout plans, skipping initialization');
    }
  } catch (error) {
    console.error('Error loading initial data:', error);
    throw new Error('Failed to load initial data');
  }
} 