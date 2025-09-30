import dynamic from 'next/dynamic';
import { ComponentType, createElement } from 'react';

// Loading component for lazy-loaded components
export const LoadingSpinner = () => 
  createElement('div', { className: 'flex items-center justify-center p-8' },
    createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' })
  );

// Error boundary component for lazy-loaded components
export const LazyLoadError = ({ error }: { error: Error }) => 
  createElement('div', { className: 'flex items-center justify-center p-8 text-red-600' },
    createElement('div', { className: 'text-center' },
      createElement('p', { className: 'font-medium' }, 'Failed to load component'),
      createElement('p', { className: 'text-sm text-gray-500 mt-1' }, error.message)
    )
  );

// Utility function to create lazy-loaded components with consistent loading states
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options?: {
    loading?: ComponentType;
    error?: ComponentType<{ error: Error }>;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || (() => LoadingSpinner()),
    ssr: false, // Disable SSR for lazy components to improve initial load
  });
}

// Pre-configured lazy components for common use cases
export const LazySearchComponent = createLazyComponent(
  () => import('@/components/search/SearchComponent')
);

export const LazyAIAssistant = createLazyComponent(
  () => import('@/components/ai/AIAssistant')
);

export const LazyMediaManager = createLazyComponent(
  () => import('@/components/media/MediaManager').then(mod => ({ default: mod.MediaManager }))
);

export const LazyArticleEditor = createLazyComponent(
  () => import('@/components/cms/ArticleEditor').catch(() => ({
    default: () => createElement('div', {}, 'Article Editor not available')
  }))
);

// Intersection Observer hook for lazy loading content
export function useIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
) {
  const { useEffect, useRef } = require('react');
  
  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => observer.disconnect();
  }, [callback, options]);

  return targetRef;
}