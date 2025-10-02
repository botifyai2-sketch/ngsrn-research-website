'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { ArticleWithRelations } from '@/types';
import { cn } from '@/lib/utils';
import { focusVisible } from '@/lib/accessibility';
import { AccessibleImage } from '@/components/accessibility/AccessibleImage';
import { ArticleMetadata } from './ArticleMetadata';
import { SocialShare } from './SocialShare';
import { TableOfContents } from './TableOfContents';
import CopyrightNotice from '@/components/legal/CopyrightNotice';
import UsageGuidelines from '@/components/legal/UsageGuidelines';

interface ArticleProps {
  article: ArticleWithRelations;
  showTableOfContents?: boolean;
  className?: string;
}

export function Article({ 
  article, 
  showTableOfContents = true,
  className 
}: ArticleProps) {
  // Parse tags from JSON string
  const tags = typeof article.tags === 'string' 
    ? JSON.parse(article.tags) 
    : article.tags || [];

  // Transform authors from junction table structure
  const authors = article.authors.map(authorRelation => ({
    ...authorRelation.author,
    researchDivisions: (authorRelation.author as any).researchDivisions?.map((dr: any) => dr.division) || []
  }));

  // Extract headings from content for table of contents
  const extractHeadings = (content: string) => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: { level: number; text: string; id: string }[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      headings.push({ level, text, id });
    }

    return headings;
  };

  const headings = extractHeadings(article.content);
  const shouldShowToc = showTableOfContents && headings.length > 2;

  // Custom components for ReactMarkdown
  const markdownComponents = {
    h1: ({ children, ...props }: any) => (
      <h1 className="text-3xl font-serif font-bold text-ngsrn-blue mt-8 mb-4 scroll-mt-20" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-2xl font-serif font-bold text-ngsrn-blue mt-8 mb-4 scroll-mt-20" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-xl font-serif font-bold text-ngsrn-blue mt-6 mb-3 scroll-mt-20" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-lg font-serif font-bold text-ngsrn-blue mt-6 mb-3 scroll-mt-20" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: any) => (
      <h5 className="text-base font-serif font-bold text-ngsrn-blue mt-4 mb-2 scroll-mt-20" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: any) => (
      <h6 className="text-sm font-serif font-bold text-ngsrn-blue mt-4 mb-2 scroll-mt-20" {...props}>
        {children}
      </h6>
    ),
    p: ({ children, ...props }: any) => (
      <p className="mb-4 text-gray-800 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    a: ({ children, href, ...props }: any) => (
      <a 
        href={href} 
        className={`text-ngsrn-green hover:text-ngsrn-blue transition-colors underline rounded-sm ${focusVisible}`}
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-ngsrn-green bg-gray-50 p-4 my-6 italic rounded-r-lg" {...props}>
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="mb-4 pl-6 list-disc" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="mb-4 pl-6 list-decimal" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="mb-2" {...props}>
        {children}
      </li>
    ),
    code: ({ children, className, ...props }: any) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: any) => (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6" {...props}>
        {children}
      </pre>
    ),
    img: ({ src, alt, ...props }: any) => (
      <img
        src={src}
        alt={alt}
        className="rounded-lg shadow-md my-6 max-w-full h-auto block"
        loading="lazy"
        {...props}
      />
    ),
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-gray-300" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }: any) => (
      <th className="border border-gray-300 px-4 py-2 text-left bg-gray-50 font-semibold" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border border-gray-300 px-4 py-2 text-left" {...props}>
        {children}
      </td>
    ),
  };

  return (
    <article className={cn('max-w-4xl mx-auto px-4 sm:px-6 lg:px-8', className)}>
      {/* Article Header */}
      <header className="mb-6 md:mb-8 space-y-4 md:space-y-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-ngsrn-blue leading-tight">
          {article.title}
        </h1>
        
        <ArticleMetadata 
          authors={authors}
          division={{
            ...article.division,
            sdgAlignment: typeof article.division.sdgAlignment === 'string' 
              ? JSON.parse(article.division.sdgAlignment) 
              : article.division.sdgAlignment
          }}
          publishedAt={article.publishedAt}
          readTime={article.readTime}
          tags={tags}
        />

        {article.summary && (
          <div className="bg-gray-50 border-l-4 border-ngsrn-green p-4 md:p-6 rounded-r-lg">
            <h2 className="text-base md:text-lg font-semibold text-ngsrn-blue mb-2">Summary</h2>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">{article.summary}</p>
          </div>
        )}

        <SocialShare 
          title={article.title}
          url={`/articles/${article.slug}`}
          summary={article.summary}
        />
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Table of Contents - Desktop Sidebar */}
        {shouldShowToc && (
          <aside className="lg:w-64 lg:flex-shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-8">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        )}

        {/* Article Content */}
        <div className="flex-1 min-w-0 order-1 lg:order-2">
          <div className="article-content prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeHighlight,
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: 'wrap' }]
              ]}
              components={markdownComponents}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Download Link */}
          {article.downloadUrl && (
            <div className="mt-8 p-4 bg-ngsrn-blue/5 border border-ngsrn-blue/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-ngsrn-blue">Download Full Article</h3>
                  <p className="text-sm text-gray-600">Access the complete research document</p>
                </div>
                <a
                  href={article.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center px-4 py-2 bg-ngsrn-blue text-white rounded-md hover:bg-ngsrn-blue/90 transition-colors min-h-[44px] ${focusVisible}`}
                  aria-label="Download full article as PDF (opens in new tab)"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              </div>
            </div>
          )}

          {/* Usage Guidelines */}
          <div className="mt-8">
            <UsageGuidelines variant="compact" />
          </div>

          {/* Copyright Notice */}
          <div className="mt-6">
            <CopyrightNotice variant="article" />
          </div>
        </div>
      </div>
    </article>
  );
}