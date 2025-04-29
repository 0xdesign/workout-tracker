import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickPrompts from '@/components/coach/QuickPrompts';
import { QuickPrompt } from '@/types/coach';

describe('QuickPrompts', () => {
  const mockPrompts: QuickPrompt[] = [
    { id: '1', text: 'How should I adjust today\'s workout if I\'m sore?' },
    { id: '2', text: 'What should I focus on improving next week?' },
    { id: '3', text: 'Can you simplify today\'s workout if I\'m short on time?' },
  ];

  it('renders all provided prompts', () => {
    render(<QuickPrompts prompts={mockPrompts} onSelectPrompt={jest.fn()} />);
    
    // Check if header is rendered
    expect(screen.getByText('Quick Prompts')).toBeInTheDocument();
    
    // Check if all prompts are rendered
    expect(screen.getByText('How should I adjust today\'s workout if I\'m sore?')).toBeInTheDocument();
    expect(screen.getByText('What should I focus on improving next week?')).toBeInTheDocument();
    expect(screen.getByText('Can you simplify today\'s workout if I\'m short on time?')).toBeInTheDocument();
  });

  it('calls onSelectPrompt with the correct prompt when clicked', () => {
    const mockOnSelectPrompt = jest.fn();
    render(<QuickPrompts prompts={mockPrompts} onSelectPrompt={mockOnSelectPrompt} />);
    
    // Click on the second prompt
    fireEvent.click(screen.getByText('What should I focus on improving next week?'));
    
    // Check if onSelectPrompt was called with the right prompt
    expect(mockOnSelectPrompt).toHaveBeenCalledWith(mockPrompts[1]);
  });

  it('renders nothing when no prompts are provided', () => {
    render(<QuickPrompts prompts={[]} onSelectPrompt={jest.fn()} />);
    
    // Header should still be rendered
    expect(screen.getByText('Quick Prompts')).toBeInTheDocument();
    
    // There should be no prompt buttons
    const promptButtons = screen.queryAllByRole('button');
    expect(promptButtons.length).toBe(0);
  });

  it('applies the correct styling to prompt buttons', () => {
    render(<QuickPrompts prompts={mockPrompts} onSelectPrompt={jest.fn()} />);
    
    // Get all buttons
    const buttons = screen.getAllByRole('button');
    
    // Check styling on the first button
    expect(buttons[0]).toHaveClass('text-indigo-700');
    expect(buttons[0]).toHaveClass('border-indigo-200');
    expect(buttons[0]).toHaveClass('rounded-full');
  });
}); 