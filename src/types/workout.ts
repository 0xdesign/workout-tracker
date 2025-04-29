// Workout plan types
export type ExerciseType = {
  id: string;
  name: string;
  description?: string;
  sets: number;
  reps: number | number[] | string;
  tempo?: string;
  rest?: number; // in seconds
  weight?: number;
  weightUnit?: 'lb' | 'kg';
  notes?: string;
  group?: string; // for supersets (A1, A2, etc.)
  category?: 'mobility' | 'main' | 'auxiliary';
};

export type WorkoutDay = {
  id: string;
  name: string;
  exercises: ExerciseType[];
  day: number; // 1-7 for day of week
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description?: string;
  days: WorkoutDay[];
};

// User performance tracking types
export type ExercisePerformance = {
  exerciseId: string;
  weight: number;
  weightUnit: 'lb' | 'kg';
  targetSets: number;
  completedSets: number;
  targetReps: number[];
  completedReps: number[];
  rpe?: number; // 1-10 scale
  formQuality?: 'poor' | 'good' | 'excellent';
  difficulty?: 'too_easy' | 'appropriate' | 'too_hard';
  notes?: string;
  issues?: ('soreness' | 'time_constraint' | 'equipment' | 'energy' | 'other')[];
  timestamp: number;
  workoutDate?: string; // Added for performance history
  workoutId?: string; // Added for performance history
};

export type WorkoutPerformance = {
  id: string;
  workoutDayId: string;
  date: string;
  exercises: ExercisePerformance[];
  overallFeedback?: string;
  overallRating?: 1 | 2 | 3 | 4 | 5;
  duration?: number; // minutes
  timestamp?: number; // Added for sorting and tracking
};

// AI coaching types
export type ProgressionChange = {
  parameter: 'weight' | 'sets' | 'reps' | 'tempo';
  currentValue: any;
  recommendedValue: any;
  reasoning: string;
};

export type ExerciseModification = {
  exerciseId: string;
  changes: ProgressionChange[];
};

export type ProgramAdjustment = {
  type: 'deload' | 'volume_increase' | 'intensity_focus';
  duration: number; // weeks
  details: string;
};

export type WorkoutCoachResponse = {
  explanation: string;
  modifications: ExerciseModification[];
  programAdjustments?: ProgramAdjustment;
};

// Equipment profile types
export type EquipmentConstraint = {
  exerciseId?: string; // If undefined, applies to all exercises
  minWeight?: number;
  maxWeight?: number;
  incrementSize?: number;
  notes?: string;
};

export type EquipmentProfile = {
  id: string;
  name: string;
  location: string;
  constraints: EquipmentConstraint[];
  isDefault: boolean;
}; 