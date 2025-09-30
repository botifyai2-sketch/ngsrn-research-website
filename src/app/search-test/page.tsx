'use client';

import { useState, useEffect } from 'react';

export default function SearchTestPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testQuery, setTestQuery] = useState('agriculture');
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search/diagnose');
      const data = await response.json();
      setDiagnostics(data.diagnostics);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testSearch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(testQuery)}&limit=5`);
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Infrastructure Test</h1>

      {/* Overall Status */}
      {diagnostics && (
        <div className="mb-8">
          <div className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${
            diagnostics.summary?.overallStatus === 'healthy' ? 'bg-green-100 text-green-800' :
            diagnostics.summary?.overallStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {diagnostics.summary?.overallStatus === 'healthy' ? '✅ System Healthy' :
             diagnostics.summary?.overallStatus === 'warning' ? '⚠️ Warnings Detected' :
             '❌ Errors Detected'}
          </div>
          
          {diagnostics.summary && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Total Checks:</strong> {diagnostics.summary.totalChecks}
              </div>
              <div className="text-green-600">
                <strong>Successful:</strong> {diagnostics.summary.successful}
              </div>
              <div className="text-yellow-600">
                <strong>Warnings:</strong> {diagnostics.summary.warnings}
              </div>
              <div className="text-red-600">
                <strong>Errors:</strong> {diagnostics.summary.errors}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Results */}
      {diagnostics && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Diagnostic Results</h2>
            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Running...' : 'Refresh'}
            </button>
          </div>

          <div className="space-y-3">
            {diagnostics.checks?.map((check: any, index: number) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{check.name}</h3>
                    <p className="text-gray-600 mt-1">{check.message}</p>
                    {check.data && (
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(check.data, null, 2)}
                      </pre>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(check.status)}`}>
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Errors and Warnings Summary */}
          {(diagnostics.errors?.length > 0 || diagnostics.warnings?.length > 0) && (
            <div className="mt-6 space-y-4">
              {diagnostics.errors?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">Errors:</h3>
                  <ul className="list-disc list-inside space-y-1 text-red-700">
                    {diagnostics.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {diagnostics.warnings?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">Warnings:</h3>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700">
                    {diagnostics.warnings.map((warning: string, index: number) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search Test */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Search Test</h2>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter search query..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={testSearch}
              disabled={isLoading || !testQuery.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Search'}
            </button>
          </div>

          {testResults && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Search Results:</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => window.open('/api/search/stats', '_blank')}
            className="block w-full text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
          >
            View Search Stats
          </button>
          <button
            onClick={() => window.open('/api/search/filters', '_blank')}
            className="block w-full text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
          >
            View Filter Options
          </button>
          <button
            onClick={() => window.open('/api/search/popular', '_blank')}
            className="block w-full text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
          >
            View Popular Terms
          </button>
          <button
            onClick={() => window.open('/search-admin', '_blank')}
            className="block w-full text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
          >
            Open Search Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}