'use client';

import { useState, useEffect } from 'react';

interface ValidationResult {
  component: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface SetupResult {
  step: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  details?: any;
}

interface HealthCheck {
  isHealthy: boolean;
  issues: string[];
  stats: any;
}

export default function SearchAdminPage() {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    results: ValidationResult[];
    summary: { total: number; success: number; warnings: number; errors: number };
  } | null>(null);

  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [setup, setSetup] = useState<{
    isSuccessful: boolean;
    results: SetupResult[];
    summary: { total: number; success: number; errors: number; skipped: number };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'validation' | 'setup'>('health');

  useEffect(() => {
    loadHealthCheck();
  }, []);

  const loadHealthCheck = async () => {
    try {
      const response = await fetch('/api/search/setup');
      const data = await response.json();
      if (data.success) {
        setHealth(data.health);
      }
    } catch (error) {
      console.error('Failed to load health check:', error);
    }
  };

  const runValidation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search/validate');
      const data = await response.json();
      if (data.success) {
        setValidation(data.validation);
      }
    } catch (error) {
      console.error('Failed to run validation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search/setup', { method: 'POST' });
      const data = await response.json();
      setSetup(data.setup);
      // Refresh health check after setup
      await loadHealthCheck();
    } catch (error) {
      console.error('Failed to run setup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'skipped': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Infrastructure Admin</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {[
          { key: 'health', label: 'Health Check' },
          { key: 'validation', label: 'Validation' },
          { key: 'setup', label: 'Setup' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === tab.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Health Check Tab */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">System Health</h2>
            <button
              onClick={loadHealthCheck}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {health && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                health.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {health.isHealthy ? '✅ Healthy' : '❌ Issues Detected'}
              </div>

              {health.issues.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-red-600 mb-2">Issues:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {health.issues.map((issue, index) => (
                      <li key={index} className="text-red-600">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {health.stats && Object.keys(health.stats).length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Statistics:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {Object.entries(health.stats).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Infrastructure Validation</h2>
            <button
              onClick={runValidation}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Running...' : 'Run Validation'}
            </button>
          </div>

          {validation && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">Validation Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Total:</strong> {validation.summary.total}
                  </div>
                  <div className="text-green-600">
                    <strong>Success:</strong> {validation.summary.success}
                  </div>
                  <div className="text-yellow-600">
                    <strong>Warnings:</strong> {validation.summary.warnings}
                  </div>
                  <div className="text-red-600">
                    <strong>Errors:</strong> {validation.summary.errors}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-2">
                {validation.results.map((result, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{result.component}</h4>
                        <p className="text-gray-600 mt-1">{result.message}</p>
                        {result.details && (
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Setup Tab */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Infrastructure Setup</h2>
            <button
              onClick={runSetup}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Run Setup'}
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <strong>Note:</strong> Setup will initialize the search infrastructure and create necessary indexes.
              This is safe to run multiple times.
            </p>
          </div>

          {setup && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">Setup Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Total:</strong> {setup.summary.total}
                  </div>
                  <div className="text-green-600">
                    <strong>Success:</strong> {setup.summary.success}
                  </div>
                  <div className="text-gray-600">
                    <strong>Skipped:</strong> {setup.summary.skipped}
                  </div>
                  <div className="text-red-600">
                    <strong>Errors:</strong> {setup.summary.errors}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-2">
                {setup.results.map((result, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{result.step}</h4>
                        <p className="text-gray-600 mt-1">{result.message}</p>
                        {result.details && (
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}