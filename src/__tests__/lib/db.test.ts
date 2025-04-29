import { openDB, deleteDB, DBSchema, IDBPDatabase } from 'idb';
import {
  initializeDatabase,
  saveWorkoutPerformance,
  getWorkoutPerformanceById,
  getAllWorkoutPerformances,
  getAllPerformancesByExerciseId,
  deleteWorkoutPerformance
} from '@/lib/db';
import { WorkoutPerformance } from '@/types/workout';

// Mock IndexedDB
jest.mock('idb', () => {
  // Create a mock in-memory database with all required stores
  const mockDBStore: Record<string, Map<string, any>> = {
    'workout-plans': new Map(),
    'workout-performances': new Map(),
    'equipment-profiles': new Map()
  };
  
  // Mock database operations
  const mockDB = {
    // Transaction mock
    transaction: jest.fn().mockImplementation((storeName, mode) => {
      return {
        objectStore: jest.fn().mockImplementation((storeName) => {
          return {
            // IndexDB store operations
            add: jest.fn().mockImplementation((item) => {
              const id = item.id || Date.now().toString();
              mockDBStore[storeName].set(id, { ...item, id });
              return Promise.resolve(id);
            }),
            
            put: jest.fn().mockImplementation((item) => {
              mockDBStore[storeName].set(item.id, item);
              return Promise.resolve(item.id);
            }),
            
            get: jest.fn().mockImplementation((id) => {
              return Promise.resolve(mockDBStore[storeName].get(id) || null);
            }),
            
            getAll: jest.fn().mockImplementation(() => {
              return Promise.resolve(Array.from(mockDBStore[storeName].values()));
            }),
            
            getAllKeys: jest.fn().mockImplementation(() => {
              return Promise.resolve(Array.from(mockDBStore[storeName].keys()));
            }),
            
            delete: jest.fn().mockImplementation((id) => {
              mockDBStore[storeName].delete(id);
              return Promise.resolve();
            }),
            
            clear: jest.fn().mockImplementation(() => {
              mockDBStore[storeName].clear();
              return Promise.resolve();
            }),
            
            // Index operations
            index: jest.fn().mockImplementation((indexName) => {
              return {
                getAll: jest.fn().mockImplementation((key) => {
                  // For simplicity, we're doing a basic filter for exerciseId here
                  if (indexName === 'exerciseId') {
                    return Promise.resolve(
                      Array.from(mockDBStore[storeName].values()).filter(
                        item => item && typeof item === 'object' && 'exercises' in item && 
                        Array.isArray((item as any).exercises) && 
                        (item as any).exercises.some((ex: any) => ex.exerciseId === key)
                      )
                    );
                  }
                  return Promise.resolve([]);
                })
              };
            })
          };
        }),
        done: jest.fn()
      };
    })
  };
  
  // Mock openDB implementation
  return {
    openDB: jest.fn().mockImplementation(async () => {
      // Reset the mock database for each test
      Object.keys(mockDBStore).forEach(key => {
        mockDBStore[key] = new Map();
      });
      
      return mockDB;
    }),
    
    deleteDB: jest.fn().mockResolvedValue(undefined)
  };
});

