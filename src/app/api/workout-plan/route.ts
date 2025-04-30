import { NextResponse } from 'next/server';
import { parseWorkoutPlan } from '@/utils/workout-parser';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    let markdownContent;

    // Try to read from filesystem first (for production server)
    try {
      const filePath = path.join(process.cwd(), 'public', 'workout-plan.md');
      console.log('Attempting to read workout plan from filesystem:', filePath);
      
      if (fs.existsSync(filePath)) {
        markdownContent = fs.readFileSync(filePath, 'utf8');
        console.log('Successfully read workout plan from filesystem');
      } else {
        console.log('Workout plan file not found in filesystem, falling back to fetch');
      }
    } catch (fsError) {
      console.error('Error reading workout plan from filesystem:', fsError);
    }

    // If filesystem read failed, try to fetch
    if (!markdownContent) {
      // Get the base URL for fetching the markdown file
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      
      console.log(`Attempting to fetch workout plan from: ${baseUrl}/workout-plan.md`);
      
      // Fetch the workout plan markdown file
      const response = await fetch(`${baseUrl}/workout-plan.md`, { cache: 'no-store' });
      
      if (!response.ok) {
        console.error(`Failed to fetch workout plan: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch workout plan: ${response.status} ${response.statusText}`);
      }
      
      markdownContent = await response.text();
      console.log(`Successfully fetched workout plan (${markdownContent.length} bytes)`);
    }
    
    // Parse the markdown content
    const workoutPlan = parseWorkoutPlan(markdownContent);
    
    // Return the parsed workout plan
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
          VERCEL_URL: process.env.VERCEL_URL,
          cwd: process.cwd()
        }
      }, 
      { status: 500 }
    );
  }
} 