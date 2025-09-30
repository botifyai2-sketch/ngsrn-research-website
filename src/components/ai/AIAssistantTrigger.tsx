'use client';

import React, { useState, useEffect } from 'react';
import { Bot, MessageCircle } from 'lucide-react';
import AIAssistant from './AIAssistant';

interface AIAssistantTriggerProps {
  articleId: string;
  articleTitle: string;
  articleContent: string;
  isMobile?: boolean;
}

export default function AIAssistantTrigger({ 
  articleId, 
  articleTitle, 
  articleContent, 
  isMobile = false 
}: AIAssistantTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Auto-show hint after user has been reading for a while
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted && !isOpen) {
        // Could add a subtle animation or notification here
      }
    }, 30000); // Show hint after 30 seconds

    return () => clearTimeout(timer);
  }, [hasInteracted, isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Floating Button */}
        {!isOpen && (
          <button
            onClick={handleToggle}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center justify-center group"
            aria-label="Open NGSRN AI Assistant"
          >
            <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
            
            {/* Pulse animation for new users */}
            {!hasInteracted && (
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Ask AI about this article
            </div>
          </button>
        )}

        {/* Mobile Bottom Sheet */}
        {isOpen && (
          <div className="fixed inset-x-0 bottom-0 top-1/3 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 z-50 flex flex-col">
            <AIAssistant
              articleId={articleId}
              articleTitle={articleTitle}
              articleContent={articleContent}
              isOpen={isOpen}
              onToggle={handleToggle}
              isMobile={true}
            />
          </div>
        )}
      </>
    );
  }

  // Desktop Sidebar Widget
  return (
    <div className="w-full">
      {!isOpen ? (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Ask NGSRN AI</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get instant answers, summaries, and explanations about this research article.
            </p>
            <button
              onClick={handleToggle}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Start Conversation</span>
            </button>
            
            {/* Features list */}
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <span>📖</span>
                <span>Article summaries</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span>❓</span>
                <span>Q&A about content</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span>💡</span>
                <span>Concept explanations</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <AIAssistant
            articleId={articleId}
            articleTitle={articleTitle}
            articleContent={articleContent}
            isOpen={isOpen}
            onToggle={handleToggle}
            isMobile={false}
          />
        </div>
      )}
    </div>
  );
}