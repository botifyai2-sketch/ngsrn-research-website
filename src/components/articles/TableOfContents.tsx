'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  headings: Heading[];
  className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -35% 0%',
        threshold: 0
      }
    );

    // Observe all headings
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className={cn('bg-white border border-gray-200 rounded-lg p-3 md:p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="text-sm md:text-base font-semibold text-ngsrn-blue">Table of Contents</h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="lg:hidden p-1 hover:bg-gray-100 rounded"
          aria-label={isCollapsed ? 'Expand table of contents' : 'Collapse table of contents'}
        >
          <svg 
            className={cn('w-4 h-4 transition-transform', isCollapsed && 'rotate-180')}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Table of Contents List */}
      <ul className={cn(
        'space-y-1 transition-all duration-200',
        isCollapsed && 'lg:block hidden'
      )}>
        {headings.map(({ level, text, id }) => (
          <li key={id}>
            <button
              onClick={() => scrollToHeading(id)}
              className={cn(
                'block w-full text-left text-xs md:text-sm py-1 px-2 rounded transition-colors hover:bg-gray-100',
                {
                  'pl-2': level === 1,
                  'pl-4': level === 2,
                  'pl-6': level === 3,
                  'pl-8': level === 4,
                  'pl-10': level === 5,
                  'pl-12': level === 6,
                },
                activeId === id 
                  ? 'bg-ngsrn-blue/10 text-ngsrn-blue font-medium border-l-2 border-ngsrn-blue' 
                  : 'text-gray-700 hover:text-ngsrn-blue'
              )}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>

      {/* Progress Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Reading Progress</span>
          <span>{Math.round((headings.findIndex(h => h.id === activeId) + 1) / headings.length * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-ngsrn-green h-1 rounded-full transition-all duration-300"
            style={{ 
              width: `${(headings.findIndex(h => h.id === activeId) + 1) / headings.length * 100}%` 
            }}
          />
        </div>
      </div>
    </nav>
  );
}