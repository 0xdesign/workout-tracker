import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageBubble from '@/components/coach/MessageBubble';
import { Message } from '@/types/coach';
import { formatDate } from '@/lib/utils';

// Mock the formatDate utility
jest.mock('@/lib/utils', () => ({
  formatDate: jest.fn(),
}));

describe('MessageBubble', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formatDate as jest.Mock).mockReturnValue('10:30 AM');
  });

  it('renders user message with correct styles', () => {
    const userMessage: Message = {
      id: '1',
      role: 'user',
      content: 'Hello coach, I need help with my workout.',
      timestamp: new Date('2025-04-29T10:30:00Z').getTime(),
    };
    
    const { container } = render(<MessageBubble message={userMessage} />);
    
    const messageElement = screen.getByText('Hello coach, I need help with my workout.');
    expect(messageElement).toBeInTheDocument();
    
    // Check if the message container has the right user-specific classes
    const messageContainer = container.querySelector('.bg-indigo-600');
    expect(messageContainer).toHaveClass('bg-indigo-600');
    expect(messageContainer).toHaveClass('text-white');
    expect(messageContainer).toHaveClass('rounded-tr-none');
    
    // Check if the timestamp is displayed
    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
    expect(formatDate).toHaveBeenCalledWith(expect.any(Date), 'time');
  });
  
  it('renders assistant message with correct styles', () => {
    const assistantMessage: Message = {
      id: '2',
      role: 'assistant',
      content: 'I recommend increasing your weight by 5 pounds.',
      timestamp: new Date('2025-04-29T10:31:00Z').getTime(),
    };
    
    const { container } = render(<MessageBubble message={assistantMessage} />);
    
    const messageElement = screen.getByText('I recommend increasing your weight by 5 pounds.');
    expect(messageElement).toBeInTheDocument();
    
    // Check if the message container has the right assistant-specific classes
    const messageContainer = container.querySelector('.bg-gray-100');
    expect(messageContainer).toHaveClass('bg-gray-100');
    expect(messageContainer).toHaveClass('text-gray-800');
    expect(messageContainer).toHaveClass('rounded-tl-none');
    
    // Check if the timestamp is displayed
    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
    expect(formatDate).toHaveBeenCalledWith(expect.any(Date), 'time');
  });
  
  it('preserves whitespace in message content', () => {
    const messageWithWhitespace: Message = {
      id: '3',
      role: 'assistant',
      content: 'Here is your workout plan:\n\n- Exercise 1\n- Exercise 2\n- Exercise 3',
      timestamp: new Date('2025-04-29T10:32:00Z').getTime(),
    };
    
    render(<MessageBubble message={messageWithWhitespace} />);
    
    // Check that the text content is preserved using a regex pattern
    const textElement = screen.getByText((content) => {
      return content.includes('Here is your workout plan:') && 
             content.includes('Exercise 1') && 
             content.includes('Exercise 2') && 
             content.includes('Exercise 3');
    });
    expect(textElement).toBeInTheDocument();
    
    // Check if the whitespace is preserved
    expect(textElement).toHaveClass('whitespace-pre-wrap');
  });
}); 