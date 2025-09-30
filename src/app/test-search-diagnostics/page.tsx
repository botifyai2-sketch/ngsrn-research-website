'use client';

import React, { useState } from 'react';

export default function TestSearchDiagnosticsPage() {
  const [searchQuery, setSearchQuery] = useState('agriculture');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testSearchAPI = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`, {
        method: 'GET',
      });

      console.log('Search API Response Status:', response.status);
      const responseText = await response.text();
      console.log('Search API Response:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        setResults(data);
      } else {
        setError(`Search API Error: ${response.status} - ${responseText}`);
      }
    } catch (err) {
      console.error('Search API Error:', err);
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSearchHealth = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/search/health', {
        method: 'GET',
      });

      console.log('Search Health Response Status:', response.status);
      const responseText = await response.text();
      console.log('Search Health Response:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        setResults(data);
      } else {
        setError(`Search Health Error: ${response.status} - ${responseText}`);
      }
    } catch (err) {
      console.error('Search Health Error:', err);
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/articles?limit=3', {
        method: 'GET',
      });

      console.log('Database Test Response Status:', response.status);
      const responseText = await response.text();
      console.log('Database Test Response:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        setResults({
          message: 'Database connection successful',
          articlesFound: data.articles?.length || 0,
          sampleData: data
        });
      } else {
        setError(`Database Error: ${response.status} - ${responseText}`);
      }
    } catch (err) {
      console.error('Database Error:', err);
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Search System Diagnostics</h1>
          
          <div className="space-y-6">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter search query..."
              />
            </div>

            {/* Test Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={testDatabaseConnection}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Testing...' : 'Test Database'}
              </button>
              
              <button
                onClick={testSearchHealth}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Testing...' : 'Test Search Health'}
              </button>
              
              <button
                onClick={testSearchAPI}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Testing...' : 'Test Search API'}
              </button>
            </div>

            {/* Results */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="font-semibold text-red-900 mb-2">Error:</h3>
                <pre className="text-sm text-red-800 whitespace-pre-wrap overflow-auto max-h-64">{error}</pre>
              </div>
            )}

            {results && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold text-green-900 mb-2">Results:</h3>
                <pre className="text-sm text-green-800 whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            )}

            {/* System Status */}
            <div className="p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">System Components:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Database:</strong> SQLite with Prisma ORM</li>
                <li><strong>Search Engine:</strong> Database-based search with ranking</li>
                <li><strong>AI Integration:</strong> Google Gemini API</li>
                <li><strong>Articles API:</strong> /api/articles</li>
                <li><strong>Search API:</strong> /api/search</li>
                <li><strong>Search Health:</strong> /api/search/health</li>
              </ul>
            </div>

            {/* Quick Fixes */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-semibold text-yellow-900 mb-2">Common Issues & Fixes:</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li><strong>Database not seeded:</strong> Run `npm run db:seed`</li>
                <li><strong>Search index missing:</strong> Check if articles exist in database</li>
                <li><strong>Gemini API failing:</strong> Verify API key and network connection</li>
                <li><strong>CORS issues:</strong> Check if running on correct port (3010)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}