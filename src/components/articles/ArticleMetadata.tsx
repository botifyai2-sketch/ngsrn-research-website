'use client';

import React from 'react';
import Link from 'next/link';
import { ResearchDivision } from '@/types';
import { cn } from '@/lib/utils';

interface ArticleMetadataProps {
  authors: any[]; // Simplified for now to avoid type conflicts
  division: ResearchDivision;
  publishedAt: Date | null;
  readTime: number;
  tags: string[];
  className?: string;
}

export function ArticleMetadata({
  authors,
  division,
  publishedAt,
  readTime,
  tags,
  className
}: ArticleMetadataProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Draft';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className={cn('space-y-3 md:space-y-4', className)}>
      {/* Authors and Publication Info */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600">
        {/* Authors */}
        <div className="flex items-center gap-2">
          <span className="font-medium">By:</span>
          <div className="flex flex-wrap gap-1">
            {authors.map((author, index) => (
              <React.Fragment key={author.id}>
                <Link
                  href={`/leadership/${author.id}`}
                  className="text-ngsrn-blue hover:text-ngsrn-green transition-colors font-medium"
                >
                  {author.name}
                </Link>
                {index < authors.length - 1 && (
                  <span className="text-gray-400">
                    {index === authors.length - 2 ? ' and ' : ', '}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Divider */}
        <span className="hidden sm:inline text-gray-300">•</span>

        {/* Publication Date */}
        <div className="flex items-center gap-1 md:gap-2">
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(publishedAt)}</span>
        </div>

        {/* Divider */}
        <span className="hidden sm:inline text-gray-300">•</span>

        {/* Read Time */}
        <div className="flex items-center gap-1 md:gap-2">
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{readTime} min read</span>
        </div>
      </div>

      {/* Research Division */}
      <div className="flex items-center gap-3">
        <Link
          href={`/research/${division.id}`}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-ngsrn-blue/10 text-ngsrn-blue hover:bg-ngsrn-blue/20 transition-colors"
        >
          <div 
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: division.color }}
          />
          {division.name}
        </Link>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Tags:</span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Author Titles */}
      <div className="text-sm text-gray-600">
        {authors.map((author) => (
          <div key={author.id} className="flex items-center gap-2">
            <span className="font-medium">{author.name}</span>
            <span>-</span>
            <span>{author.title}</span>
            {author.researchDivisions?.length > 0 && (
              <>
                <span>•</span>
                <span className="text-ngsrn-blue">
                  {author.researchDivisions.map((div: any) => div.name).join(', ')}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}