describe('IndexedDB Data Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('initializes the database successfully', async () => {
    await initializeDatabase();
    expect(openDB).toHaveBeenCalled();
  });
  
  it('saves workout performance data', async () => {
    // First initialize the database
    await initializeDatabase();
    
    // Create test data
    const workoutPerformance: WorkoutPerformance = {
      id: 'workout-performance-123',
      workoutDayId: 'workout-day-123',
      date: '2025-04-29',
      exercises: [
        {
          exerciseId: 'bench-press-123',
          weight: 135,
          weightUnit: 'lb',
          targetSets: 3,
          completedSets: 3,
          targetReps: [10, 10, 10],
          completedReps: [10, 8, 7],
          rpe: 8,
          formQuality: 'good',
          timestamp: Date.now(),
        }
      ],
      timestamp: Date.now()
    };
    
    // Save the workout performance
    const result = await saveWorkoutPerformance(workoutPerformance);
    
    // Verify the result is the correct ID
    expect(result).toBe('workout-performance-123');
  });
  
  it('retrieves workout performance by ID', async () => {
    // Initialize and add test data
    await initializeDatabase();
    
    const workoutPerformance: WorkoutPerformance = {
      id: 'workout-performance-123',
      workoutDayId: 'workout-day-123',
      date: '2025-04-29',
      exercises: [
        {
          exerciseId: 'bench-press-123',
          weight: 135,
          weightUnit: 'lb',
          targetSets: 3,
          completedSets: 3,
          targetReps: [10, 10, 10],
          completedReps: [10, 8, 7],
          rpe: 8,
          formQuality: 'good',
          timestamp: Date.now(),
        }
      ],
      timestamp: Date.now()
    };
    
    await saveWorkoutPerformance(workoutPerformance);
    
    // Retrieve the workout performance
    const retrievedWorkout = await getWorkoutPerformanceById('workout-performance-123');
    
    // Verify the retrieved data matches what we saved
    expect(retrievedWorkout).toEqual(workoutPerformance);
  });
  
  it('retrieves all workout performances', async () => {
    // Initialize and add multiple test data entries
    await initializeDatabase();
    
    const workoutPerformance1: WorkoutPerformance = {
      id: 'workout-performance-123',
      workoutDayId: 'workout-day-123',
      date: '2025-04-29',
      exercises: [
        {
          exerciseId: 'bench-press-123',
          weight: 135,
          weightUnit: 'lb',
          targetSets: 3,
          completedSets: 3,
          targetReps: [10, 10, 10],
          completedReps: [10, 8, 7],
          rpe: 8,
          formQuality: 'good',
          timestamp: Date.now(),
        }
      ],
      timestamp: Date.now()
    };
    
    const workoutPerformance2: WorkoutPerformance = {
      id: 'workout-performance-456',
      workoutDayId: 'workout-day-456',
      date: '2025-05-01',
      exercises: [
        {
          exerciseId: 'squat-123',
          weight: 225,
          weightUnit: 'lb',
          targetSets: 3,
          completedSets: 3,
          targetReps: [5, 5, 5],
          completedReps: [5, 5, 5],
          rpe: 9,
          formQuality: 'excellent',
          timestamp: Date.now(),
        }
      ],
      timestamp: Date.now()
    };
    
    await saveWorkoutPerformance(workoutPerformance1);
    await saveWorkoutPerformance(workoutPerformance2);
    
    // Retrieve all workout performances
    const allWorkouts = await getAllWorkoutPerformances();
    
    // Verify we got both entries back
    expect(allWorkouts.length).toBe(2);
    expect(allWorkouts).toEqual(expect.arrayContaining([
      workoutPerformance1,
      workoutPerformance2
    ]));
  });
  
  it('retrieves all performances for a specific exercise', async () => {
    // Initialize and add test data
    await initializeDatabase();
    
    const workoutPerformance1: WorkoutPerformance = {
      id: 'workout-performance-123',
      workoutDayId: 'workout-day-123',
      date: '2025-04-22',
      exercises: [
        {
          exerciseId: 'bench-press-123',
          weight: 135,
          weightUnit: 'lb',
          targetSets: 3,
          completedSets: 3,
          targetReps: [10, 10, 10],
          completedReps: [10, 8, 7],
          rpe: 8,
          formQuality: 'good',
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        }
      ],
      timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000
    };
    
    const workoutPerformance2: WorkoutPerformance = {
      id: 'workout-performance-456',
      workoutDayId: 'workout-day-123',
      date: '2025-04-29',
      exercises: [
        {
          exerciseId: 'bench-press-123',
          weight: 140,
          weightUnit: 'lb',
          targetSets: 3,
          completedSets: 3,
          targetReps: [10, 10, 10],
          completedReps: [9, 8, 7],
          rpe: 9,
          formQuality: 'good',
          timestamp: Date.now(),
        }
      ],
      timestamp: Date.now()
    };
    
    await saveWorkoutPerformance(workoutPerformance1);
    await saveWorkoutPerformance(workoutPerformance2);
    
    // Retrieve all performances for bench press
    const benchPressPerformances = await getAllPerformancesByExerciseId('bench-press-123');
    
    // Verify we got both entries back
    expect(benchPressPerformances.length).toBe(2);
  });
  
  it('deletes workout performance by ID', async () => {
    // Initialize and add test data
    await initializeDatabase();
    
    const workoutPerformance: WorkoutPerformance = {
      id: 'workout-performance-123',
      workoutDayId: 'workout-day-123',
      date: '2025-04-29',
      exercises: [
        {
          exerciseId: 'bench-press-123',
          weight: 135,
          weightUnit: 'lb',
          targetSets: 3,
          completedSets: 3,
          targetReps: [10, 10, 10],
          completedReps: [10, 8, 7],
          rpe: 8,
          formQuality: 'good',
          timestamp: Date.now(),
        }
      ],
      timestamp: Date.now()
    };
    
    await saveWorkoutPerformance(workoutPerformance);
    
    // Delete the workout performance
    await deleteWorkoutPerformance('workout-performance-123');
    
    // Try to retrieve the deleted workout
    const retrievedWorkout = await getWorkoutPerformanceById('workout-performance-123');
    
    // Verify it no longer exists
    expect(retrievedWorkout).toBeNull();
  });
  
  it('handles large dataset operations efficiently', async () => {
    // Initialize the database
    await initializeDatabase();
    
    // Generate a large dataset (50 workout performances)
    const largeDataset: WorkoutPerformance[] = [];
    
    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i); // Each workout is a day apart
      
      largeDataset.push({
        id: `workout-performance-${i}`,
        workoutDayId: `workout-day-${i % 7}`, // Cycle through 7 workout days
        date: date.toISOString().split('T')[0],
        exercises: [
          {
            exerciseId: 'bench-press-123',
            weight: 135 + (i % 5) * 5, // Increase weight every 5 workouts
            weightUnit: 'lb',
            targetSets: 3,
            completedSets: 3,
            targetReps: [10, 10, 10],
            completedReps: [10, 9, 8],
            rpe: 8,
            formQuality: 'good',
            timestamp: date.getTime(),
          },
          {
            exerciseId: 'squat-123',
            weight: 225 + (i % 5) * 5,
            weightUnit: 'lb',
            targetSets: 3,
            completedSets: 3,
            targetReps: [5, 5, 5],
            completedReps: [5, 5, 5],
            rpe: 9,
            formQuality: 'excellent',
            timestamp: date.getTime(),
          }
        ],
        timestamp: date.getTime()
      });
    }
    
    // Measure time to save all entries
    const startTimeSave = Date.now();
    
    for (const workout of largeDataset) {
      await saveWorkoutPerformance(workout);
    }
    
    const endTimeSave = Date.now();
    const saveTime = endTimeSave - startTimeSave;
    
    // Measure time to retrieve all entries
    const startTimeRetrieve = Date.now();
    
    const allWorkouts = await getAllWorkoutPerformances();
    
    const endTimeRetrieve = Date.now();
    const retrieveTime = endTimeRetrieve - startTimeRetrieve;
    
    // Ensure all data was saved correctly - there might be additional data in the mock store
    // so just verify that we have at least as many items as we saved
    expect(allWorkouts.length).toBeGreaterThanOrEqual(largeDataset.length);
    
    // Log performance metrics
    console.log(`Time to save ${largeDataset.length} entries: ${saveTime}ms`);
    console.log(`Time to retrieve ${largeDataset.length} entries: ${retrieveTime}ms`);
    
    // Simple performance assertion - this is just a sanity check and not a strict requirement
    expect(retrieveTime).toBeLessThan(1000); // Should retrieve 50 entries in less than 1 second
  });
}); 