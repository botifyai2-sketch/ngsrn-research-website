/**
 * Live Region Component
 * Announces dynamic content changes to screen readers
 * WCAG 2.1 AA Requirement: 4.1.3 Status Messages
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { screenReaderOnly } from '@/lib/accessibility';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
  className?: string;
}

export function LiveRegion({ 
  message, 
  priority = 'polite', 
  clearAfter = 5000,
  className = '' 
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!message || !regionRef.current) return;

    // Clear any existing timeout
    const timeoutId = setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = '';
      }
    }, clearAfter);

    return () => clearTimeout(timeoutId);
  }, [message, clearAfter]);

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className={`${screenReaderOnly} ${className}`}
    >
      {message}
    </div>
  );
}