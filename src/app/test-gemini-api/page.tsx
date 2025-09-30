'use client';

import React, { useState } from 'react';

export default function TestGeminiAPIPage() {
  const [prompt, setPrompt] = useState('Hello, can you respond to this test message?');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testGeminiDirect = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Test direct Gemini API call
      const GEMINI_API_KEY = 'AIzaSyA2NDxmhhTy-rzS4g3A-KFFgPUHpdSzHPg';
      const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      });

      console.log('Gemini API Response Status:', response.status);
      const responseText = await response.text();
      console.log('Gemini API Response:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
        setResponse(generatedText);
      } else {
        setError(`API Error: ${response.status} - ${responseText}`);
      }
    } catch (err) {
      console.error('Gemini API Error:', err);
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testAIAssistantAPI = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: 'test-article',
          articleTitle: 'Test Article',
          articleContent: 'This is a test article about sustainable development in Africa.',
          question: prompt,
          conversationHistory: []
        }),
      });

      console.log('AI Assistant API Response Status:', response.status);
      const responseText = await response.text();
      console.log('AI Assistant API Response:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        setResponse(data.response || 'No response received');
      } else {
        setError(`AI Assistant API Error: ${response.status} - ${responseText}`);
      }
    } catch (err) {
      console.error('AI Assistant API Error:', err);
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🤖 Gemini API Diagnostics</h1>
          
          <div className="space-y-6">
            {/* Test Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a test prompt for Gemini..."
              />
            </div>

            {/* Test Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={testGeminiDirect}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Testing...' : 'Test Direct Gemini API'}
              </button>
              
              <button
                onClick={testAIAssistantAPI}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Testing...' : 'Test AI Assistant API'}
              </button>
            </div>

            {/* Results */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="font-semibold text-red-900 mb-2">Error:</h3>
                <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
              </div>
            )}

            {response && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold text-green-900 mb-2">Response:</h3>
                <div className="text-sm text-green-800 whitespace-pre-wrap">{response}</div>
              </div>
            )}

            {/* API Status */}
            <div className="p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">API Configuration:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Gemini Model:</strong> gemini-1.5-flash-latest</li>
                <li><strong>API Key:</strong> AIzaSyA2NDxmhhTy-rzS4g3A-KFFgPUHpdSzHPg (first 20 chars)</li>
                <li><strong>Endpoint:</strong> https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent</li>
                <li><strong>AI Assistant:</strong> /api/ai/assistant</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}