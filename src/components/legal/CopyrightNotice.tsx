'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CopyrightNoticeProps {
  className?: string;
  variant?: 'footer' | 'inline' | 'article';
  showYear?: boolean;
}

export const CopyrightNotice: React.FC<CopyrightNoticeProps> = ({
  className,
  variant = 'footer',
  showYear = true
}) => {
  const currentYear = new Date().getFullYear();
  
  const baseClasses = "text-sm";
  const variantClasses = {
    footer: "text-gray-600 dark:text-gray-400",
    inline: "text-gray-700 dark:text-gray-300",
    article: "text-gray-600 dark:text-gray-400 border-t pt-4 mt-6"
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <p>
        © {showYear && `${currentYear} `}NextGen Sustainable Research Network (NGSRN). All rights reserved.
      </p>
      {variant === 'article' && (
        <p className="mt-2 text-xs">
          This content is protected by copyright. See our{' '}
          <a 
            href="/legal/usage-guidelines" 
            className="text-blue-600 hover:text-blue-800 underline"
            aria-label="View usage guidelines"
          >
            usage guidelines
          </a>{' '}
          for permitted uses.
        </p>
      )}
    </div>
  );
};

export default CopyrightNotice;