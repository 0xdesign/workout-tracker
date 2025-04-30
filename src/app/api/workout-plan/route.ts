import { NextResponse } from 'next/server';
import { parseWorkoutPlan } from '@/utils/workout-parser';

export async function GET() {
  try {
    // Get the base URL for fetching the markdown file
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    console.log(`Attempting to fetch workout plan from: ${baseUrl}/workout-plan.md`);
    
    // Fetch the workout plan markdown file
    const response = await fetch(`${baseUrl}/workout-plan.md`);
    
    if (!response.ok) {
      console.error(`Failed to fetch workout plan: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch workout plan: ${response.status} ${response.statusText}`);
    }
    
    const markdownContent = await response.text();
    console.log(`Successfully fetched workout plan (${markdownContent.length} bytes)`);
    
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
        details: error instanceof Error ? error.message : String(error),
        environment: {
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
          VERCEL_URL: process.env.VERCEL_URL
        }
      }, 
      { status: 500 }
    );
  }
} 