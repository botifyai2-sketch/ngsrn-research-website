'use client';

import React, { useState } from 'react';

export default function TestAIAPIPage() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testArticle = {
    id: 'test-article',
    title: 'Sustainable Agriculture in Africa',
    content: `Agriculture is crucial for African economies. Key challenges include climate change, soil degradation, and limited technology access. Solutions involve agroecological approaches, crop rotation, and modern technology integration. Policy recommendations include investment in research, farmer education, and climate-resilient infrastructure.`
  };

  const handleTest = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: testArticle.id,
          articleTitle: testArticle.title,
          articleContent: testArticle.content,
          question: question,
          conversationHistory: []
        }),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const quickTests = [
    'Summarize this article',
    'What are the main challenges?',
    'Explain agroecological approaches',
    'What are the policy recommendations?'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🧪 AI Assistant API Test</h1>
          
          {/* Test Article Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Test Article:</h3>
            <p className="text-blue-800 font-medium">{testArticle.title}</p>
            <p className="text-blue-700 text-sm mt-1">{testArticle.content}</p>
          </div>

          {/* Quick Test Buttons */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Tests:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickTests.map((test, index) => (
                <button
                  key={index}
                  onClick={() => setQuestion(test)}
                  className="text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm"
                >
                  {test}
                </button>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ask a Question:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question about the article..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleTest()}
              />
              <button
                onClick={handleTest}
                disabled={loading || !question.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Testing...' : 'Test API'}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span className="text-yellow-800">Calling Gemini API...</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">API Error:</h4>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">AI Response:</h4>
              <div className="text-green-800 whitespace-pre-wrap">{response}</div>
            </div>
          )}

          {/* API Status Check */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">API Endpoint Status:</h3>
            <p className="text-gray-700 text-sm">
              <strong>Endpoint:</strong> <code>/api/ai/assistant</code>
            </p>
            <p className="text-gray-700 text-sm">
              <strong>Method:</strong> POST
            </p>
            <p className="text-gray-700 text-sm">
              <strong>Gemini Model:</strong> gemini-1.5-flash-latest
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}