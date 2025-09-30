import React from 'react';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getPublishedArticles } from '@/lib/db/articles';
import { ArticleReader } from '@/components/articles';
import { StructuredData } from '@/components/seo/StructuredData';
import { generateArticleSEO, generateMetadata as generateSEOMetadata, generateArticleStructuredData } from '@/lib/seo';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticleBySlug(params.slug);

  if (!article || article.status !== 'PUBLISHED') {
    notFound();
  }

  // Generate structured data for the article
  const transformedArticle = {
    ...article,
    tags: typeof article.tags === 'string' ? JSON.parse(article.tags || '[]') : article.tags,
    seoKeywords: typeof article.seoKeywords === 'string' ? JSON.parse(article.seoKeywords || '[]') : article.seoKeywords,
  };
  
  const transformedDivision = {
    ...article.division,
    sdgAlignment: typeof article.division.sdgAlignment === 'string' ? JSON.parse(article.division.sdgAlignment || '[]') : article.division.sdgAlignment,
  };
  
  const structuredData = generateArticleStructuredData(
    transformedArticle,
    transformedDivision,
    article.authors.map(a => a.author)
  );

  return (
    <>
      <StructuredData data={structuredData} />
      <ArticleReader 
        article={article}
        showTableOfContents={true}
        enableAIAssistant={true} // AI assistant is now implemented
      />
    </>
  );
}

// Generate static params for published articles
export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: 'Article Not Found | NGSRN',
    };
  }

  // Transform article and division for SEO function
  const transformedArticle = {
    ...article,
    tags: typeof article.tags === 'string' ? JSON.parse(article.tags || '[]') : article.tags,
    seoKeywords: typeof article.seoKeywords === 'string' ? JSON.parse(article.seoKeywords || '[]') : article.seoKeywords,
  };
  
  const transformedDivision = {
    ...article.division,
    sdgAlignment: typeof article.division.sdgAlignment === 'string' ? JSON.parse(article.division.sdgAlignment || '[]') : article.division.sdgAlignment,
  };

  // Generate SEO data using our utility functions
  const seoData = generateArticleSEO(
    transformedArticle,
    transformedDivision,
    article.authors.map(a => a.author)
  );

  return generateSEOMetadata(seoData);
}