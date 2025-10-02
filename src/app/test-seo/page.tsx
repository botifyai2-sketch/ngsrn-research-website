'use client';

import React from 'react';
import { SEOMetadataForm, SEOPreview } from '@/components/seo';
import { generateSlug, extractKeywords, validateSEO } from '@/lib/seo';

export default function TestSEOPage() {
  const [seoData, setSeoData] = React.useState({
    title: 'Test Article Title for SEO',
    description: 'This is a test description for SEO optimization. It should be between 120-160 characters to be optimal for search engines.',
    keywords: ['test', 'seo', 'optimization', 'nextjs'],
  });

  const testContent = `
    This is a sample article content for testing SEO functionality.
    It contains various keywords like research, Africa, sustainable development,
    policy, governance, and environmental sustainability. The content should
    be analyzed to extract relevant keywords automatically.
  `;

  const handleSEOSave = (newSeoData: any) => {
    setSeoData(newSeoData);
    console.log('SEO Data saved:', newSeoData);
  };

  // Test utility functions
  const testSlug = generateSlug('Test Article Title with Special Characters!@#$%');
  const testKeywords = extractKeywords(testContent, 5);
  const validation = validateSEO(seoData);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SEO Tools Test Page</h1>
          <p className="mt-2 text-gray-600">
            Test the SEO optimization tools and utilities.
          </p>
        </div>

        {/* Utility Functions Test */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Utility Functions Test</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Slug Generation:</h3>
              <p className="text-sm text-gray-600">Input: &quot;Test Article Title with Special Characters!@#$%&quot;</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">Output: {testSlug}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Keyword Extraction:</h3>
              <p className="text-sm text-gray-600">Extracted from test content:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {testKeywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">SEO Validation:</h3>
              <p className={`text-sm ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                Status: {validation.isValid ? 'Valid' : 'Issues found'}
              </p>
              {!validation.isValid && (
                <ul className="text-sm text-red-600 mt-1">
                  {validation.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* SEO Components Test */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SEOMetadataForm
              initialData={seoData}
              content={testContent}
              onSave={handleSEOSave}
            />
          </div>
          <div>
            <SEOPreview seoData={seoData} />
          </div>
        </div>

        {/* API Endpoints Test */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Endpoints</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Sitemap XML:</span>
              <a 
                href="/sitemap.xml" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                /sitemap.xml →
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Robots.txt:</span>
              <a 
                href="/robots.txt" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                /robots.txt →
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">SEO Management:</span>
              <a 
                href="/cms/seo" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                /cms/seo →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}