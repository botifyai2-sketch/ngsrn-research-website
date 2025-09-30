import React from 'react';
import { getPublishedArticles } from '@/lib/db/articles';
import { ArticleCard } from '@/components/articles';

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-ngsrn-blue mb-4">
              Research Articles
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
              Explore our comprehensive collection of policy-focused research 
              shaping sustainable futures for Africa
            </p>
            {articles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {articles.length} Published Article{articles.length !== 1 ? 's' : ''}
                </div>
                <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {articles.reduce((total, article) => total + article.readTime, 0)} Min Total Read Time
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard 
                key={article.id} 
                article={article}
                showSummary={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Articles Yet
              </h3>
              <p className="text-gray-500">
                Articles will appear here once they are published through the content management system.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export const metadata = {
  title: 'Research Articles | NGSRN',
  description: 'Explore comprehensive policy-focused research shaping sustainable futures for Africa',
};