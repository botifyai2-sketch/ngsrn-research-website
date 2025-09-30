/**
 * Skip Link Component
 * Provides keyboard users a way to skip to main content
 * WCAG 2.1 AA Requirement: 2.4.1 Bypass Blocks
 */

'use client';

import React from 'react';
import { focusVisible } from '@/lib/accessibility';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export function SkipLink({ href = '#main-content', children = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`
        absolute left-4 top-4 z-50 px-4 py-2 
        bg-blue-600 text-white font-medium rounded-md
        transform -translate-y-full opacity-0
        focus:translate-y-0 focus:opacity-100
        transition-all duration-200 ease-in-out
        ${focusVisible}
      `}
      onFocus={(e) => {
        // Ensure the skip link is visible when focused
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.opacity = '1';
      }}
      onBlur={(e) => {
        // Hide the skip link when focus is lost
        e.currentTarget.style.transform = 'translateY(-100%)';
        e.currentTarget.style.opacity = '0';
      }}
    >
      {children}
    </a>
  );
}