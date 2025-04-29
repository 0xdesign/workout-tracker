import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExerciseList } from '@/components/ExerciseList';
import { WorkoutDay } from '@/types/workout';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock the formatTempo function to avoid tempo parsing issues
jest.mock('@/utils/workout-parser', () => ({
  formatTempo: jest.fn().mockReturnValue('3-1-1-0'),
}));

describe('ExerciseList', () => {
  const mockWorkoutDay: WorkoutDay = {
    id: '123',
    name: 'Upper Body Workout',
    day: 1,
    exercises: [
      {
        id: 'ex1',
        name: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 135,
        weightUnit: 'lb',
        group: 'A1',
        rest: 60,
      },
      {
        id: 'ex2',
        name: 'Barbell Row',
        sets: 3,
        reps: 10,
        weight: 135,
        weightUnit: 'lb',
        group: 'A2',
        rest: 60,
      },
      {
        id: 'ex3',
        name: 'Shoulder Press',
        sets: 3,
        reps: [8, 10, 12],
        weight: 80,
        weightUnit: 'lb',
        group: 'B1',
        tempo: '3110', // Fixed to be 4 digits as required by the parser
        notes: 'Focus on form',
      },
    ],
  };

  it('renders exercise names correctly', () => {
    render(<ExerciseList workoutDay={mockWorkoutDay} />);
    
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Barbell Row')).toBeInTheDocument();
    expect(screen.getByText('Shoulder Press')).toBeInTheDocument();
  });

  it('displays exercise details correctly', () => {
    render(<ExerciseList workoutDay={mockWorkoutDay} />);
    
    // Use getAllByText for elements that appear multiple times and select the first one
    const benchPressDetails = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'p' && 
             content.includes('3 sets') && 
             content.includes('10 reps') && 
             content.includes('135 lb');
    });
    expect(benchPressDetails.length).toBeGreaterThan(0);
    
    const shoulderPressDetails = screen.getByText((content, element) => {
      return element.tagName.toLowerCase() === 'p' && 
             content.includes('3 sets') && 
             content.includes('8-12 reps') && 
             content.includes('80 lb');
    });
    expect(shoulderPressDetails).toBeInTheDocument();
  });

  it('displays exercise groups correctly', () => {
    const { container } = render(<ExerciseList workoutDay={mockWorkoutDay} />);
    
    // Find group headers 
    const groupAHeader = screen.getByText((content) => content.includes('Group A'));
    const groupBHeader = screen.getByText((content) => content.includes('Group B'));
    
    expect(groupAHeader).toBeInTheDocument();
    expect(groupBHeader).toBeInTheDocument();
    
    // Check for group identifiers
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
  });

  it('displays rest time for groups', () => {
    render(<ExerciseList workoutDay={mockWorkoutDay} />);
    
    // Find group header that includes rest time
    const groupHeader = screen.getByText((content) => 
      content.includes('Group A') && 
      content.includes('Rest: 60s between supersets')
    );
    expect(groupHeader).toBeInTheDocument();
  });

  it('shows exercise notes when provided', () => {
    render(<ExerciseList workoutDay={mockWorkoutDay} />);
    
    expect(screen.getByText('Focus on form')).toBeInTheDocument();
  });

  it('displays tempo when provided', () => {
    render(<ExerciseList workoutDay={mockWorkoutDay} />);
    
    // Find element that contains tempo text
    const tempoText = screen.getByText((content) => 
      content.includes('Tempo:') && 
      content.includes('3-1-1-0')
    );
    expect(tempoText).toBeInTheDocument();
  });

  it('includes date parameter in links when provided', () => {
    const date = '2025-04-29';
    render(<ExerciseList workoutDay={mockWorkoutDay} date={date} />);
    
    const links = screen.getAllByRole('link');
    
    // Check that each link contains the date and workoutId parameters
    links.forEach(link => {
      expect(link.getAttribute('href')).toContain(`date=${date}`);
      expect(link.getAttribute('href')).toContain(`workoutId=${mockWorkoutDay.id}`);
    });
  });
}); 