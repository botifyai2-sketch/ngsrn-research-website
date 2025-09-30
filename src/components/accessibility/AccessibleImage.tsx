/**
 * Accessible Image Component
 * Ensures proper alt text and loading behavior
 * WCAG 2.1 AA Requirement: 1.1.1 Non-text Content
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { validateAltText } from '@/lib/accessibility';

interface AccessibleImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
  caption?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  fill?: boolean;
}

export function AccessibleImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  decorative = false,
  caption,
  loading = 'lazy',
  sizes,
  fill = false,
  ...props
}: AccessibleImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Validate and clean alt text
  const validatedAlt = decorative ? '' : validateAltText(alt, src);

  // Handle image load error
  const handleError = () => {
    setImageError(true);
    console.error(`Failed to load image: ${src}`);
  };

  // Handle image load success
  const handleLoad = () => {
    setImageLoaded(true);
  };

  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`}
        role="img"
        aria-label={decorative ? undefined : `Failed to load image: ${validatedAlt}`}
      >
        <div className="text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Image failed to load</p>
          {!decorative && <p className="text-xs mt-1">{validatedAlt}</p>}
        </div>
      </div>
    );
  }

  const imageElement = (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center"
          aria-hidden="true"
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      <Image
        src={src}
        alt={validatedAlt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        loading={loading}
        sizes={sizes}
        onError={handleError}
        onLoad={handleLoad}
        className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${fill ? 'object-cover' : ''}`}
        {...props}
      />
    </div>
  );

  // If there's a caption, wrap in figure element
  if (caption && !decorative) {
    return (
      <figure className="space-y-2">
        {imageElement}
        <figcaption className="text-sm text-gray-600 text-center">
          {caption}
        </figcaption>
      </figure>
    );
  }

  return imageElement;
}