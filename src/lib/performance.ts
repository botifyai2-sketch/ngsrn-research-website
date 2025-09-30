'use client';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure function execution time
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  // Record a metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get metric statistics
  getMetricStats(name: string) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  // Get all metrics
  getAllMetrics() {
    const result: Record<string, any> = {};
    this.metrics.forEach((_, name) => {
      result[name] = this.getMetricStats(name);
    });
    return result;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  import('web-vitals').then((webVitals: any) => {
    const monitor = PerformanceMonitor.getInstance();

    if (webVitals.onCLS) {
      webVitals.onCLS((metric: any) => {
        monitor.recordMetric('web_vitals_cls', metric.value);
      });
    }

    if (webVitals.onINP) {
      webVitals.onINP((metric: any) => {
        monitor.recordMetric('web_vitals_inp', metric.value);
      });
    }

    if (webVitals.onFCP) {
      webVitals.onFCP((metric: any) => {
        monitor.recordMetric('web_vitals_fcp', metric.value);
      });
    }

    if (webVitals.onLCP) {
      webVitals.onLCP((metric: any) => {
        monitor.recordMetric('web_vitals_lcp', metric.value);
      });
    }

    if (webVitals.onTTFB) {
      webVitals.onTTFB((metric: any) => {
        monitor.recordMetric('web_vitals_ttfb', metric.value);
      });
    }
  }).catch(() => {
    // web-vitals not available, skip monitoring
  });
}

// Resource timing monitoring
export function monitorResourceTiming() {
  if (typeof window === 'undefined') return;

  const monitor = PerformanceMonitor.getInstance();
  
  // Monitor navigation timing
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      monitor.recordMetric('navigation_dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
      monitor.recordMetric('navigation_load_complete', navigation.loadEventEnd - navigation.loadEventStart);
      monitor.recordMetric('navigation_dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart);
      monitor.recordMetric('navigation_tcp_connect', navigation.connectEnd - navigation.connectStart);
    }
  });

  // Monitor resource loading
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming;
        const resourceType = getResourceType(resource.name);
        monitor.recordMetric(`resource_${resourceType}_duration`, resource.duration);
        monitor.recordMetric(`resource_${resourceType}_size`, resource.transferSize || 0);
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
}

function getResourceType(url: string): string {
  if (url.includes('/_next/static/')) return 'static';
  if (url.includes('/api/')) return 'api';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) return 'image';
  if (url.match(/\.(css)$/i)) return 'css';
  if (url.match(/\.(js)$/i)) return 'js';
  return 'other';
}

// Performance hook for React components
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  return {
    measureAsync: monitor.measureAsync.bind(monitor),
    measure: monitor.measure.bind(monitor),
    recordMetric: monitor.recordMetric.bind(monitor),
    getMetricStats: monitor.getMetricStats.bind(monitor),
    getAllMetrics: monitor.getAllMetrics.bind(monitor),
  };
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  initWebVitals();
  monitorResourceTiming();
}