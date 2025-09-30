'use client';

import React from 'react';
import Link from 'next/link';
import { ResearchDivision } from '@/types';
import { PAGE_ROUTES } from '@/lib/constants';

interface ResearchDivisionCardProps {
  division: ResearchDivision;
  articleCount?: number;
  showStats?: boolean;
}

const ResearchDivisionCard: React.FC<ResearchDivisionCardProps> = ({
  division,
  articleCount = 0,
  showStats = false,
}) => {
  const getIconComponent = (iconName: string) => {
    const iconProps = {
      className: "w-8 h-8",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
    };

    switch (iconName) {
      case 'users':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'trending-up':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
            <polyline points="17,6 23,6 23,12" />
          </svg>
        );
      case 'leaf':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.06.82C6.16 17.85 9.79 14.24 16 13c6.67-1.33 11-6.67 11-13C27 6.67 23.33 8 17 8z" />
            <path d="M5.5 8.5c0 0-2.5 2.5-2.5 6s2.5 6 2.5 6" />
          </svg>
        );
      case 'heart':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case 'lightbulb':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M9 21h6" />
            <path d="M12 17h0" />
            <path d="M12 3a6 6 0 0 1 6 6c0 3-2 5.5-2 8H8c0-2.5-2-5-2-8a6 6 0 0 1 6-6z" />
          </svg>
        );
      default:
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  return (
    <Link href={`${PAGE_ROUTES.research}/${division.id}`}>
      <div className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 overflow-hidden">
        {/* Header with icon and color accent */}
        <div 
          className="h-2"
          style={{ backgroundColor: division.color }}
        />
        
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start space-x-4 mb-4">
            <div 
              className="flex-shrink-0 p-3 rounded-lg text-white"
              style={{ backgroundColor: division.color }}
            >
              {getIconComponent(division.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                {division.name}
              </h3>
              {showStats && (
                <p className="text-sm text-gray-500 mt-1">
                  {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4 line-clamp-3">
            {division.description}
          </p>

          {/* SDG Alignment */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">SDG Alignment:</h4>
            <div className="flex flex-wrap gap-2">
              {division.sdgAlignment.map((sdg, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {sdg}
                </span>
              ))}
            </div>
          </div>

          {/* Hover indicator */}
          <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-800 transition-colors duration-200">
            <span className="text-sm font-medium">Explore research</span>
            <svg 
              className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResearchDivisionCard;