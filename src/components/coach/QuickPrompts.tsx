import React from 'react';
import { QuickPrompt } from '@/types/coach';

interface QuickPromptsProps {
  prompts: QuickPrompt[];
  onSelectPrompt: (prompt: QuickPrompt) => void;
}

export default function QuickPrompts({ prompts, onSelectPrompt }: QuickPromptsProps) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Quick Prompts</h3>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelectPrompt(prompt)}
            className="text-xs bg-white text-indigo-700 border border-indigo-200 rounded-full px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
} 