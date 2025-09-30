'use client';

import React, { useState } from 'react';
import { ArticleWithRelations } from '@/types';
import { Article } from './Article';
import AIAssistantTrigger from '../ai/AIAssistantTrigger';
import TextSelectionTooltip from '../ai/TextSelectionTooltip';
import { useAIAssistant, useTextSelection } from '@/hooks/useAIAssistant';

interface ArticleWithAIProps {
  article: ArticleWithRelations;
  showTableOfContents?: boolean;
  enableAIAssistant?: boolean;
  className?: string;
}

export function ArticleWithAI({ 
  article, 
  showTableOfContents = true,
  enableAIAssistant = true,
  className 
}: ArticleWithAIProps) {
  const { isMobile, isSupported } = useAIAssistant();
  const { selectedText, selectionPosition, clearSelection } = useTextSelection();
  const [, setAiQuestion] = useState<string>('');

  // Prepare article content for AI (strip markdown and clean up)
  const prepareContentForAI = (content: string): string => {
    return content
      .replace(/#{1,6}\s+/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/```[\s\S]*?```/g, '[Code Block]') // Replace code blocks
      .replace(/`(.*?)`/g, '$1') // Remove inline code formatting
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
  };

  const cleanContent = prepareContentForAI(article.content);

  const handleExplainSelection = (text: string) => {
    setAiQuestion(`Please explain this concept from the article: "${text}"`);
  };

  const handleAskAboutSelection = (text: string) => {
    setAiQuestion(`I have a question about this part of the article: "${text}". Can you provide more details?`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto article-with-ai">
      {/* Main Article Content */}
      <div className="flex-1 min-w-0">
        <Article 
          article={article}
          showTableOfContents={showTableOfContents}
          className={className}
        />
      </div>

      {/* AI Assistant */}
      {enableAIAssistant && isSupported && (
        <>
          {/* Desktop: Right Sidebar */}
          {!isMobile && (
            <div className="hidden lg:block w-96 flex-shrink-0">
              <div className="sticky top-8">
                <AIAssistantTrigger
                  articleId={article.id}
                  articleTitle={article.title}
                  articleContent={cleanContent}
                  isMobile={false}
                />
              </div>
            </div>
          )}

          {/* Mobile: Bottom Sheet */}
          {isMobile && (
            <AIAssistantTrigger
              articleId={article.id}
              articleTitle={article.title}
              articleContent={cleanContent}
              isMobile={true}
            />
          )}

          {/* Text Selection Tooltip */}
          {selectedText && selectionPosition && (
            <TextSelectionTooltip
              selectedText={selectedText}
              position={selectionPosition}
              onExplain={handleExplainSelection}
              onAsk={handleAskAboutSelection}
              onClose={clearSelection}
            />
          )}
        </>
      )}

      {/* AI Not Supported Message */}
      {enableAIAssistant && !isSupported && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm">
          <div className="flex items-start space-x-2">
            <div className="text-yellow-600">⚠️</div>
            <div>
              <p className="text-sm font-medium text-yellow-800">AI Assistant Unavailable</p>
              <p className="text-xs text-yellow-700 mt-1">
                Your browser doesn't support the AI features. Please update to a modern browser.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Styles for better article reading with AI */}
      <style jsx global>{`
        .article-content {
          user-select: text;
        }
        
        .article-content ::selection {
          background-color: rgba(59, 130, 246, 0.2);
        }
        
        .article-content ::-moz-selection {
          background-color: rgba(59, 130, 246, 0.2);
        }

        /* Responsive layout adjustments */
        @media (max-width: 1023px) {
          .article-with-ai {
            padding-bottom: 6rem; /* Space for mobile AI button */
          }
        }

        /* Smooth transitions for AI components */
        .ai-bottom-sheet {
          transform: translateY(100%);
          transition: transform 0.3s ease-out;
        }
        
        .ai-bottom-sheet.open {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}