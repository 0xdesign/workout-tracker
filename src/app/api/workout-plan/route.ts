import { NextResponse } from 'next/server';
import { parseWorkoutPlan } from '@/utils/workout-parser';

export async function GET() {
  try {
    // Fetch the workout plan markdown file
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/workout-plan.md`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch workout plan: ${response.status} ${response.statusText}`);
    }
    
    const markdownContent = await response.text();
    
    // Parse the markdown content
    const workoutPlan = parseWorkoutPlan(markdownContent);
    
    // Return the parsed workout plan (without saving to IndexedDB)
    return NextResponse.json({ 
      success: true, 
      workoutPlan 
    });
  } catch (error) {
    console.error('Error fetching workout plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch workout plan',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 