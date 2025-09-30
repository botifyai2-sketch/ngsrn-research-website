'use client';

import React from 'react';
import { ResearchDivision } from '@/types';

interface ResearchDivisionHeaderProps {
  division: ResearchDivision;
  articleCount?: number;
  authorCount?: number;
}

const ResearchDivisionHeader: React.FC<ResearchDivisionHeaderProps> = ({
  division,
  articleCount = 0,
  authorCount = 0,
}) => {
  const getIconComponent = (iconName: string) => {
    const iconProps = {
      className: "w-12 h-12",
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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-start space-x-6">
          {/* Icon */}
          <div 
            className="flex-shrink-0 p-4 rounded-xl text-white"
            style={{ backgroundColor: division.color }}
          >
            {getIconComponent(division.icon)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {division.name}
            </h1>
            
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">
              {division.description}
            </p>

            {/* Stats */}
            <div className="flex items-center space-x-8 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {articleCount} {articleCount === 1 ? 'Article' : 'Articles'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {authorCount} {authorCount === 1 ? 'Researcher' : 'Researchers'}
                </span>
              </div>
            </div>

            {/* SDG Alignment */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                UN Sustainable Development Goals Alignment:
              </h3>
              <div className="flex flex-wrap gap-2">
                {division.sdgAlignment.map((sdg, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {sdg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchDivisionHeader;