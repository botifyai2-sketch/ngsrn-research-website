'use client';

import React from 'react';
import Link from 'next/link';
import { ArticleWithRelations } from '@/types';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: ArticleWithRelations;
  showSummary?: boolean;
  className?: string;
}

export function ArticleCard({ article, showSummary = true, className }: ArticleCardProps) {
  // Parse tags from JSON string
  const tags = typeof article.tags === 'string' 
    ? JSON.parse(article.tags) 
    : article.tags || [];

  // Transform authors from junction table structure
  const authors = article.authors.map(authorRelation => authorRelation.author);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Draft';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  return (
    <article className={cn(
      'bg-white border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow duration-200',
      className
    )}>
      {/* Article Header */}
      <div className="space-y-2 md:space-y-3">
        {/* Division Badge */}
        <div className="flex items-center justify-between">
          <Link
            href={`/research/${article.division.id}`}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ngsrn-blue/10 text-ngsrn-blue hover:bg-ngsrn-blue/20 transition-colors"
          >
            <div 
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: article.division.color }}
            />
            {article.division.name}
          </Link>
          
          {/* Read Time */}
          <span className="text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {article.readTime} min
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg md:text-xl font-semibold text-ngsrn-blue leading-tight">
          <Link 
            href={`/articles/${article.slug}`}
            className="hover:text-ngsrn-green transition-colors"
          >
            {article.title}
          </Link>
        </h3>

        {/* Authors and Date */}
        <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600">
          <span>By</span>
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
          <span className="text-gray-300">•</span>
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </div>

      {/* Summary */}
      {showSummary && article.summary && (
        <p className="mt-4 text-gray-700 leading-relaxed line-clamp-3">
          {article.summary}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/articles/${article.slug}`}
          className="inline-flex items-center text-sm font-medium text-ngsrn-blue hover:text-ngsrn-green transition-colors"
        >
          Read Article
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Download Link */}
        {article.downloadUrl && (
          <a
            href={article.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-gray-500 hover:text-ngsrn-blue transition-colors"
            title="Download PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </a>
        )}
      </div>
    </article>
  );
}