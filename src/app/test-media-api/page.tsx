'use client';

import React, { useState } from 'react';

export default function TestMediaAPIPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testMediaAPI = async () => {
    setIsLoading(true);
    const results: any = {};

    // Test GET /api/media
    try {
      const response = await fetch('/api/media');
      results.get = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      };
    } catch (error) {
      results.get = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test POST /api/media with a dummy file
    try {
      const formData = new FormData();
      const dummyFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      formData.append('files', dummyFile);

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData
      });

      results.post = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      };
    } catch (error) {
      results.post = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Media API Test</h1>
          <p className="mt-2 text-gray-600">
            Test the media API endpoints to debug upload issues.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={testMediaAPI}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test Media API'}
          </button>

          {testResults && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">GET /api/media</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults.get, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">POST /api/media</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults.post, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a href="/cms/media" className="block text-blue-600 hover:text-blue-800">
              → CMS Media Management
            </a>
            <a href="/test-media" className="block text-blue-600 hover:text-blue-800">
              → Media Component Test
            </a>
            <a href="/test-cms-db" className="block text-blue-600 hover:text-blue-800">
              → CMS Database Test
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}