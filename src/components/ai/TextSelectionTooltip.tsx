'use client';

import React from 'react';
import { Lightbulb, MessageSquare } from 'lucide-react';

interface TextSelectionTooltipProps {
  selectedText: string;
  position: { x: number; y: number };
  onExplain: (text: string) => void;
  onAsk: (text: string) => void;
  onClose: () => void;
}

export default function TextSelectionTooltip({
  selectedText,
  position,
  onExplain,
  onAsk,
  onClose
}: TextSelectionTooltipProps) {
  if (!selectedText || !position) return null;

  const handleExplain = () => {
    onExplain(selectedText);
    onClose();
  };

  const handleAsk = () => {
    onAsk(selectedText);
    onClose();
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
      style={{
        left: Math.max(10, Math.min(position.x - 100, window.innerWidth - 210)),
        top: Math.max(10, position.y - 60),
      }}
    >
      <div className="flex items-center space-x-1">
        <button
          onClick={handleExplain}
          className="flex items-center space-x-1 px-3 py-2 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-md transition-colors"
          title="Explain this concept"
        >
          <Lightbulb className="w-3 h-3" />
          <span>Explain</span>
        </button>
        
        <button
          onClick={handleAsk}
          className="flex items-center space-x-1 px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-md transition-colors"
          title="Ask about this"
        >
          <MessageSquare className="w-3 h-3" />
          <span>Ask AI</span>
        </button>
        
        <button
          onClick={onClose}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          ×
        </button>
      </div>
      
      {/* Tooltip arrow */}
      <div 
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"
      />
    </div>
  );
}