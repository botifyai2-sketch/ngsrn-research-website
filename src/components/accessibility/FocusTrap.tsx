/**
 * Focus Trap Component
 * Traps keyboard focus within a container (useful for modals, dropdowns)
 * WCAG 2.1 AA Requirement: 2.1.2 No Keyboard Trap
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { trapFocus } from '@/lib/accessibility';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export function FocusTrap({ 
  children, 
  active = true, 
  restoreFocus = true,
  className = '' 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store the previously focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Set up focus trap
    const cleanup = trapFocus(containerRef.current);

    return () => {
      cleanup();
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}