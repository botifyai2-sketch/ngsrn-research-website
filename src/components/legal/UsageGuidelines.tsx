'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface UsageGuidelinesProps {
  className?: string;
  variant?: 'full' | 'compact' | 'inline';
  showContactInfo?: boolean;
}

export const UsageGuidelines: React.FC<UsageGuidelinesProps> = ({
  className,
  variant = 'compact',
  showContactInfo = true
}) => {
  const [isExpanded, setIsExpanded] = useState(variant === 'full');

  const toggleExpanded = () => {
    if (variant !== 'full') {
      setIsExpanded(!isExpanded);
    }
  };

  const baseClasses = "bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700";

  if (variant === 'inline') {
    return (
      <div className={cn("text-sm text-gray-600 dark:text-gray-400", className)}>
        <p>
          <strong>Usage:</strong> This content is for educational and policy purposes. 
          Permission required for reproduction or redistribution.{' '}
          {showContactInfo && (
            <a 
              href="/legal/contact" 
              className="text-blue-600 hover:text-blue-800 underline"
              aria-label="Contact for permissions"
            >
              Contact us
            </a>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Usage Guidelines
        </h3>
        {variant === 'compact' && (
          <button
            onClick={toggleExpanded}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse usage guidelines" : "Expand usage guidelines"}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {(isExpanded || variant === 'full') && (
        <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Permitted Uses
            </h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Educational purposes in academic institutions</li>
              <li>Policy research and analysis</li>
              <li>Non-commercial research activities</li>
              <li>Citation in academic papers with proper attribution</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Restrictions
            </h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Commercial use without written permission</li>
              <li>Redistribution or republication without authorization</li>
              <li>Modification of content without consent</li>
              <li>Use in ways that misrepresent NGSRN&apos;s positions</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-4 border-blue-400">
            <p className="text-blue-800 dark:text-blue-200">
              <strong>Important:</strong> Permission is required for reproduction, redistribution, 
              or any commercial use of this content.
            </p>
          </div>

          {showContactInfo && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm">
                For permissions or questions about usage, please{' '}
                <a 
                  href="/legal/contact" 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  contact our permissions team
                </a>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsageGuidelines;