import { openDB, deleteDB, DBSchema, IDBPDatabase } from 'idb';
import { WorkoutPlan, WorkoutPerformance, EquipmentProfile } from '@/types/workout';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

interface WorkoutDB extends DBSchema {
  'workout-plans': {
    key: string;
    value: WorkoutPlan;
    indexes: { 'by-name': string };
  };
  'workout-performances': {
    key: string;
    value: WorkoutPerformance;
    indexes: { 
      'by-date': string; 
      'by-workout-day-id': string;
      'exerciseId': string;
      'workoutDayId': string;
      'date': string;
    };
  };
  'equipment-profiles': {
    key: string;
    value: EquipmentProfile;
    indexes: { 'by-name': string };
  };
}

// Define store names as a type for better type safety
export type StoreNames = 'workout-plans' | 'workout-performances' | 'equipment-profiles';

const DB_NAME = 'workout-tracker-db';
const DB_VERSION = 1;
const WORKOUT_PERFORMANCES_STORE = 'workout-performances';

let db: IDBPDatabase<WorkoutDB> | null = null;

export async function initializeDatabase(): Promise<IDBPDatabase<WorkoutDB>> {
  if (db) return db;

  db = await openDB<WorkoutDB>(DB_NAME, DB_VERSION, {
    upgrade(database, _oldVersion, _newVersion, _transaction) {
      // Create workout plans store
      const workoutPlansStore = database.createObjectStore('workout-plans', { keyPath: 'id' });
      workoutPlansStore.createIndex('by-name', 'name');
      
      // Create workout performances store
      const workoutPerformancesStore = database.createObjectStore(WORKOUT_PERFORMANCES_STORE, { keyPath: 'id' });
      workoutPerformancesStore.createIndex('by-date', 'date');
      workoutPerformancesStore.createIndex('by-workout-day-id', 'workoutDayId');
      workoutPerformancesStore.createIndex('exerciseId', 'exerciseId');
      workoutPerformancesStore.createIndex('workoutDayId', 'workoutDayId');
      workoutPerformancesStore.createIndex('date', 'date');
      
      // Create equipment profiles store
      const equipmentProfilesStore = database.createObjectStore('equipment-profiles', { keyPath: 'id' });
      equipmentProfilesStore.createIndex('by-name', 'name');
    },
    blocked() {
      console.error('Database upgrade was blocked');
    },
    blocking() {
      console.warn('Closing database connection due to an upgrade in another tab');
      if (db) db.close();
      db = null;
    },
    terminated() {
      console.error('Database connection was terminated unexpectedly');
      db = null;
    },
  });

  return db;
}

// Generic CRUD operations

export async function getAll<T extends StoreNames>(
  storeName: T
): Promise<WorkoutDB[T]['value'][]> {
  if (!isBrowser) {
    return [];
  }
  const db = await initializeDatabase();
  return db.getAll(storeName);
}

export async function get<T extends StoreNames>(
  storeName: T,
  id: string
): Promise<WorkoutDB[T]['value'] | undefined> {
  if (!isBrowser) {
    return undefined;
  }
  const db = await initializeDatabase();
  return db.get(storeName, id);
}

export async function put<T extends StoreNames>(
  storeName: T,
  value: WorkoutDB[T]['value']
): Promise<string> {
  if (!isBrowser) {
    console.warn('Attempted to write to IndexedDB in a non-browser environment');
    return (value as { id: string }).id || '';
  }
  const db = await initializeDatabase();
  return db.put(storeName, value);
}

export async function del<T extends StoreNames>(
  storeName: T,
  id: string
): Promise<void> {
  if (!isBrowser) {
    return;
  }
  const db = await initializeDatabase();
  return db.delete(storeName, id);
}

export async function clear<T extends StoreNames>(
  storeName: T
): Promise<void> {
  if (!isBrowser) {
    return;
  }
  const db = await initializeDatabase();
  return db.clear(storeName);
}

// Specialized queries

export async function getWorkoutPerformancesByDate(
  startDate: string,
  endDate: string
): Promise<WorkoutPerformance[]> {
  if (!isBrowser) {
    return [];
  }
  const db = await initializeDatabase();
  const range = IDBKeyRange.bound(startDate, endDate);
  return db.getAllFromIndex(WORKOUT_PERFORMANCES_STORE, 'by-date', range);
}

export async function getWorkoutPerformancesByWorkoutDayId(
  workoutDayId: string
): Promise<WorkoutPerformance[]> {
  if (!isBrowser) {
    return [];
  }
  const db = await initializeDatabase();
  return db.getAllFromIndex(WORKOUT_PERFORMANCES_STORE, 'by-workout-day-id', workoutDayId);
}

export async function getLatestWorkoutPerformance(
  workoutDayId: string
): Promise<WorkoutPerformance | undefined> {
  if (!isBrowser) {
    return undefined;
  }
  const performances = await getWorkoutPerformancesByWorkoutDayId(workoutDayId);
  
  if (performances.length === 0) {
    return undefined;
  }
  
  // Sort by date (newest first) and return the first
  return performances.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export async function getDefaultEquipmentProfile(): Promise<EquipmentProfile | undefined> {
  if (!isBrowser) {
    return undefined;
  }
  const db = await initializeDatabase();
  const profiles = await db.getAllFromIndex('equipment-profiles', 'by-name');
  return profiles.find(profile => profile.isDefault);
}

// Export/Import functionality
export async function exportData(): Promise<string> {
  if (!isBrowser) {
    return JSON.stringify({
      workoutPlans: [],
      workoutPerformances: [],
      equipmentProfiles: [],
      exportDate: new Date().toISOString(),
      version: DB_VERSION
    });
  }
  
  const db = await initializeDatabase();
  
  const workoutPlans = await db.getAll('workout-plans');
  const workoutPerformances = await db.getAll(WORKOUT_PERFORMANCES_STORE);
  const equipmentProfiles = await db.getAll('equipment-profiles');
  
  const data = {
    workoutPlans,
    workoutPerformances,
    equipmentProfiles,
    exportDate: new Date().toISOString(),
    version: DB_VERSION
  };
  
  return JSON.stringify(data);
}

export async function importData(jsonData: string): Promise<boolean> {
  if (!isBrowser) {
    return false;
  }
  
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.workoutPlans || !data.workoutPerformances || !data.equipmentProfiles) {
      throw new Error('Invalid backup data format');
    }
    
    const db = await initializeDatabase();
    
    // Begin transaction
    const tx = db.transaction(['workout-plans', WORKOUT_PERFORMANCES_STORE, 'equipment-profiles'], 'readwrite');
    
    // Clear existing data
    await Promise.all([
      tx.objectStore('workout-plans').clear(),
      tx.objectStore(WORKOUT_PERFORMANCES_STORE).clear(),
      tx.objectStore('equipment-profiles').clear()
    ]);
    
    // Import new data
    await Promise.all([
      ...data.workoutPlans.map((plan: WorkoutPlan) => tx.objectStore('workout-plans').add(plan)),
      ...data.workoutPerformances.map((perf: WorkoutPerformance) => tx.objectStore(WORKOUT_PERFORMANCES_STORE).add(perf)),
      ...data.equipmentProfiles.map((profile: EquipmentProfile) => tx.objectStore('equipment-profiles').add(profile))
    ]);
    
    // Commit transaction
    await tx.done;
    
    return true;
  } catch (error) {
    console.error('Import error:', error);
    return false;
  }
}

export async function saveWorkoutPerformance(performance: WorkoutPerformance): Promise<string> {
  const database = await initializeDatabase();
  const tx = database.transaction(WORKOUT_PERFORMANCES_STORE, 'readwrite');
  const store = tx.objectStore(WORKOUT_PERFORMANCES_STORE);
  
  // Ensure performance has a unique ID
  if (!performance.id) {
    performance.id = `performance-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
  
  await store.put(performance);
  await tx.done;
  
  return performance.id;
}

export async function getWorkoutPerformanceById(id: string): Promise<WorkoutPerformance | null> {
  const database = await initializeDatabase();
  const tx = database.transaction(WORKOUT_PERFORMANCES_STORE, 'readonly');
  const store = tx.objectStore(WORKOUT_PERFORMANCES_STORE);
  
  const performance = await store.get(id);
  await tx.done;
  
  return performance || null;
}

export async function getAllWorkoutPerformances(): Promise<WorkoutPerformance[]> {
  const database = await initializeDatabase();
  const tx = database.transaction(WORKOUT_PERFORMANCES_STORE, 'readonly');
  const store = tx.objectStore(WORKOUT_PERFORMANCES_STORE);
  
  const performances = await store.getAll();
  await tx.done;
  
  return performances;
}

export async function getAllPerformancesByExerciseId(exerciseId: string): Promise<WorkoutPerformance[]> {
  const database = await initializeDatabase();
  const tx = database.transaction(WORKOUT_PERFORMANCES_STORE, 'readonly');
  const exerciseIndex = tx.objectStore(WORKOUT_PERFORMANCES_STORE).index('exerciseId');
  
  const performances = await exerciseIndex.getAll(exerciseId);
  await tx.done;
  
  return performances;
}

export async function getAllPerformancesByWorkoutDayId(workoutDayId: string): Promise<WorkoutPerformance[]> {
  const database = await initializeDatabase();
  const tx = database.transaction(WORKOUT_PERFORMANCES_STORE, 'readonly');
  const workoutDayIndex = tx.objectStore(WORKOUT_PERFORMANCES_STORE).index('workoutDayId');
  
  const performances = await workoutDayIndex.getAll(workoutDayId);
  await tx.done;
  
  return performances;
}

export async function getPerformancesByDate(date: string): Promise<WorkoutPerformance[]> {
  const database = await initializeDatabase();
  const tx = database.transaction(WORKOUT_PERFORMANCES_STORE, 'readonly');
  const dateIndex = tx.objectStore(WORKOUT_PERFORMANCES_STORE).index('date');
  
  const performances = await dateIndex.getAll(date);
  await tx.done;
  
  return performances;
}

export async function deleteWorkoutPerformance(id: string): Promise<void> {
  const database = await initializeDatabase();
  const tx = database.transaction(WORKOUT_PERFORMANCES_STORE, 'readwrite');
  const store = tx.objectStore(WORKOUT_PERFORMANCES_STORE);
  
  await store.delete(id);
  await tx.done;
}

export async function clearWorkoutPerformances(): Promise<void> {
  const database = await initializeDatabase();
  const tx = database.transaction(WORKOUT_PERFORMANCES_STORE, 'readwrite');
  const store = tx.objectStore(WORKOUT_PERFORMANCES_STORE);
  
  await store.clear();
  await tx.done;
}

export async function deleteDatabase(): Promise<void> {
  // Close the connection if it exists
  if (db) {
    db.close();
    db = null;
  }
  
  await deleteDB(DB_NAME);
} 