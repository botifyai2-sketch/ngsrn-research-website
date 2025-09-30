'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ResearchDivision } from '@/types';
import { PAGE_ROUTES } from '@/lib/constants';

interface ResearchDivisionNavigationProps {
  divisions: ResearchDivision[];
  currentDivisionId?: string;
}

const ResearchDivisionNavigation: React.FC<ResearchDivisionNavigationProps> = ({
  divisions,
  currentDivisionId,
}) => {
  const pathname = usePathname();

  const isActive = (divisionId: string) => {
    return currentDivisionId === divisionId || pathname === `${PAGE_ROUTES.research}/${divisionId}`;
  };

  const isResearchHome = pathname === PAGE_ROUTES.research;

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto py-4">
          {/* All Research Link */}
          <Link
            href={PAGE_ROUTES.research}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              isResearchHome
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            All Research
          </Link>

          {/* Division Links */}
          {divisions.map((division) => (
            <Link
              key={division.id}
              href={`${PAGE_ROUTES.research}/${division.id}`}
              className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive(division.id)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: division.color }}
                />
                <span className="whitespace-nowrap">{division.name}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ResearchDivisionNavigation;