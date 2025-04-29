import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { WorkoutDay } from '@/types/workout';

// Mock the useWeekNavigation hook
jest.mock('@/hooks/use-week-navigation', () => ({
  useWeekNavigation: () => ({
    weekDays: () => [
      { dayName: 'Mon', dayNumber: 1, isoDate: '2025-04-28', isToday: false },
      { dayName: 'Tue', dayNumber: 2, isoDate: '2025-04-29', isToday: true },
      { dayName: 'Wed', dayNumber: 3, isoDate: '2025-04-30', isToday: false },
      { dayName: 'Thu', dayNumber: 4, isoDate: '2025-05-01', isToday: false },
      { dayName: 'Fri', dayNumber: 5, isoDate: '2025-05-02', isToday: false },
      { dayName: 'Sat', dayNumber: 6, isoDate: '2025-05-03', isToday: false },
      { dayName: 'Sun', dayNumber: 7, isoDate: '2025-05-04', isToday: false },
    ],
    nextWeek: jest.fn(),
    prevWeek: jest.fn(),
    goToToday: jest.fn(),
    weekRange: () => ({
      startFormatted: 'Apr 28',
      endFormatted: 'May 4',
    }),
  }),
}));

// Mock the Date object to return a consistent date
const originalDate = global.Date;
const mockDate = new Date('2025-04-29T12:00:00Z');
global.Date = class extends originalDate {
  constructor() {
    super();
    return mockDate;
  }
  
  static now() {
    return mockDate.getTime();
  }
} as unknown as DateConstructor;

// Mock the toISOString method
mockDate.toISOString = jest.fn(() => '2025-04-29T12:00:00.000Z');

describe('WeeklyCalendar', () => {
  const workoutDaysByDate: Record<string, WorkoutDay> = {
    '2025-04-29': {
      id: '8803a236-8543-48e0-8e38-b8a89e1e1470',
      name: 'Upper Body A',
      exercises: [{ id: '1', name: 'Bench Press', sets: 3, reps: 10 }],
      day: 2,
    },
    '2025-05-01': {
      id: '9904b347-9654-59f1-9f49-c9a90f2e2581',
      name: 'Lower Body A',
      exercises: [{ id: '2', name: 'Squat', sets: 3, reps: 10 }],
      day: 4,
    },
  };

  const workoutCompletionStatus = {
    '2025-04-29': true,
    '2025-05-01': false,
  };

  it('renders the weekly calendar with correct days', () => {
    render(<WeeklyCalendar 
      workoutDaysByDate={workoutDaysByDate}
      workoutCompletionStatus={workoutCompletionStatus}
    />);
    
    // Check if all days of the week are rendered using exact case matching
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    
    // Check day numbers
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays workout information when a date with a workout is selected', () => {
    render(<WeeklyCalendar 
      workoutDaysByDate={workoutDaysByDate}
      workoutCompletionStatus={workoutCompletionStatus}
    />);
    
    // The calendar should initially select today (2025-04-29)
    expect(screen.getByText('Upper Body A')).toBeInTheDocument();
    expect(screen.getByText('1 exercises')).toBeInTheDocument();
    expect(screen.getByText('View Workout')).toBeInTheDocument();
  });

  it('displays rest day message when a date without a workout is selected', () => {
    render(<WeeklyCalendar 
      workoutDaysByDate={workoutDaysByDate}
      workoutCompletionStatus={workoutCompletionStatus}
    />);
    
    // Click on Wednesday which doesn't have a workout
    // Find the button containing Wednesday text
    const wednesdayButton = screen.getAllByRole('button').find(
      button => button.textContent?.includes('Wed')
    );
    if (wednesdayButton) {
      fireEvent.click(wednesdayButton);
    }
    
    expect(screen.getByText('Rest Day')).toBeInTheDocument();
    expect(screen.getByText('No workout scheduled for this day')).toBeInTheDocument();
  });

  it('calls onSelectDate when a date is clicked', () => {
    const onSelectDate = jest.fn();
    render(<WeeklyCalendar 
      workoutDaysByDate={workoutDaysByDate}
      workoutCompletionStatus={workoutCompletionStatus}
      onSelectDate={onSelectDate}
    />);
    
    // The initial onSelectDate call during mount with today's date
    expect(onSelectDate).toHaveBeenCalledWith('2025-04-29');
    
    // Click on Thursday
    const thursdayButton = screen.getAllByRole('button').find(
      button => button.textContent?.includes('Thu')
    );
    if (thursdayButton) {
      fireEvent.click(thursdayButton);
    }
    
    // Check if onSelectDate was called with the correct date
    expect(onSelectDate).toHaveBeenCalledWith('2025-05-01');
  });

  it('renders the week navigation correctly', () => {
    render(<WeeklyCalendar 
      workoutDaysByDate={workoutDaysByDate}
      workoutCompletionStatus={workoutCompletionStatus}
    />);
    
    // Check if the week range is displayed
    expect(screen.getByText('Apr 28 - May 4')).toBeInTheDocument();
    
    // Check if navigation buttons exist
    const prevButton = screen.getByLabelText('Previous week');
    const nextButton = screen.getByLabelText('Next week');
    const todayButton = screen.getByText('Today');
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    expect(todayButton).toBeInTheDocument();
  });
}); 