/**
 * Accessibility Provider Component
 * Provides accessibility context and utilities throughout the app
 * WCAG 2.1 AA Compliance Provider
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { announceToScreenReader, prefersReducedMotion } from '@/lib/accessibility';

interface AccessibilityContextType {
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'larger';
  setFontSize: (size: 'normal' | 'large' | 'larger') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');

  useEffect(() => {
    // Check for reduced motion preference
    const checkReducedMotion = () => {
      setReducedMotion(prefersReducedMotion());
    };

    // Check for high contrast preference
    const checkHighContrast = () => {
      const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      setHighContrast(hasHighContrast);
    };

    // Initial checks
    checkReducedMotion();
    checkHighContrast();

    // Listen for changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    motionQuery.addEventListener('change', checkReducedMotion);
    contrastQuery.addEventListener('change', checkHighContrast);

    // Load saved font size preference
    const savedFontSize = localStorage.getItem('accessibility-font-size') as 'normal' | 'large' | 'larger';
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }

    return () => {
      motionQuery.removeEventListener('change', checkReducedMotion);
      contrastQuery.removeEventListener('change', checkHighContrast);
    };
  }, []);

  useEffect(() => {
    // Apply font size to document
    const root = document.documentElement;
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-larger');
    root.classList.add(`font-size-${fontSize}`);

    // Save preference
    localStorage.setItem('accessibility-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    // Apply reduced motion class
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  useEffect(() => {
    // Apply high contrast class
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  };

  const value: AccessibilityContextType = {
    announceMessage,
    reducedMotion,
    highContrast,
    fontSize,
    setFontSize,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}