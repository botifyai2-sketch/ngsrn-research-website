'use client';

import { ReactNode, Suspense, useState } from 'react';
import { useIntersectionObserver } from '@/lib/lazy-loading';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazyWrapper({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className,
}: LazyWrapperProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  const targetRef = useIntersectionObserver(
    () => setShouldLoad(true),
    { threshold, rootMargin }
  );

  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-pulse bg-gray-200 rounded h-32 w-full"></div>
    </div>
  );

  return (
    <div ref={targetRef} className={className}>
      {shouldLoad ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
}