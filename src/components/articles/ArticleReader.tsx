'use client';

import React from 'react';
import Link from 'next/link';
import { ArticleWithRelations } from '@/types';
import { ArticleWithAI } from './ArticleWithAI';
import { cn } from '@/lib/utils';

interface ArticleReaderProps {
  article: ArticleWithRelations;
  enableAIAssistant?: boolean;
  showTableOfContents?: boolean;
  className?: string;
}

export function ArticleReader({ 
  article, 
  enableAIAssistant = false,
  showTableOfContents = true,
  className 
}: ArticleReaderProps) {
  return (
    <div className={cn('min-h-screen bg-white', className)}>
      {/* Back Navigation */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-4 text-sm">
            <Link 
              href="/articles" 
              className="text-ngsrn-blue hover:text-ngsrn-green transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Articles
            </Link>
            <span className="text-gray-300">/</span>
            <Link 
              href={`/research/${article.division.id}`}
              className="text-ngsrn-blue hover:text-ngsrn-green transition-colors"
            >
              {article.division.name}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 truncate max-w-md">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <ArticleWithAI 
          article={article}
          showTableOfContents={showTableOfContents}
          enableAIAssistant={enableAIAssistant}
        />

        {/* Related Articles Placeholder */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-ngsrn-blue mb-6">
            Related Articles in {article.division.name}
          </h3>
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              Related articles will be displayed here once the search functionality is implemented.
            </p>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile TOC */}
      {showTableOfContents && (
        <button className="lg:hidden fixed bottom-6 right-6 w-12 h-12 bg-ngsrn-blue text-white rounded-full shadow-lg hover:bg-ngsrn-blue/90 transition-colors z-50">
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  );
}