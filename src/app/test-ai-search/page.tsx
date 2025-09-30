'use client';

import { useState } from 'react';

export default function TestAISearchPage() {
  const [query, setQuery] = useState('sustainable agriculture');
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any>(null);

  const testAISummary = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setAiSummary(null);

    try {
      const response = await fetch(`/api/search/ai-summary?q=${encodeURIComponent(query)}&limit=5&maxLength=300`);
      const data = await response.json();
      
      if (data.success) {
        setAiSummary(data.aiSummary);
        setSearchResults(data.searchResults);
      } else {
        setError(data.error || 'Failed to generate AI summary');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testAdvancedAISummary = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setAiSummary(null);

    try {
      const response = await fetch('/api/search/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          options: {
            maxLength: 250,
            includeKeyPoints: true,
            includeRecommendations: true,
            focusAreas: ['policy', 'sustainability', 'africa']
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAiSummary(data.aiSummary);
        setSearchResults(data.articles);
      } else {
        setError(data.error || 'Failed to generate AI summary');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testQueries = [
    'sustainable agriculture',
    'gender equity education',
    'climate change africa',
    'governance policy',
    'economic development',
    'health systems',
    'renewable energy',
    'food security'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI-Powered Search Test</h1>

      {/* Test Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Test AI Search Summarization</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testAISummary()}
              placeholder="Enter search query..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={testAISummary}
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Test Basic AI Summary'}
            </button>
            
            <button
              onClick={testAdvancedAISummary}
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Test Advanced AI Summary'}
            </button>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Quick test queries:</p>
            <div className="flex flex-wrap gap-2">
              {testQueries.map((testQuery, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(testQuery)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  {testQuery}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-700">Generating AI summary using Gemini API...</span>
          </div>
        </div>
      )}

      {/* AI Summary Results */}
      {aiSummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Research Summary
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Summary:</h4>
              <p className="text-gray-700 leading-relaxed">{aiSummary.summary}</p>
            </div>

            {aiSummary.keyPoints && aiSummary.keyPoints.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Key Points:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {aiSummary.keyPoints.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiSummary.relevanceExplanation && (
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Relevance Explanation:</h4>
                <p className="text-gray-700">{aiSummary.relevanceExplanation}</p>
              </div>
            )}

            <div className="bg-white bg-opacity-50 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-700">
                  Confidence: {Math.round((aiSummary.confidence || 0.7) * 100)}%
                </span>
                <span className="text-blue-600">
                  {aiSummary.cached ? '🔄 Cached Result' : '✨ Fresh Analysis'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            Search Results Used for AI Summary ({searchResults.length})
          </h3>
          
          <div className="space-y-3">
            {searchResults.map((result: any, index: number) => (
              <div key={result.id || index} className="border-l-4 border-blue-200 pl-4 py-2">
                <h4 className="font-medium text-gray-900">{result.title}</h4>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">{result.division}</span>
                  {result.authors && (
                    <>
                      {' • '}
                      <span>{result.authors.join(', ')}</span>
                    </>
                  )}
                  {result.relevanceScore && (
                    <>
                      {' • '}
                      <span>Relevance: {(result.relevanceScore * 100).toFixed(0)}%</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Information */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">API Information</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Gemini API:</strong> Using Google Gemini 1.5 Flash for AI summarization</p>
          <p><strong>Endpoints:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code>GET /api/search/ai-summary</code> - Basic AI summary generation</li>
            <li><code>POST /api/search/ai-summary</code> - Advanced AI summary with custom options</li>
          </ul>
          <p><strong>Features:</strong> Caching, fallback summaries, confidence scoring, key point extraction</p>
        </div>
      </div>
    </div>
  );
}