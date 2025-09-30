'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestAPIDirectPage() {
  const { data: session, status } = useSession();
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAPIs = async () => {
    setIsLoading(true);
    const testResults: any = {};

    // Test each API endpoint
    const endpoints = [
      { name: 'articles', url: '/api/articles' },
      { name: 'authors', url: '/api/authors' },
      { name: 'divisions', url: '/api/divisions' },
      { name: 'media', url: '/api/media' },
      { name: 'users', url: '/api/users' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        testResults[endpoint.name] = {
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        testResults[endpoint.name] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    setResults(testResults);
    setIsLoading(false);
  };

  if (status === 'loading') {
    return <div className="p-8">Loading session...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Direct API Test</h1>
          <p className="mt-2 text-gray-600">
            Test API endpoints directly to debug CMS issues.
          </p>
          
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <h3 className="font-medium text-gray-900">Session Status:</h3>
            <p className="text-sm text-gray-600">
              Status: {status} | 
              User: {session?.user?.email || 'Not logged in'} | 
              Role: {(session?.user as any)?.role || 'None'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={testAPIs}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing APIs...' : 'Test All APIs'}
          </button>

          {results && (
            <div className="mt-6 space-y-6">
              {Object.entries(results).map(([endpoint, result]: [string, any]) => (
                <div key={endpoint} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                    {endpoint} API
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Response Info:</h4>
                      <div className="text-sm space-y-1">
                        <div>Status: <span className={result.ok ? 'text-green-600' : 'text-red-600'}>{result.status}</span></div>
                        <div>Success: <span className={result.ok ? 'text-green-600' : 'text-red-600'}>{result.ok ? 'Yes' : 'No'}</span></div>
                        {result.error && <div className="text-red-600">Error: {result.error}</div>}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Data Summary:</h4>
                      <div className="text-sm">
                        {result.ok && result.data ? (
                          <div>
                            {Array.isArray(result.data) ? (
                              <div>Array with {result.data.length} items</div>
                            ) : result.data.articles ? (
                              <div>Object with {result.data.articles.length} articles</div>
                            ) : result.data.files ? (
                              <div>Object with {result.data.files.length} files</div>
                            ) : (
                              <div>Object with {Object.keys(result.data).length} properties</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-500">No data</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      View Raw Response
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/cms" className="block text-blue-600 hover:text-blue-800">
              → CMS Dashboard
            </a>
            <a href="/cms/articles" className="block text-blue-600 hover:text-blue-800">
              → CMS Articles
            </a>
            <a href="/auth/signin" className="block text-blue-600 hover:text-blue-800">
              → Sign In (if needed)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}