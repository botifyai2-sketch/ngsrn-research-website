'use client';

import React, { useState, useEffect } from 'react';

interface TestResults {
  articles: { success: boolean; count?: number; error?: string };
  authors: { success: boolean; count?: number; error?: string };
  divisions: { success: boolean; count?: number; error?: string };
  media: { success: boolean; count?: number; error?: string };
  users: { success: boolean; count?: number; error?: string };
  seoStats: { success: boolean; data?: any; error?: string };
  settings: { success: boolean; data?: any; error?: string };
}

export default function TestCMSDBPage() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoints = async () => {
    setIsLoading(true);
    const testResults: TestResults = {
      articles: { success: false },
      authors: { success: false },
      divisions: { success: false },
      media: { success: false },
      users: { success: false },
      seoStats: { success: false },
      settings: { success: false }
    };

    // Test Articles API
    try {
      const response = await fetch('/api/articles');
      if (response.ok) {
        const data = await response.json();
        testResults.articles = { success: true, count: data.length };
      } else {
        testResults.articles = { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      testResults.articles = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test Authors API
    try {
      const response = await fetch('/api/authors');
      if (response.ok) {
        const data = await response.json();
        testResults.authors = { success: true, count: data.length };
      } else {
        testResults.authors = { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      testResults.authors = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test Divisions API
    try {
      const response = await fetch('/api/divisions');
      if (response.ok) {
        const data = await response.json();
        testResults.divisions = { success: true, count: data.length };
      } else {
        testResults.divisions = { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      testResults.divisions = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test Media API
    try {
      const response = await fetch('/api/media');
      if (response.ok) {
        const data = await response.json();
        testResults.media = { success: true, count: data.length };
      } else {
        testResults.media = { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      testResults.media = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test Users API
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        testResults.users = { success: true, count: data.length };
      } else {
        testResults.users = { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      testResults.users = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test SEO Stats API
    try {
      const response = await fetch('/api/seo/sitemap-stats');
      if (response.ok) {
        const data = await response.json();
        testResults.seoStats = { success: true, data };
      } else {
        testResults.seoStats = { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      testResults.seoStats = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test Settings API
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        testResults.settings = { success: true, data };
      } else {
        testResults.settings = { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      testResults.settings = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    setResults(testResults);
    setIsLoading(false);
  };

  useEffect(() => {
    testEndpoints();
  }, []);

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CMS Database Connection Test</h1>
          <p className="mt-2 text-gray-600">
            Testing all CMS API endpoints and database connections.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">API Endpoint Tests</h2>
            <button
              onClick={testEndpoints}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Retest All'}
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Testing API endpoints...</p>
            </div>
          ) : results ? (
            <div className="space-y-4">
              {Object.entries(results).map(([endpoint, result]) => (
                <div key={endpoint} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(result.success)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900 capitalize">
                        {endpoint.replace(/([A-Z])/g, ' $1').trim()} API
                      </h3>
                      <p className={`text-sm ${getStatusColor(result.success)}`}>
                        {result.success ? 'Connected successfully' : `Failed: ${result.error}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {result.success && result.count !== undefined && (
                      <p className="text-sm text-gray-600">
                        {result.count} records
                      </p>
                    )}
                    {result.success && result.data && (
                      <p className="text-sm text-gray-600">
                        Data loaded
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Click &quot;Test All&quot; to check API endpoints
            </div>
          )}
        </div>

        {results && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(results).filter(r => r.success).length}
                </div>
                <div className="text-sm text-green-800">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(results).filter(r => !r.success).length}
                </div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.values(results).length}
                </div>
                <div className="text-sm text-blue-800">Total Tests</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">CMS Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/cms" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-gray-900">CMS Dashboard</h3>
              <p className="text-sm text-gray-600">Main dashboard with live statistics</p>
            </a>
            <a href="/cms/articles" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-gray-900">Article Management</h3>
              <p className="text-sm text-gray-600">Manage research articles</p>
            </a>
            <a href="/cms/media" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-gray-900">Media Library</h3>
              <p className="text-sm text-gray-600">Upload and manage media files</p>
            </a>
            <a href="/cms/seo" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-gray-900">SEO Management</h3>
              <p className="text-sm text-gray-600">Optimize for search engines</p>
            </a>
            <a href="/cms/users" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">Manage user accounts</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}