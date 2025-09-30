'use client';

import { useEffect, useState } from 'react';
import { PerformanceMonitor } from '@/lib/performance';

interface MetricStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Record<string, MetricStats>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();
    
    const updateMetrics = () => {
      setMetrics(monitor.getAllMetrics());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial load

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        Show Performance
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3">
        {Object.entries(metrics).map(([name, stats]) => (
          <div key={name} className="border-b border-gray-100 pb-2">
            <div className="font-medium text-sm text-gray-700 mb-1">
              {formatMetricName(name)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>Avg: {stats.avg.toFixed(2)}ms</div>
              <div>P95: {stats.p95.toFixed(2)}ms</div>
              <div>Min: {stats.min.toFixed(2)}ms</div>
              <div>Max: {stats.max.toFixed(2)}ms</div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.count} samples
            </div>
          </div>
        ))}
        
        {Object.keys(metrics).length === 0 && (
          <div className="text-gray-500 text-sm text-center py-4">
            No performance data available yet
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => {
            PerformanceMonitor.getInstance().clearMetrics();
            setMetrics({});
          }}
          className="text-xs text-red-600 hover:text-red-700"
        >
          Clear Metrics
        </button>
      </div>
    </div>
  );
}

function formatMetricName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}