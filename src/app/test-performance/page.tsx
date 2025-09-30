'use client';

import { useState, useEffect } from 'react';
import { OptimizedImage, imageSizes } from '@/components/ui/OptimizedImage';
import { LazyWrapper } from '@/components/ui/LazyWrapper';
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';
import { usePerformanceMonitor } from '@/lib/performance';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache';

export default function PerformanceTestPage() {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [imageLoadTimes, setImageLoadTimes] = useState<number[]>([]);
  const performance = usePerformanceMonitor();

  useEffect(() => {
    // Test cache functionality
    testCachePerformance();
  }, []);

  const testCachePerformance = async () => {
    const testData = { message: 'Hello, cache!', timestamp: Date.now() };
    
    // Test cache set/get performance
    const setTime = await performance.measureAsync('cache_set', async () => {
      await cache.set('test_key', testData, cacheTTL.short);
    });

    const getTime = await performance.measureAsync('cache_get', async () => {
      return await cache.get('test_key');
    });

    setCacheStats({
      setTime: setTime,
      getTime: getTime,
      data: await cache.get('test_key'),
    });
  };

  const handleImageLoad = () => {
    const loadTime = Date.now();
    performance.recordMetric('image_load', loadTime);
    setImageLoadTimes(prev => [...prev, loadTime]);
  };

  const testApiCaching = async () => {
    const start = Date.now();
    
    try {
      // First request (should be uncached)
      const response1 = await fetch('/api/articles?limit=5');
      const firstRequestTime = Date.now() - start;
      
      // Second request (should be cached)
      const start2 = Date.now();
      const response2 = await fetch('/api/articles?limit=5');
      const secondRequestTime = Date.now() - start2;
      
      console.log('API Cache Test Results:', {
        firstRequest: `${firstRequestTime}ms`,
        secondRequest: `${secondRequestTime}ms`,
        cacheHit: response2.headers.get('X-Cache') === 'HIT',
        improvement: `${((firstRequestTime - secondRequestTime) / firstRequestTime * 100).toFixed(1)}%`
      });
    } catch (error) {
      console.error('API cache test failed:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Performance Optimization Test</h1>
      
      {/* Image Optimization Test */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Image Optimization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Optimized Images</h3>
            <OptimizedImage
              src="https://picsum.photos/400/300?random=1"
              alt="Test image 1"
              width={400}
              height={300}
              sizes={imageSizes.card}
              onLoad={handleImageLoad}
              className="rounded-lg"
            />
            <OptimizedImage
              src="https://picsum.photos/400/300?random=2"
              alt="Test image 2"
              width={400}
              height={300}
              sizes={imageSizes.card}
              onLoad={handleImageLoad}
              className="rounded-lg"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Lazy Loaded Content</h3>
            <LazyWrapper>
              <OptimizedImage
                src="https://picsum.photos/400/300?random=3"
                alt="Lazy loaded image"
                width={400}
                height={300}
                sizes={imageSizes.card}
                className="rounded-lg"
              />
            </LazyWrapper>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Load Statistics</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm">Images loaded: {imageLoadTimes.length}</p>
              <p className="text-sm">
                Avg load time: {
                  imageLoadTimes.length > 0 
                    ? (imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length).toFixed(2)
                    : 0
                }ms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cache Performance Test */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Cache Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-medium mb-4">Cache Statistics</h3>
            {cacheStats ? (
              <div className="space-y-2 text-sm">
                <p>Set operation: {cacheStats.setTime}ms</p>
                <p>Get operation: {cacheStats.getTime}ms</p>
                <p>Data integrity: {cacheStats.data ? '✓' : '✗'}</p>
              </div>
            ) : (
              <p className="text-gray-500">Testing cache performance...</p>
            )}
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-medium mb-4">API Cache Test</h3>
            <button
              onClick={testApiCaching}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Test API Caching
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Check browser console for results
            </p>
          </div>
        </div>
      </section>

      {/* Lazy Loading Test */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Lazy Loading Test</h2>
        <div className="space-y-8">
          {Array.from({ length: 5 }, (_, i) => (
            <LazyWrapper key={i} className="h-64">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-lg flex items-center justify-center text-white text-xl font-semibold">
                Lazy Loaded Section {i + 1}
              </div>
            </LazyWrapper>
          ))}
        </div>
      </section>

      {/* Performance Monitoring */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Performance Monitoring</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Performance metrics are being collected in the background. 
            Click the "Show Performance" button in the bottom-right corner to view real-time metrics.
          </p>
        </div>
      </section>

      {/* Performance Dashboard */}
      <PerformanceDashboard />
    </div>
  );
}