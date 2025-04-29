import { ExercisePerformance, WorkoutPerformance, EquipmentProfile } from './workout';

export type MessageRole = 'system' | 'user' | 'assistant';

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
};

export type ChatContext = {
  recentWorkouts?: WorkoutPerformance[];
  selectedWorkoutId?: string;
  selectedExerciseId?: string;
  equipmentProfile?: EquipmentProfile;
  userIssue?: 'soreness' | 'time_constraint' | 'equipment' | 'energy' | 'other';
  performanceHistory?: ExercisePerformance[];
};

export type QuickPrompt = {
  id: string;
  text: string;
  context?: Partial<ChatContext>;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  context: ChatContext;
  createdAt: number;
  updatedAt: number;
}; 