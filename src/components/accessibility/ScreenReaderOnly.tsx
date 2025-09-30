/**
 * Screen Reader Only Component
 * Hides content visually but keeps it available to screen readers
 * WCAG 2.1 AA Requirement: 1.3.1 Info and Relationships
 */

import React from 'react';
import { screenReaderOnly } from '@/lib/accessibility';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export function ScreenReaderOnly({ 
  children, 
  as: Component = 'span',
  className = '' 
}: ScreenReaderOnlyProps) {
  return (
    <Component className={`${screenReaderOnly} ${className}`}>
      {children}
    </Component>
  );
}