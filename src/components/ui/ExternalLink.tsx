'use client';

import React from 'react';
import Link from 'next/link';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  openInNewTab?: boolean;
  ariaLabel?: string;
  title?: string;
}

const ExternalLink: React.FC<ExternalLinkProps> = ({
  href,
  children,
  className = '',
  showIcon = true,
  openInNewTab = true,
  ariaLabel,
  title
}) => {
  // Check if the link is external
  const isExternal = href.startsWith('http') || href.startsWith('//');
  
  // Check if it's a mailto or tel link
  const isMailto = href.startsWith('mailto:');
  const isTel = href.startsWith('tel:');
  
  // Determine if we should open in new tab
  const shouldOpenInNewTab = openInNewTab && (isExternal || isMailto);
  
  // Base props for the link
  const linkProps = {
    className: `inline-flex items-center gap-1 ${className}`,
    'aria-label': ariaLabel,
    title: title
  };

  // External link props
  const externalProps = shouldOpenInNewTab ? {
    target: '_blank',
    rel: 'noopener noreferrer'
  } : {};

  // Icon component
  const ExternalIcon = () => (
    showIcon && isExternal && !isMailto && !isTel ? (
      <svg 
        className="w-3 h-3 ml-1 flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
        />
      </svg>
    ) : null
  );

  // Email icon
  const EmailIcon = () => (
    showIcon && isMailto ? (
      <svg 
        className="w-3 h-3 ml-1 flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
        />
      </svg>
    ) : null
  );

  // Phone icon
  const PhoneIcon = () => (
    showIcon && isTel ? (
      <svg 
        className="w-3 h-3 ml-1 flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
        />
      </svg>
    ) : null
  );

  // If it's an external link, use a regular anchor tag
  if (isExternal || isMailto || isTel) {
    return (
      <a
        href={href}
        {...linkProps}
        {...externalProps}
      >
        {children}
        <ExternalIcon />
        <EmailIcon />
        <PhoneIcon />
      </a>
    );
  }

  // For internal links, use Next.js Link
  return (
    <Link
      href={href}
      {...linkProps}
    >
      {children}
    </Link>
  );
};

export default ExternalLink;