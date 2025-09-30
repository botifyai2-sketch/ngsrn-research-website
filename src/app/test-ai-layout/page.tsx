import React from 'react';
import { ArticleWithAI } from '@/components/articles/ArticleWithAI';

// Mock article data for testing the new AI layout
const mockArticle = {
  id: 'test-layout-article',
  title: 'Testing the New AI Assistant Layout',
  slug: 'test-ai-layout',
  content: `# Testing the New AI Assistant Layout

## Overview

This is a test article to verify that the AI assistant no longer covers the article content and provides a better user experience.

## Key Features

### Desktop Experience
- **Side-by-side layout**: Article content and AI assistant are displayed side by side
- **No content overlap**: The AI assistant doesn't cover any article text
- **Sticky positioning**: AI assistant stays in view while scrolling
- **Responsive design**: Layout adapts to different screen sizes

### Mobile Experience
- **Bottom sheet**: AI assistant appears as a bottom sheet covering only 2/3 of the screen
- **Floating button**: Easy access via floating action button
- **Swipe-friendly**: Natural mobile interaction patterns
- **Content preservation**: Article remains visible above the AI assistant

## Content Sections

### Section 1: Introduction
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Section 2: Methodology
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Section 3: Results
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

### Section 4: Discussion
Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

### Section 5: Conclusion
Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

## Testing Instructions

1. **Desktop Testing**:
   - Verify the AI assistant appears on the right side
   - Check that article content is not covered
   - Test scrolling behavior
   - Try opening and closing the AI chat

2. **Mobile Testing**:
   - Look for the floating AI button
   - Tap to open the bottom sheet
   - Verify article content remains visible
   - Test the chat functionality

3. **Text Selection**:
   - Highlight any text in this article
   - Check if explanation options appear
   - Test the "Explain" and "Ask AI" features

## Sample Questions for AI

Try asking the AI assistant these questions:
- "What is this article about?"
- "Summarize the key features"
- "Explain the desktop experience"
- "What are the testing instructions?"

The AI should be able to answer based on this article's content without covering the text you're reading.`,
  summary: 'A test article to verify the new AI assistant layout that displays side-by-side on desktop and as a bottom sheet on mobile without covering article content.',
  tags: ['testing', 'ai-assistant', 'layout', 'user-experience'],
  status: 'PUBLISHED' as const,
  publishedAt: new Date(),
  readTime: 5,
  seoTitle: 'Testing AI Assistant Layout',
  seoDescription: 'Test page for the new AI assistant layout design',
  seoKeywords: ['ai assistant', 'layout', 'testing'],
  createdAt: new Date(),
  updatedAt: new Date(),
  divisionId: 'policy-innovation',
  division: {
    id: 'policy-innovation',
    name: 'Policy & Innovation',
    description: 'Policy research and innovation in governance and technology',
    sdgAlignment: ['SDG 9: Industry, Innovation and Infrastructure'],
    color: '#FFD700',
    icon: 'lightbulb',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  authors: [
    {
      author: {
        id: 'test-author',
        name: 'Test Author',
        title: 'UI/UX Researcher',
        bio: 'Specialist in user interface design and user experience optimization.',
        email: 'test@ngsrn.org',
        linkedinUrl: null,
        profileImage: null,
        isLeadership: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        researchDivisions: []
      },
      order: 0
    }
  ],
  mediaFiles: []
};

export default function TestAILayoutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">🎨 AI Assistant Layout Test</h1>
          <p className="text-blue-100">
            Testing the new side-by-side layout that doesn't cover article content
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">🧪 Layout Testing Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Desktop (Large Screens):</h3>
              <ul className="space-y-1 text-blue-700 text-sm">
                <li>• AI assistant should appear on the right side</li>
                <li>• Article content should not be covered</li>
                <li>• Both should be visible simultaneously</li>
                <li>• AI assistant should stick while scrolling</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Mobile (Small Screens):</h3>
              <ul className="space-y-1 text-blue-700 text-sm">
                <li>• Floating AI button in bottom-right corner</li>
                <li>• Tap to open bottom sheet (covers 2/3 of screen)</li>
                <li>• Article content remains visible above</li>
                <li>• Easy to close and reopen</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Article with New AI Layout */}
        <ArticleWithAI 
          article={mockArticle}
          showTableOfContents={true}
          enableAIAssistant={true}
        />
      </div>
    </div>
  );
}