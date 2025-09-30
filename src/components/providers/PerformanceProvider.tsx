'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/service-worker';

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Register service worker for caching
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }

    // Initialize performance monitoring
    import('@/lib/performance').then(({ initWebVitals, monitorResourceTiming }) => {
      initWebVitals();
      monitorResourceTiming();
    });

    // Preload critical resources
    preloadCriticalResources();
  }, []);

  return <>{children}</>;
}

function preloadCriticalResources() {
  // Preload critical fonts
  const fontPreloads = [
    '/fonts/inter-var.woff2',
    '/fonts/merriweather-var.woff2',
  ];

  fontPreloads.forEach((font) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload critical API endpoints
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload divisions data
      fetch('/api/divisions').catch(() => {
        // Ignore errors for preloading
      });
    });
  }
}