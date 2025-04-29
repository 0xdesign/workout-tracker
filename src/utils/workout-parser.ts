import { WorkoutPlan, WorkoutDay, ExerciseType } from '@/types/workout';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse a workout plan from markdown format
 * @param markdown The markdown content of the workout plan
 * @returns A structured workout plan object
 */
export function parseWorkoutPlan(markdown: string): WorkoutPlan {
  const lines = markdown.split('\n').filter(line => line.trim() !== '');
  
  let currentPlan: WorkoutPlan = {
    id: uuidv4(),
    name: 'Default Workout Plan',
    days: []
  };
  
  let currentDay: WorkoutDay | null = null;
  let currentCategory: 'mobility' | 'main' | 'auxiliary' = 'main';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Parse plan name (h1)
    if (line.startsWith('# ')) {
      currentPlan.name = line.substring(2).trim();
      continue;
    }
    
    // Parse workout day (h2)
    if (line.startsWith('## DAY ')) {
      if (currentDay) {
        currentPlan.days.push(currentDay);
      }
      
      const dayMatch = line.match(/## DAY (\d+): (.+)/);
      if (dayMatch) {
        const dayNumber = parseInt(dayMatch[1]);
        const dayName = dayMatch[2].trim();
        
        currentDay = {
          id: uuidv4(),
          name: dayName,
          exercises: [],
          day: dayNumber
        };
      } else if (line.includes('REST DAY')) {
        // Handle rest day
        const dayMatch = line.match(/## DAY (\d+)/);
        const dayNumber = dayMatch ? parseInt(dayMatch[1]) : currentPlan.days.length + 1;
        
        currentDay = {
          id: uuidv4(),
          name: 'Rest Day',
          exercises: [],
          day: dayNumber
        };
      }
      
      currentCategory = 'main';
      continue;
    }
    
    // Parse category (h3)
    if (line.startsWith('### ')) {
      const category = line.substring(4).trim().toLowerCase();
      
      if (category.includes('mobility') || category.includes('warm-up')) {
        currentCategory = 'mobility';
      } else if (category.includes('main')) {
        currentCategory = 'main';
      } else {
        // Anything else is considered auxiliary
        currentCategory = 'auxiliary';
      }
      
      continue;
    }
    
    // Parse exercise (bullet point)
    if (line.startsWith('- **') && currentDay) {
      const exerciseMatch = line.match(/- \*\*(M\d+|[A-Z]\d+)\*\*: (.+) \((.+)\)/);
      
      if (exerciseMatch) {
        const group = exerciseMatch[1].trim();
        const name = exerciseMatch[2].trim();
        const paramsText = exerciseMatch[3].trim();
        
        // Parse parameters
        const repsMatch = paramsText.match(/(\d+-\d+|\d+) reps/);
        const setsMatch = paramsText.match(/(\d+) sets?/);
        const tempoMatch = paramsText.match(/Tempo: ([0-9]+)/);
        const restMatch = paramsText.match(/Rest: (\d+)s/);
        
        let reps: number | number[] | string = 10;
        if (repsMatch) {
          if (repsMatch[1].includes('-')) {
            const [min, max] = repsMatch[1].split('-').map(Number);
            reps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
          } else {
            reps = parseInt(repsMatch[1]);
          }
        }
        
        const sets = setsMatch ? parseInt(setsMatch[1]) : 1;
        const tempo = tempoMatch ? tempoMatch[1] : undefined;
        const rest = restMatch ? parseInt(restMatch[1]) : undefined;
        
        // Look for notes in the next line if it starts with a space
        let notes = '';
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('*')) {
          notes = lines[i + 1].trim().replace(/^\*|\*$/g, '').trim();
          i++; // Skip the notes line in the next iteration
        }
        
        // Look for recommended weight in the following lines
        let weight: number | undefined = undefined;
        let weightUnit: 'lb' | 'kg' | undefined = undefined;
        
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const nextLine = lines[j].trim();
          const weightMatch = nextLine.match(/\*Recommended weight: (\d+) (lbs?|kgs?)\*/);
          
          if (weightMatch) {
            weight = parseInt(weightMatch[1]);
            weightUnit = weightMatch[2].startsWith('kg') ? 'kg' : 'lb';
            break;
          }
        }
        
        const exercise: ExerciseType = {
          id: uuidv4(),
          name,
          sets,
          reps,
          group,
          category: currentCategory,
          tempo,
          rest,
          notes,
          weight,
          weightUnit
        };
        
        currentDay.exercises.push(exercise);
      }
    }
  }
  
  // Add the last day if it exists
  if (currentDay) {
    currentPlan.days.push(currentDay);
  }
  
  return currentPlan;
}

/**
 * Extracts tempo information from a tempo code
 * @param tempoCode The 4-digit tempo code (e.g., "3020")
 * @returns An object containing the different tempo components
 */
export function parseTempo(tempoCode: string): { 
  eccentric: number; 
  pauseBottom: number; 
  concentric: number; 
  pauseTop: number;
} {
  if (tempoCode.length !== 4) {
    throw new Error('Invalid tempo code. Must be 4 digits.');
  }
  
  return {
    eccentric: parseInt(tempoCode[0]),    // First digit: Eccentric/lowering phase
    pauseBottom: parseInt(tempoCode[1]),  // Second digit: Pause at bottom
    concentric: parseInt(tempoCode[2]),   // Third digit: Concentric/lifting phase
    pauseTop: parseInt(tempoCode[3])      // Fourth digit: Pause at top
  };
}

/**
 * Format tempo code into a human-readable description
 * @param tempoCode The 4-digit tempo code
 * @returns A human-readable description of the tempo
 */
export function formatTempo(tempoCode: string): string {
  const { eccentric, pauseBottom, concentric, pauseTop } = parseTempo(tempoCode);
  
  let description = '';
  
  description += `${eccentric}s down`;
  
  if (pauseBottom > 0) {
    description += `, ${pauseBottom}s pause at bottom`;
  }
  
  description += `, ${concentric}s up`;
  
  if (pauseTop > 0) {
    description += `, ${pauseTop}s pause at top`;
  }
  
  return description;
} 